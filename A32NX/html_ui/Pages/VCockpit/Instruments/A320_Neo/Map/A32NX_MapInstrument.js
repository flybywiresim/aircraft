class SmartIterator {
    constructor() {
        this._minReturned = NaN;
        this._maxReturned = NaN;
    }
    getIteration(max) {
        if (isNaN(this._minReturned) || isNaN(this._maxReturned)) {
            this._minReturned = max;
            this._maxReturned = max;
            return max;
        }
        if (this._maxReturned < max) {
            this._maxReturned++;
            return this._maxReturned;
        }
        if (this._minReturned > 0) {
            this._minReturned--;
            return this._minReturned;
        }
        return NaN;
    }
}
class MapInstrument extends ISvgMapRootElement {
    constructor() {
        super();
        this.intersectionMaxRange = 15;
        this.vorMaxRange = 200;
        this.ndbMaxRange = 100;
        this.minimizedIntersectionMaxRange = 0;
        this.minimizedVorMaxRange = 0;
        this.minimizedNdbMaxRange = 0;
        this.smallAirportMaxRange = 35;
        this.medAirportMaxRange = 100;
        this.largeAirportMaxRange = Infinity;
        this.smallCityMaxRange = 100;
        this.medCityMaxRange = 200;
        this.largeCityMaxRange = 1500;
        this.npcAirplaneMaxRange = 60;
        this.showRoads = true;
        this.showAirspaces = true;
        this.showAirways = true;
        this.showFlightPlan = true;
        this.showIntersections = true;
        this.showVORs = true;
        this.showNDBs = true;
        this.showAirports = true;
        this.showObstacles = true;
        this.showCities = false;
        this.showTraffic = true;
        this.showConstraints = false;
        this._ranges = [0.5, 1, 2, 3, 5, 10, 15, 20, 35, 50, 100, 150, 200];
        this.rangeIndex = 4;
        this._declutterLevel = 0;
        this.rangeFactor = 1852;
        this.wpIdValue = "";
        this.wpDtkValue = "";
        this.wpDisValue = "";
        this.gsValue = "";
        this.rangeValue = "";
        this.bingMapConfigId = 0;
        this.showBingMap = true;
        this.constraints = [];
        this.airwayIterator = 0;
        this.airspaceIterator = 0;
        this.smartIterator = new SmartIterator();
        this.drawCounter = 0;
        this.selfManagedInstrument = false;
        this.bMouseDown = false;
        this.scrollDisp = { x: 0, y: 0 };
        this._supportMouseWheel = true;
        this.svgSmooth = 5;
        this.SVG_SMOOTH_DEFAULT = 5;
        this.SVG_SMOOTH_CURSOR = 2;
        this.SVG_SMOOTH_VFR = 3;
        this.bingId = "";
        this.eBingMode = EBingMode.PLANE;
        this.eBingRef = EBingReference.SEA;
        this.bVfrMapFollowPlane = false;
        this.bVfrMapPlanePositionReady = false;
        this.bShowAirplane = true;
        this.bShowAirplaneOnWeather = false;
        this.bShowOverlay = true;
        this.bRotateWithAirplane = false;
        this.bEnableCenterOnFplnWaypoint = false;
        this.bHideFlightPlanIfBushtrip = false;
        this.bIsFlightPlanVisible = false;
        this.maskElements = [];
        this.topOfCurveElements = [];
        this.backOnTracks = [];
        this.bIsInit = false;
        this.curWidth = 0;
        this.curHeight = 0;
        this.configPath = "./";
        this.quality = Quality.high;
        this.cursorX = 50;
        this.cursorY = 50;
        this.bIsCursorDisplayed = false;
        this.weatherRanges = [10, 20, 30, 40, 50, 60, 80, 100];
        this.weatherHideGPS = false;
        this.isBushTrip = false;
    }
    get flightPlanManager() {
        if (this.gps) {
            return this.gps.currFlightPlanManager;
        }
        return this._flightPlanManager;
    }
    setNPCAirplaneManagerTCASMode(mode) {
        this.npcAirplaneManager.useTCAS = mode;
    }
    ;
    getHideReachedWaypoints() {
        return this.flightPlanElement ? this.flightPlanElement.hideReachedWaypoints : false;
    }
    setHideReachedWaypoints(b) {
        if (this.flightPlanElement) {
            this.flightPlanElement.hideReachedWaypoints = b;
        }
    }
    get dummyObstacles() {
        if (!this._dummyObstacles) {
            let obstacleA = new SvgObstacleElement("high-voltage-pyl");
            obstacleA.lat = 47.349613;
            obstacleA.long = -122.123143;
            obstacleA.alt = 328;
            let obstacleB = new SvgObstacleElement("radio-tower");
            obstacleB.lat = 47.277525;
            obstacleB.long = -122.291616;
            obstacleB.alt = 426;
            let obstacleC = new SvgObstacleElement("radio-tower");
            obstacleC.lat = 47.263344;
            obstacleC.long = -122.348211;
            obstacleC.alt = 393;
            let obstacleD = new SvgObstacleElement("maybe-tree");
            obstacleD.lat = 47.426000;
            obstacleD.long = -122.436833;
            obstacleD.alt = 196;
            let obstacleE = new SvgObstacleElement("space-needle");
            obstacleE.lat = 47.620402;
            obstacleE.long = -122.349301;
            obstacleE.alt = 603;
            let obstacleF = new SvgObstacleElement("university-of-washington-tower");
            obstacleF.lat = 47.660527;
            obstacleF.long = -122.314670;
            obstacleF.alt = 325;
            this._dummyObstacles = [obstacleA, obstacleB, obstacleC, obstacleD, obstacleE, obstacleF];
        }
        return this._dummyObstacles;
    }
    get templateID() { return "MapInstrumentTemplate"; }
    connectedCallback() {
        this.lineCanvas = document.createElement("canvas");
        this.lineCanvas.id = "line-canvas";
        this.lineCanvas.style.position = "absolute";
        this.lineCanvas.style.top = "0px";
        this.lineCanvas.style.left = "0px";
        this.lineCanvas.style.width = "100%";
        this.lineCanvas.style.height = "100%";
        if (this.hasAttribute("bing-id")) {
            this.bingId = this.getAttribute("bing-id");
        }
        else {
            console.warn("No BingID specified !");
        }
        if (this.hasAttribute("config-path")) {
            this.configPath = this.getAttribute("config-path");
        }
        for (let i = 0; i < MapInstrument.observedAttributes.length; i++) {
            let attr = MapInstrument.observedAttributes[i];
            if (this.hasAttribute(attr)) {
                this.attributeChangedCallback(attr, null, this.getAttribute(attr));
            }
        }
        super.connectedCallback();
    }
    static get observedAttributes() {
        return [
            "bing-mode",
            "bing-ref",
            "show-bing-map",
            "show-airplane",
            "show-overlay",
            "show-roads",
            "show-airspaces",
            "show-airways",
            "show-flightplan",
            "hide-flightplan-if-bushtrip",
            "show-waypoints",
            "show-obstacles",
            "show-constraints",
            "show-vors",
            "show-intersections",
            "show-ndbs",
            "show-airports",
            "show-cities",
            "show-traffic",
        ];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        let lowercaseName = name.toLowerCase();
        if (lowercaseName == "bing-mode") {
            var attr = newValue.toLowerCase();
            if (attr === "vfr") {
                this.eBingMode = EBingMode.VFR;
            }
            else if (attr === "horizon") {
                this.eBingMode = EBingMode.HORIZON;
            }
            else {
                this.eBingMode = EBingMode.PLANE;
            }
            if (this.bingMap)
                this.bingMap.setMode(this.eBingMode);
        }
        else if (lowercaseName == "bing-ref") {
            var attr = newValue.toLowerCase();
            if (attr === "plane") {
                this.eBingRef = EBingReference.PLANE;
            }
            else {
                this.eBingRef = EBingReference.SEA;
            }
            if (this.bingMap)
                this.bingMap.setReference(this.eBingRef);
        }
        else if (lowercaseName === "show-bing-map") {
            if (newValue === "true") {
                this.showBingMap = true;
                if (this.bingMap) {
                    this.bingMap.setVisible(true);
                }
            }
            else {
                this.showBingMap = false;
                if (this.bingMap) {
                    this.bingMap.setVisible(false);
                }
            }
        }
        else if (lowercaseName === "show-airplane") {
            if (newValue === "false" || newValue == null)
                this.bShowAirplane = false;
            else
                this.bShowAirplane = true;
        }
        else if (lowercaseName === "show-overlay") {
            if (newValue === "false" || newValue == null)
                this.bShowOverlay = false;
            else
                this.bShowOverlay = true;
        }
        else if (lowercaseName === "show-roads") {
            this.showRoads = false;
            if (newValue === "true") {
                this.showRoads = true;
            }
        }
        else if (lowercaseName === "show-airspaces") {
            this.showAirspaces = false;
            if (newValue === "true") {
                this.showAirspaces = true;
            }
        }
        else if (lowercaseName === "show-airways") {
            this.showAirways = false;
            if (newValue === "true") {
                this.showAirways = true;
            }
        }
        else if (lowercaseName === "show-flightplan") {
            this.showFlightPlan = false;
            if (newValue === "true") {
                this.showFlightPlan = true;
                this.updateFlightPlanVisibility();
            }
        }
        else if (lowercaseName === "hide-flightplan-if-bushtrip") {
            this.bHideFlightPlanIfBushtrip = false;
            if (newValue === "true") {
                this.bHideFlightPlanIfBushtrip = true;
                this.bIsFlightPlanVisible = false;
                this.updateFlightPlanVisibility();
            }
        }
        else if (lowercaseName === "show-vors") {
            this.showVORs = false;
            if (newValue === "true") {
                this.showVORs = true;
            }
        }
        else if (lowercaseName === "show-intersections") {
            this.showIntersections = false;
            if (newValue === "true") {
                this.showIntersections = true;
            }
        }
        else if (lowercaseName === "show-ndbs") {
            this.showNDBs = false;
            if (newValue === "true") {
                this.showNDBs = true;
            }
        }
        else if (lowercaseName === "show-airports") {
            this.showAirports = false;
            if (newValue === "true") {
                this.showAirports = true;
            }
        }
        else if (lowercaseName === "show-obstacles") {
            this.showObstacles = false;
            if (newValue === "true") {
                this.showObstacles = true;
            }
        }
        else if (lowercaseName === "show-traffic") {
            this.showTraffic = false;
            if (newValue === "true") {
                this.showTraffic = true;
            }
        }
        else if (lowercaseName === "show-constraints") {
            this.showConstraints = false;
            if (newValue === "true") {
                this.showConstraints = true;
            }
        }
    }
    isInit() {
        return this.bIsInit;
    }
    init(arg) {
        if (arg !== undefined) {
            if (arg instanceof BaseInstrument) {
                this.instrument = arg;
                this.selfManagedInstrument = false;
                if (this.instrument instanceof NavSystem) {
                    this.gps = this.instrument;
                }
            }
            else {
                this.instrument = document.createElement("base-instrument");
                this.selfManagedInstrument = true;
                if (typeof (arg) === "string") {
                    this.instrument.setInstrumentIdentifier(arg);
                }
            }
        }
        else {
        }
        if (this.gps) {
            if (!this.gps.currFlightPlanManager) {
                this.gps.currFlightPlanManager = new FlightPlanManager(this.instrument);
                this.gps.currFlightPlanManager.registerListener();
            }
            this.gps.addEventListener("FlightStart", this.onFlightStart.bind(this));
        }
        else {
            if (!this._flightPlanManager) {
                this._flightPlanManager = new FlightPlanManager(this.instrument);
                this._flightPlanManager.registerListener();
            }
        }
        let bingMapId = this.bingId;
        if (this.gps && this.gps.urlConfig.index)
            bingMapId += "_GPS" + this.gps.urlConfig.index;
        this.bingMap = this.getElementsByTagName("bing-map")[0];
        this.bingMap.setMode(this.eBingMode);
        this.bingMap.setReference(this.eBingRef);
        this.bingMap.setBingId(bingMapId);
        this.bingMap.setVisible(this.showBingMap);
        this.bVfrMapPlanePositionReady = true;
        if (this.eBingMode === EBingMode.VFR || this.eBingMode === EBingMode.CURSOR) {
            this.bVfrMapPlanePositionReady = false;
        }
        SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", -1);
        if (this.eBingMode !== EBingMode.HORIZON) {
            this.navMap = new SvgMap(this, { svgElement: this.getElementsByTagName("svg")[0], configPath: this.configPath });
            this.navMap.lineCanvas = this.lineCanvas;
            var mapSVG = this.querySelector("#MapSVG");
            mapSVG.setAttribute("display", "visible");
            this.insertBefore(this.lineCanvas, mapSVG);
            this.wpt = this.querySelector("#WPT");
            this.dtkMap = this.querySelector("#DTKMap");
            this.disMap = this.querySelector("#DISMap");
            this.gsMap = this.querySelector("#GSMap");
            this.mapRangeElement = this.querySelector("#MapRange");
            this.mapOrientationElement = this.querySelector("#MapOrientation");
            if (!this.bShowOverlay) {
                this.mapRangeElement.classList.add("hide");
                this.mapOrientationElement.classList.add("hide");
            }
            this.mapNearestAirportListNoRunway = new NearestAirportList(this.instrument);
            this.mapNearestIntersectionList = new NearestIntersectionList(this.instrument);
            this.mapNearestNDBList = new NearestNDBList(this.instrument);
            this.mapNearestVorList = new NearestVORList(this.instrument);
            this.testAirspaceList = new NearestAirspaceList(this.instrument);
            this.roadNetwork = new SvgRoadNetworkElement();
            this.cityManager = new SvgCityManager(this.navMap);
            this.airwayIterator = 0;
            this.airspaceIterator = 0;
            this.smartIterator = new SmartIterator();
            this.roadsBuffer = [];
            this.drawCounter = 0;
            this.airportLoader = new AirportLoader(this.instrument);
            this.intersectionLoader = new IntersectionLoader(this.instrument);
            this.vorLoader = new VORLoader(this.instrument);
            this.ndbLoader = new NDBLoader(this.instrument);
            this.nearestAirspacesLoader = new NearestAirspacesLoader(this.instrument);
            this.nearestAirspacesLoader.onNewAirspaceAddedCallback = (airspace) => {
                if (airspace) {
                    this.roadsBuffer.push({
                        id: 0,
                        path: airspace.segments,
                        type: airspace.type + 100,
                        lod: 8
                    }, {
                        id: 0,
                        path: airspace.segments,
                        type: airspace.type + 100,
                        lod: 12
                    }, {
                        id: 0,
                        path: airspace.segments,
                        type: airspace.type + 100,
                        lod: 14
                    });
                }
            };
            this.npcAirplaneManager = new NPCAirplaneManager();
            this.airplaneIconElement = new SvgAirplaneElement();
            this.flightPlanElement = new SvgFlightPlanElement();
            this.flightPlanElement.source = this.flightPlanManager;
            this.flightPlanElement.flightPlanIndex = 0;
            this.tmpFlightPlanElement = new SvgFlightPlanElement();
            this.tmpFlightPlanElement.source = this.flightPlanManager;
            this.tmpFlightPlanElement.flightPlanIndex = 1;
            this.directToElement = new SvgBackOnTrackElement();
            Coherent.call("RESET_ROAD_ITERATOR");
            this.addEventListener("mousedown", this.OnMouseDown.bind(this));
            this.addEventListener("mousemove", this.OnMouseMove.bind(this));
            this.addEventListener("mouseup", this.OnMouseUp.bind(this));
            this.addEventListener("mouseleave", this.OnMouseUp.bind(this));
            this.addEventListener("mousewheel", this.OnMouseWheel.bind(this));
        }
        this.loadBingMapConfig();
        if (this.bingMap.isReady())
            this.onBingMapReady();
        else
            this.bingMap.addEventListener("BingMapReady", this.onBingMapReady.bind(this));
        this.cursorSvg = this.querySelector("#MapCursor");
        this.weatherSVG = this.querySelector("#WeatherSVG");
        window.document.addEventListener("OnVCockpitPanelAttributesChanged", this.updateVisibility.bind(this));
        this.bIsInit = true;
    }
    onFlightStart() {
        this.checkBushTripCase();
    }
    onBingMapReady() {
        this.checkBushTripCase();
    }
    checkBushTripCase() {
        if (this.eBingMode !== EBingMode.HORIZON) {
            Coherent.call("GET_IS_BUSHTRIP").then(v => {
                this.isBushTrip = v;
                if (this.isBushTrip)
                    console.log("Bushtrip Detected");
                if (this.flightPlanElement) {
                    this.flightPlanElement.highlightActiveLeg = !this.isBushTrip;
                    this.flightPlanElement.hideReachedWaypoints = !this.isBushTrip;
                }
                this.updateFlightPlanVisibility();
            });
        }
    }
    updateFlightPlanVisibility() {
        if (this.showFlightPlan) {
            if (this.bHideFlightPlanIfBushtrip) {
                if (this.isBushTrip) {
                    this.bIsFlightPlanVisible = false;
                }
                else {
                    this.bIsFlightPlanVisible = true;
                }
            }
            else {
                this.bIsFlightPlanVisible = true;
            }
        }
        else {
            this.bIsFlightPlanVisible = false;
        }
    }
    onBeforeMapRedraw() {
        if (this.eBingMode !== EBingMode.HORIZON) {
            this.drawCounter++;
            this.drawCounter %= 100;
            this.npcAirplaneManager.update();
            if (this.showRoads) {
                let t0 = performance.now();
                while (this.roadsBuffer.length > 0 && (performance.now() - t0 < 1)) {
                    let road = this.roadsBuffer.pop();
                    if (road) {
                        if (road.path.length > 100) {
                            let truncRoad = {
                                id: 0,
                                path: road.path.splice(90),
                                type: road.type,
                                lod: road.lod
                            };
                            this.roadsBuffer.push(truncRoad);
                        }
                        this.roadNetwork.addRoad(road.path, road.type, road.lod);
                    }
                }
                if (this.roadsBuffer.length < 100) {
                    Coherent.call("GET_ROADS_BAG_SIZE").then((size) => {
                        let iterator = this.smartIterator.getIteration(size - 1);
                        if (isFinite(iterator)) {
                            Coherent.call("GET_ROADS_BAG", iterator).then((roadBag) => {
                                this.roadsBuffer.push(...roadBag);
                            });
                        }
                    });
                }
            }
            this.flightPlanManager.updateWaypointIndex();
            if (this.drawCounter === 25) {
                this.updateFlightPlanVisibility();
                this.flightPlanManager.updateFlightPlan();
            }
            if (this.drawCounter === 75) {
                this.flightPlanManager.updateCurrentApproach();
                if (this.debugApproachFlightPlanElement) {
                    Coherent.call("GET_APPROACH_FLIGHTPLAN").then(data => {
                        this.debugApproachFlightPlanElement.source = data;
                    });
                }
            }
            if (!this.showConstraints && this.constraints && this.constraints.length > 0) {
                this.constraints = [];
            }
            if (this.drawCounter === 45 || (this.showConstraints && (!this.constraints || this.constraints.length === 0))) {
                if (this.showConstraints) {
                    let wpWithConstraints = this.flightPlanManager.getWaypointsWithAltitudeConstraints();
                    this.constraints = [];
                    for (let i = 0; i < wpWithConstraints.length; i++) {
                        let svgConstraint = new SvgConstraintElement(wpWithConstraints[i]);
                        this.constraints.push(svgConstraint);
                    }
                }
            }
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let planeLla;
            let needCenterOnPlane = false;
            if (lat && long && isFinite(lat) && isFinite(long)) {
                planeLla = new LatLongAlt(lat, long);
                let unsmoothedMove = this.navMap.setPlaneCoordinates(lat, long, 0.95);
                if (unsmoothedMove) {
                    console.warn("Plane appears to have been teleported. FlightPlan active Waypoint index recalculated.");
                    this.flightPlanManager.recomputeActiveWaypointIndex();
                }
                if (this.eBingMode === EBingMode.PLANE) {
                    needCenterOnPlane = true;
                    if (this.bEnableCenterOnFplnWaypoint) {
                        let airlinerMcduCurrentFplnWaypointIndex = SimVar.GetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number");
                        if (airlinerMcduCurrentFplnWaypointIndex >= 0) {
                            if (this.flightPlanManager) {
                                let airlinerMcduCurrentFplnWaypoint = this.flightPlanManager.getWaypoint(airlinerMcduCurrentFplnWaypointIndex, NaN, true);
                                if (airlinerMcduCurrentFplnWaypoint && airlinerMcduCurrentFplnWaypoint.infos.coordinates) {
                                    this.setNavMapCenter(airlinerMcduCurrentFplnWaypoint.infos.coordinates);
                                    needCenterOnPlane = false;
                                }
                            }
                        }
                    }
                }
                else if (!this.bVfrMapPlanePositionReady) {
                    needCenterOnPlane = true;
                    if (SimVar.GetSimVarValue("GROUND VELOCITY", "knots") > 10) {
                        setTimeout(() => {
                            this.bVfrMapPlanePositionReady = true;
                        }, 3000);
                    }
                }
                else if (this.eBingMode === EBingMode.VFR && this.bVfrMapFollowPlane) {
                    needCenterOnPlane = true;
                }
            }
            if (needCenterOnPlane)
                this.centerOnPlane();
            else
                this.scrollMap(this.scrollDisp.x, this.scrollDisp.y);
            this.scrollDisp.x = 0;
            this.scrollDisp.y = 0;
            if (this.bingMap) {
                if (this.isDisplayingWeather()) {
                    this.navMap.setRange(this.getWeatherRange());
                }
                else {
                    this.navMap.setRange(this.getDisplayRange());
                }
                var bingRadius = this.navMap.NMWidth * 0.5 * this.rangeFactor;
                if (!this.isDisplayingWeather())
                    this.updateBingMapSize();
                if (this.navMap.lastCenterCoordinates)
                    this.bingMap.setParams({ lla: this.navMap.lastCenterCoordinates, radius: bingRadius });
            }
            if (this.navMap.centerCoordinates) {
                let centerCoordinates = this.navMap.centerCoordinates;
                if (this.showAirports) {
                    this.airportLoader.searchLat = centerCoordinates.lat;
                    this.airportLoader.searchLong = centerCoordinates.long;
                    this.airportLoader.searchRange = this.navMap.NMWidth * 1.5;
                    this.airportLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.airportLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.airportLoader.update();
                }
                if (this.showIntersections) {
                    this.intersectionLoader.searchLat = centerCoordinates.lat;
                    this.intersectionLoader.searchLong = centerCoordinates.long;
                    this.intersectionLoader.searchRange = this.navMap.NMWidth * 1.5;
                    this.intersectionLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.intersectionLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.intersectionLoader.update();
                }
                if (this.showVORs) {
                    this.vorLoader.searchLat = centerCoordinates.lat;
                    this.vorLoader.searchLong = centerCoordinates.long;
                    this.vorLoader.searchRange = this.navMap.NMWidth * 1.5;
                    this.vorLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.vorLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.vorLoader.update();
                }
                if (this.showNDBs) {
                    this.ndbLoader.searchLat = centerCoordinates.lat;
                    this.ndbLoader.searchLong = centerCoordinates.long;
                    this.ndbLoader.searchRange = this.navMap.NMWidth * 1.5;
                    this.ndbLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.ndbLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.ndbLoader.update();
                }
                if (this.showCities) {
                    this.cityManager.update();
                }
                if (this.showAirspaces) {
                    if (this.drawCounter === 50) {
                        this.nearestAirspacesLoader.lla.lat = centerCoordinates.lat;
                        this.nearestAirspacesLoader.lla.long = centerCoordinates.long;
                        this.nearestAirspacesLoader.update();
                    }
                }
            }
            if (this.showAirways && (this.drawCounter % 50 === 40)) {
                if (this.getDeclutteredRange() < this.intersectionMaxRange) {
                    let intersection = this.intersectionLoader.waypoints[this.airwayIterator];
                    if (intersection instanceof NearestIntersection) {
                        if (intersection.routes.length > 0 && !intersection.airwaysDrawn) {
                            for (let i = 0; i < intersection.routes.length; i++) {
                                if (intersection.routes[i]) {
                                    let routeCoordinates = new LatLong(intersection.coordinates.lat, intersection.coordinates.long);
                                    let coordinatesPrev = intersection.routes[i].prevWaypoint.GetInfos().coordinates;
                                    if (coordinatesPrev) {
                                        let routePrevStart = new LatLong(coordinatesPrev.lat, coordinatesPrev.long);
                                        let coordinatesNext = intersection.routes[i].nextWaypoint.GetInfos().coordinates;
                                        if (coordinatesNext) {
                                            let routeNextStart = new LatLong(coordinatesNext.lat, coordinatesNext.long);
                                            this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 8);
                                            this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 12);
                                            this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 14);
                                            intersection.airwaysDrawn = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    this.airwayIterator++;
                    if (this.airwayIterator > this.intersectionLoader.waypoints.length) {
                        this.airwayIterator = 0;
                    }
                }
            }
            this.navMap.mapElements = [];
            if (!this.isDisplayingWeatherRadar() || !this.weatherHideGPS) {
                if (this.showRoads || this.showAirways || this.showAirspaces) {
                    this.navMap.mapElements.push(this.roadNetwork);
                }
                if (this.showTraffic) {
                    if (this.getDeclutteredRange() < this.npcAirplaneMaxRange) {
                        this.navMap.mapElements.push(...this.npcAirplaneManager.npcAirplanes);
                    }
                }
                if (this.bShowAirplane) {
                    this.navMap.mapElements.push(this.airplaneIconElement);
                }
                if (this.showObstacles && this.navMap.centerCoordinates) {
                    if (Math.abs(this.navMap.centerCoordinates.lat - 47.6) < 2) {
                        if (Math.abs(this.navMap.centerCoordinates.long + 122.3) < 2) {
                            this.navMap.mapElements.push(...this.dummyObstacles);
                        }
                    }
                }
                let margin = 0.05;
                if (this.showAirports) {
                    for (let i = 0; i < this.airportLoader.waypoints.length; i++) {
                        let airport = this.airportLoader.waypoints[i];
                        if (airport && airport.infos instanceof AirportInfo) {
                            if (this.navMap.isLatLongInFrame(airport.infos.coordinates, margin)) {
                                if (this.getDeclutteredRange() < this.smallAirportMaxRange) {
                                    this.navMap.mapElements.push(airport.getSvgElement(this.navMap.index));
                                }
                                else if (this.getDeclutteredRange() < this.medAirportMaxRange) {
                                    if (airport.infos.getClassSize() !== AirportSize.Small) {
                                        this.navMap.mapElements.push(airport.getSvgElement(this.navMap.index));
                                    }
                                }
                                else if (this.getDeclutteredRange() < this.largeAirportMaxRange) {
                                    if (airport.infos.getClassSize() === AirportSize.Large) {
                                        this.navMap.mapElements.push(airport.getSvgElement(this.navMap.index));
                                    }
                                }
                            }
                        }
                    }
                }
                if (this.showVORs && (this.getDeclutteredRange() < this.vorMaxRange || this.getDeclutteredRange() < this.minimizedVorMaxRange)) {
                    for (let i = 0; i < this.vorLoader.waypoints.length; i++) {
                        let vor = this.vorLoader.waypoints[i];
                        vor.getSvgElement(this.navMap.index).minimize = this.getDeclutteredRange() > this.vorMaxRange;
                        if (this.navMap.isLatLongInFrame(vor.infos.coordinates, margin)) {
                            this.navMap.mapElements.push(vor.getSvgElement(this.navMap.index));
                        }
                    }
                }
                if (this.showNDBs && (this.getDeclutteredRange() < this.ndbMaxRange || this.getDeclutteredRange() < this.minimizedNdbMaxRange)) {
                    for (let i = 0; i < this.ndbLoader.waypoints.length; i++) {
                        let ndb = this.ndbLoader.waypoints[i];
                        ndb.getSvgElement(this.navMap.index).minimize = this.getDeclutteredRange() > this.ndbMaxRange;
                        if (this.navMap.isLatLongInFrame(ndb.infos.coordinates, margin)) {
                            this.navMap.mapElements.push(ndb.getSvgElement(this.navMap.index));
                        }
                    }
                }
                if (this.showIntersections && (this.getDeclutteredRange() < this.intersectionMaxRange || this.getDeclutteredRange() < this.minimizedIntersectionMaxRange)) {
                    for (let i = 0; i < this.intersectionLoader.waypoints.length; i++) {
                        let intersection = this.intersectionLoader.waypoints[i];
                        intersection.getSvgElement(this.navMap.index).minimize = this.getDeclutteredRange() > this.intersectionMaxRange;
                        if (this.navMap.isLatLongInFrame(intersection.infos.coordinates, margin)) {
                            this.navMap.mapElements.push(intersection.getSvgElement(this.navMap.index));
                        }
                    }
                }
                if (this.showCities) {
                    for (let i = 0; i < this.cityManager.displayedCities.length; i++) {
                        let city = this.cityManager.displayedCities[i];
                        if (this.getDeclutteredRange() < this.smallCityMaxRange) {
                            this.navMap.mapElements.push(city);
                        }
                        else if (this.getDeclutteredRange() < this.medCityMaxRange) {
                            if (city.size !== CitySize.Small) {
                                this.navMap.mapElements.push(city);
                            }
                        }
                        else if (this.getDeclutteredRange() < this.largeCityMaxRange) {
                            if (city.size === CitySize.Large) {
                                this.navMap.mapElements.push(city);
                            }
                        }
                    }
                }
                if (this.showConstraints) {
                    for (let i = 0; i < this.constraints.length; i++) {
                        this.navMap.mapElements.push(this.constraints[i]);
                    }
                }
                if (this.flightPlanManager && this.bIsFlightPlanVisible) {
                    let l = this.flightPlanManager.getWaypointsCount();
                    if (l > 1) {
                        if (SimVar.GetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number") === 1) {
                            this.navMap.mapElements.push(this.tmpFlightPlanElement);
                            let lTmpFlightPlan = this.flightPlanManager.getWaypointsCount(1);
                            if (lTmpFlightPlan > 1) {
                                for (let i = 0; i < lTmpFlightPlan; i++) {
                                    let waypoint = this.flightPlanManager.getWaypoint(i, 1);
                                    if (waypoint && waypoint.ident !== "" && waypoint.ident !== "USER") {
                                        if (waypoint.getSvgElement(this.navMap.index)) {
                                            if (!this.navMap.mapElements.find(w => {
                                                return (w instanceof SvgWaypointElement) && w.source.ident === waypoint.ident;
                                            })) {
                                                this.navMap.mapElements.push(waypoint.getSvgElement(this.navMap.index));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        this.navMap.mapElements.push(this.flightPlanElement);
                        for (let i = 0; i < l; i++) {
                            let waypoint = this.flightPlanManager.getWaypoint(i);
                            if (waypoint && waypoint.ident !== "" && waypoint.ident !== "USER") {
                                if (waypoint.getSvgElement(this.navMap.index)) {
                                    if (!this.navMap.mapElements.find(w => {
                                        return (w instanceof SvgWaypointElement) && w.source.ident === waypoint.ident;
                                    })) {
                                        this.navMap.mapElements.push(waypoint.getSvgElement(this.navMap.index));
                                    }
                                }
                            }
                        }
                    }
                    let approachWaypoints = this.flightPlanManager.getApproachWaypoints();
                    let lAppr = approachWaypoints.length;
                    for (let i = 0; i < lAppr; i++) {
                        let apprWaypoint = approachWaypoints[i];
                        if (apprWaypoint && apprWaypoint.ident !== "" && apprWaypoint.ident !== "USER") {
                            if (apprWaypoint.getSvgElement(this.navMap.index)) {
                                if (!this.navMap.mapElements.find(w => {
                                    return (w instanceof SvgWaypointElement) && w.source.ident === apprWaypoint.ident;
                                })) {
                                    this.navMap.mapElements.push(apprWaypoint.getSvgElement(this.navMap.index));
                                }
                            }
                        }
                    }
                    if (this.flightPlanManager.getIsDirectTo()) {
                        this.directToElement.llaRequested = this.flightPlanManager.getDirecToOrigin();
                        this.directToElement.targetWaypoint = this.flightPlanManager.getDirectToTarget();
                        this.directToElement.planeHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
                        this.navMap.mapElements.push(this.directToElement);
                    }
                    if (this.tmpDirectToElement) {
                        this.navMap.mapElements.push(this.tmpDirectToElement);
                    }
                    this.navMap.mapElements.push(...this.backOnTracks);
                    if ((SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") === 1) && this.flightPlanManager.decelWaypoint) {
                        this.navMap.mapElements.push(this.flightPlanManager.decelWaypoint.getSvgElement(this.navMap.index));
                    }
                    if (this.debugApproachFlightPlanElement) {
                        this.navMap.mapElements.push(this.debugApproachFlightPlanElement);
                    }
                }
                this.navMap.mapElements.push(...this.maskElements);
                this.navMap.mapElements.push(...this.topOfCurveElements);
                this.navMap.mapElements = this.navMap.mapElements.sort((a, b) => { return b.sortIndex - a.sortIndex; });
                if (this.bingMap) {
                    let transform = "";
                    if (this.bRotateWithAirplane && !this.isDisplayingWeatherRadar()) {
                        var compass = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
                        var roundedCompass = fastToFixed(compass, 3);
                        transform = "rotate(" + -roundedCompass + "deg)";
                    }
                    this.bingMap.style.transform = transform;
                }
            }
            else {
                if (this.bShowAirplaneOnWeather) {
                    this.navMap.mapElements.push(this.airplaneIconElement);
                }
                if (this.bingMap) {
                    let transform = "";
                    if (this.bingMap.getWeather() == EWeatherRadar.VERTICAL)
                        transform = "scale(0.75)";
                    this.bingMap.style.transform = transform;
                }
            }
        }
    }
    loadBingMapConfig() {
        if (this.eBingMode !== EBingMode.HORIZON) {
            let setConfig = () => {
                if (this.navMap.configLoaded) {
                    for (let i = 0; i < 3; i++) {
                        let bingConfig = new BingMapsConfig();
                        if (bingConfig.load(this.navMap.config, i))
                            this.bingMap.addConfig(bingConfig);
                    }
                    this.bingMap.setConfig(this.bingMapConfigId);
                }
                else {
                    setTimeout(setConfig, 1000);
                }
            };
            setConfig();
        }
        else {
            var svgConfig = null;
            var svgConfigLoaded = false;
            let loadSVGConfig = () => {
                if (typeof (SvgMapConfig) !== "undefined") {
                    svgConfig = new SvgMapConfig();
                    svgConfig.load(this.configPath, () => {
                        svgConfigLoaded = true;
                    });
                }
                else {
                    setTimeout(loadSVGConfig, 200);
                }
            };
            loadSVGConfig();
            let setBingConfig = () => {
                if (svgConfigLoaded && (!this.gps || this.gps.isComputingAspectRatio())) {
                    for (let i = 0; i < 3; i++) {
                        let bingConfig = new BingMapsConfig();
                        if (bingConfig.load(svgConfig, i)) {
                            bingConfig.aspectRatio = (this.gps && this.gps.isAspectRatioForced()) ? this.gps.getForcedScreenRatio() : 1.0;
                            this.bingMap.addConfig(bingConfig);
                        }
                    }
                    this.bingMap.setConfig(this.bingMapConfigId);
                }
                else {
                    setTimeout(setBingConfig, 1000);
                }
            };
            setBingConfig();
        }
    }
    update() {
        this.updateVisibility();
        this.updateSize(true);
        if (this.selfManagedInstrument) {
            this.instrument.doUpdate();
        }
        if (this.wpt) {
            var wpId = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
            if (this.wpIdValue != wpId) {
                this.wpt.textContent = wpId;
                this.wpIdValue = wpId;
            }
        }
        if (this.dtkMap) {
            var wpDtk = fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"), 0);
            if (this.wpDtkValue != wpDtk) {
                this.dtkMap.textContent = wpDtk;
                this.wpDtkValue = wpDtk;
            }
        }
        if (this.disMap) {
            var wpDis = fastToFixed(SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical mile"), 1);
            if (this.wpDisValue != wpDis) {
                this.disMap.textContent = wpDis;
                this.wpDisValue = wpDis;
            }
        }
        if (this.gsMap) {
            var gs = fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0);
            if (this.gsValue != gs) {
                this.gsMap.textContent = gs;
                this.gsValue = gs;
            }
        }
        if (this.mapRangeElement) {
            var range = '<div class="Align">' + this.getDisplayRange() + '</div><div class="Align unit">n<br/>m</div>';
            if (this.rangeValue != range) {
                this.mapRangeElement.innerHTML = range;
                this.rangeValue = range;
            }
        }
        if (this.navMap) {
            this.navMap.update();
        }
        if (this.navMap && this.navMap.centerCoordinates) {
            this.updateInputs();
        }
        if (this.bIsCursorDisplayed && this.eBingMode != EBingMode.CURSOR) {
            this.hideCursor();
        }
    }
    updateVisibility() {
        if (!this.instrument)
            return;
        var wantedQuality = this.instrument.getQuality();
        if (wantedQuality != this.quality) {
            this.quality = wantedQuality;
            this.refreshDisplay();
        }
    }
    refreshDisplay() {
        if (this.isDisplayingWeatherRadar() && this.weatherHideGPS) {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "block";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "none";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(false);
            return;
        }
        if (this.quality == Quality.ultra || this.quality == Quality.high) {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "block";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "block";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(true);
            this.bingMap.setVisible(this.showBingMap);
        }
        else if (this.quality == Quality.medium) {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "block";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "none";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(false);
            this.bingMap.setVisible(this.showBingMap);
        }
        else {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "none";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "none";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(false);
            if (this.quality == Quality.low || this.quality == Quality.hidden)
                this.bingMap.setVisible(this.showBingMap);
            else
                this.bingMap.setVisible(false);
        }
    }
    updateInputs() {
        if (this.eBingMode === EBingMode.VFR) {
            var scrollUp = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_UP");
            var scrollDown = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_DOWN");
            var scrollLeft = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_LEFT");
            var scrollRight = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_RIGHT");
            var scrollX = 0;
            var scrollY = 0;
            var scrollFactor = 10;
            if (scrollUp == EInputStatus.down) {
                scrollY = scrollFactor;
            }
            else if (scrollDown == EInputStatus.down) {
                scrollY = -scrollFactor;
            }
            if (scrollLeft == EInputStatus.down) {
                scrollX = scrollFactor;
            }
            else if (scrollRight == EInputStatus.down) {
                scrollX = -scrollFactor;
            }
            if (scrollX != 0 || scrollY != 0) {
                this.scrollDisp.x += scrollX;
                this.scrollDisp.y += scrollY;
                this.svgSmooth = this.SVG_SMOOTH_VFR;
                this.bVfrMapPlanePositionReady = true;
                this.bVfrMapFollowPlane = false;
            }
        }
        var zoomIn = GetInputStatus("PLANE", "KEY_VFRMAP_ZOOM_IN");
        var zoomOut = GetInputStatus("PLANE", "KEY_VFRMAP_ZOOM_OUT");
        if (zoomIn == EInputStatus.pressed) {
            this.zoomIn();
        }
        else if (zoomOut == EInputStatus.pressed) {
            this.zoomOut();
        }
    }
    resize() {
        this.updateSize(true);
    }
    updateSize(_bForce = false) {
        if (_bForce || this.curWidth <= 0 || this.curHeight <= 0) {
            this.curWidth = this.clientWidth;
            this.curHeight = this.clientHeight;
        }
    }
    getWidth() {
        return this.curWidth;
    }
    getHeight() {
        return this.curHeight;
    }
    onEvent(_event) {
        if (_event === "RANGE_DEC" || _event === "RNG_Zoom") {
            this.zoomIn();
        }
        if (_event === "RANGE_INC" || _event === "RNG_Dezoom") {
            this.zoomOut();
        }
        if (_event === "JOYSTICK_PUSH") {
            if (this.eBingMode === EBingMode.PLANE || this.eBingMode === EBingMode.VFR) {
                this.activateCursor();
            }
            else if (this.eBingMode === EBingMode.CURSOR) {
                this.deactivateCursor();
            }
        }
        if (_event === "ActivateMapCursor") {
            if (this.eBingMode === EBingMode.PLANE || this.eBingMode === EBingMode.VFR) {
                this.activateCursor();
            }
        }
        if (_event === "DeactivateMapCursor") {
            if (this.eBingMode === EBingMode.CURSOR) {
                this.deactivateCursor();
            }
        }
        if (this.eBingMode === EBingMode.CURSOR) {
            let cursorSpeed = 2;
            let mapSpeed = 4;
            switch (_event) {
                case "PanLeft":
                case "JOYSTICK_LEFT":
                    if (this.cursorX > 10) {
                        this.setCursorPos(this.cursorX - cursorSpeed, this.cursorY);
                    }
                    else {
                        this.scrollDisp.x += mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
                case "PanRight":
                case "JOYSTICK_RIGHT":
                    if (this.cursorX < 90) {
                        this.setCursorPos(this.cursorX + cursorSpeed, this.cursorY);
                    }
                    else {
                        this.scrollDisp.x -= mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
                case "PanUp":
                case "JOYSTICK_UP":
                    if (this.cursorY > 10) {
                        this.setCursorPos(this.cursorX, this.cursorY - cursorSpeed);
                    }
                    else {
                        this.scrollDisp.y += mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
                case "PanDown":
                case "JOYSTICK_DOWN":
                    if (this.cursorY < 90) {
                        this.setCursorPos(this.cursorX, this.cursorY + cursorSpeed);
                    }
                    else {
                        this.scrollDisp.y -= mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
            }
        }
    }
    onBackOnTrack(_lat, _long) {
        let bot;
        let previousBot = this.backOnTracks[this.backOnTracks.length - 1];
        if (previousBot) {
            let dLat = Math.abs(previousBot.llaRequested.lat - _lat);
            let dLon = Math.abs(previousBot.llaRequested.long - _long);
            if (dLat < 0.5 / 60 && dLon < 0.5 / 60) {
                bot = previousBot;
            }
            else {
                bot = new SvgBackOnTrackElement();
            }
        }
        else {
            bot = new SvgBackOnTrackElement();
        }
        bot.llaRequested = new LatLongAlt(_lat, _long);
        bot.targetWaypoint = this.flightPlanManager.getActiveWaypoint();
        this.setCenter(bot.llaRequested);
        this.setAttribute("show-airplane", "true");
        if (bot.targetWaypoint) {
            if (this.backOnTracks.indexOf(bot) === -1) {
                this.backOnTracks.push(bot);
            }
            while (this.backOnTracks.length > 15) {
                this.backOnTracks.splice(0, 1);
            }
            return true;
        }
        return false;
    }
    centerOnPlane() {
        this.setNavMapCenter(this.navMap.planeCoordinates);
        if (this.eBingMode == EBingMode.PLANE) {
            this.airplaneIconElement.forceCoordinates(this.navMap.centerCoordinates.lat, this.navMap.centerCoordinates.long);
        }
    }
    centerOnActiveWaypoint(_val) {
        this.bEnableCenterOnFplnWaypoint = _val;
    }
    rotateWithPlane(_val) {
        this.bRotateWithAirplane = _val;
        if (this.navMap)
            this.navMap.rotateWithPlane = _val;
    }
    setPlaneScale(_scale) {
        if (this.airplaneIconElement) {
            this.airplaneIconElement.setScale(this.navMap, _scale);
        }
    }
    setPlaneIcon(_id) {
        if (this.airplaneIconElement) {
            this.airplaneIconElement.setIcon(this.navMap, _id);
        }
    }
    set zoomRanges(_values) {
        this._ranges = _values;
    }
    get declutterLevel() {
        return this._declutterLevel;
    }
    set declutterLevel(_val) {
        this._declutterLevel = _val;
    }
    getDisplayRange() {
        return this._ranges[this.rangeIndex];
    }
    getDeclutteredRange() {
        return this._ranges[this.rangeIndex + this._declutterLevel];
    }
    getWeatherRange() {
        return this.getDisplayRange();
        if (this.rangeIndex < this.weatherRanges.length)
            return this.weatherRanges[this.rangeIndex];
        return this.weatherRanges[this.weatherRanges.length - 1];
    }
    updateBingMapSize() {
        let w = this.curWidth;
        let h = this.curHeight;
        let max = Math.max(w, h);
        if (w * h > 1 && w * h !== this.lastWH) {
            this.lastWH = w * h;
            this.bingMap.style.width = fastToFixed(max, 0) + "px";
            this.bingMap.style.height = fastToFixed(max, 0) + "px";
            this.bingMap.style.top = fastToFixed((h - max) / 2, 0) + "px";
            this.bingMap.style.left = fastToFixed((w - max) / 2, 0) + "px";
        }
    }
    setBingMapStyle(_top, _left, _width, _height) {
        if (this.bingMap) {
            this.bingMap.style.top = _top;
            this.bingMap.style.left = _left;
            this.bingMap.style.width = _width;
            this.bingMap.style.height = _height;
        }
    }
    get bingMapMode() {
        return this.eBingMode;
    }
    set bingMapRef(_ref) {
        if (this.eBingRef != _ref) {
            this.eBingRef = _ref;
            if (this.bingMap)
                this.bingMap.setReference(this.eBingRef);
        }
    }
    get bingMapRef() {
        return this.eBingRef;
    }
    set mapConfigId(_id) {
        if (this.bingMapConfigId != _id) {
            this.bingMapConfigId = _id;
            if (this.bingMap)
                this.bingMap.setConfig(_id);
        }
    }
    get mapConfigId() {
        return this.bingMapConfigId;
    }
    showIsolines(_show) {
        this.bingMap.showIsolines(_show);
    }
    getIsolines() {
        return this.bingMap.getIsolines();
    }
    showWeather(_mode) {
        let cone = 0;
        if (_mode == EWeatherRadar.HORIZONTAL)
            cone = Math.PI / 2;
        else if (_mode == EWeatherRadar.VERTICAL)
            cone = Math.PI / 3.5;
        else if (_mode == EWeatherRadar.OFF) {
            if (this.weatherSVG)
                Utils.RemoveAllChildren(this.weatherSVG);
        }
        this.bingMap.showWeather(_mode, cone);
        this.bShowAirplaneOnWeather = false;
        this.weatherHideGPS = true;
        this.lastWH = 0;
        if (!this.isDisplayingWeatherRadar())
            this.updateBingMapSize();
        this.refreshDisplay();
    }
    showWeatherWithGPS(_mode, _cone) {
        if (_cone == 0) {
            if (_mode == EWeatherRadar.HORIZONTAL)
                _cone = Math.PI / 2;
            else if (_mode == EWeatherRadar.VERTICAL)
                _cone = Math.PI / 3.5;
        }
        this.bingMap.showWeather(_mode, _cone);
        this.weatherHideGPS = false;
        this.lastWH = 0;
        if (!this.isDisplayingWeatherRadar())
            this.updateBingMapSize();
        this.refreshDisplay();
    }
    getWeather() {
        return this.bingMap.getWeather();
    }
    isDisplayingWeather() {
        if (this.bingMap && (this.bingMap.getWeather() != undefined && this.bingMap.getWeather() != EWeatherRadar.OFF))
            return true;
        return false;
    }
    isDisplayingWeatherRadar() {
        if (this.bingMap && (this.bingMap.getWeather() == EWeatherRadar.HORIZONTAL || this.bingMap.getWeather() == EWeatherRadar.VERTICAL))
            return true;
        return false;
    }
    setFlightPlanAsDashed(_val) {
        if (this.flightPlanElement)
            this.flightPlanElement.setAsDashed(_val);
    }
    activateCursor() {
        if (EBingMode.VFR) {
            this.bWasCenteredOnPlane = true;
        }
        else {
            this.bWasCenteredOnPlane = false;
            this.lastCenter = this.navMap.centerCoordinates;
        }
        this.eBingMode = EBingMode.CURSOR;
        this.setCursorPos(50, 50);
    }
    deactivateCursor() {
        if (this.bWasCenteredOnPlane) {
            this.eBingMode = EBingMode.PLANE;
            this.centerOnPlane();
        }
        else {
            this.eBingMode = EBingMode.VFR;
            this.setCenter(this.lastCenter);
        }
        this.hideCursor();
    }
    setCursorPos(x, y) {
        this.cursorSvg.setAttribute("style", "left:" + x + "%;top:" + y + "%;");
        this.cursorX = x;
        this.cursorY = y;
        this.bIsCursorDisplayed = true;
    }
    hideCursor() {
        this.cursorSvg.setAttribute("style", "display: none");
        this.bIsCursorDisplayed = false;
    }
    setCenter(_coordinates) {
        if (this.eBingMode != EBingMode.CURSOR) {
            this.eBingMode = EBingMode.VFR;
            this.setNavMapCenter(_coordinates);
        }
        else {
            this.bWasCenteredOnPlane = false;
            this.lastCenter = _coordinates;
        }
    }
    setCenteredOnPlane() {
        if (this.eBingMode != EBingMode.CURSOR) {
            this.eBingMode = EBingMode.PLANE;
        }
        else {
            this.bWasCenteredOnPlane = true;
        }
    }
    setNavMapCenter(_coordinates, _smoothness = 5) {
        if (_coordinates && isFinite(_coordinates.lat) && isFinite(_coordinates.long)) {
            this.navMap.setCenterCoordinates(_coordinates.lat, _coordinates.long, _smoothness);
            if (this.eBingMode == EBingMode.VFR) {
                var latLong = _coordinates.toStringFloat();
                Coherent.trigger("ON_VFRMAP_COORDINATES_CHANGED", latLong);
            }
        }
    }
    scrollMap(_dispX, _dispY) {
        if (this.navMap.lastCenterCoordinates) {
            var scaleFactor = parseInt(window.getComputedStyle(this).height) / 1000;
            let long = -_dispX * this.navMap.angularWidth / (1000 * scaleFactor);
            let lat = _dispY * this.navMap.angularHeight / (1000 * scaleFactor);
            let newCoordinates = new LatLongAlt(this.navMap.lastCenterCoordinates);
            newCoordinates.long += long;
            newCoordinates.lat += lat;
            if (newCoordinates.long > 180) {
                newCoordinates.long -= 360;
            }
            else if (newCoordinates.long < -180) {
                newCoordinates.long += 360;
            }
            if (newCoordinates.lat > 90) {
                newCoordinates.lat -= 180;
            }
            else if (newCoordinates.lat < -90) {
                newCoordinates.lat += 180;
            }
            this.setNavMapCenter(newCoordinates, this.svgSmooth);
        }
    }
    zoomIn() {
        this.rangeIndex--;
        this.rangeIndex = Math.max(0, this.rangeIndex);
    }
    zoomOut() {
        this.rangeIndex++;
        this.rangeIndex = Math.min(this._ranges.length - 1, this.rangeIndex);
    }
    setZoom(_index) {
        this.rangeIndex = _index;
        this.rangeIndex = Math.max(0, this.rangeIndex);
        this.rangeIndex = Math.min(this._ranges.length - 1, this.rangeIndex);
    }
    getZoom() {
        return this.rangeIndex;
    }
    OnMouseDown(_e) {
        this.bMouseDown = true;
        this.refMousePos = { x: _e.x, y: _e.y };
    }
    OnMouseMove(_e) {
        if (this.bMouseDown && this.eBingMode === EBingMode.VFR) {
            this.scrollDisp.x += _e.x - this.refMousePos.x;
            this.scrollDisp.y += _e.y - this.refMousePos.y;
            this.refMousePos.x = _e.x;
            this.refMousePos.y = _e.y;
            this.svgSmooth = this.SVG_SMOOTH_VFR;
            this.bVfrMapPlanePositionReady = true;
            this.bVfrMapFollowPlane = false;
        }
    }
    OnMouseUp(_e) {
        this.bMouseDown = false;
    }
    OnMouseWheel(_e) {
        if (this._supportMouseWheel) {
            if (_e.deltaY < 0) {
                this.zoomIn();
            }
            else if (_e.deltaY > 0) {
                this.zoomOut();
            }
        }
    }
    supportMouseWheel(_val) {
        this._supportMouseWheel = _val;
    }
}
customElements.define("map-instrument", MapInstrument);
checkAutoload();
//# sourceMappingURL=MapInstrument.js.map