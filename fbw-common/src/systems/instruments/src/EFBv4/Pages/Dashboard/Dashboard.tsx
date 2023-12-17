// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    ComponentProps,
    DisplayComponent,
    FSComponent,
    Subject,
    Subscribable,
    Subscription,
    VNode,
} from '@microsoft/msfs-sdk';
import { ColorCode, MetarParserType, NXDataStore } from '@flybywiresim/fbw-sdk';

import { t } from '../../Components/LocalizedText';
import { WeatherWidget } from './Widgets/WeatherWidget';

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

export class RemindersWidget extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="w-1/2">
                <div class="flex flex-row items-center justify-between space-x-3">
                    <h1 class="font-bold">{t('Dashboard.ImportantInformation.Title')}</h1>
                </div>
                <div class="relative mt-4 h-content-section-reduced w-full rounded-lg border-2 border-theme-accent p-6">
                    <ScrollableContainer height={51}>
                        <WeatherReminder />
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

export class RemindersSection extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="flex flex-col border-b-2 border-gray-700 pb-6">
                {/** There was a <Link /> here, im not sure why * */}
                {this.props.children}
            </div>
        );
    }
}

export class WeatherReminder extends DisplayComponent<any> {
    render(): VNode {
        return (
            <RemindersSection>
                <div class="space-y-6">
                    <WeatherWidget name="origin" />
                    <div className="h-1 w-full rounded-full bg-theme-accent" />
                    <WeatherWidget name="destination" />
                </div>
            </RemindersSection>
        );
    }
}

export class BaroValue extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><p>HELO</p></div>
        );
    }
}

export interface DashboardProps {
}

export class Dashboard extends DisplayComponent<DashboardProps> {
    render(): VNode {
        return (
            <div class="flex w-full space-x-8">
                <FlightWidget />
                <RemindersWidget />
            </div>
        );
    }
}
