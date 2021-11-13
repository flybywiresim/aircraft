import { MathUtils } from '@shared/MathUtils';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { GuidanceParameters, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Geo } from '@fmgc/utils/Geo';
import { Constants } from '@shared/Constants';
import { Geometry } from '@fmgc/guidance/Geometry';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { Guidable } from '@fmgc/guidance/Guidable';
import { CILeg } from '../legs/CI';
import {
    arcDistanceToGo,
    arcGuidance,
    arcLength,
    courseToFixDistanceToGo,
    courseToFixGuidance,
    maxBank,
} from '../CommonGeometry';

type PrevLeg = CALeg | /* CDLeg | */ CFLeg | CILeg | /* CRLeg | */ DFLeg | /* FALeg | FMLeg | */ HALeg | HFLeg | HMLeg | TFLeg | /* VALeg | VILeg | VDLeg | */ VMLeg; /* | VRLeg */
type NextLeg = CFLeg | DFLeg /* | FALeg | FMLeg */

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
        super();
    }

    private terminator: Coordinates | undefined;

    getPathStartPoint(): Coordinates | undefined {
        return this.previousLeg.getPathEndPoint();
    }

    get turnDirection(): Degrees {
        return Math.sign(this.deltaTrack);
    }

    get deltaTrack(): Degrees {
        return MathUtils.fastToFixedNum(MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse), 1);
    }

    get courseVariation(): Degrees {
        // TODO reverse turn direction
        return this.deltaTrack;
    }

    public hasArc: boolean;

    public center: Coordinates;

    public radius: NauticalMiles;

    public clockwise: boolean;

    public revertedTransition: Transition | null = null;

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

    get isNull(): boolean {
        return Math.abs(this.arcSweepAngle) < 3;
    }

    recomputeWithParameters(_isActive: boolean, tas: Knots, gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        if (this.isFrozen) {
            return;
        }

        this.previousLeg = previousGuidable as PrevLeg;
        this.nextLeg = nextGuidable as NextLeg;

        const termFix = this.previousLeg.getPathEndPoint();

        // TODO revert to type 1 for CI/VI legs

        // FIXME fix for FX legs
        const nextFix = this.nextLeg.fix.infos.coordinates;

        this.radius = (gs ** 2 / (Constants.G * tan(maxBank(tas, true))) / 6997.84) * LnavConfig.TURN_RADIUS_FACTOR;

        let trackChange = MathUtils.diffAngle(this.previousLeg.outboundCourse, Geo.getGreatCircleBearing(this.previousLeg.getPathEndPoint(), nextFix), this.nextLeg.constrainedTurnDirection);
        if (Math.abs(trackChange) < 3) {
            this.revertedTransition = null;
        }

        const turnDirectionSign = trackChange > 0 ? 1 : -1;
        const turnDirection = turnDirectionSign > 0 ? TurnDirection.Right : TurnDirection.Left;

        const currentRollAngle = 0; // TODO: if active leg, current aircraft roll, else 0
        const rollAngleChange = Math.abs(turnDirectionSign * maxBank(tas, true) - currentRollAngle);
        const rollAnticipationDistance = Geometry.getRollAnticipationDistance(gs, 0, rollAngleChange);

        let itp = rollAnticipationDistance < 0.05 ? termFix
            : Geo.computeDestinationPoint(termFix, rollAnticipationDistance, this.previousLeg.outboundCourse);
        let turnCentre = Geo.computeDestinationPoint(itp, this.radius, this.previousLeg.outboundCourse + turnDirectionSign * 90);

        let distanceToFix = Geo.getDistance(turnCentre, nextFix);

        if (distanceToFix < this.radius) {
            if (Math.abs(MathUtils.diffAngle(this.previousLeg.outboundCourse, Geo.getGreatCircleBearing(termFix, nextFix), this.nextLeg.constrainedTurnDirection)) < 60) {
                this.revertedTransition = null;

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

                this.straightCourse = Geo.getGreatCircleBearing(this.lineStartPoint, this.lineEndPoint);

                this.isComputed = true;

                return;
            }

            // FIXME this is a hack... need to verify real Honeywell behaviour
            itp = Avionics.Utils.bearingDistanceToCoordinates(this.previousLeg.outboundCourse, this.radius, termFix.lat, termFix.long);
            turnCentre = Geo.computeDestinationPoint(itp, this.radius, this.previousLeg.outboundCourse + turnDirectionSign * 90);
            distanceToFix = Geo.getDistance(turnCentre, nextFix);
        }

        const bearingTcItp = Geo.getGreatCircleBearing(turnCentre, itp);
        const bearingTcFix = Geo.getGreatCircleBearing(turnCentre, nextFix);
        const angleFtpFix = acos(this.radius / distanceToFix);

        trackChange = MathUtils.diffAngle(bearingTcItp, MathUtils.diffAngle(turnDirectionSign * angleFtpFix, bearingTcFix), turnDirection);

        const ftp = Geo.computeDestinationPoint(turnCentre, this.radius, this.previousLeg.outboundCourse + trackChange - 90 * turnDirectionSign);

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

        this.straightCourse = Geo.getGreatCircleBearing(this.lineStartPoint, this.lineEndPoint);

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
        let dtg = 0;

        if (this.state === DirectToFixTransitionGuidanceState.Straight) {
            const straightDist = Geo.getDistance(this.lineStartPoint, this.lineEndPoint);
            const straightDtg = courseToFixDistanceToGo(ppos, this.straightCourse, this.lineEndPoint);

            dtg += straightDtg;

            if (dtg >= straightDist) {
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
        const straightDistance = Geo.getDistance(this.lineStartPoint, this.lineEndPoint);

        if (this.hasArc) {
            const circumference = 2 * Math.PI * this.radius;

            return straightDistance + (circumference / 360 * this.arcSweepAngle);
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
        case DirectToFixTransitionGuidanceState.Straight:
            params = courseToFixGuidance(ppos, trueTrack, this.straightCourse, this.lineEndPoint);

            let bankNext: DegreesTrue = 0;

            if (this.hasArc) {
                bankNext = this.arcSweepAngle > 0 ? maxBank(tas, true) : -maxBank(tas, false);
            }

            const rad = Geometry.getRollAnticipationDistance(tas, 0, bankNext);

            if (dtg <= rad) {
                params.phiCommand = bankNext;
            }
            break;
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
        return (this.clockwise ? 1 : -1) * Math.atan((gsMs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    get repr(): string {
        return `DIRECT TO FIX(${this.previousLeg.repr} TO ${this.nextLeg.repr})`;
    }
}
