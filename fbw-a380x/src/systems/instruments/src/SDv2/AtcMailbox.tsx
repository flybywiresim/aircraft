//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ArraySubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { Button } from '../MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from '../MsfsAvionicsCommon/UiWidgets/IconButton';
import { MouseCursor } from '../MsfsAvionicsCommon/UiWidgets/MouseCursor';
import {
  AtsuMailboxMessages,
  CpdlcMessage,
  Conversion,
  DclMessage,
  MailboxStatusMessage,
  AtsuMessageSerializationFormat,
} from '@datalink/common';

import './style.scss';

export class MailboxMessageBlock {
  public readonly messages: ArraySubject<CpdlcMessage> = ArraySubject.create();
  public readonly timestamp: number = 0;
  public readonly response: Subject<number> = Subject.create<number>(-1);
  public readonly statusMessage: MailboxStatusMessage = MailboxStatusMessage.NoMessage;
  public readonly messageVisible: Subscribable<boolean> = Subject.create<boolean>(false);
  public readonly automaticCloseTimeout: Subject<number> = Subject.create<number>(-1);
  public readonly semanticResponseIncomplete: Subscribable<boolean> = Subject.create<boolean>(false);
  public readonly reachEndOfMessage: Subscribable<boolean> = Subject.create<boolean>(false);

  constructor() {
    this.timestamp = new Date().getTime();
  }
}

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

  private readonly subs = this.props.bus.getSubscriber<AtsuMailboxMessages>();

  private readonly messageRef = FSComponent.createRef<HTMLSpanElement>();

  private mailboxText = Subject.create<string>(
    'DEPART REQUEST\n FBW123\n FROM:WSSS GATE:A\n TO:YSSY ATIS:S\n A/C TYPE:A388',
  );

  private messageArray = ArraySubject.create<MailboxMessageBlock>([]);

  private handleIncomingMessages(cpdlcMessages: CpdlcMessage[]): void {
    console.log('message received');
    console.log(cpdlcMessages);

    // convert messages to enhanced format
    const enhancedMessages: CpdlcMessage[] = [];
    cpdlcMessages.forEach((message) => {
      enhancedMessages.push(Conversion.messageDataToMessage(message) as CpdlcMessage);
      console.log(enhancedMessages[0].serialize(AtsuMessageSerializationFormat.Mailbox));
      this.mailboxText.set(enhancedMessages[0].serialize(AtsuMessageSerializationFormat.Mailbox));
    });
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.topRef.instance.addEventListener('mousemove', this.onMouseMoveHandler);

    this.subs.on('cpdlcMessages').handle((messages: CpdlcMessage[]) => this.handleIncomingMessages(messages));
    this.subs.on('dclMessages').handle((messages: DclMessage[]) => this.handleIncomingMessages(messages));
  }

  destroy(): void {
    this.topRef.getOrDefault()?.removeEventListener('mousemove', this.onMouseMoveHandler);
    this.mouseCursorRef.getOrDefault()?.destroy();

    super.destroy();
  }

  render(): VNode | null {
    return (
      <div ref={this.topRef} class="atc-mailbox-top-layout">
        <div class="atc-mailbox-left-layout">
          <Button label="PRINT" onClick={() => {}} buttonStyle="height: 50px;"></Button>
          <Button label="RECALL" onClick={() => {}} buttonStyle="height: 50px;"></Button>
        </div>
        <div class="atc-mailbox-center-layout">
          <div class="atc-mailbox-center-top">
            <div class="atc-mailbox-msg-status atc-mailbox-text">
              <span>1150Z</span>
              <span>FROM LFBO CTL</span>
              <span class="status-msg status-open">OPEN</span>
            </div>
            <div class="atc-mailbox-msg-area">
              <div class="atc-mailbox-msg-body atc-mailbox-text">{this.mailboxText}</div>
              <div class="atc-mailbox-msg-pg-number-indication">
                <IconButton
                  icon="double-up"
                  onClick={() => {}}
                  // disabled={this.isCurrentMsgFirstPage}
                  containerStyle="width: 70px; height: 40px; padding:4px"
                />
                <IconButton
                  icon="double-down"
                  onClick={() => {}}
                  // disabled={this.isCurrentMsgLastPage}
                  containerStyle="width: 70px; height: 40px; padding:4px"
                />
              </div>
            </div>
          </div>
          <div class="atc-mailbox-center-bottom">
            <div class="atc-mailbox-cb-1" />
            <div class="atc-mailbox-cb-2" />
          </div>
        </div>
        <div class="atc-mailbox-right-layout">
          <Button label="CLOSE" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
          <Button label="STANBY" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
          <Button label="UNABLE" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
          <Button label="LOAD SEC3" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
          <Button label="PRINT" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
        </div>
        <MouseCursor side={Subject.create('CAPT')} ref={this.mouseCursorRef} />
      </div>
    );
  }
}
