//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import React, { FC, memo } from 'react';
import { MathUtils } from '@shared/MathUtils';
import { Layer } from '@instruments/common/utils';
import { useSimVar } from '@instruments/common/simVars';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { EfisSide, EfisVectorsGroup, NdSymbol, NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { HALeg, HFLeg, HMLeg, HxLegGuidanceState } from '@fmgc/guidance/lnav/legs/HX';
import { MapParameters } from '../utils/MapParameters';
import { FlightPlanVectors } from './FlightPlanVectors';

export enum FlightPlanType {
    Nav,
    Dashed,
    Temp
}

export type FlightPathProps = {
    x?: number,
    y?: number,
    side: EfisSide,
    symbols: NdSymbol[],
    mapParams: MapParameters,
    mapParamsVersion: number,
    debug: boolean,
}

export const FlightPlan: FC<FlightPathProps> = memo(({ x = 0, y = 0, side, symbols, mapParams }) => {
    if (!mapParams.valid) {
        return null;
    }

    const constraintFlags = NdSymbolTypeFlags.ConstraintMet | NdSymbolTypeFlags.ConstraintMissed | NdSymbolTypeFlags.ConstraintUnknown;

    return (
        <Layer x={x} y={y}>
            { /* constraint circles need to be drawn under the flight path */ }
            {symbols.filter((symbol) => (symbol.type & constraintFlags) > 0).map((symbol) => {
                const position = mapParams.coordinatesToXYy(symbol.location);

                return (
                    <ConstraintMarker
                        key={symbol.databaseId}
                        x={Number(MathUtils.fastToFixed(position[0], 1))}
                        y={Number(MathUtils.fastToFixed(position[1], 1))}
                        type={symbol.type}
                    />
                );
            })}

            {Object.keys(EfisVectorsGroup).filter((it) => !Number.isNaN(parseInt(it))).map((group) => (
                <FlightPlanVectors
                    key={EfisVectorsGroup[group]}
                    x={0}
                    y={0}
                    mapParams={mapParams}
                    mapParamsVersion={mapParams.version}
                    side={side}
                    group={parseInt(group) as EfisVectorsGroup}
                />
            ))}

            {symbols.map((symbol) => {
                const position = mapParams.coordinatesToXYy(symbol.location);

                let endPosition;
                if (symbol.type & (NdSymbolTypeFlags.FlightPlanVectorLine)) {
                    endPosition = mapParams.coordinatesToXYy(symbol.lineEnd!);
                } else if (symbol.type & (NdSymbolTypeFlags.FlightPlanVectorArc)) {
                    endPosition = mapParams.coordinatesToXYy(symbol.arcEnd!);
                }

                const radius = symbol.arcRadius ? mapParams.nmToPx * symbol.arcRadius : undefined;

                const deltaX = endPosition ? endPosition[0] - position[0] : undefined;
                const deltaY = endPosition ? endPosition[1] - position[1] : undefined;

                return (
                    <SymbolMarker
                        key={symbol.databaseId}
                        ident={symbol.ident}
                        x={Number(MathUtils.fastToFixed(position[0], 1))}
                        y={Number(MathUtils.fastToFixed(position[1], 1))}
                        endX={deltaX !== undefined ? Number(MathUtils.fastToFixed(deltaX, 1)) : undefined}
                        endY={deltaY !== undefined ? Number(MathUtils.fastToFixed(deltaY, 1)) : undefined}
                        type={symbol.type}
                        length={symbol.length}
                        direction={symbol.direction}
                        constraints={symbol.constraints}
                        radials={symbol.radials}
                        radii={symbol.radii}
                        arcSweep={symbol.arcSweepAngle}
                        arcRadius={radius}
                        mapParams={mapParams}
                    />
                );
            })}
        </Layer>
    );
});

const VorMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <line x1={0} x2={0} y1={-15} y2={15} className="shadow" strokeWidth={2.5} />
        <line x1={-15} x2={15} y1={0} y2={0} className="shadow" strokeWidth={2.5} />
        <line x1={0} x2={0} y1={-15} y2={15} className={colour} strokeWidth={2} />
        <line x1={-15} x2={15} y1={0} y2={0} className={colour} strokeWidth={2} />
    </>
);

const VorDmeMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <circle r={7} className="shadow" strokeWidth={2.5} />
        <line x1={0} x2={0} y1={-15} y2={-7} className="shadow" strokeWidth={2.5} />
        <line x1={0} x2={0} y1={15} y2={7} className="shadow" strokeWidth={2.5} />
        <line x1={-15} x2={-7} y1={0} y2={0} className="shadow" strokeWidth={2.5} />
        <line x1={15} x2={7} y1={0} y2={0} className="shadow" strokeWidth={2.5} />
        <circle r={7} className={colour} strokeWidth={2} />
        <line x1={0} x2={0} y1={-15} y2={-7} className={colour} strokeWidth={2} />
        <line x1={0} x2={0} y1={15} y2={7} className={colour} strokeWidth={2} />
        <line x1={-15} x2={-7} y1={0} y2={0} className={colour} strokeWidth={2} />
        <line x1={15} x2={7} y1={0} y2={0} className={colour} strokeWidth={2} />
    </>
);

const DmeMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <circle r={7} className="shadow" strokeWidth={2.5} />
        <circle r={7} className={colour} strokeWidth={2} />
    </>
);

const NdbMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <path d="M-10,10 L0,-10 L10,10 L-10,10" className="shadow" strokeWidth={2.5} />
        <path d="M-10,10 L0,-10 L10,10 L-10,10" className={colour} strokeWidth={2} />
    </>
);

const WaypointMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <rect x={-4.5} y={-4.5} width={9} height={9} className="shadow" strokeWidth={2.5} transform="rotate(45 0 0)" />
        <rect x={-4.5} y={-4.5} width={9} height={9} className={colour} strokeWidth={2} transform="rotate(45 0 0)" />
    </>
);

const AirportMarker: FC<{ colour: string }> = ({ colour }) => (
    <>
        <line x1={0} x2={0} y1={-15} y2={15} className="shadow" strokeWidth={2.5} />
        <line x1={0} x2={0} y1={-15} y2={15} className="shadow" strokeWidth={2.5} transform="rotate(45)" />
        <line x1={-15} x2={15} y1={0} y2={0} className="shadow" strokeWidth={2.5} />
        <line x1={-15} x2={15} y1={0} y2={0} className="shadow" strokeWidth={2.5} transform="rotate(45)" />
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
            <text x={40} y={-30} fontSize={20} className="shadow" textAnchor="middle" alignmentBaseline="central">
                {airportIdent}
            </text>
            <text x={40} y={-10} fontSize={20} className="shadow" textAnchor="middle" alignmentBaseline="central">
                {runwayIdent.padEnd(4, '\xa0')}
            </text>
        </g>
    );
};

interface RunwayMarkerProps {
    ident: string,
    mapParams: MapParameters,
    direction: number,
    lengthPx: number,
}

const RunwayMarkerClose: FC<RunwayMarkerProps> = memo(({ ident, mapParams, direction, lengthPx }) => {
    useSimVar('PLANE HEADING DEGREES TRUE', 'number');

    const rotation = mapParams.rotation(direction);

    return (
        <g transform={`rotate(${rotation})`} className="White">
            <line x1={-5} x2={-5} y1={0} y2={-lengthPx} className="shadow" strokeWidth={2.5} />
            <line x1={5} x2={5} y1={0} y2={-lengthPx} className="shadow" strokeWidth={2.5} />
            <line x1={-5} x2={-5} y1={0} y2={-lengthPx} strokeWidth={2} />
            <line x1={5} x2={5} y1={0} y2={-lengthPx} strokeWidth={2} />
            <RunwayIdent ident={ident} rotation={rotation} />
        </g>
    );
});

const RunwayMarkerFar: FC<Omit<RunwayMarkerProps, 'lengthPx'>> = memo(({ ident, mapParams, direction }) => {
    useSimVar('PLANE HEADING DEGREES TRUE', 'number');

    const rotation = mapParams.rotation(direction);

    return (
        <g transform={`rotate(${rotation})`} className="White">
            <rect x={-5} y={-25} width={10} height={25} className="shadow" strokeWidth={2.5} />
            <rect x={-5} y={-25} width={10} height={25} strokeWidth={2} />
            <RunwayIdent ident={ident} rotation={rotation} />
        </g>
    );
});

interface SymbolMarkerProps {
    ident: string,
    x: number,
    y: number,
    endX?: number,
    endY?: number,
    type: NdSymbolTypeFlags,
    constraints?: string[],
    length?: number,
    direction?: number,
    radials?: number[],
    radii?: number[],
    arcSweep?: Degrees,
    arcRadius?: number,
    mapParams: MapParameters,
}

const SymbolMarker: FC<SymbolMarkerProps> = memo(({ ident, x, y, endX, endY, arcRadius, arcSweep, type, constraints, length, direction, radials, radii, mapParams }) => {
    let colour = 'White';
    let shadow = true;
    // todo airport as well if in flightplan
    if (type & NdSymbolTypeFlags.Runway) {
        colour = 'White';
    } else if (type & NdSymbolTypeFlags.ActiveLegTermination) {
        colour = 'White';
    } else if (type & NdSymbolTypeFlags.Tuned) {
        colour = 'Cyan';
    } else if (type & (NdSymbolTypeFlags.FlightPlan | NdSymbolTypeFlags.ActiveFlightPlanVector | NdSymbolTypeFlags.FixInfo)) {
        colour = 'Green';
    } else if (type & NdSymbolTypeFlags.EfisOption) {
        colour = 'Magenta';
        shadow = false;
    }

    const elements: JSX.Element[] = [];

    // FIX INFO
    if (type & NdSymbolTypeFlags.FixInfo) {
        if (radii !== undefined) {
            for (const radius of radii) {
                const radiusPx = radius * mapParams.nmToPx;
                elements.push(
                    <path
                        d={`m-${radiusPx},0 a${radiusPx},${radiusPx} 0 1,0 ${radiusPx * 2},0 a${radiusPx},${radiusPx} 0 1,0 -${radiusPx * 2},0`}
                        strokeWidth={2.5}
                        className="shadow"
                        strokeDasharray="15 10"
                    />,
                );
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
                elements.push(<line x2={x2} y2={y2} strokeWidth={2.5} className="shadow" strokeDasharray="15 10" />);
                elements.push(<line x2={x2} y2={y2} strokeWidth={2} className="Cyan" strokeDasharray="15 10" />);
            }
        }
    }

    if (constraints) {
        let constraintY = -6;
        elements.push(...constraints.map((t) => (
            <text x={15} y={constraintY += 20} className="Magenta shadow" fontSize={20}>{t}</text>
        )));
    }

    let showIdent = false;
    let identYOffset = 0;
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
            elements.push(<RunwayMarkerFar
                ident={ident}
                mapParams={mapParams}
                direction={direction!}
            />);
        } else {
            elements.push(<RunwayMarkerClose
                ident={ident}
                mapParams={mapParams}
                direction={direction!}
                lengthPx={mapParams.nmToPx * length!}
            />);
        }
    } else if (type & NdSymbolTypeFlags.Airport) {
        showIdent = true;
        elements.push(<AirportMarker colour={colour} />);
    } else if (type & (NdSymbolTypeFlags.Waypoint | NdSymbolTypeFlags.FlightPlan | NdSymbolTypeFlags.FixInfo)) {
        showIdent = true;
        elements.push(<WaypointMarker colour={colour} />);
    } else if (type & (NdSymbolTypeFlags.FlightPlanVectorLine)) {
        showIdent = false;

        elements.push(
            <path d={`M 0 0 l ${endX} ${endY}`} className={colour} strokeWidth={2} />,
        );
    } else if (type & (NdSymbolTypeFlags.FlightPlanVectorArc)) {
        showIdent = false;

        if (!arcRadius) {
            return null;
        }

        const pathRadius = arcRadius!.toFixed(2);

        elements.push(
            <path d={`M 0 0 A ${pathRadius} ${pathRadius} 0 ${Math.abs(arcSweep!) >= 180 ? 1 : 0} ${arcSweep! > 0 ? 1 : 0} ${endX} ${endY}`} className={colour} strokeWidth={2} />,
        );
    } else if (type & (NdSymbolTypeFlags.FlightPlanVectorDebugPoint)) {
        showIdent = true;
        identYOffset = -25;

        elements.push(
            <path d="M 0 0 l -20 0 h 40 m -20 20 v -40" className={colour} strokeWidth={2} />,
        );
    } else if (type & (NdSymbolTypeFlags.PwpTopOfDescent)) {
        showIdent = false;
        elements.push(
            <>
                <path d="M 0, 0.5 h 15.5 l 12, 12 m -4, 0 l 4, 0 l 0, -4" strokeWidth={1.8} className="shadow" />

                <path d="M 0, 0.5 h 15.5 l 12, 12 m -4, 0 l 4, 0 l 0, -4" strokeWidth={1.5} className="White" />
            </>,
        );
    } else if (type & (NdSymbolTypeFlags.PwpCdaFlap1)) {
        showIdent = false;
        elements.push(
            <>
                <circle cx={0} cy={0} r={12} strokeWidth={1.8} className="shadow" />
                <circle cx={0} cy={0} r={12} strokeWidth={1.5} className="White" />

                <text x={2.5} y={2} className="White shadow" textAnchor="middle" dominantBaseline="middle" fontSize={21}>1</text>
            </>,
        );
    } else if (type & (NdSymbolTypeFlags.PwpCdaFlap2)) {
        showIdent = false;
        elements.push(
            <>
                <circle cx={0} cy={0} r={12} strokeWidth={1.8} className="shadow" />
                <circle cx={0} cy={0} r={12} strokeWidth={1.5} className="White" />

                <text x={1} y={2} className="White shadow" textAnchor="middle" dominantBaseline="middle" fontSize={21}>2</text>
            </>,
        );
    } else if (type & (NdSymbolTypeFlags.PwpDecel)) {
        showIdent = false;
        elements.push(
            <>
                <circle cx={0} cy={0} r={13} strokeWidth={1.6} className="shadow" />
                <circle cx={0} cy={0} r={12} strokeWidth={1.5} className="Magenta" />

                <text x={1.5} y={2} className="Magenta shadow" strokeWidth={1} textAnchor="middle" dominantBaseline="middle" fontSize={22}>D</text>
            </>,
        );
    }

    if (showIdent) {
        elements.push(
            <text x={15} y={-6 + identYOffset} fontSize={20} className={`${colour}${shadow ? ' shadow' : ''}`}>
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

interface ConstraintMarkerProps {
    x: number,
    y: number,
    type: NdSymbolTypeFlags,
}

const ConstraintMarker: FC<ConstraintMarkerProps> = memo(({ x, y, type }) => {
    if (type & NdSymbolTypeFlags.ConstraintMet) {
        return (
            <Layer x={x} y={y}>
                <circle r={12} className="shadow" strokeWidth={2.5} />
                <circle r={12} className="Magenta" strokeWidth={2} />
            </Layer>
        );
    }

    if (type & NdSymbolTypeFlags.ConstraintMissed) {
        return (
            <Layer x={x} y={y}>
                <circle r={12} className="shadow" strokeWidth={2.5} />
                <circle r={12} className="Amber" strokeWidth={2} />
            </Layer>
        );
    }

    return (
        <Layer x={x} y={y}>
            <circle r={12} className="shadow" strokeWidth={2.5} />
            <circle r={12} className="White" strokeWidth={2} />
        </Layer>
    );
});

export type DebugLegProps<TLeg extends Leg> = {
    leg: TLeg,
    mapParams: MapParameters,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DebugLeg: FC<DebugLegProps<Leg>> = ({ leg, mapParams }) => {
    if (leg instanceof TFLeg) {
        return <DebugTFLeg leg={leg} mapParams={mapParams} />;
    } if (leg instanceof VMLeg) {
        return <DebugVMLeg leg={leg} mapParams={mapParams} />;
    } if (leg instanceof HALeg || leg instanceof HFLeg || leg instanceof HMLeg) {
        return <DebugHXLeg leg={leg} mapParams={mapParams} />;
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
                {MathUtils.fastToFixed(leg.inboundCourse, 1)}
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

const DebugHXLeg: FC<DebugLegProps<HALeg | HFLeg | HMLeg>> = ({ leg, mapParams }) => {
    const legType = leg.constructor.name.substr(0, 2);

    const [fromX, fromY] = mapParams.coordinatesToXYy(leg.to.infos.coordinates);

    const [infoX, infoY] = [fromX, fromY - 150];

    return (
        <>
            <text fill="#ff4444" x={infoX} y={infoY} fontSize={16}>
                {HxLegGuidanceState[leg.state]}
                {' - r='}
                {leg.radius.toFixed(1)}
                {' NM'}
            </text>
            <text fill="#ff4444" x={infoX} y={infoY + 20} fontSize={16}>{legType}</text>
        </>
    );
};
