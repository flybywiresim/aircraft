// Copyright (c) 2021 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NearestSearchType } from '@fmgc/types/fstypes/FSEnums';
import { NearestSearch, RawAirport, RawIntersection, RawNdb, RawVor } from '@fmgc/types/fstypes/FSTypes';

// WARNING: this is a temporary implementation until the new nav database is complete
// Do not write any code which depends on it
export class NearbyFacilities {
    private listener;

    private initDone = false;

    public nearbyAirports: Map<string, RawAirport> = new Map();

    public nearbyNdbNavaids: Map<string, RawNdb> = new Map();

    public nearbyVhfNavaids: Map<string, RawVor> = new Map();

    public nearbyWaypoints: Map<string, RawIntersection> = new Map();

    public version: number = 0;

    private airportSessionId: number;

    private ndbSessionId: number;

    private vorSessionId: number;

    private waypointSessionId: number;

    private lastPpos = { lat: 0, long: 0 };

    private throttler = new UpdateThrottler(10000);

    private radius = 381 * 1852; // metres

    private limit = 160;

    constructor() {
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

    init(): void {
    }

    async update(deltaTime: number): Promise<void> {
        if (!this.initDone || this.throttler.canUpdate(deltaTime) === -1) {
            return;
        }

        const ppos = {
            lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
            long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
        };
        if (Avionics.Utils.computeDistance(ppos, this.lastPpos) > 5) {
            this.lastPpos = ppos;
        }
        Coherent.call('SEARCH_NEAREST', this.airportSessionId, this.lastPpos.lat, this.lastPpos.long, this.radius, this.limit);
        Coherent.call('SEARCH_NEAREST', this.vorSessionId, this.lastPpos.lat, this.lastPpos.long, this.radius, this.limit);
        Coherent.call('SEARCH_NEAREST', this.ndbSessionId, this.lastPpos.lat, this.lastPpos.long, this.radius, this.limit);
        Coherent.call('SEARCH_NEAREST', this.waypointSessionId, this.lastPpos.lat, this.lastPpos.long, this.radius, this.limit);
    }

    onSearchCompleted(result: NearestSearch): void {
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
            console.error('Unknown session', result.sessionId);
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
