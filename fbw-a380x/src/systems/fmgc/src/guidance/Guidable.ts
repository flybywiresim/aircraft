// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { PathVector, pathVectorLength, pathVectorPoint, PathVectorType } from '@fmgc/guidance/lnav/PathVector';

/**
 * A `Guidable` is a part of an LNAV path. It can be either a leg or a transition.
 */
export abstract class Guidable {
    /**
     * Whether the guidable should be considered for map display, guidance and sequencing
     *
     * For a transition, this indicates that the transition between the legs is selected but has no geometry.
     * For a leg, this indicates that geometry conditions cause the leg to be skipped.
     */
    isNull = false

    /**
     * The first valid guidable that precedes this one. This takes into account the `isNull` property, meaning other
     * guidables can exist before this one but would not be referred to by this property if they were to be null.
     */
    inboundGuidable: Guidable;

    /**
     * The first valid guidable that succeeds this one. This takes into account the `isNull` property, meaning other
     * guidables can exist after this one but would not be referred to by this property if they were to be null.
     */
    outboundGuidable: Guidable;

    protected constructor() {
    }

    /**
     * Used to update the {@link inboundGuidable} and {@link outboundGuidable} properties.
     */
    setNeighboringGuidables(inbound: Guidable, outbound: Guidable) {
        this.inboundGuidable = inbound;
        this.outboundGuidable = outbound;
    }

    abstract getPathStartPoint(): Coordinates | undefined;

    getPathEndPoint(): Coordinates | undefined {
        if (this.isNull) {
            return this.inboundGuidable.getPathEndPoint();
        }

        if (this.predictedPath) {
            for (let i = this.predictedPath.length - 1; i >= 0; i--) {
                const vector = this.predictedPath[i];

                if (vector.type === PathVectorType.DebugPoint) {
                    continue;
                }

                if (vector.endPoint) {
                    return vector.endPoint;
                }
            }
        }

        return undefined;
    }

    isComputed = false;

    /**
     * Recomputes the guidable using new parameters
     *
     * @param isActive          whether the guidable is being flown
     * @param tas               predicted true airspeed speed of the current leg (for a leg) or the next leg (for a transition) in knots
     * @param gs                predicted ground speed of the current leg
     * @param ppos              the current position of the aircraft
     * @param trueTrack         true ground track
     * @param previousGuidable  previous guidable before leg
     * @param nextGuidable      next guidable after leg
     */
    abstract recomputeWithParameters(isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable): void;

    /**
     * Obtains guidance parameters that will be sent to the FG when this guidable is active (or being captured by a previous guidable)
     *
     * @param ppos     the current position of the aircraft
     * @param trueTrack true ground track
     * @param tas       true air speed
     * @param gs        ground speed
     */
    abstract getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, tas: Knots, gs: Knots): GuidanceParameters | undefined;

    /**
     * Calculates directed DTG parameter
     *
     * @param ppos the current position of the aircraft
     */
    abstract getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined;

    abstract isAbeam(ppos: Coordinates): boolean;

    /**
     * Obtains the location of a pseudo-waypoint on the guidable (does NOT include inbound or outbound
     * transitions for legs; see {@link PseudoWaypoints.pointFromEndOfPath} for a function that includes those).
     *
     * @param distanceBeforeTerminator
     */
    getPseudoWaypointLocation(distanceBeforeTerminator: NauticalMiles): Coordinates | undefined {
        for (const vector of [...this.predictedPath].reverse()) {
            const length = pathVectorLength(vector);

            if (length > distanceBeforeTerminator) {
                return pathVectorPoint(vector, distanceBeforeTerminator);
            }
        }
        return undefined;
    }

    /**
     * Path vectors for the predicted path.
     *
     * This path always represents what is being drawn on the ND, and is used for the vast majority of prediction computations. It is
     * however not always representative of guidance, for example in case of path capture or course capture transitions or CX/VX legs.
     */
    abstract get predictedPath(): PathVector[] | undefined;

    /**
     * Whether the path ends in a curved arc - for entry roll anticipation
     */
    get startsInCircularArc(): boolean {
        return false;
    }

    /**
     * Whether the path ends in a curved arc - for exit roll anticipation
     */
    get endsInCircularArc(): boolean {
        return false;
    }

    /**
     * Obtain the nominal roll angle for the curved portion of the path
     */
    abstract getNominalRollAngle(gs: MetresPerSecond): Degrees | undefined;

    abstract get repr(): string;
}
