import { Degrees, NauticalMiles } from '@typings/types';
import { MathUtils } from '@shared/MathUtils';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

/**
 * A type I transition uses a fixed turn radius between two fix-referenced legs.
 */
 export class Type1Transition extends Transition {
    public previousLeg: TFLeg;

    public nextLeg: TFLeg | VMLeg;

    public radius: NauticalMiles;

    public clockwise: boolean;

    constructor(
        previousLeg: TFLeg,
        nextLeg: TFLeg | VMLeg, // FIXME this cannot happen, but what are you gonna do about it ?,
    ) {
        super();
        this.previousLeg = previousLeg;
        this.nextLeg = nextLeg;

        const kts = Math.max(SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots'), 150); // knots, i.e. nautical miles per hour

        const courseChange = mod(nextLeg.bearing - previousLeg.bearing + 180, 360) - 180;

        // Always at least 5 degrees turn
        const minBankAngle = 5;

        // Start with half the track change
        const bankAngle = Math.abs(courseChange) / 2

        // Bank angle limits, always assume limit 2 for now @ 25 degrees between 150 and 300 knots
        let maxBankAngle = 25;
        if (kts < 150) {
            maxBankAngle = 15 + Math.min(kts / 150, 1) * (25 - 15);
        } else if (kts > 300) {
            maxBankAngle = 25 - Math.min((kts - 300) / 150, 1) * (25 - 19);
        }

        const finalBankAngle = Math.max(Math.min(bankAngle, maxBankAngle), minBankAngle);

        // Turn radius
        this.radius = (kts ** 2 / (9.81 * Math.tan(finalBankAngle * Avionics.Utils.DEG2RAD))) / 6080.2;

        // Turn direction
        this.clockwise = courseChange >= 0;
    }

    get isCircularArc(): boolean {
        return true;
    }

    get angle(): Degrees {
        const bearingFrom = this.previousLeg.bearing;
        const bearingTo = this.nextLeg.bearing;
        return Math.abs(MathUtils.diffAngle(bearingFrom, bearingTo));
    }

    /**
     * Returns the center of the turning circle, with radius distance from both
     * legs, i.e. min_distance(previous, center) = min_distance(next, center) = radius.
     */
    get center(): LatLongAlt {
        const bisecting = (180 - this.angle) / 2;
        const distanceCenterToWaypoint = this.radius / Math.sin(bisecting * Avionics.Utils.DEG2RAD);

        const { lat, long } = this.previousLeg.to.infos.coordinates.toLatLong();

        const inboundReciprocal = mod(this.previousLeg.bearing + 180, 360);

        return Avionics.Utils.bearingDistanceToCoordinates(
            mod(inboundReciprocal + (this.clockwise ? -bisecting : bisecting), 360),
            distanceCenterToWaypoint,
            lat,
            long,
        );
    }

    isAbeam(ppos: LatLongAlt): boolean {
        const [inbound] = this.getTurningPoints();

        const bearingAC = Avionics.Utils.computeGreatCircleHeading(inbound, ppos);
        const headingAC = Math.abs(MathUtils.diffAngle(this.previousLeg.bearing, bearingAC));
        return headingAC <= 90;
    }

    get distance(): NauticalMiles {
        const circumference = 2 * Math.PI * this.radius;
        return circumference / 360 * this.angle;
    }

    getTurningPoints(): [LatLongAlt, LatLongAlt] {
        const bisecting = (180 - this.angle) / 2;
        const distanceTurningPointToWaypoint = this.radius / Math.tan(bisecting * Avionics.Utils.DEG2RAD);

        const { lat, long } = this.previousLeg.to.infos.coordinates.toLatLong();

        const inbound = Avionics.Utils.bearingDistanceToCoordinates(
            mod(this.previousLeg.bearing + 180, 360),
            distanceTurningPointToWaypoint,
            lat,
            long,
        );
        const outbound = Avionics.Utils.bearingDistanceToCoordinates(
            this.nextLeg.bearing,
            distanceTurningPointToWaypoint,
            lat,
            long,
        );

        return [inbound, outbound];
    }

    /**
     * Returns the distance to the termination point
     *
     * @param _ppos
     */
    getDistanceToGo(_ppos: LatLongAlt): NauticalMiles {
        return 0;
    }

    getTrackDistanceToTerminationPoint(ppos: LatLongAlt): NauticalMiles {
        // In order to make the angles easier, we rotate the entire frame of reference so that the line from the center
        // towards the intersection point (the bisector line) is at 180°. Thus, the bisector is crossed when the
        // aircraft reaches 180° (rotated) bearing as seen from the center point.

        const brgInverseBisector = Avionics.Utils.computeGreatCircleHeading(this.center, this.previousLeg.to.infos.coordinates);

        const correctiveFactor = 180 - brgInverseBisector;

        const minBearing = this.clockwise ? 180 - this.angle / 2 : 180;
        const maxBearing = this.clockwise ? 180 : 180 + this.angle / 2;
        const rotatedBearing = mod(Avionics.Utils.computeGreatCircleHeading(this.center, ppos) + correctiveFactor, 360);
        const limitedBearing = Math.min(Math.max(rotatedBearing, minBearing), maxBearing);
        const remainingArcDegs = this.clockwise ? 180 - limitedBearing : limitedBearing - 180;

        return (2 * Math.PI * this.radius) / 360 * remainingArcDegs;
    }

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number): GuidanceParameters | null {
        const { center } = this;

        const bearingPpos = Avionics.Utils.computeGreatCircleHeading(
            center,
            ppos,
        );

        const desiredTrack = mod(
            this.clockwise ? bearingPpos + 90 : bearingPpos - 90,
            360,
        );
        const trackAngleError = mod(desiredTrack - trueTrack + 180, 360) - 180;

        const distanceFromCenter = Avionics.Utils.computeGreatCircleDistance(
            center,
            ppos,
        );
        const crossTrackError = this.clockwise
            ? distanceFromCenter - this.radius
            : this.radius - distanceFromCenter;

        const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'meters per second');
        const phiCommand = this.angle > 3 ? this.getNominalRollAngle(groundSpeed) : 0;

        return {
            law: ControlLaw.LATERAL_PATH,
            trackAngleError,
            crossTrackError,
            phiCommand,
        };
    }

    getNominalRollAngle(gs): Degrees {
        return (this.clockwise ? 1 : -1) * Math.atan((gs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    toString(): string {
        return `Type1Transition<radius=${this.radius} clockwisew=${this.clockwise}>`;
    }
}
