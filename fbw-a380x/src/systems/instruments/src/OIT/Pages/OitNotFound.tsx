//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitPageProps } from '../OIT';

interface OitNotFoundProps extends AbstractOitPageProps {}

export class OitNotFound extends DisplayComponent<OitNotFoundProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    new Promise((resolve) => setTimeout(resolve, 500)).then(() => this.props.oit.uiService.navigateTo('back'));
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
        <div class="oit-page-container" />
        {/* end page content */}
      </>
    );
  }
}
