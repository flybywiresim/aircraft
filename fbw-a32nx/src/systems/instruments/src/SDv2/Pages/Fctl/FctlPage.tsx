//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';

import { PageTitle } from '../Generic/PageTitle';
import { SDSimvars } from '../../SDSimvarPublisher';
import { SdPageProps } from '../../SD';
import { ElacComputerIndicator, SecComputerIndicator } from './elements/ComputerIndicator';
import { Aileron } from './elements/Aileron';
import { Elevator } from './elements/Elevator';
import { Rudder } from './elements/Rudder';
import { PitchTrim } from './elements/PitchTrim';
import { Wings } from './elements/Wings';

export class FctlPage extends DestroyableComponent<SdPageProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly topSvgDisplay = this.props.visible.map((v) => (v ? 'inline' : 'none'));

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.topSvgDisplay);
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 768 768"
        style={{ display: this.topSvgDisplay }}
      >
        <PageTitle x={8} y={33}>
          F/CTL
        </PageTitle>

        <text class="White F22" x={221} y={226}>
          ELAC
        </text>
        <ElacComputerIndicator bus={this.props.bus} x={215} y={234} num={1} />
        <ElacComputerIndicator bus={this.props.bus} x={245} y={252} num={2} />

        <text class="White F22 LS1" x={408} y={226}>
          SEC
        </text>
        <SecComputerIndicator bus={this.props.bus} x={395} y={234} num={1} />
        <SecComputerIndicator bus={this.props.bus} x={425} y={252} num={2} />
        <SecComputerIndicator bus={this.props.bus} x={455} y={270} num={3} />

        <Wings bus={this.props.bus} x={124} y={11} />

        <Aileron bus={this.props.bus} x={88} y={197} side="left" />
        <Aileron bus={this.props.bus} x={678} y={197} side="right" />

        <Elevator bus={this.props.bus} x={212} y={424} side="left" />
        <Elevator bus={this.props.bus} x={555} y={424} side="right" />

        <PitchTrim bus={this.props.bus} x={356} y={350} />

        <Rudder bus={this.props.bus} x={384} y={454} />
      </svg>
    );
  }
}
