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

    private static getDigitsFromBco16(code: number): number {
        let codeCopy = code;
        const digits: number[] = [];
        while (codeCopy > 0) {
            digits.push(codeCopy % 16);
            codeCopy = Math.floor(codeCopy / 16);
        }
        if (digits.length < 4) {
            const digitsToAdd = 4 - digits.length;
            for (let i = 0; i < digitsToAdd; i++) {
                digits.push(0);
            }
        }
        digits.reverse();

        let squawk = 0;
        digits.forEach((digit) => {
            squawk = squawk * 10 + digit;
        });

        return squawk;
    }

    public initialize(): void {
        this.publisher = this.bus.getPublisher<TransponderDataBusTypes>();
        this.subscriber = this.bus.getSubscriber<TransponderSimvars>();

        this.subscriber.on('msfsTransponderCode').whenChanged().handle((code: number) => {
            const squawk = TransponderInputBus.getDigitsFromBco16(code);
            console.log(`Received transponder: ${squawk}`);
            this.publisher.pub('transponderCode', squawk, true, false);
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
