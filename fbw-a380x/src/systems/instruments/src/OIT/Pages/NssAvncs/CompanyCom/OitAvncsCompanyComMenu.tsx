//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { OitFolder, OitFile } from '../OitAvncsFolderNavigator';
import { OitUiService } from '../../../OitUiService';

interface OitAvncsCompanyComMenuProps {
  readonly bus: EventBus;
  readonly uiService: OitUiService;
}

export class OitAvncsCompanyComMenu extends DestroyableComponent<OitAvncsCompanyComMenuProps> {
  // Make sure to collect all subscriptions in this.subscriptions, otherwise page navigation doesn't work.

  private readonly inboxCount = Subject.create(2);
  private readonly outboxCount = Subject.create(0);

  private readonly inboxLabel = this.inboxCount.map((count) => `Inbox (${count})`);
  private readonly outboxLabel = this.outboxCount.map((count) => `Outbox (${count})`);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <OitFile
          name={this.inboxLabel}
          uiService={this.props.uiService}
          navigationTarget="nss-avncs/company-com/inbox"
        />
        <OitFile name={this.outboxLabel} uiService={this.props.uiService} disabled={true} />
        <OitFile name={'Sent'} uiService={this.props.uiService} disabled={true} />
        <OitFolder name={'Pre-flight'} initExpanded={true} hideFolderOpener={true}>
          <OitFile name={'INIT Data'} uiService={this.props.uiService} disabled={true} />
          <OitFolder name={'Requests'} initExpanded={false}>
            <OitFile name={'Weather'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'NOTAM'} uiService={this.props.uiService} disabled={true} />
          </OitFolder>
          <OitFolder name={'Reports'} initExpanded={false}>
            <OitFile name={'Fuel Figures'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Refuelling'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Loadsheet Acceptance'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Departure Delay'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Take Off Delay'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Delay Code'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Free Text'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'ASR Notification'} uiService={this.props.uiService} disabled={true} />
          </OitFolder>
          <OitFile
            name={'Flight Log'}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/company-com/pre-flight/flight-log"
          />
        </OitFolder>
        <OitFolder name={'In-flight'} initExpanded={true} hideFolderOpener={true}>
          <OitFolder name={'Requests'} initExpanded={false}>
            <OitFile name={'Weather'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Notam'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Ramp Service'} uiService={this.props.uiService} disabled={true} />
          </OitFolder>
          <OitFolder name={'Reports'} initExpanded={false}>
            <OitFile name={'Diversion'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'ETA'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Free Text'} uiService={this.props.uiService} disabled={true} />
          </OitFolder>
          <OitFile
            name={'Flight Log'}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/company-com/in-flight/flight-log"
          />
        </OitFolder>
        <OitFolder name={'Post-flight'} initExpanded={true} hideFolderOpener={true}>
          <OitFolder name={'Requests'} initExpanded={false}></OitFolder>
          <OitFolder name={'Reports'} initExpanded={false}>
            <OitFile name={'ASR Notification'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Flight Summary'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Free Text'} uiService={this.props.uiService} disabled={true} />
            <OitFile name={'Gate Delay'} uiService={this.props.uiService} disabled={true} />
          </OitFolder>
          <OitFile
            name={'Flight Log'}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/company-com/post-flight/flight-log"
          />
        </OitFolder>
      </>
    );
  }
}
