import { MathUtils } from '@shared/MathUtils';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Constants } from '@shared/Constants';
import { Geo } from '@fmgc/utils/Geo';
import { PathVector, PathVectorType } from '@fmgc/guidance/lnav/PathVector';
import { Guidable } from '@fmgc/guidance/Guidable';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { arcDistanceToGo, maxBank } from '../CommonGeometry';
import { CFLeg } from '../legs/CF';
import { CRLeg } from '../legs/CR';
import { CILeg } from '../legs/CI';

type PrevLeg = /* AFLeg | */ CALeg | /* CDLeg | */ CFLeg | CRLeg | DFLeg | /* | FALeg | FMLeg | */ HALeg | HFLeg | HMLeg | RFLeg | TFLeg | /* VALeg | VDLeg | */ VMLeg;
type NextLeg = CALeg | /* CDLeg | */ CILeg | CRLeg | /* VALeg | VDLeg | VILeg | */ VMLeg;

const tan = (input: Degrees) => Math.tan(input * (Math.PI / 180));

/**
 * A type I transition uses a fixed turn radius between two fix-referenced legs.
 */
export class CourseCaptureTransition extends Transition {
    constructor(
        previousLeg: PrevLeg,
        nextLeg: NextLeg | TFLeg, // FIXME temporary
    ) {
        super();
        this.previousLeg = previousLeg;
        this.nextLeg = nextLeg;
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
        return MathUtils.fastToFixedNum(MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse), 1);
    }

    get courseVariation(): Degrees {
        return MathUtils.adjustAngleForTurnDirection(this.deltaTrack, this.nextLeg.constrainedTurnDirection);
    }

    public isArc: boolean;

    public startPoint: Coordinates;

    public endPoint: Coordinates;

    public center: Coordinates;

    public sweepAngle: Degrees;

    public radius: NauticalMiles;

    public clockwise: boolean;

    public predictedPath: PathVector[] = [];

    recomputeWithParameters(_isActive: boolean, tas: Knots, gs: Knots, ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.previousLeg = previousGuidable as PrevLeg;
        this.nextLeg = nextGuidable as NextLeg;

        const termFix = this.previousLeg.getPathEndPoint();

        let courseChange;
        let initialTurningPoint;
        if (!previousGuidable) {
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
        const radius = ((gs ** 2 / (Constants.G * tan(Math.abs(maxBank(tas, false))))) / 6997.84) * LnavConfig.TURN_RADIUS_FACTOR;
        const turnCenter = Geo.computeDestinationPoint(initialTurningPoint, radius, this.previousLeg.outboundCourse + 90 * Math.sign(courseChange));
        const finalTurningPoint = Geo.computeDestinationPoint(turnCenter, radius, this.previousLeg.outboundCourse - 90 * Math.sign(courseChange) + courseChange);

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

            return;
        }

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
        const [inbound, outbound] = this.getTurningPoints();

        const inBearingAc = Avionics.Utils.computeGreatCircleHeading(inbound, ppos);
        const inHeadingAc = Math.abs(MathUtils.diffAngle(this.previousLeg.outboundCourse, inBearingAc));

        const outBearingAc = Avionics.Utils.computeGreatCircleHeading(outbound, ppos);
        const outHeadingAc = Math.abs(MathUtils.diffAngle(this.nextLeg.inboundCourse, outBearingAc));

        return inHeadingAc <= 90 && outHeadingAc >= 90;
    }

    get distance(): NauticalMiles {
        const circumference = 2 * Math.PI * this.radius;
        return circumference / 360 * this.angle;
    }

    getTurningPoints(): [Coordinates, Coordinates] {
        return [this.startPoint, this.endPoint];
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        const [itp] = this.getTurningPoints();

        return arcDistanceToGo(ppos, itp, this.center, this.clockwise ? this.angle : -this.angle);
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number, tas: Knots): GuidanceParameters | null {
        // FIXME PPOS guidance and all...
        return this.nextLeg.getGuidanceParameters(ppos, trueTrack, tas);
    }

    getNominalRollAngle(gs: Knots): Degrees {
        const gsMs = gs * (463 / 900);
        return (this.clockwise ? 1 : -1) * Math.atan((gsMs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    get repr(): string {
        return `COURSE CAPTURE(${this.previousLeg.repr} TO ${this.nextLeg.repr})`;
    }
}
