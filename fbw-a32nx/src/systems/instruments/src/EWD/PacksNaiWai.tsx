// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';

interface PacksNaiWaiProps {
  bus: EventBus;
}
export class PacksNaiWai extends DisplayComponent<PacksNaiWaiProps> {
  private readonly messageLUT = ['', 'WAI', 'NAI', 'NAI/WAI', 'PACKS', 'PACKS/WAI', 'PACKS/NAI', 'PACKS/NAI/WAI'];

  private message = Subject.create('');

  private thrustLimitType: number = 0;

  private packs1Supplying: boolean = false;

  private packs2Supplying: boolean = false;

  private engine1Fadec: boolean = false;

  private engine2Fadec: boolean = false;

  private engine1AntiIce: boolean = false;

  private engine2AntiIce: boolean = false;

  private wingAntiIce: boolean = false;

  private apuBleedPressure: number = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

    sub
      .on('thrustLimitType')
      .whenChanged()
      .handle((l) => {
        this.thrustLimitType = l;
      });

    sub
      .on('packs1Supplying')
      .whenChanged()
      .handle((pack) => {
        this.packs1Supplying = pack;
      });

    sub
      .on('packs2Supplying')
      .whenChanged()
      .handle((pack) => {
        this.packs2Supplying = pack;
      });

    sub
      .on('engine1Fadec')
      .whenChanged()
      .handle((fadec) => {
        this.engine1Fadec = fadec;
      });

    sub
      .on('engine2Fadec')
      .whenChanged()
      .handle((fadec) => {
        this.engine2Fadec = fadec;
      });

    sub
      .on('engine1AntiIce')
      .whenChanged()
      .handle((ai) => {
        this.engine1AntiIce = ai;
      });

    sub
      .on('engine2AntiIce')
      .whenChanged()
      .handle((ai) => {
        this.engine2AntiIce = ai;
      });

    sub
      .on('wingAntiIce')
      .whenChanged()
      .handle((ai) => {
        this.wingAntiIce = ai;
      });

    sub
      .on('apuBleedPressure')
      .whenChanged()
      .handle((psi) => {
        this.apuBleedPressure = psi;
      });

    sub
      .on('realTime')
      .atFrequency(2)
      .handle((_t) => {
        // Messages should be shown when thrust limit is TOGA, SOFT GA, FLEX, DTO, or MCT.
        // Current implementation only has TOGA, FLEX, and MCT.
        // TODO: The current thrust limit should be read from EECs.
        const showMessage = this.thrustLimitType >= 2 && this.thrustLimitType <= 4;

        this.message.set(showMessage ? this.messageLUT[this.messageIndex] : '');
      });
  }

  get messageIndex(): number {
    return (
      (((this.packs1Supplying && this.engine1Fadec) || (this.packs2Supplying && this.engine2Fadec)) &&
      this.apuBleedPressure === 0
        ? 4
        : 0) +
      (this.engine1AntiIce || this.engine2AntiIce ? 2 : 0) +
      (this.wingAntiIce ? 1 : 0)
    );
  }

  render(): VNode {
    return (
      <text class="Green Large End" x={492} y={27}>
        {this.message}
      </text>
    );
  }
}
