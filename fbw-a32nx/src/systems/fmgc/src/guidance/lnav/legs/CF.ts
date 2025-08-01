// Copyright (c) 2021-2022, 2025 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';
import { placeBearingDistance, placeBearingIntersection } from 'msfs-geo';
import { MathUtils, Fix } from '@flybywiresim/fbw-sdk';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { PathVector, PathVectorType } from '../PathVector';

export class CFLeg extends XFLeg {
  private computedPath: PathVector[] = [];

  /**
   * A course-to-fix leg.
   * This leg specifies a leg of a specified distance on a specified inbound course to a fix.
   * @param fix The fix the leg terminates at.
   * @param course Course to the fix in degrees tree.
   * @param length Leg length in nautical miles.
   * @param metadata Leg metadata.
   * @param segment Segment the leg belongs to.
   */
  constructor(
    fix: Fix,
    public readonly course: DegreesTrue,
    public readonly length: number,
    public readonly metadata: Readonly<LegMetadata>,
    segment: SegmentType,
  ) {
    super(fix);

    this.segment = segment;
  }

  getPathStartPoint(): Coordinates | undefined {
    if (this.inboundGuidable instanceof Transition && this.inboundGuidable.isComputed) {
      return this.inboundGuidable.getPathEndPoint();
    }

    if (this.outboundGuidable instanceof DmeArcTransition && this.outboundGuidable.isComputed) {
      return this.outboundGuidable.getPathStartPoint();
    }

    // Estimate where we should start the leg
    return this.estimateStartWithoutInboundTransition();
  }

  /**
   * Based on FBW-22-07
   *
   * @private
   */
  private estimateStartWithoutInboundTransition(): Coordinates {
    const inverseCourse = Avionics.Utils.clampAngle(this.course + 180);

    if (this.inboundGuidable && this.inboundGuidable.isComputed) {
      const prevLegTerm = this.inboundGuidable.getPathEndPoint();

      return placeBearingIntersection(
        this.getPathEndPoint(),
        inverseCourse,
        prevLegTerm,
        MathUtils.normalise360(inverseCourse + 90),
      )[0];
    }

    return placeBearingDistance(this.fix.location, inverseCourse, this.length);
  }

  get predictedPath(): PathVector[] {
    return this.computedPath;
  }

  recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    // Is start point after the fix ?
    if (this.overshot) {
      this.computedPath = [
        {
          type: PathVectorType.Line,
          startPoint: this.getPathEndPoint(),
          endPoint: this.getPathEndPoint(),
        },
      ];
    } else {
      this.computedPath = [
        {
          type: PathVectorType.Line,
          startPoint: this.getPathStartPoint(),
          endPoint: this.getPathEndPoint(),
        },
      ];
    }

    this.isComputed = true;

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.computedPath.push(
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathStartPoint(),
          annotation: 'CF START',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.getPathEndPoint(),
          annotation: 'CF END',
        },
      );
    }
  }

  get inboundCourse(): Degrees {
    return this.course;
  }

  get outboundCourse(): Degrees {
    return this.course;
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles {
    return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
  }

  getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees, _tas: Knots): GuidanceParameters | undefined {
    return courseToFixGuidance(ppos, trueTrack, this.course, this.getPathEndPoint());
  }

  getNominalRollAngle(_gs: Knots): Degrees {
    return 0;
  }

  isAbeam(ppos: Coordinates): boolean {
    const dtg = courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());

    return dtg >= 0 && dtg <= this.distance;
  }

  get repr(): string {
    return `CF(${this.course.toFixed(1)}T) TO ${this.fix.ident}`;
  }
}
