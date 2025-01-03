// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { SegmentType } from '@fmgc/wtsdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { placeBearingDistance } from 'msfs-geo';
import { fixToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { FXLeg } from '@fmgc/guidance/lnav/legs/FX';

/**
 * Temporary - better solution is just to have an `InfiniteLine` vector...
 */
const FM_LEG_SIZE = 512;

export class FMLeg extends FXLeg {
  predictedPath: PathVector[] = [];

  /**
   *
   * @param fix The fix this leg extends from.
   * @param course The course in true degrees.
   * @param metadata Leg metadata.
   * @param segment The flight plan segment this leg appears in.
   */
  constructor(
    public readonly fix: Fix,
    private readonly course: number,
    public readonly metadata: Readonly<LegMetadata>,
    segment: SegmentType,
  ) {
    super();
    this.segment = segment;
  }

  get terminationWaypoint(): Waypoint {
    return undefined;
  }

  displayedOnMap = false;

  getPathStartPoint(): Coordinates | undefined {
    return this.inboundGuidable?.getPathEndPoint() ?? this.fix.location;
  }

  getPathEndPoint(): Coordinates | undefined {
    return placeBearingDistance(this.fix.location, this.course, FM_LEG_SIZE);
  }

  recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    this.predictedPath.length = 0;
    this.predictedPath.push({
      type: PathVectorType.Line,
      startPoint: this.getPathStartPoint(),
      endPoint: this.getPathEndPoint(),
    });

    this.isComputed = true;
  }

  get inboundCourse(): Degrees {
    return this.course;
  }

  get outboundCourse(): Degrees {
    return this.course;
  }

  get distance(): NauticalMiles {
    return 0;
  }

  get distanceToTermination(): NauticalMiles {
    return 1;
  }

  // Can't get pseudo-waypoint location without a finite terminator
  getPseudoWaypointLocation(_distanceBeforeTerminator: NauticalMiles): undefined {
    return undefined;
  }

  getGuidanceParameters(ppos: LatLongData, trueTrack: Track, _tas: Knots, _gs: Knots): GuidanceParameters {
    return fixToFixGuidance(ppos, trueTrack, this.fix.location, this.getPathEndPoint());
  }

  getNominalRollAngle(_gs: Knots): Degrees {
    return 0;
  }

  getDistanceToGo(_ppos: LatLongData): NauticalMiles {
    return undefined;
  }

  getAlongTrackDistanceToGo(ppos: Coordinates, trueTrack: number): NauticalMiles | undefined {
    return this.outboundGuidable?.getAlongTrackDistanceToGo(ppos, trueTrack);
  }

  isAbeam(_ppos: LatLongAlt): boolean {
    return true;
  }

  get disableAutomaticSequencing(): boolean {
    return true;
  }

  get repr(): string {
    return `FM(${this.fix.ident}-${this.course.toFixed(1)}T)`;
  }
}
