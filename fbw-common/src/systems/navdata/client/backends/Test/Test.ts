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
import { Gate } from '../../../shared/types/Gate';
import { DataInterface } from '../../../shared/DataInterface';
import { WaypointFactory } from '@fmgc/flightplanning/waypoints/WaypointFactory'; // FIXME remove import from FMGC

export class TestBackend implements DataInterface {
  getDatabaseIdent(): Promise<DatabaseIdent> {
    throw new Error('Method not implemented.');
  }
  async getAirports(_airportIdentifier: string[]): Promise<Airport[]> {
    return [];
  }
  async getDepartures(_airportIdentifier: string): Promise<Departure[]> {
    return [];
  }
  async getArrivals(_airportIdentifier: string): Promise<Arrival[]> {
    return [];
  }
  async getApproaches(__airportIdentifier: string): Promise<Approach[]> {
    return [];
  }
  async getGates(_airportIdentifier: string): Promise<Gate[]> {
    return [];
  }
  async getHolds(_airportIdentifier: string): Promise<ProcedureLeg[]> {
    return [];
  }
  async getRunways(_airportIdentifier: string): Promise<Runway[]> {
    return [];
  }
  async getWaypointsAtAirport(_airportIdentifier: string): Promise<Waypoint[]> {
    return [];
  }
  async getNdbsAtAirport(_airportIdentifier: string): Promise<NdbNavaid[]> {
    return [];
  }
  async getIlsAtAirport(_airportIdentifier: string, _ident?: string, _lsIcaoCode?: string): Promise<IlsNavaid[]> {
    return [];
  }
  async getCommunicationsAtAirport(_airportIdentifier: string): Promise<AirportCommunication[]> {
    return [];
  }
  async getLsMarkers(_airportIdentifier: string, _runwayIdentifier: string, _lsIdentifier: string): Promise<Marker[]> {
    return [];
  }
  async getWaypoints(
    _airportIdentifier: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<Waypoint[]> {
    const ret: Waypoint[] = [];

    for (const ident of _airportIdentifier) {
      if (ident === 'NOSUS') {
        ret.push(WaypointFactory.fromLocation('NOSUS', { lat: 0, long: 0 }));
      } else if (ident === 'DEBUS') {
        ret.push(WaypointFactory.fromLocation('DEBUS', { lat: 0, long: 0 }));
      }
    }

    return ret;
  }
  async getNdbNavaids(
    _airportIdentifier: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<NdbNavaid[]> {
    return [];
  }
  async getVhfNavaids(
    _idents: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<VhfNavaid[]> {
    return [];
  }
  async getIlsNavaids(
    _idents: string[],
    _ppos?: Coordinates,
    _icaoCode?: string,
    _airportIdent?: string,
  ): Promise<IlsNavaid[]> {
    return [];
  }
  async getFixes(_idents: string[], _ppos?: Coordinates, _icaoCode?: string, _airportIdent?: string): Promise<Fix[]> {
    return [];
  }
  async getAirways(_idents: string[]): Promise<Airway[]> {
    return [];
  }
  async getAirwaysByFix(_ident: string, _icaoCode: string, _airwayIdent?: string): Promise<Airway[]> {
    return [];
  }
  async getNearbyAirports(
    _center: Coordinates,
    _range: NauticalMiles,
    _limit?: number,
    _longestRunwaySurfaces?: number,
    _longestRunwayLength?: number,
  ): Promise<readonly Airport[]> {
    return [];
  }
  async getNearbyAirways(
    _center: Coordinates,
    _range: NauticalMiles,
    _limit?: number,
    _levels?: AirwayLevel,
  ): Promise<readonly Airway[]> {
    return [];
  }
  async getNearbyVhfNavaids(
    _center: Coordinates,
    _range: number,
    _limit?: number,
    _classes?: VorClass,
    _types?: VhfNavaidType,
  ): Promise<readonly VhfNavaid[]> {
    return [];
  }
  async getNearbyNdbNavaids(
    _center: Coordinates,
    _range: NauticalMiles,
    _limit?: number,
    _classes?: NdbClass,
  ): Promise<readonly NdbNavaid[]> {
    return [];
  }
  async getNearbyWaypoints(_center: Coordinates, _range: NauticalMiles, _limit?: number): Promise<readonly Waypoint[]> {
    return [];
  }
  async getNearbyFixes(_center: Coordinates, _range: NauticalMiles, _limit?: number): Promise<readonly Fix[]> {
    return [];
  }
  async getControlledAirspaceInRange(
    _center: Coordinates,
    _range: NauticalMiles,
  ): Promise<readonly ControlledAirspace[]> {
    return [];
  }
  async getRestrictiveAirspaceInRange(
    _center: Coordinates,
    _range: NauticalMiles,
  ): Promise<readonly RestrictiveAirspace[]> {
    return [];
  }
}
