class AS3000_TSC_NavButton_Data {
    constructor() {
        this.isActive = false;
    }
}
class AS3000_TSC_NavButton {
    constructor(_id, _gps) {
        this.noData = new AS3000_TSC_NavButton_Data();
        this.gps = _gps;
        this.button = this.gps.getChildById(_id);
        if (this.button) {
            this.text = this.button.getElementsByClassName("title")[0];
            this.img = this.button.getElementsByClassName("img")[0];
        }
        this.currentState = this.noData;
        this.savedData = this.noData;
        this.gps.makeButton(this.button, this.onClick.bind(this));
    }
    setState(_data, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.savedData = _data;
        }
        if (_data.isActive) {
            this.currentState = _data;
            this.text.innerHTML = _data.title;
            this.img.setAttribute("src", _data.imagePath);
            this.button.setAttribute("state", "");
        } else {
            this.button.setAttribute("state", "Inactive");
        }
    }
    deactivate(_fromPopUp = false) {
        if (_fromPopUp) {
            this.setState(this.savedData);
        } else {
            this.setState(this.noData);
        }
    }
    onClick() {
        if (this.currentState && this.currentState.callback) {
            this.currentState.callback();
        }
    }
}
class AS3000_TSC extends NavSystemTouch {
    constructor() {
        super();
        this.timer = new AS3000_TSC_Timers();
        this.speedBugs = new AS3000_TSC_SpeedBugs();
        this.pfdPrefix = "AS3000_PFD_1";
        this.history = [];
        this.initDuration = 4000;
    }
    get templateID() {
        return "AS3000_TSC";
    }
    connectedCallback() {
        super.connectedCallback();
        this.pagesContainer = this.getChildById("PagesDisplay");
        this.pageTitle = this.getChildById("PageTitle");
        this.pageGroups = [
            new NavSystemPageGroup("PFD", this, [
                new NavSystemPage("PFD Home", "PFDHome", new AS3000_TSC_PFDHome()),
                new NavSystemPage("Speed Bugs", "SpeedBugs", this.speedBugs),
                new NavSystemPage("Timers", "Timers", this.timer),
                new NavSystemPage("Minimums", "Minimums", new AS3000_TSC_Minimums()),
                new NavSystemPage("PFDSettings", "PFDSettings", new AS3000_TSC_PFDSettings()),
            ]),
            new NavSystemPageGroup("MFD", this, [
                new NavSystemPage("MFD Home", "MFDHome", new AS3000_TSC_MFDHome()),
                new NavSystemPage("Weather Selection", "WeatherSelection", new AS3000_TSC_WeatherSelection()),
                new NavSystemPage("Direct To", "DirectTo", new AS3000_TSC_DirectTo()),
                new NavSystemPage("Active Flight Plan", "ActiveFlightPlan", new AS3000_TSC_ActiveFPL()),
                new NavSystemPage("Procedures", "Procedures", new AS3000_TSC_Procedures()),
                new NavSystemPage("Departure Selection", "DepartureSelection", new AS3000_TSC_DepartureSelection()),
                new NavSystemPage("Arrival Selection", "ArrivalSelection", new AS3000_TSC_ArrivalSelection()),
                new NavSystemPage("Approach Selection", "ApproachSelection", new AS3000_TSC_ApproachSelection()),
                new NavSystemPage("Waypoint Info", "WaypointsInfo", new AS3000_TSC_WaypointInfo()),
                new NavSystemPage("Airport Info", "AirportInfo", new AS3000_TSC_AirportInfo()),
                new NavSystemPage("Nearest", "Nearest", new AS3000_TSC_NRST()),
                new NavSystemPage("Nearest Airport", "NearestAirport", new AS3000_TSC_NRST_Airport()),
                new NavSystemPage("Nearest Intersection", "NearestIntersection", new AS3000_TSC_NRST_Intersection()),
                new NavSystemPage("Nearest VOR", "NearestVOR", new AS3000_TSC_NRST_VOR()),
                new NavSystemPage("Nearest NDB", "NearestNDB", new AS3000_TSC_NRST_NDB()),
                new NavSystemPage("Speed Bugs", "SpeedBugs", this.speedBugs),
            ]),
            new NavSystemPageGroup("NavCom", this, [
                new NavSystemPage("NAV/COM Home", "NavComHome", new AS3000_TSC_NavComHome()),
            ]),
        ];
        this.navButtons = [
            new AS3000_TSC_NavButton("NavBar_1", this),
            new AS3000_TSC_NavButton("NavBar_2", this),
            new AS3000_TSC_NavButton("NavBar_3", this),
            new AS3000_TSC_NavButton("NavBar_4", this),
            new AS3000_TSC_NavButton("NavBar_5", this),
            new AS3000_TSC_NavButton("NavBar_6", this)
        ];
        this.transponderWindow = new NavSystemElementContainer("Transponder", "TransponderWindow", new AS3000_TSC_Transponder());
        this.transponderWindow.setGPS(this);
        this.audioRadioWindow = new NavSystemElementContainer("Audio & Radios", "AudioRadiosWindow", new AS3000_TSC_AudioRadios());
        this.audioRadioWindow.setGPS(this);
        this.frequencyKeyboard = new NavSystemElementContainer("Frequency Keyboard", "frequencyKeyboard", new AS3000_TSC_FrequencyKeyboard());
        this.frequencyKeyboard.setGPS(this);
        this.adfFrequencyKeyboard = new NavSystemElementContainer("ADF Frequency Keyboard", "frequencyKeyboard", new AS3000_TSC_ADFFrequencyKeyboard());
        this.adfFrequencyKeyboard.setGPS(this);
        this.timeKeyboard = new NavSystemElementContainer("Time Keyboard", "timeKeyboard", new AS3000_TSC_TimeKeyboard());
        this.timeKeyboard.setGPS(this);
        this.speedKeyboard = new NavSystemElementContainer("Speed Keyboard", "speedKeyboard", new AS3000_TSC_SpeedKeyboard());
        this.speedKeyboard.setGPS(this);
        this.fullKeyboard = new NavSystemElementContainer("Keyboard", "fullKeyboard", new AS3000_TSC_FullKeyboard());
        this.fullKeyboard.setGPS(this);
        this.insertBeforeWaypoint = new NavSystemElementContainer("Insert Before Waypoint", "insertBeforeWaypointWindow", new AS3000_TSC_InsertBeforeWaypoint());
        this.insertBeforeWaypoint.setGPS(this);
        this.minimumSource = new NavSystemElementContainer("Minimums Source", "minimumSource", new AS3000_TSC_MinimumSource());
        this.minimumSource.setGPS(this);
        this.duplicateWaypointSelection = new NavSystemElementContainer("Waypoint Duplicates", "WaypointDuplicateWindow", new AS3000_TSC_DuplicateWaypointSelection());
        this.duplicateWaypointSelection.setGPS(this);
        this.loadFrequencyWindow = new NavSystemElementContainer("Frequency Window", "LoadFrequencyPopup", new AS3000_TSC_LoadFrequencyWindow());
        this.loadFrequencyWindow.setGPS(this);
        this.waypointOptions = new NavSystemElementContainer("Waypoint Options", "WaypointInfo_WaypointOptions", new AS3000_TSC_WaypointOptions());
        this.waypointOptions.setGPS(this);
        this.mapPointerControl = new NavSystemElementContainer("Map Pointer Control", "MapPointerControl", new AS3000_MapPointerControl());
        this.mapPointerControl.setGPS(this);
        this.confirmationWindow = new AS3000_TSC_ConfirmationWindow();
        this.addIndependentElementContainer(new NavSystemElementContainer("Terrain Alert", "terrainAlert", new AS3000_TSC_TerrainAlert()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Confirmation Window", "ConfirmationWindow", this.confirmationWindow));
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        const pfdPrefix_elem = this.xmlConfig.getElementsByTagName("PFD");
        if (pfdPrefix_elem.length > 0) {
            this.pfdPrefix = pfdPrefix_elem[0].textContent;
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onUpdate() {
        const title = this.getCurrentPage().name;
        if (this.pageTitle.innerHTML != title) {
            this.pageTitle.innerHTML = title;
        }
        SimVar.SetSimVarValue("L:AS3000_" + this.urlConfig.index + "_Timer_Value", "number", this.timer.getCurrentDisplay());
    }
    onEvent(_event) {
        super.onEvent(_event);
        switch (_event) {
            case "SoftKey_1":
                this.SwitchToPageName("PFD", "PFD Home");
                this.closePopUpElement();
                this.history = [];
                break;
            case "SoftKey_2":
                this.SwitchToPageName("MFD", "MFD Home");
                this.closePopUpElement();
                this.history = [];
                break;
            case "SoftKey_3":
                this.SwitchToMenuName("NavCom");
                this.closePopUpElement();
                this.history = [];
                break;
        }
        if (this.getCurrentPageGroup().name == "MFD" && this.popUpElement != this.mapPointerControl) {
            switch (_event) {
                case "BottomKnob_Small_INC":
                    LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_RNG_Dezoom");
                    break;
                case "BottomKnob_Small_DEC":
                    LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_RNG_Zoom");
                    break;
                case "BottomKnob_Push":
                    this.switchToPopUpPage(this.mapPointerControl);
                    break;
            }
        }
    }
    goBack() {
        const last = this.history.pop();
        this.closePopUpElement();
        if (last.popUpPage) {
            this.switchToPopUpPage(last.popUpPage);
        } else {
            this.SwitchToPageName(last.menuName, last.pageName);
        }
        this.history.pop();
    }
    getFullKeyboard() {
        return this.fullKeyboard;
    }
    activateNavButton(_id, _title, _callback, _fromPopUp = false, _imagePath = "defaultImage.png") {
        const data = new AS3000_TSC_NavButton_Data();
        data.title = _title;
        data.callback = _callback;
        data.imagePath = "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/" + _imagePath;
        data.isActive = true;
        this.navButtons[_id - 1].setState(data, _fromPopUp);
    }
    deactivateNavButton(_id, _fromPopUp = false) {
        this.navButtons[_id - 1].deactivate(_fromPopUp);
    }
    setTopKnobText(_text, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.topKnobText_Save = _text;
        }
        if (this.topKnobText.innerHTML != _text) {
            this.topKnobText.innerHTML = _text;
        }
    }
    setBottomKnobText(_text, _fromPopUp = false) {
        if (!_fromPopUp) {
            this.bottomKnobText_Save = _text;
        }
        if (this.bottomKnobText.innerHTML != _text) {
            this.bottomKnobText.innerHTML = _text;
        }
    }
    rollBackKnobTexts() {
        this.topKnobText.innerHTML = this.topKnobText_Save;
        this.bottomKnobText.innerHTML = this.bottomKnobText_Save;
    }
    closePopUpElement() {
        super.closePopUpElement();
        this.rollBackKnobTexts();
    }
    SwitchToPageName(_menu, _page) {
        const historyPoint = new AS3000_TSC_PageInfos();
        if (!this.popUpElement) {
            historyPoint.menuName = this.getCurrentPageGroup().name;
            historyPoint.pageName = this.getCurrentPage().name;
        }
        this.history.push(historyPoint);
        super.SwitchToPageName(_menu, _page);
    }
    switchToPopUpPage(_pageContainer) {
        const historyPoint = new AS3000_TSC_PageInfos();
        historyPoint.popUpPage = this.popUpElement;
        historyPoint.menuName = this.getCurrentPageGroup().name;
        historyPoint.pageName = this.getCurrentPage().name;
        this.history.push(historyPoint);
        super.switchToPopUpPage(_pageContainer);
    }
    openConfirmationWindow(_text, _button) {
        this.confirmationWindow.open(_text, _button);
    }
}
class AS3000_TSC_PageInfos {
}
class AS3000_TSC_PFDHome extends NavSystemElement {
    init(root) {
        this.NavSourceButton = this.gps.getChildById("NavSourceButton");
        this.NavSourceButton_Value = this.NavSourceButton.getElementsByClassName("lowerValue")[0];
        this.OBSButton = this.gps.getChildById("OBSButton");
        this.CASUpButton = this.gps.getChildById("CASUpButton");
        this.Bearing1Button = this.gps.getChildById("Bearing1Button");
        this.Bearing1Button_Value = this.Bearing1Button.getElementsByClassName("lowerValue")[0];
        this.Bearing2Button = this.gps.getChildById("Bearing2Button");
        this.Bearing2Button_Value = this.Bearing2Button.getElementsByClassName("lowerValue")[0];
        this.CASDownButton = this.gps.getChildById("CASDownButton");
        this.SpeedBugsButton = this.gps.getChildById("SpeedBugsButton_PFD");
        this.TimersButton = this.gps.getChildById("TimersButton");
        this.MinimumsButton = this.gps.getChildById("MinimumsButton");
        this.TrafficMapButton = this.gps.getChildById("TrafficMapButton");
        this.PFDMapSettingsButton = this.gps.getChildById("PFDMapSettingsButton");
        this.SensorsButton = this.gps.getChildById("SensorsButton");
        this.PFDSettingsButton = this.gps.getChildById("PFDSettingsButton");
        this.gps.makeButton(this.NavSourceButton, this.sendMouseEvent.bind(this.gps, this.gps.pfdPrefix + "_NavSourceSwitch"));
        this.gps.makeButton(this.Bearing1Button, this.sendMouseEvent.bind(this.gps, this.gps.pfdPrefix + "_BRG1Switch"));
        this.gps.makeButton(this.Bearing2Button, this.sendMouseEvent.bind(this.gps, this.gps.pfdPrefix + "_BRG2Switch"));
        this.gps.makeButton(this.SpeedBugsButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "Speed Bugs"));
        this.gps.makeButton(this.TimersButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "Timers"));
        this.gps.makeButton(this.MinimumsButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "Minimums"));
        this.gps.makeButton(this.PFDSettingsButton, this.gps.SwitchToPageName.bind(this.gps, "PFD", "PFDSettings"));
    }
    onEnter() {
        this.gps.setTopKnobText("");
        this.gps.setBottomKnobText("");
    }
    onUpdate(_deltaTime) {
        if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
            Avionics.Utils.diffAndSet(this.NavSourceButton_Value, "FMS");
        } else {
            if (SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number") == 1) {
                Avionics.Utils.diffAndSet(this.NavSourceButton_Value, "NAV1");
            } else {
                Avionics.Utils.diffAndSet(this.NavSourceButton_Value, "NAV2");
            }
        }
        const brg1Src = SimVar.GetSimVarValue("L:PFD_BRG1_Source", "number");
        switch (brg1Src) {
            case 0:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "OFF");
                break;
            case 1:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "NAV1");
                break;
            case 2:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "NAV2");
                break;
            case 3:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "GPS");
                break;
            case 4:
                Avionics.Utils.diffAndSet(this.Bearing1Button_Value, "ADF");
                break;
        }
        const brg2Src = SimVar.GetSimVarValue("L:PFD_BRG2_Source", "number");
        switch (brg2Src) {
            case 0:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "OFF");
                break;
            case 1:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "NAV1");
                break;
            case 2:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "NAV2");
                break;
            case 3:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "GPS");
                break;
            case 4:
                Avionics.Utils.diffAndSet(this.Bearing2Button_Value, "ADF");
                break;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    sendMouseEvent(_event) {
        LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", _event);
    }
}
class AS3000_TSC_MFDHome extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lastMode = 0;
    }
    init(root) {
        this.mapButton = this.gps.getChildById("MapButton");
        this.mapButton_image = this.mapButton.getElementsByClassName("img")[0];
        this.mapButton_text = this.mapButton.getElementsByClassName("title")[0];
        this.weatherButton = this.gps.getChildById("WeatherButton");
        this.weatherButton_image = this.weatherButton.getElementsByClassName("img")[0];
        this.weatherButton_text = this.weatherButton.getElementsByClassName("title")[0];
        this.directToButton = this.gps.getChildById("DirectToButton");
        this.FlightPlanButton = this.gps.getChildById("FlightPlanButton");
        this.procButton = this.gps.getChildById("ProcButton");
        this.NearestButton = this.gps.getChildById("NearestButton");
        this.speedBugsButton = this.gps.getChildById("SpeedBugsButton_MFD");
        this.WaypointsInfoButton = this.gps.getChildById("WaypointInfoButton");
        this.updateMapButtons();
        this.gps.makeButton(this.mapButton, this.mapSwitch.bind(this, 0));
        this.gps.makeButton(this.weatherButton, this.mapSwitch.bind(this, 2));
        this.gps.makeButton(this.directToButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Direct To"));
        this.gps.makeButton(this.FlightPlanButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Active Flight Plan"));
        this.gps.makeButton(this.procButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Procedures"));
        this.gps.makeButton(this.NearestButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Nearest"));
        this.gps.makeButton(this.speedBugsButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Speed Bugs"));
        this.gps.makeButton(this.WaypointsInfoButton, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Waypoint Info"));
    }
    mapSwitch(_mapIndex) {
        const currMap = SimVar.GetSimVarValue("L:AS3000_MFD_Current_Map", "number");
        if (currMap == _mapIndex) {
            switch (_mapIndex) {
                case 0:
                    break;
                case 2:
                    this.gps.SwitchToPageName("MFD", "Weather Selection");
                    break;
            }
        } else {
            SimVar.SetSimVarValue("L:AS3000_MFD_Current_Map", "number", _mapIndex);
        }
        this.updateMapButtons(_mapIndex);
    }
    updateMapButtons(_newIndex = undefined) {
        const currMap = _newIndex == undefined ? SimVar.GetSimVarValue("L:AS3000_MFD_Current_Map", "number") : _newIndex;
        if (currMap == 0) {
            Avionics.Utils.diffAndSet(this.mapButton_text, "Map Settings");
            Avionics.Utils.diffAndSetAttribute(this.mapButton, "state", "Active");
        } else {
            Avionics.Utils.diffAndSet(this.mapButton_text, "Map");
            Avionics.Utils.diffAndSetAttribute(this.mapButton, "state", "");
        }
        if (currMap == 2) {
            Avionics.Utils.diffAndSet(this.weatherButton_text, "Weather Selection");
            Avionics.Utils.diffAndSetAttribute(this.weatherButton, "state", "Active");
        } else {
            Avionics.Utils.diffAndSet(this.weatherButton_text, "Weather");
            Avionics.Utils.diffAndSetAttribute(this.weatherButton, "state", "");
        }
    }
    onEnter() {
        this.gps.setTopKnobText("");
        this.gps.setBottomKnobText("-Range+ Push: Pan");
    }
    onUpdate(_deltaTime) {
        const mapMode = SimVar.GetSimVarValue("L:AS3000_MFD_Current_Map", "number");
        if (mapMode != this.lastMode) {
            this.updateMapButtons();
            this.lastMode = mapMode;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_TSC_WeatherSelection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lastMode = 0;
    }
    init(root) {
        this.nexradButton = this.gps.getChildById("NexradButton");
        this.wxRadarButton = this.gps.getChildById("WxRadarButton");
        this.wxRadarVertButton = this.gps.getChildById("WxRadarVertButton");
        this.nexradButton_text = this.nexradButton.getElementsByClassName("title")[0];
        this.wxRadarButton_text = this.wxRadarButton.getElementsByClassName("title")[0];
        this.wxRadarVertButton_text = this.wxRadarVertButton.getElementsByClassName("title")[0];
        this.updateWeatherMapButtons();
        this.gps.makeButton(this.nexradButton, this.weatherMapSwitch.bind(this, 0));
        if (this.gps.hasWeatherRadar()) {
            this.gps.makeButton(this.wxRadarButton, this.weatherMapSwitch.bind(this, 1));
            this.gps.makeButton(this.wxRadarVertButton, this.weatherMapSwitch.bind(this, 2));
        }
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onUpdate(_deltaTime) {
        const weatherMapMode = SimVar.GetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number");
        if (weatherMapMode != this.lastMode) {
            this.updateWeatherMapButtons();
            this.lastMode = weatherMapMode;
        }
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
    onEvent(_event) {
    }
    back() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
    weatherMapSwitch(_mapIndex) {
        const currMap = SimVar.GetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number");
        if (currMap == _mapIndex) {
            switch (_mapIndex) {
                case 0:
                    break;
                case 1:
                    break;
                case 2:
                    break;
            }
        } else {
            SimVar.SetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number", _mapIndex);
        }
        this.updateWeatherMapButtons(_mapIndex);
    }
    updateWeatherMapButtons(_newIndex = undefined) {
        const currMap = _newIndex == undefined ? SimVar.GetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number") : _newIndex;
        if (currMap == 0) {
            Avionics.Utils.diffAndSet(this.nexradButton_text, "NEXRAD Settings");
            Avionics.Utils.diffAndSetAttribute(this.nexradButton, "state", "Active");
        } else {
            Avionics.Utils.diffAndSet(this.nexradButton_text, "NEXRAD");
            Avionics.Utils.diffAndSetAttribute(this.nexradButton, "state", "");
        }
        if (currMap == 1) {
            Avionics.Utils.diffAndSet(this.wxRadarButton_text, "WX RADAR Settings");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarButton, "state", "Active");
        } else {
            Avionics.Utils.diffAndSet(this.wxRadarButton_text, "WX RADAR Horizontal");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarButton, "state", "");
        }
        if (currMap == 2) {
            Avionics.Utils.diffAndSet(this.wxRadarVertButton_text, "WX RADAR Settings");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarVertButton, "state", "Active");
        } else {
            Avionics.Utils.diffAndSet(this.wxRadarVertButton_text, "WX RADAR Vertical");
            Avionics.Utils.diffAndSetAttribute(this.wxRadarVertButton, "state", "");
        }
    }
}
class AS3000_TSC_DirectTo extends NavSystemTouch_DirectTo {
    onEnter() {
        super.onEnter();
        this.gps.setTopKnobText("");
        this.gps.setBottomKnobText("-Range+ Push: Pan");
        this.gps.activateNavButton(1, "Cancel", this.gps.goBack.bind(this.gps), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
    onEvent(_event) {
    }
    openKeyboard() {
        this.gps.fullKeyboard.getElementOfType(AS3000_TSC_FullKeyboard).setContext(this.endKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.fullKeyboard);
    }
    back() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
}
class AS3000_TSC_ActiveFPL extends NavSystemTouch_ActiveFPL {
    init(_root) {
        super.init(_root);
        this.altitudeKeyboard.element = new AS3000_TSC_AltitudeKeyboard();
    }
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
        this.gps.deactivateNavButton(5, false);
        this.gps.deactivateNavButton(6, false);
    }
    back() {
        this.gps.goBack();
    }
}
class AS3000_TSC_Procedures extends NavSystemTouch_Procedures {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
    }
    back() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
}
class AS3000_TSC_DepartureSelection extends NavSystemTouch_DepartureSelection {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
    }
    back() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
    close() {
        this.gps.SwitchToPageName("MFD", "Procedures");
    }
}
class AS3000_TSC_ArrivalSelection extends NavSystemTouch_ArrivalSelection {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
    }
    back() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
    close() {
        this.gps.SwitchToPageName("MFD", "Procedures");
    }
}
class AS3000_TSC_ApproachSelection extends NavSystemTouch_ApproachSelection {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
    }
    back() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
    close() {
        this.gps.SwitchToPageName("MFD", "Procedures");
    }
}
class AS3000_TSC_WaypointInfo extends NavSystemElement {
    init(root) {
        this.airportBtn = this.gps.getChildById("WPInfoAirport_Btn");
        this.intBtn = this.gps.getChildById("WPInfoINT_Btn");
        this.vorBtn = this.gps.getChildById("WPInfoVOR_Btn");
        this.ndbBtn = this.gps.getChildById("WPInfoNDB_Btn");
        this.gps.makeButton(this.airportBtn, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Airport Info"));
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
    onEvent(_event) {
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
}
class AS3000_TSC_AirportInfo_FreqLine {
}
class AS3000_TSC_AirportInfo_RunwayLine {
}
class AS3000_TSC_AirportInfo extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.frequencyElements = [];
        this.runwayElements = [];
        this.showInMap = false;
    }
    init(root) {
        this.geoCalc = new GeoCalcInfo(this.gps);
        this.centerDisplay = (root.getElementsByClassName("CenterDisplay")[0]);
        this.infoTab = this.gps.getChildById("AirportInfo_InfoTab");
        this.freqsTab = this.gps.getChildById("AirportInfo_FreqsTab");
        this.runwaysTab = this.gps.getChildById("AirportInfo_RunwaysTab");
        this.activeTab = this.infoTab;
        this.airportSelection = this.gps.getChildById("AirportInfo_SelectedWaypoint");
        this.airportSelection_mainText = this.airportSelection.getElementsByClassName("mainText")[0];
        this.airportSelection_mainValue = this.airportSelection.getElementsByClassName("mainValue")[0];
        this.airportSelection_title = this.airportSelection.getElementsByClassName("title")[0];
        this.airportSelection_symbol = this.airportSelection.getElementsByClassName("waypointSymbol")[0];
        this.waypointOptions = this.gps.getChildById("AirportInfo_Options");
        this.city = (root.getElementsByClassName("city")[0]);
        this.region = (root.getElementsByClassName("region")[0]);
        this.bearing_value = (root.getElementsByClassName("bearing_value")[0]);
        this.distance_value = (root.getElementsByClassName("distance_value")[0]);
        this.latitude = (root.getElementsByClassName("latitude")[0]);
        this.longitude = (root.getElementsByClassName("longitude")[0]);
        this.elev_value = (root.getElementsByClassName("elev_value")[0]);
        this.time_value = (root.getElementsByClassName("time_value")[0]);
        this.fuel_value = (root.getElementsByClassName("fuel_value")[0]);
        this.privacy = (root.getElementsByClassName("privacy")[0]);
        this.frequencyTable = (root.getElementsByClassName("Freqs")[0]);
        this.frequencyScrollElement = new NavSystemTouch_ScrollElement();
        this.frequencyScrollElement.elementContainer = this.frequencyTable;
        this.frequencyScrollElement.elementSize = this.frequencyTable.getBoundingClientRect().height / 4;
        this.runwayTable = (root.getElementsByClassName("Runways")[0]);
        this.runwaysScrollElement = new NavSystemTouch_ScrollElement();
        this.runwaysScrollElement.elementContainer = this.runwayTable;
        this.runwaysScrollElement.elementSize = this.runwayTable.getBoundingClientRect().height / 3;
        this.gps.makeButton(this.infoTab, this.switchPage.bind(this, "Info", this.infoTab));
        this.gps.makeButton(this.freqsTab, this.switchPage.bind(this, "Freqs", this.freqsTab));
        this.gps.makeButton(this.runwaysTab, this.switchPage.bind(this, "Runways", this.runwaysTab));
        this.gps.makeButton(this.airportSelection, this.openKeyboard.bind(this));
        this.gps.makeButton(this.waypointOptions, this.openOptions.bind(this));
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        if (this.currPage == "Freqs") {
            this.gps.activateNavButton(5, "Up", this.scrollUpFreq.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
            this.gps.activateNavButton(6, "Down", this.scrollDownFreq.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
        } else if (this.currPage == "Runways") {
            this.gps.activateNavButton(5, "Up", this.scrollUpRunways.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
            this.gps.activateNavButton(6, "Down", this.scrollDownRunways.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
        }
        if (this.airport && this.showInMap) {
            const infos = this.airport.infos;
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", infos.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", infos.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        }
        if (this.gps.lastRelevantICAO) {
            this.endKeyboard(this.gps.lastRelevantICAO);
            this.gps.lastRelevantICAO = null;
        }
    }
    onUpdate(_deltaTime) {
        if (this.frequencyScrollElement.elementSize == 0) {
            this.frequencyScrollElement.elementSize = this.frequencyTable.getBoundingClientRect().height / 4;
        }
        this.frequencyScrollElement.update();
        if (this.runwaysScrollElement.elementSize == 0) {
            this.runwaysScrollElement.elementSize = this.runwayTable.getBoundingClientRect().height / 3;
        }
        this.runwaysScrollElement.update();
        if (this.airport) {
            const infos = this.airport.infos;
            if (infos.lat && infos.long) {
                this.geoCalc.SetParams(SimVar.GetSimVarValue("PLANE LATITUDE", "degree"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree"), infos.lat, infos.long, true);
                this.geoCalc.Compute(this.onEndGeoCalc.bind(this));
            }
        }
    }
    onEndGeoCalc() {
        Avionics.Utils.diffAndSet(this.bearing_value, fastToFixed(this.geoCalc.bearing, 0) + "°");
        Avionics.Utils.diffAndSet(this.distance_value, fastToFixed(this.geoCalc.distance, 0) + "NM");
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.deactivateNavButton(5);
        this.gps.deactivateNavButton(6);
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
        if (this.airport) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.airport.infos.icao;
        }
        this.showInMap = false;
    }
    onEvent(_event) {
    }
    openKeyboard() {
        this.gps.deactivateNavButton(5);
        this.gps.deactivateNavButton(6);
        this.gps.fullKeyboard.element.setContext(this.endKeyboard.bind(this), "A");
        this.gps.switchToPopUpPage(this.gps.fullKeyboard);
    }
    endKeyboard(_icao) {
        if (_icao != "") {
            this.airport = new WayPoint(this.gps);
            this.airport.type = "A";
            this.gps.facilityLoader.getFacilityCB(_icao, (wp) => {
                this.airport = wp;
                this.onLoadEnd();
            });
        } else {
            this.airport = null;
            this.onLoadEnd();
        }
    }
    onLoadEnd() {
        if (this.airport) {
            const infos = this.airport.infos;
            this.city.textContent = infos.city ? infos.city : "";
            this.region.textContent = infos.region ? infos.region : "";
            this.latitude.textContent = infos.lat ? this.gps.latitudeFormat(infos.lat) : "";
            this.longitude.textContent = infos.long ? this.gps.longitudeFormat(infos.long) : "";
            this.elev_value.textContent = infos.coordinates && infos.coordinates.alt ? fastToFixed(infos.coordinates.alt, 0) + "FT" : "";
            this.fuel_value.textContent = infos.fuel ? infos.fuel : "";
            switch (infos.privateType) {
                case 0:
                    this.privacy.textContent = "UNKNOWN";
                    break;
                case 1:
                    this.privacy.textContent = "PUBLIC";
                    break;
                case 2:
                    this.privacy.textContent = "MILITARY";
                    break;
                case 3:
                    this.privacy.textContent = "PRIVATE";
                    break;
            }
            this.airportSelection_mainText.textContent = "";
            this.airportSelection_mainValue.textContent = infos.ident;
            this.airportSelection_title.textContent = infos.name;
            const symbol = infos.imageFileName();
            this.airportSelection_symbol.setAttribute("src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            for (let i = 0; i < infos.frequencies.length; i++) {
                if (i >= this.frequencyElements.length) {
                    const freqLine = new AS3000_TSC_AirportInfo_FreqLine();
                    freqLine.frequency = infos.frequencies[i];
                    freqLine.lineElem = document.createElement("div");
                    freqLine.lineElem.setAttribute("class", "line");
                    this.frequencyTable.appendChild(freqLine.lineElem);
                    freqLine.freqNameElem = document.createElement("div");
                    freqLine.freqNameElem.setAttribute("class", "frequencyName");
                    freqLine.lineElem.appendChild(freqLine.freqNameElem);
                    const buttonContainer = document.createElement("div");
                    buttonContainer.setAttribute("class", "buttonContainer");
                    freqLine.lineElem.appendChild(buttonContainer);
                    freqLine.buttonElem = document.createElement("div");
                    freqLine.buttonElem.setAttribute("class", "gradientButton");
                    buttonContainer.appendChild(freqLine.buttonElem);
                    freqLine.frequencyElem = document.createElement("div");
                    freqLine.frequencyElem.setAttribute("class", "mainText");
                    freqLine.buttonElem.appendChild(freqLine.frequencyElem);
                    this.gps.makeButton(freqLine.buttonElem, this.frequencyButtonCallback.bind(this, freqLine));
                    this.frequencyElements.push(freqLine);
                    if (i == 0) {
                        this.frequencyScrollElement.elementSize = freqLine.lineElem.getBoundingClientRect().height;
                    }
                }
                this.frequencyElements[i].frequency = infos.frequencies[i];
                this.frequencyElements[i].freqNameElem.textContent = this.frequencyElements[i].frequency.name;
                this.frequencyElements[i].frequencyElem.textContent = this.frequencyElements[i].frequency.mhValue.toFixed(2);
                this.frequencyElements[i].lineElem.style.display = "block";
            }
            for (let i = infos.frequencies.length; i < this.frequencyElements.length; i++) {
                this.frequencyElements[i].lineElem.style.display = "none";
            }
            for (let i = 0; i < infos.runways.length; i++) {
                if (i >= this.runwayElements.length) {
                    const runwayLine = new AS3000_TSC_AirportInfo_RunwayLine();
                    runwayLine.runway = infos.runways[i];
                    runwayLine.lineElem = document.createElement("div");
                    runwayLine.lineElem.setAttribute("class", "line");
                    this.runwayTable.appendChild(runwayLine.lineElem);
                    runwayLine.nameElem = document.createElement("div");
                    runwayLine.nameElem.setAttribute("class", "name");
                    runwayLine.lineElem.appendChild(runwayLine.nameElem);
                    runwayLine.sizeElem = document.createElement("div");
                    runwayLine.sizeElem.setAttribute("class", "size");
                    runwayLine.lineElem.appendChild(runwayLine.sizeElem);
                    runwayLine.surfaceElem = document.createElement("div");
                    runwayLine.surfaceElem.setAttribute("class", "surface");
                    runwayLine.lineElem.appendChild(runwayLine.surfaceElem);
                    runwayLine.lightingElem = document.createElement("div");
                    runwayLine.lightingElem.setAttribute("class", "lighting");
                    runwayLine.lineElem.appendChild(runwayLine.lightingElem);
                    this.runwayElements.push(runwayLine);
                    if (i == 0) {
                        this.runwaysScrollElement.elementSize = runwayLine.lineElem.getBoundingClientRect().height;
                    }
                }
                this.runwayElements[i].runway = infos.runways[i];
                this.runwayElements[i].nameElem.textContent = infos.runways[i].designation;
                this.runwayElements[i].sizeElem.textContent = Math.round(infos.runways[i].length * 3.28084) + "FT X " + Math.round(infos.runways[i].width * 3.28084) + "FT";
                this.runwayElements[i].surfaceElem.textContent = infos.runways[i].getSurfaceString();
                let lighting = "Unknown";
                switch (infos.runways[i].lighting) {
                    case 1:
                        lighting = "None";
                        break;
                    case 2:
                        lighting = "Part Time";
                        break;
                    case 3:
                        lighting = "Full Time";
                        break;
                    case 4:
                        lighting = "Frequency";
                        break;
                }
                this.runwayElements[i].lightingElem.textContent = lighting;
                this.runwayElements[i].lineElem.style.display = "block";
            }
            for (let i = infos.runways.length; i < this.runwayElements.length; i++) {
                this.runwayElements[i].lineElem.style.display = "none";
            }
            if (this.showInMap) {
                SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", infos.lat);
                SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", infos.long);
                SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
            }
        } else {
        }
    }
    switchPage(_page, _button) {
        this.gps.deactivateNavButton(5);
        this.gps.deactivateNavButton(6);
        this.currPage = _page;
        this.centerDisplay.setAttribute("state", _page);
        if (this.activeTab) {
            this.activeTab.setAttribute("state", "");
        }
        _button.setAttribute("state", "White");
        this.activeTab = _button;
        if (_page == "Freqs") {
            this.gps.activateNavButton(5, "Up", this.scrollUpFreq.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
            this.gps.activateNavButton(6, "Down", this.scrollDownFreq.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
        } else if (this.currPage == "Runways") {
            this.gps.activateNavButton(5, "Up", this.scrollUpRunways.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
            this.gps.activateNavButton(6, "Down", this.scrollDownRunways.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
        }
    }
    frequencyButtonCallback(_freqLine) {
        this.gps.deactivateNavButton(5);
        this.gps.deactivateNavButton(6);
        this.gps.loadFrequencyWindow.element.setContext(_freqLine.frequency.mhValue.toFixed(2) + " " + this.airport.ident + " " + _freqLine.frequency.name, _freqLine.frequency.bcd16Value, _freqLine.frequency.mhValue < 118);
        this.gps.switchToPopUpPage(this.gps.loadFrequencyWindow);
    }
    scrollUpFreq() {
        this.frequencyScrollElement.scrollUp();
    }
    scrollDownFreq() {
        this.frequencyScrollElement.scrollDown();
    }
    scrollUpRunways() {
        this.runwaysScrollElement.scrollUp();
    }
    scrollDownRunways() {
        this.runwaysScrollElement.scrollDown();
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    showInMapToggle() {
        this.showInMap = !this.showInMap;
        if (this.airport && this.showInMap) {
            const infos = this.airport.GetInfos();
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", infos.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", infos.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        }
        if (!this.showInMap) {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
        }
    }
    showInMapStatus() {
        return this.showInMap;
    }
    openOptions() {
        this.gps.waypointOptions.element.setContext(this.airport.icao, this.showInMapStatus.bind(this), this.showInMapToggle.bind(this));
        this.gps.switchToPopUpPage(this.gps.waypointOptions);
    }
}
class AS3000_TSC_NRST extends NavSystemElement {
    init(root) {
        this.Airport = this.gps.getChildById("NrstAirport_Btn");
        this.INT = this.gps.getChildById("NrstInt_Btn");
        this.VOR = this.gps.getChildById("NrstVor_Btn");
        this.NDB = this.gps.getChildById("NrstNdb_Btn");
        this.User = this.gps.getChildById("NrstUser_Btn");
        this.Airspace = this.gps.getChildById("NrstAirspace_Btn");
        this.ARTCC = this.gps.getChildById("NrstARTCC_Btn");
        this.FSS = this.gps.getChildById("NrstFSS_Btn");
        this.Weather = this.gps.getChildById("NrstWeather_Btn");
        this.gps.makeButton(this.Airport, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Nearest Airport"));
        this.gps.makeButton(this.INT, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Nearest Intersection"));
        this.gps.makeButton(this.VOR, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Nearest VOR"));
        this.gps.makeButton(this.NDB, this.gps.SwitchToPageName.bind(this.gps, "MFD", "Nearest NDB"));
    }
    onEnter() {
        this.gps.setTopKnobText("");
        this.gps.setBottomKnobText("-Range+ Push: Pan");
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
    }
    onEvent(_event) {
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
}
class AS3000_TSC_NRST_Airport_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            const td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.name = window.document.createElement("div");
                    this.name.setAttribute("class", "title");
                    this.identButton.appendChild(this.name);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            const td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            const td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
            const td4 = window.document.createElement("td");
            {
                this.appr = window.document.createElement("div");
                td4.appendChild(this.appr);
                this.runway = window.document.createElement("div");
                td4.appendChild(this.runway);
            }
            this.base.appendChild(td4);
        }
    }
}
class AS3000_TSC_NRST_Airport extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.airportLines = [];
        this.selectedElement = -1;
        this.showOnMap = false;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstAirport_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstAirport_InsertInFpl");
        this.airportInfos_button = this.gps.getChildById("NrstAirport_AirportInfo");
        this.airportChart_button = this.gps.getChildById("NrstAirport_AirportChart");
        this.showOnMap_button = this.gps.getChildById("NrstAirport_ShowOnMap");
        this.nearestAirports = new NearestAirportList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.airportLines.length > 2 ? this.airportLines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
        this.gps.makeButton(this.airportInfos_button, this.airportInfo.bind(this));
        this.gps.makeButton(this.showOnMap_button, this.showOnMapToggle.bind(this));
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.airportLines.length > 2 ? this.airportLines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearestAirports.Update(25, 200);
        for (let i = 0; i < this.nearestAirports.airports.length; i++) {
            if (this.airportLines.length < i + 1) {
                const newLine = new AS3000_TSC_NRST_Airport_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.airportLines.push(newLine);
            }
            const infos = this.nearestAirports.airports[i];
            Avionics.Utils.diffAndSet(this.airportLines[i].ident, infos.ident);
            Avionics.Utils.diffAndSet(this.airportLines[i].name, infos.name);
            const symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.airportLines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.airportLines[i].distance, fastToFixed(infos.distance, 1) + "NM");
            Avionics.Utils.diffAndSet(this.airportLines[i].runway, fastToFixed(infos.longestRunwayLength, 0) + "FT");
            Avionics.Utils.diffAndSet(this.airportLines[i].appr, infos.bestApproach);
        }
        for (let i = this.nearestAirports.airports.length; i < this.airportLines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
        this.gps.deactivateNavButton(5, false);
        this.gps.deactivateNavButton(6, false);
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.airportLines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
    }
    onEvent(_event) {
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    scrollUp() {
        if (this.selectedElement != -1) {
            if (this.selectedElement > 0) {
                this.clickOnElement(this.selectedElement - 1);
                this.scrollElement.scrollUp(true);
            }
        } else {
            this.scrollElement.scrollUp();
        }
    }
    scrollDown() {
        if (this.selectedElement != -1) {
            if (this.selectedElement < this.nearestAirports.airports.length - 1) {
                this.clickOnElement(this.selectedElement + 1);
                this.scrollElement.scrollDown(true);
            }
        } else {
            this.scrollElement.scrollDown();
        }
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.airportLines[_index].identButton.setAttribute("state", "None");
        } else {
            if (this.selectedElement != -1) {
                this.airportLines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.airportLines[_index].identButton.setAttribute("state", "SelectedWP");
        }
        if (this.showOnMap) {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", this.nearestAirports.airports[_index].coordinates.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", this.nearestAirports.airports[_index].coordinates.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        }
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearestAirports.airports[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearestAirports.airports[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
    airportInfo() {
        this.gps.SwitchToPageName("MFD", "Airport Info");
    }
    showOnMapToggle() {
        this.showOnMap = !this.showOnMap;
        this.showOnMap_button.setAttribute("state", this.showOnMap ? "Active" : "");
        if (this.showOnMap) {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", this.nearestAirports.airports[this.selectedElement].coordinates.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", this.nearestAirports.airports[this.selectedElement].coordinates.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        } else {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
        }
    }
}
class AS3000_TSC_NRST_Intersection extends NavSystemTouch_NRST_Intersection {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
        this.gps.deactivateNavButton(5, false);
        this.gps.deactivateNavButton(6, false);
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    scrollUp() {
        if (this.selectedElement != -1) {
            if (this.selectedElement > 0) {
                this.clickOnElement(this.selectedElement - 1);
                this.scrollElement.scrollUp(true);
            }
        } else {
            this.scrollElement.scrollUp();
        }
    }
    scrollDown() {
        if (this.selectedElement != -1) {
            if (this.selectedElement < this.nearest.intersections.length - 1) {
                this.clickOnElement(this.selectedElement + 1);
                this.scrollElement.scrollDown(true);
            }
        } else {
            this.scrollElement.scrollDown();
        }
    }
}
class AS3000_TSC_NRST_VOR extends NavSystemTouch_NRST_VOR {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
        this.gps.deactivateNavButton(5, false);
        this.gps.deactivateNavButton(6, false);
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    scrollUp() {
        if (this.selectedElement != -1) {
            if (this.selectedElement > 0) {
                this.clickOnElement(this.selectedElement - 1);
                this.scrollElement.scrollUp(true);
            }
        } else {
            this.scrollElement.scrollUp();
        }
    }
    scrollDown() {
        if (this.selectedElement != -1) {
            if (this.selectedElement < this.nearest.vors.length - 1) {
                this.clickOnElement(this.selectedElement + 1);
                this.scrollElement.scrollDown(true);
            }
        } else {
            this.scrollElement.scrollDown();
        }
    }
    clickOnFrequency(_index) {
        const infos = this.nearest.vors[_index];
        this.gps.loadFrequencyWindow.element.setContext(infos.frequencyMHz.toFixed(2) + " " + infos.ident, infos.frequencyBCD16, true);
        this.gps.switchToPopUpPage(this.gps.loadFrequencyWindow);
    }
}
class AS3000_TSC_NRST_NDB extends NavSystemTouch_NRST_NDB {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), false, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), false, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, false);
        this.gps.deactivateNavButton(2, false);
        this.gps.deactivateNavButton(5, false);
        this.gps.deactivateNavButton(6, false);
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    scrollUp() {
        if (this.selectedElement != -1) {
            if (this.selectedElement > 0) {
                this.clickOnElement(this.selectedElement - 1);
                this.scrollElement.scrollUp(true);
            }
        } else {
            this.scrollElement.scrollUp();
        }
    }
    scrollDown() {
        if (this.selectedElement != -1) {
            if (this.selectedElement < this.nearest.ndbs.length - 1) {
                this.clickOnElement(this.selectedElement + 1);
                this.scrollElement.scrollDown(true);
            }
        } else {
            this.scrollElement.scrollDown();
        }
    }
}
class AS3000_TSC_NavComHome extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.xpdrState = -1;
        this.selectedCom = 1;
        this.inputIndex = -1;
        this.identTime = 0;
    }
    init(root) {
        this.XPDRIdent = this.gps.getChildById("XPDRIdent");
        this.Com1Active = this.gps.getChildById("Com1Active");
        this.Com1Active_Freq = this.Com1Active.getElementsByClassName("mainNumber")[0];
        this.Com1Stby = this.gps.getChildById("Com1Stby");
        this.Com1Stby_Freq = this.Com1Stby.getElementsByClassName("mainNumber")[0];
        this.Com2Active = this.gps.getChildById("Com2Active");
        this.Com2Active_Freq = this.Com2Active.getElementsByClassName("mainNumber")[0];
        this.Com2Stby = this.gps.getChildById("Com2Stby");
        this.Com2Stby_Freq = this.Com2Stby.getElementsByClassName("mainNumber")[0];
        this.XPDR = this.gps.getChildById("XPDR");
        this.XPDRStatus = this.XPDR.getElementsByClassName("topText")[0];
        this.XPDRCode = this.XPDR.getElementsByClassName("mainNumber")[0];
        this.PilotIsolate = this.gps.getChildById("PilotIsolate");
        this.Mic_Button = this.gps.getChildById("Mic");
        this.Mon_Button = this.gps.getChildById("Mon");
        this.Mic_Com1_Status = this.gps.getChildById("Com1_MicActive");
        this.Mic_Com2_Status = this.gps.getChildById("Com2_MicActive");
        this.Mon_Com1_Status = this.gps.getChildById("Com1_MonActive");
        this.Mon_Com2_Status = this.gps.getChildById("Com2_MonActive");
        this.PilotMusic = this.gps.getChildById("PilotMusic");
        this.AudioRadio = this.gps.getChildById("AudioRadio");
        this.Intercom = this.gps.getChildById("Intercom");
        this.NKFindButton = this.gps.getChildById("NKFindButton");
        this.NKBkspButton = this.gps.getChildById("NKBkspButton");
        this.NK_1 = this.gps.getChildById("NK_1");
        this.NK_2 = this.gps.getChildById("NK_2");
        this.NK_3 = this.gps.getChildById("NK_3");
        this.NK_4 = this.gps.getChildById("NK_4");
        this.NK_5 = this.gps.getChildById("NK_5");
        this.NK_6 = this.gps.getChildById("NK_6");
        this.NK_7 = this.gps.getChildById("NK_7");
        this.NK_8 = this.gps.getChildById("NK_8");
        this.NK_9 = this.gps.getChildById("NK_9");
        this.NKPlayButton = this.gps.getChildById("NKPlayButton");
        this.NK_0 = this.gps.getChildById("NK_0");
        this.NKXferButton = this.gps.getChildById("NKXferButton");
        this.gps.makeButton(this.Com1Stby, this.setSelectedCom.bind(this, 1));
        this.gps.makeButton(this.Com2Stby, this.setSelectedCom.bind(this, 2));
        this.gps.makeButton(this.Com1Active, this.swapCom1.bind(this));
        this.gps.makeButton(this.Com2Active, this.swapCom2.bind(this));
        this.gps.makeButton(this.NK_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.NK_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.NK_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.NK_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.NK_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.NK_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.NK_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.NK_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.NK_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.NK_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.NKBkspButton, this.backspace.bind(this));
        this.gps.makeButton(this.NKXferButton, this.swapSelectedCom.bind(this));
        this.gps.makeButton(this.XPDR, this.openTransponder.bind(this));
        this.gps.makeButton(this.XPDRIdent, this.xpdrIdent.bind(this));
        this.gps.makeButton(this.AudioRadio, this.openAudioRadios.bind(this));
        this.gps.makeButton(this.Mic_Button, this.MicSwitch.bind(this));
        this.gps.makeButton(this.Mon_Button, this.MonSwitch.bind(this));
    }
    onEnter() {
        this.setSoftkeysNames();
    }
    onUpdate(_deltaTime) {
        const com1Active = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3);
        let com1Stby;
        if (this.selectedCom != 1 || this.inputIndex == -1) {
            com1Stby = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3);
        } else {
            const state = this.gps.blinkGetState(1000, 500) ? "Blink" : "Off";
            var regex = new RegExp('^(.{' + (this.inputIndex > 2 ? this.inputIndex + 1 : this.inputIndex) + '})(.)(.*)');
            var replace = '<span class="Writed">$1</span><span class="Writing" state="' + state + '">$2</span><span class = "ToWrite">$3</span>';
            com1Stby = ((this.currentInput / 1000).toFixed(SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3) + " ").replace(regex, replace);
        }
        const com2Active = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3);
        let com2Stby;
        if (this.selectedCom != 2 || this.inputIndex == -1) {
            com2Stby = this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3);
        } else {
            const state = this.gps.blinkGetState(1000, 500) ? "Blink" : "Off";
            var regex = new RegExp('^(.{' + (this.inputIndex > 2 ? this.inputIndex + 1 : this.inputIndex) + '})(.)(.*)');
            var replace = '<span class="Writed">$1</span><span class="Writing" state="' + state + '">$2</span><span class = "ToWrite">$3</span>';
            com2Stby = ((this.currentInput / 1000).toFixed(SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3) + " ").replace(regex, replace);
        }
        if (this.Com1Active_Freq.innerHTML != com1Active) {
            this.Com1Active_Freq.innerHTML = com1Active;
        }
        if (this.Com1Stby_Freq.innerHTML != com1Stby) {
            this.Com1Stby_Freq.innerHTML = com1Stby;
        }
        if (this.Com2Active_Freq.innerHTML != com2Active) {
            this.Com2Active_Freq.innerHTML = com2Active;
        }
        if (this.Com2Stby_Freq.innerHTML != com2Stby) {
            this.Com2Stby_Freq.innerHTML = com2Stby;
        }
        if (this.selectedCom == 1) {
            this.Com1Stby.setAttribute("state", "Selected");
            this.Com2Stby.setAttribute("state", "none");
        } else if (this.selectedCom == 2) {
            this.Com1Stby.setAttribute("state", "none");
            this.Com2Stby.setAttribute("state", "Selected");
        }
        const xpdrState = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (this.xpdrState != xpdrState) {
            this.xpdrState = xpdrState;
            switch (xpdrState) {
                case 0:
                    this.XPDRStatus.innerHTML = "Off";
                    this.XPDR.setAttribute("state", "");
                    break;
                case 1:
                    this.XPDRStatus.innerHTML = "STBY";
                    this.XPDR.setAttribute("state", "");
                    break;
                case 2:
                    this.XPDRStatus.innerHTML = "TEST";
                    this.XPDR.setAttribute("state", "");
                    break;
                case 3:
                    this.XPDRStatus.innerHTML = "ON";
                    this.XPDR.setAttribute("state", "Green");
                    break;
                case 4:
                    this.XPDRStatus.innerHTML = "ALT";
                    this.XPDR.setAttribute("state", "Green");
                    break;
            }
        }
        const transponderCode = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
        if (transponderCode != this.XPDRCode.innerHTML) {
            this.XPDRCode.innerHTML = transponderCode;
        }
        const comSpacingMode = SimVar.GetSimVarValue("COM SPACING MODE:" + this.selectedCom, "Enum");
        if (comSpacingMode == 0 && this.currentInput % 25 != 0) {
            this.currentInput -= this.currentInput % 25;
        }
        if (comSpacingMode == 0 && this.inputIndex > 5) {
            this.inputIndex = 5;
        }
        if (this.identTime > 0) {
            this.identTime -= this.gps.deltaTime;
            Avionics.Utils.diffAndSetAttribute(this.XPDRIdent, "state", "Active");
        } else {
            Avionics.Utils.diffAndSetAttribute(this.XPDRIdent, "state", "");
        }
        Avionics.Utils.diffAndSetAttribute(this.Mic_Com1_Status, "visibility", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") ? "visible" : "hidden");
        Avionics.Utils.diffAndSetAttribute(this.Com1Active, "state", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.Mic_Com2_Status, "visibility", SimVar.GetSimVarValue("COM TRANSMIT:2", "Bool") ? "visible" : "hidden");
        Avionics.Utils.diffAndSetAttribute(this.Com2Active, "state", SimVar.GetSimVarValue("COM TRANSMIT:2", "Bool") ? "Active" : "");
        Avionics.Utils.diffAndSetAttribute(this.Mon_Com1_Status, "visibility", SimVar.GetSimVarValue("COM RECEIVE:1", "Bool") ? "visible" : "hidden");
        Avionics.Utils.diffAndSetAttribute(this.Mon_Com2_Status, "visibility", SimVar.GetSimVarValue("COM RECEIVE:2", "Bool") ? "visible" : "hidden");
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.deactivateNavButton(3);
        this.gps.deactivateNavButton(4);
        this.gps.deactivateNavButton(5);
        this.gps.deactivateNavButton(6);
    }
    onEvent(_event) {
        switch (_event) {
        }
        if (!this.gps.popUpElement) {
            switch (_event) {
                case "TopKnob_Large_INC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_WHOLE_INC", "Bool", 1);
                    break;
                case "TopKnob_Large_DEC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_WHOLE_DEC", "Bool", 1);
                    break;
                case "TopKnob_Small_INC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_FRACT_INC", "Bool", 1);
                    break;
                case "TopKnob_Small_DEC":
                    SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_RADIO_FRACT_DEC", "Bool", 1);
                    break;
                case "TopKnob_Push":
                    this.selectedCom == 1 ? this.setSelectedCom(2) : this.setSelectedCom(1);
                    break;
                case "TopKnob_Push_Long":
                    this.swapSelectedCom();
                    break;
                case "BottomKnob_Small_INC":
                    break;
                case "BottomKnob_Small_DEC":
                    break;
                case "BottomKnob_Push":
                    break;
            }
        }
    }
    MicSwitch() {
        SimVar.SetSimVarValue("K:PILOT_TRANSMITTER_SET", "number", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 1 : 0);
        SimVar.SetSimVarValue("K:COPILOT_TRANSMITTER_SET", "number", SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 1 : 0);
    }
    MonSwitch() {
        SimVar.SetSimVarValue("K:COM" + (SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 2 : 1) + "_RECEIVE_SELECT", "number", SimVar.GetSimVarValue("COM RECEIVE:" + (SimVar.GetSimVarValue("COM TRANSMIT:1", "Bool") == 1 ? 2 : 1), "Bool") == 1 ? 0 : 1);
    }
    setSelectedCom(_id) {
        if (this.inputIndex != -1) {
            this.comFreqValidate();
        }
        this.selectedCom = _id;
        this.setSoftkeysNames();
    }
    swapCom1() {
        if (this.inputIndex != -1 && this.selectedCom == 1) {
            this.comFreqValidate();
        }
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Boolean", 1);
    }
    swapCom2() {
        if (this.inputIndex != -1 && this.selectedCom == 2) {
            this.comFreqValidate();
        }
        SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Boolean", 1);
    }
    swapSelectedCom() {
        if (this.selectedCom == 1) {
            this.swapCom1();
        } else if (this.selectedCom == 2) {
            this.swapCom2();
        }
    }
    onDigitPress(_digit) {
        switch (this.inputIndex) {
            case -1:
            case 0:
                this.gps.activateNavButton(1, "Cancel", this.comFreqCancel.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
                this.gps.activateNavButton(6, "Enter", this.comFreqValidate.bind(this), false, "Icons/ICON_MAP_ENTER.png");
                if (_digit == 1) {
                    this.inputIndex = 1;
                    this.currentInput = 118000;
                } else if (_digit != 0 && _digit < 4) {
                    this.inputIndex = 2;
                    this.currentInput = 100000 + 10000 * _digit;
                } else {
                    this.inputIndex = 1;
                    this.currentInput = 118000;
                }
                break;
            case 1:
                if (_digit > 1 && _digit < 4) {
                    this.inputIndex = 2;
                    this.currentInput = 100000 + 10000 * _digit;
                } else if (_digit == 1) {
                    this.inputIndex = 2;
                    this.currentInput = 118000;
                } else if (_digit >= 8) {
                    this.inputIndex = 3;
                    this.currentInput = 110000 + _digit * 1000;
                }
                break;
            case 2:
                if (this.currentInput == 118000) {
                    if (_digit == 8) {
                        this.inputIndex = 3;
                    } else if (_digit == 9) {
                        this.currentInput = 119000;
                        this.inputIndex = 3;
                    }
                } else {
                    if (!(this.currentInput == 130000 && _digit > 6)) {
                        this.currentInput += _digit * 1000;
                        this.inputIndex = 3;
                    }
                }
                break;
            case 3:
                this.currentInput += 100 * _digit;
                this.inputIndex = 4;
                break;
            case 4:
                if (SimVar.GetSimVarValue("COM SPACING MODE:" + this.selectedCom, "Enum") == 0) {
                    if (_digit == 0 || _digit == 2 || _digit == 5 || _digit == 7) {
                        this.currentInput += 10 * _digit;
                        this.inputIndex = 5;
                    }
                } else {
                    this.currentInput += 10 * _digit;
                    if (this.currentInput % 25 == 20) {
                        this.currentInput += 5;
                        this.inputIndex = 6;
                    } else {
                        this.inputIndex = 5;
                    }
                }
                break;
            case 5:
                if (SimVar.GetSimVarValue("COM SPACING MODE:" + this.selectedCom, "Enum") == 1) {
                    const newVal = this.currentInput + _digit;
                    const test = newVal % 25;
                    if (test == 0 || test == 5 || test == 10 || test == 15) {
                        this.currentInput = newVal;
                        this.inputIndex = 6;
                    }
                }
                break;
        }
    }
    backspace() {
        if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput = Math.pow(10, 6 - this.inputIndex) * Math.floor(this.currentInput / Math.pow(10, 6 - this.inputIndex));
            if (this.currentInput < 118000) {
                this.currentInput = 118000;
            }
            if (this.inputIndex == 5 && this.currentInput % 25 == 20) {
                this.backspace();
            }
        }
    }
    comFreqValidate() {
        SimVar.SetSimVarValue("K:COM" + (this.selectedCom == 1 ? "" : "2") + "_STBY_RADIO_SET_HZ", "Hz", this.currentInput * 1000);
        this.comFreqCancel();
    }
    comFreqCancel() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(6);
        this.inputIndex = -1;
    }
    openTransponder() {
        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        this.gps.switchToPopUpPage(this.gps.transponderWindow);
    }
    openAudioRadios() {
        if (this.inputIndex != -1) {
            this.comFreqCancel();
        }
        this.gps.switchToPopUpPage(this.gps.audioRadioWindow);
    }
    xpdrIdent() {
        const currMode = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (currMode == 3 || currMode == 4) {
            this.identTime = 18000;
        }
    }
    setSoftkeysNames() {
        this.gps.setTopKnobText("COM" + this.selectedCom + " Freq Push: 1-2 Hold: Swap");
        this.gps.setBottomKnobText("Pilot COM" + this.selectedCom + " Volume Push: Squelch");
    }
}
class AS3000_TSC_Transponder extends NavSystemTouch_Transponder {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Cancel", this.cancelCode.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.cancelCode.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateCode.bind(this), true, "Icons/ICON_MAP_ENTER.png");
        this.gps.setTopKnobText("Data Entry Push: Enter", true);
        this.gps.setBottomKnobText("", true);
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    onEvent(_event) {
        super.onEvent(_event);
        switch (_event) {
            case "TopKnob_Large_INC":
                if (this.inputIndex < 4) {
                    this.inputIndex++;
                }
                break;
            case "TopKnob_Large_DEC":
                if (this.inputIndex == -1) {
                    this.inputIndex = 0;
                } else if (this.inputIndex > 0) {
                    this.inputIndex--;
                }
                break;
            case "TopKnob_Small_INC":
                if (this.inputIndex == -1) {
                    this.inputIndex = 0;
                } else if (this.inputIndex < 4) {
                    this.currentInput[this.inputIndex] = (this.currentInput[this.inputIndex] + 1) % 8;
                }
                break;
            case "TopKnob_Small_DEC":
                if (this.inputIndex == -1) {
                    this.inputIndex = 0;
                } else if (this.inputIndex < 4) {
                    this.currentInput[this.inputIndex]--;
                    if (this.currentInput[this.inputIndex] < 0) {
                        this.currentInput[this.inputIndex] = 7;
                    }
                }
                break;
            case "TopKnob_Push":
            case "TopKnob_Push_Long":
                this.validateCode();
                break;
        }
        this.inputChanged = true;
    }
}
class AS3000_TSC_AudioRadios_Line {
    constructor(_lineElement, _topKnobText, _bottomKnobText, _eventCallback) {
        this.lineElement = _lineElement;
        this.topKnobText = _topKnobText;
        this.bottomKnobText = _bottomKnobText;
        this.eventCallback = _eventCallback;
    }
}
class AS3000_TSC_AudioRadios extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.selectedLine = 0;
    }
    init(root) {
        this.window = root;
        this.pilotBody = this.gps.getChildById("AudioRadioPilotBody");
        this.lines = [];
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Nav1"), "NAV1 Freq Hold: Swap", "Pilot NAV1 Volume Push: ID", this.nav1EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Nav2"), "NAV2 Freq Hold: Swap", "Pilot NAV2 Volume Push: ID", this.nav2EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Com1"), "COM1 Freq Push: 1-2 Hold: Swap", "Pilot COM1 Volume Push: Squelch", this.com1EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Com2"), "COM2 Freq Push: 1-2 Hold: Swap", "Pilot COM2 Volume Push: Squelch", this.com2EventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Speaker"), "", "Pilot Speaker Volume", this.speakerEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Recorder"), "", "Pilot Recorder Volume", this.recorderEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Marker"), "", "Pilot Marker Volume", this.markerEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Adf"), "", "ADF Volume", this.adfEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Music"), "", "Pilot Music Volume", this.musicEventCallback.bind(this)));
        this.lines.push(new AS3000_TSC_AudioRadios_Line(this.gps.getChildById("Clicks"), "", "Pilot Clicks Volume", this.clicksEventCallback.bind(this)));
        this.Nav1_Frequencies = this.gps.getChildById("Nav1_Frequencies");
        this.Nav1_Active = this.Nav1_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Nav1_Stby = this.Nav1_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Nav2_Frequencies = this.gps.getChildById("Nav2_Frequencies");
        this.Nav2_Active = this.Nav2_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Nav2_Stby = this.Nav2_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Com1_Frequencies = this.gps.getChildById("Com1_Frequencies");
        this.Com1_Active = this.Com1_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Com1_Stby = this.Com1_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Com2_Frequencies = this.gps.getChildById("Com2_Frequencies");
        this.Com2_Active = this.Com2_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Com2_Stby = this.Com2_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.Adf_Frequencies = this.gps.getChildById("Adf_Frequencies");
        this.Adf_Active = this.Adf_Frequencies.getElementsByClassName("activeFreq")[0];
        this.Adf_Stby = this.Adf_Frequencies.getElementsByClassName("standbyFreq")[0];
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.pilotBody;
        this.scrollElement.elementSize = this.lines[0].lineElement.getBoundingClientRect().height;
        this.gps.makeButton(this.Nav1_Frequencies, this.openFrequencyKeyboard.bind(this, "NAV1", 108, 117.95, "NAV ACTIVE FREQUENCY:1", "NAV STANDBY FREQUENCY:1", this.setNav1Freq.bind(this)));
        this.gps.makeButton(this.Nav2_Frequencies, this.openFrequencyKeyboard.bind(this, "NAV2", 108, 117.95, "NAV ACTIVE FREQUENCY:2", "NAV STANDBY FREQUENCY:2", this.setNav2Freq.bind(this)));
        this.gps.makeButton(this.Com1_Frequencies, this.openFrequencyKeyboard.bind(this, "COM1 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:1", "COM STANDBY FREQUENCY:1", this.setCom1Freq.bind(this), "COM SPACING MODE:1"));
        this.gps.makeButton(this.Com2_Frequencies, this.openFrequencyKeyboard.bind(this, "COM2 Standby", 118, 136.99, "COM ACTIVE FREQUENCY:2", "COM STANDBY FREQUENCY:2", this.setCom2Freq.bind(this), "COM SPACING MODE:2"));
        this.gps.makeButton(this.Adf_Frequencies, this.openAdfFrequencyKeyboard.bind(this, "ADF", 190.0, 1799.5, "ADF ACTIVE FREQUENCY:1", "ADF STANDBY FREQUENCY:1", this.setAdfFreq.bind(this)));
        for (let i = 0; i < this.lines.length; i++) {
            this.gps.makeButton(this.lines[i].lineElement, this.setSelectedLine.bind(this, i));
        }
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.gps.activateNavButton(1, "Back", this.closeWindow.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.closeWindow.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), true, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), true, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
        this.gps.setTopKnobText(this.lines[this.selectedLine].topKnobText, true);
        this.gps.setBottomKnobText(this.lines[this.selectedLine].bottomKnobText, true);
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines[0].lineElement.getBoundingClientRect().height;
        }
        this.scrollElement.update();
        Avionics.Utils.diffAndSet(this.Nav1_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Nav1_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:1", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Nav2_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:2", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Nav2_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:2", "MHz"), 2));
        Avionics.Utils.diffAndSet(this.Com1_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Com1_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Com2_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Com2_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:2", "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3));
        Avionics.Utils.diffAndSet(this.Adf_Active, this.gps.frequencyFormat(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"), 1));
        Avionics.Utils.diffAndSet(this.Adf_Stby, this.gps.frequencyFormat(SimVar.GetSimVarValue("ADF STANDBY FREQUENCY:1", "KHz"), 1));
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(5, true);
        this.gps.deactivateNavButton(6, true);
    }
    onEvent(_event) {
        this.lines[this.selectedLine].eventCallback(_event);
    }
    closeWindow() {
        this.gps.closePopUpElement();
    }
    scrollUp() {
        this.scrollElement.scrollUp();
    }
    scrollDown() {
        this.scrollElement.scrollDown();
    }
    openFrequencyKeyboard(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, _frequencySpacingModeSimvar) {
        this.gps.frequencyKeyboard.getElementOfType(AS3000_TSC_FrequencyKeyboard).setContext(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, this.container, _frequencySpacingModeSimvar);
        this.gps.switchToPopUpPage(this.gps.frequencyKeyboard);
    }
    openAdfFrequencyKeyboard(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack) {
        this.gps.adfFrequencyKeyboard.getElementOfType(AS3000_TSC_ADFFrequencyKeyboard).setContext(_title, _minFreq, _maxFreq, _activeSimVar, _StbySimVar, _endCallBack, this.container, "");
        this.gps.switchToPopUpPage(this.gps.adfFrequencyKeyboard);
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
    setCom1Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
        }
    }
    setCom2Freq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET_HZ", "Hz", _newFreq);
        if (swap) {
            SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 1);
        }
    }
    setAdfFreq(_newFreq, swap) {
        SimVar.SetSimVarValue("K:ADF1_RADIO_SWAP", "Boolean", 0);
        SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(_newFreq * 1000));
        if (!swap) {
            SimVar.SetSimVarValue("K:ADF1_RADIO_SWAP", "Boolean", 0);
        }
    }
    setSelectedLine(_index) {
        this.lines[this.selectedLine].lineElement.setAttribute("state", "");
        this.selectedLine = _index;
        this.lines[this.selectedLine].lineElement.setAttribute("state", "Selected");
        this.gps.setTopKnobText(this.lines[this.selectedLine].topKnobText, true);
        this.gps.setBottomKnobText(this.lines[this.selectedLine].bottomKnobText, true);
    }
    nav1EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:NAV1_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    nav2EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:NAV2_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:NAV2_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    com1EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:COM_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:COM_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:COM_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:COM_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                this.setSelectedLine(3);
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    com2EventCallback(_event) {
        switch (_event) {
            case "TopKnob_Large_INC":
                SimVar.SetSimVarValue("K:COM2_RADIO_WHOLE_INC", "Bool", 1);
                break;
            case "TopKnob_Large_DEC":
                SimVar.SetSimVarValue("K:COM2_RADIO_WHOLE_DEC", "Bool", 1);
                break;
            case "TopKnob_Small_INC":
                SimVar.SetSimVarValue("K:COM2_RADIO_FRACT_INC", "Bool", 1);
                break;
            case "TopKnob_Small_DEC":
                SimVar.SetSimVarValue("K:COM2_RADIO_FRACT_DEC", "Bool", 1);
                break;
            case "TopKnob_Push":
                this.setSelectedLine(2);
                break;
            case "TopKnob_Push_Long":
                SimVar.SetSimVarValue("K:COM2_RADIO_SWAP", "Bool", 1);
                break;
            case "BottomKnob_Small_INC":
                break;
            case "BottomKnob_Small_DEC":
                break;
            case "BottomKnob_Push":
                break;
        }
    }
    speakerEventCallback(_event) {
    }
    recorderEventCallback(_event) {
    }
    markerEventCallback(_event) {
    }
    adfEventCallback(_event) {
    }
    musicEventCallback(_event) {
    }
    clicksEventCallback(_event) {
    }
}
class AS3000_TSC_FrequencyKeyboard extends NavSystemTouch_FrequencyKeyboard {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "Icons/ICON_MAP_ENTER.png");
        this.gps.deactivateNavButton(5);
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    cancelEdit() {
        this.gps.goBack();
    }
}
class AS3000_TSC_ADFFrequencyKeyboard extends NavSystemTouch_ADFFrequencyKeyboard {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "Icons/ICON_MAP_ENTER.png");
        this.gps.deactivateNavButton(5);
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    cancelEdit() {
        this.gps.goBack();
    }
}
class AS3000_TSC_TimeKeyboard extends NavSystemTouch_TimeKeyboard {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "Icons/ICON_MAP_ENTER.png");
        this.gps.deactivateNavButton(5);
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    cancelEdit() {
        this.gps.goBack();
    }
}
class AS3000_TSC_SpeedKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.digits = [0, 0, 0];
        this.isInputing = false;
        this.nbInput = 0;
        this.inputChanged = true;
    }
    init(root) {
        this.window = root;
        this.backspaceButton = this.gps.getChildById("SK_Bksp");
        this.button_0 = this.gps.getChildById("SK_0");
        this.button_1 = this.gps.getChildById("SK_1");
        this.button_2 = this.gps.getChildById("SK_2");
        this.button_3 = this.gps.getChildById("SK_3");
        this.button_4 = this.gps.getChildById("SK_4");
        this.button_5 = this.gps.getChildById("SK_5");
        this.button_6 = this.gps.getChildById("SK_6");
        this.button_7 = this.gps.getChildById("SK_7");
        this.button_8 = this.gps.getChildById("SK_8");
        this.button_9 = this.gps.getChildById("SK_9");
        this.display = this.gps.getChildById("SK_Display");
        this.gps.makeButton(this.button_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.button_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.button_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.button_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.button_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.button_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.button_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.button_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.button_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.button_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.backspaceButton, this.onBackSpacePress.bind(this));
    }
    setContext(_endCallback, _backPage, _startingValue) {
        this.endCallback = _endCallback;
        this.backPage = _backPage;
        this.currentInput = _startingValue;
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.isInputing = false;
        this.digits = [0, 0, 0];
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "Icons/ICON_MAP_ENTER.png");
        this.gps.deactivateNavButton(5);
    }
    onUpdate(_deltaTime) {
        if (this.isInputing) {
            if (this.inputChanged) {
                let text = "";
                for (let i = 0; i < this.digits.length - 1; i++) {
                    text += '<span class="' + (i < this.digits.length - this.nbInput ? "ToWrite" : "Writed") + '">';
                    text += this.digits[i];
                    text += '</span>';
                }
                text += '<span class="Writing">' + this.digits[this.digits.length - 1] + '</span>';
                this.inputChanged = false;
                this.display.innerHTML = text;
            }
        } else {
            this.display.innerHTML = this.currentInput + "KT";
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
        this.currentInput = 100 * this.digits[0] + 10 * this.digits[1] + this.digits[2];
        this.inputChanged = true;
        if (this.nbInput < this.digits.length) {
            this.nbInput++;
        }
    }
    onBackSpacePress() {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
        this.currentInput = 100 * this.digits[0] + 10 * this.digits[1] + this.digits[2];
        this.inputChanged = true;
        if (this.nbInput > 0) {
            this.nbInput--;
        }
    }
    backHome() {
        this.gps.closePopUpElement();
    }
    cancelEdit() {
        this.gps.goBack();
    }
    validateEdit() {
        this.endCallback(this.currentInput);
        this.cancelEdit();
    }
}
class AS3000_TSC_AltitudeKeyboard extends NavSystemTouch_AltitudeKeyboard {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "Icons/ICON_MAP_ENTER.png");
        this.gps.deactivateNavButton(5);
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    cancelEdit() {
        this.gps.goBack();
    }
}
class AS3000_TSC_FullKeyboard extends NavSystemTouch_FullKeyboard {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.cancel.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validate.bind(this), true, "Icons/ICON_MAP_ENTER.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    cancel() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    validate() {
        const nbMatched = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.gps.instrumentIdentifier);
        if (nbMatched > 1) {
            this.gps.duplicateWaypointSelection.element.setContext(this.endCallback);
            this.gps.goBack();
            this.gps.switchToPopUpPage(this.gps.duplicateWaypointSelection);
        } else {
            this.endCallback(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.gps.instrumentIdentifier));
            this.gps.goBack();
        }
        return true;
    }
}
class AS3000_TSC_TerrainAlert extends Warnings {
    constructor() {
        super(...arguments);
        this.lastAcknowledged = 0;
        this.lastActive = 0;
    }
    init(_root) {
        super.init(_root);
        this.window = _root;
        this.warning = this.gps.getChildById("Warning");
        this.warningContent = this.gps.getChildById("WarningContent");
        this.Warning_Ok = this.gps.getChildById("Warning_Ok");
        this.gps.makeButton(this.Warning_Ok, this.acknowledge.bind(this));
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        const warningIndex = SimVar.GetSimVarValue("L:AS1000_Warnings_WarningIndex", "number");
        if (warningIndex == 0) {
            this.lastAcknowledged = 0;
            this.lastActive = 0;
        }
        if (warningIndex > 0 && this.lastAcknowledged != warningIndex && this.warnings[warningIndex - 1].level > 1) {
            if (this.lastActive != warningIndex) {
                this.window.setAttribute("state", "Active");
                this.warning.setAttribute("state", (this.warnings[warningIndex - 1].level == 2 ? "Yellow" : "Red"));
                this.warningContent.innerHTML = this.warnings[warningIndex - 1].longText;
                this.lastActive = warningIndex;
            }
        } else {
            if (this.window.getAttribute("state") == "Active") {
                this.window.setAttribute("state", "Inactive");
                this.lastActive = 0;
            }
        }
    }
    onEnter() {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    acknowledge() {
        this.lastAcknowledged = SimVar.GetSimVarValue("L:AS1000_Warnings_WarningIndex", "number");
    }
}
class AS3000_TSC_WaypointButtonElement {
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
class AS3000_TSC_InsertBeforeWaypoint extends NavSystemElement {
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
        this.gps.currFlightPlanManager.updateFlightPlan();
        this.window.setAttribute("state", "Active");
        this.gps.activateNavButton(1, "Back", this.back.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), true, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), true, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = (this.elements.length > 0 ? this.elements[1].base.getBoundingClientRect().height : 0);
        }
        this.scrollElement.update();
        for (let i = 0; i < this.gps.currFlightPlanManager.getWaypointsCount(); i++) {
            if (this.elements.length < i + 1) {
                const newElem = new AS3000_TSC_WaypointButtonElement();
                this.gps.makeButton(newElem.button, this.elementClick.bind(this, i));
                this.table.insertBefore(newElem.base, this.endButtonLine);
                this.elements.push(newElem);
            }
            const infos = this.gps.currFlightPlanManager.getWaypoint(i).infos;
            Avionics.Utils.diffAndSet(this.elements[i].ident, infos.ident);
            Avionics.Utils.diffAndSet(this.elements[i].name, infos.name);
            const symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.elements[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
        }
        for (let i = this.gps.currFlightPlanManager.getWaypointsCount(); i < this.elements.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.elements[i].base, "state", "Inactive");
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(4, true);
        this.gps.deactivateNavButton(6, true);
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
        this.gps.goBack();
    }
    endButtonClick() {
        this.elementClick(this.elements.length);
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    scrollUp() {
        this.scrollElement.scrollUp();
    }
    scrollDown() {
        this.scrollElement.scrollDown();
    }
}
class AS3000_TSC_DuplicateWaypointSelection extends NavSystemTouch_DuplicateWaypointSelection {
    onEnter() {
        super.onEnter();
        this.gps.activateNavButton(1, "Back", this.back.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(5, "Up", this.scrollUp.bind(this), true, "Icons/ICON_MAP_CB_UP_ARROW_1.png");
        this.gps.activateNavButton(6, "Down", this.scrollDown.bind(this), true, "Icons/ICON_MAP_CB_DOWN_ARROW_1.png");
    }
    onExit() {
        super.onExit();
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(4, true);
        this.gps.deactivateNavButton(6, true);
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.gps.SwitchToPageName("MFD", "MFD Home");
        this.gps.closePopUpElement();
        return true;
    }
    scrollUp() {
        this.scrollElement.scrollUp();
    }
    scrollDown() {
        this.scrollElement.scrollDown();
    }
    onButtonClick(_index) {
        super.onButtonClick(_index);
        this.gps.goBack();
    }
}
class AS3000_TSC_Timers extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isCountingDown = false;
        this.isCounting = false;
        this.baseTime = 0;
        this.beginTime = 0;
        this.initialValue = 0;
    }
    init(root) {
        this.UpButton = this.gps.getChildById("TMR_UpButton");
        this.DownButton = this.gps.getChildById("TMR_DownButton");
        this.ResetButton = this.gps.getChildById("TMR_ResetButton");
        this.StopButton = this.gps.getChildById("TMR_StopButton");
        this.StopButtonTitle = this.StopButton.getElementsByClassName("upperTitle")[0];
        this.Timer = this.gps.getChildById("TMR_Timer");
        this.gps.makeButton(this.UpButton, this.setCountingDown.bind(this, false));
        this.gps.makeButton(this.DownButton, this.setCountingDown.bind(this, true));
        this.gps.makeButton(this.StopButton, this.switchCounting.bind(this));
        this.gps.makeButton(this.ResetButton, this.reinitialize.bind(this));
        this.gps.makeButton(this.Timer, this.openKeyboard.bind(this));
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onUpdate(_deltaTime) {
        if (this.isCountingDown) {
            Avionics.Utils.diffAndSetAttribute(this.UpButton, "state", "");
            Avionics.Utils.diffAndSetAttribute(this.DownButton, "state", "Active");
        } else {
            Avionics.Utils.diffAndSetAttribute(this.DownButton, "state", "");
            Avionics.Utils.diffAndSetAttribute(this.UpButton, "state", "Active");
        }
        Avionics.Utils.diffAndSet(this.StopButtonTitle, this.isCounting ? "Stop" : "Start");
        Avionics.Utils.diffAndSet(this.Timer, this.formatTimeFromMS(this.getCurrentDisplay()));
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
    onEvent(_event) {
    }
    setCountingDown(_state) {
        const currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
        if (this.isCounting) {
            this.baseTime = this.isCountingDown ? this.baseTime + this.beginTime - currTime : this.baseTime - this.beginTime + currTime;
            this.beginTime = currTime;
        }
        this.isCountingDown = _state;
    }
    switchCounting() {
        const currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
        this.isCounting = !this.isCounting;
        if (this.isCounting) {
            this.beginTime = currTime;
        } else {
            this.baseTime = this.isCountingDown ? this.baseTime + this.beginTime - currTime : this.baseTime - this.beginTime + currTime;
        }
    }
    formatTimeFromMS(_time) {
        const seconds = fastToFixed(Math.floor(_time / 1000) % 60, 0);
        const minutes = fastToFixed(Math.floor(_time / 60000) % 60, 0);
        const hours = fastToFixed(Math.floor(_time / 3600000) % 24, 0);
        return "00".slice(0, 2 - hours.length) + hours + ":" + "00".slice(0, 2 - minutes.length) + minutes + ":" + "00".slice(0, 2 - seconds.length) + seconds;
    }
    reinitialize() {
        if (this.isCounting) {
            this.switchCounting();
        }
        this.baseTime = (this.isCountingDown ? this.initialValue : 0);
    }
    openKeyboard() {
        this.gps.timeKeyboard.getElementOfType(AS3000_TSC_TimeKeyboard).setContext(this.endKeyboardCallback.bind(this), this.container, this.getCurrentDisplay());
        this.gps.switchToPopUpPage(this.gps.timeKeyboard);
    }
    endKeyboardCallback(_value) {
        const currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
        this.baseTime = _value;
        this.beginTime = currTime;
        this.initialValue = _value;
    }
    getCurrentDisplay() {
        const currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
        if (this.isCountingDown && this.isCounting && this.baseTime + this.beginTime - currTime <= 0) {
            this.setCountingDown(false);
            this.baseTime = 0;
            this.beginTime = currTime;
        }
        if (!this.isCountingDown && this.isCounting && this.baseTime - this.beginTime + currTime >= 86400000) {
            this.baseTime = 0;
            this.beginTime = currTime;
        }
        return this.isCounting ? this.isCountingDown ? this.baseTime + this.beginTime - currTime : this.baseTime - this.beginTime + currTime : this.baseTime;
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.back();
        return true;
    }
}
class AS3000_TSC_Minimums extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.currentMode = 0;
        this.digits = [0, 0, 0, 0, 0];
        this.isEditing = false;
    }
    init(root) {
        this.typeButton = this.gps.getChildById("min_typeButton");
        this.typeButtonValue = this.typeButton.getElementsByClassName("lowerValue")[0];
        this.tempAtDestButton = this.gps.getChildById("min_tempAtDestButton");
        this.tempAtDestButtonValue = this.tempAtDestButton.getElementsByClassName("lowerValue")[0];
        this.display = this.gps.getChildById("min_Display");
        this.min_1 = this.gps.getChildById("min_1");
        this.min_2 = this.gps.getChildById("min_2");
        this.min_3 = this.gps.getChildById("min_3");
        this.min_4 = this.gps.getChildById("min_4");
        this.min_5 = this.gps.getChildById("min_5");
        this.min_6 = this.gps.getChildById("min_6");
        this.min_7 = this.gps.getChildById("min_7");
        this.min_8 = this.gps.getChildById("min_8");
        this.min_9 = this.gps.getChildById("min_9");
        this.min_0 = this.gps.getChildById("min_0");
        this.min_Bksp = this.gps.getChildById("min_Bksp");
        this.setMode(0);
        this.gps.makeButton(this.typeButton, this.openMinimumSourceSelection.bind(this));
        this.gps.makeButton(this.min_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.min_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.min_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.min_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.min_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.min_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.min_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.min_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.min_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.min_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.min_Bksp, this.onBkspPress.bind(this));
    }
    onEnter() {
        this.isEditing = false;
        this.gps.activateNavButton(1, "Back", this.cancelEdit.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), true, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        this.gps.activateNavButton(6, "Enter", this.validateEdit.bind(this), true, "Icons/ICON_MAP_ENTER.png");
    }
    onUpdate(_deltaTime) {
        if (this.isEditing) {
            let display = '<span class="ToWrite">';
            let zerosEnded = false;
            for (let i = 0; i < this.digits.length - 1; i++) {
                if (this.digits[i] != 0 && !zerosEnded) {
                    display += '</span><span class="Writed">';
                    zerosEnded = true;
                }
                display += this.digits[i].toString();
            }
            display += '</span><span class="Writing">' + this.digits[this.digits.length - 1] + '</span><span class="Writed">FT</span>';
            Avionics.Utils.diffAndSet(this.display, display);
        } else {
            let display = '<span class="Initial">';
            display += SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number");
            Avionics.Utils.diffAndSet(this.display, display + "FT</span>");
        }
    }
    onExit() {
        this.gps.deactivateNavButton(1, true);
        this.gps.deactivateNavButton(2, true);
        this.gps.deactivateNavButton(6, true);
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (!this.isEditing) {
            this.isEditing = true;
            this.digits = [0, 0, 0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
    }
    onBkspPress() {
        if (!this.isEditing) {
            this.isEditing = true;
            this.digits = [0, 0, 0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
    }
    openMinimumSourceSelection() {
        this.gps.minimumSource.element.setContext(this.setMode.bind(this));
        this.gps.switchToPopUpPage(this.gps.minimumSource);
    }
    setMode(_mode) {
        this.currentMode = _mode;
        Avionics.Utils.diffAndSetAttribute(this.tempAtDestButton, "state", (_mode == 2 ? "Active" : "Inactive"));
        let newValue = "";
        switch (_mode) {
            case 0:
                newValue = "Off";
                break;
            case 1:
                newValue = "Baro";
                break;
            case 2:
                newValue = "Temp Comp";
                break;
            case 3:
                newValue = "Radio Alt";
                break;
        }
        Avionics.Utils.diffAndSet(this.typeButtonValue, newValue);
    }
    cancelEdit() {
        this.gps.goBack();
    }
    backHome() {
        this.gps.SwitchToPageName("PFD", "PFD Home");
    }
    validateEdit() {
        if (this.isEditing) {
            let value = 0;
            for (let i = 0; i < this.digits.length; i++) {
                value += this.digits[i] * Math.pow(10, this.digits.length - i - 1);
            }
            SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", value);
        }
        SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", this.currentMode);
        this.cancelEdit();
    }
}
class AS3000_TSC_PFDSettings extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.active = 0;
        this.aoaMode = 0;
        this.windMode = 0;
        this.comSpacingMode = 0;
    }
    init(root) {
        this.aoaButton = this.gps.getChildById("AoaButton");
        this.aoaValue = this.aoaButton.getElementsByClassName("mainValue")[0];
        this.windButton = this.gps.getChildById("WindButton");
        this.windValue = this.windButton.getElementsByClassName("mainValue")[0];
        this.comSpacingButton = this.gps.getChildById("ComSpacingButton");
        this.comSpacingValue = this.comSpacingButton.getElementsByClassName("mainValue")[0];
        this.aoaOn = this.gps.getChildById("AoaOn");
        this.aoaOff = this.gps.getChildById("AoaOff");
        this.aoaAuto = this.gps.getChildById("AoaAuto");
        this.windO1 = this.gps.getChildById("WindO1");
        this.windO2 = this.gps.getChildById("WindO2");
        this.windO3 = this.gps.getChildById("WindO3");
        this.windOff = this.gps.getChildById("WindOff");
        this.channelSpacing25 = this.gps.getChildById("Com25");
        this.channelSpacing833 = this.gps.getChildById("Com833");
        this.aoaMenu = this.gps.getChildById("AoaSelectionMenu");
        this.windMenu = this.gps.getChildById("WindSelectionMenu");
        this.comSpacingSelectionMenu = this.gps.getChildById("ComSpacingSelectionMenu");
        this.gps.makeButton(this.aoaButton, this.aoaPress.bind(this));
        this.gps.makeButton(this.windButton, this.windPress.bind(this));
        this.gps.makeButton(this.comSpacingButton, this.compSpacingPress.bind(this));
        this.gps.makeButton(this.aoaOn, this.aoaSetMode.bind(this, "On"));
        this.gps.makeButton(this.aoaOff, this.aoaSetMode.bind(this, "Off"));
        this.gps.makeButton(this.aoaAuto, this.aoaSetMode.bind(this, "Auto"));
        this.gps.makeButton(this.windO1, this.windSetMode.bind(this, "O1"));
        this.gps.makeButton(this.windO2, this.windSetMode.bind(this, "O2"));
        this.gps.makeButton(this.windO3, this.windSetMode.bind(this, "O3"));
        this.gps.makeButton(this.windOff, this.windSetMode.bind(this, "Off"));
        this.gps.makeButton(this.channelSpacing25, this.channelSpacingSetMode.bind(this, 0));
        this.gps.makeButton(this.channelSpacing833, this.channelSpacingSetMode.bind(this, 1));
    }
    aoaPress() {
        this.active = (this.active == 1 ? 0 : 1);
        this.updateDisplayedMenu();
    }
    aoaSetMode(_mode) {
        LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", this.gps.pfdPrefix + "_AOA_" + _mode);
        this.active = 0;
        this.updateDisplayedMenu();
    }
    windPress() {
        this.active = (this.active == 2 ? 0 : 2);
        this.updateDisplayedMenu();
    }
    windSetMode(_mode) {
        LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", this.gps.pfdPrefix + "_Wind_" + _mode);
        this.active = 0;
        this.updateDisplayedMenu();
    }
    compSpacingPress() {
        this.active = (this.active == 3 ? 0 : 3);
        this.updateDisplayedMenu();
    }
    channelSpacingSetMode(_mode) {
        if (_mode != SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum")) {
            SimVar.SetSimVarValue("K:COM_1_SPACING_MODE_SWITCH", "number", 0);
        }
        if (_mode != SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum")) {
            SimVar.SetSimVarValue("K:COM_2_SPACING_MODE_SWITCH", "number", 0);
        }
        this.active = 0;
        this.updateDisplayedMenu();
    }
    updateDisplayedMenu() {
        Avionics.Utils.diffAndSetAttribute(this.aoaMenu, "state", this.active == 1 ? "Active" : "Inactive");
        Avionics.Utils.diffAndSetAttribute(this.windMenu, "state", this.active == 2 ? "Active" : "Inactive");
        Avionics.Utils.diffAndSetAttribute(this.comSpacingSelectionMenu, "state", this.active == 3 ? "Active" : "Inactive");
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onUpdate(_deltaTime) {
        const aoa = SimVar.GetSimVarValue("L:Glasscockpit_AOA_Mode", "number");
        const wind = SimVar.GetSimVarValue("L:Glasscockpit_Wind_Mode", "number");
        const comSpacing = SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum");
        if (aoa != this.aoaMode) {
            this.aoaMode = aoa;
            switch (aoa) {
                case 0:
                    this.aoaValue.textContent = "Off";
                    break;
                case 1:
                    this.aoaValue.textContent = "On";
                    break;
                case 2:
                    this.aoaValue.textContent = "Auto";
                    break;
            }
        }
        if (wind != this.windMode) {
            this.windMode = wind;
            switch (wind) {
                case 0:
                    this.windValue.textContent = "Off";
                    break;
                case 1:
                    this.windValue.textContent = "Option 1";
                    break;
                case 2:
                    this.windValue.textContent = "Option 2";
                    break;
                case 3:
                    this.windValue.textContent = "Option 3";
                    break;
            }
        }
        if (comSpacing != this.comSpacingMode) {
            this.comSpacingMode = comSpacing;
            switch (comSpacing) {
                case 0:
                    this.comSpacingValue.textContent = "25 kHz";
                    break;
                case 1:
                    this.comSpacingValue.textContent = "8.33 kHz";
                    break;
            }
        }
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
    onEvent(_event) {
    }
    back() {
        if (this.active != 0) {
            this.active = 0;
            this.updateDisplayedMenu();
        } else {
            this.gps.goBack();
        }
        return true;
    }
    backHome() {
        this.active = 0;
        this.updateDisplayedMenu();
        this.gps.SwitchToPageName("PFD", "PFD Home");
        return true;
    }
}
class AS3000_TSC_MinimumSource extends NavSystemElement {
    init(root) {
        this.window = root;
        this.minSource_Off = this.gps.getChildById("minSource_Off");
        this.minSource_Baro = this.gps.getChildById("minSource_Baro");
        this.minSource_TempComp = this.gps.getChildById("minSource_TempComp");
        this.minSource_RadioAlt = this.gps.getChildById("minSource_RadioAlt");
        this.gps.makeButton(this.minSource_Off, this.buttonClick.bind(this, 0));
        this.gps.makeButton(this.minSource_Baro, this.buttonClick.bind(this, 1));
        this.gps.makeButton(this.minSource_RadioAlt, this.buttonClick.bind(this, 3));
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_callback) {
        this.callBack = _callback;
    }
    buttonClick(_source) {
        this.callBack(_source);
        this.gps.goBack();
    }
}
class AS3000_TSC_AirspeedReference {
    constructor(_valueButton, _statusElem, _refSpeed, _displayName) {
        this.isDisplayed = false;
        this.valueButton = _valueButton;
        this.valueElement = _valueButton.getElementsByClassName("mainValue")[0];
        this.statusElement = _statusElem;
        this.refSpeed = _refSpeed;
        this.displayedSpeed = _refSpeed;
        this.displayName = _displayName;
    }
}
class AS3000_TSC_SpeedBugs extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.references = [];
    }
    init(root) {
        const designSpeeds = Simplane.getDesignSpeeds();
        this.references.push(new AS3000_TSC_AirspeedReference(this.gps.getChildById("SB_VrValue"), this.gps.getChildById("SB_VrStatus"), designSpeeds.Vr, "R"));
        this.references.push(new AS3000_TSC_AirspeedReference(this.gps.getChildById("SB_VxValue"), this.gps.getChildById("SB_VxStatus"), designSpeeds.Vx, "X"));
        this.references.push(new AS3000_TSC_AirspeedReference(this.gps.getChildById("SB_VyValue"), this.gps.getChildById("SB_VyStatus"), designSpeeds.Vy, "Y"));
        this.references.push(new AS3000_TSC_AirspeedReference(this.gps.getChildById("SB_VappValue"), this.gps.getChildById("SB_VappStatus"), designSpeeds.Vapp, "AP"));
        this.allOnButton = this.gps.getChildById("SB_AllOn");
        this.allOffButton = this.gps.getChildById("SB_AllOff");
        this.resetButton = this.gps.getChildById("SB_RestoreDefaults");
        this.gps.makeButton(this.allOnButton, this.allOn.bind(this));
        this.gps.makeButton(this.allOffButton, this.allOff.bind(this));
        this.gps.makeButton(this.resetButton, this.restoreAll.bind(this));
        for (let i = 0; i < this.references.length; i++) {
            this.gps.makeButton(this.references[i].statusElement, this.statusClick.bind(this, i));
            this.gps.makeButton(this.references[i].valueButton, this.valueClick.bind(this, i));
        }
    }
    onEnter() {
        this.gps.activateNavButton(1, "Back", this.back.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
    }
    onUpdate(_deltaTime) {
        let nbOn = 0;
        for (let i = 0; i < this.references.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.references[i].statusElement, "state", this.references[i].isDisplayed ? "Active" : "");
            if (this.references[i].isDisplayed) {
                nbOn++;
            }
            Avionics.Utils.diffAndSet(this.references[i].valueElement, Math.round(this.references[i].displayedSpeed) + (this.references[i].displayedSpeed == this.references[i].refSpeed ? "KT" : "KT*"));
        }
        Avionics.Utils.diffAndSetAttribute(this.allOffButton, "state", nbOn == 0 ? "Greyed" : "");
        Avionics.Utils.diffAndSetAttribute(this.allOnButton, "state", nbOn == this.references.length ? "Greyed" : "");
    }
    onExit() {
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
    }
    onEvent(_event) {
    }
    sendToPfd() {
        let bugs = "";
        for (let i = 0; i < this.references.length; i++) {
            if (this.references[i].isDisplayed) {
                if (bugs != "") {
                    bugs += ";";
                }
                bugs += this.references[i].displayName + ":" + this.references[i].displayedSpeed;
            }
        }
        LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", this.gps.pfdPrefix + "_ElementSetAttribute", "Airspeed", "reference-bugs", bugs);
    }
    statusClick(_index) {
        this.references[_index].isDisplayed = !this.references[_index].isDisplayed;
        this.sendToPfd();
    }
    valueClick(_index) {
        this.gps.speedKeyboard.getElementOfType(AS3000_TSC_SpeedKeyboard).setContext(this.valueEndEditing.bind(this, _index), this.container, this.references[_index].displayedSpeed);
        this.gps.switchToPopUpPage(this.gps.speedKeyboard);
    }
    valueEndEditing(_index, _value) {
        this.references[_index].displayedSpeed = _value;
        this.sendToPfd();
    }
    allOn() {
        for (let i = 0; i < this.references.length; i++) {
            this.references[i].isDisplayed = true;
        }
        this.sendToPfd();
    }
    allOff() {
        for (let i = 0; i < this.references.length; i++) {
            this.references[i].isDisplayed = false;
        }
        this.sendToPfd();
    }
    restoreAll() {
        for (let i = 0; i < this.references.length; i++) {
            this.references[i].isDisplayed = false;
            this.references[i].displayedSpeed = this.references[i].refSpeed;
        }
        this.sendToPfd();
    }
    back() {
        this.gps.goBack();
        return true;
    }
    backHome() {
        this.back();
        return true;
    }
}
class AS3000_TSC_ConfirmationWindow extends NavSystemElement {
    init(root) {
        this.window = this.gps.getChildById("ConfirmationWindow");
        this.text = this.gps.getChildById("CW_Text");
        this.button = this.gps.getChildById("CW_Button");
        this.buttonText = this.gps.getChildById("CW_ButtonText");
        this.gps.makeButton(this.button, this.onClick.bind(this));
    }
    onEnter() {
        this.window.setAttribute("state", "Inactive");
    }
    open(_text, _buttonText = "OK") {
        this.text.innerHTML = _text;
        this.buttonText.textContent = _buttonText;
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    onClick() {
        this.window.setAttribute("state", "Inactive");
    }
}
class AS3000_TSC_LoadFrequencyWindow extends NavSystemElement {
    init(root) {
        this.rootElem = root;
        this.freqNameElem = root.getElementsByClassName("Frequency")[0];
        this.titleLeftElem = root.getElementsByClassName("titleLeft")[0];
        this.titleRightElem = root.getElementsByClassName("titleRight")[0];
        this.leftActive = root.getElementsByClassName("leftActiveBtn")[0];
        this.rightActive = root.getElementsByClassName("rightActiveBtn")[0];
        this.leftStby = root.getElementsByClassName("leftStandbyBtn")[0];
        this.rightStby = root.getElementsByClassName("rightStandbyBtn")[0];
        this.gps.makeButton(this.leftActive, this.setActiveLeft.bind(this));
        this.gps.makeButton(this.rightActive, this.setActiveRight.bind(this));
        this.gps.makeButton(this.leftStby, this.setStandbyLeft.bind(this));
        this.gps.makeButton(this.rightStby, this.setStandbyRight.bind(this));
    }
    onEnter() {
        this.rootElem.setAttribute("state", "Active");
        this.freqNameElem.textContent = this.frequencyText;
        if (this.isNav) {
            this.titleLeftElem.textContent = "NAV1";
            this.titleRightElem.textContent = "NAV2";
        } else {
            this.titleLeftElem.textContent = "COM1";
            this.titleRightElem.textContent = "COM2";
        }
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.rootElem.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_frequencyText, _frequencyBcd16, isNav) {
        this.frequencyText = _frequencyText;
        this.frequency = _frequencyBcd16;
        this.isNav = isNav;
    }
    setActiveLeft() {
        if (this.isNav) {
            SimVar.SetSimVarValue("K:NAV1_RADIO_SET", "Frequency BCD16", this.frequency);
        } else {
            SimVar.SetSimVarValue("K:COM_RADIO_SET", "Frequency BCD16", this.frequency);
        }
        this.gps.goBack();
    }
    setActiveRight() {
        if (this.isNav) {
            SimVar.SetSimVarValue("K:NAV2_RADIO_SET", "Frequency BCD16", this.frequency);
        } else {
            SimVar.SetSimVarValue("K:COM2_RADIO_SET", "Frequency BCD16", this.frequency);
        }
        this.gps.goBack();
    }
    setStandbyLeft() {
        if (this.isNav) {
            SimVar.SetSimVarValue("K:NAV1_STBY_SET", "Frequency BCD16", this.frequency);
        } else {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET", "Frequency BCD16", this.frequency);
        }
        this.gps.goBack();
    }
    setStandbyRight() {
        if (this.isNav) {
            SimVar.SetSimVarValue("K:NAV2_STBY_SET", "Frequency BCD16", this.frequency);
        } else {
            SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET", "Frequency BCD16", this.frequency);
        }
        this.gps.goBack();
    }
}
class AS3000_TSC_WaypointOptions extends NavSystemElement {
    init(root) {
        this.rootElement = root;
        this.drct_btn = root.getElementsByClassName("drctButon")[0];
        this.insertInFpl_btn = root.getElementsByClassName("flightPlanButon")[0];
        this.showInMap_btn = root.getElementsByClassName("showOnMapButon")[0];
        this.gps.makeButton(this.drct_btn, this.directTo.bind(this));
        this.gps.makeButton(this.insertInFpl_btn, this.insertInFpl.bind(this));
        this.gps.makeButton(this.showInMap_btn, this.showInMapToggle.bind(this));
    }
    onEnter() {
        this.rootElement.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSetAttribute(this.showInMap_btn, "state", this.showInMapStatus_CB() ? "Active" : "");
    }
    onExit() {
        this.rootElement.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_icao, _showInMapStatus_CB, _showInMapToggle_CB) {
        this.icao = _icao;
        this.showInMap_CB = _showInMapToggle_CB;
        this.showInMapStatus_CB = _showInMapStatus_CB;
    }
    directTo() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.closePopUpElement();
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        SimVar.SetSimVarValue("C:fs9gps:FlightPlanNewWaypointICAO", "string", this.icao);
        SimVar.SetSimVarValue("C:fs9gps:FlightPlanAddWaypoint", "number", _index).then(function () {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        }.bind(this));
    }
    showInMapToggle() {
        this.showInMap_CB();
    }
}
class AS3000_MapPointerControl extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.leftActive = false;
    }
    init(root) {
        this.window = root;
        this.touchPad = this.gps.getChildById("TouchPad");
        this.touchPad.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.touchPad.addEventListener("mousedown", this.onClickBegin.bind(this));
        this.touchPad.addEventListener("mouseup", this.onClickEnd.bind(this));
        this.touchPad.addEventListener("mouseleave", this.onClickEnd.bind(this));
        this.touchPad.addEventListener("mousewheel", this.onMouseWheel.bind(this));
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.gps.activateNavButton(1, "Back", this.gps.goBack.bind(this.gps), false, "Icons/ICON_MAP_BUTTONBAR_BACK_1.png");
        this.gps.activateNavButton(2, "Home", this.backHome.bind(this), false, "Icons/ICON_MAP_BUTTONBAR_HOME.png");
        LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_ActivateMapCursor");
        this.gps.setTopKnobText("Pan/Point Push: Pan Off");
        this.gps.setBottomKnobText("-Range+ Push: Pan Off");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_DeactivateMapCursor");
        this.gps.setTopKnobText("");
        this.gps.setBottomKnobText("-Range+ Push: Pan");
    }
    onEvent(_event) {
        switch (_event) {
            case "TopKnob_Small_INC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanUp");
                break;
            case "TopKnob_Small_DEC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanDown");
                break;
            case "TopKnob_Large_INC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanRight");
                break;
            case "TopKnob_Large_DEC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanLeft");
                break;
            case "TopKnob_Push":
                this.gps.goBack();
                break;
            case "BottomKnob_Small_INC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_RNG_Dezoom");
                break;
            case "BottomKnob_Small_DEC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_RNG_Zoom");
                break;
            case "BottomKnob_Push":
                this.gps.goBack();
                break;
        }
    }
    backHome() {
        this.gps.closePopUpElement();
        this.gps.SwitchToPageName("MFD", "MFD Home");
    }
    onMouseMove(_e) {
        if (this.leftActive) {
            while (_e.clientX > this.lastX + 5) {
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanRight");
                this.lastX += 5;
            }
            while (_e.clientX < this.lastX - 5) {
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanLeft");
                this.lastX -= 5;
            }
            while (_e.clientY > this.lastY + 5) {
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanDown");
                this.lastY += 5;
            }
            while (_e.clientY < this.lastY - 5) {
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanUp");
                this.lastY -= 5;
            }
        }
    }
    onClickBegin(_e) {
        this.leftActive = true;
        this.lastX = _e.clientX;
        this.lastY = _e.clientY;
    }
    onClickEnd() {
        this.leftActive = false;
    }
    onMouseWheel(_e) {
    }
}
//# sourceMappingURL=AS3000_TSC_Common.js.map