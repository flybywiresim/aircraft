import {
    DisplayComponent,
    FSComponent,
    VNode,
    ComponentProps,
    EventBus,
    Subscribable,
    ConsumerSubject,
    Subject,
    Subscription,
    MappedSubject,
} from '@microsoft/msfs-sdk';
import React from 'react';
import { EFBSimvars } from '../../../../../../../fbw-a32nx/src/systems/instruments/src/EFBv4/EFBSimvarPublisher';
import { t } from './LocalizedText';
import { LocalizedString } from '../shared/translation';

interface StatusbarProps extends ComponentProps {
    bus: EventBus;
}

export class Statusbar extends DisplayComponent<StatusbarProps> {
    private readonly currentUTC: Subscribable<number>;

    private readonly currentLocalTime: Subscribable<number>;

    private readonly dayOfWeek: Subscribable<number>;

    private readonly monthOfYear: Subscribable<number>;

    private readonly dayOfMonth: Subscribable<number>;

    private readonly dayName: LocalizedString = LocalizedString.create('StatusBar.Sun');

    private readonly monthName: LocalizedString = LocalizedString.create('StatusBar.Jan');

    private readonly timezones: Subject<string> = Subject.create('utc');

    private readonly timeFormat: Subject<string> = Subject.create('24');

    private readonly timeDisplayed: Subscribable<string>;

    constructor(props: StatusbarProps) {
        super(props);

        const sub = this.props.bus.getSubscriber<EFBSimvars>();
        this.currentUTC = ConsumerSubject.create(sub.on('currentUTC'), 0);
        this.currentLocalTime = ConsumerSubject.create(sub.on('currentLocalTime'), 0);
        this.dayOfWeek = ConsumerSubject.create(sub.on('dayOfWeek'), 0);
        this.monthOfYear = ConsumerSubject.create(sub.on('monthOfYear'), 1);
        this.dayOfMonth = ConsumerSubject.create(sub.on('dayOfMonth'), 1);
        this.dayOfWeek = ConsumerSubject.create(sub.on('dayOfWeek'), 0);

        this.timeDisplayed = MappedSubject.create(([currentUTC, currentLocalTime, timezones, timeFormat]) => {
            const getZuluFormattedTime = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, '0')}${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}Z`;
            const getLocalFormattedTime = (seconds: number) => {
                if (timeFormat === '24') {
                    return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}`;
                }
                const hours = Math.floor(seconds / 3600) % 12;
                const minutes = Math.floor((seconds % 3600) / 60);
                const ampm = Math.floor(seconds / 3600) >= 12 ? 'pm' : 'am';
                return `${hours === 0 ? 12 : hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
            };

            const currentUTCString = getZuluFormattedTime(currentUTC);
            const currentLocalTimeString = getLocalFormattedTime(currentLocalTime);

            if (timezones === 'utc') {
                return currentUTCString;
            } else if (timezones === 'both') {
                return currentLocalTimeString;
            } else {
                return `${currentUTCString} / ${currentLocalTimeString}`;
            }
        }, this.currentUTC, this.currentLocalTime, this.timezones, this.timeFormat);
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.dayOfWeek.sub((value) => {
            this.dayName.set([
                'StatusBar.Sun',
                'StatusBar.Mon',
                'StatusBar.Tue',
                'StatusBar.Wed',
                'StatusBar.Thu',
                'StatusBar.Fri',
                'StatusBar.Sat',
            ][value]);
        }, true);

        this.monthOfYear.sub((value) => {
            this.monthName.set([
                'StatusBar.Jan',
                'StatusBar.Feb',
                'StatusBar.Mar',
                'StatusBar.Apr',
                'StatusBar.May',
                'StatusBar.Jun',
                'StatusBar.Jul',
                'StatusBar.Aug',
                'StatusBar.Sep',
                'StatusBar.Oct',
                'StatusBar.Nov',
                'StatusBar.Dec',
            ][value - 1]);
        }, true);
    }

    render(): VNode {
        return (
            <div class="fixed z-30 flex h-10 w-full items-center justify-between bg-theme-statusbar px-6 text-lg font-medium leading-none text-theme-text">
                <p>
                    {this.dayName}
                    {' '}
                    {this.monthName}
                    {' '}
                    {this.dayOfMonth.map((value) => value.toFixed())}
                </p>

                <div className="absolute inset-x-0 mx-auto flex w-min flex-row items-center justify-center space-x-4">
                    <p>{this.timeDisplayed}</p>
                </div>

                <div className="flex items-center gap-4">
                </div>
            </div>
        );
    }
}
