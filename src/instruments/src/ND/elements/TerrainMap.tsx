import React, { useEffect, useState, useRef } from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { useSimVar } from '@instruments/common/simVars';
import { Mode, EfisSide, rangeSettings } from '@shared/NavigationDisplay';
import { useUpdate } from '@instruments/common/hooks';

const RerenderingTimeout = 2500;

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

class MapVisualizationData {
    public LastMapTimestamp: number | undefined = undefined;

    public CurrentMapTimestamp: number | undefined = undefined;

    public MapChangeInProgress: boolean = false;

    public RerenderTimeout: number | undefined = undefined;

    public MinimumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public MaximumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    constructor(...args) {
        if (args.length !== 0 && args[0] instanceof MapVisualizationData) {
            this.LastMapTimestamp = args[0].LastMapTimestamp;
            this.CurrentMapTimestamp = args[0].CurrentMapTimestamp;
            this.MapChangeInProgress = args[0].MapChangeInProgress;
            this.RerenderTimeout = args[0].RerenderTimeout;
            this.MinimumElevation = args[0].MinimumElevation;
            this.MaximumElevation = args[0].MaximumElevation;
        }
    }
}

export interface TerrainMapProps {
    x: number,
    y: number,
    width: number,
    height: number,
    side: EfisSide,
    clipName: string,
}

export const TerrainMap: React.FC<TerrainMapProps> = ({ x, y, width, height, side, clipName }) => {
    const [mapVisualization, setMapVisualization] = useState<MapVisualizationData>(new MapVisualizationData());
    const [terrOnNdActive] = useSimVar(`L:A32NX_EFIS_TERR_${side}_ACTIVE`, 'boolean', 100);
    const [rangeIndex] = useSimVar(`L:A32NX_EFIS_${side}_ND_RANGE`, 'number', 100);
    const [modeIndex] = useSimVar(`L:A32NX_EFIS_${side}_ND_MODE`, 'number', 100);
    const [gearMode] = useSimVar('GEAR POSITION:0', 'Enum', 100);
    const mapVisualizationRef = useRef<MapVisualizationData>();
    mapVisualizationRef.current = mapVisualization;

    const syncWithRenderer = (timestamp: number) => {
        // wait until the rendering is done
        setTimeout(() => {
            fetch(`http://localhost:8080/api/v1/terrain/ndMapAvailable?display=${side}&timestamp=${timestamp}`).then((response) => {
                if (response.ok) {
                    response.text().then((text) => {
                        if (text !== 'true') {
                            if (terrOnNdActive) {
                                syncWithRenderer(timestamp);
                            }
                            return;
                        }

                        fetch(`http://localhost:8080/api/v1/terrain/terrainRange?display=${side}&timestamp=${timestamp}`, {
                            method: 'GET',
                            headers: { Accept: 'application/json' },
                        }).then((response) => response.json().then((data) => {
                            if (response.ok) {
                                if ('minElevation' in data && data.minElevation !== Infinity && 'maxElevation' in data && data.maxElevation !== Infinity) {
                                    let minimumColor = 'rgb(0, 255, 0)';
                                    if (data.minElevationIsWarning) {
                                        minimumColor = 'rgb(255, 255, 0)';
                                    } else if (data.minElevationIsCaution) {
                                        minimumColor = 'rgb(255, 0, 0)';
                                    }
                                    let maximumColor = 'rgb(0, 255, 0)';
                                    if (data.maxElevationIsWarning) {
                                        maximumColor = 'rgb(255, 255, 0)';
                                    } else if (data.maxElevationIsCaution) {
                                        maximumColor = 'rgb(255, 0, 0)';
                                    }

                                    if (mapVisualizationRef.current) {
                                        mapVisualizationRef.current.MinimumElevation = { altitude: data.minElevation, color: minimumColor };
                                        mapVisualizationRef.current.MaximumElevation = { altitude: data.maxElevation, color: maximumColor };
                                    }
                                } else if (mapVisualizationRef.current) {
                                    mapVisualizationRef.current.MinimumElevation = { altitude: Infinity, color: 'rgb(0, 0, 0)' };
                                    mapVisualizationRef.current.MaximumElevation = { altitude: Infinity, color: 'rgb(0, 0, 0)' };
                                }

                                const newVisualization = new MapVisualizationData(mapVisualizationRef.current);
                                newVisualization.MapChangeInProgress = true;
                                newVisualization.CurrentMapTimestamp = timestamp;
                                setMapVisualization(newVisualization);

                                // execute the renderer
                                setTimeout(() => {
                                    const rerenderVisualization = new MapVisualizationData(mapVisualizationRef.current);
                                    rerenderVisualization.LastMapTimestamp = timestamp;
                                    setMapVisualization(rerenderVisualization);

                                    // preload the "new" old timestamp to avoid flickering
                                    setTimeout(() => {
                                        const finalizeMapChange = new MapVisualizationData(mapVisualizationRef.current);
                                        finalizeMapChange.RerenderTimeout = RerenderingTimeout;
                                        finalizeMapChange.MapChangeInProgress = false;
                                        setMapVisualization(finalizeMapChange);
                                    }, 200);
                                }, 2000);
                            }
                        }));
                    });
                }
            });
        }, 200);
    };

    useUpdate((deltaTime) => {
        if (terrOnNdActive && mapVisualizationRef.current?.RerenderTimeout !== undefined) {
            if (mapVisualizationRef.current.RerenderTimeout <= 0) {
                const newVisualizationData = new MapVisualizationData(mapVisualizationRef.current);
                newVisualizationData.RerenderTimeout = undefined;
                setMapVisualization(newVisualizationData);

                fetch(`http://127.0.0.1:8080/api/v1/terrain/renderMap?display=${side}`).then((response) => response.text().then((text) => {
                    const timestamp = parseInt(text);
                    if (timestamp < 0) {
                        return;
                    }
                    syncWithRenderer(timestamp);
                }));
            } else {
                const newVisualizationData = new MapVisualizationData(mapVisualizationRef.current);
                if (newVisualizationData.RerenderTimeout !== undefined) {
                    newVisualizationData.RerenderTimeout -= deltaTime;
                }
                setMapVisualization(newVisualizationData);
            }
        } else if (!terrOnNdActive && mapVisualizationRef.current?.RerenderTimeout !== undefined) {
            const newVisualizationData = new MapVisualizationData(mapVisualizationRef.current);
            newVisualizationData.RerenderTimeout = undefined;
            setMapVisualization(newVisualizationData);
        }
    });

    useEffect(() => {
        if (!terrOnNdActive) {
            setMapVisualization(new MapVisualizationData());
        } else if (mapVisualizationRef.current?.RerenderTimeout === undefined) {
            const newVisualizationData = new MapVisualizationData(mapVisualizationRef.current);
            newVisualizationData.RerenderTimeout = RerenderingTimeout;
            setMapVisualization(newVisualizationData);
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

    if (!terrOnNdActive || modeIndex === Mode.PLAN || mapVisualizationRef.current.CurrentMapTimestamp === undefined) {
        return <></>;
    }

    const lowerBorder = String(Math.floor(mapVisualizationRef.current.MinimumElevation.altitude / 100)).padStart(3, '0');
    const upperBorder = String(Math.round(mapVisualizationRef.current.MaximumElevation.altitude / 100 + 0.5)).padStart(3, '0');
    const xCenter = x + Math.round(width / 2);
    const bottom = y + height;

    return (
        <>
            <g id="map" clipPath={`url(#${clipName})`}>
                {mapVisualizationRef.current.LastMapTimestamp !== undefined
                    ? (
                        <>
                            <image
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                xlinkHref={`http://localhost:8080/api/v1/terrain/ndmap.png?display=${side}&timestamp=${mapVisualizationRef.current.LastMapTimestamp}`}
                            />
                        </>
                    )
                    : <></>}
                {mapVisualizationRef.current.MapChangeInProgress ? (
                    <>
                        <defs>
                            <clipPath id={`maptransition${mapVisualizationRef.current.CurrentMapTimestamp}`}>
                                <path>
                                    <animate
                                        attributeName="d"
                                        begin="0s"
                                        dur="2.5s"
                                        keyTimes="0; 0.08; 0.48; 0.88; 1"
                                        repeatCount="indefinite"
                                        values={`M ${xCenter} ${bottom} L ${xCenter} ${y} L ${xCenter} ${y} L ${xCenter} ${y} L ${xCenter} ${y} z;
                                                 M ${xCenter} ${bottom} L ${xCenter} ${y} L ${xCenter} ${y} L ${xCenter} ${y} L ${xCenter} ${y} z;
                                                 M ${xCenter} ${bottom} L ${x + width} ${y} L ${x + width} ${y} L ${x} ${y} L ${x} ${y} z;
                                                 M ${xCenter} ${bottom} L ${x + width} ${bottom} L ${x + width} ${y} L ${x} ${y} L ${x} ${bottom} z;
                                                 M ${xCenter} ${bottom} L ${x + width} ${bottom} L ${x + width} ${y} L ${x} ${y} L ${x} ${bottom} z
                                    `}
                                    />
                                </path>
                            </clipPath>
                        </defs>
                        <image
                            clipPath={`url(#maptransition${mapVisualizationRef.current.CurrentMapTimestamp})`}
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            xlinkHref={`http://localhost:8080/api/v1/terrain/ndmap.png?display=${side}&timestamp=${mapVisualizationRef.current.CurrentMapTimestamp}`}
                        />
                    </>
                ) : (
                    <image
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        xlinkHref={`http://localhost:8080/api/v1/terrain/ndmap.png?display=${side}&timestamp=${mapVisualizationRef.current.CurrentMapTimestamp}`}
                    />
                )}
            </g>
            <text x={688} y={612} fontSize={23} fill="rgb(0,255,255)">
                TERR
            </text>
            <text x={709} y={639} fontSize={22} fill={mapVisualizationRef.current.MaximumElevation.color}>
                {upperBorder}
            </text>
            <rect x={700} y={619} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
            <text x={709} y={663} fontSize={23} fill={mapVisualizationRef.current.MinimumElevation.color}>
                {lowerBorder}
            </text>
            <rect x={700} y={643} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
        </>
    );
};
