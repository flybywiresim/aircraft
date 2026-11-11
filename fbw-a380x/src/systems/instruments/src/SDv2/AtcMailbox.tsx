//  Copyright (c) 2024-2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ArraySubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MapSubject,
  MappedSubject,
  Subject,
  Subscription,
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
  CpdlcMessageMonitoringState,
  AtsuMessageDirection,
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

/** Time after which a successfully sent downlink message is closed automatically, in milliseconds */
const SENT_MESSAGE_CLOSE_DELAY_MS = 5000;

/**
 * Converts a mailbox status into the text shown in the status field of the mailbox
 * @param status the status of the visible message
 * @param direction the direction of the visible message
 * @returns the status text
 */
function mailboxStatusText(status: MailboxStatusMessage, direction: AtsuMessageDirection | null): string {
  switch (status) {
    case MailboxStatusMessage.Sending:
      return 'SENDING';
    case MailboxStatusMessage.Sent:
      return 'SENT';
    case MailboxStatusMessage.SendFailed:
      return 'SEND FAILED';
    case MailboxStatusMessage.CommunicationNotAvailable:
      return 'COM NOT AVAIL';
    case MailboxStatusMessage.CommunicationFault:
      return 'COM FAULT';
    case MailboxStatusMessage.NoAtcReply:
      return 'NO ATC REPLY';
    case MailboxStatusMessage.Printing:
      return 'PRINTING';
    case MailboxStatusMessage.Monitoring:
      return 'MONITORING';
    case MailboxStatusMessage.MonitoringCancelled:
      return 'MONIT CANCELLED';
    case MailboxStatusMessage.MaximumDownlinkMessages:
      return 'MAILBOX FULL';
    default:
      return direction === AtsuMessageDirection.Uplink ? 'OPEN' : 'NOT SENT';
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

  private readonly subscriptions: Subscription[] = [];

  private messages: MapSubject<number, MailboxMessageBlock> = MapSubject.create<number, MailboxMessageBlock>();

  /** UID of the message block shown in the mailbox, -1 if none */
  private readonly visibleMessageId = Subject.create<number>(-1);

  private messageIndex: Subject<number> = Subject.create<number>(-1);
  private messageReadComplete: Subject<boolean> = Subject.create(false);
  private visibleMessageSemanticResponseIncomplete: Subject<boolean> = Subject.create<boolean>(false);
  private visibleMessages: ArraySubject<CpdlcMessage> = ArraySubject.create();
  private visibleMessageStatus: Subject<MailboxStatusMessage> = Subject.create<MailboxStatusMessage>(
    MailboxStatusMessage.NoMessage,
  );
  private readonly visibleMessageDirection = Subject.create<AtsuMessageDirection | null>(null);
  private response: Subject<number> = Subject.create<number>(-1);

  private readonly mailboxText = Subject.create<string>('');
  private readonly mailboxTimestamp = Subject.create<string>('');
  private readonly mailboxStation = Subject.create<string>('');

  private readonly mailboxStatusText = MappedSubject.create(
    ([status, direction]) => (direction === null ? '' : mailboxStatusText(status, direction)),
    this.visibleMessageStatus,
    this.visibleMessageDirection,
  );

  private readonly mailboxStatusClass = MappedSubject.create(
    ([status]) =>
      status !== MailboxStatusMessage.NoMessage && status <= MailboxStatusMessage.SendFailed
        ? 'status-msg status-alert'
        : 'status-msg status-open',
    this.visibleMessageStatus,
  );

  /** SEND is only possible for a downlink message which was not transmitted yet */
  private readonly sendDisabled = MappedSubject.create(
    ([id, direction, status]) =>
      id === -1 ||
      direction !== AtsuMessageDirection.Downlink ||
      status === MailboxStatusMessage.Sending ||
      status === MailboxStatusMessage.Sent,
    this.visibleMessageId,
    this.visibleMessageDirection,
    this.visibleMessageStatus,
  );

  private handleIncomingMessages(cpdlcMessages: CpdlcMessage[]): void {
    // convert messages to enhanced format
    const enhancedMessages: CpdlcMessage[] = cpdlcMessages.map(
      (message) => Conversion.messageDataToMessage(message) as CpdlcMessage,
    );

    if (enhancedMessages.length === 0) {
      return;
    }

    const uid = enhancedMessages[0].UniqueMessageID;
    const messageBlock = this.messages.getValue(uid);

    if (messageBlock !== undefined) {
      // update the content of the existing message, the status is handled by the messageStatus event
      messageBlock.messages = enhancedMessages;
      this.messages.setValue(uid, messageBlock);
    } else {
      // store new message in messages
      const message = new MailboxMessageBlock();
      message.messages = enhancedMessages;
      if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
        message.statusMessage = MailboxStatusMessage.Monitoring;
      } else if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Cancelled) {
        message.statusMessage = MailboxStatusMessage.MonitoringCancelled;
      }
      this.messages.setValue(uid, message);

      // TODO implement semantic response section
      // TODO: check for priority messages

      // a newly transferred or received message is shown immediately
      this.showMessage(uid);
    }

    if (this.visibleMessageId.get() === uid) {
      this.updateVisibleMessage();
    }
  }

  private handleMessageStatus(uid: number, status: MailboxStatusMessage): void {
    const messageBlock = this.messages.getValue(uid);
    if (messageBlock === undefined) {
      return;
    }

    messageBlock.statusMessage = status;
    this.messages.setValue(uid, messageBlock);

    if (this.visibleMessageId.get() === uid) {
      this.updateVisibleMessage();
    }

    if (status === MailboxStatusMessage.Sent && messageBlock.messages[0]?.Direction === AtsuMessageDirection.Downlink) {
      messageBlock.automaticCloseTimeout.set(
        window.setTimeout(() => this.closeMessage(uid), SENT_MESSAGE_CLOSE_DELAY_MS),
      );
    }
  }

  private showMessage(uid: number): void {
    const previous = this.messages.getValue(this.visibleMessageId.get());
    previous?.messageVisible.set(false);

    const message = this.messages.getValue(uid);
    if (message === undefined) {
      this.visibleMessageId.set(-1);
      this.updateVisibleMessage();
      this.publisher.pub('visibleMessage', -1, true, false);
      return;
    }

    message.messageVisible.set(true);
    this.visibleMessageId.set(uid);
    this.updateVisibleMessage();
    this.publisher.pub('visibleMessage', uid, true, false);
  }

  private updateVisibleMessage(): void {
    const block = this.messages.getValue(this.visibleMessageId.get());

    if (block === undefined || block.messages.length === 0) {
      this.messageIndex.set(-1);
      this.visibleMessages.clear();
      this.mailboxText.set('');
      this.mailboxTimestamp.set('');
      this.mailboxStation.set('');
      this.visibleMessageDirection.set(null);
      this.visibleMessageStatus.set(MailboxStatusMessage.NoMessage);
      return;
    }

    const message = block.messages[0];
    this.messageIndex.set(this.sortedMessageArray(this.messages).indexOf(block));
    this.response.set(block.response);
    this.visibleMessages.set(block.messages);
    this.messageReadComplete.set(block.reachEndOfMessage);
    this.visibleMessageSemanticResponseIncomplete.set(block.semanticResponseIncomplete);

    this.mailboxText.set(
      block.messages.map((elem) => elem.serialize(AtsuMessageSerializationFormat.Mailbox)).join('\n'),
    );
    this.mailboxTimestamp.set(message.Timestamp?.mailboxTimestamp() ?? '');
    this.mailboxStation.set(`${message.Direction === AtsuMessageDirection.Uplink ? 'FROM' : 'TO'} ${message.Station}`);
    this.visibleMessageDirection.set(message.Direction);
    this.visibleMessageStatus.set(block.statusMessage);
  }

  private sendMessage(): void {
    const uid = this.visibleMessageId.get();
    if (this.sendDisabled.get() || uid === -1) {
      return;
    }

    this.publisher.pub('downlinkTransmit', uid, true, false);
  }

  private closeMessage(uid: number): void {
    const block = this.messages.getValue(uid);
    if (block === undefined) {
      return;
    }

    if (block.automaticCloseTimeout.get() !== -1) {
      window.clearTimeout(block.automaticCloseTimeout.get());
    }

    this.messages.delete(uid);
    this.publisher.pub('closeMessage', uid, true, false);

    if (this.visibleMessageId.get() === uid) {
      // show the oldest remaining message, if any
      const remaining = this.sortedMessageArray(this.messages);
      this.showMessage(remaining.length !== 0 ? remaining[0].messages[0].UniqueMessageID : -1);
    }
  }

  private sortedMessageArray(messages: MapSubject<number, MailboxMessageBlock>) {
    const arrMessages = Array.from(messages.get().values());
    arrMessages.sort((a, b) => a.timestamp - b.timestamp);
    return arrMessages;
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.topRef.instance.addEventListener('mousemove', this.onMouseMoveHandler);

    this.subscriptions.push(
      this.subs.on('cpdlcMessages').handle((messages: CpdlcMessage[]) => this.handleIncomingMessages(messages)),
      this.subs.on('dclMessages').handle((messages: DclMessage[]) => this.handleIncomingMessages(messages)),
      this.subs.on('messageStatus').handle((data) => this.handleMessageStatus(data.uid, data.status)),
      this.subs.on('resetSystem').handle(() => {
        this.messages.get().forEach((block) => {
          if (block.automaticCloseTimeout.get() !== -1) {
            window.clearTimeout(block.automaticCloseTimeout.get());
          }
        });
        this.messages.clear();
        this.showMessage(-1);
      }),
    );
  }

  destroy(): void {
    this.topRef.getOrDefault()?.removeEventListener('mousemove', this.onMouseMoveHandler);
    this.mouseCursorRef.getOrDefault()?.destroy();
    this.subscriptions.forEach((sub) => sub.destroy());
    this.mailboxStatusText.destroy();
    this.mailboxStatusClass.destroy();
    this.sendDisabled.destroy();

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
              <span>{this.mailboxTimestamp}</span>
              <span style="margin-left: 15px;">{this.mailboxStation}</span>
              <span class={this.mailboxStatusClass}>{this.mailboxStatusText}</span>
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
          <Button
            label="SEND"
            disabled={this.sendDisabled}
            onClick={() => this.sendMessage()}
            buttonStyle="height: 50px; justify-content: flex-end;"
          ></Button>
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
