import { MathUtils } from '@shared/MathUtils';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { CILeg } from '@fmgc/guidance/lnav/legs/CI';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
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
import { arcLength, maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { ControlLaw } from '@shared/autopilot';
import { Leg } from '../legs/Leg';
import { CFLeg } from '../legs/CF';
import { CRLeg } from '../legs/CR';

export type PrevLeg = CALeg | /* CDLeg | */ CRLeg | /* FALeg | */ HALeg | HFLeg | HMLeg;
export type ReversionLeg = CFLeg | CILeg | DFLeg | TFLeg;
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
        public previousLeg: PrevLeg | ReversionLeg,
        public nextLeg: NextLeg,
    ) {
        super();
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.previousLeg.getPathEndPoint();
    }

    get turnDirection(): TurnDirection {
        return this.nextLeg.constrainedTurnDirection;
    }

    get deltaTrack(): Degrees {
        return MathUtils.fastToFixedNum(MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse), 1);
    }

    public predictedPath: PathVector[] = [];

    private itp: Coordinates;

    private ftp: Coordinates;

    private forcedTurnRequired = false;

    private forcedTurnComplete = false;

    recomputeWithParameters(_isActive: boolean, tas: Knots, gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        if (this.isFrozen) {
            return;
        }

        this.previousLeg = previousGuidable as PrevLeg;
        this.nextLeg = nextGuidable as NextLeg;

        if (!(previousGuidable instanceof Leg)) {
            throw new Error('[FMS/Geometry/PathCapture] previousGuidable must be a leg');
        }

        const targetTrack = previousGuidable.outboundCourse;

        const naturalTurnDirectionSign = Math.sign(MathUtils.diffAngle(targetTrack, this.nextLeg.inboundCourse));

        const initialTurningPoint = this.previousLeg.getPathEndPoint();
        const distanceFromItp: NauticalMiles = Geo.distanceToLeg(initialTurningPoint, this.nextLeg);
        const deltaTrack: Degrees = MathUtils.diffAngle(targetTrack, this.nextLeg.inboundCourse, this.nextLeg.constrainedTurnDirection);

        this.predictedPath.length = 0;

        this.forcedTurnRequired = Math.abs(deltaTrack) > 130;

        if (Math.abs(deltaTrack) < 3 && distanceFromItp < 0.1) {
            this.predictedPath.push({
                type: PathVectorType.Line,
                startPoint: this.previousLeg.getPathEndPoint(),
                endPoint: this.previousLeg.getPathEndPoint(),
            });

            this.distance = 0;

            this.isComputed = true;

            return;
        }

        if (Math.abs(deltaTrack) > 42 && Math.abs(deltaTrack) < 48 && distanceFromItp > 0.01) {
            const intercept = Geo.legIntercept(this.previousLeg.getPathEndPoint(), this.previousLeg.outboundCourse, this.nextLeg);

            this.predictedPath.push({
                type: PathVectorType.Line,
                startPoint: this.previousLeg.getPathEndPoint(),
                endPoint: intercept,
            });

            if (LnavConfig.DEBUG_PREDICTED_PATH) {
                this.predictedPath.push(
                    {
                        type: PathVectorType.DebugPoint,
                        startPoint: this.previousLeg.getPathEndPoint(),
                        annotation: 'PATH CAPTURE START',
                    },
                    {
                        type: PathVectorType.DebugPoint,
                        startPoint: intercept,
                        annotation: 'PATH CAPTURE INTCPT',
                    },
                );
            }

            this.distance = Avionics.Utils.computeGreatCircleDistance(this.previousLeg.getPathEndPoint(), intercept);

            this.isComputed = true;

            return;
        }

        let turnDirection = Math.sign(deltaTrack);

        // Theta variable should be stored based on turn direction and max roll, but it is only used once in an absolute sense, so it is useless
        const radius = (gs ** 2 / (Constants.G * tan(maxBank(tas, true)) * 6997.84)) * LnavConfig.TURN_RADIUS_FACTOR;
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
        } else if (Math.abs(deltaTrack) >= 45 && !compareTurnDirections(turnDirection, this.nextLeg.constrainedTurnDirection)) {
            turnCenter = Geo.computeDestinationPoint(initialTurningPoint, radius, targetTrack - turnDirection * 90);
            turnDirection = -turnDirection;
            turnCenterDistance = Math.sign(MathUtils.diffAngle(Geo.getGreatCircleBearing(turnCenter, this.nextLeg.getPathEndPoint()), this.nextLeg.outboundCourse))
                * Geo.distanceToLeg(turnCenter, this.nextLeg);
        }

        // Omit 45 degree intercept segment if possible
        const turnCenterOnOtherSide = (deltaTrack >= 0 && turnCenterDistance >= 0) || (deltaTrack < 0 && turnCenterDistance < 0);

        if (turnCenterOnOtherSide && distanceLimit <= Math.abs(turnCenterDistance) && Math.abs(turnCenterDistance) < radius) {
            const intercept = Geo.placeBearingPlaceDistanceIntercept(this.nextLeg.getPathEndPoint(), turnCenter, this.nextLeg.outboundCourse + 180, radius);

            if (!Number.isNaN(intercept.lat)) {
                this.itp = initialTurningPoint;
                this.ftp = intercept;

                this.predictedPath.push({
                    type: PathVectorType.Arc,
                    startPoint: initialTurningPoint,
                    endPoint: intercept,
                    centrePoint: turnCenter,
                    sweepAngle: Math.abs(deltaTrack) * turnDirection,
                });

                this.distance = arcLength(radius, Math.abs(deltaTrack) * turnDirection);

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
        }

        if (Math.abs(deltaTrack) < 45) {
            if ((deltaTrack > 0 && turnCenterDistance >= radius) || (deltaTrack < 0 && turnCenterDistance <= -radius)) {
                courseChange = CourseChange.acuteFar(turnDirection, turnCenterDistance, deltaTrack);
            } else {
                courseChange = CourseChange.acuteNear(turnDirection, turnCenterDistance, deltaTrack);
            }
        } else {
            const isReverse = !compareTurnDirections(naturalTurnDirectionSign, this.nextLeg.constrainedTurnDirection);

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

        this.distance = arcLength(radius, courseChange) + Avionics.Utils.computeGreatCircleDistance(finalTurningPoint, interceptPoint);

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

    get startsInCircularArc(): boolean {
        return false; // We don't want to do RAD for path captures
    }

    get endsInCircularArc(): boolean {
        return false; // We don't want to do RAD for path captures
    }

    isAbeam(ppos: LatLongData): boolean {
        return this.forcedTurnRequired && !this.forcedTurnComplete && this.previousLeg.getDistanceToGo(ppos) <= 0;
    }

    distance = 0;

    getTurningPoints(): [Coordinates, Coordinates] {
        return [this.itp, this.ftp];
    }

    getDistanceToGo(_ppos: LatLongData): NauticalMiles {
        return 1;
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number, tas: Knots): GuidanceParameters | null {
        if (this.forcedTurnRequired) {
            const turnSign = this.nextLeg.constrainedTurnDirection === TurnDirection.Left ? -1 : 1;
            let trackAngleError = this.nextLeg.inboundCourse - trueTrack;
            if (turnSign !== Math.sign(trackAngleError)) {
                trackAngleError += turnSign * 360;
            }
            if (Math.abs(trackAngleError) > 130) {
                const phiCommand = turnSign * maxBank(tas, true);
                return {
                    law: ControlLaw.LATERAL_PATH,
                    trackAngleError: 0,
                    phiCommand,
                    crossTrackError: 0,
                };
            }
            this.forcedTurnComplete = true;
        }

        return this.nextLeg.getGuidanceParameters(ppos, trueTrack);
    }

    getNominalRollAngle(_gs: Knots): Degrees {
        return 0;
    }

    get repr(): string {
        return `PATH CAPTURE(${this.previousLeg.repr} TO ${this.nextLeg.repr})`;
    }
}
