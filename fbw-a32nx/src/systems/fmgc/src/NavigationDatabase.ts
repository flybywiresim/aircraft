// Copyright (c) 2021-2024 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Airport,
  Airway,
  Database,
  DatabaseIdent,
  Fix,
  IlsNavaid,
  MsfsBackend,
  NdbNavaid,
  ProcedureLeg,
  VhfNavaid,
  Waypoint,
} from '@flybywiresim/fbw-sdk';

/**
 * The backend for a navigation database
 */
export enum NavigationDatabaseBackend {
  Msfs,
  Navigraph,
}

/**
 * High level abstraction for the FMS navigation database
 *
 * Only to be used by user-facing functions to search for data. Raw flight plan editing should use the `backendDatabase` property directly
 */
export class NavigationDatabase {
  readonly backendDatabase: Database;

  constructor(backend: NavigationDatabaseBackend) {
    if (backend === NavigationDatabaseBackend.Msfs) {
      this.backendDatabase = new Database(new MsfsBackend() as any);
    } else {
      throw new Error("[FMS/DB] Cannot instantiate NavigationDatabase with backend other than 'Msfs'");
    }
  }

  async searchAirport(icao: string): Promise<Airport> {
    return this.backendDatabase.getAirports([icao]).then((results) => results[0]);
  }

  async searchWaypoint(ident: string): Promise<Waypoint[]> {
    return this.backendDatabase.getWaypoints([ident]);
  }

  async searchAllFix(ident: string): Promise<(Waypoint | VhfNavaid | NdbNavaid)[]> {
    return [
      ...(await this.backendDatabase.getWaypoints([ident])),
      ...(await this.backendDatabase.getNavaids([ident])),
      ...(await this.backendDatabase.getNDBs([ident])),
    ];
  }

  async searchVor(ident: string): Promise<VhfNavaid[]> {
    return this.backendDatabase.getNavaids([ident]);
  }

  async searchIls(ident: string): Promise<IlsNavaid[]> {
    return this.backendDatabase.getILSs([ident]);
  }

  async searchNdb(ident: string): Promise<NdbNavaid[]> {
    return this.backendDatabase.getNDBs([ident]);
  }

  async searchAllNavaid(ident: string): Promise<(VhfNavaid | NdbNavaid)[]> {
    return [...(await this.backendDatabase.getNavaids([ident])), ...(await this.backendDatabase.getNDBs([ident]))];
  }

  async searchAirway(ident: string, fromFix: Fix): Promise<Airway[]> {
    if (fromFix) {
      const airways = await this.backendDatabase.getAirwaysByFix(fromFix, ident);

      return airways.filter((it) => it.ident === ident);
    }

    // This does not work in the MSFS backend
    return this.backendDatabase.getAirways([ident]);
  }

  public getHolds(fixIdentifier: string, airportIdentifier: string): Promise<ProcedureLeg[]> {
    return this.backendDatabase.getHolds(fixIdentifier, airportIdentifier);
  }

  public getDatabaseIdent(): Promise<DatabaseIdent> {
    return this.backendDatabase.getDatabaseIdent();
  }
}
