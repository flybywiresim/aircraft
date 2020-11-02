class BaseAirliners extends NavSystem {
    constructor() {
        super(...arguments);
        this.isMachActive = false;
        this.machTransition = 0;
    }
    connectedCallback() {
        super.connectedCallback();
        this.preserveAspectRatio("Mainframe");
        this.addEventAlias("FMS_Upper_INC", "NavigationSmallInc");
        this.addEventAlias("FMS_Upper_DEC", "NavigationSmallDec");
        this.addEventAlias("FMS_Lower_INC", "NavigationLargeInc");
        this.addEventAlias("FMS_Lower_DEC", "NavigationLargeDec");
        this.addEventAlias("FMS_Upper_PUSH", "NavigationPush");
        this.radioNav = new RadioNav();
        this.radioNav.init(NavMode.FOUR_SLOTS);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        BaseAirliners.isMetric = Simplane.getUnitIsMetric();
    }
    static unitIsMetric(_plane) {
        switch (_plane) {
            case Aircraft.A320_NEO:
                return true;
            case Aircraft.B747_8:
            case Aircraft.AS01B:
                return false;
        }
        return BaseAirliners.isMetric;
    }
    updateMachTransition() {
        const crossSpeed = SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED", "knots");
        const cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
        const crossAltitude = Simplane.getCrossoverAltitude(crossSpeed, cruiseMach);
        const mach = Simplane.getMachSpeed();
        const altitude = Simplane.getAltitude();
        switch (this.machTransition) {
            case -1:
                if (mach >= cruiseMach && altitude >= crossAltitude) {
                    this.machTransition = 1;
                    SimVar.SetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool", true);
                    SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 1);
                }
                break;
            case 0:
                if (mach >= cruiseMach && altitude >= crossAltitude) {
                    this.machTransition = 1;
                    SimVar.SetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool", true);
                    SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 1);
                } else {
                    this.machTransition = -1;
                    SimVar.SetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool", false);
                    SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 1);
                }
                break;
            case 1:
                if (altitude < crossAltitude) {
                    this.machTransition = -1;
                    SimVar.SetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool", false);
                    SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 1);
                }
                break;
        }
        const isMachActive = SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool");
        if (this.isMachActive != isMachActive) {
            this.isMachActive = isMachActive;
            if (isMachActive) {
                let mach = SimVar.GetGameVarValue("FROM KIAS TO MACH", "number", Simplane.getAutoPilotSelectedAirspeedHoldValue());
                Coherent.call("AP_MACH_VAR_SET", 1, mach);
                mach = SimVar.GetGameVarValue("FROM KIAS TO MACH", "number", Simplane.getAutoPilotManagedAirspeedHoldValue());
                Coherent.call("AP_MACH_VAR_SET", 2, mach);
            } else {
                let knots = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", Simplane.getAutoPilotSelectedMachHoldValue());
                Coherent.call("AP_SPD_VAR_SET", 1, knots);
                knots = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", Simplane.getAutoPilotManagedMachHoldValue());
                Coherent.call("AP_SPD_VAR_SET", 2, knots);
            }
            return true;
        }
        return false;
    }
}
BaseAirliners.isMetric = false;
var Airliners;
(function (Airliners) {
    class BaseEICAS extends BaseAirliners {
        constructor() {
            super();
            this.lowerScreenPages = new Array();
        }
        connectedCallback() {
            super.connectedCallback();
            if (this.urlConfig.index) {
                this.setAttribute("index", this.urlConfig.index.toString());
            }
            this.createUpperScreenPage();
            this.createLowerScreenPages();
            this.pageGroups = [new NavSystemPageGroup(BaseEICAS.LOWER_SCREEN_GROUP_NAME, this, this.lowerScreenPages)];
            Coherent.on(BaseEICAS.LOWER_SCREEN_CHANGE_EVENT_NAME, this.onChangeLowerScreenPage.bind(this));
        }
        disconnectedCallback() {
        }
        onEvent(_event) {
            super.onEvent(_event);
            const prefix = this.getLowerScreenChangeEventNamePrefix();
            if (_event.indexOf(prefix) >= 0) {
                const pageName = _event.replace(prefix, "");
                this.changePage(pageName);
            } else {
                for (let i = 0; i < this.lowerScreenPages.length; i++) {
                    this.lowerScreenPages[i].onEvent(_event);
                }
            }
        }
        onChangeLowerScreenPage(..._args) {
            if ((_args != null) && (_args.length > 0)) {
                const strings = _args[0];
                if ((strings != null) && (strings.length > 0)) {
                    this.changePage(strings[0]);
                }
            }
        }
        createLowerScreenPage(_name, _htmlElemId, _eicasPageSelector) {
            this.lowerScreenPages.push(new NavSystemPage(_name.toUpperCase(), _htmlElemId, new Airliners.EICASPage(_eicasPageSelector)));
        }
        changePage(_pageName) {
            const pageName = _pageName.toUpperCase();
            this.SwitchToPageName(BaseEICAS.LOWER_SCREEN_GROUP_NAME, pageName);
            for (let i = 0; i < this.lowerScreenPages.length; i++) {
                if (this.lowerScreenPages[i].name == pageName) {
                    SimVar.SetSimVarValue("L:XMLVAR_ECAM_CURRENT_PAGE", "number", i);
                    break;
                }
            }
        }
    }
    BaseEICAS.LOWER_SCREEN_GROUP_NAME = "LowerScreenGroup";
    BaseEICAS.LOWER_SCREEN_CHANGE_EVENT_NAME = "ChangeLowerScreenPage";
    Airliners.BaseEICAS = BaseEICAS;
    let EICAS_INFO_PANEL_ID;
    (function (EICAS_INFO_PANEL_ID) {
        EICAS_INFO_PANEL_ID[EICAS_INFO_PANEL_ID["PRIMARY"] = 0] = "PRIMARY";
        EICAS_INFO_PANEL_ID[EICAS_INFO_PANEL_ID["SECONDARY"] = 1] = "SECONDARY";
    })(EICAS_INFO_PANEL_ID = Airliners.EICAS_INFO_PANEL_ID || (Airliners.EICAS_INFO_PANEL_ID = {}));
    let EICAS_INFO_PANEL_EVENT_TYPE;
    (function (EICAS_INFO_PANEL_EVENT_TYPE) {
        EICAS_INFO_PANEL_EVENT_TYPE[EICAS_INFO_PANEL_EVENT_TYPE["ADD_MESSAGE"] = 0] = "ADD_MESSAGE";
        EICAS_INFO_PANEL_EVENT_TYPE[EICAS_INFO_PANEL_EVENT_TYPE["REMOVE_MESSAGE"] = 1] = "REMOVE_MESSAGE";
        EICAS_INFO_PANEL_EVENT_TYPE[EICAS_INFO_PANEL_EVENT_TYPE["MODIFY_MESSAGE"] = 2] = "MODIFY_MESSAGE";
        EICAS_INFO_PANEL_EVENT_TYPE[EICAS_INFO_PANEL_EVENT_TYPE["CLEAR_SCREEN"] = 3] = "CLEAR_SCREEN";
    })(EICAS_INFO_PANEL_EVENT_TYPE = Airliners.EICAS_INFO_PANEL_EVENT_TYPE || (Airliners.EICAS_INFO_PANEL_EVENT_TYPE = {}));
    let EICAS_INFO_PANEL_MESSAGE_STYLE;
    (function (EICAS_INFO_PANEL_MESSAGE_STYLE) {
        EICAS_INFO_PANEL_MESSAGE_STYLE[EICAS_INFO_PANEL_MESSAGE_STYLE["INDICATION"] = 0] = "INDICATION";
        EICAS_INFO_PANEL_MESSAGE_STYLE[EICAS_INFO_PANEL_MESSAGE_STYLE["CAUTION"] = 1] = "CAUTION";
        EICAS_INFO_PANEL_MESSAGE_STYLE[EICAS_INFO_PANEL_MESSAGE_STYLE["WARNING"] = 2] = "WARNING";
        EICAS_INFO_PANEL_MESSAGE_STYLE[EICAS_INFO_PANEL_MESSAGE_STYLE["TITLE"] = 3] = "TITLE";
        EICAS_INFO_PANEL_MESSAGE_STYLE[EICAS_INFO_PANEL_MESSAGE_STYLE["OPTION"] = 4] = "OPTION";
    })(EICAS_INFO_PANEL_MESSAGE_STYLE = Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE || (Airliners.EICAS_INFO_PANEL_MESSAGE_STYLE = {}));
    class EICASInfoPanelManager {
    }
    Airliners.EICASInfoPanelManager = EICASInfoPanelManager;
    class EICASTemplateElement extends TemplateElement {
        onEvent(_event) { }
        ;
        getInfoPanelManager() {
            return null;
        }
        ;
    }
    Airliners.EICASTemplateElement = EICASTemplateElement;
    class EICASScreen extends NavSystemElementContainer {
        constructor(_name, _root, _selector) {
            super(_name, _root, null);
            this.selector = "";
            this.screen = null;
            this.IndependentElements = new NavSystemElementGroup([]);
            this.selector = _selector;
            this.element = this.IndependentElements;
            this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(this._lastTime);
        }
        init() {
            super.init();
            const root = this.gps.getChildById(this.htmlElemId);
            if (root != null) {
                this.screen = root.querySelector(this.selector);
            }
        }
        onUpdate() {
            const _deltaTime = this.getDeltaTime();
            super.onUpdate(_deltaTime);
            if (this.screen != null) {
                this.screen.update(_deltaTime);
            }
        }
        addIndependentElement(_element) {
            this.IndependentElements.addElement(_element);
        }
        getInfoPanelManager() {
            if (this.screen) {
                return this.screen.getInfoPanelManager();
            }
            return null;
        }
        ;
    }
    Airliners.EICASScreen = EICASScreen;
    class EICASPage extends NavSystemElement {
        constructor(_selector) {
            super();
            this.selector = "";
            this.selector = _selector;
        }
        init() {
            const root = this.gps.getChildById(this.container.htmlElemId);
            if (root != null) {
                this.page = root.querySelector(this.selector);
            }
            this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(this._lastTime);
        }
        onEnter() {
            if (this.page != null) {
                this.page.style.display = "block";
            }
        }
        onUpdate() {
            const _deltaTime = this.getDeltaTime();
            if (this.page != null) {
                this.page.update(_deltaTime);
            }
        }
        onEvent(_event) {
            if (this.page) {
                this.page.onEvent(_event);
            }
        }
        onExit() {
            if (this.page != null) {
                this.page.style.display = "none";
            }
        }
    }
    Airliners.EICASPage = EICASPage;
    class DynamicValueComponent {
        constructor(_text, _getValueFunction, _roundToDP = 0, _formatFunction = null) {
            this.visible = true;
            this.text = null;
            this.getValue = null;
            this.roundToDP = 0;
            this.format = null;
            this.currentValue = 0;
            this.text = _text;
            this.getValue = _getValueFunction;
            this.roundToDP = _roundToDP;
            this.format = _formatFunction;
            this.trySetValue(0, true);
        }
        set isVisible(_visible) {
            this.visible = _visible;
            if (this.visible) {
                if (this.getValue != null) {
                    this.trySetValue(this.getValue(), true);
                }
            } else {
                if (this.text != null) {
                    this.text.textContent = "";
                }
            }
        }
        refresh() {
            if (this.visible) {
                if (this.getValue != null) {
                    this.trySetValue(this.getValue());
                }
            }
        }
        trySetValue(_value, _force = false) {
            if ((_value != this.currentValue) || _force) {
                this.currentValue = _value;
                if (this.text != null) {
                    if (this.format != null) {
                        this.text.textContent = this.format(_value, this.roundToDP);
                    } else {
                        this.text.textContent = DynamicValueComponent.formatValueToString(_value, this.roundToDP);
                    }
                }
            }
        }
        static formatValueToString(_value, _dp = 0) {
            return _value.toFixed(_dp);
        }
        static formatValueToPosNegString(_value, _dp = 0) {
            return ((_value > 0) ? "+" : "") + _value.toFixed(_dp);
        }
        static formatValueToPosNegTemperature(_value, _dp = 0) {
            return (DynamicValueComponent.formatValueToPosNegString(_value, _dp) + "c");
        }
        static formatValueToThrottleDisplay(_value, _dp = 0) {
            if (_value < 0) {
                return "REV";
            } else {
                return _value.toFixed(_dp);
            }
        }
    }
    Airliners.DynamicValueComponent = DynamicValueComponent;
    class BaseATC extends BaseAirliners {
        constructor() {
            super();
            this.currentDigits = [0, 0, 0, 0];
            this.currentCode = 0;
            this.bLastInputIsCLR = false;
            this.emptySlot = "-";
        }
        connectedCallback() {
            super.connectedCallback();
            this.valueText = this.querySelector("text");
        }
        disconnectedCallback() {
            super.disconnectedCallback();
        }
        Init() {
            super.Init();
            console.log("ATC Init");
        }
        onUpdate(_deltaTime) {
            super.onUpdate(_deltaTime);

            const lightsTest = SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool");
            const lightsTestChanged = lightsTest !== this.lightsTest;
            this.lightsTest = lightsTest;

            if (lightsTest) {
                if (lightsTestChanged && this.valueText != null) {
                    this.valueText.textContent = "8888";
                }
                return;
            }

            const code = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number");
            if (code != this.currentCode || lightsTestChanged) {
                this.currentCode = code;
                this.currentDigits = [Math.floor(code / 1000), Math.floor((code % 1000) / 100), Math.floor((code % 100) / 10), code % 10];
                this.refreshValue();
            }
        }
        refreshValue() {
            let code = "";
            for (let i = 0; i <= 3; i++) {
                if (this.currentDigits[i] >= 0) {
                    code += this.currentDigits[i].toString();
                } else {
                    code += this.emptySlot;
                }
            }
            if (this.valueText != null) {
                this.valueText.textContent = code;
            }
        }
        onEvent(_event) {
            if (_event.indexOf("BTN_") >= 0) {
                const buttonSuffix = _event.replace("BTN_", "");
                if (buttonSuffix.charAt(0) == 'C') {
                    if (this.currentDigits[0] >= 0) {
                        if (this.bLastInputIsCLR) {
                            for (var i = 3; i >= 0; i--) {
                                this.currentDigits[i] = -1;
                            }
                        } else {
                            for (var i = 3; i >= 0; i--) {
                                if (this.currentDigits[i] >= 0) {
                                    this.currentDigits[i] = -1;
                                    this.bLastInputIsCLR = true;
                                    break;
                                }
                            }
                        }
                        this.refreshValue();
                    }
                } else if (buttonSuffix.charAt(0) == 'I') {
                    return;
                } else {
                    let slot = -1;
                    {
                        for (var i = 0; i <= 3; i++) {
                            if (this.currentDigits[i] < 0) {
                                slot = i;
                                break;
                            }
                        }
                    }
                    if (slot < 0) {
                        for (var i = 0; i <= 3; i++) {
                            this.currentDigits[i] = -1;
                        }
                        slot = 0;
                    }
                    const buttonNumber = parseInt(buttonSuffix);
                    this.currentDigits[slot] = buttonNumber;
                    this.refreshValue();
                    if (slot == 3 && this.currentDigits[3] >= 0) {
                        const code = (this.currentDigits[0] * 4096) + (this.currentDigits[1] * 256) + (this.currentDigits[2] * 16) + this.currentDigits[3];
                        SimVar.SetSimVarValue("K:XPNDR_SET", "Bco16", code);
                    }
                    this.bLastInputIsCLR = false;
                }
            }
        }
    }
    Airliners.BaseATC = BaseATC;
    let PopupMenu_ItemType;
    (function (PopupMenu_ItemType) {
        PopupMenu_ItemType[PopupMenu_ItemType["TITLE"] = 0] = "TITLE";
        PopupMenu_ItemType[PopupMenu_ItemType["LIST"] = 1] = "LIST";
        PopupMenu_ItemType[PopupMenu_ItemType["RANGE"] = 2] = "RANGE";
        PopupMenu_ItemType[PopupMenu_ItemType["RADIO"] = 3] = "RADIO";
        PopupMenu_ItemType[PopupMenu_ItemType["RADIO_LIST"] = 4] = "RADIO_LIST";
        PopupMenu_ItemType[PopupMenu_ItemType["RADIO_RANGE"] = 5] = "RADIO_RANGE";
        PopupMenu_ItemType[PopupMenu_ItemType["SUBMENU"] = 6] = "SUBMENU";
        PopupMenu_ItemType[PopupMenu_ItemType["CHECKBOX"] = 7] = "CHECKBOX";
    })(PopupMenu_ItemType || (PopupMenu_ItemType = {}));
    class PopupMenu_Item {
        constructor(_type, _section, _y, _height) {
            this.y = 0;
            this.height = 0;
            this.listVal = 0;
            this.rangeMin = 0;
            this.rangeMax = 0;
            this.rangeStep = 0;
            this.rangeDecimals = 0;
            this.rangeVal = 0;
            this.radioVal = false;
            this.checkboxVal = false;
            this.type = _type;
            this.section = _section;
            this.y = _y;
            this.height = _height;
        }
        get interactive() {
            if (this.type != PopupMenu_ItemType.TITLE) {
                return true;
            }
            return false;
        }
        get enabled() {
            if (this.dictKeys != null || this.subMenu) {
                return true;
            }
            return false;
        }
    }
    class PopupMenu_Section {
        constructor() {
            this.items = new Array();
            this.startY = 0;
            this.endY = 0;
            this.interactionColor = "";
            this.defaultRadio = true;
        }
    }
    class PopupMenu_Handler {
        constructor() {
            this.menuLeft = 0;
            this.menuTop = 0;
            this.menuWidth = 0;
            this.columnLeft1 = 3;
            this.columnLeft2 = 20;
            this.columnLeft3 = 90;
            this.lineHeight = 18;
            this.sectionBorderSize = 1;
            this.textStyle = "Roboto-Regular";
            this.textMarginX = 3;
            this.highlightColor = "cyan";
            this.interactionColor = "cyan";
            this.disabledColor = "grey";
            this.shapeFillColor = "none";
            this.shapeFillIfDisabled = true;
            this.shape3D = false;
            this.shape3DBorderSize = 3;
            this.shape3DBorderLeft = "rgb(100, 100, 100)";
            this.shape3DBorderRight = "rgb(30, 30, 30)";
            this.highlightId = 0;
            this.speedInc = 1.0;
            this.speedInc_UpFactor = 0.25;
            this.speedInc_DownFactor = 0.075;
            this.speedInc_PowFactor = 0.9;
        }
        get height() {
            let height = 0;
            for (let i = 0; i < this.allSections.length; i++) {
                height += this.allSections[i].endY - this.allSections[i].startY;
            }
            return height;
        }
        highlight(_index) {
            if (_index >= 0) {
                this.highlightId = _index;
            }
        }
        reset() {
        }
        onUpdate(_dTime) {
            this.updateHighlight();
            this.updateSpeedInc();
        }
        onActivate() {
            if (this.highlightItem && this.highlightItem.enabled) {
                switch (this.highlightItem.type) {
                    case PopupMenu_ItemType.RADIO:
                    case PopupMenu_ItemType.RADIO_LIST:
                    case PopupMenu_ItemType.RADIO_RANGE:
                        let changed = false;
                        const section = this.highlightItem.section;
                        for (let i = 0; i < section.items.length; i++) {
                            const item = section.items[i];
                            if (item.radioElem) {
                                if (item == this.highlightItem) {
                                    if (!item.radioVal) {
                                        this.activateItem(item, true);
                                        changed = true;
                                    } else if (!section.defaultRadio) {
                                        this.activateItem(item, false);
                                        changed = true;
                                    }
                                } else if (item.radioVal) {
                                    this.activateItem(item, false);
                                }
                            }
                        }
                        if (changed) {
                            this.onChanged(this.highlightItem);
                        }
                        break;
                    case PopupMenu_ItemType.SUBMENU:
                        this.highlightItem.subMenu();
                        break;
                    case PopupMenu_ItemType.CHECKBOX:
                        if (!this.highlightItem.checkboxVal) {
                            this.activateItem(this.highlightItem, true);
                        } else {
                            this.activateItem(this.highlightItem, false);
                            this.highlightItem.checkboxVal = false;
                        }
                        this.onChanged(this.highlightItem);
                        break;
                }
            }
        }
        onDataDec() {
            if (this.highlightItem && this.highlightItem.enabled) {
                switch (this.highlightItem.type) {
                    case PopupMenu_ItemType.LIST:
                    case PopupMenu_ItemType.RADIO_LIST:
                        if (this.highlightItem.listVal > 0) {
                            this.highlightItem.listVal--;
                            this.highlightItem.listElem.textContent = this.highlightItem.listValues[this.highlightItem.listVal];
                            this.onChanged(this.highlightItem);
                        }
                        break;
                    case PopupMenu_ItemType.RANGE:
                    case PopupMenu_ItemType.RADIO_RANGE:
                        if (this.highlightItem.rangeVal > this.highlightItem.rangeMin) {
                            this.highlightItem.rangeVal -= this.highlightItem.rangeStep * this.getSpeedAccel();
                            this.highlightItem.rangeVal = Math.max(this.highlightItem.rangeVal, this.highlightItem.rangeMin);
                            this.highlightItem.rangeElem.textContent = this.highlightItem.rangeVal.toFixed(this.highlightItem.rangeDecimals);
                            this.onChanged(this.highlightItem);
                            this.speedInc += this.speedInc_UpFactor;
                        }
                        break;
                }
            }
        }
        onDataInc() {
            if (this.highlightItem && this.highlightItem.enabled) {
                switch (this.highlightItem.type) {
                    case PopupMenu_ItemType.LIST:
                    case PopupMenu_ItemType.RADIO_LIST:
                        if (this.highlightItem.listVal < this.highlightItem.listValues.length - 1) {
                            this.highlightItem.listVal++;
                            this.highlightItem.listElem.textContent = this.highlightItem.listValues[this.highlightItem.listVal];
                            this.onChanged(this.highlightItem);
                        }
                        break;
                    case PopupMenu_ItemType.RANGE:
                    case PopupMenu_ItemType.RADIO_RANGE:
                        if (this.highlightItem.rangeVal < this.highlightItem.rangeMax) {
                            this.highlightItem.rangeVal += this.highlightItem.rangeStep * this.getSpeedAccel();
                            this.highlightItem.rangeVal = Math.min(this.highlightItem.rangeVal, this.highlightItem.rangeMax);
                            this.highlightItem.rangeElem.textContent = this.highlightItem.rangeVal.toFixed(this.highlightItem.rangeDecimals);
                            this.onChanged(this.highlightItem);
                            this.speedInc += this.speedInc_UpFactor;
                        }
                        break;
                }
            }
        }
        onMenuDec() {
            if (this.highlightId > 0) {
                this.highlightId--;
            }
        }
        onMenuInc() {
            this.highlightId++;
        }
        onEscape() {
            if (this.escapeCbk) {
                this.escapeCbk();
            }
        }
        openMenu() {
            this.allSections = [];
            this.sectionRoot = null;
            this.highlightItem = null;
            this.highlightId = 0;
            this.escapeCbk = null;
            this.sectionRoot = document.createElementNS(Avionics.SVG.NS, "g");
            this.sectionRoot.setAttribute("transform", "translate(" + this.menuLeft + " " + this.menuTop + ")");
            return this.sectionRoot;
        }
        closeMenu() {
            const bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", "0");
            bg.setAttribute("y", "0");
            bg.setAttribute("width", this.menuWidth.toString());
            bg.setAttribute("height", this.height.toString());
            bg.setAttribute("fill", "black");
            this.sectionRoot.insertBefore(bg, this.sectionRoot.firstChild);
            this.highlightElem = document.createElementNS(Avionics.SVG.NS, "rect");
            this.highlightElem.setAttribute("x", "0");
            this.highlightElem.setAttribute("y", "0");
            this.highlightElem.setAttribute("width", this.menuWidth.toString());
            this.highlightElem.setAttribute("height", this.lineHeight.toString());
            this.highlightElem.setAttribute("fill", "none");
            this.highlightElem.setAttribute("stroke", this.highlightColor);
            this.highlightElem.setAttribute("stroke-width", (this.sectionBorderSize + 1).toString());
            this.sectionRoot.appendChild(this.highlightElem);
            if (this.dictionary) {
                this.dictionary.changed = false;
            }
        }
        beginSection(_defaultRadio = true) {
            this.section = new PopupMenu_Section();
            this.section.interactionColor = this.interactionColor;
            this.section.defaultRadio = _defaultRadio;
            if (this.allSections.length > 0) {
                this.section.startY = this.allSections[this.allSections.length - 1].endY;
                this.section.endY = this.section.startY;
            }
        }
        endSection() {
            const stroke = document.createElementNS(Avionics.SVG.NS, "rect");
            stroke.setAttribute("x", "0");
            stroke.setAttribute("y", this.section.startY.toString());
            stroke.setAttribute("width", this.menuWidth.toString());
            stroke.setAttribute("height", (this.section.endY - this.section.startY).toString());
            stroke.setAttribute("fill", "none");
            stroke.setAttribute("stroke", "white");
            stroke.setAttribute("stroke-width", this.sectionBorderSize.toString());
            this.sectionRoot.appendChild(stroke);
            let defaultRadio = null;
            for (let i = 0; i < this.section.items.length; i++) {
                const item = this.section.items[i];
                if (item.radioElem) {
                    if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[0])) {
                        if (this.dictionary.get(item.dictKeys[0]) == item.radioName) {
                            defaultRadio = item;
                            break;
                        }
                    } else if (!defaultRadio && this.section.defaultRadio) {
                        defaultRadio = item;
                    }
                }
            }
            for (let i = 0; i < this.section.items.length; i++) {
                const item = this.section.items[i];
                let dictIndex = 0;
                let changed = false;
                if (item.radioElem) {
                    if (item == defaultRadio) {
                        this.activateItem(item, true);
                        changed = true;
                    }
                    dictIndex++;
                }
                if (item.listElem) {
                    item.listVal = 0;
                    if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[dictIndex])) {
                        const value = this.dictionary.get(item.dictKeys[dictIndex]);
                        for (let j = 0; j < item.listValues.length; j++) {
                            if (item.listValues[j] == value) {
                                item.listVal = j;
                                break;
                            }
                        }
                    }
                    item.listElem.textContent = item.listValues[item.listVal];
                    changed = true;
                }
                if (item.rangeElem) {
                    item.rangeVal = item.rangeMin;
                    if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[dictIndex])) {
                        item.rangeVal = parseFloat(this.dictionary.get(item.dictKeys[dictIndex]));
                        item.rangeVal = Math.max(item.rangeMin, Math.min(item.rangeVal, item.rangeMax));
                    }
                    item.rangeElem.textContent = item.rangeVal.toFixed(item.rangeDecimals);
                    changed = true;
                }
                if (item.checkboxElem) {
                    if (this.dictionary && item.dictKeys && this.dictionary.exists(item.dictKeys[dictIndex])) {
                        if (this.dictionary.get(item.dictKeys[0]) == "ON") {
                            this.activateItem(item, true);
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    this.onChanged(item);
                }
            }
            this.allSections.push(this.section);
            this.section = null;
        }
        addTitle(_text, _textSize, _bgFactor, _bgColor = "blue", _showEscapeIcon = false) {
            const bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", "0");
            bg.setAttribute("y", this.section.endY.toString());
            bg.setAttribute("width", (this.menuWidth * _bgFactor).toString());
            bg.setAttribute("height", this.lineHeight.toString());
            bg.setAttribute("fill", _bgColor);
            this.sectionRoot.appendChild(bg);
            let posX = this.columnLeft1;
            if (_showEscapeIcon) {
                const arrow = document.createElementNS(Avionics.SVG.NS, "path");
                arrow.setAttribute("d", "M" + posX + " " + (this.section.endY + 2) + " l0 " + (this.lineHeight * 0.38) + " l13 0 l0 -2 l2 2 l-2 2 l0 -2");
                arrow.setAttribute("fill", "none");
                arrow.setAttribute("stroke", "white");
                arrow.setAttribute("stroke-width", "1.5");
                this.sectionRoot.appendChild(arrow);
                posX += 20;
            }
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", posX.toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const item = new PopupMenu_Item(PopupMenu_ItemType.TITLE, this.section, this.section.endY, this.lineHeight);
            this.section.items.push(item);
            this.section.endY += this.lineHeight;
        }
        addList(_text, _textSize, _values, _dictKeys) {
            const enabled = (_dictKeys != null) ? true : false;
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const hl = document.createElementNS(Avionics.SVG.NS, "rect");
            hl.setAttribute("x", (this.columnLeft3 - 2).toString());
            hl.setAttribute("y", (this.section.endY + 2).toString());
            hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
            hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
            hl.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
            hl.setAttribute("visibility", "hidden");
            this.sectionRoot.appendChild(hl);
            const choice = document.createElementNS(Avionics.SVG.NS, "text");
            choice.textContent = _values[0];
            choice.setAttribute("x", this.columnLeft3.toString());
            choice.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            choice.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
            choice.setAttribute("font-size", _textSize.toString());
            choice.setAttribute("font-family", this.textStyle);
            choice.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(choice);
            const item = new PopupMenu_Item(PopupMenu_ItemType.LIST, this.section, this.section.endY, this.lineHeight);
            item.dictKeys = _dictKeys;
            item.listElem = choice;
            item.listValues = _values;
            item.listHLElem = hl;
            this.section.items.push(item);
            this.section.endY += this.lineHeight;
        }
        addRange(_text, _textSize, _min, _max, _step, _dictKeys) {
            const enabled = (_dictKeys != null) ? true : false;
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const hl = document.createElementNS(Avionics.SVG.NS, "rect");
            hl.setAttribute("x", (this.columnLeft3 - 2).toString());
            hl.setAttribute("y", (this.section.endY + 2).toString());
            hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
            hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
            hl.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
            hl.setAttribute("visibility", "hidden");
            this.sectionRoot.appendChild(hl);
            const range = document.createElementNS(Avionics.SVG.NS, "text");
            range.setAttribute("x", this.columnLeft3.toString());
            range.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            range.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
            range.setAttribute("font-size", _textSize.toString());
            range.setAttribute("font-family", this.textStyle);
            range.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(range);
            const item = new PopupMenu_Item(PopupMenu_ItemType.RANGE, this.section, this.section.endY, this.lineHeight);
            item.dictKeys = _dictKeys;
            item.rangeElem = range;
            item.rangeHLElem = hl;
            item.rangeMin = _min;
            item.rangeMax = _max;
            item.rangeVal = _min;
            item.rangeStep = _step;
            item.rangeDecimals = Utils.countDecimals(_step);
            this.section.items.push(item);
            this.section.endY += this.lineHeight;
        }
        addRadio(_text, _textSize, _dictKeys) {
            const enabled = (_dictKeys != null) ? true : false;
            const cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
            const cy = this.section.endY + this.lineHeight * 0.5;
            let shape;
            if (this.shape3D) {
                const b = this.shape3DBorderSize;
                const h = Math.min(this.lineHeight, this.columnLeft2) * 0.8;
                const w = h * 0.75;
                if (enabled) {
                    const leftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                    leftBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " Z");
                    leftBorder.setAttribute("fill", this.shape3DBorderLeft);
                    this.sectionRoot.appendChild(leftBorder);
                    const rightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                    rightBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " Z");
                    rightBorder.setAttribute("fill", this.shape3DBorderRight);
                    this.sectionRoot.appendChild(rightBorder);
                }
                shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5 + b) + " L" + (cx - w * 0.5 + b) + " " + (cy) + " L" + (cx) + " " + (cy + h * 0.5 - b) + " L" + (cx + w * 0.5 - b) + " " + (cy) + " Z");
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                if (!enabled) {
                    shape.setAttribute("stroke", this.disabledColor);
                    shape.setAttribute("stroke-width", "1");
                }
                this.sectionRoot.appendChild(shape);
            } else {
                const size = Math.min(this.lineHeight, this.columnLeft2) * 0.33;
                shape = document.createElementNS(Avionics.SVG.NS, "circle");
                shape.setAttribute("cx", cx.toString());
                shape.setAttribute("cy", cy.toString());
                shape.setAttribute("r", size.toString());
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
                shape.setAttribute("stroke-width", "1");
                this.sectionRoot.appendChild(shape);
            }
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const item = new PopupMenu_Item(PopupMenu_ItemType.RADIO, this.section, this.section.endY, this.lineHeight);
            item.dictKeys = _dictKeys;
            item.radioElem = shape;
            item.radioName = _text;
            this.section.items.push(item);
            this.registerWithMouse(item);
            this.section.endY += this.lineHeight;
        }
        addRadioList(_text, _textSize, _values, _dictKeys) {
            const enabled = (_dictKeys != null) ? true : false;
            const cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
            const cy = this.section.endY + this.lineHeight * 0.5;
            let shape;
            if (this.shape3D) {
                const b = this.shape3DBorderSize;
                const h = Math.min(this.lineHeight, this.columnLeft2) * 0.8;
                const w = h * 0.75;
                if (enabled) {
                    const leftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                    leftBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " Z");
                    leftBorder.setAttribute("fill", this.shape3DBorderLeft);
                    this.sectionRoot.appendChild(leftBorder);
                    const rightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                    rightBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " Z");
                    rightBorder.setAttribute("fill", this.shape3DBorderRight);
                    this.sectionRoot.appendChild(rightBorder);
                }
                shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5 + b) + " L" + (cx - w * 0.5 + b) + " " + (cy) + " L" + (cx) + " " + (cy + h * 0.5 - b) + " L" + (cx + w * 0.5 - b) + " " + (cy) + " Z");
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                if (!enabled) {
                    shape.setAttribute("stroke", this.disabledColor);
                    shape.setAttribute("stroke-width", "1");
                }
                this.sectionRoot.appendChild(shape);
            } else {
                const size = Math.min(this.lineHeight, this.columnLeft2) * 0.33;
                shape = document.createElementNS(Avionics.SVG.NS, "circle");
                shape.setAttribute("cx", cx.toString());
                shape.setAttribute("cy", cy.toString());
                shape.setAttribute("r", size.toString());
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
                shape.setAttribute("stroke-width", "1");
                this.sectionRoot.appendChild(shape);
            }
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const hl = document.createElementNS(Avionics.SVG.NS, "rect");
            hl.setAttribute("x", (this.columnLeft3 - 2).toString());
            hl.setAttribute("y", (this.section.endY + 2).toString());
            hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
            hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
            hl.setAttribute("fill", this.interactionColor);
            hl.setAttribute("visibility", "hidden");
            this.sectionRoot.appendChild(hl);
            const choice = document.createElementNS(Avionics.SVG.NS, "text");
            choice.textContent = _values[0];
            choice.setAttribute("x", this.columnLeft3.toString());
            choice.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            choice.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
            choice.setAttribute("font-size", _textSize.toString());
            choice.setAttribute("font-family", this.textStyle);
            choice.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(choice);
            const item = new PopupMenu_Item(PopupMenu_ItemType.RADIO_LIST, this.section, this.section.endY, this.lineHeight);
            item.dictKeys = _dictKeys;
            item.radioElem = shape;
            item.radioName = _text;
            item.listElem = choice;
            item.listHLElem = hl;
            item.listValues = _values;
            this.section.items.push(item);
            this.registerWithMouse(item);
            this.section.endY += this.lineHeight;
        }
        addRadioRange(_text, _textSize, _min, _max, _step, _dictKeys) {
            const enabled = (_dictKeys != null) ? true : false;
            const cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
            const cy = this.section.endY + this.lineHeight * 0.5;
            let shape;
            if (this.shape3D) {
                const b = this.shape3DBorderSize;
                const h = Math.min(this.lineHeight, this.columnLeft2) * 0.8;
                const w = h * 0.75;
                if (enabled) {
                    const leftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                    leftBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " Z");
                    leftBorder.setAttribute("fill", this.shape3DBorderLeft);
                    this.sectionRoot.appendChild(leftBorder);
                    const rightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                    rightBorder.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5) + " l" + (w * 0.5) + " " + (h * 0.5) + " l" + (-w * 0.5) + " " + (h * 0.5) + " l0" + (-b) + " l" + (w * 0.5 - b) + " " + (-h * 0.5 + b) + " l" + (-w * 0.5 + b) + " " + (-h * 0.5 + b) + " Z");
                    rightBorder.setAttribute("fill", this.shape3DBorderRight);
                    this.sectionRoot.appendChild(rightBorder);
                }
                shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("d", "M" + (cx) + " " + (cy - h * 0.5 + b) + " L" + (cx - w * 0.5 + b) + " " + (cy) + " L" + (cx) + " " + (cy + h * 0.5 - b) + " L" + (cx + w * 0.5 - b) + " " + (cy) + " Z");
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                if (!enabled) {
                    shape.setAttribute("stroke", this.disabledColor);
                    shape.setAttribute("stroke-width", "1");
                }
                this.sectionRoot.appendChild(shape);
            } else {
                const size = Math.min(this.lineHeight, this.columnLeft2) * 0.33;
                shape = document.createElementNS(Avionics.SVG.NS, "circle");
                shape.setAttribute("cx", cx.toString());
                shape.setAttribute("cy", cy.toString());
                shape.setAttribute("r", size.toString());
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
                shape.setAttribute("stroke-width", "1");
                this.sectionRoot.appendChild(shape);
            }
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const hl = document.createElementNS(Avionics.SVG.NS, "rect");
            hl.setAttribute("x", (this.columnLeft3 - 2).toString());
            hl.setAttribute("y", (this.section.endY + 2).toString());
            hl.setAttribute("width", (this.menuWidth - 2 - (this.columnLeft3 - 2)).toString());
            hl.setAttribute("height", ((this.section.endY + this.lineHeight - 2) - (this.section.endY + 2)).toString());
            hl.setAttribute("fill", this.interactionColor);
            hl.setAttribute("visibility", "hidden");
            this.sectionRoot.appendChild(hl);
            const range = document.createElementNS(Avionics.SVG.NS, "text");
            range.setAttribute("x", this.columnLeft3.toString());
            range.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            range.setAttribute("fill", (enabled) ? this.interactionColor : this.disabledColor);
            range.setAttribute("font-size", _textSize.toString());
            range.setAttribute("font-family", this.textStyle);
            range.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(range);
            const item = new PopupMenu_Item(PopupMenu_ItemType.RADIO_RANGE, this.section, this.section.endY, this.lineHeight);
            item.dictKeys = _dictKeys;
            item.radioElem = shape;
            item.radioName = _text;
            item.rangeElem = range;
            item.rangeHLElem = hl;
            item.rangeMin = _min;
            item.rangeMax = _max;
            item.rangeStep = _step;
            item.rangeDecimals = Utils.countDecimals(_step);
            this.section.items.push(item);
            this.registerWithMouse(item);
            this.section.endY += this.lineHeight;
        }
        addCheckbox(_text, _textSize, _dictKeys) {
            const enabled = (_dictKeys != null) ? true : false;
            const size = Math.min(this.lineHeight, this.columnLeft2) * 0.66;
            const cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
            const cy = this.section.endY + this.lineHeight * 0.5;
            let shape;
            if (this.shape3D && enabled) {
                const b = this.shape3DBorderSize;
                const topLeftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                topLeftBorder.setAttribute("d", "M" + (cx - size * 0.5) + " " + (cy - size * 0.5) + " l" + (size) + " 0 l" + (-b) + " " + (b) + " l" + (-(size - b * 2)) + " 0 l0 " + (size - b * 2) + " l" + (-b) + " " + (b) + " Z");
                topLeftBorder.setAttribute("fill", this.shape3DBorderLeft);
                this.sectionRoot.appendChild(topLeftBorder);
                const bottomRightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                bottomRightBorder.setAttribute("d", "M" + (cx + size * 0.5) + " " + (cy + size * 0.5) + " l" + (-size) + " 0 l" + (b) + " " + (-b) + " l" + (size - b * 2) + " 0 l0 " + (-(size - b * 2)) + " l" + (b) + " " + (-b) + " Z");
                bottomRightBorder.setAttribute("fill", this.shape3DBorderRight);
                this.sectionRoot.appendChild(bottomRightBorder);
                shape = document.createElementNS(Avionics.SVG.NS, "rect");
                shape.setAttribute("x", (cx - size * 0.5 + b).toString());
                shape.setAttribute("y", (cy - size * 0.5 + b).toString());
                shape.setAttribute("width", (size - b * 2).toString());
                shape.setAttribute("height", (size - b * 2).toString());
                shape.setAttribute("fill", this.shapeFillColor);
                this.sectionRoot.appendChild(shape);
            } else {
                shape = document.createElementNS(Avionics.SVG.NS, "rect");
                shape.setAttribute("x", (cx - size * 0.5).toString());
                shape.setAttribute("y", (cy - size * 0.5).toString());
                shape.setAttribute("width", size.toString());
                shape.setAttribute("height", size.toString());
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
                shape.setAttribute("stroke-width", "1");
                this.sectionRoot.appendChild(shape);
            }
            const tick = document.createElementNS(Avionics.SVG.NS, "path");
            tick.setAttribute("d", "M" + (cx - size * 0.5) + " " + (cy) + " l" + (size * 0.4) + " " + (size * 0.5) + " l" + (size * 0.6) + " " + (-size));
            tick.setAttribute("fill", "none");
            tick.setAttribute("stroke", this.interactionColor);
            tick.setAttribute("stroke-width", "4");
            tick.setAttribute("visibility", "hidden");
            this.sectionRoot.appendChild(tick);
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const item = new PopupMenu_Item(PopupMenu_ItemType.CHECKBOX, this.section, this.section.endY, this.lineHeight);
            item.dictKeys = _dictKeys;
            item.checkboxElem = shape;
            item.checkboxTickElem = tick;
            this.section.items.push(item);
            this.registerWithMouse(item);
            this.section.endY += this.lineHeight;
        }
        addSubMenu(_text, _textSize, _callback) {
            const enabled = (_callback != null) ? true : false;
            const size = Math.min(this.lineHeight, this.columnLeft2) * 0.66;
            const cx = this.columnLeft1 + (this.columnLeft2 - this.columnLeft1) * 0.5;
            const cy = this.section.endY + this.lineHeight * 0.5;
            const arrow = document.createElementNS(Avionics.SVG.NS, "path");
            arrow.setAttribute("d", "M" + (cx - size * 0.5) + " " + (cy - size * 0.5) + " l0 " + (size) + " l" + (size * 0.75) + " " + (-size * 0.5) + " Z");
            arrow.setAttribute("fill", (enabled) ? this.interactionColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
            this.sectionRoot.appendChild(arrow);
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", (this.columnLeft2 + this.textMarginX).toString());
            text.setAttribute("y", (this.section.endY + this.lineHeight * 0.5).toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const item = new PopupMenu_Item(PopupMenu_ItemType.SUBMENU, this.section, this.section.endY, this.lineHeight);
            item.subMenu = _callback;
            this.section.items.push(item);
            this.registerWithMouse(item);
            this.section.endY += this.lineHeight;
        }
        addButton(_text, _textSize, _callback) {
            const enabled = (_callback != null) ? true : false;
            const cx = this.menuLeft + (this.menuWidth - this.menuLeft) * 0.5;
            const cy = this.section.endY + this.lineHeight * 0.5;
            const w = this.menuWidth * 0.66;
            const h = this.lineHeight * 0.66;
            let shape;
            if (this.shape3D && enabled) {
                const b = this.shape3DBorderSize;
                const topLeftBorder = document.createElementNS(Avionics.SVG.NS, "path");
                topLeftBorder.setAttribute("d", "M" + (cx - w * 0.5) + " " + (cy - h * 0.5) + " l" + (w) + " 0 l" + (-b) + " " + (b) + " l" + (-(w - b * 2)) + " 0 l0 " + (h - b * 2) + " l" + (-b) + " " + (b) + " Z");
                topLeftBorder.setAttribute("fill", this.shape3DBorderLeft);
                this.sectionRoot.appendChild(topLeftBorder);
                const bottomRightBorder = document.createElementNS(Avionics.SVG.NS, "path");
                bottomRightBorder.setAttribute("d", "M" + (cx + w * 0.5) + " " + (cy + h * 0.5) + " l" + (-w) + " 0 l" + (b) + " " + (-b) + " l" + (w - b * 2) + " 0 l0 " + (-(h - b * 2)) + " l" + (b) + " " + (-b) + " Z");
                bottomRightBorder.setAttribute("fill", this.shape3DBorderRight);
                this.sectionRoot.appendChild(bottomRightBorder);
                shape = document.createElementNS(Avionics.SVG.NS, "rect");
                shape.setAttribute("x", (cx - w * 0.5 + b).toString());
                shape.setAttribute("y", (cy - h * 0.5 + b).toString());
                shape.setAttribute("width", (w - b * 2).toString());
                shape.setAttribute("height", (h - b * 2).toString());
                shape.setAttribute("fill", this.shapeFillColor);
                this.sectionRoot.appendChild(shape);
            } else {
                shape = document.createElementNS(Avionics.SVG.NS, "rect");
                shape.setAttribute("x", (cx - w * 0.5).toString());
                shape.setAttribute("y", (cy - h * 0.5).toString());
                shape.setAttribute("width", w.toString());
                shape.setAttribute("height", h.toString());
                shape.setAttribute("fill", (enabled) ? this.shapeFillColor : ((this.shapeFillIfDisabled) ? this.disabledColor : "none"));
                shape.setAttribute("stroke", (enabled) ? "white" : this.disabledColor);
                shape.setAttribute("stroke-width", "1");
                this.sectionRoot.appendChild(shape);
            }
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = _text;
            text.setAttribute("x", cx.toString());
            text.setAttribute("y", cy.toString());
            text.setAttribute("fill", (enabled) ? "white" : this.disabledColor);
            text.setAttribute("font-size", _textSize.toString());
            text.setAttribute("font-family", this.textStyle);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("alignment-baseline", "central");
            this.sectionRoot.appendChild(text);
            const item = new PopupMenu_Item(PopupMenu_ItemType.SUBMENU, this.section, this.section.endY, this.lineHeight);
            item.subMenu = _callback;
            this.section.items.push(item);
            this.registerWithMouse(item);
            this.section.endY += this.lineHeight;
        }
        updateHighlight() {
            if (this.highlightElem) {
                let itemId = 0;
                let lastItem;
                for (let i = 0; i < this.allSections.length; i++) {
                    const section = this.allSections[i];
                    for (let j = 0; j < section.items.length; j++) {
                        const item = section.items[j];
                        if (item.interactive) {
                            if (itemId == this.highlightId) {
                                this.setHighlightedItem(item);
                                return true;
                            }
                            lastItem = item;
                            itemId++;
                        }
                    }
                }
                if (lastItem) {
                    this.highlightId = itemId - 1;
                    this.setHighlightedItem(lastItem);
                }
            }
        }
        setHighlightedItem(_item) {
            if (_item != this.highlightItem) {
                this.highlightItem = _item;
                this.highlightElem.setAttribute("y", _item.y.toString());
                this.speedInc = 1.0;
            }
        }
        activateItem(_item, _val) {
            if (!_item.enabled) {
                return;
            }
            switch (_item.type) {
                case PopupMenu_ItemType.RADIO:
                case PopupMenu_ItemType.RADIO_LIST:
                case PopupMenu_ItemType.RADIO_RANGE:
                    if (_val) {
                        _item.radioVal = true;
                        _item.radioElem.setAttribute("fill", this.interactionColor);
                    } else {
                        _item.radioVal = false;
                        _item.radioElem.setAttribute("fill", this.shapeFillColor);
                    }
                    break;
                case PopupMenu_ItemType.CHECKBOX:
                    if (_val) {
                        _item.checkboxVal = true;
                        _item.checkboxTickElem.setAttribute("visibility", "visible");
                    } else {
                        _item.checkboxVal = false;
                        _item.checkboxTickElem.setAttribute("visibility", "hidden");
                    }
                    break;
            }
        }
        updateSpeedInc() {
            if (this.highlightItem) {
                if (this.speedInc > 1) {
                    this.speedInc -= this.speedInc_DownFactor;
                    if (this.speedInc < 1) {
                        this.speedInc = 1;
                    }
                }
            } else {
                this.speedInc = 1.0;
            }
        }
        getSpeedAccel() {
            const pow = 1.0 + ((this.speedInc - 1.0) * this.speedInc_PowFactor);
            const accel = Math.pow(this.speedInc, pow);
            return Math.floor(accel);
        }
        onChanged(_item) {
            if (this.dictionary && _item.enabled) {
                switch (_item.type) {
                    case PopupMenu_ItemType.RADIO:
                    case PopupMenu_ItemType.RADIO_LIST:
                    case PopupMenu_ItemType.RADIO_RANGE:
                        let found = false;
                        for (let i = 0; i < _item.section.items.length; i++) {
                            if (_item.section.items[i].radioVal) {
                                this.dictionary.set(_item.dictKeys[0], _item.radioName);
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            this.dictionary.remove(_item.dictKeys[0]);
                        }
                        break;
                    case PopupMenu_ItemType.LIST:
                        this.dictionary.set(_item.dictKeys[0], _item.listValues[_item.listVal]);
                        break;
                    case PopupMenu_ItemType.RANGE:
                        this.dictionary.set(_item.dictKeys[0], _item.rangeVal.toString());
                        break;
                    case PopupMenu_ItemType.CHECKBOX:
                        this.dictionary.set(_item.dictKeys[0], (_item.checkboxVal) ? "ON" : "OFF");
                        break;
                }
                switch (_item.type) {
                    case PopupMenu_ItemType.RADIO_LIST:
                        this.dictionary.set(_item.dictKeys[1], _item.listValues[_item.listVal]);
                        break;
                    case PopupMenu_ItemType.RADIO_RANGE:
                        this.dictionary.set(_item.dictKeys[1], _item.rangeVal.toString());
                        break;
                }
            }
        }
        registerWithMouse(_item) {
            const mouseFrame = document.createElementNS(Avionics.SVG.NS, "rect");
            mouseFrame.setAttribute("x", this.menuLeft.toString());
            mouseFrame.setAttribute("y", this.section.endY.toString());
            mouseFrame.setAttribute("width", this.menuWidth.toString());
            mouseFrame.setAttribute("height", this.lineHeight.toString());
            mouseFrame.setAttribute("fill", "none");
            mouseFrame.setAttribute("pointer-events", "visible");
            this.sectionRoot.appendChild(mouseFrame);
            mouseFrame.addEventListener("mouseover", this.onMouseOver.bind(this, _item));
            mouseFrame.addEventListener("mouseup", this.onMousePress.bind(this, _item));
        }
        onMouseOver(_item) {
            if (_item.enabled) {
                let itemId = 0;
                for (let i = 0; i < this.allSections.length; i++) {
                    const section = this.allSections[i];
                    for (let j = 0; j < section.items.length; j++) {
                        const item = section.items[j];
                        if (item.interactive) {
                            if (item == _item) {
                                this.highlightId = itemId;
                                return;
                            }
                            itemId++;
                        }
                    }
                }
            }
        }
        onMousePress(_item) {
            if (_item.enabled) {
                this.onActivate();
            }
        }
    }
    Airliners.PopupMenu_Handler = PopupMenu_Handler;
})(Airliners || (Airliners = {}));
//# sourceMappingURL=BaseAirliners.js.map