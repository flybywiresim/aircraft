class ElevTrimGauge extends AbstractGauge {
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
        this.root.setAttribute("viewBox", "0 0 50 130");
        this.root.setAttribute("overflow", "visible");
        this.appendChild(this.root);
        const elevText = document.createElementNS(Avionics.SVG.NS, "text");
        elevText.setAttribute("x", "15");
        elevText.setAttribute("y", "12");
        elevText.textContent = "ELEV";
        elevText.setAttribute("fill", "white");
        elevText.setAttribute("font-size", "12");
        this.root.appendChild(elevText);
        const verticalBar = document.createElementNS(Avionics.SVG.NS, "rect");
        verticalBar.setAttribute("x", "40");
        verticalBar.setAttribute("y", "18");
        verticalBar.setAttribute("height", "100");
        verticalBar.setAttribute("width", "2");
        verticalBar.setAttribute("fill", "white");
        this.root.appendChild(verticalBar);
        const topBar = document.createElementNS(Avionics.SVG.NS, "rect");
        topBar.setAttribute("x", "30");
        topBar.setAttribute("y", "18");
        topBar.setAttribute("height", "2");
        topBar.setAttribute("width", "10");
        topBar.setAttribute("fill", "white");
        this.root.appendChild(topBar);
        const dnText = document.createElementNS(Avionics.SVG.NS, "text");
        dnText.setAttribute("x", "10");
        dnText.setAttribute("y", "24");
        dnText.textContent = "DN";
        dnText.setAttribute("fill", "white");
        dnText.setAttribute("font-size", "12");
        this.root.appendChild(dnText);
        const BottomBar = document.createElementNS(Avionics.SVG.NS, "rect");
        BottomBar.setAttribute("x", "30");
        BottomBar.setAttribute("y", "116");
        BottomBar.setAttribute("height", "2");
        BottomBar.setAttribute("width", "10");
        BottomBar.setAttribute("fill", "white");
        this.root.appendChild(BottomBar);
        const upText = document.createElementNS(Avionics.SVG.NS, "text");
        upText.setAttribute("x", "10");
        upText.setAttribute("y", "124");
        upText.textContent = "UP";
        upText.setAttribute("fill", "white");
        upText.setAttribute("font-size", "12");
        this.root.appendChild(upText);
        const greenBar = document.createElementNS(Avionics.SVG.NS, "rect");
        greenBar.setAttribute("x", "35");
        greenBar.setAttribute("y", (18 + this._greenStartPercent * 100).toString());
        greenBar.setAttribute("height", (this._greenEndPercent * 100 - this._greenStartPercent * 100).toString());
        greenBar.setAttribute("width", "5");
        greenBar.setAttribute("fill", "green");
        this.root.appendChild(greenBar);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this.cursor.setAttribute("d", "M30 14 L35 14 L40 18 L35 22 L30 22 Z");
        this.cursor.setAttribute("fill", "aqua");
        this.root.appendChild(this.cursor);
        this._updateValueSvg();
    }
    _drawBase() {
        throw new Error("Elev trim Gauge not implemented in Canvas");
    }
    _updateValueSvg() {
        this.cursor.setAttribute("transform", "translate(0 " + this._valuePercent * 100 + ")");
    }
    _drawCursor() {
        throw new Error("Elev trim Gauge not implemented in Canvas");
    }
    connectedCallback() {
        this._redrawSvg();
    }
}
customElements.define('elev-trim-gauge', ElevTrimGauge);
//# sourceMappingURL=ElevTrimGauge.js.map