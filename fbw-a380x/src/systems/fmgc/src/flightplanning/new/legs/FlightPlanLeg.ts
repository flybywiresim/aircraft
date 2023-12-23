// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    Airport,
    LegType,
    Location,
    ProcedureLeg,
    Runway,
    Waypoint,
    WaypointArea,
    WaypointDescriptor,
} from 'msfs-navdata';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/new/legs/FlightPlanLegDefinition';
import { procedureLegIdentAndAnnotation } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { WaypointFactory } from '@fmgc/flightplanning/new/waypoints/WaypointFactory';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { MathUtils } from '@shared/MathUtils';
import { EnrouteSegment } from '@fmgc/flightplanning/new/segments/EnrouteSegment';

/**
 * A leg in a flight plan. Not to be confused with a geometry leg or a procedure leg
 */
export class FlightPlanLeg {
    type: LegType;

    private constructor(
        public segment: FlightPlanSegment,
        public readonly definition: FlightPlanLegDefinition,
        public ident: string,
        public annotation: string,
        public readonly airwayIdent: string | undefined,
        public readonly rnp: number | undefined,
        public readonly overfly: boolean,
    ) {
        this.type = definition.type;
    }

    isDiscontinuity: false = false

    get waypointDescriptor() {
        return this.definition.waypointDescriptor;
    }

    /**
     * Determines whether this leg is a fix-terminating leg (AF, CF, IF, DF, RF, TF, HF)
     */
    isXF() {
        const legType = this.definition.type;

        return legType === LegType.AF
            || legType === LegType.CF
            || legType === LegType.IF
            || legType === LegType.DF
            || legType === LegType.RF
            || legType === LegType.TF
            || legType === LegType.HF;
    }

    isFX() {
        const legType = this.definition.type;

        return legType === LegType.FA || legType === LegType.FC || legType === LegType.FD || legType === LegType.FM;
    }

    isHX() {
        const legType = this.definition.type;

        return legType === LegType.HA || legType === LegType.HF || legType === LegType.HM;
    }

    /**
     * Returns the termination waypoint is this is an XF leg, `null` otherwise
     */
    terminationWaypoint(): Waypoint | null {
        if (!this.isXF() && !this.isFX() && !this.isHX()) {
            return null;
        }

        return this.definition.waypoint;
    }

    /**
     * Determines whether the leg terminates with a specified waypoint
     *
     * @param waypoint the specified waypoint
     */
    terminatesWithWaypoint(waypoint: Waypoint) {
        if (!this.isXF()) {
            return false;
        }

        // FIXME use databaseId when tracer fixes it
        return this.definition.waypoint.ident === waypoint.ident && this.definition.waypoint.icaoCode === waypoint.icaoCode;
    }

    static turningPoint(segment: EnrouteSegment, location: Location): FlightPlanLeg {
        return new FlightPlanLeg(segment, {
            type: LegType.IF,
            overfly: false,
            waypoint: WaypointFactory.fromLocation('T-P', location),
        }, 'T-P', '', undefined, undefined, false);
    }

    static directToTurnStart(segment: EnrouteSegment, location: Location, bearing: DegreesTrue): FlightPlanLeg {
        return new FlightPlanLeg(segment, {
            type: LegType.FD,
            overfly: false,
            waypoint: WaypointFactory.fromWaypointLocationAndDistanceBearing('', location, 0.1, bearing),
            length: 0.1 * 1852, // 0.1 NM in metres
        }, '', '', undefined, undefined, false);
    }

    static fromProcedureLeg(segment: FlightPlanSegment, procedureLeg: ProcedureLeg, procedureIdent: string): FlightPlanLeg {
        const [ident, annotation] = procedureLegIdentAndAnnotation(procedureLeg, procedureIdent);

        // TODO somehow we need to also return a discont for legs combinations that always have a discontinuity between them
        return new FlightPlanLeg(segment, procedureLeg, ident, annotation, undefined, procedureLeg.rnp, procedureLeg.overfly);
    }

    static fromAirportAndRunway(segment: FlightPlanSegment, procedureIdent: string, airport: Airport, runway?: Runway): FlightPlanLeg {
        if (runway) {
            return new FlightPlanLeg(segment, {
                type: LegType.IF,
                overfly: false,
                waypoint: WaypointFactory.fromAirportAndRunway(airport, runway),
                waypointDescriptor: WaypointDescriptor.Runway,
                magneticCourse: runway?.magneticBearing,
            }, `${airport.ident}${runway ? runway.ident.replace('RW', '') : ''}`, procedureIdent, undefined, undefined, false);
        }

        return new FlightPlanLeg(segment, {
            type: LegType.IF,
            overfly: false,
            waypoint: { ...airport, area: WaypointArea.Terminal },
            waypointDescriptor: WaypointDescriptor.Airport,
            magneticCourse: runway?.magneticBearing,
        }, `${airport.ident}${runway ? runway.ident.replace('RW', '') : ''}`, procedureIdent, undefined, undefined, false);
    }

    static originExtendedCenterline(segment: FlightPlanSegment, runwayLeg: FlightPlanLeg): FlightPlanLeg {
        const altitude = runwayLeg.definition.waypoint.location.alt + 1500;

        // TODO magvar
        const annotation = runwayLeg.ident.substring(0, 3) + Math.round(runwayLeg.definition.magneticCourse).toString().padStart(3, '0');
        const ident = Math.round(altitude).toString().substring(0, 4);

        return new FlightPlanLeg(segment, {
            type: LegType.FA,
            overfly: false,
            waypoint: runwayLeg.terminationWaypoint(),
            magneticCourse: runwayLeg.definition.magneticCourse,
            altitude1: altitude,
        }, ident, annotation, undefined, undefined, false);
    }

    static destinationExtendedCenterline(segment: FlightPlanSegment, runway: Runway): FlightPlanLeg {
        const waypoint = WaypointFactory.fromWaypointLocationAndDistanceBearing(
            'CF',
            runway.thresholdLocation,
            5,
            MathUtils.clampAngle(runway.bearing + 180),
        );

        return new FlightPlanLeg(segment, {
            type: LegType.IF,
            overfly: false,
            waypoint,
        }, waypoint.ident, '', undefined, undefined, false);
    }

    static fromEnrouteWaypoint(segment: FlightPlanSegment, waypoint: Waypoint, airwayIdent?: string): FlightPlanLeg {
        return new FlightPlanLeg(segment, {
            type: LegType.TF,
            overfly: false,
            waypoint,
        }, waypoint.ident, airwayIdent ?? '', airwayIdent, undefined, false);
    }
}

export interface Discontinuity {
    isDiscontinuity: true
}

export type FlightPlanElement = FlightPlanLeg | Discontinuity
