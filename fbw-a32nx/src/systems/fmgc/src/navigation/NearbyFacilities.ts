// Copyright (c) 2021 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';
import { NearestSearchType } from '../types/fstypes/FSEnums';

// WARNING: this is a temporary implementation until the new nav database is complete
// Do not write any code which depends on it
export class NearbyFacilities {
    private static instance: NearbyFacilities;

    private readonly nearbyAirports: Map<string, RawAirport> = new Map();

    private readonly nearbyNdbNavaids: Map<string, RawNdb> = new Map();

    private readonly nearbyVhfNavaids: Map<string, RawVor> = new Map();

    private readonly nearbyWaypoints: Map<string, RawIntersection> = new Map();

    version: number = 0;

    private listener: ViewListener.ViewListener;

    private initDone = false;

    private airportSessionId: number;

    private ndbSessionId: number;

    private vorSessionId: number;

    private waypointSessionId: number;

    private ppos = { lat: 0, long: 0 };

    private pposValid = false;

    private throttler = new A32NX_Util.UpdateThrottler(10000);

    private radius = 381 * 1852; // metres

    private limit = 160;

    private constructor() {
        this.listener = RegisterViewListener('JS_LISTENER_FACILITY', async () => {
            this.listener.on('SendAirport', this.addAirport.bind(this));
            this.listener.on('SendIntersection', this.addWaypoint.bind(this));
            this.listener.on('SendNdb', this.addNdbNavaid.bind(this));
            this.listener.on('SendVor', this.addVhfNavaid.bind(this));
            this.listener.on('NearestSearchCompleted', this.onSearchCompleted.bind(this));

            this.airportSessionId = await Coherent.call('START_NEAREST_SEARCH_SESSION', NearestSearchType.Airport);
            this.ndbSessionId = await Coherent.call('START_NEAREST_SEARCH_SESSION', NearestSearchType.Ndb);
            this.vorSessionId = await Coherent.call('START_NEAREST_SEARCH_SESSION', NearestSearchType.Vor);
            this.waypointSessionId = await Coherent.call('START_NEAREST_SEARCH_SESSION', NearestSearchType.Intersection);
            this.initDone = true;
        });
    }

    static getInstance(): NearbyFacilities {
        if (!NearbyFacilities.instance) {
            NearbyFacilities.instance = new NearbyFacilities();
        }
        return NearbyFacilities.instance;
    }

    getAirports(): IterableIterator<RawAirport> {
        return this.pposValid ? this.nearbyAirports.values() : [][Symbol.iterator]();
    }

    getNdbNavaids(): IterableIterator<RawNdb> {
        return this.pposValid ? this.nearbyNdbNavaids.values() : [][Symbol.iterator]();
    }

    getVhfNavaids(): IterableIterator<RawVor> {
        return this.pposValid ? this.nearbyVhfNavaids.values() : [][Symbol.iterator]();
    }

    getWaypoints(): IterableIterator<RawIntersection> {
        return this.pposValid ? this.nearbyWaypoints.values() : [][Symbol.iterator]();
    }

    init(): void {
        // Do nothing for now
    }

    async update(deltaTime: number): Promise<void> {
        if (!this.initDone || this.throttler.canUpdate(deltaTime) === -1) {
            return;
        }

        if (this.pposValid) {
            Coherent.call('SEARCH_NEAREST', this.airportSessionId, this.ppos.lat, this.ppos.long, this.radius, this.limit);
            Coherent.call('SEARCH_NEAREST', this.vorSessionId, this.ppos.lat, this.ppos.long, this.radius, this.limit);
            Coherent.call('SEARCH_NEAREST', this.ndbSessionId, this.ppos.lat, this.ppos.long, this.radius, this.limit);
            Coherent.call('SEARCH_NEAREST', this.waypointSessionId, this.ppos.lat, this.ppos.long, this.radius, this.limit);
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

    private onSearchCompleted(result: NearestSearch): void {
        let nearestList: Map<string, RawAirport | RawNdb | RawVor | RawIntersection>;
        let loadCall;
        switch (result.sessionId) {
        case this.airportSessionId:
            nearestList = this.nearbyAirports;
            loadCall = 'LOAD_AIRPORTS';
            break;
        case this.ndbSessionId:
            nearestList = this.nearbyNdbNavaids;
            loadCall = 'LOAD_NDBS';
            break;
        case this.vorSessionId:
            nearestList = this.nearbyVhfNavaids;
            loadCall = 'LOAD_VORS';
            break;
        case this.waypointSessionId:
            nearestList = this.nearbyWaypoints;
            loadCall = 'LOAD_INTERSECTIONS';
            break;
        default:
            return;
        }

        for (const icao of result.removed) {
            delete nearestList[icao];
            this.version++;
        }

        const loadIcaos = [];
        for (const icao of result.added) {
            if (nearestList.has(icao)) {
                continue;
            }
            loadIcaos.push(icao);
        }
        if (loadIcaos.length > 0) {
            Coherent.call(loadCall, loadIcaos);
        }
    }

    addAirport(airport: RawAirport): void {
        this.nearbyAirports.set(airport.icao, airport);
        this.version++;
    }

    addWaypoint(waypoint: RawIntersection): void {
        this.nearbyWaypoints.set(waypoint.icao, waypoint);
        this.version++;
    }

    addNdbNavaid(ndb: RawNdb): void {
        this.nearbyNdbNavaids.set(ndb.icao, ndb);
        this.version++;
    }

    addVhfNavaid(vor: RawVor): void {
        this.nearbyVhfNavaids.set(vor.icao, vor);
        this.version++;
    }
}
