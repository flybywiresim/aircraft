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
import { Pager, Pages } from '../../Pages';
import { flypadClientContext } from '../../../Contexts';
import { BaroValue } from '../Dashboard';
import { ColoredMetar } from './ColoredMetar';
import { t } from '../../../Components/LocalizedText';

interface WeatherWidgetProps extends ComponentProps {
    name: string,
}

export class WeatherWidget extends DisplayComponent<WeatherWidgetProps, [FlypadClient]> {
    public override contextType = [flypadClientContext] as const;

    private readonly baroType = Subject.create('HPA');

    private readonly metarSource = Subject.create('MSFS');

    private readonly metarError = Subject.create('');

    private readonly usingColoredMetar = Subject.create(PageEnum.WeatherWidgetPage.Some);

    private readonly metar = Subject.create<MetarParserType | null>(null);

    private readonly isMetar: Subscribable<PageEnum.WeatherWidgetPage>;

    private readonly howMetar: Subscribable<PageEnum.WeatherWidgetPage>;

    private readonly showMetar = Subject.create(false);

    private readonly metarPages: Pages;

    private readonly pages: Pages;

    private get client(): FlypadClient {
        return this.getContext(flypadClientContext).get();
    }

    constructor(props: any) {
        super(props);

        this.isMetar = this.metar.map((value) => (value ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None));

        this.howMetar = MappedSubject.create(([metar, showMetar]) => {
            if (showMetar) {
                return PageEnum.WeatherWidgetPage.None;
            } if (metar) {
                return PageEnum.WeatherWidgetPage.Some;
            }
            return PageEnum.WeatherWidgetPage.Error;
        }, this.metar, this.showMetar);

        this.metarPages = [
            [PageEnum.WeatherWidgetPage.None, (
                <div class="mt-4 flex w-full flex-row items-center justify-between">
                    <div class="flex flex-col items-center space-y-1">
                        <i class="bi-speedometer2 text-[35px] text-inherit" />
                        <p class="text-center">{t('Dashboard.ImportantInformation.Weather.AirPressure')}</p>
                        <Pager
                            pages={[
                                [PageEnum.WeatherWidgetPage.None, <>{this.metar.map((value) => (value?.barometer ? <BaroValue /> : 'N/A'))}</>],
                                [PageEnum.WeatherWidgetPage.Some, <>{t('Dashboard.ImportantInformation.Weather.NotAvailableShort')}</>],
                            ]}
                            activePage={this.metar.map((value) => (value?.raw_text ? PageEnum.WeatherWidgetPage.Some : PageEnum.WeatherWidgetPage.None))}
                        />
                    </div>
                </div>
            )],
            [PageEnum.WeatherWidgetPage.Some, (
                <div class="mt-4 font-mono text-xl">
                    <Pager
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
                        <Pager pages={this.metarPages} activePage={this.howMetar} />
                    </div>
                </>
            )],
        ];
    }

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.client.initialized.on(async (client) => {
            const metar = await client.getMetar('CYKF');

            this.metar.set(metar);
        });
    }

    render(): VNode {
        return (
            <div>
                <Pager pages={this.pages} activePage={this.isMetar} />
            </div>
        );
    }
}
