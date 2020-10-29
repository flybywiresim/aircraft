var A320_Neo_LowerECAM_Engine;
(function (A320_Neo_LowerECAM_Engine) {
    class Definitions {
    }
    Definitions.MIN_GAUGE_OIL = 0;
    Definitions.MAX_GAUGE_OIL = 25;
    Definitions.MIN_GAUGE_PSI = 0;
    Definitions.MAX_GAUGE_PSI = 100;
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
            this.engineLeft = new EngineInfo(1, this.querySelector("#LeftGauges"), this.querySelector("#FuelUsedValueLeft"), this.querySelector("#OilTemperatureValueLeft"), this.querySelector("#EngineBleedPressureValueLeft"), this.querySelector("#StartValveLeft_OPEN"), this.querySelector("#StartValveLeft_CLOSED"));
            this.engineRight = new EngineInfo(2, this.querySelector("#RightGauges"), this.querySelector("#FuelUsedValueRight"), this.querySelector("#OilTemperatureValueRight"), this.querySelector("#EngineBleedPressureValueRight"), this.querySelector("#StartValveRight_OPEN"), this.querySelector("#StartValveRight_CLOSED"));
            this.ignTitleText = this.querySelector("#IGNTitle");
            this.ignLeftValueText = this.querySelector("#IGNValueLeft");
            this.ignRightValueText = this.querySelector("#IGNValueRight");
            this.ignLeftCurrentState = A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.NONE;
            this.ignRightCurrentState = A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.NONE;
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            if (this.engineLeft != null) {
                this.engineLeft.update(_deltaTime);
            }
            if (this.engineRight != null) {
                this.engineRight.update(_deltaTime);
            }
            this.updateIGN();
        }
        updateIGN() {
            let ignLeftTargetState = A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.NONE;
            let n2Igniting = (SimVar.GetSimVarValue("TURB ENG IS IGNITING:1", "bool") === 1) ? true : false;
            let n2Percent = SimVar.GetSimVarValue("ENG N2 RPM:1", "percent");
            if (n2Igniting || (n2Percent > 5)) {
                ignLeftTargetState = A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.A;
            }
            let ignRightTargetState = A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.NONE;
            n2Igniting = (SimVar.GetSimVarValue("TURB ENG IS IGNITING:2", "bool") === 1) ? true : false;
            n2Percent = SimVar.GetSimVarValue("ENG N2 RPM:2", "percent");
            if (n2Igniting || (n2Percent > 5)) {
                ignRightTargetState = A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.B;
            }
            let ignNeedRefreshTitle = false;
            if (ignLeftTargetState != this.ignLeftCurrentState) {
                this.ignLeftCurrentState = ignLeftTargetState;
                if (this.ignLeftValueText != null) {
                    this.ignLeftValueText.textContent = this.getIGNStringFromState(this.ignLeftCurrentState);
                }
                ignNeedRefreshTitle = true;
            }
            if (ignRightTargetState != this.ignRightCurrentState) {
                this.ignRightCurrentState = ignRightTargetState;
                if (this.ignRightValueText != null) {
                    this.ignRightValueText.textContent = this.getIGNStringFromState(this.ignRightCurrentState);
                }
                ignNeedRefreshTitle = true;
            }
            if (ignNeedRefreshTitle && (this.ignTitleText != null)) {
                if ((this.ignLeftCurrentState != A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.NONE) || (this.ignRightCurrentState != A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.NONE)) {
                    this.ignTitleText.textContent = "IGN";
                } else {
                    this.ignTitleText.textContent = "";
                }
            }
        }
        getIGNStringFromState(_state) {
            switch (_state) {
                case A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.A:
                {
                    return "A";
                }
                case A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.B:
                {
                    return "B";
                }
                case A320_Neo_LowerECAM_Engine.Definitions.IGN_STATE.AB:
                {
                    return "AB";
                }
                default:
                {
                    return "";
                }
            }
        }
        onEvent(_event) {
            super.onEvent(_event);
        }
    }
    A320_Neo_LowerECAM_Engine.Page = Page;
    class EngineInfo {
        constructor(_engineIndex, _gaugeDiv, _fuelUsedValueText, _oilTemperatureValueText, _engineBleedPressureValueText, _startValveOpenLine, _startValveClosedLine) {
            this.engineIndex = _engineIndex;
            this.fuelUsedValueText = _fuelUsedValueText;
            this.oilTemperatureValueText = _oilTemperatureValueText;
            this.engineBleedPressureValueText = _engineBleedPressureValueText;
            this.engineBleedValveOpenLine = _startValveOpenLine;
            this.engineBleedValveClosedLine = _startValveClosedLine;
            const gaugeDef = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef.arcSize = 200;
            gaugeDef.currentValuePrecision = 0;
            gaugeDef.minValue = A320_Neo_LowerECAM_Engine.Definitions.MIN_GAUGE_OIL;
            gaugeDef.maxValue = A320_Neo_LowerECAM_Engine.Definitions.MAX_GAUGE_OIL;
            gaugeDef.currentValueFunction = this.getOilQuantity.bind(this);
            this.oilQuantityGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.oilQuantityGauge.id = "OIL_Gauge";
            this.oilQuantityGauge.init(gaugeDef);
            this.oilQuantityGauge.addGraduation(0, true, "0");
            this.oilQuantityGauge.addGraduation(12.5, true);
            this.oilQuantityGauge.addGraduation(25, true, "25");
            gaugeDef.minValue = A320_Neo_LowerECAM_Engine.Definitions.MIN_GAUGE_PSI;
            gaugeDef.maxValue = A320_Neo_LowerECAM_Engine.Definitions.MAX_GAUGE_PSI;
            gaugeDef.minRedValue = A320_Neo_LowerECAM_Engine.Definitions.MIN_GAUGE_PSI_RED;
            gaugeDef.maxRedValue = A320_Neo_LowerECAM_Engine.Definitions.MAX_GAUGE_PSI_RED;
            gaugeDef.warningRange[0] = A320_Neo_LowerECAM_Engine.Definitions.MAX_GAUGE_PSI_RED;
            gaugeDef.warningRange[1] = A320_Neo_LowerECAM_Engine.Definitions.MAX_GAUGE_PSI_WARNING;
            gaugeDef.dangerRange[0] = A320_Neo_LowerECAM_Engine.Definitions.MIN_GAUGE_PSI_RED;
            gaugeDef.dangerRange[1] = A320_Neo_LowerECAM_Engine.Definitions.MAX_GAUGE_PSI_RED;
            gaugeDef.currentValueFunction = this.getOilPressure.bind(this);
            this.oilPressureGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.oilPressureGauge.id = "PSI_Gauge";
            this.oilPressureGauge.init(gaugeDef);
            this.oilPressureGauge.addGraduation(50, true);
            this.oilPressureGauge.addGraduation(100, true, "100");
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.oilQuantityGauge);
                _gaugeDiv.appendChild(this.oilPressureGauge);
            }
            this.setFuelUsedValue(0, true);
            this.setOilTemperatureValue(0, true);
            this.setEngineBleedPressureValue(0, true);
            this.setEngineBleedValveState(false, true);
        }
        update(_deltaTime) {
            this.setFuelUsedValue(SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + this.engineIndex, "kg"));
            this.setOilTemperatureValue(SimVar.GetSimVarValue("GENERAL ENG OIL TEMPERATURE:" + this.engineIndex, "celsius"));
            this.setEngineBleedPressureValue(SimVar.GetSimVarValue("APU BLEED PRESSURE RECEIVED BY ENGINE:" + this.engineIndex, "psi"));
            this.setEngineBleedValveState(SimVar.GetSimVarValue("GENERAL ENG STARTER:" + this.engineIndex, "bool"));
            if (this.oilQuantityGauge != null) {
                this.oilQuantityGauge.update(_deltaTime);
            }
            if (this.oilPressureGauge != null) {
                this.oilPressureGauge.update(_deltaTime);
            }
        }
        getOilQuantity() {
            let value = SimVar.GetSimVarValue("ENG OIL QUANTITY:" + this.engineIndex, "percent") * 0.01;
            value *= A320_Neo_LowerECAM_Engine.Definitions.MAX_GAUGE_OIL;
            return value;
        }
        getOilPressure() {
            const value = SimVar.GetSimVarValue("ENG OIL PRESSURE:" + this.engineIndex, "psi");
            return value;
        }
        setFuelUsedValue(_value, _force = false) {
            if ((_value != this.fuelUsedValue) || _force) {
                this.fuelUsedValue = _value;
                if (this.fuelUsedValueText != null) {
                    this.fuelUsedValueText.textContent = fastToFixed(this.fuelUsedValue, 0);
                }
            }
        }
        setOilTemperatureValue(_value, _force = false) {
            if ((_value != this.oilTemperatureValue) || _force) {
                this.oilTemperatureValue = _value;
                if (this.oilTemperatureValueText != null) {
                    this.oilTemperatureValueText.textContent = fastToFixed(this.oilTemperatureValue, 0);
                    if (this.oilTemperatureValue >= A320_Neo_LowerECAM_Engine.Definitions.MIN_OIL_TEMP_WARNING) {
                        this.oilTemperatureValueText.setAttribute("class", "Warning");
                    } else {
                        this.oilTemperatureValueText.setAttribute("class", "Value");
                    }
                }
            }
        }
        setEngineBleedPressureValue(_value, _force = false) {
            if ((_value != this.engineBleedPressureValue) || _force) {
                this.engineBleedPressureValue = _value;
                if (this.engineBleedPressureValueText != null) {
                    this.engineBleedPressureValueText.textContent = fastToFixed(this.engineBleedPressureValue, 0);
                }
            }
        }
        setEngineBleedValveState(_open, _force = false) {
            if ((_open != this.engineBleedValveIsOpen) || _force) {
                this.engineBleedValveIsOpen = _open;
                if (this.engineBleedValveOpenLine != null) {
                    this.engineBleedValveOpenLine.style.display = this.engineBleedValveIsOpen ? "block" : "none";
                }
                if (this.engineBleedValveClosedLine != null) {
                    this.engineBleedValveClosedLine.style.display = !this.engineBleedValveIsOpen ? "block" : "none";
                }
            }
        }
    }
    A320_Neo_LowerECAM_Engine.EngineInfo = EngineInfo;
})(A320_Neo_LowerECAM_Engine || (A320_Neo_LowerECAM_Engine = {}));
customElements.define("a320-neo-lower-ecam-engine", A320_Neo_LowerECAM_Engine.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_Engine.js.map