import React, { useEffect, useState } from 'react';
import { useCurrentFlightPlan, useFlightPlanManager } from '@instruments/common/flightplan';
import { Geometry, Leg, TFLeg, Type1Transition } from '@fmgc/guidance/Geometry';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { MathUtils } from '@shared/MathUtils';
import { Layer } from '@instruments/common/utils';
import { MapParameters } from './utils/MapParameters';

export type FlightPathProps = { mapParams: MapParameters }

export const FlightPath: React.FC<FlightPathProps> = ({ mapParams }) => {
    const flightPlanManager = useFlightPlanManager();
    const [guidanceManager] = useState(() => new GuidanceManager(flightPlanManager));
    const flightPlan = useCurrentFlightPlan();

    const [geometry, setGeometry] = useState(() => guidanceManager.getMultipleLegGeometry(false));

    useEffect(() => {
        setGeometry(guidanceManager.getMultipleLegGeometry());
    }, [flightPlan]);

    if (geometry) {
        return (
            <Layer>
                <text x={490} y={475} fill="green" fontSize={24}>{flightPlan.originAirfield.ident}</text>
                <path d={makePathFromGeometry(geometry, mapParams)} stroke="green" strokeWidth={2} />
            </Layer>
        );
    }

    return null;
};

/**
 *
 * @param geometry {Geometry}
 * @param mapParams {MapParameters}
 */
function makePathFromGeometry(geometry: Geometry, mapParams: MapParameters): string {
    const path: string[] = [];

    let x: string | null = null;
    let y: string | null = null;

    const firstLeg = geometry.legs.get(1) as TFLeg;

    // initial transition
    if (geometry.transitions.has(1)) {
        // draw the initial transition fully
        const transition = geometry.transitions.get(1) as Type1Transition;

        const [inbound, outbound] = transition.getTurningPoints();

        const [inbndX, inbndY] = mapParams.coordinatesToXYy(inbound);
        x = MathUtils.fastToFixed(inbndX, 1);
        y = MathUtils.fastToFixed(inbndY, 1);

        // move to starting point of transition
        path.push(`M ${x} ${y}`);

        // draw first transition
        const r = MathUtils.fastToFixed(transition.radius * mapParams.nmToPixels(1), 0);
        const [outbndX, outbndY] = mapParams.coordinatesToXYy(outbound);

        x = MathUtils.fastToFixed(outbndX, 1);
        y = MathUtils.fastToFixed(outbndY, 1);
        const cw = transition.clockwise;

        path.push(`A ${r} ${r} 0 0 ${cw ? 1 : 0} ${x} ${y}`);
    } else if (geometry.legs.has(1)) {
        // Move to the starting point of the first leg
        const [toX, toY] = mapParams.coordinatesToXYy(firstLeg.from.infos.coordinates);
        x = MathUtils.fastToFixed(toX, 1);
        y = MathUtils.fastToFixed(toY, 1);

        path.push(`M ${x} ${y}`);

        // If the "to" waypoint ends in a discontinuity, we won't draw a line there later, so do it now
        if (firstLeg.to.endsInDiscontinuity) {
            const [toX, toY] = mapParams.coordinatesToXYy(firstLeg.to.infos.coordinates);

            x = MathUtils.fastToFixed(toX, 1);
            y = MathUtils.fastToFixed(toY, 1);

            path.push(`L ${x} ${y}`);
        }
    }

    let finalLeg = firstLeg;
    for (let i = 2; i <= geometry.legs.size; i++) {
        const [prevLeg, leg] = [geometry.legs.get(i - 1), geometry.legs.get(i) as Leg];
        const transition = geometry.transitions.get(i);

        if (leg instanceof TFLeg) {
            if (transition && transition instanceof Type1Transition) {
                // draw line to start of transition
                const [inbound, outbound] = transition.getTurningPoints();

                const [inbndX, inbndY] = mapParams.coordinatesToXYy(inbound);
                x = MathUtils.fastToFixed(inbndX, 1);
                y = MathUtils.fastToFixed(inbndY, 1);
                path.push(`${path.length ? 'L' : 'M'} ${x} ${y}`);

                // draw transition itself to end of transition
                const r = MathUtils.fastToFixed(transition.radius * mapParams.nmToPixels(1), 0);
                const [outbndX, outbndY] = mapParams.coordinatesToXYy(outbound);

                x = MathUtils.fastToFixed(outbndX, 1);
                y = MathUtils.fastToFixed(outbndY, 1);
                const cw = transition.clockwise;

                path.push(`A ${r} ${r} 0 0 ${cw ? 1 : 0} ${x} ${y}`);

                /* const [cX, cY] = map.coordinatesToXY(transition.center);
                const pcx = MathUtils.fastToFixed(cX, 1);
                const pcy = MathUtils.fastToFixed(cY, 1); */
            }

            // If there was no transition but the leg exists, we M or L to the from waypoint
            if (!transition && leg) {
                // draw line to start of next leg
                const [fromX, fromY] = mapParams.coordinatesToXYy(leg.from.infos.coordinates);
                x = MathUtils.fastToFixed(fromX, 1);
                y = MathUtils.fastToFixed(fromY, 1);

                // If the previous leg ended in a discontinuity OR this is the fist leg, we use an M command
                let lineCommand;
                if (prevLeg && prevLeg instanceof TFLeg && prevLeg.to.endsInDiscontinuity) {
                    lineCommand = 'M';
                } else {
                    lineCommand = path.length > 0 ? 'L' : 'M';
                }

                path.push(`${lineCommand} ${x} ${y}`);
            }

            // If the to waypoint ends in a discontinuity, we will not L to it for the next leg - do that now
            if (leg && leg.to.endsInDiscontinuity) {
                // draw line to end of leg
                const [fromX, fromY] = mapParams.coordinatesToXYy(leg.to.infos.coordinates);
                x = MathUtils.fastToFixed(fromX, 1);
                y = MathUtils.fastToFixed(fromY, 1);

                path.push(`L ${x} ${y}`);
            }

            finalLeg = leg;
        }
    }

    // draw to final leg
    if (finalLeg) {
        const [fromX, fromY] = mapParams.coordinatesToXYy(finalLeg.to.infos.coordinates);
        x = MathUtils.fastToFixed(fromX, 1);
        y = MathUtils.fastToFixed(fromY, 1);
        path.push(`${path.length ? 'L' : 'M'} ${x} ${y}`);
    }

    return path.join(' ');
}
