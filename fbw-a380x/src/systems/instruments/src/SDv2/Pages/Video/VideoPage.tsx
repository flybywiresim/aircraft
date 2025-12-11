//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import '../../../index.scss';

import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from '../../../MsfsAvionicsCommon/DestroyableComponent';

import { PageTitle } from '../Generic/PageTitle';

import { SdPageProps } from '../../SD';

export class VideoPage extends DestroyableComponent<SdPageProps> {
  private readonly topSvgStyle = this.props.visible.map((v) => `visibility: ${v ? 'visible' : 'hidden'}`);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.topSvgStyle);
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
        style={this.topSvgStyle}
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
