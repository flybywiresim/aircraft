import { Coordinates } from '@fmgc/flightplanning/data/geo';

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
