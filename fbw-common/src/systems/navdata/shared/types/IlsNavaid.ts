import { Coordinates } from 'msfs-geo';
import { DatabaseItem, ElevatedCoordinates, LsCategory } from './Common';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface IlsNavaid extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.LocalizerGlideSlope;

  /** Frequency in MHz. */
  frequency: number;
  category: LsCategory;
  locLocation: Coordinates;
  /** Localiser bearing, magnetic degrees is {@link trueReferenced} is false, else true degrees. */
  locBearing: number;
  gsLocation?: Coordinates & { alt?: number };
  /** The glideslope in degrees, with negative being descending. Undefined when no GS, or GS data not available. */
  gsSlope?: number;
  /** The DME location, with altitude in feet, or undefined if not an ILS/DME. */
  dmeLocation?: ElevatedCoordinates;
  /**
   * Beware: this is NOT the same as magnetic variation
   */
  stationDeclination: number;
  /** Whether the localizer is true referenced (implies {@link stationDeclination} is 0 as well). */
  trueReferenced?: boolean;
}

export function isIlsNavaid(o: any): o is IlsNavaid {
  return (
    typeof o === 'object' &&
    o.sectionCode === SectionCode.Airport &&
    o.subSectionCode === AirportSubsectionCode.LocalizerGlideSlope
  );
}
