import React from 'react';
import { DigitalAltitudeIndicator } from './DigitalAltitudeIndicator';
import { VerticalTape } from './ISISUtils';

type AltitudeIndicatorProps = {
    maskWidth: number;
    altitude: number;
    mda: number
}

type TickProps = { maskWidth: number; offset: number, altitude: number }

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

export const AltitudeIndicator: React.FC<AltitudeIndicatorProps> = ({ maskWidth, altitude, mda }) => {
    const height = 512 - 2 * maskWidth;
    const createTick = (altitude: number, offset: number) => <Tick altitude={altitude} offset={offset} />;

    return (
        <g id="AltitudeIndicator">
            <svg x={512 - maskWidth} y={maskWidth} width={maskWidth} height={height} viewBox={`0 0 ${maskWidth} ${height}`}>
                <VerticalTape
                    displayRange={1500}
                    valueSpacing={100}
                    distanceSpacing={20}
                    graduationElementFunction={createTick}
                    tapeValue={Math.floor(altitude)}
                    lowerLimit={-2000}
                    upperLimit={50000}
                />
            </svg>
            <DigitalAltitudeIndicator altitude={Math.floor(altitude)} mda={mda} />
        </g>
    );
};
