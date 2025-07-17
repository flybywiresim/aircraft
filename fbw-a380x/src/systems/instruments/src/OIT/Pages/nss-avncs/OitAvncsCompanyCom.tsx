//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { AbstractOitAvncsPageProps } from '../../OIT';
import { OitAvncsSubHeader } from './OitAvncsSubHeader';

interface OitAvncsCompanyComPageProps extends AbstractOitAvncsPageProps {}

export class OitAvncsCompanyCom extends DestroyableComponent<OitAvncsCompanyComPageProps> {
  // Make sure to collect all subscriptions in this.subscriptions, otherwise page navigation doesn't work.

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <OitAvncsSubHeader title={'COMPANY COM'} uiService={this.props.uiService} />
        <div class="oit-page-container" style="justify-content: center; align-items: center; flex: 1;">
          <div class="oit-label amber" style="font-size: 36px;">
            NOT YET IMPLEMENTED
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
