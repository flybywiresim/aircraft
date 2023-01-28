// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    AltitudeDescriptor, ApproachWaypointDescriptor,
    LegType,
    SpeedDescriptor,
    TurnDirection, WaypointDescriptor,
} from 'msfs-navdata/dist/shared/types/ProcedureLeg';
import { Waypoint, VhfNavaid, NdbNavaid } from 'msfs-navdata';
import { Minutes } from 'msfs-geo';

export interface FlightPlanLegDefinition {
    procedureIdent: string;

    /**
     * Leg termination type according to ARICN424
     */
    type: LegType;

    /**
     * Should the termination of this leg be overflown (not flown by in a turn)
     */
    overfly: boolean;

    /**
     * The waypoint assocaited with the termination of this leg
     * For VM legs at the end of a STAR, this shall be the airport reference point
     */
    waypoint?: Waypoint;

    /**
     * Radio navaid to be used for this leg
     */
    recommendedNavaid?: VhfNavaid | NdbNavaid | Waypoint;

    /**
     * Distance from the recommended navaid, to the waypoint
     */
    rho?: NauticalMiles;

    /**
     * Magnetic bearing from the recommended navaid, to the waypoint
     * For AF legs this is the fix radial
     */
    theta?: DegreesMagnetic;

    /**
     * Defines the arc for RF legs
     */
    arcCentreFix?: Waypoint;

    /**
     * Defines the radius for RF legs
     */
    arcRadius?: NauticalMiles;

    /**
     * length if it is specified in distance
     * exact meaning depends on the leg type
     * mutually exclusive with lengthTime
     * For PI legs, the excursion distance from the waypoint
     */
    length?: NauticalMiles;

    /**
     * length if it is specified in time
     * exact meaning depends on the leg type
     * mutually exclusive with length
     */
    lengthTime?: Minutes;

    /**
     * Required Navigation Performance for this leg
     */
    rnp?: NauticalMiles;

    /**
     * Transition altitude
     * Should be specified on the first leg of each procedure, or default 18000 feet if not specified
     */
    transitionAltitude?: Feet;

    /**
     * Specifies the meaning of the altitude1 and altitude2 properties
     */
    altitudeDescriptor?: AltitudeDescriptor;

    /**
     * altitudeDescriptor property specifies the meaning of this property
     */
    altitude1?: Feet;

    /**
     * altitudeDescriptor property specifies the meaning of this property
     */
    altitude2?: Feet;

    /**
     * On SIDS the speed limit applies backwards from termination of this leg,
     * to either the previous speed limit terminator, or the start of the procedure.
     * On STARs and approaches, the speed limit applies forwards until either
     * the end of the procedure, or the next speed limit
     * The exact meaning is coded in the speedDescriptor property
     */
    speed?: Knots;

    /**
     * Specifies the meaning of the speed property
     */
    speedDescriptor?: SpeedDescriptor;

    /**
     * Specifies the direction of the turn to capture this leg (the start of the leg)
     * Should be specified for any track change > 135°
     * Assume valid if defined as L or R
     */
    turnDirection?: TurnDirection;

    /**
     * Specifies the outbound magnetic course associated with the termination of this leg
     * For AF legs this is the boundary radial
     * For CF legs this is the course to the specified fix
     */
    magneticCourse?: DegreesMagnetic;

    /**
     * Specifies the descent vertical angle (negative) referenced to the terminating fix
     * Should be projected back up to the last coded altitude
     */
    verticalAngle?: Degrees;

    /**
     * Approach-specific waypoint type
     */
    approachWaypointDescriptor?: ApproachWaypointDescriptor;

    /**
     * General waypoint type
     */
    waypointDescriptor?: WaypointDescriptor;
}
