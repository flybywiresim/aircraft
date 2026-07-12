//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { PageTitle } from '../Generic/PageTitle';
import { SdPageProps } from '../../SD';
import { FormattedFwcText } from '../../../MsfsAvionicsCommon/FormattedFwcText';

import './style.scss';
import { SDSimvars } from '../../SDSimvarPublisher';

export class StatusPage extends DestroyableComponent<SdPageProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly topSvgDisplay = this.props.visible.map((v) => (v ? 'inline' : 'none'));

  private linesLeft = Subject.create('\r\r              \x1b<3mNORMAL');

  private linesRight = Subject.create('');

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
        id="main-status"
      >
        <PageTitle x={316} y={38}>
          STATUS
        </PageTitle>

        <FormattedFwcText bus={this.props.bus} x={8} y={118} message={this.linesLeft}></FormattedFwcText>

        <FormattedFwcText bus={this.props.bus} x={512} y={118} message={this.linesRight}></FormattedFwcText>

        <line class="SW4 Grey LineRound" x1="483" y1="96" x2="483" y2="593" />
      </svg>
    );
  }
}
