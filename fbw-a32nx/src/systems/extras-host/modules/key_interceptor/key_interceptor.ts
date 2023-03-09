// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, KeyEvents, KeyInterceptManager } from 'msfssdk';

export class KeyInterceptor {
    private eventBus: EventBus;

    private keyInterceptManager: KeyInterceptManager;

    constructor(private readonly bus: EventBus) {
        this.eventBus = bus;
        console.log('KeyInterceptor: constructor()');
        KeyInterceptManager.getManager(this.eventBus).then((manager) => {
            this.keyInterceptManager = manager;
            this.registerIntercepts();
        });
    }

    registerIntercepts() {
        this.keyInterceptManager.interceptKey('ENGINE_AUTO_START', false);
        this.keyInterceptManager.interceptKey('ENGINE_AUTO_SHUTDOWN', false);
        this.keyInterceptManager.interceptKey('TOGGLE_BEACON_LIGHTS', true);

        const subscriber = this.eventBus.getSubscriber<KeyEvents>();
        subscriber.on('key_intercept').handle((keyData) => {
            switch (keyData.key) {
            case 'ENGINE_AUTO_START':
                console.debug('ENGINE_AUTO_START intercepted');
                break;
            case 'ENGINE_AUTO_SHUTDOWN':
                console.debug('ENGINE_AUTO_SHUTDOWN intercepted');
                break;
            case 'TOGGLE_BEACON_LIGHTS':
                console.debug('TOGGLE_BEACON_LIGHTS intercepted');
                break;
            default:
                break;
            }
        });
    }

    public connectedCallback(): void {
        console.debug('KeyInterceptor: connectedCallback()');
    }

    public startPublish(): void {
        console.log('KeyInterceptor: startPublish()');
    }

    public update(): void {
        // empty
    }
}
