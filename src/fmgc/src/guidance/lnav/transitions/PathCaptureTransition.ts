import { MathUtils } from '@shared/MathUtils';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Geo } from '@fmgc/utils/Geo';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { CourseChange } from '@fmgc/guidance/lnav/transitions/utilss/CourseChange';
import { Constants } from '@shared/Constants';
import { Guidable } from '@fmgc/guidance/Guidable';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { Leg } from '../legs/Leg';
import { CFLeg } from '../legs/CF';

export type PrevLeg = CALeg | /* CDLeg | CRLeg | FALeg | */ HALeg | HFLeg | HMLeg;
export type NextLeg = /* AFLeg | */ CFLeg | /* FALeg | */ TFLeg;

const cos = (input: Degrees) => Math.cos(input * (Math.PI / 180));
const tan = (input: Degrees) => Math.tan(input * MathUtils.DEGREES_TO_RADIANS);

const compareTurnDirections = (sign: number, data: TurnDirection) => {
    if ((data === TurnDirection.Left || data === TurnDirection.Right) && (sign === -1 || sign === 1)) {
        return (data === TurnDirection.Left && sign === -1) || (data === TurnDirection.Right && sign === 1);
    }
    return true;
};

/**
 * A type II transition
 */
export class PathCaptureTransition extends Transition {
    constructor(
        public previousLeg: PrevLeg | CFLeg | TFLeg, // FIXME temproary
        public nextLeg: NextLeg,
    ) {
        super();
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.previousLeg.getPathEndPoint();
    }

    get turnDirection(): TurnDirection {
        return this.nextLeg instanceof XFLeg ? this.nextLeg.fix.turnDirection : TurnDirection.Either;
    }

    get deltaTrack(): Degrees {
        return MathUtils.fastToFixedNum(MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse), 1);
    }

    get courseVariation(): Degrees {
        // TODO reverse turn direction
        return this.deltaTrack;
    }

    public predictedPath: PathVector[] = [];

    private itp: Coordinates;

    private ftp: Coordinates;

    recomputeWithParameters(isActive: boolean, tas: Knots, gs: MetresPerSecond, ppos: Coordinates, trueTrack: DegreesTrue, previousGuidable: Guidable) {
        if (this.isFrozen) {
            return;
        }

        if (!(previousGuidable instanceof Leg)) {
            throw new Error('[FMS/Geometry/PathCapture] previousGuidable must be a leg');
        }

        const targetTrack = previousGuidable.outboundCourse;

        const naturalTurnDirectionSign = Math.sign(MathUtils.diffAngle(targetTrack, this.nextLeg.inboundCourse));
        const constrainedTurnDirection = this.nextLeg instanceof XFLeg ? this.nextLeg.fix.turnDirection : TurnDirection.Unknown;

        const initialTurningPoint = this.previousLeg.getPathEndPoint();
        const distanceFromItp: NauticalMiles = Geo.distanceToLeg(initialTurningPoint, this.nextLeg);
        const deltaTrack: Degrees = MathUtils.diffAngle(targetTrack, this.nextLeg.inboundCourse, constrainedTurnDirection);

        this.predictedPath.length = 0;

        if (Math.abs(deltaTrack) < 3 && distanceFromItp < 0.1) {
            this.predictedPath.push({
                type: PathVectorType.Line,
                startPoint: this.previousLeg.getPathEndPoint(),
                endPoint: this.previousLeg.getPathEndPoint(),
            });

            return;
        }

        if (Math.abs(deltaTrack) > 42 && Math.abs(deltaTrack) < 48 && distanceFromItp > 0.01) {
            this.predictedPath.push({
                type: PathVectorType.Line,
                startPoint: this.previousLeg.getPathEndPoint(),
                endPoint: Geo.legIntercept(this.previousLeg.getPathEndPoint(), this.previousLeg.outboundCourse, this.nextLeg),
            });

            return;
        }

        let turnDirection = Math.sign(deltaTrack);

        // Theta variable should be stored based on turn direction and max roll, but it is only used once in an absolute sense, so it is useless
        const radius = (gs ** 2 / (Constants.G * tan(maxBank(tas, true))) / 6080.2);
        const distanceLimit = radius * cos(48);

        // TODO: Turn center is slightly off for some reason, fix
        let turnCenter = Geo.computeDestinationPoint(initialTurningPoint, radius, targetTrack + turnDirection * 90);
        let turnCenterDistance = Math.sign(MathUtils.diffAngle(Geo.getGreatCircleBearing(turnCenter, this.nextLeg.getPathEndPoint()), this.nextLeg.outboundCourse))
            * Geo.distanceToLeg(turnCenter, this.nextLeg);

        let courseChange;
        if (Math.abs(deltaTrack) < 45) {
            if ((deltaTrack > 0 && turnCenterDistance >= radius) || (deltaTrack < 0 && turnCenterDistance <= -radius)) {
                turnCenter = Geo.computeDestinationPoint(initialTurningPoint, radius, targetTrack - turnDirection * 90);
                turnDirection = -turnDirection;
                // Turn direction is to be flipped, FBW-22-05
                turnCenterDistance = Math.sign(MathUtils.diffAngle(Geo.getGreatCircleBearing(turnCenter, this.nextLeg.getPathEndPoint()), this.nextLeg.outboundCourse))
                    * Geo.distanceToLeg(turnCenter, this.nextLeg);
                courseChange = CourseChange.acuteFar(turnDirection, turnCenterDistance, deltaTrack);
            } else {
                courseChange = CourseChange.acuteNear(turnDirection, turnCenterDistance, deltaTrack);
            }
        } else if (Math.abs(deltaTrack) >= 45 && !compareTurnDirections(turnDirection, constrainedTurnDirection)) {
            turnCenter = Geo.computeDestinationPoint(initialTurningPoint, radius, targetTrack - turnDirection * 90);
            turnDirection = -turnDirection;
            turnCenterDistance = Math.sign(MathUtils.diffAngle(Geo.getGreatCircleBearing(turnCenter, this.nextLeg.getPathEndPoint()), this.nextLeg.outboundCourse))
                * Geo.distanceToLeg(turnCenter, this.nextLeg);
        }

        // Omit 45 degree intercept segment if possible
        const turnCenterOnOtherSide = (deltaTrack >= 0 && turnCenterDistance >= 0) || (deltaTrack < 0 && turnCenterDistance < 0);

        if (turnCenterOnOtherSide && distanceLimit <= Math.abs(turnCenterDistance) && Math.abs(turnCenterDistance) < radius) {
            const intercept = Geo.placeBearingPlaceDistanceIntercept(this.nextLeg.getPathEndPoint(), turnCenter, this.nextLeg.outboundCourse + 180, radius);

            this.itp = initialTurningPoint;
            this.ftp = intercept;

            this.predictedPath.push({
                type: PathVectorType.Arc,
                startPoint: initialTurningPoint,
                endPoint: intercept,
                centrePoint: turnCenter,
                sweepAngle: Math.abs(deltaTrack) * turnDirection,
            });

            if (LnavConfig.DEBUG_PREDICTED_PATH) {
                this.predictedPath.push(
                    {
                        type: PathVectorType.DebugPoint,
                        startPoint: initialTurningPoint,
                        annotation: 'PATH CAPTURE ARC START',
                    },
                    {
                        type: PathVectorType.DebugPoint,
                        startPoint: turnCenter,
                        annotation: 'PATH CAPTURE CENTRE',
                    },
                    {
                        type: PathVectorType.DebugPoint,
                        startPoint: intercept,
                        annotation: 'PATH CAPTURE INTCPT',
                    },
                );
            }

            this.isComputed = true;

            return;
        }

        if (Math.abs(deltaTrack) < 45) {
            if ((deltaTrack > 0 && turnCenterDistance >= radius) || (deltaTrack < 0 && turnCenterDistance <= -radius)) {
                courseChange = CourseChange.acuteFar(turnDirection, turnCenterDistance, deltaTrack);
            } else {
                courseChange = CourseChange.acuteNear(turnDirection, turnCenterDistance, deltaTrack);
            }
        } else {
            const isReverse = !compareTurnDirections(naturalTurnDirectionSign, constrainedTurnDirection);

            if (isReverse) {
                courseChange = CourseChange.reverse(turnDirection, turnCenterDistance, deltaTrack, radius);
            } else {
                courseChange = CourseChange.normal(turnDirection, turnCenterDistance, deltaTrack, radius);
            }
        }

        const finalTurningPoint = Geo.computeDestinationPoint(turnCenter, radius, targetTrack + courseChange - 90 * turnDirection);
        const interceptPoint = Geo.legIntercept(finalTurningPoint, targetTrack + courseChange, this.nextLeg);

        this.itp = initialTurningPoint;
        this.ftp = finalTurningPoint;

        this.isComputed = true;

        this.predictedPath.push(
            {
                type: PathVectorType.Arc,
                startPoint: initialTurningPoint,
                endPoint: finalTurningPoint,
                centrePoint: turnCenter,
                sweepAngle: courseChange,
            },
            {
                type: PathVectorType.Line,
                startPoint: finalTurningPoint,
                endPoint: interceptPoint,
            },
        );

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.predictedPath.push(
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: initialTurningPoint,
                    annotation: 'PATH CAPTURE ARC START',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: turnCenter,
                    annotation: 'PATH CAPTURE CENTRE',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: finalTurningPoint,
                    annotation: 'PATH CAPTURE ARC EMD',
                },
                {
                    type: PathVectorType.DebugPoint,
                    startPoint: interceptPoint,
                    annotation: 'PATH CAPTURE INTCPT',
                },
            );
        }
    }

    get isCircularArc(): boolean {
        return false;
    }

    isAbeam(_ppos: LatLongData): boolean {
        return false;
    }

    get distance(): NauticalMiles {
        return 1;
    }

    getTurningPoints(): [Coordinates, Coordinates] {
        return [this.itp, this.ftp];
    }

    getDistanceToGo(_ppos: LatLongData): NauticalMiles {
        return 1;
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number, _tas: Knots): GuidanceParameters | null {
        return this.nextLeg.getGuidanceParameters(ppos, trueTrack);
    }

    getPseudoWaypointLocation(_distanceBeforeTerminator: NauticalMiles): Coordinates | undefined {
        return this.itp;
    }

    getNominalRollAngle(_gs: Knots): Degrees {
        return 0;
    }

    get repr(): string {
        return `PATH CAPTURE(${this.previousLeg.repr} TO ${this.nextLeg.repr})`;
    }
}
