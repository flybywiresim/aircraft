import { Degrees, NauticalMiles } from '@typings/types';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { MathUtils } from '@shared/MathUtils';
import { EARTH_RADIUS_NM } from '@fmgc/guidance/Geometry';
import {
    Leg,
    AltitudeConstraint,
    SpeedConstraint,
    getAltitudeConstraintFromWaypoint,
    getSpeedConstraintFromWaypoint,
    waypointToLocation,
} from '@fmgc/guidance/lnav/legs';
import { WayPoint } from '@fmgc/types/fstypes/FSTypes';
import { SegmentType } from '@fmgc/wtsdk';
import { GeoMath } from '@fmgc/flightplanning/GeoMath';

export class TFLeg implements Leg {
    public from: WayPoint;

    public to: WayPoint;

    public segment: SegmentType;

    private mDistance: NauticalMiles;

    constructor(from: WayPoint, to: WayPoint, segment: SegmentType) {
        this.from = from;
        this.to = to;
        this.mDistance = Avionics.Utils.computeGreatCircleDistance(this.from.infos.coordinates, this.to.infos.coordinates);
        this.segment = segment;
    }

    get isCircularArc(): boolean {
        return false;
    }

    get bearing(): Degrees {
        return Avionics.Utils.computeGreatCircleHeading(
            this.from.infos.coordinates,
            this.to.infos.coordinates,
        );
    }

    get distance(): NauticalMiles {
        return this.mDistance;
    }

    get speedConstraint(): SpeedConstraint | undefined {
        return getSpeedConstraintFromWaypoint(this.to);
    }

    get altitudeConstraint(): AltitudeConstraint | undefined {
        return getAltitudeConstraintFromWaypoint(this.to);
    }

    // TODO: refactor
    get initialSpeedConstraint(): SpeedConstraint | undefined {
        return getSpeedConstraintFromWaypoint(this.from);
    }

    // TODO: refactor
    get initialAltitudeConstraint(): AltitudeConstraint | undefined {
        return getAltitudeConstraintFromWaypoint(this.from);
    }

    get initialLocation(): LatLongData {
        return waypointToLocation(this.from);
    }

    get terminatorLocation(): LatLongData {
        return waypointToLocation(this.to);
    }

    getPseudoWaypointLocation(distanceBeforeTerminator: NauticalMiles): LatLongData {
        const inverseBearing = Avionics.Utils.computeGreatCircleHeading(
            this.to.infos.coordinates,
            this.from.infos.coordinates,
        );
        const latLongAltResult = Avionics.Utils.bearingDistanceToCoordinates(
            inverseBearing,
            distanceBeforeTerminator,
            this.terminatorLocation.lat,
            this.terminatorLocation.long,
        );
        const loc: LatLongData = {
            lat: latLongAltResult.lat,
            long: latLongAltResult.long,
        };
        return loc;
    }

    getIntermediatePoint(start: LatLongData, end: LatLongData, fraction: number): LatLongData {
        const Phi1 = start.lat * Avionics.Utils.DEG2RAD;
        const Gamma1 = start.long * Avionics.Utils.DEG2RAD;
        const Phi2 = end.lat * Avionics.Utils.DEG2RAD;
        const Gamma2 = end.long * Avionics.Utils.DEG2RAD;

        const deltaPhi = Phi2 - Phi1;
        const deltaGamma = Gamma2 - Gamma1;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(Phi1) * Math.cos(Phi2) * Math.sin(deltaGamma / 2) * Math.sin(deltaGamma / 2);
        const delta = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const A = Math.sin((1 - fraction) * delta) / Math.sin(delta);
        const B = Math.sin(fraction * delta) / Math.sin(delta);

        const x = A * Math.cos(Phi1) * Math.cos(Gamma1) + B * Math.cos(Phi2) * Math.cos(Gamma2);
        const y = A * Math.cos(Phi1) * Math.sin(Gamma1) + B * Math.cos(Phi2) * Math.sin(Gamma2);
        const z = A * Math.sin(Phi1) + B * Math.sin(Phi2);

        const Phi3 = Math.atan2(z, Math.sqrt(x * x + y * y));
        const Gamma3 = Math.atan2(y, x);

        const point: LatLongData = {
            lat: Phi3 * Avionics.Utils.RAD2DEG,
            long: Gamma3 * Avionics.Utils.RAD2DEG,
        };
        return point;
    }

    getAlongTrackDistanceTo(start: LatLongData, end: LatLongData, ppos: LatLongData): number {
        const R = EARTH_RADIUS_NM;

        const d13 = Avionics.Utils.computeGreatCircleDistance(start, ppos) / R;
        const Theta13 = Avionics.Utils.DEG2RAD * Avionics.Utils.computeGreatCircleHeading(start, ppos);
        const Theta12 = Avionics.Utils.DEG2RAD * Avionics.Utils.computeGreatCircleHeading(start, end);

        const deltaXt = Math.asin(Math.sin(d13) * Math.sin(Theta13 - Theta12));

        const deltaAt = Math.acos(Math.cos(d13) / Math.abs(Math.cos(deltaXt)));

        return deltaAt * Math.sign(Math.cos(Theta12 - Theta13)) * R;
    }

    getGuidanceParameters(ppos: LatLongData, trueTrack: Degrees): GuidanceParameters | null {
        const fromLatLongAlt = this.from.infos.coordinates;
        const toLatLongAlt = this.to.infos.coordinates;

        // track angle error
        const totalTrackDistance = Avionics.Utils.computeGreatCircleDistance(
            fromLatLongAlt,
            toLatLongAlt,
        );
        const alongTrackDistance = this.getAlongTrackDistanceTo(
            fromLatLongAlt,
            toLatLongAlt,
            ppos,
        );
        const intermediatePoint = this.getIntermediatePoint(
            fromLatLongAlt,
            toLatLongAlt,
            Math.min(Math.max(alongTrackDistance / totalTrackDistance, 0.05), 0.95),
        );
        const desiredTrack = Avionics.Utils.computeGreatCircleHeading(intermediatePoint, toLatLongAlt);
        const trackAngleError = MathUtils.mod(desiredTrack - trueTrack + 180, 360) - 180;

        // crosstrack error
        const bearingAC = Avionics.Utils.computeGreatCircleHeading(fromLatLongAlt, ppos);
        const bearingAB = Avionics.Utils.computeGreatCircleHeading(fromLatLongAlt, toLatLongAlt);
        const distanceAC = Avionics.Utils.computeDistance(fromLatLongAlt, ppos);

        const desiredOffset = 0;
        const actualOffset = (
            Math.asin(
                Math.sin(Avionics.Utils.DEG2RAD * (distanceAC / EARTH_RADIUS_NM))
                * Math.sin(Avionics.Utils.DEG2RAD * (bearingAC - bearingAB)),
            ) * Avionics.Utils.RAD2DEG
        ) * EARTH_RADIUS_NM;
        const crossTrackError = desiredOffset - actualOffset;

        return {
            law: ControlLaw.LATERAL_PATH,
            trackAngleError,
            crossTrackError,
            phiCommand: 0,
        };
    }

    getNominalRollAngle(gs): Degrees {
        return 0;
    }

    /**
     * Calculates the angle between the leg and the aircraft PPOS.
     *
     * This effectively returns the angle ABC in the figure shown below:
     *
     * ```
     * * A
     * |
     * * B (TO)
     * |\
     * | \
     * |  \
     * |   \
     * |    \
     * |     \
     * |      \
     * * FROM  * C (PPOS)
     * ```
     *
     * @param ppos {LatLong} the current position of the aircraft
     */
    getAircraftToLegBearing(ppos: LatLongData): number {
        const aircraftToTerminationBearing = Avionics.Utils.computeGreatCircleHeading(ppos, this.to.infos.coordinates);
        const aircraftLegBearing = MathUtils.smallCrossingAngle(this.bearing, aircraftToTerminationBearing);

        return aircraftLegBearing;
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        return GeoMath.directedDistanceToGo(ppos, this.to.infos.coordinates, this.getAircraftToLegBearing(ppos));
    }

    isAbeam(ppos: LatLongAlt): boolean {
        const bearingAC = Avionics.Utils.computeGreatCircleHeading(this.from.infos.coordinates, ppos);
        const headingAC = Math.abs(MathUtils.diffAngle(this.bearing, bearingAC));
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
