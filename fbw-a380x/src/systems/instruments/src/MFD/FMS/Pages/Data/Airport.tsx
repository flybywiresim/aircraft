import React, { FC, useState } from 'react';
import { useNavDatabase } from '@instruments/common/flightplan';
import { MathUtils } from '@shared/MathUtils';
import { Airport, Runway } from 'msfs-navdata';
import { Layer } from '../../../Components/Layer';
import { Tab, TabSet } from '../../../Components/tabs';
import { TextBox } from '../../../Components/Textbox';
import { Button } from '../../../Components/Button';
import { Arrows } from '../../../Components/Arrows';

const xSpacing = 236;
const ySpacing = 50;

type RunwayInfoProps = {
    runways: Runway[];
    airport?: Airport;
    index: number;
    onIndexChange: (value: number) => void;
    onRunwayList: () => void;
}
const RunwayInfo: FC<RunwayInfoProps> = ({ runways, airport, index, onIndexChange, onRunwayList }) => {
    const runway = runways[index];
    return (
        <>
            <text x={199} y={320} fontSize={22} fill="#fff">RWY</text>
            <text x={269} y={322} fontSize={28} fill="lime">{runway.ident.substr(2)}</text>
            <text x={423} y={321} fontSize={22} fill="#fff">
                {index + 1}
                /
                {runways.length}
            </text>

            <text x={127} y={429} fontSize={22} fill="#fff">LAT/LONG</text>
            <text x={268} y={431} fontSize={29} fill="lime">
                {MathUtils.convertDMS(runway.thresholdLocation.lat, runway.thresholdLocation.lon)}
            </text>

            <text x={113} y={490} fontSize={22} fill="#fff">ELEVATION</text>
            <text x={407} y={492} fontSize={29} fill="lime" textAnchor="end">
                {/* This is not the actual elevation, fix later */}
                {airport?.location.alt}
                <tspan dx={5} dy={-3} fill="blue" fontSize={24}>Ft</tspan>
            </text>

            <text x={155} y={549} fontSize={22} fill="#fff">LENGTH</text>
            <text x={407} y={552} fontSize={29} fill="lime" textAnchor="end">
                {runway.length}
                <tspan dx={5} dy={-3} fill="blue" fontSize={24}>Ft</tspan>
            </text>

            <text x={127} y={609} fontSize={22} fill="#fff">LS IDENT</text>
            <text x={268} y={611} fontSize={29} fill="lime">{runway.lsIdent}</text>

            <Button x={380} y={332} width={62} height={57} onClick={() => onIndexChange(index - 1)}>
                <Arrows x={31} y={28.5} angle={-90} />
            </Button>
            <Button x={448} y={332} width={62} height={57} onClick={() => onIndexChange(index + 1)}>
                <Arrows x={31} y={28.5} angle={90} />
            </Button>

            <Button x={35} y={634} width={168} height={40} onClick={onRunwayList}>RWY LIST</Button>

            <text x={519} y={549} fontSize={22} fill="#fff">CRS</text>
            <text x={608} y={552} fontSize={29} fill="lime">
                {Math.round(runway.bearing).toString().padStart(3, '0')}
                <tspan dx={5} dy={-3} fill="blue" fontSize={26}>°</tspan>
            </text>
        </>
    );
};

const RunwayList: FC<{
    runways: Runway[];
    onRunwayClick: (index: number) => void;
}> = ({ runways, onRunwayClick }) => (
    <>
        {runways?.map((runway, index) => {
            const xI = Math.floor(index / 8);
            return (
                <Button x={30 + xI * xSpacing} y={286 + (index % 8) * ySpacing} width={227} height={40} onClick={() => onRunwayClick(index)}>
                    <tspan dx={-70}>{runway.ident.substr(2)}</tspan>
                    <tspan dx={10}>
                        {runway.length}
                        FT
                    </tspan>
                    {runway.lsIdent && <tspan dx={80}>LS</tspan>}
                </Button>
            );
        })}
    </>
);

export const Page = () => {
    const [airport, setAirport] = useState<Airport>();
    const [runways, setRunways] = useState<Runway[]>([]);
    const [selectedRunwayIndex, setSelectedRunwayIndex] = useState(-1);

    const database = useNavDatabase();

    const selectAirport = async (value: string) => {
        const airport = await database.getAirportByIdent(value);
        setAirport(airport!);
        setSelectedRunwayIndex(-1);
        setRunways(await database.getRunways(value));
    };

    const onRunwayChange = (index: number) => {
        setSelectedRunwayIndex(Math.min(runways.length - 1, Math.max(0, index)));
    };

    return (
        <Layer y={140}>
            <TabSet x={9} y={51} width={748} height={710}>
                <Tab title="DATABASE ARPTs" />
                <Tab title="PILOT STORED RWYs" />
            </TabSet>

            <text x={167} y={126} fontSize={22} fill="#fff">ARPT IDENT</text>
            <TextBox x={334} y={98} width={95} maxLength={4} onSubmit={selectAirport} />

            <text x={385} y={189} fontSize={29} fill="lime" textAnchor="middle">{airport?.airportName}</text>
            <text x={208} y={249} fontSize={29} fill="lime">{airport && MathUtils.convertDMS(airport.location.lat, airport.location.lon)}</text>

            <rect x={18} y={272} width={723} height={418} fill="none" stroke="#fff" strokeWidth={2} />
            {selectedRunwayIndex >= 0
                ? (
                    <RunwayInfo
                        onRunwayList={() => setSelectedRunwayIndex(-1)}
                        onIndexChange={onRunwayChange}
                        index={selectedRunwayIndex}
                        airport={airport}
                        runways={runways}
                    />
                )
                : <RunwayList runways={runways} onRunwayClick={setSelectedRunwayIndex} />}

            <Button x={4} y={765} width={128} height={41}>RETURN</Button>
        </Layer>
    );
};
