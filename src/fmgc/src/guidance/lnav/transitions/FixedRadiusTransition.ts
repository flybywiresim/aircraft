import { MathUtils } from '@shared/MathUtils';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { arcDistanceToGo, arcGuidance } from '../CommonGeometry';
import { PathVector, PathVectorType } from '../PathVector';
import { CFLeg } from '../legs/CF';

export type Type1PreviousLeg = CFLeg | DFLeg | TFLeg;
export type Type1NextLeg = CFLeg | /* FALeg | FMLeg | PILeg | */ TFLeg;

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

/**
 * A type I transition uses a fixed turn radius between two fix-referenced legs.
 */
export class FixedRadiusTransition extends Transition {
    public radius: NauticalMiles;

    public clockwise: boolean;

    public isFrozen: boolean = false;

    private computedPath: PathVector[] = [];

    private sweepAngle: Degrees;

    private centre: Coordinates | undefined = undefined;

    constructor(
        public previousLeg: Type1PreviousLeg, // FIXME temporary
        public nextLeg: Type1NextLeg, // FIXME temporary
    ) {
        super();
    }

    getPathStartPoint(): Coordinates | undefined {
        if (this.isComputed) {
            return this.turningPoints[0];
        }

        throw Error('?');
    }

    getPathEndPoint(): Coordinates | undefined {
        if (this.isComputed) {
            return this.turningPoints[1];
        }

        throw Error('?');
    }

    get isNull(): boolean {
        return Math.abs(Avionics.Utils.diffAngle(
            this.previousLeg.outboundCourse,
            this.nextLeg.inboundCourse,
        )) <= 3;
    }

    recomputeWithParameters(_isActive: boolean, tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, _previousGuidable: Guidable, _nextGuidable: Guidable) {
        if (this.isFrozen) {
            if (DEBUG) {
                console.log('[FMS/Geometry] Not recomputing Type I transition as it is frozen.');
            }
            return;
        }

        const courseChange = mod(this.nextLeg.inboundCourse - this.previousLeg.outboundCourse + 180, 360) - 180;

        // Sweep angle
        this.sweepAngle = MathUtils.diffAngle(this.previousLeg.outboundCourse, this.nextLeg.inboundCourse);

        // Always at least 5 degrees turn
        const minBankAngle = 5;

        // Start with half the track change
        const bankAngle = Math.abs(courseChange) / 2;

        // Bank angle limits, always assume limit 2 for now @ 25 degrees between 150 and 300 knots
        let maxBankAngle = 25;
        if (tas < 150) {
            maxBankAngle = 15 + Math.min(tas / 150, 1) * (25 - 15);
        } else if (tas > 300) {
            maxBankAngle = 25 - Math.min((tas - 300) / 150, 1) * (25 - 19);
        }

        const finalBankAngle = Math.max(Math.min(bankAngle, maxBankAngle), minBankAngle);

        // Turn radius
        this.radius = (tas ** 2 / (9.81 * Math.tan(finalBankAngle * Avionics.Utils.DEG2RAD))) / 6080.2;

        // Turn direction
        this.clockwise = courseChange >= 0;

        // Turning points
        this.turningPoints = this.computeTurningPoints();

        this.computedPath.length = 0;
        this.computedPath.push(
            {
                type: PathVectorType.Arc,
                startPoint: this.getTurningPoints()[0],
                centrePoint: this.centre,
                endPoint: this.getTurningPoints()[1],
                sweepAngle: this.sweepAngle,
            },
        );

        this.isComputed = true;
    }

    get isCircularArc(): boolean {
        return true;
    }

    isAbeam(ppos: LatLongData): boolean {
        const turningPoints = this.getTurningPoints();
        if (!turningPoints) {
            return false;
        }

        const [inbound, outbound] = turningPoints;

        const inBearingAc = Avionics.Utils.computeGreatCircleHeading(inbound, ppos);
        const inHeadingAc = Math.abs(MathUtils.diffAngle(this.previousLeg.outboundCourse, inBearingAc));

        const outBearingAc = Avionics.Utils.computeGreatCircleHeading(outbound, ppos);
        const outHeadingAc = Math.abs(MathUtils.diffAngle(this.nextLeg.inboundCourse, outBearingAc));

        return inHeadingAc <= 90 && outHeadingAc >= 90;
    }

    get distance(): NauticalMiles {
        const circumference = 2 * Math.PI * this.radius;
        return circumference / 360 * Math.abs(this.sweepAngle);
    }

    /**
     * Returns the distance between the inbound turning point and the reference fix
     */
    get unflownDistance() {
        if (!this.getTurningPoints()) {
            return 0;
        }
        return Avionics.Utils.computeGreatCircleDistance(
            this.previousLeg.getPathEndPoint(),
            this.getTurningPoints()[0],
        );
    }

    private turningPoints;

    private computeTurningPoints(): [LatLongAlt, LatLongAlt] {
        const tad = this.radius * Math.tan(Math.abs(this.sweepAngle / 2) * Avionics.Utils.DEG2RAD);

        const { lat, long } = this.previousLeg.fix.infos.coordinates;

        const inbound = Avionics.Utils.bearingDistanceToCoordinates(
            mod(this.previousLeg.outboundCourse + 180, 360),
            tad,
            lat,
            long,
        );

        const outbound = Avionics.Utils.bearingDistanceToCoordinates(
            this.nextLeg.inboundCourse,
            tad,
            lat,
            long,
        );

        this.centre = Avionics.Utils.bearingDistanceToCoordinates(
            Avionics.Utils.clampAngle(this.previousLeg.outboundCourse + (this.clockwise ? 90 : -90)),
            this.radius,
            inbound.lat,
            inbound.long,
        );

        return [inbound, outbound];
    }

    getTurningPoints(): [LatLongAlt, LatLongAlt] | undefined {
        return this.turningPoints;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    getDistanceToGo(ppos: Coordinates): NauticalMiles {
        const [itp] = this.getTurningPoints();

        return arcDistanceToGo(ppos, itp, this.centre, this.sweepAngle);
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number): GuidanceParameters | null {
        const [itp] = this.getTurningPoints();

        return arcGuidance(ppos, trueTrack, itp, this.centre, this.sweepAngle);
    }

    getPseudoWaypointLocation(distanceBeforeTerminator: NauticalMiles): LatLongData | undefined {
        const distanceRatio = distanceBeforeTerminator / this.distance;
        const angleFromTerminator = distanceRatio * Math.abs(this.sweepAngle);

        const centerToTerminationBearing = Avionics.Utils.computeGreatCircleHeading(this.centre, this.getTurningPoints()[1]);

        return Avionics.Utils.bearingDistanceToCoordinates(
            Avionics.Utils.clampAngle(centerToTerminationBearing + (this.clockwise ? -angleFromTerminator : angleFromTerminator)),
            this.radius,
            this.centre.lat,
            this.centre.long,
        );
    }

    getNominalRollAngle(gs: Knots): Degrees {
        return (this.clockwise ? 1 : -1) * Math.atan((gs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    get repr(): string {
        return `TYPE1(${this.previousLeg.repr} TO ${this.nextLeg.repr})`;
    }
}
