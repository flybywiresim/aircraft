class Jet_PFD_AirspeedIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.cursorOpacity = "1.0";
        this.fontSize = 22;
        this.machVisible = false;
        this.machSpeed = 0;
        this.refHeight = 0;
        this.targetSpeedPointerHeight = 0;
        this.stripHeight = 0;
        this.stripBorderSize = 0;
        this.stripOffsetX = 0;
        this.speedMarkers = new Array();
        this.speedMarkersWidth = 50;
        this.speedMarkersHeight = 50;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.graduationSpacing = 30;
        this.graduationMinValue = 30;
        this.nbPrimaryGraduations = 11;
        this.nbSecondaryGraduations = 1;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.hudAPSpeed = 0;
        this.isHud = false;
        this.altOver20k = false;
        this._aircraft = Aircraft.A320_NEO;
        this._computedIASAcceleration = 0;
        this._lowestSelectableSpeed = 0;
        this._alphaProtectionMin = 0;
        this._alphaProtectionMax = 0;
        this._stallSpeed = 0;
        this._maxSpeed = 600;
        this._lastMaxSpeedOverride = 600;
        this._lastMaxSpeedOverrideTime = 0;
        this._smoothFactor = 0.5;
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
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "hud":
                this.isHud = newValue == "true";
                break;
        }
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.machPrefixSVG = null;
        this.machValueSVG = null;
        this.targetSpeedSVG = null;
        this.targetSpeedBgSVG = null;
        this.targetSpeedIconSVG = null;
        this.targetSpeedPointerSVG = null;
        this.speedTrendArrowSVG = null;
        this.speedTrendArrowSVGShape = null;
        this.blueSpeedSVG = null;
        this.blueSpeedText = null;
        this.v1blueSpeedText = null;
        this.blueSpeedTextLower = null;
        this.redSpeedSVG = null;
        this.redSpeedText = null;
        this.redSpeedTextLower = null;
        this.speedNotSetSVG = null;
        this.nextFlapSVG = null;
        this.nextFlapSVGShape = null;
        this.greenDotSVG = null;
        this.greenDotSVGShape = null;
        this.stripsSVG = null;
        this.vMaxStripSVG = null;
        this.vLSStripSVG = null;
        this.stallProtMinStripSVG = null;
        this.stallProtMaxStripSVG = null;
        this.stallStripSVG = null;
        this.speedMarkerSVG = null;
        this.speedMarkersWidth = null;
        this.speedMarkersHeight = null;
        this.speedMarkers.splice(0, this.speedMarkers.length);
        this.vSpeedSVG = null;
        this.v1Speed = null;
        this.vRSpeed = null;
        this.v2Speed = null;
        this.vXSpeed = null;
        this.graduationVLine = null;
        this.stripBorderSize = 0;
        this.stripOffsetX = 0;
        this.altOver20k = false;
        this.construct_A320_Neo();
    }
    construct_A320_Neo() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 215 605");
        const posX = 94;
        const posY = 60;
        const width = 95;
        const height = 480;
        const arcWidth = 50;
        this.refHeight = height;
        this.stripBorderSize = 4;
        this.stripOffsetX = -2;
        this.graduationSpacing = 57;
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 20);
        this._accelAlpha = 0.01;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        } else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        {
            if (!this.blueSpeedText) {
                this.blueSpeedText = document.createElementNS(Avionics.SVG.NS, "text");
                this.blueSpeedText.setAttribute("id", "BlueAirspeedText");
            } else {
                Utils.RemoveAllChildren(this.blueSpeedText);
            }
            this.blueSpeedText.setAttribute("x", (posX + 78).toString());
            this.blueSpeedText.setAttribute("y", (posY - 20).toString());
            this.blueSpeedText.setAttribute("fill", "#00FFFF");
            this.blueSpeedText.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.blueSpeedText.setAttribute("font-family", "ECAMFontRegular");
            this.blueSpeedText.setAttribute("text-anchor", "end");
            this.blueSpeedText.setAttribute("alignment-baseline", "central");
            if (!this.v1blueSpeedText) {
                this.v1blueSpeedText = document.createElementNS(Avionics.SVG.NS, "text");
                this.v1blueSpeedText.setAttribute("id", "BlueAirspeedTextUpperV1");
            } else {
                Utils.RemoveAllChildren(this.v1blueSpeedText);
            }
            this.v1blueSpeedText.setAttribute("x", (posX + 60).toString());
            this.v1blueSpeedText.setAttribute("y", (posY + 25).toString());
            this.v1blueSpeedText.setAttribute("fill", "#00FFFF");
            this.v1blueSpeedText.setAttribute("font-size", (this.fontSize * 1.3).toString());
            this.v1blueSpeedText.setAttribute("font-family", "ECAMFontRegular");
            this.v1blueSpeedText.setAttribute("text-anchor", "start");
            this.v1blueSpeedText.setAttribute("alignment-baseline", "central");
            if (!this.blueSpeedTextLower) {
                this.blueSpeedTextLower = document.createElementNS(Avionics.SVG.NS, "text");
                this.blueSpeedTextLower.setAttribute("id", "BlueAirspeedTextLower");
            } else {
                Utils.RemoveAllChildren(this.blueSpeedTextLower);
            }
            this.blueSpeedTextLower.setAttribute("x", (posX + 78).toString());
            this.blueSpeedTextLower.setAttribute("y", (posY + height + 17).toString());
            this.blueSpeedTextLower.setAttribute("fill", "#00FFFF");
            this.blueSpeedTextLower.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.blueSpeedTextLower.setAttribute("font-family", "ECAMFontRegular");
            this.blueSpeedTextLower.setAttribute("text-anchor", "end");
            this.blueSpeedTextLower.setAttribute("alignment-baseline", "central");
            if (!this.redSpeedText) {
                this.redSpeedText = document.createElementNS(Avionics.SVG.NS, "text");
                this.redSpeedText.setAttribute("id", "RedAirspeedText");
            } else {
                Utils.RemoveAllChildren(this.redSpeedText);
            }
            this.redSpeedText.setAttribute("x", (posX + 78).toString());
            this.redSpeedText.setAttribute("y", (posY - 20).toString());
            this.redSpeedText.setAttribute("fill", "#FF94FF");
            this.redSpeedText.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.redSpeedText.setAttribute("font-family", "ECAMFontRegular");
            this.redSpeedText.setAttribute("text-anchor", "end");
            this.redSpeedText.setAttribute("alignment-baseline", "central");
            if (!this.redSpeedTextLower) {
                this.redSpeedTextLower = document.createElementNS(Avionics.SVG.NS, "text");
                this.redSpeedTextLower.setAttribute("id", "RedAirspeedTextLower");
            } else {
                Utils.RemoveAllChildren(this.redSpeedTextLower);
            }
            this.redSpeedTextLower.setAttribute("x", (posX + 78).toString());
            this.redSpeedTextLower.setAttribute("y", (posY + height + 17).toString());
            this.redSpeedTextLower.setAttribute("fill", "#FF94FF");
            this.redSpeedTextLower.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.redSpeedTextLower.setAttribute("font-family", "ECAMFontRegular");
            this.redSpeedTextLower.setAttribute("text-anchor", "end");
            this.redSpeedTextLower.setAttribute("alignment-baseline", "central");
            if (!this.speedNotSetSVG) {
                this.speedNotSetSVG = document.createElementNS(Avionics.SVG.NS, "text");
                this.speedNotSetSVG.setAttribute("id", "speedNotSet");
            } else {
                Utils.RemoveAllChildren(this.speedNotSetSVG);
            }
            this.speedNotSetSVG.textContent = "SPD SEL";
            this.speedNotSetSVG.setAttribute("x", (posX + 60).toString());
            this.speedNotSetSVG.setAttribute("y", (posY - 15).toString());
            this.speedNotSetSVG.setAttribute("fill", "red");
            this.speedNotSetSVG.setAttribute("font-size", (this.fontSize * 1.0).toString());
            this.speedNotSetSVG.setAttribute("font-family", "ECAMFontRegular");
            this.speedNotSetSVG.setAttribute("text-anchor", "end");
            this.speedNotSetSVG.setAttribute("alignment-baseline", "central");
            this.rootGroup.appendChild(this.v1blueSpeedText);
            this.rootGroup.appendChild(this.blueSpeedText);
            this.rootGroup.appendChild(this.blueSpeedTextLower);
            this.rootGroup.appendChild(this.redSpeedText);
            this.rootGroup.appendChild(this.redSpeedTextLower);
            this.rootGroup.appendChild(this.speedNotSetSVG);
        }
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        } else {
            Utils.RemoveAllChildren(this.centerSVG);
        }
        this.centerSVG.setAttribute("x", (posX - width * 0.5).toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", (width + arcWidth).toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + (width + arcWidth) + " " + height);
        {
            const _top = 0;
            const _left = 0;
            const _width = width;
            const _height = height;
            const bg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.bg = bg;
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "#6B798A");
            bg.setAttribute("stroke-width", "3");
            bg.setAttribute("stroke", "tranparent");
            this.centerSVG.appendChild(bg);
            const topLine = document.createElementNS(Avionics.SVG.NS, "line");
            this.topLine = topLine;
            topLine.setAttribute("x1", _left.toString());
            topLine.setAttribute("y1", (_top).toString());
            topLine.setAttribute("x2", (_left + _width + 30).toString());
            topLine.setAttribute("y2", (_top).toString());
            topLine.setAttribute("stroke", "white");
            topLine.setAttribute("stroke-width", "3");
            this.centerSVG.appendChild(topLine);
            const bottomLine = document.createElementNS(Avionics.SVG.NS, "line");
            this.bottomLine = bottomLine;
            bottomLine.setAttribute("x1", _left.toString());
            bottomLine.setAttribute("y1", (_top + _height).toString());
            bottomLine.setAttribute("x2", (_left + _width + 30).toString());
            bottomLine.setAttribute("y2", (_top + _height).toString());
            bottomLine.setAttribute("stroke", "white");
            bottomLine.setAttribute("stroke-width", "3");
            this.centerSVG.appendChild(bottomLine);
            const graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.5;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    line.IsPrimary = (i % (this.nbSecondaryGraduations + 1)) ? false : true;
                    const lineWidth = line.IsPrimary ? 16 : 16;
                    const lineHeight = line.IsPrimary ? 3 : 3;
                    const linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "white");
                    if (line.IsPrimary) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 12).toString());
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 1.5).toString());
                        line.SVGText1.setAttribute("font-family", "ECAMFontRegular");
                        line.SVGText1.setAttribute("text-anchor", "end");
                        line.SVGText1.setAttribute("alignment-baseline", "central");
                    }
                    this.graduations.push(line);
                }
                this.graduationVLine = document.createElementNS(Avionics.SVG.NS, "line");
                this.graduationVLine.setAttribute("x1", this.graduationScrollPosX.toString());
                this.graduationVLine.setAttribute("y1", "0");
                this.graduationVLine.setAttribute("x2", this.graduationScrollPosX.toString());
                this.graduationVLine.setAttribute("y2", "0");
                this.graduationVLine.setAttribute("stroke", "white");
                this.graduationVLine.setAttribute("stroke-width", "3");
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = this.graduations[i];
                    graduationGroup.appendChild(line.SVGLine);
                    if (line.SVGText1) {
                        graduationGroup.appendChild(line.SVGText1);
                    }
                }
                graduationGroup.appendChild(this.graduationVLine);
                this.centerSVG.appendChild(graduationGroup);
            }
            const cursorPosX = _left + _width * 0.5;
            const cursorPosY = _top + _height * 0.5 + 3;
            const cursorWidth = width;
            const cursorHeight = 23;
            if (!this.cursorSVG) {
                this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorSVG.setAttribute("id", "CursorGroup");
            } else {
                Utils.RemoveAllChildren(this.cursorSVG);
            }
            this.cursorSVG.setAttribute("x", cursorPosX.toString());
            this.cursorSVG.setAttribute("y", (cursorPosY - cursorHeight * 0.5).toString());
            this.cursorSVG.setAttribute("width", cursorWidth.toString());
            this.cursorSVG.setAttribute("height", cursorHeight.toString());
            this.cursorSVG.setAttribute("viewBox", "0 0 " + cursorWidth + " " + cursorHeight);
            {
                if (!this.cursorSVGShape) {
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                }
                this.cursorSVGShape.setAttribute("fill", "yellow");
                this.cursorSVGShape.setAttribute("fill-opacity", this.cursorOpacity);
                this.cursorSVGShape.setAttribute("d", "M 25 9 L 55 9 L 78 1 L 78 21 L 55 13 L 25 13 Z");
                this.cursorSVG.appendChild(this.cursorSVGShape);
            }
            if (!this.speedTrendArrowSVG) {
                this.speedTrendArrowSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.speedTrendArrowSVG.setAttribute("id", "SpeedTrendArrowGroup");
            } else {
                Utils.RemoveAllChildren(this.speedTrendArrowSVG);
            }
            this.speedTrendArrowSVG.setAttribute("x", "18");
            this.speedTrendArrowSVG.setAttribute("y", "0");
            this.speedTrendArrowSVG.setAttribute("width", "250");
            this.speedTrendArrowSVG.setAttribute("height", height.toString());
            this.speedTrendArrowSVG.setAttribute("viewBox", "0 0 250 " + height.toString());
            {
                if (!this.speedTrendArrowSVGShape) {
                    this.speedTrendArrowSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                }
                this.speedTrendArrowSVGShape.setAttribute("fill", "none");
                this.speedTrendArrowSVGShape.setAttribute("stroke", "yellow");
                this.speedTrendArrowSVGShape.setAttribute("stroke-width", "2");
                this.speedTrendArrowSVG.appendChild(this.speedTrendArrowSVGShape);
            }
            const greenDotPosX = _left + _width * 0.9;
            const greenDotPosY = _top + _height * 0.5;
            const greenDotWidth = width;
            const greenDotHeight = 20;
            if (!this.greenDotSVG) {
                this.greenDotSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.greenDotSVG.setAttribute("id", "GreenDotIndicatorGroup");
            } else {
                Utils.RemoveAllChildren(this.greenDotSVG);
            }
            this.greenDotSVG.setAttribute("x", greenDotPosX.toFixed(0));
            this.greenDotSVG.setAttribute("y", (greenDotPosY - greenDotHeight * 0.5).toFixed(0));
            this.greenDotSVG.setAttribute("width", greenDotWidth.toFixed(0));
            this.greenDotSVG.setAttribute("height", greenDotHeight.toFixed(0));
            this.greenDotSVG.setAttribute("viewBox", "0 0 " + greenDotWidth + " " + greenDotHeight);
            {
                if (!this.greenDotSVGShape) {
                    this.greenDotSVGShape = document.createElementNS(Avionics.SVG.NS, "circle");
                }
                this.greenDotSVGShape.setAttribute("fill", "none");
                this.greenDotSVGShape.setAttribute("stroke", "rgb(0,255,0)");
                this.greenDotSVGShape.setAttribute("stroke-width", "4");
                this.greenDotSVGShape.setAttribute("cx", "10");
                this.greenDotSVGShape.setAttribute("cy", "10");
                this.greenDotSVGShape.setAttribute("r", "7");
                this.greenDotSVG.appendChild(this.greenDotSVGShape);
            }
            const blueSpeedPosX = _left + _width * 1.025;
            const blueSpeedPosY = _top + _height * 0.5;
            const blueSpeedWidth = width;
            const blueSpeedHeight = 44;
            if (!this.blueSpeedSVG) {
                this.blueSpeedSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.blueSpeedSVG.setAttribute("id", "BlueSpeedGroup");
            } else {
                Utils.RemoveAllChildren(this.blueSpeedSVG);
            }
            this.blueSpeedSVG.setAttribute("x", blueSpeedPosX.toString());
            this.blueSpeedSVG.setAttribute("y", (blueSpeedPosY - blueSpeedHeight * 0.5).toString());
            this.blueSpeedSVG.setAttribute("width", blueSpeedWidth.toString());
            this.blueSpeedSVG.setAttribute("height", blueSpeedHeight.toString());
            this.blueSpeedSVG.setAttribute("viewBox", "0 0 " + blueSpeedWidth + " " + blueSpeedHeight);
            {
                const shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("fill", "none");
                shape.setAttribute("stroke", "#00FFFF");
                shape.setAttribute("stroke-width", "2");
                shape.setAttribute("d", "M 0 22 L 25 0 L 25 44 Z");
                this.blueSpeedSVG.appendChild(shape);
            }
            const redSpeedPosX = _left + _width * 1.025;
            const redSpeedPosY = _top + _height * 0.5;
            const redSpeedWidth = width;
            const redSpeedHeight = 44;
            if (!this.redSpeedSVG) {
                this.redSpeedSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.redSpeedSVG.setAttribute("id", "redAirspeedPointerGroup");
            } else {
                Utils.RemoveAllChildren(this.redSpeedSVG);
            }
            this.redSpeedSVG.setAttribute("x", redSpeedPosX.toString());
            this.redSpeedSVG.setAttribute("y", (redSpeedPosY - redSpeedHeight * 0.5).toString());
            this.redSpeedSVG.setAttribute("width", redSpeedWidth.toString());
            this.redSpeedSVG.setAttribute("height", redSpeedHeight.toString());
            this.redSpeedSVG.setAttribute("viewBox", "0 0 " + redSpeedWidth + " " + redSpeedHeight);
            {
                const shape = document.createElementNS(Avionics.SVG.NS, "path");
                shape.setAttribute("fill", "none");
                shape.setAttribute("stroke", "#FF94FF");
                shape.setAttribute("stroke-width", "2");
                shape.setAttribute("d", "M 0 22 L 25 0 L 25 44 Z");
                this.redSpeedSVG.appendChild(shape);
            }
            const nextFlapPosX = _left + _width * 0.8;
            const nextFlapPosY = _top + _height * 0.5;
            const nextFlapWidth = width;
            const nextFlapHeight = 20;
            if (!this.nextFlapSVG) {
                this.nextFlapSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.nextFlapSVG.setAttribute("id", "NextFlapIndicatorGroup");
            } else {
                Utils.RemoveAllChildren(this.nextFlapSVG);
            }
            this.nextFlapSVG.setAttribute("x", nextFlapPosX.toFixed(0));
            this.nextFlapSVG.setAttribute("y", (nextFlapPosY - nextFlapHeight * 0.5).toFixed(0));
            this.nextFlapSVG.setAttribute("width", nextFlapWidth.toFixed(0));
            this.nextFlapSVG.setAttribute("height", nextFlapHeight.toFixed(0));
            this.nextFlapSVG.setAttribute("viewBox", "0 0 " + nextFlapWidth + " " + nextFlapHeight);
            {
                if (!this.nextFlapSVGShape) {
                    this.nextFlapSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                }
                this.nextFlapSVGShape.setAttribute("fill", "none");
                this.nextFlapSVGShape.setAttribute("stroke", "orange");
                this.nextFlapSVGShape.setAttribute("stroke-width", "4");
                this.nextFlapSVGShape.setAttribute("d", "M 0 4 L 15 4 M 0 16 L 15 16");
                this.nextFlapSVG.appendChild(this.nextFlapSVGShape);
            }
            const stripViewPosX = _left + _width + 4;
            const stripViewPosY = this.stripBorderSize;
            const stripViewWidth = width;
            const stripViewHeight = _height - this.stripBorderSize * 2;
            if (!this.stripsSVG) {
                this.stripsSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.stripsSVG.setAttribute("id", "StripsGroup");
            } else {
                Utils.RemoveAllChildren(this.stripsSVG);
            }
            this.stripsSVG.setAttribute("x", stripViewPosX.toFixed(0));
            this.stripsSVG.setAttribute("y", stripViewPosY.toFixed(0));
            this.stripsSVG.setAttribute("width", stripViewWidth.toFixed(0));
            this.stripsSVG.setAttribute("height", stripViewHeight.toFixed(0));
            this.stripsSVG.setAttribute("viewBox", "0 0 " + stripViewWidth + " " + stripViewHeight);
            {
                this.stripHeight = stripViewHeight * 3;
                this.vMaxStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.vMaxStripSVG.setAttribute("id", "VMax");
                {
                    const stripWidth = 14;
                    const shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "url(#Backlight)");
                    shape.setAttribute("stroke", "red");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.vMaxStripSVG.appendChild(shape);
                    const dashHeight = stripWidth * 1.0;
                    const dashSpacing = dashHeight * 0.75;
                    let y = this.stripHeight - dashHeight;
                    while (y > 0) {
                        const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("fill", "red");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.vMaxStripSVG.appendChild(rect);
                        y -= dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.vMaxStripSVG);
                this.vLSStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.vLSStripSVG.setAttribute("id", "VLS");
                {
                    const stripWidth = 9;
                    const shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "url(#Backlight)");
                    shape.setAttribute("stroke", "orange");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.vLSStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.vLSStripSVG);
                this.stallProtMinStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMinStripSVG.setAttribute("id", "StallProtMin");
                {
                    const stripWidth = 14;
                    const shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "url(#Backlight)");
                    shape.setAttribute("stroke", "orange");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallProtMinStripSVG.appendChild(shape);
                    const dashHeight = stripWidth * 1.0;
                    const dashSpacing = dashHeight * 0.75;
                    let y = 0;
                    while (y < this.stripHeight) {
                        const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("fill", "orange");
                        rect.setAttribute("x", "0");
                        rect.setAttribute("y", y.toString());
                        rect.setAttribute("width", stripWidth.toString());
                        rect.setAttribute("height", dashHeight.toString());
                        this.stallProtMinStripSVG.appendChild(rect);
                        y += dashHeight + dashSpacing;
                    }
                }
                this.stripsSVG.appendChild(this.stallProtMinStripSVG);
                this.stallProtMaxStripSVG = document.createElementNS(Avionics.SVG.NS, "g");
                this.stallProtMaxStripSVG.setAttribute("id", "StallProtMax");
                {
                    const stripWidth = 19;
                    const shape = document.createElementNS(Avionics.SVG.NS, "path");
                    shape.setAttribute("fill", "red");
                    shape.setAttribute("stroke", "red");
                    shape.setAttribute("d", "M 0 0 l " + stripWidth + " 0 l 0 " + (this.stripHeight) + " l " + (-stripWidth) + " 0 Z");
                    this.stallProtMaxStripSVG.appendChild(shape);
                }
                this.stripsSVG.appendChild(this.stallProtMaxStripSVG);
            }
            const speedMarkersPosX = _left + _width;
            const speedMarkersPosY = 0;
            this.speedMarkersWidth = width;
            this.speedMarkersHeight = 50;
            this.createSpeedMarker("1", speedMarkersPosX, speedMarkersPosY, this.updateMarkerV1, 1.0, 1.0, "#00FFFF");
            this.createSpeedMarker("F", speedMarkersPosX, speedMarkersPosY, this.updateMarkerF);
            this.createSpeedMarker("S", speedMarkersPosX, speedMarkersPosY, this.updateMarkerS);
            this.centerSVG.appendChild(this.stripsSVG);
            this.centerSVG.appendChild(this.cursorSVG);
            this.centerSVG.appendChild(this.speedTrendArrowSVG);
            this.centerSVG.appendChild(this.redSpeedSVG);
            this.centerSVG.appendChild(this.blueSpeedSVG);
            this.centerSVG.appendChild(this.speedMarkerSVG);
            this.centerSVG.appendChild(this.nextFlapSVG);
            this.centerSVG.appendChild(this.greenDotSVG);
        }
        this.rootGroup.appendChild(this.centerSVG);
        {
            this.machPrefixSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machPrefixSVG.textContent = ".";
            this.machPrefixSVG.setAttribute("x", (posX - 10).toString());
            this.machPrefixSVG.setAttribute("y", (posY + height + 45).toString());
            this.machPrefixSVG.setAttribute("fill", "rgb(0,255,0)");
            this.machPrefixSVG.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.machPrefixSVG.setAttribute("font-family", "ECAMFontRegular");
            this.machPrefixSVG.setAttribute("text-anchor", "end");
            this.machPrefixSVG.setAttribute("alignment-baseline", "central");
            this.rootGroup.appendChild(this.machPrefixSVG);
            this.machValueSVG = document.createElementNS(Avionics.SVG.NS, "text");
            this.machValueSVG.textContent = "000";
            this.machValueSVG.setAttribute("x", (posX - 10).toString());
            this.machValueSVG.setAttribute("y", (posY + height + 45).toString());
            this.machValueSVG.setAttribute("fill", "rgb(0,255,0)");
            this.machValueSVG.setAttribute("font-size", (this.fontSize * 1.4).toString());
            this.machValueSVG.setAttribute("font-family", "ECAMFontRegular");
            this.machValueSVG.setAttribute("text-anchor", "start");
            this.machValueSVG.setAttribute("alignment-baseline", "central");
            this.rootGroup.appendChild(this.machValueSVG);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    createSpeedMarker(_text, _x, _y, _handler, _scale = 1.0, _textScale = 1.5, _color = "#00FF00", _bg = false, _params = []) {
        const svg = document.createElementNS(Avionics.SVG.NS, "svg");
        svg.setAttribute("id", _text + "_Marker");
        svg.setAttribute("x", _x.toString());
        svg.setAttribute("y", _y.toString());
        svg.setAttribute("width", (this.speedMarkersWidth * _scale).toFixed(0));
        svg.setAttribute("height", (this.speedMarkersHeight * _scale * 1.05).toFixed(0));
        svg.setAttribute("viewBox", "0 0 " + this.speedMarkersWidth + " " + (this.speedMarkersHeight * 1.05));
        const offsetY = (this.speedMarkersHeight - this.speedMarkersHeight * _scale) * 0.5;
        const line = document.createElementNS(Avionics.SVG.NS, "line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", (offsetY + this.speedMarkersHeight * 0.5).toString());
        line.setAttribute("x2", "24");
        line.setAttribute("y2", (offsetY + this.speedMarkersHeight * 0.5).toString());
        line.setAttribute("stroke", _color);
        line.setAttribute("stroke-width", "6");
        svg.appendChild(line);
        if (_bg) {
            const textBG = document.createElementNS(Avionics.SVG.NS, "rect");
            textBG.setAttribute("x", "17");
            textBG.setAttribute("y", (offsetY + this.speedMarkersHeight * 0.3).toString());
            textBG.setAttribute("width", (this.speedMarkersWidth * 0.275).toString());
            textBG.setAttribute("height", (this.speedMarkersHeight * 0.4).toString());
            textBG.setAttribute("fill", "black");
            svg.appendChild(textBG);
        }
        const text = document.createElementNS(Avionics.SVG.NS, "text");
        text.textContent = _text;
        text.setAttribute("x", "30");
        text.setAttribute("y", (offsetY + this.speedMarkersHeight * 0.5).toString());
        text.setAttribute("fill", _color);
        text.setAttribute("font-size", (this.fontSize * _textScale).toString());
        text.setAttribute("font-family", "ECAMFontRegular");
        text.setAttribute("text-anchor", "start");
        text.setAttribute("alignment-baseline", "central");
        svg.appendChild(text);
        const speed = document.createElementNS(Avionics.SVG.NS, "text");
        speed.textContent = _text;
        speed.setAttribute("x", "30");
        speed.setAttribute("y", (offsetY + this.speedMarkersHeight * 0.8).toString());
        speed.setAttribute("fill", _color);
        speed.setAttribute("font-size", (this.fontSize * _textScale).toString());
        speed.setAttribute("font-family", "ECAMFontRegular");
        speed.setAttribute("text-anchor", "start");
        speed.setAttribute("alignment-baseline", "central");
        svg.appendChild(speed);
        const marker = new AirspeedMarker(line, text, speed, _handler.bind(this));
        marker.svg = svg;
        marker.params = _params;
        this.speedMarkers.push(marker);
        if (!this.speedMarkerSVG) {
            this.speedMarkerSVG = document.createElementNS(Avionics.SVG.NS, "g");
        }
        this.speedMarkerSVG.appendChild(svg);
        return marker;
    }
    update(dTime) {
        const indicatedSpeed = Simplane.getIndicatedSpeed();
        if (!this.altOver20k && Simplane.getAltitude() >= 20000) {
            this.altOver20k = true;
        }
        this.updateGraduationScrolling(indicatedSpeed);
        const iasAcceleration = this.computeIAS(indicatedSpeed);
        const speedTrend = iasAcceleration;
        const crossSpeed = SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED", "Knots");
        const cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
        const crossSpeedFactor = Simplane.getCrossoverSpeedFactor(crossSpeed, cruiseMach);
        const nextFlapSpeed = Simplane.getNextFlapsExtendSpeed(this.aircraft) * crossSpeedFactor;
        // Value used to draw the red VMAX barber pole
        const maxSpeed = A32NX_Selectors.VMAX();
        const greenDot = Simplane.getGreenDotSpeed() * crossSpeedFactor;
        const lowestSelectableSpeed = Simplane.getLowestSelectableSpeed();
        const stallProtectionMin = Simplane.getStallProtectionMinSpeed();
        const stallProtectionMax = Simplane.getStallProtectionMaxSpeed();
        const stallSpeed = Simplane.getStallSpeed();
        const planeOnGround = Simplane.getIsGrounded();
        this.smoothSpeeds(indicatedSpeed, dTime, maxSpeed, lowestSelectableSpeed, stallProtectionMin, stallProtectionMax, stallSpeed);
        this.updateSpeedTrendArrow(indicatedSpeed, speedTrend);
        this.updateTargetSpeeds(indicatedSpeed);
        this.updateNextFlapSpeedIndicator(indicatedSpeed, nextFlapSpeed);
        this.updateStrip(this.vMaxStripSVG, indicatedSpeed, this._maxSpeed, false, true);
        this.updateStrip(this.vLSStripSVG, indicatedSpeed, this._lowestSelectableSpeed, planeOnGround, false);
        this.updateStrip(this.stallProtMinStripSVG, indicatedSpeed, this._alphaProtectionMin, planeOnGround, false);
        this.updateStrip(this.stallProtMaxStripSVG, indicatedSpeed, this._alphaProtectionMax, planeOnGround, false);
        this.updateStrip(this.stallStripSVG, indicatedSpeed, this._stallSpeed, planeOnGround, false);
        this.updateGreenDot(indicatedSpeed, greenDot);
        this.updateSpeedMarkers(indicatedSpeed);
        this.updateMachSpeed(dTime);
        this.updateSpeedOverride(dTime);
        this.updateVSpeeds();
        this.updateFail();
    }
    smoothSpeeds(_indicatedSpeed, _dTime, _maxSpeed, _lowestSelectableSpeed, _stallProtectionMin, _stallProtectionMax, _stallSpeed) {
        let refSpeed = _maxSpeed;
        if (this.vLSStripSVG) {
            const delta = _lowestSelectableSpeed - refSpeed;
            if (delta >= 0) {
                _lowestSelectableSpeed -= delta + 5;
            }
            refSpeed = _lowestSelectableSpeed;
        }
        if (this.stallProtMinStripSVG) {
            const delta = _stallProtectionMin - refSpeed;
            if (delta >= 0) {
                _stallProtectionMin -= delta + 5;
            }
            refSpeed = _stallProtectionMin;
        }
        if (this.stallProtMaxStripSVG) {
            const delta = _stallProtectionMax - refSpeed;
            if (delta >= 0) {
                _stallProtectionMax -= delta + 5;
            }
            refSpeed = _stallProtectionMax;
        }
        if (this.stallStripSVG) {
            const delta = _stallSpeed - refSpeed;
            if (delta >= 0) {
                _stallProtectionMax -= delta + 5;
            }
            refSpeed = _stallSpeed;
        }
        const seconds = _dTime / 1000;
        this._maxSpeed = Utils.SmoothSin(this._maxSpeed, _maxSpeed, this._smoothFactor, seconds);
        this._lowestSelectableSpeed = Utils.SmoothSin(this._lowestSelectableSpeed, _lowestSelectableSpeed, this._smoothFactor, seconds);
        this._alphaProtectionMin = Utils.SmoothSin(this._alphaProtectionMin, _stallProtectionMin, this._smoothFactor, seconds);
        this._alphaProtectionMax = Utils.SmoothSin(this._alphaProtectionMax, _stallProtectionMax, this._smoothFactor, seconds);
        this._stallSpeed = Utils.SmoothSin(this._stallSpeed, _stallSpeed, this._smoothFactor, seconds);
        const delta = this._alphaProtectionMax - _indicatedSpeed;
        if (delta >= 0) {
            this._alphaProtectionMax -= delta;
        }
    }
    updateSpeedOverride(_dTime) {
        if (Math.abs(this._maxSpeed - this._lastMaxSpeedOverride) >= 5) {
            this._lastMaxSpeedOverrideTime += _dTime / 1000;
            if (this._lastMaxSpeedOverrideTime > 5) {
                SimVar.SetGameVarValue("AIRCRAFT_MAXSPEED_OVERRIDE", "knots", this._maxSpeed);
                this._lastMaxSpeedOverride = this._maxSpeed;
                this._lastMaxSpeedOverrideTime = 0;
            }
        } else {
            this._lastMaxSpeedOverrideTime = 0;
        }
    }
    updateVSpeeds() {
        if (this.vSpeedSVG) {
            if (Simplane.getIndicatedSpeed() < 30) {
                this.vSpeedSVG.setAttribute("visibility", "visible");
                this.v1Speed.textContent = Simplane.getV1Airspeed().toFixed(0);
                this.vRSpeed.textContent = Simplane.getVRAirspeed().toFixed(0);
                this.v2Speed.textContent = Simplane.getV2Airspeed().toFixed(0);
                this.vXSpeed.textContent = Simplane.getVXAirspeed().toFixed(0);
            } else {
                this.vSpeedSVG.setAttribute("visibility", "hidden");
            }
        }
    }
    computeIAS(_currentSpeed) {
        const newIASTime = {
            ias: _currentSpeed,
            t: performance.now() / 1000
        };
        if (!this._lastIASTime) {
            this._lastIASTime = newIASTime;
            return;
        }

        let frameIASAcceleration = (newIASTime.ias - this._lastIASTime.ias) / (newIASTime.t - this._lastIASTime.t);

        frameIASAcceleration = Math.min(frameIASAcceleration, 10);
        frameIASAcceleration = Math.max(frameIASAcceleration, -10);

        if (isFinite(frameIASAcceleration)) {
            // Low pass filter for accel : https://en.wikipedia.org/wiki/Low-pass_filter
            this._computedIASAcceleration += this._accelAlpha * (frameIASAcceleration - this._computedIASAcceleration);
        }

        this._lastIASTime = newIASTime;
        return this._computedIASAcceleration * 10;
    }
    getAutopilotMode() {
        if (Simplane.getAutoPilotAirspeedHoldActive()) {
            return AutopilotMode.SELECTED;
        }
        return AutopilotMode.MANAGED;
    }
    updateMachSpeed(dTime) {
        if (this.machPrefixSVG && this.machValueSVG) {
            const trueMach = Simplane.getMachSpeed();
            this.machSpeed = Utils.SmoothSin(this.machSpeed, trueMach, 0.25, dTime / 1000);
            if (this.machSpeed > 0.998) {
                this.machSpeed = 0.998;
            }

            const fixedMach = this.machSpeed.toFixed(3);
            if ((!this.machVisible && this.machSpeed >= 0.5) || (this.machVisible && this.machSpeed >= 0.45)) {
                const radixPos = fixedMach.indexOf(".");
                this.machValueSVG.textContent = fixedMach.slice(radixPos + 1);
                this.machVisible = true;
            } else {
                this.machVisible = false;
            }
        }
        if (this.machVisible) {
            this.machPrefixSVG.setAttribute("visibility", "visible");
            this.machValueSVG.setAttribute("visibility", "visible");
        } else {
            this.machPrefixSVG.setAttribute("visibility", "hidden");
            this.machValueSVG.setAttribute("visibility", "hidden");
        }
    }
    arcToSVG(_value) {
        const pixels = (_value * this.graduationSpacing * (this.nbSecondaryGraduations + 1)) / 10;
        return pixels;
    }
    updateGraduationScrolling(_speed) {
        if (this.graduations) {
            if (_speed < this.graduationMinValue) {
                _speed = this.graduationMinValue;
            }
            this.graduationScroller.scroll(_speed);
            let currentVal = this.graduationScroller.firstValue;
            let currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            const startVal = currentVal;
            const startY = currentY;
            for (let i = 0; i < this.totalGraduations; i++) {
                const posX = this.graduationScrollPosX;
                const posY = currentY;
                if ((currentVal < this.graduationMinValue) || (currentVal == this.graduationMinValue && !this.graduations[i].SVGText1)) {
                    this.graduations[i].SVGLine.setAttribute("visibility", "hidden");
                    if (this.graduations[i].SVGText1) {
                        this.graduations[i].SVGText1.setAttribute("visibility", "hidden");
                    }
                } else {
                    this.graduations[i].SVGLine.setAttribute("visibility", "visible");
                    this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    if (this.graduations[i].SVGText1) {
                        if (this.aircraft == Aircraft.CJ4) {
                            if ((currentVal % 4) == 0) {
                                this.graduations[i].SVGText1.textContent = currentVal.toString();
                            } else {
                                this.graduations[i].SVGText1.textContent = "";
                            }
                        } else if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                            if (currentVal < this.graduationMinValue) {
                                this.graduations[i].SVGText1.textContent = "";
                            } else {
                                this.graduations[i].SVGText1.textContent = currentVal.toString();
                            }
                        } else {
                            if (currentVal < this.graduationMinValue) {
                                this.graduations[i].SVGText1.textContent = "";
                            } else {
                                this.graduations[i].SVGText1.textContent = Utils.leadingZeros(currentVal, 3);
                            }
                        }
                        this.graduations[i].SVGText1.setAttribute("visibility", "visible");
                        this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + (posY + 3).toString() + ")");
                    }
                }
                if (this.graduations[i].SVGText1) {
                    currentVal = this.graduationScroller.nextValue;
                }
                currentY -= this.graduationSpacing;
            }
            if (this.graduationVLine) {
                const factor = 10 / this.graduationScroller.increment;
                const offsetY = (Math.min((startVal - this.graduationMinValue), 0) / 10) * this.graduationSpacing * (this.nbSecondaryGraduations) * factor;
                this.graduationVLine.setAttribute("y1", Math.ceil(startY + offsetY).toString());
                this.graduationVLine.setAttribute("y2", Math.floor(currentY + offsetY).toString());
            }
        }
    }
    valueToSvg(current, target) {
        const _top = 0;
        const _height = this.refHeight;
        if (current < this.graduationMinValue) {
            current = this.graduationMinValue;
        }
        const deltaValue = current - target;
        const deltaSVG = deltaValue * this.graduationSpacing * (this.nbSecondaryGraduations + 1) / this.graduationScroller.increment;
        let posY = _top + _height * 0.5 + deltaSVG;
        posY += 2.5;
        return posY;
    }
    updateSpeedTrendArrow(currentAirspeed, speedTrend, hide = false) {
        let hideArrow = true;
        if (this.speedTrendArrowSVG && !hide) {
            if (currentAirspeed > 40 && Math.abs(speedTrend) > 1) {
                const arrowBaseY = this.valueToSvg(currentAirspeed, currentAirspeed);
                const arrowTopY = this.valueToSvg(currentAirspeed, currentAirspeed + speedTrend);
                let arrowPath = "M 70 " + arrowBaseY + " L 70 " + arrowTopY.toFixed(1) + " ";
                if (this.aircraft == Aircraft.CJ4) {
                    arrowPath += "L 50 " + arrowTopY.toFixed(1);
                } else {
                    if (speedTrend > 0) {
                        arrowPath += "M 62 " + (arrowTopY + 8).toFixed(1) + " L 70 " + arrowTopY.toFixed(1) + " L 78 " + (arrowTopY + 8).toFixed(1);
                    } else {
                        arrowPath += "M 62 " + (arrowTopY - 8).toFixed(1) + " L 70 " + arrowTopY.toFixed(1) + " L 78 " + (arrowTopY - 8).toFixed(1);
                    }
                }
                this.speedTrendArrowSVGShape.setAttribute("d", arrowPath);
                hideArrow = false;
            }
        }
        if (hideArrow) {
            this.speedTrendArrowSVG.setAttribute("visibility", "hidden");
        } else {
            this.speedTrendArrowSVG.setAttribute("visibility", "visible");
        }
    }
    updateTargetSpeeds(currentAirspeed) {
        {
            let hideV1BlueTextLower = true;
            let v1Speed = 0;
            if (Simplane.getIsGrounded()) {
                if (Simplane.getCurrentFlightPhase() < FlightPhase.FLIGHT_PHASE_CLIMB) {
                    v1Speed = SimVar.GetSimVarValue("L:AIRLINER_V1_SPEED", "Knots");
                    if (v1Speed > 0) {
                        if (this.valueToSvg(currentAirspeed, v1Speed) <= 0) {
                            hideV1BlueTextLower = false;
                        }
                    }
                }
            }
            if (this.v1blueSpeedText) {
                if (hideV1BlueTextLower) {
                    this.v1blueSpeedText.setAttribute("visibility", "hidden");
                } else {
                    this.v1blueSpeedText.setAttribute("visibility", "visible");
                    this.v1blueSpeedText.textContent = v1Speed.toFixed(0);
                }
            }
        }
        let takeOffSpeedNotSet = false;
        let hudSpeed = -1;
        let hideBluePointer = true;
        let hideBlueText = true;
        let hideBlueTextLower = true;
        {
            let blueAirspeed = 0;
            if (Simplane.getV1Airspeed() < 0) {
                const isSelected = Simplane.getAutoPilotAirspeedSelected();
                if (isSelected) {
                    if (Simplane.getAutoPilotMachModeActive()) {
                        blueAirspeed = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", Simplane.getAutoPilotMachHoldValue());
                    } else {
                        blueAirspeed = Simplane.getAutoPilotAirspeedHoldValue();
                    }
                }
            }
            if (blueAirspeed > this.graduationMinValue) {
                const blueSpeedPosY = this.valueToSvg(currentAirspeed, blueAirspeed);
                const blueSpeedHeight = 44;
                switch (true) {
                    case (blueSpeedPosY > this.refHeight): {
                        hideBlueTextLower = false;
                        break;
                    }
                    case (blueSpeedPosY < 0): {
                        hideBlueText = false;
                        break;
                    }
                    default: {
                        if (this.blueSpeedSVG) {
                            this.blueSpeedSVG.setAttribute("visibility", "visible");
                            this.blueSpeedSVG.setAttribute("y", (blueSpeedPosY - blueSpeedHeight * 0.5).toString());
                        }
                        hideBluePointer = false;
                    }
                }
                hudSpeed = blueAirspeed;
            }
            if (this.blueSpeedSVG && hideBluePointer) {
                this.blueSpeedSVG.setAttribute("visibility", "hidden");
            }
            if (this.blueSpeedText) {
                if (hideBlueText) {
                    this.blueSpeedText.setAttribute("visibility", "hidden");
                } else {
                    this.blueSpeedText.setAttribute("visibility", "visible");
                    this.blueSpeedText.textContent = blueAirspeed.toFixed(0);
                }
            }
            if (this.blueSpeedTextLower) {
                if (hideBlueTextLower) {
                    this.blueSpeedTextLower.setAttribute("visibility", "hidden");
                } else {
                    this.blueSpeedTextLower.setAttribute("visibility", "visible");
                    this.blueSpeedTextLower.textContent = blueAirspeed.toFixed(0);
                }
            }
        }
        let hideRedPointer = true;
        let hideRedText = true;
        let hideRedTextLower = true;
        {
            let redAirspeed = Simplane.getV2Airspeed();
            if (redAirspeed < 0) {
                const isManaged = Simplane.getAutoPilotAirspeedManaged();
                if (isManaged) {
                    if (Simplane.getAutoPilotMachModeActive()) {
                        redAirspeed = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", Simplane.getAutoPilotMachHoldValue());
                    } else {
                        redAirspeed = (Simplane.getCurrentFlightPhase() === FlightPhase.FLIGHT_PHASE_APPROACH) ? SimVar.GetSimVarValue("L:A32NX_AP_APPVLS", "knots") : Simplane.getAutoPilotAirspeedHoldValue();
                    }
                }
            }
            if (redAirspeed > this.graduationMinValue) {
                const redSpeedPosY = this.valueToSvg(currentAirspeed, redAirspeed);
                const redSpeedHeight = 44;
                switch (true) {
                    case (redSpeedPosY > this.refHeight): {
                        hideRedTextLower = false;
                        break;
                    }
                    case (redSpeedPosY < 0): {
                        hideRedText = false;
                        break;
                    }
                    default: {
                        if (this.redSpeedSVG) {
                            this.redSpeedSVG.setAttribute("visibility", "visible");
                            this.redSpeedSVG.setAttribute("y", (redSpeedPosY - redSpeedHeight * 0.5).toString());
                        }
                        hideRedPointer = false;
                    }
                }
                hudSpeed = redAirspeed;
            }
            if (this.redSpeedSVG && hideRedPointer) {
                this.redSpeedSVG.setAttribute("visibility", "hidden");
            }
            if (this.redSpeedText) {
                if (hideRedText) {
                    this.redSpeedText.setAttribute("visibility", "hidden");
                } else {
                    this.redSpeedText.setAttribute("visibility", "visible");
                    this.redSpeedText.textContent = redAirspeed.toFixed(0);
                }
            }
            if (this.redSpeedTextLower) {
                if (hideRedTextLower) {
                    this.redSpeedTextLower.setAttribute("visibility", "hidden");
                } else {
                    this.redSpeedTextLower.setAttribute("visibility", "visible");
                    this.redSpeedTextLower.textContent = redAirspeed.toFixed(0);
                }
            }
        }
        if (hideRedPointer && hideRedText && hideRedTextLower && hideBluePointer && hideBlueText && hideBlueTextLower) {
            takeOffSpeedNotSet = true;
        }

        if (this.speedNotSetSVG) {
            this.speedNotSetSVG.setAttribute("visibility", (takeOffSpeedNotSet) ? "visible" : "hidden");
        }
        if (this.hudAPSpeed != hudSpeed) {
            this.hudAPSpeed = Math.round(hudSpeed);
            SimVar.SetSimVarValue("L:HUD_AP_SELECTED_SPEED", "Number", this.hudAPSpeed);
        }
    }
    updateNextFlapSpeedIndicator(currentAirspeed, nextFlapSpeed) {
        if (this.nextFlapSVG) {
            let hidePointer = true;
            if (nextFlapSpeed > this.graduationMinValue) {
                const nextFlapSpeedPosY = this.valueToSvg(currentAirspeed, nextFlapSpeed);
                const nextFlapSpeedHeight = 20;
                if (nextFlapSpeedPosY > 0) {
                    this.nextFlapSVG.setAttribute("y", (nextFlapSpeedPosY - nextFlapSpeedHeight * 0.5).toString());
                    hidePointer = false;
                }
            }
            if (hidePointer) {
                this.nextFlapSVG.setAttribute("visibility", "hidden");
            } else {
                this.nextFlapSVG.setAttribute("visibility", "visible");
            }
        }
    }
    updateGreenDot(currentAirspeed, _greenDot) {
        if (this.greenDotSVG) {
            let hidePointer = true;
            if (_greenDot > this.graduationMinValue) {
                const greenDotPosY = this.valueToSvg(currentAirspeed, _greenDot);
                const greenDotHeight = 20;
                if (greenDotPosY > 0) {
                    this.greenDotSVG.setAttribute("y", (greenDotPosY - greenDotHeight * 0.5).toString());
                    hidePointer = false;
                }
            }
            if (hidePointer) {
                this.greenDotSVG.setAttribute("visibility", "hidden");
            } else {
                this.greenDotSVG.setAttribute("visibility", "visible");
            }
        }
    }
    updateStrip(_strip, currentAirspeed, maxSpeed, _forceHide, _topToBottom) {
        if (_strip) {
            let hideStrip = true;
            if (!(SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") == 1)) {
                _forceHide = true;
            }
            if (!_forceHide) {
                if (maxSpeed > this.graduationMinValue) {
                    let vPosY = this.valueToSvg(currentAirspeed, maxSpeed);
                    if (vPosY > 0) {
                        if (_topToBottom) {
                            vPosY -= this.stripHeight + this.stripBorderSize;
                        }
                        _strip.setAttribute("transform", "translate(" + this.stripOffsetX + " " + vPosY + ")");
                        hideStrip = false;
                    }
                }
            }
            if (hideStrip) {
                _strip.setAttribute("visibility", "hidden");
            } else {
                _strip.setAttribute("visibility", "visible");
            }
        }
    }
    updateSpeedMarkers(currentAirspeed) {
        for (let i = 0; i < this.speedMarkers.length; i++) {
            this.speedMarkers[i].update(currentAirspeed);
            if (!(SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") == 1)) {
                this.speedMarkers[i].svg.setAttribute("style", "display:none");
            } else {
                this.speedMarkers[i].svg.setAttribute("style", "");
            }
        }
    }
    getFlapApproachSpeed() {
        const dWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        switch (true) {
            case (dWeight <= 50): return 131;
            case (dWeight <= 55): return Math.ceil(131 + 1.2 * (dWeight - 50));
            case (dWeight <= 60): return Math.ceil(137 + 1.4 * (dWeight - 55));
            case (dWeight <= 65): return Math.ceil(144 + dWeight - 60);
            case (dWeight <= 70): return Math.ceil(149 + 1.2 * (dWeight - 65));
            case (dWeight <= 75): return Math.ceil(155 + dWeight - 70);
            default: return Math.ceil(160 + 1.20 * (dWeight - 75));
        }
    }
    getSlatApproachSpeed() {
        const dWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        switch (true) {
            case (dWeight <= 45): return Math.ceil(152 + 1.8 * (dWeight - 40));
            case (dWeight <= 50): return Math.ceil(161 + 1.6 * (dWeight - 45));
            case (dWeight <= 55): return Math.ceil(169 + 1.8 * (dWeight - 50));
            case (dWeight <= 60): return Math.ceil(178 + 1.6 * (dWeight - 55));
            default: return Math.ceil(186 + 1.4 * (dWeight - 60));
        }
    }
    updateMarkerF(_marker, currentAirspeed) {
        let hideMarker = true;
        const phase = Simplane.getCurrentFlightPhase();
        const flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex == 2 || flapsHandleIndex == 3) {
            let flapSpeed = 0;
            if (phase == FlightPhase.FLIGHT_PHASE_TAKEOFF || phase == FlightPhase.FLIGHT_PHASE_CLIMB || phase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                flapSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex - 1) * 1.26;
            } else if (phase == FlightPhase.FLIGHT_PHASE_DESCENT || phase == FlightPhase.FLIGHT_PHASE_APPROACH) {
                flapSpeed = this.getFlapApproachSpeed();
            }
            if (flapSpeed >= 60) {
                const posY = this.valueToSvg(currentAirspeed, flapSpeed);
                _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
                _marker.svg.setAttribute("visibility", "visible");
                hideMarker = false;
            }
        }
        if (hideMarker) {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerS(_marker, currentAirspeed) {
        let hideMarker = true;
        const phase = Simplane.getCurrentFlightPhase();
        const flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex == 1) {
            let slatSpeed = 0;
            if (phase == FlightPhase.FLIGHT_PHASE_TAKEOFF || phase == FlightPhase.FLIGHT_PHASE_CLIMB || phase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                slatSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex - 1) * 1.25;
            } else if (phase == FlightPhase.FLIGHT_PHASE_DESCENT || phase == FlightPhase.FLIGHT_PHASE_APPROACH) {
                slatSpeed = this.getSlatApproachSpeed();
            }
            if (slatSpeed >= 60) {
                const posY = this.valueToSvg(currentAirspeed, slatSpeed);
                _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
                _marker.svg.setAttribute("visibility", "visible");
                hideMarker = false;
            }
        }
        if (hideMarker) {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerV1(_marker, currentAirspeed) {
        let v1Speed = Simplane.getV1Airspeed();
        if (v1Speed > 0) {
            _marker.engaged = true;
        } else if (_marker.engaged && !_marker.passed) {
            v1Speed = SimVar.GetSimVarValue("L:AIRLINER_V1_SPEED", "Knots");
        }
        if (v1Speed > 0) {
            let posY = this.valueToSvg(currentAirspeed, v1Speed);
            if (posY < 25 && (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B)) {
                posY = 25;
                _marker.setOffscreen(true, Math.round(v1Speed));
            } else {
                _marker.setOffscreen(false);
                if (posY >= this.refHeight + 25) {
                    _marker.passed = true;
                }
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerVR(_marker, currentAirspeed) {
        let vRSpeed = Simplane.getVRAirspeed();
        if (vRSpeed > 0) {
            _marker.engaged = true;
        } else if (_marker.engaged && !_marker.passed) {
            vRSpeed = SimVar.GetSimVarValue("L:AIRLINER_VR_SPEED", "Knots");
        }
        if (vRSpeed > 0) {
            const posY = this.valueToSvg(currentAirspeed, vRSpeed);
            if (posY >= this.refHeight + 25) {
                _marker.passed = true;
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerV2(_marker, currentAirspeed) {
        let v2Speed = Simplane.getV2Airspeed();
        if (v2Speed > 0) {
            _marker.engaged = true;
        } else if (_marker.engaged && !_marker.passed) {
            v2Speed = SimVar.GetSimVarValue("L:AIRLINER_V2_SPEED", "Knots");
        }
        if (v2Speed > 0) {
            const posY = this.valueToSvg(currentAirspeed, v2Speed);
            if (posY >= this.refHeight + 25) {
                _marker.passed = true;
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerVRef(_marker, currentAirspeed) {
        const vRefSpeed = Simplane.getREFAirspeed();
        if (vRefSpeed > 0) {
            let posY = this.valueToSvg(currentAirspeed, vRefSpeed);
            if (posY > this.refHeight - 25 && (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B)) {
                posY = this.refHeight - 25;
                _marker.setOffscreen(true, Math.round(vRefSpeed));
            } else {
                _marker.setOffscreen(false);
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerVX(_marker, currentAirspeed) {
        let vxSpeed = Simplane.getVXAirspeed();
        if (vxSpeed > 0) {
            _marker.engaged = true;
        } else if (_marker.engaged && !_marker.passed) {
            vxSpeed = SimVar.GetSimVarValue("L:AIRLINER_VX_SPEED", "Knots");
        }
        if (vxSpeed > 0) {
            const posY = this.valueToSvg(currentAirspeed, vxSpeed);
            if (posY >= this.refHeight + 25) {
                _marker.passed = true;
            }
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateMarkerFlap(_marker, currentAirspeed) {
        let hideMarker = true;
        const phase = Simplane.getCurrentFlightPhase();
        const flapsHandleIndex = Simplane.getFlapsHandleIndex();
        const markerHandleIndex = _marker.params[0];
        if (markerHandleIndex == flapsHandleIndex || markerHandleIndex == (flapsHandleIndex - 1)) {
            if (phase >= FlightPhase.FLIGHT_PHASE_TAKEOFF && ((phase != FlightPhase.FLIGHT_PHASE_CLIMB && phase != FlightPhase.FLIGHT_PHASE_CRUISE) || !this.altOver20k)) {
                hideMarker = false;
            }
        }
        if (!hideMarker) {
            let limitSpeed = 0;
            if (markerHandleIndex == 0) {
                limitSpeed = Simplane.getFlapsLimitSpeed(this.aircraft, 1) + 20;
                _marker.setText("UP");
            } else {
                limitSpeed = Simplane.getFlapsLimitSpeed(this.aircraft, markerHandleIndex);
                const degrees = Simplane.getFlapsHandleAngle(markerHandleIndex);
                _marker.setText(degrees.toFixed(0));
            }
            let speedBuffer = 50;
            {
                let weightRatio = Simplane.getWeight() / Simplane.getMaxWeight();
                weightRatio = (weightRatio - 0.65) / (1 - 0.65);
                weightRatio = 1.0 - Utils.Clamp(weightRatio, 0, 1);
                let altitudeRatio = Simplane.getAltitude() / 30000;
                altitudeRatio = 1.0 - Utils.Clamp(altitudeRatio, 0, 1);
                speedBuffer *= (weightRatio * 0.7 + altitudeRatio * 0.3);
            }
            const posY = this.valueToSvg(currentAirspeed, limitSpeed - speedBuffer);
            _marker.svg.setAttribute("y", (posY - this.speedMarkersHeight * 0.5).toString());
            _marker.svg.setAttribute("visibility", "visible");
        } else {
            _marker.svg.setAttribute("visibility", "hidden");
        }
    }
    updateFail() {
        const failed = !(SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") == 1);
        if (!failed) {
            if (Simplane.getIndicatedSpeed() < 72) {
                this.bottomLine.setAttribute("stroke", "transparent");
            } else {
                this.bottomLine.setAttribute("stroke", "white");
            }
            this.bg.setAttribute("stroke", "transparent");
            this.topLine.setAttribute("stroke", "white");
            this.graduationVLine.setAttribute("stroke", "white");
            this.cursorSVGShape.setAttribute("visibility", "visible");
        } else {
            this.bg.setAttribute("stroke", "red");
            this.topLine.setAttribute("stroke", "red");
            this.bottomLine.setAttribute("stroke", "red");
            this.graduationVLine.setAttribute("stroke", "transparent");
            this.cursorSVGShape.setAttribute("visibility", "hidden");
            this.redSpeedText.setAttribute("visibility", "hidden");
        }
        if (this.graduations != null) {
            for (const grad of this.graduations) {
                grad.SVGLine.setAttribute("visibility", failed ? "hidden" : "visible");
                if (grad.IsPrimary && failed) {
                    grad.SVGText1.textContent = "";
                }
            }
        }
    }
}
customElements.define("jet-pfd-airspeed-indicator", Jet_PFD_AirspeedIndicator);
class AirspeedMarker {
    constructor(_lineSVG, _textSVG, _offscreenSVG, _handler) {
        this.engaged = false;
        this.passed = false;
        this.lineSVG = _lineSVG;
        this.textSVG = _textSVG;
        this.offscreenSVG = _offscreenSVG;
        this.handler = _handler;
        this.setOffscreen(false);
    }
    update(_indicatedSpeed) {
        this.handler(this, _indicatedSpeed);
    }
    setText(_text) {
        this.textSVG.textContent = _text;
    }
    setOffscreen(_offscreen, _speed = 0) {
        if (_offscreen) {
            this.lineSVG.setAttribute("visibility", "hidden");
            this.offscreenSVG.removeAttribute("visibility");
            this.offscreenSVG.textContent = _speed.toString();
        } else {
            this.lineSVG.removeAttribute("visibility");
            this.offscreenSVG.setAttribute("visibility", "hidden");
        }
    }
}
//# sourceMappingURL=AirspeedIndicator.js.map