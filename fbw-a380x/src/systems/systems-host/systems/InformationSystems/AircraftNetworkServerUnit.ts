// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Instrument, SimVarValueType, Subject, Subscribable, Subscription } from '@microsoft/msfs-sdk';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';
import { AtsuSystem } from 'systems-host/systems/atsu';

type AnsuIndex = 1 | 2;

type AnsuType = 'nss' | 'flt-ops';

export class AircraftNetworkServerUnit implements Instrument {
  private readonly subscriptions: Subscription[] = [];

  private readonly failureKey =
    this.type === 'flt-ops' && this.index === 1
      ? A380Failure.FltOpsAnsu
      : this.index === 1
        ? A380Failure.NssAnsu1
        : A380Failure.NssAnsu2;

  private readonly powered = Subject.create(false);

  private readonly _isHealthy = Subject.create(false);
  public readonly isHealthy = this._isHealthy as Subscribable<boolean>;
  private readonly isHealthySimVar = `L:A32NX_${this.type === 'nss' ? 'NSS' : 'FLTOPS'}_ANSU_${this.index.toFixed(0)}_IS_HEALTHY`;

  constructor(
    private readonly bus: EventBus,
    private readonly index: AnsuIndex,
    private readonly type: AnsuType,
    private readonly failuresConsumer: FailuresConsumer,
    private readonly atsu: AtsuSystem,
  ) {}

  /** @inheritdoc */
  init(): void {
    this.failuresConsumer.register(this.failureKey);

    this.subscriptions.push(
      this._isHealthy.sub((v) => SimVar.SetSimVarValue(this.isHealthySimVar, SimVarValueType.Bool, v)),
    );
  }

  /** @inheritdoc */
  onUpdate(): void {
    const failed = this.failuresConsumer.isActive(this.failureKey);

    if (this.type === 'nss') {
      if (this.index === 1) {
        this.powered.set(
          SimVar.GetSimVarValue('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', SimVarValueType.Bool) ||
            SimVar.GetSimVarValue('L:A32NX_ELEC_DC_HOT_2_BUS_IS_POWERED', SimVarValueType.Bool),
        );
      } else {
        this.powered.set(
          SimVar.GetSimVarValue('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', SimVarValueType.Bool) ||
            SimVar.GetSimVarValue('L:A32NX_ELEC_AC_EMER_BUS_IS_POWERED', SimVarValueType.Bool) ||
            SimVar.GetSimVarValue('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', SimVarValueType.Bool),
        );
      }
    } else if (this.type === 'flt-ops') {
      this.powered.set(
        SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', SimVarValueType.Bool) ||
          SimVar.GetSimVarValue('L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED', SimVarValueType.Bool),
      );
    }

    this._isHealthy.set(!failed && this.powered.get());
  }

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }
}
