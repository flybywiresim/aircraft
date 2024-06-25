import { Coordinates, NauticalMiles } from 'msfs-geo';
import { Airport } from './types/Airport';
import { Departure } from './types/Departure';
import { Arrival } from './types/Arrival';
import { Approach } from './types/Approach';
import { DatabaseIdent } from './types/DatabaseIdent';
import { Waypoint } from './types/Waypoint';
import { NdbNavaid, NdbClass } from './types/NdbNavaid';
import { IlsNavaid } from './types/IlsNavaid';
import { Runway } from './types/Runway';
import { Airway, AirwayLevel } from './types/Airway';
import { VhfNavaid, VhfNavaidType, VorClass } from './types/VhfNavaid';
import { AirportCommunication } from './types/Communication';
import { ControlledAirspace, RestrictiveAirspace } from './types/Airspace';
import { Fix, ProcedureLeg } from '.';
import { Marker } from './types/Marker';
import { Gate } from './types/Gate';

// FIXME move to more appropriate place..
export enum NavaidArea {
  Terminal = 1 << 0,
  EnRoute = 1 << 1,
}

export interface DataInterface {
  /**
   * Retrieve source and effectivity dates for this database
   */
  getDatabaseIdent(): Promise<DatabaseIdent>;

  /**
   * Retrieve airports from the database
   * @param idents 4-letter ICAO codes for the airports
   */
  getAirports(idents: string[]): Promise<Airport[]>;

  /**
   * Retreive the departures/SIDs for an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getDepartures(airportIdentifier: string): Promise<Departure[]>;

  /**
   * Retreive the arrivals/STARs for an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getArrivals(airportIdentifier: string): Promise<Arrival[]>;

  /**
   * Retreive the approaches for an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getApproaches(airportIdentifier: string): Promise<Approach[]>;

  /**
   * Retreive the gates at an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getGates(airportIdentifier: string): Promise<Gate[]>;

  /**
   * Retreive the terminal area holds for an airport
   *
   * Not available for all backends
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getHolds(airportIdentifier: string): Promise<ProcedureLeg[]>;

  /**
   * Retreive the runways at an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getRunways(airportIdentifier: string): Promise<Runway[]>;

  /**
   * Retreive the terminal area waypoints at an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getWaypointsAtAirport(airportIdentifier: string): Promise<Waypoint[]>;

  /**
   * Retreive the terminal area NDB navaids at an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getNdbsAtAirport(airportIdentifier: string): Promise<NdbNavaid[]>;

  /**
   * Retreive the ILS navaids at an airport
   * @todo generalise to all LS types?
   * @param airportIdentifier 4-letter ICAO code for the airport
   * @param ident ILS identifier
   * @param lsIcaoCode ICAO code for the LS type
   */
  getIlsAtAirport(airportIdentifier: string, ident?: string, lsIcaoCode?: string): Promise<IlsNavaid[]>;

  /**
   * Retreive the communication frequencies at an airport
   * @param airportIdentifier 4-letter ICAO code for the airport
   */
  getCommunicationsAtAirport(airportIdentifier: string): Promise<AirportCommunication[]>;

  /**
   * Retreive the marker beacons at an airport
   *
   * Not available for all backends
   * @param airportIdentifier 4-letter ICAO code for the airport
   * @param runwayIdentifier e.g "EDDF25C"
   * @param lsIdentifier the ILS the markers are associated with
   */
  getLsMarkers(airportIdentifier: string, runwayIdentifier: string, lsIdentifier: string): Promise<Marker[]>;

  /**
   * Retrieve waypoint(s) from the database
   * @param idents waypoint identifier
   * @param ppos provide ppos if you want the distance from this position to each waypoint
   * @param icaoCode provide the 2-letter ICAO region if you want to limit the query to a region
   * @param airportIdent provide the 4-letter ICAO airport code if you want to limit the query to a terminal area
   */
  getWaypoints(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<Waypoint[]>;

  /**
   * Retrieve NDB navaid(s) from the database
   * @param idents NDB identifier
   * @param ppos provide ppos if you want the distance from this position to each navaid
   * @param icaoCode provide the 2-letter ICAO region if you want to limit the query to a region
   * @param airportIdent provide the 4-letter ICAO airport code if you want to limit the query to a terminal area
   */
  getNdbNavaids(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<NdbNavaid[]>;

  /**
   * Retrieve VHF navaid(s) from the database, including ILS/LOC
   * @param idents navaid identifier
   * @param ppos provide ppos if you want the distance from this position to each navaid
   * @param icaoCode provide the 2-letter ICAO region if you want to limit the query to a region
   * @param airportIdent provide the 4-letter ICAO airport code if you want to limit the query to a terminal area
   */
  getVhfNavaids(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<VhfNavaid[]>;

  /**
   * Retrieve ILS/LOC navaid(s) from the database
   * @param idents navaid identifier
   * @param ppos provide ppos if you want the distance from this position to each navaid
   * @param icaoCode provide the 2-letter ICAO region if you want to limit the query to a region
   * @param airportIdent provide the 4-letter ICAO airport code if you want to limit the query to a terminal area
   */
  getIlsNavaids(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<IlsNavaid[]>;

  /**
   * Retrieve fixes (waypoints, NDB navaids, VHF navaids including ILS/LOC) from the database
   * @param idents navaid identifier
   * @param ppos provide ppos if you want the distance from this position to each navaid
   * @param icaoCode provide the 2-letter ICAO region if you want to limit the query to a region
   * @param airportIdent provide the 4-letter ICAO airport code if you want to limit the query to a terminal area
   */
  getFixes(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<Fix[]>;

  /**
   * Retrieve arbitrary airway(s) by ident
   *
   * Not available for all backends
   * @param idents airway identifiers
   */
  getAirways(idents: string[]): Promise<Airway[]>;

  /**
   * Retrieve airways to/from a given fix
   * @param ident fix identifier
   * @param icaoCode 2-letter ICAO region code of the fix (to uniquely identify it)
   * @param airwayIdent optional airway identifier to filter results by, no filter is applied if undefined
   */
  getAirwaysByFix(ident: string, icaoCode: string, airwayIdent?: string): Promise<Airway[]>;

  getNearbyAirports(
    center: Coordinates,
    range: NauticalMiles,
    limit?: number,
    longestRunwaySurfaces?: number,
    longestRunwayLength?: number,
  ): Promise<readonly Airport[]>;
  getNearbyAirways(
    center: Coordinates,
    range: NauticalMiles,
    limit?: number,
    levels?: AirwayLevel,
  ): Promise<readonly Airway[]>;
  getNearbyVhfNavaids(
    center: Coordinates,
    range: number,
    limit?: number,
    classes?: VorClass,
    types?: VhfNavaidType,
  ): Promise<readonly VhfNavaid[]>;
  getNearbyNdbNavaids(
    center: Coordinates,
    range: NauticalMiles,
    limit?: number,
    classes?: NdbClass,
  ): Promise<readonly NdbNavaid[]>;
  getNearbyWaypoints(center: Coordinates, range: NauticalMiles, limit?: number): Promise<readonly Waypoint[]>;
  getNearbyFixes(center: Coordinates, range: NauticalMiles, limit?: number): Promise<readonly Fix[]>;

  getControlledAirspaceInRange(center: Coordinates, range: NauticalMiles): Promise<readonly ControlledAirspace[]>;
  getRestrictiveAirspaceInRange(center: Coordinates, range: NauticalMiles): Promise<readonly RestrictiveAirspace[]>;
}
