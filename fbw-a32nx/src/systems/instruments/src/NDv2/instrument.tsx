import { Clock, FsBaseInstrument, FSComponent, FsInstrument, HEventPublisher, InstrumentBackplane } from '@microsoft/msfs-sdk';
import { EfisSide } from '@shared/NavigationDisplay';
import { NDComponent } from './ND';
import { NDSimvarPublisher, NDSimvars } from './NDSimvarPublisher';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';
import { FmsDataPublisher } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { FmsSymbolsPublisher } from './FmsSymbolsPublisher';
import { VorBusPublisher } from '../MsfsAvionicsCommon/providers/VorBusPublisher';
import { TcasBusPublisher } from '../MsfsAvionicsCommon/providers/TcasBusPublisher';
import { FGDataPublisher } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { NDControlEvents } from './NDControlEvents';
import { getDisplayIndex } from '../MsfsAvionicsCommon/displayUnit';
import { EgpwcBusPublisher } from '../MsfsAvionicsCommon/providers/EgpwcBusPublisher';
import { DmcPublisher } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { FMBusPublisher } from '../MsfsAvionicsCommon/providers/FMBusPublisher';
import { ArincEventBus } from '../MsfsAvionicsCommon/ArincEventBus';
import { FcuBusPublisher } from '../MsfsAvionicsCommon/providers/FcuBusPublisher';

import './style.scss';

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

    constructor() {
        const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';

        this.efisSide = side;

        this.bus = new ArincEventBus();

        this.simVarPublisher = new NDSimvarPublisher(this.bus);
        this.fcuBusPublisher = new FcuBusPublisher(this.bus, side);
        this.fmsDataPublisher = new FmsDataPublisher(this.bus, side);
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

        this.backplane.addInstrument('clock', this.clock);

        this.doInit();
    }

    private doInit(): void {
        this.backplane.init();

        this.dmcPublisher.init();

        this.adirsValueProvider.start();

        FSComponent.render(<NDComponent bus={this.bus} side={this.efisSide} />, document.getElementById('ND_CONTENT'));

        // Remove "instrument didn't load" text
        document.getElementById('ND_CONTENT').querySelector(':scope > h1').remove();
    }

    /**
     * A callback called when the instrument gets a frame update.
     */
    public Update(): void {
        this.backplane.onUpdate();
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

class A32NX_ND extends FsBaseInstrument<NDInstrument> {
    constructInstrument(): NDInstrument {
        return new NDInstrument();
    }

    get isInteractive(): boolean {
        return false;
    }

    get templateID(): string {
        return 'A32NX_ND';
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

registerInstrument('a32nx-nd', A32NX_ND);
