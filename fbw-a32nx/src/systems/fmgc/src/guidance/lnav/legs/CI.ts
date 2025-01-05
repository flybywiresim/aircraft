// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import {
  courseToFixDistanceToGo,
  PointSide,
  reciprocal,
  sideOfPointOnCourseToFix,
} from '@fmgc/guidance/lnav/CommonGeometry';
import { Geo } from '@fmgc/utils/Geo';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { distanceTo, placeBearingIntersection } from 'msfs-geo';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { PathVector, PathVectorType } from '../PathVector';

export class CILeg extends Leg {
  private computedPath: PathVector[] = [];

  constructor(
    public readonly course: DegreesTrue,
    public readonly nextLeg: Leg,
    public readonly metadata: Readonly<LegMetadata>,
    segment: SegmentType,
  ) {
    super();

    this.segment = segment;
  }

  intercept: Coordinates | undefined = undefined;

  get terminationWaypoint(): Coordinates {
    return this.intercept;
  }

  getPathStartPoint(): Coordinates | undefined {
    if (this.inboundGuidable instanceof IFLeg) {
      return this.inboundGuidable.fix.location;
    }
    if (this.inboundGuidable && this.inboundGuidable.isComputed) {
      return this.inboundGuidable.getPathEndPoint();
    }

    throw new Error('[CILeg] No computed inbound guidable.');
  }

  getPathEndPoint(): Coordinates | undefined {
    if (this.outboundGuidable instanceof FixedRadiusTransition && this.outboundGuidable.isComputed) {
      return this.outboundGuidable.getPathStartPoint();
    }

    if (this.outboundGuidable instanceof DmeArcTransition && this.outboundGuidable.isComputed) {
      return this.outboundGuidable.getPathStartPoint();
    }

    return this.intercept;
  }

  get predictedPath(): PathVector[] {
    return this.computedPath;
  }

  recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    this.intercept = Geo.legIntercept(this.getPathStartPoint(), this.course, this.nextLeg);

    const side = sideOfPointOnCourseToFix(this.intercept, this.outboundCourse, this.getPathStartPoint());
    const flipped = side === PointSide.After;

    if (this.intercept && !Number.isNaN(this.intercept.lat) && !flipped) {
      this.isNull = false;

      const interceptSide = sideOfPointOnCourseToFix(
        this.nextLeg.getPathEndPoint(),
        this.nextLeg.outboundCourse,
        this.intercept,
      );

      if (interceptSide === PointSide.After) {
        const [one, two] = placeBearingIntersection(
          this.intercept,
          reciprocal(this.outboundCourse),
          this.nextLeg.getPathEndPoint(),
          MathUtils.normalise360(this.nextLeg.outboundCourse + 90),
        );

        const d1 = distanceTo(this.intercept, one);
        const d2 = distanceTo(this.intercept, two);

        this.intercept = d1 < d2 ? one : two;
      }

      this.computedPath = [
        {
          type: PathVectorType.Line,
          startPoint: this.getPathStartPoint(),
          endPoint: this.getPathEndPoint(),
        },
      ];

      this.isComputed = true;

      if (LnavConfig.DEBUG_PREDICTED_PATH) {
        this.computedPath.push(
          {
            type: PathVectorType.DebugPoint,
            startPoint: this.getPathStartPoint(),
            annotation: 'CI START',
          },
          {
            type: PathVectorType.DebugPoint,
            startPoint: this.getPathEndPoint(),
            annotation: 'CI END',
          },
        );
      }
    } else {
      this.computedPath.length = 0;

      this.isNull = true;
      this.isComputed = true;
    }
  }

  get inboundCourse(): Degrees {
    return this.course;
  }

  get outboundCourse(): Degrees {
    return this.course;
  }

  get distanceToTermination(): NauticalMiles {
    const startPoint = this.getPathStartPoint();

    return distanceTo(startPoint, this.intercept);
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles {
    return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
  }

  getGuidanceParameters(_ppos: Coordinates, _trueTrack: Degrees): GuidanceParameters | undefined {
    return {
      law: ControlLaw.TRACK,
      course: this.course,
    };
  }

  getNominalRollAngle(_gs: Knots): Degrees {
    return 0;
  }

  isAbeam(ppos: Coordinates): boolean {
    const dtg = courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());

    return dtg >= 0 && dtg <= this.distance;
  }

  get repr(): string {
    return `CI(${Math.trunc(this.course)}T)`;
  }
}
