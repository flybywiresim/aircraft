// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, KeyEvents, KeyInterceptManager } from 'msfssdk';
import { NotificationManager } from '@shared/notification';
import { PopUpDialog } from '@shared/popup';

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
                this.engineAutoStartAction();
                break;
            case 'ENGINE_AUTO_SHUTDOWN':
                this.engineAutoStopAction();
                break;
            default:
                break;
            }
        });
    }

    private engineAutoStartAction() {
        const dialog = new PopUpDialog();
        // TODO: Make translation work - move translation from EFB to shared
        dialog.showPopUp(
            'A32NX: Ctrl+E Not supported',
            `<div style="font-size: 120%; text-align: left;">
                        Engine Auto Start is not supported.<br/>
                        <br/>                        
                        Do you want to you use the flyPad's Aircraft Presets to set the aircraft to 
                        <strong>"Ready for Taxi"</strong>?
                    </div>`,
            'small',
            () => {
                console.log('Setting aircraft preset to "Ready for Taxi"');
                // stop any running preset loads
                SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 0);
                SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 4);
            },
            () => {
                console.log('User clicked Cancel');
            },
        );
    }

    private engineAutoStopAction() {
        const dialog = new PopUpDialog();
        dialog.showPopUp(
            'A32NX: Shift+Ctrl+E Not supported',
            `<div style="font-size: 120%; text-align: left;">
                        Engine Auto Shutdown is not supported.<br/>
                        <br/>
                        Do you want to you use the flyPad's Aircraft Presets to set the aircraft to 
                        <strong>"Powered"</strong>?
                    </div>`,
            'small',
            () => {
                console.log('Setting aircraft preset to "Powered"');
                // stop any running preset loads
                SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 0);
                SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 2);
            },
            () => {
                console.log('User clicked Cancel');
            },
        );
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
