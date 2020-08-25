class EICASCommonDisplay extends Airliners.EICASTemplateElement {
    constructor() {
        super();
        this.isInitialised = false;
    }
    get templateID() { return "EICASCommonDisplayTemplate"; }
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
        this.gwUnit = this.querySelector("#GWUnit");
        this.gwValue = this.querySelector("#GWValue");
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
        this.refreshGrossWeight();
        this.refreshADIRS();
    }
    refreshTAT(_value, _force = false) {
        //if ((_value != this.currentTAT) || _force) {
        this.currentTAT = _value;
        if (this.tatText != null) {
            if (this.currentTAT > 0) {
                this.tatText.textContent = "+" + this.currentTAT.toString();
            }
            else {
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
            }
            else {
                this.satText.textContent = this.currentSAT.toString();
            }
        }
        //}
    }
    refreshClock() {
        var seconds = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        if (seconds != this.currentSeconds) {
            this.currentSeconds = seconds;
            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds - (hours * 3600)) / 60);
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
        let gw = 0;
        let isInMetric = BaseAirliners.unitIsMetric(Aircraft.A320_NEO);
        if (isInMetric) {
            gw = Math.round(SimVar.GetSimVarValue("TOTAL WEIGHT", "kg"));
            if (this.gwUnit)
                this.gwUnit.textContent = "KG";
        }
        else {
            gw = Math.round(SimVar.GetSimVarValue("TOTAL WEIGHT", "lbs"));
            if (this.gwUnit)
                this.gwUnit.textContent = "LBS";
        }
        if ((gw != this.currentGW) || _force) {
            this.currentGW = gw;
            if (this.gwValue != null) {
                this.gwValue.textContent = this.currentGW.toString();
            }
        }
    }
    refreshADIRS() {
        if (this.tatText != null && this.satText != null) {
            if (SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum") != 2) {
                this.tatText.textContent = "XX";
                this.tatText.setAttribute("fill", "#db7200");
                this.satText.textContent = "XX";
                this.satText.setAttribute("fill", "#db7200");
            } else {
                this.tatText.setAttribute("fill", "green");
                this.satText.setAttribute("fill", "green");
            }
        }
    }
}
customElements.define("eicas-common-display", EICASCommonDisplay);
//# sourceMappingURL=EICAS_Common.js.map