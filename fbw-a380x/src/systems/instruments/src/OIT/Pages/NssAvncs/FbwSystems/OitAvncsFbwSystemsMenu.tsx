//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { OitFile } from '../OitAvncsFolderNavigator';
import { OitUiService } from '../../../OitUiService';

interface OitAvncsFbwSystemsMenuProps {
  readonly bus: EventBus;
  readonly uiService: OitUiService;
}

export class OitAvncsFbwSystemsMenu extends DestroyableComponent<OitAvncsFbwSystemsMenuProps> {
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <OitFile
          name={'App & Ldg Capability'}
          uiService={this.props.uiService}
          navigationTarget="nss-avncs/fbw-systems/app-ldg-cap"
        />
        <OitFile
          name={'FWS Debug'}
          uiService={this.props.uiService}
          navigationTarget="nss-avncs/fbw-systems/debug-data"
        />
      </>
    );
  }
}
