class A320_Neo_RTPI extends BaseAirliners {
    constructor() {
        super();
    }
    get templateID() {
        return "A320_Neo_RTPI";
    }
    connectedCallback() {
        super.connectedCallback();
        this.valueText = this.querySelector("#Value");
        this.directionText = this.querySelector("#Direction");
        this.refreshValue(0, true);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this.refreshValue(SimVar.GetSimVarValue("RUDDER TRIM", "degrees"));
    }
    refreshValue(_value, _force = false) {
        if ((_value != this.currentValue) || _force) {
            this.currentValue = _value;
            if (this.valueText != null) {
                this.valueText.textContent = Math.abs(this.currentValue).toFixed(1);
            }
            if (this.directionText != null) {
                if (this.currentValue > 0) {
                    this.directionText.textContent = "R";
                } else if (this.currentValue < 0) {
                    this.directionText.textContent = "L";
                } else {
                    this.directionText.textContent = "";
                }
            }
        }
    }
}
registerInstrument("a320-neo-rtpi", A320_Neo_RTPI);
//# sourceMappingURL=A320_Neo_RTPI.js.map