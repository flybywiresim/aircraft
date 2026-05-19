// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, EventBus, Publisher, SimVarValueType, Subject, Subscribable } from '@microsoft/msfs-sdk';
import { PopupControlEvents } from '../../../shared/src/popup/PopupControlEvents';
import { PopupDefinition } from '../../../shared/src/popup/PopupTypes';
import { PopupEvents } from '../../../shared/src/popup/PopupEvents';
import { RegisteredSimVar } from 'shared/src';

export class PopupManager {
  private readonly publisher: Publisher<PopupEvents>;

  private readonly queue: PopupDefinition[] = [];

  private readonly _visiblePopup = Subject.create<PopupDefinition | undefined>(undefined);
  public readonly visiblePopup: Subscribable<PopupDefinition | undefined> = this._visiblePopup;

  private readonly _visiblePopupTimeRemaining = Subject.create<number | undefined>(undefined);
  public readonly visiblePopupTimeRemaining: Subscribable<number | undefined> = this._visiblePopupTimeRemaining;

  private readonly simDurationVar = RegisteredSimVar.create('E:SIMULATION TIME', SimVarValueType.Seconds);

  private lastSimDuration = 0;

  public constructor(bus: EventBus) {
    this.publisher = bus.getPublisher();

    this._visiblePopup.sub(this.onVisiblePopupChanged.bind(this));

    const sub = bus.getSubscriber<ClockEvents & PopupControlEvents>();

    sub.on('popup_dequeue_popup').handle(this.onDequeue.bind(this));
    sub.on('popup_enqueue_popup').handle(this.onEnqueue.bind(this));

    sub.on('simTime').handle(this.onUpdate.bind(this));
  }

  private onVisiblePopupChanged(definition: PopupDefinition | undefined): void {
    this._visiblePopupTimeRemaining.set(definition?.timeout);

    this.publisher.pub('popup_visible_uuid_changed', definition?.uuid, true, true);
  }

  private onDequeue(uuid: string): void {
    const index = this.queue.findIndex((p) => p.uuid === uuid);

    if (index >= 0) {
      this.queue.splice(index, 1);
    }

    this._visiblePopup.set(this.queue[0]);
  }

  private onEnqueue(definition: PopupDefinition): void {
    const index = this.queue.findIndex((p) => p.uuid === definition.uuid);

    if (index >= 0) {
      this.queue[index] = definition;
    } else {
      this.queue.push(definition);
    }

    this._visiblePopup.set(this.queue[0]);
  }

  private onUpdate(): void {
    const simDuration = this.simDurationVar.get() * 1000;
    const dt = this.lastSimDuration > 0 ? simDuration - this.lastSimDuration : 0;
    this.lastSimDuration = simDuration;

    let remaining = this._visiblePopupTimeRemaining.get();
    if (remaining !== undefined && remaining > 0) {
      remaining = Math.max(0, remaining - dt);

      if (remaining > 0) {
        this._visiblePopupTimeRemaining.set(remaining);
      } else {
        this.queue.shift();

        this._visiblePopup.set(this.queue[0]);
      }
    }
  }
}
