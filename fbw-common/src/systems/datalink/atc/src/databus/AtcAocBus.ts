//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, EventSubscriber, Publisher } from 'msfssdk';

export interface AtcAocMessages {
    ignoreIncomingAts623Message: number;
}

export type AtcAocCallbacks = {
    ignoreIncomingMessage: (uid: number) => void;
}

export class AtcAocBus {
    private subscriber: EventSubscriber<AtcAocMessages> = null;

    private publisher: Publisher<AtcAocMessages> = null;

    private callbacks: AtcAocCallbacks = {
        ignoreIncomingMessage: null,
    };

    constructor(private readonly bus: EventBus, private readonly synchronized: boolean, publish: boolean) {
        if (publish) {
            this.publisher = this.bus.getPublisher<AtcAocMessages>();
        } else {
            this.subscriber = this.bus.getSubscriber<AtcAocMessages>();
            this.subscriber.on('ignoreIncomingAts623Message').handle((uid: number) => {
                if (this.callbacks.ignoreIncomingMessage !== null) {
                    this.callbacks.ignoreIncomingMessage(uid);
                }
            });
        }
    }

    public addDataCallback<K extends keyof AtcAocCallbacks>(event: K, callback: AtcAocCallbacks[K]): void {
        this.callbacks[event] = callback;
    }

    public sendMessageId(uid: number): void {
        if (this.publisher !== null) {
            this.publisher.pub('ignoreIncomingAts623Message', uid, this.synchronized, false);
        }
    }
}
