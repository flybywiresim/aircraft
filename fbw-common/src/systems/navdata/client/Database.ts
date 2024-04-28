import { Coordinates, NauticalMiles } from 'msfs-geo';
import {
  Airport,
  AirwayLevel,
  Approach,
  Arrival,
  Departure,
  Runway,
  Airway,
  IlsNavaid,
  NdbNavaid,
  NdbClass,
  Marker,
  ProcedureLeg,
  VhfNavaid,
  VhfNavaidType,
  VorClass,
  Waypoint,
  DatabaseIdent,
  DataInterface,
  RestrictiveAirspace,
} from '../shared';
import { AirportCommunication } from '../shared/types/Communication';
import { ControlledAirspace } from '../shared/types/Airspace';
import { Gate } from '../shared/types/Gate';

export class Database {
  backend: DataInterface;

  constructor(backend: DataInterface) {
    this.backend = backend;
  }

  public getDatabaseIdent(): Promise<DatabaseIdent> {
    return this.backend.getDatabaseIdent();
  }

  public getAirports(idents: string[]): Promise<Airport[]> {
    return this.backend.getAirports(idents);
  }

  public async getRunways(airportIdentifier: string, procedure?: Departure | Arrival): Promise<Runway[]> {
    let runways = await this.backend.getRunways(airportIdentifier);
    if (procedure) {
      runways = runways.filter((runway) => procedure.runwayTransitions.find((trans) => trans.ident === runway.ident));
    }
    return runways;
  }

  public async getDepartures(airportIdentifier: string, runwayIdentifier?: string): Promise<Departure[]> {
    let departures = await this.backend.getDepartures(airportIdentifier);
    if (runwayIdentifier) {
      departures = departures.filter((departure) =>
        departure.runwayTransitions.find((trans) => trans.ident === runwayIdentifier),
      );
    }
    return departures;
  }

  public async getArrivals(airportIdentifier: string, approach?: Approach): Promise<Arrival[]> {
    let arrivals = await this.backend.getArrivals(airportIdentifier);
    if (approach) {
      arrivals = arrivals.filter((arrival) =>
        arrival.runwayTransitions.find(
          (trans) => approach.runwayIdent === undefined || trans.ident === approach.runwayIdent,
        ),
      );
    }
    return arrivals;
  }

  public async getApproaches(airportIdentifier: string, arrival?: Arrival): Promise<Approach[]> {
    let approaches = await this.backend.getApproaches(airportIdentifier);
    if (arrival) {
      approaches = approaches.filter((approach) =>
        arrival.runwayTransitions.find(
          (trans) => approach.runwayIdent === undefined || trans.ident === approach.runwayIdent,
        ),
      );
    }
    return approaches;
  }

  public async getGates(airportIdentifier: string): Promise<Gate[]> {
    return this.backend.getGates(airportIdentifier);
  }

  public async getHolds(fixIdentifier: string, airportIdentifier: string): Promise<ProcedureLeg[]> {
    return (await this.backend.getHolds(airportIdentifier)).filter((hold) => hold.waypoint?.ident === fixIdentifier);
  }

  public getIlsAtAirport(airportIdentifier: string, ident?: string, lsIcaoCode?: string): Promise<IlsNavaid[]> {
    return this.backend.getIlsAtAirport(airportIdentifier, ident, lsIcaoCode);
  }

  public getLsMarkers(airportIdentifier: string, runwayIdentifier: string, llzIdentifier: string): Promise<Marker[]> {
    return this.backend.getLsMarkers(airportIdentifier, runwayIdentifier, llzIdentifier);
  }

  public getNDBsAtAirport(airportIdentifier: string): Promise<NdbNavaid[]> {
    return this.backend.getNdbsAtAirport(airportIdentifier);
  }

  public getWaypointsAtAirport(airportIdentifier: string): Promise<Waypoint[]> {
    return this.backend.getWaypointsAtAirport(airportIdentifier);
  }

  getCommunicationsAtAirport(airportIdentifier: string): Promise<AirportCommunication[]> {
    return this.backend.getCommunicationsAtAirport(airportIdentifier);
  }

  public getWaypoints(idents: string[]): Promise<Waypoint[]> {
    return this.backend.getWaypoints(idents);
  }

  public getNavaids(idents: string[]): Promise<VhfNavaid[]> {
    return this.backend.getVhfNavaids(idents);
  }

  public getNDBs(idents: string[]): Promise<NdbNavaid[]> {
    return this.backend.getNdbNavaids(idents);
  }

  public getILSs(idents: string[]): Promise<IlsNavaid[]> {
    return this.backend.getIlsNavaids(idents);
  }

  public async getAirways(idents: string[]): Promise<Airway[]> {
    return this.backend.getAirways(idents);
  }

  public async getAirwaysByFix(fix: Waypoint | NdbNavaid | VhfNavaid, airwayIdent?: string): Promise<Airway[]> {
    return this.backend.getAirwaysByFix(fix.ident, fix.icaoCode, airwayIdent);
  }

  public getNearbyAirports(
    center: Coordinates,
    range: number,
    limit?: number,
    longestRunwaySurfaces?: number,
    longestRunwayLength?: number,
  ): Promise<readonly Airport[]> {
    return this.backend.getNearbyAirports(center, range, limit, longestRunwaySurfaces, longestRunwayLength);
  }

  public getNearbyAirways(
    center: Coordinates,
    range: number,
    limit?: number,
    levels?: AirwayLevel,
  ): Promise<readonly Airway[]> {
    return this.backend.getNearbyAirways(center, range, limit, levels);
  }

  public getNearbyVhfNavaids(
    center: Coordinates,
    range: number,
    limit?: number,
    classes?: VorClass,
    types?: VhfNavaidType,
  ): Promise<readonly VhfNavaid[]> {
    return this.backend.getNearbyVhfNavaids(center, range, limit, classes, types);
  }

  public getNearbyNdbNavaids(
    center: Coordinates,
    range: number,
    limit?: number,
    classes?: NdbClass,
  ): Promise<readonly NdbNavaid[]> {
    return this.backend.getNearbyNdbNavaids(center, range, limit, classes);
  }

  public getWaypointsInRange(center: Coordinates, range: number, limit?: number): Promise<readonly Waypoint[]> {
    return this.backend.getNearbyWaypoints(center, range, limit);
  }

  public getControlledAirspacesInRange(
    center: Coordinates,
    range: NauticalMiles,
  ): Promise<readonly ControlledAirspace[]> {
    return this.backend.getControlledAirspaceInRange(center, range);
  }

  public getRestrictiveAirspacesInRange(
    center: Coordinates,
    range: NauticalMiles,
  ): Promise<readonly RestrictiveAirspace[]> {
    return this.backend.getRestrictiveAirspaceInRange(center, range);
  }
}
