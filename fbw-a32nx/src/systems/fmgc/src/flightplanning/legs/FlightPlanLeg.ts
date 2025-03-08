// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  MathUtils,
  Airport,
  AltitudeDescriptor,
  Fix,
  LegType,
  ProcedureLeg,
  Runway,
  WaypointDescriptor,
} from '@flybywiresim/fbw-sdk';
import { Coordinates } from 'msfs-geo';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { procedureLegIdentAndAnnotation } from '@fmgc/flightplanning/legs/FlightPlanLegNaming';
import { WaypointFactory } from '@fmgc/flightplanning/waypoints/WaypointFactory';
import { FlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { EnrouteSegment } from '@fmgc/flightplanning/segments/EnrouteSegment';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { CruiseStepEntry } from '@fmgc/flightplanning/CruiseStep';
import { WaypointConstraintType, AltitudeConstraint, SpeedConstraint } from '@fmgc/flightplanning/data/constraint';
import { HoldUtils } from '@fmgc/flightplanning/data/hold';
import { OriginSegment } from '@fmgc/flightplanning/segments/OriginSegment';
import { ReadonlyFlightPlanLeg } from '@fmgc/flightplanning/legs/ReadonlyFlightPlanLeg';

/**
 * A serialized flight plan leg, to be sent across FMSes
 */
export interface SerializedFlightPlanLeg {
  ident: string;
  flags: number;
  annotation: string;
  isDiscontinuity: false;
  definition: FlightPlanLegDefinition;
  effectiveType: LegType;
  modifiedHold: HoldData | undefined;
  defaultHold: HoldData | undefined;
  constraintType: WaypointConstraintType | undefined;
  cruiseStep: CruiseStepEntry | undefined;
  pilotEnteredAltitudeConstraint: AltitudeConstraint | undefined;
  pilotEnteredSpeedConstraint: SpeedConstraint | undefined;
}

export enum FlightPlanLegFlags {
  DirectToTurningPoint = 1 << 0,
  PendingDirectToTurningPoint = 1 << 1,
  Origin = 1 << 2,
}

export interface LegCalculations {
  /** The leg's total distance in nautical miles, not cut short by ingress/egress turn radii. */
  distance: number;
  /** The cumulative distance in nautical miles up to this point in the flight plan. */
  cumulativeDistance: number;
  /** The cumulative distance in nautical miles from this point to the missed approach point. */
  cumulativeDistanceToEnd: number;
  /** The leg's total distance in nautical miles, with leg transition turns take into account. */
  distanceWithTransitions: number;
  /** The cumulative distance in nautical miles up to this point, with leg transition turns taken into account. */
  cumulativeDistanceWithTransitions: number;
  /** The cumulative distance in nautical miles from this point to the missed approach point, with leg transition turns taken into account. */
  cumulativeDistanceToEndWithTransitions: number;
  /** Whether the leg terminates in a vertical discontinuity */
  endsInTooSteepPath: boolean;
}

/**
 * A leg in a flight plan. Not to be confused with a geometry leg or a procedure leg
 */
export class FlightPlanLeg implements ReadonlyFlightPlanLeg {
  type: LegType;

  flags = 0;

  private constructor(
    public segment: FlightPlanSegment,
    public readonly definition: FlightPlanLegDefinition,
    public ident: string,
    public annotation: string,
    public readonly rnp: number | undefined,
  ) {
    this.type = definition.type;
  }

  isDiscontinuity: false = false;

  /**
   * This should always correspond to the fields in the definition
   * FIXME: Think about removing this or making it a getter only
   */
  defaultHold: HoldData | undefined = undefined;

  modifiedHold: HoldData | undefined = undefined;

  holdImmExit = false;

  constraintType: WaypointConstraintType = WaypointConstraintType.Unknown;

  cruiseStep: CruiseStepEntry | undefined;

  pilotEnteredAltitudeConstraint: AltitudeConstraint | undefined;

  pilotEnteredSpeedConstraint: SpeedConstraint | undefined;

  calculated: LegCalculations | undefined;

  serialize(): SerializedFlightPlanLeg {
    return {
      ident: this.ident,
      flags: this.flags,
      annotation: this.annotation,
      isDiscontinuity: false,
      definition: JSON.parse(JSON.stringify(this.definition)),
      effectiveType: this.type,
      modifiedHold: this.modifiedHold ? JSON.parse(JSON.stringify(this.modifiedHold)) : undefined,
      defaultHold: this.defaultHold ? JSON.parse(JSON.stringify(this.defaultHold)) : undefined,
      cruiseStep: this.cruiseStep ? JSON.parse(JSON.stringify(this.cruiseStep)) : undefined,
      constraintType: this.constraintType,
      pilotEnteredAltitudeConstraint: this.pilotEnteredAltitudeConstraint
        ? JSON.parse(JSON.stringify(this.pilotEnteredAltitudeConstraint))
        : undefined,
      pilotEnteredSpeedConstraint: this.pilotEnteredSpeedConstraint
        ? JSON.parse(JSON.stringify(this.pilotEnteredSpeedConstraint))
        : undefined,
    };
  }

  clone(forSegment: FlightPlanSegment): FlightPlanLeg {
    return FlightPlanLeg.deserialize(this.serialize(), forSegment);
  }

  static deserialize(serialized: SerializedFlightPlanLeg, segment: FlightPlanSegment): FlightPlanLeg {
    const leg = FlightPlanLeg.fromProcedureLeg(segment, serialized.definition, serialized.definition.procedureIdent);

    leg.ident = serialized.ident;
    leg.flags = serialized.flags;
    leg.annotation = serialized.annotation;
    leg.type = serialized.effectiveType;
    leg.modifiedHold = serialized.modifiedHold;
    leg.defaultHold = serialized.defaultHold;
    leg.constraintType = serialized.constraintType;
    leg.cruiseStep = serialized.cruiseStep;
    leg.pilotEnteredAltitudeConstraint = serialized.pilotEnteredAltitudeConstraint;
    leg.pilotEnteredSpeedConstraint = serialized.pilotEnteredSpeedConstraint;

    return leg;
  }

  get waypointDescriptor() {
    return this.definition.waypointDescriptor;
  }

  get altitudeConstraint(): AltitudeConstraint | undefined {
    if (this.hasPilotEnteredAltitudeConstraint()) {
      return this.pilotEnteredAltitudeConstraint;
    }
    if (this.hasDatabaseAltitudeConstraint()) {
      return this.definition;
    }

    return undefined;
  }

  get speedConstraint(): SpeedConstraint | undefined {
    if (this.hasPilotEnteredSpeedConstraint()) {
      return this.pilotEnteredSpeedConstraint;
    }
    if (this.hasDatabaseSpeedConstraint()) {
      return this.definition;
    }

    return undefined;
  }

  /**
   * Determines whether this leg is a fix-terminating leg (AF, CF, IF, DF, RF, TF, HF)
   */
  isXF() {
    const legType = this.definition.type;

    return (
      legType === LegType.AF ||
      legType === LegType.CF ||
      legType === LegType.IF ||
      legType === LegType.DF ||
      legType === LegType.RF ||
      legType === LegType.TF ||
      legType === LegType.HF
    );
  }

  isFX() {
    const legType = this.definition.type;

    return legType === LegType.FA || legType === LegType.FC || legType === LegType.FD || legType === LegType.FM;
  }

  isHX() {
    const legType = this.definition.type;

    return legType === LegType.HA || legType === LegType.HF || legType === LegType.HM;
  }

  isXI() {
    const legType = this.definition.type;

    return legType === LegType.PI || legType === LegType.CI || legType === LegType.VI;
  }

  isXA() {
    const legType = this.definition.type;

    return legType === LegType.CA || legType === LegType.FA || legType === LegType.HA || legType === LegType.VA;
  }

  isCx() {
    return (
      this.definition.type === LegType.CA ||
      this.definition.type === LegType.CD ||
      this.definition.type === LegType.CF ||
      this.definition.type === LegType.CI ||
      this.definition.type === LegType.CR
    );
  }

  isVx() {
    return (
      this.definition.type === LegType.VA ||
      this.definition.type === LegType.VD ||
      this.definition.type === LegType.VI ||
      this.definition.type === LegType.VM ||
      this.definition.type === LegType.VR
    );
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
  terminationWaypoint(): Fix | null {
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
    if (!this.isXF() && !(this.definition.type === LegType.HF || this.definition.type === LegType.HM)) {
      return false;
    }

    return this.definition.waypoint.databaseId === waypoint.databaseId;
  }

  hasPilotEnteredAltitudeConstraint(): boolean {
    return this.pilotEnteredAltitudeConstraint !== undefined;
  }

  hasDatabaseAltitudeConstraint(): boolean {
    return (
      this.definition.altitudeDescriptor !== undefined &&
      this.definition.altitudeDescriptor !== AltitudeDescriptor.None &&
      // These types of constraints are not considered by the FMS
      this.definition.altitudeDescriptor !== AltitudeDescriptor.AtAlt1GsMslAlt2 &&
      this.definition.altitudeDescriptor !== AltitudeDescriptor.AtOrAboveAlt1GsMslAlt2
    );
  }

  hasPilotEnteredSpeedConstraint(): boolean {
    return this.pilotEnteredSpeedConstraint !== undefined;
  }

  hasDatabaseSpeedConstraint(): boolean {
    return this.definition.speedDescriptor !== undefined;
  }

  withDefinitionFrom(from: FlightPlanLeg) {
    this.definition.verticalAngle = from.definition.verticalAngle;
    this.definition.altitudeDescriptor = from.definition.altitudeDescriptor;
    this.definition.altitude1 = from.definition.altitude1;
    this.definition.altitude2 = from.definition.altitude2;
    this.definition.speedDescriptor = from.definition.speedDescriptor;
    this.definition.speed = from.definition.speed;
    this.definition.approachWaypointDescriptor = from.definition.approachWaypointDescriptor;
    this.definition.waypointDescriptor = from.definition.waypointDescriptor;

    return this;
  }

  withPilotEnteredDataFrom(from: FlightPlanLeg) {
    this.pilotEnteredAltitudeConstraint = from.pilotEnteredAltitudeConstraint;
    this.pilotEnteredSpeedConstraint = from.pilotEnteredSpeedConstraint;
    this.constraintType = from.constraintType;
    this.cruiseStep = from.cruiseStep;
    /**
     * Don't copy holds. When we string the arrival to the upstream plan, the upstream plan may have a hold
     * and the downstream leg doesn't, but the upstream leg is the one that's kept. In this case, we don't want to remove the hold
     *
     * e.g
     * Upstream: WPT1 (CF) -> WPT2 (HM)
     * Downstream: WPT2 (IF) -> WPT3 (CF)
     *
     * strings at WPT2 to yield
     * WPT1 (CF) -> WPT2 (HM) -> WPT3 (CF)
     */

    return this;
  }

  clearAltitudeConstraints() {
    this.definition.altitudeDescriptor = undefined;
    this.definition.altitude1 = undefined;
    this.definition.altitude2 = undefined;
    this.pilotEnteredAltitudeConstraint = undefined;
  }

  clearSpeedConstraints() {
    this.definition.speedDescriptor = undefined;
    this.definition.speed = undefined;
    this.pilotEnteredSpeedConstraint = undefined;
  }

  clearConstraints() {
    // FIXME should we really clear this? It's not a constraint
    this.definition.verticalAngle = undefined;
    this.clearAltitudeConstraints();
    this.clearSpeedConstraints();
  }

  static turningPoint(segment: EnrouteSegment, location: Coordinates, magneticCourse: DegreesMagnetic): FlightPlanLeg {
    return new FlightPlanLeg(
      segment,
      {
        procedureIdent: '',
        type: LegType.CF,
        overfly: false,
        waypoint: WaypointFactory.fromLocation('T-P', location),
        magneticCourse,
      },
      'T-P',
      '',
      undefined,
    );
  }

  static directToTurnEnd(segment: EnrouteSegment, waypoint: Fix): FlightPlanLeg {
    return new FlightPlanLeg(
      segment,
      {
        procedureIdent: '',
        type: LegType.DF,
        overfly: false,
        waypoint,
      },
      waypoint.ident,
      '',
      undefined,
    );
  }

  static manualHold(segment: FlightPlanSegment, waypoint: Fix, hold: HoldData): FlightPlanLeg {
    return new FlightPlanLeg(
      segment,
      {
        procedureIdent: '',
        type: LegType.HM,
        overfly: false,
        waypoint,
        turnDirection: hold.turnDirection,
        magneticCourse: hold.inboundMagneticCourse,
        length: hold.distance,
        lengthTime: hold.time,
      },
      waypoint.ident,
      '',
      undefined,
    );
  }

  static fromProcedureLeg(
    segment: FlightPlanSegment,
    procedureLeg: ProcedureLeg,
    procedureIdent: string,
    constraintType?: WaypointConstraintType,
  ): FlightPlanLeg {
    const [ident, annotation] = procedureLegIdentAndAnnotation(procedureLeg, procedureIdent);

    const flightPlanLeg = new FlightPlanLeg(segment, procedureLeg, ident, annotation, procedureLeg.rnp);

    flightPlanLeg.defaultHold = HoldUtils.parseHoldFromProcedureLeg(procedureLeg);
    flightPlanLeg.constraintType = constraintType;

    return flightPlanLeg;
  }

  static fromAirportAndRunway(
    segment: FlightPlanSegment,
    procedureIdent: string,
    airport: Airport,
    runway?: Runway,
  ): FlightPlanLeg {
    if (runway) {
      return new FlightPlanLeg(
        segment,
        {
          procedureIdent: '',
          type: LegType.IF,
          overfly: false,
          waypoint: WaypointFactory.fromRunway(runway),
          waypointDescriptor: WaypointDescriptor.Runway,
          magneticCourse: runway?.magneticBearing,
        },
        runway.ident,
        procedureIdent,
        undefined,
      );
    }

    return new FlightPlanLeg(
      segment,
      {
        procedureIdent: '',
        type: LegType.IF,
        overfly: false,
        waypoint: WaypointFactory.fromAirport(airport),
        waypointDescriptor: WaypointDescriptor.Airport,
        magneticCourse: runway?.magneticBearing,
      },
      airport.ident,
      procedureIdent,
      undefined,
    );
  }

  static originExtendedCenterline(segment: OriginSegment, runway: Runway, runwayLeg: FlightPlanLeg): FlightPlanLeg {
    const altitude = Number.isFinite(runway?.thresholdLocation?.alt)
      ? 10 * Math.round(runway.thresholdLocation.alt / 10) + 1500
      : 1500;
    const bearing = runway.magneticBearing;

    // TODO magvar
    const annotation = runwayLeg.ident.substring(0, 3) + Math.round(bearing).toString().padStart(3, '0');
    const ident = Math.round(altitude).toFixed(0);

    return new FlightPlanLeg(
      segment,
      {
        procedureIdent: '',
        type: LegType.FA,
        overfly: false,
        waypoint: runwayLeg.terminationWaypoint(),
        magneticCourse: bearing,
        altitude1: altitude,
      },
      ident,
      annotation,
      undefined,
    );
  }

  static destinationExtendedCenterline(segment: FlightPlanSegment, runway: Runway): FlightPlanLeg {
    const waypoint = WaypointFactory.fromPlaceBearingDistance(
      'CF',
      runway.thresholdLocation,
      5,
      MathUtils.normalise360(runway.bearing + 180),
    );

    return new FlightPlanLeg(
      segment,
      {
        procedureIdent: '',
        type: LegType.IF,
        overfly: false,
        waypoint,
      },
      waypoint.ident,
      '',
      undefined,
    );
  }

  static fromEnrouteFix(
    segment: FlightPlanSegment,
    waypoint: Fix,
    airwayIdent?: string,
    type = LegType.TF,
  ): FlightPlanLeg {
    return new FlightPlanLeg(
      segment,
      {
        procedureIdent: '',
        type,
        overfly: false,
        waypoint,
      },
      waypoint.ident,
      airwayIdent ?? '',
      undefined,
    );
  }
}

export interface Discontinuity {
  isDiscontinuity: true;
}

export type FlightPlanElement = FlightPlanLeg | Discontinuity;

export function isDiscontinuity(o: any): o is Discontinuity {
  return typeof o === 'object' && o.isDiscontinuity === true;
}
