// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Fix, MathUtils, WaypointDescriptor } from '@flybywiresim/fbw-sdk';
import { SegmentType } from '@fmgc/wtsdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { courseToFixDistanceToGo, fixToFixGuidance, getIntermediatePoint } from '@fmgc/guidance/lnav/CommonGeometry';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { bearingTo, distanceTo } from 'msfs-geo';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { PathVector, PathVectorType } from '../PathVector';

export class TFLeg extends XFLeg {
  private readonly course: Degrees;

  private computedPath: PathVector[] = [];

  constructor(
    public from: Fix,
    public to: Fix,
    public readonly metadata: Readonly<LegMetadata>,
    segment: SegmentType,
  ) {
    super(to);

    this.from = from;
    this.to = to;
    this.segment = segment;
    this.course = bearingTo(this.from.location, this.to.location);

    // FIXME this is not how the real plane decides to show/hide runway/airport legs
    // Do not display on map if this is an airport or runway leg
    const { waypointDescriptor } = this.metadata.flightPlanLegDefinition;

    this.displayedOnMap =
      waypointDescriptor !== WaypointDescriptor.Airport && waypointDescriptor !== WaypointDescriptor.Runway;
  }

  get inboundCourse(): DegreesTrue {
    return bearingTo(this.from.location, this.to.location);
  }

  get outboundCourse(): DegreesTrue {
    return bearingTo(this.from.location, this.to.location);
  }

  get predictedPath(): PathVector[] {
    return this.computedPath;
  }

  getPathStartPoint(): Coordinates | undefined {
    return this.inboundGuidable?.isComputed ? this.inboundGuidable.getPathEndPoint() : this.from.location;
  }

  recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    const startPoint = this.getPathStartPoint();
    const endPoint = this.getPathEndPoint();

    this.computedPath.length = 0;

    if (this.overshot) {
      this.computedPath.push({
        type: PathVectorType.Line,
        startPoint: endPoint,
        endPoint,
      });
    } else {
      this.computedPath.push({
        type: PathVectorType.Line,
        startPoint,
        endPoint,
      });
    }

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.computedPath.push({
        type: PathVectorType.DebugPoint,
        startPoint: endPoint,
        annotation: 'TF END',
      });
    }

    this.isComputed = true;
  }

  getPseudoWaypointLocation(distanceBeforeTerminator: NauticalMiles): Coordinates | undefined {
    return getIntermediatePoint(
      this.getPathStartPoint(),
      this.getPathEndPoint(),
      (this.distance - distanceBeforeTerminator) / this.distance,
    );
  }

  getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | null {
    return fixToFixGuidance(ppos, trueTrack, this.from.location, this.to.location);
  }

  getNominalRollAngle(_gs: Knots): Degrees {
    return 0;
  }

  getDistanceToGo(ppos: LatLongData): NauticalMiles {
    return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
  }

  isAbeam(ppos: LatLongAlt): boolean {
    const bearingAC = bearingTo(this.from.location, ppos);
    const headingAC = Math.abs(MathUtils.diffAngle(this.inboundCourse, bearingAC));
    if (headingAC > 90) {
      // if we're even not abeam of the starting point
      return false;
    }
    const distanceAC = distanceTo(this.from.location, ppos);
    const distanceAX = Math.cos(headingAC * MathUtils.DEGREES_TO_RADIANS) * distanceAC;
    // if we're too far away from the starting point to be still abeam of the ending point
    return distanceAX <= this.distance;
  }

  get repr(): string {
    return `TF FROM ${this.from.ident} TO ${this.to.ident}`;
  }
}
