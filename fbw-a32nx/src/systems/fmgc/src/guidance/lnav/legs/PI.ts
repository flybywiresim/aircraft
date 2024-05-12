// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Geometry } from '@fmgc/guidance/Geometry';
import {
  arcDistanceToGo,
  arcGuidance,
  courseToFixDistanceToGo,
  courseToFixGuidance,
  maxBank,
} from '@fmgc/guidance/lnav/CommonGeometry';
import { LegMetadata } from '@fmgc/guidance/lnav/legs';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { DebugPointColour, PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { SegmentType } from '@fmgc/wtsdk';
import { bearingTo, distanceTo, placeBearingIntersection, smallCircleGreatCircleIntersection } from 'msfs-geo';
import { Fix, TurnDirection, Waypoint, MathUtils } from '@flybywiresim/fbw-sdk';

interface Segment {
  itp?: Coordinates;
  arcCentre?: Coordinates;
  ftp?: Coordinates;
  course?: DegreesTrue;
  sweepAngle?: Degrees;
  length?: NauticalMiles;
}

enum PiState {
  Straight,
  Turn1,
  Outbound,
  Turn2,
  Intercept,
}

export class PILeg extends Leg {
  private radius: NauticalMiles = 1;

  private straight: Segment = {};

  private turn1: Segment = {};

  private outbound: Segment = {};

  private turn2: Segment = {};

  private intercept: Segment = {};

  private state: PiState = PiState.Straight;

  private debugPoints: PathVector[] = [];

  constructor(
    public fix: Fix,
    private nextLeg: CFLeg,
    public metadata: LegMetadata,
    public segment: SegmentType,
  ) {
    super();

    this.recomputeWithParameters(false, 220, 220, { lat: 0, long: 0 }, 0);
  }

  recomputeWithParameters(isActive: boolean, tas: number, gs: number, _ppos: Coordinates, _trueTrack: number): void {
    if (isActive) {
      return;
    }

    if (this.nextLeg && !(this.nextLeg instanceof CFLeg)) {
      throw new Error('PI must be followed by CF!');
    } else if (!this.nextLeg) {
      return;
    }

    this.debugPoints.length = 0;

    const turn1Sign = this.metadata.flightPlanLegDefinition.turnDirection === TurnDirection.Left ? 1 : -1;
    const turn2Sign = -1 * turn1Sign;

    const gsMs = gs / 1.94384;
    this.radius = gsMs ** 2 / (9.81 * Math.tan((maxBank(tas, true) * Math.PI) / 180)) / 1852;

    const minStraightDist = this.radius * 2;

    const brgToCf = bearingTo(this.fix.location, this.nextLeg.fix.location);

    const distToCf = distanceTo(this.fix.location, this.nextLeg.fix.location);

    const cfInverseCrs = (this.nextLeg.course + 180) % 360;
    this.outbound.course = this.metadata.flightPlanLegDefinition.magneticCourse; // TODO true ?

    this.straight.itp = this.fix.location;
    this.straight.course = cfInverseCrs;

    let tp: Coordinates;
    if (Math.abs(MathUtils.diffAngle(cfInverseCrs, brgToCf)) < 90 && distToCf > minStraightDist) {
      tp = this.nextLeg.fix.location;
    } else {
      // find an intercept on the CF at min dist
      // @ts-expect-error TS2531 -- TODO fix this manually (strict mode migration)
      [tp] = smallCircleGreatCircleIntersection(
        this.fix.location,
        minStraightDist,
        this.nextLeg.fix.location,
        cfInverseCrs,
      ).filter((p) => Math.abs(MathUtils.diffAngle(cfInverseCrs, bearingTo(this.nextLeg.fix.location, p))) < 90);

      this.straight.course = bearingTo(this.fix.location, tp);
    }

    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    this.turn1.sweepAngle = turn1Sign * Math.abs(MathUtils.diffAngle(this.straight.course, this.outbound.course));
    const tpT1FtpDist = this.radius * Math.tan((Math.abs(this.turn1.sweepAngle) * Math.PI) / 360);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    this.turn1.ftp = Avionics.Utils.bearingDistanceToCoordinates(this.outbound.course, tpT1FtpDist, tp.lat, tp.long);
    this.turn1.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
      // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
      (360 + this.outbound.course + turn1Sign * 90) % 360,
      this.radius,
      this.turn1.ftp.lat,
      this.turn1.ftp.long,
    );
    this.turn1.itp = Avionics.Utils.bearingDistanceToCoordinates(
      (this.straight.course + 180) % 360,
      this.radius * (1 - Math.cos((this.turn1.sweepAngle * Math.PI) / 180)),
      tp.lat,
      tp.long,
    );
    this.turn1.length = Math.abs((this.turn1.sweepAngle / 180) * this.radius);

    this.straight.ftp = this.turn1.itp;
    this.straight.length = distanceTo(this.fix.location, this.turn1.itp);

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.debugPoints.push({
        type: PathVectorType.DebugPoint,
        startPoint: tp,
        annotation: 'TP',
        colour: DebugPointColour.Yellow,
      });

      this.debugPoints.push({
        type: PathVectorType.DebugPoint,
        startPoint: this.turn1.itp,
        annotation: 'ITP1',
        colour: DebugPointColour.Magenta,
      });

      this.debugPoints.push({
        type: PathVectorType.DebugPoint,
        startPoint: this.turn1.arcCentre,
        annotation: 'AC1',
        colour: DebugPointColour.Magenta,
      });

      this.debugPoints.push({
        type: PathVectorType.DebugPoint,
        startPoint: this.turn1.ftp,
        annotation: 'FTP1',
        colour: DebugPointColour.Magenta,
      });
    }

    const theta =
      // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
      (Math.abs(MathUtils.diffAngle(this.outbound.course, (this.nextLeg.course + 180) % 360)) * Math.PI) / 180;
    this.outbound.length = this.radius * (1 / Math.tan(theta / 2));
    this.outbound.itp = this.turn1.ftp;

    this.turn2.itp = Avionics.Utils.bearingDistanceToCoordinates(
      // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
      this.outbound.course,
      this.outbound.length + tpT1FtpDist,
      tp.lat,
      tp.long,
    );
    this.turn2.arcCentre = Avionics.Utils.bearingDistanceToCoordinates(
      // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
      (360 + this.outbound.course + turn2Sign * 90) % 360,
      this.radius,
      this.turn2.itp.lat,
      this.turn2.itp.long,
    );
    this.turn2.sweepAngle = turn2Sign * 180;
    this.turn2.ftp = Avionics.Utils.bearingDistanceToCoordinates(
      // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
      (360 + this.outbound.course + turn2Sign * 90) % 360,
      this.radius,
      this.turn2.arcCentre.lat,
      this.turn2.arcCentre.long,
    );
    this.turn2.length = Math.abs((this.turn2.sweepAngle / 180) * this.radius);

    this.outbound.ftp = this.turn2.itp;

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.debugPoints.push({
        type: PathVectorType.DebugPoint,
        startPoint: this.turn2.itp,
        annotation: 'ITP2',
        colour: DebugPointColour.Cyan,
      });

      this.debugPoints.push({
        type: PathVectorType.DebugPoint,
        startPoint: this.turn2.arcCentre,
        annotation: 'AC2',
        colour: DebugPointColour.Cyan,
      });

      this.debugPoints.push({
        type: PathVectorType.DebugPoint,
        startPoint: this.turn2.ftp,
        annotation: 'FTP2',
        colour: DebugPointColour.Cyan,
      });
    }

    this.intercept.itp = this.turn2.ftp;
    this.intercept.ftp = placeBearingIntersection(
      this.turn2.ftp,
      // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
      (this.outbound.course + 180) % 360,
      tp,
      cfInverseCrs,
    )[0];
    this.intercept.length = distanceTo(this.intercept.itp, this.intercept.ftp);
    this.intercept.course = bearingTo(this.intercept.itp, this.intercept.ftp);

    this.isComputed = true;
  }

  get initialLegTermPoint(): Coordinates {
    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return this.turn1.itp;
  }

  get distanceToTermination(): NauticalMiles {
    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return this.straight.length;
  }

  get distance(): NauticalMiles {
    // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
    return this.intercept.length + this.turn2.length + this.outbound.length + this.turn1.length + this.straight.length;
  }

  /**
   * Do we end up further away from the fix than the coded limit
   */
  get turnAreaExceeded(): boolean {
    if (!this.turn2) {
      return false;
    }

    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    const maxExcursion = distanceTo(this.fix.location, this.turn2.arcCentre) + this.radius;

    // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
    return maxExcursion > this.metadata.flightPlanLegDefinition.length;
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles {
    switch (this.state) {
      case PiState.Intercept:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        return courseToFixDistanceToGo(ppos, this.intercept.course, this.intercept.ftp);
      case PiState.Turn2:
        return (
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.intercept.length + arcDistanceToGo(ppos, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle)
        );
      case PiState.Outbound:
        return (
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.intercept.length +
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.turn2.length +
          // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
          courseToFixDistanceToGo(ppos, this.outbound.course, this.outbound.ftp)
        );
      case PiState.Turn1:
        return (
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.intercept.length +
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.turn2.length +
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.outbound.length +
          // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
          arcDistanceToGo(ppos, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle)
        );
      case PiState.Straight:
        return (
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.intercept.length +
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.turn2.length +
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.outbound.length +
          // @ts-expect-error TS2532 -- TODO fix this manually (strict mode migration)
          this.turn1.length +
          // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
          courseToFixDistanceToGo(ppos, this.straight.course, this.straight.ftp)
        );
      default:
        return 1;
    }
  }

  private dtgCurrentSegment(ppos: Coordinates): NauticalMiles {
    switch (this.state) {
      case PiState.Intercept:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        return courseToFixDistanceToGo(ppos, this.intercept.course, this.intercept.ftp);
      case PiState.Turn2:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        return arcDistanceToGo(ppos, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
      case PiState.Outbound:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        return courseToFixDistanceToGo(ppos, this.outbound.course, this.outbound.ftp);
      case PiState.Turn1:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        return arcDistanceToGo(ppos, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
      case PiState.Straight:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        return courseToFixDistanceToGo(ppos, this.straight.course, this.straight.ftp);
      default:
        return 0;
    }
  }

  private radCurrentSegment(tas: Knots, gs: Knots): [NauticalMiles, Degrees] {
    const turn1Sign = this.metadata.flightPlanLegDefinition.turnDirection === TurnDirection.Left ? 1 : -1;
    const turn2Sign = -1 * turn1Sign;

    let currentBank;
    let nextBank;
    switch (this.state) {
      case PiState.Turn1:
        currentBank = turn1Sign * maxBank(tas, true);
        nextBank = 0;
        break;
      case PiState.Turn2:
        currentBank = turn2Sign * maxBank(tas, true);
        nextBank = 0;
        break;
      case PiState.Straight:
        currentBank = 0;
        nextBank = turn1Sign * maxBank(tas, true);
        break;
      case PiState.Outbound:
        currentBank = 0;
        nextBank = turn2Sign * maxBank(tas, true);
        break;
      default:
        return [0, 0];
    }

    return [Geometry.getRollAnticipationDistance(gs, currentBank, nextBank), nextBank];
  }

  getGuidanceParameters(ppos: Coordinates, trueTrack: number, tas: number, gs: number): GuidanceParameters {
    let dtg = this.dtgCurrentSegment(ppos);
    if (dtg <= 0 && this.state < PiState.Intercept) {
      this.state++;
      dtg = this.dtgCurrentSegment(ppos);
    }

    let params;
    switch (this.state) {
      case PiState.Intercept:
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        return this.nextLeg?.getGuidanceParameters(ppos, trueTrack, tas);
      case PiState.Turn2:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        return arcGuidance(ppos, trueTrack, this.turn2.itp, this.turn2.arcCentre, this.turn2.sweepAngle);
      case PiState.Outbound:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        params = courseToFixGuidance(ppos, trueTrack, this.outbound.course, this.outbound.ftp);
        break;
      case PiState.Turn1:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        params = arcGuidance(ppos, trueTrack, this.turn1.itp, this.turn1.arcCentre, this.turn1.sweepAngle);
        break;
      case PiState.Straight:
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        params = courseToFixGuidance(ppos, trueTrack, this.straight.course, this.straight.ftp);
        break;
      default:
    }

    const [rad, nextBank] = this.radCurrentSegment(tas, gs);

    if (params && rad > 0 && dtg <= rad) {
      params.phiCommand = nextBank;
    }

    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return params;
  }

  getNominalRollAngle(_gs: number): number {
    return 0;
  }

  getPathStartPoint(): Coordinates {
    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return this.inboundGuidable?.isComputed ? this.inboundGuidable.getPathEndPoint() : this.fix.location;
  }

  getPathEndPoint(): Coordinates {
    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return this.intercept.ftp;
  }

  get terminationWaypoint(): Waypoint | Coordinates {
    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return this.intercept.ftp;
  }

  get inboundCourse(): number {
    return this.straight.course ?? 0;
  }

  get outboundCourse(): number {
    return this.nextLeg?.course ?? 0;
  }

  isAbeam(_ppos: Coordinates): boolean {
    return true; // TODO y needed
  }

  get predictedPath(): PathVector[] {
    return [
      {
        type: PathVectorType.Line,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        startPoint: this.inboundGuidable?.isComputed ? this.inboundGuidable.getPathEndPoint() : this.fix.location,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        endPoint: this.turn1.itp,
      },
      {
        type: PathVectorType.Arc,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        startPoint: this.turn1.itp,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        centrePoint: this.turn1.arcCentre,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        endPoint: this.turn1.ftp,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        sweepAngle: this.turn1.sweepAngle,
      },
      {
        type: PathVectorType.Line,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        startPoint: this.turn1.ftp,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        endPoint: this.turn2.itp,
      },
      {
        type: PathVectorType.Arc,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        startPoint: this.turn2.itp,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        centrePoint: this.turn2.arcCentre,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        endPoint: this.turn2.ftp,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        sweepAngle: this.turn2.sweepAngle,
      },
      {
        type: PathVectorType.Line,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        startPoint: this.turn2.ftp,
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        endPoint: this.intercept.ftp,
      },
      ...this.debugPoints,
    ];
  }

  get repr(): string {
    return 'PI INTCPT';
  }
}
