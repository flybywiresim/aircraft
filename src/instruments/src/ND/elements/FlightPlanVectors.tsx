import React, { FC, memo, useCallback, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { DebugPointColour, PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { EfisSide, EfisVectorsGroup } from '@shared/NavigationDisplay';
import { Geo } from '@fmgc/utils/Geo';
import { useCoherentEvent } from '@instruments/common/hooks';
import { MapParameters } from '../utils/MapParameters';

export interface FlightPlanVectorsProps {
    x: number,
    y: number,
    mapParams: MapParameters,
    mapParamsVersion: number,
    side: EfisSide,
    group: EfisVectorsGroup,
}

/**
 * Receives and draws EFIS vectors for a certain vector group (flight plan)
 */
export const FlightPlanVectors: FC<FlightPlanVectorsProps> = memo(({ x, y, mapParams, side, group }) => {
    const [vectors, setVectors] = useState<PathVector[]>([]);
    const [, setStagingVectors] = useState<PathVector[]>([]);

    const lineStyle = vectorsGroupLineStyle(group);

    useCoherentEvent(`A32NX_EFIS_VECTORS_${side}_${EfisVectorsGroup[group]}`, useCallback((newVectors: PathVector[], start: number, done: boolean) => {
        if (newVectors) {
            setStagingVectors((old) => {
                const ret = [...old];

                for (let i = start; i < start + newVectors.length; i++) {
                    ret[i] = newVectors[i - start];
                }

                if (done) {
                    const trimAfter = start + newVectors.length;

                    ret.splice(trimAfter);

                    if (LnavConfig.DEBUG_PATH_DRAWING) {
                        console.log(`[ND/Vectors/${EfisVectorsGroup[group]}] Trimmed after end of transmit: oldSize=${old.length} newSize=${ret.length} trimAfter=${trimAfter}`);
                    }

                    setVectors(ret);
                }

                return ret;
            });
        } else if (LnavConfig.DEBUG_PATH_DRAWING) {
            console.warn(`[ND/Vectors] Received falsy vectors on event '${EfisVectorsGroup[group]}'.`);
        }
    }, [group]));

    return (
        <Layer x={x} y={y}>
            {vectors.filter((vector) => isVectorValid(vector)).map((vector, index) => {
                switch (vector.type) {
                case PathVectorType.Line:
                    const [sx, sy] = mapParams.coordinatesToXYy(vector.startPoint);
                    const [ex, ey] = mapParams.coordinatesToXYy(vector.endPoint);

                    return (
                        <line
                            {...lineStyle}
                            fill="none"
                            strokeWidth={2}
                            x1={sx}
                            y1={sy}
                            x2={ex}
                            y2={ey}
                        />
                    );
                case PathVectorType.Arc:
                    const [ix, iy] = mapParams.coordinatesToXYy(vector.startPoint);
                    const [fx, fy] = mapParams.coordinatesToXYy(vector.endPoint);

                    const radius = Geo.getDistance(vector.centrePoint, vector.endPoint) * mapParams.nmToPx;

                    return (
                        <path
                            {...lineStyle}
                            fill="none"
                            strokeWidth={2}
                            d={`M ${ix} ${iy} A ${radius} ${radius} 0 ${Math.abs(vector.sweepAngle) > 180 ? 1 : 0} ${vector.sweepAngle > 0 ? 1 : 0} ${fx} ${fy}`}
                        />
                    );
                case PathVectorType.DebugPoint:
                    const [x, y] = mapParams.coordinatesToXYy(vector.startPoint);

                    const offset = index % 2 === 0;

                    const colour = DebugPointColour[vector.colour ?? DebugPointColour.Cyan];

                    return (
                        <>
                            <path
                                stroke={colour}
                                fill="none"
                                strokeWidth={1.5}
                                d={`M ${x} ${y} h -7 h 14 m -7 -7 v 14`}
                            />

                            <text x={x + (offset ? -15 : 15)} y={y + 5} fontSize={13} textAnchor={offset ? 'end' : 'start'} fill={colour}>{vector.annotation}</text>
                        </>
                    );
                default:
                    return null;
                }
            })}
        </Layer>
    );
});

function isVectorValid(vector: PathVector): boolean {
    if (!vector) {
        return false;
    }

    if (vector.type === null || vector.type === undefined) {
        return false;
    }

    switch (vector.type) {
    case PathVectorType.Line:
        return !!vector.startPoint;
    case PathVectorType.Arc:
        return !!vector.startPoint && !!vector.centrePoint && !!vector.endPoint;
    case PathVectorType.DebugPoint:
        return !!vector.startPoint;
    default:
        return false;
    }
}

function vectorsGroupLineStyle(group: EfisVectorsGroup): React.SVGAttributes<SVGPathElement> {
    switch (group) {
    case EfisVectorsGroup.ACTIVE:
        return { stroke: '#0f0' };
    case EfisVectorsGroup.DASHED:
    case EfisVectorsGroup.OFFSET:
        return { stroke: '#0f0', strokeDasharray: '15 12' };
    case EfisVectorsGroup.TEMPORARY:
        return { stroke: '#ff0', strokeDasharray: '15 12' };
    case EfisVectorsGroup.SECONDARY:
        return { stroke: '#888' };
    case EfisVectorsGroup.SECONDARY_DASHED:
        return { stroke: '#888', strokeDasharray: '15 12' };
    case EfisVectorsGroup.MISSED:
        return { stroke: '#0ff' };
    case EfisVectorsGroup.ALTERNATE:
        return { stroke: '#0ff', strokeDasharray: '15 12' };
    case EfisVectorsGroup.ACTIVE_EOSID:
        return { stroke: '#ff0' };
    default:
        return { stroke: '#f00' };
    }
}
