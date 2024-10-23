// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { Arinc429Word, FmsOansData } from '@flybywiresim/fbw-sdk';
import { RopRowOansSimVars } from '../../MsfsAvionicsCommon/providers';

export interface RwyAheadAdvisoryProps {
  bus: EventBus;
}

export class RwyAheadAdvisory extends DisplayComponent<RwyAheadAdvisoryProps> {
  private readonly sub = this.props.bus.getSubscriber<RopRowOansSimVars & FmsOansData>();

  private readonly ndRwyAheadQfu = ConsumerSubject.create(this.sub.on('ndRwyAheadQfu').whenChanged(), '');

  private readonly oansWord1Raw = ConsumerSubject.create(this.sub.on('oansWord1Raw').whenChanged(), 0);

  private readonly flagDisplay = this.oansWord1Raw.map((word) => {
    const w = new Arinc429Word(word);
    return w.bitValueOr(11, false) ? 'block' : 'none';
  });

  onAfterRender(node: VNode) {
    super.onAfterRender(node);
  }

  render(): VNode | null {
    return (
      <g style={{ display: this.flagDisplay }}>
        <rect
          x="273"
          y="209"
          width="210"
          height="40"
          stroke="yellow"
          stroke-width="3"
          fill="black"
          style="RwyAheadAnimation"
        />
        <text
          x={378}
          y={241}
          class="FontLarge Yellow MiddleAlign RwyAheadAnimation TextOutline"
          style="stroke-width: 0.25mm;"
        >
          {this.ndRwyAheadQfu}
        </text>
      </g>
    );
  }
}
