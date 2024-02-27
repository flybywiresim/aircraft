// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';

interface IdleProps {
  bus: EventBus;
}
export class Idle extends DisplayComponent<IdleProps> {
  private textClass = Subject.create('');

  private visibility = Subject.create('hidden');

  private engine1N1: number = 0;

  private engine2N1: number = 0;

  private idleN1: number = 0;

  private fwcFlightPhase: number = 0;

  private autoThrustStatus: number = 0;

  private lastVisibleState: boolean = false;

  private flashTimer;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

    sub
      .on('engine1N1')
      .whenChanged()
      .handle((n1) => {
        this.engine1N1 = n1;
      });

    sub
      .on('engine2N1')
      .whenChanged()
      .handle((n1) => {
        this.engine2N1 = n1;
      });

    sub
      .on('idleN1')
      .whenChanged()
      .handle((n1) => {
        this.idleN1 = n1;
      });

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((p) => {
        this.fwcFlightPhase = p;
      });

    sub
      .on('autoThrustStatus')
      .whenChanged()
      .handle((s) => {
        this.autoThrustStatus = s;
      });

    sub
      .on('realTime')
      .atFrequency(2)
      .handle((_t) => {
        const idle = this.idleN1 + 2;
        const showIdle =
          this.engine1N1 <= idle &&
          this.engine2N1 <= idle &&
          this.fwcFlightPhase >= 5 &&
          this.fwcFlightPhase <= 7 &&
          this.autoThrustStatus !== 0;

        this.visibility.set(showIdle ? 'visible' : 'hidden');

        const flash = showIdle && showIdle !== this.lastVisibleState;
        this.lastVisibleState = showIdle;

        if (flash) {
          this.textClass.set('Large Center GreenTextPulse');
          this.flashTimer = setTimeout(() => {
            this.textClass.set('Large Center Green');
          }, 10 * 1000);
        } else if (!showIdle) {
          clearTimeout(this.flashTimer);
        }
      });
  }

  render(): VNode {
    return (
      <text class={this.textClass} x={374} y={55} visibility={this.visibility}>
        IDLE
      </text>
    );
  }
}
