import { Guidable } from '@fmgc/guidance/Geometry';
import { SegmentType } from '@fmgc/wtsdk';

export enum AltitudeConstraintType {
    at,
    atOrAbove,
    atOrBelow,
    range,
}

export enum SpeedConstraintType {
    at,
    atOrAbove,
    atOrBelow,
}

export interface AltitudeConstraint {
    type: AltitudeConstraintType,
    altitude1: Feet,
    altitude2: Feet | undefined,
}

export interface SpeedConstraint {
    type: SpeedConstraintType,
    speed: Knots,
}

export abstract class Leg implements Guidable {
    segment: SegmentType;

    indexInFullPath: number;

    get isCircularArc(): boolean;

    get bearing(): Degrees;

    get distance(): NauticalMiles;

    get speedConstraint(): SpeedConstraint | undefined;

    get altitudeConstraint(): AltitudeConstraint | undefined;

    get initialLocation(): LatLongData | undefined;

    get terminatorLocation(): LatLongData | undefined;

    abstract getPseudoWaypointLocation(distanceBeforeTerminator: NauticalMiles): LatLongData | undefined;

    /** @inheritDoc */
    recomputeWithParameters(_tas: Knots): void {
        // Default impl.
    }

    abstract getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees);

    abstract getNominalRollAngle(gs): Degrees;

    /**
     * Calculates directed DTG parameter
     *
     * @param ppos {LatLong} the current position of the aircraft
     */
    abstract getDistanceToGo(ppos: LatLongData): NauticalMiles;

    abstract isAbeam(ppos);
}

export function getAltitudeConstraintFromWaypoint(wp: WayPoint): AltitudeConstraint | undefined {
    if (wp.legAltitudeDescription && wp.legAltitude1) {
        const ac: Partial<AltitudeConstraint> = {};
        ac.altitude1 = wp.legAltitude1;
        ac.altitude2 = undefined;
        switch (wp.legAltitudeDescription) {
        case 1:
            ac.type = AltitudeConstraintType.at;
            break;
        case 2:
            ac.type = AltitudeConstraintType.atOrAbove;
            break;
        case 3:
            ac.type = AltitudeConstraintType.atOrBelow;
            break;
        case 4:
            ac.type = AltitudeConstraintType.range;
            ac.altitude2 = wp.legAltitude2;
            break;
        default:
            break;
        }
        return ac as AltitudeConstraint;
    }
    return undefined;
}

export function getSpeedConstraintFromWaypoint(wp: WayPoint): SpeedConstraint | undefined {
    if (wp.speedConstraint) {
        const sc: Partial<SpeedConstraint> = {};
        sc.type = SpeedConstraintType.at;
        sc.speed = wp.speedConstraint;
        return sc as SpeedConstraint;
    }
    return undefined;
}

export function waypointToLocation(wp: WayPoint): LatLongData {
    const loc: LatLongData = {
        lat: wp.infos.coordinates.lat,
        long: wp.infos.coordinates.long,
    };
    return loc;
}
