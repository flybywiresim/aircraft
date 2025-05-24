// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils, Constants, TurnDirection } from '@flybywiresim/fbw-sdk';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Geo } from '@fmgc/utils/Geo';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { AFLeg } from '@fmgc/guidance/lnav/legs/AF';
import { FCLeg } from '@fmgc/guidance/lnav/legs/FC';
import { FDLeg } from '@fmgc/guidance/lnav/legs/FD';
import { ControlLaw } from '@shared/autopilot';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { FALeg } from '@fmgc/guidance/lnav/legs/FA';
import { arcDistanceToGo, arcLength, maxBank } from '../CommonGeometry';
import { CFLeg } from '../legs/CF';
import { CRLeg } from '../legs/CR';
import { CILeg } from '../legs/CI';
import { CDLeg } from '../legs/CD';

type PrevLeg =
  | AFLeg
  | CALeg
  | CDLeg
  | CFLeg
  | CRLeg
  | DFLeg
  | FCLeg
  | FDLeg
  | FALeg
  | FMLeg
  | HALeg
  | HFLeg
  | HMLeg
  | RFLeg
  | TFLeg
  | /* VALeg | VDLeg | */ VMLeg;
type NextLeg = CALeg | CDLeg | CILeg | CRLeg | /* VALeg | VDLeg | VILeg | */ VMLeg;

const tan = (input: Degrees) => Math.tan(input * (Math.PI / 180));

/**
 * A type I transition uses a fixed turn radius between two fix-referenced legs.
 */
export class CourseCaptureTransition extends Transition {
  constructor(
    public previousLeg: PrevLeg,
    public nextLeg: NextLeg | TFLeg, // FIXME temporary
  ) {
    super(previousLeg, nextLeg);
  }

  private terminator: Coordinates | undefined;

  getPathStartPoint(): Coordinates | undefined {
    return this.previousLeg.getPathEndPoint();
  }

  getPathEndPoint(): Coordinates | undefined {
    return this.terminator;
  }

  get turnDirection(): TurnDirection {
    return Math.sign(this.courseVariation) === -1 ? TurnDirection.Left : TurnDirection.Right;
  }

  get deltaTrack(): Degrees {
    return MathUtils.fastToFixedNum(
      MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse),
      1,
    );
  }

  get courseVariation(): Degrees {
    return MathUtils.adjustAngleForTurnDirection(this.deltaTrack, this.nextLeg.metadata.turnDirection);
  }

  public isArc: boolean;

  public startPoint: Coordinates;

  public endPoint: Coordinates;

  public center: Coordinates;

  public sweepAngle: Degrees;

  public radius: NauticalMiles;

  public clockwise: boolean;

  public predictedPath: PathVector[] = [];

  private forcedTurnComplete = false;

  private computedTurnDirection = TurnDirection.Either;

  recomputeWithParameters(_isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue) {
    const termFix = this.previousLeg.getPathEndPoint();

    this.computedTurnDirection = TurnDirection.Either;

    let courseChange;
    let initialTurningPoint;
    if (!this.inboundGuidable) {
      if (this.courseVariation <= 90) {
        courseChange = this.deltaTrack;
      } else if (Math.sign(this.courseVariation) === Math.sign(this.deltaTrack)) {
        courseChange = this.deltaTrack;
      } else {
        courseChange = Math.sign(this.courseVariation) * 360 + this.deltaTrack;
      }
      initialTurningPoint = ppos;
    } else {
      courseChange = this.courseVariation;
      initialTurningPoint = termFix;
    }

    // Course change and delta track?
    const radius =
      (gs ** 2 / (Constants.G * tan(Math.abs(maxBank(tas, false)))) / 6997.84) * LnavConfig.TURN_RADIUS_FACTOR;
    const turnCenter = Geo.computeDestinationPoint(
      initialTurningPoint,
      radius,
      this.previousLeg.outboundCourse + 90 * Math.sign(courseChange),
    );
    const finalTurningPoint = Geo.computeDestinationPoint(
      turnCenter,
      radius,
      this.previousLeg.outboundCourse - 90 * Math.sign(courseChange) + courseChange,
    );

    this.radius = radius;

    // Turn direction
    this.clockwise = courseChange >= 0;

    if (courseChange === 0) {
      this.isArc = false;
      this.startPoint = this.previousLeg.getPathEndPoint();
      this.endPoint = this.previousLeg.getPathEndPoint();

      this.terminator = this.endPoint;

      this.isComputed = true;

      this.predictedPath.length = 0;
      this.predictedPath.push({
        type: PathVectorType.Line,
        startPoint: this.startPoint,
        endPoint: this.endPoint,
      });

      this.isNull = true;

      return;
    }

    this.computedTurnDirection = this.clockwise ? TurnDirection.Right : TurnDirection.Left;

    this.isNull = false;
    this.isArc = true;
    this.startPoint = initialTurningPoint;
    this.center = turnCenter;
    this.endPoint = finalTurningPoint;
    this.sweepAngle = courseChange;

    this.terminator = this.endPoint;

    this.predictedPath.length = 0;
    this.predictedPath.push({
      type: PathVectorType.Arc,
      startPoint: this.startPoint,
      centrePoint: this.center,
      endPoint: this.endPoint,
      sweepAngle: this.sweepAngle,
    });

    this.isComputed = true;
  }

  get startsInCircularArc(): boolean {
    return this.isArc;
  }

  get endsInCircularArc(): boolean {
    return this.isArc;
  }

  get angle(): Degrees {
    return this.sweepAngle;
  }

  isAbeam(ppos: LatLongData): boolean {
    return (
      !this.isNull &&
      this.computedTurnDirection !== TurnDirection.Either &&
      !this.forcedTurnComplete &&
      this.previousLeg.getDistanceToGo(ppos) <= 0
    );
  }

  get distance(): NauticalMiles {
    if (this.isNull) {
      return 0;
    }

    return arcLength(this.radius, this.angle);
  }

  getTurningPoints(): [Coordinates, Coordinates] {
    return [this.startPoint, this.endPoint];
  }

  getDistanceToGo(ppos: LatLongData): NauticalMiles {
    const [itp] = this.getTurningPoints();

    return arcDistanceToGo(ppos, itp, this.center, this.clockwise ? this.angle : -this.angle);
  }

  getGuidanceParameters(ppos: LatLongAlt, trueTrack: number, tas: Knots, gs: Knots): GuidanceParameters | null {
    if (this.computedTurnDirection !== TurnDirection.Either) {
      const turnSign = this.computedTurnDirection === TurnDirection.Left ? -1 : 1;
      let trackAngleError = this.nextLeg.inboundCourse - trueTrack;
      if (turnSign !== Math.sign(trackAngleError)) {
        trackAngleError += turnSign * 360;
      }
      if (Math.abs(trackAngleError) > 130) {
        const phiCommand = turnSign * maxBank(tas, false);
        return {
          law: ControlLaw.LATERAL_PATH,
          trackAngleError: 0,
          phiCommand,
          crossTrackError: 0,
        };
      }
      this.forcedTurnComplete = true;
    }

    // FIXME PPOS guidance and all...
    return this.nextLeg.getGuidanceParameters(ppos, trueTrack, tas, gs);
  }

  getNominalRollAngle(gs: Knots): Degrees {
    const gsMs = gs * (463 / 900);
    return (this.clockwise ? 1 : -1) * Math.atan(gsMs ** 2 / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
  }

  get repr(): string {
    return `COURSE CAPTURE(${this.previousLeg.repr} TO ${this.nextLeg.repr})`;
  }
}
