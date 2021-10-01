/* eslint-disable camelcase */
import { useCoherentEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, FC, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { TaRaIntrusion } from '@tcas/lib/TCasConstants';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { MapParameters } from '../utils/MapParameters';

interface NDTraffic {
    alive?: boolean;
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

export type TcasProps = {
    x: number,
    y: number,
    mapParams: MapParameters
}

export const Traffic: FC<TcasProps> = ({ x, y, mapParams }) => {
    const [airTraffic, setAirTraffic] = useState<NDTraffic[]>([]);
    const [tcasMode] = useSimVar('L:A32NX_SWITCH_TCAS_Position', 'number', 200);
    const [latLong] = useState<Coordinates>({ lat: NaN, long: NaN });

    useCoherentEvent('A32NX_TCAS_TRAFFIC', (aT: NDTraffic[]) => {
        airTraffic.forEach((traffic) => traffic.alive = false);
        aT.forEach((tf: NDTraffic) => {
            latLong.lat = tf.lat;
            latLong.long = tf.lon;
            [tf.posX, tf.posY] = mapParams.coordinatesToXYy(latLong);
            let traffic: NDTraffic | undefined = airTraffic.find((p) => p && p.ID === tf.ID);
            if (traffic) {
                traffic.alive = true;
                traffic = tf;
            } else {
                tf.alive = true;
                airTraffic.push(tf);
            }
        });
        setAirTraffic([...airTraffic.filter((tf) => tf.alive)]);
    });

    useEffect(() => {
        setAirTraffic([]);
    }, [tcasMode]);

    return (
        <Layer x={x} y={y}>
            {airTraffic.map((tf) => (
                <TrafficIndicator
                    x={tf.posX}
                    y={tf.posY}
                    relativeAlt={tf.relativeAlt}
                    vertSpeed={tf.vertSpeed}
                    intrusionLevel={tf.intrusionLevel}
                />
            ))}
        </Layer>
    );
};

type TrafficProp = {
    x: number,
    y: number,
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

const TrafficIndicator: FC<TrafficProp> = ({ x, y, relativeAlt, vertSpeed, intrusionLevel }) => {
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
        </>
    );
};
