import React from 'react';
import { Bug } from './Bug';
import { VerticalTape } from './ISISUtils';

type AirspeedIndicatorProps = {
    indicatedAirspeed: number;
    bugs: Bug[]
}

type TickProps = { offset: number, airspeed: number }
const Tick: React.FC<TickProps> = ({ offset, airspeed }) => {
    if (airspeed > 250 && airspeed % 10 === 5) {
        return null;
    }

    const tickLength = airspeed % 20 === 10 ? 20 : 10;
    return (
        <g transform={`translate(0 ${offset})`}>
            {airspeed % 20 === 0 && <text x={95} textAnchor="end" y={158 + 12} className="TextWhite FontMedium">{airspeed}</text>}
            <path stroke="white" strokeWidth={3} d={`M${108 - tickLength},${158} h${tickLength}`} />
        </g>
    );
};

const SpeedtapeArrow: React.FC = () => (
    <>
        {/* Speed tape arrow background */}
        <rect x={108} y={250} width={34} height={40} fill="black" />
        {/* Speed tape arrow */}
        <path
            d="M 108 270 l 34 -20 v 40 l -34 -20"
            fill="yellow"
        />
    </>
);

type BugProps = { bug: Bug, offset: number, }
const BugElement: React.FC<BugProps> = ({ offset }) => (
    <g className="StrokeCyan" transform={`translate(0 ${offset})`}>
        <path strokeWidth={7} d="M73,148 h30" />
    </g>
);

export const AirspeedIndicator: React.FC<AirspeedIndicatorProps> = ({ indicatedAirspeed, bugs }) => {
    const createTick = (elementValue: number, offset: number) => <Tick offset={offset} airspeed={elementValue} />;
    const createBug = (bug: Bug, offset: number) => <BugElement bug={bug} offset={offset} />;

    return (
        <g id="AirspeedIndicator">
            <svg x={0} y={112} width={108} height={296} viewBox="0 0 108 296">
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
            <SpeedtapeArrow />
        </g>
    );
};
