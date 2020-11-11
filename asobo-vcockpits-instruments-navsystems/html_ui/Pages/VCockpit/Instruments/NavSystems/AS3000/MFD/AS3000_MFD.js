class AS3000_MFD extends NavSystem {
    constructor() {
        super();
        this.initDuration = 5500;
        this.needValidationAfterInit = true;
    }
    get IsGlassCockpit() {
        return true;
    }
    get templateID() {
        return "AS3000_MFD";
    }
    connectedCallback() {
        super.connectedCallback();
        this.pagesContainer = this.getChildById("RightInfos");
        this.addIndependentElementContainer(new AS3000_Engine("Engine", "LeftInfos"));
        this.addIndependentElementContainer(new NavSystemElementContainer("Com Frequencies", "ComFreq", new AS3000_MFD_ComFrequencies()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Navigation status", "TopRight", new AS3000_MFD_NavInfos()));
        this.pageGroups = [
            new NavSystemPageGroup("MAP", this, [
                new AS3000_MFD_MainMap()
            ]),
        ];
    }
    disconnectedCallback() {
    }
    onEvent(_event) {
        super.onEvent(_event);
        if (_event == "SOFTKEYS_12") {
            this.acknowledgeInit();
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
    }
}
class AS3000_MFD_MapElement extends MapInstrumentElement {
    constructor() {
        super(...arguments);
        this.wasOverride = false;
        this.lastMapMode = 0;
        this.lastWeatherMapMode = 0;
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        const isPositionOverride = SimVar.GetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number") != 0;
        if (isPositionOverride) {
            if (!this.wasOverride) {
                this.instrument.setAttribute("bing-mode", "vfr");
                this.wasOverride = true;
            }
            this.instrument.setCenter(new LatLong(SimVar.GetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number"), SimVar.GetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number")));
        } else {
            if (this.wasOverride) {
                this.instrument.setCenteredOnPlane();
                this.wasOverride = false;
            }
        }
        const mapMode = SimVar.GetSimVarValue("L:AS3000_MFD_Current_Map", "number");
        const weatherMapMode = SimVar.GetSimVarValue("L:AS3000_MFD_Current_WeatherMap", "number");
        if (this.lastMapMode != mapMode || (mapMode == 2 && this.lastWeatherMapMode != weatherMapMode)) {
            switch (mapMode) {
                case 0:
                    this.setWeather(EWeatherRadar.OFF);
                    break;
                case 2:
                    switch (weatherMapMode) {
                        case 0:
                            this.setWeather(EWeatherRadar.TOPVIEW);
                            break;
                        case 1:
                            this.setWeather(EWeatherRadar.OFF);
                            this.setWeather(EWeatherRadar.HORIZONTAL);
                            break;
                        case 2:
                            this.setWeather(EWeatherRadar.OFF);
                            this.setWeather(EWeatherRadar.VERTICAL);
                            break;
                    }
                    break;
            }
            this.lastMapMode = mapMode;
            this.lastWeatherMapMode = weatherMapMode;
        }
    }
}
class AS3000_MFD_MainMap extends NavSystemPage {
    constructor() {
        super("NAVIGATION MAP", "Map", new NavSystemElementGroup([
            new AS3000_MFD_MapElement(),
            new MFD_WindData()
        ]));
    }
    init() {
    }
}
class AS3000_MFD_NavInfos extends NavSystemElement {
    constructor() {
        super(...arguments);
        this._t = 0;
    }
    init(root) {
        this.GS = this.gps.getChildById("GS");
        this.DTK = this.gps.getChildById("DTK");
        this.TRK = this.gps.getChildById("TRK");
        this.ETE = this.gps.getChildById("ETE");
        this.BRG = this.gps.getChildById("BRG");
        this.DIS = this.gps.getChildById("DIS");
        this.MSA = this.gps.getChildById("MSA");
        this.ETA = this.gps.getChildById("ETA");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this._t++;
        if (this._t > 30) {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this._t = 0;
        }
        Avionics.Utils.diffAndSet(this.GS, fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0) + "KT");
        Avionics.Utils.diffAndSet(this.DTK, fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"), 0) + "°");
        Avionics.Utils.diffAndSet(this.TRK, fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree"), 0) + "°");
        const ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
        if (ete == 0) {
            Avionics.Utils.diffAndSet(this.ETE, "__:__");
        } else if (ete < 3600) {
            const sec = ete % 60;
            Avionics.Utils.diffAndSet(this.ETE, Math.floor(ete / 60).toFixed(0) + (sec < 10 ? ":0" : ":") + sec.toFixed(0));
        } else {
            const min = ((ete % 3600) / 60);
            Avionics.Utils.diffAndSet(this.ETE, Math.floor(ete / 3600).toFixed(0) + (min < 10 ? "+0" : "+") + min.toFixed(0));
        }
        Avionics.Utils.diffAndSet(this.BRG, fastToFixed(this.gps.currFlightPlanManager.getBearingToActiveWaypoint(), 0) + "°");
        Avionics.Utils.diffAndSet(this.DIS, fastToFixed(this.gps.currFlightPlanManager.getDistanceToActiveWaypoint(), 0) + "NM");
        Avionics.Utils.diffAndSet(this.MSA, "____FT");
        if (ete == 0) {
            Avionics.Utils.diffAndSet(this.ETA, "__:__");
        } else {
            const eteArrival = SimVar.GetSimVarValue("GPS ETE", "seconds");
            const ETA = (SimVar.GetSimVarValue("E:ZULU TIME", "seconds") + eteArrival) % (24 * 3600);
            const hours = Math.floor(ETA / 3600);
            const minutes = Math.floor((ETA / 60) % 60);
            Avionics.Utils.diffAndSet(this.ETA, (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + "UTC");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class AS3000_Engine extends NavSystemElementContainer {
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
            const engineRoot = this.gps.xmlConfig.getElementsByTagName("EngineDisplay");
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
            const ed = this.root.querySelector("as3000-engine-display");
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
                this.addGauge().Set(this.gps.getChildById("Piston_FuelGaugeL"), this.settings.FuelQuantity, this.getFuelL.bind(this), "L FUEL QTY", "GAL");
                this.addGauge().Set(this.gps.getChildById("Piston_FuelGaugeR"), this.settings.FuelQuantity, this.getFuelR.bind(this), "R FUEL QTY", "GAL");
                this.addText().Set(this.gps.getChildById("Piston_EngineHours"), this.getEngineHours.bind(this));
                this.addText().Set(this.gps.getChildById("Piston_Bus_M"), this.getVoltsBus.bind(this));
                this.addText().Set(this.gps.getChildById("Piston_Bus_E"), this.getVoltsBattery.bind(this));
                this.addText().Set(this.gps.getChildById("Piston_Batt_M"), this.getAmpsBattery.bind(this));
                this.addText().Set(this.gps.getChildById("Piston_Batt_S"), this.getAmpsGenAlt.bind(this));
                var engineRoot = this.root.querySelector("#PistonEnginesPanel");
                if (engineRoot) {
                    for (var i = 0; i < this.engineCount; i++) {
                        const engine = new AS3000_PistonEngine();
                        TemplateElement.call(engine, this.onEngineReady.bind(this, engine, i));
                        engineRoot.appendChild(engine);
                    }
                } else {
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
                const trimElevParam = new ColorRangeDisplay();
                trimElevParam.min = -100;
                trimElevParam.max = 100;
                trimElevParam.greenStart = (Simplane.getTrimNeutral() * 100) - 15;
                trimElevParam.greenEnd = (Simplane.getTrimNeutral() * 100) + 15;
                this.addGauge().Set(this.gps.getChildById("Turbo_ElevTrim"), trimElevParam, this.getTrimElev.bind(this), "", "");
                const trimRudderParam = new ColorRangeDisplay4();
                trimRudderParam.min = -100;
                trimRudderParam.max = 100;
                trimRudderParam.greenStart = 20;
                trimRudderParam.greenEnd = 60;
                trimRudderParam.whiteStart = -25.5;
                trimRudderParam.whiteEnd = -6;
                this.addGauge().Set(this.gps.getChildById("Turbo_RudderTrim"), trimRudderParam, this.getTrimRudder.bind(this), "", "");
                const trimAilParam = new ColorRangeDisplay4();
                trimAilParam.min = -100;
                trimAilParam.max = 100;
                trimAilParam.whiteStart = -10;
                trimAilParam.whiteEnd = 10;
                this.addGauge().Set(this.gps.getChildById("Turbo_AilTrim"), trimAilParam, this.getTrimAil.bind(this), "", "");
                const flapsParam = new FlapsRangeDisplay();
                flapsParam.min = 0;
                flapsParam.max = 34;
                flapsParam.takeOffValue = 10;
                this.addGauge().Set(this.gps.getChildById("Turbo_Flaps"), flapsParam, this.getFlapsAngle.bind(this), "", "");
                var engineRoot = this.root.querySelector("#TurboEngine");
                if (engineRoot) {
                    for (var i = this.engineCount - 1; i >= 0; i--) {
                        const engine = new AS3000_TurboEngine();
                        TemplateElement.call(engine, this.onEngineReady.bind(this, engine, i));
                        engineRoot.insertBefore(engine, engineRoot.firstChild);
                    }
                } else {
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
                this.addGauge().Set(_engine.querySelector(".Piston_OilPressGauge"), this.settings.FuelFlow, this.getOilPress.bind(this, _index), "OIL PRESS", "");
                this.addGauge().Set(_engine.querySelector(".Piston_OilTempGauge"), this.settings.OilTemperature, this.getOilTemp.bind(this, _index), "OIL TEMP", "");
                this.addGauge().Set(_engine.querySelector(".Piston_EgtGauge"), this.settings.EGTTemperature, this.getEGT.bind(this, _index), "EGT", "");
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
                this.addGauge().Set(_engine.querySelector(".Turbo_OilTempGauge"), this.settings.OilTemperature, this.getOilTemp.bind(this, _index), "OIL TEMP", "");
                const CAS = new Engine_Annunciations();
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
    onSoundEnd(_eventId) {
        if (this.xmlEngineDisplay) {
            this.xmlEngineDisplay.onSoundEnd(_eventId);
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        if (this.xmlEngineDisplay) {
            this.xmlEngineDisplay.onEvent(_event);
        }
    }
    updateWidth() {
        if (!this.root || !this.allEnginesReady || this.widthSet) {
            return;
        }
        const vpRect = this.gps.getBoundingClientRect();
        const vpWidth = vpRect.width;
        const vpHeight = vpRect.height;
        if (vpWidth <= 0 || vpHeight <= 0) {
            return;
        }
        const width = this.root.offsetWidth;
        if (width <= 0) {
            return;
        }
        const newWidth = width * this.engineCount;
        if (width != newWidth) {
            this.root.style.width = width * this.engineCount + "px";
            for (let i = 0; i < this.allElements.length; i++) {
                this.allElements[i].redraw();
            }
        }
        this.widthSet = true;
    }
    addGauge() {
        const newElem = new GaugeElement();
        this.allElements.push(newElem);
        return newElem;
    }
    addText() {
        const newElem = new TextElement();
        this.allElements.push(newElem);
        return newElem;
    }
    initSettings() {
        this.settings = SimVar.GetGameVarValue("", "GlassCockpitSettings");
        if (this.settings) {
            return;
        }
        console.log("Cockpit.cfg not found. Defaulting to standard values...");
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
        const engineId = _index + 1;
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
        const engineId = _index + 1;
        return SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + engineId, "gallons per hour");
    }
    getOilPress(_index) {
        const engineId = _index + 1;
        return SimVar.GetSimVarValue("GENERAL ENG OIL PRESSURE:" + engineId, "psi");
    }
    getOilTemp(_index) {
        const engineId = _index + 1;
        return SimVar.GetSimVarValue("GENERAL ENG OIL TEMPERATURE:" + engineId, "celsius");
    }
    getEGT(_index) {
        const engineId = _index + 1;
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
        const totalSeconds = SimVar.GetSimVarValue("GENERAL ENG ELAPSED TIME:1", "seconds");
        let hours = Math.floor(totalSeconds / 3600);
        const remainingSeconds = totalSeconds - (hours * 3600);
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
class AS3000_MFD_ComFrequencies extends NavSystemElement {
    init(root) {
        this.com1Active = this.gps.getChildById("Com1_Active");
        this.com1Stby = this.gps.getChildById("Com1_Stby");
        this.com2Active = this.gps.getChildById("Com2_Active");
        this.com2Stby = this.gps.getChildById("Com2_Stby");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const com1Active = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:1", "MHz");
        if (com1Active) {
            Avionics.Utils.diffAndSet(this.com1Active, com1Active.toFixed(SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
        }
        const com1Sby = SimVar.GetSimVarValue("COM STANDBY FREQUENCY:1", "MHz");
        if (com1Sby) {
            Avionics.Utils.diffAndSet(this.com1Stby, com1Sby.toFixed(SimVar.GetSimVarValue("COM SPACING MODE:1", "Enum") == 0 ? 2 : 3));
        }
        const com2Active = SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:2", "MHz");
        if (com2Active) {
            Avionics.Utils.diffAndSet(this.com2Active, com2Active.toFixed(SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3));
        }
        const com2Sby = SimVar.GetSimVarValue("COM STANDBY FREQUENCY:2", "MHz");
        if (com2Sby) {
            Avionics.Utils.diffAndSet(this.com2Stby, com2Sby.toFixed(SimVar.GetSimVarValue("COM SPACING MODE:2", "Enum") == 0 ? 2 : 3));
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
registerInstrument("as3000-mfd-element", AS3000_MFD);
//# sourceMappingURL=AS3000_MFD.js.map