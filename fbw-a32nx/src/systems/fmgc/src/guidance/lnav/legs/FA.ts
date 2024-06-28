// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { LegMetadata } from '@fmgc/guidance/lnav/legs';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import {
  AirportSubsectionCode,
  AltitudeDescriptor,
  LinePathVector,
  NdbNavaid,
  PathVectorType,
  SectionCode,
  VhfNavaid,
  Waypoint,
} from '@flybywiresim/fbw-sdk';
import { distanceTo, placeBearingDistance } from 'msfs-geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { courseToFixDistanceToGo, fixToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { Leg } from './Leg';

export class FALeg extends Leg {
  /** default climb rate in feet/nm. */
  private static readonly DEFAULT_CLIMB_RATE = 500;

  private initialTermination: Coordinates;

  private calculatedTermination?: Coordinates;

  public readonly predictedPath: PathVector[] = [];

  /**
   * A leg extending from a fix on a given course until reaching a given altitude.
   * @param fix The fix this leg extends from.
   * @param course The course in true degrees.
   * @param altitude The termination altitude in feet MSL.
   * @param metadata Leg metadata.
   * @param segment The flight plan segment this leg appears in.
   */
  constructor(
    public readonly fix: Waypoint | VhfNavaid | NdbNavaid,
    private readonly course: number,
    private readonly altitude: number,
    public readonly metadata: Readonly<LegMetadata>,
    public segment: SegmentType,
  ) {
    super();

    this.initialTermination = this.calculateTermination(this.fix.location);
  }

  /**
   * Calculate the termination point, optionally given a starting altitude in feet MSL.
   * @param startingAltitude The altitude we are starting at in feet MSL. If not given it will be estimated based on previous legs.
   * @returns The estimated termination location.
   */
  private calculateTermination(startingPoint: Coordinates, startingAltitude?: number): Coordinates {
    // FIXME we need VNAV to calculate legs in lockstep with LNAV to get this right
    if (startingAltitude === undefined) {
      if (this.fix.sectionCode === SectionCode.Airport && this.fix.subSectionCode === AirportSubsectionCode.Runways) {
        // FIXME runway altitude should be available on runway fix
        startingAltitude = 0;
      } else if (this.inboundGuidable instanceof Leg && this.inboundGuidable.metadata.flightPlanLegDefinition) {
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
            startingAltitude = inboundLeg.altitude1;
            break;
          case AltitudeDescriptor.BetweenAlt1Alt2:
          case AltitudeDescriptor.AtOrAboveAlt2:
            startingAltitude = inboundLeg.altitude2;
            break;
          default:
            startingAltitude = 0;
        }
      } else {
        startingAltitude = 0;
      }
    }

    const altitudeDiff = Math.max(0, this.altitude - startingAltitude);
    const distance = Math.max(0.1, altitudeDiff / FALeg.DEFAULT_CLIMB_RATE);

    return placeBearingDistance(startingPoint, this.course, distance);
  }

  /** @inheritdoc */
  public get inboundCourse(): number {
    return this.course;
  }

  /** @inheritdoc */
  public get outboundCourse(): number {
    return this.course;
  }

  /** @inheritdoc */
  public get terminationWaypoint(): Coordinates {
    return this.calculatedTermination ?? this.initialTermination;
  }

  /** @inheritdoc */
  public getPathStartPoint(): Coordinates {
    return this.inboundGuidable?.getPathEndPoint() ?? this.fix.location;
  }

  /** @inheritdoc */
  public getPathEndPoint(): Coordinates {
    return this.terminationWaypoint;
  }

  /** @inheritdoc */
  public get distanceToTermination(): number {
    const startPoint = this.getPathStartPoint();
    const term = this.terminationWaypoint;

    return distanceTo(startPoint, term);
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getGuidanceParameters(ppos: Coordinates, trueTrack: number, tas: number, gs: number): GuidanceParameters {
    return fixToFixGuidance(ppos, trueTrack, this.fix.location, this.getPathEndPoint());
  }

  /** @inheritdoc */
  public getDistanceToGo(ppos: Coordinates): number {
    return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
  }

  /** @inheritdoc */
  public isAbeam(ppos: Coordinates): boolean {
    const dtg = this.getDistanceToGo(ppos);

    return dtg >= 0 && dtg <= this.distance;
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getNominalRollAngle(gs: number): number {
    return 0;
  }

  /** @inheritdoc */
  public recomputeWithParameters(
    _isActive: boolean,
    _tas: Knots,
    _gs: Knots,
    _ppos: Coordinates,
    _trueTrack: DegreesTrue,
  ) {
    const startPoint = this.getPathStartPoint();
    // FIXME if we had a better alt estimation.. use startPoint instead
    this.calculatedTermination = this.calculateTermination(this.fix.location);

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

  /** @inheritdoc */
  public get repr(): string {
    return `FA(${this.fix.ident}) ${this.course.toFixed(1)}T ${Math.round(this.altitude)}F`;
  }
}
