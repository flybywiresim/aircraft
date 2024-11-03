//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { MouseCursor } from 'instruments/src/MFD/pages/common/MouseCursor';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';

import './style.scss';

export interface AtcMailboxProps {
  readonly bus: EventBus;
}

export class AtcMailbox extends DisplayComponent<AtcMailboxProps> {
  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly mouseCursorRef = FSComponent.createRef<MouseCursor>();

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.topRef.instance.addEventListener('mousemove', (ev) => {
      this.mouseCursorRef.getOrDefault()?.updatePosition(ev.clientX, ev.clientY - 768);
    });
  }

  render(): VNode | null {
    return (
      <CdsDisplayUnit bus={this.props.bus} displayUnitId={DisplayUnitID.Sd}>
        <div ref={this.topRef} class="atc-mailbox-top-layout">
          <div class="atc-mailbox-left-layout">
            <Button label="RECALL" onClick={() => {}} buttonStyle="height: 50px;"></Button>
          </div>
          <div class="atc-mailbox-center-layout">
            <div style="display: flex; flex: 8; border-bottom: 2px solid white;"></div>
            <div style="display: flex; flex: 1; flex-direction: row;">
              <div style="flex: 1; border-right: 2px solid white;" />
              <div style="flex: 1;" />
            </div>
          </div>
          <div class="atc-mailbox-right-layout">
            <Button label="CLOSE" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
            <Button label="PRINT" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
          </div>
          <MouseCursor side={Subject.create('CAPT')} ref={this.mouseCursorRef} />
        </div>
      </CdsDisplayUnit>
    );
  }
}
