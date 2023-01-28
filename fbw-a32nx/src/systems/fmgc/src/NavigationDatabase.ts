// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    Airport,
    Airway,
    Approach,
    ApproachType,
    Database,
    ExternalBackend,
    MsfsBackend,
    NdbNavaid,
    VhfNavaid,
    Waypoint,
} from 'msfs-navdata';

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
    readonly backendDatabase: Database

    constructor(
        backend: NavigationDatabaseBackend,
    ) {
        if (backend === NavigationDatabaseBackend.Msfs) {
            this.backendDatabase = new Database(new MsfsBackend() as any);
        } else if (backend === NavigationDatabaseBackend.Navigraph) {
            this.backendDatabase = new Database(new ExternalBackend('http://localhost:5000'));
        } else {
            throw new Error('[FMS/DB] Cannot instantiate NavigationDatabase with backend other than \'Msfs\' or \'Navigraph\'');
        }
    }

    async searchAirport(icao: string): Promise<Airport> {
        return this.backendDatabase.getAirports([icao]).then((results) => results[0]);
    }

    async searchFix(ident: string): Promise<Waypoint[]> {
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

    async searchAirway(ident: string): Promise<Airway[]> {
        return this.backendDatabase.getAirways([ident]);
    }

    private static approachSuffix(approach: Approach): string {
        if (!approach.runwayIdent) {
            return '';
        }

        if (approach.multipleIndicator.length < 1) {
            return approach.runwayIdent.substring(2);
        }

        return `${approach.runwayIdent.substring(2).padEnd(3, '-')}${approach.multipleIndicator}`;
    }

    static formatLongApproachIdent(approach: Approach): string {
        const suffix = this.approachSuffix(approach);

        switch (approach.type) {
        case ApproachType.LocBackcourse: // TODO confirm
        case ApproachType.Loc:
            return `LOC${suffix}`;
        case ApproachType.VorDme:
        case ApproachType.Vor:
        case ApproachType.Vortac:
        case ApproachType.Tacan: // TODO confirm
            return `VOR${suffix}`;
        case ApproachType.Fms:
        case ApproachType.Gps:
        case ApproachType.Rnav:
            return `RNAV${suffix}`;
        case ApproachType.Igs:
            return `IGS${suffix}`;
        case ApproachType.Ils:
            return `ILS${suffix}`;
        case ApproachType.Gls:
            return `GLS${suffix}`;
        case ApproachType.Mls:
        case ApproachType.MlsTypeA:
        case ApproachType.MlsTypeBC:
            return `MLS${suffix}`;
        case ApproachType.Ndb:
        case ApproachType.NdbDme:
            return `NDB${suffix}`;
        case ApproachType.Sdf:
            return `SDF${suffix}`;
        case ApproachType.Lda:
            return `LDA${suffix}`;
        default:
            return `???${suffix}`;
        }
    }

    static formatShortApproachIdent(approach: Approach): string {
        const ident = this.formatLongApproachIdent(approach);
        if (ident.startsWith('RNAV')) {
            return `RNV${ident.substring(4)}`;
        }
        return ident;
    }

    static formatLongRunwayIdent(airportIdent: string, runwayIdent: string): string {
        return `${airportIdent}${this.formatShortRunwayIdent(runwayIdent)}`;
    }

    static formatShortRunwayIdent(runwayIdent: string): string {
        return runwayIdent.substring(2);
    }
}
