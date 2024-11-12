// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DebounceTimer, EventBus, SimVarValueType } from '@microsoft/msfs-sdk';
import { ExtrasSimVarEvents, GsxSimVarEvents, NXDataStore } from '@flybywiresim/fbw-sdk';

export class GsxSync {
  private readonly sub = this.bus.getSubscriber<ExtrasSimVarEvents & GsxSimVarEvents>();

  private readonly DEFUEL_DIFF_TARGET = 125;

  private readonly numberOfGPUs = 1;

  private readonly ExtPowerAvailStates = new Map<number, ConsumerSubject<boolean>>();

  private readonly stateJetway = ConsumerSubject.create(null, 1);

  private readonly stateBoard = ConsumerSubject.create(null, 1);

  private readonly stateDeparture = ConsumerSubject.create(null, 1);

  private readonly stateGpu = ConsumerSubject.create(null, 1);

  private isDefuel = false;

  private readonly defuelTimer = new DebounceTimer();

  private readonly rateTimer = new DebounceTimer();

  private desiredFuel = 0;

  private readonly fuelHose = ConsumerSubject.create(null, 0);

  private readonly refuelStarted = ConsumerSubject.create(null, false);

  constructor(private readonly bus: EventBus) {
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      const element = ConsumerSubject.create(this.sub.on(`ext_power_available_${index}`), false);
      this.ExtPowerAvailStates.set(index, element);
    }
  }

  public connectedCallback(): void {
    this.stateJetway.setConsumer(this.sub.on('gsx_jetway_state'));
    this.stateBoard.setConsumer(this.sub.on('gsx_boarding_state'));
    this.stateDeparture.setConsumer(this.sub.on('gsx_departure_state'));
    this.stateGpu.setConsumer(this.sub.on('gsx_gpu_state'));
    this.fuelHose.setConsumer(this.sub.on('gsx_fuelhose_connected'));
    this.refuelStarted.setConsumer(this.sub.on('a32nx_refuel_started_by_user'));

    this.fuelHose.sub(this.onFuelHoseConnected.bind(this));
    this.refuelStarted.sub(this.onRefuelStarted.bind(this));

    this.stateBoard.sub(this.evaluateGsxPowerSource.bind(this));
    this.stateJetway.sub(this.evaluateGsxPowerSource.bind(this));
    this.stateGpu.sub(this.evaluateGsxPowerSource.bind(this));
    this.stateDeparture.sub(this.evaluateGsxPowerSource.bind(this));
  }

  private onFuelHoseConnected(hose: number): void {
    if (NXDataStore.get('GSX_FUEL_SYNC', '0') != '1') {
      return;
    }

    if (hose != 0 && this.desiredFuel == 0) {
      this.desiredFuel = SimVar.GetSimVarValueFast('L:A32NX_FUEL_LEFT_MAIN_DESIRED', SimVarValueType.Number);
    }
    if (hose != 0 && !this.refuelStarted.get()) {
      this.isDefuel =
        SimVar.GetSimVarValueFast('A:FUEL TOTAL QUANTITY WEIGHT', 'kilograms') >
        SimVar.GetSimVarValueFast('L:A32NX_FUEL_DESIRED', 'kilograms');
      if (this.isDefuel) {
        if (this.desiredFuel >= this.DEFUEL_DIFF_TARGET) {
          SimVar.SetSimVarValue(
            'L:A32NX_FUEL_LEFT_MAIN_DESIRED',
            SimVarValueType.Number,
            this.desiredFuel - this.DEFUEL_DIFF_TARGET,
          );
          SimVar.SetSimVarValue(
            'L:A32NX_FUEL_RIGHT_MAIN_DESIRED',
            SimVarValueType.Number,
            this.desiredFuel - this.DEFUEL_DIFF_TARGET,
          );
        } else {
          SimVar.SetSimVarValue('L:A32NX_FUEL_LEFT_MAIN_DESIRED', SimVarValueType.Number, 0);
          SimVar.SetSimVarValue('L:A32NX_FUEL_RIGHT_MAIN_DESIRED', SimVarValueType.Number, 0);
        }
      }
      SimVar.SetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', SimVarValueType.Bool, true);
    }
  }

  private onRefuelStarted(refuel: boolean): void {
    if (NXDataStore.get('GSX_FUEL_SYNC', '0') != '1') {
      return;
    }

    if (!refuel && this.fuelHose.get() == 1 && this.isDefuel) {
      SimVar.SetSimVarValue('L:A32NX_FUEL_LEFT_MAIN_DESIRED', SimVarValueType.Number, this.desiredFuel);
      SimVar.SetSimVarValue('L:A32NX_FUEL_RIGHT_MAIN_DESIRED', SimVarValueType.Number, this.desiredFuel);
      const refuelRate = SimVar.GetSimVarValueFast('L:A32NX_EFB_REFUEL_RATE_SETTING', SimVarValueType.Number);
      SimVar.SetSimVarValue('L:A32NX_EFB_REFUEL_RATE_SETTING', SimVarValueType.Number, 2);

      this.defuelTimer.schedule(() => {
        SimVar.SetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', SimVarValueType.Bool, true);
        this.isDefuel = false;
        this.desiredFuel = 0;
      }, 7500);

      this.rateTimer.schedule(() => {
        SimVar.SetSimVarValue('L:A32NX_EFB_REFUEL_RATE_SETTING', SimVarValueType.Number, refuelRate);
      }, 10000);
    }
  }

  private evaluateGsxPowerSource(): void {
    if (NXDataStore.get('GSX_POWER_SYNC', '0') != '1') {
      return;
    }

    const extAvail = this.isExtPowerAvail();
    const jetwayState = this.stateJetway.get();
    let action = -1;

    if (extAvail) {
      if (this.stateBoard.get() != 4 && this.stateBoard.get() != 5 && this.stateDeparture.get() >= 4) {
        action = 0;
      } else if (this.stateDeparture.get() == 5) {
        action = 0;
      } else if (jetwayState >= 1 && jetwayState <= 4 && this.stateGpu.get() != 5) {
        action = 0;
      }
    } else {
      if ((jetwayState == 5 || this.stateGpu.get() == 5) && this.stateDeparture.get() < 4) {
        action = 1;
      }
    }

    if (action == 1) {
      this.setExtPower(true);
    } else if (action == 0) {
      this.setExtPower(false);
    }
  }

  private isExtPowerAvail(): boolean {
    let state = false;
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      state ||= this.ExtPowerAvailStates.get(index).get();
    }
    return state;
  }

  private setExtPower(connect: boolean): void {
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      SimVar.SetSimVarValue(`L:A32NX_EXT_PWR_AVAIL:${index}`, SimVarValueType.Bool, connect);
      console.log('Setting External Power');
      if (!connect) {
        SimVar.SetSimVarValue(`L:A32NX_OVHD_ELEC_EXT_PWR_PB_IS_ON`, SimVarValueType.Bool, false);
      }
    }
  }
}
