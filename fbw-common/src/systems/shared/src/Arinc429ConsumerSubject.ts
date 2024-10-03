// Copyright (c) 2021-2024 FlyByWire Simulations
// Copyright (c) Microsoft Corporation
//
// SPDX-License-Identifier: GPL-3.0

import { AbstractSubscribable, Consumer, ConsumerSubject, Subscription } from '@microsoft/msfs-sdk';
import { Arinc429Register, Arinc429WordData } from '@flybywiresim/fbw-sdk';

export const Arinc429EqualityFunc = (a: Arinc429WordData, b: Arinc429WordData) =>
  a.value === b.value && a.ssm === b.ssm;

/** This typing should technically be `a: Arinc429WordData` to match the ConsumerSubject.create signature, but practically arg a is always the initialVal: Arinc429Register.  */
export const Arinc429MutateFunc = (a: Arinc429Register, b: Arinc429WordData) => a.set(b.rawWord);

export class Arinc429ConsumerSubject {
  static create(initialConsumer: Consumer<Arinc429WordData> | undefined): ConsumerSubject<Arinc429WordData> {
    return ConsumerSubject.create(
      initialConsumer ?? null,
      Arinc429Register.empty(),
      Arinc429EqualityFunc,
      Arinc429MutateFunc,
    );
  }
}

export class Arinc429LocalVarConsumerSubject extends AbstractSubscribable<Arinc429WordData> {
  private readonly arincWord = Arinc429Register.empty();

  private readonly consumerHandler = this.onEventConsumed.bind(this);

  public readonly canInitialNotify = true;

  private consumerSub?: Subscription;

  private _isAlive = true;
  /**
   * Whether this subject is alive. While alive, this subject will update its value from its event consumer unless it
   * is paused. Once dead, this subject will no longer update its value and cannot be resumed again.
   */
  public get isAlive(): boolean {
    return this._isAlive;
  }

  private _isPaused = false;
  /**
   * Whether event consumption is currently paused for this subject. While paused, this subject's value will not
   * update.
   */
  public get isPaused(): boolean {
    return this._isPaused;
  }

  get(): Arinc429WordData {
    return this.arincWord;
  }

  /**
   * Creates a new instance of ConsumerSubject.
   * @param consumer The consumer from which the new subject obtains its value. If null, the new subject's value will
   * not be updated until the subject's consumer is set to a non-null value.
   * @param initialVal The new subject's initial value.
   */
  public static create(consumer: Consumer<number> | null, initialVal?: number): Arinc429LocalVarConsumerSubject {
    return new Arinc429LocalVarConsumerSubject(consumer, initialVal);
  }

  private constructor(consumer: Consumer<number> | null, initialVal?: number) {
    super();

    this.arincWord.set(initialVal ?? 0);
    this.consumerSub = consumer?.handle(this.consumerHandler);
  }

  /**
   * Consumes an event.
   * @param value The value of the event.
   */
  private onEventConsumed(value: number): void {
    // this.isValueConsumed = true;

    /*if (this.needSetDefaultValue) {
      this.needSetDefaultValue = false;
      delete this.defaultValue;
    }*/

    this.setValue(value);
  }

  private setValue(value: number): void {
    if (this.arincWord.rawWord !== value) {
      this.arincWord.set(value);
      this.notify();
    }
  }

  /**
   * Sets the consumer from which this subject derives its value. If the consumer is null, this subject's value will
   * not be updated until a non-null consumer is set.
   * @param consumer An event consumer.
   * @returns This subject, after its consumer has been set.
   */
  public setConsumer(consumer: Consumer<number> | null): this {
    if (!this._isAlive) {
      return this;
    }

    this.consumerSub?.destroy();
    this.consumerSub = consumer?.handle(this.consumerHandler, this._isPaused);

    return this;
  }

  /**
   * Pauses consuming events for this subject. Once paused, this subject's value will not be updated.
   * @returns This subject, after it has been paused.
   */
  public pause(): this {
    if (this._isPaused) {
      return this;
    }

    this.consumerSub?.pause();
    this._isPaused = true;

    return this;
  }

  /**
   * Resumes consuming events for this subject. Once resumed, this subject's value will be updated from consumed
   * events. When this subject is resumed, it immediately updates its value from its event consumer, if one exists.
   *
   * Any `initialNotify` argument passed to this method is ignored. This subject is always immediately notified of its
   * event consumer's value when resumed.
   * @returns This subject, after it has been resumed.
   */
  public resume(): this {
    if (!this._isPaused) {
      return this;
    }

    this._isPaused = false;
    this.consumerSub?.resume(true);

    return this;
  }

  /**
   * Destroys this subject. Once destroyed, it will no longer consume events to update its value.
   */
  public destroy(): void {
    this._isAlive = false;
    this.consumerSub?.destroy();
  }
}
