import { DisplayComponent, FSComponent, VNode, ComponentProps, EventBus, Subscribable, ConsumerSubject, Subject } from '@microsoft/msfs-sdk';
import React from 'react';
import { EFBSimvars } from '../../../../../../../fbw-a32nx/src/systems/instruments/src/EFBv4/EFBSimvarPublisher';
import { t } from './LocalizedText';

interface StatusbarProps extends ComponentProps {
    bus: EventBus;
}

export class Statusbar extends DisplayComponent<StatusbarProps> {
    private readonly currentUTC: Subscribable<number>;

    private readonly currentLocalTime: Subscribable<number>;

    private readonly dayOfWeek: Subscribable<number>;

    private readonly monthOfYear: Subscribable<number>;

    private readonly dayOfMonth: Subscribable<number>;

    private readonly dayName: Subject<VNode> = Subject.create(t('StatusBar.Sun'));

    private readonly monthName: Subject<VNode> = Subject.create(t('StatusBar.Jan'));

    private readonly timeDisplayed: Subject<string> = Subject.create('0000Z');

    constructor(props: StatusbarProps) {
        super(props);

        const sub = this.props.bus.getSubscriber<EFBSimvars>();
        this.currentUTC = ConsumerSubject.create(sub.on('currentUTC'), 0);
        this.currentLocalTime = ConsumerSubject.create(sub.on('currentLocalTime'), 0);
        this.dayOfWeek = ConsumerSubject.create(sub.on('dayOfWeek'), 0);
        this.monthOfYear = ConsumerSubject.create(sub.on('monthOfYear'), 1);
        this.dayOfWeek = ConsumerSubject.create(sub.on('dayOfWeek'), 0);
    }

    onBeforeRender() {
        super.onBeforeRender();

        this.dayName.set([
            t('StatusBar.Sun'),
            t('StatusBar.Mon'),
            t('StatusBar.Tue'),
            t('StatusBar.Wed'),
            t('StatusBar.Thu'),
            t('StatusBar.Fri'),
            t('StatusBar.Sat'),
        ][this.dayOfWeek.get()]);

        this.monthName.set([
            t('StatusBar.Jan'),
            t('StatusBar.Feb'),
            t('StatusBar.Mar'),
            t('StatusBar.Apr'),
            t('StatusBar.May'),
            t('StatusBar.Jun'),
            t('StatusBar.Jul'),
            t('StatusBar.Aug'),
            t('StatusBar.Sep'),
            t('StatusBar.Oct'),
            t('StatusBar.Nov'),
            t('StatusBar.Dec'),
        ][this.monthOfYear.get() - 1]);
    }

    render(): VNode {
        return (
            <div class="fixed z-30 flex h-10 w-full items-center justify-between bg-theme-statusbar px-6 text-lg font-medium leading-none text-theme-text">
                <p>{`${this.dayName} ${this.monthName} ${this.dayOfMonth}`}</p>

                <div className="absolute inset-x-0 mx-auto flex w-min flex-row items-center justify-center space-x-4">
                    {
                        <div />
                    }
                </div>
            </div>
        );
    }
}
