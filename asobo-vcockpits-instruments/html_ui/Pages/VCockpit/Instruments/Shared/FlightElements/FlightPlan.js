class FlightPlan {
    constructor(_instrument, _manager) {
        this.wayPoints = [];
        this.instrument = _instrument;
        this.manager = _manager;
        this.beginGeoCalc = new GeoCalcInfo(_instrument);
        this.waypointsBatch = new SimVar.SimVarBatch("C:fs9gps:FlightPlanWaypointsNumber", "C:fs9gps:FlightPlanWaypointIndex");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointICAO", "string", "string");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointIdent", "string", "string");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointType", "number", "number");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointDistance", "nautical miles", "number");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointDistanceTotal", "nautical miles", "number");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointLatitude", "degrees", "number");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointLongitude", "degrees", "number");
        this.waypointsBatch.add("C:fs9gps:FlightPlanWaypointMagneticHeading", "degrees", "number");
        this.approachBatch = new SimVar.SimVarBatch("C:fs9gps:FlightPlanApproachWaypointsNumber", "C:fs9gps:FlightPlanWaypointApproachIndex");
        this.approachBatch.add("C:fs9gps:FlightPlanWaypointApproachICAO", "string", "string");
        this.approachBatch.add("C:fs9gps:FlightPlanWaypointApproachName", "string", "string");
        this.approachBatch.add("C:fs9gps:FlightPlanWaypointApproachLatitude", "degree", "number");
        this.approachBatch.add("C:fs9gps:FlightPlanWaypointApproachLongitude", "degree", "number");
        this.approachBatch.add("C:fs9gps:FlightPlanWaypointApproachLegDistance", "nautical miles", "number");
        this.approachBatch.add("C:fs9gps:FlightPlanWaypointApproachLegTotalDistance", "nautical miles", "number");
        this.approachBatch.add("C:fs9gps:FlightPlanWaypointApproachType", "number", "number");
    }
    updateActiveWaypoint() {
        this.activeWayPoint = SimVar.GetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "number");
    }
    LoadData() {
        switch (this.loadState) {
            case 0:
                this.name = SimVar.GetSimVarValue("C:fs9gps:FlightPlanTitle", "string");
                this.activeWayPoint = SimVar.GetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "number");
                this.isDirectTo = SimVar.GetSimVarValue("C:fs9gps:FlightPlanIsDirectTo", "Bool");
                SimVar.GetSimVarArrayValues(this.waypointsBatch, function (_Values) {
                    for (let i = 0; i < _Values.length; i++) {
                        if (!this.wayPoints[i]) {
                            this.wayPoints[i] = new WayPoint(this.instrument);
                        }
                        this.wayPoints[i].SetIdent(_Values[i][1]);
                        this.wayPoints[i].SetTypeFromEnum(_Values[i][2]);
                        this.wayPoints[i].SetICAO(_Values[i][0]);
                        this.wayPoints[i].distanceInFP = _Values[i][3];
                        this.wayPoints[i].cumulativeDistanceInFP = _Values[i][4];
                        this.wayPoints[i].latitudeFP = _Values[i][5];
                        this.wayPoints[i].longitudeFP = _Values[i][6];
                        this.wayPoints[i].bearingInFP = _Values[i][7];
                    }
                    while (this.wayPoints.length > _Values.length) {
                        this.wayPoints.pop();
                    }
                    this.loadState++;
                }.bind(this), this.instrument.instrumentIdentifier);
                if (SimVar.GetSimVarValue("C:fs9gps:FlightPlanIsLoadedApproach", "Boolean", this.instrument.instrumentIdentifier)) {
                    this.approach = new Approach();
                    this.approach.name = SimVar.GetSimVarValue("C:fs9gps:FlightPlanTitle", "string", this.instrument.instrumentIdentifier);
                    SimVar.GetSimVarArrayValues(this.approachBatch, function (_Values) {
                        this.approach.WayPoints = [];
                        for (let i = 0; i < _Values.length; i++) {
                            this.approach.wayPoints.push(new ApproachWayPoint(this.gps));
                            this.approach.wayPoints[i].icao = _Values[i][0];
                            this.approach.wayPoints[i].name = _Values[i][1];
                            this.approach.wayPoints[i].latitude = _Values[i][2];
                            this.approach.wayPoints[i].longitude = _Values[i][3];
                            this.approach.wayPoints[i].distanceInFP = _Values[i][4];
                            this.approach.wayPoints[i].cumulativeDistanceInFP = _Values[i][5];
                            this.approach.wayPoints[i].type = _Values[i][6];
                        }
                        this.loadState++;
                    }.bind(this), this.instrument.instrumentIdentifier);
                } else {
                    this.approach = null;
                    this.loadState++;
                }
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.endLoadingCallback) {
            this.endLoadingCallback();
        }
    }
    FillWithCurrentFP(_Callback = null) {
        this.manager.updateFlightPlan(function () {
            this.wayPoints = this.manager.getWaypoints();
            this.approach = this.approach;
        }.bind(this));
    }
    GetAirportList() {
        const airports = [];
        for (let i = 0; i < this.wayPoints.length; i++) {
            if (this.wayPoints[i].type == 'A') {
                airports.push(this.wayPoints[i]);
            }
        }
        return airports;
    }
    FillHTMLElement(_element, _nbElemMax, _startIndex) {
        let Html = "";
        if (this.wayPoints.length > 0) {
            for (var i = _startIndex; i < Math.min(_startIndex + _nbElemMax, this.wayPoints.length); i++) {
                let ident = this.wayPoints[i].GetInfos().ident;
                if (ident == "") {
                    ident = this.wayPoints[i].ident;
                }
                Html += '<div>';
                Html += '   <div class="Third AlignLeft SelectableElement" id="FlightPlanElement_' + (i - _startIndex) + '">' + ident + '</div>';
                Html += '   <div class="Third"> <div class="Align">' + fastToFixed(this.wayPoints[i].cumulativeDistanceInFP, 0) + '</div><div class="Align unit">n<br/>m</div></div>';
                Html += '   <div class="Third"> <div class="Align">' + fastToFixed(this.wayPoints[i].distanceInFP, 0) + '</div><div class="Align unit">n<br/> m </div></div>';
                Html += '</div>';
            }
            if (this.approach) {
                if (_startIndex <= this.wayPoints.length && (_startIndex + 4) > this.wayPoints.length) {
                    Html += '<div class="SelectableTitle" id="FlightPlanElement_' + (this.wayPoints.length - _startIndex) + '"> Approach ' + this.approach.name + '</div>';
                }
                for (var i = Math.max(0, _startIndex - this.wayPoints.length - 1); i < Math.min(_startIndex + 4 - this.wayPoints.length - 1, this.approach.wayPoints.length); i++) {
                    Html += '<div>';
                    Html += '   <div class="Third AlignLeft SelectableElement" id="FlightPlanElement_' + (i + this.wayPoints.length + 1 - _startIndex) + '">' + this.approach.wayPoints[i].ident + '</div>';
                    Html += '   <div class="Third"> <div class="Align">' + fastToFixed(this.approach.wayPoints[i].cumulativeDistanceInFP, 0) + '</div><div class="Align unit">n<br/>m</div></div>';
                    Html += '   <div class="Third"> <div class="Align">' + fastToFixed(this.approach.wayPoints[i].distanceInFP, 0) + '</div><div class="Align unit">n<br/> m </div></div>';
                    Html += '</div>';
                }
            } else if (this.wayPoints.length && (_startIndex + 4) > this.wayPoints.length) {
                Html += '<div><div class="Third AlignLeft SelectableElement" id="FlightPlanElement_' + (this.wayPoints.length - _startIndex) + '"></div></div>';
            }
        } else {
            Html += '<div><div class="Third AlignLeft SelectableElement" id="FlightPlanElement_' + (this.wayPoints.length - _startIndex) + '"></div></div>';
        }
        _element.innerHTML = Html;
    }
}
FlightPlan.readManager = new InstrumentDataReadManager();
class FlightPlanAlternate {
    constructor(instrument) {
        this.instrument = instrument;
        this.activeWaypoint = 1;
        this.waypoints = [];
        this.routeWaypoints = [];
        this.updating = false;
    }
    activeBearing() {
        const activeWaypoint = this.waypoints[this.activeWaypoint];
        if (activeWaypoint) {
            return activeWaypoint.bearingInFP;
        }
    }
    async update() {
        if (this.updating) {
            return;
        }
        this.updating = true;
        const waypointsNumber = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointsNumber", "number", this.instrument.instrumentIdentifier);
        this.activeWaypoint = SimVar.GetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "number", this.instrument.instrumentIdentifier);
        if (waypointsNumber === 0 || waypointsNumber === null) {
            this.updating = false;
            return;
        }
        const getWaypoint = async (index) => {
            return new Promise((resolve) => {
                SimVar.SetSimVarValue("C:fs9gps:FlightPlanWaypointIndex", "number", index, this.instrument.instrumentIdentifier).then(() => {
                    this.instrument.requestCall(async () => {
                        const icao = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointICAO", "string", this.instrument.instrumentIdentifier);
                        let waypoint = this.waypoints.find(wp => {
                            return wp && wp.icao === icao;
                        });
                        if (!waypoint && icao !== "") {
                            waypoint = await this.instrument.facilityLoader.getFacility(icao);
                        }
                        if (!waypoint) {
                            waypoint = new WayPoint(this.instrument);
                            waypoint.infos = new WayPointInfo(this.instrument);
                            waypoint.infos.name = "User-Defined";
                            waypoint.infos.ident = "U" + Math.random().toFixed(4).substr(2);
                            waypoint.infos.lat = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointLatitude", "degree", this.instrument.instrumentIdentifier);
                            waypoint.infos.long = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointLongitude", "degree", this.instrument.instrumentIdentifier);
                        }
                        if (waypoint) {
                            const timeInFP = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointETE", "second", this.instrument.instrumentIdentifier);
                            waypoint.infos.timeInFP = timeInFP;
                            waypoint.infos.totalTimeInFP = timeInFP;
                            const etaInFP = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointETA", "seconds", this.instrument.instrumentIdentifier);
                            waypoint.infos.etaInFP = etaInFP;
                            const distInFP = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointDistanceTotal", "meter", this.instrument.instrumentIdentifier);
                            waypoint.infos.totalDistInFP = distInFP / 1852;
                            const fuelConsumption = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointEstimatedFuelConsumption", "gallons", this.instrument.instrumentIdentifier);
                            waypoint.infos.fuelConsInFP = fuelConsumption;
                            waypoint.infos.totalFuelConsInFP = fuelConsumption;
                            waypoint.bearingInFP = SimVar.GetSimVarValue("C:fs9gps:FlightPlanWaypointMagneticHeading", "degree", this.instrument.instrumentIdentifier);
                            waypoint.isInFlightPlan = true;
                        }
                        resolve(waypoint);
                    });
                });
            });
        };
        const waypointOrigin = await getWaypoint(0);
        if (waypointOrigin) {
            this.origin = waypointOrigin;
        }
        const newWaypoints = [];
        for (let i = 1; i < waypointsNumber - 1; i++) {
            const waypoint = await getWaypoint(i);
            if (waypoint) {
                newWaypoints.push(waypoint);
            }
        }
        this.routeWaypoints = newWaypoints;
        const waypointDest = await getWaypoint(waypointsNumber - 1);
        if (waypointDest) {
            this.dest = waypointDest;
        }
        this.waypoints = [];
        if (this.origin) {
            this.waypoints.push(this.origin);
        }
        this.waypoints.push(...this.routeWaypoints);
        if (this.dest) {
            this.waypoints.push(this.dest);
        }
        for (let i = 1; i < this.waypoints.length; i++) {
            const wp = this.waypoints[i];
            const prevWp = this.waypoints[i - 1];
            if (wp && prevWp) {
                wp.infos.totalTimeInFP = wp.infos.timeInFP + prevWp.infos.totalTimeInFP;
                wp.infos.totalFuelConsInFP = wp.infos.fuelConsInFP + prevWp.infos.totalFuelConsInFP;
            }
        }
        if (this.dest && this.waypoints[this.waypoints.length - 1]) {
            this.dest.infos.totalTimeInFP = this.dest.infos.timeInFP + this.waypoints[this.waypoints.length - 1].infos.totalTimeInFP;
        }
        this.updating = false;
    }
}
//# sourceMappingURL=FlightPlan.js.map