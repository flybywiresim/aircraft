import React, { FC } from 'react';
import { IconPlane } from '@tabler/icons';
import { Box, LightningFill, PeopleFill, Rulers, Speedometer2 } from 'react-bootstrap-icons';
import { useSimVar } from '@instruments/common/simVars';
import { Units } from '@shared/units';
import { NoseOutline } from '../../Assets/NoseOutline';

interface InformationEntryProps {
    title: string;
    info: string;
}

const InformationEntry: FC<InformationEntryProps> = ({ children, title, info }) => (
    <div>
        <div className="flex flex-row items-center space-x-4 text-theme-highlight">
            {children}
            <p className="whitespace-nowrap">{title}</p>
        </div>
        <p className="font-bold">{info}</p>
    </div>
);

export const OverviewPage = () => {
    const { usingMetric } = Units;

    let [airline] = useSimVar('ATC AIRLINE', 'String', 1_000);

    airline ||= 'FlyByWire Simulations';

    const getConvertedInfo = (metricValue: number, unitType: 'weight' |'volume' |'distance') => {
        const numberWithCommas = (x: number) => x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        switch (unitType) {
        case 'weight':
            if (usingMetric) {
                return `${numberWithCommas(metricValue)} [kg]`;
            }
            return `${numberWithCommas(metricValue * 2.205)} [lbs]`;
        case 'volume':
            if (usingMetric) {
                return `${numberWithCommas(metricValue)} [l]`;
            }
            return `${numberWithCommas(metricValue / 3.785)} [gal]`;
        case 'distance':
            return `${numberWithCommas(metricValue)} [nm]`;
        default: throw new Error('Invalid unit type');
        }
    };

    return (
        <div className="overflow-hidden p-6 mt-4 mr-3 w-1/2 rounded-lg border-2 shadow-md h-efb border-theme-accent">
            <h1 className="font-bold">Airbus A320neo</h1>
            <p>{airline}</p>

            <div className="flex justify-center items-center mt-6">
                <NoseOutline className="mr-32 -ml-96 h-64 flip-horizontal text-theme-text" />
            </div>

            <div className="flex flex-row mt-8 space-x-16">
                <div className="flex flex-col space-y-8">
                    <InformationEntry title="Model" info="A320-251N [A20N]">
                        <IconPlane className="fill-current" size={23} stroke={1.5} strokeLinejoin="miter" />
                    </InformationEntry>

                    <InformationEntry title="Range" info={getConvertedInfo(3400, 'distance')}>
                        <Rulers size={23} />
                    </InformationEntry>

                    <InformationEntry title="MRW" info={getConvertedInfo(79400, 'weight')}>
                        <Box size={23} />
                    </InformationEntry>

                    <InformationEntry title="MZFW" info={getConvertedInfo(64300, 'weight')}>
                        <Box size={23} />
                    </InformationEntry>

                    <InformationEntry title="Maximum Passengers" info="174 passengers">
                        <PeopleFill size={23} />
                    </InformationEntry>
                </div>
                <div className="flex flex-col space-y-8">
                    <InformationEntry title="Engines" info="CFM LEAP 1A-26">
                        <LightningFill size={23} />
                    </InformationEntry>

                    <InformationEntry title="MMO" info="0.82">
                        <Speedometer2 size={23} />
                    </InformationEntry>

                    <InformationEntry title="MTOW" info={getConvertedInfo(79000, 'weight')}>
                        <Box size={23} />
                    </InformationEntry>

                    <InformationEntry title="Maximum Fuel Capacity" info={getConvertedInfo(23721, 'volume')}>
                        <Box size={23} />
                    </InformationEntry>

                    <InformationEntry title="Maximum Cargo" info={getConvertedInfo(9435, 'weight')}>
                        <Box size={23} />
                    </InformationEntry>
                </div>
            </div>
        </div>
    );
};
