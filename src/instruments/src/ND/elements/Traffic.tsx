/* eslint-disable camelcase */
import { useCoherentEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import React, { useEffect, FC, useState, memo } from 'react';
import { Layer } from '@instruments/common/utils';
import { TaRaIntrusion } from '@tcas/lib/TcasConstants';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { MathUtils } from '@shared/MathUtils';
import { Mode } from '@shared/NavigationDisplay';
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
    mapParams: MapParameters,
    mode: Mode.ARC | Mode.ROSE_NAV | Mode.ROSE_ILS | Mode.ROSE_VOR,
}

export const Traffic: FC<TcasProps> = ({ mode, mapParams }) => {
    const [airTraffic, setAirTraffic] = useState<NDTraffic[]>([]);
    const [tcasMode] = useSimVar('L:A32NX_SWITCH_TCAS_Position', 'number', 200);
    const [latLong] = useState<Coordinates>({ lat: NaN, long: NaN });

    const mask: [number, number][] = (mode === Mode.ARC) ? [
        // ARC
        [-384, -310], [-384, 0], [-264, 0], [-210, 59], [-210, 185],
        [210, 185], [210, 0], [267, -61], [384, -61],
        [384, -310], [340, -355], [300, -390], [240, -431.5],
        [180, -460], [100, -482], [0, -492], [-100, -482],
        [-180, -460], [-240, -431.5], [-300, -390], [-340, -355],
        [-384, -310],
    ] : [
        // ROSE NAV
        [-340, -227], [-103, -227], [-50, -244],
        [0, -250], [50, -244], [103, -227], [340, -227],
        [340, 180], [267, 180], [210, 241], [210, 383],
        [-210, 383], [-210, 300], [-264, 241], [-340, 241], [-340, 227],
    ];
    const x: number = 361.5;
    const y: number = (mode === Mode.ARC) ? 606.5 : 368;

    useCoherentEvent('A32NX_TCAS_TRAFFIC', (aT: NDTraffic[]) => {
        airTraffic.forEach((traffic) => traffic.alive = false);
        aT.forEach((tf: NDTraffic) => {
            latLong.lat = tf.lat;
            latLong.long = tf.lon;
            let [x, y] = mapParams.coordinatesToXYy(latLong);

            // TODO FIXME: Full time option installed: For all ranges except in ZOOM ranges, NDRange > 9NM
            // TODO FIXME: Always show relative alt even in off-scale/half display
            if (!MathUtils.pointInPolygon(x, y, mask)) {
                const ret: [number, number] | null = MathUtils.intersectWithPolygon(x, y, 0, 0, mask);
                if (ret) [x, y] = ret;
            }
            tf.posX = x;
            tf.posY = y;

            const traffic: NDTraffic | undefined = airTraffic.find((p) => p && p.ID === tf.ID);
            if (traffic) {
                traffic.alive = true;
                traffic.alt = tf.alt;
                traffic.heading = tf.heading;
                traffic.intrusionLevel = tf.intrusionLevel;
                traffic.lat = tf.lat;
                traffic.lon = tf.lon;
                traffic.relativeAlt = tf.relativeAlt;
                traffic.vertSpeed = tf.vertSpeed;
                traffic.posX = tf.posX;
                traffic.posY = tf.posY;
            } else {
                tf.alive = true;
                airTraffic.push(tf);
            }
        });
        setAirTraffic(airTraffic.filter((tf) => tf.alive));
    });

    useEffect(() => {
        setAirTraffic([]);
    }, [tcasMode]);

    return (
        <Layer x={x} y={y}>
            {airTraffic.map((tf) => (
                <TrafficIndicator
                    key={tf.ID}
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

const TrafficIndicator: FC<TrafficProp> = memo(({ x, y, relativeAlt, vertSpeed, intrusionLevel }) => {
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

    // Place relative altitude above/below
    const relAltY: number = (relativeAlt > 0) ? 3.708355 : 43.708355;

    return (
        <>
            <Layer x={x} y={y}>
                {intrusionLevel === TaRaIntrusion.TRAFFIC && <image x={0} y={0} width={45} height={32} xlinkHref="/Images/ND/TRAFFIC_NORMAL.svg" />}
                {intrusionLevel === TaRaIntrusion.PROXIMITY && <image x={0} y={0} width={45} height={32} xlinkHref="/Images/ND/TRAFFIC_PROXIMITY.svg" />}
                {intrusionLevel === TaRaIntrusion.TA && <image x={0} y={0} width={45} height={32} xlinkHref="/Images/ND/TRAFFIC_TA.svg" />}
                {intrusionLevel === TaRaIntrusion.RA && <image x={0} y={0} width={45} height={32} xlinkHref="/Images/ND/TRAFFIC_RA.svg" />}
                <g>
                    <text x="36.165964" y={relAltY} fill={color} height={1.25} strokeWidth={0.3} textAnchor="end" xmlSpace="preserve">
                        <tspan x="19.165966" y={relAltY} fill={color} fontSize="20px" strokeWidth={0.3} textAnchor="middle">
                            {`${relativeAlt > 0 ? '+' : '-'}${Math.abs(relativeAlt) < 10 ? '0' : ''}${Math.abs(relativeAlt)}`}
                        </tspan>
                    </text>
                    {(vertSpeed >= 500 || vertSpeed <= -500) && (
                        <path d="m38.3 23.2v-13.5" fill="none" stroke={color} strokeWidth={2} />
                    )}
                    {(vertSpeed <= -500) && (
                        <path
                            d="m38.3 23.2-2.05-1.42 2.05 5.66 2.05-5.66z"
                            fill={color}
                            stroke={color}
                            fillRule="evenodd"
                            strokeWidth=".2pt"
                        />
                    )}
                    {(vertSpeed >= 500) && (
                        <path
                            d="m38.3 9.7 2.05 1.42-2.05-5.66-2.05 5.66z"
                            fill={color}
                            stroke={color}
                            fillRule="evenodd"
                            strokeWidth=".2pt"
                        />
                    )}
                </g>
            </Layer>
        </>
    );
});
