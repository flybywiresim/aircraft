// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, HEvent, MappedSubject, Subject } from '@microsoft/msfs-sdk';
import { KeypadEvents, SystemKeys } from './KeypadController';
import { TransponderEvents } from 'instruments/src/RMP/Data/TransponderPublisher';

export interface RmpMessageControlEvents {
  rmp_message_set: string;
  rmp_message_clear_message: string;
  rmp_message_set_squawk_message: boolean;
}

export interface RmpMessageDataEvents {
  rmp_message: string;
}

export class RmpMessageManager {
  private readonly sub = this.bus.getSubscriber<HEvent & KeypadEvents & RmpMessageControlEvents & TransponderEvents>();
  private readonly pub = this.bus.getPublisher<RmpMessageDataEvents>();

  private readonly squawkMessageEnabled = ConsumerSubject.create(this.sub.on('rmp_message_set_squawk_message'), false);
  private readonly squawkCode = ConsumerSubject.create(this.sub.on('transponder_code_1'), 0);
  private readonly squawkAuto = ConsumerSubject.create(this.sub.on('transponder_auto_1'), false);
  private readonly squawkMessage = MappedSubject.create(
    ([code, auto, enabled]) =>
      enabled ? `SQUAWK : ${code.toString(16).padStart(4, '0')}${auto ? '' : ' - STBY'}` : '',
    this.squawkCode,
    this.squawkAuto,
    this.squawkMessageEnabled,
  );

  private readonly displayedMessage = Subject.create('');
  private isBackgroundDisplayed = true;

  private readonly clearEvent = `RMP_${this.rmpIndex}_MSG_CLR_PRESSED`;

  constructor(
    private readonly bus: EventBus,
    private readonly rmpIndex: 1 | 2 | 3,
  ) {
    this.sub.on('rmp_message_set').handle((msg) => {
      this.isBackgroundDisplayed = false;
      this.displayedMessage.set(msg);
    });
    this.sub.on('rmp_message_clear_message').handle((msg) => {
      if (this.displayedMessage.get() === msg) {
        this.clearMessage();
      }
    });
    this.squawkMessage.sub((msg) => {
      if (this.isBackgroundDisplayed) {
        this.displayedMessage.set(msg);
      }
    });

    this.sub.on('keypad_system_key_pressed').handle((k) => {
      if (k === SystemKeys.MessageClear) {
        this.clearMessage();
      }
    });

    this.displayedMessage.sub((v) => this.pub.pub('rmp_message', v));

    this.squawkMessageEnabled.sub((v) => console.log('squawkMessageEnabled', v));
  }

  private clearMessage(): void {
    this.isBackgroundDisplayed = true;
    this.displayedMessage.set(this.squawkMessage.get());
  }
}
