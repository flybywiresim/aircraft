// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Transition } from '@fmgc/guidance/lnav/Transition';
import { AFLeg } from '@fmgc/guidance/lnav/legs/AF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { CILeg } from '@fmgc/guidance/lnav/legs/CI';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { arcDistanceToGo, arcGuidance, maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { bearingTo, closestSmallCircleIntersection, placeBearingDistance } from 'msfs-geo';
import { PathVector, pathVectorLength, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { FDLeg } from '@fmgc/guidance/lnav/legs/FD';
import { FALeg } from '@fmgc/guidance/lnav/legs/FA';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { CDLeg } from '../legs/CD';

export type DmeArcTransitionPreviousLeg = AFLeg | CDLeg | CFLeg | CILeg | DFLeg | FDLeg | TFLeg; /* | VILeg | VDLeg */
export type DmeArcTransitionNextLeg = AFLeg | CALeg | CFLeg | FALeg | FMLeg | TFLeg;

const tan = (input: Degrees) => Math.tan(input * (Math.PI / 180));

export class DmeArcTransition extends Transition {
  predictedPath: PathVector[] = [];

  constructor(
    public previousLeg: DmeArcTransitionPreviousLeg,
    public nextLeg: DmeArcTransitionNextLeg,
  ) {
    super(previousLeg, nextLeg);
  }

  getPathStartPoint(): Coordinates | undefined {
    return this.itp;
  }

  getPathEndPoint(): Coordinates | undefined {
    return this.ftp;
  }

  private radius: NauticalMiles | undefined;

  private itp: Coordinates | undefined;

  private centre: Coordinates | undefined;

  private ftp: Coordinates | undefined;

  private sweepAngle: Degrees | undefined;

  private clockwise: boolean | undefined;

  recomputeWithParameters(
    _isActive: boolean,
    tas: Knots,
    gs: MetresPerSecond,
    _ppos: Coordinates,
    _trueTrack: DegreesTrue,
  ) {
    if (this.isFrozen) {
      return;
    }

    this.radius = gs ** 2 / (9.81 * tan(maxBank(tas, true))) / 6080.2;

    if (this.previousLeg instanceof AFLeg) {
      const turnDirection = Math.sign(MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse));
      const nextLegReference = this.nextLeg.getPathStartPoint(); // FIXME FX legs
      const reference = placeBearingDistance(
        nextLegReference,
        this.nextLeg.inboundCourse + 90 * turnDirection,
        this.radius,
      );
      const dme = this.previousLeg.centre;

      const turnCentre = closestSmallCircleIntersection(
        dme,
        this.previousLeg.radius + this.radius * turnDirection * -this.previousLeg.turnDirectionSign,
        reference,
        this.nextLeg.inboundCourse - 180,
      );

      if (!turnCentre) {
        throw new Error('AFLeg did not intersect with previous leg offset reference');
      }

      this.centre = turnCentre;

      this.itp = placeBearingDistance(
        turnCentre,
        turnDirection * -this.previousLeg.turnDirectionSign === 1
          ? bearingTo(turnCentre, dme)
          : bearingTo(dme, turnCentre),
        this.radius,
      );
      this.ftp = placeBearingDistance(turnCentre, this.nextLeg.inboundCourse - 90 * turnDirection, this.radius);

      this.sweepAngle = MathUtils.diffAngle(bearingTo(turnCentre, this.itp), bearingTo(turnCentre, this.ftp));
      this.clockwise = this.sweepAngle > 0;

      this.predictedPath.length = 0;
      this.predictedPath.push({
        type: PathVectorType.Arc,
        startPoint: this.itp,
        centrePoint: turnCentre,
        endPoint: this.ftp,
        sweepAngle: this.sweepAngle,
      });

      this.isComputed = true;

      if (LnavConfig.DEBUG_PREDICTED_PATH) {
        this.addDebugPoints();
      }
    } else if (this.nextLeg instanceof AFLeg) {
      const inboundCourse =
        bearingTo(this.nextLeg.centre, this.previousLeg.getPathEndPoint()) + 90 * this.nextLeg.turnDirectionSign;
      const turnDirection = Math.sign(MathUtils.diffAngle(this.previousLeg.outboundCourse, inboundCourse));
      const reference = placeBearingDistance(
        this.previousLeg.getPathEndPoint(),
        this.previousLeg.outboundCourse + 90 * turnDirection,
        this.radius,
      );
      const dme = this.nextLeg.centre;

      let turnCentre;
      if (this.previousLeg instanceof XFLeg && !(this.previousLeg instanceof AFLeg)) {
        const intersection = closestSmallCircleIntersection(
          dme,
          this.nextLeg.radius + this.radius * turnDirection * -this.nextLeg.turnDirectionSign,
          reference,
          this.previousLeg.outboundCourse,
        );

        if (intersection) {
          turnCentre = intersection;

          this.itp = placeBearingDistance(
            turnCentre,
            this.previousLeg.outboundCourse - 90 * turnDirection,
            this.radius,
          );

          this.ftp = placeBearingDistance(
            turnCentre,
            turnDirection * -this.nextLeg.turnDirectionSign === 1
              ? bearingTo(turnCentre, dme)
              : bearingTo(dme, turnCentre),
            this.radius,
          );
        } else {
          this.ftp = placeBearingDistance(dme, this.nextLeg.boundaryRadial, this.nextLeg.radius);

          const turnSign = turnDirection > 0 ? 1 : -1;

          turnCentre = placeBearingDistance(
            this.ftp,
            MathUtils.normalise360(this.nextLeg.boundaryRadial + (turnSign > 0 ? 180 : 0)),
            this.radius,
          );

          this.itp = placeBearingDistance(
            turnCentre,
            MathUtils.normalise360(this.previousLeg.outboundCourse - turnSign * 90),
            this.radius,
          );
        }
      } else {
        turnCentre = closestSmallCircleIntersection(
          dme,
          this.nextLeg.radius + this.radius * turnDirection * -this.nextLeg.turnDirectionSign,
          reference,
          this.previousLeg.outboundCourse,
        );

        if (!turnCentre) {
          throw new Error('AFLeg did not intersect with previous leg offset reference');
        }

        this.itp = placeBearingDistance(turnCentre, this.previousLeg.outboundCourse - 90 * turnDirection, this.radius);

        this.ftp = placeBearingDistance(
          turnCentre,
          turnDirection * -this.nextLeg.turnDirectionSign === 1
            ? bearingTo(turnCentre, dme)
            : bearingTo(dme, turnCentre),
          this.radius,
        );
      }

      this.centre = turnCentre;

      this.sweepAngle = MathUtils.diffAngle(bearingTo(turnCentre, this.itp), bearingTo(turnCentre, this.ftp));
      this.clockwise = this.sweepAngle > 0;

      this.predictedPath.length = 0;
      this.predictedPath.push({
        type: PathVectorType.Arc,
        startPoint: this.itp,
        centrePoint: turnCentre,
        endPoint: this.ftp,
        sweepAngle: this.sweepAngle,
      });

      this.isComputed = true;

      if (LnavConfig.DEBUG_PREDICTED_PATH) {
        this.predictedPath.push({
          type: PathVectorType.DebugPoint,
          startPoint: reference,
          annotation: 'DME TRANS REF',
        });
        this.addDebugPoints();
      }
    }
  }

  private addDebugPoints() {
    if (this.itp && this.centre && this.ftp) {
      this.predictedPath.push(
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.itp,
          annotation: 'DME TRANS ITP',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.centre,
          annotation: 'DME TRANS C',
        },
        {
          type: PathVectorType.DebugPoint,
          startPoint: this.ftp,
          annotation: 'DME TRANS FTP',
        },
      );
    }
  }

  getTurningPoints(): [Coordinates, Coordinates] {
    return [this.itp, this.ftp];
  }

  get distance(): NauticalMiles {
    return pathVectorLength(this.predictedPath[0]); // FIXME HAX
  }

  get startsInCircularArc(): boolean {
    return true;
  }

  get endsInCircularArc(): boolean {
    return true;
  }

  getNominalRollAngle(gs: MetresPerSecond): Degrees | undefined {
    const gsMs = gs * (463 / 900);
    return (this.clockwise ? 1 : -1) * Math.atan(gsMs ** 2 / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
  }

  getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | undefined {
    return arcGuidance(ppos, trueTrack, this.getPathStartPoint(), this.centre, this.sweepAngle);
  }

  getDistanceToGo(ppos: Coordinates): NauticalMiles | undefined {
    return arcDistanceToGo(ppos, this.getPathStartPoint(), this.centre, this.sweepAngle);
  }

  isAbeam(ppos: Coordinates): boolean {
    const turningPoints = this.getTurningPoints();
    if (!turningPoints) {
      return false;
    }

    const [inbound, outbound] = turningPoints;

    const inBearingAc = bearingTo(inbound, ppos);
    const inHeadingAc = Math.abs(MathUtils.diffAngle(this.previousLeg.outboundCourse, inBearingAc));

    const outBearingAc = bearingTo(outbound, ppos);
    const outHeadingAc = Math.abs(MathUtils.diffAngle(this.nextLeg.inboundCourse, outBearingAc));

    return inHeadingAc <= 90 && outHeadingAc >= 90;
  }

  get repr(): string {
    return `DME(${this.previousLeg.repr}, ${this.nextLeg.repr})`;
  }
}
