class FullDataAirport extends WayPoint {
    constructor(_instrument) {
        super(_instrument);
        this.type = "A";
    }
}
class NearestWaypoint extends WayPoint {
    constructor() {
        super(...arguments);
        this.routes = [];
    }
}
var AirportSize;
(function (AirportSize) {
    AirportSize[AirportSize["Small"] = 0] = "Small";
    AirportSize[AirportSize["Medium"] = 1] = "Medium";
    AirportSize[AirportSize["Large"] = 2] = "Large";
})(AirportSize || (AirportSize = {}));
class NearestAirport extends NearestWaypoint {
    constructor() {
        super(...arguments);
        this.airportClass = 1;
        this.fuel1 = "";
        this.fuel2 = "";
        this.hasAirportInfosLoaded = false;
    }
    get svgMapElement() {
        if (!this._svgMapElement) {
            this._svgMapElement = new SvgNearestAirportElement();
            this._svgMapElement.source = this;
        }
        return this._svgMapElement;
    }
    imageFileName() {
        let fName = "ICON_MAP_AIRPORT_UNKNOWN_PINK.svg";
        if (this.airportClass === 1) {
            if (this.towered) {
                if (this.fuel1 !== "" || this.fuel2 !== "") {
                    fName = "ICON_MAP_AIRPORT_TOWERED_SERVICED_BLUE.svg";
                } else {
                    fName = "ICON_MAP_AIRPORT_TOWERED_NON_SERVICED_BLUE.svg";
                }
            } else {
                if (this.fuel1 !== "" || this.fuel2 !== "") {
                    fName = "ICON_MAP_AIRPORT_NON_TOWERED_SERVICED_PINK.svg";
                } else {
                    fName = "ICON_MAP_AIRPORT_NON_TOWERED_NON_SERVICED_PINK.svg";
                }
            }
        } else if (this.airportClass === 2) {
            if (this.fuel1 !== "" || this.fuel2 !== "") {
                fName = "ICON_MAP_AIRPORT7.svg";
            } else {
                fName = "ICON_MAP_AIRPORT8.svg";
            }
        } else if (this.airportClass === 3) {
            if (this.towered) {
                fName = "ICON_MAP_AIRPORT_TOWERED_SEAPLANE_CIV_BLUE.svg";
            } else {
                fName = "ICON_MAP_AIRPORT_NON_TOWERED_SEAPLANE_CIV_PINK.svg";
            }
        } else if (this.airportClass === 4) {
            fName = "ICON_MAP_AIRPORT_HELIPORT_PINK.svg";
        } else if (this.airportClass === 5) {
            fName = "ICON_MAP_AIRPORT_PRIVATE_PINK.svg";
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }
    getSize() {
        if (this.longestRunwayLength < 5000) {
            return AirportSize.Small;
        }
        if (this.longestRunwayLength > 8100) {
            return AirportSize.Large;
        }
        if (this.towered) {
            return AirportSize.Large;
        }
        return AirportSize.Medium;
    }
}
class FullDataNearestAirportList {
    constructor(_instrument) {
        this.instrument = _instrument;
        this.airports = [];
        this.batch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", "C:fs9gps:NearestAirportCurrentLine");
        this.batch.add("C:fs9gps:NearestAirportSelectedLatitude", "degree latitude");
        this.batch.add("C:fs9gps:NearestAirportSelectedLongitude", "degree longitude");
        this.batch.add("C:fs9gps:NearestAirportCurrentICAO", "string", "string");
        this.batch.add("C:fs9gps:NearestAirportCurrentIdent", "string", "string");
        this.batch.add("C:fs9gps:NearestAirportCurrentDistance", "nautical miles", "number");
        this.batch.add("C:fs9gps:NearestAirportCurrentTrueBearing", "degrees", "number");
    }
    Update(_nbMax = 9, _milesDistance = 200) {
        this.nbMax = _nbMax;
        this.milesDistance = _milesDistance;
        if (NearestAirportList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.needUpdate = false;
        } else {
            this.needUpdate = true;
        }
    }
    LoadData() {
        const instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                this._referentialLat = SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude", instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLatitude", "degree latitude", this._referentialLat, instrId);
                this._referentialLong = SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude", instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLongitude", "degree longitude", this._referentialLong, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumItems", "number", this.nbMax, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumDistance", "nautical miles", this.milesDistance, instrId);
                this.loadState++;
                break;
            case 1:
                SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
                    for (var j = 0; j < this.airports.length; j++) {
                        this.airports[j].toDelete = true;
                    }
                    for (let i = 0; i < _Values.length; i++) {
                        let found = false;
                        for (var j = 0; j < this.airports.length && !found; j++) {
                            if (this.airports[j].GetInfos().icao == _Values[i][2]) {
                                found = true;
                                this.airports[j].toDelete = false;
                                this.airports[j].distance = _Values[i][3];
                                this.airports[j].bearing = _Values[i][4];
                                if (this.airports[j].GetInfos().longitude == 0) {
                                    this.airports[j].SetICAO(_Values[i][2], false);
                                }
                            }
                        }
                        if (!found) {
                            const airport = new FullDataAirport(this.instrument);
                            airport.toDelete = false;
                            airport.type = 'A';
                            airport.ident = _Values[i][3];
                            airport.icao = _Values[i][2];
                            airport.distance = _Values[i][3];
                            airport.bearing = _Values[i][4];
                            this.airports.push(airport);
                        }
                    }
                    for (var j = 0; j < this.airports.length; j++) {
                        if (this.airports[j].toDelete == true) {
                            this.airports.splice(j, 1);
                        }
                    }
                    this.loadState++;
                }.bind(this), instrId);
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.needUpdate) {
            this.Update(this.nbMax, this.milesDistance);
        }
    }
}
class NearestAirportList {
    constructor(_instrument) {
        this.instrument = _instrument;
        this.airports = [];
        this.airportLineBatch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", "C:fs9gps:NearestAirportCurrentLine");
        this.airportLineBatch.add("C:fs9gps:NearestAirportSelectedLatitude", "degree latitude");
        this.airportLineBatch.add("C:fs9gps:NearestAirportSelectedLongitude", "degree longitude");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentICAO", "string", "string");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentIdent", "string", "string");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentDistance", "nautical miles", "number");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentTrueBearing", "degrees", "number");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentBestApproach", "string", "string");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentComFrequencyName", "string", "string");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentComFrequencyValue", "MHz", "number");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentComFrequencyValue", "Frequency BCD16", "number");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentLongestRunwayLength", "feet", "number");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentLongestAirportDirection", "degree", "number");
        this.airportLineBatch.add("C:fs9gps:NearestAirportCurrentAirportKind", "number", "number");
        this.airportSelectedBatch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", "C:fs9gps:NearestAirportSelected");
        this.airportSelectedBatch.add("C:fs9gps:NearestAirportSelectedAirportName", "string", "string");
        this.airportSelectedBatch.add("C:fs9gps:NearestAirportSelectedLatitude", "degree latitude");
        this.airportSelectedBatch.add("C:fs9gps:NearestAirportSelectedLongitude", "degree longitude");
    }
    Update(_nbMax = 20, _milesDistance = 200) {
        this.nbMax = _nbMax;
        this.milesDistance = _milesDistance;
        if (NearestAirportList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.needUpdate = false;
        } else {
            this.needUpdate = true;
        }
    }
    GetTable(_startIndex, _prefix) {
        let html = "";
        let index;
        for (let i = 0; i < 3; i++) {
            index = i + _startIndex;
            html += "<tr>";
            if (index > this.airports.length) {
                html += "<td></td><td></td><td></td><td></td><td></td>";
            } else {
                html += '<td class="SelectableElement" id="' + _prefix + "_" + i + '">' + this.airports[index].ident + '</td>';
                html += '<td><img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + this.airports[index].imageFileName() + '" class="imgSizeS"/> </td>';
                html += '<td>' + fastToFixed(this.airports[index].bearing, 0) + '<div class="Align unit">o<br />M</div></td>';
                html += '<td>' + fastToFixed(this.airports[index].distance, 1) + '<div class="Align unit">n<br />m</div></td>';
                html += '<td>' + this.airports[index].bestApproach + '</td>';
            }
            html += "</tr>";
            html += "<tr>";
            if (index > this.airports.length) {
                html += "<td></td><td></td><td></td><td></td><td></td>";
            } else {
                html += '<td>' + this.airports[index].frequencyName + '</td>';
                html += '<td colspan="2" class="SelectableElement" id="' + _prefix + "_Freq_" + i + '">' + fastToFixed(this.airports[index].frequencyMHz, 3) + '</td>';
                html += '<td>rwy</td>';
                html += '<td>' + fastToFixed(this.airports[index].longestRunwayLength, 0) + '<div class="Align unit">f<br />t</div></td>';
            }
            html += "</tr>";
        }
        return html;
    }
    LoadData() {
        const instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLatitude", "degree latitude", SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLongitude", "degree longitude", SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumItems", "number", this.nbMax, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumDistance", "nautical miles", this.milesDistance, instrId);
                SimVar.GetSimVarArrayValues(this.airportLineBatch, function (_Values) {
                    for (let i = 0; i < _Values.length; i++) {
                        if (this.airports.length < i + 1) {
                            this.airports.push(new NearestAirport(this.instrument));
                        }
                        this.airports[i].icao = _Values[i][2];
                        this.airports[i].ident = _Values[i][3];
                        this.airports[i].distance = _Values[i][4];
                        this.airports[i].bearing = _Values[i][5];
                        this.airports[i].bestApproach = _Values[i][6];
                        this.airports[i].frequencyName = _Values[i][7];
                        this.airports[i].frequencyMHz = _Values[i][8];
                        this.airports[i].frequencyBCD16 = _Values[i][9];
                        this.airports[i].longestRunwayLength = _Values[i][10];
                        this.airports[i].longestRunwayDirection = _Values[i][11];
                        this.airports[i].airportClass = _Values[i][12];
                    }
                    this.loadState++;
                    while (this.airports.length > _Values.length) {
                        this.airports.pop();
                    }
                }.bind(this), instrId);
                SimVar.GetSimVarArrayValues(this.airportSelectedBatch, function (_Values) {
                    for (let i = 0; i < _Values.length; i++) {
                        if (this.airports.length < i + 1) {
                            this.airports.push(new NearestAirport(this.instrument));
                        }
                        this.airports[i].name = Utils.Translate(_Values[i][0]);
                        this.airports[i].coordinates = new LatLongAlt(_Values[i][1], _Values[i][2]);
                    }
                    this.loadState++;
                }.bind(this), instrId);
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.needUpdate) {
            this.Update(this.nbMax, this.milesDistance);
        }
    }
}
NearestAirportList.readManager = new InstrumentDataReadManager();
class NearestWaypointRoute {
    constructor(nearestIntersection) {
        this.nearestIntersection = nearestIntersection;
    }
}
class NearestIntersection extends NearestWaypoint {
    constructor(_instrumentName) {
        super(_instrumentName);
        this.airwaysDrawn = false;
    }
    get svgMapElement() {
        if (!this._svgMapElement) {
            this._svgMapElement = new SvgNearestIntersectionElement();
            this._svgMapElement.source = this;
        }
        return this._svgMapElement;
    }
    imageFileName() {
        if (BaseInstrument.useSvgImages) {
            return "ICON_MAP_INTERSECTION.svg";
        }
        return "ICON_MAP_INTERSECTION.png";
    }
}
class NearestIntersectionList {
    constructor(_instrument) {
        this.lastBearing = 0;
        this.lastDistance = 0;
        this.instrument = _instrument;
        this.intersections = [];
        this.batch = new SimVar.SimVarBatch("C:fs9gps:NearestIntersectionItemsNumber", "C:fs9gps:NearestIntersectionCurrentLine");
        this.batch.add("C:fs9gps:NearestIntersectionCurrentICAO", "string", "string");
        this.batch.add("C:fs9gps:NearestIntersectionCurrentIdent", "string", "string");
        this.batch.add("C:fs9gps:NearestIntersectionCurrentDistance", "nautical miles", "number");
        this.batch.add("C:fs9gps:NearestIntersectionCurrentTrueBearing", "degrees", "number");
    }
    Update(_nbMax = 20, _milesDistance = 200) {
        this.nbMax = _nbMax;
        this.milesDistance = _milesDistance;
        if (NearestIntersectionList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.needUpdate = false;
        } else {
            this.needUpdate = true;
        }
    }
    GetTable(_startIndex, _prefix) {
        let html = "";
        let index;
        for (let i = 0; i < 5; i++) {
            index = i + _startIndex;
            html += "<tr>";
            if (index > this.intersections.length) {
                html += "<td></td><td></td><td></td><td></td>";
            } else {
                html += '<td class="SelectableElement" id="' + _prefix + "_" + i + '">' + this.intersections[index].ident + '</td>';
                html += '<td><img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + this.intersections[index].imageFileName() + '"/></td>';
                html += '<td>' + fastToFixed(this.intersections[index].bearing, 0) + '<div class="Align unit">o<br />M</div></td>';
                html += '<td>' + fastToFixed(this.intersections[index].distance, 1) + '<div class="Align unit">n<br />m</div></td>';
            }
            html += "</tr>";
        }
        return html;
    }
    LoadData() {
        const instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                SimVar.SetSimVarValue("C:fs9gps:NearestIntersectionCurrentLatitude", "degree latitude", SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestIntersectionCurrentLongitude", "degree longitude", SimVar.GetSimVarValue("GPS POSITION LON", "degree latitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestIntersectionMaximumItems", "number", this.nbMax, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestIntersectionMaximumDistance", "nautical miles", this.milesDistance, instrId);
                this.loadState++;
                break;
            case 1:
                SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
                    this.intersections = [];
                    for (let i = 0; i < _Values.length; i++) {
                        const intersection = new NearestIntersection(instrId);
                        intersection.icao = _Values[i][0];
                        intersection.ident = _Values[i][1];
                        intersection.distance = _Values[i][2];
                        intersection.bearing = _Values[i][3];
                        this.intersections.push(intersection);
                    }
                    this.loadState++;
                }.bind(this), instrId);
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.needUpdate) {
            this.Update(this.nbMax, this.milesDistance);
        }
    }
}
NearestIntersectionList.readManager = new InstrumentDataReadManager();
class NearestNDB extends NearestWaypoint {
    get svgMapElement() {
        if (!this._svgMapElement) {
            this._svgMapElement = new SvgNearestNDBElement();
            this._svgMapElement.source = this;
        }
        return this._svgMapElement;
    }
    imageFileName() {
        let fName = "";
        if (this.ndbType === 1) {
            fName = "ICON_MAP_NDB_WAYPOINT.svg";
        } else {
            fName = "ICON_MAP_NDB_WAYPOINT.svg";
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }
}
class NearestNDBList {
    constructor(_instrument) {
        this.instrument = _instrument;
        this.ndbs = [];
        this.ndbLinesBatch = new SimVar.SimVarBatch("C:fs9gps:NearestNdbItemsNumber", "C:fs9gps:NearestNdbCurrentLine");
        this.ndbLinesBatch.add("C:fs9gps:NearestNdbCurrentICAO", "string", "string");
        this.ndbLinesBatch.add("C:fs9gps:NearestNdbCurrentIdent", "string", "string");
        this.ndbLinesBatch.add("C:fs9gps:NearestNdbCurrentDistance", "nautical miles", "number");
        this.ndbLinesBatch.add("C:fs9gps:NearestNdbCurrentTrueBearing", "degrees", "number");
        this.ndbLinesBatch.add("C:fs9gps:NearestNdbCurrentFrequency", "KHz", "number");
        this.ndbLinesBatch.add("C:fs9gps:NearestNdbCurrentType", "number", "number");
        this.ndbSelectedBatch = new SimVar.SimVarBatch("C:fs9gps:NearestNdbItemsNumber", "C:fs9gps:NearestNdbSelectedNdb");
        this.ndbSelectedBatch.add("C:fs9gps:NearestNdbSelectedNdbName", "string", "string");
    }
    Update(_nbMax = 9, _milesDistance = 200) {
        this.nbMax = _nbMax;
        this.milesDistance = _milesDistance;
        if (NearestNDBList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.needUpdate = false;
        } else {
            this.needUpdate = true;
        }
    }
    GetTable(_startIndex, _prefix) {
        let html = "";
        let index;
        for (let i = 0; i < 5; i++) {
            index = i + _startIndex;
            html += "<tr>";
            if (index > this.ndbs.length) {
                html += "<td></td><td></td><td></td><td></td><td></td>";
            } else {
                html += '<td class="SelectableElement" id="' + _prefix + "_" + i + '">' + this.ndbs[index].ident + '</td>';
                html += '<td><img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + this.ndbs[index].imageFileName() + '"/></td>';
                html += '<td>' + fastToFixed(this.ndbs[index].bearing, 0) + '<div class="Align unit">o<br />M</div></td>';
                html += '<td>' + fastToFixed(this.ndbs[index].distance, 1) + '<div class="Align unit">n<br />m</div></td>';
                html += '<td>' + fastToFixed(this.ndbs[index].frequencyMHz, 1) + '</td>';
            }
            html += "</tr>";
        }
        return html;
    }
    LoadData() {
        const instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                SimVar.SetSimVarValue("C:fs9gps:NearestNdbCurrentLatitude", "degree latitude", SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestNdbCurrentLongitude", "degree longitude", SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestNdbMaximumItems", "number", this.nbMax, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestNdbMaximumDistance", "nautical miles", this.milesDistance, instrId);
                SimVar.GetSimVarArrayValues(this.ndbLinesBatch, function (_Values) {
                    this.ndbs = [];
                    for (let i = 0; i < _Values.length; i++) {
                        if (i > this.ndbs.length - 1) {
                            this.ndbs.push(new NearestNDB(this.instrument));
                        }
                        this.ndbs[i].icao = _Values[i][0];
                        this.ndbs[i].ident = _Values[i][1];
                        this.ndbs[i].distance = _Values[i][2];
                        this.ndbs[i].bearing = _Values[i][3];
                        this.ndbs[i].frequencyMHz = _Values[i][4];
                        this.ndbs[i].ndbType = _Values[i][5];
                    }
                    while (this.ndbs.length > _Values.length) {
                        this.ndbs.pop();
                    }
                    this.loadState++;
                }.bind(this), instrId);
                SimVar.GetSimVarArrayValues(this.ndbSelectedBatch, function (_Values) {
                    for (let i = 0; i < _Values.length; i++) {
                        if (i > this.ndbs.length - 1) {
                            this.ndbs.push(new NearestVOR(this.instrument));
                        }
                        this.ndbs[i].name = Utils.Translate(_Values[i][0]);
                    }
                    this.loadState++;
                }.bind(this), instrId);
                this.loadState++;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.needUpdate) {
            this.Update(this.nbMax, this.milesDistance);
        }
    }
}
NearestNDBList.readManager = new InstrumentDataReadManager();
class NearestVOR extends NearestWaypoint {
    get svgMapElement() {
        if (!this._svgMapElement) {
            this._svgMapElement = new SvgNearestVORElement();
            this._svgMapElement.source = this;
        }
        return this._svgMapElement;
    }
    imageFileName() {
        let fName = "";
        switch (this.vorType) {
            case 1:
                fName = "ICON_MAP_VOR.svg";
            case 2:
                fName = "ICON_MAP_VOR_DME.svg";
            case 3:
                fName = "ICON_MAP_VOR_DME.svg";
            case 4:
                fName = "ICON_MAP_VOR_TACAN.svg";
            case 5:
                fName = "ICON_MAP_VOR_VORTAC.svg";
            case 6:
                fName = "ICON_MAP_VOR.svg";
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }
}
class NearestVORList {
    constructor(_instrument) {
        this.instrument = _instrument;
        this.vors = [];
        this.vorLinesBatch = new SimVar.SimVarBatch("C:fs9gps:NearestVorItemsNumber", "C:fs9gps:NearestVorCurrentLine");
        this.vorLinesBatch.add("C:fs9gps:NearestVorCurrentICAO", "string", "string");
        this.vorLinesBatch.add("C:fs9gps:NearestVorCurrentIdent", "string", "string");
        this.vorLinesBatch.add("C:fs9gps:NearestVorCurrentDistance", "nautical miles", "number");
        this.vorLinesBatch.add("C:fs9gps:NearestVorCurrentTrueBearing", "degrees", "number");
        this.vorLinesBatch.add("C:fs9gps:NearestVorCurrentFrequency", "Megahertz", "number");
        this.vorLinesBatch.add("C:fs9gps:NearestVorCurrentFrequency", "Frequency BCD16", "number");
        this.vorLinesBatch.add("C:fs9gps:NearestVorCurrentType", "number", "number");
        this.vorSelectedBatch = new SimVar.SimVarBatch("C:fs9gps:NearestVorItemsNumber", "C:fs9gps:NearestVorSelectedVor");
        this.vorSelectedBatch.add("C:fs9gps:NearestVorSelectedVorName", "string", "string");
    }
    Update(_nbMax = 9, _milesDistance = 200) {
        this.nbMax = _nbMax;
        this.milesDistance = _milesDistance;
        if (NearestVORList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.needUpdate = false;
        } else {
            this.needUpdate = true;
        }
    }
    GetTable(_startIndex, _prefix) {
        let html = "";
        let index;
        for (let i = 0; i < 5; i++) {
            index = i + _startIndex;
            html += "<tr>";
            if (index > this.vors.length) {
                html += "<td></td><td></td><td></td><td></td><td></td>";
            } else {
                html += '<td class="SelectableElement" id="' + _prefix + "_" + i + '">' + this.vors[index].ident + '</td>';
                html += '<td> <img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + this.vors[index].imageFileName() + '"></td>';
                html += '<td>' + fastToFixed(this.vors[index].bearing, 0) + '<div class="Align unit">o<br />M</div></td>';
                html += '<td>' + fastToFixed(this.vors[index].distance, 1) + '<div class="Align unit">n<br />m</div></td>';
                html += '<td class="SelectableElement" id="' + _prefix + '_Freq_' + i + '">' + fastToFixed(this.vors[index].frequencyMHz, 2) + '</td>';
            }
            html += "</tr>";
        }
        return html;
    }
    LoadData() {
        const instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                SimVar.SetSimVarValue("C:fs9gps:NearestVorCurrentLatitude", "degree latitude", SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestVorCurrentLongitude", "degree longitude", SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestVorMaximumItems", "number", this.nbMax, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestVorMaximumDistance", "nautical miles", this.milesDistance, instrId);
                SimVar.GetSimVarArrayValues(this.vorLinesBatch, function (_Values) {
                    for (let i = 0; i < _Values.length; i++) {
                        if (i > this.vors.length - 1) {
                            this.vors.push(new NearestVOR(this.instrument));
                        }
                        this.vors[i].icao = _Values[i][0];
                        this.vors[i].ident = _Values[i][1];
                        this.vors[i].distance = _Values[i][2];
                        this.vors[i].bearing = _Values[i][3];
                        this.vors[i].frequencyMHz = _Values[i][4];
                        this.vors[i].frequencyBCD16 = _Values[i][5];
                        this.vors[i].vorType = _Values[i][6];
                    }
                    while (this.vors.length > _Values.length) {
                        this.vors.pop();
                    }
                    this.loadState++;
                }.bind(this), instrId);
                SimVar.GetSimVarArrayValues(this.vorSelectedBatch, function (_Values) {
                    for (let i = 0; i < _Values.length; i++) {
                        if (i > this.vors.length - 1) {
                            this.vors.push(new NearestVOR(this.instrument));
                        }
                        this.vors[i].name = Utils.Translate(_Values[i][0]);
                    }
                    this.loadState++;
                }.bind(this), instrId);
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.needUpdate) {
            this.Update(this.nbMax, this.milesDistance);
        }
    }
}
NearestVORList.readManager = new InstrumentDataReadManager();
class NearestAirspace {
    constructor() {
        this.svgMapElement = new SvgAirspaceElement();
        this.svgMapElement.source = this;
    }
    GetStatus() {
        switch (this.type) {
            case 0:
                return "";
            case 1:
                return "Ahead < 2nm";
            case 2:
                return "Ahead " + (this.aheadTime / 60 < 10 ? "0" : "") + Math.round(this.aheadTime / 60) + ':' + (this.aheadTime % 60 < 10 ? "0" : "") + this.aheadTime % 60;
            case 3:
                return "Within 2nm of airspace " + (this.aheadTime / 60 < 10 ? "0" : "") + Math.round(this.aheadTime / 60) + ':' + (this.aheadTime % 60 < 10 ? "0" : "") + this.aheadTime % 60;
            case 4:
                return "Inside of airspace";
            default:
                return "";
        }
    }
}
NearestAirspace.I = 0;
class NearestAirspaceList {
    constructor(_instrument) {
        this.instrument = _instrument;
        this.airspaces = [];
        this.batch = new SimVar.SimVarBatch("C:fs9gps:NearestAirspaceItemsNumber", "C:fs9gps:NearestAirspaceCurrentLine");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentName", "string", "string");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentType", "number", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentStatus", "number", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentNearDistance", "nautical mile", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentAheadTime", "seconds", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentGeometry", "string", "string");
    }
    Update(_nbMax = 9, _milesDistance = 200) {
        this.nbMax = _nbMax;
        this.milesDistance = _milesDistance;
        if (NearestAirspaceList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.needUpdate = false;
        } else {
            this.needUpdate = true;
        }
    }
    LoadData() {
        const instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceCurrentLatitude", "degree latitude", SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceCurrentLongitude", "degree longitude", SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceCurrentAltitude", "meter", SimVar.GetSimVarValue("GPS POSITION ALT", "meter", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceTrueGroundTrack", "degree", SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceGroundSpeed", "meter per second", SimVar.GetSimVarValue("GPS GROUND SPEED", "meter per second", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceNearDistance", "nautical mile", 2, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceNearAltitude", "feet", 200, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceAheadTime", "minute", 10, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceMaximumItems", "number", this.nbMax, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceMaximumDistance", "nautical miles", this.milesDistance, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceQuery", "number", 0xEFC038, instrId);
                this.loadState++;
                break;
            case 1:
                SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
                    this.airspaces = [];
                    for (let i = 0; i < _Values.length && i < 100; i++) {
                        const airspace = new NearestAirspace();
                        airspace.name = Utils.Translate(_Values[i][0]);
                        airspace.ident = (airspace.name + "_" + i).replace(new RegExp(" ", "g"), "");
                        airspace.ident = airspace.ident.replace(new RegExp("/", "g"), "");
                        airspace.type = _Values[i][1];
                        airspace.status = _Values[i][2];
                        airspace.nearDistance = _Values[i][3];
                        airspace.aheadTime = _Values[i][4];
                        airspace.geometry = _Values[i][5];
                        this.airspaces.push(airspace);
                    }
                    this.loadState++;
                }.bind(this), instrId);
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.needUpdate) {
            this.Update(this.nbMax, this.milesDistance);
        }
    }
}
NearestAirspaceList.readManager = new InstrumentDataReadManager();
//# sourceMappingURL=NearestWaypoint.js.map