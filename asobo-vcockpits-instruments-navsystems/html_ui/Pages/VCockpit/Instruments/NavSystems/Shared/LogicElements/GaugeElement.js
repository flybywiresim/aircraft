class GaugeElement extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.maxValue = 100;
        this.minValue = 0;
        this.lowRedArcBegin = 0;
        this.lowRedArcEnd = 0;
        this.lowYellowArcBegin = 0;
        this.lowYellowArcEnd = 0;
        this.greenArcBegin = 0;
        this.greenArcEnd = 0;
        this.whiteArcBegin = 0;
        this.whiteArcEnd = 0;
        this.yellowArcBegin = 0;
        this.yellowArcEnd = 0;
        this.redArcBegin = 0;
        this.redArcEnd = 0;
        this.lowLimit = 0;
        this.highLimit = 0;
        this.takeOffValue = 0;
    }
    Set(_gauge, _range, _CurrValueCB, _title, _unit, _valuePrecision = 0, _secondValueCB = null) {
        if (_range) {
            if (_range.__Type == "ColorRangeDisplay4") {
                this.SetColorRange4(_range);
            } else if (_range.__Type == "ColorRangeDisplay3") {
                this.SetColorRange3(_range);
            } else if (_range.__Type == "ColorRangeDisplay2") {
                this.SetColorRange2(_range);
            } else if (_range.__Type == "ColorRangeDisplay") {
                this.SetColorRange(_range);
            } else if (_range.__Type == "FlapsRangeDisplay") {
                this.setFlapsRange(_range);
            } else if (_range.__Type == "RangeDisplay") {
                this.SetRange(_range);
            }
        }
        this.gauge = _gauge;
        this.title = _title;
        this.unit = _unit;
        this.valuePrecision = _valuePrecision;
        this.getCurrentValue = _CurrValueCB;
        this.getCurrentValue2 = _secondValueCB;
    }
    init() {
        if (this.gauge) {
            this.gauge.setAttribute("max-value", this.maxValue.toString());
            this.gauge.setAttribute("min-value", this.minValue.toString());
            this.gauge.setAttribute("red-start", this.redArcBegin.toString());
            this.gauge.setAttribute("red-end", this.redArcEnd.toString());
            this.gauge.setAttribute("yellow-start", this.yellowArcBegin.toString());
            this.gauge.setAttribute("yellow-end", this.yellowArcEnd.toString());
            this.gauge.setAttribute("green-start", this.greenArcBegin.toString());
            this.gauge.setAttribute("green-end", this.greenArcEnd.toString());
            this.gauge.setAttribute("white-start", this.whiteArcBegin.toString());
            this.gauge.setAttribute("white-end", this.whiteArcEnd.toString());
            this.gauge.setAttribute("low-yellow-start", this.lowYellowArcBegin.toString());
            this.gauge.setAttribute("low-yellow-end", this.lowYellowArcEnd.toString());
            this.gauge.setAttribute("low-red-start", this.lowRedArcBegin.toString());
            this.gauge.setAttribute("low-red-end", this.lowRedArcEnd.toString());
            this.gauge.setAttribute("limit-low", (this.lowLimit > 0) ? this.lowLimit.toString() : "undefined");
            this.gauge.setAttribute("limit-high", (this.highLimit > 0) ? this.highLimit.toString() : "undefined");
            this.gauge.setAttribute("take-off-value", this.takeOffValue.toString());
            this.gauge.setAttribute("title", this.title);
            this.gauge.setAttribute("unit", this.unit);
            this.gauge.setAttribute("value-precision", this.valuePrecision.toString());
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.gauge) {
            const val = this.getCurrentValue();
            const clampedVal = Math.min(Math.max(val, this.minValue), this.maxValue);
            const roundedVal = fastToFixed(clampedVal, this.valuePrecision);
            this.gauge.setAttribute("value", "" + roundedVal);
            if (this.getCurrentValue2) {
                const val2 = this.getCurrentValue2();
                const clampedVal2 = Math.min(Math.max(val2, this.minValue), this.maxValue);
                const roundedVal2 = fastToFixed(clampedVal2, this.valuePrecision);
                this.gauge.setAttribute("value2", "" + roundedVal2);
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    redraw() {
        if (this.gauge && (this.gauge instanceof AbstractGauge)) {
            this.gauge._redraw();
        }
    }
    SetRange(_range) {
        this.maxValue = _range.max;
        this.minValue = _range.min;
        this.lowLimit = _range.lowLimit;
        this.highLimit = _range.highLimit;
    }
    SetColorRange(_range) {
        this.SetRange(_range);
        this.greenArcBegin = _range.greenStart;
        this.greenArcEnd = _range.greenEnd;
    }
    SetColorRange2(_range) {
        this.SetColorRange(_range);
        this.yellowArcBegin = _range.yellowStart;
        this.yellowArcEnd = _range.yellowEnd;
        this.redArcBegin = _range.redStart;
        this.redArcEnd = _range.redEnd;
    }
    SetColorRange3(_range) {
        this.SetColorRange2(_range);
        this.lowRedArcBegin = _range.lowRedStart;
        this.lowRedArcEnd = _range.lowRedEnd;
        this.lowYellowArcBegin = _range.lowYellowStart;
        this.lowYellowArcEnd = _range.lowYellowEnd;
    }
    SetColorRange4(_range) {
        this.SetColorRange2(_range);
        this.whiteArcBegin = _range.whiteStart;
        this.whiteArcEnd = _range.whiteEnd;
    }
    setFlapsRange(_range) {
        this.SetRange(_range);
        this.takeOffValue = _range.takeOffValue;
    }
}
class TextElement extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.value = "";
    }
    Set(_elem, _CurrValueCB) {
        this.elem = _elem;
        this.getCurrentValue = _CurrValueCB;
    }
    init() {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const val = this.getCurrentValue();
        if (this.elem && this.value != val) {
            this.elem.textContent = val;
            this.value = val;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
//# sourceMappingURL=GaugeElement.js.map