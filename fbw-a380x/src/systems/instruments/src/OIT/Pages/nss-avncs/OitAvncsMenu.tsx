//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { AbstractOitAvncsPageProps } from '../../OIT';
import { OitAvncsSubHeader } from './OitAvncsSubHeader';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

interface OitAvncsMenuPageProps extends AbstractOitAvncsPageProps {}

export class OitAvncsMenu extends DestroyableComponent<OitAvncsMenuPageProps> {
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
          <Button
            label={'COMPANY COM'}
            onClick={() => this.props.uiService.navigateTo('nss-avncs/company-com')}
            buttonStyle="font-size: 28px; height: 40px;"
          />
          <Button
            label={'REFUEL'}
            disabled={Subject.create(true)}
            onClick={() => this.props.uiService.navigateTo('nss-avncs/refuel')}
            buttonStyle="font-size: 28px; height: 40px;"
          />
        </div>
        {/* end page content */}
      </>
    );
  }
}
