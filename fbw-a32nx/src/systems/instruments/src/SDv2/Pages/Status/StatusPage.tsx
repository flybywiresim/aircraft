//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { PageTitle } from '../Generic/PageTitle';
import { SdPageProps } from '../../SD';

import './style.scss';
import { SDSimvars } from '../../SDSimvarPublisher';

export class StatusPage extends DestroyableComponent<SdPageProps> {
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
        <PageTitle x={250} y={36}>
          STATUS
        </PageTitle>

        <line class="SW2 Grey" x1="486" y1="92" x2="486" y2="589" />
      </svg>
    );
  }
}
