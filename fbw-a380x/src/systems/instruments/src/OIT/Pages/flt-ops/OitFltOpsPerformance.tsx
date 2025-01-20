//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitPageProps } from 'instruments/src/OIT/OIT';

interface OitFltOpsPerformancePageProps extends AbstractOitPageProps {}

export class OitFltOpsPerformance extends DisplayComponent<OitFltOpsPerformancePageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <div class="oit-page-container" style="justify-content: center; align-items: center;">
          <div class="oit-label amber" style="font-size: 36px;">
            NOT YET IMPLEMENTED
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
