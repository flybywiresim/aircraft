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
            this.fuelLevels = SimVar.GetGameVarValue("AIRCRAFT INITIAL FUEL LEVELS", "FuelLevels");
            this.gallonToKG = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kg");
            this.conversionWeight = parseFloat(NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1"));
            this.apuElement = this.querySelector("#APU");
            this.apuLineElement = this.querySelector("#apuFuelLine");
            this.setAPUState(false, false, true);
            this.middlePump1 = this.querySelector("#middlePump1");
            this.middlePump2 = this.querySelector("#middlePump2");
            this.middlePump1_On = this.querySelector("#middlePump1_On");
            this.middlePump2_On = this.querySelector("#middlePump2_On");
            this.middlePump1_Off = this.querySelector("#middlePump1_Off");
            this.middlePump2_Off = this.querySelector("#middlePump2_Off");
            if (this.conversionWeight === 1) {
                this.FOBUnit.textContent = "KG";
                this.fuelFlowUnit.textContent = "KG/MIN";
                this.middleFuelUnit.textContent = "KG";
            } else {
                this.FOBUnit.textContent = "LBS";
                this.fuelFlowUnit.textContent = "LBS/MIN";
                this.middleFuelUnit.textContent = "LBS";
            }
            this.updateThrottler = new UpdateThrottler(500);
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised || !A320_Neo_EICAS.isOnBottomScreen()) {
                return;
            }
            if (this.updateThrottler.canUpdate(_deltaTime) === -1) {
                return;
            }
            this.updateQuantity(this.FOBValue, "FUEL TOTAL QUANTITY");
            this.updateQuantity(this.centerTankValue, "FUEL TANK CENTER QUANTITY");
            this.updateQuantity(this.leftInnerTankValue, "FUEL TANK LEFT MAIN QUANTITY");
            this.updateQuantity(this.leftOuterTankValue, "FUEL TANK LEFT AUX QUANTITY");
            this.updateQuantity(this.rightInnerTankValue, "FUEL TANK RIGHT MAIN QUANTITY");
            this.updateQuantity(this.rightOuterTankValue, "FUEL TANK RIGHT AUX QUANTITY");
            this.updateFuelFlow();
            this.updateFuelConsumption();

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

            this.setAPUState(SimVar.GetSimVarValue("L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON", "Bool"), SimVar.GetSimVarValue("L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON", "Bool"));
        }
        onEvent(_event) {
            switch (_event) {
            }
        }
        updateFuelFlow() {
            const totalFuelFlow = (SimVar.GetSimVarValue("L:A32NX_ENGINE_FF:1", "number") + SimVar.GetSimVarValue("L:A32NX_ENGINE_FF:2", "number")) * this.conversionWeight / 60;
            this.fuelFlowValue.textContent = fastToFixed(totalFuelFlow, 0);
        }
        updateFuelConsumption() {
            if (this.fuelLevels) {
                const leftConsumption = SimVar.GetSimVarValue("L:A32NX_FUEL_USED:" + 1, "number") * this.conversionWeight;
                const rightConsumption = SimVar.GetSimVarValue("L:A32NX_FUEL_USED:" + 2, "number") * this.conversionWeight;

                const leftConsumptionShown = leftConsumption - (leftConsumption % (10 * Math.round(this.conversionWeight)));
                const rightConsumptionShown = rightConsumption - (rightConsumption % (10 * Math.round(this.conversionWeight)));

                const totalConsumptionShown = leftConsumptionShown + rightConsumptionShown;

                this.leftValveValue.textContent = fastToFixed(leftConsumptionShown, 0);
                this.rightValveValue.textContent = fastToFixed(rightConsumptionShown, 0);
                this.middleFuelValue.textContent = fastToFixed(totalConsumptionShown, 0);
            } else {
                this.fuelLevels = SimVar.GetGameVarValue("AIRCRAFT INITIAL FUEL LEVELS", "FuelLevels");
            }
        }
        updateQuantity(_elem, _simvar) {
            let quantity = SimVar.GetSimVarValue(_simvar, "gallons") * this.gallonToKG * this.conversionWeight;
            quantity -= quantity % 20;
            if (quantity < 0) {
                quantity = 0;
            }
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
