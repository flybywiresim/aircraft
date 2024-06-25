// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Fix } from '@flybywiresim/fbw-sdk';
import { distanceTo } from 'msfs-geo';
import { PointSide, sideOfPointOnCourseToFix } from '@fmgc/guidance/lnav/CommonGeometry';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';

export abstract class XFLeg extends Leg {
  protected constructor(public fix: Fix) {
    super();
  }

  getPathEndPoint(): Coordinates | undefined {
    if (this.outboundGuidable instanceof FixedRadiusTransition && this.outboundGuidable.isComputed) {
      return this.outboundGuidable.getPathStartPoint();
    }

    if (this.outboundGuidable instanceof DmeArcTransition && this.outboundGuidable.isComputed) {
      return this.outboundGuidable.getPathStartPoint();
    }

    return this.fix.location;
  }

  get terminationWaypoint(): Fix {
    return this.fix;
  }

  get ident(): string {
    return this.fix.ident;
  }

  get overflyTermFix(): boolean {
    return this.metadata.isOverfly;
  }

  /**
   * Returns `true` if the inbound transition has overshot the leg
   */
  get overshot(): boolean {
    const side = sideOfPointOnCourseToFix(this.fix.location, this.outboundCourse, this.getPathStartPoint());

    return side === PointSide.After;
  }

  get distance(): NauticalMiles {
    if (this.overshot) {
      return 0;
    }

    return super.distance;
  }

  get distanceToTermination(): NauticalMiles {
    const startPoint = this.getPathStartPoint();

    if (this.overshot) {
      return 0;
    }

    return distanceTo(startPoint, this.fix.location);
  }
}
