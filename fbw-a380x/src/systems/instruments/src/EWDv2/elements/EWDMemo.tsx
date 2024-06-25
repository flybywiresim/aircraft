// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  EventBus,
  DisplayComponent,
  FSComponent,
  Subject,
  VNode,
  MappedSubject,
} from '@microsoft/msfs-sdk';
import EWDMessages from '@instruments/common/EWDMessages';
import { EwdSimvars } from '../shared/EwdSimvarPublisher';
import { FormattedFwcText } from './FormattedFwcText';

import '../style.scss';

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

interface EWDMemoProps {
  bus: EventBus;
}
export class EWDMemo extends DisplayComponent<EWDMemoProps> {
  private line1: Subject<string> = Subject.create('');

  private line2: Subject<string> = Subject.create('');

  private line3: Subject<string> = Subject.create('');

  private line4: Subject<string> = Subject.create('');

  private line5: Subject<string> = Subject.create('');

  private line6: Subject<string> = Subject.create('');

  private line7: Subject<string> = Subject.create('');

  private line8: Subject<string> = Subject.create('');

  private message = Subject.create('');

  private lineSubjects = [
    this.line1,
    this.line2,
    this.line3,
    this.line4,
    this.line5,
    this.line6,
    this.line7,
    this.line8,
  ];
  private readonly numMemos: MappedSubject<string[], number> = MappedSubject.create(
    (lines) => lines.filter((line) => Boolean(EWDMessages[line])).length,
    ...this.lineSubjects,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

    sub
      .on('ewdRightLine1')
      .whenChanged()
      .handle((m) => {
        this.line1.set(padEWDCode(m));
      });

    sub
      .on('ewdRightLine2')
      .whenChanged()
      .handle((m) => {
        this.line2.set(padEWDCode(m));
      });

    sub
      .on('ewdRightLine3')
      .whenChanged()
      .handle((m) => {
        this.line3.set(padEWDCode(m));
      });

    sub
      .on('ewdRightLine4')
      .whenChanged()
      .handle((m) => {
        this.line4.set(padEWDCode(m));
      });

    sub
      .on('ewdRightLine5')
      .whenChanged()
      .handle((m) => {
        this.line5.set(padEWDCode(m));
      });

    sub
      .on('ewdRightLine6')
      .whenChanged()
      .handle((m) => {
        this.line6.set(padEWDCode(m));
      });

    sub
      .on('ewdRightLine7')
      .whenChanged()
      .handle((m) => {
        this.line7.set(padEWDCode(m));
      });

    sub
      .on('ewdRightLine8')
      .whenChanged()
      .handle((m) => {
        this.line7.set(padEWDCode(m));
      });

    sub
      .on('realTime')
      .atFrequency(2)
      .handle((_t) => {
        this.message.set(
          [
            EWDMessages[this.line1.get()],
            EWDMessages[this.line2.get()],
            EWDMessages[this.line3.get()],
            EWDMessages[this.line4.get()],
            EWDMessages[this.line5.get()],
            EWDMessages[this.line6.get()],
            EWDMessages[this.line7.get()],
            EWDMessages[this.line8.get()],
          ].join('\r'),
        );
      });
  }

  render(): VNode {
    return (
      <g id="EWDMemo" class="Show">
        <path
          class={this.numMemos.map((n) => (n > 0 ? 'WhiteLine' : 'Hide'))}
          d={this.numMemos.map((n) => `M ${395 - 10},${414 - 23} l 0,${6 + n * 30}`)}
        />
        <FormattedFwcText x={395} y={414} message={this.message} />
      </g>
    );
  }
}
