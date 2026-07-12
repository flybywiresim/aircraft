// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, EventBus, MappedSubject } from '@microsoft/msfs-sdk';
import { ResetPanelSimvars } from '../../shared/src/publishers/ResetPanelPublisher';
import { A380XElectricalSystemEvents } from '@shared/publishers/A380XElectricalSystemPublisher';
import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
export class PseudoOans {
  private static readonly oansFailedRegisteredVar = RegisteredSimVar.createBoolean('L:A380X_OANS_FAILED');
  private readonly sub = this.bus.getSubscriber<ResetPanelSimvars & A380XElectricalSystemEvents>();
  private readonly oansResetPulled = ConsumerSubject.create(this.sub.on('a380x_reset_panel_arpt_nav'), false);
  private readonly ac4BusPowered = ConsumerSubject.create(this.sub.on('ac_bus_4_powered'), false);
  private readonly dc1BusPowered = ConsumerSubject.create(this.sub.on('dc_bus_1_powered'), false);
  private readonly oansDisabled = MappedSubject.create(
    ([ac4, dc1, reset]) => reset || !ac4 || !dc1,
    this.ac4BusPowered,
    this.dc1BusPowered,
    this.oansResetPulled,
  );

  constructor(private readonly bus: EventBus) {
    this.oansDisabled.sub((disabled) => {
      PseudoOans.oansFailedRegisteredVar.set(disabled);
    }, true);
    // TODO move parameter acquisition here (on ground, fms landing runway etc.) and publish to CDS/OANC.
  }
}
