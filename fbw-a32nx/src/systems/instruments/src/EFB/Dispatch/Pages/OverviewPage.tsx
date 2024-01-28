// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState } from 'react';
import { IconPlane } from '@tabler/icons';
import { Box, LightningFill, PeopleFill, Rulers, Speedometer2 } from 'react-bootstrap-icons';
import { useSimVar, Units } from '@flybywiresim/fbw-sdk';
import { t } from '../../translation';
import { NoseOutline } from '../../Assets/NoseOutline';
import { getAirframeType } from '../../Efb';

interface InformationEntryProps {
    title: string;
    info: string;
}

const InformationEntry: FC<InformationEntryProps> = ({ children, title, info }) => (
    <div>
        <div className="text-theme-highlight flex flex-row items-center space-x-4">
            {children}
            <p className="whitespace-nowrap">{title}</p>
        </div>
        <p className="font-bold">{info}</p>
    </div>
);

export const OverviewPage = () => {
    let [airline] = useSimVar('ATC AIRLINE', 'String', 1_000);
    const [airframe] = useState(getAirframeType());

    airline ||= 'FlyByWire Simulations';
    const [actualGrossWeight] = useSimVar('TOTAL WEIGHT', 'kilograms', 5_000);

    const getConvertedInfo = (metricValue: number, unitType: 'weight' |'volume' |'distance') => {
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
    };

    const A320 = (
        <div className="mt-8 flex flex-row space-x-16">
            <div className="flex flex-col space-y-8">
                <InformationEntry title={t('Dispatch.Overview.Model')} info="A320-251N [A20N]">
                    <IconPlane className="fill-current" size={23} stroke={1.5} strokeLinejoin="miter" />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.Range')} info={getConvertedInfo(3400, 'distance')}>
                    <Rulers size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.ActualGW')} info={getConvertedInfo(actualGrossWeight, 'weight')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MZFW')} info={getConvertedInfo(64300, 'weight')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MaximumPassengers')} info="174 passengers">
                    <PeopleFill size={23} />
                </InformationEntry>
            </div>
            <div className="flex flex-col space-y-8">
                <InformationEntry title={t('Dispatch.Overview.Engines')} info="CFM LEAP 1A-26">
                    <LightningFill size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MMO')} info="0.82">
                    <Speedometer2 size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MTOW')} info={getConvertedInfo(79000, 'weight')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MaximumFuelCapacity')} info={getConvertedInfo(23721, 'volume')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MaximumCargo')} info={getConvertedInfo(9435, 'weight')}>
                    <Box size={23} />
                </InformationEntry>
            </div>
        </div>
    );

    const A380 = (
        <div className="mt-8 flex flex-row space-x-16">
            <div className="flex flex-col space-y-8">
                <InformationEntry title={t('Dispatch.Overview.Model')} info="A380-842 [A388]">
                    <IconPlane className="fill-current" size={23} stroke={1.5} strokeLinejoin="miter" />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.Range')} info={getConvertedInfo(8000, 'distance')}>
                    <Rulers size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.ActualGW')} info={getConvertedInfo(actualGrossWeight, 'weight')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MZFW')} info={getConvertedInfo(373000, 'weight')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MaximumPassengers')} info="519 passengers">
                    <PeopleFill size={23} />
                </InformationEntry>
            </div>
            <div className="flex flex-col space-y-8">
                <InformationEntry title={t('Dispatch.Overview.Engines')} info="RR Trent 972B-84">
                    <LightningFill size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MMO')} info="0.89">
                    <Speedometer2 size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MTOW')} info={getConvertedInfo(510000, 'weight')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MaximumFuelCapacity')} info={getConvertedInfo(323546, 'volume')}>
                    <Box size={23} />
                </InformationEntry>

                <InformationEntry title={t('Dispatch.Overview.MaximumCargo')} info={getConvertedInfo(51400, 'weight')}>
                    <Box size={23} />
                </InformationEntry>
            </div>
        </div>
    );

    return (
        <div className="h-content-section-reduced border-theme-accent mr-3 w-min overflow-hidden rounded-lg border-2 p-6">
            {airframe === 'A380_842' ? <h1 className="font-bold">Airbus A380</h1> : <h1 className="font-bold">Airbus A320neo</h1>}
            <p>{airline}</p>

            <div className="mt-6 flex items-center justify-center">
                <NoseOutline className="text-theme-text flip-horizontal -ml-96 mr-32 h-64" />
            </div>

            {airframe === 'A380_842' ? A380 : A320}
        </div>
    );
};
