// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { AbstractSubscribable, EventBus, Instrument, SimVarValueType, Subscribable } from '@microsoft/msfs-sdk';
import { A32NXElectricalSystemEvents } from '../publishers/A32NXElectricalSystemPublisher';

export enum UpstreamBus {
  Ac1 = 'a32nx_elec_ac_1_bus_is_powered',
  Ac2 = 'a32nx_elec_ac_2_bus_is_powered',
  AcEss = 'a32nx_elec_ac_ess_bus_is_powered',
  AcEssShed = 'a32nx_elec_ac_ess_shed_bus_is_powered',
  AcStatInv = 'a32nx_elec_ac_stat_inv_bus_is_powered',
  AcGndFltSvc = 'a32nx_elec_ac_gnd_flt_svc_is_powered',
  Dc1 = 'a32nx_elec_dc_1_bus_is_powered',
  Dc2 = 'a32nx_elec_dc_2_bus_is_powered',
  DcEss = 'a32nx_elec_dc_ess_bus_is_powered',
  DcEssShed = 'a32nx_elec_dc_ess_shed_bus_is_powered',
  DcBatt = 'a32nx_elec_dc_batt_bus_is_powered',
  DcHot1 = 'a32nx_elec_dc_hot_1_bus_is_powered',
  DcHot2 = 'a32nx_elec_dc_hot_2_bus_is_powered',
  DcGndFltSvc = 'a32nx_elec_dc_gnd_flt_svc_bus_is_powered',
}

export type CircuitBreakerPanel =
  | '49VU'
  | '105VU'
  | '106VU'
  | '121VU'
  | '122VU'
  | '123VU'
  | '124VU'
  | '125VU'
  | '2000VU'
  | '2001VU';

export type CircuitBreakerRow =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

/**
 * An electrical circuit monitor that monitors that a bus is powered and the relevent circuit breaker is not tripped.
 * This allows us to simulate pulling the breakers of individual systems before the electrical system fully supports that.
 */
export class CircuitMonitor extends AbstractSubscribable<boolean> implements Instrument, Subscribable<boolean> {
  private static readonly cbVars = new Map<string, RegisteredSimVar<number>>();

  private isPowered = false;

  private isBusPowered = false;
  private readonly cbTrippedVar: RegisteredSimVar<number>;
  private readonly cbBit: number;

  /**
   * Ctor.
   * @param bus The event bus to use.
   * @param upstreamBus The upstream electrical bus that must be powered for the C/B to be powered.
   * @param cbPanel The panel the CB is in.
   * @param cbRow Row of the C/B.
   * @param cbColumn 1-based index of the C/B column.
   */
  public constructor(
    bus: EventBus,
    upstreamBus: UpstreamBus,
    cbPanel: CircuitBreakerPanel,
    cbRow: CircuitBreakerRow,
    cbColumn: number,
  ) {
    super();

    bus
      .getSubscriber<A32NXElectricalSystemEvents>()
      .on(upstreamBus)
      .handle((v) => (this.isBusPowered = v));

    const cbVarName = `L:1:A32NX_CB_${cbPanel}_${cbRow}_TRIPPED_${Math.trunc((cbColumn - 1) / 32)}`;
    this.cbTrippedVar = CircuitMonitor.cbVars.get(cbVarName)!;
    if (!this.cbTrippedVar) {
      this.cbTrippedVar = RegisteredSimVar.create(cbVarName, SimVarValueType.Enum);
      CircuitMonitor.cbVars.set(cbVarName, this.cbTrippedVar);
    }

    this.cbBit = (cbColumn - 1) % 32;
  }

  /** @inheritdoc */
  public init(): void {
    this.onUpdate();
  }

  /** @inheritdoc */
  public onUpdate(): void {
    const isPowered = this.isBusPowered && ((this.cbTrippedVar.get() >>> this.cbBit) & 1) === 0;
    if (isPowered !== this.isPowered) {
      this.isPowered = isPowered;
      this.notify();
    }
  }

  /**
   * Gets whether the circuit is powered.
   * @returns true if powered.
   */
  public get(): boolean {
    return this.isPowered;
  }
}
