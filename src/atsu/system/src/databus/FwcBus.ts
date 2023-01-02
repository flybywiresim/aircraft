import { EventBus, Publisher, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

interface FwcSimvars {
    msfsCompanyMessageCount: number,
}

enum FwcSimvarSources {
    companyMessageCount = 'L:A32NX_COMPANY_MSG_COUNT',
}

export class FwcSimvarPublisher extends SimVarPublisher<FwcSimvars> {
    private static simvars = new Map<keyof FwcSimvars, SimVarDefinition>([
        ['msfsCompanyMessageCount', { name: FwcSimvarSources.companyMessageCount, type: SimVarValueType.Number }],
    ]);

    public constructor(bus: EventBus) {
        super(FwcSimvarPublisher.simvars, bus);
    }
}

export interface FwcDataBusTypes {
    companyMessageCount: number,
}

export class FwcInputBus {
    private simVarPublisher: FwcSimvarPublisher = null;

    constructor(private readonly bus: EventBus) { }

    public initialize(): void {
        const publisher = this.bus.getPublisher<FwcDataBusTypes>();
        const subscriber = this.bus.getSubscriber<FwcSimvars>();

        subscriber.on('msfsCompanyMessageCount').whenChanged().handle((count: number) => publisher.pub('companyMessageCount', count));

        this.simVarPublisher = new FwcSimvarPublisher(this.bus);
    }

    public connectedCallback(): void {
        this.simVarPublisher.subscribe('msfsCompanyMessageCount');
    }
}

export class FwcOutputBus {
    private publisher: Publisher<FwcSimvars> = null;

    constructor(private readonly bus: EventBus) { }

    public initialize(): void {
        this.publisher = this.bus.getPublisher<FwcSimvars>();
    }

    public setCompanyMessageCount(count: number): void {
        this.publisher.pub('msfsCompanyMessageCount', count, true, false);
    }

    public activateAtcRing(): void {
        Coherent.call('PLAY_INSTRUMENT_SOUND', 'cpdlc_ring');
        // ensure that the timeout is longer than the sound
        setTimeout(() => SimVar.SetSimVarValue('W:cpdlc_ring', 'boolean', 0), 2000);
    }
}
