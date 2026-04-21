//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitFltOpsPageProps } from '../../OIT';

interface OitFltOpsEfbOverlayPageProps extends AbstractOitFltOpsPageProps {}

export class OitFltOpsEfbOverlay extends DisplayComponent<OitFltOpsEfbOverlayPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subs) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <div class="oit-page-container" style="justify-content: center; align-items: center;">
          <div class="oit-label amber" style="font-size: 36px; margin-bottom: 20px;">
            EFB OVERLAY FAILED
          </div>
          <div class="oit-label">Please reload aircraft after linking Navigraph through the EFB.</div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
