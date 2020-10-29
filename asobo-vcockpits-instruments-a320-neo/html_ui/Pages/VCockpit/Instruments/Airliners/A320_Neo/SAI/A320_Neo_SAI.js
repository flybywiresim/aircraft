class A320_Neo_SAI extends BaseAirliners {
    get templateID() {
        return "A320_Neo_SAI";
    }
    connectedCallback() {
        super.connectedCallback();
        this.addIndependentElementContainer(new NavSystemElementContainer("Altimeter", "Altimeter", new A320_Neo_SAI_Altimeter()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Airspeed", "Airspeed", new A320_Neo_SAI_Airspeed()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Horizon", "Horizon", new A320_Neo_SAI_Attitude()));
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
    }
}
class A320_Neo_SAI_Airspeed extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.airspeedElement = this.gps.getChildById("Airspeed");
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        this.airspeedElement.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_SAI_AirspeedIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.greenColor = "green";
        this.yellowColor = "yellow";
        this.redColor = "red";
        this.fontSize = 25;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.graduationSpacing = 10;
        this.graduationMinValue = 30;
        this.nbPrimaryGraduations = 11;
        this.nbSecondaryGraduations = 3;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
    }
    connectedCallback() {
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 20);
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        const width = 40;
        const height = 250;
        const posX = width * 0.5;
        const posY = 0;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        } else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        const topMask = document.createElementNS(Avionics.SVG.NS, "path");
        topMask.setAttribute("d", "M0 0 l118 0 l0 30 q-118 2 -118 50 Z");
        topMask.setAttribute("fill", "black");
        this.rootGroup.appendChild(topMask);
        const bottomMask = document.createElementNS(Avionics.SVG.NS, "path");
        bottomMask.setAttribute("d", "M0 250 l118 0 l0 -35 q-118 -2 -118 -50 Z");
        bottomMask.setAttribute("fill", "black");
        this.rootGroup.appendChild(bottomMask);
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        } else {
            Utils.RemoveAllChildren(this.centerSVG);
        }
        this.centerSVG.setAttribute("x", (posX - width * 0.5).toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", width.toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        {
            var _top = 0;
            var _left = 0;
            var _width = width;
            var _height = height;
            const bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "black");
            this.centerSVG.appendChild(bg);
            if (this.airspeeds) {
                const arcGroup = document.createElementNS(Avionics.SVG.NS, "g");
                arcGroup.setAttribute("id", "Arcs");
                {
                    this.arcs = [];
                    const _arcWidth = 18;
                    const _arcPosX = _left + _width + 3;
                    const _arcStartPosY = _top + _height * 0.5;
                    var arcHeight = this.arcToSVG(this.airspeeds.greenEnd - this.airspeeds.greenStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.greenStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", _arcPosX.toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", _arcWidth.toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", this.greenColor);
                    this.arcs.push(arc);
                    var arcHeight = this.arcToSVG(this.airspeeds.yellowEnd - this.airspeeds.yellowStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.yellowStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", _arcPosX.toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", _arcWidth.toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", this.yellowColor);
                    this.arcs.push(arc);
                    var arcHeight = this.arcToSVG(this.airspeeds.redEnd - this.airspeeds.redStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.redStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", _arcPosX.toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", _arcWidth.toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", this.redColor);
                    this.arcs.push(arc);
                    var arcHeight = this.arcToSVG(this.airspeeds.whiteEnd - this.airspeeds.whiteStart);
                    var arcPosY = _arcStartPosY - this.arcToSVG(this.airspeeds.whiteStart) - arcHeight;
                    var arc = document.createElementNS(Avionics.SVG.NS, "rect");
                    arc.setAttribute("x", (_arcPosX + _arcWidth * 0.5).toString());
                    arc.setAttribute("y", arcPosY.toString());
                    arc.setAttribute("width", (_arcWidth * 0.5).toString());
                    arc.setAttribute("height", arcHeight.toString());
                    arc.setAttribute("fill", "white");
                    this.arcs.push(arc);
                    for (var i = 0; i < this.arcs.length; i++) {
                        arcGroup.appendChild(this.arcs[i]);
                    }
                    this.centerSVG.appendChild(arcGroup);
                }
            }
            const graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.5;
                this.graduations = [];
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    const mod = i % (this.nbSecondaryGraduations + 1);
                    line.IsPrimary = (mod == 0) ? true : false;
                    const lineWidth = (mod == 2) ? 10 : 4;
                    const lineHeight = (mod == 2) ? 2 : 2;
                    const linePosX = -lineWidth;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "white");
                    if (mod == 0) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 2).toString());
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 0.65).toString());
                        line.SVGText1.setAttribute("font-family", "Roboto-Bold");
                        line.SVGText1.setAttribute("text-anchor", "end");
                        line.SVGText1.setAttribute("alignment-baseline", "central");
                    }
                    this.graduations.push(line);
                }
                for (var i = 0; i < this.totalGraduations; i++) {
                    var line = this.graduations[i];
                    graduationGroup.appendChild(line.SVGLine);
                    if (line.SVGText1) {
                        graduationGroup.appendChild(line.SVGText1);
                    }
                }
                this.centerSVG.appendChild(graduationGroup);
            }
        }
        this.rootGroup.appendChild(this.centerSVG);
        const cursorPosX = _left + _width;
        const cursorPosY = _top + _height * 0.5;
        const cursorWidth = 12;
        const cursorHeight = 18;
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
            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", "0");
            rect.setAttribute("y", "0");
            rect.setAttribute("width", cursorWidth.toString());
            rect.setAttribute("height", cursorHeight.toString());
            rect.setAttribute("fill", "black");
            this.cursorSVG.appendChild(rect);
            if (!this.cursorSVGShape) {
                this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
            }
            this.cursorSVGShape.setAttribute("d", "M 0 " + (cursorHeight * 0.5) + " L" + cursorWidth + " 0 L" + cursorWidth + " " + cursorHeight + " Z");
            this.cursorSVGShape.setAttribute("fill", "yellow");
            this.cursorSVG.appendChild(this.cursorSVGShape);
            this.rootGroup.appendChild(this.cursorSVG);
        }
        const topBg = document.createElementNS(Avionics.SVG.NS, "rect");
        topBg.setAttribute("x", _left.toString());
        topBg.setAttribute("y", (_top - 5).toString());
        topBg.setAttribute("width", "125");
        topBg.setAttribute("height", "35");
        topBg.setAttribute("fill", "black");
        this.rootGroup.appendChild(topBg);
        const bottomBg = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBg.setAttribute("x", _left.toString());
        bottomBg.setAttribute("y", (_top + _height - 35).toString());
        bottomBg.setAttribute("width", "125");
        bottomBg.setAttribute("height", "40");
        bottomBg.setAttribute("fill", "black");
        this.rootGroup.appendChild(bottomBg);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(dTime) {
        const indicatedSpeed = Simplane.getIndicatedSpeed();
        this.updateArcScrolling(indicatedSpeed);
        this.updateGraduationScrolling(indicatedSpeed);
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
            for (let i = 0; i < this.totalGraduations; i++) {
                const posX = this.graduationScrollPosX;
                const posY = currentY;
                if ((currentVal < this.graduationMinValue) || (currentVal == this.graduationMinValue && !this.graduations[i].SVGText1)) {
                    this.graduations[i].SVGLine.setAttribute("visibility", "hidden");
                    if (this.graduations[i].SVGText1) {
                        this.graduations[i].SVGText1.setAttribute("visibility", "hidden");
                    }
                } else {
                    this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    if (this.graduations[i].SVGText1) {
                        this.graduations[i].SVGText1.textContent = currentVal.toString();
                        this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    }
                }
                if (this.graduations[i].SVGText1) {
                    currentVal = this.graduationScroller.nextValue;
                }
                currentY -= this.graduationSpacing;
            }
        }
    }
    updateArcScrolling(_speed) {
        if (this.arcs) {
            const offset = this.arcToSVG(_speed);
            for (let i = 0; i < this.arcs.length; i++) {
                this.arcs[i].setAttribute("transform", "translate(0 " + offset.toString() + ")");
            }
        }
    }
}
customElements.define('a320-neo-sai-airspeed-indicator', A320_Neo_SAI_AirspeedIndicator);
class A320_Neo_SAI_Altimeter extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.altimeterElement = this.gps.getChildById("Altimeter");
    }
    onEnter() {
    }
    isReady() {
        return true;
        ;
    }
    onUpdate(_deltaTime) {
        this.altimeterElement.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
                break;
        }
    }
}
class A320_Neo_SAI_AltimeterIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.fontSize = 25;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.nbPrimaryGraduations = 7;
        this.nbSecondaryGraduations = 4;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.graduationSpacing = 14;
    }
    connectedCallback() {
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 500, true);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 65, 1, 10, 1000));
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 65, 1, 10, 100));
        this.cursorIntegrals.push(new Avionics.AltitudeScroller(3, 65, 1, 10, 10));
        this.cursorDecimals = new Avionics.AltitudeScroller(3, 32, 10, 100);
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        const width = 60;
        const height = 250;
        const posX = 40 + width * 0.5;
        const posY = 0;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Altimeter");
        } else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerSVG) {
            this.centerSVG = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSVG.setAttribute("id", "CenterGroup");
        } else {
            Utils.RemoveAllChildren(this.centerSVG);
        }
        const topMask = document.createElementNS(Avionics.SVG.NS, "path");
        topMask.setAttribute("d", "M0 0 l0 30 q118 2 118 50 l0 -80 Z");
        topMask.setAttribute("fill", "black");
        this.rootGroup.appendChild(topMask);
        const bottomMask = document.createElementNS(Avionics.SVG.NS, "path");
        bottomMask.setAttribute("d", "M0 250 l0 -35 q118 -2 118 -50 l0 85 Z");
        bottomMask.setAttribute("fill", "black");
        this.rootGroup.appendChild(bottomMask);
        this.centerSVG.setAttribute("x", posX.toString());
        this.centerSVG.setAttribute("y", posY.toString());
        this.centerSVG.setAttribute("width", width.toString());
        this.centerSVG.setAttribute("height", height.toString());
        this.centerSVG.setAttribute("viewBox", "0 0 " + width + " " + height);
        this.centerSVG.setAttribute("overflow", "hidden");
        {
            var _top = 0;
            var _left = 0;
            var _width = width;
            var _height = height;
            const bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "black");
            this.centerSVG.appendChild(bg);
            this.graduationScrollPosX = _left;
            this.graduationScrollPosY = _top + _height * 0.5;
            this.graduations = [];
            for (var i = 0; i < this.totalGraduations; i++) {
                var line = new Avionics.SVGGraduation();
                line.IsPrimary = true;
                if (this.nbSecondaryGraduations > 0 && (i % (this.nbSecondaryGraduations + 1))) {
                    line.IsPrimary = false;
                }
                const lineWidth = line.IsPrimary ? 4 : 12;
                line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                line.SVGLine.setAttribute("x", "0");
                line.SVGLine.setAttribute("width", lineWidth.toString());
                line.SVGLine.setAttribute("height", "2");
                line.SVGLine.setAttribute("fill", "white");
                if (line.IsPrimary) {
                    line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                    line.SVGText1.setAttribute("x", (lineWidth + 2).toString());
                    line.SVGText1.setAttribute("fill", "white");
                    line.SVGText1.setAttribute("font-size", (this.fontSize * 0.85).toString());
                    line.SVGText1.setAttribute("font-family", "Roboto-Bold");
                    line.SVGText1.setAttribute("text-anchor", "start");
                    line.SVGText1.setAttribute("alignment-baseline", "central");
                }
                this.graduations.push(line);
            }
            const graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "graduationGroup");
            for (var i = 0; i < this.totalGraduations; i++) {
                var line = this.graduations[i];
                graduationGroup.appendChild(line.SVGLine);
                if (line.SVGText1) {
                    graduationGroup.appendChild(line.SVGText1);
                }
                if (line.SVGText2) {
                    graduationGroup.appendChild(line.SVGText2);
                }
            }
            this.centerSVG.appendChild(graduationGroup);
        }
        this.rootGroup.appendChild(this.centerSVG);
        _left = posX - width * 0.5;
        const cursorPosX = _left + 5;
        const cursorPosY = _top + _height * 0.5;
        const cursorWidth = width * 1.25;
        const cursorHeight = 39;
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
        this.cursorSVG.setAttribute("viewBox", "0 4 " + cursorWidth + " " + cursorHeight);
        {
            const _scale = 0.6;
            const trs = document.createElementNS(Avionics.SVG.NS, "g");
            trs.setAttribute("transform", "scale(" + _scale + ")");
            this.cursorSVG.appendChild(trs);
            if (!this.cursorSVGShape) {
                this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
            }
            this.cursorSVGShape.setAttribute("fill", "black");
            this.cursorSVGShape.setAttribute("d", "M0 22 L65 22 L65 6 L140 6 L140 72 L65 72 L65 56 L0 56 Z");
            this.cursorSVGShape.setAttribute("stroke", "yellow");
            this.cursorSVGShape.setAttribute("stroke-width", "0.85");
            trs.appendChild(this.cursorSVGShape);
            const _cursorWidth = (cursorWidth / _scale);
            const _cursorHeight = (cursorHeight / _scale + 10);
            const _cursorPosX = 0;
            const _cursorPosY = _cursorHeight * 0.5;
            const integralsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
            integralsGroup.setAttribute("x", "0");
            integralsGroup.setAttribute("y", "23");
            integralsGroup.setAttribute("width", _cursorWidth.toString());
            integralsGroup.setAttribute("height", (_cursorHeight - 43).toString());
            integralsGroup.setAttribute("viewBox", "0 0 " + (_cursorWidth) + " " + (_cursorHeight));
            trs.appendChild(integralsGroup);
            {
                this.cursorIntegrals[0].construct(integralsGroup, _cursorPosX - 22, _cursorPosY - 2, _width, "Roboto-Bold", this.fontSize * 3, "green");
                this.cursorIntegrals[1].construct(integralsGroup, _cursorPosX + 24, _cursorPosY - 2, _width, "Roboto-Bold", this.fontSize * 3, "green");
                this.cursorIntegrals[2].construct(integralsGroup, _cursorPosX + 70, _cursorPosY - 2, _width, "Roboto-Bold", this.fontSize * 3, "green");
            }
            this.cursorDecimals.construct(trs, _cursorPosX + 118, _cursorPosY, _width, "Roboto-Bold", this.fontSize * 1.6, "green");
            this.rootGroup.appendChild(this.cursorSVG);
        }
        const topBg = document.createElementNS(Avionics.SVG.NS, "rect");
        topBg.setAttribute("x", (_left - 40).toString());
        topBg.setAttribute("y", (_top - 5).toString());
        topBg.setAttribute("width", "125");
        topBg.setAttribute("height", "35");
        topBg.setAttribute("fill", "black");
        this.rootGroup.appendChild(topBg);
        const bottomBg = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBg.setAttribute("x", (_left - 40).toString());
        bottomBg.setAttribute("y", (_top + _height - 35).toString());
        bottomBg.setAttribute("width", "125");
        bottomBg.setAttribute("height", "40");
        bottomBg.setAttribute("fill", "black");
        this.rootGroup.appendChild(bottomBg);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update(_dTime) {
        const altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet");
        this.updateGraduationScrolling(altitude);
        this.updateCursorScrolling(altitude);
        this.updateBaroPressure();
    }
    updateBaroPressure() {
        if (this.pressureSVG) {
            const pressure = SimVar.GetSimVarValue("KOHLSMAN SETTING HG:2", "inches of mercury");
            this.pressureSVG.textContent = fastToFixed(pressure, 2) + " in";
        }
    }
    updateGraduationScrolling(_altitude) {
        if (this.graduations) {
            this.graduationScroller.scroll(_altitude);
            let currentVal = this.graduationScroller.firstValue;
            let currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            let firstRoundValueY = currentY;
            for (let i = 0; i < this.totalGraduations; i++) {
                const posX = this.graduationScrollPosX;
                const posY = Math.round(currentY);
                this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                if (this.graduations[i].SVGText1) {
                    let roundedVal = 0;
                    roundedVal = Math.floor(Math.abs(currentVal));
                    const integral = Math.floor(roundedVal / 100);
                    this.graduations[i].SVGText1.textContent = Utils.leadingZeros(integral, 3);
                    this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    if (this.graduations[i].SVGText2) {
                        this.graduations[i].SVGText2.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    }
                    firstRoundValueY = posY;
                    currentVal = this.graduationScroller.nextValue;
                }
                currentY -= this.graduationSpacing;
            }
            if (this.graduationBarSVG) {
                this.graduationBarSVG.setAttribute("transform", "translate(0 " + firstRoundValueY + ")");
            }
        }
    }
    updateCursorScrolling(_altitude) {
        if (this.cursorIntegrals) {
            this.cursorIntegrals[0].update(_altitude, 10000, 10000);
            this.cursorIntegrals[1].update(_altitude, 1000, 1000);
            this.cursorIntegrals[2].update(_altitude, 100);
        }
        if (this.cursorDecimals) {
            this.cursorDecimals.update(_altitude);
        }
    }
}
customElements.define('a320-neo-sai-altimeter-indicator', A320_Neo_SAI_AltimeterIndicator);
class A320_Neo_SAI_Attitude extends NavSystemElement {
    init(root) {
        this.attitudeElement = this.gps.getChildById("Horizon");
        this.attitudeElement.setAttribute("is-backup", "true");
        if (this.gps) {
            const aspectRatio = this.gps.getAspectRatio();
            this.attitudeElement.setAttribute("aspect-ratio", aspectRatio.toString());
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        const xyz = Simplane.getOrientationAxis();
        if (xyz) {
            this.attitudeElement.setAttribute("pitch", (xyz.pitch / Math.PI * 180).toString());
            this.attitudeElement.setAttribute("bank", (xyz.bank / Math.PI * 180).toString());
            this.attitudeElement.setAttribute("slip_skid", Simplane.getInclinometer().toString());
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_SAI_AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.backgroundVisible = true;
        this.bankSizeRatio = -8.25;
        this.bankSizeRatioFactor = 1.0;
    }
    static get observedAttributes() {
        return [
            "pitch",
            "bank",
            "slip_skid",
            "background",
        ];
    }
    connectedCallback() {
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.bankSizeRatioFactor = 0.62;
        {
            this.horizon_root = document.createElementNS(Avionics.SVG.NS, "svg");
            this.horizon_root.setAttribute("width", "100%");
            this.horizon_root.setAttribute("height", "100%");
            this.horizon_root.setAttribute("viewBox", "-200 -200 400 300");
            this.horizon_root.setAttribute("x", "-100");
            this.horizon_root.setAttribute("y", "-100");
            this.horizon_root.setAttribute("overflow", "visible");
            this.horizon_root.setAttribute("style", "position:absolute; z-index: -3; width: 100%; height:100%;");
            this.horizon_root.setAttribute("transform", "translate(0, 100)");
            this.appendChild(this.horizon_root);
            this.horizonTopColor = "#3D9FFF";
            this.horizonBottomColor = "#905A45";
            this.horizonTop = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonTop.setAttribute("fill", (this.backgroundVisible) ? this.horizonTopColor : "transparent");
            this.horizonTop.setAttribute("x", "-1000");
            this.horizonTop.setAttribute("y", "-1000");
            this.horizonTop.setAttribute("width", "2000");
            this.horizonTop.setAttribute("height", "2000");
            this.horizon_root.appendChild(this.horizonTop);
            this.bottomPart = document.createElementNS(Avionics.SVG.NS, "g");
            this.horizon_root.appendChild(this.bottomPart);
            this.horizonBottom = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonBottom.setAttribute("fill", (this.backgroundVisible) ? this.horizonBottomColor : "transparent");
            this.horizonBottom.setAttribute("x", "-1500");
            this.horizonBottom.setAttribute("y", "0");
            this.horizonBottom.setAttribute("width", "3000");
            this.horizonBottom.setAttribute("height", "3000");
            this.bottomPart.appendChild(this.horizonBottom);
            const separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "-3");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "6");
            this.bottomPart.appendChild(separator);
        }
        {
            const pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-14%";
            pitchContainer.style.left = "-10%";
            pitchContainer.style.width = "120%";
            pitchContainer.style.height = "120%";
            pitchContainer.style.position = "absolute";
            pitchContainer.style.transform = "scale(1.35)";
            this.appendChild(pitchContainer);
            this.pitch_root = document.createElementNS(Avionics.SVG.NS, "svg");
            this.pitch_root.setAttribute("width", "100%");
            this.pitch_root.setAttribute("height", "100%");
            this.pitch_root.setAttribute("viewBox", "-200 -200 400 300");
            this.pitch_root.setAttribute("overflow", "visible");
            this.pitch_root.setAttribute("style", "position:absolute; z-index: -2;");
            pitchContainer.appendChild(this.pitch_root);
            {
                this.pitch_root_group = document.createElementNS(Avionics.SVG.NS, "g");
                this.pitch_root.appendChild(this.pitch_root_group);
                const x = -115;
                const y = -122;
                const w = 230;
                const h = 275;
                const attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
                attitudePitchContainer.setAttribute("width", w.toString());
                attitudePitchContainer.setAttribute("height", h.toString());
                attitudePitchContainer.setAttribute("x", x.toString());
                attitudePitchContainer.setAttribute("y", y.toString());
                attitudePitchContainer.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
                attitudePitchContainer.setAttribute("overflow", "hidden");
                this.pitch_root_group.appendChild(attitudePitchContainer);
                {
                    this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
                    attitudePitchContainer.appendChild(this.attitude_pitch);
                    const maxDash = 80;
                    const fullPrecisionLowerLimit = -20;
                    const fullPrecisionUpperLimit = 20;
                    const halfPrecisionLowerLimit = -30;
                    const halfPrecisionUpperLimit = 45;
                    const unusualAttitudeLowerLimit = -30;
                    const unusualAttitudeUpperLimit = 50;
                    const bigWidth = 50;
                    const bigHeight = 3;
                    const mediumWidth = 30;
                    const mediumHeight = 3;
                    const smallWidth = 10;
                    const smallHeight = 2;
                    const fontSize = 20;
                    let angle = -maxDash;
                    let nextAngle;
                    let width;
                    let height;
                    let text;
                    while (angle <= maxDash) {
                        if (angle % 10 == 0) {
                            width = bigWidth;
                            height = bigHeight;
                            text = true;
                            if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                                nextAngle = angle + 2.5;
                            } else if (angle >= halfPrecisionLowerLimit && angle < halfPrecisionUpperLimit) {
                                nextAngle = angle + 5;
                            } else {
                                nextAngle = angle + 10;
                            }
                        } else {
                            if (angle % 5 == 0) {
                                width = mediumWidth;
                                height = mediumHeight;
                                text = false;
                                if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                                    nextAngle = angle + 2.5;
                                } else {
                                    nextAngle = angle + 5;
                                }
                            } else {
                                width = smallWidth;
                                height = smallHeight;
                                nextAngle = angle + 2.5;
                                text = false;
                            }
                        }
                        if (angle != 0) {
                            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                            rect.setAttribute("fill", "white");
                            rect.setAttribute("x", (-width / 2).toString());
                            rect.setAttribute("y", (this.bankSizeRatio * angle - height / 2).toString());
                            rect.setAttribute("width", width.toString());
                            rect.setAttribute("height", height.toString());
                            this.attitude_pitch.appendChild(rect);
                            if (text) {
                                const leftText = document.createElementNS(Avionics.SVG.NS, "text");
                                leftText.textContent = Math.abs(angle).toString();
                                leftText.setAttribute("x", ((-width / 2) - 5).toString());
                                leftText.setAttribute("y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                                leftText.setAttribute("text-anchor", "end");
                                leftText.setAttribute("font-size", (fontSize * 1.2).toString());
                                leftText.setAttribute("font-family", "Roboto-Bold");
                                leftText.setAttribute("fill", "white");
                                this.attitude_pitch.appendChild(leftText);
                            }
                            if (angle < unusualAttitudeLowerLimit) {
                                const chevron = document.createElementNS(Avionics.SVG.NS, "path");
                                let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                                path += "L" + bigWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                                path += "L0 " + (this.bankSizeRatio * nextAngle + 20) + " ";
                                path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                                chevron.setAttribute("d", path);
                                chevron.setAttribute("fill", "red");
                                this.attitude_pitch.appendChild(chevron);
                            }
                            if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                                const chevron = document.createElementNS(Avionics.SVG.NS, "path");
                                let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                                path += "L" + (bigWidth / 2) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                                path += "L0 " + (this.bankSizeRatio * angle - 20) + " ";
                                path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                                chevron.setAttribute("d", path);
                                chevron.setAttribute("fill", "red");
                                this.attitude_pitch.appendChild(chevron);
                            }
                        }
                        angle = nextAngle;
                    }
                }
            }
        }
        {
            const attitudeContainer = document.createElement("div");
            attitudeContainer.setAttribute("id", "Attitude");
            attitudeContainer.style.top = "-14%";
            attitudeContainer.style.left = "-10%";
            attitudeContainer.style.width = "120%";
            attitudeContainer.style.height = "120%";
            attitudeContainer.style.position = "absolute";
            attitudeContainer.style.transform = "scale(1.35)";
            this.appendChild(attitudeContainer);
            this.attitude_root = document.createElementNS(Avionics.SVG.NS, "svg");
            this.attitude_root.setAttribute("width", "100%");
            this.attitude_root.setAttribute("height", "100%");
            this.attitude_root.setAttribute("viewBox", "-200 -200 400 300");
            this.attitude_root.setAttribute("overflow", "visible");
            this.attitude_root.setAttribute("style", "position:absolute; z-index: 0");
            attitudeContainer.appendChild(this.attitude_root);
            {
                this.attitude_bank = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(this.attitude_bank);
                const topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                topTriangle.setAttribute("d", "M0 -180 l-7.5 -10 l15 0 Z");
                topTriangle.setAttribute("fill", "white");
                topTriangle.setAttribute("stroke", "white");
                topTriangle.setAttribute("stroke-width", "1");
                topTriangle.setAttribute("stroke-opacity", "1");
                this.attitude_bank.appendChild(topTriangle);
                const smallDashesAngle = [-50, -40, -30, -20, -10, 10, 20, 30, 40, 50];
                const smallDashesHeight = [18, 18, 18, 11, 11, 11, 11, 18, 18, 18];
                const radius = 175;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    const dash = document.createElementNS(Avionics.SVG.NS, "line");
                    dash.setAttribute("x1", "0");
                    dash.setAttribute("y1", (-radius).toString());
                    dash.setAttribute("x2", "0");
                    dash.setAttribute("y2", (-radius - smallDashesHeight[i]).toString());
                    dash.setAttribute("fill", "none");
                    dash.setAttribute("stroke", "white");
                    dash.setAttribute("stroke-width", "2");
                    dash.setAttribute("transform", "rotate(" + smallDashesAngle[i] + ",0,0)");
                    this.attitude_bank.appendChild(dash);
                }
                const arc = document.createElementNS(Avionics.SVG.NS, "path");
                arc.setAttribute("d", "M-88 -150 q88 -48 176 0");
                arc.setAttribute("fill", "transparent");
                arc.setAttribute("stroke", "white");
                arc.setAttribute("stroke-width", "1.5");
                this.attitude_bank.appendChild(arc);
            }
            {
                const cursors = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(cursors);
                const leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
                leftUpper.setAttribute("d", "M-90 0 l0 -6 l55 0 l0 28 l-5 0 l0 -22 l-40 0 Z");
                leftUpper.setAttribute("fill", "black");
                leftUpper.setAttribute("stroke", "yellow");
                leftUpper.setAttribute("stroke-width", "0.7");
                leftUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(leftUpper);
                const rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
                rightUpper.setAttribute("d", "M90 0 l0 -6 l-55 0 l0 28 l5 0 l0 -22 l40 0 Z");
                rightUpper.setAttribute("fill", "black");
                rightUpper.setAttribute("stroke", "yellow");
                rightUpper.setAttribute("stroke-width", "0.7");
                rightUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(rightUpper);
                const centerRect = document.createElementNS(Avionics.SVG.NS, "rect");
                centerRect.setAttribute("x", "-4");
                centerRect.setAttribute("y", "-8");
                centerRect.setAttribute("height", "8");
                centerRect.setAttribute("width", "8");
                centerRect.setAttribute("stroke", "yellow");
                centerRect.setAttribute("stroke-width", "3");
                cursors.appendChild(centerRect);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -170 l-13 20 l26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "black");
                this.slipSkidTriangle.setAttribute("stroke", "white");
                this.slipSkidTriangle.setAttribute("stroke-width", "1");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-20 -140 L-16 -146 L16 -146 L20 -140 Z");
                this.slipSkid.setAttribute("fill", "black");
                this.slipSkid.setAttribute("stroke", "white");
                this.slipSkid.setAttribute("stroke-width", "1");
                this.attitude_root.appendChild(this.slipSkid);
            }
        }
        this.applyAttributes();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "pitch":
                this.pitch = parseFloat(newValue);
                break;
            case "bank":
                this.bank = parseFloat(newValue);
                break;
            case "slip_skid":
                this.slipSkidValue = parseFloat(newValue);
                break;
            case "background":
                if (newValue == "false") {
                    this.backgroundVisible = false;
                } else {
                    this.backgroundVisible = true;
                }
                break;
            default:
                return;
        }
        this.applyAttributes();
    }
    applyAttributes() {
        if (this.bottomPart) {
            this.bottomPart.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
        }
        if (this.pitch_root_group) {
            this.pitch_root_group.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        }
        if (this.attitude_pitch) {
            this.attitude_pitch.setAttribute("transform", "translate(0," + (this.pitch * this.bankSizeRatio * this.bankSizeRatioFactor) + ")");
        }
        if (this.slipSkid) {
            this.slipSkid.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(" + (this.slipSkidValue * 40) + ", 0)");
        }
        if (this.slipSkidTriangle) {
            this.slipSkidTriangle.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        }
        if (this.horizonTop) {
            if (this.backgroundVisible) {
                this.horizonTop.setAttribute("fill", this.horizonTopColor);
                this.horizonBottom.setAttribute("fill", this.horizonBottomColor);
            } else {
                this.horizonTop.setAttribute("fill", "transparent");
                this.horizonBottom.setAttribute("fill", "transparent");
            }
        }
    }
}
customElements.define('a320-neo-sai-attitude-indicator', A320_Neo_SAI_AttitudeIndicator);
registerInstrument("a320-neo-sai", A320_Neo_SAI);
//# sourceMappingURL=A320_Neo_SAI.js.map