class AS3000_PFD extends NavSystem {
    constructor() {
        super();
        this.initDuration = 7000;
    }
    get IsGlassCockpit() {
        return true;
    }
    get templateID() {
        return "AS3000_PFD";
    }
    connectedCallback() {
        super.connectedCallback();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                new AS3000_PFD_MainPage()
            ]),
        ];
        this.addIndependentElementContainer(new NavSystemElementContainer("InnerMap", "InnerMap", new MapInstrumentElement()));
        this.addIndependentElementContainer(new NavSystemElementContainer("WindData", "WindData", new PFD_WindData()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", new PFD_Warnings()));
        this.addIndependentElementContainer(new NavSystemElementContainer("SoftKeys", "SoftKeys", new SoftKeys(AS3000_PFD_SoftKeyHtmlElement)));
        this.maxUpdateBudget = 12;
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
    }
}
class AS3000_PFD_SoftKeyElement extends SoftKeyElement {
    constructor(_name = "", _callback = null, _statusCB = null, _valueCB = null) {
        super(_name, _callback);
        this.statusBarCallback = _statusCB;
        this.valueCallback = _valueCB;
    }
}
class AS3000_PFD_SoftKeyHtmlElement extends SoftKeyHtmlElement {
    constructor(_elem) {
        super(_elem);
        this.Element = _elem.getElementsByClassName("Title")[0];
        this.ValueElement = _elem.getElementsByClassName("Value")[0];
        this.StatusBar = _elem.getElementsByClassName("Status")[0];
    }
    fillFromElement(_elem) {
        super.fillFromElement(_elem);
        if (_elem.statusBarCallback == null) {
            Avionics.Utils.diffAndSetAttribute(this.StatusBar, "state", "None");
        } else {
            if (_elem.statusBarCallback()) {
                Avionics.Utils.diffAndSetAttribute(this.StatusBar, "state", "Active");
            } else {
                Avionics.Utils.diffAndSetAttribute(this.StatusBar, "state", "Inactive");
            }
        }
        if (_elem.valueCallback == null) {
            Avionics.Utils.diffAndSet(this.ValueElement, "");
        } else {
            Avionics.Utils.diffAndSet(this.ValueElement, _elem.valueCallback());
        }
    }
}
class AS3000_PFD_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new AS3000_PFD_MainElement());
        this.rootMenu = new SoftKeysMenu();
        this.pfdMenu = new SoftKeysMenu();
        this.otherPfdMenu = new SoftKeysMenu();
        this.windMenu = new SoftKeysMenu();
        this.annunciations = new PFD_Annunciations();
        this.attitude = new PFD_Attitude();
        this.mapInstrument = new MapInstrumentElement();
        this.aoaIndicator = new AS3000_PFD_AngleOfAttackIndicator();
        this.element = new NavSystemElementGroup([
            this.attitude,
            new PFD_Airspeed(),
            new PFD_Altimeter(),
            this.annunciations,
            new PFD_Compass(),
            new PFD_NavStatus(),
            new AS3000_PFD_BottomInfos(),
            new AS3000_PFD_ActiveCom(),
            new AS3000_PFD_ActiveNav(),
            new AS3000_PFD_NavStatus(),
            this.aoaIndicator,
            this.mapInstrument,
            new PFD_AutopilotDisplay(),
            new PFD_Minimums(),
            new PFD_RadarAltitude(),
            new PFD_MarkerBeacon()
        ]);
    }
    init() {
        super.init();
        this.hsi = this.gps.getChildById("Compass");
        this.wind = this.gps.getChildById("WindData");
        this.mapInstrument.setGPS(this.gps);
        this.attitude.svg.setAttribute("background", "false");
        this.rootMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Map Range-", this.gps.computeEvent.bind(this.gps, "RANGE_DEC")),
            new AS3000_PFD_SoftKeyElement("Map Range+", this.gps.computeEvent.bind(this.gps, "RANGE_INC")),
            new AS3000_PFD_SoftKeyElement("PFD Map Settings"),
            new AS3000_PFD_SoftKeyElement("Traffic Inset", null, this.constElement.bind(this, false)),
            new AS3000_PFD_SoftKeyElement("PFD Settings", this.switchToMenu.bind(this, this.pfdMenu)),
            new AS3000_PFD_SoftKeyElement("OBS"),
            new AS3000_PFD_SoftKeyElement("Active&nbsp;NAV", this.gps.computeEvent.bind(this.gps, "SoftKey_CDI"), null, this.navStatus.bind(this)),
            new AS3000_PFD_SoftKeyElement("Sensors"),
            new AS3000_PFD_SoftKeyElement("WX Radar Controls"),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.pfdMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Attitude Overlays"),
            new AS3000_PFD_SoftKeyElement("PFD Mode", null, null, this.constElement.bind(this, "FULL")),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Bearing 1", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG1"), null, this.bearing1Status.bind(this)),
            new AS3000_PFD_SoftKeyElement("Bearing 2", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG2"), null, this.bearing2Status.bind(this)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Other PFD Settings", this.switchToMenu.bind(this, this.otherPfdMenu)),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.rootMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.otherPfdMenu.elements = [
            new AS3000_PFD_SoftKeyElement("Wind", this.switchToMenu.bind(this, this.windMenu)),
            new AS3000_PFD_SoftKeyElement("AOA", this.gps.computeEvent.bind(this.gps, "SoftKey_PFD_AoAMode"), null, this.aoaStatus.bind(this)),
            new AS3000_PFD_SoftKeyElement("Altitude Units"),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("COM1 121.5", null, this.constElement.bind(this, false)),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.rootMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.windMenu.elements = [
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Option 1", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O1"), this.windModeCompare.bind(this, "1")),
            new AS3000_PFD_SoftKeyElement("Option 2", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O2"), this.windModeCompare.bind(this, "2")),
            new AS3000_PFD_SoftKeyElement("Option 3", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_O3"), this.windModeCompare.bind(this, "3")),
            new AS3000_PFD_SoftKeyElement("Off", this.gps.computeEvent.bind(this.gps, "SoftKeys_Wind_Off"), this.windModeCompare.bind(this, "0")),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement(""),
            new AS3000_PFD_SoftKeyElement("Back", this.switchToMenu.bind(this, this.otherPfdMenu)),
            new AS3000_PFD_SoftKeyElement("")
        ];
        this.softKeys = this.rootMenu;
    }
    switchToMenu(_menu) {
        this.softKeys = _menu;
    }
    constElement(_elem) {
        return _elem;
    }
    bearing1Status() {
        if (this.hsi && this.hsi.getAttribute("show_bearing1") == "true") {
            return this.hsi.getAttribute("bearing1_source");
        } else {
            return "OFF";
        }
    }
    bearing2Status() {
        if (this.hsi && this.hsi.getAttribute("show_bearing2") == "true") {
            return this.hsi.getAttribute("bearing2_source");
        } else {
            return "OFF";
        }
    }
    navStatus() {
        return this.hsi.getAttribute("nav_source");
    }
    windModeCompare(_comparison) {
        return this.wind.getAttribute("wind-mode") == _comparison;
    }
    aoaStatus() {
        switch (this.aoaIndicator.AoaMode) {
            case 0:
                return "OFF";
                break;
            case 1:
                return "ON";
                break;
            case 2:
                return "AUTO";
                break;
        }
    }
}
class AS3000_PFD_MainElement extends NavSystemElement {
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
class AS3000_PFD_Compass extends PFD_Compass {
    onEvent(_event) {
        super.onEvent(_event);
    }
}
class AS3000_PFD_BottomInfos extends NavSystemElement {
    init(root) {
        this.tas = this.gps.getChildById("TAS_Value");
        this.oat = this.gps.getChildById("OAT_Value");
        this.gs = this.gps.getChildById("GS_Value");
        this.isa = this.gps.getChildById("ISA_Value");
        this.timer = this.gps.getChildById("TMR_Value");
        this.utcTime = this.gps.getChildById("UTC_Value");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.tas, fastToFixed(Simplane.getTrueSpeed(), 0) + "KT");
        Avionics.Utils.diffAndSet(this.oat, fastToFixed(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius"), 0) + "°C");
        Avionics.Utils.diffAndSet(this.gs, fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0) + "KT");
        Avionics.Utils.diffAndSet(this.isa, fastToFixed(SimVar.GetSimVarValue("STANDARD ATM TEMPERATURE", "celsius"), 0) + "°C");
        Avionics.Utils.diffAndSet(this.utcTime, Utils.SecondsToDisplayTime(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"), true, true, false));
        Avionics.Utils.diffAndSet(this.timer, Utils.SecondsToDisplayTime(SimVar.GetSimVarValue("L:AS3000_" + this.gps.urlConfig.index + "_Timer_Value", "number") / 1000, true, true, false));
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_PFD_ActiveCom extends NavSystemElement {
    init(root) {
        this.activeCom = this.gps.getChildById("ActiveCom");
        this.activeComFreq = this.gps.getChildById("ActiveComFreq");
        this.activeComName = this.gps.getChildById("ActiveComName");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.activeComFreq, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_PFD_ActiveNav extends NavSystemElement {
    init(root) {
        this.NavInfos = this.gps.getChildById("NavFreqInfos");
        this.ActiveNav = this.gps.getChildById("ActiveNav");
        this.ActiveNavFreq = this.gps.getChildById("ActiveNavFreq");
        this.ActiveNavName = this.gps.getChildById("ActiveNavName");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (!SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
            Avionics.Utils.diffAndSetAttribute(this.NavInfos, "state", "Visible");
            const index = SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
            Avionics.Utils.diffAndSet(this.ActiveNav, "NAV" + index);
            Avionics.Utils.diffAndSet(this.ActiveNavFreq, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + index, "MHz"), 2));
            Avionics.Utils.diffAndSet(this.ActiveNavName, SimVar.GetSimVarValue("NAV IDENT:" + index, "string"));
        } else {
            Avionics.Utils.diffAndSetAttribute(this.NavInfos, "state", "Inactive");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_PFD_NavStatus extends PFD_NavStatus {
    init(root) {
        this.currentLegFrom = this.gps.getChildById("FromWP");
        this.currentLegSymbol = this.gps.getChildById("LegSymbol");
        this.currentLegTo = this.gps.getChildById("ToWP");
        this.currentLegDistance = this.gps.getChildById("DisValue");
        this.currentLegBearing = this.gps.getChildById("BrgValue");
    }
}
class AS3000_PFD_AngleOfAttackIndicator extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.AoaMode = 1;
    }
    init(root) {
        this.AoaElement = this.gps.getChildById("AoA");
        SimVar.SetSimVarValue("L:Glasscockpit_AOA_Mode", "number", this.AoaMode);
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.AoaElement.setAttribute("aoa", Math.min(Math.max(Simplane.getAngleOfAttack(), 0), 16).toString());
    }
    onExit() {
    }
    onEvent(_event) {
        if (_event == "SoftKey_PFD_AoAMode") {
            this.AoaMode = ((this.AoaMode + 1) % 3);
        }
        switch (_event) {
            case "AOA_Off":
                this.AoaMode = 0;
                break;
            case "AOA_On":
                this.AoaMode = 1;
                break;
            case "AOA_Auto":
                this.AoaMode = 2;
                break;
        }
        if (this.AoaMode == 0) {
            this.AoaElement.style.display = "none";
        } else {
            this.AoaElement.style.display = "block";
        }
        SimVar.SetSimVarValue("L:Glasscockpit_AOA_Mode", "number", this.AoaMode);
    }
}
registerInstrument("as3000-pfd-element", AS3000_PFD);
//# sourceMappingURL=AS3000_PFD.js.map