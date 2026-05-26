//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ArraySubject, DisplayComponent, EventBus, FSComponent, MapSubject, Subject, VNode } from '@microsoft/msfs-sdk';
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
  CpdlcMessageMonitoringState,
} from '@datalink/common';

import './style.scss';

export class MailboxMessageBlock {
  public messages: CpdlcMessage[] = [];
  public timestamp: number = 0;
  public response: number = -1;
  public statusMessage: MailboxStatusMessage = MailboxStatusMessage.NoMessage;
  public messageVisible: Subject<boolean> = Subject.create<boolean>(false);
  public automaticCloseTimeout: Subject<number> = Subject.create<number>(-1);
  public semanticResponseIncomplete: boolean = false;
  public reachEndOfMessage: boolean = false;

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

  private readonly publisher = this.props.bus.getPublisher<AtsuMailboxMessages>();
  private readonly subs = this.props.bus.getSubscriber<AtsuMailboxMessages>();

  private messages: MapSubject<number, MailboxMessageBlock> = MapSubject.create<number, MailboxMessageBlock>();

  private messageIndex: Subject<number> = Subject.create<number>(-1);
  private messageReadComplete: Subject<boolean> = Subject.create(false);
  private visibleMessageSemanticResponseIncomplete: Subject<boolean> = Subject.create<boolean>(false);
  private visibleMessages: ArraySubject<CpdlcMessage> = ArraySubject.create();
  private visibleMessageStatus: Subject<MailboxStatusMessage> = Subject.create<MailboxStatusMessage>(
    MailboxStatusMessage.NoMessage,
  );
  private response: Subject<number> = Subject.create<number>(-1);

  private mailboxText = Subject.create<string>(
    'DEPART REQUEST\n FBW123\n FROM:WSSS GATE:A\n TO:YSSY ATIS:S\n A/C TYPE:A388',
  );

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

    if (enhancedMessages.length !== 0) {
      // check if incoming message already exist in messages
      const messageBlock = this.messages.getValue(enhancedMessages[0].UniqueMessageID);

      if (messageBlock !== undefined) {
        // update the communication states and reponses of the existing message
        // messageBlock.messages.set(enhancedMessages);
      } else {
        // store new message in messages
        const message = new MailboxMessageBlock();
        message.messages = enhancedMessages;
        if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
          message.statusMessage = MailboxStatusMessage.Monitoring;
        } else if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Cancelled) {
          message.statusMessage = MailboxStatusMessage.MonitoringCancelled;
        }
        this.messages.setValue(enhancedMessages[0].UniqueMessageID, message);
      }

      // TODO implement semantic response section

      // display message
      if (this.messages.size === 1) {
        const message = this.messages.getValue(enhancedMessages[0].UniqueMessageID);
        if (message) {
          message.messageVisible.set(true);
          this.messages.setValue(enhancedMessages[0].UniqueMessageID, message);
          this.publisher.pub('visibleMessage', message.messages[0].UniqueMessageID, true, false);
        }
      }
    }
  }

  private sendMessage(uid: number) {
    this.publisher.pub('downlinkTransmit', uid, true, false);
  }

  private sortedMessageArray(messages: MapSubject<number, MailboxMessageBlock>) {
    const arrMessages = Array.from(messages.get().values());
    arrMessages.sort((a, b) => a.timestamp - b.timestamp);
    return arrMessages;
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.topRef.instance.addEventListener('mousemove', this.onMouseMoveHandler);

    this.subs.on('cpdlcMessages').handle((messages: CpdlcMessage[]) => this.handleIncomingMessages(messages));
    this.subs.on('dclMessages').handle((messages: DclMessage[]) => this.handleIncomingMessages(messages));

    this.messages.sub((messages) => {
      if (messages.size === 0) return;

      // find the first visible message
      const arrMessages = this.sortedMessageArray(this.messages);
      this.messageIndex.set(arrMessages.findIndex((element) => element.messageVisible));

      if (this.messageIndex.get() !== -1) {
        this.response.set(arrMessages[this.messageIndex.get()].response);
        this.visibleMessages.set(arrMessages[this.messageIndex.get()].messages);
        this.messageReadComplete.set(arrMessages[this.messageIndex.get()].reachEndOfMessage);
        this.visibleMessageStatus.set(arrMessages[this.messageIndex.get()].statusMessage);
        this.visibleMessageSemanticResponseIncomplete.set(
          arrMessages[this.messageIndex.get()].semanticResponseIncomplete,
        );
      }

      // TODO: check for priority messages
    });
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
          <Button label="SEND" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
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
