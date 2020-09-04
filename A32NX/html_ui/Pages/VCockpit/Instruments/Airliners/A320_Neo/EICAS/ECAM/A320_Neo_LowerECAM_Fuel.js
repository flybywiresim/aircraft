var A320_Neo_LowerECAM_Fuel;
(function (A320_Neo_LowerECAM_Fuel) {
    class JetFuelToggleElement {
        constructor(_owner, _selector, _onSimVarName, _activeSimVarName) {
            this.isOn = false;
            this.onSimVarName = "";
            this.isActive = false;
            this.activeSimVarName = "";
            this.On = _owner.querySelector(_selector + "_On");
            this.Off = _owner.querySelector(_selector + "_Off");
            this.onSimVarName = _onSimVarName;
            this.activeSimVarName = _activeSimVarName;
            this.setState(false, false, true);
        }
        setState(_isOn, _isActive, _force = false) {
            if ((_isOn != this.isOn) || (_isActive != this.isActive) || _force) {
                this.isOn = _isOn;
                this.isActive = _isActive;
                if (this.On != null) {
                    this.On.setAttribute("visibility", this.isOn ? "visible" : "hidden");
                    if (this.isOn) {
                        this.On.setAttribute("class", this.isActive ? "ValvePumpActive" : "ValvePumpInactive");
                    }
                }
                if (this.Off != null) {
                    this.Off.setAttribute("visibility", this.isOn ? "hidden" : "visible");
                    if (!this.isOn) {
                        this.Off.setAttribute("class", !this.isActive ? "ValvePumpActive" : "ValvePumpInactive");
                    }
                }
            }
        }
        refresh() {
            this.setState(SimVar.GetSimVarValue(this.onSimVarName, "Bool"), SimVar.GetSimVarValue(this.activeSimVarName, "Bool"));
        }
    }
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
            this.allToggleElements = new Array();
        }
        get templateID() { return "LowerECAMFuelTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.allToggleElements.push(new JetFuelToggleElement(this, "#leftValve", "FUELSYSTEM VALVE SWITCH:6", "FUELSYSTEM VALVE OPEN:6"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#middleValve", "FUELSYSTEM VALVE SWITCH:1", "FUELSYSTEM VALVE OPEN:1"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#rightValve", "FUELSYSTEM VALVE SWITCH:7", "FUELSYSTEM VALVE OPEN:7"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#leftPump1", "FUELSYSTEM PUMP SWITCH:2", "FUELSYSTEM PUMP ACTIVE:2"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#leftPump2", "FUELSYSTEM PUMP SWITCH:5", "FUELSYSTEM PUMP ACTIVE:5"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#middlePump1", "FUELSYSTEM PUMP SWITCH:1", "FUELSYSTEM PUMP ACTIVE:1"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#middlePump2", "FUELSYSTEM PUMP SWITCH:4", "FUELSYSTEM PUMP ACTIVE:4"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#rightPump1", "FUELSYSTEM PUMP SWITCH:3", "FUELSYSTEM PUMP ACTIVE:3"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#rightPump2", "FUELSYSTEM PUMP SWITCH:6", "FUELSYSTEM PUMP ACTIVE:6"));
            this.middleFuelValue = this.querySelector("#middleFuelValue");
            this.leftValveValue = this.querySelector("#leftValveValue");
            this.rightValveValue = this.querySelector("#rightValveValue");
            this.leftOuterTankValue = this.querySelector("#leftOuterTankValue");
            this.leftInnerTankValue = this.querySelector("#leftInnerTankValue");
            this.centerTankValue = this.querySelector("#centerTankValue");
            this.rightInnerTankValue = this.querySelector("#rightInnerTankValue");
            this.rightOuterTankValue = this.querySelector("#rightOuterTankValue");
            this.FOBValue = this.querySelector("#fobValue");
            this.fuelFlowValue = this.querySelector("#ffValue");
            this.FOBUnit = this.querySelector("#fobUnit");
            this.fuelFlowUnit = this.querySelector("#ffUnit");
            this.middleFuelUnit = this.querySelector("#middleFuelUnit");
            this.gallonToKg = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilogram");
            this.gallonToPounds = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "lbs");
            this.fuelLevels = SimVar.GetGameVarValue("AIRCRAFT INITIAL FUEL LEVELS", "FuelLevels");
            this.apuElement = this.querySelector("#APU");
            this.setAPUState(false, false, true);
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            let isInMetric = BaseAirliners.unitIsMetric(Aircraft.A320_NEO);
            let factor = this.gallonToPounds;
            if (isInMetric)
                factor = this.gallonToKg;
            this.updateQuantity(this.FOBValue, "FUEL TOTAL QUANTITY", factor);
            this.updateQuantity(this.centerTankValue, "FUEL TANK CENTER QUANTITY", factor);
            this.updateQuantity(this.leftInnerTankValue, "FUEL TANK LEFT MAIN QUANTITY", factor);
            this.updateQuantity(this.leftOuterTankValue, "FUEL TANK LEFT AUX QUANTITY", factor);
            this.updateQuantity(this.rightInnerTankValue, "FUEL TANK RIGHT MAIN QUANTITY", factor);
            this.updateQuantity(this.rightOuterTankValue, "FUEL TANK RIGHT AUX QUANTITY", factor);
            this.updateFuelFlow(factor);
            this.updateFuelConsumption(factor);
            for (var i = 0; i < this.allToggleElements.length; ++i) {
                if (this.allToggleElements[i] != null) {
                    this.allToggleElements[i].refresh();
                }
            }
            if (isInMetric) {
                this.FOBUnit.textContent = "KG";
                this.fuelFlowUnit.textContent = "KG/MIN";
                this.middleFuelUnit.textContent = "KG";
            }
            else {
                this.FOBUnit.textContent = "LBS";
                this.fuelFlowUnit.textContent = "LBS/MIN";
                this.middleFuelUnit.textContent = "LBS";
            }
            this.setAPUState(SimVar.GetSimVarValue("FUELSYSTEM PUMP SWITCH:7", "Bool"), SimVar.GetSimVarValue("FUELSYSTEM PUMP ACTIVE:7", "Bool"));
        }
        onEvent(_event) {
            switch (_event) {
            }
        }
        updateFuelFlow(_unitFactor) {
            var totalFuelFlow = (SimVar.GetSimVarValue("ENG FUEL FLOW GPH:1", "gallons per hour") + SimVar.GetSimVarValue("ENG FUEL FLOW GPH:2", "gallons per hour")) * (_unitFactor / 60);
            this.fuelFlowValue.textContent = fastToFixed(totalFuelFlow, 0);
        }
        updateFuelConsumption(_unitFactor) {
            if (this.fuelLevels) {
                var leftConsumption = SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + 1, "gallon") * _unitFactor * 0.001;
                var rightConsumption = SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + 2, "gallon") * _unitFactor * 0.001;
                var totalConsumption = leftConsumption + rightConsumption;
                this.leftValveValue.textContent = fastToFixed(leftConsumption, 0);
                this.rightValveValue.textContent = fastToFixed(rightConsumption, 0);
                this.middleFuelValue.textContent = fastToFixed(totalConsumption, 0);
            }
            else {
                this.fuelLevels = SimVar.GetGameVarValue("AIRCRAFT INITIAL FUEL LEVELS", "FuelLevels");
            }
        }
        updateQuantity(_elem, _simvar, _unitFactor) {
            var quantity = SimVar.GetSimVarValue(_simvar, "gallons");
            quantity *= _unitFactor;
            _elem.textContent = fastToFixed(quantity, 0);
        }
        setAPUState(_isOn, _isActive, _force = false) {
            if ((_isOn != this.apuOn) || (_isActive != this.apuActive) || _force) {
                this.apuOn = _isOn;
                this.apuActive = _isActive;
                if (this.apuElement != null) {
                    {
                        this.apuElement.setAttribute("class", this.apuOn ? "active" : "inactive");
                    }
                }
            }
        }
    }
    A320_Neo_LowerECAM_Fuel.Page = Page;
})(A320_Neo_LowerECAM_Fuel || (A320_Neo_LowerECAM_Fuel = {}));
customElements.define("a320-neo-lower-ecam-fuel", A320_Neo_LowerECAM_Fuel.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_Fuel.js.map 