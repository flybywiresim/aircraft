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
        get templateID() {
            return "LowerECAMFuelTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.allToggleElements.push(new JetFuelToggleElement(this, "#leftValve", "FUELSYSTEM VALVE SWITCH:1", "FUELSYSTEM VALVE OPEN:1"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#middleValve", "FUELSYSTEM VALVE SWITCH:3", "FUELSYSTEM VALVE OPEN:3"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#rightValve", "FUELSYSTEM VALVE SWITCH:2", "FUELSYSTEM VALVE OPEN:2"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#leftPump1", "FUELSYSTEM PUMP SWITCH:2", "FUELSYSTEM PUMP ACTIVE:2"));
            this.allToggleElements.push(new JetFuelToggleElement(this, "#leftPump2", "FUELSYSTEM PUMP SWITCH:5", "FUELSYSTEM PUMP ACTIVE:5"));
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
            this.apuLineElement = this.querySelector("#apuFuelLine");
            this.setAPUState(false, false, true);
            this.middlePump1 = this.querySelector("#middlePump1");
            this.middlePump2 = this.querySelector("#middlePump2");
            this.middlePump1_On = this.querySelector("#middlePump1_On");
            this.middlePump2_On = this.querySelector("#middlePump2_On");
            this.middlePump1_Off = this.querySelector("#middlePump1_Off");
            this.middlePump2_Off = this.querySelector("#middlePump2_Off");
            this.isInitialised = true;
            this.isInMetric = BaseAirliners.unitIsMetric(Aircraft.A320_NEO);
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            let factor = this.gallonToPounds;
            if (this.isInMetric) {
                factor = this.gallonToKg;
            }
            this.updateQuantity(this.FOBValue, "FUEL TOTAL QUANTITY", factor);
            this.updateQuantity(this.centerTankValue, "FUEL TANK CENTER QUANTITY", factor);
            this.updateQuantity(this.leftInnerTankValue, "FUEL TANK LEFT MAIN QUANTITY", factor);
            this.updateQuantity(this.leftOuterTankValue, "FUEL TANK LEFT AUX QUANTITY", factor);
            this.updateQuantity(this.rightInnerTankValue, "FUEL TANK RIGHT MAIN QUANTITY", factor);
            this.updateQuantity(this.rightOuterTankValue, "FUEL TANK RIGHT AUX QUANTITY", factor);
            this.updateFuelFlow(factor);
            this.updateFuelConsumption(factor);
            for (let i = 0; i < this.allToggleElements.length; ++i) {
                if (this.allToggleElements[i] != null) {
                    this.allToggleElements[i].refresh();
                }
            }

            const centerTankQty = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "gallons");
            const leftCenterPumpOn = SimVar.GetSimVarValue("FUELSYSTEM PUMP SWITCH:1", "boolean");
            const rightCenterPumpOn = SimVar.GetSimVarValue("FUELSYSTEM PUMP SWITCH:4", "boolean");
            const leftCenterPumpActive = SimVar.GetSimVarValue("FUELSYSTEM PUMP ACTIVE:1", "boolean");
            const rightCenterPumpActive = SimVar.GetSimVarValue("FUELSYSTEM PUMP ACTIVE:4", "boolean");

            if (leftCenterPumpOn) {
                this.middlePump1.setAttribute("class", "ValvePumpActive");
                if (centerTankQty <= 10 || !leftCenterPumpActive) {
                    this.middlePump1_Off.setAttribute("class", "ValvePumpActive");
                    this.middlePump1_Off.setAttribute("visibility", "visible");
                    this.middlePump1_On.setAttribute("visibility", "hidden");
                } else {
                    this.middlePump1_Off.setAttribute("visibility", "hidden");
                    this.middlePump1_On.setAttribute("visibility", "visible");
                }
            } else {
                this.middlePump1.setAttribute("class", "ValvePumpInactive");
                this.middlePump1_Off.setAttribute("class", "ValvePumpInactive");
                this.middlePump1_Off.setAttribute("visibility", "visible");
                this.middlePump1_On.setAttribute("visibility", "hidden");
            }

            if (rightCenterPumpOn) {
                this.middlePump2.setAttribute("class", "ValvePumpActive");
                if (centerTankQty <= 10 || !rightCenterPumpActive) {
                    this.middlePump2_Off.setAttribute("class", "ValvePumpActive");
                    this.middlePump2_Off.setAttribute("visibility", "visible");
                    this.middlePump2_On.setAttribute("visibility", "hidden");
                } else {
                    this.middlePump2_Off.setAttribute("visibility", "hidden");
                    this.middlePump2_On.setAttribute("visibility", "visible");
                }
            } else {
                this.middlePump2.setAttribute("class", "ValvePumpInactive");
                this.middlePump2_Off.setAttribute("class", "ValvePumpInactive");
                this.middlePump2_Off.setAttribute("visibility", "visible");
                this.middlePump2_On.setAttribute("visibility", "hidden");
            }

            if (this.isInMetric) {
                this.FOBUnit.textContent = "KG";
                this.fuelFlowUnit.textContent = "KG/MIN";
                this.middleFuelUnit.textContent = "KG";
            } else {
                this.FOBUnit.textContent = "LBS";
                this.fuelFlowUnit.textContent = "LBS/MIN";
                this.middleFuelUnit.textContent = "LBS";
            }

            this.setAPUState(SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool"), SimVar.GetSimVarValue("FUELSYSTEM VALVE OPEN:8", "Bool"));
        }
        onEvent(_event) {
            switch (_event) {
            }
        }
        updateFuelFlow(_unitFactor) {
            const totalFuelFlow = (SimVar.GetSimVarValue("ENG FUEL FLOW GPH:1", "gallons per hour") + SimVar.GetSimVarValue("ENG FUEL FLOW GPH:2", "gallons per hour")) * (_unitFactor / 60);
            this.fuelFlowValue.textContent = fastToFixed(totalFuelFlow, 0);
        }
        updateFuelConsumption(_unitFactor) {
            if (this.fuelLevels) {
                const leftConsumption = this.isInMetric ?
                    SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + 1, "KG") :
                    SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + 1, "gallon") * _unitFactor * 0.001;
                const rightConsumption = this.isInMetric ?
                    SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + 2, "KG") :
                    SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + 2, "gallon") * _unitFactor * 0.001;

                const leftConsumptionShown = leftConsumption - (leftConsumption % 10);
                const rightConsumptionShown = rightConsumption - (rightConsumption % 10);
                const totalConsumptionShown = leftConsumptionShown + rightConsumptionShown;

                this.leftValveValue.textContent = fastToFixed(leftConsumptionShown, 0);
                this.rightValveValue.textContent = fastToFixed(rightConsumptionShown, 0);
                this.middleFuelValue.textContent = fastToFixed(totalConsumptionShown, 0);
            } else {
                this.fuelLevels = SimVar.GetGameVarValue("AIRCRAFT INITIAL FUEL LEVELS", "FuelLevels");
            }
        }
        updateQuantity(_elem, _simvar, _unitFactor) {
            let quantity = SimVar.GetSimVarValue(_simvar, "gallons");
            quantity *= _unitFactor;
            quantity -= quantity % 20;
            _elem.textContent = fastToFixed(quantity, 0);
        }
        setAPUState(_isOn, _isActive, _force = false) {
            if ((_isOn != this.apuOn) || (_isActive != this.apuActive) || _force) {
                this.apuOn = _isOn;
                this.apuActive = _isActive;
                if (this.apuElement != null) {
                    this.apuElement.setAttribute("class", this.apuOn ? "active" : "inactive");
                    this.apuLineElement.setAttribute("visibility", this.apuOn ? "visible" : "hidden");
                }
            }
        }
    }
    A320_Neo_LowerECAM_Fuel.Page = Page;
})(A320_Neo_LowerECAM_Fuel || (A320_Neo_LowerECAM_Fuel = {}));
customElements.define("a320-neo-lower-ecam-fuel", A320_Neo_LowerECAM_Fuel.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_Fuel.js.map