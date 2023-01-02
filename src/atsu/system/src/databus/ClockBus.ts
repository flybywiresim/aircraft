import { EventBus, EventSubscriber, Publisher, SimVarDefinition, SimVarPublisher, SimVarValueType } from 'msfssdk';

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

    private subscriber: EventSubscriber<ClockSimvars> = null;

    private publisher: Publisher<ClockDataBusTypes> = null;

    constructor(private readonly bus: EventBus) { }

    public initialize(): void {
        this.publisher = this.bus.getPublisher<ClockDataBusTypes>();
        this.subscriber = this.bus.getSubscriber<ClockSimvars>();

        this.subscriber.on('msfsUtcYear').whenChanged().handle((year: number) => this.publisher.pub('utcYear', year));
        this.subscriber.on('msfsUtcMonth').whenChanged().handle((month: number) => this.publisher.pub('utcMonth', month));
        this.subscriber.on('msfsUtcDayOfMonth').whenChanged().handle((day: number) => this.publisher.pub('utcDayOfMonth', day));
        this.subscriber.on('msfsUtcSeconds').whenChanged().handle((seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor(seconds / 60) % 60;
            const secondsOfMinute = Math.floor(seconds) - hours * 3600 + minutes * 60;

            this.publisher.pub('utcHour', hours);
            this.publisher.pub('utcMinute', minutes);
            this.publisher.pub('utcSecond', secondsOfMinute);
            this.publisher.pub('utcSecondsOfDay', seconds);
        });

        this.simVarPublisher = new ClockSimvarPublisher(this.bus);
    }

    public connectedCallback(): void {
        this.simVarPublisher.subscribe('msfsUtcYear');
        this.simVarPublisher.subscribe('msfsUtcMonth');
        this.simVarPublisher.subscribe('msfsUtcDayOfMonth');
        this.simVarPublisher.subscribe('msfsUtcSeconds');
    }
}
