import { GuidanceParameters } from '@fmgc/guidance/ControlLaws';
import { MathUtils } from '@shared/MathUtils';
import {
    AltitudeConstraint,
    getAltitudeConstraintFromWaypoint,
    getSpeedConstraintFromWaypoint,
    SpeedConstraint,
} from '@fmgc/guidance/lnav/legs';
import { SegmentType } from '@fmgc/wtsdk';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { Guidable } from '@fmgc/guidance/Guidable';
import { Constants } from '@shared/Constants';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { Geo } from '@fmgc/utils/Geo';
import { courseToFixDistanceToGo, courseToFixGuidance } from '@fmgc/guidance/lnav/CommonGeometry';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { PathVector, PathVectorType } from '../PathVector';

export class TFLeg extends XFLeg {
    from: WayPoint;

    to: WayPoint;

    constraintType: WaypointConstraintType;

    private mDistance: NauticalMiles;

    private course: Degrees;

    private computedPath: PathVector[] = [];

    constructor(from: WayPoint, to: WayPoint, segment: SegmentType, indexInFullPath: number) {
        super();
        this.from = from;
        this.to = to;
        this.fix = to;
        this.mDistance = Avionics.Utils.computeGreatCircleDistance(this.from.infos.coordinates, this.to.infos.coordinates);
        this.segment = segment;
        this.indexInFullPath = indexInFullPath;
        this.constraintType = to.constraintType;
        this.course = Avionics.Utils.computeGreatCircleHeading(
            this.from.infos.coordinates,
            this.to.infos.coordinates,
        );
    }

    private previousGudiable: Guidable;

    private nextGuidable: Guidable;

    get inboundCourse(): DegreesTrue {
        return Geo.getGreatCircleBearing(this.from.infos.coordinates, this.to.infos.coordinates);
    }

    get outboundCourse(): DegreesTrue {
        return Geo.getGreatCircleBearing(this.from.infos.coordinates, this.to.infos.coordinates);
    }

    get predictedPath(): PathVector[] {
        return this.computedPath;
    }

    getPathStartPoint(): Coordinates | undefined {
        return this.previousGudiable?.getPathEndPoint();
    }

    getPathEndPoint(): Coordinates | undefined {
        if (this.nextGuidable instanceof FixedRadiusTransition) {
            return this.nextGuidable.getTurningPoints()[0];
        }

        return this.to.infos.coordinates;
    }

    recomputeWithParameters(_isActive: boolean, _tas: Knots, _gs: Knots, _ppos: Coordinates, _trueTrack: DegreesTrue, previousGuidable: Guidable, nextGuidable: Guidable) {
        this.previousGudiable = previousGuidable;
        this.nextGuidable = nextGuidable;

        const startPoint = this.previousGudiable?.isComputed ? this.previousGudiable.getPathEndPoint() : this.from.infos.coordinates;
        const endPoint = this.nextGuidable?.isComputed ? this.nextGuidable.getPathStartPoint() : this.to.infos.coordinates;

        this.computedPath.length = 0;

        this.computedPath.push({
            type: PathVectorType.Line,
            startPoint,
            endPoint,
        });

        if (LnavConfig.DEBUG_PREDICTED_PATH) {
            this.computedPath.push({
                type: PathVectorType.DebugPoint,
                startPoint: endPoint,
                annotation: 'TF END',
            });
        }

        this.isComputed = true;
    }

    get isCircularArc(): boolean {
        return false;
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

    getPseudoWaypointLocation(distanceBeforeTerminator: NauticalMiles): LatLongData {
        const inverseBearing = Avionics.Utils.computeGreatCircleHeading(
            this.to.infos.coordinates,
            this.from.infos.coordinates,
        );

        return Avionics.Utils.bearingDistanceToCoordinates(
            inverseBearing,
            distanceBeforeTerminator,
            this.getPathEndPoint().lat,
            this.getPathEndPoint().long,
        );
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
        const R = Constants.EARTH_RADIUS_NM;

        const d13 = Avionics.Utils.computeGreatCircleDistance(start, ppos) / R;
        const Theta13 = Avionics.Utils.DEG2RAD * Avionics.Utils.computeGreatCircleHeading(start, ppos);
        const Theta12 = Avionics.Utils.DEG2RAD * Avionics.Utils.computeGreatCircleHeading(start, end);

        const deltaXt = Math.asin(Math.sin(d13) * Math.sin(Theta13 - Theta12));

        const deltaAt = Math.acos(Math.cos(d13) / Math.abs(Math.cos(deltaXt)));

        return deltaAt * Math.sign(Math.cos(Theta12 - Theta13)) * R;
    }

    getGuidanceParameters(ppos: LatLongData, trueTrack: Degrees): GuidanceParameters | null {
        return courseToFixGuidance(ppos, trueTrack, this.course, this.fix.infos.coordinates);
    }

    getNominalRollAngle(_gs: Knots): Degrees {
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
        const aircraftLegBearing = MathUtils.smallCrossingAngle(this.outboundCourse, aircraftToTerminationBearing);

        return aircraftLegBearing;
    }

    getDistanceToGo(ppos: LatLongData): NauticalMiles {
        return courseToFixDistanceToGo(ppos, this.course, this.getPathEndPoint());
    }

    isAbeam(ppos: LatLongAlt): boolean {
        const bearingAC = Avionics.Utils.computeGreatCircleHeading(this.from.infos.coordinates, ppos);
        const headingAC = Math.abs(MathUtils.diffAngle(this.inboundCourse, bearingAC));
        if (headingAC > 90) {
            // if we're even not abeam of the starting point
            return false;
        }
        const distanceAC = Avionics.Utils.computeDistance(this.from.infos.coordinates, ppos);
        const distanceAX = Math.cos(headingAC * Avionics.Utils.DEG2RAD) * distanceAC;
        // if we're too far away from the starting point to be still abeam of the ending point
        return distanceAX <= this.distance;
    }

    get repr(): string {
        return `TF TO ${this.to.ident}`;
    }
}
