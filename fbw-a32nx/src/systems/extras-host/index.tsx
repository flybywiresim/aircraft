// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, HEventPublisher } from 'msfssdk';
import { VersionCheck } from './modules/version_check';
import './style.scss';

class ExtrasHost extends BaseInstrument {
    private readonly bus: EventBus;

    private readonly hEventPublisher: HEventPublisher;

    private readonly versionCheck: VersionCheck;

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

        this.versionCheck = new VersionCheck(this.bus);

        console.log('A32NX_EXTRASHOST: Created');
    }

    get templateID(): string {
        return 'A32NX_EXTRASHOST';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        console.log('A32NX_EXTRASHOST: onInteractionEvent', args);
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();
        console.log('A32NX_EXTRASHOST: connectedCallback');

        this.versionCheck.connectedCallback();
    }

    public Update(): void {
        super.Update();

        if (this.gameState !== 3) {
            const gamestate = this.getGameState();
            if (gamestate === 3) {
                this.hEventPublisher.startPublish();
                this.versionCheck.startPublish();
            }
            this.gameState = gamestate;
        }

        this.versionCheck.update();
    }
}

registerInstrument('extras-host', ExtrasHost);
