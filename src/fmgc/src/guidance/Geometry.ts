import { Degrees, NauticalMiles } from '@typings/types';
import { MathUtils } from '@shared/MathUtils';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { ControlLaw, GuidanceParameters } from './ControlLaws';

export const EARTH_RADIUS_NM = 3440.1;

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export interface Guidable {
    getGuidanceParameters(ppos: LatLongData, trueTrack: Degrees): GuidanceParameters | null;
    getDistanceToGo(ppos: LatLongData): NauticalMiles;
    isAbeam(ppos: LatLongData): boolean;
}

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
        const radiusInMeter = this.radius * 1852;
        const phiCommand = (this.clockwise ? 1 : -1) * Math.atan((groundSpeed * groundSpeed) / (radiusInMeter * 9.81)) * (180 / Math.PI);

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
     * - entry n: transition after leg n
     */
    public transitions: Map<number, Transition>;

    /**
     * The list of legs in this geometry, possibly connected through transitions:
     * - entry n: nth leg, before transition n
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
        const activeLeg = this.legs.get(1);

        // VM legs do not connect to anything and do not have a transition after them - we never sequence them
        if (activeLeg instanceof VMLeg) {
            return false;
        }

        // FIXME I don't think this works since getActiveLegGeometry doesn't put a transition at n = 2
        const terminatingTransition = this.transitions.get(2);

        if (terminatingTransition) {
            const tdttp = terminatingTransition.getTrackDistanceToTerminationPoint(ppos);

            return tdttp < 0.001;
        }

        if (activeLeg) {
            return activeLeg.getDistanceToGo(ppos) < 0.001;
        }

        return false;
    }
}
