// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { fuelForDisplay } from '@instruments/common/fuel';
import { EwdSimvars } from './shared/EwdSimvarPublisher';
import { Layer } from '../MsfsAvionicsCommon/Layer';

import './style.scss';

interface FOBProps {
  bus: EventBus;
  x: number;
  y: number;
  metric: Subscribable<boolean>;
}
export class FOB extends DisplayComponent<FOBProps> {
  private fob: number = 0;

  private fobDisplay = Subject.create(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars>();

    sub
      .on('totalFuel')
      .whenChanged()
      .handle((fob) => {
        this.fob = fob;
        this.updateDisplay();
      });

    this.props.metric.sub(() => this.updateDisplay());
  }

  updateDisplay(): void {
    const metric = this.props.metric.get();
    this.fobDisplay.set(fuelForDisplay(this.fob, metric ? '1' : '0', 1, 2));
  }

  render(): VNode {
    return (
      <Layer x={this.props.x} y={this.props.y}>
        <text class="Huge Center" x={-1} y={0}>
          FOB
        </text>
        <text class="Huge Center" x={52} y={0}>
          :
        </text>
        <text class="Huge End Green" x={172} y={0}>
          {this.fobDisplay}
        </text>
        <text class="Standard Center Cyan" x={212} y={-1}>
          {this.props.metric.map((m) => (m ? 'KG' : 'LBS'))}
        </text>
      </Layer>
    );
  }
}
