// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, Publisher, Subject, Subscribable, Subscription } from '@microsoft/msfs-sdk';
import { PopupControlEvents } from './PopupControlEvents';
import { PopupDefinition } from './PopupTypes';
import { PopupEvents } from './PopupEvents';

export class PopupTransporter {
  private readonly publisher: Publisher<PopupControlEvents>;
  private readonly isRequested = Subject.create(false);

  private isVisible = false;

  private sub?: Subscription;

  public constructor(
    bus: EventBus,
    private readonly definition: PopupDefinition,
  ) {
    this.publisher = bus.getPublisher();

    this.isRequested.sub(this.onRequestChanged.bind(this));

    bus
      .getSubscriber<PopupEvents>()
      .on('popup_visible_uuid_changed')
      .handle((uuid) => {
        if (uuid === this.definition.uuid) {
          this.isVisible = true;
        } else if (this.isVisible) {
          this.isVisible = false;
          // reset the request so it will notify next time
          this.isRequested.set(false);
        }
      });
  }

  private onRequestChanged(isVisible: boolean): void {
    if (isVisible) {
      this.publisher.pub('popup_enqueue_popup', this.definition, true, false);
    } else {
      this.publisher.pub('popup_dequeue_popup', this.definition.uuid, true, false);
    }
  }

  public set(isVisible: boolean): void {
    this.isRequested.set(isVisible);
  }

  public bind(isVisible: Subscribable<boolean>): void {
    this.sub?.destroy();

    this.sub = isVisible.pipe(this.isRequested);
  }

  public destroy(): void {
    this.sub?.destroy();
  }
}
