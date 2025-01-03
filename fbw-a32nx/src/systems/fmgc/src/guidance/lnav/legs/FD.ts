// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { Coordinates, distanceTo, firstSmallCircleIntersection } from 'msfs-geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { LegMetadata } from './index';
import { courseToFixDistanceToGo, fixToFixGuidance } from '../CommonGeometry';
import { FXLeg } from '@fmgc/guidance/lnav/legs/FX';

export class FDLeg extends FXLeg {
  predictedPath: PathVector[] = [];

  inboundCourse;

  outboundCourse;

  intercept: Coordinates;

  constructor(
    private readonly course: DegreesTrue,
    private readonly dmeDistance: NauticalMiles,
    public readonly fix: Fix,
    private readonly navaid: Fix,
    public readonly metadata: Readonly<LegMetadata>,
    segment: SegmentType,
  ) {
    super();

    this.segment = segment;

    this.inboundCourse = course;
    this.outboundCourse = course;

    // FD legs can be statically computed the first time

    this.predictedPath.length = 0;

    const intersect = firstSmallCircleIntersection(
      this.navaid.location,
      this.dmeDistance,
      this.fix.location,
      this.course,
    );

    this.intercept = intersect;

    this.predictedPath.push({
      type: PathVectorType.Line,
      startPoint: this.getPathStartPoint(),
      endPoint: this.getPathEndPoint(),
    });

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.predictedPath.push(
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathStartPoint(),
          annotation: 'FD START',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathEndPoint(),
          annotation: 'FD END',
        },
      );
    }

    this.isComputed = true;
  }

  get terminationWaypoint(): Waypoint | Coordinates | undefined {
    return this.intercept;
  }

  getPathStartPoint(): Coordinates | undefined {
    if (this.inboundGuidable instanceof FixedRadiusTransition && this.inboundGuidable.isComputed) {
      return this.inboundGuidable.getPathEndPoint();
    }

    return this.fix.location;
  }

  getPathEndPoint(): Coordinates | undefined {
    return this.intercept;
  }

  recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    this.predictedPath.length = 0;
    this.predictedPath.push({
      type: PathVectorType.Line,
      startPoint: this.getPathStartPoint(),
      endPoint: this.getPathEndPoint(),
    });

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.predictedPath.push(
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathStartPoint(),
          annotation: 'FD START',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathEndPoint(),
          annotation: 'FD END',
        },
      );
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
    return `FD(${this.dmeDistance.toFixed(1)}NM, ${this.course.toFixed(1)})`;
  }
}
