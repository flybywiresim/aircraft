class AbstractGauge extends HTMLElement {
    constructor() {
        super();
        this.forceSvg = false;
        this._value = 0;
        this._minValue = 0;
        this._maxValue = 180;
        this._lowRedStartValue = 0;
        this._lowRedEndValue = 0;
        this._lowYellowStartValue = 0;
        this._lowYellowEndValue = 0;
        this._greenStartValue = 40;
        this._greenEndValue = 110;
        this._whiteStartValue = 40;
        this._whiteEndValue = 110;
        this._yellowStartValue = 10;
        this._yellowEndValue = 50;
        this._redStartValue = 100;
        this._redEndValue = 160;
        this._limitLow = NaN;
        this._limitHigh = NaN;
        this._stepsCount = 5;
        this._tilt = 0;
        this._angularSize = 180;
        this._title = "";
        this._unit = "";
        this._valuePrecision = 0;
        this._computedFontSize = 16;
        this._fixedFontSize = NaN;
    }
    static get observedAttributes() {
        return [
            "value",
            "min-value",
            "max-value",
            "limit-low",
            "limit-high",
            "red-start",
            "red-end",
            "yellow-start",
            "yellow-end",
            "green-start",
            "green-end",
            "white-start",
            "white-end",
            "low-yellow-start",
            "low-yellow-end",
            "low-red-start",
            "low-red-end",
            "steps-count",
            "tilt",
            "angular-size",
            "title",
            "unit",
            "value-precision",
            "fixed-font-size"
        ];
    }
    get fontSize() {
        if (this._fixedFontSize > 0) {
            return this._fixedFontSize;
        } else {
            return this._computedFontSize;
        }
    }
    get isTextUpScaled() {
        return this._fixedFontSize > this._computedFontSize;
    }
    get _amplitude() {
        return this._maxValue - this._minValue;
    }
    get _valuePercent() {
        return (this._value - this._minValue) / this._amplitude;
    }
    get _lowRedStartPercent() {
        return (this._lowRedStartValue - this._minValue) / this._amplitude;
    }
    get _lowRedEndPercent() {
        return (this._lowRedEndValue - this._minValue) / this._amplitude;
    }
    get _lowRedLengthPercent() {
        return this._lowRedEndPercent - this._lowRedStartPercent;
    }
    get _lowYellowStartPercent() {
        return (this._lowYellowStartValue - this._minValue) / this._amplitude;
    }
    get _lowYellowEndPercent() {
        return (this._lowYellowEndValue - this._minValue) / this._amplitude;
    }
    get _lowYellowLengthPercent() {
        return this._lowYellowEndPercent - this._lowYellowStartPercent;
    }
    get _greenStartPercent() {
        return (this._greenStartValue - this._minValue) / this._amplitude;
    }
    get _greenEndPercent() {
        return (this._greenEndValue - this._minValue) / this._amplitude;
    }
    get _whiteStartPercent() {
        return (this._whiteStartValue - this._minValue) / this._amplitude;
    }
    get _whiteEndPercent() {
        return (this._whiteEndValue - this._minValue) / this._amplitude;
    }
    get _greenLengthPercent() {
        return this._greenEndPercent - this._greenStartPercent;
    }
    get _yellowStartPercent() {
        return (this._yellowStartValue - this._minValue) / this._amplitude;
    }
    get _yellowEndPercent() {
        return (this._yellowEndValue - this._minValue) / this._amplitude;
    }
    get _yellowLengthPercent() {
        return this._yellowEndPercent - this._yellowStartPercent;
    }
    get _redStartPercent() {
        return (this._redStartValue - this._minValue) / this._amplitude;
    }
    get _redEndPercent() {
        return (this._redEndValue - this._minValue) / this._amplitude;
    }
    get _redLengthPercent() {
        return this._redEndPercent - this._redStartPercent;
    }
    get _limitLowPercent() {
        return (this._limitLow - this._minValue) / this._amplitude;
    }
    get _limitHighPercent() {
        return (this._limitHigh - this._minValue) / this._amplitude;
    }
    getCurrentColor() {
        if (this._value > this._limitHigh) {
            return "red";
        }
        if (this._value < this._limitLow) {
            return "red";
        }
        if (this._value > this._redStartValue && this._value < this._redEndValue) {
            return "red";
        }
        if (this._value > this._yellowStartValue && this._value < this._yellowEndValue) {
            return "yellow";
        }
        if (this._value > this._greenStartValue && this._value < this._greenEndValue) {
            return "green";
        }
        if (this._value > this._lowYellowStartValue && this._value < this._lowYellowEndValue) {
            return "yellow";
        }
        if (this._value > this._lowRedStartValue && this._value < this._lowRedEndValue) {
            return "red";
        }
        return "white";
    }
    connectedCallback() {
        this._redraw();
    }
    _resize() {
        this._computedFontSize = Math.max(this.clientWidth, this.clientHeight) / 10;
        if (this._canvasBase) {
            this._canvasBase.width = this.clientWidth;
            this._canvasBase.height = this.clientHeight;
        }
        if (this._canvasCursor) {
            this._canvasCursor.width = this._canvasBase.width;
            this._canvasCursor.height = this._canvasBase.height;
            this._canvasCursor.style.top = -this._canvasBase.height + "px";
        }
    }
    _redraw() {
        if (AbstractGauge.useSvgGauges || this.forceSvg) {
            this._redrawSvg();
        } else {
            if (!this._canvasBase) {
                this._canvasBase = document.createElement("canvas");
                this.appendChild(this._canvasBase);
                this._canvasBase.style.display = "block";
                this._canvasBase.style.width = "100%";
                this._canvasBase.style.height = "100%";
                this._canvasBaseContext = this._canvasBase.getContext("2d");
            }
            if (!this._canvasCursor) {
                this._canvasCursor = document.createElement("canvas");
                this.appendChild(this._canvasCursor);
                this._canvasCursor.style.display = "block";
                this._canvasCursor.style.position = "relative";
                this._canvasCursor.style.width = "100%";
                this._canvasCursor.style.height = "100%";
                this._canvasCursorContext = this._canvasCursor.getContext("2d");
            }
            this._resize();
            if (this._canvasBase.width * this._canvasBase.height === 0) {
                return;
            }
            this._canvasBaseContext.clearRect(0, 0, this._canvasBase.width, this._canvasBase.height);
            this._drawBase();
            this._drawCursor();
        }
    }
    _updateValue() {
        if (AbstractGauge.useSvgGauges || this.forceSvg) {
            this._updateValueSvg();
        } else {
            if (!this._canvasCursor) {
                this._drawBase();
            } else if (this._canvasBase.width * this._canvasBase.height === 0) {
                this._resize();
                this._drawBase();
            }
            this._canvasCursorContext.clearRect(0, 0, this._canvasCursor.width, this._canvasCursor.height);
            this._drawCursor();
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) {
            if (!AbstractGauge.useSvgGauges && !this.forceSvg) {
                if (this._canvasBase.width * this._canvasBase.height > 0) {
                    return;
                }
            } else {
                return;
            }
        }
        const t0 = performance.now();
        if (name === "value") {
            this._value = parseFloat(newValue);
            this._updateValue();
        } else {
            let needUpdate = true;
            if (name === "tilt") {
                this._tilt = parseFloat(newValue);
            } else if (name === "angular-size") {
                this._angularSize = parseFloat(newValue);
            } else if (name === "steps-count") {
                this._stepsCount = parseFloat(newValue);
            } else if (name === "limit-low") {
                this._limitLow = parseFloat(newValue);
            } else if (name === "limit-high") {
                this._limitHigh = parseFloat(newValue);
            } else if (name === "min-value") {
                this._minValue = parseFloat(newValue);
            } else if (name === "max-value") {
                this._maxValue = parseFloat(newValue);
            } else if (name === "red-start") {
                this._redStartValue = parseFloat(newValue);
            } else if (name === "red-end") {
                this._redEndValue = parseFloat(newValue);
            } else if (name === "yellow-start") {
                this._yellowStartValue = parseFloat(newValue);
            } else if (name === "yellow-end") {
                this._yellowEndValue = parseFloat(newValue);
            } else if (name === "green-start") {
                this._greenStartValue = parseFloat(newValue);
            } else if (name === "green-end") {
                this._greenEndValue = parseFloat(newValue);
            } else if (name === "white-start") {
                this._whiteStartValue = parseFloat(newValue);
            } else if (name === "white-end") {
                this._whiteEndValue = parseFloat(newValue);
            } else if (name === "low-yellow-start") {
                this._lowYellowStartValue = parseFloat(newValue);
            } else if (name === "low-yellow-end") {
                this._lowYellowEndValue = parseFloat(newValue);
            } else if (name === "low-red-start") {
                this._lowRedStartValue = parseFloat(newValue);
            } else if (name === "low-red-end") {
                this._lowRedEndValue = parseFloat(newValue);
            } else if (name === "title") {
                this._title = newValue;
            } else if (name === "unit") {
                this._unit = newValue;
            } else if (name === "value-precision") {
                this._valuePrecision = parseInt(newValue);
            } else if (name === "fixed-font-size") {
                this._fixedFontSize = parseInt(newValue);
            } else {
                needUpdate = false;
            }
            if (needUpdate) {
                this._redraw();
            }
        }
        const t = performance.now() - t0;
        AbstractGauge.max = Math.max(t, AbstractGauge.max);
    }
}
AbstractGauge.useSvgGauges = false;
AbstractGauge.max = 0;
//# sourceMappingURL=AbstractGauge.js.map