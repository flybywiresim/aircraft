//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtcAocBus } from '@datalink/atc';
import { Clock, ClockDataBusTypes, FreetextMessage, FwcDataBusTypes } from '@datalink/common';
import { RouterAtcAocBus } from '@datalink/router';
import { EventBus, EventSubscriber } from 'msfssdk';
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

    public readonly fmsBus: FmsAocBus;

    public readonly routerBus: RouterAtcAocBus;

    public readonly atcAocBus: AtcAocBus;

    private resetData(): void {
        this.UtcClock = new Clock(0, 0, 0, 0, 0, 0, 0);
        this.CompanyMessageCount = 0;
    }

    constructor(private readonly bus: EventBus, synchronizedAtc: boolean) {
        this.resetData();
        this.fmsBus = new FmsAocBus(this.bus);
        this.routerBus = new RouterAtcAocBus(this.bus);
        this.atcAocBus = new AtcAocBus(this.bus, synchronizedAtc, false);
    }

    public initialize(): void {
        this.fmsBus.initialize();
        this.subscriber = this.bus.getSubscriber<ClockDataBusTypes & FwcDataBusTypes>();
    }

    public connectedCallback(): void {
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

    public powerUp(): void {
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.poweredUp = false;
        this.resetData();
    }
}
