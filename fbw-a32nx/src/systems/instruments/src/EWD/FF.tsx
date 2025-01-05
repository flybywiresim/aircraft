// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { fuelForDisplay } from '@instruments/common/fuel';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { Layer } from '../MsfsAvionicsCommon/Layer';

import './style.scss';

interface FFProps {
  bus: EventBus;
  x: number;
  y: number;
  engine: 1 | 2;
  metric: Subscribable<boolean>;
}
export class FF extends DisplayComponent<FFProps> {
  private inactiveVisibility = Subject.create('hidden');

  private activeVisibility = Subject.create('hidden');

  private ff = Subject.create(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars>();

    sub
      .on(`engine${this.props.engine}Fadec`)
      .whenChanged()
      .handle((f) => {
        this.inactiveVisibility.set(f ? 'hidden' : 'visible');
        this.activeVisibility.set(f ? 'visible' : 'hidden');
      });

    sub
      .on(`engine${this.props.engine}FF`)
      .atFrequency(1)
      .handle((ff) => {
        const metric = this.props.metric.get();
        this.ff.set(fuelForDisplay(ff, metric ? '1' : '0', 1, 2));
      });
  }

  render(): VNode {
    return (
      <Layer x={this.props.x} y={this.props.y}>
        <g visibility={this.inactiveVisibility}>
          <text class="Large End Amber" x={-20} y={0}>
            XX
          </text>
        </g>
        <g visibility={this.activeVisibility}>
          <text class="Large End Green" x={0} y={0}>
            {this.ff}
          </text>
        </g>
      </Layer>
    );
  }
}
