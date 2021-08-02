import { Degrees, NauticalMiles } from '@typings/types';
import { ControlLaw, GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
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

export class RFLeg implements Leg {
    // termination fix of the previous leg
    public from: WayPoint;

    // to fix for the RF leg, most params referenced off this
    public to: WayPoint;

    public segment: SegmentType;

    // location of the centre fix of the arc
    public center: LatLongData;

    public radius: number;

    public angle: Degrees;

    public clockwise: boolean;

    private mDistance: NauticalMiles;

    constructor(from: WayPoint, to: WayPoint, center: LatLongData, segment: SegmentType) {
        this.from = from;
        this.to = to;
        this.center = center;
        this.radius = Avionics.Utils.computeGreatCircleDistance(this.center, this.to.infos.coordinates);
        this.segment = segment;

        const bearingFrom = Avionics.Utils.computeGreatCircleHeading(this.center, this.from.infos.coordinates); // -90?
        const bearingTo = Avionics.Utils.computeGreatCircleHeading(this.center, this.to.infos.coordinates); // -90?

        switch (to.additionalData.turnDirection) {
        case 1: // left
            this.clockwise = false;
            this.angle = Avionics.Utils.clampAngle(bearingFrom - bearingTo);
            break;
        case 2: // right
            this.clockwise = true;
            this.angle = Avionics.Utils.clampAngle(bearingTo - bearingFrom);
            break;
        case 0: // unknown
        case 3: // either
        default:
            const angle = Avionics.Utils.diffAngle(bearingTo, bearingFrom);
            this.clockwise = this.angle > 0;
            this.angle = Math.abs(angle);
            break;
        }

        this.mDistance = 2 * Math.PI * this.radius / 360 * this.angle;
    }

    get isCircularArc(): boolean {
        return true;
    }

    // this is used for transitions... which are not allowed for RF
    public get bearing(): Degrees {
        return -1;
    }

    public get distance(): NauticalMiles {
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
        const bearingTo = Avionics.Utils.computeGreatCircleHeading(this.center, this.to.infos.coordinates);
        const angleDelta = distanceBeforeTerminator / ((2 * Math.PI * this.radius) / 360);
        const pseudoWaypointBearing = this.clockwise ? Avionics.Utils.clampAngle(bearingTo + angleDelta) : Avionics.Utils.clampAngle(bearingTo - angleDelta);
        const latLongAltResult = Avionics.Utils.bearingDistanceToCoordinates(
            pseudoWaypointBearing,
            this.radius,
            this.center.lat,
            this.center.long,
        );
        const loc: LatLongData = {
            lat: latLongAltResult.lat,
            long: latLongAltResult.long,
        };
        return loc;
    }

    // basically straight from type 1 transition... willl need refinement
    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number): GuidanceParameters | null {
        const { center } = this;

        const bearingPpos = Avionics.Utils.computeGreatCircleHeading(
            center,
            ppos,
        );

        const desiredTrack = this.clockwise ? Avionics.Utils.clampAngle(bearingPpos + 90) : Avionics.Utils.clampAngle(bearingPpos - 90);
        const trackAngleError = Avionics.Utils.diffAngle(trueTrack, desiredTrack);

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

    getNominalRollAngle(gs): Degrees {
        return (this.clockwise ? 1 : -1) * Math.atan((gs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    /**
     * Calculates directed DTG parameter
     *
     * @param ppos {LatLong} the current position of the aircraft
     */
    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        const bearingTo = Avionics.Utils.computeGreatCircleHeading(this.center, this.to.infos.coordinates);
        const bearingPpos = Avionics.Utils.computeGreatCircleHeading(this.center, ppos);

        const angleToGo = this.clockwise ? Avionics.Utils.diffAngle(bearingPpos, bearingTo) : Avionics.Utils.diffAngle(bearingTo, bearingPpos);

        const circumference = 2 * Math.PI * this.radius;
        return circumference / 360 * angleToGo;
    }

    isAbeam(ppos: LatLongData): boolean {
        const bearingPpos = Avionics.Utils.computeGreatCircleHeading(
            this.center,
            ppos,
        );

        const bearingFrom = Avionics.Utils.computeGreatCircleHeading(
            this.center,
            this.from.infos.coordinates,
        );

        const trackAngleError = this.clockwise ? Avionics.Utils.diffAngle(bearingFrom, bearingPpos) : Avionics.Utils.diffAngle(bearingPpos, bearingFrom);

        return trackAngleError >= 0;
    }

    toString(): string {
        return `<RFLeg radius=${this.radius} to=${this.to}>`;
    }
}
