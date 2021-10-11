import React, { FC, memo, useState } from 'react';
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
import { Leg } from '@fmgc/guidance/lnav/legs';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { useCurrentFlightPlan } from '@instruments/common/flightplan';
import { MapParameters } from '../utils/MapParameters';

export enum FlightPlanType {
    Nav,
    Dashed,
    Temp
}

export type FlightPathProps = {
    x?: number,
    y?: number,
    symbols: NdSymbol[],
    flightPlanManager: FlightPlanManager,
    mapParams: MapParameters,
    debug: boolean,
    type: FlightPlanType,
}

export const FlightPlan: FC<FlightPathProps> = memo(({ x = 0, y = 0, symbols, flightPlanManager, mapParams, debug = false, type = FlightPlanType.Nav }) => {
    const [guidanceManager] = useState(() => new GuidanceManager(flightPlanManager));
    const [tempGeometry, setTempGeometry] = useState(() => guidanceManager.getMultipleLegGeometry(true));
    const [activeGeometry, setActiveGeometry] = useState(() => guidanceManager.getMultipleLegGeometry());

    const [geometry, setGeometry] = type === FlightPlanType.Temp
        ? [tempGeometry, setTempGeometry]
        : [activeGeometry, setActiveGeometry];

    useInterval(() => {
        if (type === FlightPlanType.Temp) {
            setGeometry(guidanceManager.getMultipleLegGeometry(true));
        } else {
            setGeometry(guidanceManager.getMultipleLegGeometry());
        }
    }, 2_000);

    let flightPath: JSX.Element | null = null;
    if (geometry) {
        switch (type) {
        case FlightPlanType.Temp:
            flightPath = <path d={makePathFromGeometry(geometry, mapParams)} className="Yellow" strokeWidth={3} fill="none" strokeDasharray="15 10" />;
            break;
        case FlightPlanType.Dashed:
            flightPath = <path d={makePathFromGeometry(geometry, mapParams)} stroke="#00ff00" strokeWidth={3} fill="none" strokeDasharray="15 10" />;
            break;
        default:
            flightPath = <path d={makePathFromGeometry(geometry, mapParams)} stroke="#00ff00" strokeWidth={2} fill="none" />;
            break;
        }
    }

    useCurrentFlightPlan();

    return (
        <Layer x={x} y={y}>
            {flightPath}
            {symbols.map((symbol) => {
                const position = mapParams.coordinatesToXYy(symbol.location);

                return (
                    <SymbolMarker
                        key={symbol.ident}
                        ident={symbol.ident}
                        x={Math.round(position[0])}
                        y={Math.round(position[1])}
                        type={symbol.type}
                        length={symbol.length}
                        direction={symbol.direction}
                        constraints={symbol.constraints}
                        radials={symbol.radials}
                        radii={symbol.radii}
                        mapParams={mapParams}
                    />
                );
            })}
            {debug && !!geometry && (
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
});

const VorMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <line x1={0} x2={0} y1={-15} y2={15} className={colour} strokeWidth={2} />
        <line x1={-15} x2={15} y1={0} y2={0} className={colour} strokeWidth={2} />
    </>
);

const VorDmeMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <circle r={7} className={colour} strokeWidth={2} />
        <line x1={0} x2={0} y1={-15} y2={-7} className={colour} strokeWidth={2} />
        <line x1={0} x2={0} y1={15} y2={7} className={colour} strokeWidth={2} />
        <line x1={-15} x2={-7} y1={0} y2={0} className={colour} strokeWidth={2} />
        <line x1={15} x2={7} y1={0} y2={0} className={colour} strokeWidth={2} />
    </>
);

const DmeMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <circle r={7} className={colour} strokeWidth={2} />
    </>
);

const NdbMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <path d="M-10,10 L0,-10 L10,10 L-10,10" className={colour} strokeWidth={2} />
    </>
);

const WaypointMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <rect x={-4.5} y={-4.5} width={9} height={9} className={colour} strokeWidth={2} transform="rotate(45 0 0)" />
    </>
);

const AirportMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <line x1={0} x2={0} y1={-15} y2={15} className={colour} strokeWidth={2} />
        <line x1={0} x2={0} y1={-15} y2={15} className={colour} strokeWidth={2} transform="rotate(45)" />
        <line x1={-15} x2={15} y1={0} y2={0} className={colour} strokeWidth={2} />
        <line x1={-15} x2={15} y1={0} y2={0} className={colour} strokeWidth={2} transform="rotate(45)" />
    </>
);

const RunwayIdent: FC<{ ident: string, rotation: number }> = ({ ident, rotation }) => {
    const airportIdent = ident.substring(0, 4);
    const runwayIdent = ident.substring(4);

    return (
        <g transform={`rotate(${-rotation} 40 -20)`}>
            <text x={40} y={-30} fontSize={20} textAnchor="middle" alignmentBaseline="central">
                {airportIdent}
            </text>
            <text x={40} y={-10} fontSize={20} textAnchor="middle" alignmentBaseline="central">
                {runwayIdent.padEnd(4, '\xa0')}
            </text>
        </g>
    );
};

const RunwayMarkerClose: FC<{ ident: string, rotation: number, lengthPx: number }> = ({ ident, rotation, lengthPx }) => (
    <g transform={`rotate(${rotation})`} className="White">
        <line x1={-5} x2={-5} y1={0} y2={-lengthPx} strokeWidth={2} />
        <line x1={5} x2={5} y1={0} y2={-lengthPx} strokeWidth={2} />
        <RunwayIdent ident={ident} rotation={rotation} />
    </g>
);

const RunwayMarkerFar: FC<{ ident: string, rotation: number }> = ({ ident, rotation }) => (
    <g transform={`rotate(${rotation})`} className="White">
        <rect x={-5} y={-25} width={10} height={25} strokeWidth={2} />
        <RunwayIdent ident={ident} rotation={rotation} />
    </g>
);

interface SymbolMarkerProps {
    ident: string,
    x: number,
    y: number,
    type: NdSymbolTypeFlags,
    constraints?: string[],
    length?: number,
    direction?: number,
    radials?: number[],
    radii?: number[],
    mapParams: MapParameters,
}

const SymbolMarker: FC<SymbolMarkerProps> = memo(({ ident, x, y, type, constraints, length, direction, radials, radii, mapParams }) => {
    let colour = 'White';
    // todo airport as well if in flightplan
    if (type & NdSymbolTypeFlags.Runway) {
        colour = 'White';
    } else if (type & NdSymbolTypeFlags.ActiveLegTermination) {
        colour = 'White';
    } else if (type & NdSymbolTypeFlags.Tuned) {
        colour = 'Cyan';
    } else if (type & (NdSymbolTypeFlags.FlightPlan | NdSymbolTypeFlags.FixInfo)) {
        colour = 'Green';
    } else if (type & NdSymbolTypeFlags.EfisOption) {
        colour = 'Magenta';
    }

    const elements: JSX.Element[] = [];

    if (type & NdSymbolTypeFlags.FixInfo) {
        if (radii !== undefined) {
            for (const radius of radii) {
                const radiusPx = radius * mapParams.nmToPx;
                elements.push(
                    <path
                        d={`m-${radiusPx},0 a${radiusPx},${radiusPx} 0 1,0 ${radiusPx * 2},0 a${radiusPx},${radiusPx} 0 1,0 -${radiusPx * 2},0`}
                        strokeWidth={2}
                        className="Cyan"
                        strokeDasharray="15 10"
                    />,
                );
            }
        }
        if (radials !== undefined) {
            for (const bearing of radials) {
                const rotation = mapParams.rotation(bearing) * Math.PI / 180;
                // TODO how long should a piece of string be?
                const x2 = Math.sin(rotation) * 9000;
                const y2 = -Math.cos(rotation) * 9000;
                elements.push(<line x2={x2} y2={y2} strokeWidth={2} className="Cyan" strokeDasharray="15 10" />);
            }
        }
    }

    if (type & NdSymbolTypeFlags.ConstraintMet) {
        elements.push(<circle r={12} className="Magenta" strokeWidth={2} />);
    } else if (type & NdSymbolTypeFlags.ConstraintMissed) {
        elements.push(<circle r={12} className="Amber" strokeWidth={2} />);
    } else if (type & NdSymbolTypeFlags.ConstraintUnknown) {
        elements.push(<circle r={12} className="White" strokeWidth={2} />);
    }

    if (constraints) {
        let constraintY = -6;
        elements.push(...constraints.map((t) => (
            <text x={15} y={constraintY += 20} className="Magenta" fontSize={20}>{t}</text>
        )));
    }

    let showIdent = false;
    if (type & NdSymbolTypeFlags.VorDme) {
        elements.push(<VorDmeMarker colour={colour} />);
        showIdent = true;
    } else if (type & NdSymbolTypeFlags.Vor) {
        elements.push(<VorMarker colour={colour} />);
        showIdent = true;
    } else if (type & NdSymbolTypeFlags.Dme) {
        elements.push(<DmeMarker colour={colour} />);
        showIdent = true;
    } else if (type & NdSymbolTypeFlags.Ndb) {
        elements.push(<NdbMarker colour={colour} />);
        showIdent = true;
    } else if (type & NdSymbolTypeFlags.Runway) {
        if (mapParams.nmRadius >= 40) {
            elements.push(<RunwayMarkerFar ident={ident} rotation={mapParams.rotation(direction!)} />);
        } else {
            elements.push(<RunwayMarkerClose ident={ident} rotation={mapParams.rotation(direction!)} lengthPx={mapParams.nmToPx * length!} />);
        }
    } else if (type & NdSymbolTypeFlags.Airport) {
        showIdent = true;
        elements.push(<AirportMarker colour={colour} />);
    } else if (type & (NdSymbolTypeFlags.Waypoint | NdSymbolTypeFlags.FlightPlan | NdSymbolTypeFlags.FixInfo)) {
        showIdent = true;
        elements.push(<WaypointMarker colour={colour} />);
    } else if (type & (NdSymbolTypeFlags.PwpCdaFlap1White)) {
        showIdent = false;
        elements.push(
            <>
                <circle cx={0} cy={0} r={14} strokeWidth={2} className="White" />

                <text x={0.5} y={-2.5} className="White" textAnchor="middle" dominantBaseline="middle" fontSize={23}>1</text>
            </>,
        );
    } else if (type & (NdSymbolTypeFlags.PwpCdaFlap2White)) {
        showIdent = false;
        elements.push(
            <>
                <circle cx={0} cy={0} r={14} strokeWidth={2} className="White" />

                <text x={0.5} y={-2.5} className="White" textAnchor="middle" dominantBaseline="middle" fontSize={23}>2</text>
            </>,
        );
    } else if (type & (NdSymbolTypeFlags.PwpDecel)) {
        showIdent = false;
        elements.push(
            <>
                <circle cx={0} cy={0} r={14} strokeWidth={2} className="Magenta" />

                <text x={0.5} y={-2.5} className="Magenta" textAnchor="middle" dominantBaseline="middle" fontSize={23}>D</text>
            </>,
        );
    }

    if (showIdent) {
        elements.push(
            <text x={15} y={-6} fontSize={20} className={colour}>
                {ident}
            </text>,
        );
    }

    return (
        <Layer x={x} y={y}>
            {elements}
        </Layer>
    );
});

export type DebugLegProps<TLeg extends Leg> = {
    leg: TLeg,
    mapParams: MapParameters,
};

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
        } // TODO CALeg
    }

    return path.join(' ');
}
