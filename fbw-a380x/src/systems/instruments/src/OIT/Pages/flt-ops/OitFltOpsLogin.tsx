//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { AbstractOitFltOpsPageProps } from '../../OIT';

interface OitFltOpsLoginPageProps extends AbstractOitFltOpsPageProps {
  readonly captOrFo: 'CAPT' | 'FO';
}

export class OitFltOpsLogin extends DestroyableComponent<OitFltOpsLoginPageProps> {
  // Make sure to collect all subscriptions in this.subscriptions, otherwise page navigation doesn't work.

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <div class="oit-page-container" style="justify-content: center; align-items: center;">
          <div class="oit-login-page-heading">FLT OPS Domain</div>
          <div class="oit-login-page-sub-heading">Login Page</div>
          <div class="oit-login-page-sub-sub-heading">{this.props.captOrFo === 'CAPT' ? 'CAPTAIN' : 'FIRST OFFICER'}</div>
          <div class="oit-login-page-button-container">
            <Button label="PILOT" onClick={() => this.props.uiService.navigateTo('flt-ops')} />
            <Button label="MAINTAINER" onClick={() => this.props.uiService.navigateTo('flt-ops')} />
            <Button label="ADMINISTRATOR" onClick={() => this.props.uiService.navigateTo('flt-ops')} />
          </div>
          <div class="oit-login-page-bottom-left-text">Connected.</div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
