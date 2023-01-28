// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';
import { Airport, Fix, LegType, ProcedureLeg, Runway, Waypoint, WaypointArea, WaypointDescriptor } from 'msfs-navdata';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/new/legs/FlightPlanLegDefinition';
import { procedureLegIdentAndAnnotation } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { WaypointFactory } from '@fmgc/flightplanning/new/waypoints/WaypointFactory';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { MathUtils } from '@shared/MathUtils';
import { EnrouteSegment } from '@fmgc/flightplanning/new/segments/EnrouteSegment';
import { MagVar } from '@shared/MagVar';

/**
 * A serialized flight plan leg, to be sent across FMSes
 */
export interface SerializedFlightPlanLeg {
    isDiscontinuity: false,
    definition: FlightPlanLegDefinition,
    effectiveType: LegType,
}

export enum FlightPlanLegFlags {
    DirectToTurningPoint = 1 << 0,
}

/**
 * A leg in a flight plan. Not to be confused with a geometry leg or a procedure leg
 */
export class FlightPlanLeg {
    type: LegType;

    flags = 0;

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

    serialize(): SerializedFlightPlanLeg {
        return { isDiscontinuity: false, definition: this.definition, effectiveType: this.type };
    }

    clone(forSegment: FlightPlanSegment): FlightPlanLeg {
        return FlightPlanLeg.deserialize(this.serialize(), forSegment);
    }

    static deserialize(serialized: SerializedFlightPlanLeg, segment: FlightPlanSegment): FlightPlanLeg {
        const leg = FlightPlanLeg.fromProcedureLeg(segment, serialized.definition, serialized.definition.procedureIdent);

        leg.type = serialized.effectiveType;

        return leg;
    }

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

    isVectors() {
        const legType = this.definition.type;

        return legType === LegType.FM || legType === LegType.VM;
    }

    isRunway() {
        return this.definition.waypointDescriptor === WaypointDescriptor.Runway;
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
    terminatesWithWaypoint(waypoint: Fix) {
        if (!this.isXF()) {
            return false;
        }

        // FIXME use databaseId when tracer fixes it
        return this.definition.waypoint.ident === waypoint.ident && this.definition.waypoint.icaoCode === waypoint.icaoCode;
    }

    static turningPoint(segment: EnrouteSegment, location: Coordinates, magneticCourse: DegreesMagnetic): FlightPlanLeg {
        return new FlightPlanLeg(segment, {
            procedureIdent: '',
            type: LegType.CF,
            overfly: false,
            waypoint: WaypointFactory.fromLocation('T-P', location),
            magneticCourse,
        }, 'T-P', '', undefined, undefined, false);
    }

    static directToTurnStart(segment: EnrouteSegment, location: Coordinates, bearing: DegreesTrue): FlightPlanLeg {
        const magVar = Facilities.getMagVar(location.lat, location.long);

        return new FlightPlanLeg(segment, {
            procedureIdent: '',
            type: LegType.FC,
            overfly: false,
            waypoint: WaypointFactory.fromPlaceBearingDistance('T-P', location, 0.1, bearing),
            magneticCourse: MagVar.trueToMagnetic(bearing, magVar),
            length: 0.1,
        }, '', '', undefined, undefined, false);
    }

    static directToTurnEnd(segment: EnrouteSegment, targetWaypoint: Waypoint): FlightPlanLeg {
        return new FlightPlanLeg(segment, {
            procedureIdent: '',
            type: LegType.DF,
            overfly: false,
            waypoint: targetWaypoint,
        }, targetWaypoint.ident, '', undefined, undefined, false);
    }

    static fromProcedureLeg(segment: FlightPlanSegment, procedureLeg: ProcedureLeg, procedureIdent: string): FlightPlanLeg {
        const [ident, annotation] = procedureLegIdentAndAnnotation(procedureLeg, procedureIdent);

        // TODO somehow we need to also return a discont for legs combinations that always have a discontinuity between them
        return new FlightPlanLeg(segment, procedureLeg, ident, annotation, undefined, procedureLeg.rnp, procedureLeg.overfly);
    }

    static fromAirportAndRunway(segment: FlightPlanSegment, procedureIdent: string, airport: Airport, runway?: Runway): FlightPlanLeg {
        if (runway) {
            return new FlightPlanLeg(segment, {
                procedureIdent: '',
                type: LegType.IF,
                overfly: false,
                waypoint: WaypointFactory.fromAirportAndRunway(airport, runway),
                waypointDescriptor: WaypointDescriptor.Runway,
                magneticCourse: runway?.magneticBearing,
            }, `${airport.ident}${runway ? runway.ident.replace('RW', '') : ''}`, procedureIdent, undefined, undefined, false);
        }

        return new FlightPlanLeg(segment, {
            procedureIdent: '',
            type: LegType.IF,
            overfly: false,
            waypoint: { ...airport, area: WaypointArea.Terminal },
            waypointDescriptor: WaypointDescriptor.Airport,
            magneticCourse: runway?.magneticBearing,
        }, `${airport.ident}${runway ? runway.ident.replace('RW', '') : ''}`, procedureIdent, undefined, undefined, false);
    }

    static originExtendedCenterline(segment: FlightPlanSegment, runwayLeg: FlightPlanLeg): FlightPlanLeg {
        const altitude = runwayLeg.definition.altitude1 ? runwayLeg.definition.altitude1 + 1500 : 1500;

        // TODO magvar
        const annotation = runwayLeg.ident.substring(0, 3) + Math.round(runwayLeg.definition.magneticCourse).toString().padStart(3, '0');
        const ident = Math.round(altitude).toString().substring(0, 4);

        return new FlightPlanLeg(segment, {
            procedureIdent: '',
            type: LegType.FA,
            overfly: false,
            waypoint: runwayLeg.terminationWaypoint(),
            magneticCourse: runwayLeg.definition.magneticCourse,
            altitude1: altitude,
        }, ident, annotation, undefined, undefined, false);
    }

    static destinationExtendedCenterline(segment: FlightPlanSegment, airport: Airport, runway?: Runway): FlightPlanLeg {
        const waypoint = WaypointFactory.fromPlaceBearingDistance(
            'CF',
            airport.location,
            5,
            MathUtils.clampAngle(runway.bearing + 180),
        );

        return new FlightPlanLeg(segment, {
            procedureIdent: '',
            type: LegType.IF,
            overfly: false,
            waypoint,
        }, waypoint.ident, '', undefined, undefined, false);
    }

    static fromEnrouteFix(segment: FlightPlanSegment, waypoint: Fix, airwayIdent?: string, type = LegType.TF): FlightPlanLeg {
        return new FlightPlanLeg(segment, {
            procedureIdent: '',
            type,
            overfly: false,
            waypoint,
        }, waypoint.ident, airwayIdent ?? '', airwayIdent, undefined, false);
    }
}

export interface Discontinuity {
    isDiscontinuity: true
}

export type FlightPlanElement = FlightPlanLeg | Discontinuity
