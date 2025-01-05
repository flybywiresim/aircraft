// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';

interface CourseAtDistance {
  distanceFromStart: NauticalMiles;
  course: DegreesTrue;
}

export interface AircraftHeadingProfile {
  get(distanceFromStart: NauticalMiles): DegreesTrue | null;
}

export class NavHeadingProfile implements AircraftHeadingProfile {
  private courses: CourseAtDistance[] = [];

  constructor(private fps: FlightPlanService) {}

  get(distanceFromStart: NauticalMiles): DegreesTrue | null {
    if (this.courses.length === 0) {
      return null;
    }

    if (distanceFromStart <= this.courses[0].distanceFromStart) {
      return this.courses[0].course;
    }

    for (let i = 0; i < this.courses.length - 1; i++) {
      if (
        distanceFromStart > this.courses[i].distanceFromStart &&
        distanceFromStart <= this.courses[i + 1].distanceFromStart
      ) {
        return this.courses[i].course;
      }
    }

    return this.courses[this.courses.length - 1].course;
  }

  updateGeometry(geometry: Geometry) {
    this.courses = [];

    const { legs, transitions } = geometry;

    let distanceFromStart = 0;

    for (let i = 0; i < this.fps.active.legCount; i++) {
      const leg = legs.get(i);

      if (!leg || leg.isNull || leg instanceof IFLeg) {
        continue;
      }

      const inboundTransition = transitions.get(i - 1);

      const legDistance = Geometry.completeLegPathLengths(
        leg,
        inboundTransition?.isNull || !inboundTransition?.isComputed ? null : inboundTransition,
        transitions.get(i),
      ).reduce((sum, el) => sum + (!Number.isNaN(el) ? el : 0), 0);

      distanceFromStart += legDistance;

      if (!Number.isFinite(leg.outboundCourse)) {
        if (VnavConfig.DEBUG_PROFILE) {
          console.warn('[FMS/VNAV] Non-numerical outbound course encountered on leg: ', leg);
        }

        continue;
      }

      this.courses.push({
        distanceFromStart,
        course: leg.outboundCourse,
      });
    }
  }
}
