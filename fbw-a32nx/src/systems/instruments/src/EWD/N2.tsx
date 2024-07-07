// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { Layer } from '../MsfsAvionicsCommon/Layer';

import './style.scss';

interface N2Props {
  bus: EventBus;
  x: number;
  y: number;
  engine: 1 | 2;
}
export class N2 extends DisplayComponent<N2Props> {
  private inactiveVisibility = Subject.create('hidden');

  private activeVisibility = Subject.create('hidden');

  private starting = Subject.create('hidden');

  private n2: number = 0;

  private n2Int = Subject.create('');

  private n2Fract = Subject.create('');

  private state: number = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & EwdSimvars>();

    sub
      .on(`engine${this.props.engine}Fadec`)
      .whenChanged()
      .handle((f) => {
        this.inactiveVisibility.set(f ? 'hidden' : 'visible');
        this.activeVisibility.set(f ? 'visible' : 'hidden');
      });

    sub
      .on(`engine${this.props.engine}N2`)
      .whenChanged()
      .handle((n2) => {
        const n2Parts = n2.toFixed(1).split('.', 2);
        this.n2 = n2;
        this.n2Int.set(n2Parts[0]);
        this.n2Fract.set(n2Parts[1]);
      });

    sub
      .on(`engine${this.props.engine}State`)
      .whenChanged()
      .handle((s) => {
        this.state = s;
      });

    sub
      .on('realTime')
      .atFrequency(2)
      .handle((_t) => {
        this.starting.set(this.n2 < 58.5 && (this.state === 2 || this.state === 3) ? 'visible' : 'hidden');
      });
  }

  render(): VNode {
    return (
      <Layer x={this.props.x} y={this.props.y}>
        <g visibility={this.inactiveVisibility}>
          <text class="Large End Amber" x={60} y={45}>
            XX
          </text>
        </g>
        <g visibility={this.activeVisibility}>
          <rect x={-9} y={22} width={80} height={25} class="LightGreyBox" visibility={this.starting} />
          <text class="Large End Green" x={42} y={45}>
            {this.n2Int}
          </text>
          <text class="Large End Green" x={54} y={45}>
            .
          </text>
          <text class="Medium End Green" x={70} y={45}>
            {this.n2Fract}
          </text>
        </g>
      </Layer>
    );
  }
}
