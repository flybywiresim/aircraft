// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';
import { GsxSimVarEvents } from 'extras-host/modules/common/GsxSimVarPublisher';

export class GsxSync {
  private readonly sub = this.bus.getSubscriber<GsxSimVarEvents>();

  private readonly toggleCargo1 = ConsumerSubject.create(null, 0);

  private readonly toggleCargo2 = ConsumerSubject.create(null, 0);

  private readonly fuelHose = ConsumerSubject.create(null, 0);

  constructor(private readonly bus: EventBus) {}

  public connectedCallback(): void {
    this.toggleCargo1.setConsumer(this.sub.on('gsx_aircraft_cargo_1_toggle'));
    this.toggleCargo2.setConsumer(this.sub.on('gsx_aircraft_cargo_2_toggle'));
    this.fuelHose.setConsumer(this.sub.on('gsx_fuelhose_connected'));

    this.toggleCargo1.sub(this.onToggleCargo.bind(this));
    this.toggleCargo2.sub(this.onToggleCargo.bind(this));
    this.fuelHose.sub(this.onFuelHoseConnected.bind(this));
  }

  private isCargoOpen(): boolean {
    return SimVar.GetSimVarValue('A:INTERACTIVE POINT GOAL:16', 'percent over 100') != 0;
  }

  private onToggleCargo(toggle: number): void {
    if (toggle != 0 && !this.isCargoOpen()) {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', 'percent over 100', 1);
    } else if (toggle != 0 && this.isCargoOpen()) {
      SimVar.SetSimVarValue('A:INTERACTIVE POINT GOAL:16', 'percent over 100', 0);
    }
  }

  private onFuelHoseConnected(hose: number): void {
    if (hose != 0 && !SimVar.GetSimVarValue('A32NX_REFUEL_STARTED_BY_USR', 'Bool')) {
      SimVar.SetSimVarValue('A32NX_REFUEL_STARTED_BY_USR', 'Bool', true);
    }
  }
}
