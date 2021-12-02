class FMCDataManager {
    constructor(_fmc) {
        this.fmc = _fmc;
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
        const waypoints = [];
        const intersections = await this.GetWaypointsByIdentAndType(ident, "W").catch(console.error);
        waypoints.push(...intersections);
        const vors = await this.GetWaypointsByIdentAndType(ident, "V").catch(console.error);
        waypoints.push(...vors);
        const ndbs = await this.GetWaypointsByIdentAndType(ident, "N").catch(console.error);
        waypoints.push(...ndbs);
        const airports = await this.GetWaypointsByIdentAndType(ident, "A").catch(console.error);
        waypoints.push(...airports);
        return this._filterDuplicateWaypoints(waypoints);
    }
    async GetVORsByIdent(ident) {
        const navaids = [];
        const vors = await this.GetWaypointsByIdentAndType(ident, "V").catch(console.error);
        navaids.push(...vors);
        return navaids;
    }
    async GetNDBsByIdent(ident) {
        const navaids = [];
        const ndbs = await this.GetWaypointsByIdentAndType(ident, "N").catch(console.error);
        navaids.push(...ndbs);
        return navaids;
    }
    async GetWaypointsByIdentAndType(ident, wpType = "W") {
        return new Promise((resolve) => {
            const waypoints = [];
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", wpType, "FMC").then(() => {
                SimVar.SetSimVarValue("C:fs9gps:IcaoSearchEnterChar", "string", ident, "FMC").then(async () => {
                    const waypointsCount = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", "FMC");
                    const getWaypoint = async (index) => {
                        return new Promise((resolve) => {
                            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", index, "FMC").then(async () => {
                                const icao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", "FMC");
                                const waypoint = await this.fmc.facilityLoader.getFacility(icao);
                                resolve(waypoint);
                            });
                        });
                    };
                    for (let i = 0; i < waypointsCount; i++) {
                        const waypoint = await getWaypoint(i);
                        waypoints.push(waypoint);
                    }
                    resolve(waypoints);
                });
            });
        });
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
}
//# sourceMappingURL=FMCDataManager.js.map
