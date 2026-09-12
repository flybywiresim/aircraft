//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { PageTitle } from '../Generic/PageTitle';
import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';

import '../../../index.scss';
import { SdPageProps } from '../../SD';

export class VideoPage extends DestroyableComponent<SdPageProps> {
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
        viewBox="0 0 768 1024"
        style={{ display: this.topSvgDisplay }}
      >
        <PageTitle x={6} y={29}>
          VIDEO
        </PageTitle>
        <text class="F26 MiddleAlign Amber" x={384} y={343}>
          NOT AVAIL
        </text>
      </svg>
    );
  }
}
