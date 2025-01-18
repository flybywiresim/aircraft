// Copyright (c) 2021-2022, 2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { Coordinates, distanceTo, placeBearingDistance } from 'msfs-geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { LegMetadata } from './index';
import { courseToFixDistanceToGo, fixToFixGuidance } from '../CommonGeometry';

export class FCLeg extends Leg {
  /** @inheritdoc */
  public predictedPath: PathVector[];

  /** @inheritdoc */
  public inboundCourse = this.course;
  /** @inheritdoc */
  public outboundCourse = this.course;

  // not actually an "intercepted", but that prop is required by transitions
  /** The endpoint of the path, not considering the outbound transition. */
  public intercept: Coordinates;

  /**
   * Ctor.
   * @param course True course of the leg in degrees.
   * @param legLength Length of the leg from the fix in nautical miles.
   * @param fix The fix to start from.
   * @param metadata Additional leg metadata.
   * @param segment The segment this leg belongs to.
   */
  constructor(
    private readonly course: number,
    private readonly legLength: number,
    private readonly fix: Fix,
    public readonly metadata: Readonly<LegMetadata>,
    public readonly segment: SegmentType,
  ) {
    super();

    // FC legs can be statically computed the first time

    this.intercept = placeBearingDistance(fix.location, this.course, this.legLength);

    this.predictedPath = [
      {
        type: PathVectorType.Line,
        startPoint: this.getPathStartPoint(),
        endPoint: this.getPathEndPoint(),
      },
    ];

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.predictedPath.push(
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathStartPoint(),
          annotation: 'FC START',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathEndPoint(),
          annotation: 'FC END',
        },
      );
    }

    this.isComputed = true;
  }

  get terminationWaypoint(): Waypoint | Coordinates | undefined {
    return this.intercept;
  }

  getPathStartPoint(): Coordinates | undefined {
    if (this.inboundGuidable && this.inboundGuidable.isComputed) {
      return this.inboundGuidable.getPathEndPoint();
    }

    return this.fix.location;
  }

  getPathEndPoint(): Coordinates | undefined {
    return this.intercept;
  }

  recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    this.predictedPath[0].startPoint = this.getPathStartPoint();

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.predictedPath[1].startPoint = this.getPathStartPoint();
    }

    this.isComputed = true;
  }

  get distanceToTermination(): NauticalMiles {
    const startPoint = this.getPathStartPoint();

    return distanceTo(startPoint, this.intercept);
  }

  isAbeam(ppos: Coordinates): boolean {
    const dtg = this.getDistanceToGo(ppos);

    return dtg >= 0 && dtg <= this.distance;
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined {
    return courseToFixDistanceToGo(ppos, this.course, this.intercept);
  }

  getGuidanceParameters(
    ppos: Coordinates,
    trueTrack: Degrees,
    _tas: Knots,
    _gs: Knots,
  ): GuidanceParameters | undefined {
    return fixToFixGuidance(ppos, trueTrack, this.getPathStartPoint(), this.intercept);
  }

  getNominalRollAngle(_gs: MetresPerSecond): Degrees | undefined {
    return 0;
  }

  get repr(): string {
    return `FC(${this.legLength.toFixed(1)}NM, ${this.course.toFixed(1)})`;
  }
}
