// Copyright (c) 2024-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, EventBus, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import {
  AtsuMailboxMessages,
  AtsuMessageSerializationFormat,
  AtsuMessageType,
  Conversion,
  CpdlcMessage,
  DclMessage,
} from '@datalink/common';
import { Button } from '../MsfsAvionicsCommon/UiWidgets/Button';
import { IconButton } from '../MsfsAvionicsCommon/UiWidgets/IconButton';
import { MouseCursor } from '../MsfsAvionicsCommon/UiWidgets/MouseCursor';

import './style.scss';

export interface AtcMailboxProps {
  readonly bus: EventBus;
}

export class AtcMailbox extends DisplayComponent<AtcMailboxProps> {
  private readonly topRef = FSComponent.createRef<HTMLDivElement>();
  private readonly mouseCursorRef = FSComponent.createRef<MouseCursor>();
  private readonly publisher = this.props.bus.getPublisher<AtsuMailboxMessages>();
  private readonly subscriptions: Subscription[] = [];
  private readonly messages: CpdlcMessage[] = [];
  private readonly receivedAtById = new Map<number, string>();
  private readonly transmittedIds = new Set<number>();
  private readonly text = Subject.create('');
  private readonly station = Subject.create('');
  private readonly receivedAt = Subject.create('');
  private readonly position = Subject.create('');
  private readonly previousDisabled = Subject.create(true);
  private readonly nextDisabled = Subject.create(true);
  private readonly sendDisabled = Subject.create(true);
  private currentIndex = 0;

  private readonly onMouseMove = (event: MouseEvent): void => {
    this.mouseCursorRef.getOrDefault()?.updatePosition(event.clientX, event.clientY - 768);
  };

  private showCurrentMessage(): void {
    const message = this.messages[this.currentIndex];
    if (!message) {
      this.text.set('');
      this.station.set('');
      this.receivedAt.set('');
      this.position.set('');
      this.sendDisabled.set(true);
      return;
    }
    this.text.set(message.serialize(AtsuMessageSerializationFormat.Mailbox));
    this.station.set(message.Station ?? '');
    this.receivedAt.set(this.receivedAtById.get(message.UniqueMessageID) ?? '');
    this.position.set(`${this.currentIndex + 1}/${this.messages.length}`);
    this.previousDisabled.set(this.currentIndex === 0);
    this.nextDisabled.set(this.currentIndex >= this.messages.length - 1);
    this.sendDisabled.set(message.Type !== AtsuMessageType.DCL || this.transmittedIds.has(message.UniqueMessageID));
    this.publisher.pub('visibleMessage', message.UniqueMessageID, true, false);
  }

  private receiveMessages(messages: CpdlcMessage[] | DclMessage[]): void {
    for (const data of messages) {
      const message = Conversion.messageDataToMessage(data) as CpdlcMessage;
      const index = this.messages.findIndex((entry) => entry.UniqueMessageID === message.UniqueMessageID);
      if (index >= 0) {
        this.messages[index] = message;
      } else {
        this.messages.push(message);
        this.currentIndex = this.messages.length - 1;
        this.receivedAtById.set(message.UniqueMessageID, `${new Date().toISOString().slice(11, 16)}Z`);
      }
    }
    this.showCurrentMessage();
  }

  private transmitCurrentMessage(): void {
    const message = this.messages[this.currentIndex];
    if (!message || message.Type !== AtsuMessageType.DCL || this.transmittedIds.has(message.UniqueMessageID)) return;
    this.publisher.pub('downlinkTransmit', message.UniqueMessageID, true, false);
    this.transmittedIds.add(message.UniqueMessageID);
    this.sendDisabled.set(true);
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.topRef.instance.addEventListener('mousemove', this.onMouseMove);
    const subscriber = this.props.bus.getSubscriber<AtsuMailboxMessages>();
    this.subscriptions.push(
      subscriber.on('cpdlcMessages').handle((messages) => this.receiveMessages(messages)),
      subscriber.on('dclMessages').handle((messages) => this.receiveMessages(messages)),
    );
  }

  public destroy(): void {
    this.subscriptions.forEach((subscription) => subscription.destroy());
    this.topRef.getOrDefault()?.removeEventListener('mousemove', this.onMouseMove);
    this.mouseCursorRef.getOrDefault()?.destroy();
    super.destroy();
  }

  public render(): VNode {
    return (
      <div ref={this.topRef} class="atc-mailbox-top-layout">
        <div class="atc-mailbox-left-layout" />
        <div class="atc-mailbox-center-layout">
          <div class="atc-mailbox-center-top">
            <div class="atc-mailbox-msg-status atc-mailbox-text">
              <span>{this.receivedAt}</span>
              <span>{this.station}</span>
              <span class="status-msg status-open">{this.position}</span>
            </div>
            <div class="atc-mailbox-msg-area">
              <div class="atc-mailbox-msg-body atc-mailbox-text">{this.text}</div>
              <div class="atc-mailbox-msg-pg-number-indication">
                <IconButton
                  icon="double-up"
                  disabled={this.previousDisabled}
                  onClick={() => {
                    this.currentIndex -= 1;
                    this.showCurrentMessage();
                  }}
                  containerStyle="width: 70px; height: 40px; padding: 4px;"
                />
                <IconButton
                  icon="double-down"
                  disabled={this.nextDisabled}
                  onClick={() => {
                    this.currentIndex += 1;
                    this.showCurrentMessage();
                  }}
                  containerStyle="width: 70px; height: 40px; padding: 4px;"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="atc-mailbox-right-layout">
          <Button
            label="SEND"
            disabled={this.sendDisabled}
            onClick={() => this.transmitCurrentMessage()}
            buttonStyle="height: 50px; justify-content: flex-end;"
          />
        </div>
        <MouseCursor side={Subject.create('CAPT')} ref={this.mouseCursorRef} />
      </div>
    );
  }
}
