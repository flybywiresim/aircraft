import {
    ComponentProps,
    DisplayComponent,
    FSComponent,
    MappedSubject,
    Subject,
    Subscribable,
    VNode,
} from '@microsoft/msfs-sdk';
import { FlypadClient, MetarParserType } from '@flybywiresim/fbw-sdk';
import { PageEnum } from '../../../shared/common';
import { Switch, Pages } from '../../Pages';
import { flypadClientContext } from '../../../Contexts';
import { ColoredMetar } from './ColoredMetar';
import { t } from '../../../Components/LocalizedText';
import { RemindersSection } from './ReminderSection';

const emptyMetar = {
    raw_text: '',
    raw_parts: [],
    color_codes: [],
    icao: '',
    observed: new Date(0),
    wind: {
        degrees: 0,
        degrees_from: 0,
        degrees_to: 0,
        speed_kts: 0,
        speed_mps: 0,
        gust_kts: 0,
        gust_mps: 0,
    },
    visibility: {
        miles: '',
        miles_float: 0.0,
        meters: '',
        meters_float: 0.0,
    },
    conditions: [],
    clouds: [],
    ceiling: {
        code: '',
        feet_agl: 0,
        meters_agl: 0,
    },
    temperature: {
        celsius: 0,
        fahrenheit: 0,
    },
    dewpoint: {
        celsius: 0,
        fahrenheit: 0,
    },
    humidity_percent: 0,
    barometer: {
        hg: 0,
        kpa: 0,
        mb: 0,
    },
    flight_category: '',
};

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

interface WeatherWidgetProps extends ComponentProps {
    name: string,
}

export class WeatherWidget extends DisplayComponent<WeatherWidgetProps, [FlypadClient]> {
    public override contextType = [flypadClientContext] as const;

    private readonly baroType = Subject.create('HPA');

    private readonly metarSource = Subject.create('MSFS');

    private readonly metarError = Subject.create('');

    private readonly usingColoredMetar = Subject.create(PageEnum.WeatherWidgetPage.Some);

    private readonly metar = Subject.create<MetarParserType>(emptyMetar);

    private readonly isMetar: Subscribable<PageEnum.WeatherWidgetPage>;

    private readonly howMetar: Subscribable<PageEnum.WeatherWidgetPage>;

    private readonly showMetar = Subject.create(false);

    private readonly metarPages: Pages;

    private readonly pages: Pages;

    private readonly baroOutput: Subscribable<string>;

    private readonly windOutput: Subscribable<string>;

    private readonly temperatureOutput: Subscribable<string>;

    private readonly dewpointOutput: Subscribable<string>;

    private get client(): FlypadClient {
        return this.getContext(flypadClientContext).get();
    }

    constructor(props: any) {
        super(props);

        const getBaroTypeForAirport = (icao: string) => (['K', 'C', 'M', 'P', 'RJ', 'RO', 'TI', 'TJ']
            .some((r) => icao.toUpperCase().startsWith(r)) ? 'IN HG' : 'HPA');

        this.isMetar = this.metar.map((value) => (value ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None));

        this.howMetar = MappedSubject.create(([metar, showMetar]) => {
            if (!showMetar) {
                return PageEnum.WeatherWidgetPage.None;
            } if (metar.raw_text) {
                return PageEnum.WeatherWidgetPage.Some;
            }
            return PageEnum.WeatherWidgetPage.Error;
        }, this.metar, this.showMetar);

        this.baroOutput = MappedSubject.create(([metar, baroType]) => {
            const displayedBaroType = baroType === 'AUTO' ? getBaroTypeForAirport(metar.icao) : baroType;

            switch (displayedBaroType) {
            case 'IN HG':
                return `${metar.barometer.hg.toFixed(2)} ${displayedBaroType}`;
            case 'HPA':
                return `${metar.barometer.mb.toFixed(0)} ${displayedBaroType}`;
            default:
                return 'N/A';
            }
        }, this.metar, this.baroType);

        this.windOutput = this.metar.map((metar) => `${metar.wind.degrees.toFixed(0)}° / ${metar.wind.speed_kts.toFixed(0)} kts`);

        this.temperatureOutput = this.metar.map((metar) => `${metar.temperature.celsius.toFixed(0)} °C`);

        this.dewpointOutput = this.metar.map((metar) => `${metar.dewpoint.celsius.toFixed(0)} °C`);

        this.metarPages = [
            [PageEnum.WeatherWidgetPage.None, (
                <div class="mt-4 flex w-full flex-row items-center justify-between">
                    <div class="flex flex-col items-center space-y-1">
                        <i class="bi-speedometer2 text-[35px] text-inherit" />
                        <p class="text-center">{t('Dashboard.ImportantInformation.Weather.AirPressure')}</p>
                        <Switch
                            pages={[
                                [PageEnum.WeatherWidgetPage.Some, (
                                    <p class="text-center">
                                        {this.baroOutput}
                                    </p>
                                )],
                                [PageEnum.WeatherWidgetPage.None, <p class="text-center">{t('Dashboard.ImportantInformation.Weather.NotAvailableShort')}</p>],
                            ]}
                            activePage={this.metar.map((value) => (value.raw_text && value.barometer ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None))}
                        />
                    </div>
                    <div class="flex flex-col items-center space-y-1">
                        <i class="bi-wind text-[35px] text-inherit" />
                        <p class="text-center">{t('Dashboard.ImportantInformation.Weather.WindSpeed')}</p>
                        <Switch
                            pages={[
                                [PageEnum.WeatherWidgetPage.Some, (
                                    <p class="text-center">
                                        {this.windOutput}
                                    </p>
                                )],
                                [PageEnum.WeatherWidgetPage.None, <p class="text-center">{t('Dashboard.ImportantInformation.Weather.NotAvailableShort')}</p>],
                            ]}
                            activePage={this.metar.map((value) => (value.raw_text ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None))}
                        />
                    </div>
                    <div class="flex flex-col items-center space-y-1">
                        <i class="bi-thermometer-half text-[35px] text-inherit" />
                        <p class="text-center">{t('Dashboard.ImportantInformation.Weather.Temperature')}</p>
                        <Switch
                            pages={[
                                [PageEnum.WeatherWidgetPage.Some, (
                                    <p class="text-center">
                                        {this.temperatureOutput}
                                    </p>
                                )],
                                [PageEnum.WeatherWidgetPage.None, <p class="text-center">{t('Dashboard.ImportantInformation.Weather.NotAvailableShort')}</p>],
                            ]}
                            activePage={this.metar.map((value) => (value.raw_text ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None))}
                        />
                    </div>
                    <div class="flex flex-col items-center space-y-1">
                        <i class="bi-droplet text-[35px] text-inherit" />
                        <p class="text-center">{t('Dashboard.ImportantInformation.Weather.DewPoint')}</p>
                        <Switch
                            pages={[
                                [PageEnum.WeatherWidgetPage.Some, (
                                    <p class="text-center">
                                        {this.dewpointOutput}
                                    </p>
                                )],
                                [PageEnum.WeatherWidgetPage.None, <p class="text-center">{t('Dashboard.ImportantInformation.Weather.NotAvailableShort')}</p>],
                            ]}
                            activePage={this.metar.map((value) => (value.raw_text ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None))}
                        />
                    </div>
                </div>
            )],
            [PageEnum.WeatherWidgetPage.Some, (
                <div class="mt-4 font-mono text-xl">
                    <Switch
                        pages={[
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
        ];

        this.pages = [
            [PageEnum.WeatherWidgetPage.None, <p>{t('Dashboard.ImportantInformation.Weather.Loading')}</p>],
            [PageEnum.WeatherWidgetPage.Some, (
                <>
                    <div className="flex flex-row items-center justify-between" />
                    <div style={{ minHeight: '100px' }}>
                        <Switch pages={this.metarPages} activePage={this.howMetar} />
                    </div>
                </>
            )],
        ];

        this.metar.set({
            barometer: { hg: 29.75, kpa: 100.74504601898246, mb: 1007.4504601898246 },
            ceiling: { code: 'OVC', feet_agl: 500, meters_agl: 152.4 },
            clouds: [{ code: 'OVC', base_feet_agl: 500, base_meters_agl: 152.4 }],
            color_codes: [1, 0, 0, 0, 2, 0, 2, 2, 0, 5, 5],
            conditions: [{ code: 'BR' }],
            dewpoint: { celsius: 6, fahrenheit: 42.8 },
            flight_category: 'IFR',
            humidity_percent: 100,
            icao: 'CYKF',
            observed: new Date(),
            raw_parts: ['CYKF', '172321Z', 'AUTO', '20012KT', '3SM', 'BR', 'OVC005', '06/06', 'A2975', 'RMK', 'SLP082'],
            raw_text: 'CYKF 172321Z AUTO 20012KT 3SM BR OVC005 06/06 A2975 RMK SLP082',
            temperature: { celsius: 6, fahrenheit: 42.8 },
            visibility: { miles: '3', miles_float: 3, meters: '5000', meters_float: 4828.032 },
            wind: {
                degrees: 200,
                degrees_from: 200,
                degrees_to: 200,
                speed_kts: 12,
                speed_mps: 6.173333309325926,
                gust_kts: 12,
                gust_mps: 6.173333309325926,
            },
        });
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.metar.set({
            barometer: { hg: 29.75, kpa: 100.74504601898246, mb: 1007.4504601898246 },
            ceiling: { code: 'OVC', feet_agl: 500, meters_agl: 152.4 },
            clouds: [{ code: 'OVC', base_feet_agl: 500, base_meters_agl: 152.4 }],
            color_codes: [1, 0, 0, 0, 2, 0, 2, 2, 0, 5, 5],
            conditions: [{ code: 'BR' }],
            dewpoint: { celsius: 6, fahrenheit: 42.8 },
            flight_category: 'IFR',
            humidity_percent: 100,
            icao: 'CYKF',
            observed: new Date(),
            raw_parts: ['CYKF', '172321Z', 'AUTO', '20012KT', '3SM', 'BR', 'OVC005', '06/06', 'A2975', 'RMK', 'SLP082'],
            raw_text: 'CYKF 172321Z AUTO 20012KT 3SM BR OVC005 06/06 A2975 RMK SLP082',
            temperature: { celsius: 6, fahrenheit: 42.8 },
            visibility: { miles: '3', miles_float: 3, meters: '5000', meters_float: 4828.032 },
            wind: {
                degrees: 200,
                degrees_from: 200,
                degrees_to: 200,
                speed_kts: 12,
                speed_mps: 6.173333309325926,
                gust_kts: 12,
                gust_mps: 6.173333309325926,
            },
        });

        this.client.initialized.on(async (client) => {
            const metar = await client.getMetar('CYKF');

            this.metar.set(metar);
        });

        this.metar.set({
            barometer: { hg: 29.75, kpa: 100.74504601898246, mb: 1007.4504601898246 },
            ceiling: { code: 'OVC', feet_agl: 500, meters_agl: 152.4 },
            clouds: [{ code: 'OVC', base_feet_agl: 500, base_meters_agl: 152.4 }],
            color_codes: [1, 0, 0, 0, 2, 0, 2, 2, 0, 5, 5],
            conditions: [{ code: 'BR' }],
            dewpoint: { celsius: 6, fahrenheit: 42.8 },
            flight_category: 'IFR',
            humidity_percent: 100,
            icao: 'CYKF',
            observed: new Date(),
            raw_parts: ['CYKF', '172321Z', 'AUTO', '20012KT', '3SM', 'BR', 'OVC005', '06/06', 'A2975', 'RMK', 'SLP082'],
            raw_text: 'CYKF 172321Z AUTO 20012KT 3SM BR OVC005 06/06 A2975 RMK SLP082',
            temperature: { celsius: 6, fahrenheit: 42.8 },
            visibility: { miles: '3', miles_float: 3, meters: '5000', meters_float: 4828.032 },
            wind: {
                degrees: 200,
                degrees_from: 200,
                degrees_to: 200,
                speed_kts: 12,
                speed_mps: 6.173333309325926,
                gust_kts: 12,
                gust_mps: 6.173333309325926,
            },
        });
    }

    render(): VNode {
        return (
            <div>
                <Switch pages={this.pages} activePage={this.isMetar} />
            </div>
        );
    }
}
