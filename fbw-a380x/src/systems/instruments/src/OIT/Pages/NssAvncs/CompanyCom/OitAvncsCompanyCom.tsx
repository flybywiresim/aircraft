//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { OitAvncsSubHeader } from '../OitAvncsSubHeader';
import { OitAvncsCompanyComMenu } from './OitAvncsCompanyComMenu';

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
        <div class="oit-page-container">
          <div class="oit-avncs-navigator-container">
            <div class="oit-avncs-navigator-left">
              <OitAvncsCompanyComMenu bus={this.props.bus} uiService={this.props.uiService} />
            </div>
            <div class="it-avncs-navigator-right">
              <div class="oit-avncs-navigator-right-center-buttons">
                <span style="font-weight: bold;">TODO</span>
              </div>
            </div>
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
