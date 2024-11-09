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

  private onMouseMove(ev: MouseEvent) {
    this.mouseCursorRef.getOrDefault()?.updatePosition(ev.clientX, ev.clientY - 768);
  }

  private onMouseMoveHandler = this.onMouseMove.bind(this);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.topRef.instance.addEventListener('mousemove', this.onMouseMoveHandler);
  }

  destroy(): void {
    this.topRef.getOrDefault()?.removeEventListener('mousemove', this.onMouseMoveHandler);

    super.destroy();
  }

  render(): VNode | null {
    return (
      <CdsDisplayUnit bus={this.props.bus} displayUnitId={DisplayUnitID.Sd}>
        <div ref={this.topRef} class="atc-mailbox-top-layout">
          <div class="atc-mailbox-left-layout">
            <Button label="RECALL" onClick={() => {}} buttonStyle="height: 50px;"></Button>
          </div>
          <div class="atc-mailbox-center-layout">
            <div class="atc-mailbox-center-top"></div>
            <div class="atc-mailbox-center-bottom">
              <div class="atc-mailbox-cb-1" />
              <div class="atc-mailbox-cb-2" />
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
