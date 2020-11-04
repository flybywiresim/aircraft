var A320_Neo_ECAM_Common;
(function (A320_Neo_ECAM_Common) {
    function isEngineDisplayActive(_index) {
        return ((SimVar.GetSimVarValue("ENG N1 RPM:" + _index, "percent") >= 0.05) || (SimVar.GetSimVarValue("ENG N2 RPM:" + _index, "percent") >= 0.05));
    }
    A320_Neo_ECAM_Common.isEngineDisplayActive = isEngineDisplayActive;
    class GaugeDefinition {
        constructor() {
            this.startAngle = -225;
            this.arcSize = 180;
            this.cursorOffset = 0;
            this.minValue = 0;
            this.maxValue = 100;
            this.minRedValue = 0;
            this.maxRedValue = 0;
            this.warningRange = [0, 0];
            this.dangerRange = [0, 0];
            this.cursorLength = 1.0;
            this.cursorMultiplier = 1.1;
            this.currentValuePos = new Vec2(0.65, 0.65);
            this.currentValueFunction = null;
            this.currentValuePrecision = 0;
            this.currentValueBorderWidth = 0;
            this.outerIndicatorFunction = null;
            this.outerDynamicArcFunction = null;
            this.extraMessageFunction = null;
            this.outerDynamicMarkerFunction = null;
            this.dangerMinDynamicFunction = null;
            this.outerMarkerValue = null;
        }
    }
    A320_Neo_ECAM_Common.GaugeDefinition = GaugeDefinition;
    class Gauge extends HTMLElement {
        constructor() {
            super(...arguments);
            this.viewBoxSize = new Vec2(100, 100);
            this.startAngle = -225;
            this.cursorOffset = 0;
            this.warningRange = [0, 0];
            this.dangerRange = [0, 0];
            this.outerDynamicArcCurrentValues = [0, 0];
            this.outerDynamicArcTargetValues = [0, 0];
            this.extraMessageString = "";
            this.isActive = true;
            this.extraMessagePosXMultiplier = 0;
            this.extraMessagePosYMultiplier = 0;
            this.extraMessageBorderPosXMultiplier = 0;
            this.extraMessageBorderPosYMultiplier = 0;
            this.extraMessageBorderWidthMultiplier = 0;
            this.extraMessageBorderHeightMultiplier = 0;
            this.cursorMultiplier = 1.1;
            this.uppercam = false;
        }
        get mainArcRadius() {
            return (this.viewBoxSize.x * 0.5 * 0.975);
        }
        get cursorArcRadius() {
            return (this.mainArcRadius * this.cursorMultiplier);
        }
        get graduationInnerLineEndOffset() {
            return (this.mainArcRadius * 0.9);
        }
        get graduationOuterLineEndOffset() {
            return (this.mainArcRadius * 1.175);
        }
        get graduationTextOffset() {
            return (this.mainArcRadius * 0.625);
        }
        get redArcInnerRadius() {
            return (this.mainArcRadius * 1);
        }
        get outerIndicatorOffset() {
            return (this.viewBoxSize.x * 0.03);
        }
        get outerIndicatorRadius() {
            return (this.viewBoxSize.x * 0.03);
        }
        get outerDynamicArcRadius() {
            return (this.mainArcRadius * 1.15);
        }
        get currentValueBorderHeight() {
            return (this.viewBoxSize.y * 0.20);
        }
        get extraMessagePosX() {
            return (this.center.x + (this.viewBoxSize.x * this.extraMessagePosXMultiplier));
        }
        get extraMessagePosY() {
            return (this.center.y - (this.viewBoxSize.y * this.extraMessagePosYMultiplier));
        }
        get extraMessageBorderPosX() {
            return (this.extraMessagePosX - (this.viewBoxSize.x * this.extraMessageBorderPosXMultiplier));
        }
        get extraMessageBorderPosY() {
            return (this.extraMessagePosY - (this.viewBoxSize.y * this.extraMessageBorderPosYMultiplier));
        }
        get extraMessageBorderWidth() {
            return (this.viewBoxSize.x * this.extraMessageBorderWidthMultiplier);
        }
        get extraMessageBorderHeight() {
            return (this.viewBoxSize.y * this.extraMessageBorderHeightMultiplier);
        }
        set active(_isActive) {
            if (this.isActive != _isActive) {
                this.isActive = _isActive;
                this.refreshActiveState();
            }
        }
        get active() {
            return this.isActive;
        }
        polarToCartesian(_centerX, _centerY, _radius, _angleInDegrees) {
            const angleInRadians = _angleInDegrees * (Math.PI / 180.0);
            return new Vec2(_centerX + (_radius * Math.cos(angleInRadians)), _centerY + (_radius * Math.sin(angleInRadians)));
        }
        valueToAngle(_value, _radians) {
            const valuePercentage = (_value - this.minValue) / (this.maxValue - this.minValue);
            let angle = (this.startAngle + (valuePercentage * this.arcSize));
            if (_radians) {
                angle *= (Math.PI / 180.0);
            }
            return angle;
        }
        valueToDir(_value) {
            const angle = this.valueToAngle(_value, true);
            return (new Vec2(Math.cos(angle), Math.sin(angle)));
        }
        init(_gaugeDefinition) {
            this.cursorOffset = _gaugeDefinition.cursorOffset;
            this.startAngle = _gaugeDefinition.startAngle;
            this.arcSize = _gaugeDefinition.arcSize;
            this.minValue = _gaugeDefinition.minValue;
            this.maxValue = _gaugeDefinition.maxValue;
            this.minRedValue = _gaugeDefinition.minRedValue;
            this.maxRedValue = _gaugeDefinition.maxRedValue;
            this.warningRange[0] = _gaugeDefinition.warningRange[0];
            this.warningRange[1] = _gaugeDefinition.warningRange[1];
            this.dangerRange[0] = _gaugeDefinition.dangerRange[0];
            this.dangerRange[1] = _gaugeDefinition.dangerRange[1];
            this.cursorMultiplier = _gaugeDefinition.cursorMultiplier;
            this.currentValueFunction = _gaugeDefinition.currentValueFunction;
            this.currentValuePrecision = _gaugeDefinition.currentValuePrecision;
            this.outerIndicatorFunction = _gaugeDefinition.outerIndicatorFunction;
            this.outerDynamicArcFunction = _gaugeDefinition.outerDynamicArcFunction;
            this.extraMessageFunction = _gaugeDefinition.extraMessageFunction;
            this.extraMessagePosXMultiplier = 0.025;
            this.extraMessagePosYMultiplier = 0.025;
            this.extraMessageBorderPosXMultiplier = 0.2;
            this.extraMessageBorderPosYMultiplier = 0.09;
            this.extraMessageBorderWidthMultiplier = 0.4;
            this.extraMessageBorderHeightMultiplier = 0.2;
            this.outerDynamicMarkerFunction = _gaugeDefinition.outerDynamicMarkerFunction;
            this.dangerMinDynamicFunction = _gaugeDefinition.dangerMinDynamicFunction;
            this.uppercam = _gaugeDefinition.uppercam;
            this.endAngle = this.startAngle + _gaugeDefinition.arcSize;
            this.center = new Vec2(this.viewBoxSize.x * 0.5, this.viewBoxSize.y * 0.5);
            this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.rootSVG.id = "RootSVG";
            this.rootSVG.setAttribute("viewBox", "0 0 " + this.viewBoxSize.x + " " + this.viewBoxSize.y);
            this.appendChild(this.rootSVG);
            this.mainArc = document.createElementNS(Avionics.SVG.NS, "path");
            this.mainArc.id = "MainArc";
            {
                const startPos = this.polarToCartesian(this.center.x, this.center.y, this.mainArcRadius, this.endAngle);
                const endPos = this.polarToCartesian(this.center.x, this.center.y, this.mainArcRadius, this.startAngle);
                const largeArcFlag = ((this.endAngle - this.startAngle) <= 180) ? "0" : "1";
                var d = ["M", startPos.x, startPos.y, "A", this.mainArcRadius, this.mainArcRadius, 0, largeArcFlag, 0, endPos.x, endPos.y].join(" ");
                this.mainArc.setAttribute("d", d);
            }
            this.rootSVG.appendChild(this.mainArc);
            if (this.minRedValue != this.maxRedValue) {
                const minRedDir = this.valueToDir(this.minRedValue + this.cursorOffset);
                const maxRedDir = this.valueToDir(this.maxRedValue + this.cursorOffset);
                const topRight = new Vec2(this.center.x + (maxRedDir.x * this.mainArcRadius), this.center.y + (maxRedDir.y * this.mainArcRadius));
                const topLeft = new Vec2(this.center.x + (minRedDir.x * this.mainArcRadius), this.center.y + (minRedDir.y * this.mainArcRadius));
                const bottomRight = new Vec2(this.center.x + (maxRedDir.x * this.redArcInnerRadius), this.center.y + (maxRedDir.y * this.redArcInnerRadius));
                const bottomLeft = new Vec2(this.center.x + (minRedDir.x * this.redArcInnerRadius), this.center.y + (minRedDir.y * this.redArcInnerRadius));
                var d = [
                    "M", topRight.x, topRight.y,
                    "A", this.mainArcRadius, this.mainArcRadius, 0, "0", 0, topLeft.x, topLeft.y,
                    "L", bottomLeft.x, bottomLeft.y,
                    "M", topRight.x, topRight.y,
                    "L", bottomRight.x, bottomRight.y,
                    "A", this.redArcInnerRadius, this.redArcInnerRadius, 0, "0", 0, bottomLeft.x, bottomLeft.y
                ].join(" ");
                this.redArc = document.createElementNS(Avionics.SVG.NS, "path");
                this.redArc.id = "RedArc";
                this.redArc.setAttribute("d", d);
                this.rootSVG.appendChild(this.redArc);
            }
            this.graduationsGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.graduationsGroup.id = "GraduationsGroup";
            this.rootSVG.appendChild(this.graduationsGroup);
            const cursorGroup = document.createElementNS(Avionics.SVG.NS, "g");
            cursorGroup.id = "CursorGroup";
            this.cursor = document.createElementNS(Avionics.SVG.NS, "line");
            this.cursorArcRadiusChoice = this.cursorArcRadius;
            if (this.outerDynamicArcFunction != null) {
                this.cursorArcRadiusChoice = this.outerDynamicArcRadius;
            }
            this.cursor.setAttribute("x1", (this.cursorArcRadiusChoice * (1 - _gaugeDefinition.cursorLength)).toString());
            this.cursor.setAttribute("y1", "0");
            this.cursor.setAttribute("x2", this.cursorArcRadiusChoice.toString());
            this.cursor.setAttribute("y2", "0");
            cursorGroup.setAttribute("transform", "translate(" + this.center.x + ", " + this.center.y + ")");
            cursorGroup.appendChild(this.cursor);
            if (this.outerDynamicArcFunction != null) {
                this.outerDynamicArcObject = document.createElementNS(Avionics.SVG.NS, "path");
                this.outerDynamicArcObject.id = "OuterDynamicArcObject";
                this.rootSVG.appendChild(this.outerDynamicArcObject);
            }
            if (this.outerIndicatorFunction != null) {
                this.outerIndicatorObject = document.createElementNS(Avionics.SVG.NS, "path");
                this.outerIndicatorObject.id = "OuterIndicatorOffset";
                const radius = this.outerIndicatorRadius;
                var d = [
                    "M", (this.mainArcRadius + this.outerIndicatorOffset), "0",
                    "a", radius, radius, "0 1 0", (radius * 2), "0",
                    "a", radius, radius, "0 1 0", -(radius * 2), "0"
                ].join(" ");
                this.outerIndicatorObject.setAttribute("d", d);
                cursorGroup.appendChild(this.outerIndicatorObject);
            }
            this.rootSVG.appendChild(cursorGroup);
            const textPosX = this.viewBoxSize.x * _gaugeDefinition.currentValuePos.x;
            const textPosY = this.viewBoxSize.x * _gaugeDefinition.currentValuePos.y;
            const textPosXdec = (this.currentValuePrecision == 1) ? textPosX - 19 : textPosX;
            const textPosYdec = (this.currentValuePrecision == 1) ? textPosY + 7 : textPosY;
            this.currentValueText = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentValueText.id = "CurrentValue";
            this.currentValueText.setAttribute("x", textPosXdec.toString());
            this.currentValueText.setAttribute("y", textPosY.toString());
            this.currentValueText.setAttribute("alignment-baseline", "central");
            this.rootSVG.appendChild(this.currentValueText);
            const textPosXdecimal = textPosX;
            const textPosYdecimal = textPosYdec;
            this.currentValueTextdecimal = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentValueTextdecimal.id = "CurrentValue";
            this.currentValueTextdecimal.setAttribute("x", textPosXdecimal.toString());
            this.currentValueTextdecimal.setAttribute("y", textPosYdecimal.toString());
            this.currentValueTextdecimal.setAttribute("alignment-baseline", "text-bottom");
            this.rootSVG.appendChild(this.currentValueTextdecimal);
            const textPosXdecP = textPosX - 9;
            this.currentValueTextdecimalP = document.createElementNS(Avionics.SVG.NS, "text");
            this.currentValueTextdecimalP.id = "CurrentValue";
            this.currentValueTextdecimalP.setAttribute("x", textPosXdecP.toString());
            this.currentValueTextdecimalP.setAttribute("y", textPosY.toString());
            //this.currentValueTextdecimalP.textContent = ".";
            this.currentValueTextdecimalP.setAttribute("alignment-baseline", "central");
            this.rootSVG.appendChild(this.currentValueTextdecimalP);
            if (_gaugeDefinition.currentValueBorderWidth > 0) {
                const borderWidth = this.viewBoxSize.x * _gaugeDefinition.currentValueBorderWidth;
                const borderHeight = this.currentValueBorderHeight * 1.2;
                const borderPosX = textPosX - (borderWidth * 0.95);
                const borderPosY = textPosY - (borderHeight * 0.55);
                this.currentValueBorder = document.createElementNS(Avionics.SVG.NS, "rect");
                this.currentValueBorder.id = "CurrentValueBorder";
                this.currentValueBorder.setAttribute("x", borderPosX.toString());
                this.currentValueBorder.setAttribute("y", borderPosY.toString());
                this.currentValueBorder.setAttribute("width", borderWidth.toString());
                this.currentValueBorder.setAttribute("height", borderHeight.toString());
                this.rootSVG.appendChild(this.currentValueBorder);
            }
            if (this.extraMessageFunction != null) {
                const extraMessageGroup = document.createElementNS(Avionics.SVG.NS, "g");
                extraMessageGroup.id = "ExtraMessage";
                this.extraMessageBorder = document.createElementNS(Avionics.SVG.NS, "rect");
                this.extraMessageBorder.setAttribute("x", this.extraMessageBorderPosX.toString());
                this.extraMessageBorder.setAttribute("y", this.extraMessageBorderPosY.toString());
                this.extraMessageBorder.setAttribute("width", this.extraMessageBorderWidth.toString());
                this.extraMessageBorder.setAttribute("height", this.extraMessageBorderHeight.toString());
                this.extraMessageBorder.setAttribute("class", "inactive");
                extraMessageGroup.appendChild(this.extraMessageBorder);
                this.extraMessageText = document.createElementNS(Avionics.SVG.NS, "text");
                this.extraMessageText.setAttribute("x", this.extraMessagePosX.toString());
                this.extraMessageText.setAttribute("y", this.extraMessagePosY.toString());
                this.extraMessageText.setAttribute("alignment-baseline", "central");
                this.extraMessageText.setAttribute("class", "active");
                extraMessageGroup.appendChild(this.extraMessageText);
                this.rootSVG.appendChild(extraMessageGroup);
            }
            this.refreshMainValue(this.minValue, true);
            if (this.outerIndicatorFunction != null) {
                this.refreshOuterIndicator(0, true);
            }
            if (this.outerDynamicArcFunction != null) {
                this.refreshOuterDynamicArc(0, 0);
            }
            this.refreshActiveState();
        }

        //accepts two more parameters to set custom ID for dynamic markers
        addGraduation(_value, _showInnerMarker, _text = "", _showOuterMarker = false, _setid = false, _idName = "", _markerColour = "") {
            const dir = this.valueToDir(_value + this.cursorOffset);
            if (_showInnerMarker) {
                var start = new Vec2(this.center.x + (dir.x * this.mainArcRadius), this.center.y + (dir.y * this.mainArcRadius));
                var end = new Vec2(this.center.x + (dir.x * this.graduationInnerLineEndOffset), this.center.y + (dir.y * this.graduationInnerLineEndOffset));
                var marker = document.createElementNS(Avionics.SVG.NS, "line");
                if (_setid) {
                    marker.setAttribute("id",_idName);
                }
                if (_markerColour != "") {
                    marker.setAttribute("class", "InnerMarker" + " " + _markerColour);
                } else {
                    marker.setAttribute("class", "InnerMarker");
                }
                marker.setAttribute("x1", start.x.toString());
                marker.setAttribute("y1", start.y.toString());
                marker.setAttribute("x2", end.x.toString());
                marker.setAttribute("y2", end.y.toString());
                this.graduationsGroup.appendChild(marker);
            }
            if (_showOuterMarker) {
                var start = new Vec2(this.center.x + (dir.x * this.mainArcRadius), this.center.y + (dir.y * this.mainArcRadius));
                var end = new Vec2(this.center.x + (dir.x * this.graduationOuterLineEndOffset), this.center.y + (dir.y * this.graduationOuterLineEndOffset));
                var marker = document.createElementNS(Avionics.SVG.NS, "line");
                this.outerMarkerValue = _value;
                marker.setAttribute("id", _idName);
                marker.setAttribute("class", "OuterMarker");
                marker.setAttribute("x1", start.x.toString());
                marker.setAttribute("y1", start.y.toString());
                marker.setAttribute("x2", end.x.toString());
                marker.setAttribute("y2", end.y.toString());
                this.graduationsGroup.appendChild(marker);
            }
            if (_text.length > 0) {
                const pos = new Vec2(this.center.x + (dir.x * this.graduationTextOffset), this.center.y + (dir.y * this.graduationTextOffset));
                const text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = _text;
                text.setAttribute("x", pos.x.toString());
                text.setAttribute("y", pos.y.toString());
                text.setAttribute("alignment-baseline", "central");
                this.graduationsGroup.appendChild(text);
            }
        }
        refreshActiveState() {
            const style = this.isActive ? "active" : "inactive";
            if (this.mainArc != null) {
                this.mainArc.setAttribute("class", style);
            }
            if (this.redArc != null) {
                this.redArc.setAttribute("class", style);
            }
            if (this.graduationsGroup != null) {
                this.graduationsGroup.setAttribute("class", style);
            }
            if (this.cursor != null) {
                this.cursor.setAttribute("class", style);
            }
            if (this.outerIndicatorObject != null) {
                this.outerIndicatorObject.setAttribute("class", style);
            }
            if (this.outerDynamicArcObject != null) {
                this.outerDynamicArcObject.setAttribute("class", style);
            }
            if (this.currentValueText != null) {
                this.currentValueText.setAttribute("class", style);
                if (this.uppercam) {
                    this.currentValueBorder.setAttribute('class', style);
                }
                if (!this.isActive) {
                    this.currentValueText.textContent = "XX";
                    this.currentValueTextdecimal.textContent = "";
                    this.currentValueTextdecimalP.textContent = "";
                }
            }
        }
        update(_deltaTime) {
            if (this.isActive) {
                if (this.currentValueFunction != null) {
                    this.refreshMainValue(this.currentValueFunction());
                }
                if (this.outerIndicatorFunction != null) {
                    this.refreshOuterIndicator(this.outerIndicatorFunction());
                }
                if (this.outerDynamicArcFunction != null) {
                    this.outerDynamicArcFunction(this.outerDynamicArcTargetValues);
                    this.refreshOuterDynamicArc(this.outerDynamicArcTargetValues[0], this.outerDynamicArcTargetValues[1]);
                }
                if (this.outerDynamicMarkerFunction != null) {
                    this.refreshOuterMarkerFunction(this.outerDynamicMarkerFunction());
                }
                if (this.dangerMinDynamicFunction != null) {
                    this.refreshDangerMinFunction(this.dangerMinDynamicFunction());
                }
            }
            if ((this.extraMessageFunction != null) && (this.extraMessageText != null) && (this.extraMessageBorder != null)) {
                const extraMessage = this.isActive ? this.extraMessageFunction().toString() : "";
                let style = "";
                if (extraMessage != this.extraMessageString) {
                    if (this.extraMessageFunction().toString() == "AVAIL") {
                        this.extraMessagePosXMultiplier = 0.198;
                        this.extraMessagePosYMultiplier = 0.025;
                        this.extraMessageBorderPosXMultiplier = 0.345;
                        this.extraMessageBorderPosYMultiplier = 0.125;
                        this.extraMessageBorderWidthMultiplier = 0.68;
                        this.extraMessageBorderHeightMultiplier = 0.25;
                        style = "avail ";
                    } else {
                        this.extraMessagePosXMultiplier = 0.05;
                        this.extraMessagePosYMultiplier = 0.025;
                        this.extraMessageBorderPosXMultiplier = 0.2;
                        this.extraMessageBorderPosYMultiplier = 0.09;
                        this.extraMessageBorderWidthMultiplier = 0.4;
                        this.extraMessageBorderHeightMultiplier = 0.2;
                    }
                    this.extraMessageBorder.setAttribute("x", this.extraMessageBorderPosX.toString());
                    this.extraMessageBorder.setAttribute("y", this.extraMessageBorderPosY.toString());
                    this.extraMessageBorder.setAttribute("width", this.extraMessageBorderWidth.toString());
                    this.extraMessageBorder.setAttribute("height", this.extraMessageBorderHeight.toString());
                    this.extraMessageText.setAttribute("x", this.extraMessagePosX.toString());
                    this.extraMessageText.setAttribute("y", this.extraMessagePosY.toString());
                    this.extraMessageText.setAttribute("alignment-baseline", "central");
                    this.extraMessageString = extraMessage;
                    style += (this.extraMessageString.length > 0) ? "active" : "inactive";
                    this.extraMessageBorder.setAttribute("class", style);
                    this.extraMessageText.setAttribute("class", style);
                    this.extraMessageText.textContent = this.extraMessageString;
                }
            }
        }
        //accepts ID_EGT, _value[0] = _id, _value[1] = EGT
        refreshOuterMarkerFunction(_value, _force = false) {
            if (_value[1] != this.outerMarkerValue) {
                this.outerMarkerValue = _value[1];
                const dir = this.valueToDir(_value[1]);
                const start = new Vec2(this.center.x + (dir.x * this.mainArcRadius), this.center.y + (dir.y * this.mainArcRadius));
                const end = new Vec2(this.center.x + (dir.x * this.graduationOuterLineEndOffset), this.center.y + (dir.y * this.graduationOuterLineEndOffset));
                const marker = document.getElementById(_value[0]);
                marker.setAttribute("x1", start.x.toString());
                marker.setAttribute("y1", start.y.toString());
                marker.setAttribute("x2", end.x.toString());
                marker.setAttribute("y2", end.y.toString());
            }
        }
        refreshDangerMinFunction(_value, _force = false) {
            if (_value != this.dangerRange[0]) {
                this.dangerRange[0] = _value;
            }
        }
        refreshMainValue(_value, _force = false) {
            this.currentValue = _value;
            this.currentValueCursor = (_value <= this.minValue) ? this.cursorOffset + this.minValue : _value + this.cursorOffset;
            const clampedValue = Utils.Clamp(this.currentValue, this.minValue, this.maxValue);
            const clampedValueCursor = Utils.Clamp(this.currentValueCursor, this.minValue, this.maxValue);
            let style = "";
            if ((this.dangerRange[0] != this.dangerRange[1]) && (clampedValue >= this.dangerRange[0]) && (clampedValue <= this.dangerRange[1])) {
                style = "danger";
            } else if ((this.warningRange[0] != this.warningRange[1]) && (clampedValue >= this.warningRange[0]) && (clampedValue <= this.warningRange[1])) {
                style = "warning";
            } else {
                style = "active";
            }
            if (this.cursor != null) {
                const angle = this.valueToAngle(clampedValueCursor, false);
                this.cursor.setAttribute("transform", "rotate(" + angle + ")");
                this.cursor.setAttribute("class", style);
            }
            if (this.currentValueText != null) {
                const strValue = this.currentValue.toFixed(this.currentValuePrecision);
                this.currentValueText.textContent = strValue;
                this.currentValueText.setAttribute("class", style);
                if (this.currentValuePrecision > 0) {
                    const strValueArray = strValue.split(".");
                    this.currentValueText.textContent = strValueArray[0];
                    this.currentValueTextdecimal.textContent = strValueArray[1];
                    this.currentValueTextdecimal.setAttribute("class", style + " decimal");
                    this.currentValueTextdecimalP.textContent = ".";
                    this.currentValueTextdecimalP.setAttribute("class", style + " decimalpoint");
                }
            }
        }
        refreshOuterIndicator(_value, _force = false) {
            if ((_value != this.outerIndicatorValue) || _force) {
                this.outerIndicatorValue = _value;
                if (this.outerIndicatorObject != null) {
                    const valueThrottlePosition = (_value <= this.minValue) ? this.cursorOffset + this.minValue : _value + this.cursorOffset;
                    //const valueThrottlePosition = _value + this.cursorOffset;
                    const clampedValueThrottlePosition = Utils.Clamp(valueThrottlePosition , this.minValue, this.maxValue);
                    const angle = this.valueToAngle(clampedValueThrottlePosition, false);
                    this.outerIndicatorObject.setAttribute("transform", "rotate(" + angle + ")");
                }
            }
        }
        refreshOuterDynamicArc(_start, _end, _force = false) {
            if ((_start != this.outerDynamicArcCurrentValues[0]) || (_end != this.outerDynamicArcCurrentValues[1]) || _force) {
                this.outerDynamicArcCurrentValues[0] = Utils.Clamp(_start, this.minValue, this.maxValue);
                this.outerDynamicArcCurrentValues[1] = Utils.Clamp(_end, this.minValue, this.maxValue);
                let d = "";
                if (this.outerDynamicArcCurrentValues[0] != this.outerDynamicArcCurrentValues[1]) {
                    const startAngle = this.valueToAngle(this.outerDynamicArcCurrentValues[0], true);
                    const startX = this.center.x + (Math.cos(startAngle) * this.outerDynamicArcRadius);
                    const startY = this.center.y + (Math.sin(startAngle) * this.outerDynamicArcRadius);
                    const endAngle = this.valueToAngle(this.outerDynamicArcCurrentValues[1], true);
                    const endX = this.center.x + (Math.cos(endAngle) * this.outerDynamicArcRadius);
                    const endY = this.center.y + (Math.sin(endAngle) * this.outerDynamicArcRadius);
                    const largeArcFlag = ((endAngle - startAngle) <= Math.PI) ? "0 0 0" : "0 1 0";
                    d = [
                        "M", endX, endY,
                        "A", this.outerDynamicArcRadius, this.outerDynamicArcRadius, largeArcFlag, startX, startY
                    ].join(" ");
                }
                this.outerDynamicArcObject.setAttribute("d", d);
            }
        }
    }
    A320_Neo_ECAM_Common.Gauge = Gauge;
})(A320_Neo_ECAM_Common || (A320_Neo_ECAM_Common = {}));
customElements.define('a320-neo-ecam-gauge', A320_Neo_ECAM_Common.Gauge);