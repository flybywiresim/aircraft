import { Coordinates, Degrees, DegreesTrue, Feet, Metres } from 'msfs-geo';
import { LsCategory, ElevatedCoordinates } from './Common';
import { BaseFix } from './BaseFix';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface Runway extends BaseFix<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.Runways;

  number: number;
  designator: RunwayDesignator;

  airportIdent: string;
  bearing: DegreesTrue;
  /** The magnetic bearing of the runway in degrees, or true bearing if it is true-referenced. */
  magneticBearing: number;
  /**
   * slope of the runway, negative for downhill
   */
  gradient: Degrees;
  startLocation: Coordinates;
  /**
   * Location, including altitude (if available), of the threshold
   */
  thresholdLocation: ElevatedCoordinates;
  thresholdCrossingHeight: Feet;
  // TODO is this TORA, ASDA, LDW, ???
  length: Metres;
  width: Metres;
  lsFrequencyChannel?: number;
  lsIdent: string;
  lsCategory?: LsCategory;
  surfaceType?: RunwaySurfaceType;
  /**
   * The airport magvar in degrees, or null when the runway is true referenced.
   */
  magVar: number | null;
}

export enum RunwaySurfaceType {
  Unknown = 1 << 0,
  Hard = 1 << 1,
  Soft = 1 << 2,
  Water = 1 << 3,
}

// Maintain in sort order for FMS
export enum RunwayDesignator {
  None = 0,
  Centre,
  Left,
  Right,
  True,
}

export function isRunway(o: any): o is Runway {
  return (
    typeof o === 'object' && o.sectionCode === SectionCode.Airport && o.subSectionCode === AirportSubsectionCode.Runways
  );
}
