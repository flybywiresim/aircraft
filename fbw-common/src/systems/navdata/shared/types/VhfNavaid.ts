import { Coordinates, Degrees, Feet, NauticalMiles } from 'msfs-geo';
import { MegaHertz } from './Common';
import { NavaidSubsectionCode, SectionCode } from './SectionCode';
import { BaseFix } from './BaseFix';

/**
 * VOR fix
 */
export interface VhfNavaid extends BaseFix<SectionCode.Navaid> {
  subSectionCode: NavaidSubsectionCode.VhfNavaid;

  frequency: MegaHertz;
  figureOfMerit: FigureOfMerit;
  range: NauticalMiles;
  name?: string;

  /**
   * Beware: this is NOT the same as magnetic variation
   */
  stationDeclination: Degrees;
  /** Whether the station is true referenced (implies {@link stationDeclination} is 0 as well). */
  trueReferenced?: boolean;
  dmeLocation?: Coordinates & { alt?: Feet };
  type: VhfNavaidType;
  class?: VorClass;
  ilsDmeBias?: NauticalMiles;

  /**
   * distance from centre location for nearby query
   */
  distance?: NauticalMiles;
}

export function isVhfNavaid(o: any): o is VhfNavaid {
  return (
    typeof o === 'object' && o.sectionCode === SectionCode.Navaid && o.subSectionCode === NavaidSubsectionCode.VhfNavaid
  );
}

// TODO enum
export type FigureOfMerit = 0 | 1 | 2 | 3 | 7 | 9;

export enum VhfNavaidType {
  Unknown = 1 << 0,
  Vor = 1 << 1,
  VorDme = 1 << 2,
  Dme = 1 << 3,
  Tacan = 1 << 4,
  Vortac = 1 << 5,
  Vot = 1 << 6,
  IlsDme = 1 << 7,
  IlsTacan = 1 << 8,
}

export enum VorClass {
  Unknown = 1 << 0,
  Terminal = 1 << 1,
  LowAlt = 1 << 2,
  HighAlt = 1 << 3,
}
