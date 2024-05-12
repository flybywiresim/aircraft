// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import {
  courseToFixDistanceToGo,
  courseToFixGuidance,
  PointSide,
  sideOfPointOnCourseToFix,
} from '@fmgc/guidance/lnav/CommonGeometry';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { distanceTo, placeBearingIntersection } from 'msfs-geo';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { PathVector, PathVectorType } from '../PathVector';

export class CRLeg extends Leg {
  private computedPath: PathVector[] = [];

  constructor(
    public readonly course: DegreesTrue,
    public readonly origin: { coordinates: Coordinates; ident: string; theta: DegreesMagnetic },
    public readonly radial: DegreesTrue,
    public readonly metadata: Readonly<LegMetadata>,
    segment: SegmentType,
  ) {
    super();

    this.segment = segment;
  }

  intercept: Coordinates | undefined = undefined;

  get terminationWaypoint(): Coordinates {
    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return this.intercept;
  }

  getPathStartPoint(): Coordinates | undefined {
    if (this.inboundGuidable && this.inboundGuidable.isComputed) {
      return this.inboundGuidable.getPathEndPoint();
    }

    throw new Error('[CRLeg] No computed inbound guidable.');
  }

  getPathEndPoint(): Coordinates | undefined {
    return this.intercept;
  }

  get predictedPath(): PathVector[] {
    return this.computedPath;
  }

  recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    this.intercept = placeBearingIntersection(
      // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
      this.getPathStartPoint(),
      this.course,
      this.origin.coordinates,
      this.radial,
    )[0];

    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    const overshot = distanceTo(this.getPathStartPoint(), this.intercept) >= 5_000;

    if (this.intercept && !overshot) {
      this.computedPath = [
        {
          type: PathVectorType.Line,
          // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
          startPoint: this.getPathStartPoint(),
          endPoint: this.intercept,
        },
      ];

      this.isNull = false;
      this.isComputed = true;

      if (LnavConfig.DEBUG_PREDICTED_PATH) {
        this.computedPath.push(
          {
            type: PathVectorType.DebugPoint,
            // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
            startPoint: this.getPathStartPoint(),
            annotation: 'CR START',
          },
          {
            type: PathVectorType.DebugPoint,
            startPoint: this.getPathEndPoint(),
            annotation: 'CR END',
          },
        );
      }
    } else {
      this.predictedPath.length = 0;

      this.isNull = true;
      this.isComputed = true;
    }
  }

  /**
   * Returns `true` if the inbound transition has overshot the leg
   */
  get overshot(): boolean {
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    const side = sideOfPointOnCourseToFix(this.intercept, this.outboundCourse, this.getPathStartPoint());

    return side === PointSide.After;
  }

  get inboundCourse(): Degrees {
    return this.course;
  }

  get outboundCourse(): Degrees {
    return this.course;
  }

  get distanceToTermination(): NauticalMiles {
    const startPoint = this.getPathStartPoint();

    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    return distanceTo(startPoint, this.intercept);
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles {
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
  }

  getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, _tas: Knots): GuidanceParameters | undefined {
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    return courseToFixGuidance(ppos, trueTrack, this.course, this.getPathEndPoint());
  }

  getNominalRollAngle(_gs: Knots): Degrees {
    return 0;
  }

  getPseudoWaypointLocation(_distanceBeforeTerminator: NauticalMiles): Coordinates | undefined {
    return undefined;
  }

  isAbeam(ppos: Coordinates): boolean {
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    const dtg = courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());

    return dtg >= 0 && dtg <= this.distance;
  }

  get repr(): string {
    return `CR ${this.course}T to ${this.origin.ident}${this.origin.theta}`;
  }
}
