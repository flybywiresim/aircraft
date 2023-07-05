import { Coordinates } from 'msfs-geo';
import {
    AltitudeDescriptor, ApproachWaypointDescriptor, Fix, LegType, NdbNavaid,
    SpeedDescriptor, TurnDirection, VhfNavaid, Waypoint, WaypointDescriptor, Runway,
} from 'msfs-navdata';

export interface DerivedFplnLegData {
    trackFromLastWpt: number,
    distanceFromLastWpt: number,
    windPrediction: WindVector,
}

export interface HoldData {
  inboundMagneticCourse?: number,

  turnDirection?: TurnDirection,

  distance?: number,

  time?: number,

  type: HoldType,
}

export enum HoldType {
    Computed = 0,
    Database = 1,
    Pilot = 2,
}

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
    waypoint?: Fix;

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

export enum WaypointConstraintType {
    CLB = 1,
    DES = 2,
    Unknown = 3,
}

export type CruiseStepEntry = {
    /**
     * Distance before waypoint that the step should be inserted.
     */
    distanceBeforeTermination: number,
    /**
     * Altitude to step to.
     */
    toAltitude: number,
    /**
     * Index of the waypoint to insert the step at.
     */
    waypointIndex: number,
    /**
     * Whether the step should be ignored.
     */
    isIgnored: boolean,
}

/**
 * A leg in a flight plan. Not to be confused with a geometry leg or a procedure leg
 */
export class FlightPlanLeg {
    type: LegType;

    flags = 0;

    public constructor(
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

    defaultHold: HoldData | undefined = undefined;

    modifiedHold: HoldData | undefined = undefined;

    holdImmExit = false;

    constraintType: WaypointConstraintType | undefined;

    cruiseStep: CruiseStepEntry | undefined;

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

export enum SegmentClass {
    Departure,
    Enroute,
    Arrival,
}

export type FlightPlanElement = FlightPlanLeg | Discontinuity

export abstract class FlightPlanSegment {
    abstract class: SegmentClass

    /**
     * Whether the segment has already been strung
     */
    strung = false
}

export class WindVector {
    constructor(public direction: DegreesTrue, public speed: Knots) {
        Avionics.Utils.clampAngle(direction);

        if (speed < 0) {
            this.flipDirection();
            this.speed *= -1;
        }
    }

    private flipDirection() {
        if (this.direction < 180) {
            this.direction += 180;
        }

        this.direction -= 180;
    }

    static default(): WindVector {
        return new WindVector(0, 0);
    }
}

export interface VerticalWaypointPrediction {
    waypointIndex: number,
    distanceFromStart: NauticalMiles,
    secondsFromPresent: Seconds,
    altitude: Feet,
    speed: Knots | Mach,
    altitudeConstraint: AltitudeConstraint,
    speedConstraint: SpeedConstraint,
    isAltitudeConstraintMet: boolean,
    isSpeedConstraintMet: boolean,
    altError: number,
    distanceToTopOfDescent: NauticalMiles | null,
    estimatedFuelOnBoard: Pounds
    distanceFromAircraft: NauticalMiles,
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

export function runwayIdent(runway: Runway) {
    return runway.ident.substring(2);
}

export function procedureLegIdentAndAnnotation(procedureLeg: FlightPlanLegDefinition, procedureIdent?: string): [ident: string, annotation: string] {
    const legType = procedureLeg.type;

    switch (legType) {
    case LegType.AF:
        return [
            procedureLeg.waypoint.ident,
            `${Math.round(procedureLeg.rho).toString().padStart(2, ' ')} ${procedureLeg.recommendedNavaid.ident.substring(0, 3)}`,
        ];
    case LegType.CF:
        return [
            procedureLeg.waypoint.ident,
            `C${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
        ];
    case LegType.IF:
    case LegType.DF:
    case LegType.TF:
        return [procedureLeg.waypoint.ident, procedureIdent ?? null];
    case LegType.RF:
        return [
            procedureLeg.waypoint.ident,
            `${Math.round(procedureLeg.length).toString().padStart(2, ' ')} ARC`,
        ];
    case LegType.CA:
    case LegType.FA:
    case LegType.VA:
        return [
            Math.round(procedureLeg.altitude1).toString().substring(0, 9),
            `${legType === LegType.VA ? 'H' : 'C'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
        ]; // TODO fix for VA
    case LegType.CD:
    case LegType.FC:
    case LegType.FD:
        const targetFix = legType === LegType.FC ? procedureLeg.waypoint : procedureLeg.recommendedNavaid;

        return [
            `${targetFix.ident.substring(0, 3)}/${Math.round(procedureLeg.length).toString().padStart(2, '0')}`,
            `C${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
        ];
    case LegType.CI:
    case LegType.VI:
        return [
            'INTCPT',
            `${legType === LegType.CI ? 'C' : 'H'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
        ]; // TODO fix for VI
    case LegType.CR:
    case LegType.VR:
        return [
            `${procedureLeg.recommendedNavaid.ident.substring(0, 3)}${Math.round(procedureLeg.theta).toString().padStart(3, '0')}`,
            `${legType === LegType.VR ? 'H' : 'C'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
        ]; // TODO fix for VR
    case LegType.HA:
        return [
            Math.round(procedureLeg.altitude1).toString(),
            `HOLD ${procedureLeg.turnDirection === TurnDirection.Left ? 'L' : 'R'}`,
        ];
    case LegType.HF:
        return [
            procedureLeg.waypoint.ident,
            `HOLD ${procedureLeg.turnDirection === TurnDirection.Left ? 'L' : 'R'}`,
        ];
    case LegType.HM:
        return [ // TODO leg before
            procedureLeg.waypoint.ident,
            `C${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
        ];
    case LegType.PI:
        return [
            'INTCPT',
            `PROC ${procedureLeg.turnDirection === TurnDirection.Left ? 'L' : 'R'}`,
        ];
    case LegType.VD:
        break;
    case LegType.FM:
    case LegType.VM:
        return [
            'MANUAL',
            `${legType === LegType.FM ? 'C' : 'H'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
        ]; // TODO fix for VM
    default:
        break;
    }

    return [`(UNKN ${LegType[legType]})`, 'UNKNOWN'];
}

export const pposPointIDent = 'PPOS';

export const turningPointIdent = 'T-P';

export const inboundPointIdent = 'IN-BND';

export const outboundPointIdent = 'OUT-BND';

export enum PseudoWaypointSequencingAction {

    /**
     * Used to trigger "DECELERATE / T/D REACHED" message on EFIS (depending on EIS version and standard) eg. (T/D)
     */
    TOD_REACHED,

    /**
     * Used for approach phase auto-engagement condition eg. (DECEL)
     */
    APPROACH_PHASE_AUTO_ENGAGE,
}

export interface PseudoWaypoint {

    /**
     * The identifier of the PWP, like (T/C) or (DECEL)
     */
    ident: string,

    /**
     * The sequencing type of the pseudo waypoint, if applicable. This is used to determine what to do when the pseudo
     * waypoints is sequenced.
     */
    sequencingType?: PseudoWaypointSequencingAction,

    /**
     * The index of the leg the pseudo waypoint is on
     */
    alongLegIndex: number,

    /**
     * The distance from the termination of the leg at index {@link alongLegIndex} the PWP is on
     */
    distanceFromLegTermination: NauticalMiles,

    /**
     * A bitfield for the EFIS symbol associated with this PWP
     */
    efisSymbolFlag: number,

    /**
     * lla for the position of the EFIS symbol
     */
    efisSymbolLla: Coordinates,

    /**
     * The distance from the start of the path.
     * This is relevant for PWP placed along the track line in HDG/TRK mode.
     */
    distanceFromStart: NauticalMiles,

    /**
     * Whether the pseudo waypoint is displayed on the MCDU
     */
    displayedOnMcdu: boolean,

    /**
     * THe MCDU F-PLN page ident, if different
     */
    mcduIdent?: string,

    /**
     * THe MCDU F-PLN page fix annotation, if applicable
     */
    mcduHeader?: string,

    /**
     * Additional information that is display if the waypoint is displayed on the MCDU (`displayedOnMcdu`)
     */
    flightPlanInfo?: PseudoWaypointFlightPlanInfo

    /**
     * Determines whether a PWP should show up as a symbol on the ND
     */
    displayedOnNd: boolean,
}

export interface PseudoWaypointFlightPlanInfo {
    distanceFromStart?: NauticalMiles,

    altitude: Feet,

    speed: Knots,

    secondsFromPresent: Seconds,

    distanceFromLastFix?: NauticalMiles,
}
