// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Clock, FsBaseInstrument, FSComponent, FsInstrument, HEventPublisher, InstrumentBackplane, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus, EfisSide } from '@flybywiresim/fbw-sdk';

import { Oanc, OANC_RENDER_HEIGHT, OANC_RENDER_WIDTH, OansControlEventPublisher } from '@flybywiresim/oanc';
import { FmsDataPublisher } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { CdsDisplayUnit, DisplayUnitID, getDisplayIndex } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { FcuBusPublisher } from '../MsfsAvionicsCommon/providers/FcuBusPublisher';

import './style.scss';
import './oans-styles.scss';

declare type MousePosition = {
    x: number;
    y: number;
}

class OansInstrument implements FsInstrument {
    public readonly instrument!: BaseInstrument;

    private readonly efisSide: EfisSide;

    private readonly bus: ArincEventBus;

    private readonly backplane = new InstrumentBackplane();

    private readonly fcuBusPublisher: FcuBusPublisher;

    private readonly fmsDataPublisher: FmsDataPublisher;

    private readonly oansControlEventPublisher: OansControlEventPublisher;

    private readonly hEventPublisher: HEventPublisher;

    private readonly clock: Clock;

    private oansRef = FSComponent.createRef<Oanc>();

    private readonly waitScreenRef = FSComponent.createRef<HTMLDivElement>();

    private contextMenuPositionTriggered = Subject.create<MousePosition>({ x: 0, y: 0 });

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private oansContainerRef = FSComponent.createRef<HTMLDivElement>();

    constructor() {
        const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';
        const stateSubject = Subject.create<EfisSide>(side);
        this.efisSide = side;

        this.bus = new ArincEventBus();

        this.fcuBusPublisher = new FcuBusPublisher(this.bus, side);
        this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);
        this.oansControlEventPublisher = new OansControlEventPublisher(this.bus, side);

        this.hEventPublisher = new HEventPublisher(this.bus);

        this.clock = new Clock(this.bus);

        this.backplane.addPublisher('fcu', this.fcuBusPublisher);
        this.backplane.addPublisher('fms', this.fmsDataPublisher);
        this.backplane.addPublisher('oans', this.oansControlEventPublisher);

        this.backplane.addInstrument('clock', this.clock);

        this.doInit();
    }

    private doInit(): void {
        this.backplane.init();

        FSComponent.render(
            <div ref={this.topRef}>
                <CdsDisplayUnit bus={this.bus} displayUnitId={DisplayUnitID.CaptNd} test={Subject.create(-1)} failed={Subject.create(false)}>
                    <div ref={this.oansContainerRef} class="oanc-container" style={`width: ${OANC_RENDER_WIDTH}px; height: ${OANC_RENDER_HEIGHT}px; overflow: hidden`}>
                        <div ref={this.waitScreenRef} class="oanc-waiting-screen">
                            PLEASE WAIT
                        </div>
                        <Oanc
                            bus={this.bus}
                            side={this.efisSide}
                            ref={this.oansRef}
                            waitScreenRef={this.waitScreenRef}
                        />
                    </div>
                </CdsDisplayUnit>
            </div>,
            document.getElementById('OANS_CONTENT'),
        );

        // Remove "instrument didn't load" text
        document.getElementById('OANS_CONTENT')?.querySelector(':scope > h1')?.remove();
    }

    /**
     * A callback called when the instrument gets a frame update.
     */
    public Update(): void {
        this.backplane.onUpdate();
        this.oansControlEventPublisher.onUpdate();

        if (this.oansRef.getOrDefault()) {
            this.oansRef.instance.Update();
        }
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    onGameStateChanged(_oldState: GameState, _newState: GameState) {
        // noop
    }

    onFlightStart() {
        // noop
    }

    onSoundEnd(_soundEventId: Name_Z) {
        // noop
    }
}

class A380X_OANS extends FsBaseInstrument<OansInstrument> {
    constructInstrument(): OansInstrument {
        return new OansInstrument();
    }

    get isInteractive(): boolean {
        return true;
    }

    get templateID(): string {
        return 'A380X_OANS';
    }
}

// Hack to support tspan SVG elements, which FSComponent does not recognise as SVG

const original = document.createElement.bind(document);

const extraSvgTags = ['tspan'];

document.createElement = ((tagName: string, options: ElementCreationOptions | undefined) => {
    if (extraSvgTags.includes(tagName)) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName, options);
    }
    return original(tagName, options);
}) as any;

registerInstrument('a380x-oans', A380X_OANS);
