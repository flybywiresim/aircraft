//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FSComponent, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { OitUiService } from '../../OitUiService';
import { OisDomain } from '../../OIT';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';

interface OitAvncsFooterProps {
  readonly uiService: OitUiService;
  readonly avncsOrFltOps: Subscribable<OisDomain>;
}

/*
 * Complete header for the ATCCOM system
 */
export abstract class OitAvncsFooter extends DestroyableComponent<OitAvncsFooterProps> {
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <div class="oit-header-row">
        <Button
          label={'COMPANY COM'}
          onClick={() => this.props.uiService.navigateTo('nss-avncs/company-com')}
          buttonStyle="width: 225px; font-size: 28px; height: 50px;"
        />
        <div style="flex-grow: 1" />
      </div>
    );
  }
}
