import React, { useEffect, useState, useRef } from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { useUpdate } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import { EfisNdMode, EfisSide, rangeSettings } from '@shared/NavigationDisplay';
import { Terrain } from '../../../../simbridge-client/src/index';

const MAP_TRANSITION_FRAMERATE = 15;
const MAP_TRANSITION_DURATION = 1.5;
const RERENDER_TIMEOUT = 500;
const METRES_TO_NAUTICAL_MILES = 1852;

export interface TerrainMapProviderProps {
    side: EfisSide,
}

export const TerrainMapProvider: React.FC<TerrainMapProviderProps> = ({ side }) => {
    const arincLat = useArinc429Var('L:A32NX_ADIRS_IR_1_LATITUDE', 1_000);
    const arincLong = useArinc429Var('L:A32NX_ADIRS_IR_1_LONGITUDE', 1_000);
    const [verticalSpeed] = useSimVar('VERTICAL SPEED', 'feet per second', 1_000);
    const [trueHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 1_000);
    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 1_000);

    const [timer, setTimer] = useState<number | undefined>(500);

    useUpdate((deltaTime) => {
        if (timer !== undefined) {
            if (timer > 0) {
                setTimer(Math.max(timer - (deltaTime), 0));
            } else if (arincLat.isNormalOperation() && arincLong.isNormalOperation()) {
                setTimer(undefined);
                Terrain.mapdataAvailable().then((available) => {
                    if (available === true && side === 'L') {
                        Terrain.setCurrentPosition(arincLat.value, arincLong.value, trueHeading, Math.round(altitude), Math.round(verticalSpeed * 60.0)).catch((_ex) => {});
                    }
                    setTimer(500);
                }).catch((e) => {
                    console.error(e);
                });
            }
        }
    });

    return <></>;
};

interface TerrainMapTransitionProps {
    x: number,
    y: number,
    width: number,
    height: number,
    mapdata: string[],
    onFinished: () => void,
}

const TerrainMapTransition: React.FC<TerrainMapTransitionProps> = ({ x, y, width, height, mapdata, onFinished }) => {
    const frameBuffer: [{ opacity: number, index: number }, React.Dispatch<React.SetStateAction<{ opacity: number, index: number }>>][] = [
        useState({ opacity: 0.01, index: 0 }),
        useState({ opacity: 0.01, index: 0 }),
        useState({ opacity: 0.01, index: 0 }),
    ];

    const [frameTimer, setFrameTimer] = useState<NodeJS.Timer | undefined>(undefined);
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    const frameTimerRef = useRef<NodeJS.Timer | undefined>();
    const currentFrameRef = useRef<number>();

    currentFrameRef.current = currentFrame;
    frameTimerRef.current = frameTimer;

    if (frameTimerRef.current === undefined) {
        setFrameTimer(setInterval(() => {
            if (currentFrameRef.current !== undefined && frameTimerRef.current !== undefined) {
                if (currentFrameRef.current >= mapdata.length - 1) {
                    clearInterval(frameTimerRef.current);
                    onFinished();
                } else {
                    for (let i = 0; i < frameBuffer.length; ++i) {
                        frameBuffer[(currentFrameRef.current + i) % frameBuffer.length][1]({ opacity: i === 0 ? 1 : 0.01, index: currentFrameRef.current + i });
                    }

                    setCurrentFrame(currentFrameRef.current + 1);
                }
            }
        }, Math.round(1000 / MAP_TRANSITION_FRAMERATE)));
    }

    return (
        <>
            {frameBuffer.map((frame) => (
                frame[0].index < mapdata.length && mapdata[frame[0].index] !== undefined
                    ? (
                        <image
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            opacity={frame[0].opacity}
                            xlinkHref={`data:image/png;base64,${mapdata[frame[0].index]}`}
                        />
                    ) : <></>
            ))}
        </>
    );
};

class MapVisualizationData {
    public TerrainMapBuffer: { opacity: number, data: string }[] = [{ opacity: 0.01, data: '' }, { opacity: 0.01, data: '' }];

    public MapTransitionData: string[] = [];

    public RerenderTimeout: number | undefined = undefined;

    public NextMinimumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public NextMaximumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public MinimumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    public MaximumElevation: { altitude: number, color: string } = { altitude: Infinity, color: 'rgb(0, 0, 0)' };

    constructor(...args) {
        if (args.length !== 0 && args[0] instanceof MapVisualizationData) {
            this.TerrainMapBuffer = args[0].TerrainMapBuffer;
            this.MapTransitionData = args[0].MapTransitionData;
            this.RerenderTimeout = args[0].RerenderTimeout;
            this.NextMinimumElevation = args[0].NextMinimumElevation;
            this.NextMaximumElevation = args[0].NextMaximumElevation;
            this.MinimumElevation = args[0].MinimumElevation;
            this.MaximumElevation = args[0].MaximumElevation;
        }
    }
}

export interface TerrainMapProps {
    potentiometerIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    side: EfisSide,
    clipName: string,
}

export const TerrainMap: React.FC<TerrainMapProps> = ({ potentiometerIndex, x, y, width, height, side, clipName }) => {
    const destinationLongitude = useArinc429Var(`L:A32NX_FM${side === 'L' ? 1 : 2}_DEST_LONG`, 100);
    const destinationLatitude = useArinc429Var(`L:A32NX_FM${side === 'L' ? 1 : 2}_DEST_LAT`, 100);
    const [mapVisualization, setMapVisualization] = useState<MapVisualizationData>(new MapVisualizationData());
    const [potentiometer] = useSimVar(`LIGHT POTENTIOMETER:${potentiometerIndex}`, 'percent over 100', 200);
    const [terrOnNdActive] = useSimVar(`L:A32NX_EFIS_TERR_${side}_ACTIVE`, 'boolean', 100);
    const [rangeIndex] = useSimVar(`L:A32NX_EFIS_${side}_ND_RANGE`, 'number', 100);
    const [modeIndex] = useSimVar(`L:A32NX_EFIS_${side}_ND_MODE`, 'number', 100);
    const [gearMode] = useSimVar('GEAR POSITION:0', 'Enum', 100);
    const mapVisualizationRef = useRef<MapVisualizationData>();

    mapVisualizationRef.current = mapVisualization;

    const syncWithRenderer = (timestamp: number) => {
        // wait until the rendering is done
        setTimeout(() => {
            Terrain.ndMapAvailable(side, timestamp).then((available) => {
                if (!available) {
                    if (terrOnNdActive) {
                        syncWithRenderer(timestamp);
                    }
                } else {
                    Terrain.ndTransitionMaps(side, timestamp).then((imagesBase64) => {
                        Terrain.ndTerrainRange(side, timestamp).then((data) => {
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
                                    mapVisualizationRef.current.NextMinimumElevation = { altitude: data.minElevation, color: minimumColor };
                                    mapVisualizationRef.current.NextMaximumElevation = { altitude: data.maxElevation, color: maximumColor };
                                }
                            } else if (mapVisualizationRef.current) {
                                mapVisualizationRef.current.NextMinimumElevation = { altitude: Infinity, color: 'rgb(0, 0, 0)' };
                                mapVisualizationRef.current.NextMaximumElevation = { altitude: Infinity, color: 'rgb(0, 0, 0)' };
                            }

                            const newVisualization = new MapVisualizationData(mapVisualizationRef.current);
                            newVisualization.MapTransitionData = imagesBase64;
                            if (newVisualization.TerrainMapBuffer[0].opacity === 0.01) {
                                newVisualization.TerrainMapBuffer[0].data = imagesBase64[imagesBase64.length - 1];
                            } else {
                                newVisualization.TerrainMapBuffer[1].data = imagesBase64[imagesBase64.length - 1];
                            }

                            setMapVisualization(newVisualization);
                        }).catch((_ex) => setMapVisualization(new MapVisualizationData()));
                    }).catch((_ex) => setMapVisualization(new MapVisualizationData()));
                }
            }).catch((_ex) => setMapVisualization(new MapVisualizationData()));
        }, 200);
    };

    const mapTransitionDone = () => {
        const rerenderVisualization = new MapVisualizationData(mapVisualizationRef.current);
        if (rerenderVisualization.TerrainMapBuffer[0].opacity === 0.01) {
            rerenderVisualization.TerrainMapBuffer[0].opacity = 1;
            rerenderVisualization.TerrainMapBuffer[1].opacity = 0.01;
        } else {
            rerenderVisualization.TerrainMapBuffer[0].opacity = 0.01;
            rerenderVisualization.TerrainMapBuffer[1].opacity = 1;
        }
        rerenderVisualization.MapTransitionData = [];
        rerenderVisualization.MinimumElevation = rerenderVisualization.NextMinimumElevation;
        rerenderVisualization.MaximumElevation = rerenderVisualization.NextMaximumElevation;
        rerenderVisualization.RerenderTimeout = RERENDER_TIMEOUT;
        setMapVisualization(rerenderVisualization);
    };

    useUpdate((deltaTime) => {
        if (terrOnNdActive && mapVisualizationRef.current?.RerenderTimeout !== undefined) {
            if (mapVisualizationRef.current.RerenderTimeout <= 0) {
                const newVisualizationData = new MapVisualizationData(mapVisualizationRef.current);
                newVisualizationData.RerenderTimeout = undefined;
                setMapVisualization(newVisualizationData);

                Terrain.renderNdMap(side).then((timestamp) => {
                    if (timestamp > 0) {
                        syncWithRenderer(timestamp);
                    } else {
                        // clear all data
                        setMapVisualization(new MapVisualizationData());
                    }
                }).catch((_ex) => setMapVisualization(new MapVisualizationData()));
            } else {
                const newVisualizationData = new MapVisualizationData(mapVisualizationRef.current);
                if (newVisualizationData.RerenderTimeout !== undefined) {
                    newVisualizationData.RerenderTimeout -= deltaTime;
                }
                setMapVisualization(newVisualizationData);
            }
        } else if (!terrOnNdActive) {
            setMapVisualization(new MapVisualizationData(mapVisualizationRef.current));
        }
    });

    useEffect(() => {
        if (!terrOnNdActive) {
            setMapVisualization(new MapVisualizationData());
        } else if (mapVisualizationRef.current?.RerenderTimeout === undefined) {
            const newVisualizationData = new MapVisualizationData(mapVisualizationRef.current);
            newVisualizationData.RerenderTimeout = RERENDER_TIMEOUT;
            setMapVisualization(newVisualizationData);
        }

        let meterPerPixel = Math.round(rangeSettings[rangeIndex] * METRES_TO_NAUTICAL_MILES / height);
        // scaling is required due to bigger area than visualized (clipped areas)
        if (modeIndex === EfisNdMode.ARC) {
            meterPerPixel *= 2;
        }
        meterPerPixel += (10 - (meterPerPixel % 10));

        const displayConfiguration = {
            active: modeIndex !== EfisNdMode.PLAN && terrOnNdActive !== 0,
            mapWidth: width,
            mapHeight: height,
            meterPerPixel,
            mapTransitionTime: MAP_TRANSITION_DURATION,
            mapTransitionFps: MAP_TRANSITION_FRAMERATE,
            arcMode: modeIndex === EfisNdMode.ARC,
            gearDown: SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') !== 1,
            destinationLatitude: destinationLatitude.valueOr(undefined),
            destinationLongitude: destinationLongitude.valueOr(undefined),
        };
        Terrain.setDisplaySettings(side, displayConfiguration).catch((_ex) => setMapVisualization(new MapVisualizationData()));
    }, [terrOnNdActive, rangeIndex, modeIndex, gearMode, destinationLatitude.value, destinationLongitude.value]);

    if (!terrOnNdActive || modeIndex === EfisNdMode.PLAN) {
        return <></>;
    }

    let lowerBorder = '';
    if (Number.isFinite(mapVisualizationRef.current.MinimumElevation.altitude) && mapVisualizationRef.current.MinimumElevation.altitude >= 0) {
        lowerBorder = String(Math.floor(mapVisualizationRef.current.MinimumElevation.altitude / 100)).padStart(3, '0');
    }
    let upperBorder = '';
    if (Number.isFinite(mapVisualizationRef.current.MaximumElevation.altitude)) {
        if (mapVisualizationRef.current.MaximumElevation.altitude !== 0) {
            upperBorder = String(Math.round(mapVisualizationRef.current.MaximumElevation.altitude / 100 + 0.5)).padStart(3, '0');
        } else {
            upperBorder = '000';
        }
    }

    return (
        <>
            <g id="map" clipPath={`url(#${clipName})`} opacity={potentiometer}>
                {mapVisualization.TerrainMapBuffer.map((frame) => (
                    frame.data !== ''
                        ? (
                            <image
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                opacity={frame.opacity}
                                xlinkHref={`data:image/png;base64,${frame.data}`}
                            />
                        ) : <></>
                ))}
                {mapVisualization.MapTransitionData.length !== 0 ? (
                    <TerrainMapTransition
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        mapdata={mapVisualization.MapTransitionData}
                        onFinished={mapTransitionDone}
                    />
                ) : <></>}
            </g>
            {upperBorder !== ''
                ? (
                    <>
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
                ) : <></>}
        </>
    );
};
