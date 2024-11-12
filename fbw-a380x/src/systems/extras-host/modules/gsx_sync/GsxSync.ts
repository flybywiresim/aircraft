// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DebounceTimer, EventBus, SimVarValueType } from '@microsoft/msfs-sdk';
import { ExtrasSimVarEvents, GsxSimVarEvents, NXDataStore } from '@flybywiresim/fbw-sdk';

export class GsxSync {
  private readonly sub = this.bus.getSubscriber<ExtrasSimVarEvents & GsxSimVarEvents>();

  private readonly DEFUEL_DIFF_TARGET = 5000;

  private readonly numberOfGPUs = 4;

  private readonly ExtPowerAvailStates = new Map<number, ConsumerSubject<boolean>>();

  private cargoFwdToggled = false;

  private cargoAftToggled = false;

  private readonly toggleCargo1 = ConsumerSubject.create(null, 0);

  private readonly toggleCargo2 = ConsumerSubject.create(null, 0);

  private readonly stateJetway = ConsumerSubject.create(null, 1);

  private readonly stateBoard = ConsumerSubject.create(null, 1);

  private readonly stateDeboard = ConsumerSubject.create(null, 1);

  private readonly stateDeparture = ConsumerSubject.create(null, 1);

  private readonly stateGpu = ConsumerSubject.create(null, 1);

  private readonly cargoPercentBoard = ConsumerSubject.create(null, 0);

  private readonly cargoPercentDeboard = ConsumerSubject.create(null, 0);

  private readonly cargoTimer = new DebounceTimer();

  private isDefuel = false;

  private readonly defuelTimer = new DebounceTimer();

  private readonly rateTimer = new DebounceTimer();

  private desiredFuel = 0;

  private readonly fuelHose = ConsumerSubject.create(null, 0);

  private readonly refuelStarted = ConsumerSubject.create(null, false);

  private readonly cargoDoorTarget = ConsumerSubject.create(null, 0);

  constructor(private readonly bus: EventBus) {
    for (let index = 1; index <= this.numberOfGPUs; index++) {
      const element = ConsumerSubject.create(this.sub.on(`ext_power_available_${index}`), false);
      this.ExtPowerAvailStates.set(index, element);
    }
  }

  public connectedCallback(): void {
    this.toggleCargo1.setConsumer(this.sub.on('gsx_aircraft_cargo_1_toggle'));
    this.toggleCargo2.setConsumer(this.sub.on('gsx_aircraft_cargo_2_toggle'));
    this.stateJetway.setConsumer(this.sub.on('gsx_jetway_state'));
    this.stateBoard.setConsumer(this.sub.on('gsx_boarding_state'));
    this.stateDeboard.setConsumer(this.sub.on('gsx_deboarding_state'));
    this.stateDeparture.setConsumer(this.sub.on('gsx_departure_state'));
    this.stateGpu.setConsumer(this.sub.on('gsx_gpu_state'));
    this.cargoPercentBoard.setConsumer(this.sub.on('gsx_boarding_cargo_percent'));
    this.cargoPercentDeboard.setConsumer(this.sub.on('gsx_deboarding_cargo_percent'));
    this.fuelHose.setConsumer(this.sub.on('gsx_fuelhose_connected'));
    this.refuelStarted.setConsumer(this.sub.on('a32nx_refuel_started_by_user'));
    this.cargoDoorTarget.setConsumer(this.sub.on('a38nx_cargo_door_target'));

    if (NXDataStore.get('GSX_FUEL_SYNC', '0') == '1') {
      this.fuelHose.sub(this.onFuelHoseConnected.bind(this));
      this.refuelStarted.sub(this.onRefuelStarted.bind(this));
    }

    this.toggleCargo1.sub(this.onToggleCargo1.bind(this));
    this.toggleCargo2.sub(this.onToggleCargo2.bind(this));
    this.stateBoard.sub(this.onBoardingCompleted.bind(this));
    this.stateDeboard.sub(this.onBoardingCompleted.bind(this));
    this.cargoPercentBoard.sub(this.onCargoBoardCompleted.bind(this));
    this.cargoPercentDeboard.sub(this.onCargoDeboardCompleted.bind(this));

    if (NXDataStore.get('GSX_POWER_SYNC', '0') == '1') {
      this.stateBoard.sub(this.evaluateGsxPowerSource.bind(this));
      this.stateJetway.sub(this.evaluateGsxPowerSource.bind(this));
      this.stateGpu.sub(this.evaluateGsxPowerSource.bind(this));
      this.stateDeparture.sub(this.evaluateGsxPowerSource.bind(this));
    }
  }

  private isCargoOpen(): boolean {
    return this.cargoDoorTarget.get() != 0;
  }

  private toggleCargo(): void {
    if (!this.isCargoOpen()) {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', SimVarValueType.PercentOver100, 1);
    } else {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', SimVarValueType.PercentOver100, 0);
    }
    this.cargoFwdToggled = false;
    this.cargoAftToggled = false;
  }

  private onToggleCargo1(toggle: number): void {
    if (toggle != 0) {
      this.cargoFwdToggled = true;
    }

    if (toggle != 0 && this.cargoFwdToggled && this.cargoAftToggled) {
      this.toggleCargo();
    }
  }

  private onToggleCargo2(toggle: number): void {
    if (toggle != 0) {
      this.cargoAftToggled = true;
    }

    if (toggle != 0 && this.cargoFwdToggled && this.cargoAftToggled) {
      this.toggleCargo();
    }
  }

  private onCargoBoardCompleted(percent: number): void {
    this.startCargoTimer(percent, 60000);
  }

  private onCargoDeboardCompleted(percent: number): void {
    this.startCargoTimer(percent, 30000);
  }

  private startCargoTimer(percent: number, delay: number): void {
    if (percent == 100 && !this.cargoTimer.isPending() && this.isCargoOpen()) {
      this.defuelTimer.schedule(() => {
        SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', SimVarValueType.PercentOver100, 0);
      }, delay);
    }
  }

  private onBoardingCompleted(state: number): void {
    if (state == 6 && this.isCargoOpen()) {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', SimVarValueType.PercentOver100, 0);
    }
  }

  private onFuelHoseConnected(hose: number): void {
    if (hose != 0 && this.desiredFuel == 0) {
      this.desiredFuel = SimVar.GetSimVarValueFast('L:A32NX_FUEL_DESIRED', 'kilograms');
    }

    if (hose != 0 && !this.refuelStarted.get()) {
      this.isDefuel = SimVar.GetSimVarValueFast('A:FUEL TOTAL QUANTITY WEIGHT', 'kilograms') > this.desiredFuel;
      if (this.isDefuel) {
        if (this.desiredFuel >= this.DEFUEL_DIFF_TARGET) {
          SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', this.desiredFuel - this.DEFUEL_DIFF_TARGET);
        } else {
          SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', 0);
        }
      }
      SimVar.SetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', SimVarValueType.Bool, true);
    }
  }

  private onRefuelStarted(refuel: boolean): void {
    if (!refuel && this.fuelHose.get() == 1 && this.isDefuel) {
      SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', this.desiredFuel);
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
      if (!connect) {
        SimVar.SetSimVarValue(`L:A32NX_OVHD_ELEC_EXT_PWR_${index}_PB_IS_ON`, SimVarValueType.Bool, false);
      }
    }
  }
}
