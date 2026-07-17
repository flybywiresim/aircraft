// @ts-strict-ignore
import { Coordinates } from 'msfs-geo';
import {
  Airport,
  AirportCommunication,
  Airway,
  Approach,
  Arrival,
  DatabaseIdent,
  Departure,
  Fix,
  IlsNavaid,
  Marker,
  NdbNavaid,
  ProcedureLeg,
  Runway,
  VhfNavaid,
  Waypoint,
} from '../../../shared';
import { Gate } from '../../../shared/types/Gate';
import { DataInterface } from '../../../shared/DataInterface';
import { FAKE_AIRWAYS, FAKE_WAYPOINTS, TEST_AIRPORTS } from './TestData';
import { NearbyFacilityType, NearbyFacilityMonitor } from '../../NearbyFacilityMonitor';

export class TestBackend implements DataInterface {
  getDatabaseIdent(): Promise<DatabaseIdent> {
    throw new Error('Method not implemented.');
  }
  async getAirports(idents: string[]): Promise<Airport[]> {
    const ret: Airport[] = [];

    for (const ident of idents) {
      const testAirport = TEST_AIRPORTS.get(ident);

      if (testAirport) {
        ret.push(testAirport.airport);
      }
    }

    return ret;
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
  async getRunways(airportIdentifier: string): Promise<Runway[]> {
    const testAirport = TEST_AIRPORTS.get(airportIdentifier);

    if (!testAirport) {
      return [];
    }

    return testAirport.runways;
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
      if (ident in FAKE_WAYPOINTS) {
        ret.push(FAKE_WAYPOINTS[ident as keyof typeof FAKE_WAYPOINTS]);
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
  async getAirways(idents: string[]): Promise<Airway[]> {
    const ret: Airway[] = [];

    for (const ident of idents) {
      if (ident in FAKE_AIRWAYS) {
        ret.push(FAKE_AIRWAYS[ident as keyof typeof FAKE_AIRWAYS]);
      }
    }

    return ret;
  }
  async getAirwayByFix(ident: string, _icaoCode: string, airwayIdent?: string): Promise<Airway[]> {
    const ret: Airway[] = [];

    for (const [testAirwayIdent, airway] of Object.entries(FAKE_AIRWAYS)) {
      if (airwayIdent === testAirwayIdent) {
        // TODO check fixes
        ret.push(airway);
      }
    }

    return ret;
  }
  createNearbyFacilityMonitor(_type: NearbyFacilityType): NearbyFacilityMonitor {
    return {
      setLocation: EmptyCallback.Void,
      setRadius: EmptyCallback.Void,
      setMaxResults: EmptyCallback.Void,
      addListener: EmptyCallback.Void,
      getCurrentFacilities: () => [],
      destroy: EmptyCallback.Void,
    };
  }
  getVhfNavaidFromId(databaseId: string): Promise<VhfNavaid> {
    throw new Error(`Could not fetch facility "${databaseId}"!`);
  }
}
