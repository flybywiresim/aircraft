import React, { useEffect, useState } from 'react';
import { RangeSetting, Mode, EfisSide } from '@shared/NavigationDisplay';
import { MapParameters } from '../utils/MapParameters';

const MapRenderingTime = 1.5;

export interface TerrainMapProps {
    x: number,
    y: number,
    width: number,
    height: number,
    range: RangeSetting,
    side: EfisSide,
    mapParams: MapParameters,
    displayMode: Mode,
}

export const TerrainMap: React.FC<TerrainMapProps> = ({ x, y, width, height, range, side, mapParams, displayMode }) => {
    const [renderingTimestamp, setRenderingTimestamp] = useState<number | null>(null);

    // update the map if needed
    useEffect(() => {
        setRenderingTimestamp(null);

        if (side === 'L') {
            const currentPosition = {
                latitude: mapParams.centerCoordinates.lat,
                longitude: mapParams.centerCoordinates.long,
                heading: mapParams.mapUpTrueDeg,
                altitude: Math.round(SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet')),
                verticalSpeed: Math.round(SimVar.GetSimVarValue('VERTICAL SPEED', 'feet per second') * 60.0),
            };
            fetch('http://localhost:8080/api/v1/terrain/position', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-cache',
                body: JSON.stringify(currentPosition),
            });
        }

        const displayConfiguration = {
            display: 'L',
            active: displayMode !== Mode.PLAN,
            viewRadius: range,
            meterPerPixel: 1.0 / mapParams.mToPx,
            rotateAroundHeading: displayMode !== Mode.PLAN,
            semicircleRequired: displayMode === Mode.ARC,
            gearDown: SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') !== 1,
        };
        fetch('http://localhost:8080/api/v1/terrain/configureDisplay', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache',
            body: JSON.stringify(displayConfiguration),
        }).then(() => setTimeout(() => setRenderingTimestamp(new Date().getTime()), MapRenderingTime * 1000));
    }, [range, mapParams.centerCoordinates.lat, mapParams.centerCoordinates.long, displayMode]);

    // update the system based on the left ND
    if (side === 'L' && renderingTimestamp === 0) {
        const cachingConfiguration = {
            reset: false,
            ndMapUpdateInterval: MapRenderingTime,
            visibilityRange: 320,
        };
        fetch('http://localhost:8080/api/v1/terrain/configure', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache',
            body: JSON.stringify(cachingConfiguration),
        });
    }

    if (displayMode === Mode.PLAN || side === 'R' || renderingTimestamp === null) {
        return <></>;
    }

    return (
        <>
            <image x={x} y={y} width={width} height={height} xlinkHref={`http://localhost:8080/api/v1/terrain/${side === 'L' ? 'left' : 'right'}.png?stamp=${renderingTimestamp}`} />
        </>
    );
};
