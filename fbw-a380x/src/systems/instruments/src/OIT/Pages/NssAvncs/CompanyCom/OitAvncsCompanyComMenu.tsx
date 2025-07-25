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

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <OitFile name={Subject.create('Inbox (0)')} uiService={this.props.uiService} />
        <OitFile name={Subject.create('Outbox (0)')} uiService={this.props.uiService} />
        <OitFile name={Subject.create('Sent')} uiService={this.props.uiService} />
        <OitFolder name={Subject.create('Pre-flight')} initExpanded={true} hideFolderOpener={true}>
          <OitFile name={Subject.create('INIT Data')} uiService={this.props.uiService} />
          <OitFolder name={Subject.create('Requests')} initExpanded={false}>
            <OitFile name={Subject.create('Weather')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('NOTAM')} uiService={this.props.uiService} />
          </OitFolder>
          <OitFolder name={Subject.create('Reports')} initExpanded={false}>
            <OitFile name={Subject.create('Fuel Figures')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Refuelling')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Loadsheet Acceptance')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Departure Delay')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Take Off Delay')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Delay Code')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Free Text')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('ASR Notification')} uiService={this.props.uiService} />
          </OitFolder>
          <OitFile
            name={Subject.create('Flight Log')}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/company-com/pre-flight/flight-log"
          />
        </OitFolder>
        <OitFolder name={Subject.create('In-flight')} initExpanded={true} hideFolderOpener={true}>
          <OitFolder name={Subject.create('Requests')} initExpanded={false}>
            <OitFile name={Subject.create('Weather')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Notam')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Ramp Service')} uiService={this.props.uiService} />
          </OitFolder>
          <OitFolder name={Subject.create('Reports')} initExpanded={false}>
            <OitFile name={Subject.create('Diversion')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('ETA')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Free Text')} uiService={this.props.uiService} />
          </OitFolder>
          <OitFile
            name={Subject.create('Flight Log')}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/company-com/in-flight/flight-log"
          />
        </OitFolder>
        <OitFolder name={Subject.create('Post-flight')} initExpanded={true} hideFolderOpener={true}>
          <OitFolder name={Subject.create('Requests')} initExpanded={false}></OitFolder>
          <OitFolder name={Subject.create('Reports')} initExpanded={false}>
            <OitFile name={Subject.create('ASR Notification')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Flight Summary')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Free Text')} uiService={this.props.uiService} />
            <OitFile name={Subject.create('Gate Delay')} uiService={this.props.uiService} />
          </OitFolder>
          <OitFile
            name={Subject.create('Flight Log')}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/company-com/post-flight/flight-log"
          />
        </OitFolder>
      </>
    );
  }
}
