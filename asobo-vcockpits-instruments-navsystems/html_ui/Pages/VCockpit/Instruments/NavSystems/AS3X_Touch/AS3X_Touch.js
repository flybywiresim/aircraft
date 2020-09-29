class AS3X_Touch extends NavSystemTouch {
    constructor() {
        super();
        this.m_isSplit = true;
        this.lastPageIndex = NaN;
        this.lastPageGroup = "";
        this.displayMode = "Splitted";
        this.engineDisplayed = true;
        this.handleReversionaryMode = false;
        this.tactileOnly = false;
        this.initDuration = 4000;
    }
    get templateID() { return "AS3X_Touch"; }
    connectedCallback() {
        super.connectedCallback();
        this.mainDisplay = this.getChildById("MainDisplay");
        this.pfd = this.getChildById("PFD");
        this.mfd = this.getChildById("MFD");
        this.mainMfd = this.getChildById("MainMFD");
        this.pagesContainer = this.getChildById("PagesContainer");
        this.currentPageName = this.getChildById("currentPageName");
        this.pageList = this.getChildById("pageList");
        this.mfdBottomBar = this.getChildById("MFD_BottomBar");
        this.botLineTimer = this.getChildById("botLine_Timer");
        this.botLineOat = this.getChildById("botLine_Oat");
        this.botLineLocalTime = this.getChildById("botLine_LocalTime");
        this.leftInnerKnobText = this.getChildById("LeftInnerKnobText");
        this.leftOuterKnobText = this.getChildById("LeftOuterKnobText");
        this.rightInnerKnobText = this.getChildById("RightInnerKnobText");
        this.rightOuterKnobText = this.getChildById("RightOuterKnobText");
        this.mfdMapElement = this.getChildById("Map_Elements");
        this.mfdMapMapElement = this.mfdMapElement.getElementsByTagName("map-instrument")[0];
        this.addIndependentElementContainer(new NavSystemElementContainer("Warnings", "Warnings", new PFD_Warnings()));
        this.addIndependentElementContainer(new NavSystemElementContainer("MainMap", "Map_Elements", new AS3X_Touch_Map()));
        this.topBar = new AS3X_Touch_TopBar();
        this.addIndependentElementContainer(new NavSystemElementContainer("TopBar", "TopBar", this.topBar));
        this.transponderWindow = new NavSystemElementContainer("Transponder", "XPDR", new AS3X_Touch_Transponder());
        this.transponderWindow.setGPS(this);
        this.directToWindow = new NavSystemElementContainer("DirectTo", "DirectTo", new AS3X_Touch_DirectTo());
        this.directToWindow.setGPS(this);
        this.insertBeforWaypointWindow = new NavSystemElementContainer("insertBeforeWaypointWindow", "insertBeforeWaypointWindow", new AS3X_Touch_InsertBeforeWaypoint());
        this.insertBeforWaypointWindow.setGPS(this);
        this.audioPanelWindow = new NavSystemElementContainer("AudioPanel", "AudioPanel", new AS3X_Touch_AudioPanel());
        this.audioPanelWindow.setGPS(this);
        this.departureSelection = new NavSystemElementContainer("DepartureSelection", "DepartureSelection", new AS3X_Touch_DepartureSelection());
        this.departureSelection.setGPS(this);
        this.arrivalSelection = new NavSystemElementContainer("ArrivalSelection", "ArrivalSelection", new AS3X_Touch_ArrivalSelection());
        this.arrivalSelection.setGPS(this);
        this.approachSelection = new NavSystemElementContainer("ApproachSelection", "ApproachSelection", new AS3X_Touch_ApproachSelection());
        this.approachSelection.setGPS(this);
        this.frequencyKeyboard = new NavSystemElementContainer("frequencyKeyboard", "frequencyKeyboard", new AS3X_Touch_FrequencyKeyboard());
        this.frequencyKeyboard.setGPS(this);
        this.pfdMenu = new NavSystemElementContainer("PFD menu", "PFD_Menu", new AS3X_Touch_PFD_Menu());
        this.pfdMenu.setGPS(this);
        this.pageMenu = new NavSystemElementContainer("Page menu", "PageMenu", new AS3X_Touch_PageMenu());
        this.pageMenu.setGPS(this);
        this.fullKeyboard = new NavSystemElementContainer("Full Keyboard", "fullKeyboard", new AS3X_Touch_FullKeyboard());
        this.fullKeyboard.setGPS(this);
        this.duplicateWaypointSelection = new NavSystemElementContainer("Waypoint Duplicates", "WaypointDuplicateWindow", new AS3X_Touch_DuplicateWaypointSelection());
        this.duplicateWaypointSelection.setGPS(this);
        this.pageGroups = [
            new AS3X_Touch_PageGroup("MFD", this, [
                new AS3X_Touch_NavSystemPage("Map", "Map", new AS3X_Touch_MapContainer("Map"), "Map", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_SMALL_1.png"),
                new AS3X_Touch_NavSystemPage("Active FPL", "FPL", new NavSystemElementGroup([
                    new NavSystemTouch_ActiveFPL(true),
                    new AS3X_Touch_MapContainer("Afpl_Map")
                ]), "FPL", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_FLIGHT_PLAN_MED_1.png"),
                new AS3X_Touch_NavSystemPage("Procedures", "Procedures", new AS3X_Touch_Procedures(), "Proc", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_PROCEDURES_1.png")
            ], [
                new AS3X_Touch_MenuButton("Direct-To", "", this.switchToPopUpPage.bind(this, this.directToWindow), true),
                new AS3X_Touch_MenuButton("Nearest", "", this.SwitchToPageGroupMenu.bind(this, "NRST"), true),
                new AS3X_Touch_MenuButton("Com 1 Frequency", "", this.openFrequencyKeyboard.bind(this, "COM 1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.setCom1Freq.bind(this), "COM SPACING MODE:1"), false),
                new AS3X_Touch_MenuButton("Com 2 Frequency", "", this.openFrequencyKeyboard.bind(this, "COM 2 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:2", "COM STANDBY FREQUENCY:2", this.setCom2Freq.bind(this), "COM SPACING MODE:2"), false),
                new AS3X_Touch_MenuButton("Nav 1 Frequency", "", this.openFrequencyKeyboard.bind(this, "NAV 1 Standby", 108, 117.95, "NAV ACTIVE FREQUENCY:1", "NAV STANDBY FREQUENCY:1", this.setNav1Freq.bind(this), ""), false),
                new AS3X_Touch_MenuButton("Nav 2 Frequency", "", this.openFrequencyKeyboard.bind(this, "NAV 2 Standby", 108, 117.95, "NAV ACTIVE FREQUENCY:2", "NAV STANDBY FREQUENCY:2", this.setNav2Freq.bind(this), ""), false),
            ]),
            new AS3X_Touch_PageGroup("NRST", this, [
                new AS3X_Touch_NavSystemPage("Nearest Airport", "NearestAirport", new AS3X_Touch_NRST_Airport(), "Apt", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_AIRPORT.png"),
                new AS3X_Touch_NavSystemPage("Nearest VOR", "NearestVOR", new AS3X_Touch_NRST_VOR(), "VOR", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_VOR_2.png"),
                new AS3X_Touch_NavSystemPage("Nearest NDB", "NearestNDB", new AS3X_Touch_NRST_NDB(), "NDB", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_NDB.png"),
                new AS3X_Touch_NavSystemPage("Nearest Int", "NearestIntersection", new AS3X_Touch_NRST_Intersection(), "INT", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_INT.png"),
            ], [
                new AS3X_Touch_MenuButton("Main Menu", "", this.SwitchToPageGroupMenu.bind(this, "MFD"), true),
            ])
        ];
        if (SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") != 1) {
            SimVar.SetSimVarValue("K:COM_1_SPACING_MODE_SWITCH", "number", 0);
        }
        if (SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") != 1) {
            SimVar.SetSimVarValue("K:COM_2_SPACING_MODE_SWITCH", "number", 0);
        }
        this.pageNames = [];
        for (let i = 0; i < this.pageGroups[0].pages.length; i++) {
            let pageElem = document.createElement("div");
            pageElem.className = "page";
            pageElem.textContent = this.pageGroups[0].pages[i].shortName;
            this.pageNames.push(pageElem);
            this.pageList.appendChild(pageElem);
        }
        this.makeButton(this.mfdBottomBar, this.switchToPopUpPage.bind(this, this.pageMenu));
        this.makeButton(this.getChildById("Compass"), function () {
            if (this.popUpElement == this.pfdMenu) {
                this.closePopUpElement();
            }
            else {
                this.switchToPopUpPage(this.pfdMenu);
            }
        }.bind(this));
        this.maxUpdateBudget = 12;
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let displayModeConfig = this.instrumentXmlConfig.getElementsByTagName("DisplayMode");
            if (displayModeConfig.length > 0) {
                this.displayMode = displayModeConfig[0].textContent;
            }
            let reversionaryMode = null;
            reversionaryMode = this.instrumentXmlConfig.getElementsByTagName("ReversionaryMode")[0];
            if (reversionaryMode && reversionaryMode.textContent == "True") {
                this.handleReversionaryMode = true;
            }
            let tactileOnly = null;
            tactileOnly = this.instrumentXmlConfig.getElementsByTagName("TactileOnly")[0];
            if (tactileOnly && tactileOnly.textContent == "True") {
                this.tactileOnly = true;
                this.getChildById("LeftKnobInfos").style.display = "None";
                this.getChildById("RightKnobInfos").style.display = "None";
            }
        }
        switch (this.displayMode) {
            case "PFD":
                this.mainMfd.style.display = "None";
                this.addIndependentElementContainer(new AS3X_Touch_PFD());
                this.addIndependentElementContainer(new NavSystemElementContainer("EngineInfos", "EngineInfos", new GlassCockpit_XMLEngine()));
                this.getChildById("EngineInfos").style.display = "None";
                this.mainDisplay.setAttribute("state", "FullNoEngine");
                this.mfd.setAttribute("state", "HideNoEngine");
                this.engineDisplayed = false;
                this.m_isSplit = false;
                let pfdMaps = this.getElementsByClassName("PFDMap");
                for (let i = 0; i < pfdMaps.length; i++) {
                    pfdMaps[i].setAttribute("show-bing-map", "true");
                }
                break;
            case "MFD":
                this.pfd.style.display = "None";
                this.mainMap = new AS3X_Touch_MFD_Main();
                this.addIndependentElementContainer(this.mainMap);
                this.addIndependentElementContainer(new NavSystemElementContainer("EngineInfos", "EngineInfos", new GlassCockpit_XMLEngine()));
                this.mainDisplay.setAttribute("state", "Full");
                this.mfd.setAttribute("state", "Hide");
                this.engineDisplayed = true;
                this.m_isSplit = false;
                let mfdMaps = this.getElementsByClassName("MFDMap");
                for (let i = 0; i < mfdMaps.length; i++) {
                    mfdMaps[i].setAttribute("show-bing-map", "true");
                }
                break;
            case "Splitted":
                this.mainMfd.style.display = "None";
                this.addIndependentElementContainer(new AS3X_Touch_PFD());
                this.addIndependentElementContainer(new NavSystemElementContainer("EngineInfos", "EngineInfos", new GlassCockpit_XMLEngine()));
                this.engineDisplayed = true;
                this.m_isSplit = true;
                let splitMaps = this.getElementsByClassName("SplitMap");
                for (let i = 0; i < splitMaps.length; i++) {
                    splitMaps[i].setAttribute("show-bing-map", "true");
                }
                break;
        }
        this.updateKnobsLabels();
        this.topBar.updateFullSplitButton();
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    Update() {
        super.Update();
        if (this.handleReversionaryMode && this.displayMode == "PFD") {
            let reversionary = false;
            if (document.body.hasAttribute("reversionary")) {
                var attr = document.body.getAttribute("reversionary");
                if (attr == "true") {
                    reversionary = true;
                }
            }
            if (reversionary && !this.reversionaryMode) {
                this.reversionaryMode = true;
                this.engineDisplayed = true;
                this.getChildById("EngineInfos").style.display = "";
                this.mainDisplay.setAttribute("state", "Half");
                this.mfd.setAttribute("state", "Half");
                this.m_isSplit = true;
                this.updateKnobsLabels();
                this.topBar.updateFullSplitButton();
            }
            else if (!reversionary && this.reversionaryMode) {
                this.reversionaryMode = false;
                this.engineDisplayed = false;
                this.getChildById("EngineInfos").style.display = "None";
                this.mainDisplay.setAttribute("state", "FullNoEngine");
                this.mfd.setAttribute("state", "HideNoEngine");
                this.m_isSplit = false;
                this.updateKnobsLabels();
                this.topBar.updateFullSplitButton();
            }
        }
        if (this.lastPageIndex != this.getCurrentPageGroup().pageIndex || this.getCurrentPageGroup().name != this.lastPageGroup) {
            if (!isNaN(this.lastPageIndex)) {
                this.pageNames[this.lastPageIndex].setAttribute("state", "");
            }
            this.lastPageIndex = this.getCurrentPageGroup().pageIndex;
            this.lastPageGroup = this.getCurrentPageGroup().name;
            this.currentPageName.textContent = this.getCurrentPageGroup().pages[this.lastPageIndex].name;
            this.pageNames[this.lastPageIndex].setAttribute("state", "Selected");
        }
        Avionics.Utils.diffAndSet(this.botLineTimer, this.pfdMenu.element.getTimerValue());
        Avionics.Utils.diffAndSet(this.botLineOat, fastToFixed(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "Celsius"), 0) + "°C");
        let time = SimVar.GetSimVarValue("E:LOCAL TIME", "seconds");
        let seconds = Math.floor(time % 60);
        let minutes = Math.floor((time / 60) % 60);
        let hours = Math.floor(Math.min(time / 3600, 99));
        Avionics.Utils.diffAndSet(this.botLineLocalTime, (hours < 10 ? "0" : "") + hours + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
    }
    updateKnobsLabels() {
        if (this.displayMode == "MFD") {
            Avionics.Utils.diffAndSet(this.leftInnerKnobText, "Zoom Map");
            this.leftInnerKnobCB = this.zoomMapMain_CB.bind(this);
            Avionics.Utils.diffAndSet(this.leftOuterKnobText, "");
            this.leftOuterKnobCB = this.zoomMapMain_CB.bind(this);
        }
        else {
            Avionics.Utils.diffAndSet(this.leftInnerKnobText, "Heading");
            this.leftInnerKnobCB = this.heading_CB.bind(this);
            Avionics.Utils.diffAndSet(this.leftOuterKnobText, "Altitude");
            this.leftOuterKnobCB = this.altitude_CB.bind(this);
        }
        if (this.isSplit()) {
            Avionics.Utils.diffAndSet(this.rightInnerKnobText, "Zoom Map");
            this.rightInnerKnobCB = this.zoomMap_CB.bind(this);
            Avionics.Utils.diffAndSet(this.rightOuterKnobText, "Select Page");
            this.rightOuterKnobCB = this.selectPage_CB.bind(this);
        }
        else {
            if (this.displayMode == "MFD") {
                Avionics.Utils.diffAndSet(this.rightInnerKnobText, "Zoom Map");
                this.rightInnerKnobCB = this.zoomMapMain_CB.bind(this);
                Avionics.Utils.diffAndSet(this.rightOuterKnobText, "");
                this.rightOuterKnobCB = this.zoomMapMain_CB.bind(this);
            }
            else {
                Avionics.Utils.diffAndSet(this.rightInnerKnobText, "Course");
                this.rightInnerKnobCB = this.crs_CB.bind(this);
                Avionics.Utils.diffAndSet(this.rightOuterKnobText, "Baro");
                this.rightOuterKnobCB = this.baro_CB.bind(this);
            }
        }
    }
    openFrequencyKeyboard(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, _frequencySpacingModeSimvar) {
        this.frequencyKeyboard.getElementOfType(NavSystemTouch_FrequencyKeyboard).setContext(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, this.getCurrentPage(), _frequencySpacingModeSimvar);
        this.switchToPopUpPage(this.frequencyKeyboard);
    }
    getFullKeyboard() {
        return this.fullKeyboard;
    }
    setCom1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
        }
    }
    setCom2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM2_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 2);
        }
    }
    setNav1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:NAV1_STBY_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "Bool", 1);
        }
    }
    setNav2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:NAV2_STBY_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:NAV2_RADIO_SWAP", "Bool", 1);
        }
    }
    heading_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:HEADING_BUG_INC", "number", 0);
        }
        else {
            SimVar.SetSimVarValue("K:HEADING_BUG_DEC", "number", 0);
        }
    }
    altitude_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 0);
        }
        else {
            SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 0);
        }
    }
    baro_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
        }
        else {
            SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
        }
    }
    crs_CB(_inc) {
        let cdiSrc = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
        if (_inc) {
            if (cdiSrc == 1) {
                SimVar.SetSimVarValue("K:VOR1_OBI_INC", "number", 0);
            }
            else if (cdiSrc == 2) {
                SimVar.SetSimVarValue("K:VOR2_OBI_INC", "number", 0);
            }
        }
        else {
            if (cdiSrc == 1) {
                SimVar.SetSimVarValue("K:VOR1_OBI_DEC", "number", 0);
            }
            else if (cdiSrc == 2) {
                SimVar.SetSimVarValue("K:VOR2_OBI_DEC", "number", 0);
            }
        }
    }
    zoomMap_CB(_inc) {
        if (_inc) {
            this.mfdMapMapElement.onEvent("RANGE_INC");
        }
        else {
            this.mfdMapMapElement.onEvent("RANGE_DEC");
        }
    }
    zoomMapMain_CB(_inc) {
        if (_inc) {
            this.mainMap.onEvent("RANGE_INC");
        }
        else {
            this.mainMap.onEvent("RANGE_DEC");
        }
    }
    selectPage_CB(_inc) {
        if (_inc) {
            this.computeEvent("NavigationSmallInc");
        }
        else {
            this.computeEvent("NavigationSmallDec");
        }
    }
    computeEvent(_event) {
        super.computeEvent(_event);
        switch (_event) {
            case "Menu_Push":
                if (this.popUpElement == this.pageMenu) {
                    this.closePopUpElement();
                }
                else {
                    this.switchToPopUpPage(this.pageMenu);
                }
                break;
            case "Back_Push":
                if (this.popUpElement) {
                    this.closePopUpElement();
                }
                else {
                    this.SwitchToMenuName("MFD");
                }
                break;
            case "NRST_Push":
                if (this.popUpElement) {
                    this.closePopUpElement();
                }
                if (this.getCurrentPageGroup().name == "NRST") {
                    this.SwitchToMenuName("MFD");
                }
                else {
                    this.SwitchToMenuName("NRST");
                }
                break;
            case "DirectTo_Push":
                if (this.popUpElement == this.directToWindow) {
                    this.closePopUpElement();
                }
                else {
                    if (this.popUpElement) {
                        this.closePopUpElement;
                    }
                    this.switchToPopUpPage(this.directToWindow);
                }
                break;
            case "Knob_Inner_L_INC":
                this.leftInnerKnobCB(true);
                break;
            case "Knob_Inner_L_DEC":
                this.leftInnerKnobCB(false);
                break;
            case "Knob_Inner_R_INC":
                this.rightInnerKnobCB(true);
                break;
            case "Knob_Inner_R_DEC":
                this.rightInnerKnobCB(false);
                break;
            case "Knob_Outer_L_INC":
                this.leftOuterKnobCB(true);
                break;
            case "Knob_Outer_L_DEC":
                this.leftOuterKnobCB(false);
                break;
            case "Knob_Outer_R_INC":
                this.rightOuterKnobCB(true);
                break;
            case "Knob_Outer_R_DEC":
                this.rightOuterKnobCB(false);
                break;
        }
    }
    switchToPopUpPage(_pageContainer, _PopUpCloseCallback = null) {
        super.switchToPopUpPage(_pageContainer, _PopUpCloseCallback);
        if (!this.m_isSplit) {
            Avionics.Utils.diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
            Avionics.Utils.diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
        }
    }
    closePopUpElement() {
        super.closePopUpElement();
        if (!this.m_isSplit) {
            Avionics.Utils.diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Full" : "FullNoEngine");
            Avionics.Utils.diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Hide" : "HideNoEngine");
        }
    }
    switchHalfFull() {
        this.m_isSplit = !this.m_isSplit;
        Avionics.Utils.diffAndSetAttribute(this.mainDisplay, "state", this.m_isSplit || this.popUpElement != null ? this.engineDisplayed ? "Half" : "HalfNoEngine" : this.engineDisplayed ? "Full" : "FullNoEngine");
        Avionics.Utils.diffAndSetAttribute(this.mfd, "state", this.m_isSplit || this.popUpElement != null ? this.engineDisplayed ? "Half" : "HalfNoEngine" : this.engineDisplayed ? "Hide" : "HideNoEngine");
        this.updateKnobsLabels();
        this.topBar.updateFullSplitButton();
    }
    isSplit() {
        return this.m_isSplit;
    }
    forceSplit(_split) {
        if (_split != this.m_isSplit) {
            this.switchHalfFull();
        }
    }
    SwitchToMenuName(_name) {
        super.SwitchToMenuName(_name);
        if (!this.m_isSplit && _name != "MFD") {
            Avionics.Utils.diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
            Avionics.Utils.diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Half" : "HalfNoEngine");
        }
        else if (!this.m_isSplit) {
            Avionics.Utils.diffAndSetAttribute(this.mainDisplay, "state", this.engineDisplayed ? "Full" : "FullNoEngine");
            Avionics.Utils.diffAndSetAttribute(this.mfd, "state", this.engineDisplayed ? "Hide" : "HideNoEngine");
        }
        this.updatePageList();
    }
    SwitchToPageName(_menu, _page) {
        super.SwitchToPageName(_menu, _page);
        this.updatePageList();
    }
    updatePageList() {
        for (let i = 0; i < this.pageGroups[this.currentPageGroupIndex].pages.length; i++) {
            if (i >= this.pageNames.length) {
                let pageElem = document.createElement("div");
                pageElem.className = "page";
                this.pageNames.push(pageElem);
                this.pageList.appendChild(pageElem);
            }
            else {
                this.pageNames[i].style.display = "block";
            }
            this.pageNames[i].textContent = this.pageGroups[this.currentPageGroupIndex].pages[i].shortName;
        }
        for (let i = this.pageGroups[this.currentPageGroupIndex].pages.length; i < this.pageNames.length; i++) {
            this.pageNames[i].style.display = "none";
        }
    }
    SwitchToPageGroupMenu(_menu) {
        this.closePopUpElement();
        this.SwitchToMenuName(_menu);
        this.switchToPopUpPage(this.pageMenu);
    }
}
class AS3X_Touch_PFD extends NavSystemElementContainer {
    constructor() {
        super("PFD", "PFD", null);
        this.attitude = new PFD_Attitude();
        this.mapInstrument = new MapInstrumentElement();
        this.element = new NavSystemElementGroup([
            new PFD_Altimeter(),
            new PFD_Airspeed(),
            new PFD_Compass(),
            this.attitude,
            this.mapInstrument,
            new AS3X_Touch_elevatorTrim(),
            new PFD_RadarAltitude(),
            new PFD_AutopilotDisplay()
        ]);
        this.mapInstrument.setGPS(this.gps);
    }
    init() {
        super.init();
        this.attitude.svg.setAttribute("background", "false");
    }
}
class AS3X_Touch_MFD_Main extends NavSystemElementContainer {
    constructor() {
        super("MainMFD", "MainMFD", null);
        this.element = new AS3X_Touch_Map();
    }
}
class AS3X_Touch_TopBar extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isIdent = false;
    }
    init(root) {
        this.comActiveFreq = this.gps.getChildById("com_active");
        this.comActiveIdent = this.gps.getChildById("com_active_ident");
        this.comStbyFreq = this.gps.getChildById("com_standby");
        this.comStbyIdent = this.gps.getChildById("com_standby_ident");
        this.xpdrMode = this.gps.getChildById("xpdr_mode");
        this.xpdrCode = this.gps.getChildById("xpdr_code");
        this.audioButton = this.gps.getChildById("audio_btn");
        this.wpt = this.gps.getChildById("wpt");
        this.brg = this.gps.getChildById("brg");
        this.dist = this.gps.getChildById("dist");
        this.ete = this.gps.getChildById("ete");
        this.gs = this.gps.getChildById("gs");
        this.trk = this.gps.getChildById("trk");
        this.xpdrButton = this.gps.getChildById("xpdr_btn");
        this.identButton = this.gps.getChildById("ident_btn");
        this.identButton_Status = this.identButton.getElementsByClassName("statusBar")[0];
        this.comActiveButton = this.gps.getChildById("com_active_btn");
        this.comStandbyButton = this.gps.getChildById("com_standby_btn");
        this.fullSplitButon = this.gps.getChildById("full_split_switch_button");
        this.fullSplitButon_title = this.fullSplitButon.getElementsByClassName("title")[0];
        this.gps.makeButton(this.xpdrButton, this.SwitchOrClosePopup.bind(this, this.gps.transponderWindow));
        this.gps.makeButton(this.identButton, this.ident.bind(this));
        this.gps.makeButton(this.audioButton, this.SwitchOrClosePopup.bind(this, this.gps.audioPanelWindow));
        this.gps.makeButton(this.comActiveButton, SimVar.SetSimVarValue.bind(this, "K:COM_STBY_RADIO_SWAP", "number", 1));
        this.gps.makeButton(this.comStandbyButton, this.gps.openFrequencyKeyboard.bind(this.gps, "COM 1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.gps.setCom1Freq.bind(this.gps), "COM SPACING MODE:1"));
        this.gps.makeButton(this.fullSplitButon, this.switchFullSplit.bind(this));
        this.updateFullSplitButton();
    }
    SwitchOrClosePopup(_popuPage) {
        if (this.gps.popUpElement == _popuPage) {
            this.gps.closePopUpElement();
        }
        else {
            this.gps.switchToPopUpPage(_popuPage);
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.comActiveFreq, SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz").toFixed(3));
        Avionics.Utils.diffAndSet(this.comStbyFreq, SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz").toFixed(3));
        Avionics.Utils.diffAndSet(this.comActiveIdent, SimVar.GetSimVarValue("HSI STATION IDENT", "string"));
        Avionics.Utils.diffAndSet(this.xpdrCode, ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4));
        let xpdrState = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        switch (xpdrState) {
            case 0:
                Avionics.Utils.diffAndSet(this.xpdrMode, "OFF");
                SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
                break;
            case 1:
                Avionics.Utils.diffAndSet(this.xpdrMode, "STBY");
                break;
            case 2:
                Avionics.Utils.diffAndSet(this.xpdrMode, "TEST");
                break;
            case 3:
                Avionics.Utils.diffAndSet(this.xpdrMode, "ON");
                break;
            case 4:
                Avionics.Utils.diffAndSet(this.xpdrMode, "ALT");
                break;
        }
        let nextWaypoint = this.gps.currFlightPlanManager.getActiveWaypoint(false, true);
        if (nextWaypoint) {
            Avionics.Utils.diffAndSet(this.wpt, nextWaypoint.ident);
            Avionics.Utils.diffAndSet(this.brg, fastToFixed(this.gps.currFlightPlanManager.getBearingToActiveWaypoint(), 0) + "°m");
            Avionics.Utils.diffAndSet(this.dist, this.gps.currFlightPlanManager.getDistanceToActiveWaypoint().toFixed(1) + "nm");
            var ete = this.gps.currFlightPlanManager.getETEToActiveWaypoint();
            Avionics.Utils.diffAndSet(this.ete, ete >= 60 * 60 ? Math.floor(ete / 3600) + "+" + ((ete % 3600 / 60) < 10 ? "0" : "") + Math.floor(ete % 3600 / 60) : Math.floor(ete / 60) + ":" + (ete % 60 < 10 ? "0" : "") + ete % 60);
        }
        else {
            Avionics.Utils.diffAndSet(this.wpt, "____");
            Avionics.Utils.diffAndSet(this.brg, "___°m");
            Avionics.Utils.diffAndSet(this.dist, "__._nm");
            Avionics.Utils.diffAndSet(this.ete, "__:__");
        }
        Avionics.Utils.diffAndSet(this.gs, SimVar.GetSimVarValue("GPS GROUND SPEED", "knots").toFixed(1) + "kt");
        Avionics.Utils.diffAndSet(this.trk, fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees"), 0) + "°m");
        if (this.isIdent) {
            if (Date.now() - this.identStartTime > 17000 || SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") < 3) {
                this.isIdent = false;
                this.identButton_Status.setAttribute("state", "Inactive");
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    switchFullSplit() {
        this.gps.switchHalfFull();
    }
    updateFullSplitButton() {
        if (this.fullSplitButon_title) {
            this.fullSplitButon_title.innerText = this.gps.isSplit() ? "Full" : "Split";
        }
    }
    ident() {
        if (SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") > 2) {
            this.isIdent = true;
            this.identStartTime = Date.now();
            this.identButton_Status.setAttribute("state", "Active");
        }
    }
}
class AS3X_Touch_Transponder extends NavSystemTouch_Transponder {
    init(root) {
        super.init(root);
        this.cancelTouch = this.gps.getChildById("transponder_Cancel");
        this.enterTouch = this.gps.getChildById("transponder_Enter");
        this.gps.makeButton(this.cancelTouch, this.cancelCode.bind(this));
        this.gps.makeButton(this.enterTouch, this.validateCode.bind(this));
    }
}
class AS3X_Touch_MapContainer extends NavSystemElement {
    constructor(_containerId) {
        super();
        this.containerId = _containerId;
    }
    init(root) {
        this.mapContainerElement = this.gps.getChildById(this.containerId);
    }
    onEnter() {
        this.mapContainerElement.appendChild(this.gps.mfdMapElement);
        this.gps.mfdMapMapElement.resize();
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3X_Touch_Map extends MapInstrumentElement {
    init(root) {
        super.init(root);
        this.mapPlus = root.querySelector(".mapPlus");
        this.mapLess = root.querySelector(".mapLess");
        this.mapCenter = root.querySelector(".mapCenter");
        this.gps.makeButton(this.mapPlus, this.instrument.onEvent.bind(this.instrument, "RANGE_DEC"));
        this.gps.makeButton(this.mapLess, this.instrument.onEvent.bind(this.instrument, "RANGE_INC"));
        this.gps.makeButton(this.mapCenter, this.centerOnPlane.bind(this));
        this.instrument.addEventListener("mousedown", this.moveMode.bind(this));
        this.instrument.supportMouseWheel(false);
    }
    moveMode() {
        this.instrument.setAttribute("bing-mode", "vfr");
        this.mapCenter.setAttribute("state", "Active");
    }
    centerOnPlane() {
        this.instrument.setCenteredOnPlane();
        this.mapCenter.setAttribute("state", "Inactive");
    }
}
class AS3X_Touch_PageMenu_Button {
}
class AS3X_Touch_PageMenu extends NavSystemElement {
    init(root) {
        this.root = root;
        this.buttons = [];
        this.menuElements = root.getElementsByClassName("menuElements")[0];
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        let pageGroup = this.gps.getCurrentPageGroup();
        for (let i = 0; i < (pageGroup.pages.length + pageGroup.additionalMenuButtons.length); i++) {
            if (i >= this.buttons.length) {
                let button = new AS3X_Touch_PageMenu_Button();
                this.buttons.push(button);
                button.base = document.createElement("div");
                button.base.setAttribute("class", "gradientButton");
                button.image = document.createElement("img");
                button.image.setAttribute("class", "img");
                button.title = document.createElement("div");
                button.title.setAttribute("class", "title");
                button.base.appendChild(button.image);
                button.base.appendChild(button.title);
                this.menuElements.appendChild(button.base);
                this.gps.makeButton(button.base, this.switchToPage.bind(this, i));
            }
            else {
                this.buttons[i].base.style.display = "";
            }
            if (i < pageGroup.pages.length) {
                this.buttons[i].image.setAttribute("src", pageGroup.pages[i].imagePath);
                this.buttons[i].title.textContent = pageGroup.pages[i].name;
            }
            else {
                if (pageGroup.additionalMenuButtons[i - pageGroup.pages.length].fullTactileOnly && !this.gps.tactileOnly) {
                    this.buttons[i].base.style.display = "none";
                }
                else {
                    this.buttons[i].image.setAttribute("src", pageGroup.additionalMenuButtons[i - pageGroup.pages.length].imagePath);
                    this.buttons[i].title.textContent = pageGroup.additionalMenuButtons[i - pageGroup.pages.length].name;
                }
            }
        }
        for (let i = pageGroup.pages.length + pageGroup.additionalMenuButtons.length; i < this.buttons.length; i++) {
            this.buttons[i].base.style.display = "none";
        }
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    switchToPage(i) {
        let pageGroup = this.gps.getCurrentPageGroup();
        if (i < pageGroup.pages.length) {
            this.gps.closePopUpElement();
            this.gps.getCurrentPageGroup().goToPage(this.gps.getCurrentPageGroup().pages[i].name);
            this.gps.forceSplit(true);
        }
        else {
            pageGroup.additionalMenuButtons[i - pageGroup.pages.length].callback();
        }
    }
}
class AS3X_Touch_FullKeyboard extends NavSystemTouch_FullKeyboard {
    init(_root) {
        super.init(_root);
        this.cancelButton = this.gps.getChildById("FK_Cancel");
        this.enterButton = this.gps.getChildById("FK_Enter");
        this.gps.makeButton(this.cancelButton, this.cancel.bind(this));
        this.gps.makeButton(this.enterButton, this.validate.bind(this));
    }
    setContext(_endCallback, _types = "AVNW") {
        super.setContext(_endCallback, _types);
        this.lastPopUp = this.gps.popUpElement;
    }
    cancel() {
        this.gps.closePopUpElement();
    }
    validate() {
        let nbMatched = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.gps.instrumentIdentifier);
        if (nbMatched > 1) {
            this.gps.duplicateWaypointSelection.element.setContext(this.endCallback, this.lastPopUp);
            this.gps.closePopUpElement();
            this.gps.switchToPopUpPage(this.gps.duplicateWaypointSelection);
        }
        else {
            this.endCallback(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.gps.instrumentIdentifier));
            this.gps.closePopUpElement();
            if (this.lastPopUp) {
                this.gps.switchToPopUpPage(this.lastPopUp);
            }
        }
        return true;
    }
}
class AS3X_Touch_DuplicateWaypointSelection extends NavSystemTouch_DuplicateWaypointSelection {
    constructor() {
        super(...arguments);
        this.lastPopup = null;
    }
    setContext(_endCallback, _lastPopUp = null) {
        super.setContext(_endCallback);
        this.lastPopup = _lastPopUp;
    }
    onButtonClick(_index) {
        super.onButtonClick(_index);
        this.gps.closePopUpElement();
        if (this.lastPopup) {
            this.gps.switchToPopUpPage(this.lastPopup);
        }
    }
}
class AS3X_Touch_elevatorTrim extends NavSystemElement {
    init(root) {
        this.element = root.getElementsByTagName("glasscockpit-elevator-trim")[0];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.element.setAttribute("trim", (SimVar.GetSimVarValue("ELEVATOR TRIM PCT", "percent") / 100).toString());
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3X_Touch_MenuButton {
    constructor(_name, _imagePath, _callback, _fullTactileOnly = false) {
        this.fullTactileOnly = false;
        this.imagePath = _imagePath;
        this.name = _name;
        this.callback = _callback;
        this.fullTactileOnly = _fullTactileOnly;
    }
}
class AS3X_Touch_PageGroup extends NavSystemPageGroup {
    constructor(_name, _gps, _pages, _additionalButtons = []) {
        super(_name, _gps, _pages);
        this.additionalMenuButtons = [];
        this.additionalMenuButtons = _additionalButtons;
    }
}
class AS3X_Touch_NavSystemPage extends NavSystemPage {
    constructor(_name, _htmlElemId, _element, _shortName, _imagePath) {
        super(_name, _htmlElemId, _element);
        this.shortName = _shortName;
        this.imagePath = _imagePath;
    }
}
class AS3X_Touch_DirectTo extends NavSystemTouch_DirectTo {
    init(_root) {
        super.init(_root);
        this.window = _root;
    }
    onEnter() {
        super.onEnter();
        this.window.setAttribute("state", "Active");
    }
    onExit() {
        super.onExit();
        this.window.setAttribute("state", "Inactive");
    }
    openKeyboard() {
        this.gps.fullKeyboard.getElementOfType(AS3X_Touch_FullKeyboard).setContext(this.endKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.fullKeyboard);
    }
    back() {
        this.gps.closePopUpElement();
    }
}
class AS3X_Touch_PFD_Menu extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.timerStartTime = -1;
        this.isTimerOn = false;
        this.pauseTime = 0;
    }
    init(root) {
        this.window = root;
        this.cdiSource = this.gps.getChildById("cdi_source_Button");
        this.leftBearing = this.gps.getChildById("left_bearing_button");
        this.rightBearing = this.gps.getChildById("right_bearing_button");
        this.timerStartStop = this.gps.getChildById("timer_startStop_button");
        this.timerReset = this.gps.getChildById("timer_reset_button");
        this.cdiSource_value = this.cdiSource.getElementsByClassName("mainText")[0];
        this.leftBearing_value = this.leftBearing.getElementsByClassName("mainText")[0];
        this.rightBearing_value = this.rightBearing.getElementsByClassName("mainText")[0];
        this.timerStartStop_value = this.timerStartStop.getElementsByClassName("value")[0];
        this.timerStartStop_action = this.timerStartStop.getElementsByClassName("topTitle")[0];
        this.timerReset_value = this.timerReset.getElementsByClassName("mainText")[0];
        this.hsi = this.gps.getChildById("Compass");
        this.gps.makeButton(this.cdiSource, this.gps.computeEvent.bind(this.gps, "SoftKey_CDI"));
        this.gps.makeButton(this.leftBearing, this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG1"));
        this.gps.makeButton(this.rightBearing, this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG2"));
        this.gps.makeButton(this.timerStartStop, this.timer_Toggle.bind(this));
        this.gps.makeButton(this.timerReset, this.timer_Reset.bind(this));
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.cdiSource_value, this.hsi.getAttribute("nav_source"));
        if (this.hsi && this.hsi.getAttribute("show_bearing1") == "true") {
            Avionics.Utils.diffAndSet(this.leftBearing_value, this.hsi.getAttribute("bearing1_source"));
        }
        else {
            Avionics.Utils.diffAndSet(this.leftBearing_value, "Off");
        }
        if (this.hsi && this.hsi.getAttribute("show_bearing2") == "true") {
            Avionics.Utils.diffAndSet(this.rightBearing_value, this.hsi.getAttribute("bearing2_source"));
        }
        else {
            Avionics.Utils.diffAndSet(this.rightBearing_value, "Off");
        }
        Avionics.Utils.diffAndSet(this.timerStartStop_value, this.getTimerValue());
    }
    getTimerValue() {
        if (this.timerStartTime == -1) {
            return "00:00:00";
        }
        else {
            let time;
            if (this.isTimerOn) {
                time = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.timerStartTime;
            }
            else {
                time = this.pauseTime - this.timerStartTime;
            }
            let seconds = Math.floor(time % 60);
            let minutes = Math.floor((time / 60) % 60);
            let hours = Math.floor(Math.min(time / 3600, 99));
            return (hours < 10 ? "0" : "") + hours + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds;
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    timer_Toggle() {
        if (this.isTimerOn) {
            this.isTimerOn = false;
            this.timerStartStop_action.textContent = "Start";
            this.pauseTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds");
        }
        else {
            if (this.timerStartTime == -1) {
                this.timerStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds");
            }
            else {
                this.timerStartTime = this.timerStartTime + SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.pauseTime;
            }
            this.isTimerOn = true;
            this.timerStartStop_action.textContent = "Stop";
        }
    }
    timer_Reset() {
        this.timerStartTime = -1;
        this.pauseTime = 0;
        this.isTimerOn = false;
        this.timerStartStop_action.textContent = "Start";
    }
}
class AS3X_Touch_NRST_Airport extends NavSystemTouch_NRST_Airport {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.airportLines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_NRST_NDB extends NavSystemTouch_NRST_NDB {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.ndbs[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_NRST_VOR extends NavSystemTouch_NRST_VOR {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.vors[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_NRST_Intersection extends NavSystemTouch_NRST_Intersection {
    directTo() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.intersections[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
        this.gps.computeEvent("DirectTo_Push");
    }
    insertInFpl() {
        this.gps.insertBeforWaypointWindow.getElementOfType(AS3X_Touch_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class AS3X_Touch_WaypointButtonElement {
    constructor() {
        this.base = window.document.createElement("div");
        this.base.setAttribute("class", "line");
        {
            this.button = window.document.createElement("div");
            this.button.setAttribute("class", "gradientButton");
            {
                this.ident = window.document.createElement("div");
                this.ident.setAttribute("class", "mainValue");
                this.button.appendChild(this.ident);
                this.name = window.document.createElement("div");
                this.name.setAttribute("class", "title");
                this.button.appendChild(this.name);
                this.symbol = window.document.createElement("img");
                this.symbol.setAttribute("class", "symbol");
                this.button.appendChild(this.symbol);
            }
            this.base.appendChild(this.button);
        }
    }
}
class AS3X_Touch_InsertBeforeWaypoint extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.elements = [];
    }
    init(root) {
        this.window = root;
        this.tableContainer = root.getElementsByClassName("Container")[0];
        this.table = this.tableContainer.getElementsByClassName("WayPoints")[0];
        this.endButtonLine = this.table.getElementsByClassName("EndButtonLine")[0];
        this.endButton = this.gps.getChildById("EndButton");
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.tableContainer;
        this.scrollElement.elementSize = (this.elements.length > 0 ? this.elements[1].base.getBoundingClientRect().height : 0);
        this.gps.makeButton(this.endButton, this.endButtonClick.bind(this));
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = (this.elements.length > 0 ? this.elements[1].base.getBoundingClientRect().height : 0);
        }
        this.scrollElement.update();
        for (let i = 0; i < this.gps.currFlightPlanManager.getWaypointsCount(); i++) {
            if (this.elements.length < i + 1) {
                let newElem = new AS3X_Touch_WaypointButtonElement();
                this.gps.makeButton(newElem.button, this.elementClick.bind(this, i));
                this.table.insertBefore(newElem.base, this.endButtonLine);
                this.elements.push(newElem);
            }
            let infos = this.gps.currFlightPlanManager.getWaypoint(i).infos;
            Avionics.Utils.diffAndSet(this.elements[i].ident, infos.ident);
            Avionics.Utils.diffAndSet(this.elements[i].name, infos.name);
            let symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.elements[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
        }
        for (let i = this.gps.currFlightPlanManager.getWaypointsCount(); i < this.elements.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.elements[i].base, "state", "Inactive");
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_endCallback) {
        this.endCallback = _endCallback;
    }
    elementClick(_index) {
        if (this.endCallback) {
            this.endCallback(_index);
        }
        this.gps.closePopUpElement();
    }
    endButtonClick() {
        this.elementClick(this.elements.length);
    }
}
class AS3X_Touch_FrequencyKeyboard extends NavSystemTouch_FrequencyKeyboard {
    init(_root) {
        super.init(_root);
        this.enterButton = _root.querySelector("#FK_Enter");
        this.cancelButton = _root.querySelector("#FK_Cancel");
        this.gps.makeButton(this.enterButton, this.validateEdit.bind(this));
        this.gps.makeButton(this.cancelButton, this.cancelEdit.bind(this));
    }
    cancelEdit() {
        this.gps.closePopUpElement();
    }
    validateEdit() {
        this.endCallback(this.inputIndex != -1 ? this.currentInput : SimVar.GetSimVarValue(this.stbyFreqSimVar, "MHz"), false);
        this.cancelEdit();
    }
    validateAndTransferEdit() {
        this.endCallback(this.inputIndex != -1 ? this.currentInput : SimVar.GetSimVarValue(this.stbyFreqSimVar, "MHz"), true);
        this.inputIndex = -1;
    }
}
class AS3X_Touch_AudioPanel extends NavSystemElement {
    init(root) {
        this.root = root;
        this.com1 = this.gps.getChildById("AudioPanel_Com1");
        this.com2 = this.gps.getChildById("AudioPanel_Com2");
        this.com1Mic = this.gps.getChildById("AudioPanel_Com1Mic");
        this.com2Mic = this.gps.getChildById("AudioPanel_Com2Mic");
        this.nav1 = this.gps.getChildById("AudioPanel_Nav1");
        this.nav2 = this.gps.getChildById("AudioPanel_Nav2");
        this.speaker = this.gps.getChildById("AudioPanel_Speaker");
        this.gps.makeButton(this.com1, this.com1PushButton.bind(this));
        this.gps.makeButton(this.com2, this.com2PushButton.bind(this));
        this.gps.makeButton(this.com1Mic, this.com1MicPushButton.bind(this));
        this.gps.makeButton(this.com2Mic, this.com2MicPushButton.bind(this));
        this.gps.makeButton(this.nav1, this.nav1PushButton.bind(this));
        this.gps.makeButton(this.nav2, this.nav2PushButton.bind(this));
        this.gps.makeButton(this.speaker, this.speakerPushButton.bind(this));
    }
    com1PushButton() {
        SimVar.SetSimVarValue("K:COM1_RECEIVE_SELECT", "Bool", SimVar.GetSimVarValue("COM RECEIVE:1", "Bool") != 0 ? 0 : 1);
    }
    com2PushButton() {
        SimVar.SetSimVarValue("K:COM2_RECEIVE_SELECT", "Bool", SimVar.GetSimVarValue("COM RECEIVE:2", "Bool") != 0 ? 0 : 1);
    }
    com1MicPushButton() {
        SimVar.SetSimVarValue("K:PILOT_TRANSMITTER_SET", "number", 0);
        SimVar.SetSimVarValue("K:COPILOT_TRANSMITTER_SET", "number", 0);
    }
    com2MicPushButton() {
        SimVar.SetSimVarValue("K:PILOT_TRANSMITTER_SET", "number", 1);
        SimVar.SetSimVarValue("K:COPILOT_TRANSMITTER_SET", "number", 1);
    }
    nav1PushButton() {
        SimVar.SetSimVarValue("K:RADIO_VOR1_IDENT_TOGGLE", "number", 0);
    }
    nav2PushButton() {
        SimVar.SetSimVarValue("K:RADIO_VOR2_IDENT_TOGGLE", "number", 0);
    }
    speakerPushButton() {
        SimVar.SetSimVarValue("K:TOGGLE_SPEAKER", "number", 0);
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSetAttribute(this.com1, "state", SimVar.GetSimVarValue("COM RECEIVE:1", "bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.com2, "state", SimVar.GetSimVarValue("COM RECEIVE:2", "bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.com1Mic, "state", SimVar.GetSimVarValue("COM TRANSMIT:1", "bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.com2Mic, "state", SimVar.GetSimVarValue("COM TRANSMIT:2", "bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.nav1, "state", SimVar.GetSimVarValue("NAV SOUND:1", "bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.nav2, "state", SimVar.GetSimVarValue("NAV SOUND:2", "bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.speaker, "state", SimVar.GetSimVarValue("SPEAKER ACTIVE", "bool") ? "Active" : "");
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
}
class AS3X_Touch_Procedures extends NavSystemTouch_Procedures {
    openDeparture() {
        this.gps.switchToPopUpPage(this.gps.departureSelection);
    }
    openArrival() {
        this.gps.switchToPopUpPage(this.gps.arrivalSelection);
    }
    openApproach() {
        this.gps.switchToPopUpPage(this.gps.approachSelection);
    }
}
class AS3X_Touch_DepartureSelection extends NavSystemTouch_DepartureSelection {
    init(root) {
        super.init(root);
        this.root = root;
    }
    onEnter() {
        super.onEnter();
        this.root.setAttribute("state", "Active");
    }
    onExit() {
        super.onExit();
        this.root.setAttribute("state", "Inactive");
    }
    selectDeparture(_index) {
        super.selectDeparture(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectEnrouteTransition(_index) {
        super.selectEnrouteTransition(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectRunway(_index) {
        super.selectRunway(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    close() {
        this.gps.closePopUpElement();
    }
}
class AS3X_Touch_ArrivalSelection extends NavSystemTouch_ArrivalSelection {
    init(root) {
        super.init(root);
        this.root = root;
    }
    onEnter() {
        super.onEnter();
        this.root.setAttribute("state", "Active");
    }
    onExit() {
        super.onExit();
        this.root.setAttribute("state", "Inactive");
    }
    selectArrival(_index) {
        super.selectArrival(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectEnrouteTransition(_index) {
        super.selectEnrouteTransition(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectRunway(_index) {
        super.selectRunway(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    close() {
        this.gps.closePopUpElement();
    }
}
class AS3X_Touch_ApproachSelection extends NavSystemTouch_ApproachSelection {
    init(root) {
        super.init(root);
        this.root = root;
    }
    onEnter() {
        super.onEnter();
        this.root.setAttribute("state", "Active");
    }
    onExit() {
        super.onExit();
        this.root.setAttribute("state", "Inactive");
    }
    selectApproach(_index) {
        super.selectApproach(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    selectTransition(_index) {
        super.selectTransition(_index);
        this.gps.switchToPopUpPage(this.container);
    }
    close() {
        this.gps.closePopUpElement();
    }
}
registerInstrument("as3x-touch-element", AS3X_Touch);
//# sourceMappingURL=AS3X_Touch.js.map