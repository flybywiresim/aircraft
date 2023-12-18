// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    ArraySubject,
    ClockEvents,
    ComponentProps,
    ConsumerSubject,
    DisplayComponent,
    FSComponent,
    Subject,
    Subscribable,
    Subscription,
    VNode,
} from '@microsoft/msfs-sdk';
import { ColorCode, MetarParserType, NXDataStore } from '@flybywiresim/fbw-sdk';

import { t } from '../../Components/LocalizedText';
import { WeatherReminder, WeatherWidget } from './Widgets/WeatherWidget';
import { AbstractUIView } from '../../shared/UIVIew';
import {Pages} from "../Pages";
import {PageEnum} from '../../shared/common';

interface ScrollableContainerProps extends ComponentProps {
    height: number;
    class?: string;
    innerClass?: string;
    initialScroll?: number;
    onScroll?: (scrollTop: number) => void;
    onScrollStop?: (scrollTop: number) => void;
    nonRigid?: boolean;
}

export interface FlightWidgetProps {
}

export class FlightWidget extends DisplayComponent<FlightWidgetProps> {
    private readonly languageButtonRefs = [
        FSComponent.createRef<HTMLButtonElement>(),
        FSComponent.createRef<HTMLButtonElement>(),
    ];

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.languageButtonRefs[0].instance.addEventListener('click', () => this.handleChangeLanguage('en'));
        this.languageButtonRefs[1].instance.addEventListener('click', () => this.handleChangeLanguage('ko'));
    }

    private readonly handleChangeLanguage = (langCode: string): void => {
        NXDataStore.set('EFB_LANGUAGE', langCode);
    }

    render(): VNode {
        return (
            <div class="w-1/2">
                <div class="mb-4 flex flex-row items-center justify-between">
                    <h1 class="font-bold">{t('Dashboard.YourFlight.Title')}</h1>
                </div>
                <div class="relative flex h-content-section-reduced w-full flex-col overflow-hidden rounded-lg border-2 border-theme-accent p-6">
                    <div>
                        <button type="button" ref={this.languageButtonRefs[0]} class="bg-cyan px-5 py-2.5">Set language to English</button>
                        <button type="button" ref={this.languageButtonRefs[1]} class="bg-cyan px-5 py-2.5">Set language to Korean</button>
                    </div>
                </div>
            </div>
        );
    }
}

export class PinnedChartsReminder extends DisplayComponent<any> {
    render(): VNode {
        return (
            <></>
        );
    }
}

export class MaintenanceReminder extends DisplayComponent<any> {
    render(): VNode {
        return (
            <></>
        );
    }
}

export class ChecklistsReminder extends DisplayComponent<any> {
    render(): VNode {
        return (
            <></>
        );
    }
}

type ReminderKey = 'Weather' | 'Pinned Charts' | 'Maintenance' | 'Checklists';

const TRANSLATIONS: [PageEnum.ReminderWidgets, string][] = [
    [PageEnum.ReminderWidgets.Weather, 'Dashboard.ImportantInformation.Weather.Title'],
    [PageEnum.ReminderWidgets.PinnedCharts, 'Dashboard.ImportantInformation.PinnedCharts.Title'],
    [PageEnum.ReminderWidgets.Maintenance, 'Dashboard.ImportantInformation.Maintenance.Title'],
    [PageEnum.ReminderWidgets.Checklists, 'Dashboard.ImportantInformation.Checklists.Title'],
];

export class RemindersWidget extends DisplayComponent<any> {
    // Has to be in here idk why
    private readonly REMINDERS = new Map<PageEnum.ReminderWidgets, VNode>([
        [PageEnum.ReminderWidgets.Weather, <WeatherReminder />],
        [PageEnum.ReminderWidgets.PinnedCharts, <PinnedChartsReminder />],
        [PageEnum.ReminderWidgets.Maintenance, <MaintenanceReminder />],
        [PageEnum.ReminderWidgets.Checklists, <ChecklistsReminder />],
    ]);

    private readonly TRANSLATIONS = new Map<PageEnum.ReminderWidgets, string>([
        [PageEnum.ReminderWidgets.Weather, 'Dashboard.ImportantInformation.Weather.Title'],
        [PageEnum.ReminderWidgets.PinnedCharts, 'Dashboard.ImportantInformation.PinnedCharts.Title'],
        [PageEnum.ReminderWidgets.Maintenance, 'Dashboard.ImportantInformation.Maintenance.Title'],
        [PageEnum.ReminderWidgets.Checklists, 'Dashboard.ImportantInformation.Checklists.Title'],
    ]);

    // This gets saved to settings
    private readonly orderedReminderKeys = Subject.create<string>([...this.REMINDERS.keys()].toString())

    private readonly reminderKeyArr = ArraySubject.create(this.orderedReminderKeys.get().split(',').map((key) => Number(key) as PageEnum.ReminderWidgets))

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        /**
         * Let's check for any missing keys in the saved list in case more widgets get added in the future.
         * TODO: test it
         */
        [...this.REMINDERS.keys()].forEach((key ) => {
            const keyEnum = key as PageEnum.ReminderWidgets
            if (!this.reminderKeyArr.getArray().includes(keyEnum)) {
                this.reminderKeyArr.insert(keyEnum);
                this.orderedReminderKeys.set(`${this.orderedReminderKeys.get()},${keyEnum}`)
            }
        });
    }


    render(): VNode {
        return (
            <div class="w-1/2">
                <div class="flex flex-row items-center justify-between space-x-3">
                    <h1 class="font-bold">{t('Dashboard.ImportantInformation.Title')}</h1>
                </div>
                <div class="relative mt-4 h-content-section-reduced w-full rounded-lg border-2 border-theme-accent p-6">
                    <ScrollableContainer height={51}>
                        <div class="flex flex-col space-y-4">
                            {this.reminderKeyArr.getArray().map((key) => this.REMINDERS.get(key))}
                        </div>
                    </ScrollableContainer>
                </div>
            </div>
        );
    }
}

export class ScrollableContainer extends DisplayComponent<ScrollableContainerProps> {
    private readonly content = FSComponent.createRef<HTMLSpanElement>();

    private readonly container = FSComponent.createRef<HTMLSpanElement>();

    private readonly contentOverflows = Subject.create(false);

    private readonly position = Subject.create({ top: 0, y: 0 });

    private readonly innerClass = this.contentOverflows.map((value) => {
        // TODO: I'm inverting this so it always treats them as overflowing.
        const contentPadding = !value ? 'mr-6' : '';

        return `${this.props.innerClass ? this.props.innerClass : ''} ${contentPadding}`;
    })

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        // this.container.instance.addEventListener('mousedown', () => {
        //     this.container.instance.offsetTop = this.position.
        // })
    }

    render(): VNode {
        return (
            <div
                ref={this.container}
                class={`scrollbar w-full overflow-y-auto ${this.props.class}`}
                style={this.props.nonRigid ? { maxHeight: `${this.props.height}rem` } : { height: `${this.props.height}rem` }}
            >
                <div class={this.innerClass} ref={this.content}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export interface DashboardProps {
}

export class Dashboard extends AbstractUIView<DashboardProps> {
    private readonly funnySub = ConsumerSubject.create(
        null,
        -1,
    );

    pause() {
        console.log('I was paused');
        this.funnySub.pause();
    }

    resume() {
        console.log('I was resumed');
        this.funnySub.resume();
    }

    destroy() {
        this.funnySub.destroy();
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.funnySub.setConsumer(
            this.bus.getSubscriber<ClockEvents>().on('realTime').atFrequency(1),
        );
        this.funnySub.sub((value) => console.log('time:', value));
    }

    render(): VNode {
        return (
            <div ref={this.rootRef} class="flex w-full space-x-8">
                <FlightWidget />
                <RemindersWidget />
            </div>
        );
    }
}
