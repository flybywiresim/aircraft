// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, KeyEvents, KeyInterceptManager } from 'msfssdk';
import { NotificationManager } from '@shared/notification';

export class KeyInterceptor {
    private eventBus: EventBus;

    private keyInterceptManager: KeyInterceptManager;

    private notification: NotificationManager;

    constructor(private readonly bus: EventBus) {
        this.eventBus = bus;
        KeyInterceptManager.getManager(this.eventBus).then((manager) => {
            this.keyInterceptManager = manager;
            this.registerIntercepts();
        });
        this.notification = new NotificationManager();
        console.log('KeyInterceptor: Created');
    }

    registerIntercepts() {
        this.keyInterceptManager.interceptKey('ENGINE_AUTO_START', false);
        this.keyInterceptManager.interceptKey('ENGINE_AUTO_SHUTDOWN', false);

        const subscriber = this.eventBus.getSubscriber<KeyEvents>();
        subscriber.on('key_intercept').handle((keyData) => {
            switch (keyData.key) {
            case 'ENGINE_AUTO_START':
                this.notification.showNotification({
                    title: 'A32NX: Ctrl+E Not supported',
                    type: 'MESSAGE',
                    theme: 'SYSTEM',
                    message: 'Engine Auto Start is not supported.\nPlease use the flyPad\'s Aircraft Presets.',
                    timeout: 5000,
                });
                break;
            case 'ENGINE_AUTO_SHUTDOWN':
                this.notification.showNotification({
                    title: 'A32NX: Shift+Ctrl+E Not supported',
                    type: 'MESSAGE',
                    theme: 'SYSTEM',
                    message: 'Engine Auto Shutdown is not supported.\nPlease use the flyPad\'s Aircraft Presets.',
                    timeout: 5000,
                });
                break;
            default:
                break;
            }
        });
    }

    public connectedCallback(): void {
        // empty
    }

    public startPublish(): void {
        console.log('KeyInterceptor: startPublish()');
    }

    public update(): void {
        // empty
    }
}
