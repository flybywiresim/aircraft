import { EventBus, EventSubscriber, Publisher, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

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

    private publisher: Publisher<FwcDataBusTypes> = null;

    private subscriber: EventSubscriber<FwcSimvars> = null;

    constructor(private readonly bus: EventBus) {
        this.simVarPublisher = new FwcSimvarPublisher(this.bus);
    }

    public initialize(): void {
        this.publisher = this.bus.getPublisher<FwcDataBusTypes>();
        this.subscriber = this.bus.getSubscriber<FwcSimvars>();

        this.subscriber.on('msfsCompanyMessageCount').whenChanged().handle((count: number) => this.publisher.pub('companyMessageCount', count, true, false));
    }

    public connectedCallback(): void {
        this.simVarPublisher.subscribe('msfsCompanyMessageCount');
    }

    public startPublish(): void {
        this.simVarPublisher.startPublish();
    }

    public update(): void {
        this.simVarPublisher.onUpdate();
    }
}

export class FwcOutputBus {
    constructor(private readonly bus: EventBus) { }

    public setCompanyMessageCount(count: number): void {
        SimVar.SetSimVarValue(FwcSimvarSources.companyMessageCount, 'number', count);
    }

    public activateAtcRing(): void {
        Coherent.call('PLAY_INSTRUMENT_SOUND', 'cpdlc_ring');
        // ensure that the timeout is longer than the sound
        setTimeout(() => SimVar.SetSimVarValue('W:cpdlc_ring', 'boolean', 0), 2000);
    }
}
