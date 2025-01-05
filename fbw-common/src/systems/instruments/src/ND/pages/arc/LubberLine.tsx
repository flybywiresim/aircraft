// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, VNode, EventBus, Subscribable } from '@microsoft/msfs-sdk';
import { EfisNdMode } from '@flybywiresim/fbw-sdk';

export interface LubberLineProps {
  bus: EventBus;

  visible: Subscribable<boolean>;
  ndMode: Subscribable<EfisNdMode>;
  rotation: Subscribable<number>;
}

export class LubberLine extends DisplayComponent<LubberLineProps> {
  private readonly transform = this.props.rotation.map((it) => `rotate(${it} 384 626)`);

  render(): VNode | null {
    return (
      <g visibility={this.props.visible.map((it) => (it ? 'inherit' : 'hidden'))} transform={this.transform}>
        <line
          x1={384}
          y1={this.props.ndMode.map((mode) => (mode === EfisNdMode.ARC ? 108 : 116))}
          x2={384}
          y2={this.props.ndMode.map((mode) => (mode === EfisNdMode.ARC ? 148 : 152))}
          class="shadow"
          stroke-width={5.5}
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <line
          x1={384}
          y1={this.props.ndMode.map((mode) => (mode === EfisNdMode.ARC ? 108 : 116))}
          x2={384}
          y2={this.props.ndMode.map((mode) => (mode === EfisNdMode.ARC ? 148 : 152))}
          class="Yellow"
          stroke-width={5}
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </g>
    );
  }
}
