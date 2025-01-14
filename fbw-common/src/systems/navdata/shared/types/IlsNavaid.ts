import { Coordinates, Degrees, DegreesMagnetic, Feet } from 'msfs-geo';
import { DatabaseItem, LsCategory, MegaHertz } from './Common';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface IlsNavaid extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.LocalizerGlideSlope;

  frequency: MegaHertz;
  category: LsCategory;
  locLocation: Coordinates;
  locBearing: DegreesMagnetic;
  gsLocation?: Coordinates & { alt?: Feet };
  /** The glideslope in degrees, with negative being descending. Undefined when no GS, or GS data not available. */
  gsSlope?: Degrees;
  /**
   * Beware: this is NOT the same as magnetic variation
   */
  stationDeclination: Degrees;
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
