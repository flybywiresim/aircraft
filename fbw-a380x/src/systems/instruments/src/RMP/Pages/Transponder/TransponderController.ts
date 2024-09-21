// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DebounceTimer,
  EventBus,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import { TransponderEvents } from 'instruments/src/RMP/Data/TransponderPublisher';
import { RmpMessageControlEvents } from 'instruments/src/RMP/Systems/RmpMessageManager';

// FIXME make all the data pausable when the page isn't active

export class TransponderController {
  /** IDENT inhibit time in ms. */
  private static readonly IDENT_TIME = 5_000;
  /** Time after entering last digit before automatic validation occurs. */
  private static readonly AUTO_VALIDATE_TIME = 1_000;

  private readonly sub = this.bus.getSubscriber<TransponderEvents>();

  private readonly messagePub = this.bus.getPublisher<RmpMessageControlEvents>();

  private readonly activeCode = ConsumerSubject.create(this.sub.on('transponder_code_1'), null);

  private readonly enteredCode = Subject.create<string | null>(null);

  private readonly _entryInvalid = Subject.create(false);
  public readonly entryInvalid = this._entryInvalid as Subscribable<boolean>;

  public readonly entryInProgress = this.enteredCode.map((v) => v !== null) as Subscribable<boolean>;

  private readonly autoValidateTimer = new DebounceTimer();
  private readonly onValidateHandler = this.onValidate.bind(this);

  public readonly displayedCode = MappedSubject.create(
    ([activeCode, enteredCode]) =>
      enteredCode !== null ? enteredCode : activeCode?.toString(16).padStart(4, '0') ?? '----',
    this.activeCode,
    this.enteredCode,
  ) as Subscribable<string>;

  private readonly _isAuto = ConsumerSubject.create(this.sub.on('transponder_auto_1'), false);
  public readonly isAuto = this._isAuto as Subscribable<boolean>;

  // FIXME need to sync this state over the RMP bus?
  private readonly _isIdentActive = Subject.create(false);
  public readonly isIdentActive = this._isIdentActive as Subscribable<boolean>;

  private readonly identTimer = new DebounceTimer();

  private readonly identMessageSub: Subscription;

  constructor(private readonly bus: EventBus) {
    this.identMessageSub = this.isIdentActive.sub(
      (v) =>
        v
          ? this.messagePub.pub('rmp_message_set', 'TRANSMITTING IDENT')
          : this.messagePub.pub('rmp_message_clear_message', 'TRANSMITTING IDENT'),
      true,
      true,
    );

    this._entryInvalid.sub((v) => v && this.messagePub.pub('rmp_message_set', 'SQUAWK CODE NOT VALID'));

    this.enteredCode.sub(() => this._entryInvalid.set(false));
  }

  public pause(): void {
    this.enteredCode.set(null);
    this.identMessageSub.pause();
  }

  public resume(): void {
    this.identMessageSub.resume(false);
  }

  public onIdentPressed(): void {
    if (this._isIdentActive.get()) {
      return;
    }

    SimVar.SetSimVarValue('K:XPNDR_IDENT_ON', SimVarValueType.Bool, true);
    this.identTimer.clear();
    this._isIdentActive.set(true);
    this.identTimer.schedule(() => this._isIdentActive.set(false), TransponderController.IDENT_TIME);
  }

  public onClear(singleDigit = true): void {
    this.autoValidateTimer.clear();
    const oldCode = this.enteredCode.get();
    if (oldCode !== null) {
      if (!singleDigit) {
        this.enteredCode.set(null);
      } else if (oldCode.indexOf('_') > 1) {
        this.enteredCode.set(oldCode.slice(0, oldCode.length - 2).padEnd(4, '_'));
      } else {
        this.enteredCode.set(null);
        this.messagePub.pub('rmp_message_set', 'SQUAWK CODE REVERTED TO PREV ENTRY');
      }
    }
  }

  public onDigitEntered(digit: number): void {
    this.autoValidateTimer.clear();
    const enteredCode = this.enteredCode.get();
    if (this._entryInvalid.get() || (enteredCode !== null && enteredCode.indexOf('_') === -1)) {
      return;
    }

    if (enteredCode === null) {
      this.enteredCode.set(`${digit}___`);
    } else {
      const enteredDigits = `${enteredCode.slice(0, enteredCode.indexOf('_'))}${digit}`;
      this.enteredCode.set(enteredDigits.padEnd(4, '_'));
      if (enteredDigits.length === 4) {
        this.autoValidateTimer.schedule(this.onValidateHandler, TransponderController.AUTO_VALIDATE_TIME);
      }
    }

    if (digit === 8 || digit === 9) {
      this._entryInvalid.set(true);
    }
  }

  public onValidate(): void {
    this.autoValidateTimer.clear();
    const newCode = this.enteredCode.get();
    if (newCode === null) {
      return;
    }

    const notValid = this._entryInvalid.get() || newCode.indexOf('_') !== -1;
    if (notValid) {
      this.messagePub.pub('rmp_message_set', 'SQUAWK CODE REVERTED TO PREV ENTRY');
      this.enteredCode.set(null);
      return;
    }

    const codeBcd = parseInt(newCode, 16);

    SimVar.SetSimVarValue('K:XPNDR_SET', 'number', codeBcd);

    this.enteredCode.set(null);
  }
}
