import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { arcLength, pointOnArc, pointOnCourseToFix } from '@fmgc/guidance/lnav/CommonGeometry';

export enum PathVectorType {
    Line,
    Arc,
    DebugPoint,
}

export enum DebugPointColour {
    White,
    Green,
    Yellow,
    Cyan,
    Magenta,
}

export interface ArcPathVector {
    type: PathVectorType.Arc,
    startPoint: Coordinates,
    endPoint: Coordinates,
    centrePoint: Coordinates,
    sweepAngle: Degrees,
}

export interface LinePathVector {
    type: PathVectorType.Line,
    startPoint: Coordinates,
    endPoint: Coordinates,
}

export interface DebugPointPathVector {
    type: PathVectorType.DebugPoint,
    startPoint: Coordinates,
    annotation?: string,
    colour?: DebugPointColour,
}

export type PathVector = LinePathVector | ArcPathVector | DebugPointPathVector

export function pathVectorLength(vector: PathVector) {
    if (vector.type === PathVectorType.Line) {
        return Avionics.Utils.computeGreatCircleDistance(vector.startPoint, vector.endPoint);
    }

    if (vector.type === PathVectorType.Arc) {
        const radius = Avionics.Utils.computeGreatCircleDistance(vector.startPoint, vector.centrePoint);

        return arcLength(radius, vector.sweepAngle);
    }

    return 0;
}

export function pathVectorValid(vector: PathVector) {
    switch (vector.type) {
    case PathVectorType.Line:
        return !!(vector.startPoint?.lat && vector.endPoint?.lat);
    case PathVectorType.Arc:
        return !!(vector.endPoint?.lat && vector.centrePoint?.lat && vector.sweepAngle);
    case PathVectorType.DebugPoint:
        return !!vector.startPoint?.lat;
    default:
        return true;
    }
}

export function pathVectorPoint(vector: PathVector, distanceFromEnd: NauticalMiles): Coordinates | undefined {
    if (vector.type === PathVectorType.Line) {
        return pointOnCourseToFix(distanceFromEnd, Avionics.Utils.computeGreatCircleHeading(vector.startPoint, vector.endPoint), vector.endPoint);
    }

    if (vector.type === PathVectorType.Arc) {
        return pointOnArc(distanceFromEnd, vector.endPoint, vector.centrePoint, vector.sweepAngle);
    }

    return undefined;
}
