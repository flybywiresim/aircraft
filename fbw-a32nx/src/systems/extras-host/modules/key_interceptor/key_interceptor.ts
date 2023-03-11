// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, KeyEvents, KeyInterceptManager } from 'msfssdk';
import { NotificationManager } from '@shared/notification';
import { PopUpDialog } from '@shared/popup';

/**
 * This class is used to intercept the key events for the engine auto start and engine auto shutdown.
 *
 * Additional key events can be added in the registerIntercepts() method.
 */
export class KeyInterceptor {
    private eventBus: EventBus;

    private keyInterceptManager: KeyInterceptManager;

    private notification: NotificationManager;

    private dialogVisible = false;

    constructor(private readonly bus: EventBus) {
        this.eventBus = bus;
        KeyInterceptManager.getManager(this.eventBus).then((manager) => {
            this.keyInterceptManager = manager;
            this.registerIntercepts();
        });
        this.notification = new NotificationManager();
        console.log('KeyInterceptor: Created');
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

    private registerIntercepts() {
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
        if (!this.dialogVisible) {
            this.dialogVisible = true;
            const dialog = new PopUpDialog();
            dialog.showPopUp(
                'Ctrl+E Not supported',
                `<div style="font-size: 120%; text-align: left;">
                        Engine Auto Start is not supported by the A32NX.<br/>
                        <br/>                        
                        Do you want to you use the flyPad's Aircraft Presets to set the aircraft to 
                        <strong>"Ready for Taxi"</strong>?
                    </div>`,
                'small',
                () => {
                    console.log('Setting aircraft preset to "Ready for Taxi"');
                    // stop any running preset loads
                    SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 0);
                    // use a timeout to allow the presets backend to recognize the stop
                    setTimeout(() => {
                        SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 4);
                    }, 500);
                    this.dialogVisible = false;
                },
                () => {
                    this.dialogVisible = false;
                },
            );
        }
    }

    private engineAutoStopAction() {
        const engine1N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'Number');
        const engine2N1 = SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'Number');

        if (engine1N1 > 0.1 || engine2N1 > 0.1) {
            if (!this.dialogVisible) {
                this.dialogVisible = true;
                const dialog = new PopUpDialog();
                dialog.showPopUp(
                    'Shift+Ctrl+E Not supported',
                    `<div style="font-size: 120%; text-align: left;">
                        Engine Auto Shutdown is not supported by the A32NX.<br/>
                        <br/>
                        Do you want to you use the flyPad's Aircraft Presets to set the aircraft to 
                        <strong>"Powered"</strong>?
                    </div>`,
                    'small',
                    () => {
                        console.log('Setting aircraft preset to "Powered"');
                        // stop any running preset loads
                        SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 0);
                        // use a timeout to allow the presets backend to recognize the stop
                        setTimeout(() => {
                            SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_PRESET_LOAD', 'Number', 2);
                        }, 500);
                        this.dialogVisible = false;
                    },
                    () => {
                        this.dialogVisible = false;
                    },
                );
            }
        }
    }
}
