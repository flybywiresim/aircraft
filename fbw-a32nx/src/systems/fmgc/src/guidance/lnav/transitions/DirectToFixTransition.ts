// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Constants, MathUtils, TurnDirection } from '@flybywiresim/fbw-sdk';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { GuidanceParameters, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { bearingTo, distanceTo, placeBearingDistance } from 'msfs-geo';
import { FCLeg } from '@fmgc/guidance/lnav/legs/FC';
import { FDLeg } from '@fmgc/guidance/lnav/legs/FD';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { FALeg } from '@fmgc/guidance/lnav/legs/FA';
import { CILeg } from '../legs/CI';
import {
  arcDistanceToGo,
  arcGuidance,
  arcLength,
  courseToFixDistanceToGo,
  courseToFixGuidance,
  getRollAnticipationDistance,
  maxBank,
} from '../CommonGeometry';
import { CRLeg } from '../legs/CR';
import { CDLeg } from '../legs/CD';

type PrevLeg =
  | CALeg
  | CDLeg
  | CFLeg
  | CILeg
  | CRLeg
  | DFLeg
  | FCLeg
  | FDLeg
  | FALeg
  | FMLeg
  | HALeg
  | HFLeg
  | HMLeg
  | TFLeg
  | /* VALeg | VILeg | VDLeg | */ VMLeg; /* | VRLeg */
type NextLeg = CFLeg | DFLeg | FALeg | FMLeg;

const tan = (input: Degrees) => Math.tan(input * (Math.PI / 180));
const acos = (input: Degrees) => Math.acos(input) * (180 / Math.PI);

export enum DirectToFixTransitionGuidanceState {
  Straight,
  Turn,
}

/**
 * A type I transition uses a fixed turn radius between two fix-referenced legs.
 */
export class DirectToFixTransition extends Transition {
  public state = DirectToFixTransitionGuidanceState.Straight;

  private straightCourse: Degrees;

  constructor(
    public previousLeg: PrevLeg,
    public nextLeg: NextLeg,
  ) {
    super(previousLeg, nextLeg);
  }

  private terminator: Coordinates | undefined;

  getPathStartPoint(): Coordinates | undefined {
    return this.previousLeg.getPathEndPoint();
  }

  get turnDirection(): Degrees {
    return Math.sign(this.deltaTrack);
  }

  get deltaTrack(): Degrees {
    return MathUtils.fastToFixedNum(
      MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse),
      1,
    );
  }

  get courseVariation(): Degrees {
    // TODO reverse turn direction
    return this.deltaTrack;
  }

  public hasArc: boolean;

  public center: Coordinates;

  public radius: NauticalMiles;

  public clockwise: boolean;

  public lineStartPoint: Coordinates;

  public lineEndPoint: Coordinates;

  public arcStartPoint: Coordinates;

  public arcCentrePoint: Coordinates;

  public arcEndPoint: Coordinates;

  public arcSweepAngle: Degrees;

  private computedPath: PathVector[] = [];

  get predictedPath(): PathVector[] {
    return this.computedPath;
  }

  recomputeWithParameters(isActive: boolean, tas: Knots, gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue) {
    if (this.isFrozen) {
      return;
    }

    const termFix = this.previousLeg.getPathEndPoint();

    // FIXME fix for FX legs
    const nextFix = this.nextLeg.fix.location;

    this.radius = (gs ** 2 / (Constants.G * tan(maxBank(tas, true))) / 6997.84) * LnavConfig.TURN_RADIUS_FACTOR;

    let trackChange = MathUtils.diffAngle(
      this.previousLeg.outboundCourse,
      bearingTo(this.previousLeg.getPathEndPoint(), nextFix),
      this.nextLeg.metadata.turnDirection,
    );

    if (Math.abs(trackChange) < 3 || !Number.isFinite(trackChange)) {
      this.isNull = true;
      this.isComputed = true;

      return;
    }

    const turnDirectionSign = trackChange > 0 ? 1 : -1;
    const turnDirection = turnDirectionSign > 0 ? TurnDirection.Right : TurnDirection.Left;

    const currentRollAngle = isActive ? -SimVar.GetSimVarValue('PLANE BANK DEGREES', 'degrees') : 0;
    const rollAngleChange = Math.abs(turnDirectionSign * maxBank(tas, true) - currentRollAngle);
    const rollAnticipationDistance = getRollAnticipationDistance(gs, 0, rollAngleChange);

    let itp =
      rollAnticipationDistance >= 0.05
        ? placeBearingDistance(termFix, this.previousLeg.outboundCourse, rollAnticipationDistance)
        : termFix;
    let turnCentre = placeBearingDistance(itp, this.previousLeg.outboundCourse + turnDirectionSign * 90, this.radius);

    let distanceToFix = distanceTo(turnCentre, nextFix);

    if (distanceToFix < this.radius) {
      if (
        Math.abs(
          MathUtils.diffAngle(
            this.previousLeg.outboundCourse,
            bearingTo(termFix, nextFix),
            this.nextLeg.metadata.turnDirection,
          ),
        ) < 60
      ) {
        this.hasArc = false;
        this.lineStartPoint = termFix;
        this.lineEndPoint = termFix;
        this.terminator = this.lineEndPoint;

        this.predictedPath.length = 0;
        this.predictedPath.push({
          type: PathVectorType.Line,
          startPoint: this.lineStartPoint,
          endPoint: this.lineEndPoint,
        });

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
          this.predictedPath.push(...this.getPathDebugPoints());
        }

        this.straightCourse = bearingTo(this.lineStartPoint, this.lineEndPoint);

        this.isNull = true;
        this.isComputed = true;

        return;
      }

      const tcFixBearing = bearingTo(turnCentre, nextFix);
      const extendDist =
        Math.sqrt(
          this.radius ** 2 -
            distanceToFix ** 2 * Math.sin(((tcFixBearing - this.previousLeg.outboundCourse) * Math.PI) / 180) ** 2,
        ) +
        distanceToFix * Math.cos(((tcFixBearing - this.previousLeg.outboundCourse) * Math.PI) / 180) +
        0.3;

      itp = placeBearingDistance(itp, this.previousLeg.outboundCourse, extendDist);
      turnCentre = placeBearingDistance(turnCentre, this.previousLeg.outboundCourse, extendDist);
      distanceToFix = distanceTo(turnCentre, nextFix);
    }

    const bearingTcItp = bearingTo(turnCentre, itp);
    const bearingTcFix = bearingTo(turnCentre, nextFix);
    const angleFtpFix = acos(this.radius / distanceToFix);

    trackChange = MathUtils.diffAngle(
      bearingTcItp,
      MathUtils.diffAngle(turnDirectionSign * angleFtpFix, bearingTcFix),
      turnDirection,
    );

    const ftp = placeBearingDistance(
      turnCentre,
      this.previousLeg.outboundCourse + trackChange - 90 * turnDirectionSign,
      this.radius,
    );

    this.lineStartPoint = this.previousLeg.getPathEndPoint();
    this.lineEndPoint = itp;
    this.hasArc = true;
    this.arcStartPoint = itp;
    this.arcCentrePoint = turnCentre;
    this.arcEndPoint = ftp;
    this.arcSweepAngle = trackChange;
    this.terminator = this.arcEndPoint;

    this.predictedPath.length = 0;
    this.predictedPath.push({
      type: PathVectorType.Line,
      startPoint: this.lineStartPoint,
      endPoint: this.lineEndPoint,
    });

    this.predictedPath.push({
      type: PathVectorType.Arc,
      startPoint: this.arcStartPoint,
      centrePoint: this.arcCentrePoint,
      endPoint: this.arcEndPoint,
      sweepAngle: this.arcSweepAngle,
    });

    if (LnavConfig.DEBUG_PREDICTED_PATH) {
      this.predictedPath.push(...this.getPathDebugPoints());
    }

    this.straightCourse = bearingTo(this.lineStartPoint, this.lineEndPoint);

    this.isNull = false;
    this.isComputed = true;
  }

  private getPathDebugPoints(): PathVector[] {
    const points: PathVector[] = [];

    points.push(
      {
        type: PathVectorType.DebugPoint,
        startPoint: this.lineStartPoint,
        annotation: 'T4 RAD START',
      },
      {
        type: PathVectorType.DebugPoint,
        startPoint: this.lineEndPoint,
        annotation: 'T4 RAD END',
      },
    );

    if (this.hasArc) {
      points.push(
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.arcStartPoint,
          annotation: 'T4 ARC START',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.arcCentrePoint,
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.arcEndPoint,
          annotation: 'T4 ARC END',
        },
      );
    }

    return points;
  }

  get endsInCircularArc(): boolean {
    return this.hasArc;
  }

  isAbeam(ppos: LatLongData): boolean {
    if (this.isNull) {
      return false;
    }

    let dtg = 0;

    if (this.state === DirectToFixTransitionGuidanceState.Straight) {
      const straightDist = distanceTo(this.lineStartPoint, this.lineEndPoint);
      const straightDtg = courseToFixDistanceToGo(ppos, this.straightCourse, this.lineEndPoint);

      dtg += straightDtg;

      if (dtg - straightDist > 0.01) {
        return false;
      }
    }

    if (this.hasArc) {
      if (this.state === DirectToFixTransitionGuidanceState.Turn) {
        const arcDtg = arcDistanceToGo(ppos, this.arcStartPoint, this.arcCentrePoint, this.arcSweepAngle);

        dtg += arcDtg;
      } else {
        dtg += arcLength(this.radius, this.arcSweepAngle);
      }
    }

    return dtg > 0;
  }

  get distance(): NauticalMiles {
    if (this.isNull) {
      return 0;
    }

    const straightDistance = distanceTo(this.lineStartPoint, this.lineEndPoint);

    if (this.hasArc) {
      return straightDistance + arcLength(this.radius, this.arcSweepAngle);
    }

    return straightDistance;
  }

  getTurningPoints(): [Coordinates, Coordinates] {
    return [this.arcStartPoint, this.arcEndPoint];
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles {
    let straightDtg = 0;
    if (this.state === DirectToFixTransitionGuidanceState.Straight) {
      straightDtg = courseToFixDistanceToGo(ppos, this.straightCourse, this.lineEndPoint);
    }

    if (!this.hasArc) {
      return straightDtg;
    }

    return straightDtg + arcDistanceToGo(ppos, this.arcStartPoint, this.arcCentrePoint, this.arcSweepAngle);
  }

  getGuidanceParameters(ppos: Coordinates, trueTrack: number, tas: Knots): GuidanceParameters | null {
    let dtg: NauticalMiles;
    let params: LateralPathGuidance;

    // State machine & DTG

    switch (this.state) {
      case DirectToFixTransitionGuidanceState.Straight:
        dtg = courseToFixDistanceToGo(ppos, this.straightCourse, this.lineEndPoint);
        if (dtg <= 0 && this.hasArc) {
          this.state = DirectToFixTransitionGuidanceState.Turn;
        }
        break;
      case DirectToFixTransitionGuidanceState.Turn:
        dtg = arcDistanceToGo(ppos, this.arcStartPoint, this.arcCentrePoint, this.arcSweepAngle);
        break;
      default:
    }

    // Guidance

    switch (this.state) {
      case DirectToFixTransitionGuidanceState.Straight: {
        params = courseToFixGuidance(ppos, trueTrack, this.straightCourse, this.lineEndPoint);

        let bankNext: DegreesTrue = 0;

        if (this.hasArc) {
          bankNext = this.arcSweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, false);
        }

        const rad = getRollAnticipationDistance(tas, 0, bankNext);

        if (dtg <= rad) {
          params.phiCommand = bankNext;
        }
        break;
      }
      case DirectToFixTransitionGuidanceState.Turn:
        params = arcGuidance(ppos, trueTrack, this.arcStartPoint, this.arcCentrePoint, this.arcSweepAngle);
        // TODO next leg RAD
        break;
      default:
    }
    return params;
  }

  getNominalRollAngle(gs: Knots): Degrees {
    const gsMs = gs * (463 / 900);
    return (this.clockwise ? 1 : -1) * Math.atan(gsMs ** 2 / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
  }

  get repr(): string {
    return `DIRECT TO FIX(${this.previousLeg.repr} TO ${this.nextLeg.repr})`;
  }
}
