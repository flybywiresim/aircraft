// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AutoThrustMode } from '@shared/autopilot';
import { EwdSimvars } from './shared/EwdSimvarPublisher';

interface AFloorProps {
  bus: EventBus;
}
export class AFloor extends DisplayComponent<AFloorProps> {
  private visibility = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<EwdSimvars>();

    sub
      .on('autoThrustMode')
      .whenChanged()
      .handle((mode) => {
        this.visibility.set(mode === AutoThrustMode.A_FLOOR ? 'visible' : 'hidden');
      });
  }

  render(): VNode {
    return (
      <text class="Amber Large End" x={150} y={27} visibility={this.visibility}>
        A.FLOOR
      </text>
    );
  }
}
