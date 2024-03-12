// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, HEventPublisher } from '@microsoft/msfs-sdk';
import { NotificationManager } from '@flybywiresim/fbw-sdk';
import { ExtrasSimVarPublisher } from 'extras-host/modules/common/ExtrasSimVarPublisher';
import { PushbuttonCheck } from 'extras-host/modules/pushbutton_check/PushbuttonCheck';
import { KeyInterceptor } from './modules/key_interceptor/KeyInterceptor';
import { VersionCheck } from './modules/version_check/VersionCheck';
import { FlightPlanTest } from './modules/flight_plan_test/FlightPlanTest';

/**
 * This is the main class for the extras-host instrument.
 *
 * It provides an environment for non-aircraft non-wasm systems/modules to run in.
 *
 * Usage:
 *  - Add new modules as private readonly members of this class.
 *  - Add the modules to the constructor.
 *  - Add the modules to the connectedCallback() method.
 *  - Add the modules to the Update() method.
 *
 * Each module must implement the following methods:
 * - `constructor` to get access to the system-wide EventBus
 * - `connectedCallback` which is called after the simulator set up everything. These functions will also add the subscribtion to special events.
 * - `startPublish` which is called as soon as the simulator starts running. It will also start publishing the simulator variables onto the EventBus
 * - `update` is called in every update call of the simulator, but only after `startPublish` is called
 */
class ExtrasHost extends BaseInstrument {
    private readonly bus: EventBus;

    private readonly notificationManager: NotificationManager;

    private readonly hEventPublisher: HEventPublisher;

    private readonly simVarPublisher: ExtrasSimVarPublisher;

    private readonly pushbuttonCheck: PushbuttonCheck;

    private readonly versionCheck: VersionCheck;

    private readonly keyInterceptor: KeyInterceptor;

    private readonly flightPlanTest: FlightPlanTest;

    /**
     * "mainmenu" = 0
     * "loading" = 1
     * "briefing" = 2
     * "ingame" = 3
     */
    private gameState = 0;

    constructor() {
        super();

        this.bus = new EventBus();
        this.hEventPublisher = new HEventPublisher(this.bus);
        this.simVarPublisher = new ExtrasSimVarPublisher(this.bus);

        this.notificationManager = new NotificationManager();

        this.pushbuttonCheck = new PushbuttonCheck(this.bus, this.notificationManager);
        this.versionCheck = new VersionCheck(this.bus);
        this.keyInterceptor = new KeyInterceptor(this.bus, this.notificationManager);
        this.flightPlanTest = new FlightPlanTest(this.bus);

        console.log('A32NX_EXTRASHOST: Created');
    }

    get templateID(): string {
        return 'A32NX_EXTRASHOST';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.pushbuttonCheck.connectedCallback();
        this.versionCheck.connectedCallback();
        this.keyInterceptor.connectedCallback();
    }

    public Update(): void {
        super.Update();

        if (this.gameState !== GameState.ingame) {
            const gs = this.getGameState();
            if (gs === GameState.ingame) {
                this.hEventPublisher.startPublish();
                this.versionCheck.startPublish();
                this.keyInterceptor.startPublish();
                this.simVarPublisher.startPublish();
            }
            this.gameState = gs;
        } else {
            this.simVarPublisher.onUpdate();
        }

        this.versionCheck.update();
        this.keyInterceptor.update();
    }
}

registerInstrument('extras-host', ExtrasHost);
