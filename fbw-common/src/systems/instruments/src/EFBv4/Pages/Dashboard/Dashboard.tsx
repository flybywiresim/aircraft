// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {DisplayComponent, FSComponent, VNode, ComponentProps, Subscribable, Subject, MappedSubject} from '@microsoft/msfs-sdk';
import {MetarParserType, NXDataStore} from '@flybywiresim/fbw-sdk';

import { t } from '../../Components/LocalizedText';
import { Pager, Pages } from '../Pages';
import {PageEnum} from "../../shared/common";

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
    pongText: Subscribable<string>;
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
                <div class="relative flex flex-col h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
                    <div>
                        <button type="button" ref={this.languageButtonRefs[0]} class="bg-cyan px-5 py-2.5">Set language to English</button>
                        <button type="button" ref={this.languageButtonRefs[1]} class="bg-cyan px-5 py-2.5">Set language to Korean</button>
                    </div>
                    <span class="text-2xl text-red">{this.props.pongText}</span>
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
    private readonly position = Subject.create({top: 0, y: 0});

    private readonly innerClass = this.contentOverflows.map((value) => {
        //TODO: I'm inverting this so it always treats them as overflowing.
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
                class={`w-full overflow-y-auto scrollbar ${this.props.class}`}
                style={this.props.nonRigid ? { maxHeight: `${this.props.height}rem` } : { height: `${this.props.height}rem` }}
            >
                <div class={this.innerClass} ref={this.content} >
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export class RemindersSection extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="flex flex-col pb-6 border-b-2 border-gray-700">
                {/** There was a <Link /> here, im not sure why **/}
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
                    <div className="w-full h-1 bg-theme-accent rounded-full" />
                    <WeatherWidget name="destination" />
                </div>
            </RemindersSection>
        );
    }
}

export class ColoredMetar extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><p>hi</p></div>
        )
    }
}

export class BaroValue extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div><p>HELO</p></div>
        )
    }
}

interface WeatherWidgetProps extends ComponentProps {
    name: string,
}

export class WeatherWidget extends DisplayComponent<WeatherWidgetProps> {
    private readonly baroType = Subject.create('HPA');
    private readonly metarSource = Subject.create('MSFS');
    private readonly metarError = Subject.create('');
    private readonly usingColoredMetar = Subject.create(PageEnum.WeatherWidgetPage.Some);

    private readonly metar: Subject<MetarParserType | null> = Subject.create(null);
    private readonly isMetar: Subscribable<PageEnum.WeatherWidgetPage>;
    private readonly howMetar: Subscribable<PageEnum.WeatherWidgetPage>;
    private readonly showMetar = Subject.create(false);

    private readonly metarPages: Pages;
    private readonly pages: Pages;

    constructor(props: any) {
        super(props);

        this.isMetar = this.metar.map((value) => {
            return value ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None;
        });

        this.howMetar = MappedSubject.create(([metar, showMetar]) => {
            if (showMetar) {
                return PageEnum.WeatherWidgetPage.None
            } else if (!!metar) {
                return PageEnum.WeatherWidgetPage.Some
            } else {
                return PageEnum.WeatherWidgetPage.Error
            }
        }, this.metar, this.showMetar);

        this.metarPages = [
            [PageEnum.WeatherWidgetPage.None, (
                <div class="mt-4 flex w-full flex-row items-center justify-between">
                    <div class="flex flex-col items-center space-y-1">
                        <i class={`bi-speedometer2 text-inherit text-[35px]`} />
                        <p class="text-center">{t('Dashboard.ImportantInformation.Weather.AirPressure')}</p>
                        <Pager pages={[
                            [PageEnum.WeatherWidgetPage.None, <>{this.metar.map((value) => value?.barometer ? <BaroValue /> : 'N/A')}</>],
                            [PageEnum.WeatherWidgetPage.Some, <>{t('Dashboard.ImportantInformation.Weather.NotAvailableShort')}</>],
                        ]}
                               activePage={this.metar.map((value) => value?.raw_text ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None)}
                        />
                    </div>
                </div>
            )],
            [PageEnum.WeatherWidgetPage.Some, (
                <div class="mt-4 font-mono text-xl">
                    <Pager pages={[
                        [PageEnum.WeatherWidgetPage.Some, <ColoredMetar metar={this.metar} />],
                        [PageEnum.WeatherWidgetPage.None, <>{this.metar.map((value) => value?.raw_text)}</>],
                    ]}
                        activePage={this.usingColoredMetar}
                    />
                </div>
            )],
            [PageEnum.WeatherWidgetPage.Error, (
                <div class="mt-4 text-xl">
                    {this.metarError}
                </div>
            )],
        ]

        this.pages = [
            [PageEnum.WeatherWidgetPage.None, <p>{t('Dashboard.ImportantInformation.Weather.Loading')}</p>],
            [PageEnum.WeatherWidgetPage.Some, (
                <>
                    <div className="flex flex-row items-center justify-between">
                    </div>
                    <div style={{ minHeight: '100px' }}>
                        <Pager pages={this.metarPages} activePage={this.howMetar} />
                    </div>
                </>
            )],
        ]
    }

    render(): VNode {
        return (
            <div>
               <Pager pages={this.pages} activePage={this.isMetar} />
            </div>
        );
    }
}

export interface DashboardProps {
    pongText: Subscribable<string>;
}

export class Dashboard extends DisplayComponent<DashboardProps> {
    render(): VNode {
        return (
            <div class="flex w-full space-x-8">
                <FlightWidget pongText={this.props.pongText} />
                <RemindersWidget />
            </div>
        );
    }
}
