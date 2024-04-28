import { Coordinates, Degrees, DegreesMagnetic, DegreesTrue, Feet, Metres } from 'msfs-geo';
import { LsCategory, ElevatedCoordinates } from './Common';
import { BaseFix } from './BaseFix';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface Runway extends BaseFix<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.Runways;

  airportIdent: string;
  bearing: DegreesTrue;
  magneticBearing: DegreesMagnetic;
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
}

export enum RunwaySurfaceType {
  Unknown = 1 << 0,
  Hard = 1 << 1,
  Soft = 1 << 2,
  Water = 1 << 3,
}
