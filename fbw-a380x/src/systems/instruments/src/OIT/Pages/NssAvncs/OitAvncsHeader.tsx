//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { OitUiService } from '../../OitUiService';
import { OisDomain } from '../../OIT';
import { FmsData } from '@flybywiresim/fbw-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

interface OitAvncsHeaderProps {
  readonly bus: EventBus;
  readonly uiService: OitUiService;
  readonly avncsOrFltOps: Subscribable<OisDomain>;
}

/*
 * Complete header for the OIS system, both AVNCS and FLT OPS.
 */
export abstract class OitAvncsHeader extends DestroyableComponent<OitAvncsHeaderProps> {
  private readonly sub = this.props.bus.getSubscriber<FmsData>();

  // FIXME maybe this should come from the ATC/ATSU when it's integrated
  private readonly fltNumber = ConsumerSubject.create(this.sub.on('fmsFlightNumber'), null);
  private readonly fltNumberText = this.fltNumber.map((number) => (number ? number : ''));

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.fltNumber, this.fltNumberText);
  }

  render(): VNode {
    return (
      <div class="oit-header-row">
        <Button
          label={'NSS AVNCS MENU'}
          onClick={() => this.props.uiService.navigateTo('nss-avncs')}
          buttonStyle="width: 250px; font-size: 28px; height: 50px;"
        />
        <Button
          label={'MAXIMIZE'}
          onClick={() => {}}
          buttonStyle="width: 125px; font-size: 28px; height: 50px; margin-left: 5px;"
        />
        <div class="oit-msg-header" style="padding: 11px;">
          0 MSG
        </div>
        <div class="oit-msg-box"></div>
        <IconButton
          icon={'flat-single-down'}
          containerStyle="width: 60px; height: 50px; margin-left: 5px;"
          disabled={Subject.create(true)}
        />
        <Button
          label={'CLEAR'}
          onClick={() => {}}
          buttonStyle="font-size: 28px; height: 50px; margin-left: 15px;"
          disabled={Subject.create(true)}
        />
        <div class="oit-avncs-header-flt-nbr">{this.fltNumberText}</div>
      </div>
    );
  }
}
