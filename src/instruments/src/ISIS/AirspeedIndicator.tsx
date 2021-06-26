import React from 'react';

type SpeedtapeProps = {
    maskWidth: number;
    indicatedAirspeed: number;
}

type TicksProps = {
    maskWidth: number;
    airspeed: number;
}

type TickProps = { maskWidth: number, length: number; offset: number, airspeed: number }

const Tick: React.FC<TickProps> = ({ maskWidth, length, offset, airspeed }) => (
    <g stroke="white" fill="white" transform={`translate(0 ${offset})`}>
        {airspeed % 20 === 0 && <text x={95} textAnchor="end" y={148 + 12} fontSize={30}>{airspeed}</text>}
        <path strokeWidth={3} d={`M${maskWidth - length},${148} l${length},0`} />
    </g>
);

const Ticks: React.FC<TicksProps> = ({ maskWidth, airspeed }) => {
    const lowerLimit = 30;
    const upperLimit = 660;

    const longTickLength = 20;
    const shortTickLength = 10;

    const displayRange = 42;
    const airspeedSpacing = 5; // Draw tick every kts
    const tickSpacing = 20; // Space between 5 kts ticks
    const numTicks = Math.round(displayRange * 2 / airspeedSpacing);

    const clampedValue = Math.max(Math.min(airspeed, upperLimit), lowerLimit);

    let lowestValue = Math.max(Math.round((clampedValue - displayRange) / airspeedSpacing) * airspeedSpacing, lowerLimit);
    if (lowestValue < airspeed - displayRange) {
        lowestValue += airspeedSpacing;
    }

    const ticks: unknown[] = [];

    for (let i = 0; i < numTicks; i++) {
        const airspeedOfTick = lowestValue + i * airspeedSpacing;

        if (airspeedOfTick > 250 && airspeedOfTick % 10 === 5) {
            continue;
        }

        const isLongTick = airspeedOfTick % 20 === 10;

        if (airspeedOfTick <= upperLimit) {
            const offset = -airspeedOfTick * tickSpacing / airspeedSpacing;
            ticks.push(<Tick maskWidth={maskWidth} length={isLongTick ? longTickLength : shortTickLength} offset={offset} airspeed={airspeedOfTick} />);
        }
    }

    return (
        <g transform={`translate(0 ${clampedValue * tickSpacing / airspeedSpacing})`}>
            {ticks}
        </g>
    );
};

export const AirspeedIndicator: React.FC<SpeedtapeProps> = ({ maskWidth, indicatedAirspeed }) => {
    const height = 512 - 2 * maskWidth;

    return (
        <>
            <svg x={0} y={maskWidth} width={maskWidth} height={height} viewBox={`0 0 ${maskWidth} ${height}`}>
                <Ticks maskWidth={maskWidth} airspeed={indicatedAirspeed} />
            </svg>
            {/* Speed tape arrow background */}
            <rect x={maskWidth} y={236} width={34} height={40} fill="black" />
            {/* Speed tape arrow */}
            <path
                d={`M${maskWidth},256 L${maskWidth + 34},236 L${maskWidth + 34},276 L${maskWidth},256`}
                fill="yellow"
            />
        </>
    );
};
