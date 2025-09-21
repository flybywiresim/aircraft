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
  logTroubleshootingError,
  MsfsBackend,
  NdbNavaid,
  NearbyFacilityMonitor,
  NearbyFacilityType,
  ProcedureLeg,
  TestBackend,
  VhfNavaid,
  Waypoint,
} from '@flybywiresim/fbw-sdk';
import { EventBus } from '@microsoft/msfs-sdk';
import { ErrorLogger } from '../../../../../fbw-common/src/systems/navdata/shared/types/ErrorLogger';

/**
 * The backend for a navigation database
 */
export enum NavigationDatabaseBackend {
  Msfs,
  Navigraph,
  Test,
}

/**
 * High level abstraction for the FMS navigation database
 *
 * Only to be used by user-facing functions to search for data. Raw flight plan editing should use the `backendDatabase` property directly
 */
export class NavigationDatabase {
  readonly backendDatabase: Database;

  constructor(
    private readonly bus: EventBus,
    backend: NavigationDatabaseBackend,
  ) {
    if (backend === NavigationDatabaseBackend.Msfs) {
      const logError: ErrorLogger = (msg: string) => {
        logTroubleshootingError(this.bus, msg);
        console.warn(msg);
      };
      this.backendDatabase = new Database(new MsfsBackend(logError));
    } else if (backend === NavigationDatabaseBackend.Test) {
      this.backendDatabase = new Database(new TestBackend());
    } else {
      throw new Error("[FMS/DB] Cannot instantiate NavigationDatabase with backend other than 'Msfs' or 'Test'");
    }
  }

  async searchAirport(icao: string): Promise<Airport> {
    return this.backendDatabase.getAirports([icao]).then((results) => results[0]);
  }

  async searchWaypoint(ident: string): Promise<Waypoint[]> {
    return this.backendDatabase.getWaypoints([ident]);
  }

  async searchAllFix(ident: string): Promise<Fix[]> {
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
      const airways = await this.backendDatabase.getAirwayByFix(fromFix, ident);

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

  public createNearbyFacilityMonitor(type: NearbyFacilityType): NearbyFacilityMonitor {
    return this.backendDatabase.createNearbyFacilityMonitor(type);
  }

  /**
   * Gets a VHF navaid from the database given the database ID.
   * @param databaseId The database ID.
   * @returns The VHF navaid.
   * @throws If the navaid doesn't exist (only call this if you already know it exists!).
   */
  public getVhfNavaidFromId(databaseId: string): Promise<VhfNavaid> {
    return this.backendDatabase.getVhfNavaidFromId(databaseId);
  }
}
