class EICASCommonDisplay extends Airliners.EICASTemplateElement {
    constructor() {
        super();
        this.isInitialised = false;
    }
    get templateID() {
        return "EICASCommonDisplayTemplate";
    }
    connectedCallback() {
        super.connectedCallback();
        TemplateElement.call(this, this.init.bind(this));
    }
    init() {
        this.tatText = this.querySelector("#TATValue");
        this.satText = this.querySelector("#SATValue");
        this.currentSeconds = 0;
        this.currentMinutes = 0;
        this.hoursText = this.querySelector("#HoursValue");
        this.minutesText = this.querySelector("#MinutesValue");
        this.loadFactorContainer = this.querySelector("#LoadFactor");
        this.loadFactorText = this.querySelector("#LoadFactorValue");
        this.loadFactorSet = new NXLogic_ConfirmNode(2);
        this.loadFactorReset = new NXLogic_ConfirmNode(5);
        this.loadFactorVisible = new NXLogic_MemoryNode(true);
        this.gwUnit = this.querySelector("#GWUnit");
        this.gwValue = this.querySelector("#GWValue");
        this.conversionWeight = parseFloat(NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1"));
        this.gwUnit.textContent = this.conversionWeight === 1 ? "KG" : "LBS";
        this.refreshTAT(0, true);
        this.refreshSAT(0, true);
        this.refreshClock();
        this.refreshGrossWeight(true);
        this.isInitialised = true;
    }
    update(_deltaTime) {
        if (!this.isInitialised) {
            return;
        }
        this.refreshTAT(Math.round(Simplane.getTotalAirTemperature()));
        this.refreshSAT(Math.round(Simplane.getAmbientTemperature()));
        this.refreshClock();
        this.refreshLoadFactor(_deltaTime, SimVar.GetSimVarValue("G FORCE", "GFORCE"));
        this.refreshGrossWeight();
        this.refreshADIRS();
    }
    refreshTAT(_value, _force = false) {
        //if ((_value != this.currentTAT) || _force) {
        this.currentTAT = _value;
        if (this.tatText != null) {
            if (this.currentTAT > 0) {
                this.tatText.textContent = "+" + this.currentTAT.toString();
            } else {
                this.tatText.textContent = this.currentTAT.toString();
            }
        }
        //}
    }
    refreshSAT(_value, _force = false) {
        //if ((_value != this.currentSAT) || _force) {
        this.currentSAT = _value;
        if (this.satText != null) {
            if (this.currentSAT > 0) {
                this.satText.textContent = "+" + this.currentSAT.toString();
            } else {
                this.satText.textContent = this.currentSAT.toString();
            }
        }
        //}
    }
    refreshLoadFactor(_deltaTime, value) {
        const conditionsMet = value > 1.4 || value < 0.7;
        const loadFactorSet = this.loadFactorSet.write(conditionsMet, _deltaTime);
        const loadFactorReset = this.loadFactorReset.write(!conditionsMet, _deltaTime);
        const flightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
        const isVisible = (
            flightPhase >= 4 &&
            flightPhase <= 8 &&
            this.loadFactorVisible.write(loadFactorSet, loadFactorReset)
        );

        if (this.loadFactorContainer) {
            if (!isVisible) {
                this.loadFactorContainer.setAttribute("visibility", "hidden");
                if (this.loadFactorText) {
                    this.loadFactorText.textContent = "";
                }
                return;
            }
            this.loadFactorContainer.setAttribute("visibility", "visible");
        }

        if (this.loadFactorText) {
            const clamped = Math.min(Math.max(value, -3), 5);
            this.loadFactorText.textContent = (clamped >= 0 ? "+" : "") + clamped.toFixed(1);
        }
    }
    refreshClock() {
        const seconds = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        if (seconds != this.currentSeconds) {
            this.currentSeconds = seconds;
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds - (hours * 3600)) / 60);
            if (minutes != this.currentMinutes) {
                this.currentMinutes = minutes;
                if (this.hoursText != null) {
                    this.hoursText.textContent = hours.toString().padStart(2, "0");
                }
                if (this.minutesText != null) {
                    this.minutesText.textContent = minutes.toString().padStart(2, "0");
                }
            }
        }
    }
    refreshGrossWeight(_force = false) {
        const fuelWeight = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "kg");
        const emptyWeight = SimVar.GetSimVarValue("EMPTY WEIGHT", "kg");
        const payloadWeight = this.getPayloadWeight("kg");
        const gw = Math.round((emptyWeight + fuelWeight + payloadWeight) * this.conversionWeight);
        if ((gw != this.currentGW) || _force) {
            this.currentGW = gw;
            if (this.gwValue != null) {
                // Lower EICAS displays GW in increments of 100
                this.gwValue.textContent = (Math.floor(this.currentGW / 100) * 100).toString();
            }
        }
    }
    getPayloadWeight(unit) {
        const payloadCount = SimVar.GetSimVarValue("PAYLOAD STATION COUNT", "number");
        let payloadWeight = 0;
        for (let i = 1; i <= payloadCount; i++) {
            payloadWeight += SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, unit);
        }
        return payloadWeight;
    }
    refreshADIRS() {
        if (this.tatText != null && this.satText != null) {
            if (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum") != 2) {
                this.tatText.textContent = "XX";
                this.tatText.classList.add("Warning");
                this.tatText.classList.remove("Value");
                this.satText.textContent = "XX";
                this.satText.classList.add("Warning");
                this.satText.classList.remove("Value");
            } else {
                this.satText.classList.add("Value");
                this.satText.classList.remove("Warning");
                this.tatText.classList.add("Value");
                this.tatText.classList.remove("Warning");
            }
        }
    }
}
customElements.define("eicas-common-display", EICASCommonDisplay);
