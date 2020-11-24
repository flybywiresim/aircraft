class AS1000_MFD extends BaseAS1000 {
    constructor() {
        super();
        this.altimeterIndex = 0;
        this.initDuration = 5500;
        this.needValidationAfterInit = true;
    }
    get templateID() {
        return "AS1000_MFD";
    }
    connectedCallback() {
        super.connectedCallback();
        this.pagesContainer = this.getChildById("RightInfos");
        this.addIndependentElementContainer(new Engine("Engine", "LeftInfos"));
        this.pageGroups = [
            new NavSystemPageGroup("MAP", this, [
                new AS1000_MFD_MainMap()
            ]),
            new NavSystemPageGroup("WPT", this, [
                new AS1000_MFD_AirportInfos()
            ]),
            new NavSystemPageGroup("AUX", this, [
                new AS1000_MFD_SystemSetup(),
            ]),
            new NavSystemPageGroup("NRST", this, [
                new AS1000_MFD_NearestAirport(),
                new AS1000_MFD_NearestVOR(),
                new AS1000_MFD_NearestNDB(),
                new AS1000_MFD_NearestIntersection(),
            ])
        ];
        this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("FPL", this, [
            new AS1000_MFD_ActiveFlightPlan()
        ]));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("Procedures", "ProceduresWindow", new MFD_Procedures(), "PROC_Push"));
        this.addIndependentElementContainer(new NavSystemElementContainer("Page Navigation", "CenterDisplay", new AS1000_MFD_PageNavigation()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Navigation status", "CenterDisplay", new AS1000_MFD_NavStatus()));
        this.addIndependentElementContainer(new NavSystemElementContainer("FloatingMap", "CenterDisplay", new MapInstrumentElement()));
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            const altimeterIndexElems = this.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }
    }
    disconnectedCallback() {
    }
    onEvent(_event) {
        super.onEvent(_event);
        const isGPSDrived = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
        const cdiSource = isGPSDrived ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
        switch (_event) {
            case "CLR_Long":
                this.currentInteractionState = 0;
                this.closePopUpElement();
                this.SwitchToPageName("MAP", "NAVIGATION MAP");
                break;
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", this.altimeterIndex);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", this.altimeterIndex);
                break;
            case "CRS_INC":
                if (cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_INC", "number", 0);
                } else if (cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_INC", "number", 0);
                }
                break;
            case "CRS_DEC":
                if (cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_OBI_DEC", "number", 0);
                } else if (cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_OBI_DEC", "number", 0);
                }
                break;
            case "CRS_PUSH":
                if (cdiSource == 1) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360));
                } else if (cdiSource == 2) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360));
                }
                break;
            case "SOFTKEYS_12":
                this.acknowledgeInit();
                break;
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        SimVar.SetSimVarValue("L:Glasscockpit_MFD_Started", "number", this.isStarted ? 1 : 0);
    }
}
class AS1000_MFD_NavStatus extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lastEte = undefined;
        this.groundSpeedValue = "";
        this.desiredTrackValue = "";
        this.currentTrackValue = "";
    }
    init(root) {
        this.groundSpeed = this.gps.getChildById("GroundSpeed");
        this.desiredTrack = this.gps.getChildById("DesiredTrack");
        this.currentTrack = this.gps.getChildById("CurrentTrack");
        this.eteElement = this.gps.getChildById("ETE");
        this.isInitialized = true;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const groundSpeedValue = fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0) + "kt";
        if (this.groundSpeedValue != groundSpeedValue) {
            this.groundSpeed.textContent = groundSpeedValue;
            this.groundSpeedValue = groundSpeedValue;
        }
        const currentTrackValue = fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree"), 0) + "°";
        if (this.currentTrack.textContent != currentTrackValue) {
            this.currentTrack.textContent = currentTrackValue;
            this.currentTrackValue = currentTrackValue;
        }
        const flightPlanActive = SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean");
        if (flightPlanActive) {
            const desiredTrackValue = fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"), 0) + "°";
            if (this.desiredTrack.textContent != desiredTrackValue) {
                this.desiredTrack.textContent = desiredTrackValue;
                this.desiredTrackValue = desiredTrackValue;
            }
            const ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
            if (this.lastEte == undefined || this.lastEte != ete) {
                this.eteElement.textContent = Math.floor(ete / 60) + ":" + (ete % 60 < 10 ? "0" : "") + ete % 60;
                this.lastEte = ete;
            }
        } else {
            Avionics.Utils.diffAndSet(this.desiredTrack, "___°");
            Avionics.Utils.diffAndSet(this.eteElement, "__:__");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS1000_MFD_PageNavigation extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.displayNameValue = "";
        this.pageCellsValue = "";
        this.pagesHtmlValue = "";
        this.isVisible = false;
    }
    init(root) {
        this.pageSelectionElement = this.gps.getChildById("PageSelection");
        this.pagesElement = this.gps.getChildById("Pages");
        this.pageGroupElement = this.gps.getChildById("PageGroups");
        this.currentPageDisplay = this.gps.getChildById("CurrentPageDisplay");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const displayNameValue = this.gps.getCurrentPageGroup().name + " - " + this.gps.getCurrentPage().name;
        if (displayNameValue != this.displayNameValue) {
            this.currentPageDisplay.textContent = displayNameValue;
            this.displayNameValue = displayNameValue;
        }
        if (this.isVisible) {
            if (this.gps.currentInteractionState != 0) {
                this.isVisible = false;
            }
            if (this.gps.currentEventLinkedPageGroup != null) {
                const pageCells = '<td state="Selected" > ' + this.gps.currentEventLinkedPageGroup.pageGroup.name + '</td>';
                if (pageCells != this.pageCellsValue) {
                    this.pageGroupElement.innerHTML = pageCells;
                    this.pageCellsValue = pageCells;
                }
                var pageHtml = "";
                var pages = this.gps.currentEventLinkedPageGroup.pageGroup.pages;
                for (let i = 0; i < pages.length; i++) {
                    pageHtml += '<div state="' + (i == this.gps.currentEventLinkedPageGroup.pageGroup.pageIndex ? 'Selected' : 'Unselected') + '">' + pages[i].name + '</div>';
                }
                if (pageHtml != this.pagesHtmlValue) {
                    this.pagesElement.innerHTML = pageHtml;
                    this.pagesHtmlValue = pageHtml;
                }
            } else {
                let pageCells = "";
                for (let i = 0; i < this.gps.pageGroups.length; i++) {
                    pageCells += '<td state="' + (i == this.gps.currentPageGroupIndex ? "Selected" : "Unselected") + '">' + this.gps.pageGroups[i].name + '</td>';
                }
                if (pageCells != this.pageCellsValue) {
                    this.pageGroupElement.innerHTML = pageCells;
                    this.pageCellsValue = pageCells;
                }
                var pageHtml = "";
                var pages = this.gps.pageGroups[this.gps.currentPageGroupIndex].pages;
                for (let i = 0; i < pages.length; i++) {
                    pageHtml += '<div state="' + (i == this.gps.pageGroups[this.gps.currentPageGroupIndex].pageIndex ? 'Selected' : 'Unselected') + '">' + pages[i].name + '</div>';
                }
                if (pageHtml != this.pagesHtmlValue) {
                    this.pagesElement.innerHTML = pageHtml;
                    this.pagesHtmlValue = pageHtml;
                }
            }
            this.pageSelectionElement.setAttribute("state", "Active");
            if ((new Date()).getTime() - this.lastAction.getTime() > 5000) {
                this.isVisible = false;
            }
        } else {
            this.pageSelectionElement.setAttribute("state", "Inactive");
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "NavigationSmallInc":
            case "NavigationSmallDec":
            case "NavigationLargeInc":
            case "NavigationLargeDec":
            case "FPL_Push":
                if (this.gps.currentInteractionState == 0) {
                    this.isVisible = true;
                    this.lastAction = new Date();
                }
                break;
        }
    }
}
class AS1000_MFD_MainMap extends NavSystemPage {
    constructor() {
        super("NAVIGATION MAP", "Map", new NavSystemElementGroup([
            new AS1000_MFD_MainMapSlot(),
            new MFD_WindData()
        ]));
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("DCLTR", () => {
                const map = this.gps.getChildById("MapInstrument");
                if (map) {
                    map.declutterLevel++;
                    if (map.declutterLevel > 1) {
                        map.declutterLevel = 0;
                    }
                }
            }),
            new SoftKeyElement("SHW CHRT", null),
            new SoftKeyElement("", null)
        ];
    }
}
class AS1000_MFD_MainMapSlot extends NavSystemElement {
    init(root) {
        this.mapContainer = root;
        this.map = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        this.mapContainer.insertBefore(this.map, this.mapContainer.firstChild);
        this.map.setCenteredOnPlane();
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS1000_MFD_WaypointLine extends MFD_WaypointLine {
    constructor(waypoint, index, _waypointType, _element) {
        super(waypoint, index, _waypointType, _element);
        this.mapMenu = new AS1000_MapMenu();
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE"),
            new SoftKeyElement(""),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("NEW WPT"),
            new SoftKeyElement("VIEW"),
            new SoftKeyElement("V PROF"),
            new SoftKeyElement("CNCL V"),
            new SoftKeyElement("VNV D"),
            new SoftKeyElement("ATK OFST"),
            new SoftKeyElement("ACT LEG", this.element.activateLeg.bind(this.element, this.index)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
        ];
        this.mapMenu.init(this, this.element.gps);
    }
}
class AS1000_MFD_ApproachWaypointLine extends MFD_ApproachWaypointLine {
    constructor(waypoint, index, _element) {
        super(waypoint, index, _element);
        this.mapMenu = new AS1000_MapMenu();
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE"),
            new SoftKeyElement(""),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("ACT LEG", this.element.activateLeg.bind(this.element, this.index, true)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
        ];
        this.mapMenu.init(this, this.element.gps);
    }
}
class AS1000_MFD_ActiveFlightPlan extends NavSystemPage {
    constructor() {
        super("ACTIVE FLIGHT PLAN", "ActiveFlightPlan", new MFD_ActiveFlightPlan_Element(AS1000_MFD_WaypointLine, AS1000_MFD_ApproachWaypointLine));
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("VIEW", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("CNCL V", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
    getSoftKeyMenu() {
        const menu = this.element.getSoftKeysMenu();
        if (menu == null) {
            return this.softKeys;
        } else {
            return menu;
        }
    }
}
class AS1000_MFD_AirportInfos extends NavSystemPage {
    constructor(_default = 0) {
        super("AIRPORT INFORMATION", "AirportInfos", null);
        this.mapMenu = new AS1000_MapMenu();
        this.defaultIndex = 0;
        this.elementSelector = new NavSystemElementSelector();
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [], null, "A");
        this.elementSelector.addElement(new AS1000_MFD_AirportInfos1(this.icaoSearchField));
        this.elementSelector.addElement(new AS1000_MFD_AirportInfos2(this.icaoSearchField));
        this.element = this.elementSelector;
        this.defaultIndex = _default;
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeyInfo = new SoftKeyElement("INFO-1", this.info_callback.bind(this));
        this.icaoSearchField.setInstrument(this.gps);
        this.icaoSearchField.container = this.gps;
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("CHRT", null),
            this.softKeyInfo,
            new SoftKeyElement("DP", null),
            new SoftKeyElement("STAR", null),
            new SoftKeyElement("APR", null),
            new SoftKeyElement("WX", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
        this.switchPanel(this.defaultIndex);
    }
    info_callback() {
        const index = (this.elementSelector.index + 1) % 2;
        this.switchPanel(index);
    }
    switchPanel(_index) {
        this.elementSelector.switchToIndex(_index);
        this.softKeyInfo.name = "INFO-" + (_index + 1);
    }
}
class AS1000_MFD_AirportInfos1 extends NavSystemElement {
    constructor(_searchField) {
        super();
        this.selectedElement = 0;
        this.selectedRunway = 0;
        this.icaoSearchField = _searchField;
    }
    init(root) {
        this.rootElement = root;
        this.mapElement = this.gps.getChildById("MapInstrument");
        this.mapContainer = this.gps.getChildById("AirportInfos1_Map");
        this.identElement = this.gps.getChildById("AirportInfos1_Ident");
        this.symbolElement = this.gps.getChildById("AirportInfos1_Symbol");
        this.typeElement = this.gps.getChildById("AirportInfos1_Type");
        this.facilityNameElement = this.gps.getChildById("AirportInfos1_FacilityName");
        this.cityElement = this.gps.getChildById("AirportInfos1_City");
        this.regionElement = this.gps.getChildById("AirportInfos1_Region");
        this.elevationElement = this.gps.getChildById("AirportInfos1_Elevation");
        this.latitudeElement = this.gps.getChildById("AirportInfos1_Latitude");
        this.longitudeElement = this.gps.getChildById("AirportInfos1_Longitude");
        this.fuelAvailableElement = this.gps.getChildById("AirportInfos1_FuelAvailable");
        this.timeZoneElement = this.gps.getChildById("AirportInfos1_TimeZone");
        this.runwayNameElement = this.gps.getChildById("AirportInfos1_RunwayName");
        this.runwaySizeElement = this.gps.getChildById("AirportInfos1_RunwaySize");
        this.runwaySurfaceTypeElement = this.gps.getChildById("AirportInfos1_RunwaySurfaceType");
        this.runwayLightsElement = this.gps.getChildById("AirportInfos1_RunwayLights");
        const freqSlider = this.gps.getChildById("Slider");
        const freqSliderCursor = this.gps.getChildById("SliderCursor");
        const freqElements = [];
        for (let i = 1; i <= 7; i++) {
            freqElements.push(new SelectableElement(this.gps, this.gps.getChildById("AirportInfos1_Frequency" + i), this.frequencyCallback.bind(this)));
        }
        this.frequenciesSelectionGroup = new SelectableElementSliderGroup(this.gps, freqElements, freqSlider, freqSliderCursor);
        this.icaoSearchField.elements.push(this.identElement);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.activateSearchField.bind(this)),
            new SelectableElement(this.gps, this.runwayNameElement, this.runwaySelection.bind(this)),
            this.frequenciesSelectionGroup
        ];
        this.isInitialized = true;
    }
    onEnter() {
        this.rootElement.setAttribute("state", "Infos1");
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        const infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao != "") {
            this.symbolElement.textContent = "";
            switch (infos.privateType) {
                case 0:
                    this.typeElement.textContent = "Unknown";
                    break;
                case 1:
                    this.typeElement.textContent = "Public";
                    break;
                case 2:
                    this.typeElement.textContent = "Military";
                    break;
                case 3:
                    this.typeElement.textContent = "Private";
                    break;
            }
            this.facilityNameElement.textContent = infos.name;
            this.cityElement.textContent = infos.city;
            this.regionElement.textContent = infos.region;
            this.elevationElement.textContent = fastToFixed(infos.coordinates.alt, 0) + "FT";
            this.latitudeElement.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.longitudeElement.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            this.fuelAvailableElement.textContent = infos.fuel;
            this.timeZoneElement.textContent = "";
            if (this.gps.currentInteractionState == 3) {
                this.selectedRunway = 0;
            }
            this.runwayNameElement.textContent = infos.runways[this.selectedRunway].designation;
            this.runwaySizeElement.textContent = Math.round(infos.runways[this.selectedRunway].length * 3.28084) + "FT x " + Math.round(infos.runways[this.selectedRunway].width * 3.28084) + "FT";
            switch (infos.runways[this.selectedRunway].surface) {
                case 0:
                    this.runwaySurfaceTypeElement.textContent = "Unknown";
                    break;
                case 1:
                    this.runwaySurfaceTypeElement.textContent = "Concrete";
                    break;
                case 2:
                    this.runwaySurfaceTypeElement.textContent = "Asphalt";
                    break;
                case 101:
                    this.runwaySurfaceTypeElement.textContent = "Grass";
                    break;
                case 102:
                    this.runwaySurfaceTypeElement.textContent = "Turf";
                    break;
                case 103:
                    this.runwaySurfaceTypeElement.textContent = "Dirt";
                    break;
                case 104:
                    this.runwaySurfaceTypeElement.textContent = "Coral";
                    break;
                case 105:
                    this.runwaySurfaceTypeElement.textContent = "Gravel";
                    break;
                case 106:
                    this.runwaySurfaceTypeElement.textContent = "Oil Treated";
                    break;
                case 107:
                    this.runwaySurfaceTypeElement.textContent = "Steel";
                    break;
                case 108:
                    this.runwaySurfaceTypeElement.textContent = "Bituminus";
                    break;
                case 109:
                    this.runwaySurfaceTypeElement.textContent = "Brick";
                    break;
                case 110:
                    this.runwaySurfaceTypeElement.textContent = "Macadam";
                    break;
                case 111:
                    this.runwaySurfaceTypeElement.textContent = "Planks";
                    break;
                case 112:
                    this.runwaySurfaceTypeElement.textContent = "Sand";
                    break;
                case 113:
                    this.runwaySurfaceTypeElement.textContent = "Shale";
                    break;
                case 114:
                    this.runwaySurfaceTypeElement.textContent = "Tarmac";
                    break;
                case 115:
                    this.runwaySurfaceTypeElement.textContent = "Snow";
                    break;
                case 116:
                    this.runwaySurfaceTypeElement.textContent = "Ice";
                    break;
                case 201:
                    this.runwaySurfaceTypeElement.textContent = "Water";
                    break;
                default:
                    this.runwaySurfaceTypeElement.textContent = "Unknown";
            }
            switch (infos.runways[this.selectedRunway].lighting) {
                case 0:
                    this.runwayLightsElement.textContent = "Unknown";
                    break;
                case 1:
                    this.runwayLightsElement.textContent = "None";
                    break;
                case 2:
                    this.runwayLightsElement.textContent = "Part Time";
                    break;
                case 3:
                    this.runwayLightsElement.textContent = "Full Time";
                    break;
                case 4:
                    this.runwayLightsElement.textContent = "Frequency";
                    break;
            }
            const frequencies = [];
            for (let i = 0; i < infos.frequencies.length; i++) {
                frequencies.push('<div class="Freq"><div class="Name">' + infos.frequencies[i].name + '</div><div class="Value Blinking">' + infos.frequencies[i].mhValue.toFixed(3) + '</div></div>');
            }
            this.frequenciesSelectionGroup.setStringElements(frequencies);
            this.mapElement.setCenter(infos.coordinates);
        } else {
            this.symbolElement.textContent = "";
            this.typeElement.textContent = "Unknown";
            this.facilityNameElement.textContent = "____________________";
            this.cityElement.textContent = "____________________";
            this.regionElement.textContent = "__________";
            this.elevationElement.textContent = "____FT";
            this.latitudeElement.textContent = "_ __°__.__'";
            this.longitudeElement.textContent = "____°__.__'";
            this.fuelAvailableElement.textContent = "";
            this.timeZoneElement.textContent = "UTC__";
            this.runwayNameElement.textContent = "__-__";
            this.runwaySizeElement.textContent = "____FT x ___FT";
            this.runwaySurfaceTypeElement.textContent = "____________________";
            this.runwayLightsElement.textContent = "____________________";
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    update(_deltaTime) {
    }
    activateSearchField(_event) {
        if (_event == "FMS_Upper_INC" || _event == "FMS_Upper_DEC") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch();
            this.selectedRunway = 0;
            this.gps.SwitchToInteractionState(3);
        }
    }
    runwaySelection(_event) {
        if (_event == "FMS_Upper_INC") {
            this.selectedRunway = (this.selectedRunway + 1) % this.icaoSearchField.getUpdatedInfos().runways.length;
        } else if (_event == "FMS_Upper_DEC") {
            const length = this.icaoSearchField.getUpdatedInfos().runways.length;
            this.selectedRunway = (this.selectedRunway - 1 + length) % length;
        }
    }
    blinkGetState(_blinkPeriod, _duration) {
        return true;
    }
    frequencyCallback(_event, _index) {
        const infos = this.icaoSearchField.getUpdatedInfos();
        if (_event == "ENT_Push") {
            if (infos.frequencies[_index].mhValue >= 118) {
                const index = this.gps.getElementOfType(AS1000.ComFrequencies).getActiveIndex();
                SimVar.SetSimVarValue("K:COM" + (index == 1 ? "" : "2") + "_STBY_RADIO_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
            } else {
                const index = this.gps.getElementOfType(AS1000.NavFrequencies).getActiveIndex();
                SimVar.SetSimVarValue("K:NAV" + (index == 1 ? "1" : "2") + "_STBY_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
            }
        }
    }
}
class AS1000_MFD_AirportInfos2 extends NavSystemElement {
    constructor(_searchField) {
        super();
        this.icaoSearchField = _searchField;
    }
    init(root) {
        this.rootElement = root;
        this.identElement = this.gps.getChildById("AirportInfos2_ident");
        this.symbolElement = this.gps.getChildById("AirportInfos2_symbol");
        this.typeElement = this.gps.getChildById("AirportInfos2_type");
        this.facilityElement = this.gps.getChildById("AirportInfos2_facility");
        this.cityElement = this.gps.getChildById("AirportInfos2_city");
        this.icaoSearchField.elements.push(this.identElement);
        this.mapContainer = this.gps.getChildById("AirportMap");
        this.mapElement = this.gps.getChildById("MapInstrument");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.activateSearchField.bind(this))
        ];
    }
    onEnter() {
        this.rootElement.setAttribute("state", "Infos2");
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        const infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao != "") {
            this.symbolElement.textContent = "";
            switch (infos.privateType) {
                case 0:
                    this.typeElement.textContent = "Unknown";
                    break;
                case 1:
                    this.typeElement.textContent = "Public";
                    break;
                case 2:
                    this.typeElement.textContent = "Military";
                    break;
                case 3:
                    this.typeElement.textContent = "Private";
                    break;
            }
            this.facilityElement.textContent = infos.name;
            this.cityElement.textContent = infos.city;
            this.mapElement.setCenter(infos.coordinates);
        } else {
            this.symbolElement.textContent = "";
            this.typeElement.textContent = "Unknown";
            this.facilityElement.textContent = "____________________";
            this.cityElement.textContent = "____________________";
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    activateSearchField(_event) {
        if (_event == "FMS_Upper_INC" || _event == "FMS_Upper_DEC") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
        }
    }
}
class AS1000_MFD_NearestAirport extends NavSystemPage {
    constructor() {
        super("NEAREST AIRPORTS", "Nrst_Airport", new AS1000_MFD_NearestAirport_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.aptSoftkey = new SoftKeyElement("APT", this.activateApt.bind(this));
        this.rnwySoftkey = new SoftKeyElement("RNWY", this.activateRnwy.bind(this));
        this.freqSoftkey = new SoftKeyElement("FREQ", this.activateFreq.bind(this));
        this.aprSoftkey = new SoftKeyElement("APR", this.activateApr.bind(this));
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            this.aptSoftkey,
            this.rnwySoftkey,
            this.freqSoftkey,
            this.aprSoftkey,
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
    onUpdate(_deltaTime) {
        if (this.gps.currentInteractionState == 0) {
            this.reinitSoftkeys();
        }
        return super.onUpdate(_deltaTime);
    }
    reinitSoftkeys() {
        this.aptSoftkey.state = "None";
        this.rnwySoftkey.state = "None";
        this.freqSoftkey.state = "None";
        this.aprSoftkey.state = "None";
    }
    activateApt() {
        this.element.aptSelect();
        this.reinitSoftkeys();
        this.aptSoftkey.state = "White";
    }
    activateRnwy() {
        this.element.rnwySelect();
        this.reinitSoftkeys();
        this.rnwySoftkey.state = "White";
    }
    activateFreq() {
        this.element.freqSelect();
        this.reinitSoftkeys();
        this.freqSoftkey.state = "White";
    }
    activateApr() {
        this.element.aprSelect();
        this.reinitSoftkeys();
        this.aprSoftkey.state = "White";
    }
}
class AS1000_MFD_NearestVOR extends NavSystemPage {
    constructor() {
        super("NEAREST VOR", "Nrst_VOR", new AS1000_MFD_NearestVOR_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.vorSoftKey = new SoftKeyElement("VOR", this.activateVor.bind(this));
        this.freqSoftKey = new SoftKeyElement("FREQ", this.activateFreq.bind(this));
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            this.vorSoftKey,
            this.freqSoftKey,
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
    onUpdate(_deltaTime) {
        if (this.gps.currentInteractionState == 0) {
            this.reinitSoftkeys();
        }
        return super.onUpdate(_deltaTime);
    }
    reinitSoftkeys() {
        this.vorSoftKey.state = "None";
        this.freqSoftKey.state = "None";
    }
    activateVor() {
        this.element.vorSelect();
        this.reinitSoftkeys();
        this.vorSoftKey.state = "White";
    }
    activateFreq() {
        this.element.freqSelect();
        this.reinitSoftkeys();
        this.freqSoftKey.state = "White";
    }
}
class AS1000_MFD_NearestNDB extends NavSystemPage {
    constructor() {
        super("NEAREST NDB", "Nrst_NDB", new AS1000_MFD_NearestNDB_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
}
class AS1000_MFD_NearestIntersection extends NavSystemPage {
    constructor() {
        super("NEAREST INTERSECTIONS", "Nrst_Intersections", new AS1000_MFD_NearestIntersection_Element());
        this.mapMenu = new AS1000_MapMenu();
    }
    init() {
        this.mapMenu.init(this, this.gps);
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("ENGINE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("MAP", this.mapMenu.open.bind(this.mapMenu)),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null)
        ];
    }
}
class AS1000_MFD_NearestAirport_Element extends MFD_NearestAirport_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        const infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
}
class AS1000_MFD_NearestVOR_Element extends MFD_NearestVOR_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        const infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
    frequencyCallback(_event) {
        if (_event == "ENT_Push") {
            const navFreq = this.gps.getElementOfType(AS1000.NavFrequencies);
            let navIndex = 1;
            if (navFreq) {
                navIndex = navFreq.getActiveIndex();
            }
            SimVar.SetSimVarValue("K:NAV" + navIndex + "_STBY_SET", "Frequency BCD16", this.currentWaypoint.GetInfos().frequencyBcd16);
        }
    }
}
class AS1000_MFD_NearestNDB_Element extends MFD_NearestNDB_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        const infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
}
class AS1000_MFD_NearestIntersection_Element extends MFD_NearestIntersection_Element {
    init(_root) {
        super.init(_root);
        this.mapContainer = _root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getChildById("MapInstrument");
    }
    onEnter() {
        super.onEnter();
        this.mapContainer.appendChild(this.mapElement);
        this.mapElement.setAttribute("bing-mode", "vfr");
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        const infos = this.currentWaypoint.GetInfos();
        this.mapElement.setCenter(infos.coordinates);
    }
}
class AS1000_MFD_SystemSetup extends NavSystemPage {
    constructor() {
        super("System Setup", "SystemSetup", new AS1000_MFD_SystemSetupElement());
    }
}
class AS1000_MFD_SystemSetupElement extends NavSystemElement {
    init(root) {
        this.channelSpacing = this.gps.getChildById("Setup_ChannelConfig");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.channelSpacing, this.channelSpacingCB.bind(this))
        ];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.channelSpacing, SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? "25 kHz" : "8.33 kHz");
    }
    onExit() {
    }
    onEvent(_event) {
    }
    channelSpacingCB(_event) {
        switch (_event) {
            case "NavigationSmallInc":
            case "NavigationSmallDec":
            case "ENT_Push":
                SimVar.SetSimVarValue("K:COM_1_SPACING_MODE_SWITCH", "number", 0);
                SimVar.SetSimVarValue("K:COM_2_SPACING_MODE_SWITCH", "number", 0);
                break;
        }
    }
}
class AS1000_MapMenu {
    constructor() {
        this.modeMenu = new SoftKeysMenu();
        this.gpsMenu = new SoftKeysMenu();
        this.weatherMenu = new SoftKeysMenu();
    }
    init(_owner, _gps) {
        this.owner = _owner;
        this.gps = _gps;
        this.mapElement = this.gps.getElementOfType(MapInstrumentElement);
        if (this.gps.hasWeatherRadar()) {
            this.modeMenu.elements = [
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("DISPLAY", this.mapElement.toggleDisplayMode.bind(this.mapElement)),
                new SoftKeyElement("", null),
                new SoftKeyElement("GPS", this.switchMenu.bind(this, this.gpsMenu), this.getKeyState.bind(this, "GPS")),
                new SoftKeyElement("WEATHER", this.switchMenu.bind(this, this.weatherMenu), this.getKeyState.bind(this, "WEATHER")),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("BACK", this.close.bind(this)),
                new SoftKeyElement("", null)
            ];
        } else {
            this.modeMenu.elements = [
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("GPS", this.switchMenu.bind(this, this.gpsMenu), this.getKeyState.bind(this, "GPS")),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("", null),
                new SoftKeyElement("BACK", this.close.bind(this)),
                new SoftKeyElement("", null)
            ];
        }
        this.gpsMenu.elements = [
            new SoftKeyElement("TRAFFIC", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("TOPO", this.mapElement.toggleIsolines.bind(this.mapElement), this.getKeyState.bind(this, "TOPO")),
            new SoftKeyElement("TERRAIN", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("NEXRAD", this.mapElement.toggleNexrad.bind(this.mapElement), this.getKeyState.bind(this, "NEXRAD")),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("BACK", this.switchMenu.bind(this, this.modeMenu)),
            new SoftKeyElement("", null)
        ];
        this.weatherMenu.elements = [
            new SoftKeyElement("", null),
            new SoftKeyElement("MODE", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("HORIZON", this.mapElement.setRadar.bind(this.mapElement, ERadarMode.HORIZON), this.getKeyState.bind(this, "HORIZON")),
            new SoftKeyElement("VERTICAL", this.mapElement.setRadar.bind(this.mapElement, ERadarMode.VERTICAL), this.getKeyState.bind(this, "VERTICAL")),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("", null),
            new SoftKeyElement("BACK", this.switchMenu.bind(this, this.modeMenu)),
            new SoftKeyElement("", null)
        ];
    }
    open() {
        this.originalMenu = Object.assign({}, this.owner.softKeys);
        this.switchMenu(this.modeMenu);
    }
    close() {
        this.owner.softKeys = this.originalMenu;
    }
    switchMenu(_menu) {
        this.owner.softKeys = _menu;
    }
    getKeyState(_keyName) {
        switch (_keyName) {
            case "GPS":
            {
                if (this.mapElement.getDisplayMode() == EMapDisplayMode.GPS) {
                    return "White";
                }
                break;
            }
            case "WEATHER":
            {
                if (this.mapElement.getDisplayMode() == EMapDisplayMode.RADAR) {
                    return "White";
                }
                break;
            }
            case "TOPO":
            {
                if (this.mapElement.getIsolines()) {
                    return "White";
                }
                break;
            }
            case "NEXRAD":
            {
                if (this.mapElement.getNexrad()) {
                    return "White";
                }
                break;
            }
            case "HORIZON":
            {
                if (this.mapElement.getRadarMode() == ERadarMode.HORIZON) {
                    return "White";
                }
                break;
            }
            case "VERTICAL":
            {
                if (this.mapElement.getRadarMode() == ERadarMode.VERTICAL) {
                    return "White";
                }
                break;
            }
        }
        return "None";
    }
}
registerInstrument("as1000-mfd-element", AS1000_MFD);
//# sourceMappingURL=AS1000_MFD.js.map