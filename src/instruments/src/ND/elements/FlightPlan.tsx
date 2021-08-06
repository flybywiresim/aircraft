import React, { FC, useState } from 'react';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Type1Transition } from '@fmgc/guidance/lnav/transitions/Type1';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { MathUtils } from '@shared/MathUtils';
import { Layer } from '@instruments/common/utils';
import { useSimVar } from '@instruments/common/simVars';
import useInterval from '@instruments/common/useInterval';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { AltitudeConstraint, Leg, SpeedConstraint } from '@fmgc/guidance/lnav/legs';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { Xy } from '@fmgc/flightplanning/data/geo';
import { useCurrentFlightPlan, useTemporaryFlightPlan } from '@instruments/common/flightplan';
import { MapParameters } from '../utils/MapParameters';

export type FlightPathProps = {
    x?: number,
    y?: number,
    flightPlanManager: FlightPlanManager,
    mapParams: MapParameters,
    constraints: boolean,
    debug: boolean,
    temp: boolean,
}

export const FlightPlan: FC<FlightPathProps> = ({ x = 0, y = 0, flightPlanManager, mapParams, constraints, debug = false, temp = false }) => {
    const [guidanceManager] = useState(() => new GuidanceManager(flightPlanManager));
    const [tempGeometry, setTempGeometry] = useState(() => guidanceManager.getMultipleLegGeometry(true));
    const [activeGeometry, setActiveGeometry] = useState(() => guidanceManager.getMultipleLegGeometry());
    const temporaryFlightPlan = useTemporaryFlightPlan();
    const currentFlightPlan = useCurrentFlightPlan();

    const [geometry, setGeometry] = temp
        ? [tempGeometry, setTempGeometry]
        : [activeGeometry, setActiveGeometry];
    const flightPlan = temp ? temporaryFlightPlan : currentFlightPlan;

    useInterval(() => {
        if (temp) {
            setGeometry(guidanceManager.getMultipleLegGeometry(true));
        } else {
            setGeometry(guidanceManager.getMultipleLegGeometry());
        }
    }, 2_000);

    if (geometry) {
        let legs = Array.from(geometry.legs.values());
        const unslicedLegs = legs;

        const origin = flightPlan.originAirfield;
        const destination = flightPlan.destinationAirfield;

        let destinationActive = false;
        let destinationIdent = '';
        if (destination) {
            destinationIdent = destination.ident;
            destinationActive = legs.length < 2;
            const approachRunway = temp
                ? flightPlanManager.getApproachRunway(1)
                : flightPlanManager.getApproachRunway();
            if (approachRunway) {
                destinationIdent += Avionics.Utils.formatRunway(approachRunway.designation);
            }

            if (legs[0] instanceof TFLeg && legs[0].to.type === 'A') {
                legs = legs.slice(1);
            }
        }

        let flightPath;

        if (temp) {
            flightPath = <path d={makePathFromGeometry(geometry, mapParams)} className="Yellow" strokeWidth={3} fill="none" strokeDasharray="15 10" />;
        } else {
            flightPath = <path d={makePathFromGeometry(geometry, mapParams)} stroke="#00ff00" strokeWidth={2} fill="none" />;
        }

        return (
            <Layer x={x} y={y}>
                {flightPath}
                {origin && (
                    <DepartureAirportMarkers
                        flightPlanManager={flightPlanManager}
                        mapParams={mapParams}
                    />
                )}
                {destination && (
                    <ArrivalAirportMarkers
                        flightPlanManager={flightPlanManager}
                        mapParams={mapParams}
                    />
                )}
                {legs.map((leg, index) => (
                    <LegWaypointMarkers
                        leg={leg}
                        nextLeg={legs[index - 1]}
                        // nextLeg={unslicedLegs[index - 1]}
                        index={index}
                        isActive={index === legs.length - 1}
                        constraints={constraints}
                        mapParams={mapParams}
                        debug={debug}
                    />
                ))}
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

interface DepartureAirportMarkersProps {
    mapParams: MapParameters,
    flightPlanManager: FlightPlanManager,
}

const DepartureAirportMarkers: FC<DepartureAirportMarkersProps> = ({ flightPlanManager, mapParams }) => {
    const depRunway = flightPlanManager.getDepartureRunway();
    const depAirfield = flightPlanManager.getOrigin();

    let adx;
    let ady;

    [adx, ady] = mapParams.coordinatesToXYy(depAirfield.infos.coordinates);

    // Draw Runway, Star Symbol, or Block of Origin Airport
    if (depRunway) {
        let rdx;
        let rdy;

        [rdx, rdy] = mapParams.coordinatesToXYy(depRunway.beginningCoordinates);

        return (
            <RunwayMarker
                position={[rdx, rdy]}
                direction={depRunway.direction}
                length={depRunway.length}
                mapParams={mapParams}
            />
        );
    }

    return (
        <AirportMarker
            position={[adx, ady]}
        />
    );
}

interface ArrivalAirportMarkersProps {
    mapParams: MapParameters,
    flightPlanManager: FlightPlanManager,
}

const ArrivalAirportMarkers: FC<ArrivalAirportMarkersProps> = ({ flightPlanManager, mapParams }) => {
    const arrRunway = flightPlanManager.getApproachRunway();
    const arrAirfield = flightPlanManager.getDestination();

    let aax;
    let aay;

    [aax, aay] = mapParams.coordinatesToXYy(arrAirfield.infos.coordinates);

    // Draw Runway, Star Symbol, or Block of Origin Airport
    if (arrRunway) {
        let rax;
        let ray;

        [rax, ray] = mapParams.coordinatesToXYy(arrRunway.beginningCoordinates);

        return (
            <RunwayMarker
                position={[rax, ray]}
                direction={arrRunway.direction}
                length={arrRunway.length}
                mapParams={mapParams}
            />
        );
    }

    return (
        <AirportMarker
            position={[aax, aay]}
        />
    );
}

interface LegWaypointMarkersProps {
    leg: Leg,
    nextLeg: Leg,
    index: number,
    mapParams: MapParameters,
    constraints: boolean,
    isActive: boolean,
    debug: boolean,
}

const LegWaypointMarkers: FC<LegWaypointMarkersProps> = ({ leg, nextLeg, index, mapParams, constraints, isActive, debug }) => {
    let x;
    let y;
    let fx;
    let fy;
    if (leg instanceof TFLeg || leg instanceof RFLeg) {
        [x, y] = mapParams.coordinatesToXYy(leg.to.infos.coordinates);
        // TODO: Find a more elegant fix for drawing waypoint (of next leg) after discontinuity
        if (nextLeg instanceof TFLeg && leg.to.endsInDiscontinuity && leg.to.ident !== nextLeg.from.ident) {
            console.log('drawing waypoint after discontinuity. First leg: ', leg, ' Second leg: ', nextLeg);
            [fx, fy] = mapParams.coordinatesToXYy(nextLeg.from.infos.coordinates);
            return (
                <>
                    <WaypointMarker
                        ident={leg.to.ident}
                        position={[x, y]}
                        altitudeConstraint={leg.altitudeConstraint}
                        speedConstraint={leg.speedConstraint}
                        index={index}
                        isActive={isActive}
                        constraints={constraints}
                        debug={debug}
                    />
                    <WaypointMarker
                        ident={nextLeg.from.ident}
                        position={[fx, fy]}
                        altitudeConstraint={nextLeg.initialAltitudeConstraint}
                        speedConstraint={nextLeg.initialSpeedConstraint}
                        index={index}
                        isActive={false}
                        constraints={constraints}
                        debug={debug}
                    />
                </>
            );
        }
    } else if (leg instanceof VMLeg) {
        // TODO: Find a more elegant fix for drawing waypoint (of next leg) after manual
        if (nextLeg instanceof TFLeg) {
            [x, y] = mapParams.coordinatesToXYy(nextLeg.from.infos.coordinates);
            return (
                <WaypointMarker
                    ident={nextLeg.from.ident}
                    position={[x, y]}
                    altitudeConstraint={nextLeg.initialAltitudeConstraint}
                    speedConstraint={nextLeg.initialSpeedConstraint}
                    index={index}
                    isActive={isActive}
                    constraints={constraints}
                    debug={debug}
                />
            );
        }
        return null;
    } else {
        throw new Error(`Invalid leg type for leg '${leg}'.`);
    }

    return (
        <WaypointMarker
            ident={leg.to.ident}
            position={[x, y]}
            altitudeConstraint={leg.altitudeConstraint}
            speedConstraint={leg.speedConstraint}
            index={index}
            isActive={isActive}
            constraints={constraints}
            debug={debug}
        />
    );
};

interface RunwayMarkerProps {
    position: Xy,
    direction: number,
    length: number,
    mapParams: MapParameters,
}

const RunwayMarker: FC<RunwayMarkerProps> = ({ position, direction, length, mapParams }) => {
    return(
        <Layer x={position[0]} y={position[1]}>
            <g transform={`rotate(${mapParams.rotation(direction)})`}>
                <line x1={-4.25} x2={-4.25} y1={length / 2 * mapParams.mToPx} y2={-length / 2 * mapParams.mToPx} className="White" strokeWidth={2} />
                <line x1={4.25} x2={4.25} y1={length / 2 * mapParams.mToPx} y2={-length / 2 * mapParams.mToPx} className="White" strokeWidth={2} />
            </g>
        </Layer>
    )
}

interface RunwayMarkerBlockProps {
    position: Xy,
    direction: number,
    mapParams: MapParameters,
}

const RunwayMarkerBlock: FC<RunwayMarkerBlockProps> = ({ position, direction, mapParams }) => {
    return(
        <Layer x={position[0]} y={position[1]}>
            <rect width="250" height="55" className="White Fill" />
        </Layer>
    )
}

interface AirportMarkerProps {
    position: Xy,
}

const AirportMarker: FC<AirportMarkerProps> = ({ position }) => {
    return(
        <Layer x={position[0]} y={position[1]}>
            <path
                d="M60.326 5.096V55.13L24.947 19.752l-5.195 5.195 35.379 35.38H5.098v7.347H55.13l-35.379 35.379 5.195 5.195 35.38-35.379v50.035h7.347V72.87l35.379 35.379 5.195-5.195-35.379-35.38h50.033v-7.347H72.87l35.38-35.379-5.196-5.195-35.38 35.379V5.096zm0-1.832a1.833 1.833 0 00-1.832 1.832v45.61l-32.25-32.25a1.833 1.833 0 00-2.594 0l-5.195 5.194a1.833 1.833 0 000 2.594l32.25 32.25H5.098a1.833 1.833 0 00-1.832 1.832v7.348a1.833 1.833 0 001.832 1.832h45.607l-32.25 32.25a1.833 1.833 0 000 2.594l5.195 5.195a1.833 1.833 0 002.594 0l32.25-32.25v45.61a1.833 1.833 0 001.832 1.831h7.348a1.833 1.833 0 001.832-1.832v-45.61l32.25 32.25a1.833 1.833 0 002.594 0l5.195-5.194a1.833 1.833 0 000-2.594l-32.25-32.25h45.607a1.833 1.833 0 001.832-1.832v-7.348a1.833 1.833 0 00-1.832-1.832H77.295l32.25-32.25a1.833 1.833 0 000-2.594l-5.195-5.195a1.833 1.833 0 00-2.594 0l-32.25 32.25V5.095a1.833 1.833 0 00-1.832-1.831zm1.832 3.664h3.684V55.13a1.833 1.833 0 003.129 1.297l34.082-34.084 2.601 2.603L71.572 59.03a1.833 1.833 0 001.297 3.13h48.201v3.683h-48.2a1.833 1.833 0 00-1.298 3.129l34.082 34.082-2.601 2.601L68.97 71.572a1.833 1.833 0 00-3.13 1.297v48.203h-3.683V72.87a1.833 1.833 0 00-3.129-1.297l-34.082 34.082-2.603-2.601L56.428 68.97a1.833 1.833 0 00-1.297-3.13H6.93v-3.683h48.2a1.833 1.833 0 001.298-3.129L22.346 24.947l2.601-2.601L59.03 56.428a1.833 1.833 0 003.13-1.297z"
                style={{
                    lineHeight: "normal",
                    fontVariantLigatures: "normal",
                    fontVariantPosition: "normal",
                    fontVariantCaps: "normal",
                    fontVariantNumeric: "normal",
                    fontVariantAlternates: "normal",
                    fontVariantEastAsian: "normal",
                    fontFeatureSettings: "normal",
                    fontVariationSettings: "normal",
                    textIndent: 0,
                    textAlign: "start",
                    textDecorationLine: "none",
                    textDecorationStyle: "solid",
                    textDecorationColor: "#fff",
                    textTransform: "none",
                    textOrientation: "mixed",
                    whiteSpace: "normal",
                    shapePadding: 0,
                    shapeMargin: 0,
                    inlineSize: 0,
                    isolation: "auto",
                    mixBlendMode: "normal",
                    solidColor: "#000",
                    solidOpacity: 1,
                }}
                className="White Fill"
                fontWeight={400}
                fontFamily="sans-serif"
                overflow="visible"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                paintOrder="markers stroke fill"
                transform="scale(.26459)"
            />
        </Layer>
    )
}

interface WaypointMarkerProps {
    ident: string,
    position: Xy,
    altitudeConstraint?: AltitudeConstraint,
    speedConstraint?: SpeedConstraint,
    index: number,
    isActive?: boolean,
    constraints: boolean,
    debug: boolean,
}

const WaypointMarker: FC<WaypointMarkerProps> = ({ ident, position, altitudeConstraint, speedConstraint, index, isActive, constraints = false, debug = false }) => {
    // TODO FL

    // TODO VNAV to provide met/missed prediction => magenta if met, amber if missed
    const constrainedAltitudeClass = (altitudeConstraint?.type ?? -1) > 0 ? 'White' : null;
    let constraintY = -6;
    const constraintText: string[] = [];
    if (constraints && altitudeConstraint) {
        // minus, plus, then speed
        switch (altitudeConstraint.type) {
        case 0:
            constraintText.push(`${Math.round(altitudeConstraint.altitude1)}`);
            break;
        case 1:
            constraintText.push(`+${Math.round(altitudeConstraint.altitude1)}`);
            break;
        case 2:
            constraintText.push(`-${Math.round(altitudeConstraint.altitude1)}`);
            break;
        case 3:
            constraintText.push(`-${Math.round(altitudeConstraint.altitude1)}`);
            constraintText.push(`+${Math.round(altitudeConstraint.altitude2 ?? 0)}`);
            break;
        default:
            throw new Error(`Invalid leg altitude constraint type for leg '${ident}'.`);
        }
    }

    if (constraints && speedConstraint && speedConstraint.speed > 0) {
        constraintText.push(`${Math.round(speedConstraint.speed)}KT`);
    }

    return (
        <Layer x={position[0]} y={position[1]}>
            <rect x={-4} y={-4} width={8} height={8} className={isActive ? 'White' : 'Green'} strokeWidth={2} transform="rotate(45 0 0)" />

            <text x={15} y={-6} fontSize={20} className={isActive ? 'White' : 'Green'}>
                {ident}
                {debug && `(${index})`}
            </text>
            {constraints && (
                constraintText.map((t) => (
                    <text x={15} y={constraintY += 20} className="Magenta" fontSize={20}>{t}</text>
                ))
            )}
            {constrainedAltitudeClass && (
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
