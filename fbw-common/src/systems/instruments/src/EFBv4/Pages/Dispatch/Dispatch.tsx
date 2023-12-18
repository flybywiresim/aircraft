import { DisplayComponent, FSComponent, Subject, VNode, ComponentProps } from '@microsoft/msfs-sdk';
import { Units } from '@flybywiresim/fbw-sdk';
import { t } from '../../Components/LocalizedText';
import { PageEnum } from '../../shared/common';
import { Selector } from '../../Components/Selector';
import { Switch, Pages } from '../Pages';
import { NoseOutline } from '../../Assets/NoseOutline';
// import { Icon } from '../../Components/Icons';
// import React from "react";
// import {IconPlane} from "@tabler/icons";
// import {Box, LightningFill, PeopleFill, Rulers, Speedometer2} from "react-bootstrap-icons";

interface AircraftItemProps extends ComponentProps {
    getConvertedInfo: any,
    actualGrossWeight: Subject<number>,
}

export class Loadsheet extends DisplayComponent<any> {
    render(): VNode {
        return (
            <div class="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
                <>
                    <div class="absolute right-16 top-6 overflow-hidden rounded-md bg-theme-secondary" />
                </>
            </div>
        );
    }
}

export class InformationEntry extends DisplayComponent<{ title: string, info: string }> {
    render(): VNode {
        return (
            <div>
                <div class="flex flex-row items-center space-x-4 text-theme-highlight">
                    {this.props.children}
                    <p class="whitespace-nowrap">{this.props.title}</p>
                </div>
                <p class="font-bold">{this.props.info}</p>
            </div>
        );
    }
}

// TODO: Both a320 and a380 do not have stateful get calls, it will render once and not update.
class A320 extends DisplayComponent<AircraftItemProps> {
    render(): VNode {
        return (
            <div class="mt-8 flex flex-row space-x-16">
                <div class="flex flex-col space-y-8">
                    <InformationEntry title={t('Dispatch.Overview.Model')} info="A320-251N [A20N]">
                        <i class="bi-airplane-fill text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.Range')} info={this.props.getConvertedInfo(3400, 'distance')}>
                        <i class="bi-rulers text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.ActualGW')} info={this.props.getConvertedInfo(this.props.actualGrossWeight.get(), 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MZFW')} info={this.props.getConvertedInfo(64300, 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MaximumPassengers')} info="174 passengers">
                        <i class="bi-people-fill text-[23px] text-inherit" />
                    </InformationEntry>
                </div>
                <div class="flex flex-col space-y-8">
                    <InformationEntry title={t('Dispatch.Overview.Engines')} info="CFM LEAP 1A-26">
                        <i class="bi-lightning-fill text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MMO')} info="0.82">
                        <i class="bi-speedometer2 text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MTOW')} info={this.props.getConvertedInfo(79000, 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MaximumFuelCapacity')} info={this.props.getConvertedInfo(23721, 'volume')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MaximumCargo')} info={this.props.getConvertedInfo(9435, 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>
                </div>
            </div>
        );
    }
}

class A380 extends DisplayComponent<AircraftItemProps> {
    render(): VNode {
        return (
            <div class="mt-8 flex flex-row space-x-16">
                <div class="flex flex-col space-y-8">
                    <InformationEntry title={t('Dispatch.Overview.Model')} info="A380-842 [A388]">
                        <i class="bi-airplane-fill text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.Range')} info={this.props.getConvertedInfo(8000, 'distance')}>
                        <i class="bi-rulers text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.ActualGW')} info={this.props.getConvertedInfo(this.props.actualGrossWeight.get(), 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MZFW')} info={this.props.getConvertedInfo(373000, 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MaximumPassengers')} info="519 passengers">
                        <i class="bi-people-fill text-[23px] text-inherit" />
                    </InformationEntry>
                </div>
                <div class="flex flex-col space-y-8">
                    <InformationEntry title={t('Dispatch.Overview.Engines')} info="RR Trent 972B-84">
                        <i class="bi-lightning-fill text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MMO')} info="0.89">
                        <i class="bi-speedometer2 text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MTOW')} info={this.props.getConvertedInfo(510000, 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MaximumFuelCapacity')} info={this.props.getConvertedInfo(323546, 'volume')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>

                    <InformationEntry title={t('Dispatch.Overview.MaximumCargo')} info={this.props.getConvertedInfo(51400, 'weight')}>
                        <i class="bi-box text-[23px] text-inherit" />
                    </InformationEntry>
                </div>
            </div>
        );
    }
}

export class Overview extends DisplayComponent<any> {
    // TODO: Currently Temp Values
    private airline = 'FlyByWire Simulations';

    private readonly airframe = 'A320'

    private readonly actualGrossWeight = Subject.create(0);

    getConvertedInfo(metricValue: number, unitType: 'weight' |'volume' |'distance') {
        const numberWithCommas = (x: number) => x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        switch (unitType) {
        case 'weight':
            return `${numberWithCommas(Units.kilogramToUser(metricValue))} [${Units.userWeightSuffixEis2}]`;
        case 'volume':
            return `${numberWithCommas(Units.litreToUser(metricValue))} [${Units.userVolumeSuffixEis2}]`;
        case 'distance':
            return `${numberWithCommas(metricValue)} [nm]`;
        default: throw new Error('Invalid unit type');
        }
    }

    render(): VNode {
        return (
            <div class="mr-3 h-content-section-reduced w-min overflow-hidden rounded-lg border-2 border-theme-accent p-6">
                {this.airframe === 'A380_842' ? <h1 class="font-bold">Airbus A380</h1> : <h1 class="font-bold">Airbus A320neo</h1>}
                <p>{this.airline}</p>

                <div class="mt-6 flex items-center justify-center">
                    <NoseOutline class="flip-horizontal -ml-96 mr-32 h-64 stroke-[1.75] text-theme-text" />
                </div>

                {this.airframe === 'A380_842'
                    ? (
                        <A380
                            actualGrossWeight={this.actualGrossWeight}
                            getConvertedInfo={this.getConvertedInfo}
                        />
                    )
                    : (
                        <A320
                            actualGrossWeight={this.actualGrossWeight}
                            getConvertedInfo={this.getConvertedInfo}
                        />
                    )}
            </div>
        );
    }
}

export class Dispatch extends DisplayComponent<any> {
    private readonly activePage = Subject.create(PageEnum.DispatchPage.OFP);

    private readonly tabs: [page: number, name: VNode][] = [
        // These will not update when language changes so keep that in mind.
        // TODO: Consider above message
        [PageEnum.DispatchPage.OFP, t('Dispatch.Ofp.Title')],
        [PageEnum.DispatchPage.Overview, t('Dispatch.Overview.Title')],
    ]

    private readonly pages: Pages = [
        [PageEnum.DispatchPage.OFP, <Loadsheet />],
        [PageEnum.DispatchPage.Overview, <Overview />],
    ]

    render(): VNode {
        return (
            <div class="w-full">
                <div class="relative mb-4">
                    <h1 class="font-bold">{t('Dispatch.Title')}</h1>
                    <Selector
                        class="absolute right-0 top-0"
                        tabs={this.tabs}
                        activePage={this.activePage}
                    />
                </div>

                <Switch
                    activePage={this.activePage}
                    pages={this.pages}
                />
            </div>
        );
    }
}
