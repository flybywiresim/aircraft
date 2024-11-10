// Copyright (c) 2021-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DebounceTimer, EventBus } from '@microsoft/msfs-sdk';
import { GsxSimVarEvents } from 'extras-host/modules/common/GsxSimVarPublisher';

export class GsxSync {
  private readonly sub = this.bus.getSubscriber<GsxSimVarEvents>();

  private readonly DEFUEL_DIFF_TARGET = 500;

  private isDefuel = false;

  private readonly defuelTimer = new DebounceTimer();

  private readonly rateTimer = new DebounceTimer();

  private desiredFuel = 0;

  private readonly fuelHose = ConsumerSubject.create(null, 0);

  private readonly refuelStarted = ConsumerSubject.create(null, false);

  constructor(private readonly bus: EventBus) {}

  public connectedCallback(): void {
    this.fuelHose.setConsumer(this.sub.on('gsx_fuelhose_connected'));
    this.refuelStarted.setConsumer(this.sub.on('a32nx_refuel_started_by_user'));

    this.fuelHose.sub(this.onFuelHoseConnected.bind(this));
    this.refuelStarted.sub(this.onRefuelStarted.bind(this));
  }

  private onFuelHoseConnected(hose: number): void {
    if (hose != 0 && this.desiredFuel == 0) {
      this.desiredFuel = SimVar.GetSimVarValueFast('L:A32NX_FUEL_LEFT_MAIN_DESIRED', 'number');
    }
    if (hose != 0 && !SimVar.GetSimVarValueFast('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool')) {
      this.isDefuel =
        SimVar.GetSimVarValueFast('A:FUEL TOTAL QUANTITY WEIGHT', 'kilograms') >
        SimVar.GetSimVarValueFast('L:A32NX_FUEL_DESIRED', 'kilograms');
      if (this.isDefuel) {
        SimVar.SetSimVarValue('L:A32NX_FUEL_LEFT_MAIN_DESIRED', 'number', this.desiredFuel - this.DEFUEL_DIFF_TARGET);
      }
      SimVar.SetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool', true);
    }
  }

  private onRefuelStarted(refuel: boolean): void {
    if (!refuel && this.fuelHose.get() == 1 && this.isDefuel) {
      SimVar.SetSimVarValue('L:A32NX_FUEL_LEFT_MAIN_DESIRED', 'number', this.desiredFuel);
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
