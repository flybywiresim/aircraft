// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DebounceTimer, EventBus } from '@microsoft/msfs-sdk';
import { GsxSimVarEvents } from 'extras-host/modules/common/GsxSimVarPublisher';

export class GsxSync {
  private readonly sub = this.bus.getSubscriber<GsxSimVarEvents>();

  private readonly DEFUEL_DIFF_TARGET = 5000;

  private cargoFwdToggled = false;

  private cargoAftToggled = false;

  private readonly toggleCargo1 = ConsumerSubject.create(null, 0);

  private readonly toggleCargo2 = ConsumerSubject.create(null, 0);

  private readonly stateBoard = ConsumerSubject.create(null, 1);

  private readonly stateDeboard = ConsumerSubject.create(null, 1);

  private readonly cargoPercentBoard = ConsumerSubject.create(null, 0);

  private readonly cargoPercentDeboard = ConsumerSubject.create(null, 0);

  private readonly cargoTimer = new DebounceTimer();

  private isDefuel = false;

  private readonly defuelTimer = new DebounceTimer();

  private readonly rateTimer = new DebounceTimer();

  private desiredFuel = 0;

  private readonly fuelHose = ConsumerSubject.create(null, 0);

  private readonly refuelStarted = ConsumerSubject.create(null, false);

  constructor(private readonly bus: EventBus) {}

  public connectedCallback(): void {
    this.toggleCargo1.setConsumer(this.sub.on('gsx_aircraft_cargo_1_toggle'));
    this.toggleCargo2.setConsumer(this.sub.on('gsx_aircraft_cargo_2_toggle'));
    this.stateBoard.setConsumer(this.sub.on('gsx_boarding_state'));
    this.stateDeboard.setConsumer(this.sub.on('gsx_deboarding_state'));
    this.cargoPercentBoard.setConsumer(this.sub.on('gsx_boarding_cargo_percent'));
    this.cargoPercentDeboard.setConsumer(this.sub.on('gsx_deboarding_cargo_percent'));
    this.fuelHose.setConsumer(this.sub.on('gsx_fuelhose_connected'));
    this.refuelStarted.setConsumer(this.sub.on('a32nx_refuel_started_by_user'));

    this.toggleCargo1.sub(this.onToggleCargo1.bind(this));
    this.toggleCargo2.sub(this.onToggleCargo2.bind(this));
    this.fuelHose.sub(this.onFuelHoseConnected.bind(this));
    this.refuelStarted.sub(this.onRefuelStarted.bind(this));
    this.stateBoard.sub(this.onBoardingCompleted.bind(this));
    this.stateDeboard.sub(this.onBoardingCompleted.bind(this));
    this.cargoPercentBoard.sub(this.onCargoBoardCompleted.bind(this));
    this.cargoPercentDeboard.sub(this.onCargoDeboardCompleted.bind(this));
  }

  private isCargoOpen(): boolean {
    return SimVar.GetSimVarValueFast('A:INTERACTIVE POINT GOAL:16', 'percent over 100') != 0;
  }

  private toggleCargo(): void {
    if (!this.isCargoOpen()) {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', 'percent over 100', 1);
    } else {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', 'percent over 100', 0);
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
        SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', 'percent over 100', 0);
      }, delay);
    }
  }

  private onBoardingCompleted(state: number): void {
    if (state == 6 && this.isCargoOpen()) {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', 'percent over 100', 0);
    }
  }

  private onFuelHoseConnected(hose: number): void {
    if (hose != 0 && this.desiredFuel == 0) {
      this.desiredFuel = SimVar.GetSimVarValueFast('L:A32NX_FUEL_DESIRED', 'kilograms');
    }

    if (hose != 0 && !SimVar.GetSimVarValueFast('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool')) {
      this.isDefuel = SimVar.GetSimVarValueFast('A:FUEL TOTAL QUANTITY WEIGHT', 'kilograms') > this.desiredFuel;
      if (this.isDefuel) {
        if (this.desiredFuel >= this.DEFUEL_DIFF_TARGET) {
          SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', this.desiredFuel - this.DEFUEL_DIFF_TARGET);
        } else {
          SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', 0);
        }
      }
      SimVar.SetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool', true);
    }
  }

  private onRefuelStarted(refuel: boolean): void {
    if (!refuel && this.fuelHose.get() == 1 && this.isDefuel) {
      SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', this.desiredFuel);
      const refuelRate = SimVar.GetGameVarValueFast('L:A32NX_EFB_REFUEL_RATE_SETTING', 'number');
      SimVar.SetSimVarValue('L:A32NX_EFB_REFUEL_RATE_SETTING', 'number', 2);

      this.defuelTimer.schedule(() => {
        SimVar.SetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool', true);
        this.isDefuel = false;
        this.desiredFuel = 0;
      }, 7500);

      this.rateTimer.schedule(() => {
        SimVar.SetSimVarValue('L:A32NX_EFB_REFUEL_RATE_SETTING', 'number', refuelRate);
      }, 10000);
    }
  }
}
