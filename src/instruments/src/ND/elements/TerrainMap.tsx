import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Mode, EfisSide, rangeSettings } from '@shared/NavigationDisplay';
import { useInteractionEvent } from '@instruments/common/hooks';
import { MapParameters } from '../utils/MapParameters';

const MapRenderingTime = 1.5;

export interface TerrainMapProps {
    x: number,
    y: number,
    width: number,
    height: number,
    side: EfisSide,
    mapParams: MapParameters,
}

export const TerrainMap: React.FC<TerrainMapProps> = ({ x, y, width, height, side, mapParams }) => {
    const [terrOnNdActive, setTerrOnNdActive] = useState<boolean>(SimVar.GetSimVarValue(`BTN_TERRONND_${side === 'L' ? '1' : '2'}_ACTIVE`, 'number') === 1);
    const [renderingTimeout, setRenderingTimeout] = useState<NodeJS.Timeout | null>(null);
    const [renderingTimestamp, setRenderingTimestamp] = useState<number | null>(null);
    const [rangeIndex] = useSimVar(side === 'L' ? 'L:A32NX_EFIS_L_ND_RANGE' : 'L:A32NX_EFIS_R_ND_RANGE', 'number', 100);
    const [modeIndex] = useSimVar(side === 'R' ? 'L:A32NX_EFIS_L_ND_MODE' : 'L:A32NX_EFIS_R_ND_MODE', 'number', 100);
    const [verticalSpeed] = useSimVar('VERTICAL SPEED', 'feet per second', 100);
    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 100);

    useInteractionEvent(`A320_Neo_MFD_BTN_TERRONND_${side === 'L' ? '1' : '2'}`, () => {
        if (terrOnNdActive) {
            SimVar.SetSimVarValue(`BTN_TERRONND_${side === 'L' ? '1' : '2'}_ACTIVE`, 'number', 0);
        } else {
            SimVar.SetSimVarValue(`BTN_TERRONND_${side === 'L' ? '1' : '2'}_ACTIVE`, 'number', 1);
        }
        setTerrOnNdActive(!terrOnNdActive);
    });

    // update the map if needed
    useEffect(() => {
        if (side === 'L') {
            const currentPosition = {
                latitude: mapParams.centerCoordinates.lat,
                longitude: mapParams.centerCoordinates.long,
                heading: mapParams.mapUpTrueDeg,
                altitude: Math.round(altitude),
                verticalSpeed: Math.round(verticalSpeed * 60.0),
            };
            fetch('http://localhost:8080/api/v1/terrain/position', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-cache',
                body: JSON.stringify(currentPosition),
            });
        }

        const displayConfiguration = {
            display: side,
            active: modeIndex !== Mode.PLAN && terrOnNdActive,
            mapWidth: width,
            mapHeight: height,
            meterPerPixel: 1.0 / mapParams.mToPx,
            arcMode: modeIndex === Mode.ARC,
            gearDown: SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') !== 1,
        };
        fetch('http://localhost:8080/api/v1/terrain/configureDisplay', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache',
            body: JSON.stringify(displayConfiguration),
        }).then(() => setRenderingTimeout(setTimeout(() => setRenderingTimestamp(new Date().getTime()), MapRenderingTime * 1000)));
    }, [terrOnNdActive, [rangeIndex], [modeIndex], [altitude], [verticalSpeed], mapParams.centerCoordinates.lat, mapParams.centerCoordinates.long, mapParams.mapUpTrueDeg]);

    // update the system based on the left ND
    if (side === 'L' && renderingTimestamp === 0) {
        const cachingConfiguration = {
            reset: false,
            ndMapUpdateInterval: MapRenderingTime,
            visibilityRange: 400,
        };
        fetch('http://localhost:8080/api/v1/terrain/configure', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache',
            body: JSON.stringify(cachingConfiguration),
        });
    }

    if (displayMode === Mode.PLAN || renderingTimestamp === null) {
        return <></>;
    }

    return (
        <>
            <image x={x} y={y} width={width} height={height} xlinkHref={`http://localhost:8080/api/v1/terrain/${side === 'L' ? 'left' : 'right'}.png?${renderingTimestamp}`} />
        </>
    );
};
