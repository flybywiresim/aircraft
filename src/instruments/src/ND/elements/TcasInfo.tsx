/* eslint-disable camelcase */
import { Arinc429Word, useArinc429Var } from '@instruments/common/arinc429';
import { useCoherentEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, FC, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { TaRaIntrusion } from '@tcas/components/TCasConstants';
import { MapParameters } from '../utils/MapParameters';
// import { Layer } from '@instruments/common/utils';
export interface TcasTraffic {
    alive: boolean,
    created: boolean,
    lastSeen: number,
    ID: string,
    name: string,
    lat: number,
    lon: number,
    alt: number,
    vertSpeed: number,
    onGround: boolean,
    heading: number,
    relativeAlt: number,
    slantDistance: number, // Distance to traffic aircraft in 3D space, in nautical miles
    closureRate: number,
    intrusionLevel: number,
    isDisplayed: boolean,
    taTau: number,
    raTau: number,
    vTau: number,
    taExpiring: boolean,
    secondsSinceLastTa: number,
}

export interface JS_NPCPlane {
    name: string,
    uId: number,
    lat: number,
    lon: number,
    alt: number,
    heading: number
}

export type TcasProps = {
    mapParams: MapParameters
}

interface NDTraffic {
    ID: string;

    name: string;

    lat: number;

    lon: number;

    alt: number;

    relativeAlt: number;

    vertSpeed: number;

    heading: number;

    intrusionLevel: number;

    posX: number;

    posY: number;
}

export const TcasInfo: FC<TcasProps> = ({ mapParams }) => {
    // TODO: REDUCE RANGE and CHANGE MODE warnings - AMM 34-43-00:A21
    // TODO: red TCAS warning on fault (and on PFD) - AMM 34-43-00:A24
    // TODO: Limit number of contacts displayed to 40 - AMM 34-43-00:6a

    const [airTraffic, setAirTraffic] = useState<NDTraffic[]>([]);
    const [tcasMode] = useSimVar('L:A32NX_SWITCH_TCAS_Position', 'number', 200);

    useCoherentEvent('A32NX_TCAS_TRAFFIC', (aT: NDTraffic[]) => {
        aT.forEach((tf: NDTraffic) => {
            const [x, y] = mapParams.coordinatesToXYy({ lat: tf.lat, long: tf.lon });
            tf.posX = x;
            tf.posY = y;
        });
        setAirTraffic(aT);
    });

    useEffect(() => {
        setAirTraffic([]);
    }, [tcasMode]);

    //
    return (
        <>
            {/* <TrafficIndicator x={0} y={0} id="A32NX" relativeAlt={0} vertSpeed={0} intrusionLevel={2} /> */}
            {airTraffic.map((tf) => (
                <TrafficIndicator
                    x={tf.posX}
                    y={tf.posY}
                    id={tf.ID}
                    altitude={tf.alt}
                    relativeAlt={tf.relativeAlt}
                    vertSpeed={tf.vertSpeed}
                    intrusionLevel={tf.intrusionLevel}
                />
            ))}
        </>
    );
};

type TrafficProp = {
    x: number,
    y: number,
    id: string,
    altitude: number,
    relativeAlt: number,
    vertSpeed: number,
    intrusionLevel: TaRaIntrusion,
}

const trafficStyles = {
    fill: 'none',
    paintOrder: 'markers stroke fill',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    stroke: '#ffffff',
    strokeWidth: 2.01,
} as React.CSSProperties;

const proxStyles = {
    fill: '#f6ffff',
    paintOrder: 'markers stroke fill',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    stroke: '#ffffff',
    strokeWidth: 2.01,
} as React.CSSProperties;

const taStyles = {
    fill: '#e38c56',
    paintOrder: 'markers stroke fill',
} as React.CSSProperties;

const raStyles = {
    fill: '#ff0000',
    paintOrder: 'markers stroke fill',
} as React.CSSProperties;

const TrafficIndicator: FC<TrafficProp> = ({ x, y, id, altitude, relativeAlt, vertSpeed, intrusionLevel }) => {
    let color = '#ffffff';
    switch (intrusionLevel) {
    case TaRaIntrusion.TA:
        color = '#e38c56';
        break;
    case TaRaIntrusion.RA:
        color = '#ff0000';
        break;
    default:
        break;
    }

    const tSpanStyles = {
        fill: color,
        fontSize: '20px',
        strokeWidth: 0.3,
        textAlign: 'center',
        textAnchor: 'middle',
    } as React.CSSProperties;

    const arrowStyles = {
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
    } as React.CSSProperties;

    const arrowHeadStyles = {
        fill: color,
        stroke: color,
        fillRule: 'evenodd',
        strokeWidth: '.2pt',
    } as React.CSSProperties;

    const altTextStyles = {
        fill: color,
        lineHeight: 1.25,
        strokeWidth: 0.3,
        textAlign: 'center',
        textAnchor: 'end',
    } as React.CSSProperties;

    const relAltText: string = `${relativeAlt > 0 ? '+' : '-'}${Math.abs(relativeAlt) < 10 ? '0' : ''}${Math.abs(relativeAlt)}`;
    const relAltY: number = (relativeAlt > 0) ? 3.708355 : 43.708355;

    return (
        <>
            {/* <Layer x={361.5} y={606.5}> */}
            <Layer x={361.5} y={368}>
                <Layer x={x} y={y}>
                    {(intrusionLevel === TaRaIntrusion.TRAFFIC)
                        && (
                            <>
                                <path d="m22.4 5.71 7.9 10.6-7.9 10.6-7.9-10.6z" style={trafficStyles} />
                            </>
                        )}
                    {(intrusionLevel === TaRaIntrusion.PROXIMITY
                            && <path d="m22.4 5.71 7.9 10.6-7.9 10.6-7.9-10.6z" style={proxStyles} />
                    )}
                    {(intrusionLevel === TaRaIntrusion.TA
                        && <circle cx="22.4" cy="16.1" r="9.39" style={taStyles} />
                    )}
                    {(intrusionLevel === TaRaIntrusion.RA
                        && <rect x="13.3" y="6.88" width="18.3" height="18.3" style={raStyles} />
                    )}
                    <text x="36.165964" y={relAltY} style={altTextStyles} xmlSpace="preserve">
                        <tspan x="19.165966" y={relAltY} style={tSpanStyles}>{relAltText}</tspan>
                    </text>
                    {(vertSpeed >= 500 || vertSpeed <= -500) && (
                        <path d="m38.3 23.2v-13.5" style={arrowStyles} />
                    )}
                    {(vertSpeed <= -500) && (
                        <path d="m38.3 23.2-2.05-1.42 2.05 5.66 2.05-5.66z" style={arrowHeadStyles} />
                    )}
                    {(vertSpeed >= 500) && (
                        <path d="m38.3 9.7 2.05 1.42-2.05-5.66-2.05 5.66z" style={arrowHeadStyles} />
                    )}
                </Layer>
            </Layer>
        </>
    );
};

/*
    <text x={Xy[0]} y={Xy[1]} className="Magenta" fontSize="35">
        BRUH
    </text>
    */
