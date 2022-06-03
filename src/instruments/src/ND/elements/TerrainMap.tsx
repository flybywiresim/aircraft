import React, { useEffect, useState } from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { useSimVar } from '@instruments/common/simVars';
import { Mode, EfisSide, rangeSettings } from '@shared/NavigationDisplay';
import { useUpdate } from '@instruments/common/hooks';

export interface TerrainMapProviderProps {
    side: EfisSide,
}

export const TerrainMapProvider: React.FC<TerrainMapProviderProps> = ({ side }) => {
    const arincLat = useArinc429Var('L:A32NX_ADIRS_IR_1_LATITUDE', 1000);
    const arincLong = useArinc429Var('L:A32NX_ADIRS_IR_1_LONGITUDE', 1000);
    const [verticalSpeed] = useSimVar('VERTICAL SPEED', 'feet per second', 1000);
    const [trueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 1000);
    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 1000);
    const [updateTime, setUpdateTime] = useState<number>(0);

    useEffect(() => {
        const currentTime = new Date().getTime();

        // do not more than every 500 ms (unneeded due to system design)
        if (side === 'L' && arincLat.isNormalOperation() && arincLong.isNormalOperation() && (currentTime - updateTime) >= 500) {
            setUpdateTime(currentTime);

            const currentPosition = {
                latitude: arincLat.value,
                longitude: arincLong.value,
                heading: trueHeading,
                altitude: Math.round(altitude),
                verticalSpeed: Math.round(verticalSpeed * 60.0),
            };

            fetch('http://localhost:8080/api/v1/terrain/position', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentPosition),
            });
        }
    }, [arincLat, arincLong, verticalSpeed, trueHeading, altitude]);

    return <></>;
};

export interface TerrainMapProps {
    x: number,
    y: number,
    width: number,
    height: number,
    side: EfisSide,
    clipName: string,
}

export const TerrainMap: React.FC<TerrainMapProps> = ({ x, y, width, height, side, clipName }) => {
    const [currentMapTimestamp, setCurrentMapTimestamp] = useState<number | null>(null);
    const [terrOnNdActive] = useSimVar(`L:A32NX_EFIS_TERR_${side}_ACTIVE`, 'boolean', 100);
    const [rangeIndex] = useSimVar(`L:A32NX_EFIS_${side}_ND_RANGE`, 'number', 100);
    const [modeIndex] = useSimVar(`L:A32NX_EFIS_${side}_ND_MODE`, 'number', 100);
    const [minimumElevation, setMinimumElevation] = useState<{ altitude: number, color: string }>({ altitude: Infinity, color: 'rgb(0, 0, 0)' });
    const [maximumElevation, setMaximumElevation] = useState<{ altitude: number, color: string }>({ altitude: Infinity, color: 'rgb(0, 0, 0)' });
    const [rerenderTimeout, setRerenderTimeout] = useState<number | null>(null);
    const [gearMode] = useSimVar('GEAR POSITION:0', 'Enum', 100);

    const syncWithRenderer = (timestamp: number) => {
        // wait until the rendering is done
        setTimeout(() => {
            fetch(`http://localhost:8080/api/v1/terrain/ndMapAvailable?display=${side}&timestamp=${timestamp}`).then((response) => {
                if (response.ok) {
                    response.text().then((text) => {
                        if (text !== 'true') {
                            syncWithRenderer(timestamp);
                            return;
                        }

                        fetch(`http://localhost:8080/api/v1/terrain/terrainRange?display=${side}&timestamp=${timestamp}`, {
                            method: 'GET',
                            headers: { Accept: 'application/json' },
                        }).then((response) => response.json().then((data) => {
                            if (response.ok) {
                                if ('minElevation' in data && data.minElevation && 'maxElevation' in data && data.maxElevation) {
                                    setMinimumElevation(data.minElevation);
                                    setMaximumElevation(data.maxElevation);
                                } else {
                                    setMinimumElevation(Infinity);
                                    setMaximumElevation(Infinity);
                                }

                                setCurrentMapTimestamp(timestamp);
                                setRerenderTimeout(4000);
                            }
                        }));
                    });
                }
            });
        }, 200);
    };

    // update every 2.5 seconds and 1.5 seconds fade duration
    useUpdate((deltaTime) => {
        if (terrOnNdActive && rerenderTimeout !== null) {
            if (rerenderTimeout <= 0) {
                setRerenderTimeout(null);

                fetch(`http://127.0.0.1:8080/api/v1/terrain/renderMap?display=${side}`).then((response) => response.text().then((text) => {
                    const timestamp = parseInt(text);
                    if (timestamp < 0) {
                        return;
                    }
                    syncWithRenderer(timestamp);
                }));
            } else {
                setRerenderTimeout(rerenderTimeout - deltaTime);
            }
        } else if (!terrOnNdActive && rerenderTimeout !== null) {
            setRerenderTimeout(null);
        }
    });

    useEffect(() => {
        if (!terrOnNdActive) {
            setCurrentMapTimestamp(null);
            setRerenderTimeout(null);
        } else if (rerenderTimeout === null) {
            setRerenderTimeout(1500);
        }

        const displayConfiguration = {
            active: modeIndex !== Mode.PLAN && terrOnNdActive !== 0,
            mapWidth: width,
            mapHeight: height,
            meterPerPixel: rangeSettings[rangeIndex] * 1852 / height,
            arcMode: modeIndex === Mode.ARC,
            gearDown: SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') !== 1,
        };
        fetch(`http://localhost:8080/api/v1/terrain/displaysettings?display=${side}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(displayConfiguration),
        });
    }, [terrOnNdActive, rangeIndex, modeIndex, gearMode]);

    if (!terrOnNdActive || modeIndex === Mode.PLAN || currentMapTimestamp === null) {
        return <></>;
    }

    const lowerBorder = String(Math.floor(minimumElevation.altitude / 100)).padStart(3, '0');
    const upperBorder = String(Math.round(maximumElevation.altitude / 100 + 0.5)).padStart(3, '0');

    return (
        <>
            <g id="map" clipPath={`url(#${clipName})`}>
                <image x={x} y={y} width={width} height={height} xlinkHref={`http://localhost:8080/api/v1/terrain/ndmap.png?display=${side}&timestamp=${currentMapTimestamp}`} />
            </g>
            <text x={688} y={612} fontSize={23} fill="rgb(0,255,255)">
                TERR
            </text>
            <text x={709} y={639} fontSize={22} fill={maximumElevation.color}>
                {upperBorder}
            </text>
            <rect x={700} y={619} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
            <text x={709} y={663} fontSize={23} fill={minimumElevation.color}>
                {lowerBorder}
            </text>
            <rect x={700} y={643} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
        </>
    );
};
