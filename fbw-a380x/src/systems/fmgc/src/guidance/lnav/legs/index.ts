// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { AltitudeDescriptor, SpeedDescriptor } from 'msfs-navdata';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/new/legs/FlightPlanLegDefinition';
import { MissedApproachSegment } from '@fmgc/flightplanning/new/segments/MissedApproachSegment';

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
            ac.type = AltitudeConstraintType.at;
            break;
        case 2:
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

export function altitudeConstraintFromFlightPlanLeg(definition: FlightPlanLegDefinition): AltitudeConstraint | undefined {
    if (definition.altitudeDescriptor !== undefined && definition.altitude1 !== undefined) {
        const ac: Partial<AltitudeConstraint> = {};

        ac.altitude1 = definition.altitude1;
        ac.altitude2 = undefined;

        switch (definition.altitudeDescriptor) {
        case AltitudeDescriptor.AtAlt1:
            ac.type = AltitudeConstraintType.at;
            break;
        case AltitudeDescriptor.AtOrAboveAlt1:
            ac.type = AltitudeConstraintType.atOrAbove;
            break;
        case AltitudeDescriptor.AtOrBelowAlt1:
            ac.type = AltitudeConstraintType.atOrBelow;
            break;
        case AltitudeDescriptor.BetweenAlt1Alt2:
            ac.type = AltitudeConstraintType.range;
            ac.altitude2 = definition.altitude2;
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
        sc.type = SpeedConstraintType.at;
        sc.speed = wp.speedConstraint;
        return sc as SpeedConstraint;
    }
    return undefined;
}

export function speedConstraintFromProcedureLeg(definition: FlightPlanLegDefinition): SpeedConstraint | undefined {
    if (definition.speedDescriptor !== undefined) {
        let type;
        if (definition.speedDescriptor === SpeedDescriptor.Minimum) {
            type = SpeedConstraintType.atOrAbove;
        } else if (definition.speedDescriptor === SpeedDescriptor.Mandatory) {
            type = SpeedConstraintType.at;
        } else if (definition.speedDescriptor === SpeedDescriptor.Maximum) {
            type = SpeedConstraintType.atOrBelow;
        }

        return { type, speed: definition.speed! };
    }

    return undefined;
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
     * Definition of the originating flight plan leg
     */
    flightPlanLegDefinition: FlightPlanLegDefinition,

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
     * UTC seconds required time of arrival applicable to the leg
     */
    rtaUtcSeconds?: Seconds,

    /**
     * Whether the termination of this leg must be overflown. The termination can be overflown even if this is `false` due to geometric constraints
     */
    isOverfly?: boolean,

    /**
     * Whether the leg is in the missed approach segment
     */
    isInMissedApproach?: boolean,

    /**
     * Lateral offset applicable to this leg. -ve if left offset, +ve if right offset.
     *
     * This also applies if this is the first or last leg considered "offset" in the FMS, even if the transition onto the offset path skips the leg.
     */
    offset?: NauticalMiles,
}

export function legMetadataFromFlightPlanLeg(leg: FlightPlanLeg): LegMetadata {
    const altitudeConstraint = altitudeConstraintFromFlightPlanLeg(leg.definition);
    const speedConstraint = speedConstraintFromProcedureLeg(leg.definition);

    let turnDirection = TurnDirection.Either;
    if (leg.definition.turnDirection === 'L') {
        turnDirection = TurnDirection.Left;
    } else if (leg.definition.turnDirection === 'R') {
        turnDirection = TurnDirection.Right;
    }

    return {
        flightPlanLegDefinition: leg.definition,
        turnDirection,
        altitudeConstraint,
        speedConstraint,
        isOverfly: leg.definition.overfly,
        isInMissedApproach: leg.segment instanceof MissedApproachSegment,
    };
}
