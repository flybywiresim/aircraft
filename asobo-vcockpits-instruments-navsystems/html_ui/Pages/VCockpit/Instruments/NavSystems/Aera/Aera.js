class Aera extends NavSystemTouch {
    constructor() {
        super();
        this.lastPageIndex = NaN;
        this.lastPageGroup = "";
        this.isVertical = false;
        this.initDuration = 4000;
    }
    get templateID() {
        return "Aera";
    }
    get IsGlassCockpit() {
        return false;
    }
    connectedCallback() {
        super.connectedCallback();
        this.mfd = this.getChildById("MFD");
        this.pfdButton = this.getChildById("PFDButton");
        this.mapButton = this.getChildById("MapButton");
        this.nearestButton = this.getChildById("NearestButton");
        this.drctButton = this.getChildById("DrctButton");
        this.fplButton = this.getChildById("FplButton");
        this.menuButton = this.getChildById("MenuButton");
        this.pagesContainer = this.getChildById("PagesContainer");
        this.currentPageName = this.getChildById("currentPageName");
        this.topLineLocalTime = this.getChildById("topLine_LocalTime");
        this.mfdMapElement = this.getChildById("Map_Elements");
        this.mfdMapMapElement = this.mfdMapElement.getElementsByTagName("map-instrument")[0];
        this.addIndependentElementContainer(new NavSystemElementContainer("MainMap", "Map_Elements", new Aera_Map()));
        this.directToWindow = new NavSystemElementContainer("DirectTo", "DirectTo", new Aera_DirectTo());
        this.directToWindow.setGPS(this);
        this.insertBeforWaypointWindow = new NavSystemElementContainer("insertBeforeWaypointWindow", "insertBeforeWaypointWindow", new Aera_InsertBeforeWaypoint());
        this.insertBeforWaypointWindow.setGPS(this);
        this.pageMenu = new NavSystemElementContainer("Page menu", "PageMenu", new Aera_PageMenu());
        this.pageMenu.setGPS(this);
        this.fullKeyboard = new NavSystemElementContainer("Full Keyboard", "fullKeyboard", new Aera_FullKeyboard());
        this.fullKeyboard.setGPS(this);
        this.duplicateWaypointSelection = new NavSystemElementContainer("Waypoint Duplicates", "WaypointDuplicateWindow", new Aera_DuplicateWaypointSelection());
        this.duplicateWaypointSelection.setGPS(this);
        this.pfdElement = new Aera_PFD();
        this.pfdElement.setVertical(this.isVertical);
        this.pageGroups = [
            new Aera_PageGroup("MFD", this, [
                new Aera_NavSystemPage("Map", "Map", new Aera_MapContainer("Map"), "Map", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_SMALL_1.png"),
                this.pfdElement,
                new Aera_NavSystemPage("Active FPL", "FPL", new NavSystemElementGroup([
                    new NavSystemTouch_ActiveFPL(),
                    new Aera_MapContainer("Afpl_Map")
                ]), "FPL", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_FLIGHT_PLAN_MED_1.png")
            ], [
                new Aera_MenuButton("Direct-To", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_DIRECT_TO_1.png", this.switchToPopUpPage.bind(this, this.directToWindow), true),
                new Aera_MenuButton("Nearest", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_NEAREST_MED_1.png", this.SwitchToPageGroupMenu.bind(this, "NRST"), true),
            ]),
            new Aera_PageGroup("NRST", this, [
                new Aera_NavSystemPage("Nearest Airport", "NearestAirport", new Aera_NRST_Airport(), "Apt", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_AIRPORT.png"),
                new Aera_NavSystemPage("Nearest VOR", "NearestVOR", new Aera_NRST_VOR(), "VOR", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_VOR_2.png"),
                new Aera_NavSystemPage("Nearest NDB", "NearestNDB", new Aera_NRST_NDB(), "NDB", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_NDB.png"),
                new Aera_NavSystemPage("Nearest Int", "NearestIntersection", new Aera_NRST_Intersection(), "INT", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_INT.png"),
            ], [
                new Aera_MenuButton("Main Menu", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/TSC/Icons/ICON_MAP_BUTTONBAR_BACK_1.png", this.SwitchToPageGroupMenu.bind(this, "MFD"), true),
            ])
        ];
        this.makeButton(this.pfdButton, this.closePopupAndSwitchToPageName.bind(this, "MFD", "3D Vision"));
        this.makeButton(this.mapButton, this.closePopupAndSwitchToPageName.bind(this, "MFD", "Map"));
        this.makeButton(this.nearestButton, this.SwitchToPageGroupMenu.bind(this, "NRST"));
        this.makeButton(this.drctButton, this.switchToPopUpPage.bind(this, this.directToWindow));
        this.makeButton(this.fplButton, this.closePopupAndSwitchToPageName.bind(this, "MFD", "Active FPL"));
        this.makeButton(this.menuButton, this.switchToPopUpPage.bind(this, this.pageMenu));
        this.maxUpdateBudget = 12;
    }
    closePopupAndSwitchToPageName(_menu, _page) {
        this.closePopUpElement();
        this.SwitchToPageName(_menu, _page);
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            const displayModeConfig = this.instrumentXmlConfig.getElementsByTagName("DisplayMode");
            if (displayModeConfig.length > 0 && displayModeConfig[0].textContent.toLowerCase() == "vertical") {
                this.setAttribute("state", "vertical");
                this.isVertical = true;
                if (this.pfdElement) {
                    this.pfdElement.setVertical(true);
                }
            }
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    getFullKeyboard() {
        return this.fullKeyboard;
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.lastPageIndex != this.getCurrentPageGroup().pageIndex || this.getCurrentPageGroup().name != this.lastPageGroup) {
            this.lastPageIndex = this.getCurrentPageGroup().pageIndex;
            this.lastPageGroup = this.getCurrentPageGroup().name;
            this.currentPageName.textContent = this.getCurrentPageGroup().pages[this.lastPageIndex].name;
        }
        const time = SimVar.GetSimVarValue("E:LOCAL TIME", "seconds");
        const seconds = Math.floor(time % 60);
        const minutes = Math.floor((time / 60) % 60);
        const hours = Math.floor(Math.min(time / 3600, 99));
        Avionics.Utils.diffAndSet(this.topLineLocalTime, (hours < 10 ? "0" : "") + hours + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
    }
    heading_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:HEADING_BUG_INC", "number", 0);
        } else {
            SimVar.SetSimVarValue("K:HEADING_BUG_DEC", "number", 0);
        }
    }
    altitude_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 0);
        } else {
            SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 0);
        }
    }
    baro_CB(_inc) {
        if (_inc) {
            SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
        } else {
            SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
        }
    }
    zoomMap_CB(_inc) {
        if (_inc) {
            this.mfdMapMapElement.onEvent("RANGE_INC");
        } else {
            this.mfdMapMapElement.onEvent("RANGE_DEC");
        }
    }
    zoomMapMain_CB(_inc) {
        if (_inc) {
            this.mainMap.onEvent("RANGE_INC");
        } else {
            this.mainMap.onEvent("RANGE_DEC");
        }
    }
    selectPage_CB(_inc) {
        if (_inc) {
            this.computeEvent("NavigationSmallInc");
        } else {
            this.computeEvent("NavigationSmallDec");
        }
    }
    computeEvent(_event) {
        super.computeEvent(_event);
        switch (_event) {
            case "Back_Push_Long":
                this.switchToPopUpPage(this.pageMenu);
                break;
            case "Back_Push":
                if (this.popUpElement) {
                    this.closePopUpElement();
                } else {
                    this.SwitchToMenuName("MFD");
                }
                break;
            case "NRST_Push":
                if (this.popUpElement) {
                    this.closePopUpElement();
                }
                if (this.getCurrentPageGroup().name == "NRST") {
                    this.SwitchToMenuName("MFD");
                } else {
                    this.SwitchToMenuName("NRST");
                    this.switchToPopUpPage(this.pageMenu);
                }
                break;
            case "DirectTo_Push":
                if (this.popUpElement == this.directToWindow) {
                    this.closePopUpElement();
                } else {
                    if (this.popUpElement) {
                        this.closePopUpElement;
                    }
                    this.switchToPopUpPage(this.directToWindow);
                }
                break;
        }
    }
    SwitchToPageGroupMenu(_menu) {
        this.closePopUpElement();
        this.SwitchToMenuName(_menu);
        this.switchToPopUpPage(this.pageMenu);
    }
}
class Aera_NavSystemPage extends NavSystemPage {
    constructor(_name, _htmlElemId, _element, _shortName, _imagePath) {
        super(_name, _htmlElemId, _element);
        this.shortName = _shortName;
        this.imagePath = _imagePath;
    }
}
class Aera_PFD extends Aera_NavSystemPage {
    constructor() {
        super("3D Vision", "PFD", null, "3D Vision", "");
        this.mapInstrument = new MapInstrumentElement();
        this.airspeed = new PFD_Airspeed();
        this.element = new NavSystemElementGroup([
            new PFD_Altimeter(),
            this.airspeed,
            new PFD_SimpleCompass(),
            new PFD_CDI(),
            this.mapInstrument,
            new PFD_AutopilotDisplay()
        ]);
        this.mapInstrument.setGPS(this.gps);
    }
    init() {
        super.init();
    }
    setVertical(_val) {
        this.airspeed.alwaysDisplaySpeed = _val;
    }
}
class Aera_MapContainer extends NavSystemElement {
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
class Aera_Map extends MapInstrumentElement {
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
class Aera_Com extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.inputIndex = -1;
    }
    init(root) {
        this.window = root;
        this.cancelTouch = this.gps.getChildById("Com_Cancel");
        this.enterTouch = this.gps.getChildById("Com_Enter");
        this.xferTouch = this.gps.getChildById("Com_XFR");
        this.NK_1 = this.gps.getChildById("NK_1");
        this.NK_2 = this.gps.getChildById("NK_2");
        this.NK_3 = this.gps.getChildById("NK_3");
        this.NK_4 = this.gps.getChildById("NK_4");
        this.NK_5 = this.gps.getChildById("NK_5");
        this.NK_6 = this.gps.getChildById("NK_6");
        this.NK_7 = this.gps.getChildById("NK_7");
        this.NK_8 = this.gps.getChildById("NK_8");
        this.NK_9 = this.gps.getChildById("NK_9");
        this.NK_0 = this.gps.getChildById("NK_0");
        this.frequency = this.gps.getChildById("com_frequency");
        this.gps.makeButton(this.cancelTouch, this.cancelPress.bind(this));
        this.gps.makeButton(this.enterTouch, this.enterPress.bind(this));
        this.gps.makeButton(this.xferTouch, this.xferPress.bind(this));
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
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        let com1Stby;
        if (this.inputIndex == -1) {
            com1Stby = '<span class="Fixed">' + this.gps.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz"), 2) + '</span>';
        } else {
            const state = this.gps.blinkGetState(1000, 500) ? "Blink" : "Off";
            const regex = new RegExp('^(.{' + (this.inputIndex > 2 ? this.inputIndex + 1 : this.inputIndex) + '})(.)(.*)');
            const replace = '<span class="Writed">$1</span><span class="Writing" state="' + state + '">$2</span><span class = "ToWrite">$3</span>';
            com1Stby = (this.currentInput.toFixed(2) + " ").replace(regex, replace);
        }
        Avionics.Utils.diffAndSet(this.frequency, com1Stby);
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    enterPress() {
        if (this.inputIndex != -1) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET", "Frequency BCD16", Avionics.Utils.make_bcd16(this.currentInput * 1000000));
        }
        this.cancelPress();
    }
    cancelPress() {
        this.inputIndex = -1;
        this.gps.closePopUpElement();
    }
    xferPress() {
        if (this.inputIndex != -1) {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET", "Frequency BCD16", Avionics.Utils.make_bcd16(this.currentInput * 1000000));
        }
        SimVar.SetSimVarValue("K:COM_STBY_RADIO_SWAP", "number", 1);
        this.cancelPress();
    }
    onDigitPress(_digit) {
        switch (this.inputIndex) {
            case -1:
            case 0:
                if (_digit == 1) {
                    this.inputIndex = 1;
                    this.currentInput = 118;
                } else if (_digit != 0 && _digit < 4) {
                    this.inputIndex = 2;
                    this.currentInput = 100 + 10 * _digit;
                } else {
                    this.inputIndex = 1;
                    this.currentInput = 118;
                }
                break;
            case 1:
                if (_digit > 1 && _digit < 4) {
                    this.inputIndex = 2;
                    this.currentInput = 100 + 10 * _digit;
                } else if (_digit == 1) {
                    this.inputIndex = 2;
                    this.currentInput = 118;
                } else if (_digit >= 8) {
                    this.inputIndex = 3;
                    this.currentInput = 110 + _digit;
                }
                break;
            case 2:
                if (this.currentInput == 118) {
                    if (_digit == 8) {
                        this.inputIndex = 3;
                    } else if (_digit == 9) {
                        this.currentInput = 119;
                        this.inputIndex = 3;
                    }
                } else {
                    if (!(this.currentInput == 130 && _digit > 6)) {
                        this.currentInput += _digit;
                        this.inputIndex = 3;
                    }
                }
                break;
            case 3:
                this.currentInput += 0.1 * _digit;
                this.inputIndex = 4;
                break;
            case 4:
                if (_digit == 0 || _digit == 2 || _digit == 5 || _digit == 7) {
                    this.currentInput += 0.01 * _digit;
                    this.inputIndex = 5;
                }
                break;
        }
    }
}
class Aera_PageMenu_Button {
}
class Aera_PageMenu extends NavSystemElement {
    init(root) {
        this.root = root;
        this.buttons = [];
        this.menuElements = root.getElementsByClassName("menuElements")[0];
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        const pageGroup = this.gps.getCurrentPageGroup();
        for (let i = 0; i < (pageGroup.pages.length + pageGroup.additionalMenuButtons.length); i++) {
            if (i >= this.buttons.length) {
                const button = new Aera_PageMenu_Button();
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
            } else {
                this.buttons[i].base.style.display = "";
            }
            if (i < pageGroup.pages.length) {
                this.buttons[i].image.setAttribute("src", pageGroup.pages[i].imagePath);
                this.buttons[i].title.textContent = pageGroup.pages[i].name;
            } else {
                this.buttons[i].image.setAttribute("src", pageGroup.additionalMenuButtons[i - pageGroup.pages.length].imagePath);
                this.buttons[i].title.textContent = pageGroup.additionalMenuButtons[i - pageGroup.pages.length].name;
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
        const pageGroup = this.gps.getCurrentPageGroup();
        if (i < pageGroup.pages.length) {
            this.gps.closePopUpElement();
            this.gps.getCurrentPageGroup().goToPage(this.gps.getCurrentPageGroup().pages[i].name);
        } else {
            pageGroup.additionalMenuButtons[i - pageGroup.pages.length].callback();
        }
    }
}
class Aera_FullKeyboard extends NavSystemTouch_FullKeyboard {
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
        const nbMatched = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.gps.instrumentIdentifier);
        if (nbMatched > 1) {
            this.gps.duplicateWaypointSelection.element.setContext(this.endCallback, this.lastPopUp);
            this.gps.closePopUpElement();
            this.gps.switchToPopUpPage(this.gps.duplicateWaypointSelection);
        } else {
            this.endCallback(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.gps.instrumentIdentifier));
            this.gps.closePopUpElement();
            if (this.lastPopUp) {
                this.gps.switchToPopUpPage(this.lastPopUp);
            }
        }
        return true;
    }
}
class Aera_DuplicateWaypointSelection extends NavSystemTouch_DuplicateWaypointSelection {
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
class Aera_elevatorTrim extends NavSystemElement {
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
class Aera_MenuButton {
    constructor(_name, _imagePath, _callback, _fullTactileOnly = false) {
        this.fullTactileOnly = false;
        this.imagePath = _imagePath;
        this.name = _name;
        this.callback = _callback;
        this.fullTactileOnly = _fullTactileOnly;
    }
}
class Aera_PageGroup extends NavSystemPageGroup {
    constructor(_name, _gps, _pages, _additionalButtons = []) {
        super(_name, _gps, _pages);
        this.additionalMenuButtons = [];
        this.additionalMenuButtons = _additionalButtons;
    }
}
class Aera_DirectTo extends NavSystemTouch_DirectTo {
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
        this.gps.fullKeyboard.getElementOfType(Aera_FullKeyboard).setContext(this.endKeyboard.bind(this));
        this.gps.switchToPopUpPage(this.gps.fullKeyboard);
    }
    back() {
        this.gps.closePopUpElement();
    }
}
class Aera_NRST_Airport extends NavSystemTouch_NRST_Airport {
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
        this.gps.insertBeforWaypointWindow.getElementOfType(Aera_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class Aera_NRST_NDB extends NavSystemTouch_NRST_NDB {
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
        this.gps.insertBeforWaypointWindow.getElementOfType(Aera_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class Aera_NRST_VOR extends NavSystemTouch_NRST_VOR {
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
        this.gps.insertBeforWaypointWindow.getElementOfType(Aera_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class Aera_NRST_Intersection extends NavSystemTouch_NRST_Intersection {
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
        this.gps.insertBeforWaypointWindow.getElementOfType(Aera_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforWaypointWindow);
    }
}
class Aera_WaypointButtonElement {
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
class Aera_InsertBeforeWaypoint extends NavSystemElement {
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
                const newElem = new Aera_WaypointButtonElement();
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
registerInstrument("aera-element", Aera);
//# sourceMappingURL=Aera.js.map