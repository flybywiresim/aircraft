//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, SubscribableMapFunctions, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { OitUiService } from '../../OitUiService';

interface OitAvncsLoginPageProps {
  readonly bus: EventBus;
  readonly uiService: OitUiService;
  readonly captOrFo: 'CAPT' | 'FO';
}

export class OitAvncsLogin extends DestroyableComponent<OitAvncsLoginPageProps> {
  // Make sure to collect all subscriptions in this.subscriptions, otherwise page navigation doesn't work.

  private readonly hideLoginScreen = this.props.uiService.nssAvncsLoginScreenVisible.map(
    SubscribableMapFunctions.not(),
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.hideLoginScreen);
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <div class={{ 'oit-flt-ops-loading-screen-container': true, hidden: this.hideLoginScreen }}>
          <div class="oit-login-page-heading">NSS AVNCS DOMAIN</div>
          <div class="oit-login-page-sub-heading">LOGIN PAGE</div>
          <div class="oit-login-page-button-container">
            <Button label="PILOT" onClick={() => this.props.uiService.nssAvncsLoginScreenVisible.set(false)} />
            <Button
              label="MAINTAINER"
              onClick={() => this.props.uiService.nssAvncsLoginScreenVisible.set(false)}
              containerStyle="margin-top: 10px;"
              disabled={true}
            />
            <Button
              label="ADMINISTRATOR"
              onClick={() => this.props.uiService.nssAvncsLoginScreenVisible.set(false)}
              containerStyle="margin-top: 10px;"
              disabled={true}
            />
          </div>
          <div class="oit-login-page-bottom-left-text">Connected.</div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
