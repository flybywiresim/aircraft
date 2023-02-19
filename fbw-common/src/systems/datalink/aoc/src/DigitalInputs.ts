import { AtcAocBus } from '@datalink/atc';
import { Clock, ClockDataBusTypes, ClockInputBus, FreetextMessage } from '@datalink/common';
import { RouterAtcAocBus } from '@datalink/router';
import { EventBus, EventSubscriber } from 'msfssdk';
import { FwcDataBusTypes, FwcAocBus } from './databus/FwcBus';
import { FmsAocBus } from './databus/FmsBus';

export type DigitalInputCallbacks = {
    receivedFreetextMessage: (message: FreetextMessage) => void;
}

export class DigitalInputs {
    private subscriber: EventSubscriber<ClockDataBusTypes & FwcDataBusTypes> = null;

    private poweredUp: boolean = false;

    private callbacks: DigitalInputCallbacks = {
        receivedFreetextMessage: null,
    };

    public UtcClock: Clock;

    public CompanyMessageCount: number = 0;

    private readonly clockBus: ClockInputBus;

    public readonly fwcBus: FwcAocBus;

    public readonly fmsBus: FmsAocBus;

    public readonly routerBus: RouterAtcAocBus;

    public readonly atcAocBus: AtcAocBus;

    private resetData(): void {
        this.UtcClock = new Clock(0, 0, 0, 0, 0, 0, 0);
        this.CompanyMessageCount = 0;
    }

    constructor(private readonly bus: EventBus, synchronizedAtc: boolean) {
        this.resetData();
        this.clockBus = new ClockInputBus(this.bus);
        this.fwcBus = new FwcAocBus(this.bus);
        this.fmsBus = new FmsAocBus(this.bus);
        this.routerBus = new RouterAtcAocBus(this.bus);
        this.atcAocBus = new AtcAocBus(this.bus, synchronizedAtc, false);
    }

    public initialize(): void {
        this.clockBus.initialize();
        this.fwcBus.initialize();
        this.fmsBus.initialize();
        this.subscriber = this.bus.getSubscriber<ClockDataBusTypes & FwcDataBusTypes>();
    }

    public connectedCallback(): void {
        this.clockBus.connectedCallback();
        this.fwcBus.connectedCallback();

        this.subscriber.on('utcYear').handle((year: number) => {
            if (this.poweredUp) this.UtcClock.year = year;
        });
        this.subscriber.on('utcMonth').handle((month: number) => {
            if (this.poweredUp) this.UtcClock.month = month;
        });
        this.subscriber.on('utcDayOfMonth').handle((dayOfMonth: number) => {
            if (this.poweredUp) this.UtcClock.dayOfMonth = dayOfMonth;
        });
        this.subscriber.on('utcHour').handle((hour: number) => {
            if (this.poweredUp) this.UtcClock.hour = hour;
        });
        this.subscriber.on('utcMinute').handle((minute: number) => {
            if (this.poweredUp) this.UtcClock.minute = minute;
        });
        this.subscriber.on('utcSecond').handle((second: number) => {
            if (this.poweredUp) this.UtcClock.second = second;
        });
        this.subscriber.on('utcSecondsOfDay').handle((seconds: number) => {
            if (this.poweredUp) this.UtcClock.secondsOfDay = seconds;
        });
        this.subscriber.on('companyMessageCount').handle((count: number) => {
            if (this.poweredUp) this.CompanyMessageCount = count;
        });
    }

    public startPublish(): void {
        this.clockBus.startPublish();
        this.fwcBus.startPublish();
    }

    public powerUp(): void {
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.poweredUp = false;
        this.resetData();
    }

    public update(): void {
        this.clockBus.update();
        this.fwcBus.update();
    }
}
