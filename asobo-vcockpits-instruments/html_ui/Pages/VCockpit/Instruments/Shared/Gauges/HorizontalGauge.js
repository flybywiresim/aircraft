class HorizontalGauge extends AbstractGauge {
    get _cursorPercent() {
        return (this._value - this._minValue) / this._amplitude;
    }
    _redrawSvg() {
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
        dashes.setAttribute("x1", "0");
        dashes.setAttribute("y1", "15");
        dashes.setAttribute("x2", "100");
        dashes.setAttribute("y2", "15");
        dashes.setAttribute("fill", "none");
        dashes.setAttribute("stroke", "white");
        dashes.setAttribute("stroke-width", "10px");
        dashes.setAttribute("stroke-dashoffset", "1");
        dashes.setAttribute("stroke-dasharray", "1 " + (101 - this._stepsCount) / (this._stepsCount));
        svg.appendChild(dashes);
        if (this._lowRedLengthPercent > 0) {
            const lowRedRect = document.createElementNS(Avionics.SVG.NS, "rect");
            lowRedRect.setAttribute("x", fastToFixed((this._lowRedStartPercent * 100), 2));
            lowRedRect.setAttribute("y", "14");
            lowRedRect.setAttribute("width", fastToFixed(Math.max(this._lowRedLengthPercent * 100, 0), 2));
            lowRedRect.setAttribute("height", "6");
            lowRedRect.setAttribute("fill", "red");
            svg.appendChild(lowRedRect);
        }
        if (this._lowYellowLengthPercent > 0) {
            const lowYellowRect = document.createElementNS(Avionics.SVG.NS, "rect");
            lowYellowRect.setAttribute("x", fastToFixed((this._lowYellowStartPercent * 100), 2));
            lowYellowRect.setAttribute("y", "14");
            lowYellowRect.setAttribute("width", fastToFixed(Math.max(this._lowYellowLengthPercent * 100, 0), 2));
            lowYellowRect.setAttribute("height", "6");
            lowYellowRect.setAttribute("fill", "yellow");
            svg.appendChild(lowYellowRect);
        }
        if (this._greenLengthPercent > 0) {
            const greenRect = document.createElementNS(Avionics.SVG.NS, "rect");
            greenRect.setAttribute("x", fastToFixed((this._greenStartPercent * 100), 2));
            greenRect.setAttribute("y", "14");
            greenRect.setAttribute("width", fastToFixed(Math.max(this._greenLengthPercent * 100, 0), 2));
            greenRect.setAttribute("height", "6");
            greenRect.setAttribute("fill", "green");
            svg.appendChild(greenRect);
        }
        if (this._yellowLengthPercent > 0) {
            const yellowRect = document.createElementNS(Avionics.SVG.NS, "rect");
            yellowRect.setAttribute("x", fastToFixed((this._yellowStartPercent * 100), 2));
            yellowRect.setAttribute("y", "14");
            yellowRect.setAttribute("width", fastToFixed(Math.max(this._yellowLengthPercent * 100, 0), 2));
            yellowRect.setAttribute("height", "6");
            yellowRect.setAttribute("fill", "yellow");
            svg.appendChild(yellowRect);
        }
        if (this._redLengthPercent > 0) {
            const redRect = document.createElementNS(Avionics.SVG.NS, "rect");
            redRect.setAttribute("x", fastToFixed((this._redStartPercent * 100), 2));
            redRect.setAttribute("y", "14");
            redRect.setAttribute("width", fastToFixed(Math.max(this._redLengthPercent * 100, 0), 2));
            redRect.setAttribute("height", "6");
            redRect.setAttribute("fill", "red");
            svg.appendChild(redRect);
        }
        if (isFinite(this._limitLowPercent)) {
            const limitLowRect = document.createElementNS(Avionics.SVG.NS, "path");
            let d = "M " + fastToFixed((this._limitLowPercent * 100), 2) + " 10";
            d += " L " + fastToFixed((this._limitLowPercent * 100), 2) + " 20";
            limitLowRect.setAttribute("d", d);
            limitLowRect.setAttribute("fill", "none");
            limitLowRect.setAttribute("stroke", "red");
            limitLowRect.setAttribute("stroke-width", "2px");
            svg.appendChild(limitLowRect);
        }
        if (isFinite(this._limitHighPercent)) {
            const limitHighRect = document.createElementNS(Avionics.SVG.NS, "path");
            let d = "M " + fastToFixed((this._limitHighPercent * 100), 2) + " 10";
            d += " L " + fastToFixed((this._limitHighPercent * 100), 2) + " 20";
            limitHighRect.setAttribute("d", d);
            limitHighRect.setAttribute("fill", "none");
            limitHighRect.setAttribute("stroke", "red");
            limitHighRect.setAttribute("stroke-width", "2px");
            svg.appendChild(limitHighRect);
        }
        this._cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this._cursor.classList.add("gauge-cursor");
        this._cursor.classList.add("horizontal-gauge-cursor");
        this._cursor.setAttribute("fill", "white");
        this._cursor.setAttribute("stroke", "black");
        const cursorPath = "M -4 0 L 4 0 L 4 8 L 0 12 L -4 8 Z";
        this._cursor.setAttribute("d", cursorPath);
        svg.appendChild(this._cursor);
        const horizontalGauge = document.createElementNS(Avionics.SVG.NS, "path");
        const d = "M 0 7 L 0 20 L 100 20 L 100 7";
        horizontalGauge.classList.add("gauge-base");
        horizontalGauge.classList.add("horizontal-gauge-base");
        horizontalGauge.setAttribute("d", d);
        horizontalGauge.setAttribute("fill", "none");
        horizontalGauge.setAttribute("stroke", "black");
        svg.appendChild(horizontalGauge);
        this._updateValue();
    }
    _updateValueSvg() {
        const cursorPercent = this._cursorPercent * 100;
        this._cursor.setAttribute("transform", "translate(" + cursorPercent + " 0)");
    }
    _drawBase() {
        const w = this._canvasBase.width - 2;
        const h = this._canvasBase.height - 2;
        if (w < 1 || h < 1) {
            return;
        }
        const step = w / this._stepsCount;
        for (let i = 1; i < this._stepsCount; i++) {
            CircularGauge.DrawLineFromTo(this._canvasBaseContext, i * step, h - w * 0.07, i * step, h);
            this._canvasBaseContext.strokeStyle = "white";
            this._canvasBaseContext.stroke();
        }
        if (this._lowRedLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "red";
            this._canvasBaseContext.fillRect(this._lowRedStartPercent * w, h - w * 0.05, this._lowRedLengthPercent * w, w * 0.05);
        }
        if (this._lowYellowLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "yellow";
            this._canvasBaseContext.fillRect(this._lowYellowStartPercent * w, h - w * 0.05, this._lowYellowLengthPercent * w, w * 0.05);
        }
        if (this._greenLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "green";
            this._canvasBaseContext.fillRect(this._greenStartPercent * w, h - w * 0.05, this._greenLengthPercent * w, w * 0.05);
        }
        if (this._yellowLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "yellow";
            this._canvasBaseContext.fillRect(this._yellowStartPercent * w, h - w * 0.05, this._yellowLengthPercent * w, w * 0.05);
        }
        if (this._redLengthPercent > 0) {
            this._canvasBaseContext.fillStyle = "red";
            this._canvasBaseContext.fillRect(this._redStartPercent * w, h - w * 0.05, this._redLengthPercent * w, w * 0.05);
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
        this._canvasBaseContext.textAlign = "left";
        this._canvasBaseContext.font = fastToFixed(this.fontSize, 0) + "px Roboto";
        this._canvasBaseContext.fillStyle = "white";
        this._canvasBaseContext.fillText(this._title + " " + this._unit, 0, (this.isTextUpScaled ? h - 30 : h - 26));
        this._canvasBaseContext.beginPath();
        this._canvasBaseContext.moveTo(1, h - w * 0.1);
        this._canvasBaseContext.lineTo(1, h);
        this._canvasBaseContext.lineTo(w, h);
        this._canvasBaseContext.lineTo(w, h - w * 0.1);
        this._canvasBaseContext.strokeStyle = "white";
        this._canvasBaseContext.lineWidth = 2;
        this._canvasBaseContext.stroke();
    }
    _drawCursor() {
        const w = this._canvasCursor.width - 2;
        const h = this._canvasCursor.height - 2;
        if (w < 1 || h < 1) {
            return;
        }
        const s = w / 30;
        const cursorY = h - w / 10 - 2 * s;
        this._canvasCursorContext.beginPath();
        this._canvasCursorContext.moveTo(-s + this._cursorPercent * w, 0 + cursorY);
        this._canvasCursorContext.lineTo(s + this._cursorPercent * w, 0 + cursorY);
        this._canvasCursorContext.lineTo(s + this._cursorPercent * w, 2 * s + cursorY);
        this._canvasCursorContext.lineTo(0 + this._cursorPercent * w, 3 * s + cursorY);
        this._canvasCursorContext.lineTo(-s + this._cursorPercent * w, 2 * s + cursorY);
        this._canvasCursorContext.lineTo(-s + this._cursorPercent * w, 0 + cursorY);
        this._canvasCursorContext.fillStyle = "white";
        this._canvasCursorContext.fill();
        this._canvasCursorContext.textAlign = "right";
        this._canvasCursorContext.font = fastToFixed((this.fontSize * 1.3), 0) + "px sans-serif";
        this._canvasCursorContext.fillStyle = this.getCurrentColor();
        this._canvasCursorContext.fillText(fastToFixed(this._value, this._valuePrecision), w, (this.isTextUpScaled ? h - 13 : h - 26));
    }
}
customElements.define('horizontal-gauge', HorizontalGauge);
//# sourceMappingURL=HorizontalGauge.js.map