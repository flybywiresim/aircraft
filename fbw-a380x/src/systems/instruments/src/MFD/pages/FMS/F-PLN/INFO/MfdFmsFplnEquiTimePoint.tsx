// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import { FmsPage } from '../../../common/FmsPage';
import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import './MfdFmsFplnEquiTimePoint.scss';

export class MfdFmsFplnEquiTimePoint extends FmsPage {
  private readonly timeToEtp = Subject.create('--:--');
  private readonly timeToEtpHeader = Subject.create<'UTC' | 'TIME'>('UTC');
  private readonly distanceToEtp = Subject.create<number | null>(null);
  private readonly distanceToEtpDisplay = this.distanceToEtp.map((v) =>
    v != null ? Math.min(9999, v).toFixed(0).padStart(4, '\xa0') : '----',
  );
  private readonly distancetoEtpUnitVisibility = this.distanceToEtp.map((v) => (v !== null ? 'visible' : 'hidden'));

  public onAfterRender(node: VNode): void {
    this.props.bus
      .getSubscriber<ClockEvents>()
      .on('activeSimDuration')
      .atFrequency(1)
      .handle(() => this.update())
      .withLifecycle(this.defaultLifecycle);
    super.onAfterRender(node);
  }

  private update() {
    const etp = this.props.fmcService.master.getEquitimePoint();
    this.timeToEtpHeader.set(this.props.fmcService.master.getTimePredictionHeader());
    const etpEtaSeconds = etp.pposTimeToEtp !== undefined ? etp.pposTimeToEtp * 3600 : null;
    this.timeToEtp.set(this.props.fmcService.master.formatEta(etpEtaSeconds).padStart(4, '\xa0'));
    this.distanceToEtp.set(etp.pposDistanceToEtp !== undefined ? Math.round(etp.pposDistanceToEtp) : null);
  }

  public render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-fpln-etp-ppos-rect">
          <span class="mfd-label bigger mfd-fpln-etp-ppos-text">P.POS</span>
        </div>
        <div class="mfd-fpln-etp-ppos-dist-line"></div>
        <div class="mfd-fpln-etp-ppos-time-dist-rect">
          <span class="mfd-label bigger etp-ppos-dist-header">DIST</span>
          <span class="mfd-value bigger etp-ppos-dist-value">{this.distanceToEtpDisplay}</span>
          <span
            class="mfd-label-unit bigger mfd-unit-trailing etp-ppos-dist-unit"
            style={{ visibility: this.distancetoEtpUnitVisibility }}
          >
            NM
          </span>
          <span class="mfd-label bigger etp-ppos-time-header">{this.timeToEtpHeader}</span>
          <span class="mfd-value bigger etp-ppos-time-value">{this.timeToEtp}</span>
        </div>
        <div class="mfd-fpln-etp-ppos-airport-horizontal-line first"></div>
        <div class="mfd-fpln-etp-ppos-airport-vertical-line first"></div>
        <div class="mfd-fpln-etp-ppos-airport-horizontal-line second"></div>
        <div class="mfd-fpln-etp-ppos-airport-vertical-line second"></div>
      </>
    );
  }
}
