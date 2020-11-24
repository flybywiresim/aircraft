class FlapsGauge extends AbstractGauge {
    constructor() {
        super();
        this.takeOffValue = 10;
        this.forceSvg = true;
    }
    _redrawSvg() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 100 50");
        this.root.setAttribute("overflow", "visible");
        this.appendChild(this.root);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this.cursor.setAttribute("d", "M10 10 Q25 0 60 10 Q25 20 10 10");
        this.cursor.setAttribute("fill", "aqua");
        this.root.appendChild(this.cursor);
        const angles = [this._minValue, this.takeOffValue, this._maxValue];
        const texts = ["UP", "T/O", "LDG"];
        for (let i = 0; i < angles.length; i++) {
            const graduation = document.createElementNS(Avionics.SVG.NS, "rect");
            graduation.setAttribute("x", "60");
            graduation.setAttribute("y", "10");
            graduation.setAttribute("height", "1");
            graduation.setAttribute("width", "10");
            graduation.setAttribute("fill", "white");
            graduation.setAttribute("transform", "rotate(" + angles[i] + " 10 10)");
            this.root.appendChild(graduation);
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            const radAngle = angles[i] * Math.PI / 180;
            text.setAttribute("x", (10 + 65 * Math.cos(radAngle)).toString());
            text.setAttribute("y", (15 + 65 * Math.sin(radAngle)).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "10");
            text.textContent = texts[i];
            this.root.appendChild(text);
        }
        const flapsText = document.createElementNS(Avionics.SVG.NS, "text");
        flapsText.setAttribute("x", "5");
        flapsText.setAttribute("y", "45");
        flapsText.setAttribute("fill", "white");
        flapsText.setAttribute("font-size", "12");
        flapsText.textContent = "FLAPS";
        this.root.appendChild(flapsText);
        this._updateValueSvg();
    }
    _drawBase() {
        throw new Error("Flaps Gauge not implemented in Canvas");
    }
    _updateValueSvg() {
        this.cursor.setAttribute("transform", "rotate(" + this._value + " 10 10)");
    }
    _drawCursor() {
        throw new Error("Flaps Gauge not implemented in Canvas");
    }
    static get observedAttributes() {
        return [
            "value",
            "min-value",
            "take-off-value",
            "max-value"
        ];
    }
    connectedCallback() {
        this._redrawSvg();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        super.attributeChangedCallback(name, oldValue, newValue);
        switch (name) {
            case "take-off-value":
                this.takeOffValue = parseFloat(newValue);
                this._redrawSvg();
                break;
        }
    }
}
customElements.define('flaps-gauge', FlapsGauge);
//# sourceMappingURL=FlapsGauge.js.map