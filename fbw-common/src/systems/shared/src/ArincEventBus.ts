// Copyright (c) Microsoft Corporation
// Copyright (c) 2022 FlyByWire Simulations
//
// SPDX-License-Identifier: MIT

import { EventBus } from '@microsoft/msfs-sdk';
import { ArincEventSubscriber } from './ArincEventBusSubscriber';

export class ArincEventBus extends EventBus {
  /**
   * Gets a typed subscriber from the event bus.
   * @returns The typed subscriber.
   */
  public getArincSubscriber<E>(): ArincEventSubscriber<E> {
    return new ArincEventSubscriber(this);
  }
}
