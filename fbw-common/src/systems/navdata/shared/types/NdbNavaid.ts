import { Coordinates, NauticalMiles } from 'msfs-geo';
import { BaseFix, WaypointArea } from '..';
import { DatabaseItem, KiloHertz } from './Common';
import { AirportSubsectionCode, NavaidSubsectionCode, SectionCode } from './SectionCode';

interface BaseNdbNavaid extends DatabaseItem<SectionCode.Airport | SectionCode.Navaid> {
  sectionCode: SectionCode.Airport | SectionCode.Navaid;
  subSectionCode: AirportSubsectionCode.TerminalNdb | NavaidSubsectionCode.NdbNavaid;

  location: Coordinates;

  area: WaypointArea;

  frequency: KiloHertz;
  name?: string;
  class: NdbClass;
  /**
   * Beat frequency oscillator required to make identifier audible
   */
  bfoOperation: boolean;

  /**
   * Distance from centre location for nearby airport query
   */
  distance?: NauticalMiles;
}

export interface TerminalNdbNavaid extends BaseNdbNavaid, BaseFix<SectionCode.Airport> {
  sectionCode: SectionCode.Airport;
  subSectionCode: AirportSubsectionCode.TerminalNdb;
  airportIdent: string;
  area: WaypointArea.Terminal;
}

export interface EnrouteNdbNavaid extends BaseNdbNavaid, BaseFix<SectionCode.Navaid> {
  sectionCode: SectionCode.Navaid;
  subSectionCode: NavaidSubsectionCode.NdbNavaid;
  area: WaypointArea.Enroute;
}

export type NdbNavaid = TerminalNdbNavaid | EnrouteNdbNavaid;

export function isTerminalNdbNavaid(o: any): o is TerminalNdbNavaid {
  return (
    typeof o === 'object' &&
    o.sectionCode === SectionCode.Airport &&
    o.subSectionCode === AirportSubsectionCode.TerminalNdb
  );
}

export function isEnrouteNdbNavaid(o: any): o is TerminalNdbNavaid {
  return (
    typeof o === 'object' && o.sectionCode === SectionCode.Navaid && o.subSectionCode === NavaidSubsectionCode.NdbNavaid
  );
}

export function isNdbNavaid(o: any): o is NdbNavaid {
  return isTerminalNdbNavaid(o) || isEnrouteNdbNavaid(o);
}

export enum NdbClass {
  Unknown = 1 << 0,
  /**
   * Low power/compass locator, power < 25 W
   */
  Low = 1 << 1,
  /**
   * Medium, power 25 - 50 W
   */
  Medium = 1 << 2,
  /**
   * Normal, power 50 - 1999 W
   */
  Normal = 1 << 3,
  /**
   * High, power >= 2000 W
   */
  High = 1 << 4,
}
