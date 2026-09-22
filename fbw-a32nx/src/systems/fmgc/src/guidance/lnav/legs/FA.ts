// @ts-strict-ignore
// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { LegMetadata } from '@fmgc/guidance/lnav/legs';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import {
  AirportSubsectionCode,
  AltitudeDescriptor,
  Fix,
  LinePathVector,
  PathVectorType,
  SectionCode,
} from '@flybywiresim/fbw-sdk';
import { distanceTo, placeBearingDistance } from 'msfs-geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { courseToFixDistanceToGo, fixToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { isOnGround } from '@shared/flightphase';
import {
  alongTrackDistance,
  DepartureReference,
  getIndicatedAltitude,
  getRunwayDepartureReference,
  hasReachedAltitude,
  isRunwayFix,
  predictAltitudeTermination,
} from './AltitudeTerminationPrediction';
import { Leg } from './Leg';

export class FALeg extends Leg {
  private static readonly DEFAULT_CLIMB_RATE = 500;
  private static readonly DEFAULT_CLIMB_SPEED = 175;

  private initialTermination: Coordinates;
  private calculatedTermination?: Coordinates;
  private altitudeReached = false;
  public readonly predictedPath: PathVector[] = [];
  /** Set when the fix is a runway: the climb is predicted from the runway end at the runway elevation. */
  private readonly departure: DepartureReference | undefined;

  constructor(
    public readonly fix: Fix,
    private readonly course: number,
    private readonly altitude: number,
    public readonly metadata: Readonly<LegMetadata>,
    public segment: SegmentType,
  ) {
    super();
    this.departure = isRunwayFix(this.fix) ? getRunwayDepartureReference(this.fix, this.course) : undefined;
    // inboundGuidable is not set yet, so this is only a first estimate.
    // It is refined in recomputeWithParameters once the leg is linked into the guidance chain.
    this.initialTermination = this.calculateTermination(this.getLineStart()) ?? this.getLineStart();
  }

  /** Altitude at the start of the leg, derived from the inbound leg's constraint. */
  private getStartingAltitudeFromInbound(): number {
    if (this.fix.sectionCode === SectionCode.Airport && this.fix.subSectionCode === AirportSubsectionCode.Runways) {
      return 0;
    }

    if (!(this.inboundGuidable instanceof Leg) || !this.inboundGuidable.metadata.flightPlanLegDefinition) {
      return 0;
    }

    const inboundLeg = this.inboundGuidable.metadata.flightPlanLegDefinition;

    switch (inboundLeg.altitudeDescriptor) {
      case AltitudeDescriptor.AtAlt1:
      case AltitudeDescriptor.AtAlt1AngleAlt2:
      case AltitudeDescriptor.AtAlt1GsIntcptAlt2:
      case AltitudeDescriptor.AtAlt1GsMslAlt2:
      case AltitudeDescriptor.AtOrAboveAlt1:
      case AltitudeDescriptor.AtOrAboveAlt1AngleAlt2:
      case AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2:
      case AltitudeDescriptor.AtOrAboveAlt1GsMslAlt2:
      case AltitudeDescriptor.AtOrBelowAlt1:
      case AltitudeDescriptor.AtOrBelowAlt1AngleAlt2:
        return inboundLeg.altitude1;
      case AltitudeDescriptor.BetweenAlt1Alt2:
      case AltitudeDescriptor.AtOrAboveAlt2:
        return inboundLeg.altitude2;
      default:
        return 0;
    }
  }

  /**
   * @param startingPoint point the prediction starts from (must lie on the leg's course line)
   * @param startingAltitude altitude at that point; if omitted it is derived from the ground state or inbound leg
   * @param groundSpeed current ground speed, if known
   */
  private calculateTermination(
    startingPoint: Coordinates,
    startingAltitude?: number,
    groundSpeed?: number,
  ): Coordinates | undefined {
    if (startingAltitude === undefined) {
      const fallbackAltitude = isOnGround() ? (getIndicatedAltitude() ?? 0) : this.getStartingAltitudeFromInbound();
      startingAltitude = this.departure?.elevation ?? fallbackAltitude;
    }

    return predictAltitudeTermination(startingPoint, startingAltitude, this.altitude, this.course, groundSpeed, {
      defaultClimbRate: FALeg.DEFAULT_CLIMB_RATE,
      defaultSpeed: FALeg.DEFAULT_CLIMB_SPEED,
      useDefaultClimbRate: true,
      ignoreInstantaneousVS: isOnGround(),
    });
  }

  /** Where the climb line starts: the runway end if the fix is a runway, otherwise the fix itself. */
  private getLineStart(): Coordinates {
    return this.departure?.end ?? this.fix.location;
  }

  /** Projects ppos onto the course line, so the termination always lies on that line. */
  private projectOntoCourse(ppos: Coordinates): Coordinates {
    const lineStart = this.getLineStart();
    const alongTrack = Math.max(0, alongTrackDistance(lineStart, this.course, ppos));

    return placeBearingDistance(lineStart, this.course, alongTrack);
  }

  public get inboundCourse(): number {
    return this.course;
  }
  public get outboundCourse(): number {
    return this.course;
  }

  public get terminationWaypoint(): Coordinates {
    return this.calculatedTermination ?? this.initialTermination;
  }

  public getPathStartPoint(): Coordinates {
    return this.departure?.end ?? this.inboundGuidable?.getPathEndPoint() ?? this.fix.location;
  }
  public getPathEndPoint(): Coordinates {
    return this.terminationWaypoint;
  }

  public get disableAutomaticSequencing(): boolean {
    return !this.altitudeReached;
  }

  public get distanceToTermination(): number {
    return distanceTo(this.getPathStartPoint(), this.terminationWaypoint);
  }

  public getGuidanceParameters(ppos: Coordinates, trueTrack: number, _tas: number, _gs: number): GuidanceParameters {
    return fixToFixGuidance(ppos, trueTrack, this.fix.location, this.getPathEndPoint());
  }

  public getDistanceToGo(ppos: Coordinates): number {
    return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
  }

  public isAbeam(ppos: Coordinates): boolean {
    const dtg = this.getDistanceToGo(ppos);
    return dtg >= 0 && dtg <= this.distance;
  }

  public getNominalRollAngle(_gs: number): number {
    return 0;
  }

  public recomputeWithParameters(
    isActive: boolean,
    _tas: Knots,
    gs: Knots,
    ppos: Coordinates,
    _trueTrack: DegreesTrue,
  ) {
    const startPoint = this.getPathStartPoint();
    const onGround = isOnGround();

    if (!this.altitudeReached) {
      // TODO: same as CALeg — this can fire on the ground with a bad QNH or a low target
      // altitude. Not changed in this PR.
      if (isActive && hasReachedAltitude(this.altitude)) {
        this.altitudeReached = true;
        this.calculatedTermination = this.projectOntoCourse(ppos);
      } else if (isActive && !onGround) {
        const indicatedAltitude = getIndicatedAltitude();

        if (indicatedAltitude !== undefined) {
          // Airborne but still before the runway end: keep measuring the climb from the runway end.
          const beforeRunwayEnd =
            this.departure !== undefined && alongTrackDistance(this.departure.end, this.course, ppos) < 0;

          const predictedTermination = beforeRunwayEnd
            ? this.calculateTermination(this.departure.end, undefined, gs)
            : this.calculateTermination(this.projectOntoCourse(ppos), indicatedAltitude, gs);

          if (predictedTermination) {
            this.calculatedTermination = predictedTermination;
          }
        }
      } else {
        // Inactive legs (or legs on the ground) are refined here because inboundGuidable is only available now.
        this.initialTermination = this.calculateTermination(this.getLineStart()) ?? this.getLineStart();
      }
    }

    const point0: Partial<LinePathVector> = (this.predictedPath[0] as LinePathVector) ?? {};
    point0.type = PathVectorType.Line;
    point0.startPoint = startPoint;
    point0.endPoint = this.getPathEndPoint();

    if (this.predictedPath.length !== 1) {
      this.predictedPath.length = 0;
      this.predictedPath.push(point0 as PathVector);
    }
    this.isComputed = true;
  }

  public get repr(): string {
    return `FA(${this.fix.ident}) ${this.course.toFixed(1)}T ${Math.round(this.altitude)}F`;
  }
}
