import React from 'react';
import { VerticalTape } from './ISISUtils';

type SpeedtapeProps = {
    maskWidth: number;
    indicatedAirspeed: number;
}

type TickProps = { maskWidth: number; offset: number, airspeed: number }

const Tick: React.FC<TickProps> = ({ maskWidth, offset, airspeed }) => {
    const tickLength = airspeed % 20 === 10 ? 20 : 10;

    return (
        <g stroke="white" fill="white" transform={`translate(0 ${offset})`}>
            {airspeed % 20 === 0 && <text x={95} textAnchor="end" y={148 + 12} fontSize={30}>{airspeed}</text>}
            <path strokeWidth={3} d={`M${maskWidth - tickLength},${148} h${tickLength}`} />
        </g>
    );
};

type SpeedtapeArrowProps = {
    maskWidth: number;
}
const SpeedtapeArrow: React.FC<SpeedtapeArrowProps> = ({ maskWidth }) => (
    <>
        {/* Speed tape arrow background */}
        <rect x={maskWidth} y={236} width={34} height={40} fill="black" />
        {/* Speed tape arrow */}
        <path
            d={`M${maskWidth},256 L${maskWidth + 34},236 L${maskWidth + 34},276 L${maskWidth},256`}
            fill="yellow"
        />
    </>
);

export const AirspeedIndicator: React.FC<SpeedtapeProps> = ({ maskWidth, indicatedAirspeed }) => {
    const height = 512 - 2 * maskWidth;

    const createTick = (elementValue: number, offset: number) => <Tick maskWidth={maskWidth} offset={offset} airspeed={elementValue} />;

    return (
        <g id="AirspeedIndicator">
            <svg x={0} y={maskWidth} width={maskWidth} height={height} viewBox={`0 0 ${maskWidth} ${height}`}>
				<VerticalTape displayRange={42} valueSpacing={5} distanceSpacing={20} graduationElementFunction={createTick} tapeValue={indicatedAirspeed} lowerLimit={30} upperLimit={660} />
            </svg>
            <SpeedtapeArrow maskWidth={maskWidth} />
        </g>
    );
};
