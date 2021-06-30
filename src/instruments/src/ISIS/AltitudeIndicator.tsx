import React from 'react';
import { Bug, BugType } from './Bug';
import { DigitalAltitudeIndicator } from './DigitalAltitudeIndicator';
import { VerticalTape } from './ISISUtils';

type TickProps = { offset: number, altitude: number }
const Tick: React.FC<TickProps> = ({ altitude, offset }) => {
    const shouldShowText = altitude % 500 === 0;
    const tickLength = shouldShowText ? 5 : 20;

    return (
        <g stroke="white" fill="white" transform={`translate(0 ${offset})`}>
            <path strokeWidth={3} d={`M0,${148} h${tickLength}`} />
            {shouldShowText && <text x={5} y={148 + 12} fontSize={30}>{Math.abs(altitude).toString().padStart(5, '0').slice(0, 3)}</text>}
        </g>
    );
};

type BugProps = { bug: Bug, offset: number, maskWidth: number }
const BugElement: React.FC<BugProps> = ({ bug, offset, maskWidth }) => {
    if (bug.value % 500 === 0) {
        return (
            <g className="StrokeCyan NoFill" transform={`translate(0 ${offset})`}>
                <path strokeWidth={3} d={`M3,${142} v-10 h65 v30 h-65 v-6`} />
            </g>
        );
    }

    return (
        <g className="StrokeCyan" transform={`translate(0 ${offset})`}>
            <path strokeWidth={7} d={`M0,${148} h30`} />
        </g>
    );
};

type AltitudeIndicatorProps = {
    maskWidth: number;
    altitude: number;
    mda: number
    bugs: Bug[]
}
export const AltitudeIndicator: React.FC<AltitudeIndicatorProps> = ({ maskWidth, altitude, mda, bugs }) => {
    const height = 512 - 2 * maskWidth;
    const createTick = (altitude: number, offset: number) => <Tick altitude={altitude} offset={offset} />;
    const createBug = (bug: Bug, offset: number) => <BugElement maskWidth={maskWidth} bug={bug} offset={offset} />;

    return (
        <g id="AltitudeIndicator">
            <svg x={512 - maskWidth} y={maskWidth} width={maskWidth} height={height} viewBox={`0 0 ${maskWidth} ${height}`}>
                <VerticalTape
                    displayRange={1500}
                    valueSpacing={100}
                    distanceSpacing={20}
                    graduationElementFunction={createTick}
                    bugs={bugs}
                    bugElementFunction={createBug}
                    tapeValue={Math.floor(altitude)}
                    lowerLimit={-2000}
                    upperLimit={50000}
                />
            </svg>
            <DigitalAltitudeIndicator altitude={Math.floor(altitude)} mda={mda} bugs={bugs} />
            <MetricAltitudeIndicator altitude={altitude} />
        </g>
    );
};

type MetricAltitudeIndicatorProps = {
    altitude: number;
}
export const MetricAltitudeIndicator: React.FC<MetricAltitudeIndicatorProps> = ({ altitude }) => {
    const metricAltitude = Math.round(altitude * 0.3048 / 10) * 10;

    return (
        <g id="MetricAltitudeIndicator" strokeWidth={3} fontSize={32}>
            <rect className="StrokeYellow NoFill" x={276} y={40} width={164} height={40} />
            <text className="Green" x={392} y={72} textAnchor="end">{metricAltitude}</text>
            <text className="TextCyan" x={400} y={72}>M</text>
        </g>
    );
};
