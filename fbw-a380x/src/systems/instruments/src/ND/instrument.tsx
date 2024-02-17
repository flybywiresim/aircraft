// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Clock, FsBaseInstrument, FSComponent, FsInstrument, HEventPublisher, InstrumentBackplane, Subject, Subscribable, Wait } from '@microsoft/msfs-sdk';
import { a380EfisRangeSettings, ArincEventBus, EfisSide } from '@flybywiresim/fbw-sdk';
import { NDComponent } from '@flybywiresim/navigation-display';

import { VerticalDisplayDummy } from 'instruments/src/ND/VerticalDisplay';
import { ContextMenu, ContextMenuElement } from 'instruments/src/ND/OANC/Common/ContextMenu';
import { Oanc, OANC_RENDER_HEIGHT, OANC_RENDER_WIDTH, ZOOM_TRANSITION_TIME_MS } from '@flybywiresim/oanc';
import { OansControlPanel } from 'instruments/src/ND/OANC/OansControlPanel';
import { MouseCursor } from './OANC/Common/MouseCursor';
import { NDSimvarPublisher, NDSimvars } from './NDSimvarPublisher';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';
import { FmsDataPublisher } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { FmsSymbolsPublisher } from './FmsSymbolsPublisher';
import { VorBusPublisher } from '../MsfsAvionicsCommon/providers/VorBusPublisher';
import { TcasBusPublisher } from '../MsfsAvionicsCommon/providers/TcasBusPublisher';
import { FGDataPublisher } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { NDControlEvents } from './NDControlEvents';
import { CdsDisplayUnit, DisplayUnitID, getDisplayIndex } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { EgpwcBusPublisher } from '../MsfsAvionicsCommon/providers/EgpwcBusPublisher';
import { DmcPublisher } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { FMBusPublisher } from '../MsfsAvionicsCommon/providers/FMBusPublisher';
import { FcuBusPublisher, FcuSimVars } from '../MsfsAvionicsCommon/providers/FcuBusPublisher';

import './style.scss';
import './oans-styles.scss';

declare type MousePosition = {
    x: number;
    y: number;
}

class NDInstrument implements FsInstrument {
    public readonly instrument: BaseInstrument;

    private readonly efisSide: EfisSide;

    private readonly bus: ArincEventBus;

    private readonly backplane = new InstrumentBackplane();

    private readonly simVarPublisher: NDSimvarPublisher;

    private readonly fcuBusPublisher: FcuBusPublisher;

    private readonly fmsDataPublisher: FmsDataPublisher;

    private readonly fgDataPublisher: FGDataPublisher;

    private readonly fmBusPublisher: FMBusPublisher;

    private readonly fmsSymbolsPublisher: FmsSymbolsPublisher;

    private readonly vorBusPublisher: VorBusPublisher;

    private readonly tcasBusPublisher: TcasBusPublisher;

    private readonly dmcPublisher: DmcPublisher;

    private readonly egpwcBusPublisher: EgpwcBusPublisher;

    private readonly hEventPublisher;

    private readonly adirsValueProvider: AdirsValueProvider<NDSimvars>;

    private readonly clock: Clock;

    private oancRef = FSComponent.createRef<Oanc>();

    public readonly controlPanelRef = FSComponent.createRef<OansControlPanel>();

    private readonly contextMenuVisible = Subject.create(false);

    private readonly contextMenuX = Subject.create(0);

    private readonly contextMenuY = Subject.create(0);

    private readonly controlPanelVisible = Subject.create(true);

    private readonly waitScreenRef = FSComponent.createRef<HTMLDivElement>();

    private contextMenuItems: Subscribable<ContextMenuElement[]> = Subject.create([
        {
            name: 'ADD CROSS',
            disabled: true,
            onPressed: () => console.log(`ADD CROSS at (${this.contextMenuPositionTriggered.get().x}, ${this.contextMenuPositionTriggered.get().y})`),
        },
        {
            name: 'ADD FLAG',
            disabled: true,
            onPressed: () => console.log(`ADD FLAG at (${this.contextMenuPositionTriggered.get().x}, ${this.contextMenuPositionTriggered.get().y})`),
        },
        {
            name: 'MAP DATA',
            disabled: false,
            onPressed: () => {
                if (this.controlPanelRef.getOrDefault()) {
                    this.controlPanelVisible.set(!this.controlPanelVisible.get());
                }
            },
        },
        {
            name: 'ERASE ALL CROSSES',
            disabled: true,
            onPressed: () => console.log('ERASE ALL CROSSES'),
        },
        {
            name: 'ERASE ALL FLAGS',
            disabled: true,
            onPressed: () => console.log('ERASE ALL FLAGS'),
        },
        {
            name: 'CENTER ON ACFT',
            disabled: false,
            onPressed: async () => {
                if (this.oancRef.getOrDefault() !== null) {
                    await this.oancRef.instance.enablePanningTransitions();
                    this.oancRef.instance.panOffsetX.set(0);
                    this.oancRef.instance.panOffsetY.set(0);
                    await Wait.awaitDelay(ZOOM_TRANSITION_TIME_MS);
                    await this.oancRef.instance.disablePanningTransitions();
                }
            },
        },
    ]);

    private contextMenuRef = FSComponent.createRef<ContextMenu>();

    private contextMenuOpened = Subject.create<boolean>(false);

    private contextMenuPositionTriggered = Subject.create<MousePosition>({ x: 0, y: 0 });

    private mouseCursorRef = FSComponent.createRef<MouseCursor>();

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private ndContainerRef = FSComponent.createRef<HTMLDivElement>();

    private oancContainerRef = FSComponent.createRef<HTMLDivElement>();

    constructor() {
        const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';
        const stateSubject = Subject.create<'L' | 'R'>(side);
        this.efisSide = side;

        this.bus = new ArincEventBus();

        this.simVarPublisher = new NDSimvarPublisher(this.bus);
        this.fcuBusPublisher = new FcuBusPublisher(this.bus, side);
        this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);
        this.fgDataPublisher = new FGDataPublisher(this.bus);
        this.fmBusPublisher = new FMBusPublisher(this.bus);
        this.fmsSymbolsPublisher = new FmsSymbolsPublisher(this.bus, side);
        this.vorBusPublisher = new VorBusPublisher(this.bus);
        this.tcasBusPublisher = new TcasBusPublisher(this.bus);
        this.dmcPublisher = new DmcPublisher(this.bus);
        this.egpwcBusPublisher = new EgpwcBusPublisher(this.bus, side);
        this.hEventPublisher = new HEventPublisher(this.bus);

        this.adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher, side);

        this.clock = new Clock(this.bus);

        this.backplane.addPublisher('ndSimVars', this.simVarPublisher);
        this.backplane.addPublisher('fcu', this.fcuBusPublisher);
        this.backplane.addPublisher('fms', this.fmsDataPublisher);
        this.backplane.addPublisher('fg', this.fgDataPublisher);
        this.backplane.addPublisher('fms-arinc', this.fmBusPublisher);
        this.backplane.addPublisher('fms-symbols', this.fmsSymbolsPublisher);
        this.backplane.addPublisher('vor', this.vorBusPublisher);
        this.backplane.addPublisher('tcas', this.tcasBusPublisher);
        this.backplane.addPublisher('dmc', this.dmcPublisher);
        this.backplane.addPublisher('egpwc', this.egpwcBusPublisher);
        this.backplane.addPublisher('hEvent', this.hEventPublisher);

        this.backplane.addInstrument('clock', this.clock);

        this.doInit();
    }

    private doInit(): void {
        this.backplane.init();

        this.dmcPublisher.init();

        this.adirsValueProvider.start();

        FSComponent.render(
            <div ref={this.topRef}>
                <CdsDisplayUnit bus={this.bus} displayUnitId={DisplayUnitID.CaptNd} test={Subject.create(-1)} failed={Subject.create(false)}>
                    <div ref={this.ndContainerRef}>
                        <NDComponent
                            bus={this.bus}
                            side={this.efisSide}
                            rangeValues={a380EfisRangeSettings}
                        />
                    </div>
                    <ContextMenu
                        ref={this.contextMenuRef}
                        opened={this.contextMenuOpened}
                        idPrefix="contextMenu"
                        values={this.contextMenuItems}
                    />
                    <VerticalDisplayDummy bus={this.bus} side={this.efisSide} />
                    <div ref={this.oancContainerRef} class="oanc-container" style={`width: ${OANC_RENDER_WIDTH}px; height: ${OANC_RENDER_HEIGHT}px; overflow: hidden`}>
                        <div ref={this.waitScreenRef} class="oanc-waiting-screen">
                            PLEASE WAIT
                        </div>
                        <Oanc
                            bus={this.bus}
                            ref={this.oancRef}
                            setSelectedAirport={(arpt) => {
                                if (this.controlPanelRef.getOrDefault()) {
                                    this.controlPanelRef.instance.setSelectedAirport(arpt);
                                }
                            }}
                            contextMenuVisible={this.contextMenuVisible}
                            contextMenuItems={this.contextMenuItems.get()}
                            contextMenuX={this.contextMenuX}
                            contextMenuY={this.contextMenuY}
                            waitScreenRef={this.waitScreenRef}
                        />
                        <OansControlPanel
                            ref={this.controlPanelRef}
                            bus={this.bus}
                            amdbClient={this.oancRef.instance.amdbClient}
                            isVisible={this.controlPanelVisible}
                            onSelectAirport={(icao) => this.oancRef.instance.loadAirportMap(icao)}
                            togglePanel={() => this.controlPanelVisible.set(!this.controlPanelVisible.get())}
                            onZoomIn={() => this.oancRef.instance.handleZoomIn()}
                            onZoomOut={() => this.oancRef.instance.handleZoomOut()}
                        />
                    </div>
                    <MouseCursor side={Subject.create('CAPT')} ref={this.mouseCursorRef} />
                </CdsDisplayUnit>
            </div>,
            document.getElementById('ND_CONTENT'),
        );

        // Remove "instrument didn't load" text
        document.getElementById('ND_CONTENT').querySelector(':scope > h1').remove();

        this.topRef.instance.addEventListener('mousemove', (ev) => {
            this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        });

        this.oancContainerRef.instance.addEventListener('contextmenu', (e) => {
            // Not firing right now, use double click
            this.contextMenuPositionTriggered.set({ x: e.clientX, y: e.clientY });
            this.contextMenuRef.instance.display(e.clientX, e.clientY);
        });

        this.oancContainerRef.instance.addEventListener('dblclick', (e) => {
            this.contextMenuPositionTriggered.set({ x: e.clientX, y: e.clientY });
            this.contextMenuRef.instance.display(e.clientX, e.clientY);
        });

        this.oancContainerRef.instance.addEventListener('click', () => {
            this.contextMenuRef.instance.hideMenu();
        });

        const sub = this.bus.getSubscriber<FcuSimVars>();

        sub.on('ndRangeSetting').whenChanged().handle((range) => {
            if (range === 0 && this.ndContainerRef.getOrDefault() && this.oancContainerRef.getOrDefault()) {
                this.ndContainerRef.instance.style.display = 'none';
                this.oancContainerRef.instance.style.display = 'block';
            } else if (this.ndContainerRef.getOrDefault() && this.oancContainerRef.getOrDefault()) {
                this.ndContainerRef.instance.style.display = 'block';
                this.oancContainerRef.instance.style.display = 'none';
            }
        });
    }

    /**
     * A callback called when the instrument gets a frame update.
     */
    public Update(): void {
        this.backplane.onUpdate();

        if (this.oancRef.getOrDefault()) {
            this.oancRef.instance.Update();
        }
    }

    public onInteractionEvent(args: string[]): void {
        if (args[0].endsWith(`A32NX_EFIS_${this.efisSide}_CHRONO_PUSHED`)) {
            this.bus.getPublisher<NDControlEvents>().pub('chrono_pushed', undefined);
        }

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

class A380X_ND extends FsBaseInstrument<NDInstrument> {
    constructInstrument(): NDInstrument {
        return new NDInstrument();
    }

    get isInteractive(): boolean {
        return true;
    }

    get templateID(): string {
        return 'A380X_ND';
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

registerInstrument('a380x-nd', A380X_ND);
