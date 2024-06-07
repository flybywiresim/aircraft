// Copyright (c) Microsoft Corporation
// Copyright (c) 2022 FlyByWire Simulations
//
// SPDX-License-Identifier: MIT

import { EventBus } from '@microsoft/msfs-sdk';
import { BasicArincConsumer } from './ArincConsumer';

/**
 * A typed container for subscribers interacting with the Event Bus.
 */
export class ArincEventSubscriber<E> {
  /**
   * Creates an instance of an EventSubscriber.
   * @param bus The EventBus that is the parent of this instance.
   */
  constructor(private bus: EventBus) {}

  /**
   * Subscribes to a topic on the bus.
   * @param topic The topic to subscribe to.
   * @returns A consumer to bind the event handler to.
   */
  public on<K extends keyof E & string>(topic: K): BasicArincConsumer<E[K]> {
    return new BasicArincConsumer<E[K]>((handler, paused) => this.bus.on(topic, handler, paused));
  }
}
