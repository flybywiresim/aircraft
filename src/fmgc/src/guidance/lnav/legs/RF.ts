import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import {
    AltitudeConstraint,
    SpeedConstraint,
    getAltitudeConstraintFromWaypoint,
    getSpeedConstraintFromWaypoint,
} from '@fmgc/guidance/lnav/legs';
import { SegmentType } from '@fmgc/wtsdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { arcDistanceToGo, arcGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { PathVector, PathVectorType } from '../PathVector';

export class RFLeg extends XFLeg {
    // termination fix of the previous leg
    from: WayPoint;

    // to fix for the RF leg, most params referenced off this
    to: WayPoint;

    // location of the centre fix of the arc
    center: LatLongData;

    radius: NauticalMiles;

    angle: Degrees;

    clockwise: boolean;

    private mDistance: NauticalMiles;

    private computedPath: PathVector[] = [];

    constructor(from: WayPoint, to: WayPoint, center: LatLongData, segment: SegmentType) {
        super(to);

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
            this.clockwise = angle > 0;
            this.angle = Math.abs(angle);
            break;
        }

        this.mDistance = 2 * Math.PI * this.radius / 360 * this.angle;

        this.computedPath = [
            {
                type: PathVectorType.Arc,
                startPoint: this.from.infos.coordinates,
                centrePoint: this.center,
                endPoint: this.to.infos.coordinates,
                sweepAngle: this.clockwise ? this.angle : -this.angle,
            },
        ];

        this.isComputed = true;
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.from.infos.coordinates;
    }

    getPathEndPoint(): Coordinates | undefined {
        return this.to.infos.coordinates;
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    get startsInCircularArc(): boolean {
        return true;
    }

    get endsInCircularArc(): boolean {
        return true;
    }

    get inboundCourse(): Degrees {
        return Avionics.Utils.clampAngle(Avionics.Utils.computeGreatCircleHeading(this.center, this.from.infos.coordinates) + (this.clockwise ? 90 : -90));
    }

    get outboundCourse(): Degrees {
        return Avionics.Utils.clampAngle(Avionics.Utils.computeGreatCircleHeading(this.center, this.to.infos.coordinates) + (this.clockwise ? 90 : -90));
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

    // basically straight from type 1 transition... willl need refinement
    getGuidanceParameters(ppos: LatLongAlt, trueTrack: number): GuidanceParameters | null {
        // FIXME should be defined in terms of to fix
        return arcGuidance(ppos, trueTrack, this.from.infos.coordinates, this.center, this.clockwise ? this.angle : -this.angle);
    }

    getNominalRollAngle(gs: Knots): Degrees {
        const gsMs = gs * (463 / 900);
        return (this.clockwise ? 1 : -1) * Math.atan((gsMs ** 2) / (this.radius * 1852 * 9.81)) * (180 / Math.PI);
    }

    /**
     * Calculates directed DTG parameter
     *
     * @param ppos {LatLong} the current position of the aircraft
     */
    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        // FIXME geometry should be defined in terms of to...
        return arcDistanceToGo(ppos, this.from.infos.coordinates, this.center, this.clockwise ? this.angle : -this.angle);
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

    get repr(): string {
        return `RF(${this.radius.toFixed(1)}NM. ${this.angle.toFixed(1)}°) TO ${this.to.ident}`;
    }
}
