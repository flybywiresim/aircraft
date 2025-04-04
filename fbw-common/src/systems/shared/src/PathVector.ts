import { Coordinates } from 'msfs-geo';
import { AltitudeConstraint } from '../../fmgc';

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
  type: PathVectorType.Arc;
  startPoint: Coordinates;
  endPoint: Coordinates;
  centrePoint: Coordinates;
  sweepAngle: Degrees;
}

export interface LinePathVector {
  type: PathVectorType.Line;
  startPoint: Coordinates;
  endPoint: Coordinates;
}

export interface DebugPointPathVector {
  type: PathVectorType.DebugPoint;
  startPoint: Coordinates;
  annotation?: string;
  colour?: DebugPointColour;
}

export type PathVector = LinePathVector | ArcPathVector | DebugPointPathVector;

export interface VerticalPathCheckpoint {
  distanceFromAircraft: number;
  /** Predicted altitude */
  altitude: number;
  /** Whether altitude constraint is present */
  altitudeConstraint?: AltitudeConstraint;
  /** Whether altitude constraint will be met */
  isAltitudeConstraintMet?: boolean;
  /** Track from last waypoint, in degrees. Null if can't be determined, e.g. missing termination */
  trackToTerminationWaypoint: number | null;
}
