// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import EWDMessages from '@instruments/common/EWDMessages';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { FormattedFwcText } from './FormattedFwcText';

import './style.scss';

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

interface LowerRightDisplayProps {
  bus: EventBus;
}
export class LowerRightDisplay extends DisplayComponent<LowerRightDisplayProps> {
  private line1: string = '';

  private line2: string = '';

  private line3: string = '';

  private line4: string = '';

  private line5: string = '';

  private line6: string = '';

  private line7: string = '';

  private message = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

    sub
      .on('ewdLowerRight1')
      .whenChanged()
      .handle((m) => {
        this.line1 = padEWDCode(m);
      });

    sub
      .on('ewdLowerRight2')
      .whenChanged()
      .handle((m) => {
        this.line2 = padEWDCode(m);
      });

    sub
      .on('ewdLowerRight3')
      .whenChanged()
      .handle((m) => {
        this.line3 = padEWDCode(m);
      });

    sub
      .on('ewdLowerRight4')
      .whenChanged()
      .handle((m) => {
        this.line4 = padEWDCode(m);
      });

    sub
      .on('ewdLowerRight5')
      .whenChanged()
      .handle((m) => {
        this.line5 = padEWDCode(m);
      });

    sub
      .on('ewdLowerRight6')
      .whenChanged()
      .handle((m) => {
        this.line6 = padEWDCode(m);
      });

    sub
      .on('ewdLowerRight7')
      .whenChanged()
      .handle((m) => {
        this.line7 = padEWDCode(m);
      });

    sub
      .on('realTime')
      .atFrequency(2)
      .handle((_t) => {
        this.message.set(
          [
            EWDMessages[this.line1],
            EWDMessages[this.line2],
            EWDMessages[this.line3],
            EWDMessages[this.line4],
            EWDMessages[this.line5],
            EWDMessages[this.line6],
            EWDMessages[this.line7],
          ].join('\r'),
        );
      });
  }

  render(): VNode {
    return <FormattedFwcText message={this.message} x={520} y={554} />;
  }
}
