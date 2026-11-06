// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  BasePublisher,
  DataItem,
  EventBus,
  SharedDataBusClient,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import { EfisSide } from '../../../instruments/src/NavigationDisplay';
import {
  EFIS_VECTORS_DATA_BUS_NAME,
  EFIS_VECTORS_GROUPS,
  EfisVectorsData,
  EfisVectorsEvents,
} from '../EfisVectorsData';
import { PathVector } from '../PathVector';

type VectorTopic = keyof EfisVectorsEvents;

interface VectorEntry {
  readonly topic: VectorTopic;
  readonly data: Subscribable<Readonly<DataItem<readonly PathVector[]>>>;
  dirty: boolean;
}

/** Adapts shared EFIS geometry to uncached, local bus events without copying vector payloads. */
export class EfisVectorsPublisher extends BasePublisher<EfisVectorsEvents> {
  private readonly client = new SharedDataBusClient(EFIS_VECTORS_DATA_BUS_NAME);

  private readonly entries: VectorEntry[] = [];

  private readonly subscriptions: Subscription[] = [];

  private isDestroyed = false;

  constructor(
    bus: EventBus,
    side: EfisSide,
    topics: readonly VectorTopic[] = Object.keys(EFIS_VECTORS_GROUPS) as VectorTopic[],
  ) {
    super(bus);

    const dataBus = this.client.of<EfisVectorsData>();
    for (const topic of topics) {
      const entry: VectorEntry = {
        topic,
        data: dataBus.getSubscribable(side, EFIS_VECTORS_GROUPS[topic]),
        dirty: true,
      };
      this.entries.push(entry);
      // Connection callbacks can run outside onUpdate. Defer publications to the backplane.
      this.subscriptions.push(entry.data.sub(() => (entry.dirty = true)));
    }

    this.subscriptions.push(this.client.isAlive.sub(() => this.invalidate()));
  }

  private invalidate(): void {
    for (let i = 0; i < this.entries.length; i++) {
      this.entries[i].dirty = true;
    }
  }

  public startPublish(): void {
    if (this.isDestroyed || this.isPublishing()) {
      return;
    }
    super.startPublish();
    this.invalidate();
  }

  public onUpdate(): void {
    if (!this.isPublishing()) {
      return;
    }

    const isAlive = this.client.isAlive.get();
    if (isAlive) {
      this.client.update();
    }
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.dirty) {
        entry.dirty = false;
        // Shared transport already crosses views. Disable caching to avoid allocating bus cache records.
        this.publish(entry.topic, isAlive ? entry.data.get().value : undefined, false, false);
      }
    }
  }

  public destroy(): void {
    this.stopPublish();
    this.isDestroyed = true;
    for (const subscription of this.subscriptions) {
      subscription.destroy();
    }
  }
}
