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

    getGuidanceParameters(ppos: LatLongData, trueTrack: Degrees): GuidanceParameters | null {
        const fromLatLongAlt = this.from.infos.coordinates;

        const desiredTrack = this.bearing;
        const trackAngleError = MathUtils.mod(desiredTrack - trueTrack + 180, 360) - 180;

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

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        const aircraftLegBearing = this.getAircraftToLegBearing(ppos);

        const absDtg = Avionics.Utils.computeGreatCircleDistance(ppos, this.to.infos.coordinates);

        // @todo should be abeam distance
        if (aircraftLegBearing >= 90 && aircraftLegBearing <= 270) {
            // Since a line perpendicular to the leg is formed by two 90 degree angles, an aircraftLegBearing outside
            // (North - 90) and (North + 90) is in the lower quadrants of a plane centered at the TO fix. This means
            // the aircraft is NOT past the TO fix, and DTG must be positive.

            return absDtg;
        }

        return -absDtg;
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
