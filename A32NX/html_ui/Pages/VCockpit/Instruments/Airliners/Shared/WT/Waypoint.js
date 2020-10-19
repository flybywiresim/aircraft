class Airway {
    constructor() {
        this.icaos = [];
    }
    SetFromIAirwayData(data) {
        this.name = data.name;
        this.type = data.type;
        this.icaos = data.icaos;
    }
}
class WayPoint {
    constructor(_instrument) {
        this.ident = '';
        this.icao = '';
        this.altitudeinFP = 0;
        this.bearingInFP = 0;
        this.distanceInFP = 0;
        this.estimatedTimeOfArrivalFP = 0;
        this.estimatedTimeEnRouteFP = 0;
        this.cumulativeEstimatedTimeEnRouteFP = 0;
        this.cumulativeDistanceInFP = 0;
        this.isInFlightPlan = false;
        this.isActiveInFlightPlan = false;
        this.legAltitudeDescription = 0;
        this.legAltitude1 = 0;
        this.legAltitude2 = 0;
        this.speedConstraint = -1;
        this.instrument = _instrument;
        this.infos = new WayPointInfo(_instrument);
        this.transitionLLas = [];
    }
    getSvgElement(index) {
        if (this.infos) {
            return this.infos.getSvgElement(index);
        }
    }
    SetTypeFromEnum(_enum) {
        switch (_enum) {
            case 1:
                this.type = 'A';
                break;
            case 2:
                this.type = 'I';
                break;
            case 3:
                this.type = 'V';
                break;
            case 4:
                this.type = 'N';
                break;
            case 5:
                this.type = 'U';
                break;
            case 6:
                this.type = 'ATC';
                break;
        }
    }
    UpdateInfos(_CallBack = null, loadFacilitiesTransitively = true) {
        this.instrument.facilityLoader.getFacilityDataCB(this.icao, (data) => {
            this.SetFromIFacility(data, () => {}, loadFacilitiesTransitively);
            if (_CallBack) {
                _CallBack();
            }
        });
    }
    UpdateApproaches() {
        if (this.type == 'A') {
            this.infos.UpdateInfos(null, true);
        }
    }
    GetInfos() {
        switch (this.type) {
            case 'A':
                return this.infos;
            case 'N':
                return this.infos;
            case 'V':
                return this.infos;
            case 'I':
            case 'W':
                return this.infos;
            default:
                return this.infos;
        }
    }
    SetICAO(_ICAO, _endLoadCallback = null, _LoadApproaches = true) {
        if (this.icao != _ICAO || this.infos.icao != _ICAO) {
            this.icao = _ICAO;
            this.infos.icao = _ICAO;
            this.UpdateInfos(_endLoadCallback, _LoadApproaches);
        }
    }
    SetIdent(_Ident) {
        if (_Ident != "") {
            this.ident = _Ident;
            this.infos.ident = _Ident;
        }
    }
    SetFromIFacility(data, callback = EmptyCallback.Void, loadFacilitiesTransitively = false) {
        this.icao = data.icao;
        if (!this.icao) {
            console.warn("FacilityData without ICAO was used to Set a Waypoint, expect the unexpected.");
            console.log(data);
            return;
        }
        this.ident = this.icao.substring(7, 12).replace(new RegExp(" ", "g"), "");
        this.type = this.icao[0];
        if (this.type === "A") {
            this.infos = new AirportInfo(this.instrument);
            this.infos.SetFromIFacilityAirport(data, loadFacilitiesTransitively);
            return callback();
        }
        else if (this.type === "W") {
            this.infos = new IntersectionInfo(this.instrument);
            this.infos.SetFromIFacilityIntersection(data, callback, loadFacilitiesTransitively);
        }
        else if (this.type === "V") {
            this.infos = new VORInfo(this.instrument);
            this.infos.SetFromIFacilityVOR(data, callback, loadFacilitiesTransitively);
        }
        else if (this.type === "N") {
            this.infos = new NDBInfo(this.instrument);
            this.infos.SetFromIFacilityNDB(data, callback, loadFacilitiesTransitively);
        }
    }
    imageFileName() {
        let fileName = "ICON_MAP_INTERSECTION";
        if (this.isInFlightPlan) {
            fileName += "_FLIGHTPLAN";
        }
        if (this.isActiveInFlightPlan) {
            fileName += "_ACTIVE";
        }
        if (BaseInstrument.useSvgImages) {
            return fileName + ".svg";
        }
        return fileName + ".png";
    }
}
class WayPointInfo {
    constructor(_instrument) {
        this.icao = '';
        this.ident = '';
        this.region = '';
        this.name = '';
        this.city = '';
        this.routes = [];
        this.timeInFP = 0;
        this.totalTimeInFP = 0;
        this.etaInFP = 0;
        this.totalDistInFP = 0;
        this.fuelConsInFP = 0;
        this.totalFuelConsInFP = 0;
        this.airwayIdentInFP = "";
        this.coordinates = new LatLongAlt();
        this.loaded = false;
        this.airways = [];
        this.airwayIn = undefined;
        this.airwayOut = undefined;
        this._svgElements = [];
        this.instrument = _instrument;
        this.loaded = true;
    }
    get lat() { return this.coordinates.lat; }
    ;
    set lat(l) { this.coordinates.lat = l; }
    ;
    get long() { return this.coordinates.long; }
    ;
    set long(l) { this.coordinates.long = l; }
    ;
    id() {
        return "waypoint-" + this.icao;
    }
    getSvgElement(index) {
        if (!this._svgElements[index]) {
            this._svgElements[index] = new SvgNearestIntersectionElement(this);
        }
        return this._svgElements[index];
    }
    CopyBaseInfosFrom(_WP) {
        this.icao = _WP.icao;
        this.ident = _WP.ident;
    }
    UpdateInfos(_CallBack = null) {
        this.loaded = false;
        this.instrument.facilityLoader.getFacilityDataCB(this.icao, (data) => {
            this.SetFromIFacilityWaypoint(data);
            this.loaded = true;
            if (_CallBack) {
                _CallBack();
            }
        });
    }
    GetSymbol() {
        return "";
    }
    imageFileName() {
        return "";
    }
    getWaypointType() {
        return "";
    }
    setEndCallbackIfUnset(_Callback) {
        if (!this.endLoadCallback) {
            this.endLoadCallback = _Callback;
        }
    }
    SetFromIFacilityWaypoint(data) {
        this.icao = data.icao;
        this.ident = this.icao.substring(7, 12).replace(new RegExp(" ", "g"), "");
        this.name = Utils.Translate(data.name);
        this.region = Utils.Translate(data.region);
        let separatedCity = data.city.split(", ");
        this.city = separatedCity.length > 1 ? Utils.Translate(separatedCity[0]) + ", " + Utils.Translate(separatedCity[1]) : Utils.Translate(data.city);
        this.lat = data.lat;
        this.long = data.lon;
    }
    async UpdateAirway(name) {
        if (this.airways.findIndex(airway => airway.name === name) === -1) {
            let airways = await this.instrument.facilityLoader.getAllAirways(this, name);
            if (airways.length === 1) {
                this.airways.push(airways[0]);
            }
        }
    }    
    async UpdateAirways() {
        this.airways = await this.instrument.facilityLoader.getAllAirways(this);
    }
}
class AirportInfo extends WayPointInfo {
    constructor(_instrument) {
        super(_instrument);
        this.frequencies = [];
        this.namedFrequencies = [];
        this.departures = [];
        this.approaches = [];
        this.arrivals = [];
        this.runways = [];
        this.oneWayRunways = [];
        this.airportClass = 0;
        this.privateType = 0;
        this.radarCoverage = 0;
        this.needReload = false;
        this.fuel = "";
        this.bestApproach = "";
        this.airspaceType = "";
    }
    getWaypointType() {
        return "A";
    }
    getSvgElement(index) {
        if (!this._svgElements[index]) {
            this._svgElements[index] = new SvgNearestAirportElement(this);
        }
        return this._svgElements[index];
    }
    UpdateInfos(_CallBack = null, _LoadApproaches = true) {
        this.loaded = false;
        this.instrument.facilityLoader.getAirportDataCB(this.icao, (data) => {
            this.SetFromIFacilityAirport(data, _LoadApproaches);
            this.loaded = true;
            if (_CallBack) {
                _CallBack();
            }
        });
    }
    GetSymbolFileName() {
        var logo = "";
        if (this.airportClass == 2 || this.airportClass == 3) {
            logo = "GPS/Airport_Soft.bmp";
        }
        else if (this.airportClass == 1) {
            switch (Math.round((this.longestRunwayDirection % 180) / 45.0)) {
                case 0:
                case 4:
                    logo = "GPS/Airport_Hard_NS.bmp";
                    break;
                case 1:
                    logo = "GPS/Airport_Hard_NE_SW.bmp";
                    break;
                case 2:
                    logo = "GPS/Airport_Hard_EW.bmp";
                    break;
                case 3:
                    logo = "GPS/Airport_Hard_NW_SE.bmp";
                    break;
            }
        }
        else if (this.airportClass == 4) {
            logo = "GPS/Helipad.bmp";
        }
        else if (this.airportClass == 5) {
            logo = "GPS/Private_Airfield.bmp";
        }
        return logo;
    }
    imageFileName() {
        var fName = "";
        if (this.airportClass === 0) {
            fName = "ICON_MAP_AIRPORT_UNKNOWN_PINK.svg";
        }
        else if (this.airportClass === 1) {
            if (this.towered) {
                if (this.fuel !== "") {
                    fName = "ICON_MAP_AIRPORT_TOWERED_SERVICED_BLUE.svg";
                }
                else {
                    fName = "ICON_MAP_AIRPORT_TOWERED_NON_SERVICED_BLUE.svg";
                }
            }
            else {
                if (this.fuel !== "") {
                    fName = "ICON_MAP_AIRPORT_NON_TOWERED_SERVICED_PINK.svg";
                }
                else {
                    fName = "ICON_MAP_AIRPORT_NON_TOWERED_NON_SERVICED_PINK.svg";
                }
            }
        }
        else if (this.airportClass === 2) {
            if (this.fuel !== "") {
                fName = "ICON_MAP_AIRPORT7.svg";
            }
            else {
                fName = "ICON_MAP_AIRPORT8.svg";
            }
        }
        else if (this.airportClass === 3) {
            if (this.towered) {
                fName = "ICON_MAP_AIRPORT_TOWERED_SEAPLANE_CIV_BLUE.svg";
            }
            else {
                fName = "ICON_MAP_AIRPORT_NON_TOWERED_SEAPLANE_CIV_PINK.svg";
            }
        }
        else if (this.airportClass === 4) {
            fName = "ICON_MAP_AIRPORT_HELIPORT_PINK.svg";
        }
        else if (this.airportClass === 5) {
            fName = "ICON_MAP_AIRPORT_PRIVATE_PINK.svg";
        }
        if (fName === "") {
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }
    GetSize() {
        var minX = 0;
        var minY = 0;
        var maxX = 0;
        var maxY = 0;
        var latCos = Math.cos((this.lat / 180) * Math.PI);
        for (var i = 0; i < this.runways.length; i++) {
            var centerY = (this.lat - this.runways[i].latitude) * 60;
            var centerX = (this.runways[i].longitude - this.long) * latCos * 60;
            var forwardY = -this.runways[i].cosDirection;
            var forwardX = this.runways[i].sinDirection;
            var beginX = centerX - (forwardX * ((this.runways[i].length / 2) * 0.000164579));
            var beginY = centerY - (forwardY * ((this.runways[i].length / 2) * 0.000164579));
            var endX = centerX + (forwardX * ((this.runways[i].length / 2) * 0.000164579));
            var endY = centerY + (forwardY * ((this.runways[i].length / 2) * 0.000164579));
            if (beginX < minX) {
                minX = beginX;
            }
            if (endX < minX) {
                minX = endX;
            }
            if (beginX > maxX) {
                maxX = beginX;
            }
            if (endX > maxX) {
                maxX = endX;
            }
            if (beginY < minY) {
                minY = beginY;
            }
            if (endY < minY) {
                minY = endY;
            }
            if (beginY > maxY) {
                maxY = beginY;
            }
            if (endY > maxY) {
                maxY = endY;
            }
        }
        return new Vec2(2 * Math.max(-minX, maxX) + 0.1, 2 * Math.max(-minY, maxY) + 0.1);
    }
    getClassSize() {
        if (!this.runways || !this.runways[0]) {
            return AirportSize.Small;
        }
        if (this.runways[0].length < 5000 / 3.28) {
            return AirportSize.Small;
        }
        if (this.runways[0].length > 8100 / 3.28) {
            return AirportSize.Large;
        }
        if (this.towered) {
            return AirportSize.Large;
        }
        return AirportSize.Medium;
    }
    IsUpToDate() {
        return this.loaded;
    }
    SetFromIFacilityAirport(data, loadApproachesData = true) {
        super.SetFromIFacilityWaypoint(data);
        this.privateType = data.airportPrivateType;
        this.fuel = data.fuel1 + " " + data.fuel2;
        this.bestApproach = data.bestApproach;
        this.radarCoverage = data.radarCoverage;
        this.airspaceType = data.airspaceType + "";
        this.airportClass = data.airportClass;
        this.towered = data.towered;
        this.name = Utils.Translate(data.name);
        let separatedCity = data.city.split(", ");
        this.city = separatedCity.length > 1 ? Utils.Translate(separatedCity[0]) + ", " + Utils.Translate(separatedCity[1]) : Utils.Translate(data.city);
        this.region = Utils.Translate(data.region);
        this.frequencies = [];
        if (data.frequencies) {
            for (let i = 0; i < data.frequencies.length; i++) {
                this.frequencies.push(new Frequency(data.frequencies[i].name, data.frequencies[i].freqMHz, data.frequencies[i].freqBCD16));
            }
        }
        this.runways = [];
        if (data.runways) {
            for (let i = 0; i < data.runways.length; i++) {
                let runway = new Runway();
                runway.latitude = data.runways[i].latitude;
                runway.longitude = data.runways[i].longitude;
                runway.elevation = data.runways[i].elevation;
                runway.designation = data.runways[i].designation;
                runway.length = data.runways[i].length;
                runway.width = data.runways[i].width;
                runway.surface = data.runways[i].surface;
                runway.lighting = data.runways[i].lighting;
                runway.direction = data.runways[i].direction;
                runway.designatorCharPrimary = data.runways[i].designatorCharPrimary;
                runway.designatorCharSecondary = data.runways[i].designatorCharSecondary;
                this.runways.push(runway);
                this.oneWayRunways.push(...runway.splitIfTwoWays());
            }
        }
        if (this.oneWayRunways) {
            this.oneWayRunways = this.oneWayRunways.sort((r1, r2) => {
                if (parseInt(r1.designation) === parseInt(r2.designation)) {
                    let v1 = 0;
                    if (r1.designation.indexOf("L") != -1) {
                        v1 = 1;
                    }
                    else if (r1.designation.indexOf("C") != -1) {
                        v1 = 2;
                    }
                    else if (r1.designation.indexOf("R") != -1) {
                        v1 = 3;
                    }
                    let v2 = 0;
                    if (r2.designation.indexOf("L") != -1) {
                        v2 = 1;
                    }
                    else if (r2.designation.indexOf("C") != -1) {
                        v2 = 2;
                    }
                    else if (r2.designation.indexOf("R") != -1) {
                        v2 = 3;
                    }
                    return v1 - v2;
                }
                return parseInt(r1.designation) - parseInt(r2.designation);
            });
        }
        this.approaches = [];
        if (data.approaches) {
            for (let i = 0; i < data.approaches.length; i++) {
                let approachData = data.approaches[i];
                let approach = new Approach();
                approach.name = approachData.name;
                approach.runway = approachData.runway;

                approach.transitions = [];
                for (let i = 0; i < approachData.transitions.length; i++) {
                    let transition = new Transition();
                    transition.name = approachData.transitions[i].legs[0].fixIcao.substr(7, 5);
                    transition.waypoints = [];
                    for (let j = 0; j < approachData.transitions[i].legs.length; j++) {
                        let wp = new WayPoint(this.instrument);
                        wp.icao = approachData.transitions[i].legs[j].fixIcao;
                        wp.ident = wp.icao.substr(7, 5);                        
                        wp.bearingInFP = approachData.transitions[i].legs[j].course;
                        wp.distanceInFP = approachData.transitions[i].legs[j].distance;
                        transition.waypoints.push(wp);
                        if (loadApproachesData) {
                            this.instrument.facilityLoader.getFacility(approachData.transitions[i].legs[j].fixIcao).then(function (_legs, _index, _waypoint) {
                                if (_waypoint) {
                                    _legs[_index] = _waypoint;
                                    _waypoint.bearingInFP = wp.bearingInFP;
                                    _waypoint.distanceInFP = wp.distanceInFP;
                                }
                            }.bind(this, transition.waypoints, j));
                        }
                    }
                    approach.transitions.push(transition);
                }
                approach.wayPoints = [];
                for (let i = 0; i < approachData.finalLegs.length; i++) {
                    let waypoint = new ApproachWayPoint(this.instrument);
                    waypoint.icao = approachData.finalLegs[i].fixIcao;
                    waypoint.ident = waypoint.icao.substr(7, 5);
                    waypoint.bearingInFP = approachData.finalLegs[i].course;
                    waypoint.distanceInFP = approachData.finalLegs[i].distance / 1852;
                    approach.wayPoints.push(waypoint);
                    if (loadApproachesData) {
                        this.instrument.facilityLoader.getFacilityDataCB(waypoint.icao, (data) => {
                            if (data) {
                                waypoint.SetFromIFacility(data, () => { }, loadApproachesData);
                            }
                        });
                    }
                }
                this.approaches.push(approach);
            }
        }
        this.departures = data.departures;
        for (let i = 0; i < this.departures.length; i++) {
            for (let j = 0; j < this.departures[i].runwayTransitions.length; j++) {
                this.departures[i].runwayTransitions[j].name = "RW" + this.departures[i].runwayTransitions[j].runwayNumber.toString();
                switch (this.departures[i].runwayTransitions[j].runwayDesignation) {
                    case 1:
                        this.departures[i].runwayTransitions[j].name += "L";
                        break;
                    case 2:
                        this.departures[i].runwayTransitions[j].name += "R";
                        break;
                    case 3:
                        this.departures[i].runwayTransitions[j].name += "C";
                        break;
                }
            }
            for (let j = 0; j < this.departures[i].enRouteTransitions.length; j++) {
                let legsCount = this.departures[i].enRouteTransitions[j].legs.length;
                this.departures[i].enRouteTransitions[j].name = this.departures[i].enRouteTransitions[j].legs[legsCount - 1].fixIcao.substr(7, 5);
            }
        }
        this.arrivals = data.arrivals;
        for (let i = 0; i < this.arrivals.length; i++) {
            for (let j = 0; j < this.arrivals[i].runwayTransitions.length; j++) {
                this.arrivals[i].runwayTransitions[j].name = "RW" + this.arrivals[i].runwayTransitions[j].runwayNumber.toString();
                switch (this.arrivals[i].runwayTransitions[j].runwayDesignation) {
                    case 1:
                        this.arrivals[i].runwayTransitions[j].name += "L";
                        break;
                    case 2:
                        this.arrivals[i].runwayTransitions[j].name += "R";
                        break;
                    case 3:
                        this.arrivals[i].runwayTransitions[j].name += "C";
                        break;
                }
            }
            for (let j = 0; j < this.arrivals[i].enRouteTransitions.length; j++) {
                this.arrivals[i].enRouteTransitions[j].name = this.arrivals[i].enRouteTransitions[j].legs[0].fixIcao.substr(7, 5);
            }
        }
    }
    async UpdateNamedFrequencies() {
        if (this.namedFrequencies.length === 0) {
            this.namedFrequencies = await this.instrument.facilityLoader.GetAirportNamedFrequencies(this.icao);
        }
    } 
}
class VORInfo extends WayPointInfo {
    constructor(_instrument) {
        super(_instrument);
    }
    getWaypointType() {
        return "V";
    }
    getSvgElement(index) {
        if (!this._svgElements[index]) {
            this._svgElements[index] = new SvgNearestVORElement(this);
        }
        return this._svgElements[index];
    }
    IsUpToDate() {
        return this.loaded;
    }
    GetSymbol() {
        var image = "";
        switch (this.type) {
            case 1:
                image = "GPS/Vor.bmp";
                break;
            case 2:
                image = "GPS/Vor_DME.bmp";
                break;
            case 3:
                image = "GPS/DME.bmp";
                break;
            case 4:
                image = "GPS/Tacan.bmp";
                break;
            case 5:
                image = "GPS/Vor_Tac.bmp";
                break;
            case 6:
                image = "GPS/Localizer.bmp";
                break;
        }
        return image;
    }
    imageFileName() {
        let fName = "";
        switch (this.type) {
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
    UpdateInfos(_CallBack = null, loadFacilitiesTransitively = true) {
        this.loaded = false;
        this.instrument.facilityLoader.getVorDataCB(this.icao, (data) => {
            this.SetFromIFacilityVOR(data, () => {
                this.loaded = true;
                if (_CallBack) {
                    _CallBack();
                }
            }, loadFacilitiesTransitively);
        });
    }
    getClassName() {
        switch (this.vorClass) {
            case 1:
                return "Terminal";
            case 2:
                return "Low_Alt";
            case 3:
                return "High_Alt";
            case 4:
                return "ILS";
            case 5:
                return "VOT";
            case 0:
            default:
                return "Unknown";
        }
    }
    SetFromIFacilityVOR(data, callback = EmptyCallback.Void, loadAirways = true) {
        super.SetFromIFacilityWaypoint(data);
        this.frequencyMHz = data.freqMHz;
        this.frequencyBcd16 = data.freqBCD16;
        this.weatherBroadcast = data.weatherBroadcast;
        this.magneticVariation = data.magneticVariation;
        this.type = data.type;
        this.vorClass = data.vorClass;
        this.instrument.facilityLoader.getVorWaypointDataCB(this.icao, (data) => {
            if (!data) {
                return callback();
            }
            this.routes = data.routes;
            if (loadAirways) {
                this.instrument.facilityLoader.getAllAirways(this).then(airways => {
                    this.airways = airways;
                    return callback();
                });
            }
            else {
                return callback();
            }
        });
    }
}
VORInfo.readManager = new InstrumentDataReadManager();
class NDBInfo extends WayPointInfo {
    constructor(_instrument) {
        super(_instrument);
    }
    getSvgElement(index) {
        if (!this._svgElements[index]) {
            this._svgElements[index] = new SvgNearestNDBElement(this);
        }
        return this._svgElements[index];
    }
    getWaypointType() {
        return "N";
    }
    GetSymbol() {
        return (this.type == 1 ? "GPS/Marker.bmp" : "GPS/Ndb.bmp");
    }
    imageFileName() {
        let fName = "";
        if (this.type === 1) {
            fName = "ICON_MAP_NDB_WAYPOINT.svg";
        }
        else {
            fName = "ICON_MAP_NDB_WAYPOINT.svg";
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }
    IsUpToDate() {
        return this.loaded;
    }
    UpdateInfos(_CallBack = null, loadFacilitiesTransitively = true) {
        this.loaded = false;
        this.instrument.facilityLoader.getNdbDataCB(this.icao, (data) => {
            this.SetFromIFacilityNDB(data, () => {
                this.loaded = true;
                if (_CallBack) {
                    _CallBack();
                }
            }, loadFacilitiesTransitively);
        });
    }
    getTypeString() {
        switch (this.type) {
            case 1:
                return "Compass Point";
            case 2:
                return "MH";
            case 3:
                return "H";
            case 4:
                return "HH";
            default:
                return "Unknown";
        }
    }
    SetFromIFacilityNDB(data, callback = EmptyCallback.Void, loadAirways = true) {
        super.SetFromIFacilityWaypoint(data);
        this.type = data.type;
        this.weatherBroadcast = data.weatherBroadcast;
        this.frequencyMHz = data.freqMHz;
        this.instrument.facilityLoader.getNdbWaypointDataCB(this.icao, (data) => {
            if (!data) {
                return callback();
            }
            this.routes = data.routes;
            if (loadAirways) {
                this.instrument.facilityLoader.getAllAirways(this).then(airways => {
                    this.airways = airways;
                    return callback();
                });
            }
            else {
               return callback(); 
            }
        });
    }
}
NDBInfo.readManager = new InstrumentDataReadManager();
class IntersectionInfo extends WayPointInfo {
    constructor(_instrument) {
        super(_instrument);
    }
    getWaypointType() {
        return "W";
    }
    IsUpToDate() {
        return this.loaded;
    }
    GetSymbol() {
        return "GPS/Intersection.bmp";
    }
    imageFileName() {
        if (BaseInstrument.useSvgImages) {
            return "ICON_MAP_INTERSECTION.svg";
        }
        return "ICON_MAP_INTERSECTION.png";
    }
    vorImageFileNameSync() {
        let fName = "";
        switch (this.nearestVORType) {
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
    UpdateInfos(_CallBack = null, loadFacilitiesTransitively = true) {
        this.loaded = false;
        this.instrument.facilityLoader.getIntersectionDataCB(this.icao, (data) => {
            this.SetFromIFacilityIntersection(data, () => {
                this.loaded = true;
                if (_CallBack) {
                    _CallBack();
                }
            }, loadFacilitiesTransitively);
        });
    }
    GetRouteToIdent(ident) {
        ident = ident.trim();
        for (let i = 0; i < this.routes.length; i++) {
            let route = this.routes[i];
            if (route.nextIcao.indexOf(ident) !== -1) {
                return route;
            }
            else if (route.prevIcao.indexOf(ident) !== -1) {
                return route;
            }
        }
    }
    GetIcaoViaRouteByIdent(ident) {
        ident = ident.trim();
        for (let i = 0; i < this.routes.length; i++) {
            let route = this.routes[i];
            if (route.nextIcao.indexOf(ident) !== -1) {
                return route.nextIcao;
            }
            else if (route.prevIcao.indexOf(ident) !== -1) {
                return route.prevIcao;
            }
        }
    }
    GetRouteToIcao(icao) {
        icao = icao.trim();
        for (let i = 0; i < this.routes.length; i++) {
            let route = this.routes[i];
            if (route.nextIcao.trim() === icao) {
                return route;
            }
            else if (route.prevIcao.trim() === icao) {
                return route;
            }
        }
    }
    GetNextIcaoVia(routeName) {
        for (let i = 0; i < this.routes.length; i++) {
            let route = this.routes[i];
            if (route.name.indexOf(routeName) !== -1) {
                return route.nextIcao;
            }
        }
    }
    async GetNextWayPointVia(routeName) {
        let nextIcao = this.GetNextIcaoVia(routeName);
        if (nextIcao) {
            return this.instrument.facilityLoader.getFacility(nextIcao);
        }
    }
    SetFromIFacilityIntersection(data, callback = EmptyCallback.Void, loadAirways = true) {
        super.SetFromIFacilityWaypoint(data);
        this.routes = data.routes;
        this.nearestVORType = data.nearestVorType;
        this.nearestVORICAO = data.nearestVorICAO;
        this.nearestVORFrequencyBCD16 = data.nearestVorFrequencyBCD16;
        this.nearestVORFrequencyMHz = data.nearestVorFrequencyMHz;
        this.nearestVORIdent = data.nearestVorICAO ? data.nearestVorICAO.substring(7, 12).replace(new RegExp(" ", "g"), "") : "";
        this.nearestVORTrueRadial = data.nearestVorTrueRadial;
        this.nearestVORMagneticRadial = data.nearestVorMagneticRadial;
        this.nearestVORDistance = data.nearestVorDistance;
        if (loadAirways) {
            this.instrument.facilityLoader.getAllAirways(this).then(airways => {
                this.airways = airways;
                return callback();
            });
        }
        else {
            return callback();
        }
    }
    async UpdateAirways() {
        this.airways = await this.instrument.facilityLoader.getAllAirways(this);
    }
    static GetCommonAirway(wp1, wp2) {
        if (wp1 && wp2) {
            if (wp1.infos instanceof IntersectionInfo) {
                if (wp1.infos.airways && wp1.infos.airways.length > 0) {
                    for (let i = 0; i < wp1.infos.airways.length; i++) {
                        let wp1Airway = wp1.infos.airways[i];
                        let wp2Index = wp1Airway.icaos.indexOf(wp2.icao);
                        if (wp2Index !== -1) {
                            return wp1Airway;
                        }
                    }
                }
            }
            if (wp2.infos instanceof IntersectionInfo) {
                if (wp2.infos.airways && wp2.infos.airways.length > 0) {
                    for (let i = 0; i < wp2.infos.airways.length; i++) {
                        let wp2Airway = wp2.infos.airways[i];
                        let wp1Index = wp2Airway.icaos.indexOf(wp1.icao);
                        if (wp1Index !== -1) {
                            return wp2Airway;
                        }
                    }
                }
            }
        }
    }
}
IntersectionInfo.readManager = new InstrumentDataReadManager();
IntersectionInfo.longestAirway = 0;
class Frequency {
    constructor(_name, _mhValue, _bcd16Value) {
        this.name = _name;
        this.mhValue = _mhValue;
        this.bcd16Value = _bcd16Value;
    }
}
//# sourceMappingURL=Waypoint.js.map