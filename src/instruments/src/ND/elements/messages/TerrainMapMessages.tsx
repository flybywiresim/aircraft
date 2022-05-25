import React, { useEffect, useState } from 'react';
import { RangeSetting, Mode, EfisSide } from '@shared/NavigationDisplay';
import { MapParameters } from '../../utils/MapParameters';

const MapRenderingTime = 1.5;

export interface TerrainMapMessagesProps {
    range: RangeSetting,
    side: EfisSide,
    mapParams: MapParameters,
    displayMode: Mode,
}

export const TerrainMapMessages: React.FC<TerrainMapMessagesProps> = ({ range, side, mapParams, displayMode }) => {
    const [renderingTimeout, setRenderingTimeout] = useState<NodeJS.Timeout | null>(null);
    const [lastRangeSetting, setLastRangeSetting] = useState<number>(range);
    const [minimumElevation, setMinimumElevation] = useState<number>(Infinity);
    const [maximumElevation, setMaximumElevation] = useState<number>(Infinity);

    // update the map if needed
    useEffect(() => {
        if (range !== lastRangeSetting) {
            if (renderingTimeout !== null) {
                clearTimeout(renderingTimeout);
            }
            setLastRangeSetting(range);
        }

        setRenderingTimeout(setTimeout(() => {
            fetch(`http://localhost:8080/api/v1/terrain/terrainRange?display=${side}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            }).then((response) => response.json().then((data) => {
                if ('minElevation' in data && 'maxElevation' in data) {
                    setMinimumElevation(data.minElevation);
                    setMaximumElevation(data.maxElevation);
                } else {
                    setMinimumElevation(Infinity);
                    setMaximumElevation(Infinity);
                }
            }));
        }, MapRenderingTime * 1000));
    }, [range, mapParams.centerCoordinates.lat, mapParams.centerCoordinates.long, mapParams.mapUpTrueDeg, displayMode]);

    if (displayMode === Mode.PLAN || !Number.isFinite(minimumElevation) || !Number.isFinite(maximumElevation)) {
        return <></>;
    }

    const lowerBorder = String(Math.floor(minimumElevation / 100)).padStart(3, '0');
    const upperBorder = String(Math.round(maximumElevation / 100 + 0.5)).padStart(3, '0');

    return (
        <>
            <text x={688} y={612} fontSize={23} fill="rgb(0,255,255)">
                TERR
            </text>
            <text x={709} y={639} fontSize={22} fill="rgb(0,255,0)">
                {upperBorder}
            </text>
            <rect x={700} y={619} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
            <text x={709} y={663} fontSize={23} fill="rgb(0,255,0)">
                {lowerBorder}
            </text>
            <rect x={700} y={643} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
        </>
    );
};
