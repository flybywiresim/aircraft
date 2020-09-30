class Jet_PFD_AltimeterIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.strokeSize = "3";
        this.fontSize = 25;
        this.refHeight = 0;
        this.borderSize = 0;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.nbPrimaryGraduations = 7;
        this.nbSecondaryGraduations = 4;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.graduationSpacing = 42;
        this.groundRibbonHasFixedHeight = false;
        this.groundLineSVGHeight = 0;
        this.mtrsVisible = false;
        this.hudAPAltitude = 0;
        this.isHud = false;
        this._aircraft = Aircraft.A320_NEO;
    }
    static get observedAttributes() {
        return ["hud"];
    }
    get aircraft() {
        return this._aircraft;
    }
    set aircraft(_val) {
        if (this._aircraft != _val) {
            this._aircraft = _val;
            this.construct();
        }
    }
    connectedCallback() {
        this.construct();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "hud":
                this.isHud = newValue == "true";
                break;
        }
    }
    showMTRS(_active) {
        this.mtrsVisible = _active;
    }
    isMTRSVisible() {
        return this.mtrsVisible;
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.graduations = [];
        this.borderSize = 0;
        this.groundRibbonHasFixedHeight = false;
        this.groundLineSVGHeight = 0;
        this.thousandIndicator = null;
        this.targetAltitudeIndicatorSVGText = null;
        this.cursorSVGAltitudeLevelShape = null;
        this.cursorIntegrals = null;
        this.cursorDecimals = null;
        this._delayedAltitude = 0;
        this.construct_A320_Neo();
    }
    //------------------------------------------------------------- A 320 NEO -------------------------------------------------------------------------------------------------
    construct_A320_Neo() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 750");
        var posX = 75;
        var posY = 25;
        var width = 75;
        var height = 480;
        var arcWidth = 40;
        this.refHeight = height;
        this.borderSize = 5;
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 500, true);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new A32NX_Avionics.AltitudeScroller(3, 75, 1, 10, 1000));
        this.cursorIntegrals.push(new A32NX_Avionics.AltitudeScroller(3, 75, 1, 10, 100));
        this.cursorIntegrals.push(new A32NX_Avionics.AltitudeScroller(3, 75, 1, 10, 10));
        this.cursorDecimals = new A32NX_Avionics.AltitudeScroller(5, 25, 20, 100);
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Altimeter");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        }
        else
            Utils.RemoveAllChildren(this.centerSVG);
        this.centerSVG.setAttribute("x", (posX - width * 0.5).toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", (25 + width + arcWidth).toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + (25 + width + arcWidth) + " " + height);
        {
            var _top = 0;
            var _left = 25;
            var _width = width;
            var _height = height;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.bg = bg;
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "#343B51");
            bg.setAttribute("stroke-width", "3");
            this.centerSVG.appendChild(bg);

            var topLine = document.createElementNS(Avionics.SVG.NS, "line");
            this.topLine = topLine;
            topLine.setAttribute("x1", _left.toString());
            topLine.setAttribute("y1", (_top + 2).toString());
            topLine.setAttribute("x2", (_left + _width + arcWidth).toString());
            topLine.setAttribute("y2", (_top + 2).toString());
            topLine.setAttribute("stroke", "white");
            topLine.setAttribute("stroke-width", "3");
            this.centerSVG.appendChild(topLine);

            var bottomLine = document.createElementNS(Avionics.SVG.NS, "line");
            this.bottomLine = bottomLine;
            bottomLine.setAttribute("x1", _left.toString());
            bottomLine.setAttribute("y1", (_top + _height - 2).toString());
            bottomLine.setAttribute("x2", (_left + _width + arcWidth).toString());
            bottomLine.setAttribute("y2", (_top + _height - 2).toString());
            bottomLine.setAttribute("stroke", "white");
            bottomLine.setAttribute("stroke-width", "3");
            this.centerSVG.appendChild(bottomLine);

            //  vertical line on the scale
            const verticalLine = document.createElementNS(Avionics.SVG.NS, "line");
            this.verticalLine = verticalLine;
            verticalLine.setAttribute("x1", (_left + _width - 1).toString());
            verticalLine.setAttribute("y1", (_top).toString());
            verticalLine.setAttribute("x2", (_left + _width - 1).toString());
            verticalLine.setAttribute("y2", (_top + _height).toString());
            verticalLine.setAttribute("stroke", "white");
            verticalLine.setAttribute("stroke-width", "3");
            this.centerSVG.appendChild(verticalLine);

            this.graduationScrollPosX = 0;
            this.graduationScrollPosY = _top + _height * 0.5;
            for (var i = 0; i < this.totalGraduations; i++) {
                var line = new Avionics.SVGGraduation();
                line.IsPrimary = true;
                if (this.nbSecondaryGraduations > 0 && (i % (this.nbSecondaryGraduations + 1)))
                    line.IsPrimary = false;
                var lineWidth = (line.IsPrimary) ? 9 : 9;
                var lineHeight = (line.IsPrimary) ? 3 : 3;
                line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                line.SVGLine.setAttribute("x", (_left + _width - lineWidth).toString());
                line.SVGLine.setAttribute("width", lineWidth.toString());
                line.SVGLine.setAttribute("height", lineHeight.toString());
                line.SVGLine.setAttribute("fill", "white");
                if (line.IsPrimary) {
                    line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                    line.SVGText1.setAttribute("x", (_left + _width - lineWidth - 3).toString());
                    line.SVGText1.setAttribute("fill", "white");
                    line.SVGText1.setAttribute("font-size", (this.fontSize * 1.4).toString());
                    line.SVGText1.setAttribute("font-family", "Roboto-Bold");
                    line.SVGText1.setAttribute("text-anchor", "end");
                    line.SVGText1.setAttribute("alignment-baseline", "central");
                }
                this.graduations.push(line);
            }
            for (var i = 0; i < this.totalGraduations; i++) {
                var line = this.graduations[i];
                this.centerSVG.appendChild(line.SVGLine);
                if (line.SVGText1) {
                    this.centerSVG.appendChild(line.SVGText1);
                }
            }

            var groundRibbonPosX = _left + _width;
            var groundRibbonPosY = 0;
            var groundRibbonWidth = 100;
            var groundRibbonHeight = _height;
            if (!this.groundRibbonSVG) {
                this.groundRibbonSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.groundRibbonSVG.setAttribute("id", "GroundRibbonGroup");
            }
            else
                Utils.RemoveAllChildren(this.groundRibbonSVG);
            this.groundRibbonSVG.setAttribute("x", groundRibbonPosX.toString());
            this.groundRibbonSVG.setAttribute("y", groundRibbonPosY.toString());
            this.groundRibbonSVG.setAttribute("width", groundRibbonWidth.toString());
            this.groundRibbonSVG.setAttribute("height", groundRibbonHeight.toString());
            this.groundRibbonSVG.setAttribute("viewBox", "0 0 " + groundRibbonWidth + " " + groundRibbonHeight);
            {
                if (!this.groundRibbonSVGShape)
                    this.groundRibbonSVGShape = document.createElementNS(Avionics.SVG.NS, "rect");
                this.groundRibbonSVGShape.setAttribute("fill", "red");
                this.groundRibbonSVGShape.setAttribute("stroke", "red");
                this.groundRibbonSVGShape.setAttribute("stroke-width", "2");
                this.groundRibbonSVGShape.setAttribute("width", "12");
                this.groundRibbonSVGShape.setAttribute("x", "2");
                this.groundRibbonSVG.appendChild(this.groundRibbonSVGShape);
            }
            this.centerSVG.appendChild(this.groundRibbonSVG);
            var targetAltitudeIndicatorWidth = 100;
            var targetAltitudeIndicatorHeight = 150;
            var targetAltitudeIndicatorPosX = _left - 9;
            if (!this.targetAltitudeIndicatorSVG) {
                this.targetAltitudeIndicatorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.targetAltitudeIndicatorSVG.setAttribute("id", "TargetAltitudeIndicator");
            }
            else
                Utils.RemoveAllChildren(this.targetAltitudeIndicatorSVG);
            this.targetAltitudeIndicatorSVG.setAttribute("x", targetAltitudeIndicatorPosX.toString());
            this.targetAltitudeIndicatorSVG.setAttribute("width", targetAltitudeIndicatorWidth.toString());
            this.targetAltitudeIndicatorSVG.setAttribute("height", targetAltitudeIndicatorHeight.toString());
            this.targetAltitudeIndicatorSVG.setAttribute("viewBox", "0 0 100 150");
            {
                if (!this.targetAltitudeIndicatorSVGShape)// Altitude target indicator modified shape
                    this.targetAltitudeIndicatorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.targetAltitudeIndicatorSVGShape.setAttribute("fill", "none");
                this.targetAltitudeIndicatorSVGShape.setAttribute("stroke", "cyan");// TBM later (should turn amber for Selected mode)
                this.targetAltitudeIndicatorSVGShape.setAttribute("stroke-width", "3");
                this.targetAltitudeIndicatorSVGShape.setAttribute("d", "M 0 0 L 38 0 L 38 100 L 0 100 L 0 55 L 6 50 L 0 45 Z");
                this.targetAltitudeIndicatorSVG.appendChild(this.targetAltitudeIndicatorSVGShape);
                let textBg = document.createElementNS(Avionics.SVG.NS, "rect");
                textBg.setAttribute("x", "8");
                textBg.setAttribute("y", "35");
                textBg.setAttribute("width", (_width + 2).toString());
                textBg.setAttribute("height", "30");
                textBg.setAttribute("fill", "url(#Backlight)");
                this.targetAltitudeIndicatorSVG.appendChild(textBg);
                this.targetAltitudeIndicatorSVGText = document.createElementNS(Avionics.SVG.NS, "text");
                this.targetAltitudeIndicatorSVGText.textContent = "35000";
                this.targetAltitudeIndicatorSVGText.setAttribute("x", (8 + _width + 18).toString());
                this.targetAltitudeIndicatorSVGText.setAttribute("y", "49");
                this.targetAltitudeIndicatorSVGText.setAttribute("fill", "cyan");
                this.targetAltitudeIndicatorSVGText.setAttribute("font-size", (this.fontSize * 1.15).toString());
                this.targetAltitudeIndicatorSVGText.setAttribute("font-family", "Roboto-Bold");
                this.targetAltitudeIndicatorSVGText.setAttribute("text-anchor", "end");
                this.targetAltitudeIndicatorSVGText.setAttribute("alignment-baseline", "central");
                this.targetAltitudeIndicatorSVG.appendChild(this.targetAltitudeIndicatorSVGText);
            }
            this.centerSVG.appendChild(this.targetAltitudeIndicatorSVG);
            var cursorPosX = _left - 2;
            var cursorPosY = _top + _height * 0.5;
            var cursorWidth = width + arcWidth;
            var cursorHeight = 80;
            if (!this.cursorSVG) {
                this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorSVG.setAttribute("id", "CursorGroup");
            }
            else
                Utils.RemoveAllChildren(this.cursorSVG);
            this.cursorSVG.setAttribute("x", cursorPosX.toString());
            this.cursorSVG.setAttribute("y", (cursorPosY - cursorHeight * 0.5).toString());
            this.cursorSVG.setAttribute("width", cursorWidth.toString());
            this.cursorSVG.setAttribute("height", cursorHeight.toString());
            this.cursorSVG.setAttribute("viewBox", "0 0 " + cursorWidth + " " + cursorHeight);
            {
                var _cursorPosY = cursorHeight * 0.5;
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "url(#Backlight)");
                this.cursorSVGShape.setAttribute("fill-opacity", this.cursorOpacity);
                this.cursorSVGShape.setAttribute("d", "M 0 17.5 L 77 17.5 L 77 0 L 116 0 L 116 80 L 77 80 L 77 62.5 L 0 62.5 M 0 17.5 Z");//M 0 17.5 L 77 17.5 L 77 0 L 115 0 L 115 80 L 77 80 L 77 62.5 L 0 62.5 Z
                this.cursorSVGShape.setAttribute("stroke", "yellow");
                this.cursorSVGShape.setAttribute("stroke-width", this.strokeSize);//"3"
                this.cursorSVG.appendChild(this.cursorSVGShape);
                let integralsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorIntegralsGroup = integralsGroup;
                integralsGroup.setAttribute("x", "0");
                integralsGroup.setAttribute("y", "20");
                integralsGroup.setAttribute("width", cursorWidth.toString());
                integralsGroup.setAttribute("height", 40);
                integralsGroup.setAttribute("viewBox", "0 0 " + cursorWidth + " " + cursorHeight);
                this.cursorSVG.appendChild(integralsGroup);
                {
                    this.cursorIntegrals[0].construct(integralsGroup, 1, _cursorPosY  + 4, _width, "Roboto-Bold", this.fontSize * 3.5, "rgb(36,255,0)");
                    this.cursorIntegrals[1].construct(integralsGroup, 52, _cursorPosY + 4, _width, "Roboto-Bold", this.fontSize * 3.5, "rgb(36,255,0)");
                    this.cursorIntegrals[2].construct(integralsGroup, 103, _cursorPosY + 4, _width, "Roboto-Bold", this.fontSize * 3.5, "rgb(36,255,0)");
                }
                this.cursorDecimals.construct(this.cursorSVG, 114, _cursorPosY - 2, _width, "Roboto-Bold", this.fontSize * 1.15, "rgb(36,255,0)");
            }
            this.centerSVG.appendChild(this.cursorSVG);
            if (!this.targetAltitudeText) {
                this.targetAltitudeText = document.createElement("div");
                this.targetAltitudeText.id = "TargetAltitudeText";
            }
            else {
                Utils.RemoveAllChildren(this.targetAltitudeText);
            }
            this.targetAltitudeText.style.fontSize = "45px";
            this.targetAltitudeText.style.color = "cyan";
            this.targetAltitudeText.style.position = "absolute";
            this.targetAltitudeText.style.top = "-5px";
            this.targetAltitudeText.style.left = "25px";
            this.appendChild(this.targetAltitudeText);
        }
        this.rootGroup.appendChild(this.centerSVG);

        // Added STD Boxed display
        if (!this.STDpressureSVG)
            this.STDpressureSVG = document.createElementNS(Avionics.SVG.NS, "text");
        this.STDpressureSVG.textContent = "STD";
        this.STDpressureSVG.setAttribute("x", "90");//90
        this.STDpressureSVG.setAttribute("y", (posY + height + 90 - 36));// - (this.fontSize * 1.3)).toString());
        this.STDpressureSVG.setAttribute("fill", "cyan");
        this.STDpressureSVG.setAttribute("font-size", (this.fontSize * 1.3).toString());//1.05
        this.STDpressureSVG.setAttribute("font-family", "Roboto-Light");
        this.STDpressureSVG.setAttribute("text-anchor", "start");
        this.STDpressureSVG.setAttribute("alignment-baseline", "central");
        this.STDpressureSVG.setAttribute("letter-spacing", "-3px");
        this.rootGroup.appendChild(this.STDpressureSVG);

        if (!this.STDpressureSVGShape)
            this.STDpressureSVGShape = document.createElementNS(Avionics.SVG.NS, "rect");
        this.STDpressureSVGShape.setAttribute("fill", "none");
        this.STDpressureSVGShape.setAttribute("stroke", "yellow");
        this.STDpressureSVGShape.setAttribute("stroke-width", "3");

        this.STDpressureSVGShape.setAttribute("x", "86");
        this.STDpressureSVGShape.setAttribute("y", (posY + height + 90 - 56));//- height of STD font //1.05  - (this.fontSize * 1.3 + 3)).toString())
        this.STDpressureSVGShape.setAttribute("width", "63");
        this.STDpressureSVGShape.setAttribute("height", "38");//36
        this.rootGroup.appendChild(this.STDpressureSVGShape);

        //  added separate white Legend for pressure display
        if (!this.pressureSVGLegend)
            this.pressureSVGLegend = document.createElementNS(Avionics.SVG.NS, "text");
        this.pressureSVGLegend.textContent = "---";
        this.pressureSVGLegend.setAttribute("x", "60");//90
        this.pressureSVGLegend.setAttribute("y", (posY + height + 80).toString());//+90
        this.pressureSVGLegend.setAttribute("fill", "white");
        this.pressureSVGLegend.setAttribute("font-size", (this.fontSize * 1.3).toString());//1.05
        this.pressureSVGLegend.setAttribute("font-family", "Roboto-Light");
        this.pressureSVGLegend.setAttribute("text-anchor", "start");
        this.pressureSVGLegend.setAttribute("alignment-baseline", "central");
        this.pressureSVGLegend.setAttribute("letter-spacing", "-3px");
        this.rootGroup.appendChild(this.pressureSVGLegend);

        if (!this.pressureSVG)
            this.pressureSVG = document.createElementNS(Avionics.SVG.NS, "text");
        this.pressureSVG.textContent = "---";
        this.pressureSVG.setAttribute("x", "130");
        this.pressureSVG.setAttribute("y", (posY + height + 80).toString());
        this.pressureSVG.setAttribute("fill", "cyan");
        this.pressureSVG.setAttribute("font-size", (this.fontSize * 1.3).toString());
        this.pressureSVG.setAttribute("font-family", "Roboto-Light");
        this.pressureSVG.setAttribute("text-anchor", "start");
        this.pressureSVG.setAttribute("alignment-baseline", "central");
        this.pressureSVG.setAttribute("letter-spacing", "-3px");
        this.rootGroup.appendChild(this.pressureSVG);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(_dTime) {
        var indicatedAltitude = Simplane.getAltitude();

        // This stuff makes the altimeter do a smooth rise to the actual altitude after alignment reaches a certain point
        const desiredDisplayedAltitude = SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") === 0
            ? 0
            : indicatedAltitude;
        const delta = desiredDisplayedAltitude - this._delayedAltitude;
        if (Math.abs(delta) > 0.01) {
            this._delayedAltitude += delta * Math.min(1, (4 * (_dTime / 1000)));
            indicatedAltitude = this._delayedAltitude;
        }

        var groundReference = indicatedAltitude - Simplane.getAltitudeAboveGround();
        var baroMode = Simplane.getPressureSelectedMode(this.aircraft);
        var selectedAltitude;
        if (this.aircraft === Aircraft.AS01B || this.aircraft === Aircraft.B747_8 || this.aircraft === Aircraft.A320_NEO) {
            selectedAltitude = Math.max(0, Simplane.getAutoPilotDisplayedAltitudeLockValue());
        } else {
            selectedAltitude = Math.max(0, Simplane.getAutoPilotAltitudeLockValue());
        }
        this.updateGraduationScrolling(indicatedAltitude);
        this.updateCursorScrolling(indicatedAltitude);
        this.updateGroundReference(indicatedAltitude, groundReference);
        this.updateTargetAltitude(indicatedAltitude, selectedAltitude, baroMode);
        this.updateBaroPressure(baroMode);
        this.updateMtrs(indicatedAltitude, selectedAltitude);
        this.updateFail();
    }
    updateMtrs(_altitude, _selected) {
        if (this.mtrsVisible) {
            if (this.mtrsSelectedGroup) {
                var APMode = this.getAutopilotMode();
                if (APMode != AutopilotMode.MANAGED) {
                    let meters = Math.round(_selected * 0.3048);
                    this.mtrsSelectedSVGText.textContent = meters.toString();
                    this.mtrsSelectedGroup.setAttribute("visibility", "visible");
                }
                else {
                    this.mtrsSelectedGroup.setAttribute("visibility", "hidden");
                }
            }
            if (this.mtrsCursorGroup) {
                let meters = Math.round(_altitude * 0.3048);
                this.mtrsCursorSVGText.textContent = meters.toString();
                this.mtrsCursorGroup.setAttribute("visibility", "visible");
            }
        }
        else {
            if (this.mtrsSelectedGroup)
                this.mtrsSelectedGroup.setAttribute("visibility", "hidden");
            if (this.mtrsCursorGroup)
                this.mtrsCursorGroup.setAttribute("visibility", "hidden");
        }
    }
    updateBaroPressure(_mode) {
        if (this.pressureSVG) {
            var units = Simplane.getPressureSelectedUnits();
            var pressure = Simplane.getPressureValue(units);
            if (_mode == "STD") {
                if (this.aircraft == Aircraft.A320_NEO) {
                    this.STDpressureSVG.setAttribute("visibility", "visible");
                    this.STDpressureSVGShape.setAttribute("visibility", "visible");
                    this.pressureSVGLegend.setAttribute("visibility", "hidden");
                    this.pressureSVG.setAttribute("visibility", "hidden");
                } else {
                    this.pressureSVG.textContent = "STD";
                }
            } else {
                if (this.aircraft == Aircraft.A320_NEO) {
                    this.STDpressureSVG.setAttribute("visibility", "hidden");
                    this.STDpressureSVGShape.setAttribute("visibility", "hidden");
                    this.pressureSVGLegend.setAttribute("visibility", "visible");
                    this.pressureSVG.setAttribute("visibility", "visible");
                    if (_mode == "QFE") {
                        this.pressureSVGLegend.textContent = "QFE ";
                    }
                    else {
                        this.pressureSVGLegend.textContent = "QNH ";
                    }
                    if (units == "millibar") {
                        this.pressureSVG.textContent = pressure.toFixed(0);
                    }
                    else {
                        this.pressureSVG.textContent = pressure.toFixed(2);
                    }
                }
                else if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                    if (units == "millibar") {
                        this.pressureSVG.textContent = pressure.toFixed(0) + " HPA";
                    }
                    else {
                        this.pressureSVG.textContent = pressure.toFixed(2) + " IN";
                    }
                }
                else {
                    if (units == "millibar") {
                        this.pressureSVG.textContent = pressure.toFixed(0) + " Hpa";
                    }
                    else {
                        this.pressureSVG.textContent = pressure.toFixed(2) + " inHg";
                    }
                }
            }
        }
    }
    updateGraduationScrolling(_altitude) {
        let showThousandIndicator = false;
        if (this.graduations) {
            this.graduationScroller.scroll(_altitude);
            var currentVal = this.graduationScroller.firstValue;
            var currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            for (var i = 0; i < this.totalGraduations; i++) {
                var posX = this.graduationScrollPosX;
                var posY = currentY;
                this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                if (this.graduations[i].SVGText1) {
                    var roundedVal = 0;
                    var divider = 100;
                    if (this.aircraft == Aircraft.CJ4) {
                        roundedVal = Math.floor(Math.abs(currentVal));
                        let mod = roundedVal % 1000;
                        if (mod != 0)
                            roundedVal = mod;
                    }
                    else if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                        roundedVal = Math.floor(Math.abs(currentVal));
                        divider = 1000;
                    }
                    else {
                        roundedVal = Math.floor(Math.abs(currentVal) / 100);
                    }
                    if (!this.graduations[i].SVGText2) {
                        this.graduations[i].SVGText1.textContent = ">"  + Utils.leadingZeros(roundedVal, 3); // JZ Added small ">" from the modified Liberation font in front of altitude '\u02c3'
                    }
                    else {
                        var integral = Math.floor(roundedVal / divider);
                        var modulo = Math.floor(roundedVal - (integral * divider));
                        if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B)
                            this.graduations[i].SVGText1.textContent = (integral > 0) ? integral.toString() : "";
                        else {
                            this.graduations[i].SVGText1.textContent = integral.toString();
                        }
                        if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                            this.graduations[i].SVGText2.textContent = Utils.leadingZeros(modulo, 3);
                        } else {
                            this.graduations[i].SVGText2.textContent = Utils.leadingZeros(modulo, 2);
                        }
                    }
                    this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    if (this.graduations[i].SVGText2)
                        this.graduations[i].SVGText2.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    if (this.thousandIndicator && (currentVal % 1000) == 0) {
                        this.thousandIndicator.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                        showThousandIndicator = true;
                    }
                    currentVal = this.graduationScroller.nextValue;
                }
                currentY -= this.graduationSpacing;
            }
        }
        if (this.thousandIndicator)
            this.thousandIndicator.setAttribute("visibility", (showThousandIndicator) ? "visible" : "hidden");
    }
    updateCursorScrolling(_altitude) {
        if (this.cursorIntegrals) {
            let hideZeros = (this.aircraft == Aircraft.A320_NEO) ? true : false;
            this.cursorIntegrals[0].update(_altitude, 10000, (hideZeros) ? 10000 : undefined);
            this.cursorIntegrals[1].update(_altitude, 1000, (hideZeros) ? 1000 : undefined);
            this.cursorIntegrals[2].update(_altitude, 100);
        }
        if (this.cursorDecimals) {
            this.cursorDecimals.update(_altitude);
        }
        if (this.cursorSVGAltitudeLevelShape)
            this.cursorSVGAltitudeLevelShape.classList.toggle("hide", _altitude >= 10000);
    }
    valueToSvg(current, target) {
        var _top = 0;
        var _height = this.refHeight;
        let deltaValue = current - target;
        let deltaSVG = deltaValue * this.graduationSpacing * (this.nbSecondaryGraduations + 1) / this.graduationScroller.increment;
        var posY = _top + _height * 0.5 + deltaSVG;
        return posY;
    }
    updateGroundReference(currentAltitude, groundReference) {
        var currentY = this.valueToSvg(currentAltitude, groundReference);
        if (this.groundRibbonSVG && this.groundRibbonSVGShape) {
            var rectHeight = (this.refHeight - currentY - this.borderSize);
            if (rectHeight > 0) {
                this.groundRibbonSVG.setAttribute("visibility", "visible");
                this.groundRibbonSVG.setAttribute("y", currentY.toString());
                if (!this.groundRibbonHasFixedHeight)
                    this.groundRibbonSVGShape.setAttribute("height", rectHeight.toString());
            }
            else {
                this.groundRibbonSVG.setAttribute("visibility", "hidden");
            }
        }
        if (this.groundLineSVG) {
            if (currentY > 0) {
                this.groundLineSVG.setAttribute("visibility", "visible");
                this.groundLineSVG.setAttribute("y", (currentY - this.groundLineSVGHeight).toString());
            }
            else {
                this.groundLineSVG.setAttribute("visibility", "hidden");
            }
        }
    }
    getAutopilotMode() {
        if (this.aircraft == Aircraft.A320_NEO) {
            if (Simplane.getAutoPilotAltitudeManaged() && SimVar.GetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number") != 0)
                return AutopilotMode.MANAGED;
            return AutopilotMode.SELECTED;
        }
        else {
            return AutopilotMode.SELECTED;
        }
    }
    updateTargetAltitude(currentAltitude, targetAltitude, baroMode) {
        let hudAltitude = 0;
        if (this.targetAltitudeIndicatorSVG) {
            var APMode = this.getAutopilotMode();
            var stdMode = (baroMode == "STD") ? true : false;
            if (this.aircraft == Aircraft.CJ4 || this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                if (APMode != AutopilotMode.MANAGED) {
                    let divider = 100;
                    let refDelta = 275;
                    let textAlwaysVisible = false;
                    let leadingZeros = 2;
                    if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                        divider = 1000;
                        refDelta = 400;
                        textAlwaysVisible = true;
                        leadingZeros = 3;
                    }
                    var integral = Math.floor(targetAltitude / divider);
                    var modulo = Math.floor(targetAltitude - (integral * divider));
                    if (stdMode && targetAltitude >= 1000) {
                        this.targetAltitudeTextSVG1.textContent = "FL";
                        this.targetAltitudeTextSVG2.textContent = Math.floor(targetAltitude / 100).toString();
                    }
                    else {
                        this.targetAltitudeTextSVG1.textContent = integral.toString();
                        this.targetAltitudeTextSVG2.textContent = Utils.leadingZeros(modulo, leadingZeros);
                    }
                    hudAltitude = targetAltitude;
                    let deltaAltitude = targetAltitude - currentAltitude;
                    if (deltaAltitude < -refDelta || deltaAltitude > refDelta) {
                        this.targetAltitudeTextSVG1.setAttribute("visibility", "visible");
                        this.targetAltitudeTextSVG2.setAttribute("visibility", "visible");
                        if (this.targetAltitudeBgSVG)
                            this.targetAltitudeBgSVG.setAttribute("visibility", "visible");
                        this.targetAltitudeIndicatorSVG.setAttribute("visibility", "hidden");
                    }
                    else {
                        this.targetAltitudeTextSVG1.setAttribute("visibility", (textAlwaysVisible) ? "visible" : "hidden");
                        this.targetAltitudeTextSVG2.setAttribute("visibility", (textAlwaysVisible) ? "visible" : "hidden");
                        if (this.targetAltitudeBgSVG)
                            this.targetAltitudeBgSVG.setAttribute("visibility", (textAlwaysVisible) ? "visible" : "hidden");
                        var offsetY = this.valueToSvg(currentAltitude, targetAltitude);
                        offsetY -= 48;
                        this.targetAltitudeIndicatorSVG.setAttribute("y", offsetY.toString());
                        this.targetAltitudeIndicatorSVG.setAttribute("visibility", "visible");
                    }
                }
                else {
                    this.targetAltitudeTextSVG1.setAttribute("visibility", "hidden");
                    this.targetAltitudeTextSVG2.setAttribute("visibility", "hidden");
                    if (this.targetAltitudeBgSVG)
                        this.targetAltitudeBgSVG.setAttribute("visibility", "hidden");
                    this.targetAltitudeIndicatorSVG.setAttribute("visibility", "hidden");
                }
            }
            else if (this.aircraft == Aircraft.A320_NEO) {
                let textContent;
                if (stdMode && targetAltitude >= 1000)
                    textContent = "FL" + Math.abs(targetAltitude / 100).toString();
                else
                    textContent = targetAltitude.toFixed(0);
                let deltaAltitude = targetAltitude - currentAltitude;
                if (deltaAltitude < -650) {
                    this.targetAltitudeText.textContent = textContent;
                    this.targetAltitudeText.style.top = "718px";
                    this.targetAltitudeText.style.left = "85px";
                    this.targetAltitudeText.style.display = "block";
                    this.targetAltitudeText.style.color = (APMode == AutopilotMode.SELECTED) ? "cyan" : "magenta";
                    this.targetAltitudeIndicatorSVG.setAttribute("visibility", "hidden");
                }
                else if (deltaAltitude > 650) {
                    this.targetAltitudeText.textContent = textContent;
                    this.targetAltitudeText.style.top = "-16px";
                    this.targetAltitudeText.style.left = "85px";
                    this.targetAltitudeText.style.display = "block";
                    this.targetAltitudeText.style.color = (APMode == AutopilotMode.SELECTED) ? "cyan" : "magenta";
                    this.targetAltitudeIndicatorSVG.setAttribute("visibility", "hidden");
                }
                else {
                    this.targetAltitudeText.style.display = "none";
                    var offsetY = this.valueToSvg(currentAltitude, targetAltitude);
                    offsetY -= 51;
                    this.targetAltitudeIndicatorSVG.setAttribute("y", offsetY.toString());
                    this.targetAltitudeIndicatorSVG.setAttribute("visibility", "visible");
                    this.targetAltitudeIndicatorSVGShape.setAttribute("stroke", (APMode == AutopilotMode.SELECTED) ? "cyan" : "magenta");
                    if (this.targetAltitudeIndicatorSVGText) {
                        if (targetAltitude >= 10)
                            this.targetAltitudeIndicatorSVGText.textContent = targetAltitude.toFixed(0);
                        else
                            this.targetAltitudeIndicatorSVGText.textContent = "100";
                        this.targetAltitudeIndicatorSVGText.setAttribute("fill", (APMode == AutopilotMode.SELECTED) ? "cyan" : "magenta");
                    }
                }
                hudAltitude = targetAltitude;
            }
        }
        if (this.hudAPAltitude != hudAltitude) {
            this.hudAPAltitude = Math.round(hudAltitude);
            SimVar.SetSimVarValue("L:HUD_AP_SELECTED_ALTITUDE", "Number", this.hudAPAltitude);
        }
    }

    updateFail() {
        var failed = !(SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") == 1);
        if (!failed) {
            this.topLine.setAttribute("stroke", "white");
            this.bottomLine.setAttribute("stroke", "white");
            this.cursorSVGShape.setAttribute("stroke", "yellow");
            this.cursorIntegralsGroup.setAttribute("visibility", "visible");
            this.cursorDecimals.setAttribute("visibility", "visible");
            this.verticalLine.setAttribute("stroke", "white");
            // Code to add if visibilty issues with this part

            // if (this.pressureSVG) {
            //     this.pressureSVGLegend.setAttribute("visibility", "visible");
            //     this.pressureSVG.setAttribute("visibility", "visible");
            // }
            // if (this.STDpressureSVG) {
            // this.STDpressureSVG.setAttribute("visibility", "visible");
            // this.STDpressureSVGShape.setAttribute("visibility", "visible");
            // }
        } else {
            this.topLine.setAttribute("stroke", "red");
            this.bottomLine.setAttribute("stroke", "red");
            this.cursorSVGShape.setAttribute("stroke", "transparent");
            if (this.targetAltitudeTextSVG1) this.targetAltitudeTextSVG1.setAttribute("visibility", "hidden");
            if (this.targetAltitudeTextSVG2) this.targetAltitudeTextSVG2.setAttribute("visibility", "hidden");
            this.cursorIntegralsGroup.setAttribute("visibility", "hidden");
            this.cursorDecimals.setAttribute("visibility", "hidden");
            if (this.targetAltitudeText) this.targetAltitudeText.textContent = "";
            if (this.pressureSVG) this.pressureSVG.setAttribute("visibility", "hidden");
            if (this.pressureSVGLegend) this.pressureSVGLegend.setAttribute("visibility", "hidden");
            if (this.STDpressureSVG) this.STDpressureSVG.setAttribute("visibility", "hidden");
            if (this.STDpressureSVGShape)this.STDpressureSVGShape.setAttribute("visibility", "hidden");
            this.targetAltitudeIndicatorSVG.setAttribute("visibility", "hidden");
            this.verticalLine.setAttribute("stroke", "red");
        }

        if (this.groundRibbonSVGShape) this.groundRibbonSVG.setAttribute("style", failed ? "display:none" : "");
        if (this.cursorSVGScrollTexts) {
            for (let st of this.cursorSVGScrollTexts) {
                st.setAttribute("visibility", failed ? "hidden" : "visible");
            }
        }

        if (this.graduations != null) {
            for (let grad of this.graduations) {
                grad.SVGLine.setAttribute("visibility", failed ? "hidden" : "visible");
                if (grad.IsPrimary && failed) {
                    if (grad.SVGText1) grad.SVGText1.textContent = "";
                    if (grad.SVGText2) grad.SVGText2.textContent = "";
                }
            }
        }
    }
}
customElements.define("jet-pfd-altimeter-indicator", Jet_PFD_AltimeterIndicator);
//# sourceMappingURL=AltimeterIndicator.js.map
