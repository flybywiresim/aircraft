;
;
;
;
;
class NearestAirspacesLoader {
    constructor(_instrument) {
        this.lla = new LatLongAlt;
        this.nearestAirspaces = [];
        this._updating = false;
        this.instrument = _instrument;
    }
    update() {
        if (!this._updating && (this._lastlla == undefined || Math.abs(this._lastlla.lat - this.lla.lat) > 0.25 || Math.abs(this._lastlla.long - this.lla.long) > 0.25)) {
            this._updating = true;
            Coherent.call("SET_LOAD_LATLON", this.lla.lat, this.lla.long).then(() => {
                Coherent.call("GET_NEAREST_AIRSPACES").then((airspaces) => {
                    for (let i = 0; i < airspaces.length; i++) {
                        let airspaceData = airspaces[i];
                        if (airspaceData.type !== 1) {
                            let name = "airspace-";
                            name += airspaceData.type;
                            if (airspaceData.segments.length > 2) {
                                name += airspaceData.segments[0].lat.toFixed(5);
                                name += airspaceData.segments[1].long.toFixed(5);
                            }
                            if (!this.nearestAirspaces.find(a => { return a.name === name; })) {
                                let nearestAirspace = new NearestAirspace();
                                nearestAirspace.type = airspaces[i].type;
                                nearestAirspace.name = name;
                                nearestAirspace.ident = nearestAirspace.name;
                                nearestAirspace.segments = airspaces[i].segments;
                                this.nearestAirspaces.push(nearestAirspace);
                                if (this.onNewAirspaceAddedCallback) {
                                    this.onNewAirspaceAddedCallback(nearestAirspace);
                                }
                            }
                        }
                    }
                    this._updating = false;
                    this._lastlla = this.lla.toLatLong();
                    if (this.nearestAirspaces.length > 50) {
                        this.nearestAirspaces.splice(0, this.nearestAirspaces.length - 50);
                    }
                });
            });
        }
    }
}
class FacilityLoader {
    constructor(_instrument) {
        this.pendingRequests = [];
        this.loadingFacilities = [];
        this.loadedFacilities = [];
        this.loadedAirwayDatas = new Map();
        this._isRegistered = false;
        this._isCompletelyRegistered = false;
        this._maxSimultaneousCoherentCalls = 20;
        this._pendingGetFacilityCoherentCall = [];
        this.instrument = _instrument;
        this._pendingRawRequests = new Map();
        this.registerListener();
    }
    registerListener() {
        if (this._isRegistered) {
            return;
        }
        this._isRegistered = true;
        RegisterViewListener("JS_LISTENER_FACILITY", () => {
            console.log("JS_LISTENER_FACILITY registered.");
            Coherent.on("SendAirport", (data) => {
                this.addFacility(data);
            });
            Coherent.on("SendIntersection", (data) => {
                this.addFacility(data);
            });
            Coherent.on("SendVor", (data) => {
                this.addFacility(data);
            });
            Coherent.on("SendNdb", (data) => {
                this.addFacility(data);
            });
            this._isCompletelyRegistered = true;
        });
    }
    update() {
        if (this._pendingGetFacilityCoherentCall.length > 0) {
            for (let i = 0; i < 5; i++) {
                if (this.loadingFacilities.length < this._maxSimultaneousCoherentCalls) {
                    let coherentCall = this._pendingGetFacilityCoherentCall.splice(0, 1)[0];
                    if (coherentCall) {
                        coherentCall();
                    }
                }
            }
        }
    }
    addFacility(_data) {

        _data.icaoTrimed = _data.icao.trim();
        
        // After a "Coherent.call('LOAD_*', icao)" we get many responses received by "Coherent.on('Send*'") for the same facility.
        // The assumption is: The data is the same across the multiple receptions. If this does not hold, this approach needs to be reconsidered.
        // The idea is to
        //  - avoid redundancy in "loadedFacilities"
        //  - keep subsequent search operations fast at the cost of an existence check here
        //  - reduce the need to reload facilities, after they got shifted out due to the 1000 elements limit
        // So: Load the facility only, if we don't have it already.
        // We, however, allow two variants of a facility: With and without routes. Some users of "loadedFacilites" look for the variant with routes, some for the other.
        let facilityIndex = this.loadedFacilities.findIndex(f => f.icao === _data.icao && ((f.routes === undefined && _data.routes === undefined) || (f.routes !== undefined && _data.routes !== undefined)));
        let facilityLoadedAlready = facilityIndex > -1;
        if (!facilityLoadedAlready) {
            this.loadedFacilities.push(_data);
            while (this.loadedFacilities.length > 1000) {
                this.loadedFacilities.splice(0, 1);
            }
        }
        
        const pendingRequest = this._pendingRawRequests.get(_data.icaoTrimed);
        if (pendingRequest) {
            clearTimeout(pendingRequest.timeout);
            pendingRequest.resolve(_data);
            this._pendingRawRequests.delete(_data.icaoTrimed);
        }
    }
    /**
     * Gets the raw facility data for a given icao.
     * @param {String} icao The ICAO to get the raw facility data for.
     */
    getFacilityRaw(icao, timeout = 1000) {
        return new Promise((resolve, reject) => {
            const request = {
                resolve: resolve,
                timeout: setTimeout(() => reject(), timeout),
                icao: icao.trim()
            };

            this._pendingRawRequests.set(request.icao, request);
            const type = icao[0];
            switch (type) {
                case 'A':
                    Coherent.call('LOAD_AIRPORT', icao);
                    break;
                case 'W':
                    Coherent.call('LOAD_INTERSECTION', icao);
                    break;
                case 'V':
                    Coherent.call('LOAD_VOR', icao);
                    break;
                case 'N':
                    Coherent.call('LOAD_NDB', icao);
                    break;
            }
        });
    }
    getFacilityCB(icao, callback, loadFacilitiesTransitively = false) {
        if (this._isCompletelyRegistered && this.loadingFacilities.length < this._maxSimultaneousCoherentCalls) {
            this.getFacilityDataCB(icao, (data) => {
                let waypoint;
                if (data) {
                    waypoint = new WayPoint(this.instrument);
                    waypoint.SetFromIFacility(data, () => {
                        callback(waypoint);
                    }, loadFacilitiesTransitively);
                }
                else {
                    callback(undefined);
                }
            });
        }
        else {
            this._pendingGetFacilityCoherentCall.push(this.getFacilityCB.bind(this, icao, callback));
        }
    }
    async waitRegistration() {
        if (!this._isCompletelyRegistered) {
            let waitForCompleteRegistration = () => {
                return new Promise(resolve => {
                    let f = () => {
                        if (this._isCompletelyRegistered) {
                            resolve();
                        }
                        else {
                            this.instrument.requestCall(f);
                        }
                    };
                    f();
                });
            };
            await waitForCompleteRegistration();
        }
    }
    async getFacility(icao, loadFacilitiesTransitively = false) {
        return new Promise(resolve => {
            return this.getFacilityCB(icao, (wp) => {
                resolve(wp);
            }, loadFacilitiesTransitively);
        });
    }
    getFacilityDataCB(icao, callback) {
        if (this._isCompletelyRegistered) {
            if (!icao) {
                return callback(undefined);
            }
            let typeChar = icao[0];
            if (typeChar === "W") {
                return this.getIntersectionDataCB(icao, callback);
            }
            else if (typeChar === "A") {
                return this.getAirportDataCB(icao, callback);
            }
            else if (typeChar === "V") {
                return this.getVorDataCB(icao, callback);
            }
            else if (typeChar === "N") {
                return this.getNdbDataCB(icao, callback);
            }
            else {
                return callback(undefined);
            }
        }
        else {
            this._pendingGetFacilityCoherentCall.push(this.getFacilityDataCB.bind(this, icao, callback));
        }
    }
    async getFacilityData(icao) {
        return new Promise(resolve => {
            return this.getFacilityDataCB(icao, data => {
                resolve(data);
            });
        });
    }
    async getAirport(icao, loadFacilitiesTransitively = false) {
        await this.waitRegistration();
        let data = await this.getAirportData(icao);
        if (data) {
            let airport = new WayPoint(this.instrument);
            airport.SetFromIFacility(data, EmptyCallback.Void, loadFacilitiesTransitively);
            return airport;
        }
    }
    getAirportDataCB(icao, callback) {
        if (this._isCompletelyRegistered && this.loadingFacilities.length < this._maxSimultaneousCoherentCalls) {
            icao = icao.trim();
            let airport = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
            if (airport) {
                // console.log("Airport found in loadedFacilities array.");
                return callback(airport);
            }
            else {
                // console.log("Airport not found in loadedFacilities array.");
                // console.log(this.loadedFacilities);
            }
            if (icao[0] !== "A") {
                console.warn("Icao mismatch trying to load AIRPORT of invalid icao '" + icao + "'");
            }
            if (this.loadingFacilities.indexOf(icao) === -1) {
                Coherent.call("LOAD_AIRPORT", icao);
                this.loadingFacilities.push(icao);
            }
            let attempts = 0;
            let checkDataLoaded = () => {
                let airport = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                if (airport) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    callback(airport);
                }
                else {
                    attempts++;
                    if (attempts > 5) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        callback(undefined);
                    }
                    else {
                        this.instrument.requestCall(checkDataLoaded);
                    }
                }
            };
            checkDataLoaded();
        }
        else {
            this.instrument.requestCall(this.getAirportDataCB.bind(this, icao, callback));
        }
    }
    async getAirportData(icao) {
        await this.waitRegistration();
        icao = icao.trim();
        let airport = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
        if (airport) {
            return airport;
        }
        if (icao[0] !== "A") {
            console.warn("Icao mismatch trying to load AIRPORT of invalid icao '" + icao + "'");
        }
        if (this.loadingFacilities.indexOf(icao) === -1) {
            Coherent.call("LOAD_AIRPORT", icao);
            this.loadingFacilities.push(icao);
        }
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedAirportCallback = () => {
                let airport = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                if (airport) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    resolve(airport);
                }
                else {
                    attempts++;
                    if (attempts > 5) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        resolve(undefined);
                    }
                    else {
                        this.instrument.requestCall(loadedAirportCallback);
                    }
                }
            };
            loadedAirportCallback();
        });
    }
    async getAirports(icaos) {
        await this.waitRegistration();
        let airports = [];
        let datas = await this.getAirportsData(icaos);
        if (datas) {
            for (let i = 0; i < datas.length; i++) {
                let airport = new WayPoint(this.instrument);
                airport.SetFromIFacility(datas[i]);
                airports.push(airport);
            }
        }
        return airports;
    }
    async getAirportsData(icaos) {
        await this.waitRegistration();
        let t0 = performance.now();
        let datas = [];
        for (let i = 0; i < icaos.length; i++) {
            icaos[i] = icaos[i].trim();
        }
        let i = 0;
        while (i < icaos.length) {
            let icao = icaos[i];
            let airport = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
            if (airport) {
                datas.push(airport);
                icaos.splice(i, 1);
            }
            else {
                i++;
            }
        }
        if (icaos.length === 0) {
            return datas;
        }
        for (let i = 0; i < icaos.length; i++) {
            let icao = icaos[i];
            if (icao[0] !== "A") {
                console.warn("Icao mismatch trying to load AIRPORT of invalid icao '" + icao + "'");
            }
        }
        Coherent.call("LOAD_AIRPORTS", icaos, icaos.length);
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedAirportsCallback = () => {
                let i = 0;
                while (i < icaos.length) {
                    let icao = icaos[i];
                    let airport = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                    if (airport) {
                        datas.push(airport);
                        icaos.splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
                if (icaos.length === 0) {
                    resolve(datas);
                }
                else {
                    attempts++;
                    if (attempts === 5) {
                        Coherent.call("LOAD_AIRPORTS", icaos, icaos.length);
                    }
                    if (attempts > 10) {
                        console.warn("getAirportsDatas not found for " + icaos.length + " icaos, expect the unexpected.");
                        resolve(datas);
                    }
                    else {
                        this.instrument.requestCall(loadedAirportsCallback);
                    }
                }
            };
            loadedAirportsCallback();
        });
    }
    getIntersectionDataCB(icao, callback) {
        if (icao == "") {
            return null;
        }
        if (this._isCompletelyRegistered && this.loadingFacilities.length < this._maxSimultaneousCoherentCalls) {
            icao = icao.trim();
            let intersection = this.loadedFacilities.find(f => {
                return (f.icaoTrimed === icao) && (f.routes != undefined);
            });
            if (intersection) {
                return callback(intersection);
            }
            if (this.loadingFacilities.indexOf(icao) === -1) {
                Coherent.call("LOAD_INTERSECTION", icao);
                this.loadingFacilities.push(icao);
            }
            let attempts = 0;
            let checkDataLoaded = () => {
                let intersection = this.loadedFacilities.find(f => {
                    return (f.icaoTrimed === icao) && (f.routes != undefined);
                });
                if (intersection) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    callback(intersection);
                }
                else {
                    attempts++;
                    if (attempts > 10) {
                        this.addFacility({
                            icao: icao,
                            icaoTrimed: "",
                            name: "UNKNOWN",
                            lat: 0,
                            lon: 0,
                            region: "UKNW",
                            city: "UKNW",
                            altitudeMode: ""
                        });
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        callback(undefined);
                    }
                    else {
                        this.instrument.requestCall(checkDataLoaded);
                    }
                }
            };
            checkDataLoaded();
        }
        else {
            this.instrument.requestCall(this.getIntersectionDataCB.bind(this, icao, callback));
        }
    }
    async getIntersectionData(icao) {
        await this.waitRegistration();
        icao = icao.trim();
        let intersection = this.loadedFacilities.find(f => {
            return (f.icaoTrimed === icao) && (f.routes != undefined);
        });
        if (intersection) {
            return intersection;
        }
        let t0 = performance.now();
        if (this.loadingFacilities.indexOf(icao) === -1) {
            Coherent.call("LOAD_INTERSECTION", icao);
            this.loadingFacilities.push(icao);
        }
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedIntersectionCallback = () => {
                let intersection = this.loadedFacilities.find(f => {
                    return (f.icaoTrimed === icao) && (f.routes != undefined);
                });
                if (intersection) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    resolve(intersection);
                }
                else {
                    attempts++;
                    if (attempts > 100) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        resolve(undefined);
                    }
                    else {
                        this.instrument.requestCall(loadedIntersectionCallback);
                    }
                }
            };
            loadedIntersectionCallback();
        });
    }
    async getIntersections(icaos) {
        await this.waitRegistration();
        let intersections = [];
        let datas = await this.getIntersectionsData(icaos);
        if (datas) {
            for (let i = 0; i < datas.length; i++) {
                let intersection = new WayPoint(this.instrument);
                intersection.SetFromIFacility(datas[i]);
                intersections.push(intersection);
            }
        }
        return intersections;
    }
    async getIntersectionsData(icaos) {
        await this.waitRegistration();
        let t0 = performance.now();
        let datas = [];
        for (let i = 0; i < icaos.length; i++) {
            icaos[i] = icaos[i].trim();
        }
        let i = 0;
        let loadingIcaos = [];
        while (i < icaos.length) {
            let icao = icaos[i];
            let intersection = this.loadedFacilities.find(f => {
                return (f.icaoTrimed === icao) && (f.routes != undefined);
            });
            if (intersection) {
                datas.push(intersection);
                icaos.splice(i, 1);
            }
            else {
                if (this.loadingFacilities.find(i => { return i === icao; })) {
                    icaos.splice(i, 1);
                    loadingIcaos.push(icao);
                }
                else {
                    i++;
                }
            }
        }
        if (icaos.length === 0) {
            return datas;
        }
        if (icaos.length > 0) {
            Coherent.call("LOAD_INTERSECTIONS", icaos, icaos.length);
        }
        icaos.push(...loadingIcaos);
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedIntersectionsCallback = () => {
                let i = 0;
                while (i < icaos.length) {
                    let icao = icaos[i];
                    let intersection = this.loadedFacilities.find(f => {
                        return (f.icaoTrimed === icao) && (f.routes != undefined);
                    });
                    if (intersection) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        datas.push(intersection);
                        icaos.splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
                if (icaos.length === 0) {
                    resolve(datas);
                }
                else {
                    attempts++;
                    if (attempts === 5) {
                        console.warn("Retry to load INTERSECTIONS ICAOS.");
                        Coherent.call("LOAD_INTERSECTIONS", icaos, icaos.length);
                    }
                    if (attempts > 10) {
                        resolve(datas);
                    }
                    else {
                        this.instrument.requestCall(loadedIntersectionsCallback);
                    }
                }
            };
            loadedIntersectionsCallback();
        });
    }
    getNdbDataCB(icao, callback) {
        if (this._isCompletelyRegistered && this.loadingFacilities.length < this._maxSimultaneousCoherentCalls) {
            icao = icao.trim();
            let ndb = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
            if (ndb) {
                return callback(ndb);
            }
            if (icao[0] !== "N") {
                console.warn("Icao mismatch trying to load NDB of invalid icao '" + icao + "'");
            }
            if (this.loadingFacilities.indexOf(icao) === -1) {
                Coherent.call("LOAD_NDB", icao);
                this.loadingFacilities.push(icao);
            }
            let attempts = 0;
            let checkDataLoaded = () => {
                let ndb = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                if (ndb) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    callback(ndb);
                }
                else {
                    attempts++;
                    if (attempts > 10) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        callback(undefined);
                    }
                    else {
                        this.instrument.requestCall(checkDataLoaded);
                    }
                }
            };
            checkDataLoaded();
        }
        else {
            this.instrument.requestCall(this.getNdbDataCB.bind(this, icao, callback));
        }
    }
    getNdbWaypointDataCB(icao, callback) {
        return this.getIntersectionDataCB(icao, callback);
    }
    async getNdbData(icao) {
        await this.waitRegistration();
        icao = icao.trim();
        let t0 = performance.now();
        let ndb = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
        if (ndb) {
            return ndb;
        }
        if (icao[0] !== "N") {
            console.warn("Icao mismatch trying to load NDB of invalid icao '" + icao + "'");
        }
        if (this.loadingFacilities.indexOf(icao) === -1) {
            Coherent.call("LOAD_NDB", icao);
            this.loadingFacilities.push(icao);
        }
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedNdbCallback = () => {
                let ndb = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                if (ndb) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    resolve(ndb);
                }
                else {
                    attempts++;
                    if (attempts > 10) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        resolve(undefined);
                    }
                    else {
                        this.instrument.requestCall(loadedNdbCallback);
                    }
                }
            };
            loadedNdbCallback();
        });
    }
    async getNdbs(icaos) {
        await this.waitRegistration();
        let ndbs = [];
        let datas = await this.getNdbsData(icaos);
        if (datas) {
            for (let i = 0; i < datas.length; i++) {
                let ndb = new WayPoint(this.instrument);
                ndb.SetFromIFacility(datas[i]);
                ndbs.push(ndb);
            }
        }
        return ndbs;
    }
    async getNdbsData(icaos) {
        await this.waitRegistration();
        let t0 = performance.now();
        let datas = [];
        for (let i = 0; i < icaos.length; i++) {
            icaos[i] = icaos[i].trim();
        }
        let i = 0;
        while (i < icaos.length) {
            let icao = icaos[i];
            let ndb = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
            if (ndb) {
                datas.push(ndb);
                icaos.splice(i, 1);
            }
            else {
                i++;
            }
        }
        if (icaos.length === 0) {
            return datas;
        }
        for (let i = 0; i < icaos.length; i++) {
            let icao = icaos[i];
            if (icao[0] !== "N") {
                console.warn("Icao mismatch trying to load NDB of invalid icao '" + icao + "'");
            }
        }
        Coherent.call("LOAD_NDBS", icaos, icaos.length);
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedNdbsCallback = () => {
                let i = 0;
                while (i < icaos.length) {
                    let icao = icaos[i];
                    let ndb = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                    if (ndb) {
                        datas.push(ndb);
                        icaos.splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
                if (icaos.length === 0) {
                    resolve(datas);
                }
                else {
                    attempts++;
                    if (attempts === 5) {
                        Coherent.call("LOAD_NDBS", icaos, icaos.length);
                    }
                    if (attempts > 10) {
                        resolve(datas);
                    }
                    else {
                        this.instrument.requestCall(loadedNdbsCallback);
                    }
                }
            };
            loadedNdbsCallback();
        });
    }
    getVorDataCB(icao, callback) {
        if (this._isCompletelyRegistered && this.loadingFacilities.length < this._maxSimultaneousCoherentCalls) {
            icao = icao.trim();
            let vor = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
            if (vor) {
                return callback(vor);
            }
            if (icao[0] !== "V") {
                console.warn("Icao mismatch trying to load VOR of invalid icao '" + icao + "'");
            }
            if (this.loadingFacilities.indexOf(icao) === -1) {
                Coherent.call("LOAD_VOR", icao);
                this.loadingFacilities.push(icao);
            }
            let attempts = 0;
            let checkDataLoaded = () => {
                let vor = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                if (vor) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    callback(vor);
                }
                else {
                    attempts++;
                    if (attempts > 10) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        callback(undefined);
                    }
                    else {
                        this.instrument.requestCall(checkDataLoaded);
                    }
                }
            };
            checkDataLoaded();
        }
        else {
            this.instrument.requestCall(this.getVorDataCB.bind(this, icao, callback));
        }
    }
    getVorWaypointDataCB(icao, callback) {
        return this.getIntersectionDataCB(icao, callback);
    }
    async getVorData(icao) {
        await this.waitRegistration();
        icao = icao.trim();
        let vor = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
        if (vor) {
            return vor;
        }
        let t0 = performance.now();
        if (icao[0] !== "V") {
            console.warn("Icao mismatch trying to load VOR of invalid icao '" + icao + "'");
        }
        if (this.loadingFacilities.indexOf(icao) === -1) {
            Coherent.call("LOAD_VOR", icao);
            this.loadingFacilities.push(icao);
        }
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedVorCallback = () => {
                let vor = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                if (vor) {
                    let n = this.loadingFacilities.indexOf(icao);
                    if (n >= 0) {
                        this.loadingFacilities.splice(n, 1);
                    }
                    resolve(vor);
                }
                else {
                    attempts++;
                    if (attempts > 10) {
                        let n = this.loadingFacilities.indexOf(icao);
                        if (n >= 0) {
                            this.loadingFacilities.splice(n, 1);
                        }
                        resolve(undefined);
                    }
                    else {
                        this.instrument.requestCall(loadedVorCallback);
                    }
                }
            };
            loadedVorCallback();
        });
    }
    async getVors(icaos) {
        await this.waitRegistration();
        let vors = [];
        let datas = await this.getVorsData(icaos);
        if (datas) {
            for (let i = 0; i < datas.length; i++) {
                let vor = new WayPoint(this.instrument);
                vor.SetFromIFacility(datas[i]);
                vors.push(vor);
            }
        }
        return vors;
    }
    async getVorsData(icaos) {
        await this.waitRegistration();
        let t0 = performance.now();
        let datas = [];
        for (let i = 0; i < icaos.length; i++) {
            icaos[i] = icaos[i].trim();
        }
        let i = 0;
        while (i < icaos.length) {
            let icao = icaos[i];
            let vor = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
            if (vor) {
                datas.push(vor);
                icaos.splice(i, 1);
            }
            else {
                i++;
            }
        }
        if (icaos.length === 0) {
            return datas;
        }
        for (let i = 0; i < icaos.length; i++) {
            let icao = icaos[i];
            if (icao[0] !== "V") {
                console.warn("Icao mismatch trying to load VOR of invalid icao '" + icao + "'");
            }
        }
        Coherent.call("LOAD_VORS", icaos, icaos.length);
        return new Promise((resolve) => {
            let attempts = 0;
            let loadedVorsCallback = () => {
                let i = 0;
                while (i < icaos.length) {
                    let icao = icaos[i];
                    let vor = this.loadedFacilities.find(f => { return f.icaoTrimed === icao && (f.routes === undefined); });
                    if (vor) {
                        datas.push(vor);
                        icaos.splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
                if (icaos.length === 0) {
                    resolve(datas);
                }
                else {
                    attempts++;
                    if (attempts === 5) {
                        Coherent.call("LOAD_VORS", icaos, icaos.length);
                    }
                    if (attempts > 10) {
                        resolve(datas);
                    }
                    else {
                        this.instrument.requestCall(loadedVorsCallback);
                    }
                }
            };
            loadedVorsCallback();
        });
    }
    async getAllAirways(intersection, name = undefined, maxLength = 100) {
        await this.waitRegistration();
        let airways = [];
        let intersectionInfo;
        if (intersection instanceof WayPoint) {
            intersectionInfo = intersection.infos;
        }
        else {
            intersectionInfo = intersection;
        }
        if (intersectionInfo instanceof WayPointInfo) {
            let datas = await this.getAllAirwaysData(intersectionInfo, name, maxLength);
            for (let i = 0; i < datas.length; i++) {
                let airway = new Airway();
                airway.SetFromIAirwayData(datas[i]);
                airways.push(airway);
            }
        }
        return airways;
    }
    async getAllAirwaysData(intersectionInfo, name = undefined, maxLength = 100) {
        await this.waitRegistration();
        let airways = [];
        if (intersectionInfo.routes) {
            for (let i = 0; i < intersectionInfo.routes.length; i++) {
                if (name === undefined || name === intersectionInfo.routes[i].name) {
                    let routeName = intersectionInfo.routes[i].name;
                    let airwayData = this.loadedAirwayDatas.get(routeName);
                    if (!airwayData) {
                        airwayData = await this.getAirwayData(intersectionInfo, intersectionInfo.routes[i].name, maxLength);
                        this.loadedAirwayDatas.set(routeName, airwayData);
                    }
                    if (airwayData) {
                        airways.push(airwayData);
                    }
                }
            }
        }
        return airways;
    }
    async getAirwayData(intersectionInfo, name = "", maxLength = 100) {
        await this.waitRegistration();
        if (!intersectionInfo.routes) {
            return undefined;
        }
        if (name === "") {
            name = intersectionInfo.routes[0].name;
        }
        let route = intersectionInfo.routes.find(r => { return r.name === name; });
        if (route) {
            let airway = {
                name: route.name,
                type: route.type,
                icaos: [intersectionInfo.icao]
            };
            let currentRoute = route;
            let currentWaypointIcao = intersectionInfo.icao;
            for (let i = 0; i < maxLength * 0.5; i++) {
                if (currentRoute) {
                    let prevIcao = currentRoute.prevIcao;
                    currentRoute = undefined;
                    if (prevIcao && prevIcao.length > 0 && prevIcao[0] != " ") {
                        let prevWaypoint = await this.getIntersectionData(prevIcao);
                        if (prevWaypoint) {
                            airway.icaos.splice(0, 0, prevWaypoint.icao);
                            currentWaypointIcao = prevWaypoint.icao;
                            if (prevWaypoint.routes) {
                                currentRoute = prevWaypoint.routes.find(r => { return r.name === name; });
                            }
                        }
                    }
                }
            }
            currentRoute = route;
            currentWaypointIcao = intersectionInfo.icao;
            for (let i = 0; i < maxLength * 0.5; i++) {
                if (currentRoute) {
                    let nextIcao = currentRoute.nextIcao;
                    currentRoute = undefined;
                    if (nextIcao && nextIcao.length > 0 && nextIcao[0] != " ") {
                        let nextWaypoint = await this.getIntersectionData(nextIcao);
                        if (nextWaypoint) {
                            airway.icaos.push(nextWaypoint.icao);
                            currentWaypointIcao = nextWaypoint.icao;
                            if (nextWaypoint.routes) {
                                currentRoute = nextWaypoint.routes.find(r => { return r.name === name; });
                            }
                        }
                    }
                }
            }
            return airway;
        }
    }
    
    async UpdateFacilityInfos(facility, loadFacilitiesTransitively = false) {
        await this.waitRegistration();
        return new Promise(resolve => {
            facility.UpdateInfos(resolve, loadFacilitiesTransitively);
        });
    }
    
    /* Gets an array of frequencies of the given airport ident.
     */
    async GetAirportNamedFrequenciesByIdent(airportIdent) {
        await this.waitRegistration();
        return new Promise(resolve => {
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", "A", this.instrument.instrumentIdentifier + "-loader").then(() => {
                this.instrument.requestCall(() => {
                    SimVar.SetSimVarValue("C:fs9gps:IcaoSearchEnterChar", "string", airportIdent, this.instrument.instrumentIdentifier + "-loader").then(() => {
                        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", 0, this.instrument.instrumentIdentifier + "-loader").then(async () => {
                            let airportIcao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.instrument.instrumentIdentifier + "-loader");
                            this.GetAirportNamedFrequencies(airportIcao).then((frequencies) => resolve(frequencies));
                        });
                    });
                });
            });
        });
    }

    /* Gets an array of frequencies of the given airport icao.
     * The elements of the returned array contain name ("Clearance", "Ground", etc.) and value in MHz.
     */
    async GetAirportNamedFrequencies(airportIcao) {
        await this.waitRegistration();
        return new Promise(resolve => {
            SimVar.SetSimVarValue("C:fs9gps:WaypointAirportICAO", "string", airportIcao, this.instrument.instrumentIdentifier + "-loader").then(async () => {
                let frequencyCount = SimVar.GetSimVarValue("C:fs9gps:WaypointAirportFrequenciesNumber", "number", this.instrument.instrumentIdentifier + "-loader");
                let attempts = 0;
                // Wait for the database query to complete
                while (frequencyCount === 0 && attempts < 10) {
                    await new Promise(resolve => this.instrument.requestCall(resolve));
                    frequencyCount = SimVar.GetSimVarValue("C:fs9gps:WaypointAirportFrequenciesNumber", "number", this.instrument.instrumentIdentifier + "-loader");
                    attempts++;                    
                }

                let getFrequency = async (index) => {
                    return new Promise((resolve) => {
                        SimVar.SetSimVarValue("C:fs9gps:WaypointAirportCurrentFrequency", "number", index, this.instrument.instrumentIdentifier + "-loader").then(() => {
                            let frequencyName = SimVar.GetSimVarValue("C:fs9gps:WaypointAirportFrequencyName", "string", this.instrument.instrumentIdentifier + "-loader");
                            let frequencyValue = SimVar.GetSimVarValue("C:fs9gps:WaypointAirportFrequencyValue", "number", this.instrument.instrumentIdentifier + "-loader");
                            resolve({
                                name: frequencyName,
                                // convert from Hz to MHz
                                value: (parseFloat(frequencyValue) / 1000000)
                            });
                        });
                    });
                };
                
                let frequencies = [];
                for (let i = 0; i < frequencyCount; i++) {
                    let frequency = await getFrequency(i);
                    frequencies.push(frequency);
                }
                resolve(frequencies);
            });
        });
    }
}
class WaypointLoader {
    constructor(_instrument) {
        this.deprecationDelay = 5000;
        this.waypointsCountLimit = 1000;
        this.waypoints = [];
        this._locked = false;
        this._lastMaxItemsSearchCountSyncDate = 0;
        this._maxItemsSearchCountNeedUpdate = true;
        this._maxItemsSearchCount = 200;
        this._lastSearchRangeSyncDate = 0;
        this._searchRangeNeedUpdate = true;
        this._searchRange = 400;
        this._lastSearchOriginSyncDate = 0;
        this._lastSearchOriginLat = 0;
        this._lastSearchOriginLong = 0;
        this._searchOrigin = new LatLong(0, 0);
        this._itemsCountNeedUpdate = true;
        this._itemsNeedUpdate = true;
        this._isLoadingItems = false;
        this._hasUpdatedItems = true;
        this._lastItemCountUpdateDate = 0;
        this._itemsCount = 0;
        this._itemIterator = 0;
        this.SET_ORIGIN_LATITUDE = "";
        this.SET_ORIGIN_LONGITUDE = "";
        this.SET_SEARCH_RANGE = "";
        this.GET_SEARCH_RANGE = "";
        this.SET_MAX_ITEMS = "";
        this.GET_MAX_ITEMS = "";
        this.GET_ITEMS_COUNT = "";
        this.SET_ITEM_INDEX = "";
        this.GET_ITEM_ICAO = "";
        this.GET_ITEM_IDENT = "";
        this.loaderName = "WaypointLoader";
        this.currentMapAngularWidth = 1;
        this.currentMapAngularHeight = 1;
        this.instrument = _instrument;
    }
    slowDown() {
        this.deprecationDelay *= 1.5;
        this.deprecationDelay = Math.min(this.deprecationDelay, WaypointLoader.DEPRECATION_DELAY_MAX);
    }
    speedUp() {
        this.deprecationDelay /= 2;
        this.deprecationDelay = Math.max(this.deprecationDelay, WaypointLoader.DEPRECATION_DELAY_MIN);
    }
    get maxItemsSearchCount() {
        return this._maxItemsSearchCount;
    }
    set maxItemsSearchCount(v) {
        if (this._maxItemsSearchCount !== v) {
            this._maxItemsSearchCountNeedUpdate = true;
            this._maxItemsSearchCount = v;
        }
    }
    get searchRange() {
        return this._searchRange;
    }
    get searchRangeInMeters() {
        return this._searchRange * 1852;
    }
    set searchRange(v) {
        this._searchRangeNeedUpdate = v !== this.searchRange;
        this._searchRange = v;
    }
    get searchLat() {
        return this._searchOrigin.lat;
    }
    set searchLat(v) {
        this._searchOrigin.lat = v;
    }
    get searchLong() {
        return this._searchOrigin.long;
    }
    set searchLong(v) {
        this._searchOrigin.long = v;
    }
    update() {
        if (this._locked) {
            return;
        }
        let t = performance.now();
        if (!this._isLoadingItems) {
            this.maxItemsSearchCount = Math.min(this.maxItemsSearchCount, this.waypointsCountLimit);
            while (this.waypoints.length > this.waypointsCountLimit) {
                this.waypoints.splice(0, 1);
            }
        }
        if (!this._isLoadingItems) {
            let deltaLat = Math.abs(this._searchOrigin.lat - this._lastSearchOriginLat);
            let deltaLong = Math.abs(this._searchOrigin.long - this._lastSearchOriginLong);
            if ((t - this._lastSearchOriginSyncDate) > this.deprecationDelay || deltaLat > this.currentMapAngularHeight * 0.5 || deltaLong > this.currentMapAngularWidth * 0.5) {
                this._locked = true;
                SimVar.SetSimVarValue("C:fs9gps:" + this.SET_ORIGIN_LATITUDE, "degree latitude", this._searchOrigin.lat, this.instrument.instrumentIdentifier + "-loader").then(() => {
                    SimVar.SetSimVarValue("C:fs9gps:" + this.SET_ORIGIN_LONGITUDE, "degree longitude", this._searchOrigin.long, this.instrument.instrumentIdentifier + "-loader").then(() => {
                        this._lastSearchOriginSyncDate = t;
                        this._locked = false;
                        this._itemsCountNeedUpdate = true;
                        this._hasUpdatedItems = false;
                        this._lastSearchOriginLat = this._searchOrigin.lat;
                        this._lastSearchOriginLong = this._searchOrigin.long;
                    });
                });
                return;
            }
            if (this._searchRangeNeedUpdate || (t - this._lastSearchRangeSyncDate) > this.deprecationDelay) {
                this._locked = true;
                SimVar.SetSimVarValue("C:fs9gps:" + this.SET_SEARCH_RANGE, "nautical miles", this.searchRange, this.instrument.instrumentIdentifier + "-loader").then(() => {
                    let trueSearchRange = SimVar.GetSimVarValue("C:fs9gps:" + this.GET_SEARCH_RANGE, "nautical miles", this.instrument.instrumentIdentifier + "-loader");
                    if (Math.abs(trueSearchRange - this.searchRange) < 0.001) {
                        this._searchRangeNeedUpdate = false;
                        this._lastSearchRangeSyncDate = t;
                        this._locked = false;
                        this._itemsCountNeedUpdate = true;
                        this._hasUpdatedItems = false;
                    }
                    else {
                        setTimeout(() => {
                            this._locked = false;
                        }, 1000);
                    }
                });
                return;
            }
            if (this._maxItemsSearchCountNeedUpdate || (t - this._lastMaxItemsSearchCountSyncDate) > this.deprecationDelay) {
                this._locked = true;
                SimVar.SetSimVarValue("C:fs9gps:" + this.SET_MAX_ITEMS, "number", this.maxItemsSearchCount, this.instrument.instrumentIdentifier + "-loader").then(() => {
                    let trueMaxItemsSearchCount = SimVar.GetSimVarValue("C:fs9gps:" + this.GET_MAX_ITEMS, "number", this.instrument.instrumentIdentifier + "-loader");
                    if (trueMaxItemsSearchCount === this.maxItemsSearchCount) {
                        this._maxItemsSearchCountNeedUpdate = false;
                        this._lastMaxItemsSearchCountSyncDate = t;
                        this._locked = false;
                        this._itemsCountNeedUpdate = true;
                        this._hasUpdatedItems = false;
                    }
                    else {
                        setTimeout(() => {
                            this._locked = false;
                        }, 1000);
                    }
                });
                return;
            }
            if (this._itemsCountNeedUpdate || (t - this._lastItemCountUpdateDate) > this.deprecationDelay) {
                this._itemsCount = SimVar.GetSimVarValue("C:fs9gps:" + this.GET_ITEMS_COUNT, "number", this.instrument.instrumentIdentifier + "-loader");
                this._lastItemCountUpdateDate = t;
                this._itemsCountNeedUpdate = false;
                this._itemsNeedUpdate = true;
                this._hasUpdatedItems = false;
                return;
            }
        }
        if (this._itemsCount > 0) {
            if (this._itemsNeedUpdate) {
                this._locked = true;
                this._isLoadingItems = true;
                if (this.createWaypointsCallback) {
                    if (!this.batch) {
                        if (!this.GET_ITEMS_COUNT || !this.SET_ITEM_INDEX || !this.GET_ITEM_ICAO) {
                            console.error("WaypointLoader : Simvar Batch bad format");
                        }
                        this.batch = new SimVar.SimVarBatch("C:fs9gps:" + this.GET_ITEMS_COUNT, "C:fs9gps:" + this.SET_ITEM_INDEX);
                        this.batch.add("C:fs9gps:" + this.GET_ITEM_ICAO, "string");
                    }
                    let icaos = [];
                    SimVar.GetSimVarArrayValues(this.batch, async (values) => {
                        for (let i = 0; i < values.length; i++) {
                            icaos.push(values[i][0]);
                        }
                        let waypoints = await this.createWaypointsCallback(icaos);
                        if (waypoints && waypoints.length > 0) {
                            this._hasUpdatedItems = true;
                            this.waypoints.push(...waypoints);
                        }
                        else {
                            this._hasUpdatedItems = false;
                        }
                        this._isLoadingItems = false;
                        this._itemIterator = 0;
                        this._itemsNeedUpdate = false;
                        if (this._hasUpdatedItems) {
                            this.speedUp();
                        }
                        else {
                            this.slowDown();
                        }
                        this._locked = false;
                    }, this.instrument.instrumentIdentifier + "-loader");
                }
                else {
                    SimVar.SetSimVarValue("C:fs9gps:" + this.SET_ITEM_INDEX, "number", this._itemIterator, this.instrument.instrumentIdentifier + "-loader").then(async () => {
                        if (this.GET_ITEM_ICAO && this.createWaypointCallback) {
                            let icao = SimVar.GetSimVarValue("C:fs9gps:" + this.GET_ITEM_ICAO, "string", this.instrument.instrumentIdentifier + "-loader");
                            let waypoint = this.waypoints.find(a => { return a.icao === icao; });
                            if (!waypoint) {
                                waypoint = await this.createWaypointCallback(icao);
                                if (waypoint) {
                                    this.waypoints.push(waypoint);
                                    this._hasUpdatedItems = true;
                                }
                            }
                        }
                        else {
                            let ident = SimVar.GetSimVarValue("C:fs9gps:" + this.GET_ITEM_IDENT, "string", this.instrument.instrumentIdentifier + "-loader");
                            let airport = this.waypoints.find(a => { return a.ident === ident; });
                            if (!airport) {
                                airport = await this.createCallback(ident);
                                this.waypoints.push(airport);
                                this._hasUpdatedItems = true;
                            }
                        }
                        this._itemIterator = this._itemIterator + 1;
                        if (this._itemIterator >= this._itemsCount) {
                            this._isLoadingItems = false;
                            this._itemIterator = 0;
                            this._itemsNeedUpdate = false;
                            if (this._hasUpdatedItems) {
                                this.speedUp();
                            }
                            else {
                                this.slowDown();
                            }
                        }
                        this._locked = false;
                    });
                    return;
                }
            }
        }
    }
}
WaypointLoader.DEPRECATION_DELAY_MAX = 60000;
WaypointLoader.DEPRECATION_DELAY_MIN = 2000;
class NDBLoader extends WaypointLoader {
    constructor(_instrument) {
        super(_instrument);
        this.loaderName = "NDBLoader";
        this.SET_ORIGIN_LATITUDE = "NearestNdbCurrentLatitude";
        this.SET_ORIGIN_LONGITUDE = "NearestNdbCurrentLongitude";
        this.SET_SEARCH_RANGE = "NearestNdbMaximumDistance";
        this.GET_SEARCH_RANGE = "NearestNdbMaximumDistance";
        this.SET_MAX_ITEMS = "NearestNdbMaximumItems";
        this.GET_MAX_ITEMS = "NearestNdbMaximumItems";
        this.GET_ITEMS_COUNT = "NearestNdbItemsNumber";
        this.SET_ITEM_INDEX = "NearestNdbCurrentLine";
        this.GET_ITEM_ICAO = "NearestNdbCurrentIcao";
        this.GET_ITEM_IDENT = "NearestNdbCurrentIdent";
        this.createCallback = async (ident) => {
            let ndb = new NearestNDB(this.instrument);
            ndb.ident = ident;
            ndb.icao = SimVar.GetSimVarValue("C:fs9gps:NearestNdbCurrentICAO", "string", this.instrument.instrumentIdentifier + "-loader");
            ndb.coordinates = new LatLongAlt(SimVar.GetSimVarValue("C:fs9gps:NearestNdbCurrentNdbLatitude", "degree latitude", this.instrument.instrumentIdentifier + "-loader"), SimVar.GetSimVarValue("C:fs9gps:NearestNdbCurrentNdbLongitude", "degree longitude", this.instrument.instrumentIdentifier + "-loader"));
            ndb.frequencyMHz = SimVar.GetSimVarValue("C:fs9gps:NearestNdbCurrentFrequency", "Megahertz", this.instrument.instrumentIdentifier + "-loader");
            ndb.ndbType = SimVar.GetSimVarValue("C:fs9gps:NearestNdbCurrentType", "number", this.instrument.instrumentIdentifier + "-loader");
            return ndb;
        };
        this.createWaypointCallback = async (icao) => {
            return new Promise(resolve => {
                this.instrument.facilityLoader.getFacilityCB(icao, resolve);
            });
        };
        this.createWaypointsCallback = async (icaos) => {
            let icaosToLoad = [];
            for (let i = 0; i < icaos.length; i++) {
                let icao = icaos[i];
                if (icao) {
                    if (!this.waypoints.find(a => { return a.icao === icao; })) {
                        icaosToLoad.push(icao);
                    }
                }
            }
            return this.instrument.facilityLoader.getNdbs(icaosToLoad);
        };
    }
}
class VORLoader extends WaypointLoader {
    constructor(_instrument) {
        super(_instrument);
        this.loaderName = "VORLoader";
        this.SET_ORIGIN_LATITUDE = "NearestVorCurrentLatitude";
        this.SET_ORIGIN_LONGITUDE = "NearestVorCurrentLongitude";
        this.SET_SEARCH_RANGE = "NearestVorMaximumDistance";
        this.GET_SEARCH_RANGE = "NearestVorMaximumDistance";
        this.SET_MAX_ITEMS = "NearestVorMaximumItems";
        this.GET_MAX_ITEMS = "NearestVorMaximumItems";
        this.GET_ITEMS_COUNT = "NearestVorItemsNumber";
        this.SET_ITEM_INDEX = "NearestVorCurrentLine";
        this.GET_ITEM_ICAO = "NearestVorCurrentIcao";
        this.GET_ITEM_IDENT = "NearestVorCurrentIdent";
        this.createCallback = async (ident) => {
            let vor = new NearestVOR(this.instrument);
            vor.ident = ident;
            vor.icao = SimVar.GetSimVarValue("C:fs9gps:NearestVorCurrentICAO", "string", this.instrument.instrumentIdentifier + "-loader");
            vor.coordinates = new LatLongAlt(SimVar.GetSimVarValue("C:fs9gps:NearestVorCurrentVorLatitude", "degree latitude", this.instrument.instrumentIdentifier + "-loader"), SimVar.GetSimVarValue("C:fs9gps:NearestVorCurrentVorLongitude", "degree longitude", this.instrument.instrumentIdentifier + "-loader"));
            vor.frequencyMHz = SimVar.GetSimVarValue("C:fs9gps:NearestVorCurrentFrequency", "Megahertz", this.instrument.instrumentIdentifier + "-loader");
            vor.frequencyBCD16 = SimVar.GetSimVarValue("C:fs9gps:NearestVorCurrentFrequency", "Frequency BCD16", this.instrument.instrumentIdentifier + "-loader");
            vor.vorType = SimVar.GetSimVarValue("C:fs9gps:NearestVorCurrentType", "number", this.instrument.instrumentIdentifier + "-loader");
            return vor;
        };
        this.createWaypointCallback = async (icao) => {
            return new Promise(resolve => {
                this.instrument.facilityLoader.getFacilityCB(icao, resolve);
            });
        };
        this.createWaypointsCallback = async (icaos) => {
            let icaosToLoad = [];
            for (let i = 0; i < icaos.length; i++) {
                let icao = icaos[i];
                if (icao) {
                    if (!this.waypoints.find(a => { return a.icao === icao; })) {
                        icaosToLoad.push(icao);
                    }
                }
            }
            return this.instrument.facilityLoader.getVors(icaosToLoad);
        };
    }
}
class IntersectionLoader extends WaypointLoader {
    constructor(_instrument) {
        super(_instrument);
        this.loaderName = "IntersectionLoader";
        this.SET_ORIGIN_LATITUDE = "NearestIntersectionCurrentLatitude";
        this.SET_ORIGIN_LONGITUDE = "NearestIntersectionCurrentLongitude";
        this.SET_SEARCH_RANGE = "NearestIntersectionMaximumDistance";
        this.GET_SEARCH_RANGE = "NearestIntersectionMaximumDistance";
        this.SET_MAX_ITEMS = "NearestIntersectionMaximumItems";
        this.GET_MAX_ITEMS = "NearestIntersectionMaximumItems";
        this.GET_ITEMS_COUNT = "NearestIntersectionItemsNumber";
        this.SET_ITEM_INDEX = "NearestIntersectionCurrentLine";
        this.GET_ITEM_ICAO = "NearestIntersectionCurrentIcao";
        this.GET_ITEM_IDENT = "NearestIntersectionCurrentIdent";
        this.createCallback = async (ident) => {
            let intersection = new NearestIntersection(this.instrument);
            intersection.ident = ident;
            intersection.icao = SimVar.GetSimVarValue("C:fs9gps:NearestIntersectionCurrentICAO", "string", this.instrument.instrumentIdentifier + "-loader");
            intersection.coordinates = new LatLongAlt(SimVar.GetSimVarValue("C:fs9gps:NearestIntersectionCurrentIntersectionLatitude", "degree latitude", this.instrument.instrumentIdentifier + "-loader"), SimVar.GetSimVarValue("C:fs9gps:NearestIntersectionCurrentIntersectionLongitude", "degree longitude", this.instrument.instrumentIdentifier + "-loader"));
            let routesCount = SimVar.GetSimVarValue("C:fs9gps:NearestIntersectionCurrentRouteNumber", "number", this.instrument.instrumentIdentifier + "-loader");
            if (routesCount > 0) {
            }
            for (let i = 0; i < routesCount; i++) {
                SimVar.SetSimVarValue("C:fs9gps:NearestIntersectionCurrentCurrentRoute", "number", i, this.instrument.instrumentIdentifier + "-loader").then(() => {
                    let routeName = SimVar.GetSimVarValue("C:fs9gps:NearestIntersectionCurrentRouteName", "string", this.instrument.instrumentIdentifier + "-loader");
                    let routePrevIcao = SimVar.GetSimVarValue("C:fs9gps:NearestIntersectionCurrentRoutePrevIcao", "string", this.instrument.instrumentIdentifier + "-loader");
                    let routeNextIcao = SimVar.GetSimVarValue("C:fs9gps:NearestIntersectionCurrentRouteNextIcao", "string", this.instrument.instrumentIdentifier + "-loader");
                    let route = new NearestWaypointRoute(intersection);
                    route.name = routeName;
                    route.prevIcao = routePrevIcao;
                    route.prevWaypoint = new WayPoint(this.instrument);
                    route.prevWaypoint.SetICAO(route.prevIcao);
                    route.nextIcao = routeNextIcao;
                    route.nextWaypoint = new WayPoint(this.instrument);
                    route.nextWaypoint.SetICAO(route.nextIcao);
                    intersection.routes.push(route);
                });
            }
            return intersection;
        };
        this.createWaypointCallback = async (icao) => {
            return new Promise(resolve => {
                this.instrument.facilityLoader.getFacilityCB(icao, resolve);
            });
        };
        this.createWaypointsCallback = async (icaos) => {
            let icaosToLoad = [];
            for (let i = 0; i < icaos.length; i++) {
                let icao = icaos[i];
                if (icao) {
                    if (!this.waypoints.find(a => { return a.icao === icao; })) {
                        icaosToLoad.push(icao);
                    }
                }
            }
            return this.instrument.facilityLoader.getIntersections(icaosToLoad);
        };
    }
}
class AirportLoader extends WaypointLoader {
    constructor(_instrument) {
        super(_instrument);
        this.loaderName = "AirportLoader";
        this.SET_ORIGIN_LATITUDE = "NearestAirportCurrentLatitude";
        this.SET_ORIGIN_LONGITUDE = "NearestAirportCurrentLongitude";
        this.SET_SEARCH_RANGE = "NearestAirportMaximumDistance";
        this.GET_SEARCH_RANGE = "NearestAirportMaximumDistance";
        this.SET_MAX_ITEMS = "NearestAirportMaximumItems";
        this.GET_MAX_ITEMS = "NearestAirportMaximumItems";
        this.GET_ITEMS_COUNT = "NearestAirportItemsNumber";
        this.SET_ITEM_INDEX = "NearestAirportCurrentLine";
        this.GET_ITEM_ICAO = "NearestAirportCurrentIcao";
        this.GET_ITEM_IDENT = "NearestAirportCurrentIdent";
        this.createCallback = async (ident) => {
            let airport = new NearestAirport(this.instrument);
            airport.ident = ident;
            airport.icao = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentICAO", "string", this.instrument.instrumentIdentifier + "-loader");
            airport.coordinates = new LatLongAlt(SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentAirportLatitude", "number", this.instrument.instrumentIdentifier + "-loader"), SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentAirportLongitude", "number", this.instrument.instrumentIdentifier + "-loader"));
            airport.bestApproach = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentBestApproach", "string", this.instrument.instrumentIdentifier + "-loader");
            airport.frequencyName = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentComFrequencyName", "string", this.instrument.instrumentIdentifier + "-loader");
            airport.frequencyMHz = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentComFrequencyValue", "MHz", this.instrument.instrumentIdentifier + "-loader");
            airport.frequencyBCD16 = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentComFrequencyValue", "Frequency BCD16", this.instrument.instrumentIdentifier + "-loader");
            airport.longestRunwayLength = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentLongestRunwayLength", "feet", this.instrument.instrumentIdentifier + "-loader");
            airport.longestRunwayDirection = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentLongestAirportDirection", "degree", this.instrument.instrumentIdentifier + "-loader");
            airport.airportClass = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentAirportKind", "number", this.instrument.instrumentIdentifier + "-loader");
            airport.fuel1 = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentFuel1", "string", this.instrument.instrumentIdentifier + "-loader");
            airport.fuel2 = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentFuel2", "string", this.instrument.instrumentIdentifier + "-loader");
            airport.towered = SimVar.GetSimVarValue("C:fs9gps:NearestAirportCurrentTowered", "Boolean", this.instrument.instrumentIdentifier + "-loader");
            let departuresCount = SimVar.GetSimVarValue("C:fs9gps:NearestAirportDeparturesNumber", "number", this.instrument.instrumentIdentifier + "-loader");
            let getDeparture = async (lineIndex) => {
                return new Promise(resolve => {
                    SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentDeparture", "number", lineIndex, this.instrument.instrumentIdentifier + "-loader").then(async () => {
                        let departureWaypointsCount = SimVar.GetSimVarValue("C:fs9gps:NearestAirportDepartureWaypointsNumber", "number", this.instrument.instrumentIdentifier + "-loader");
                        for (let i = 0; i < departureWaypointsCount; i++) {
                        }
                        resolve();
                    });
                });
            };
            for (let i = 0; i < departuresCount; i++) {
                await getDeparture(i);
            }
            return airport;
        };
        this.createWaypointCallback = async (icao) => {
            return new Promise(resolve => {
                this.instrument.facilityLoader.getFacilityCB(icao, resolve);
            });
        };
        this.createWaypointsCallback = async (icaos) => {
            let icaosToLoad = [];
            for (let i = 0; i < icaos.length; i++) {
                let icao = icaos[i];
                if (icao) {
                    if (!this.waypoints.find(a => { return a.icao === icao; })) {
                        icaosToLoad.push(icao);
                    }
                }
            }
            return this.instrument.facilityLoader.getAirports(icaosToLoad);
        };
    }
}
//# sourceMappingURL=WaypointLoader.js.map