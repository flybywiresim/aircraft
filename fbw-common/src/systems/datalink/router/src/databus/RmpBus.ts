import { EventBus, EventSubscriber, Publisher, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

interface RmpSimvars {
    msfsVhf3Powered: number,
    msfsVhf3Frequency: number,
}

enum RmpSimvarSources {
    vhf3Powered = 'L:A32NX_ELEC_DC_1_BUS_IS_POWERED',
    vhf3Frequency = 'A:COM ACTIVE FREQUENCY:3',
}

export class RmpSimvarPublisher extends SimVarPublisher<RmpSimvars> {
    private static simvars = new Map<keyof RmpSimvars, SimVarDefinition>([
        ['msfsVhf3Powered', { name: RmpSimvarSources.vhf3Powered, type: SimVarValueType.Number }],
        ['msfsVhf3Frequency', { name: RmpSimvarSources.vhf3Frequency, type: SimVarValueType.MHz }],
    ]);

    public constructor(bus: EventBus) {
        super(RmpSimvarPublisher.simvars, bus);
    }
}

export interface RmpDataBusTypes {
    transponderCode: number,
    vhf3Powered: boolean,
    vhf3DataMode: boolean,
}

export class RmpInputBus {
    private simVarPublisher: RmpSimvarPublisher = null;

    private subscriber: EventSubscriber<RmpSimvars> = null;

    private publisher: Publisher<RmpDataBusTypes> = null;

    constructor(private readonly bus: EventBus) {
        this.simVarPublisher = new RmpSimvarPublisher(this.bus);
    }

    public initialize(): void {
        this.publisher = this.bus.getPublisher<RmpDataBusTypes>();
        this.subscriber = this.bus.getSubscriber<RmpSimvars>();

        this.subscriber.on('msfsVhf3Powered').handle((powered: number) => this.publisher.pub('vhf3Powered', powered !== 0, false, false));
        this.subscriber.on('msfsVhf3Frequency').handle((frequency: number) => this.publisher.pub('vhf3DataMode', frequency === 0, false, false));
    }

    public connectedCallback(): void {
        this.simVarPublisher.subscribe('msfsVhf3Powered');
        this.simVarPublisher.subscribe('msfsVhf3Frequency');
    }

    public startPublish(): void {
        this.simVarPublisher.startPublish();
    }

    public update(): void {
        this.simVarPublisher.onUpdate();
    }
}
