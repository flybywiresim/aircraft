class VerticalGauge extends AbstractGauge {
    _redrawSvg() {
        console.warn("Redraw Vertical Gauge. This should not happen every frame.");
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        const svg = document.createElementNS(Avionics.SVG.NS, "svg");
        svg.setAttribute("overflow", "visible");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 100 100");
        this.appendChild(svg);
        const dashes = document.createElementNS(Avionics.SVG.NS, "line");
        dashes.classList.add("gauge-base");
        dashes.classList.add("vertical-gauge-base");
        dashes.setAttribute("x1", "5");
        dashes.setAttribute("y1", "0");
        dashes.setAttribute("x2", "5");
        dashes.setAttribute("y2", "100");
        dashes.setAttribute("fill", "none");
        dashes.setAttribute("stroke", "white");
        dashes.setAttribute("stroke-width", "10px");
        dashes.setAttribute("stroke-dashoffset", "1");
        dashes.setAttribute("stroke-dasharray", "1 " + (101 - this._stepsCount) / (this._stepsCount));
        svg.appendChild(dashes);
        if (this._lowRedLengthPercent > 0) {
            const lowRedRect = document.createElementNS(Avionics.SVG.NS, "rect");
            lowRedRect.setAttribute("x", "0");
            lowRedRect.setAttribute("y", fastToFixed((100 - this._lowRedEndPercent), 2));
            lowRedRect.setAttribute("width", "6");
            lowRedRect.setAttribute("height", fastToFixed(Math.max(this._lowRedEndPercent - this._lowRedStartPercent, 0), 2));
            lowRedRect.setAttribute("fill", "red");
            svg.appendChild(lowRedRect);
        }
        if (this._lowYellowLengthPercent > 0) {
            const lowYellowRect = document.createElementNS(Avionics.SVG.NS, "rect");
            lowYellowRect.setAttribute("x", "0");
            lowYellowRect.setAttribute("y", fastToFixed((100 - this._lowYellowEndPercent), 2));
            lowYellowRect.setAttribute("width", "6");
            lowYellowRect.setAttribute("height", fastToFixed(Math.max(this._lowYellowEndPercent - this._lowYellowStartPercent, 0), 2));
            lowYellowRect.setAttribute("fill", "yellow");
            svg.appendChild(lowYellowRect);
        }
        if (this._greenLengthPercent > 0) {
            const greenRect = document.createElementNS(Avionics.SVG.NS, "rect");
            greenRect.setAttribute("x", "0");
            greenRect.setAttribute("y", fastToFixed((100 - this._greenEndPercent), 2));
            greenRect.setAttribute("width", "6");
            greenRect.setAttribute("height", fastToFixed(Math.max(this._greenEndPercent - this._greenStartPercent, 0), 2));
            greenRect.setAttribute("fill", "green");
            svg.appendChild(greenRect);
        }
        if (this._yellowLengthPercent > 0) {
            const yellowRect = document.createElementNS(Avionics.SVG.NS, "rect");
            yellowRect.setAttribute("x", "0");
            yellowRect.setAttribute("y", fastToFixed((100 - this._yellowEndPercent), 2));
            yellowRect.setAttribute("width", "6");
            yellowRect.setAttribute("height", fastToFixed(Math.max(this._yellowEndPercent - this._yellowStartPercent, 0), 2));
            yellowRect.setAttribute("fill", "yellow");
            svg.appendChild(yellowRect);
        }
        if (this._redLengthPercent > 0) {
            const redRect = document.createElementNS(Avionics.SVG.NS, "rect");
            redRect.setAttribute("x", "0");
            redRect.setAttribute("y", fastToFixed((100 - this._redEndPercent), 2));
            redRect.setAttribute("width", "6");
            redRect.setAttribute("height", fastToFixed(Math.max(this._redEndPercent - this._redStartPercent, 0), 2));
            redRect.setAttribute("fill", "red");
            svg.appendChild(redRect);
        }
        this._cursorRect = document.createElementNS(Avionics.SVG.NS, "rect");
        this._cursorRect.classList.add("gauge-cursor");
        this._cursorRect.classList.add("vertical-gauge-cursor");
        this._cursorRect.setAttribute("x", "17");
        this._cursorRect.setAttribute("width", "8");
        this._cursorRect.setAttribute("fill", "white");
        svg.appendChild(this._cursorRect);
        this._cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this._cursor.classList.add("gauge-cursor");
        this._cursor.classList.add("vertical-gauge-cursor");
        this._cursor.setAttribute("fill", "white");
        svg.appendChild(this._cursor);
        const verticalGauge = document.createElementNS(Avionics.SVG.NS, "path");
        const d = "M 13 0 L 0 0 L 0 100 L 13 100";
        verticalGauge.classList.add("gauge-base");
        verticalGauge.classList.add("vertical-gauge-base");
        verticalGauge.setAttribute("d", d);
        verticalGauge.setAttribute("fill", "none");
        verticalGauge.setAttribute("stroke", "white");
        svg.appendChild(verticalGauge);
        this._updateValue();
    }
    _updateValueSvg() {
        const cursorPercent = (this._value - this._minValue) / this._amplitude * 100;
        const cursorPath = "M 9 " + (100 - cursorPercent) + " L 17 " + (100 - cursorPercent) + " L 17 " + Math.min(108 - cursorPercent, 100) + " Z";
        const t0 = performance.now();
        this._cursorRect.setAttribute("y", fastToFixed((100 - cursorPercent), 2));
        this._cursorRect.setAttribute("height", fastToFixed(Math.max(cursorPercent, 0), 2));
        this._cursor.setAttribute("d", cursorPath);
        const t = performance.now() - t0;
        if (t > 0) {
        }
    }
    _drawBase() {
        const w = this._canvasBase.width - 2;
        const h = this._canvasBase.height - 2;
        if (w < 1 || h < 1) {
            return;
        }
        const step = h / this._stepsCount;
        for (let i = 1; i < this._stepsCount; i++) {
            CircularGauge.DrawLineFromTo(this._canvasBaseContext, 1, i * step, h * 0.07, i * step);
            this._canvasBaseContext.strokeStyle = "white";
            this._canvasBaseContext.stroke();
        }
        if (this._lowRedLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "red";
            this._canvasBaseContext.fillRect(1, h * (1 - this._lowRedEndPercent), h * 0.05, this._lowRedLengthPercent * h);
        }
        if (this._lowYellowLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "yellow";
            this._canvasBaseContext.fillRect(1, h * (1 - this._lowYellowEndPercent), h * 0.05, this._lowYellowLengthPercent * h);
        }
        if (this._greenLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "green";
            this._canvasBaseContext.fillRect(1, h * (1 - this._greenEndPercent), h * 0.05, this._greenLengthPercent * h);
        }
        if (this._yellowLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "yellow";
            this._canvasBaseContext.fillRect(1, h * (1 - this._yellowEndPercent), h * 0.05, this._yellowLengthPercent * h);
        }
        if (this._redLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "red";
            this._canvasBaseContext.fillRect(1, h * (1 - this._redEndPercent), h * 0.05, this._redLengthPercent * h);
        }
        if (isFinite(this._limitLow)) {
            CircularGauge.DrawLineFromTo(this._canvasBaseContext, this._limitLowPercent * w, h - w * 0.1, this._limitLowPercent * w, h);
            this._canvasBaseContext.strokeStyle = "red";
            this._canvasBaseContext.lineWidth = 3;
            this._canvasBaseContext.stroke();
        }
        if (isFinite(this._limitHigh)) {
            CircularGauge.DrawLineFromTo(this._canvasBaseContext, this._limitHighPercent * w, h - w * 0.1, this._limitHighPercent * w, h);
            this._canvasBaseContext.strokeStyle = "red";
            this._canvasBaseContext.lineWidth = 3;
            this._canvasBaseContext.stroke();
        }
        this._canvasBaseContext.beginPath();
        this._canvasBaseContext.moveTo(h * 0.1, 1);
        this._canvasBaseContext.lineTo(1, 1);
        this._canvasBaseContext.lineTo(1, h);
        this._canvasBaseContext.lineTo(h * 0.1, h);
        this._canvasBaseContext.strokeStyle = "white";
        this._canvasBaseContext.lineWidth = 2;
        this._canvasBaseContext.stroke();
    }
    get _cursorPercent() {
        return (this._value - this._minValue) / this._amplitude;
    }
    _drawCursor() {
        const w = this._canvasCursor.width - 2;
        const h = this._canvasCursor.height - 2;
        if (w < 1 || h < 1) {
            return;
        }
        const s = h / 30;
        const cursorX = h / 5;
        this._canvasCursorContext.beginPath();
        this._canvasCursorContext.moveTo(0 + cursorX, -s + (1 - this._cursorPercent) * h);
        this._canvasCursorContext.lineTo(0 + cursorX, s + (1 - this._cursorPercent) * h);
        this._canvasCursorContext.lineTo(-2 * s + cursorX, s + (1 - this._cursorPercent) * h);
        this._canvasCursorContext.lineTo(-3 * s + cursorX, 0 + (1 - this._cursorPercent) * h);
        this._canvasCursorContext.lineTo(-2 * s + cursorX, -s + (1 - this._cursorPercent) * h);
        this._canvasCursorContext.lineTo(0 + cursorX, -s + (1 - this._cursorPercent) * h);
        this._canvasCursorContext.fillStyle = "white";
        this._canvasCursorContext.fill();
        this._canvasCursorContext.textAlign = "right";
        this._canvasCursorContext.font = fastToFixed((this.fontSize * 1.3), 0) + "px sans-serif";
        this._canvasCursorContext.fillStyle = this.getCurrentColor();
        this._canvasCursorContext.fillText(fastToFixed(this._value, this._valuePrecision), w + 2, 18);
    }
}
customElements.define('vertical-gauge', VerticalGauge);
//# sourceMappingURL=VerticalGauge.js.map