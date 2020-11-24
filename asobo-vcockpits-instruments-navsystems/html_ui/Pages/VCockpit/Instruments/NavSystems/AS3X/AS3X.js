class AS3X extends NavSystem {
    constructor() {
        super(...arguments);
        this.pageListElems = [];
    }
    get IsGlassCockpit() {
        return true;
    }
    connectedCallback() {
        super.connectedCallback();
        this.contentElement = this.getChildById("Content");
        this.pagesContainer = this.getChildById("MFD");
        this.currentPageElement = this.getChildById("currentPageName");
        this.pageListElement = this.getChildById("pageList");
        this.addEventAlias("TURN_INC", "NavigationSmallInc");
        this.addEventAlias("TURN_DEC", "NavigationSmallDec");
        this.addEventAlias("JOYSTICK_DOWN", "NavigationLargeInc");
        this.addEventAlias("JOYSTICK_UP", "NavigationLargeDec");
        this.addEventAlias("JOYSTICK_RIGHT", "NavigationLargeInc");
        this.addEventAlias("JOYSTICK_LEFT", "NavigationLargeDec");
        this.addEventAlias("JOYSTICK_PUSH", "NavigationPush");
        this.addIndependentElementContainer(new NavSystemElementContainer("Softkeys", "Softkeys", new SoftKeys()));
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        let state = "PFD";
        if (this.instrumentXmlConfig) {
            const displayModeConfig = this.instrumentXmlConfig.getElementsByTagName("DisplayMode");
            if (displayModeConfig.length > 0) {
                state = displayModeConfig[0].textContent;
                this.contentElement.setAttribute("state", state);
            }
        }
        switch (state) {
            case "PFD":
                this.pageGroups = [
                    new NavSystemPageGroup("Main", this, [
                        new AS3X_PFD()
                    ]),
                ];
                this.mapInstrument = new MapInstrumentElement();
                this.mapInstrument.setGPS(this);
                this.addIndependentElementContainer(new NavSystemElementContainer("Airspeed", "PFD", new PFD_Airspeed()));
                this.addIndependentElementContainer(new NavSystemElementContainer("Altimeter", "PFD", new PFD_Altimeter()));
                this.addIndependentElementContainer(new NavSystemElementContainer("SimpleCompass", "PFD", new PFD_SimpleCompass()));
                this.addIndependentElementContainer(new NavSystemElementContainer("CDI", "PFD", new PFD_CDI()));
                this.addIndependentElementContainer(new NavSystemElementContainer("MapInstrument", "PFD", this.mapInstrument));
                this.addIndependentElementContainer(new NavSystemElementContainer("Attitude", "PFD", new PFD_Attitude()));
                this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", new PFD_Warnings()));
                this.addIndependentElementContainer(new NavSystemElementContainer("Autopilot", "AutopilotInfos", new PFD_AutopilotDisplay()));
                this.addIndependentElementContainer(new NavSystemElementContainer("Engine", "Engine", new GlassCockpit_XMLEngine()));
                this.addIndependentElementContainer(new NavSystemElementContainer("TopBar", "TopBar", new AS3X_TopBar()));
                this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("DirectTo", "DirectToWindow", new GlassCockpit_DirectTo(), "DIRECTTO"));
                this.gsValue = this.getChildById("GS_Value");
                this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("Flightplan", this, [
                    new AS3X_AFPL_Page(9)
                ]));
                this.addEventLinkedPageGroup("NRST_Push", new NavSystemPageGroup("Nearest", this, [
                    new AS3X_PFD_NearestAirport(),
                    new AS3X_NearestVOR(6),
                    new AS3X_NearestNDB(6),
                    new AS3X_NearestIntersection(6)
                ]));
                this.proceduresPage = new NavSystemElementContainer("Procedures", "ProceduresWindow", new MFD_Procedures(0, 0, 0));
                this.proceduresPage.setGPS(this);
                break;
            case "Split":
                this.addIndependentElementContainer(new AS3X_PFD());
                this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", new PFD_Warnings()));
            case "MFD":
                this.pageGroups = [
                    new NavSystemPageGroup("Main", this, [
                        new AS3X_MapPage()
                    ]),
                ];
                this.addIndependentElementContainer(new NavSystemElementContainer("Engine", "Engine", new GlassCockpit_XMLEngine()));
                this.addIndependentElementContainer(new NavSystemElementContainer("TopBar", "TopBar", new AS3X_TopBar()));
                this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("DirectTo", "DirectToWindow", new GlassCockpit_DirectTo(), "DIRECTTO"));
                this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("Flightplan", this, [
                    new AS3X_AFPL_Page()
                ]));
                this.addEventLinkedPageGroup("NRST_Push", new NavSystemPageGroup("Nearest", this, [
                    new AS3X_NearestAirport(),
                    new AS3X_NearestVOR(),
                    new AS3X_NearestNDB(),
                    new AS3X_NearestIntersection()
                ]));
                this.proceduresPage = new NavSystemElementContainer("Procedures", "ProceduresWindow", new MFD_Procedures(4, 5, 5));
                this.proceduresPage.setGPS(this);
                break;
        }
    }
    Update() {
        super.Update();
        Avionics.Utils.diffAndSet(this.currentPageElement, this.getCurrentPage().detailedName);
        const currPageGroup = this.getCurrentPageGroup();
        for (let i = 0; i < currPageGroup.pages.length; i++) {
            if (i >= this.pageListElems.length) {
                const elem = window.document.createElement("div");
                elem.setAttribute("class", "pageElem");
                this.pageListElems.push(elem);
                this.pageListElement.appendChild(elem);
            }
            Avionics.Utils.diffAndSet(this.pageListElems[i], currPageGroup.pages[i].shortName);
            if (i == currPageGroup.pageIndex) {
                Avionics.Utils.diffAndSetAttribute(this.pageListElems[i], "state", "Active");
            } else {
                Avionics.Utils.diffAndSetAttribute(this.pageListElems[i], "state", "Inactive");
            }
        }
        for (let i = currPageGroup.pages.length; i < this.pageListElems.length; i++) {
            Avionics.Utils.diffAndSet(this.pageListElems[i], "");
        }
        if (this.gsValue) {
            Avionics.Utils.diffAndSet(this.gsValue, fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knot"), 0) + "kt");
        }
    }
    get templateID() {
        return "AS3X";
    }
}
class AS3X_Page extends NavSystemPage {
    constructor(_name, _htmlElemId, _element, _shortName = "", _detailedName = "") {
        super(_name, _htmlElemId, _element);
        this.shortName = _shortName;
        this.detailedName = _detailedName != "" ? _detailedName : _name;
    }
}
class AS3X_PFD extends AS3X_Page {
    constructor() {
        super("PFD", "PFD", null, "PFD");
        this.valueSelectionMode = 0;
        this.element = new NavSystemElementGroup([
            new PFD_Compass("HSI")
        ]);
    }
    init() {
        super.init();
        this.oatValue = this.gps.getChildById("OAT_Value");
        this.lclValue = this.gps.getChildById("LCL_Value");
        this.mainSoftkeyMenu = new SoftKeysMenu();
        this.mainSoftkeyMenu.elements = [
            new SoftKeyElement("HDG", this.switchToValueSelectionMode.bind(this, 1), this.valueSelectionModeStateCallback.bind(this, 1)),
            new SoftKeyElement("CRS", this.switchToValueSelectionMode.bind(this, 2), this.valueSelectionModeStateCallback.bind(this, 2)),
            new SoftKeyElement("CDI SRC", this.switchCdiSrc.bind(this)),
            new SoftKeyElement("BARO", this.switchToBaroMenu.bind(this)),
            new SoftKeyElement("ALT", this.switchToValueSelectionMode.bind(this, 3), this.valueSelectionModeStateCallback.bind(this, 3))
        ];
        this.baroSoftkeyMenu = new SoftKeysMenu();
        this.baroSoftkeyMenu.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("MINIMUMS", this.switchToValueSelectionMode.bind(this, 4), this.valueSelectionModeStateCallback.bind(this, 4)),
            new SoftKeyElement("BARO", this.switchToValueSelectionMode.bind(this, 5), this.valueSelectionModeStateCallback.bind(this, 5)),
            new SoftKeyElement("BACK", this.switchFromBaroMenu.bind(this))
        ];
        this.softKeys = this.mainSoftkeyMenu;
        if (this.gps.instrumentXmlConfig) {
            const altimeterIndexElems = this.gps.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }
    }
    switchToValueSelectionMode(_value) {
        if (_value == this.valueSelectionMode) {
            this.valueSelectionMode = 0;
        } else {
            this.valueSelectionMode = _value;
        }
    }
    valueSelectionModeStateCallback(_value) {
        if (_value == this.valueSelectionMode) {
            return "Active";
        } else {
            return "None";
        }
    }
    switchToBaroMenu() {
        this.switchToMenu(this.baroSoftkeyMenu);
        this.valueSelectionMode = 5;
    }
    switchFromBaroMenu() {
        this.switchToMenu(this.mainSoftkeyMenu);
        this.valueSelectionMode = 0;
    }
    switchToMenu(_menu) {
        this.softKeys = _menu;
    }
    switchCdiSrc() {
        const isGPSDrived = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
        let cdiSrc = isGPSDrived ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
        cdiSrc = (cdiSrc % 3) + 1;
        if (cdiSrc == 2 && !SimVar.GetSimVarValue("NAV AVAILABLE:2", "Bool")) {
            cdiSrc = 3;
        }
        if (cdiSrc == 3 != isGPSDrived) {
            SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
        }
        if (cdiSrc != 3) {
            SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", cdiSrc);
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        Avionics.Utils.diffAndSet(this.oatValue, fastToFixed(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius"), 0) + "°C");
        const lcl = SimVar.GetSimVarValue("E:LOCAL TIME", "seconds");
        const hh = Math.floor(lcl / 3600);
        const mm = Math.floor((lcl % 3600) / 60);
        const ss = Math.floor(lcl % 60);
        Avionics.Utils.diffAndSet(this.lclValue, (hh < 10 ? "0" : "") + hh + (mm < 10 ? ":0" : ":") + mm + (ss < 10 ? ":0" : ":") + ss);
    }
    onEvent(_event) {
        super.onEvent(_event);
        switch (_event) {
            case "TURN_INC":
                switch (this.valueSelectionMode) {
                    case 1:
                        SimVar.SetSimVarValue("K:HEADING_BUG_INC", "number", 0);
                        break;
                    case 2:
                        SimVar.SetSimVarValue("K:VOR1_OBI_INC", "number", 0);
                        break;
                    case 3:
                        SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 0);
                        break;
                    case 4:
                        break;
                    case 5:
                        SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", this.altimeterIndex);
                        break;
                }
                break;
            case "TURN_DEC":
                switch (this.valueSelectionMode) {
                    case 1:
                        SimVar.SetSimVarValue("K:HEADING_BUG_DEC", "number", 0);
                        break;
                    case 2:
                        SimVar.SetSimVarValue("K:VOR1_OBI_DEC", "number", 0);
                        break;
                    case 3:
                        SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 0);
                        break;
                    case 4:
                        break;
                    case 5:
                        SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", this.altimeterIndex);
                        break;
                }
                break;
        }
    }
}
class AS3X_TopBar extends NavSystemElement {
    init(root) {
        const info1 = this.gps.getChildById("TopInfo1");
        const info2 = this.gps.getChildById("TopInfo2");
        const info3 = this.gps.getChildById("TopInfo3");
        const info4 = this.gps.getChildById("TopInfo4");
        this.title1 = info1.getElementsByClassName("title")[0];
        this.title2 = info2.getElementsByClassName("title")[0];
        this.title3 = info3.getElementsByClassName("title")[0];
        this.title4 = info4.getElementsByClassName("title")[0];
        this.value1 = info1.getElementsByClassName("value")[0];
        this.value2 = info2.getElementsByClassName("value")[0];
        this.value3 = info3.getElementsByClassName("value")[0];
        this.value4 = info4.getElementsByClassName("value")[0];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const wp = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
        Avionics.Utils.diffAndSet(this.value1, wp != "" ? wp : "____");
        const brg = SimVar.GetSimVarValue("GPS WP BEARING", "degrees");
        Avionics.Utils.diffAndSet(this.value2, brg > 0 ? fastToFixed(brg, 0) + "°M" : "___°M");
        const dist = SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical mile");
        Avionics.Utils.diffAndSet(this.value3, dist > 0 ? dist.toFixed(1) + "NM" : "__._NM");
        const ete = SimVar.GetSimVarValue("GPS ETE", "minutes");
        const hh = Math.floor(ete / 60);
        const mm = Math.floor(ete % 60);
        Avionics.Utils.diffAndSet(this.value4, ete > 0 ? (hh < 10 ? "0" : "") + hh + (mm < 10 ? ":0" : ":") + mm : "__:__");
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3X_AFPL_Page extends AS3X_Page {
    constructor(_nbLines = 16) {
        super("Active Flight Plan", "ActiveFlightPlan", new MFD_ActiveFlightPlan_Element(MFD_WaypointLine, MFD_ApproachWaypointLine, _nbLines), "ACTV", "ACTIVE FLIGHT PLAN");
    }
    init() {
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement("PROC", this.toggleProc.bind(this)),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("EXIT", this.gps.exitEventLinkedPageGroup.bind(this.gps))
        ];
    }
    toggleProc() {
        if (this.gps.popUpElement) {
            this.gps.closePopUpElement();
        } else {
            this.gps.switchToPopUpPage(this.gps.proceduresPage);
        }
    }
}
class AS3X_NearestAirport extends AS3X_Page {
    constructor(_nbLines = 5, _nbFreqs = 3) {
        super("NEAREST AIRPORTS", "Nrst_Airport", new MFD_NearestAirport_Element(_nbLines, _nbFreqs), "APT", "NEAREST");
    }
    init() {
        this.softKeys = new SoftKeysMenu();
        this.aptSoftkey = new SoftKeyElement("APT", this.activateApt.bind(this));
        this.rnwySoftkey = new SoftKeyElement("RNWY", this.activateRnwy.bind(this));
        this.freqSoftkey = new SoftKeyElement("FREQ", this.activateFreq.bind(this));
        this.aprSoftkey = new SoftKeyElement("APR", this.activateApr.bind(this));
        this.softKeys.elements = [
            this.aptSoftkey,
            this.rnwySoftkey,
            this.freqSoftkey,
            this.aprSoftkey,
            new SoftKeyElement("EXIT", this.gps.exitEventLinkedPageGroup.bind(this.gps))
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
        this.aptSoftkey.state = "Active";
    }
    activateRnwy() {
        this.element.rnwySelect();
        this.reinitSoftkeys();
        this.rnwySoftkey.state = "Active";
    }
    activateFreq() {
        this.element.freqSelect();
        this.reinitSoftkeys();
        this.freqSoftkey.state = "Active";
    }
    activateApr() {
        this.element.aprSelect();
        this.reinitSoftkeys();
        this.aprSoftkey.state = "White";
    }
}
class AS3X_PFD_NearestAirport extends AS3X_NearestAirport {
    constructor() {
        super(3, 1);
    }
    init() {
        this.softKeys = new SoftKeysMenu();
        this.aptSoftkey = new SoftKeyElement("APT", this.activateApt.bind(this));
        this.rnwySoftkey = new SoftKeyElement("RNWY", this.activateRnwy.bind(this));
        this.freqSoftkey = new SoftKeyElement("FREQ", this.activateFreq.bind(this));
        this.aprSoftkey = new SoftKeyElement("");
        this.softKeys.elements = [
            this.aptSoftkey,
            this.rnwySoftkey,
            this.freqSoftkey,
            this.aprSoftkey,
            new SoftKeyElement("EXIT", this.gps.exitEventLinkedPageGroup.bind(this.gps))
        ];
    }
}
class AS3X_NearestVOR extends AS3X_Page {
    constructor(_nbLines = 10) {
        super("NEAREST VOR", "Nrst_VOR", new MFD_NearestVOR_Element(_nbLines), "VOR", "NEAREST");
    }
    init() {
        this.vorSoftKey = new SoftKeyElement("VOR", this.activateVor.bind(this));
        this.freqSoftKey = new SoftKeyElement("FREQ", this.activateFreq.bind(this));
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement("", null),
            this.vorSoftKey,
            this.freqSoftKey,
            new SoftKeyElement("", null),
            new SoftKeyElement("EXIT", this.gps.exitEventLinkedPageGroup.bind(this.gps))
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
        this.vorSoftKey.state = "Active";
    }
    activateFreq() {
        this.element.freqSelect();
        this.reinitSoftkeys();
        this.freqSoftKey.state = "Active";
    }
}
class AS3X_NearestNDB extends AS3X_Page {
    constructor(_nbLines = 10) {
        super("NEAREST NDB", "Nrst_NDB", new MFD_NearestNDB_Element(_nbLines), "NDB", "NEAREST");
    }
    init() {
    }
}
class AS3X_NearestIntersection extends AS3X_Page {
    constructor(_nbLines = 10) {
        super("NEAREST INTERSECTIONS", "Nrst_Intersections", new MFD_NearestIntersection_Element(_nbLines), "INT", "NEAREST");
    }
    init() {
    }
}
class AS3X_MapPage extends AS3X_Page {
    constructor() {
        super("Map", "Map", new MapInstrumentElement(), "Map", "Map");
    }
    init() {
        this.softKeys = new SoftKeysMenu();
        this.softKeys.elements = [
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement(""),
            new SoftKeyElement("")
        ];
    }
    onEvent(_event) {
        super.onEvent(_event);
        switch (_event) {
            case "TURN_INC":
                this.element.onEvent("RANGE_INC");
                break;
            case "TURN_DEC":
                this.element.onEvent("RANGE_DEC");
                break;
        }
    }
}
registerInstrument("as3x-element", AS3X);
//# sourceMappingURL=AS3X.js.map