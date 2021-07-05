import React from 'react';
import { Bug, BugType } from './Bug';
import { VerticalTape } from './ISISUtils';

type AirspeedIndicatorProps = {
    maskWidth: number;
    indicatedAirspeed: number;
    bugs: Bug[]
}

type TickProps = { maskWidth: number; offset: number, airspeed: number }

const Tick: React.FC<TickProps> = ({ maskWidth, offset, airspeed }) => {
    if (airspeed > 250 && airspeed % 10 === 5) {
        return null;
    }

    const tickLength = airspeed % 20 === 10 ? 20 : 10;
    return (
        <g transform={`translate(0 ${offset})`}>
            {airspeed % 20 === 0 && <text x={95} textAnchor="end" y={158 + 12} className="TextWhite FontMedium">{airspeed}</text>}
            <path stroke="white" strokeWidth={3} d={`M${maskWidth - tickLength},${158} h${tickLength}`} />
        </g>
    );
};

type SpeedtapeArrowProps = {
    maskWidth: number;
}
const SpeedtapeArrow: React.FC<SpeedtapeArrowProps> = ({ maskWidth }) => (
    <>
        {/* Speed tape arrow background */}
        <rect x={maskWidth} y={250} width={34} height={40} fill="black" />
        {/* Speed tape arrow */}
        <path
            d="M 108 270 l 34 -20 v 40 l -34 -20"
            fill="yellow"
        />
    </>
);

type BugProps = { bug: Bug, offset: number, maskWidth: number }
const BugElement: React.FC<BugProps> = ({ bug, offset, maskWidth }) => (
    <g className="StrokeCyan" transform={`translate(0 ${offset})`}>
        <path strokeWidth={7} d={`M${maskWidth - 30},${148} h30`} />
    </g>
);

export const AirspeedIndicator: React.FC<AirspeedIndicatorProps> = ({ maskWidth, indicatedAirspeed, bugs }) => {
    const height = 512 - 2 * maskWidth;

    const createTick = (elementValue: number, offset: number) => <Tick maskWidth={maskWidth} offset={offset} airspeed={elementValue} />;
    const createBug = (bug: Bug, offset: number) => <BugElement maskWidth={maskWidth} bug={bug} offset={offset} />;

    return (
        <g id="AirspeedIndicator">
            <svg x={0} y={112} width={maskWidth} height={height} viewBox={`0 0 ${maskWidth} ${height}`}>
                <VerticalTape
                    displayRange={42}
                    valueSpacing={5}
                    distanceSpacing={16}
                    graduationElementFunction={createTick}
                    bugs={bugs}
                    bugElementFunction={createBug}
                    tapeValue={indicatedAirspeed}
                    lowerLimit={30}
                    upperLimit={660}
                />
            </svg>
            <SpeedtapeArrow maskWidth={maskWidth} />
        </g>
    );
};
