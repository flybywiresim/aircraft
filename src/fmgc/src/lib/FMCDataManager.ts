/* global BaseInstrument */
/* eslint-disable no-underscore-dangle */
export class FMCDataManager {
    fmc: BaseInstrument

    constructor(parentElement: BaseInstrument) {
        this.fmc = parentElement;
    }

    IsValidLatLon(latLong: string) {
        if (latLong[0] === 'N' || latLong[0] === 'S') {
            if (Number.isFinite(parseInt(latLong.substr(1, 2)))) {
                if (latLong[3] === '°') {
                    if (latLong[9] === 'W' || latLong[9] === 'E') {
                        if (Number.isFinite(parseInt(latLong.substr(10, 3)))) {
                            if (latLong[13] === '°') {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    async IsAirportValid(icao: any) {
        if (!icao || icao.length !== 4) {
            return false;
        }
        return new Promise((resolve) => {
            SimVar.SetSimVarValue('C:fs9gps:IcaoSearchStartCursor', 'string', 'A', 'FMC').then(() => {
                SimVar.SetSimVarValue('C:fs9gps:IcaoSearchEnterChar', 'string', icao, 'FMC').then(() => {
                    resolve(SimVar.GetSimVarValue('C:fs9gps:IcaoSearchMatchedIcaosNumber', 'number', 'FMC') >= 0);
                });
            });
        });
    }

    async IsWaypointValid(ident: string) {
        if (!ident || ident.length < 0 || ident.length > 5) {
            return false;
        }
        return new Promise((resolve) => {
            SimVar.SetSimVarValue('C:fs9gps:IcaoSearchStartCursor', 'string', 'AVNWX', 'FMC').then(() => {
                SimVar.SetSimVarValue('C:fs9gps:IcaoSearchEnterChar', 'string', ident, 'FMC').then(() => {
                    resolve(SimVar.GetSimVarValue('C:fs9gps:IcaoSearchMatchedIcaosNumber', 'number', 'FMC') > 0);
                });
            });
        });
    }

    async GetAirportByIdent(ident: string) {
        if (!(await this.IsAirportValid(ident))) {
            return undefined;
        }
        const icao = `A      ${ident.toLocaleUpperCase()}`;
        const airportWaypoint = await this.fmc.facilityLoader.getAirport(icao);
        return airportWaypoint;
    }

    _filterDuplicateWaypoints(waypoints: any[]) {
        return waypoints.filter((wp, idx, wps) => wps.map((v) => v.icao).indexOf(wp.icao) === idx);
    }

    async GetWaypointsByIdent(ident: any) {
        const waypoints = [];
        const intersections = await this.GetWaypointsByIdentAndType(ident, 'W');
        waypoints.push(...intersections);
        const vors = await this.GetWaypointsByIdentAndType(ident, 'V');
        waypoints.push(...vors);
        const ndbs = await this.GetWaypointsByIdentAndType(ident, 'N');
        waypoints.push(...ndbs);
        const airports = await this.GetWaypointsByIdentAndType(ident, 'A');
        waypoints.push(...airports);
        return this._filterDuplicateWaypoints(waypoints);
    }

    async GetVORsByIdent(ident: any): Promise<any> {
        const navaids = [];
        const vors = await this.GetWaypointsByIdentAndType(ident, 'V');
        navaids.push(...vors);
        return navaids;
    }

    async GetNDBsByIdent(ident: any): Promise<any> {
        const navaids = [];
        const ndbs = await this.GetWaypointsByIdentAndType(ident, 'N');
        navaids.push(...ndbs);
        return navaids;
    }

    async GetWaypointsByIdentAndType(ident: string, wpType = 'W'): Promise<any> {
        return new Promise((resolve) => {
            const waypoints = [];
            SimVar.SetSimVarValue('C:fs9gps:IcaoSearchStartCursor', 'string', wpType, 'FMC').then(() => {
                SimVar.SetSimVarValue('C:fs9gps:IcaoSearchEnterChar', 'string', ident, 'FMC').then(async () => {
                    const waypointsCount = SimVar.GetSimVarValue('C:fs9gps:IcaoSearchMatchedIcaosNumber', 'number', 'FMC');
                    const getWaypoint = async (index: number) => new Promise<any>((resolve) => {
                        SimVar.SetSimVarValue('C:fs9gps:IcaoSearchMatchedIcao', 'number', index, 'FMC').then(async () => {
                            const icao = SimVar.GetSimVarValue('C:fs9gps:IcaoSearchCurrentIcao', 'string', 'FMC');
                            const waypoint = await this.fmc.facilityLoader.getFacility(icao);
                            resolve(waypoint);
                        });
                    });
                    for (let i = 0; i < waypointsCount; i++) {
                        // eslint-disable-next-line no-await-in-loop
                        const waypoint = await getWaypoint(i);
                        waypoints.push(waypoint);
                    }
                    resolve(waypoints);
                });
            });
        });
    }

    async _PushWaypointToFlightPlan(waypoint) {
        const lastWaypointIndex = SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number', 'FMC');
        return new Promise((resolve) => {
            SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointICAO', 'string', waypoint.icao, 'FMC').then(() => {
                SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', lastWaypointIndex, 'FMC').then(() => {
                    this.fmc.requestCall(() => {
                        resolve(true);
                    });
                });
            });
        });
    }

    async _DeleteFlightPlan() {
        const deleteFirstWaypoint = async () => new Promise<void>((resolve) => {
            SimVar.SetSimVarValue('C:fs9gps:FlightPlanDeleteWaypoint', 'number', 0, 'FMC').then(() => {
                resolve();
            });
        });
        while (SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number', 'FMC') > 0) {
            // eslint-disable-next-line no-await-in-loop
            await deleteFirstWaypoint();
        }
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ExecuteFlightPlan(fmc: any) {
        console.warn('ExecuteFlightPlan not implemented.');
        return true;
    }
}
