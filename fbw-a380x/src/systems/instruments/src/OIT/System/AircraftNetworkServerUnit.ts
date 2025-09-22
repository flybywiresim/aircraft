// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  EventBus,
  Instrument,
  SimVarValueType,
  Subject,
  Subscription,
} from '@microsoft/msfs-sdk';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';
import { ResetPanelSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';
import { OitSimvars } from '../OitSimvarPublisher';
import { SecureCommunicationInterface } from './SecureCommunicationInterface';

type AnsuIndex = 1 | 2;

type AnsuType = 'nss-avncs' | 'flt-ops';

export class AircraftNetworkServerUnit implements Instrument {
  protected readonly subscriptions: Subscription[] = [];

  protected readonly sub = this.bus.getSubscriber<ResetPanelSimvars & OitSimvars & ClockEvents>();

  protected readonly failureKey =
    this.type === 'flt-ops' && this.index === 1
      ? A380Failure.FltOpsAnsu
      : this.index === 1
        ? A380Failure.NssAnsu1
        : A380Failure.NssAnsu2;

  protected readonly powered = Subject.create(false);

  protected readonly _isHealthy = Subject.create(false);
  protected readonly isHealthySimVar = `L:A32NX_${this.type === 'nss-avncs' ? 'NSS' : 'FLTOPS'}_ANSU_${this.index.toFixed(0)}_IS_HEALTHY`;

  protected readonly nssMasterOff = ConsumerSubject.create(this.sub.on('nssMasterOff'), false);

  protected readonly resetPbStatus = ConsumerSubject.create(
    this.sub.on(this.type === 'flt-ops' ? 'a380x_reset_panel_nss_flt_ops' : 'a380x_reset_panel_nss_avncs'),
    false,
  );

  public readonly sci = new SecureCommunicationInterface(this.bus);

  constructor(
    protected readonly bus: EventBus,
    protected readonly index: AnsuIndex, // use only one ANSU index per type for now
    protected readonly type: AnsuType,
    protected readonly failuresConsumer: FailuresConsumer,
  ) {}

  /** @inheritdoc */
  init(): void {
    this.failuresConsumer.register(this.failureKey);

    this.subscriptions.push(
      this._isHealthy.sub((v) => SimVar.SetSimVarValue(this.isHealthySimVar, SimVarValueType.Bool, v), true),
    );
  }

  /** @inheritdoc */
  onUpdate(): void {
    const failed = this.failuresConsumer.isActive(this.failureKey);

    if (this.type === 'nss-avncs') {
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

    this._isHealthy.set(!failed && this.powered.get() && !this.resetPbStatus.get() && !this.nssMasterOff.get());

    if (!this._isHealthy.get()) {
      this.reset();
      return;
    }
  }

  reset(): void {
    // Called when reset panel p/b is pulled out
  }

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }
}
