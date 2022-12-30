import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

interface ClockSimvars {
    msfsUtcYear: number,
    msfsUtcMonth: number,
    msfsUtcDayOfMonth: number,
    msfsUtcSeconds: number,
}

enum ClockSimvarSources {
    utcYear = 'E:ZULU YEAR',
    utcMonth = 'E:ZULU MONTH OF YEAR',
    utcDayOfMonth = 'E:ZULU DAY OF MONTH',
    utcSeconds = 'E:ZULU TIME',
}

export class ClockSimvarPublisher extends SimVarPublisher<ClockSimvars> {
    private static simvars = new Map<keyof ClockSimvars, SimVarDefinition>([
        ['msfsUtcYear', { name: ClockSimvarSources.utcYear, type: SimVarValueType.Number }],
        ['msfsUtcMonth', { name: ClockSimvarSources.utcMonth, type: SimVarValueType.Number }],
        ['msfsUtcDayOfMonth', { name: ClockSimvarSources.utcDayOfMonth, type: SimVarValueType.Number }],
        ['msfsUtcSeconds', { name: ClockSimvarSources.utcSeconds, type: SimVarValueType.Number }],
    ]);

    public constructor(bus: EventBus) {
        super(ClockSimvarPublisher.simvars, bus);
    }
}

export interface ClockDataBusTypes {
    utcYear: number,
    utcMonth: number,
    utcDayOfMonth: number,
    utcHour: number,
    utcMinute: number,
    utcSecond: number,
    utcSecondsOfDay: number,
}

export class ClockInputBus {
    private simVarPublisher: ClockSimvarPublisher = null;

    constructor(private readonly bus: EventBus) { }

    public initialize(): void {
        const publisher = this.bus.getPublisher<ClockDataBusTypes>();
        const subscriber = this.bus.getSubscriber<ClockSimvars>();

        subscriber.on('msfsUtcYear').whenChanged().handle((year: number) => publisher.pub('utcYear', year));
        subscriber.on('msfsUtcMonth').whenChanged().handle((month: number) => publisher.pub('utcMonth', month));
        subscriber.on('msfsUtcDayOfMonth').whenChanged().handle((day: number) => publisher.pub('utcDayOfMonth', day));
        subscriber.on('msfsUtcSeconds').whenChanged().handle((seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor(seconds / 60) % 60;
            const secondsOfMinute = Math.floor(seconds) - hours * 3600 + minutes * 60;

            publisher.pub('utcHour', hours);
            publisher.pub('utcMinute', minutes);
            publisher.pub('utcSecond', secondsOfMinute);
            publisher.pub('utcSecondsOfDay', seconds);
        });

        this.simVarPublisher = new ClockSimvarPublisher(this.bus);
        this.simVarPublisher.subscribe('msfsUtcYear');
        this.simVarPublisher.subscribe('msfsUtcMonth');
        this.simVarPublisher.subscribe('msfsUtcDayOfMonth');
        this.simVarPublisher.subscribe('msfsUtcSeconds');
    }
}
