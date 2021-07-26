import React, { FC, useEffect, useState } from 'react';
import { useCurrentFlightPlan } from '@instruments/common/flightplan';
import { Geometry, Type1Transition } from '@fmgc/guidance/Geometry';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { MathUtils } from '@shared/MathUtils';
import { Layer } from '@instruments/common/utils';
import { useSimVar } from '@instruments/common/simVars';
import useInterval from '@instruments/common/useInterval';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { WayPoint } from '@fmgc/types/fstypes/FSTypes';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { MapParameters } from '../utils/MapParameters';

export type FlightPathProps = {
    x?: number,
    y?: number,
    flightPlanManager: FlightPlanManager,
    mapParams: MapParameters,
    clipPath: string,
    constraints: boolean,
    debug: boolean,
}

export const FlightPlan: FC<FlightPathProps> = ({ x = 0, y = 0, flightPlanManager, mapParams, clipPath, constraints, debug = false }) => {
    const [guidanceManager] = useState(() => new GuidanceManager(flightPlanManager));
    const flightPlan = useCurrentFlightPlan();

    const [geometry, setGeometry] = useState(() => guidanceManager.getMultipleLegGeometry());

    useInterval(() => {
        setGeometry(guidanceManager.getMultipleLegGeometry());
    }, 2_000);

    if (geometry) {
        return (
            <Layer x={x} y={y}>
                <g clipPath={clipPath}>
                    {flightPlan.visibleWaypoints.map((waypoint, index) => {
                        if (!waypoint.isVectors) {
                            return <Waypoint key={waypoint.ident} waypoint={waypoint} index={index} isActive={index === flightPlan.activeVisibleWaypointIndex} mapParams={mapParams} constraints={constraints} debug={debug} />;
                        }
                        return null;
                    })}
                </g>
                <path d={makePathFromGeometry(geometry, mapParams)} stroke="#00ff00" strokeWidth={2} fill="none" clipPath={clipPath} />
                {debug && (
                    <>
                        {
                            Array.from(geometry.legs.values()).map((leg) => (
                                <DebugLeg leg={leg} mapParams={mapParams} />
                            ))
                        }
                        {
                            Array.from(geometry.transitions.values()).map((transition) => (
                                <DebugTransition transition={transition} mapParams={mapParams} />
                            ))
                        }
                    </>

                )}
            </Layer>
        );
    }

    return null;
};

const Waypoint: FC<{ waypoint: WayPoint, index: number, isActive: boolean, mapParams: MapParameters, constraints: boolean, debug: boolean }> = ({ waypoint, index, isActive, mapParams, constraints = false, debug = false }) => {
    const [x, y] = mapParams.coordinatesToXYy(waypoint.infos.coordinates);

    // TODO FL
    //debugger;

    // TODO VNAV to provide met/missed prediction => magenta if met, amber if missed
    const constrainedAltitudeClass = waypoint.legAltitudeDescription > 0 ? "White" : null;
    let constraintY = -6;
    let constraintText: string[] = [];
    if (constraints) {
        // minus, plus, then speed
        switch (waypoint.legAltitudeDescription) {
        case 1:
            constraintText.push("" + Math.round(waypoint.legAltitude1));
            break;
        case 2:
            constraintText.push("+" + Math.round(waypoint.legAltitude1));
            break;
        case 3:
            constraintText.push("-" + Math.round(waypoint.legAltitude1));
            break;
        case 4:
            constraintText.push("-" + Math.round(waypoint.legAltitude1));
            constraintText.push("+" + Math.round(waypoint.legAltitude2));
            break;
        }

        if (waypoint.speedConstraint > 0) {
            constraintText.push("" + Math.round(waypoint.speedConstraint) + "KT");
        }
    }

    return (
        <Layer x={x} y={y}>
            <rect x={-4} y={-4} width={8} height={8} className={isActive ? "White" : "Green"} strokeWidth={2} transform="rotate(45 0 0)" />

            <text x={15} y={-6} fontSize={20} className={isActive ? "White" : "Green"}>
                {waypoint.ident}
                {debug && `(${index})`}
            </text>
            { constraints && (
                constraintText.map(t => (
                    <text x={15} y={constraintY += 20} className="Magenta" fontSize={20}>{t}</text>
                ))
            )}
            { constrainedAltitudeClass && (
                <circle r={12} className={constrainedAltitudeClass} strokeWidth={2} />
            )}
        </Layer>
    );
};

export type DebugLegProps<TLeg extends Leg> = {
    leg: TLeg,
    mapParams: MapParameters,
}

const DebugLeg: FC<DebugLegProps<Leg>> = ({ leg, mapParams }) => {
    if (leg instanceof TFLeg) {
        return <DebugTFLeg leg={leg} mapParams={mapParams} />;
    } if (leg instanceof VMLeg) {
        return <DebugVMLeg leg={leg} mapParams={mapParams} />;
    }

    return null;
};

const DebugTFLeg: FC<DebugLegProps<TFLeg>> = ({ leg, mapParams }) => {
    const legType = 'TF';

    const [lat] = useSimVar('PLANE LATITUDE', 'degrees', 250);
    const [long] = useSimVar('PLANE LONGITUDE', 'degrees', 250);

    const [fromX, fromY] = mapParams.coordinatesToXYy(leg.from.infos.coordinates);
    const [toX, toY] = mapParams.coordinatesToXYy(leg.to.infos.coordinates);

    const [infoX, infoY] = [
        Math.round(Math.min(fromX, toX) + (Math.abs(toX - fromX) / 2) + 5),
        Math.round(Math.min(fromY, toY) + (Math.abs(toY - fromY) / 2)),
    ];

    return (
        <>
            <text fill="#ff4444" x={infoX} y={infoY} fontSize={16}>
                {leg.from.ident}
                {' '}
                -&gt;
                {' '}
                {leg.to.ident}
            </text>
            <text fill="#ff4444" x={infoX} y={infoY + 20} fontSize={16}>{legType}</text>
            <text fill="#ff4444" x={infoX} y={infoY + 40} fontSize={16}>
                Tl:
                {' '}
                {MathUtils.fastToFixed(leg.bearing, 1)}
            </text>
            <text fill="#ff4444" x={infoX + 100} y={infoY + 40} fontSize={16}>
                tA:
                {' '}
                {MathUtils.fastToFixed(leg.getAircraftToLegBearing({ lat, long }), 1)}
            </text>
            <text fill="#ff4444" x={infoX} y={infoY + 60} fontSize={16}>
                DTG:
                {' '}
                {MathUtils.fastToFixed(leg.getDistanceToGo({ lat, long }), 3)}
            </text>
        </>
    );
};

const DebugVMLeg: FC<DebugLegProps<VMLeg>> = ({ leg, mapParams }) => {
    const legType = 'VM';

    const [lat] = useSimVar('PLANE LATITUDE', 'degrees', 250);
    const [long] = useSimVar('PLANE LONGITUDE', 'degrees', 250);

    const [fromX, fromY] = mapParams.coordinatesToXYy({ lat, long });

    const [infoX, infoY] = [fromX, fromY - 150];

    return (
        <>
            <text fill="#ff4444" x={infoX} y={infoY} fontSize={16}>
                {leg.heading}
                &deg;
            </text>
            <text fill="#ff4444" x={infoX} y={infoY + 20} fontSize={16}>{legType}</text>
        </>
    );
};

export type DebugTransitionProps = {
    transition: Transition,
    mapParams: MapParameters,
}

const DebugTransition: FC<DebugTransitionProps> = ({ transition, mapParams }) => {
    if (!(transition instanceof Type1Transition)) {
        return null;
    }

    const inbound = transition.getTurningPoints()[0];
    const outbound = transition.getTurningPoints()[1];

    const [fromX, fromY] = mapParams.coordinatesToXYy(inbound);
    const [toX, toY] = mapParams.coordinatesToXYy(outbound);

    const [infoX, infoY] = [
        Math.round(Math.min(fromX, toX) + (Math.abs(toX - fromX) / 2) + 5),
        Math.round(Math.min(fromY, toY) + (Math.abs(toY - fromY) / 2)),
    ];

    let transitionType;
    if (transition instanceof Type1Transition) {
        transitionType = 'Type 1';
    }

    return (
        <>
            <text fill="yellow" x={infoX} y={infoY} fontSize={16}>
                {transitionType}
            </text>
        </>
    );
};

/**
 *
 * @param geometry {Geometry}
 * @param mapParams {MapParameters}
 */
function makePathFromGeometry(geometry: Geometry, mapParams: MapParameters): string {
    const path: string[] = [];

    for (const [i, leg] of geometry.legs.entries()) {
        const transitionBefore = geometry.transitions.get(i - 1);
        const transition = geometry.transitions.get(i);

        let x;
        let y;

        if (leg instanceof TFLeg) {
            if (transition) {
                // This is the transition after this leg - so since we are going in reverse order, draw it first
                if (transition instanceof Type1Transition) {
                    const [inLla, outLla] = transition.getTurningPoints();

                    // Move to inbound point
                    const [inX, inY] = mapParams.coordinatesToXYy(inLla);
                    x = MathUtils.fastToFixed(inX, 1);
                    y = MathUtils.fastToFixed(inY, 1);

                    path.push(`M ${x} ${y}`);

                    const r = MathUtils.fastToFixed(transition.radius * mapParams.nmToPx, 0);

                    // Draw arc to outbound point
                    const [outX, outY] = mapParams.coordinatesToXYy(outLla);
                    x = MathUtils.fastToFixed(outX, 1);
                    y = MathUtils.fastToFixed(outY, 1);
                    const cw = transition.clockwise;

                    path.push(`A ${r} ${r} 0 ${transition.angle >= 180 ? 1 : 0} ${cw ? 1 : 0} ${x} ${y}`);
                }
            }

            // Draw the orthodromic path of the TF leg

            // If we have a transition *before*, we need to go to the inbound turning point of it, not to the TO fix
            let fromLla;
            if (transitionBefore) {
                if (transitionBefore instanceof Type1Transition) {
                    fromLla = transitionBefore.getTurningPoints()[1];
                }
            } else {
                fromLla = leg.from.infos.coordinates;
            }

            const [fromX, fromY] = mapParams.coordinatesToXYy(fromLla);

            x = MathUtils.fastToFixed(fromX, 1);
            y = MathUtils.fastToFixed(fromY, 1);

            path.push(`M ${x} ${y}`);

            // If we have a transition *after*, we need to go to the inbound turning point of it, not to the TO fix
            let toLla;
            if (transition) {
                if (transition instanceof Type1Transition) {
                    toLla = transition.getTurningPoints()[0];
                }
            } else {
                toLla = leg.to.infos.coordinates;
            }

            const [toX, toY] = mapParams.coordinatesToXYy(toLla);
            x = MathUtils.fastToFixed(toX, 1);
            y = MathUtils.fastToFixed(toY, 1);

            path.push(`L ${x} ${y}`);
        } else if (leg instanceof VMLeg) {
            if (transitionBefore && transitionBefore instanceof Type1Transition) {
                const fromLla = transitionBefore.getTurningPoints()[1];

                const [fromX, fromY] = mapParams.coordinatesToXYy(fromLla);

                x = MathUtils.fastToFixed(fromX, 1);
                y = MathUtils.fastToFixed(fromY, 1);

                path.push(`M ${x} ${y}`);

                const farAway = mapParams.nmRadius + 2;
                const farAwayPoint = Avionics.Utils.bearingDistanceToCoordinates(
                    leg.bearing,
                    farAway,
                    fromLla.lat,
                    fromLla.long,
                );

                const [toX, toY] = mapParams.coordinatesToXYy(farAwayPoint);

                x = MathUtils.fastToFixed(toX, 1);
                y = MathUtils.fastToFixed(toY, 1);

                path.push(`L ${x} ${y}`);
            }
        } else if (leg instanceof RFLeg) {
            // Move to inbound point
            const [inX, inY] = mapParams.coordinatesToXYy(leg.from.infos.coordinates);
            x = MathUtils.fastToFixed(inX, 1);
            y = MathUtils.fastToFixed(inY, 1);

            path.push(`M ${x} ${y}`);

            const r = MathUtils.fastToFixed(leg.radius * mapParams.nmToPx, 0);

            // Draw arc to outbound point
            const [outX, outY] = mapParams.coordinatesToXYy(leg.to.infos.coordinates);
            x = MathUtils.fastToFixed(outX, 1);
            y = MathUtils.fastToFixed(outY, 1);
            const cw = leg.clockwise;

            path.push(`A ${r} ${r} 0 ${leg.angle >= 180 ? 1 : 0} ${cw ? 1 : 0} ${x} ${y}`);
        }
    }

    return path.join(' ');
}
