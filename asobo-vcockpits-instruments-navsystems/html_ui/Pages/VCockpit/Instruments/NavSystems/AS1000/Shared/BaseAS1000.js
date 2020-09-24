class BaseAS1000 extends NavSystem {
    get IsGlassCockpit() { return true; }
    connectedCallback() {
        super.connectedCallback();
        this.preserveAspectRatio("Mainframe");
        this.addIndependentElementContainer(new NavSystemElementContainer("Frequencies", "NavBox", new NavSystemElementGroup([
            new AS1000.NavFrequencies(),
            new AS1000.ComFrequencies()
        ])));
        this.addIndependentElementContainer(new NavSystemElementContainer("SoftKeys", "SoftKeys", new SoftKeys()));
        this.addEventLinkedPopupWindow(new NavSystemEventLinkedPopUpWindow("DRCT", "DRCT", new GlassCockpit_DirectTo(), "DIRECTTO"));
        this.addEventAlias("FMS_Upper_INC", "NavigationSmallInc");
        this.addEventAlias("FMS_Upper_DEC", "NavigationSmallDec");
        this.addEventAlias("FMS_Lower_INC", "NavigationLargeInc");
        this.addEventAlias("FMS_Lower_DEC", "NavigationLargeDec");
        this.addEventAlias("FMS_Upper_PUSH", "NavigationPush");
    }
}
var AS1000;
(function (AS1000) {
    class NavFrequencies extends NavSystemElement {
        constructor() {
            super(...arguments);
            this.wantedActiveIndex = 1;
            this.activeIndex = 0;
            this.nav1ActiveValue = "";
            this.nav2ActiveValue = "";
            this.nav1SbyValue = "";
            this.nav2SbyValue = "";
        }
        getActiveIndex() {
            return this.activeIndex;
        }
        init() {
            this.isInitialized = true;
            this.nav1SbyElement = this.gps.getChildById("Nav1_StdBy");
            this.nav1ArrowElement = this.gps.getChildById("Nav1_DoubleArrow");
            this.nav1ActiveElement = this.gps.getChildById("Nav1_Active");
            this.nav1IdentElement = this.gps.getChildById("Nav1_Ident");
            this.nav2SbyElement = this.gps.getChildById("Nav2_StdBy");
            this.nav2ArrowElement = this.gps.getChildById("Nav2_DoubleArrow");
            this.nav2ActiveElement = this.gps.getChildById("Nav2_Active");
            this.nav2IdentElement = this.gps.getChildById("Nav2_Ident");
        }
        onEvent(_event) {
            switch (_event) {
                case "NAV_Push":
                    this.wantedActiveIndex = (this.activeIndex == 1 ? 2 : 1);
                    break;
                case "NAV_Switch":
                    SimVar.SetSimVarValue("K:NAV" + this.activeIndex + "_RADIO_SWAP", "number", 0);
                    break;
                case "NAV_Large_INC":
                    SimVar.SetSimVarValue("K:NAV" + this.activeIndex + "_RADIO_WHOLE_INC", "number", 0);
                    break;
                case "NAV_Large_DEC":
                    SimVar.SetSimVarValue("K:NAV" + this.activeIndex + "_RADIO_WHOLE_DEC", "number", 0);
                    break;
                case "NAV_Small_INC":
                    SimVar.SetSimVarValue("K:NAV" + this.activeIndex + "_RADIO_FRACT_INC", "number", 0);
                    break;
                case "NAV_Small_DEC":
                    SimVar.SetSimVarValue("K:NAV" + this.activeIndex + "_RADIO_FRACT_DEC", "number", 0);
                    break;
                case "VOL_1_INC":
                    SimVar.SetSimVarValue("K:NAV" + this.activeIndex + "_VOLUME_INC", "number", 0);
                    break;
                case "VOL_1_DEC":
                    SimVar.SetSimVarValue("K:NAV" + this.activeIndex + "_VOLUME_DEC", "number", 0);
                    break;
            }
        }
        onEnter() {
        }
        onUpdate(_deltaTime) {
            if (this.nav1ActiveElement) {
                var nav1Active = SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "MHz");
                if (nav1Active) {
                    var nav1ActiveValue = nav1Active.toFixed(2);
                    if (nav1ActiveValue != this.nav1ActiveValue) {
                        this.nav1ActiveElement.textContent = nav1ActiveValue;
                        this.nav1IdentElement.textContent =
                            this.nav1ActiveValue = nav1ActiveValue;
                    }
                }
                Avionics.Utils.diffAndSet(this.nav1IdentElement, SimVar.GetSimVarValue("NAV IDENT:1", "string"));
                var nav2Active = SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:2", "MHz");
                if (nav2Active) {
                    var nav2ActiveValue = nav2Active.toFixed(2);
                    if (nav2ActiveValue != this.nav2ActiveValue) {
                        this.nav2ActiveElement.textContent = nav2ActiveValue;
                        this.nav2ActiveValue = nav2ActiveValue;
                    }
                }
                Avionics.Utils.diffAndSet(this.nav2IdentElement, SimVar.GetSimVarValue("NAV IDENT:2", "string"));
                var nav1Sby = SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:1", "MHz");
                if (nav1Sby) {
                    var nav1SbyValue = nav1Sby.toFixed(2);
                    if (nav1SbyValue != this.nav1SbyValue) {
                        this.nav1SbyElement.textContent = nav1SbyValue;
                        this.nav1SbyValue = nav1SbyValue;
                    }
                }
                var nav2Sby = SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:2", "MHz");
                if (nav2Sby) {
                    var nav2SbyValue = nav2Sby.toFixed(2);
                    if (nav2SbyValue != this.nav2SbyValue) {
                        this.nav2SbyElement.textContent = nav2SbyValue;
                        this.nav2SbyValue = nav2SbyValue;
                    }
                }
                if (this.activeIndex != this.wantedActiveIndex) {
                    if (this.wantedActiveIndex == 1) {
                        this.nav1ArrowElement.setAttribute("style", "visibility:visible");
                        this.nav2ArrowElement.setAttribute("style", "visibility:hidden");
                        this.nav1SbyElement.setAttribute("state", "selected");
                        this.nav2SbyElement.setAttribute("state", "unselected");
                    }
                    else {
                        this.nav1ArrowElement.setAttribute("style", "visibility:hidden");
                        this.nav2ArrowElement.setAttribute("style", "visibility:visible");
                        this.nav1SbyElement.setAttribute("state", "unselected");
                        this.nav2SbyElement.setAttribute("state", "selected");
                    }
                    this.activeIndex = this.wantedActiveIndex;
                }
            }
        }
        onExit() {
        }
        setGreenFrequencyIndex(_index) {
            if (_index == 1) {
                this.nav1ActiveElement.setAttribute("state", "green");
            }
            else {
                this.nav1ActiveElement.setAttribute("state", "none");
            }
            if (_index == 2) {
                this.nav2ActiveElement.setAttribute("state", "green");
            }
            else {
                this.nav2ActiveElement.setAttribute("state", "none");
            }
        }
    }
    AS1000.NavFrequencies = NavFrequencies;
    class ComFrequencies extends NavSystemElement {
        constructor() {
            super(...arguments);
            this.wantedActiveIndex = 1;
            this.activeIndex = 0;
            this.com1ActiveValue = "";
            this.com2ActiveValue = "";
            this.com1SbyValue = "";
            this.com2SbyValue = "";
        }
        make_bcd16(arg) {
            var iarg = (arg / 10000.0 - 10000);
            arg = (iarg % 10) + ((iarg / 10 % 10) << 4) + ((iarg / 100 % 10) << 8) + ((iarg / 1000 % 10) << 12);
            return arg;
        }
        getActiveIndex() {
            return this.activeIndex;
        }
        onEvent(_event) {
            switch (_event) {
                case "COM_Push":
                    this.wantedActiveIndex = (this.activeIndex == 1 ? 2 : 1);
                    break;
                case "COM_Switch":
                    SimVar.SetSimVarValue("K:COM" + (this.activeIndex == 1 ? "_STBY" : "2") + "_RADIO_SWAP", "number", 0);
                    break;
                case "COM_Switch_Long":
                    SimVar.SetSimVarValue("K:COM" + (this.activeIndex == 1 ? "" : "2") + "_RADIO_SET", "Frequency BCD16", this.make_bcd16(121500000));
                    break;
                case "COM_Large_INC":
                    SimVar.SetSimVarValue("K:COM" + (this.activeIndex == 1 ? "" : "2") + "_RADIO_WHOLE_INC", "number", 0);
                    break;
                case "COM_Large_DEC":
                    SimVar.SetSimVarValue("K:COM" + (this.activeIndex == 1 ? "" : "2") + "_RADIO_WHOLE_DEC", "number", 0);
                    break;
                case "COM_Small_INC":
                    SimVar.SetSimVarValue("K:COM" + (this.activeIndex == 1 ? "" : "2") + "_RADIO_FRACT_INC", "number", 0);
                    break;
                case "COM_Small_DEC":
                    SimVar.SetSimVarValue("K:COM" + (this.activeIndex == 1 ? "" : "2") + "_RADIO_FRACT_DEC", "number", 0);
                    break;
                case "VOL_2_INC":
                    SimVar.SetSimVarValue("K:COM" + this.activeIndex + "_VOLUME_INC", "number", 0);
                    break;
                case "VOL_2_DEC":
                    SimVar.SetSimVarValue("K:COM" + this.activeIndex + "_VOLUME_DEC", "number", 0);
                    break;
            }
        }
        init() {
            this.isInitialized = true;
            this.com1SbyElement = this.gps.getChildById("Com1_StdBy");
            this.com1ArrowElement = this.gps.getChildById("Com1_DoubleArrow");
            this.com1ActiveElement = this.gps.getChildById("Com1_Active");
            this.com2SbyElement = this.gps.getChildById("Com2_StdBy");
            this.com2ArrowElement = this.gps.getChildById("Com2_DoubleArrow");
            this.com2ActiveElement = this.gps.getChildById("Com2_Active");
        }
        onEnter() {
        }
        onUpdate(_deltaTime) {
            if (this.com1ActiveElement) {
                var com1Active = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz");
                if (com1Active) {
                    var com1ActiveValue = com1Active.toFixed(3);
                    if (com1ActiveValue != this.com1ActiveValue) {
                        this.com1ActiveElement.textContent = com1ActiveValue;
                        this.com1ActiveValue = com1ActiveValue;
                    }
                }
                var com2Active = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "MHz");
                if (com2Active) {
                    var com2ActiveValue = com2Active.toFixed(3);
                    if (com2ActiveValue != this.com2ActiveValue) {
                        this.com2ActiveElement.textContent = com2ActiveValue;
                        this.com2ActiveValue = com2ActiveValue;
                    }
                }
                var com1Sby = SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz");
                if (com1Sby) {
                    var com1SbyValue = com1Sby.toFixed(3);
                    if (com1SbyValue != this.com1SbyValue) {
                        this.com1SbyElement.textContent = com1SbyValue;
                        this.com1SbyValue = com1SbyValue;
                    }
                }
                var com2Sby = SimVar.GetSimVarValue("COM STANDBY FREQUENCY:2", "MHz");
                if (com2Sby) {
                    var com2SbyValue = com2Sby.toFixed(3);
                    if (com2SbyValue != this.com2SbyValue) {
                        this.com2SbyElement.textContent = com2SbyValue;
                        this.com2SbyValue = com2SbyValue;
                    }
                }
                if (this.wantedActiveIndex != this.activeIndex) {
                    if (this.wantedActiveIndex == 1) {
                        this.com1ArrowElement.setAttribute("style", "visibility:visible");
                        this.com2ArrowElement.setAttribute("style", "visibility:hidden");
                        this.com1SbyElement.setAttribute("state", "selected");
                        this.com2SbyElement.setAttribute("state", "unselected");
                    }
                    else {
                        this.com1ArrowElement.setAttribute("style", "visibility:hidden");
                        this.com2ArrowElement.setAttribute("style", "visibility:visible");
                        this.com1SbyElement.setAttribute("state", "unselected");
                        this.com2SbyElement.setAttribute("state", "selected");
                    }
                    this.activeIndex = this.wantedActiveIndex;
                }
            }
        }
        onExit() {
        }
    }
    AS1000.ComFrequencies = ComFrequencies;
})(AS1000 || (AS1000 = {}));
class Engine extends NavSystemElementContainer {
    constructor(_name, _root) {
        super(_name, _root, null);
        this.nbEngineReady = 0;
        this.allElements = [];
        this.allEnginesReady = false;
        this.widthSet = false;
        this.xmlEngineDisplay = null;
    }
    init() {
        super.init();
        this.root = this.gps.getChildById(this.htmlElemId);
        if (!this.root) {
            console.error("Root component expected!");
            return;
        }
        let fromConfig = false;
        if (this.gps.xmlConfig) {
            let engineRoot = this.gps.xmlConfig.getElementsByTagName("EngineDisplay");
            if (engineRoot.length > 0) {
                fromConfig = true;
                this.root.setAttribute("state", "XML");
                this.xmlEngineDisplay = this.root.querySelector("glasscockpit-xmlenginedisplay");
                this.xmlEngineDisplay.setConfiguration(this.gps, engineRoot[0]);
            }
        }
        if (!fromConfig) {
            this.engineType = Simplane.getEngineType();
            this.engineCount = Simplane.getEngineCount();
            var ed = this.root.querySelector("engine-display");
            if (!ed) {
                console.error("Engine Display component expected!");
                return;
            }
            TemplateElement.call(ed, this.initEngines.bind(this));
        }
    }
    initEngines() {
        this.initSettings();
        switch (this.engineType) {
            case EngineType.ENGINE_TYPE_PISTON:
                {
                    this.root.setAttribute("state", "piston");
                    this.addGauge().Set(this.gps.getChildById("Piston_VacGauge"), this.settings.Vacuum, this.getVAC.bind(this), "VAC", "inHg");
                    this.addGauge().Set(this.gps.getChildById("Piston_FuelGauge"), this.settings.FuelQuantity, this.getFuelR.bind(this), "FUEL QTY", "GAL", 0, this.getFuelL.bind(this));
                    this.addText().Set(this.gps.getChildById("Piston_EngineHours"), this.getEngineHours.bind(this));
                    this.addText().Set(this.gps.getChildById("Piston_Bus_M"), this.getVoltsBus.bind(this));
                    this.addText().Set(this.gps.getChildById("Piston_Bus_E"), this.getVoltsBattery.bind(this));
                    this.addText().Set(this.gps.getChildById("Piston_Batt_M"), this.getAmpsBattery.bind(this));
                    this.addText().Set(this.gps.getChildById("Piston_Batt_S"), this.getAmpsGenAlt.bind(this));
                    var engineRoot = this.root.querySelector("#PistonEnginesPanel");
                    if (engineRoot) {
                        for (var i = 0; i < this.engineCount; i++) {
                            let engine = new PistonEngine();
                            TemplateElement.call(engine, this.onEngineReady.bind(this, engine, i));
                            engineRoot.appendChild(engine);
                        }
                    }
                    else {
                        console.error("Unable to find engine root");
                        return;
                    }
                    break;
                }
            case EngineType.ENGINE_TYPE_TURBOPROP:
            case EngineType.ENGINE_TYPE_JET:
                {
                    this.root.setAttribute("state", "turbo");
                    this.addGauge().Set(this.gps.getChildById("Turbo_AmpGauge1"), this.settings.BatteryBusAmps, this.getAmpsBattery.bind(this), "", "AMPS B");
                    this.addGauge().Set(this.gps.getChildById("Turbo_AmpGauge2"), this.settings.GenAltBusAmps, this.getAmpsGenAlt.bind(this), "", "AMPS G");
                    this.addGauge().Set(this.gps.getChildById("Turbo_VoltsGauge1"), this.settings.MainBusVoltage, this.getVoltsBus.bind(this), "", "VOLTS B");
                    this.addGauge().Set(this.gps.getChildById("Turbo_VoltsGauge2"), this.settings.HotBatteryBusVoltage, this.getVoltsBattery.bind(this), "", "VOLTS E");
                    this.addGauge().Set(this.gps.getChildById("Turbo_FuelGaugeLeft"), this.settings.FuelQuantity, this.getFuelL.bind(this), "", "");
                    this.addGauge().Set(this.gps.getChildById("Turbo_FuelGaugeRight"), this.settings.FuelQuantity, this.getFuelR.bind(this), "", "");
                    this.addGauge().Set(this.gps.getChildById("Turbo_DiffPsiGauge"), this.settings.CabinPressureDiff, this.getPressureDiff.bind(this), "", "DIFF PSI");
                    this.addGauge().Set(this.gps.getChildById("Turbo_AltGauge"), this.settings.CabinAltitude, this.getCabinAlt.bind(this), "", "");
                    this.addGauge().Set(this.gps.getChildById("Turbo_RateGauge"), this.settings.CabinAltitudeChangeRate, this.getCabinAltRate.bind(this), "", "");
                    this.addText().Set(this.gps.getChildById("OxyPsiValue"), this.getOxyPressure.bind(this));
                    let trimElevParam = new ColorRangeDisplay();
                    trimElevParam.min = -100;
                    trimElevParam.max = 100;
                    trimElevParam.greenStart = (Simplane.getTrimNeutral() * 100) - 15;
                    trimElevParam.greenEnd = (Simplane.getTrimNeutral() * 100) + 15;
                    this.addGauge().Set(this.gps.getChildById("Turbo_ElevTrim"), trimElevParam, this.getTrimElev.bind(this), "", "");
                    let trimRudderParam = new ColorRangeDisplay4();
                    trimRudderParam.min = -100;
                    trimRudderParam.max = 100;
                    trimRudderParam.greenStart = 20;
                    trimRudderParam.greenEnd = 60;
                    trimRudderParam.whiteStart = -25.5;
                    trimRudderParam.whiteEnd = -6;
                    this.addGauge().Set(this.gps.getChildById("Turbo_RudderTrim"), trimRudderParam, this.getTrimRudder.bind(this), "", "");
                    let trimAilParam = new ColorRangeDisplay4();
                    trimAilParam.min = -100;
                    trimAilParam.max = 100;
                    trimAilParam.whiteStart = -10;
                    trimAilParam.whiteEnd = 10;
                    this.addGauge().Set(this.gps.getChildById("Turbo_AilTrim"), trimAilParam, this.getTrimAil.bind(this), "", "");
                    let flapsParam = new FlapsRangeDisplay();
                    flapsParam.min = 0;
                    flapsParam.max = 34;
                    flapsParam.takeOffValue = 10;
                    this.addGauge().Set(this.gps.getChildById("Turbo_Flaps"), flapsParam, this.getFlapsAngle.bind(this), "", "");
                    var engineRoot = this.root.querySelector("#TurboEngine");
                    if (engineRoot) {
                        for (var i = this.engineCount - 1; i >= 0; i--) {
                            let engine = new TurboEngine();
                            TemplateElement.call(engine, this.onEngineReady.bind(this, engine, i));
                            engineRoot.insertBefore(engine, engineRoot.firstChild);
                        }
                    }
                    else {
                        console.error("Unable to find engine root");
                        return;
                    }
                    break;
                }
        }
    }
    onEngineReady(_engine, _index) {
        this.nbEngineReady++;
        switch (this.engineType) {
            case EngineType.ENGINE_TYPE_PISTON:
                {
                    this.addGauge().Set(_engine.querySelector(".Piston_RPMGauge"), this.settings.RPM, this.getRPM.bind(this, _index), "", "RPM");
                    this.addGauge().Set(_engine.querySelector(".Piston_FFlowGauge"), this.settings.FuelFlow, this.getFuelFlow.bind(this, _index), "FFLOW", "GPH");
                    this.addGauge().Set(_engine.querySelector(".Piston_OilPressGauge"), this.settings.OilPressure, this.getOilPress.bind(this, _index), "OIL PRESS", "");
                    this.addGauge().Set(_engine.querySelector(".Piston_OilTempGauge"), this.settings.OilTemperature, this.getOilTempFarenheit.bind(this, _index), "OIL TEMP", "");
                    this.addGauge().Set(_engine.querySelector(".Piston_EgtGauge"), this.settings.EGTTemperature, this.getEGTFarenheit.bind(this, _index), "EGT", "");
                    break;
                }
            case EngineType.ENGINE_TYPE_TURBOPROP:
            case EngineType.ENGINE_TYPE_JET:
                {
                    this.addGauge().Set(_engine.querySelector(".Turbo_TorqueGauge"), this.settings.Torque, this.getTorque.bind(this, _index), "TRQ", "%");
                    this.addGauge().Set(_engine.querySelector(".Turbo_RPMGauge"), this.settings.RPM, this.getRPM.bind(this, _index), "PROP", "RPM");
                    this.addGauge().Set(_engine.querySelector(".Turbo_NgGauge"), this.settings.TurbineNg, this.getNg.bind(this, _index), "NG", "%", 1);
                    this.addGauge().Set(_engine.querySelector(".Turbo_IttGauge"), this.settings.ITTEngineOff, this.getItt.bind(this, _index), "ITT", "°C");
                    this.addGauge().Set(_engine.querySelector(".Turbo_OilPressGauge"), this.settings.OilPressure, this.getOilPress.bind(this, _index), "OIL PRESS", "");
                    this.addGauge().Set(_engine.querySelector(".Turbo_OilTempGauge"), this.settings.OilTemperature, this.getOilTempCelsius.bind(this, _index), "OIL TEMP", "");
                    let CAS = new Engine_Annunciations();
                    this.allElements.push(CAS);
                    break;
                }
        }
        if (this.nbEngineReady == this.engineCount) {
            this.allEnginesReady = true;
            this.element = new NavSystemElementGroup(this.allElements);
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.xmlEngineDisplay) {
            this.xmlEngineDisplay.update(_deltaTime);
        }
        this.updateWidth();
    }
    updateWidth() {
        if (!this.root || !this.allEnginesReady || this.widthSet)
            return;
        var vpRect = this.gps.getBoundingClientRect();
        var vpWidth = vpRect.width;
        var vpHeight = vpRect.height;
        if (vpWidth <= 0 || vpHeight <= 0)
            return;
        var width = this.root.offsetWidth;
        if (width <= 0)
            return;
        var newWidth = width * this.engineCount;
        if (width != newWidth) {
            this.root.style.width = width * this.engineCount + "px";
            for (var i = 0; i < this.allElements.length; i++) {
                this.allElements[i].redraw();
            }
        }
        this.widthSet = true;
    }
    addGauge() {
        var newElem = new GaugeElement();
        this.allElements.push(newElem);
        return newElem;
    }
    addText() {
        var newElem = new TextElement();
        this.allElements.push(newElem);
        return newElem;
    }
    initSettings() {
        this.settings = SimVar.GetGameVarValue("", "GlassCockpitSettings");
        if (this.settings) {
            return;
        }
        this.settings = new GlassCockpitSettings();
        switch (this.engineType) {
            case EngineType.ENGINE_TYPE_PISTON:
                {
                    this.settings.Vacuum.min = 3.5;
                    this.settings.Vacuum.greenStart = 4.5;
                    this.settings.Vacuum.greenEnd = 5.5;
                    this.settings.Vacuum.max = 7;
                    this.settings.FuelQuantity.min = 0;
                    this.settings.FuelQuantity.greenStart = 5;
                    this.settings.FuelQuantity.greenEnd = 24;
                    this.settings.FuelQuantity.yellowStart = 1.5;
                    this.settings.FuelQuantity.yellowEnd = 5;
                    this.settings.FuelQuantity.redStart = 0;
                    this.settings.FuelQuantity.redEnd = 3;
                    this.settings.FuelQuantity.max = 24;
                    this.settings.RPM.min = 0;
                    this.settings.RPM.greenStart = 2100;
                    this.settings.RPM.greenEnd = 2600;
                    this.settings.RPM.redStart = 2700;
                    this.settings.RPM.redEnd = 3000;
                    this.settings.RPM.max = 3000;
                    this.settings.FuelFlow.min = 0;
                    this.settings.FuelFlow.greenStart = 0;
                    this.settings.FuelFlow.greenEnd = 12;
                    this.settings.FuelFlow.max = 20;
                    this.settings.OilPressure.min = 0;
                    this.settings.OilPressure.lowLimit = 20;
                    this.settings.OilPressure.lowRedStart = 0;
                    this.settings.OilPressure.lowRedEnd = 20;
                    this.settings.OilPressure.greenStart = 50;
                    this.settings.OilPressure.greenEnd = 90;
                    this.settings.OilPressure.redStart = 115;
                    this.settings.OilPressure.redEnd = 120;
                    this.settings.OilPressure.highLimit = 115;
                    this.settings.OilPressure.max = 120;
                    this.settings.OilTemperature.min = 100;
                    this.settings.OilTemperature.lowLimit = 100;
                    this.settings.OilTemperature.greenStart = 100;
                    this.settings.OilTemperature.greenEnd = 245;
                    this.settings.OilTemperature.highLimit = 245;
                    this.settings.OilTemperature.max = 250;
                    this.settings.EGTTemperature.min = 1250;
                    this.settings.EGTTemperature.max = 1650;
                    break;
                }
            case EngineType.ENGINE_TYPE_TURBOPROP:
            case EngineType.ENGINE_TYPE_JET:
                {
                    this.settings.BatteryBusAmps.min = -50;
                    this.settings.BatteryBusAmps.greenStart = -50;
                    this.settings.BatteryBusAmps.greenEnd = 50;
                    this.settings.BatteryBusAmps.yellowStart = 50;
                    this.settings.BatteryBusAmps.yellowEnd = 100;
                    this.settings.BatteryBusAmps.max = 100;
                    this.settings.GenAltBusAmps.min = 0;
                    this.settings.GenAltBusAmps.greenStart = 0;
                    this.settings.GenAltBusAmps.greenEnd = 300;
                    this.settings.GenAltBusAmps.max = 300;
                    this.settings.MainBusVoltage.min = -50;
                    this.settings.MainBusVoltage.lowLimit = 20;
                    this.settings.MainBusVoltage.lowYellowStart = 20;
                    this.settings.MainBusVoltage.lowYellowEnd = 28;
                    this.settings.MainBusVoltage.greenStart = 28;
                    this.settings.MainBusVoltage.greenEnd = 30;
                    this.settings.MainBusVoltage.highLimit = 28;
                    this.settings.MainBusVoltage.max = 50;
                    this.settings.HotBatteryBusVoltage.min = -50;
                    this.settings.HotBatteryBusVoltage.lowLimit = 20;
                    this.settings.HotBatteryBusVoltage.greenStart = 28;
                    this.settings.HotBatteryBusVoltage.greenEnd = 30;
                    this.settings.HotBatteryBusVoltage.yellowStart = 20;
                    this.settings.HotBatteryBusVoltage.yellowEnd = 28;
                    this.settings.HotBatteryBusVoltage.highLimit = 28;
                    this.settings.HotBatteryBusVoltage.max = 50;
                    this.settings.FuelQuantity.min = 0;
                    this.settings.FuelQuantity.greenStart = 9;
                    this.settings.FuelQuantity.greenEnd = 150;
                    this.settings.FuelQuantity.yellowStart = 1;
                    this.settings.FuelQuantity.yellowEnd = 9;
                    this.settings.FuelQuantity.redStart = 0;
                    this.settings.FuelQuantity.redEnd = 1;
                    this.settings.FuelQuantity.max = 150;
                    this.settings.Torque.min = 0;
                    this.settings.Torque.greenStart = 0;
                    this.settings.Torque.greenEnd = 100;
                    this.settings.Torque.yellowStart = 100;
                    this.settings.Torque.yellowEnd = 101;
                    this.settings.Torque.redStart = 101;
                    this.settings.Torque.redEnd = 102;
                    this.settings.Torque.max = 110;
                    this.settings.RPM.min = 0;
                    this.settings.RPM.greenStart = 1950;
                    this.settings.RPM.greenEnd = 2050;
                    this.settings.RPM.yellowStart = 450;
                    this.settings.RPM.yellowEnd = 1000;
                    this.settings.RPM.redStart = 2050;
                    this.settings.RPM.redEnd = 2051;
                    this.settings.RPM.max = 2200;
                    this.settings.TurbineNg.min = 0;
                    this.settings.TurbineNg.greenStart = 51;
                    this.settings.TurbineNg.greenEnd = 104;
                    this.settings.TurbineNg.redStart = 104;
                    this.settings.TurbineNg.redEnd = 105;
                    this.settings.TurbineNg.max = 110;
                    this.settings.ITTEngineOff.min = 0;
                    this.settings.ITTEngineOff.greenStart = 752;
                    this.settings.ITTEngineOff.greenEnd = 1544;
                    this.settings.ITTEngineOff.redStart = 1545;
                    this.settings.ITTEngineOff.redEnd = 1652;
                    this.settings.ITTEngineOff.max = 1995;
                    this.settings.OilPressure.min = 0;
                    this.settings.OilPressure.lowLimit = 60;
                    this.settings.OilPressure.greenStart = 105;
                    this.settings.OilPressure.greenEnd = 135;
                    this.settings.OilPressure.yellowStart = 60;
                    this.settings.OilPressure.yellowEnd = 105;
                    this.settings.OilPressure.redStart = 135;
                    this.settings.OilPressure.redEnd = 136;
                    this.settings.OilPressure.highLimit = 135;
                    this.settings.OilPressure.max = 170;
                    this.settings.OilTemperature.min = -50;
                    this.settings.OilTemperature.lowLimit = -40;
                    this.settings.OilTemperature.greenStart = 32;
                    this.settings.OilTemperature.greenEnd = 219;
                    this.settings.OilTemperature.highLimit = 238;
                    this.settings.OilTemperature.max = 248;
                    break;
                }
        }
    }
    getRPM(_index) {
        return Simplane.getEngineRPM(_index);
    }
    getTorque(_index) {
        return Simplane.getEnginePower(_index);
    }
    getNg(_index) {
        var engineId = _index + 1;
        return SimVar.GetSimVarValue("TURB ENG N1:" + engineId, "percent");
    }
    getItt(_index) {
        switch (_index) {
            case 1: return SimVar.GetSimVarValue("TURB ENG2 ITT", "celsius");
            case 2: return SimVar.GetSimVarValue("TURB ENG3 ITT", "celsius");
            case 3: return SimVar.GetSimVarValue("TURB ENG4 ITT", "celsius");
        }
        return SimVar.GetSimVarValue("TURB ENG1 ITT", "celsius");
    }
    getFuelFlow(_index) {
        var engineId = _index + 1;
        return SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + engineId, "gallons per hour");
    }
    getOilPress(_index) {
        var engineId = _index + 1;
        return SimVar.GetSimVarValue("GENERAL ENG OIL PRESSURE:" + engineId, "psi");
    }
    getOilTempFarenheit(_index) {
        var engineId = _index + 1;
        return SimVar.GetSimVarValue("GENERAL ENG OIL TEMPERATURE:" + engineId, "farenheit");
    }
    getOilTempCelsius(_index) {
        var engineId = _index + 1;
        return SimVar.GetSimVarValue("GENERAL ENG OIL TEMPERATURE:" + engineId, "celsius");
    }
    getEGTFarenheit(_index) {
        var engineId = _index + 1;
        return SimVar.GetSimVarValue("GENERAL ENG EXHAUST GAS TEMPERATURE:" + engineId, "farenheit");
    }
    getEGTCelsius(_index) {
        var engineId = _index + 1;
        return SimVar.GetSimVarValue("GENERAL ENG EXHAUST GAS TEMPERATURE:" + engineId, "farenheit");
    }
    getVAC() {
        return SimVar.GetSimVarValue("SUCTION PRESSURE", "inch of mercury");
    }
    getAmpsBattery() {
        return fastToFixed(SimVar.GetSimVarValue("ELECTRICAL BATTERY BUS AMPS", "amperes"), 0);
    }
    getAmpsGenAlt() {
        return fastToFixed(SimVar.GetSimVarValue("ELECTRICAL GENALT BUS AMPS:1", "amperes"), 0);
    }
    getVoltsBus() {
        return fastToFixed(SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts"), 0);
    }
    getVoltsBattery() {
        return fastToFixed(SimVar.GetSimVarValue("ELECTRICAL HOT BATTERY BUS VOLTAGE", "volts"), 0);
    }
    getFuelL() {
        return SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "gallons");
    }
    getFuelR() {
        return SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "gallons");
    }
    getCabinAlt() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet");
    }
    getCabinAltRate() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "feet per minute");
    }
    getPressureDiff() {
        return SimVar.GetSimVarValue("PRESSURIZATION PRESSURE DIFFERENTIAL", "psi");
    }
    getEngineHours() {
        var totalSeconds = SimVar.GetSimVarValue("GENERAL ENG ELAPSED TIME:1", "seconds");
        var hours = Math.floor(totalSeconds / 3600);
        var remainingSeconds = totalSeconds - (hours * 3600);
        hours += Math.floor((remainingSeconds / 3600) * 10) / 10;
        return hours;
    }
    getFlapsAngle() {
        return SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT ANGLE", "degree");
    }
    getTrimElev() {
        return SimVar.GetSimVarValue("ELEVATOR TRIM PCT", "percent");
    }
    getTrimRudder() {
        return SimVar.GetSimVarValue("RUDDER TRIM PCT", "percent");
    }
    getTrimAil() {
        return SimVar.GetSimVarValue("AILERON TRIM PCT", "percent");
    }
    getOxyPressure() {
        return "----";
    }
}
class AS1000_PFD_NearestAirports extends NavSystemElement {
    constructor() {
        super();
        this.isActive = false;
    }
    init(root) {
        this.rootElement = root;
        this.sliderElement = this.gps.getChildById("Slider");
        this.sliderCursorElement = this.gps.getChildById("SliderCursor");
        this.nearestAirportList = new NearestAirportList(this.gps);
        this.airportsSliderGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.gps.getChildById("NRSTAirports1Top"), this.airportName_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("NRSTAirports1Bottom"), this.airportFrequency_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("NRSTAirports2Top"), this.airportName_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("NRSTAirports2Bottom"), this.airportFrequency_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("NRSTAirports3Top"), this.airportName_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("NRSTAirports3Bottom"), this.airportFrequency_SelectionCallback.bind(this))
        ], this.sliderElement, this.sliderCursorElement, 2);
        this.defaultSelectables = [this.airportsSliderGroup];
        this.infoWindow = new NavSystemElementContainer("AirportInfos", "AirportInfos", new AS1000_PFD_AirportInfos());
        this.infoWindow.setGPS(this.gps);
        this.infoWP = new WayPoint(this.gps);
    }
    onEnter() {
        this.isActive = true;
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    onUpdate(_deltaTime) {
        if (this.isActive) {
            this.rootElement.setAttribute("state", "Active");
            this.nearestAirportList.Update(25, 200);
            var airportListStrings = [];
            for (var i = 0; i < this.nearestAirportList.airports.length; i++) {
                let airport = this.nearestAirportList.airports[i];
                var firstLine = "";
                var secondLine = "";
                let logo = airport.imageFileName();
                firstLine += '<td><span class="Blinking">' + airport.ident + '</span><img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeS" /></td>';
                firstLine += '<td>' + fastToFixed(airport.bearing, 0) + '° </td>';
                firstLine += '<td>' + fastToFixed(airport.distance, 1) + 'NM </td>';
                firstLine += '<td class="end">' + airport.bestApproach + ' </td>';
                secondLine += '<td class="white">' + airport.frequencyName + ' </td>';
                secondLine += '<td class="Blinking">' + fastToFixed(airport.frequencyMHz, 3) + ' </td>';
                secondLine += '<td class="white">RNWY</td>';
                secondLine += '<td class="end">' + fastToFixed(airport.longestRunwayLength, 0) + 'ft </td>';
                airportListStrings.push(firstLine);
                airportListStrings.push(secondLine);
            }
            this.airportsSliderGroup.setStringElements(airportListStrings);
        }
        else {
            this.rootElement.setAttribute("state", "Inactive");
        }
    }
    onExit() {
        this.isActive = false;
        if (this.gps.currentInteractionState == 1 && this.airportsSliderGroup.getIndex() >= 0 && this.nearestAirportList.airports[Math.floor(this.airportsSliderGroup.getIndex() / 2)]) {
            this.gps.lastRelevantICAO = this.nearestAirportList.airports[Math.floor(this.airportsSliderGroup.getIndex() / 2)].icao;
            this.gps.lastRelevantICAOType = "A";
        }
        this.rootElement.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    airportName_SelectionCallback(_event, _index) {
        switch (_event) {
            case "ENT_Push":
                this.infoWP.type = 'A';
                this.infoWP.SetICAO(this.nearestAirportList.airports[Math.floor(_index / 2)].icao);
                this.infoWindow.element.setWaypoint(this.infoWP, this.endInfoWindowCB.bind(this));
                this.gps.switchToPopUpPage(this.infoWindow);
                return true;
        }
    }
    endInfoWindowCB() {
        this.gps.switchToPopUpPage(this.container);
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    airportFrequency_SelectionCallback(_event, _index) {
        var comFreq = this.gps.getElementOfType(AS1000.ComFrequencies);
        var navFreq = this.gps.getElementOfType(AS1000.NavFrequencies);
        switch (_event) {
            case "ENT_Push":
                if (this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyMHz >= 118) {
                    SimVar.SetSimVarValue("K:COM" + (comFreq.getActiveIndex() == 1 ? "" : "2") + "_STBY_RADIO_SET", "Frequency BCD16", this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyBCD16);
                }
                else if (this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyMHz != 0) {
                    SimVar.SetSimVarValue("K:NAV" + navFreq.getActiveIndex() + "_STBY_SET", "Frequency BCD16", this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyBCD16);
                }
                break;
        }
    }
}
class AS1000_PFD_AirportInfos extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isActive = false;
        this.endCallback = null;
        this.wayPoint = null;
    }
    init(root) {
        this.rootElement = root;
        this.ident = this.gps.getChildById("ident");
        this.symbol = this.gps.getChildById("symbol");
        this.city = this.gps.getChildById("city");
        this.facilityName = this.gps.getChildById("facilityName");
        this.type = this.gps.getChildById("type");
        this.timeZone = this.gps.getChildById("timeZone");
        this.runwwayLength = this.gps.getChildById("runwayLength");
        this.region = this.gps.getChildById("region");
        this.latitude = this.gps.getChildById("latitude");
        this.longitude = this.gps.getChildById("longitude");
        this.backButton = this.gps.getChildById("backButton");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.backButton, this.backButtonInteraction.bind(this))
        ];
    }
    onEnter() {
        this.isActive = true;
        this.rootElement.setAttribute("state", "Active");
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    onUpdate(_deltaTime) {
        if (this.isActive) {
            var infos = this.wayPoint.GetInfos();
            if (infos instanceof AirportInfo) {
                this.ident.textContent = infos.ident;
                var symbol = infos.GetSymbolFileName();
                if (symbol) {
                    this.symbol.innerHTML = '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/' + infos.GetSymbolFileName() + '"/>';
                }
                else {
                    this.symbol.innerHTML = "";
                }
                this.city.textContent = infos.city;
                this.facilityName.textContent = infos.name;
                switch (infos.privateType) {
                    case 0:
                        this.type.textContent = "UNKNOWN";
                        break;
                    case 1:
                        this.type.textContent = "PUBLIC";
                        break;
                    case 2:
                        this.type.textContent = "MILITARY";
                        break;
                    case 3:
                        this.type.textContent = "PRIVATE";
                        break;
                }
                this.timeZone.textContent = "";
                var maxLength = 0;
                for (let i = 0; i < infos.runways.length; i++) {
                    if (infos.runways[i].length > maxLength) {
                        maxLength = infos.runways[i].length;
                    }
                }
                this.runwwayLength.textContent = fastToFixed(maxLength, 0) + "FT";
                this.region.textContent = infos.region;
                this.latitude.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
                this.longitude.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            }
            else {
                this.ident.textContent = "";
                this.symbol.innerHTML = "";
                this.city.textContent = "";
                this.facilityName.textContent = "";
                this.type.textContent = "";
                this.timeZone.textContent = "";
                this.runwwayLength.textContent = "";
                this.region.textContent = "";
                this.latitude.textContent = "";
                this.longitude.textContent = "";
            }
        }
    }
    onExit() {
        this.isActive = false;
        this.rootElement.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    backButtonInteraction(_event) {
        if (_event == "ENT_Push") {
            this.onExit();
            if (this.endCallback) {
                this.endCallback();
            }
        }
    }
    setWaypoint(_wayPoint, _callBack = null) {
        this.wayPoint = _wayPoint;
        this.endCallback = _callBack;
    }
}
class AS1000_PFD_AirspeedReference {
    constructor(_valueElem, _statusElem, _refSpeed, _displayName) {
        this.isDisplayed = false;
        this.valueElement = _valueElem;
        this.statusElement = _statusElem;
        this.refSpeed = _refSpeed;
        this.displayedSpeed = _refSpeed;
        this.displayName = _displayName;
    }
}
class AS1000_PFD_TMRREF extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.references = [];
        this.haveRadarAltitude = false;
    }
    init(root) {
        this.window = this.gps.getChildById("TmrRefWindow");
        this.time = this.gps.getChildById("tmrTime");
        this.direction = this.gps.getChildById("tmrDirection");
        this.startStop = this.gps.getChildById("tmrStart");
        this.airspeedIndicator = this.gps.getChildById("Airspeed");
        this.minimumsSourceElement = this.gps.getChildById("minimumType");
        this.minimumsValueElement = this.gps.getChildById("minimumValue");
        let designSpeeds = Simplane.getDesignSpeeds();
        this.references.push(new AS1000_PFD_AirspeedReference(this.gps.getChildById("glideValue"), this.gps.getChildById("glideActivate"), designSpeeds.BestGlide, "G"));
        this.references.push(new AS1000_PFD_AirspeedReference(this.gps.getChildById("VrValue"), this.gps.getChildById("VrActivate"), designSpeeds.Vr, "R"));
        this.references.push(new AS1000_PFD_AirspeedReference(this.gps.getChildById("VxValue"), this.gps.getChildById("VxActivate"), designSpeeds.Vx, "X"));
        this.references.push(new AS1000_PFD_AirspeedReference(this.gps.getChildById("VyValue"), this.gps.getChildById("VyActivate"), designSpeeds.Vy, "Y"));
        this.searchField = new SearchFieldTime([this.time], this.gps);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.time, this.timeCallback.bind(this)),
            new SelectableElement(this.gps, this.direction, this.directionCallback.bind(this)),
            new SelectableElement(this.gps, this.startStop, this.startStopCallback.bind(this)),
        ];
        for (let i = 0; i < this.references.length; i++) {
            this.defaultSelectables.push(new SelectableElement(this.gps, this.references[i].valueElement, this.refSpeedCallback.bind(this, i)));
            this.defaultSelectables.push(new SelectableElement(this.gps, this.references[i].statusElement, this.refStatusCallback.bind(this, i)));
        }
        this.defaultSelectables.push(new SelectableElement(this.gps, this.minimumsSourceElement, this.minimumsSourceCallback.bind(this)));
        this.defaultSelectables.push(new SelectableElement(this.gps, this.minimumsValueElement, this.minimumsValuesCallback.bind(this)));
        let raElem = this.gps.instrumentXmlConfig.getElementsByTagName("RadarAltitude");
        if (raElem.length > 0) {
            this.haveRadarAltitude = raElem[0].textContent == "True";
        }
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        if (this.searchField.isActive) {
            this.searchField.Update();
        }
        else {
            Avionics.Utils.diffAndSet(this.time, this.backgroundTimer.formatTimeFromMS(this.backgroundTimer.getCurrentDisplay()));
        }
        Avionics.Utils.diffAndSet(this.direction, this.backgroundTimer.getIsCountingDown() ? "DN" : "UP");
        Avionics.Utils.diffAndSet(this.startStop, this.backgroundTimer.getIsCounting() ? "STOP?" : (this.backgroundTimer.getWillReset() ? "RESET?" : "START?"));
        let displayedBugs = "";
        for (let i = 0; i < this.references.length; i++) {
            Avionics.Utils.diffAndSet(this.references[i].valueElement, Math.round(this.references[i].displayedSpeed) + (this.references[i].displayedSpeed == this.references[i].refSpeed ? "kt" : "kt*"));
            Avionics.Utils.diffAndSet(this.references[i].statusElement, this.references[i].isDisplayed ? "ON" : "OFF");
            if (this.references[i].isDisplayed) {
                if (displayedBugs != "") {
                    displayedBugs += ";";
                }
                displayedBugs += this.references[i].displayName + ":" + this.references[i].displayedSpeed;
            }
        }
        Avionics.Utils.diffAndSetAttribute(this.airspeedIndicator, "reference-bugs", displayedBugs);
        let source = SimVar.GetSimVarValue("L:AS3000_MinimalsMode", "number");
        switch (source) {
            case 0:
                Avionics.Utils.diffAndSet(this.minimumsSourceElement, "OFF");
                break;
            case 1:
                Avionics.Utils.diffAndSet(this.minimumsSourceElement, "BARO");
                break;
            case 2:
                Avionics.Utils.diffAndSet(this.minimumsSourceElement, "TEMP&nbsp;COMP");
                break;
            case 3:
                Avionics.Utils.diffAndSet(this.minimumsSourceElement, "RADIO&nbsp;ALT");
                break;
        }
        Avionics.Utils.diffAndSet(this.minimumsValueElement, SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number") + "FT");
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    timeCallback(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.searchField;
            this.searchField.StartSearch(this.backgroundTimer.setStartTime.bind(this.backgroundTimer));
            this.gps.SwitchToInteractionState(3);
        }
    }
    directionCallback(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.backgroundTimer.setCountingDown(!this.backgroundTimer.getIsCountingDown());
        }
    }
    startStopCallback(_event) {
        if (_event == "ENT_Push") {
            this.backgroundTimer.switchCounting();
        }
    }
    refSpeedCallback(_index, _event) {
        switch (_event) {
            case "NavigationSmallInc":
                this.references[_index].displayedSpeed++;
                break;
            case "NavigationSmallDec":
                this.references[_index].displayedSpeed = Math.max(this.references[_index].displayedSpeed - 1, 20);
                break;
        }
    }
    refStatusCallback(_index, _event) {
        switch (_event) {
            case "NavigationSmallInc":
                this.references[_index].isDisplayed = true;
                break;
            case "NavigationSmallDec":
                this.references[_index].isDisplayed = false;
                break;
        }
    }
    minimumsSourceCallback(_event) {
        let currValue = SimVar.GetSimVarValue("L:AS3000_MinimalsMode", "number");
        switch (_event) {
            case "NavigationSmallInc":
                currValue = Math.min(currValue + 1, 3);
                if (currValue == 2) {
                    currValue = 3;
                }
                if (currValue == 3 && !this.haveRadarAltitude) {
                    currValue = 1;
                }
                SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", currValue);
                break;
            case "NavigationSmallDec":
                currValue = Math.max(currValue - 1, 0);
                if (currValue == 3 && !this.haveRadarAltitude) {
                    currValue = 2;
                }
                if (currValue == 2) {
                    currValue = 1;
                }
                SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", currValue);
                break;
        }
    }
    minimumsValuesCallback(_event) {
        switch (_event) {
            case "NavigationSmallInc":
                SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", Math.min(SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number") + 10, 16000));
                break;
            case "NavigationSmallDec":
                SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", Math.max(SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number") - 10, 0));
                break;
        }
    }
}
class AS1000_PFD_BackgroundTimer extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isCountingDown = false;
        this.isCounting = false;
        this.baseTime = 0;
        this.beginTime = 0;
        this.initialValue = 0;
        this.willReset = false;
    }
    init(root) {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        let currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
        if (this.isCountingDown && this.isCounting && this.baseTime + this.beginTime - currTime <= 0) {
            this.setCountingDown(false);
            this.baseTime = 0;
            this.beginTime = currTime;
        }
        if (!this.isCountingDown && this.isCounting && this.baseTime - this.beginTime + currTime >= 86400000) {
            this.baseTime = 0;
            this.beginTime = currTime;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    setCountingDown(_state) {
        let currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
        if (this.isCounting) {
            this.baseTime = this.isCountingDown ? this.baseTime + this.beginTime - currTime : this.baseTime - this.beginTime + currTime;
            this.beginTime = currTime;
        }
        this.isCountingDown = _state;
        this.willReset = false;
    }
    switchCounting() {
        if (this.willReset) {
            this.reinitialize();
        }
        else {
            let currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
            this.isCounting = !this.isCounting;
            if (this.isCounting) {
                this.beginTime = currTime;
                this.willReset = false;
            }
            else {
                this.baseTime = this.isCountingDown ? this.baseTime + this.beginTime - currTime : this.baseTime - this.beginTime + currTime;
                this.willReset = true;
            }
        }
    }
    formatTimeFromMS(_time) {
        let seconds = fastToFixed(Math.floor(_time / 1000) % 60, 0);
        let minutes = fastToFixed(Math.floor(_time / 60000) % 60, 0);
        let hours = fastToFixed(Math.floor(_time / 3600000) % 24, 0);
        return "00".slice(0, 2 - hours.length) + hours + ":" + "00".slice(0, 2 - minutes.length) + minutes + ":" + "00".slice(0, 2 - seconds.length) + seconds;
    }
    reinitialize() {
        this.willReset = false;
        if (this.isCounting) {
            this.switchCounting();
        }
        this.baseTime = (this.isCountingDown ? this.initialValue : 0);
    }
    setStartTime(_value) {
        let currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
        this.baseTime = _value;
        this.beginTime = currTime;
        this.initialValue = _value;
        this.willReset = false;
    }
    getCurrentDisplay() {
        let currTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") * 1000;
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
    getIsCounting() {
        return this.isCounting;
    }
    getIsCountingDown() {
        return this.isCountingDown;
    }
    getWillReset() {
        return this.willReset;
    }
}
//# sourceMappingURL=BaseAS1000.js.map