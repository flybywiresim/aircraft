import { Coordinates, NauticalMiles } from 'msfs-geo';
import {
  DatabaseIdent,
  Airport,
  Departure,
  Arrival,
  Approach,
  ProcedureLeg,
  Runway,
  Waypoint,
  NdbNavaid,
  IlsNavaid,
  AirportCommunication,
  Marker,
  VhfNavaid,
  Fix,
  Airway,
  AirwayLevel,
  VorClass,
  VhfNavaidType,
  NdbClass,
  ControlledAirspace,
  RestrictiveAirspace,
} from 'navdata/shared';
import { Gate } from 'navdata/shared/types/Gate';
import { DataInterface } from '../../../shared/DataInterface';
import { WaypointFactory } from '@fmgc/flightplanning/waypoints/WaypointFactory';

export class TestBackend implements DataInterface {
  getDatabaseIdent(): Promise<DatabaseIdent> {
    throw new Error('Method not implemented.');
  }
  async getAirports(idents: string[]): Promise<Airport[]> {
    return [];
  }
  async getDepartures(airportIdentifier: string): Promise<Departure[]> {
    return [];
  }
  async getArrivals(airportIdentifier: string): Promise<Arrival[]> {
    return [];
  }
  async getApproaches(airportIdentifier: string): PrgetAiromise<Approach[]> {
    return [];
  }
  async getGates(airportIdentifier: string): Promise<Gate[]> {
    return [];
  }
  async getHolds(airportIdentifier: string): Promise<ProcedureLeg[]> {
    return [];
  }
  async getRunways(airportIdentifier: string): Promise<Runway[]> {
    return [];
  }
  async getWaypointsAtAirport(airportIdentifier: string): Promise<Waypoint[]> {
    return [];
  }
  async getNdbsAtAirport(airportIdentifier: string): Promise<NdbNavaid[]> {
    return [];
  }
  async getIlsAtAirport(airportIdentifier: string, ident?: string, lsIcaoCode?: string): Promise<IlsNavaid[]> {
    return [];
  }
  async getCommunicationsAtAirport(airportIdentifier: string): Promise<AirportCommunication[]> {
    return [];
  }
  async getLsMarkers(airportIdentifier: string, runwayIdentifier: string, lsIdentifier: string): Promise<Marker[]> {
    return [];
  }
  async getWaypoints(
    idents: string[],
    ppos?: Coordinates,
    icaoCode?: string,
    airportIdent?: string,
  ): Promise<Waypoint[]> {
    const ret: Waypoint[] = [];

    for (const ident of idents) {
      if (ident === 'NOSUS') {
        ret.push(WaypointFactory.fromLocation('NOSUS', { lat: 0, long: 0 }));
      } else if (ident === 'DEBUS') {
        ret.push(WaypointFactory.fromLocation('DEBUS', { lat: 0, long: 0 }));
      }
    }

    return ret;
  }
  async getNdbNavaids(
    idents: string[],
    ppos?: Coordinates,
    icaoCode?: string,
    airportIdent?: string,
  ): Promise<NdbNavaid[]> {
    return [];
  }
  async getVhfNavaids(
    idents: string[],
    ppos?: Coordinates,
    icaoCode?: string,
    airportIdent?: string,
  ): Promise<VhfNavaid[]> {
    return [];
  }
  async getIlsNavaids(
    idents: string[],
    ppos?: Coordinates,
    icaoCode?: string,
    airportIdent?: string,
  ): Promise<IlsNavaid[]> {
    return [];
  }
  async getFixes(idents: string[], ppos?: Coordinates, icaoCode?: string, airportIdent?: string): Promise<Fix[]> {
    return [];
  }
  async getAirways(idents: string[]): Promise<Airway[]> {
    return [];
  }
  async getAirwaysByFix(ident: string, icaoCode: string, airwayIdent?: string): Promise<Airway[]> {
    return [];
  }
  async getNearbyAirports(
    center: Coordinates,
    range: NauticalMiles,
    limit?: number,
    longestRunwaySurfaces?: number,
    longestRunwayLength?: number,
  ): Promise<readonly Airport[]> {
    return [];
  }
  async getNearbyAirways(
    center: Coordinates,
    range: NauticalMiles,
    limit?: number,
    levels?: AirwayLevel,
  ): Promise<readonly Airway[]> {
    return [];
  }
  async getNearbyVhfNavaids(
    center: Coordinates,
    range: number,
    limit?: number,
    classes?: VorClass,
    types?: VhfNavaidType,
  ): Promise<readonly VhfNavaid[]> {
    return [];
  }
  async getNearbyNdbNavaids(
    center: Coordinates,
    range: NauticalMiles,
    limit?: number,
    classes?: NdbClass,
  ): Promise<readonly NdbNavaid[]> {
    return [];
  }
  async getNearbyWaypoints(center: Coordinates, range: NauticalMiles, limit?: number): Promise<readonly Waypoint[]> {
    return [];
  }
  async getNearbyFixes(center: Coordinates, range: NauticalMiles, limit?: number): Promise<readonly Fix[]> {
    return [];
  }
  async getControlledAirspaceInRange(
    center: Coordinates,
    range: NauticalMiles,
  ): Promise<readonly ControlledAirspace[]> {
    return [];
  }
  async getRestrictiveAirspaceInRange(
    center: Coordinates,
    range: NauticalMiles,
  ): Promise<readonly RestrictiveAirspace[]> {
    return [];
  }
}
