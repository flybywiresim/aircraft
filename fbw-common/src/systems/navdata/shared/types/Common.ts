import { Coordinates, Feet } from 'msfs-geo';
import { ProcedureLeg } from './ProcedureLeg';
import { SectionCode, SubSectionEnumMap } from './SectionCode';

export type FeetPerMinute = number;
export type FlightLevel = number;
export type KiloHertz = number;
export type Knots = number;
export type MegaHertz = number;
export type Minutes = number;

export interface DatabaseItem<T extends SectionCode> {
  sectionCode: T;
  subSectionCode: SubSectionEnumMap[T];

  /**
   * Globally unique ID
   * Should _not_ be used for any purpose other than comparing equality
   * between objects from the nav database (i.e. check if your tuned VOR is the same as a waypoint)
   */
  databaseId: string;
  /**
   * ICAO region code (2 letter)
   */
  icaoCode: string;
  ident: string;
}

export interface ElevatedCoordinates extends Coordinates {
  alt: Feet;
}

export enum LsCategory {
  None,
  LocOnly,
  Category1,
  Category2,
  Category3,
  IgsOnly,
  LdaGlideslope,
  LdaOnly,
  SdfGlideslope,
  SdfOnly,
}

export interface ProcedureTransition {
  /**
   * An arbitrary identifier to uniquely identify this transition
   * This should not be used for anything else but to determine if two transitions are the same
   */
  databaseId: string;
  ident: string;
  legs: ProcedureLeg[];
}
