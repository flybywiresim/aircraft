var A320_Neo_LowerECAM_Engine;
(function (A320_Neo_LowerECAM_Engine) {
    class Definitions {
    }
    Definitions.MIN_GAUGE_OIL = 0;
    Definitions.MAX_GAUGE_OIL = 25;
    Definitions.MIN_GAUGE_PSI = 0;
    Definitions.MAX_GAUGE_PSI = 130; //updated from 100 to 130
    Definitions.MIN_GAUGE_PSI_RED = 0;
    Definitions.MAX_GAUGE_PSI_RED = 17;
    Definitions.MAX_GAUGE_PSI_WARNING = 25;
    Definitions.MIN_OIL_TEMP_WARNING = 165;
    Definitions.IGN_STATE = {
        NONE: 0,
        A: 1,
        B: 2,
        AB: 3
    };
    A320_Neo_LowerECAM_Engine.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }

        get templateID() {
            return "LowerECAMEngineTemplate";
        }

        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }

        init() {
            this.unitConversion = parseFloat(NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1"));
            this.engineLeft = new EngineInfo(1, this.querySelector("#LeftGauges"), this.querySelector("#FuelUsedValueLeft"), this.unitConversion, this.querySelector("#OilTemperatureValueLeft"), this.querySelector("#EngineBleedPressureValueLeft"), this.querySelector("#StartValveLeft_OPEN"), this.querySelector("#StartValveLeft_CLOSED"), this.querySelector("#N1VibrationLevelValueLeft"), this.querySelector("#N2VibrationLevelValueLeft"));
            this.engineRight = new EngineInfo(2, this.querySelector("#RightGauges"), this.querySelector("#FuelUsedValueRight"), this.unitConversion, this.querySelector("#OilTemperatureValueRight"), this.querySelector("#EngineBleedPressureValueRight"), this.querySelector("#StartValveRight_OPEN"), this.querySelector("#StartValveRight_CLOSED"), this.querySelector("#N1VibrationLevelValueRight"), this.querySelector("#N2VibrationLevelValueRight"));
            this.querySelector("#FuelUsedUnit").textContent = this.unitConversion === 1 ? "KG" : "LBS";
            this.ignTitleText = this.querySelector("#IGNTitle");
            this.ignLeftValueText = this.querySelector("#IGNValueLeft");
            this.ignRightValueText = this.querySelector("#IGNValueRight");
            this.igniterLeft = new EngineIgniter(this.ignLeftValueText);
            this.igniterRight = new EngineIgniter(this.ignRightValueText);
            this.updateThrottler = new UpdateThrottler(200);
            this.isInitialised = true;
        }

        update(deltaTime) {
            if (!this.isInitialised || !A320_Neo_EICAS.isOnBottomScreen()) {
                return;
            }
            deltaTime = this.updateThrottler.canUpdate(deltaTime);
            if (deltaTime === -1) {
                return;
            }
            const unitConversion = parseFloat(NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1"));
            if (this.unitConversion !== unitConversion) {
                this.unitConversion = unitConversion;
                this.querySelector("#FuelUsedUnit").textContent = this.unitConversion === 1 ? "KG" : "LBS";
            }
            if (this.engineLeft != null) {
                this.engineLeft.update(deltaTime, this.unitConversion);
            }
            if (this.engineRight != null) {
                this.engineRight.update(deltaTime, this.unitConversion);
            }
            this.updateIGN();
        }

        updateIGN() {
            let engineStarting = (SimVar.GetSimVarValue("GENERAL ENG STARTER:1", "bool") === 1) ? true : false;
            let n2Igniting = (SimVar.GetSimVarValue("TURB ENG IS IGNITING:1", "bool") === 1) ? true : false;
            let n2Percent = SimVar.GetSimVarValue("ENG N2 RPM:1", "percent");
            this.igniterLeft.updateStatus(engineStarting, n2Igniting, n2Percent);
            if (n2Percent > 50) {
                // Close left valve
                this.engineLeft.setEngineBleedValveState(false, false);
            }

            engineStarting = (SimVar.GetSimVarValue("GENERAL ENG STARTER:2", "bool") === 1) ? true : false;
            n2Igniting = (SimVar.GetSimVarValue("TURB ENG IS IGNITING:2", "bool") === 1) ? true : false;
            n2Percent = SimVar.GetSimVarValue("ENG N2 RPM:2", "percent");
            this.igniterRight.updateStatus(engineStarting, n2Igniting, n2Percent);
            if (n2Percent > 50) {
                // Close right valve
                this.engineRight.setEngineBleedValveState(false, false);
            }

            if (this.igniterLeft.isIgniting() || this.igniterRight.isIgniting()) {
                this.ignTitleText.textContent = "IGN";
            } else {
                this.ignTitleText.textContent = "";
            }
        }

        onEvent(event) {
            super.onEvent(event);
        }
    }
    A320_Neo_LowerECAM_Engine.Page = Page;
    class EngineInfo {
        constructor(_engineIndex, _gaugeDiv, _fuelUsedValueText, _unitConversion, _oilTemperatureValueText, _engineBleedPressureValueText, _startValveOpenLine, _startValveClosedLine, _N1VibrationValueText, _N2VibrationValueText) {
            this.engineIndex = _engineIndex;
            this.fuelUsedValueText = _fuelUsedValueText;
            this.unitConversion = _unitConversion;
            this.oilTemperatureValueText = _oilTemperatureValueText;
            this.engineBleedPressureValueText = _engineBleedPressureValueText;
            this.engineBleedValveOpenLine = _startValveOpenLine;
            this.engineBleedValveClosedLine = _startValveClosedLine;
            this.N1VibrationValueText = _N1VibrationValueText;
            this.N2VibrationValueText = _N2VibrationValueText;
            this.unitConversion = _unitConversion;
            const gaugeDef = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef.startAngle = -180;
            gaugeDef.arcSize = 180;
            gaugeDef.currentValuePrecision = 0;
            gaugeDef.minValue = Definitions.MIN_GAUGE_OIL;
            gaugeDef.maxValue = Definitions.MAX_GAUGE_OIL;
            gaugeDef.currentValueFunction = this.getOilQuantity.bind(this);
            this.oilQuantityGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.oilQuantityGauge.id = "OIL_Gauge";
            this.oilQuantityGauge.init(gaugeDef);
            this.oilQuantityGauge.addGraduation(0, true, "0");
            this.oilQuantityGauge.addGraduation(12.5, true);
            this.oilQuantityGauge.addGraduation(25, true, "25");
            gaugeDef.minValue = Definitions.MIN_GAUGE_PSI;
            gaugeDef.maxValue = Definitions.MAX_GAUGE_PSI;
            gaugeDef.minRedValue = Definitions.MIN_GAUGE_PSI_RED;
            gaugeDef.maxRedValue = Definitions.MAX_GAUGE_PSI_RED;
            gaugeDef.warningRange[0] = Definitions.MAX_GAUGE_PSI_RED;
            gaugeDef.warningRange[1] = Definitions.MAX_GAUGE_PSI_WARNING;
            gaugeDef.dangerRange[0] = Definitions.MIN_GAUGE_PSI_RED;
            gaugeDef.dangerRange[1] = Definitions.MAX_GAUGE_PSI_RED;
            gaugeDef.currentValueFunction = this.getOilPressure.bind(this);
            this.oilPressureGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.oilPressureGauge.id = "PSI_Gauge";
            this.oilPressureGauge.init(gaugeDef);
            this.oilPressureGauge.addGraduation(65, true);
            this.oilPressureGauge.addGraduation(130, true, "");
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.oilQuantityGauge);
                _gaugeDiv.appendChild(this.oilPressureGauge);
            }
            this.setFuelUsedValue(0, true);
            this.setOilTemperatureValue(0, true);
            this.setEngineBleedPressureValue(0, true);
            this.setEngineBleedValveState(false, true);
            this.setN1VibrationValue(0, true);
            this.setN2VibrationValue(0, true);
        }
        update(deltaTime) {
            this.setFuelUsedValue(SimVar.GetSimVarValue("L:A32NX_FUEL_USED:" + this.engineIndex, "number") * this.unitConversion);
            this.setOilTemperatureValue(SimVar.GetSimVarValue("GENERAL ENG OIL TEMPERATURE:" + this.engineIndex, "celsius"));

            let bleedPressure = 0;
            if (SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool")) {
                bleedPressure = SimVar.GetSimVarValue("L:APU_BLEED_PRESSURE", "psi");
            }
            this.setEngineBleedPressureValue(bleedPressure);

            this.setEngineBleedValveState(SimVar.GetSimVarValue("GENERAL ENG STARTER:" + this.engineIndex, "bool"));
            this.setN1VibrationValue(SimVar.GetSimVarValue("TURB ENG VIBRATION:" + this.engineIndex, "Number"));
            this.setN2VibrationValue(SimVar.GetSimVarValue("TURB ENG VIBRATION:" + this.engineIndex, "Number")); // TODO: should have a different value than N1, currently API limited

            if (this.oilQuantityGauge != null) {
                this.oilQuantityGauge.update(deltaTime);
            }
            if (this.oilPressureGauge != null) {
                this.oilPressureGauge.update(deltaTime);
            }
        }

        getOilQuantity() {
            let value = SimVar.GetSimVarValue("ENG OIL QUANTITY:" + this.engineIndex, "percent") * 0.01;
            value *= Definitions.MAX_GAUGE_OIL;
            return value;
        }

        getOilPressure() {
            const value = SimVar.GetSimVarValue("ENG OIL PRESSURE:" + this.engineIndex, "psi");
            return value;
        }

        setFuelUsedValue(value, force = false) {
            if ((value !== this.fuelUsedValue) || force) {
                this.fuelUsedValue = value;
                if (this.fuelUsedValueText != null) {
                    this.fuelUsedValueText.textContent = fastToFixed(this.fuelUsedValue, 0);
                }
            }
        }

        setOilTemperatureValue(value, force = false) {
            if ((value != this.oilTemperatureValue) || force) {
                this.oilTemperatureValue = value;
                if (this.oilTemperatureValueText != null) {
                    this.oilTemperatureValueText.textContent = fastToFixed(this.oilTemperatureValue, 0);
                    if (this.oilTemperatureValue >= Definitions.MIN_OIL_TEMP_WARNING) {
                        this.oilTemperatureValueText.setAttribute("class", "Warning");
                    } else {
                        this.oilTemperatureValueText.setAttribute("class", "Value");
                    }
                }
            }
        }

        setEngineBleedPressureValue(value, force = false) {
            if ((value != this.engineBleedPressureValue) || force) {
                this.engineBleedPressureValue = value;
                if (this.engineBleedPressureValueText != null) {
                    this.engineBleedPressureValueText.textContent = fastToFixed(this.engineBleedPressureValue, 0);
                }
            }
        }

        setEngineBleedValveState(open, force = false) {
            if ((open != this.engineBleedValveIsOpen) || force) {
                this.engineBleedValveIsOpen = open;
                if (this.engineBleedValveOpenLine != null) {
                    this.engineBleedValveOpenLine.style.display = this.engineBleedValveIsOpen ? "block" : "none";
                }
                if (this.engineBleedValveClosedLine != null) {
                    this.engineBleedValveClosedLine.style.display = !this.engineBleedValveIsOpen ? "block" : "none";
                }
            }
        }

        setN1VibrationValue(value, force = false) {
            if ((value != this.N1VibrationValue) || force) {
                this.N1VibrationValue = value;
                if (this.N1VibrationValueText != null) {
                    this.N1VibrationValueText.textContent = fastToFixed(this.N1VibrationValue, 1);
                }
            }
        }

        setN2VibrationValue(value, force = false) {
            if ((value != this.N2VibrationValue) || force) {
                this.N2VibrationValue = value;
                if (this.N2VibrationValueText != null) {
                    this.N2VibrationValueText.textContent = fastToFixed(this.N2VibrationValue, 1);
                }
            }
        }
    }
    A320_Neo_LowerECAM_Engine.EngineInfo = EngineInfo;
    class EngineIgniter {
        constructor(textElement) {
            this._currentState = Definitions.IGN_STATE.NONE;
            this._textElement = textElement;
            this._lastUsedIgniter = Definitions.IGN_STATE.NONE;
        }

        updateStatus(engineStarting, n2Igniting, n2Percent) {
            const targetState = this.getTargetState(engineStarting, n2Igniting, n2Percent, this._currentState);
            if (this._currentState !== Definitions.IGN_STATE.NONE && targetState !== Definitions.IGN_STATE.NONE) {
                this._lastUsedIgniter = this._currentState;
            }
            if (targetState !== this._currentState && this._textElement !== null) {
                this._textElement.textContent = this.getIGNStringFromState(targetState);
            }

            this._currentState = targetState;
        }

        getTargetState(engineStarting, n2Igniting, n2Percent, currentState) {
            if (engineStarting && n2Igniting && n2Percent > 18 && n2Percent < 55) {
                if (currentState !== Definitions.IGN_STATE.NONE) {
                    return currentState;
                }
                if (this._lastUsedIgniter === Definitions.IGN_STATE.NONE
                    ||
                    this._lastUsedIgniter === Definitions.IGN_STATE.B) {
                    return Definitions.IGN_STATE.A;
                } else if (this._lastUsedIgniter === Definitions.IGN_STATE.A) {
                    return Definitions.IGN_STATE.B;
                }
            }
            return Definitions.IGN_STATE.NONE;
        }

        getIGNStringFromState(state) {
            switch (state) {
                case Definitions.IGN_STATE.A:
                    return "A";
                case Definitions.IGN_STATE.B:
                    return "B";
                case Definitions.IGN_STATE.AB:
                    return "AB";
                default:
                    return "";
            }
        }

        isIgniting() {
            return this._currentState !== Definitions.IGN_STATE.NONE;
        }
    }
})(A320_Neo_LowerECAM_Engine || (A320_Neo_LowerECAM_Engine = {}));
customElements.define("a320-neo-lower-ecam-engine", A320_Neo_LowerECAM_Engine.Page);
