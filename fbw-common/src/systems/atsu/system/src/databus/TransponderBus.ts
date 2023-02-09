import { EventBus, EventSubscriber, Publisher, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

interface TransponderSimvars {
    msfsTransponderCode: number,
}

enum TransponderSimvarSources {
    transponderCode = 'TRANSPONDER CODE:1',
}

export class TransponderSimvarPublisher extends SimVarPublisher<TransponderSimvars> {
    private static simvars = new Map<keyof TransponderSimvars, SimVarDefinition>([
        ['msfsTransponderCode', { name: TransponderSimvarSources.transponderCode, type: SimVarValueType.Number }],
    ]);

    public constructor(bus: EventBus) {
        super(TransponderSimvarPublisher.simvars, bus);
    }
}

export interface TransponderDataBusTypes {
    transponderCode: number,
}

export class TransponderInputBus {
    private simVarPublisher: TransponderSimvarPublisher = null;

    private publisher: Publisher<TransponderDataBusTypes> = null;

    private subscriber: EventSubscriber<TransponderSimvars> = null;

    constructor(private readonly bus: EventBus) {
        this.simVarPublisher = new TransponderSimvarPublisher(this.bus);
    }

    public initialize(): void {
        this.publisher = this.bus.getPublisher<TransponderDataBusTypes>();
        this.subscriber = this.bus.getSubscriber<TransponderSimvars>();

        this.subscriber.on('msfsTransponderCode').handle((code: number) => {
            this.publisher.pub('transponderCode', code, true, false);
        });
    }

    public connectedCallback(): void {
        this.simVarPublisher.subscribe('msfsTransponderCode');
    }

    public startPublish(): void {
        this.simVarPublisher.startPublish();
    }

    public update(): void {
        this.simVarPublisher.onUpdate();
    }
}
