//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { PermanentData } from './StatusArea';
import { AtcMailbox } from './AtcMailbox';

import './style.scss';
import '../index.scss';

export interface SDProps {
  readonly bus: EventBus;
}

export class SD extends DisplayComponent<SDProps> {
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  destroy(): void {
    super.destroy();
  }

  render(): VNode | null {
    return (
      <CdsDisplayUnit bus={this.props.bus} displayUnitId={DisplayUnitID.Sd}>
        <div class="sd-content-area-layout"></div>
        <PermanentData bus={this.props.bus} />
        <AtcMailbox bus={this.props.bus} />
      </CdsDisplayUnit>
    );
  }
}
