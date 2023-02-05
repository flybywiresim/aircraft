import { MathUtils } from '@shared/MathUtils';
import { NdSymbol } from '@shared/NavigationDisplay';
import React, { memo, useEffect, useState } from 'react';
import { SymbolMarker } from './FlightPlan';
import { MapParameters } from '../utils/MapParameters';

interface TrackLineProps {
    x: number,
    y: number,
    heading: number,
    track: number,
    groundSpeed: Knots,
    mapParams: MapParameters,
    symbols: NdSymbol[],
    ndRange: number,
}

export const TrackLine: React.FC<TrackLineProps> = memo(({ x, y, heading, track, mapParams, groundSpeed, symbols, ndRange }) => {
    const rotate = MathUtils.diffAngle(heading, track);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

    useEffect(() => {
        setLastUpdateTime(Date.now());
    }, [symbols]);

    return (
        <g transform={`rotate(${rotate} ${x} ${y})`}>
            <line x1={384} y1={149} x2={x} y2={y} className="rounded shadow" strokeWidth={3.0} />
            <line x1={384} y1={149} x2={x} y2={y} className="rounded Green" strokeWidth={2.5} />

            {symbols.map((symbol) => {
                // We only want to place the symbol on the track line if it does not have a location on the flight plan.
                if (!symbol.distanceFromAirplane || symbol.location) {
                    return false;
                }

                const dy = (symbol.distanceFromAirplane - groundSpeed * (Date.now() - lastUpdateTime) / 1000 / 60 / 60) * mapParams.nmToPx;
                return <SymbolMarker x={x} y={y - dy} type={symbol.type} mapParams={mapParams} ident={symbol.ident} ndRange={ndRange} />;
            })}
        </g>
    );
});
