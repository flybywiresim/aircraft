import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Mode, EfisSide, rangeSettings } from '@shared/NavigationDisplay';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { useInteractionEvent } from '@instruments/common/hooks';

const MapRenderingTime = 1.5;

export interface TerrainMapProps {
    x: number,
    y: number,
    width: number,
    height: number,
    side: EfisSide,
    clipName: string,
    ppos: LatLongData,
}

export const TerrainMap: React.FC<TerrainMapProps> = ({ x, y, width, height, side, clipName, ppos }) => {
    const [terrOnNdActive, setTerrOnNdActive] = useState<boolean>(SimVar.GetSimVarValue(`L:A32NX_TERRONND_${side === 'L' ? '1' : '2'}_ACTIVE`, 'number') === 1);
    const [renderingTimestamp, setRenderingTimestamp] = useState<number | null>(null);
    const [rangeIndex] = useSimVar(side === 'L' ? 'L:A32NX_EFIS_L_ND_RANGE' : 'L:A32NX_EFIS_R_ND_RANGE', 'number', 100);
    const [modeIndex] = useSimVar(side === 'R' ? 'L:A32NX_EFIS_L_ND_MODE' : 'L:A32NX_EFIS_R_ND_MODE', 'number', 100);
    const [verticalSpeed] = useSimVar('VERTICAL SPEED', 'feet per second', 100);
    const [minimumElevation, setMinimumElevation] = useState<number>(Infinity);
    const [maximumElevation, setMaximumElevation] = useState<number>(Infinity);
    const [trueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees');
    const [gearMode] = useSimVar('GEAR POSITION:0', 'Enum', 100);
    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 100);
    const [updateMap, setUpdateMap] = useState<boolean>(false);

    useInteractionEvent(`A320_Neo_MFD_BTN_TERRONND_${side === 'L' ? '1' : '2'}`, () => {
        if (terrOnNdActive) {
            SimVar.SetSimVarValue(`BTN_TERRONND_${side === 'L' ? '1' : '2'}_ACTIVE`, 'number', 0);
        } else {
            SimVar.SetSimVarValue(`BTN_TERRONND_${side === 'L' ? '1' : '2'}_ACTIVE`, 'number', 1);
        }
        setTerrOnNdActive(!terrOnNdActive);
    });

    // update the map if needed
    if (side === 'L') {
        useEffect(() => {
            if (side === 'L') {
                const currentPosition = {
                    latitude: ppos.lat,
                    longitude: ppos.long,
                    heading: trueHeading,
                    altitude: Math.round(altitude),
                    verticalSpeed: Math.round(verticalSpeed * 60.0),
                };
                fetch('http://localhost:8080/api/v1/terrain/position', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-cache',
                    body: JSON.stringify(currentPosition),
                }).then(() => setUpdateMap(!updateMap));
            }
        }, [altitude, verticalSpeed, ppos.lat, ppos.long, trueHeading]);
    }

    useEffect(() => {
        if (modeIndex === Mode.PLAN || !terrOnNdActive) {
            setRenderingTimestamp(null);
        }

        const displayConfiguration = {
            display: side,
            active: modeIndex !== Mode.PLAN && terrOnNdActive,
            mapWidth: width,
            mapHeight: height,
            meterPerPixel: rangeSettings[rangeIndex] * 1852 / height,
            arcMode: modeIndex === Mode.ARC,
            gearDown: SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') !== 1,
        };
        fetch('http://localhost:8080/api/v1/terrain/configureDisplay', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache',
            body: JSON.stringify(displayConfiguration),
        }).then(() => setTimeout(() => {
            fetch(`http://localhost:8080/api/v1/terrain/terrainRange?display=${side}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            }).then((response) => response.json().then((data) => {
                if ('minElevation' in data && data.minElevation && 'maxElevation' in data && data.maxElevation) {
                    setMinimumElevation(data.minElevation);
                    setMaximumElevation(data.maxElevation);
                } else {
                    setMinimumElevation(Infinity);
                    setMaximumElevation(Infinity);
                }
                setRenderingTimestamp(new Date().getTime());
            }));
        }, MapRenderingTime * 1000));
    }, [terrOnNdActive, rangeIndex, modeIndex, gearMode, updateMap]);

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

    if (!terrOnNdActive || modeIndex === Mode.PLAN || renderingTimestamp === null || !Number.isFinite(minimumElevation) || !Number.isFinite(maximumElevation)) {
        return <></>;
    }

    const lowerBorder = String(Math.floor(minimumElevation / 100)).padStart(3, '0');
    const upperBorder = String(Math.round(maximumElevation / 100 + 0.5)).padStart(3, '0');

    return (
        <>
            <g id="map" clipPath={`url(#${clipName})`}>
                <image x={x} y={y} width={width} height={height} xlinkHref={`http://localhost:8080/api/v1/terrain/${side === 'L' ? 'left' : 'right'}.png?${renderingTimestamp}`} />
            </g>
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
