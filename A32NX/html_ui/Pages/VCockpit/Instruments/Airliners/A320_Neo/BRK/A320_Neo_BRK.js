var A320_Neo_BRK_Definitions;
(function (A320_Neo_BRK_Definitions) {
    class Common {
    }
    Common.PIVOT_POSITION = new Vec2(60, 60);
    Common.DEFAULT_TRANSLATE_STRING = "translate(60, 60)";
    A320_Neo_BRK_Definitions.Common = Common;
    class DialFrame {
    }
    DialFrame.START = new Vec2(48, -32);
    DialFrame.END = new Vec2(-32, 48);
    DialFrame.INNER_RADIUS = 58;
    DialFrame.OUTER_RADIUS = 195;//MODFIED 200
    A320_Neo_BRK_Definitions.DialFrame = DialFrame;
    class Marker {
    }
    Marker.START_RADIUS = A320_Neo_BRK_Definitions.DialFrame.OUTER_RADIUS + 4;
    Marker.LENGTH_SHORT = 16;
    Marker.LENGTH_LONG = 36;
    A320_Neo_BRK_Definitions.Marker = Marker;
    class Indicator {
    }
    Indicator.ANGLE_MIN = 0;
    Indicator.ANGLE_MAX = 90;
    Indicator.ARROW_MAIN_LENGTH = 130;// MODFIED 160
    Indicator.ARROW_HEAD_LENGTH = 68;// MODFIED 28
    Indicator.ARROW_HALF_HEIGHT = 20;
    Indicator.CIRCLE_RADIUS = 70;// MODFIED
    // Indicator.CIRCLE_RADIUS = 48;//
    A320_Neo_BRK_Definitions.Indicator = Indicator;
    class OuterArc {
    }
    OuterArc.RADIUS = A320_Neo_BRK_Definitions.DialFrame.OUTER_RADIUS + 20;
    A320_Neo_BRK_Definitions.OuterArc = OuterArc;
})(A320_Neo_BRK_Definitions || (A320_Neo_BRK_Definitions = {}));
var A320_Neo_BRK;
(function (A320_Neo_BRK) {
    class Display extends BaseAirliners {
        constructor() {
            super();
        }
        get templateID() {
            return "A320_Neo_BRK";
        }
        connectedCallback() {
            super.connectedCallback();
            this.topGauge = new A320_Neo_BRK_Gauge(this.querySelector("#topGauge"), 0, 4);
            this.topGauge.addOuterArc(2.9, 3.3);// this.topGauge.addOuterArc(2.75, 3.5);
            this.topGauge.addMarker(0, false);// long ticks
            this.topGauge.addMarker(4, false);
            this.leftGauge = new A320_Neo_BRK_Gauge(this.querySelector("#leftGauge"), 0, 3);
            this.leftGauge.addOuterArc(0, 1);
            this.leftGauge.addMarker(0, false);
            this.leftGauge.addMarker(0.5, false);
            this.leftGauge.addMarker(1, false);
            this.leftGauge.addMarker(1.5, true);
            this.leftGauge.addMarker(2, false);
            this.leftGauge.addMarker(2.5, true);
            this.leftGauge.addMarker(3, false);
            this.rightGauge = new A320_Neo_BRK_Gauge(this.querySelector("#rightGauge"), 0, 3);
            this.rightGauge.addOuterArc(0, 1);
            this.rightGauge.addMarker(0, false);
            this.rightGauge.addMarker(0.5, false);
            this.rightGauge.addMarker(1, false);
            this.rightGauge.addMarker(1.5, true);
            this.rightGauge.addMarker(2, false);
            this.rightGauge.addMarker(2.5, true);
            this.rightGauge.addMarker(3, false);
            this.electricity = this.querySelector("#Electricity");
        }
        onUpdate(_deltaTime) {
            super.onUpdate(_deltaTime);
            const currentPKGBrakeState = SimVar.GetSimVarValue("BRAKE PARKING POSITION", "Bool");
            const powerAvailable = SimVar.GetSimVarValue("L:DCPowerAvailable","Bool");
            if (this.topGauge != null) {
                if (powerAvailable) {
                    this.topGauge.setValue(3);
                } else {
                    this.topGauge.setValue(0);
                }
            }

            if (this.leftGauge != null) {
                if (powerAvailable) {
                    if (currentPKGBrakeState != 0) {
                        this.leftGauge.setValue(2);
                    } else {
                        this.leftGauge.setValue(2 * (SimVar.GetSimVarValue("BRAKE LEFT POSITION","SINT32") / 32000));
                    }
                } else {
                    this.leftGauge.setValue(0);
                }
            }
            if (this.rightGauge != null) {
                if (powerAvailable) {
                    if (currentPKGBrakeState != 0) {
                        this.rightGauge.setValue(2);
                    } else {
                        this.rightGauge.setValue(2 * (SimVar.GetSimVarValue("BRAKE RIGHT POSITION","SINT32") / 32000));
                    }
                } else {
                    this.rightGauge.setValue(0);
                }
            }
            this.updateElectricityState(powerAvailable);
        }
        updateElectricityState(powerAvailable) {
            if (powerAvailable) {
                this.electricity.style.display = "block";
            } else {
                this.electricity.style.display = "none";
            }
        }
    }
    A320_Neo_BRK.Display = Display;
    class A320_Neo_BRK_Gauge {
        constructor(_svgGroup, _min, _max) {
            this.minValue = _min;
            this.maxValue = _max;
            if (_svgGroup != null) {
                this.outerArcsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.outerArcsGroup.setAttribute("class", "outerArcs");
                this.outerArcsGroup.setAttribute("transform", A320_Neo_BRK_Definitions.Common.DEFAULT_TRANSLATE_STRING);
                _svgGroup.appendChild(this.outerArcsGroup);
                this.markersGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.markersGroup.setAttribute("class", "markers");
                this.markersGroup.setAttribute("transform", A320_Neo_BRK_Definitions.Common.DEFAULT_TRANSLATE_STRING);
                _svgGroup.appendChild(this.markersGroup);
                const dialFrameGroup = document.createElementNS(Avionics.SVG.NS, "g");
                dialFrameGroup.setAttribute("class", "dialFrame");
                dialFrameGroup.setAttribute("transform", A320_Neo_BRK_Definitions.Common.DEFAULT_TRANSLATE_STRING);
                {
                    const dialFrameShape = document.createElementNS(Avionics.SVG.NS, "path");
                    var d = [
                        "M", A320_Neo_BRK_Definitions.DialFrame.START.x, A320_Neo_BRK_Definitions.DialFrame.START.y,
                        "L", A320_Neo_BRK_Definitions.DialFrame.OUTER_RADIUS, A320_Neo_BRK_Definitions.DialFrame.START.y,
                        "A", A320_Neo_BRK_Definitions.DialFrame.OUTER_RADIUS, A320_Neo_BRK_Definitions.DialFrame.OUTER_RADIUS, "0 0 1", A320_Neo_BRK_Definitions.DialFrame.END.x, A320_Neo_BRK_Definitions.DialFrame.OUTER_RADIUS,
                        "L", A320_Neo_BRK_Definitions.DialFrame.END.x, A320_Neo_BRK_Definitions.DialFrame.END.y,
                        "A", A320_Neo_BRK_Definitions.DialFrame.INNER_RADIUS, A320_Neo_BRK_Definitions.DialFrame.INNER_RADIUS, "0 1 1", A320_Neo_BRK_Definitions.DialFrame.START.x, A320_Neo_BRK_Definitions.DialFrame.START.y
                    ].join(" ");
                    dialFrameShape.setAttribute("d", d);
                    dialFrameGroup.appendChild(dialFrameShape);
                }
                _svgGroup.appendChild(dialFrameGroup);
                this.indicatorGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.indicatorGroup.setAttribute("class", "indicator");
                {
                    const indicatorArrow = document.createElementNS(Avionics.SVG.NS, "path");
                    indicatorArrow.setAttribute("class", "indicatorArrow");
                    var d = [
                        "M 0", -A320_Neo_BRK_Definitions.Indicator.ARROW_HALF_HEIGHT,
                        "L", A320_Neo_BRK_Definitions.Indicator.ARROW_MAIN_LENGTH, -A320_Neo_BRK_Definitions.Indicator.ARROW_HALF_HEIGHT,
                        "L", (A320_Neo_BRK_Definitions.Indicator.ARROW_MAIN_LENGTH + A320_Neo_BRK_Definitions.Indicator.ARROW_HEAD_LENGTH), "0",
                        "L", A320_Neo_BRK_Definitions.Indicator.ARROW_MAIN_LENGTH, A320_Neo_BRK_Definitions.Indicator.ARROW_HALF_HEIGHT,
                        "L 0", A320_Neo_BRK_Definitions.Indicator.ARROW_HALF_HEIGHT
                    ].join(" ");
                    indicatorArrow.setAttribute("d", d);
                    this.indicatorGroup.appendChild(indicatorArrow);
                }
                {
                    const indicatorCircle = document.createElementNS(Avionics.SVG.NS, "circle");
                    indicatorCircle.setAttribute("class", "indicatorCircle");
                    indicatorCircle.setAttribute("r", A320_Neo_BRK_Definitions.Indicator.CIRCLE_RADIUS.toString());
                    indicatorCircle.setAttribute("cx", "0");
                    indicatorCircle.setAttribute("cy", "0");
                    this.indicatorGroup.appendChild(indicatorCircle);
                }
                _svgGroup.appendChild(this.indicatorGroup);
            }
            this.setValue(this.minValue, true);
        }
        addMarker(_value, _isShort) {
            if (this.markersGroup != null) {
                const dir = this.valueToDir(_value);
                const start = new Vec2(0, 0);
                start.x += dir.x * A320_Neo_BRK_Definitions.Marker.START_RADIUS;
                start.y += dir.y * A320_Neo_BRK_Definitions.Marker.START_RADIUS;
                const end = new Vec2(start.x, start.y);
                if (_isShort) {
                    end.x += dir.x * A320_Neo_BRK_Definitions.Marker.LENGTH_SHORT;
                    end.y += dir.y * A320_Neo_BRK_Definitions.Marker.LENGTH_SHORT;
                } else {
                    end.x += dir.x * A320_Neo_BRK_Definitions.Marker.LENGTH_LONG;
                    end.y += dir.y * A320_Neo_BRK_Definitions.Marker.LENGTH_LONG;
                }
                const line = document.createElementNS(Avionics.SVG.NS, "line");
                line.setAttribute("class", "marker");
                line.setAttribute("x1", start.x.toString());
                line.setAttribute("y1", start.y.toString());
                line.setAttribute("x2", end.x.toString());
                line.setAttribute("y2", end.y.toString());
                this.markersGroup.appendChild(line);
            }
        }
        addOuterArc(_startValue, _endValue) {
            if (this.outerArcsGroup != null) {
                _startValue = Utils.Clamp(_startValue, this.minValue, this.maxValue);
                _endValue = Utils.Clamp(_endValue, this.minValue, this.maxValue);
                if (_startValue != _endValue) {
                    const arc = document.createElementNS(Avionics.SVG.NS, "path");
                    arc.setAttribute("class", "outerArc");
                    let d = "";
                    const startAngle = this.valueToAngle(_startValue, true);
                    const startX = (Math.cos(startAngle) * A320_Neo_BRK_Definitions.OuterArc.RADIUS);
                    const startY = (Math.sin(startAngle) * A320_Neo_BRK_Definitions.OuterArc.RADIUS);
                    const endAngle = this.valueToAngle(_endValue, true);
                    const endX = (Math.cos(endAngle) * A320_Neo_BRK_Definitions.OuterArc.RADIUS);
                    const endY = (Math.sin(endAngle) * A320_Neo_BRK_Definitions.OuterArc.RADIUS);
                    const largeArcFlag = ((endAngle - startAngle) <= Math.PI) ? "0 0 0" : "0 1 0";
                    d = [
                        "M", endX, endY,
                        "A", A320_Neo_BRK_Definitions.OuterArc.RADIUS, A320_Neo_BRK_Definitions.OuterArc.RADIUS, largeArcFlag, startX, startY
                    ].join(" ");
                    arc.setAttribute("d", d);
                    this.outerArcsGroup.appendChild(arc);
                }
            }
        }
        valueToAngle(_value, _radians) {
            const percentage = (_value - this.minValue) / (this.maxValue - this.minValue);
            let angle = (A320_Neo_BRK_Definitions.Indicator.ANGLE_MIN + ((A320_Neo_BRK_Definitions.Indicator.ANGLE_MAX - A320_Neo_BRK_Definitions.Indicator.ANGLE_MIN) * percentage));
            if (_radians) {
                angle *= (Math.PI / 180.0);
            }
            return angle;
        }
        valueToDir(_value) {
            const angle = this.valueToAngle(_value, true);
            return (new Vec2(Math.cos(angle), Math.sin(angle)));
        }
        setValue(_value, _force = false) {
            if ((_value != this.currentValue) || _force) {
                this.currentValue = Utils.Clamp(_value, this.minValue, this.maxValue);
                if (this.indicatorGroup != null) {
                    this.indicatorGroup.setAttribute("transform", A320_Neo_BRK_Definitions.Common.DEFAULT_TRANSLATE_STRING + " rotate(" + this.valueToAngle(this.currentValue, false) + ")");
                }
            }
        }
    }
})(A320_Neo_BRK || (A320_Neo_BRK = {}));
registerInstrument("a320-neo-brk", A320_Neo_BRK.Display);
//# sourceMappingURL=A320_Neo_BRK.js.map