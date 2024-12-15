import { Coordinates, Degrees, DegreesMagnetic, Feet } from 'msfs-geo';
import { DatabaseItem, LsCategory, MegaHertz } from './Common';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export interface IlsNavaid extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.LocalizerGlideSlope;

  frequency: MegaHertz;
  category: LsCategory;
  runwayIdent: string;
  locLocation: Coordinates;
  locBearing: DegreesMagnetic;
  gsLocation?: Coordinates & { alt?: Feet };
  gsSlope?: Degrees;
  /**
   * Beware: this is NOT the same as magnetic variation
   */
  stationDeclination: Degrees;
}

export function isIlsNavaid(o: any): o is IlsNavaid {
  return (
    typeof o === 'object' &&
    o.sectionCode === SectionCode.Airport &&
    o.subSectionCode === AirportSubsectionCode.LocalizerGlideSlope
  );
}
