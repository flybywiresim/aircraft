class CDI extends HTMLElement {
    constructor() {
        super(...arguments);
        this.deviation = 0;
        this.isFrom = false;
        this.scale = 5;
    }
    static get observedAttributes() {
        return [
            "deviation",
            "scale",
            "toFrom",
            "active"
        ];
    }
    connectedCallback() {
        this.createSVG();
    }
    createSVG() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 100 15");
        this.appendChild(this.root);
        const background = document.createElementNS(Avionics.SVG.NS, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", "100");
        background.setAttribute("height", "15");
        background.setAttribute("fill", "#1a1d21");
        background.setAttribute("fill-opacity", "0.25");
        background.setAttribute("stroke", "white");
        background.setAttribute("stroke-width", "0.75");
        this.root.appendChild(background);
        for (let i = -4; i <= 4; i++) {
            if (i != 0) {
                const circle = document.createElementNS(Avionics.SVG.NS, "circle");
                circle.setAttribute("cx", (50 + 10 * i).toString());
                circle.setAttribute("cy", "7.5");
                circle.setAttribute("r", "2");
                circle.setAttribute("fill", "none");
                circle.setAttribute("stroke", "white");
                circle.setAttribute("stroke-width", "0.5");
                this.root.appendChild(circle);
            }
        }
        const centerLine = document.createElementNS(Avionics.SVG.NS, "rect");
        centerLine.setAttribute("x", "49.75");
        centerLine.setAttribute("y", "0");
        centerLine.setAttribute("width", "0.5");
        centerLine.setAttribute("height", "15");
        centerLine.setAttribute("fill", "white");
        this.root.appendChild(centerLine);
        const autoText = document.createElementNS(Avionics.SVG.NS, "text");
        autoText.setAttribute("fill", "white");
        autoText.setAttribute("text-anchor", "middle");
        autoText.setAttribute("x", "10");
        autoText.setAttribute("y", "14");
        autoText.setAttribute("font-size", "5");
        autoText.setAttribute("font-family", "Roboto-Bold");
        autoText.textContent = "AUTO";
        this.root.appendChild(autoText);
        this.scaleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.scaleText.setAttribute("fill", "white");
        this.scaleText.setAttribute("text-anchor", "middle");
        this.scaleText.setAttribute("x", "90");
        this.scaleText.setAttribute("y", "14");
        this.scaleText.setAttribute("font-size", "5");
        this.scaleText.setAttribute("font-family", "Roboto-Bold");
        this.scaleText.textContent = "5NM";
        this.root.appendChild(this.scaleText);
        this.deviationIndicator = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.deviationIndicator.setAttribute("points", "45,12.5 55,12.5 50,2.5");
        this.deviationIndicator.setAttribute("fill", "magenta");
        this.deviationIndicator.setAttribute("stroke", "black");
        this.deviationIndicator.setAttribute("stroke-width", "0.25");
        this.deviationIndicator.setAttribute("transform-origin", "center");
        this.root.appendChild(this.deviationIndicator);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "deviation":
                this.deviation = parseFloat(newValue);
                this.updateDeviation();
                break;
            case "scale":
                this.scale = parseFloat(newValue);
                this.scaleText.textContent = newValue + "NM";
                this.updateDeviation();
                break;
            case "toFrom":
                if (newValue == "From") {
                    this.isFrom = true;
                } else {
                    this.isFrom = false;
                }
                this.updateDeviation();
                break;
            case "active":
                if (newValue == "True") {
                    this.deviationIndicator.setAttribute("visibility", "");
                } else {
                    this.deviationIndicator.setAttribute("visibility", "hidden");
                }
                break;
        }
    }
    updateDeviation() {
        this.deviationIndicator.setAttribute("transform", "translate(" + Math.max(-40, Math.min(40, 40 * this.deviation / this.scale)) + ", 0)" + (this.isFrom ? " scale(1,-1)" : ""));
    }
}
customElements.define('glasscockpit-cdi', CDI);
//# sourceMappingURL=CDI.js.map