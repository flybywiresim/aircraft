class AS1000_PFD extends BaseAS1000 {
    constructor() {
        super();
        this.handleReversionaryMode = false;
        this.initDuration = 7000;
    }
    get templateID() {
        return "AS1000_PFD";
    }
    connectedCallback() {
        super.connectedCallback();
        this.mainPage = new AS1000_PFD_MainPage();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                this.mainPage
            ]),
        ];
        const bgTimer = new AS1000_PFD_BackgroundTimer();
        const timerRef = new AS1000_PFD_TMRREF();
        timerRef.backgroundTimer = bgTimer;
        this.addIndependentElementContainer(new NavSystemElementContainer("InnerMap", "InnerMap", new PFD_InnerMap()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Transponder", "XPDRTimeBox", new PFD_XPDR()));
        this.addIndependentElementContainer(new NavSystemElementContainer("WindData", "WindData", new PFD_WindData()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", new PFD_Warnings()));
        this.addIndependentElementContainer(new NavSystemElementContainer("BackGroundTimer", "", bgTimer));
        this.addIndependentElementContainer(new Engine("Engine", "EngineDisplay"));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("Nearest Airports", "NearestAirports", new AS1000_PFD_NearestAirports(), "SoftKey_NRST"));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("ADF/DME", "AdfDme", new PFD_ADF_DME(), "SoftKey_ADF_DME"));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("Alerts", "AlertsWindow", new AS1000_Alerts(), "Toggle_Alerts"));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("TMR/REF", "TmrRefWindow", timerRef, "Softkey_TMR_REF"));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("AFPL", "ActiveFlightPlan", new AS1000_PFD_ActiveFlightPlan_Element(5), "FPL_Push"));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("Procedures", "ProceduresWindow", new MFD_Procedures(), "PROC_Push"));
        this.maxUpdateBudget = 12;
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        let syntheticVision = null;
        let reversionaryMode = null;
        if (this.instrumentXmlConfig) {
            syntheticVision = this.instrumentXmlConfig.getElementsByTagName("SyntheticVision")[0];
            reversionaryMode = this.instrumentXmlConfig.getElementsByTagName("ReversionaryMode")[0];
        }
        if (syntheticVision && syntheticVision.textContent == "True") {
            if (this.mainPage.attitude.svg) {
                this.mainPage.attitude.svg.setAttribute("background", "false");
            }
            this.getChildById("SyntheticVision").style.display = "block";
            this.mainPage.syntheticVision = true;
        } else {
            if (this.mainPage.attitude.svg) {
                this.mainPage.attitude.svg.setAttribute("background", "true");
            }
            this.getChildById("SyntheticVision").style.display = "none";
            this.mainPage.syntheticVision = false;
        }
        if (reversionaryMode && reversionaryMode.textContent == "True") {
            this.handleReversionaryMode = true;
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.handleReversionaryMode) {
            this.reversionaryMode = false;
            if (document.body.hasAttribute("reversionary")) {
                const attr = document.body.getAttribute("reversionary");
                if (attr == "true") {
                    this.reversionaryMode = true;
                }
            }
        }
    }
}
class AS1000_PFD_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new AS1000_PFD_MainElement());
        this.rootMenu = new SoftKeysMenu();
        this.insetMenu = new SoftKeysMenu();
        this.xpndrMenu = new SoftKeysMenu();
        this.xpndrCodeMenu = new SoftKeysMenu();
        this.pfdMenu = new SoftKeysMenu();
        this.windMenu = new SoftKeysMenu();
        this.hsiFrmtMenu = new SoftKeysMenu();
        this.syntheticVision = false;
        this.annunciations = new PFD_Annunciations();
        this.attitude = new PFD_Attitude();
        this.mapInstrument = new MapInstrumentElement();
        this.element = new NavSystemElementGroup([
            this.attitude,
            new PFD_Airspeed(),
            new PFD_Altimeter(),
            this.annunciations,
            new PFD_Compass(),
            new PFD_NavStatus(),
            new PFD_OAT(),
            this.mapInstrument,
            new PFD_Minimums(),
            new PFD_RadarAltitude(),
            new PFD_MarkerBeacon(),
            new AS1000_PFD_APDisplay()
        ]);
    }
    init() {
        super.init();
        this.mapInstrument.setGPS(this.gps);
        this.innerMap = this.gps.getElementOfType(PFD_InnerMap);
        if (this.syntheticVision) {
            this.attitude.svg.setAttribute("background", "false");
        } else {
            this.attitude.svg.setAttribute("background", "true");
        }
        this.alertSoftkey = new SoftKeyElement("ALERTS", this.gps.computeEvent.bind(this.gps, "SoftKeys_ALERT"));
        this.annunciations.alertSoftkey = this.alertSoftkey;
        this.rootMenu.elements = [
            new SoftKeyElement(),
            new SoftKeyElement("INSET", this.activateInsetMap.bind(this)),
            new SoftKeyElement(),
            new SoftKeyElement("PFD", this.switchToMenu.bind(this, this.pfdMenu)),
            new SoftKeyElement("OBS"),
            new SoftKeyElement("CDI", this.gps.computeEvent.bind(this.gps, "SoftKey_CDI")),
            new SoftKeyElement("ADF/DME", this.gps.computeEvent.bind(this.gps, "SoftKey_ADF_DME")),
            new SoftKeyElement("XPDR", this.switchToMenu.bind(this, this.xpndrMenu)),
            new SoftKeyElement("IDENT"),
            new SoftKeyElement("TMR/REF", this.gps.computeEvent.bind(this.gps, "Softkey_TMR_REF")),
            new SoftKeyElement("NRST", this.gps.computeEvent.bind(this.gps, "SoftKey_NRST")),
            this.alertSoftkey,
        ];
        this.insetMenu.elements = [
            new SoftKeyElement("OFF", this.deactivateInsetMap.bind(this)),
            new SoftKeyElement("DCLTR"),
            new SoftKeyElement(),
            new SoftKeyElement("TRAFFIC"),
            new SoftKeyElement("TOPO", this.toggleIsolines.bind(this), this.getKeyState.bind(this, "TOPO")),
            new SoftKeyElement("TERRAIN"),
            new SoftKeyElement(),
            new SoftKeyElement("NEXRAD", this.toggleNexrad.bind(this), this.getKeyState.bind(this, "NEXRAD")),
            new SoftKeyElement("XM LTNG"),
            new SoftKeyElement(),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.rootMenu)),
            this.alertSoftkey,
        ];
        this.xpndrMenu.elements = [
            new SoftKeyElement(),
            new SoftKeyElement(),
            new SoftKeyElement("STBY", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_STBY"), this.softkeyTransponderStatus.bind(this, 1)),
            new SoftKeyElement("ON", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_ON"), this.softkeyTransponderStatus.bind(this, 3)),
            new SoftKeyElement("ALT", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_ALT"), this.softkeyTransponderStatus.bind(this, 4)),
            new SoftKeyElement(),
            new SoftKeyElement("VFR", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_VFR")),
            new SoftKeyElement("CODE", this.switchToMenu.bind(this, this.xpndrCodeMenu)),
            new SoftKeyElement("IDENT", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_IDENT")),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.rootMenu)),
            this.alertSoftkey
        ];
        this.xpndrMenu.elements[2].state = "White";
        this.xpndrCodeMenu.elements = [
            new SoftKeyElement("0", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_0")),
            new SoftKeyElement("1", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_1")),
            new SoftKeyElement("2", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_2")),
            new SoftKeyElement("3", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_3")),
            new SoftKeyElement("4", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_4")),
            new SoftKeyElement("5", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_5")),
            new SoftKeyElement("6", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_6")),
            new SoftKeyElement("7", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_7")),
            new SoftKeyElement("IDENT", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_IDENT")),
            new SoftKeyElement("BKSP", this.gps.computeEvent.bind(this.gps, "SoftKeys_XPNDR_BKSP")),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.xpndrMenu)),
            this.alertSoftkey
        ];
        this.pfdMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement("DFLTS"),
            new SoftKeyElement("WIND", this.switchToMenu.bind(this, this.windMenu)),
            new SoftKeyElement("DME", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_DME")),
            new SoftKeyElement("BRG1", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG1")),
            new SoftKeyElement("HSI FRMT", this.switchToMenu.bind(this, this.hsiFrmtMenu)),
            new SoftKeyElement("BRG2", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG2")),
            new SoftKeyElement(""),
            new SoftKeyElement("ALT UNIT"),
            new SoftKeyElement("STD BARO"),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.rootMenu)),
            this.alertSoftkey
        ];
        this.windMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("OPTN 1", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O1"), this.softkeyWindStatus.bind(this, 1)),
            new SoftKeyElement("OPTN 2", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O2"), this.softkeyWindStatus.bind(this, 2)),
            new SoftKeyElement("OPTN 3", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O3"), this.softkeyWindStatus.bind(this, 3)),
            new SoftKeyElement("OFF", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_Off"), this.softkeyWindStatus.bind(this, 0)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.pfdMenu)),
            this.alertSoftkey
        ];
        this.hsiFrmtMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("360 HSI", this.gps.computeEvent.bind(this.gps, "SoftKeys_HSI_360"), this.softkeyHsiStatus.bind(this, false)),
            new SoftKeyElement("ARC HSI", this.gps.computeEvent.bind(this.gps, "SoftKeys_HSI_ARC"), this.softkeyHsiStatus.bind(this, true)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("BACK", this.switchToMenu.bind(this, this.pfdMenu)),
            this.alertSoftkey
        ];
        this.softKeys = this.rootMenu;
    }
    switchToMenu(_menu) {
        this.softKeys = _menu;
    }
    softkeyTransponderStatus(_state) {
        return SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") == _state ? "White" : "None";
    }
    softkeyHsiStatus(_arc) {
        return (SimVar.GetSimVarValue("L:Glasscockpit_HSI_Arc", "number") == 0) == _arc ? "None" : "White";
    }
    softkeyWindStatus(_state) {
        return this.gps.getElementOfType(PFD_WindData).getCurrentMode() == _state ? "White" : "None";
    }
    activateInsetMap() {
        this.gps.computeEvent("SoftKeys_InsetOn");
        this.switchToMenu(this.insetMenu);
    }
    deactivateInsetMap() {
        this.gps.computeEvent("SoftKeys_InsetOff");
        this.switchToMenu(this.rootMenu);
    }
    toggleNexrad() {
        this.gps.getElementOfType(PFD_InnerMap).toggleNexrad();
    }
    toggleIsolines() {
        this.gps.getElementOfType(PFD_InnerMap).toggleIsolines();
    }
    getKeyState(_keyName) {
        switch (_keyName) {
            case "TOPO":
            {
                if (this.innerMap.getIsolines()) {
                    return "White";
                }
                break;
            }
            case "NEXRAD":
            {
                if (this.innerMap.getNexrad()) {
                    return "White";
                }
                break;
            }
        }
        return "None";
    }
}
class AS1000_PFD_MainElement extends NavSystemElement {
    init(root) {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS1000_PFD_APDisplay extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.altimeterIndex = 0;
        this.apStatusDisplay = 0;
        this.yellowFlashBegin = 0;
    }
    init(root) {
        this.AP_LateralActive = this.gps.getChildById("AP_Lateral_Active");
        this.AP_LateralArmed = this.gps.getChildById("AP_Lateral_Armed");
        this.AP_Status = this.gps.getChildById("AP_Status");
        this.AP_VerticalActive = this.gps.getChildById("AP_Vertical_Active");
        this.AP_ModeReference = this.gps.getChildById("AP_Vertical_Reference");
        this.AP_Armed = this.gps.getChildById("AP_Vertical_Armed");
        if (this.gps.instrumentXmlConfig) {
            const altimeterIndexElems = this.gps.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }
        SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "feet", 10000);
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const apStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
        if (apStatus == true) {
            this.apStatusDisplay = 5;
        } else {
            if (this.apStatusDisplay == 5) {
                this.apStatusDisplay = 1;
            }
            if (this.apStatusDisplay == 2 && this.yellowFlashBegin + 5 < SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds")) {
                this.apStatusDisplay = 4;
            }
        }
        Avionics.Utils.diffAndSet(this.AP_Status, this.apStatusDisplay != 0 ? "AP" : "");
        switch (this.apStatusDisplay) {
            case 1:
                Avionics.Utils.diffAndSetAttribute(this.AP_Status, "Display", "RedFlash");
                break;
            case 2:
                Avionics.Utils.diffAndSetAttribute(this.AP_Status, "Display", "YellowFlash");
                break;
            case 3:
                Avionics.Utils.diffAndSetAttribute(this.AP_Status, "Display", "Red");
                break;
            case 4:
                Avionics.Utils.diffAndSetAttribute(this.AP_Status, "Display", "Yellow");
                break;
            case 0:
            case 5:
            default:
                Avionics.Utils.diffAndSetAttribute(this.AP_Status, "Display", "");
                break;
        }
        if (SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "PIT");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        } else if (SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "FLC");
            if (SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_ModeReference, "M" + fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "mach"), 3));
            } else {
                Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"), 0) + "KT");
            }
        } else if (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "FLC");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"), 0) + "KT");
        } else if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_VerticalActive, "ALTS");
            } else {
                Avionics.Utils.diffAndSet(this.AP_VerticalActive, "ALT");
            }
            Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet"), 0) + "FT");
        } else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "VS");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute"), 0) + "FPM");
        } else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "GS");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        } else {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "ALT");
        } else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "GS");
        } else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "ALTS");
        } else {
            Avionics.Utils.diffAndSet(this.AP_Armed, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "LVL");
        } else if (SimVar.GetSimVarValue("AUTOPILOT BANK HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "ROL");
        } else if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "HDG");
        } else if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralActive, "GPS");
            } else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "LOC");
                } else {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "VOR");
                }
            }
        } else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "BC");
        } else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralActive, "GPS");
            } else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "LOC");
                } else {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "VOR");
                }
            }
        } else {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") || SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool")) {
            if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralArmed, "GPS");
                } else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "LOC");
                    } else {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "VOR");
                    }
                }
            } else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, "BC");
            } else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralArmed, "GPS");
                } else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "LOC");
                    } else {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "VOR");
                    }
                }
            } else {
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, "");
            }
        } else {
            Avionics.Utils.diffAndSet(this.AP_LateralArmed, "");
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "Autopilot_Manual_Off":
                this.apStatusDisplay = 2;
                this.yellowFlashBegin = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                break;
            case "Autopilot_Disc":
                this.apStatusDisplay = 0;
                break;
        }
    }
}
class AS1000_PFD_WaypointLine extends MFD_WaypointLine {
    onEvent(_subIndex, _event) {
        switch (_event) {
            case "NavigationSmallInc":
            case "NavigationSmallDec":
                switch (_subIndex) {
                    case 0:
                        this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
                        this.element.selectedIndex = this.index;
                        break;
                    case 1:
                        this.element.selectedIndex = this.index;
                        this.element.editAltitude(this.waypointType, this.index);
                        break;
                }
                return true;
            case "CLR":
            case "CLR_Push":
                this.element.removeWaypoint(this.index);
                break;
        }
        return false;
    }
}
class AS1000_PFD_ApproachWaypointLine extends MFD_ApproachWaypointLine {
    onEvent(_subIndex, _event) {
        switch (_event) {
            case "NavigationSmallInc":
            case "NavigationSmallDec":
                switch (_subIndex) {
                    case 0:
                        this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
                        this.element.selectedIndex = this.index;
                        break;
                    case 1:
                        this.element.selectedIndex = this.index;
                        this.element.editAltitude(4, this.index);
                        break;
                }
                return true;
            case "CLR":
            case "CLR_Push":
                this.element.removeWaypoint(this.index);
                break;
        }
        return false;
    }
}
class AS1000_PFD_ActiveFlightPlan_Element extends MFD_ActiveFlightPlan_Element {
    constructor(_nbLines = 5) {
        super(AS1000_PFD_WaypointLine, AS1000_PFD_ApproachWaypointLine, _nbLines);
        this.isPopup = true;
    }
    init(_root) {
        super.init(_root);
        this.root = _root;
    }
    onEnter() {
        super.onEnter();
        this.root.setAttribute("state", "Active");
    }
    onExit() {
        super.onEnter();
        this.root.setAttribute("state", "Inactive");
    }
    onWaypointSelectionEnd() {
        super.onWaypointSelectionEnd();
        this.gps.popUpElement = this.container;
        this.gps.popUpElement.onEnter();
    }
}
registerInstrument("as1000-pfd-element", AS1000_PFD);
//# sourceMappingURL=AS1000_PFD.js.map