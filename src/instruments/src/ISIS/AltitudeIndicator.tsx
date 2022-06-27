import { usePersistentNumberProperty } from '@instruments/common/persistence';
import React from 'react';
import { Bug } from './Bug';
import { DigitalAltitudeIndicator } from './DigitalAltitudeIndicator';
import { VerticalTape } from './VerticalTape';

type TickProps = { offset: number, altitude: number }

const Tick = React.memo<TickProps>(({ altitude, offset }) => {
    const shouldShowText = altitude % 500 === 0;
    const tickLength = shouldShowText ? 5 : 20;

    return (
        <g transform={`translate(0 ${offset})`}>
            <path className="StrokeWhite" d={`M0,${158} h${tickLength}`} />
            {shouldShowText && <text x={5} y={158 + 12} className="TextWhite FontMedium">{Math.abs(altitude).toString().padStart(5, '0').slice(0, 3)}</text>}
        </g>
    );
});

type BugProps = { bug: Bug, offset: number }

const BugElement = React.memo<BugProps>(({ bug, offset }) => {
    if (bug.value % 500 === 0) {
        return (
            <g className="StrokeCyan NoFill" transform={`translate(0 ${offset})`}>
                <path d="M3,152 v-10 h65 v30 h-65 v-6" />
            </g>
        );
    }

    return (
        <g className="StrokeCyan" transform={`translate(0 ${offset})`}>
            <path strokeWidth={7} d="M0,158 h30" />
        </g>
    );
});

type AltitudeIndicatorProps = {
    altitude: number,
    mda: number,
    bugs: Bug[]
}

export const AltitudeIndicator: React.FC<AltitudeIndicatorProps> = ({ altitude, mda, bugs }) => {
    const [metricAltitude] = usePersistentNumberProperty('ISIS_METRIC_ALTITUDE', 0);

    return (
        <g id="AltitudeIndicator">
            <svg x={404} y={112} width={108} height={296} viewBox="0 0 108 296">
                <VerticalTape
                    displayRange={1000}
                    valueSpacing={100}
                    distanceSpacing={20}
                    graduationElementFunction={(altitude: number, offset: number) => <Tick altitude={altitude} offset={offset} />}
                    bugs={bugs}
                    bugElementFunction={(bug: Bug, offset: number) => <BugElement bug={bug} offset={offset} />}
                    tapeValue={altitude}
                    lowerLimit={-2000}
                    upperLimit={50000}
                />
            </svg>
            <DigitalAltitudeIndicator altitude={altitude} mda={mda} bugs={bugs} />
            { !!metricAltitude && <MetricAltitudeIndicator altitude={altitude} /> }
        </g>
    );
};

type MetricAltitudeIndicatorProps = {
    altitude: number
}

export const MetricAltitudeIndicator: React.FC<MetricAltitudeIndicatorProps> = ({ altitude }) => {
    const metricAltitude = Math.round(altitude * 0.3048 / 10) * 10;

    return (
        <g id="MetricAltitudeIndicator" fontSize={32}>
            <rect className="StrokeYellow NoFill" x={276} y={40} width={164} height={40} />
            <text className="TextGreen" x={392} y={72} textAnchor="end">{metricAltitude}</text>
            <text className="TextCyan" x={400} y={72}>M</text>
        </g>
    );
};
