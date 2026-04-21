//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ArraySubject, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { AbstractOitAvncsPageProps } from '../../../OIT';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { OitSimvars } from '../../../OitSimvarPublisher';
import { AnsuOps } from '../../../System/AnsuOps';

interface OitAvncsCompanyComInboxProps extends AbstractOitAvncsPageProps {}

export interface OitAvncsCompanyComMessages {
  read: Subscribable<boolean>;
  subject: string;
  message: string;
  date: number;
}

export abstract class OitAvncsCompanyComInbox extends DestroyableComponent<OitAvncsCompanyComInboxProps> {
  private readonly sci = this.props.container.ansu.sci;

  private readonly sub = this.props.bus.getSubscriber<OitSimvars>();

  private readonly messageContainerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly messages = ArraySubject.create<OitAvncsCompanyComMessages>([
    {
      read: Subject.create(true),
      subject: 'FBW A380X TEST MESSAGE',
      message:
        'This is a test message for the inbox. As soon as the communication backend is implemented, this will be replaced by real messages.',
      date: Date.now(),
    },
    {
      read: Subject.create(true),
      subject: 'FBW A380X TEST MESSAGE',
      message:
        'This is a test message for the inbox. As soon as the communication backend is implemented, this will be replaced by real messages.',
      date: Date.now(),
    },
  ]);

  private readonly toText = this.sci.fltNumber.map((fltNumber) => (fltNumber ? `To : ${fltNumber}` : 'To : <unknown>'));
  private readonly subjectText = Subject.create('Subject : FBW A380X TEST MESSAGE');
  private readonly dateText = Subject.create(AnsuOps.formatDateTime(Date.now()));

  private readonly messageText = Subject.create(
    'This is a test message for the inbox. As soon as the communication backend is implemented, this will be replaced by real messages.',
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.toText);
  }

  destroy(): void {
    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div class="oit-ccom-headline">Inbox</div>
        <div class="oit-ccom-inbox-msg-table">
          <div class="fr ass">
            <div class="oit-ccom-inbox-msg-table-header oit-table-ib w5"></div>
            <div class="oit-ccom-inbox-msg-table-header oit-table-ib f1">Subject</div>
            <div class="oit-ccom-inbox-msg-table-header oit-table-ib w15">Date</div>
          </div>
          <div ref={this.messageContainerRef}>
            {this.messages.getArray().map((message, index) => (
              <OitAvncsCompanyComMessageLine
                date={message.date}
                subject={message.subject}
                read={message.read}
                selected={Subject.create(index === 0)}
              />
            ))}
          </div>
          <div style="flex-grow: 1" />
        </div>
        <div class="oit-ccom-inbox-msg-details">
          <div>Message is read</div>
          <div />
          <div style="text-align: right;">{this.dateText}</div>
          <div>{this.toText}</div>
          <div>{this.subjectText}</div>
          <div />
        </div>
        <div class="oit-ccom-inbox-msg-box">{this.messageText}</div>
        <div style="flex-grow: 1" />
      </>
    );
  }
}

interface OitAvncsCompanyComMessageLineProps {
  readonly read: Subscribable<boolean>;
  readonly subject: string;
  readonly date: number;
  readonly selected: Subscribable<boolean>;
  readonly onClick?: () => void;
}

export class OitAvncsCompanyComMessageLine extends DestroyableComponent<OitAvncsCompanyComMessageLineProps> {
  private readonly refs = [
    FSComponent.createRef<HTMLDivElement>(),
    FSComponent.createRef<HTMLDivElement>(),
    FSComponent.createRef<HTMLDivElement>(),
  ];

  private onClickHandler = this.props.onClick?.bind(this);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    for (const ref of this.refs) {
      if (this.onClickHandler) {
        ref.instance.addEventListener('click', this.onClickHandler);
      }
    }
  }

  render(): VNode {
    return (
      <div class="fr ass">
        <div class={{ 'oit-ccom-inbox-msg-table-line': true, tc: true, w5: true, selected: this.props.selected }}>
          ✉️
        </div>
        <div
          class={{
            'oit-ccom-inbox-msg-table-line': true,
            'oit-green-text': true,
            f1: true,
            selected: this.props.selected,
          }}
        >
          {this.props.subject}
        </div>
        <div
          class={{
            'oit-ccom-inbox-msg-table-line': true,
            'oit-green-text': true,
            w15: true,
            selected: this.props.selected,
          }}
        >
          {AnsuOps.formatDateTime(this.props.date)}
        </div>
      </div>
    );
  }
}
