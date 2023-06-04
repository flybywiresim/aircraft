import React from 'react';
import { Bug } from './Bug';
import { VerticalTape } from './VerticalTape';

type TickProps = { offset: number, airspeed: number }

const Tick = React.memo<TickProps>(({ offset, airspeed }) => {
    if (airspeed > 250 && airspeed % 10 === 5) {
        return null;
    }

    const tickLength = airspeed % 20 === 10 ? 20 : 10;

    return (
        <g transform={`translate(0 ${offset})`}>
            {airspeed % 20 === 0 && <text x={95} textAnchor="end" y={158 + 12} className="TextWhite FontMedium">{airspeed}</text>}
            <path stroke="white" d={`M${108 - tickLength},158 h${tickLength}`} />
        </g>
    );
});

const SpeedtapeArrow = React.memo(() => (
    <g id="SpeedtapeArrow">
        <rect className="FillBackground" x={121.054} y={250.008} width={23.324} height={35.4025} />
        <path className="FillYellow" d="M 141.712 284.994 v -31.654 l -19.992 16.66 z" />
    </g>
));

type BugProps = { offset: number }

const BugElement = React.memo<BugProps>(({ offset }) => (
    <g className="StrokeCyan" transform={`translate(0 ${offset})`}>
        <path strokeWidth={7} d="M78,158 h30" />
    </g>
));

type AirspeedIndicatorProps = {
    indicatedAirspeed: number,
    bugs: Bug[]
}

export const AirspeedIndicator: React.FC<AirspeedIndicatorProps> = ({ indicatedAirspeed, bugs }) => (
    <g id="AirspeedIndicator">
        <svg x={0} y={112} width={108} height={296} viewBox="0 0 108 296">
            <VerticalTape
                displayRange={42}
                valueSpacing={5}
                distanceSpacing={16}
                graduationElementFunction={(elementValue: number, offset: number) => <Tick offset={offset} airspeed={elementValue} />}
                bugs={bugs}
                bugElementFunction={(bug: Bug, offset: number) => <BugElement offset={offset} />}
                tapeValue={indicatedAirspeed}
                lowerLimit={30}
                upperLimit={660}
            />
        </svg>
        <SpeedtapeArrow />
    </g>
);
