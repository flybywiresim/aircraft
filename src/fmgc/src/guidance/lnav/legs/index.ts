// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';

export enum AltitudeConstraintType {
    at,
    atOrAbove,
    atOrBelow,
    range,
}

// TODO at and atOrAbove do not exist in the airbus (former interpreted as atOrBelow, latter discarded)
export enum SpeedConstraintType {
    at,
    atOrAbove,
    atOrBelow,
}

export interface AltitudeConstraint {
    type: AltitudeConstraintType,
    altitude1: Feet,
    altitude2: Feet | undefined,
}

export interface SpeedConstraint {
    type: SpeedConstraintType,
    speed: Knots,
}

export type PathAngleConstraint = Degrees;

export abstract class FXLeg extends Leg {
    from: WayPoint;
}

export function getAltitudeConstraintFromWaypoint(wp: WayPoint): AltitudeConstraint | undefined {
    if (wp.legAltitudeDescription && wp.legAltitude1) {
        const ac: Partial<AltitudeConstraint> = {};
        ac.altitude1 = wp.legAltitude1;
        ac.altitude2 = undefined;
        switch (wp.legAltitudeDescription) {
        case 1:
        case 6:
            ac.type = AltitudeConstraintType.at;
            break;
        case 2:
        case 7:
            ac.type = AltitudeConstraintType.atOrAbove;
            break;
        case 3:
            ac.type = AltitudeConstraintType.atOrBelow;
            break;
        case 4:
            ac.type = AltitudeConstraintType.range;
            ac.altitude2 = wp.legAltitude2;
            break;
        default:
            break;
        }
        return ac as AltitudeConstraint;
    }
    return undefined;
}

export function getSpeedConstraintFromWaypoint(wp: WayPoint): SpeedConstraint | undefined {
    if (wp.speedConstraint) {
        const sc: Partial<SpeedConstraint> = {};
        sc.type = SpeedConstraintType.atOrBelow;
        sc.speed = wp.speedConstraint;
        return sc as SpeedConstraint;
    }
    return undefined;
}

export function getPathAngleConstraintFromWaypoint(wp: WayPoint): PathAngleConstraint | undefined {
    // Check for null and undefined, we do this because 0 is falsy
    return wp.verticalAngle;
}

export function waypointToLocation(wp: WayPoint): LatLongData {
    const loc: LatLongData = {
        lat: wp.infos.coordinates.lat,
        long: wp.infos.coordinates.long,
    };
    return loc;
}

export function isHold(leg: Leg): boolean {
    return leg instanceof HALeg || leg instanceof HFLeg || leg instanceof HMLeg;
}

export function isCourseReversalLeg(leg: Leg): boolean {
    return isHold(leg); // TODO PILeg
}

/**
 * Geometry and vertical constraints applicable to a leg
 */
export interface LegMetadata {

    /**
     * Turn direction constraint applicable to this leg
     */
    turnDirection: TurnDirection,

    /**
     * Altitude constraint applicable to this leg
     */
    altitudeConstraint?: AltitudeConstraint,

    /**
     * Speed constraint applicable to this leg
     */
    speedConstraint?: SpeedConstraint,

    /**
     * Path angle constraint applicable to this leg
     */
    pathAngleConstraint?: PathAngleConstraint,

    /**
     * UTC seconds required time of arrival applicable to the leg
     */
    rtaUtcSeconds?: Seconds,

    /**
     * Whether the termination of this leg must be overflown. The termination can be overflown even if this is `false` due to geometric constraints
     */
    isOverfly?: boolean,

    /**
     * Lateral offset applicable to this leg. -ve if left offset, +ve if right offset.
     *
     * This also applies if this is the first or last leg considered "offset" in the FMS, even if the transition onto the offset path skips the leg.
     */
    offset?: NauticalMiles,

}

export function legMetadataFromMsfsWaypoint(waypoint: WayPoint): LegMetadata {
    const altitudeConstraint = getAltitudeConstraintFromWaypoint(waypoint);
    const speedConstraint = getSpeedConstraintFromWaypoint(waypoint);
    const pathAngleConstraint = getPathAngleConstraintFromWaypoint(waypoint);

    return {
        turnDirection: waypoint.turnDirection,
        altitudeConstraint,
        speedConstraint,
        pathAngleConstraint,
        isOverfly: waypoint.additionalData.overfly,
    };
}
