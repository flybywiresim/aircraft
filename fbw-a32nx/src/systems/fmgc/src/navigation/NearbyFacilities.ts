// Copyright (c) 2021, 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { UpdateThrottler } from '@flybywiresim/fbw-sdk';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { Coordinates } from 'msfs-geo';
import { Airport, NdbNavaid, VhfNavaid, Waypoint } from 'msfs-navdata';

export class NearbyFacilities {
    private static instance: NearbyFacilities;

    private nearbyAirports: Airport[] = [];

    private nearbyNdbNavaids: NdbNavaid[] = [];

    private nearbyVhfNavaids: VhfNavaid[] = [];

    private nearbyWaypoints: Waypoint[] = [];

    version: number = 0;

    private ppos = { lat: 0, long: 0 };

    private pposValid = false;

    private throttler = new UpdateThrottler(10000);

    private radius = 381; // nautical miles

    private limit = 160;

    static getInstance(): NearbyFacilities {
        if (!NearbyFacilities.instance) {
            NearbyFacilities.instance = new NearbyFacilities();
        }
        return NearbyFacilities.instance;
    }

    getAirports(): IterableIterator<Airport> {
        return this.pposValid ? this.nearbyAirports.values() : [][Symbol.iterator]();
    }

    getNdbNavaids(): IterableIterator<NdbNavaid> {
        return this.pposValid ? this.nearbyNdbNavaids.values() : [][Symbol.iterator]();
    }

    getVhfNavaids(): IterableIterator<VhfNavaid> {
        return this.pposValid ? this.nearbyVhfNavaids.values() : [][Symbol.iterator]();
    }

    getWaypoints(): IterableIterator<Waypoint> {
        return this.pposValid ? this.nearbyWaypoints.values() : [][Symbol.iterator]();
    }

    init(): void {
        // Do nothing for now
    }

    async update(deltaTime: number): Promise<void> {
        if (this.throttler.canUpdate(deltaTime) === -1) {
            return;
        }

        const database = NavigationDatabaseService.activeDatabase.backendDatabase;

        if (this.pposValid && database) {
            // FIXME implement a more efficient diff-type interface in msfs-navdata
            this.nearbyAirports = await database.getNearbyAirports(this.ppos, this.radius, this.limit);
            this.nearbyNdbNavaids = await database.getNearbyNdbNavaids(this.ppos, this.radius, this.limit);
            this.nearbyVhfNavaids = await database.getNearbyVhfNavaids(this.ppos, this.radius, this.limit);
            // FIXME rename this method in msfs-navdata
            this.nearbyWaypoints = await database.getWaypointsInRange(this.ppos, this.radius, this.limit);
        }
    }

    setPpos(ppos: Coordinates | null) {
        if (ppos === null) {
            this.pposValid = false;
        } else if (!this.pposValid || Avionics.Utils.computeDistance(ppos, this.ppos) > 5) {
            this.ppos.lat = ppos.lat;
            this.ppos.long = ppos.long;
            this.pposValid = true;
        }
    }
}
