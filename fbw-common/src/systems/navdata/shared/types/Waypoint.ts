import { NauticalMiles } from 'msfs-geo';
import { AirportSubsectionCode, EnrouteSubsectionCode, SectionCode } from './SectionCode';
import { BaseFix, Fix } from './BaseFix';

/**
 * Waypoint area
 */
export enum WaypointArea {
  Enroute,
  Terminal,
}

/**
 * Waypoint fix
 */
export type Waypoint = EnrouteWaypoint | TerminalWaypoint;

export interface EnrouteWaypoint extends BaseWaypoint<SectionCode.Enroute> {
  subSectionCode: EnrouteSubsectionCode.Waypoints;
  area: WaypointArea.Enroute;
}

export interface TerminalWaypoint extends BaseWaypoint<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.TerminalWaypoints;
  area: WaypointArea.Terminal;
  airportIdent: string;
}

interface BaseWaypoint<T extends SectionCode> extends BaseFix<T> {
  name?: string;
  // TODO more...

  /**
   * Distance from centre location for nearby airport query
   */
  distance?: NauticalMiles;
}

export interface AbeamWaypoint extends EnrouteWaypoint {
  // TODO resolve circular dependency
  // "Fix" is defined from waypoints, this abeam waypoint references "Fix"
  // Also this is not really a DatabaseItem because abeam points are not stored in the database
  // but it is convenient to treat them as such
  referenceFix: Fix;
}
