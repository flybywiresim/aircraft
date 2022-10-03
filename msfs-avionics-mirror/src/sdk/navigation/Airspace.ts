import { GeoPoint } from '../geo/GeoPoint';

/**
 * Types of airspaces.
 */
export enum AirspaceType {
  None,
  Center,
  ClassA,
  ClassB,
  ClassC,
  ClassD,
  ClassE,
  ClassF,
  ClassG,
  Tower,
  Clearance,
  Ground,
  Departure,
  Approach,
  MOA,
  Restricted,
  Prohibited,
  Warning,
  Alert,
  Danger,
  Nationalpark,
  ModeC,
  Radar,
  Training,
  Max
}

/**
 * An airspace.
 */
export interface Airspace {
  /** The type of the airspace. */
  readonly type: AirspaceType;

  /** The name of the airspace. */
  readonly name: string;

  /** The type of the airspace. */
  readonly segments: readonly GeoPoint[];

  /**
   * Checks whether this airspace is the same as another airspace.
   * @param other The other airspace.
   * @returns whether this airspace is the same as another airspace.
   */
  equals(other: Airspace): boolean;
}