//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitPageProps } from '../../OIT';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

interface OitFltOpsLoginPageProps extends AbstractOitPageProps {}

export class OitFltOpsLogin extends DisplayComponent<OitFltOpsLoginPageProps> {
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
        <div class="oit-page-container">
          <div class="oit-flt-ops-login-upper">
            <div className="oit-login-line oit-label biggest">FLT OPS Domain</div>
            <div className="oit-login-line oit-label">Login Page</div>
            <div className="oit-login-line oit-label">CAPTAIN</div>
          </div>
          <div class="oit-flt-ops-login-line">
            <Button
              label={'PILOT'}
              containerStyle="width: 150px; margin-bottom: 10px"
              onClick={() => this.props.oit.uiService.navigateTo('flt-ops/sts')}
            />
            <Button
              label={'MAINTAINER'}
              containerStyle="width: 150px; margin-bottom: 10px"
              onClick={() => this.props.oit.uiService.navigateTo('flt-ops/sts')}
              disabled={Subject.create(true)}
            />
          </div>
          <div class="oit-flt-ops-login-line-footer">
            <Button
              label={'SWITCH OFF LAPTOP'}
              containerStyle="width: 150px; margin-bottom: 10px"
              onClick={() => this.props.oit.uiService.navigateTo('flt-ops')}
              disabled={Subject.create(true)}
            />
          </div>
        </div>
        {/* end page content */}
      </>
    );
  }
}
