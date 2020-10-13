class VerticalSpeedIndicator extends HTMLElement {
    static get observedAttributes() {
        return [
            "vspeed"
        ];
    }
    constructor() {
        super();
    }
    connectedCallback() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 -25 100 550");
        this.appendChild(this.root);
        const background = document.createElementNS(Avionics.SVG.NS, "path");
        background.setAttribute("d", "M0 0 L0 500 L75 500 L75 300 L10 250 L75 200 L75 0 Z");
        background.setAttribute("fill", "#1a1d21");
        background.setAttribute("fill-opacity", "0.25");
        this.root.appendChild(background);
        const dashes = [-200, -150, -100, -50, 50, 100, 150, 200];
        const height = 3;
        const width = 10;
        const fontSize = 30;
        for (let i = 0; i < dashes.length; i++) {
            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", "0");
            rect.setAttribute("y", (250 - dashes[i] - height / 2).toString());
            rect.setAttribute("height", height.toString());
            rect.setAttribute("width", ((dashes[i] % 100) == 0 ? 2 * width : width).toString());
            rect.setAttribute("fill", "white");
            this.root.appendChild(rect);
            if ((dashes[i] % 100) == 0) {
                const text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = (dashes[i] / 100).toString();
                text.setAttribute("y", ((250 - dashes[i] - height / 2) + fontSize / 3).toString());
                text.setAttribute("x", (3 * width).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", fontSize.toString());
                text.setAttribute("font-family", "Roboto-Bold");
                this.root.appendChild(text);
            }
        }
        {
            this.indicator = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.indicator);
            const indicatorBackground = document.createElementNS(Avionics.SVG.NS, "path");
            indicatorBackground.setAttribute("d", "M10 250 L35 275 L130 275 L130 225 L35 225 Z");
            indicatorBackground.setAttribute("fill", "#1a1d21");
            this.indicator.appendChild(indicatorBackground);
            this.indicatorText = document.createElementNS(Avionics.SVG.NS, "text");
            this.indicatorText.textContent = "-0000";
            this.indicatorText.setAttribute("x", "35");
            this.indicatorText.setAttribute("y", "260");
            this.indicatorText.setAttribute("fill", "white");
            this.indicatorText.setAttribute("font-size", fontSize.toString());
            this.indicatorText.setAttribute("font-family", "Roboto-Bold");
            this.indicator.appendChild(this.indicatorText);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "vspeed":
                const vSpeed = parseFloat(newValue);
                this.indicator.setAttribute("transform", "translate(0, " + -Math.max(Math.min(vSpeed, 2500), -2500) / 10 + ")");
                this.indicatorText.textContent = Math.abs(vSpeed) >= 100 ? fastToFixed(vSpeed, 0) : "";
                break;
        }
    }
}
customElements.define('glasscockpit-vertical-speed-indicator', VerticalSpeedIndicator);
//# sourceMappingURL=VerticalSpeedIndicator.js.map