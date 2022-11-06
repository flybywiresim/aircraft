// Copyright (c) Microsoft Corporation
// Copyright (c) 2022 FlyByWire Simulations
//
// SPDX-License-Identifier: MIT

import { EventBus } from 'msfssdk';
import { ArincEventSubscriber } from '@shared/event-bus';

export class ArincEventBus extends EventBus {
    /**
     * Gets a typed subscriber from the event bus.
     * @returns The typed subscriber.
     */
    public getArincSubscriber<E>(): ArincEventSubscriber<E> {
        return new ArincEventSubscriber(this);
    }
}
