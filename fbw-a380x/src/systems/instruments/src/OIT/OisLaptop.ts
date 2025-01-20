// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument, SimVarValueType, Subject, Subscribable } from '@microsoft/msfs-sdk';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';

type LaptopIndex = 1 | 2;

export class OisLaptop implements Instrument {
  private readonly failureKey = this.index === 1 ? A380Failure.CaptainLaptop : A380Failure.FirstOfficerLaptop;

  private readonly powered = Subject.create(false);

  private readonly _isHealthy = Subject.create(false);
  public readonly isHealthy = this._isHealthy as Subscribable<boolean>;

  constructor(
    private readonly bus: EventBus,
    private readonly index: LaptopIndex,
    private readonly failuresConsumer: FailuresConsumer,
  ) {}

  /** @inheritdoc */
  init(): void {
    this.failuresConsumer.register(this.failureKey);
  }

  /** @inheritdoc */
  onUpdate(): void {
    const failed = this.failuresConsumer.isActive(this.failureKey);

    if (this.index === 1) {
      this.powered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', SimVarValueType.Bool));
    } else {
      this.powered.set(
        SimVar.GetSimVarValue('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', SimVarValueType.Bool) ||
          SimVar.GetSimVarValue('L:A32NX_ELEC_DC_HOT_2_BUS_IS_POWERED', SimVarValueType.Bool),
      );
    }

    this._isHealthy.set(!failed && this.powered.get());
    SimVar.SetSimVarValue(
      `L:A32NX_FLTOPS_LAPTOP_${this.index.toFixed(0)}_IS_HEALTHY`,
      SimVarValueType.Bool,
      this._isHealthy.get(),
    );
  }
}
