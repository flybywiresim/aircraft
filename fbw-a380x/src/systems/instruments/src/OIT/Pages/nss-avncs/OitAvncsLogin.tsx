//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { AbstractOitAvncsPageProps } from '../../OIT';
import { OitAvncsSubHeader } from './OitAvncsSubHeader';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

interface OitAvncsLoginPageProps extends AbstractOitAvncsPageProps {}

export class OitAvncsLogin extends DestroyableComponent<OitAvncsLoginPageProps> {
  // Make sure to collect all subscriptions in this.subscriptions, otherwise page navigation doesn't work.

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <OitAvncsSubHeader title={'NSS AVNCS MENU'} uiService={this.props.uiService} />
        <div class="oit-page-container" style="justify-content: center; align-items: center;">
          <div class="oit-login-page-heading">NSS AVNCS DOMAIN</div>
          <div class="oit-login-page-sub-heading">LOGIN PAGE</div>
          <div class="oit-login-page-button-container">
            <Button label="PILOT" onClick={() => this.props.uiService.navigateTo('nss-avncs')} />
            <Button label="MAINTAINER" onClick={() => this.props.uiService.navigateTo('nss-avncs')} />
            <Button label="ADMINISTRATOR" onClick={() => this.props.uiService.navigateTo('nss-avncs')} />
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
