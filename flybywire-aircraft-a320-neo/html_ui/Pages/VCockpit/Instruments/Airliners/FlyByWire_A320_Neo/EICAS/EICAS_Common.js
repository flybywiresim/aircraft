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
        this.isaText = this.querySelector("#ISAValue");
        this.isaContainer = this.querySelector("#ISA");
        this.areAdirsAligned = null;
        this.isSATVisible = null;
        this.isTATVisible = null;
        this.isISAVisible = null;
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
        this.refreshTAT(Arinc429Word.empty());
        this.refreshSAT(Arinc429Word.empty());
        this.refreshISA(Arinc429Word.empty());
        this.refreshClock();
        this.refreshGrossWeight(true);
        this.isInitialised = true;
    }
    update(_deltaTime) {
        if (!this.isInitialised) {
            return;
        }

        const airDataReferenceSource = this.getStatusAirDataReferenceSource();
        const sat = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_STATIC_AIR_TEMPERATURE`);
        this.refreshTAT(Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_TOTAL_AIR_TEMPERATURE`));
        this.refreshSAT(sat);
        this.refreshISA(Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA`), sat);

        this.refreshClock();
        this.refreshLoadFactor(_deltaTime, SimVar.GetSimVarValue("G FORCE", "GFORCE"));
        this.refreshGrossWeight();
    }

    getStatusAirDataReferenceSource() {
        return this.getStatusSupplier(SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'Enum'));
    }

    getStatusSupplier(knobValue) {
        const adirs3ToCaptain = 0;
        return knobValue === adirs3ToCaptain ? 3 : 1;
    }

    refreshTAT(tat) {
        if (!tat.isNormalOperation()) {
            this.tatText.textContent = "XX";
            this.toggleWarning(true, this.tatText);
        } else {
            this.setValueOnTemperatureElement(Math.round(tat.value), this.tatText);
            this.toggleWarning(false, this.tatText);
        }
    }

    refreshSAT(sat) {
        if (!sat.isNormalOperation()) {
            this.satText.textContent = "XX";
            this.toggleWarning(true, this.satText);
        } else {
            this.setValueOnTemperatureElement(Math.round(sat.value), this.satText);
            this.toggleWarning(false, this.satText);
        }
    }

    refreshISA(isa, sat) {
        const isInStdMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === "STD";
        // As ISA relates to SAT, we cannot present ISA when SAT is unavailable. We might want to move this into
        // Rust ADIRS code itself.
        const isaShouldBeVisible = isInStdMode && isa.isNormalOperation() && sat.isNormalOperation();
        this.isaContainer.setAttribute("visibility", isaShouldBeVisible ? "visible" : "hidden");

        this.setValueOnTemperatureElement(Math.round(isa.value), this.isaText);
    }

    setValueOnTemperatureElement(value, element) {
        if (value > 0) {
            element.textContent = "+" + value.toString().padStart(2);
        } else {
            element.textContent = (value < 0 ? "-" : "") + Math.abs(value).toString().padStart(2);
        }
    }

    toggleWarning(isWarning, element) {
        element.classList.toggle("Warning", isWarning);
        element.classList.toggle("Value", !isWarning);
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
        const gw = Math.round(NXUnits.kgToUser(emptyWeight + fuelWeight + payloadWeight));
        const gwUnit = NXUnits.userWeightUnit();
        if ((gw != this.currentGW) || _force) {
            this.currentGW = gw;
            if (this.gwValue != null) {
                // Lower EICAS displays GW in increments of 100
                this.gwValue.textContent = (Math.floor(this.currentGW / 100) * 100).toString();
            }
        }
        if (gwUnit != this.currentGwUnit) {
            this.currentGwUnit = gwUnit;
            if (this.gwUnit != null) {
                this.gwUnit.textContent = gwUnit;
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
}
customElements.define("eicas-common-display", EICASCommonDisplay);
