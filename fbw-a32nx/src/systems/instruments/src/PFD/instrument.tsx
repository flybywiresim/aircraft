// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Clock, FSComponent, HEventPublisher, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

import { DmcPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { FmsDataPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { getDisplayIndex, PFDComponent } from './PFD';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { PFDSimvarPublisher, PFDSimvars } from './shared/PFDSimvarPublisher';

import './style.scss';

class A32NX_PFD extends BaseInstrument {
    private bus: ArincEventBus;

    private simVarPublisher: PFDSimvarPublisher;

    private readonly hEventPublisher;

    private readonly arincProvider: ArincValueProvider;

    private readonly clock: Clock;

    private adirsValueProvider: AdirsValueProvider<PFDSimvars>;

    private readonly dmcPublisher: DmcPublisher;

    private fmsDataPublisher: FmsDataPublisher;

    /**
     * "mainmenu" = 0
     * "loading" = 1
     * "briefing" = 2
     * "ingame" = 3
     */
    private gameState = 0;

    constructor() {
        super();
        this.bus = new ArincEventBus();
        this.simVarPublisher = new PFDSimvarPublisher(this.bus);
        this.hEventPublisher = new HEventPublisher(this.bus);
        this.arincProvider = new ArincValueProvider(this.bus);
        //   this.simplaneValueProvider = new SimplaneValueProvider(this.bus);
        this.clock = new Clock(this.bus);
        this.dmcPublisher = new DmcPublisher(this.bus);
    }

    get templateID(): string {
        return 'A32NX_PFD';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher, getDisplayIndex() === 1 ? 'L' : 'R');

        const stateSubject = Subject.create<'L' | 'R'>(getDisplayIndex() === 1 ? 'L' : 'R');
        this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);

        this.arincProvider.init();
        this.clock.init();
        this.dmcPublisher.init();

        FSComponent.render(<PFDComponent bus={this.bus} instrument={this} />, document.getElementById('PFD_CONTENT'));

        // Remove "instrument didn't load" text
        document.getElementById('PFD_CONTENT').querySelector(':scope > h1').remove();
    }

    /**
   * A callback called when the instrument gets a frame update.
   */
    public Update(): void {
        super.Update();

        if (this.gameState !== 3) {
            const gamestate = this.getGameState();
            if (gamestate === 3) {
                this.simVarPublisher.startPublish();
                this.hEventPublisher.startPublish();
                this.adirsValueProvider.start();
                this.dmcPublisher.startPublish();
                this.fmsDataPublisher.startPublish();
            }
            this.gameState = gamestate;
        } else {
            this.simVarPublisher.onUpdate();
            this.clock.onUpdate();
            this.dmcPublisher.onUpdate();
            this.fmsDataPublisher.onUpdate();
        }
    }
}

// Hack to support tspan SVG elements, which FSComponent does not recognise as SVG

const original = document.createElement.bind(document);

const extraSvgTags = ['tspan'];

document.createElement = ((tagName, options) => {
    if (extraSvgTags.includes(tagName)) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName, options);
    }
    return original(tagName, options);
}) as any;

registerInstrument('a32nx-pfd', A32NX_PFD);
