class CircularGauge extends AbstractGauge {
    get _startAngle() {
        return Math.PI + this._tilt * Avionics.Utils.DEG2RAD;
    }
    get _endAngle() {
        return this._startAngle + this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _cursorAngle() {
        return this._startAngle + ((this._value - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _limitLowAngle() {
        return this._startAngle + ((this._limitLow - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _limitHighAngle() {
        return this._startAngle + ((this._limitHigh - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _lowRedStartAngle() {
        return this._startAngle + ((this._lowRedStartValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _lowRedEndAngle() {
        return this._startAngle + ((this._lowRedEndValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _lowYellowStartAngle() {
        return this._startAngle + ((this._lowYellowStartValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _lowYellowEndAngle() {
        return this._startAngle + ((this._lowYellowEndValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _greenStartAngle() {
        return this._startAngle + ((this._greenStartValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _greenEndAngle() {
        return this._startAngle + ((this._greenEndValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _yellowStartAngle() {
        return this._startAngle + ((this._yellowStartValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _yellowEndAngle() {
        return this._startAngle + ((this._yellowEndValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _redStartAngle() {
        return this._startAngle + ((this._redStartValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    get _redEndAngle() {
        return this._startAngle + ((this._redEndValue - this._minValue) / this._amplitude) * this._angularSize * Avionics.Utils.DEG2RAD;
    }
    constructor() {
        super();
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
        const circularGauge = document.createElementNS(Avionics.SVG.NS, "path");
        const d = "M 13 50 L 0 50 A 50 50 0 0 1 100 50 L 87 50";
        circularGauge.classList.add("gauge-base");
        circularGauge.classList.add("circular-gauge-base");
        circularGauge.setAttribute("d", d);
        circularGauge.setAttribute("fill", "none");
        circularGauge.setAttribute("stroke", "black");
        svg.appendChild(circularGauge);
        const circularDashes = document.createElementNS(Avionics.SVG.NS, "path");
        const circularDashesPath = "M 5 50 A 45 45 0 0 1 95 50";
        circularDashes.classList.add("gauge-base");
        circularDashes.classList.add("circular-gauge-base");
        circularDashes.setAttribute("d", circularDashesPath);
        circularDashes.setAttribute("fill", "none");
        circularDashes.setAttribute("stroke", "white");
        circularDashes.setAttribute("stroke-width", "10");
        circularDashes.setAttribute("stroke-dashoffset", "1");
        circularDashes.setAttribute("stroke-dasharray", "1 " + (142 - this._stepsCount) / (this._stepsCount));
        svg.appendChild(circularDashes);
        if (this._redLengthPercent > 0) {
            const redStartX = -Math.cos(this._redStartAngle) * 50;
            const redStartY = -Math.sin(this._redStartAngle) * 50;
            const redEndX = -Math.cos(this._redEndAngle) * 50;
            const redEndY = -Math.sin(this._redEndAngle) * 50;
            const redWidthFactor = 0.9;
            const redArea = document.createElementNS(Avionics.SVG.NS, "path");
            let redAreaPath = "M " + (50 + redStartX) + " " + (50 + redStartY);
            redAreaPath += " L " + (50 + redStartX * redWidthFactor) + " " + (50 + redStartY * redWidthFactor);
            redAreaPath += " A " + (50 * redWidthFactor) + " " + (50 * redWidthFactor) + " 0 0 1 " + (50 + redEndX * redWidthFactor) + " " + (50 + redEndY * redWidthFactor);
            redAreaPath += " L " + (50 + redEndX) + " " + (50 + redEndY);
            redAreaPath += " A 50 50 0 0 0 " + (50 + redStartX) + " " + (50 + redStartY);
            redArea.setAttribute("d", redAreaPath);
            redArea.setAttribute("fill", "red");
            svg.appendChild(redArea);
        }
        if (this._yellowLengthPercent) {
            const yellowStartX = -Math.cos(this._yellowStartAngle) * 50;
            const yellowStartY = -Math.sin(this._yellowStartAngle) * 50;
            const yellowEndX = -Math.cos(this._yellowEndAngle) * 50;
            const yellowEndY = -Math.sin(this._yellowEndAngle) * 50;
            const yellowWidthFactor = 0.9;
            const yellowArea = document.createElementNS(Avionics.SVG.NS, "path");
            let yellowAreaPath = "M " + (50 + yellowStartX) + " " + (50 + yellowStartY);
            yellowAreaPath += " L " + (50 + yellowStartX * yellowWidthFactor) + " " + (50 + yellowStartY * yellowWidthFactor);
            yellowAreaPath += " A " + (50 * yellowWidthFactor) + " " + (50 * yellowWidthFactor) + " 0 0 1 " + (50 + yellowEndX * yellowWidthFactor) + " " + (50 + yellowEndY * yellowWidthFactor);
            yellowAreaPath += " L " + (50 + yellowEndX) + " " + (50 + yellowEndY);
            yellowAreaPath += " A 50 50 0 0 0 " + (50 + yellowStartX) + " " + (50 + yellowStartY);
            yellowArea.setAttribute("d", yellowAreaPath);
            yellowArea.setAttribute("fill", "yellow");
            svg.appendChild(yellowArea);
        }
        if (this._greenLengthPercent > 0) {
            const greenStartX = -Math.cos(this._greenStartAngle) * 50;
            const greenStartY = -Math.sin(this._greenStartAngle) * 50;
            const greenEndX = -Math.cos(this._greenEndAngle) * 50;
            const greenEndY = -Math.sin(this._greenEndAngle) * 50;
            const greenWidthFactor = 0.9;
            const greenArea = document.createElementNS(Avionics.SVG.NS, "path");
            let greenAreaPath = "M " + (50 + greenStartX) + " " + (50 + greenStartY);
            greenAreaPath += " L " + (50 + greenStartX * greenWidthFactor) + " " + (50 + greenStartY * greenWidthFactor);
            greenAreaPath += " A " + (50 * greenWidthFactor) + " " + (50 * greenWidthFactor) + " 0 0 1 " + (50 + greenEndX * greenWidthFactor) + " " + (50 + greenEndY * greenWidthFactor);
            greenAreaPath += " L " + (50 + greenEndX) + " " + (50 + greenEndY);
            greenAreaPath += " A 50 50 0 0 0 " + (50 + greenStartX) + " " + (50 + greenStartY);
            greenArea.setAttribute("d", greenAreaPath);
            greenArea.setAttribute("fill", "green");
            svg.appendChild(greenArea);
        }
        if (this._lowRedLengthPercent > 0) {
            const lowRedStartX = -Math.cos(this._lowRedStartAngle) * 50;
            const lowRedStartY = -Math.sin(this._lowRedStartAngle) * 50;
            const lowRedEndX = -Math.cos(this._lowRedEndAngle) * 50;
            const lowRedEndY = -Math.sin(this._lowRedEndAngle) * 50;
            const lowRedWidthFactor = 0.9;
            const lowRedArea = document.createElementNS(Avionics.SVG.NS, "path");
            let lowRedAreaPath = "M " + (50 + lowRedStartX) + " " + (50 + lowRedStartY);
            lowRedAreaPath += " L " + (50 + lowRedStartX * lowRedWidthFactor) + " " + (50 + lowRedStartY * lowRedWidthFactor);
            lowRedAreaPath += " A " + (50 * lowRedWidthFactor) + " " + (50 * lowRedWidthFactor) + " 0 0 1 " + (50 + lowRedEndX * lowRedWidthFactor) + " " + (50 + lowRedEndY * lowRedWidthFactor);
            lowRedAreaPath += " L " + (50 + lowRedEndX) + " " + (50 + lowRedEndY);
            lowRedAreaPath += " A 50 50 0 0 0 " + (50 + lowRedStartX) + " " + (50 + lowRedStartY);
            lowRedArea.setAttribute("d", lowRedAreaPath);
            lowRedArea.setAttribute("fill", "red");
            svg.appendChild(lowRedArea);
        }
        if (this._lowYellowLengthPercent > 0) {
            const lowYellowStartX = -Math.cos(this._lowYellowStartAngle) * 50;
            const lowYellowStartY = -Math.sin(this._lowYellowStartAngle) * 50;
            const lowYellowEndX = -Math.cos(this._lowYellowEndAngle) * 50;
            const lowYellowEndY = -Math.sin(this._lowYellowEndAngle) * 50;
            const lowYellowWidthFactor = 0.9;
            const lowYellowArea = document.createElementNS(Avionics.SVG.NS, "path");
            let lowYellowAreaPath = "M " + (50 + lowYellowStartX) + " " + (50 + lowYellowStartY);
            lowYellowAreaPath += " L " + (50 + lowYellowStartX * lowYellowWidthFactor) + " " + (50 + lowYellowStartY * lowYellowWidthFactor);
            lowYellowAreaPath += " A " + (50 * lowYellowWidthFactor) + " " + (50 * lowYellowWidthFactor) + " 0 0 1 " + (50 + lowYellowEndX * lowYellowWidthFactor) + " " + (50 + lowYellowEndY * lowYellowWidthFactor);
            lowYellowAreaPath += " L " + (50 + lowYellowEndX) + " " + (50 + lowYellowEndY);
            lowYellowAreaPath += " A 50 50 0 0 0 " + (50 + lowYellowStartX) + " " + (50 + lowYellowStartY);
            lowYellowArea.setAttribute("d", lowYellowAreaPath);
            lowYellowArea.setAttribute("fill", "yellow");
            svg.appendChild(lowYellowArea);
        }
        this._cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this._cursor.classList.add("gauge-cursor");
        this._cursor.classList.add("circular-gauge-cursor");
        const cursorPath = "M 10 50 L 20 45 L 20 55 Z";
        this._cursor.setAttribute("d", cursorPath);
        this._cursor.setAttribute("fill", "white");
        this._cursor.setAttribute("stroke", "black");
        svg.appendChild(this._cursor);
        this._updateValue();
    }
    _updateValueSvg() {
        const cursorAngle = this._value / this._maxValue * 180;
        this._cursor.setAttributeNS(Avionics.SVG.NS, "transform", "rotate(" + cursorAngle + " 50 50)");
    }
    _drawBase() {
        const cx = this._canvasBase.width * 0.5;
        let cy = this._canvasBase.height * 0.5;
        let r = Math.min(cx, this._canvasBase.height / (1 - Math.sin(this._tilt * Avionics.Utils.DEG2RAD)) + 12);
        cy = Math.max(cy, r);
        r = r - 2;
        if (r < 1) {
            return;
        }
        const angularStep = (this._angularSize / this._stepsCount) * Avionics.Utils.DEG2RAD;
        for (let i = 1; i < this._stepsCount; i++) {
            const angle = this._startAngle + i * angularStep;
            const sx = Math.cos(angle);
            const sy = Math.sin(angle);
            CircularGauge.DrawLineFromTo(this._canvasBaseContext, cx + sx * r, cy + sy * r, cx + sx * (r * 0.8), cy + sy * (r * 0.8));
            this._canvasBaseContext.strokeStyle = "white";
            this._canvasBaseContext.stroke();
        }
        if (this._lowRedLengthPercent > 0) {
            CircularGauge.DrawThickArc(this._canvasBaseContext, cx, cy, r * 0.9, r, this._lowRedStartAngle, this._lowRedEndAngle, false);
            this._canvasBaseContext.fillStyle = "red";
            this._canvasBaseContext.fill();
        }
        if (this._lowYellowLengthPercent > 0) {
            CircularGauge.DrawThickArc(this._canvasBaseContext, cx, cy, r * 0.9, r, this._lowYellowStartAngle, this._lowYellowEndAngle, false);
            this._canvasBaseContext.fillStyle = "yellow";
            this._canvasBaseContext.fill();
        }
        if (this._greenLengthPercent > 0) {
            CircularGauge.DrawThickArc(this._canvasBaseContext, cx, cy, r * 0.9, r, this._greenStartAngle, this._greenEndAngle, false);
            this._canvasBaseContext.fillStyle = "green";
            this._canvasBaseContext.fill();
        }
        if (this._yellowLengthPercent > 0) {
            CircularGauge.DrawThickArc(this._canvasBaseContext, cx, cy, r * 0.9, r, this._yellowStartAngle, this._yellowEndAngle, false);
            this._canvasBaseContext.fillStyle = "yellow";
            this._canvasBaseContext.fill();
        }
        if (this._redLengthPercent > 0) {
            CircularGauge.DrawThickArc(this._canvasBaseContext, cx, cy, r * 0.9, r, this._redStartAngle, this._redEndAngle, false);
            this._canvasBaseContext.fillStyle = "red";
            this._canvasBaseContext.fill();
        }
        if (isFinite(this._limitLow)) {
            const sx = Math.cos(this._limitLowAngle);
            const sy = Math.sin(this._limitLowAngle);
            CircularGauge.DrawLineFromTo(this._canvasBaseContext, cx + sx * r, cy + sy * r, cx + sx * (r * 0.75), cy + sy * (r * 0.75));
            this._canvasBaseContext.strokeStyle = "red";
            this._canvasBaseContext.lineWidth = 3;
            this._canvasBaseContext.stroke();
        }
        if (isFinite(this._limitHigh)) {
            const sx = Math.cos(this._limitHighAngle);
            const sy = Math.sin(this._limitHighAngle);
            CircularGauge.DrawLineFromTo(this._canvasBaseContext, cx + sx * r, cy + sy * r, cx + sx * (r * 0.75), cy + sy * (r * 0.75));
            this._canvasBaseContext.strokeStyle = "red";
            this._canvasBaseContext.lineWidth = 3;
            this._canvasBaseContext.stroke();
        }
        const fsx = Math.cos(this._startAngle);
        const fsy = Math.sin(this._startAngle);
        const fex = Math.cos(this._endAngle);
        const fey = Math.sin(this._endAngle);
        this._canvasBaseContext.fillStyle = "white";
        this._canvasBaseContext.font = fastToFixed(this.fontSize, 0) + "px Roboto";
        this._canvasBaseContext.textAlign = "center";
        this._canvasBaseContext.fillText(this._title, cx, r - this.fontSize * 0.6);
        this._canvasBaseContext.fillText(this._unit, cx, r + this.fontSize * 0.6);
        this._canvasBaseContext.beginPath();
        this._canvasBaseContext.moveTo(cx + (r * 0.75) * fsx, cy + (r * 0.75) * fsy);
        this._canvasBaseContext.lineTo(cx + r * fsx, cy + r * fsy);
        this._canvasBaseContext.arc(cx, cy, r, this._startAngle, this._endAngle, false);
        this._canvasBaseContext.lineTo(cx + (r * 0.75) * fex, cy + (r * 0.75) * fey);
        this._canvasBaseContext.strokeStyle = "white";
        this._canvasBaseContext.lineWidth = 2;
        this._canvasBaseContext.stroke();
    }
    _drawCursor() {
        const cx = this._canvasCursor.width * 0.5;
        let cy = this._canvasCursor.height * 0.5;
        const r = Math.min(cx, this._canvasCursor.height / (1 - Math.sin(this._tilt * Avionics.Utils.DEG2RAD)) + 12);
        cy = Math.max(cy, r);
        if (r < 1) {
            return;
        }
        const cursorX = Math.cos(this._cursorAngle);
        const cursorY = Math.sin(this._cursorAngle);
        const nX = -cursorY;
        const nY = cursorX;
        this._canvasCursorContext.beginPath();
        this._canvasCursorContext.moveTo(cx + (r * 0.8) * cursorX, cy + (r * 0.8) * cursorY);
        this._canvasCursorContext.lineTo(cx + (r * 0.6) * cursorX + nX * r * 0.1, cy + (r * 0.6) * cursorY + nY * r * 0.1);
        this._canvasCursorContext.lineTo(cx + (r * 0.6) * cursorX - nX * r * 0.1, cy + (r * 0.6) * cursorY - nY * r * 0.1);
        this._canvasCursorContext.fillStyle = "white";
        this._canvasCursorContext.fill();
        this._canvasCursorContext.fillStyle = this.getCurrentColor();
        this._canvasCursorContext.font = fastToFixed((this.fontSize * 1.3), 0) + "px Roboto";
        this._canvasCursorContext.textAlign = "right";
        this._canvasCursorContext.fillText(fastToFixed(this._value, this._valuePrecision), 1.9 * cx, cy + this.fontSize * 1.3);
    }
    static DrawThickArc(context, cx, cy, rMin, rMax, angleStart, angleEnd, anticlockWise) {
        const sx = Math.cos(angleStart);
        const sy = Math.sin(angleStart);
        const ex = Math.cos(angleEnd);
        const ey = Math.sin(angleEnd);
        context.beginPath();
        context.moveTo(cx + rMin * sx, cy + rMin * sy);
        context.lineTo(cx + rMax * sx, cy + rMax * sy);
        context.arc(cx, cy, rMax, angleStart, angleEnd, anticlockWise);
        context.lineTo(cx + rMin * ex, cy + rMin * ey);
        context.arc(cx, cy, rMin, angleEnd, angleStart, !anticlockWise);
    }
    static DrawLineFromTo(context, fromX, fromY, toX, toY) {
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
    }
}
customElements.define('circular-gauge', CircularGauge);
//# sourceMappingURL=CircularGauge.js.map