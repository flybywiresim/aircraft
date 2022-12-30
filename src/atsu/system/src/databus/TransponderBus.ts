import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

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

    constructor(private readonly bus: EventBus) { }

    private static getDigitsFromBco16(code: number): number[] {
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
        return digits;
    }

    public initialize(): void {
        const publisher = this.bus.getPublisher<TransponderDataBusTypes>();
        const subscriber = this.bus.getSubscriber<TransponderSimvars>();

        subscriber.on('msfsTransponderCode').whenChanged().handle((code: number) => {
            const digits = TransponderInputBus.getDigitsFromBco16(code);
            let squawk = 0;

            digits.forEach((digit) => {
                squawk = squawk * 10 + digit;
            });

            publisher.pub('transponderCode', squawk);
        });

        this.simVarPublisher = new TransponderSimvarPublisher(this.bus);
        this.simVarPublisher.subscribe('msfsTransponderCode');
    }
}
