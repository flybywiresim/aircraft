import { NauticalMiles } from 'msfs-geo';
import { AirportSubsectionCode, EnrouteSubsectionCode, SectionCode } from './SectionCode';
import { BaseFix } from './BaseFix';

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
  // FIXME hack for runways
  subSectionCode: AirportSubsectionCode.TerminalWaypoints | AirportSubsectionCode.Runways;
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
