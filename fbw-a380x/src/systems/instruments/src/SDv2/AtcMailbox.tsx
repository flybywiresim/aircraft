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

import {
  MailboxAction,
  MailboxActionLabel,
  mailboxActions,
  MailboxResponseId,
  mailboxResponseText,
  sentResponseId,
} from './AtcMailboxActions';

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

/** Number of soft keys on the right side of the mailbox which are used for the message actions */
const ACTION_SOFT_KEYS = 4;

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

  /** Actions assigned to the soft keys on the right side, from top to bottom */
  private readonly actionSlots = Array.from({ length: ACTION_SOFT_KEYS }, () =>
    Subject.create<MailboxAction | null>(null),
  );

  private readonly actionsBlocked = Subject.create(true);

  /** Response selected or sent for the visible uplink message */
  private readonly responseText = Subject.create<string>('');

  /** True if the response is selected but not sent yet */
  private readonly responsePending = Subject.create(false);

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
      // the selected response is now part of the message
      if (messageBlock.response !== -1 && sentResponseId(enhancedMessages[0]) === messageBlock.response) {
        messageBlock.response = -1;
      }
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
      this.updateActions(undefined, -1, MailboxStatusMessage.NoMessage);
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
    this.updateActions(message, block.response, block.statusMessage);
  }

  private updateActions(
    message: CpdlcMessage | undefined,
    selectedResponse: number,
    status: MailboxStatusMessage,
  ): void {
    const { actions, blocked } = mailboxActions(message, selectedResponse, status);
    this.actionSlots.forEach((slot, index) => slot.set(actions[index] ?? null));
    this.actionsBlocked.set(blocked);

    if (message === undefined || message.Direction !== AtsuMessageDirection.Uplink) {
      this.responseText.set('');
      this.responsePending.set(false);
    } else if (selectedResponse !== -1) {
      this.responseText.set(mailboxResponseText(selectedResponse));
      this.responsePending.set(true);
    } else {
      this.responseText.set(mailboxResponseText(sentResponseId(message)));
      this.responsePending.set(false);
    }
  }

  private onAction(slot: number): void {
    const action = this.actionSlots[slot].get();
    const uid = this.visibleMessageId.get();
    const block = this.messages.getValue(uid);
    if (action === null || block === undefined || this.actionsBlocked.get()) {
      return;
    }

    switch (action) {
      case MailboxAction.Send:
        if (block.messages[0].Direction === AtsuMessageDirection.Downlink) {
          this.publisher.pub('downlinkTransmit', uid, true, false);
        } else if (block.response !== -1) {
          this.publisher.pub('uplinkResponse', { uid, responseId: block.response }, true, false);
        }
        break;
      case MailboxAction.Cancel:
        block.response = -1;
        this.updateVisibleMessage();
        break;
      case MailboxAction.Close:
        this.closeMessage(uid);
        break;
      default: {
        const responseId = MailboxResponseId[action];
        if (responseId !== undefined) {
          block.response = responseId;
          this.publisher.pub('readMessage', uid, true, false);
          this.updateVisibleMessage();
        }
        break;
      }
    }
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
            <div class="atc-mailbox-cb-1 atc-mailbox-text atc-mailbox-response">
              <span class={this.responsePending.map((pending) => (pending ? 'response-pending' : 'response-sent'))}>
                {this.responseText}
              </span>
            </div>
            <div class="atc-mailbox-cb-2" />
          </div>
        </div>
        <div class="atc-mailbox-right-layout">
          {this.actionSlots.map((slot, index) => (
            <Button
              label={slot.map((action) => (action === null ? '' : MailboxActionLabel[action]))}
              visible={slot.map((action) => action !== null)}
              disabled={this.actionsBlocked}
              onClick={() => this.onAction(index)}
              buttonStyle="height: 50px; justify-content: flex-end;"
            ></Button>
          ))}
          <Button label="PRINT" onClick={() => {}} buttonStyle="height: 50px; justify-content: flex-end;"></Button>
        </div>
        <MouseCursor side={Subject.create('CAPT')} ref={this.mouseCursorRef} />
      </div>
    );
  }
}
