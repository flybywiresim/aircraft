class AOAIndicator extends HTMLElement {
    constructor() {
        super();
        this.redPercent = 17;
        this.whiteBarAngle = 50;
    }
    static get observedAttributes() {
        return [
            "aoa"
        ];
    }
    connectedCallback() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 100 100");
        this.appendChild(this.root);
        const background = document.createElementNS(Avionics.SVG.NS, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", "100");
        background.setAttribute("height", "100");
        background.setAttribute("fill", "#1a1d21");
        background.setAttribute("fill-opacity", "0.25");
        this.root.appendChild(background);
        const whiteCircle = document.createElementNS(Avionics.SVG.NS, "path");
        whiteCircle.setAttribute("d", "M10 90 A80 80 0 0 1 90 10 ");
        whiteCircle.setAttribute("fill", "none");
        whiteCircle.setAttribute("stroke", "white");
        whiteCircle.setAttribute("stroke-width", "4");
        this.root.appendChild(whiteCircle);
        const angleBegin = Math.PI * (1.5 - this.redPercent / 200);
        const xBegin = 90 + 80 * Math.cos(angleBegin);
        const yBegin = 90 + 80 * Math.sin(angleBegin);
        const redCircle = document.createElementNS(Avionics.SVG.NS, "path");
        redCircle.setAttribute("d", "M" + xBegin + " " + yBegin + " A80 80 0 0 1 90 10 ");
        redCircle.setAttribute("fill", "none");
        redCircle.setAttribute("stroke", "red");
        redCircle.setAttribute("stroke-width", "4");
        this.root.appendChild(redCircle);
        const whiteBar = document.createElementNS(Avionics.SVG.NS, "rect");
        whiteBar.setAttribute("x", "-10");
        whiteBar.setAttribute("y", "90");
        whiteBar.setAttribute("width", "15");
        whiteBar.setAttribute("height", "2");
        whiteBar.setAttribute("fill", "white");
        whiteBar.setAttribute("transform", "rotate(" + this.whiteBarAngle + " 90 90)");
        this.root.appendChild(whiteBar);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor.setAttribute("points", "10,90 30,82.5 30,97.5");
        this.cursor.setAttribute("fill", "white");
        this.cursor.setAttribute("stroke", "black");
        this.root.appendChild(this.cursor);
        const AOAText = document.createElementNS(Avionics.SVG.NS, "text");
        AOAText.setAttribute("x", "60");
        AOAText.setAttribute("y", "70");
        AOAText.setAttribute("fill", "white");
        AOAText.setAttribute("font-size", "17");
        AOAText.setAttribute("font-family", "Roboto-Bold");
        AOAText.textContent = "AOA";
        this.root.appendChild(AOAText);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "aoa":
                const value = parseFloat(newValue);
                Avionics.Utils.diffAndSetAttribute(this.cursor, "transform", "rotate(" + (50 + value / 16 * (value < 0 ? 50 : 40)) + " 90 90)");
                Avionics.Utils.diffAndSetAttribute(this.cursor, "fill", ((50 + value / 16 * 40) > (90 - this.redPercent) ? "red" : "white"));
                break;
        }
    }
}
customElements.define('glasscockpit-aoa-indicator', AOAIndicator);
//# sourceMappingURL=AngleOfAttackIndicator.js.map