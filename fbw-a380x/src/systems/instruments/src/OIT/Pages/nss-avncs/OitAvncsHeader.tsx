//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { OitUiService } from '../../OitUiService';
import { OisDomain } from '../../OIT';

interface OitAvncsHeaderProps {
  readonly uiService: OitUiService;
  readonly avncsOrFltOps: Subscribable<OisDomain>;
}

/*
 * Complete header for the OIS system, both AVNCS and FLT OPS.
 */
export abstract class OitAvncsHeader extends DisplayComponent<OitAvncsHeaderProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

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
      <div class="oit-header-row">
        <Button
          label={'NSS AVNCS MENU'}
          onClick={() => this.props.uiService.navigateTo('avncs')}
          buttonStyle="width: 300px; font-size: 28px; height: 60px;"
        />
        <Button label={'MAXIMIZE'} onClick={() => {}} buttonStyle="width: 125px; font-size: 28px; height: 60px;" />
        <div class="oit-msg-header">0 MSG</div>
        <div class="oit-msg-box"></div>
        <IconButton
          icon={'flat-single-down'}
          containerStyle="width: 60px; height: 60px;"
          disabled={Subject.create(true)}
        />
        <Button
          label={'CLEAR'}
          onClick={() => {}}
          buttonStyle="font-size: 28px; height: 60px;"
          disabled={Subject.create(true)}
        />
        <div class="oit-msg-header">FLT NBR</div>
      </div>
    );
  }
}
