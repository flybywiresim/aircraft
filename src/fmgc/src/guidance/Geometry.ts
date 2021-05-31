import { Degrees, NauticalMiles } from '@typings/types';
import { ControlLaw, GuidanceParameters } from './ControlLaws';

export const EARTH_RADIUS_NM = 3440.1;
const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export interface Guidable {
    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number): GuidanceParameters | null;
    getDistanceToGo(ppos: LatLongAlt): NauticalMiles;
    isAbeam(ppos: LatLongAlt): boolean;
}

export abstract class Leg implements Guidable {
    abstract getGuidanceParameters(ppos, trueTrack);

    abstract getDistanceToGo(ppos);

    abstract isAbeam(ppos);
}

export class TFLeg extends Leg {
    public from: WayPoint;

    public to: WayPoint;

    constructor(from: WayPoint, to: WayPoint) {
        super();
        this.from = from;
        this.to = to;
    }

    get bearing(): Degrees {
        return Avionics.Utils.computeGreatCircleHeading(
            this.from.infos.coordinates,
            this.to.infos.coordinates,
        );
    }

    getGuidanceParameters(ppos, trueTrack): GuidanceParameters | null {
        const fromLatLongAlt = this.from.infos.coordinates;

        const desiredTrack = this.bearing;
        const trackAngleError = mod(desiredTrack - trueTrack + 180, 360) - 180;

        // crosstrack error
        const bearingAC = Avionics.Utils.computeGreatCircleHeading(fromLatLongAlt, ppos);
        const bearingAB = desiredTrack;
        const distanceAC = Avionics.Utils.computeDistance(fromLatLongAlt, ppos);

        const desiredOffset = 0;
        const actualOffset = (
            Math.asin(
                Math.sin(Avionics.Utils.DEG2RAD * (distanceAC / EARTH_RADIUS_NM))
                * Math.sin(Avionics.Utils.DEG2RAD * (bearingAC - bearingAB)),
            ) / Avionics.Utils.DEG2RAD
        ) * EARTH_RADIUS_NM;
        const crossTrackError = desiredOffset - actualOffset;

        return {
            law: ControlLaw.LATERAL_PATH,
            trackAngleError,
            crossTrackError,
            phiCommand: 0,
        };
    }

    getAircraftToLegBearing(ppos) {
        const aircraftToTerminationBearing = Avionics.Utils.computeGreatCircleHeading(ppos, this.to.infos.coordinates);

        // Rotate frame of reference to 0deg
        let correctedLegBearing = this.bearing - aircraftToTerminationBearing;
        if (correctedLegBearing < 0) {
            correctedLegBearing = 360 + correctedLegBearing;
        }

        let aircraftToLegBearing = 180 - correctedLegBearing;
        if (aircraftToLegBearing < 0) {
            // if correctedLegBearing was greater than 180 degrees, then its supplementary angle is negative.
            // In this case, we can subtract it from 360 degrees to obtain the bearing.

            aircraftToLegBearing = 360 + aircraftToLegBearing;
        }

        return aircraftToLegBearing;
    }

    getDistanceToGo(ppos) {
        const aircraftLegBearing = this.getAircraftToLegBearing(ppos);

        const absDtg = Avionics.Utils.computeGreatCircleDistance(ppos, this.to.infos.coordinates);

        // @todo should be abeam distance
        if (aircraftLegBearing >= 90 && aircraftLegBearing <= 270) {
            return absDtg;
        }

        return -absDtg;
    }

    get distance(): NauticalMiles {
        return Avionics.Utils.computeGreatCircleDistance(this.from.infos.coordinates, this.to.infos.coordinates);
    }

    isAbeam(ppos: LatLongAlt): boolean {
        const bearingAC = Avionics.Utils.computeGreatCircleHeading(this.from.infos.coordinates, ppos);
        const headingAC = Math.abs(Avionics.Utils.diffAngle(this.bearing, bearingAC));
        if (headingAC > 90) {
            // if we're even not abeam of the starting point
            return false;
        }
        const distanceAC = Avionics.Utils.computeDistance(this.from.infos.coordinates, ppos);
        const distanceAX = Math.cos(headingAC * Avionics.Utils.DEG2RAD) * distanceAC;
        // if we're too far away from the starting point to be still abeam of the ending point
        return distanceAX <= this.distance;
    }

    toString(): string {
        return `<TFLeg from=${this.from} to=${this.to}>`;
    }
}

export abstract class Transition implements Guidable {
    abstract isAbeam(ppos: LatLongAlt): boolean;

    abstract getGuidanceParameters(ppos, trueTrack);

    abstract getDistanceToGo(ppos);

    abstract getTrackDistanceToTerminationPoint(ppos: LatLongAlt): NauticalMiles;
}

/**
 * A type I transition uses a fixed turn radius between two fix-referenced legs.
 */
export class Type1Transition extends Transition {
    public previousLeg: TFLeg;

    public nextLeg: TFLeg;

    public radius: NauticalMiles;

    public clockwise: boolean;

    constructor(
        previousLeg: TFLeg,
        nextLeg: TFLeg,
        radius: NauticalMiles,
        clockwise: boolean,
    ) {
        super();
        this.previousLeg = previousLeg;
        this.nextLeg = nextLeg;
        this.radius = radius;
        this.clockwise = clockwise;
    }

    get angle(): Degrees {
        const bearingFrom = this.previousLeg.bearing;
        const bearingTo = this.nextLeg.bearing;
        return Math.abs(Avionics.Utils.diffAngle(bearingFrom, bearingTo));
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
        const headingAC = Math.abs(Avionics.Utils.diffAngle(this.previousLeg.bearing, bearingAC));
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

        const phiCommand = this.clockwise ? 25 : -25;

        return {
            law: ControlLaw.LATERAL_PATH,
            trackAngleError,
            crossTrackError,
            phiCommand,
        };
    }

    toString(): string {
        return `Type1Transition<radius=${this.radius} clockwisew=${this.clockwise}>`;
    }
}

export class Geometry {
    /**
     * The list of transitions between legs.
     * - entry 1: transition before first leg
     * - entry 2: transition after first leg
     * - entry n: transition after leg n - 1
     */
    public transitions: Map<number, Transition>;

    /**
     * The list of legs in this geometry, possibly connected through transitions:
     * - entry 1: first leg, after transition 1
     * - entry 2: second leg, after transition 2
     * - entry n: nth leg, after transition n
     */
    public legs: Map<number, Leg>;

    constructor(transitions: Map<number, Transition>, legs: Map<number, Leg>) {
        this.transitions = transitions;
        this.legs = legs;
    }

    /**
     *
     * @param ppos
     * @param trueTrack
     * @example
     * const a = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"),
     * const b = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude")
     * const ppos = new LatLongAlt(a, b);
     * const trueTrack = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
     * getGuidanceParameters(ppos, trueTrack);
     */
    getGuidanceParameters(ppos, trueTrack) {
        // first, check if we're abeam with one of the transitions (start or end)
        const fromTransition = this.transitions.get(1);
        if (fromTransition && fromTransition.isAbeam(ppos)) {
            return fromTransition.getGuidanceParameters(ppos, trueTrack);
        }

        const toTransition = this.transitions.get(2);
        if (toTransition && toTransition.isAbeam(ppos)) {
            return toTransition.getGuidanceParameters(ppos, trueTrack);
        }

        // otherwise perform straight point-to-point guidance for the first leg
        const activeLeg = this.legs.get(1);
        if (activeLeg) {
            return activeLeg.getGuidanceParameters(ppos, trueTrack);
        }

        return null;
    }

    getDistanceToGo(ppos): number | null {
        const activeLeg = this.legs.get(1);
        if (activeLeg) {
            return activeLeg.getDistanceToGo(ppos);
        }

        return null;
    }

    shouldSequenceLeg(ppos: LatLongAlt): boolean {
        const terminatingTransition = this.transitions.get(2);
        if (terminatingTransition) {
            const tdttp = terminatingTransition.getTrackDistanceToTerminationPoint(ppos);
            return tdttp < 0.001;
        }

        const activeLeg = this.legs.get(1);
        if (activeLeg) {
            return activeLeg.getDistanceToGo(ppos) < 0.001;
        }

        return false;
    }
}
