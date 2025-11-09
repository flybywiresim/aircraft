//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { OitFile, OitFolder } from '../OitAvncsFolderNavigator';
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
        <OitFolder name={'AUTO FLT'} initExpanded={true}>
          <OitFile
            name={'App & Ldg Capability'}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/a380x-systems/app-ldg-cap"
          />
        </OitFolder>
        <OitFolder name={'CDS / FWS'} initExpanded={true}>
          <OitFile
            name={'FWS Debug'}
            uiService={this.props.uiService}
            navigationTarget="nss-avncs/a380x-systems/debug-data"
          />
        </OitFolder>
      </>
    );
  }
}
