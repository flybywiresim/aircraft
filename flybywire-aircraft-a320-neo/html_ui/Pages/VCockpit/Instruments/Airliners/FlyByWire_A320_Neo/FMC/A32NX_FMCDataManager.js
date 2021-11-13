const StoredWaypointType = Object.freeze({
    Pbd: 1,
    Pbx: 2,
    LatLon: 3,
});

const IcaoSearchFilter = Object.freeze({
    None: 0,
    Airports: 1,
    Intersections: 2,
    Vors: 3,
    Ndbs: 4,
});

class FMCDataManager {
    constructor(_fmc) {
        this.fmc = _fmc;

        this.storedWaypoints = [];

        // we keep these in localStorage so they live for the same length of time as the flightplan (that they could appear in)
        // if the f-pln is not stored there anymore we can delete this
        const stored = localStorage.getItem(FMCDataManager.STORED_WP_KEY);
        if (stored !== null) {
            JSON.parse(stored).forEach((wp) => {
                if (wp) {
                    this.storedWaypoints.push(Fmgc.WaypointBuilder.fromCoordinates(wp.ident, new LatLongAlt(wp.coordinates), this.fmc, wp.additionalData));
                } else {
                    this.storedWaypoints.push(undefined);
                }
            });
        }
    }
    IsValidLatLon(latLong) {
        if (latLong[0] === "N" || latLong[0] === "S") {
            if (isFinite(parseInt(latLong.substr(1, 2)))) {
                if (latLong[3] === "°") {
                    if (latLong[9] === "W" || latLong[9] === "E") {
                        if (isFinite(parseInt(latLong.substr(10, 3)))) {
                            if (latLong[13] === "°") {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    async IsAirportValid(icao) {
        if (!icao || icao.length !== 4) {
            return false;
        }
        return new Promise((resolve) => {
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", "A", "FMC").then(() => {
                SimVar.SetSimVarValue("C:fs9gps:IcaoSearchEnterChar", "string", icao, "FMC").then(() => {
                    resolve(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", "FMC") >= 0);
                });
            });
        });
    }
    async IsWaypointValid(ident) {
        if (!ident || ident.length < 0 || ident.length > 5) {
            return false;
        }
        return new Promise((resolve) => {
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", "AVNWX", "FMC").then(() => {
                SimVar.SetSimVarValue("C:fs9gps:IcaoSearchEnterChar", "string", ident, "FMC").then(() => {
                    resolve(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", "FMC") > 0);
                });
            });
        });
    }
    async GetAirportByIdent(ident) {
        if (!(await this.IsAirportValid(ident).catch(console.error))) {
            return undefined;
        }
        const icao = "A      " + ident.toLocaleUpperCase();
        const airportWaypoint = await this.fmc.facilityLoader.getAirport(icao);
        return airportWaypoint;
    }

    _filterDuplicateWaypoints(waypoints) {
        return waypoints.filter((wp, idx, wps) => wps.map((v) => v.icao).indexOf(wp.icao) === idx);
    }

    async GetWaypointsByIdent(ident) {
        const waypoints = [...await this.GetWaypointsByIdentAndType(ident, IcaoSearchFilter.None)];
        return this._filterDuplicateWaypoints(waypoints);
    }
    async GetVORsByIdent(ident) {
        const navaids = [];
        const vors = await this.GetWaypointsByIdentAndType(ident, IcaoSearchFilter.Vors);
        navaids.push(...vors.filter((vor) => vor.infos.type !== 6 /* ILS */));
        return navaids;
    }
    async GetILSsByIdent(ident) {
        const navaids = [];
        const vors = await this.GetWaypointsByIdentAndType(ident, IcaoSearchFilter.Vors);
        navaids.push(...vors.filter((vor) => vor.infos.type === 6 /* ILS */));
        return navaids;
    }
    async GetNDBsByIdent(ident) {
        const navaids = [];
        const ndbs = await this.GetWaypointsByIdentAndType(ident, IcaoSearchFilter.Ndbs);
        navaids.push(...ndbs);
        return navaids;
    }
    async GetWaypointsByIdentAndType(ident, filter = 0, maxItems = 40) {
        // fetch results from the nav database
        // we filter for equal idents, because the search returns everything starting with the given string
        const results = (await Coherent.call('SEARCH_BY_IDENT', ident, filter, maxItems)).filter((icao) => ident === icao.substr(7, 5).trim());
        const waypoints = (await Promise.all(results.map(async (icao) => await this.fmc.facilityLoader.getFacility(icao))))
            .filter((obj) => !!obj); // Remove waypoints we couldn't find

        if (results.length !== waypoints.length) {
            console.warn('[FMS/DataManager] Could not resolve all icaos to facilities.');
        }

        // fetch pilot stored waypoints
        if (filter === IcaoSearchFilter.None || (filter & IcaoSearchFilter.Intersections) > 0) {
            waypoints.push(...this.storedWaypoints.filter((wp) => wp && wp.ident === ident));
        }

        return waypoints;
    }
    async _PushWaypointToFlightPlan(waypoint) {
        const lastWaypointIndex = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointsNumber", "number", "FMC");
        return new Promise((resolve) => {
            SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointICAO", "string", waypoint.icao, "FMC").then(() => {
                SimVar.SetSimVarValue("C:fs9gps:FlightPlanAddWaypoint", "number", lastWaypointIndex, "FMC").then(() => {
                    this.fmc.requestCall(() => {
                        resolve(true);
                    });
                });
            });
        });
    }
    async _DeleteFlightPlan() {
        const deleteFirstWaypoint = async () => {
            return new Promise((resolve) => {
                SimVar.SetSimVarValue("C:fs9gps:FlightPlanDeleteWaypoint", "number", 0, "FMC").then(() => {
                    resolve();
                });
            });
        };
        while (SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointsNumber", "number", "FMC") > 0) {
            await deleteFirstWaypoint();
        }
        return true;
    }
    async ExecuteFlightPlan(fmc) {
        console.warn("ExecuteFlightPlan not implemented.");
        return true;
    }

    _nextStoredWaypointIndex() {
        for (let i = 0; i < 99; i++) {
            if (!this.storedWaypoints[i]) {
                return i;
            }
        }
        // TODO, delete oldest unused waypoint, only error if 99 in use
        throw NXSystemMessages.listOf99InUse;
    }

    _updateLocalStorage() {
        localStorage.setItem(FMCDataManager.STORED_WP_KEY, JSON.stringify(this.storedWaypoints.map((wp) => wp ? {
            ident: wp.ident,
            coordinates: { lat: wp.infos.coordinates.lat, long: wp.infos.coordinates.long },
            additionalData: wp.additionalData,
        } : undefined)));
    }

    storeWaypoint(wp, index) {
        this.storedWaypoints[index] = wp;
        this._updateLocalStorage();
    }

    /**
     *
     * @param {*} index
     * @param {*} updateStorage
     * @returns true if the waypoint was deleted
     */
    deleteStoredWaypoint(index, updateStorage = true) {
        if (!this.storedWaypoints[index]) {
            return true;
        }
        if (this.fmc.isWaypointInUse(this.storedWaypoints[index].icao)) {
            return false;
        }
        delete this.storedWaypoints[index];
        if (updateStorage) {
            this._updateLocalStorage();
        }
        return true;
    }

    /**
     *
     * @returns true if all waypoints were deleted
     */
    deleteAllStoredWaypoints() {
        let allDeleted = true;
        for (let i = this.storedWaypoints.length - 1; i >= 0; i--) {
            allDeleted &= this.deleteStoredWaypoint(i, false);
        }
        this._updateLocalStorage();
        return allDeleted;
    }

    numberOfStoredElements() {
        return {
            navaids: 0,
            routes: 0,
            runways: 0,
            waypoints: this.numberOfStoredWaypoints(),
        };
    }

    numberOfStoredWaypoints() {
        return this.storedWaypoints.reduce((count, wp) => wp ? count + 1 : count, 0);
    }

    prevStoredWaypointIndex(currentIndex) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (this.storedWaypoints[i]) {
                return i;
            }
        }
        for (let i = this.storedWaypoints.length - 1; i > currentIndex; i--) {
            if (this.storedWaypoints[i]) {
                return i;
            }
        }
        return currentIndex;
    }

    nextStoredWaypointIndex(currentIndex) {
        for (let i = currentIndex + 1; i < this.storedWaypoints.length; i++) {
            if (this.storedWaypoints[i]) {
                return i;
            }
        }
        for (let i = 0; i < currentIndex; i++) {
            if (this.storedWaypoints[i]) {
                return i;
            }
        }
        return currentIndex;
    }

    /**
     *
     * @param {number} index storage index of the waypoint
     * @returns the number of the stored waypoint, not counting empty storage indices
     */
    storedWaypointNumber(index) {
        let position = 0;
        for (let i = 0; i < this.storedWaypoints.length && i <= index; i++) {
            if (this.storedWaypoints[i]) {
                position++;
            }
        }
        return position;
    }

    _createWaypoint(ident, index, coordinates, additionalData, stored) {
        additionalData.storedIndex = index;
        additionalData.temporary = !stored;

        const wp = Fmgc.WaypointBuilder.fromCoordinates(ident, coordinates, this.fmc.instrument, additionalData);

        if (stored) {
            // we add the index to ensure the icao is unique, so it doesn't get de-duplicated on dup names page etc.
            const icao = wp.icao + index.toString().padStart(2, '0');
            wp.icao = icao;
            wp.infos.icao = icao;

            this.storeWaypoint(wp, index);
        }

        return wp;
    }

    /**
     *
     * @param {LatLong|LatLongAlt} coordinates
     * @throws {McduMessage}
     * @param {boolean} stored
     */
    createLatLonWaypoint(coordinates, stored = false, ident = undefined) {
        let index = -1;
        if (stored) {
            index = this._nextStoredWaypointIndex();
        }

        if (ident === undefined) {
            if (false) { // opc or ami option... common on A330...
                const latDeg = Math.abs(Math.trunc(coordinates.lat)).toFixed(0).padStart(2, '0');
                const lonDeg = Math.abs(Math.trunc(coordinates.long)).toFixed(0).padStart(3, '0');
                ident = `${coordinates.lat >= 0 ? 'N' : 'S'}${latDeg}${coordinates.long >= 0 ? 'E' : 'W'}${lonDeg}${(index + 1).toFixed(0).padStart(2, '0')}`;
            } else {
                ident = `LL${(index + 1).toFixed(0).padStart(2, '0')}`;
            }
        }

        const additionalData = {
            storedType: StoredWaypointType.LatLon,
        };

        return this._createWaypoint(ident, index, coordinates, additionalData, stored);
    }

    /**
     *
     * @param {LatLong|LatLongAlt} coordinates
     * @throws {McduMessage}
     * @param {boolean} stored
     */
    createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored = false, ident = undefined) {
        const coordinates = A32NX_Util.greatCircleIntersection(place1.infos.coordinates, bearing1, place2.infos.coordinates, bearing2);

        let index = -1;
        if (stored) {
            index = this._nextStoredWaypointIndex();
        }

        if (ident === undefined) {
            ident = `PBX${(index + 1).toFixed(0).padStart(2, '0')}`;
        }

        const additionalData = {
            storedType: StoredWaypointType.Pbx,
            pbxPlace1: place1.ident.substring(0, 5),
            pbxBearing1: bearing1,
            pbxPlace2: place2.ident.substring(0, 5),
            pbxBearing2: bearing2,
        };

        return this._createWaypoint(ident, index, coordinates, additionalData, stored);
    }

    /**
     *
     * @param {WayPoint} origin
     * @param {number} bearing true bearing
     * @param {number} distance
     * @throws {McduMessage}
     * @param {boolean} stored
     */
    createPlaceBearingDistWaypoint(origin, bearing, distance, stored = false, ident = undefined) {
        const coordinates = Avionics.Utils.bearingDistanceToCoordinates(bearing, distance, origin.infos.coordinates.lat, origin.infos.coordinates.long);

        let index = -1;
        if (stored) {
            index = this._nextStoredWaypointIndex();
        }

        if (ident === undefined) {
            ident = `PBD${(index + 1).toFixed(0).padStart(2, '0')}`;
        }

        const additionalData = {
            storedType: StoredWaypointType.Pbd,
            pbdPlace: origin.ident,
            pbdBearing: bearing,
            pbdDistance: distance,
        };

        return this._createWaypoint(ident, index, coordinates, additionalData, stored);
    }

    /**
     * @param {WayPoint} airport
     * @param {OneWayRunway} runway
     */
    createRunwayWaypoint(airport, runway) {
        const ident = `${airport.ident}${Avionics.Utils.formatRunway(runway.designation)}`;
        // TODO should this be threshold co-ordinates?
        const wp = Fmgc.WaypointBuilder.fromCoordinates(ident, runway.beginningCoordinates, this.fmc.instrument);
        wp.icao = `R${airport.icao.substring(1, 4)}${airport.icao.substring(7, 11)}RW${Avionics.Utils.formatRunway(runway.designation)}`;
        wp.infos.icao = wp.icao;
        return wp;
    }
}
FMCDataManager.STORED_WP_KEY = 'A32NX.StoredWaypoints';
