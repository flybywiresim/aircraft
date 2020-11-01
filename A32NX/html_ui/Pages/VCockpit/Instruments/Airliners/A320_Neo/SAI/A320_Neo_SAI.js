class A320_Neo_SAI extends BaseAirliners {
    get templateID() {
        return "A320_Neo_SAI";
    }
    connectedCallback() {
        super.connectedCallback();
        this.addIndependentElementContainer(new NavSystemElementContainer("Altimeter", "Altimeter", new A320_Neo_SAI_Altimeter()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Airspeed", "Airspeed", new A320_Neo_SAI_Airspeed()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Horizon", "Horizon", new A320_Neo_SAI_Attitude()));
        this.addIndependentElementContainer(new NavSystemElementContainer("SelfTest", "SelfTest", new A320_Neo_SAI_SelfTest()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Brightness", "Brightness", new A320_Neo_SAI_Brightness()));
        this.addIndependentElementContainer(new NavSystemElementContainer("AttReset", "AttReset", new A320_Neo_SAI_AttReset()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Bugs", "Bugs", new A320_Neo_SAI_Bugs()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Pressure", "Pressure", new A320_Neo_SAI_Pressure()));
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
    }
    onEvent(_event) {
    }
}

const sai_state_machine = {
    init: "off",
    off: {
        transitions: {
            next: {
                target: "test"
            }
        }
    },
    test: {
        transitions: {
            next: {
                target: "on"
            },
            reset: {
                target: "off"
            }
        }
    },
    on: {
        transitions: {
            reset: {
                target: "off"
            }
        }
    },
    spawn: {
        transitions: {
            next: {
                target: "on"
            }
        }
    }
};

class A320_Neo_SAI_Airspeed extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.airspeedElement = this.gps.getChildById("Airspeed");
        this.bugsElement = this.gps.getChildById("Bugs");
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
        switch (_event) {
            case "BTN_BARO_BUGS":
                const bugs = this.bugsElement.getSpdBugs();
                this.airspeedElement.updateBugs(bugs);
                break;
        }
    }
}
class A320_Neo_SAI_AirspeedIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.greenColor = "#00E64D";
        this.yellowColor = "yellow";
        this.redColor = "red";
        this.fontSize = 21;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.graduationSpacing = 8.8;
        this.graduationMinValue = 30;
        this.graduationMaxPrecisionValue = 260;
        this.nbPrimaryGraduations = 11;
        this.nbSecondaryGraduations = 3;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.bugs = [];
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
        const width = 50;
        const height = 250;
        const posX = width * 0.5;
        const posY = 5;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Airspeed");
        } else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        const topMask = document.createElementNS(Avionics.SVG.NS, "path");
        topMask.setAttribute("d", "M134 0 l0 45 l -20 0 q-105 4 -75 40 l0 -85 Z");
        topMask.setAttribute("fill", "url(#SAIBacklight)");
        this.rootGroup.appendChild(topMask);
        const bottomMask = document.createElementNS(Avionics.SVG.NS, "path");
        bottomMask.setAttribute("d", "M134 250 l0 -48 l -20 0 q-105 -4 -75 -40 l0 88 Z");
        bottomMask.setAttribute("fill", "url(#SAIBacklight)");
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
            bg.setAttribute("fill", "url(#SAIBacklight)");
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
                    for (let i = 0; i < this.arcs.length; i++) {
                        arcGroup.appendChild(this.arcs[i]);
                    }
                    this.centerSVG.appendChild(arcGroup);
                }
            }
            const graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "Graduations");
            {
                this.graduationScrollPosX = _left + _width;
                this.graduationScrollPosY = _top + _height * 0.5 - 1;
                this.graduations = [];
                for (let i = 0; i < this.totalGraduations; i++) {
                    var line = new Avionics.SVGGraduation();
                    const mod = i % (this.nbSecondaryGraduations + 1);
                    line.IsPrimary = (mod == 0) ? true : false;
                    const lineWidth = (mod == 2) ? 7 : 3;
                    const lineHeight = (mod == 2) ? 2 : 2;
                    const linePosX = -lineWidth - 1;
                    line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                    line.SVGLine.setAttribute("x", linePosX.toString());
                    line.SVGLine.setAttribute("width", lineWidth.toString());
                    line.SVGLine.setAttribute("height", lineHeight.toString());
                    line.SVGLine.setAttribute("fill", "white");
                    if (mod == 0) {
                        line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                        line.SVGText1.setAttribute("x", (linePosX - 1).toString());
                        line.SVGText1.setAttribute("y", "2");
                        line.SVGText1.setAttribute("fill", "white");
                        line.SVGText1.setAttribute("font-size", (this.fontSize * 0.68).toString());
                        line.SVGText1.setAttribute("font-family", "ECAMFontRegular");
                        line.SVGText1.setAttribute("text-anchor", "end");
                        line.SVGText1.setAttribute("alignment-baseline", "central");
                    }
                    this.graduations.push(line);
                }
                for (let i = 0; i < this.totalGraduations; i++) {
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
        const cursorPosY = _top + _height * 0.5 + 5;
        const cursorWidth = 13;
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
            rect.setAttribute("x", "-1");
            rect.setAttribute("y", "0");
            rect.setAttribute("width", cursorWidth.toString());
            rect.setAttribute("height", cursorHeight.toString());
            rect.setAttribute("fill", "url(#SAIBacklight)");
            this.cursorSVG.appendChild(rect);
            if (!this.cursorSVGShape) {
                this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
            }
            this.cursorSVGShape.setAttribute("d", "M 1 " + (cursorHeight * 0.5) + " L" + (cursorWidth - 2) + " 1 L" + (cursorWidth - 2) + " " + cursorHeight + " Z");
            this.cursorSVGShape.setAttribute("fill", "yellow");
            this.cursorSVG.appendChild(this.cursorSVGShape);
            this.rootGroup.appendChild(this.cursorSVG);
        }
        const topBg = document.createElementNS(Avionics.SVG.NS, "rect");
        topBg.setAttribute("x", _left.toString());
        topBg.setAttribute("y", (_top - 5).toString());
        topBg.setAttribute("width", "125");
        topBg.setAttribute("height", "50");
        topBg.setAttribute("fill", "url(#SAIBacklight)");
        this.rootGroup.appendChild(topBg);
        const bottomBg = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBg.setAttribute("x", _left.toString());
        bottomBg.setAttribute("y", (_top + _height - 48).toString());
        bottomBg.setAttribute("width", "125");
        bottomBg.setAttribute("height", "50");
        bottomBg.setAttribute("fill", "url(#SAIBacklight)");
        this.rootGroup.appendChild(bottomBg);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
        this.small_bugs = [];
        this.small_bugs[0] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.small_bugs[1] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.small_bugs[2] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.small_bugs[3] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.centerSVG.appendChild(this.small_bugs[0]);
        this.centerSVG.appendChild(this.small_bugs[1]);
        this.centerSVG.appendChild(this.small_bugs[2]);
        this.centerSVG.appendChild(this.small_bugs[3]);
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

    updateBugs(bugs) {
        this.small_bugs[0].setAttribute("y","-100");
        this.small_bugs[1].setAttribute("y","-100");
        this.small_bugs[2].setAttribute("y","-100");
        this.small_bugs[3].setAttribute("y","-100");
        this.bugs = bugs;
    }
    updateGraduationScrolling(_speed) {

        if (this.graduations) {
            if (this.bugs.length > 0) {
                this.bugs.forEach((spd_bug, i) => {
                    if (_speed < (spd_bug + 60) && _speed > (spd_bug - 60)) {
                        this.small_bugs[i].setAttribute("x", "42");
                        this.small_bugs[i].setAttribute("y", String(124 - (spd_bug - _speed) / 5 * 8.8));
                        this.small_bugs[i].setAttribute("width", "7");
                        this.small_bugs[i].setAttribute("height", "2");
                        this.small_bugs[i].setAttribute("fill", "cyan");
                    }
                });
            }

            if (_speed < this.graduationMinValue) {
                _speed = this.graduationMinValue;
            }
            this.graduationScroller.scroll(_speed);
            let currentVal = this.graduationScroller.firstValue;
            let currentY = this.graduationScrollPosY + this.graduationScroller.offsetY * this.graduationSpacing * (this.nbSecondaryGraduations + 1);
            for (let i = 0; i < this.totalGraduations; i++) {
                const posX = this.graduationScrollPosX;
                const posY = currentY;
                if ((currentVal < this.graduationMinValue) || (currentVal == this.graduationMinValue && !this.graduations[i].SVGText1) ||
                    (currentVal < this.graduationMinValue + 20 && i % 4 == 1) || (currentVal > this.graduationMaxPrecisionValue && i % 2 == 1) ||
                    (currentVal == this.graduationMaxPrecisionValue && i % 4 == 3)) {
                    this.graduations[i].SVGLine.setAttribute("visibility", "hidden");
                    if (this.graduations[i].SVGText1) {
                        this.graduations[i].SVGText1.setAttribute("visibility", "hidden");
                    }
                } else {
                    this.graduations[i].SVGLine.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                    this.graduations[i].SVGLine.setAttribute("visibility", "visible");
                    if (this.graduations[i].SVGText1) {
                        this.graduations[i].SVGText1.textContent = currentVal.toString();
                        this.graduations[i].SVGText1.setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                        this.graduations[i].SVGText1.setAttribute("visibility", "visible");
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
        this.bugsElement = this.gps.getChildById("Bugs");
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
            case "BTN_BARO_BUGS":
                const bugs = this.bugsElement.getAltBugs();
                this.altimeterElement.updateBugs(bugs);
                break;
        }
    }
}
class A320_Neo_SAI_AltimeterIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.fontSize = 21;
        this.graduationScrollPosX = 0;
        this.graduationScrollPosY = 0;
        this.nbPrimaryGraduations = 7;
        this.nbSecondaryGraduations = 4;
        this.totalGraduations = this.nbPrimaryGraduations + ((this.nbPrimaryGraduations - 1) * this.nbSecondaryGraduations);
        this.graduationSpacing = 11;
        this.bugs = [];
    }
    connectedCallback() {
        this.graduationScroller = new Avionics.Scroller(this.nbPrimaryGraduations, 500, true);
        this.cursorIntegrals = new Array();
        this.cursorIntegrals.push(new A32NX_Avionics.AltitudeScroller(3, 80, 1, 10, 1000));
        this.cursorIntegrals.push(new A32NX_Avionics.AltitudeScroller(3, 80, 1, 10, 100));
        this.cursorIntegrals.push(new A32NX_Avionics.AltitudeScroller(3, 80, 1, 10, 10));
        this.cursorDecimals = new A32NX_Avionics.AltitudeScroller(3, 37, 20, 100);
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        const width = 65;
        const height = 250;
        const posX = 36 + width * 0.5;
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
        topMask.setAttribute("d", "M2 0 l0 45 q105 4 75 40 l0 -85 Z");
        topMask.setAttribute("fill", "url(#SAIBacklight)");
        this.rootGroup.appendChild(topMask);
        const bottomMask = document.createElementNS(Avionics.SVG.NS, "path");
        bottomMask.setAttribute("d", "M2 250 l0 -48 q105 -4 75 -40 l0 88 Z");
        bottomMask.setAttribute("fill", "url(#SAIBacklight)");
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
            bg.setAttribute("fill", "url(#SAIBacklight)");
            this.centerSVG.appendChild(bg);
            this.graduationScrollPosX = _left;
            this.graduationScrollPosY = _top + _height * 0.5 + 3;
            this.graduations = [];
            for (let i = 0; i < this.totalGraduations; i++) {
                var line = new Avionics.SVGGraduation();
                line.IsPrimary = true;
                if (this.nbSecondaryGraduations > 0 && (i % (this.nbSecondaryGraduations + 1))) {
                    line.IsPrimary = false;
                }
                const lineWidth = line.IsPrimary ? 3 : 9;
                const lineHeight = line.IsPrimary ? 3 : 1.5;
                line.SVGLine = document.createElementNS(Avionics.SVG.NS, "rect");
                line.SVGLine.setAttribute("x", "1");
                line.SVGLine.setAttribute("width", lineWidth.toString());
                line.SVGLine.setAttribute("height", lineHeight.toString());
                line.SVGLine.setAttribute("fill", "white");
                if (line.IsPrimary) {
                    line.SVGText1 = document.createElementNS(Avionics.SVG.NS, "text");
                    line.SVGText1.setAttribute("x", (lineWidth + 0.5).toString());
                    line.SVGText1.setAttribute("y", "2");
                    line.SVGText1.setAttribute("fill", "white");
                    line.SVGText1.setAttribute("font-size", (this.fontSize * 0.68).toString());
                    line.SVGText1.setAttribute("font-family", "ECAMFontRegular");
                    line.SVGText1.setAttribute("text-anchor", "start");
                    line.SVGText1.setAttribute("alignment-baseline", "central");
                }
                this.graduations.push(line);
            }
            const graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
            graduationGroup.setAttribute("id", "graduationGroup");
            for (let i = 0; i < this.totalGraduations; i++) {
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
        const cursorPosX = _left + 2;
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
            this.cursorSVGShape.setAttribute("fill", "url(#SAIBacklight)");
            this.cursorSVGShape.setAttribute("d", "M7 31 L73 31 L73 24 L149 24 L149 70 L73 70 L73 63 L7 63 Z");
            this.cursorSVGShape.setAttribute("stroke", "yellow");
            this.cursorSVGShape.setAttribute("stroke-width", "4");
            trs.appendChild(this.cursorSVGShape);
            const _cursorWidth = (cursorWidth / _scale);
            const _cursorHeight = (cursorHeight / _scale + 10);
            const _cursorPosX = 0;
            const _cursorPosY = _cursorHeight * 0.5;
            const integralsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
            integralsGroup.setAttribute("x", "0");
            integralsGroup.setAttribute("y", "34");
            integralsGroup.setAttribute("width", _cursorWidth.toString());
            integralsGroup.setAttribute("height", (_cursorHeight - 49).toString());
            integralsGroup.setAttribute("viewBox", "0 0 " + (_cursorWidth) + " " + (_cursorHeight));
            trs.appendChild(integralsGroup);
            {
                this.cursorIntegrals[0].construct(integralsGroup, _cursorPosX - 38, _cursorPosY + 2, _width, "ECAMFontRegular", this.fontSize * 3.9, "#00E64D");
                this.cursorIntegrals[1].construct(integralsGroup, _cursorPosX + 24, _cursorPosY + 2, _width, "ECAMFontRegular", this.fontSize * 3.9, "#00E64D");
                this.cursorIntegrals[2].construct(integralsGroup, _cursorPosX + 86, _cursorPosY + 2, _width, "ECAMFontRegular", this.fontSize * 3.9, "#00E64D");
            }
            const decimalsGroup = document.createElementNS(Avionics.SVG.NS, "svg");
            decimalsGroup.setAttribute("y", "27");
            decimalsGroup.setAttribute("width", _cursorWidth.toString());
            decimalsGroup.setAttribute("height", (_cursorHeight - 34).toString());
            trs.appendChild(decimalsGroup);
            this.cursorDecimals.construct(decimalsGroup, _cursorPosX + 110, _cursorPosY - 20, _width, "ECAMFontRegular", this.fontSize * 1.1, "#00E64D");
            this.rootGroup.appendChild(this.cursorSVG);
        }
        const topBg = document.createElementNS(Avionics.SVG.NS, "rect");
        topBg.setAttribute("x", (_left - 40).toString());
        topBg.setAttribute("y", (_top - 5).toString());
        topBg.setAttribute("width", "125");
        topBg.setAttribute("height", "50");
        topBg.setAttribute("fill", "url(#SAIBacklight)");
        this.rootGroup.appendChild(topBg);
        const bottomBg = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBg.setAttribute("x", (_left - 40).toString());
        bottomBg.setAttribute("y", (_top + _height - 48).toString());
        bottomBg.setAttribute("width", "125");
        bottomBg.setAttribute("height", "50");
        bottomBg.setAttribute("fill", "url(#SAIBacklight)");
        this.rootGroup.appendChild(bottomBg);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);

        this.small_bugs = [];
        this.small_bugs[0] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.small_bugs[1] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.centerSVG.appendChild(this.small_bugs[0]);
        this.centerSVG.appendChild(this.small_bugs[1]);

        this.big_bugs = [];
        this.big_bugs[0] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.big_bugs[1] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.centerSVG.appendChild(this.big_bugs[0]);
        this.centerSVG.appendChild(this.big_bugs[1]);
    }
    update(_dTime) {
        const altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet");
        this.updateGraduationScrolling(altitude);
        this.updateCursorScrolling(altitude);
    }

    updateBugs(bugs) {
        this.big_bugs[0].setAttribute("y", "-100");
        this.big_bugs[1].setAttribute("y", "-100");
        this.small_bugs[0].setAttribute("y", "-100");
        this.small_bugs[1].setAttribute("y", "-100");
        this.bugs = bugs;
    }
    updateGraduationScrolling(_altitude) {
        if (this.graduations) {
            if (this.cursorSVGShape.style.stroke !== "yellow") {
                this.cursorSVGShape.setAttribute("stroke", "yellow");
            }
            if (this.bugs.length > 0) {
                this.bugs.forEach((alt_bug, i) => {
                    if (_altitude < (alt_bug + 1000) && _altitude > (alt_bug - 1000)) {
                        if (alt_bug % 500 === 0) {
                            this.big_bugs[i].setAttribute("x", "0");
                            this.big_bugs[i].setAttribute("y", String(121 - (alt_bug - _altitude) / 100 * 11));
                            this.big_bugs[i].setAttribute("width", "50");
                            this.big_bugs[i].setAttribute("height", "16");
                            this.big_bugs[i].setAttribute("stroke", "cyan");
                            this.big_bugs[i].setAttribute("stroke-width", "3");
                            this.big_bugs[i].setAttribute("fill", "none");
                        } else {
                            this.small_bugs[i].setAttribute("x", "1");
                            this.small_bugs[i].setAttribute("y", String(128 - (alt_bug - _altitude) / 100 * 11));
                            this.small_bugs[i].setAttribute("width", "9");
                            this.small_bugs[i].setAttribute("height", "1.5");
                            this.small_bugs[i].setAttribute("fill", "cyan");
                        }
                    }
                    const alt_n = parseInt(_altitude);
                    const bug_n = parseInt(alt_bug);
                    if ((alt_n < (bug_n + 100)) && (alt_n > (bug_n - 100))) {
                        this.cursorSVGShape.setAttribute("stroke", "cyan");
                    }
                });
            }
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
            const baro_plus = SimVar.GetSimVarValue("L:A32NX_BARO_ATT_RESET", "Bool");
            if (!baro_plus) {
                this.attitudeElement.setAttribute("pitch", (xyz.pitch / Math.PI * 180).toString());
                this.attitudeElement.setAttribute("bank", (xyz.bank / Math.PI * 180).toString());
                this.attitudeElement.setAttribute("slip_skid", Simplane.getInclinometer().toString());
            }
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
        this.bankSizeRatio = -7;
        this.bankSizeRatioFactor = 0.62;
        this.pitchRatioFactor = 1.6;
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
            this.horizonTopColor = "#19A0E0";
            this.horizonBottomColor = "#8B3D18";
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
            this.horizonBottom.setAttribute("y", "10");
            this.horizonBottom.setAttribute("width", "3000");
            this.horizonBottom.setAttribute("height", "3000");
            this.bottomPart.appendChild(this.horizonBottom);
            const separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "10");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "5");
            this.bottomPart.appendChild(separator);
        }
        {
            const pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-12.9%";
            pitchContainer.style.left = "-7%";
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
                const h = 295;
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
                    const fullPrecisionLowerLimit = -30;
                    const fullPrecisionUpperLimit = 30;
                    const halfPrecisionLowerLimit = -30;
                    const halfPrecisionUpperLimit = 30;
                    const unusualAttitudeLowerLimit = -30;
                    const unusualAttitudeUpperLimit = 30;
                    const bigWidth = 52;
                    const bigHeight = 2.5;
                    const mediumWidth = 28;
                    const mediumHeight = 2.5;
                    const smallWidth = 15;
                    const smallHeight = 2.5;
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
                                leftText.setAttribute("x", ((-width / 2) - 10).toString());
                                leftText.setAttribute("y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                                leftText.setAttribute("text-anchor", "end");
                                leftText.setAttribute("font-size", (fontSize * 1.2).toString());
                                leftText.setAttribute("font-family", "ECAMFontRegular");
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
            attitudeContainer.style.top = "-8.5%";
            attitudeContainer.style.left = "-7%";
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
                topTriangle.setAttribute("d", "M0 -164 l-13 -19 l26 0 Z");
                topTriangle.setAttribute("fill", "yellow");
                topTriangle.setAttribute("stroke", "yellow");
                topTriangle.setAttribute("stroke-opacity", "1");
                this.attitude_bank.appendChild(topTriangle);
                const smallDashesAngle = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];
                const smallDashesHeight = 19;
                const radius = 160;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    const dash = document.createElementNS(Avionics.SVG.NS, "line");
                    dash.setAttribute("x1", "0");
                    dash.setAttribute("y1", (-radius).toString());
                    dash.setAttribute("x2", "0");
                    dash.setAttribute("y2", (-radius - smallDashesHeight).toString());
                    dash.setAttribute("fill", "none");
                    dash.setAttribute("stroke", "white");
                    dash.setAttribute("stroke-width", "2.5");
                    dash.setAttribute("transform", "rotate(" + smallDashesAngle[i] + ",0,-15)");
                    this.attitude_bank.appendChild(dash);
                }
                const arc = document.createElementNS(Avionics.SVG.NS, "path");
                arc.setAttribute("d", "M-73 -140 q73 -40 146 0");
                arc.setAttribute("fill", "transparent");
                arc.setAttribute("stroke", "white");
                arc.setAttribute("stroke-width", "2.5");
                this.attitude_bank.appendChild(arc);
            }
            {
                const cursors = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(cursors);
                const leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
                leftUpper.setAttribute("d", "M-85 -15 l0 -10 l50 0 l0 16 l-11 0 l0 -6 l-24 0 Z");
                leftUpper.setAttribute("fill", "url(#SAIBacklight)");
                leftUpper.setAttribute("stroke", "yellow");
                leftUpper.setAttribute("stroke-width", "4");
                leftUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(leftUpper);
                const rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
                rightUpper.setAttribute("d", "M85 -15 l0 -10 l-50 0 l0 16 l11 0 l0 -6 l24 0 Z");
                rightUpper.setAttribute("fill", "url(#SAIBacklight)");
                rightUpper.setAttribute("stroke", "yellow");
                rightUpper.setAttribute("stroke-width", "4");
                rightUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(rightUpper);
                const centerRect = document.createElementNS(Avionics.SVG.NS, "rect");
                centerRect.setAttribute("x", "-7");
                centerRect.setAttribute("y", "-25");
                centerRect.setAttribute("height", "14");
                centerRect.setAttribute("width", "14");
                centerRect.setAttribute("stroke", "yellow");
                centerRect.setAttribute("stroke-width", "4");
                cursors.appendChild(centerRect);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -161 l-11 18 l22 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "url(#SAIBacklight)");
                this.slipSkidTriangle.setAttribute("stroke", "white");
                this.slipSkidTriangle.setAttribute("stroke-width", "2");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-17 -134 l5 -8 l23 0 l5 8 Z");
                this.slipSkid.setAttribute("fill", "url(#SAIBacklight)");
                this.slipSkid.setAttribute("stroke", "white");
                this.slipSkid.setAttribute("stroke-width", "2");
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
            this.bottomPart.setAttribute("transform", "rotate(" + this.bank + ", 0, -15) translate(0," + (this.pitch * this.bankSizeRatio * this.pitchRatioFactor) + ")");
        }
        if (this.pitch_root_group) {
            this.pitch_root_group.setAttribute("transform", "rotate(" + this.bank + ", 0, -15)");
        }
        if (this.attitude_pitch) {
            this.attitude_pitch.setAttribute("transform", "translate(0," + (this.pitch * this.bankSizeRatio * this.bankSizeRatioFactor * this.pitchRatioFactor) + ")");
        }
        if (this.slipSkid) {
            this.slipSkid.setAttribute("transform", "rotate(" + this.bank + ", 0, -15) translate(" + (this.slipSkidValue * 40) + ", 0)");
        }
        if (this.slipSkidTriangle) {
            this.slipSkidTriangle.setAttribute("transform", "rotate(" + this.bank + ", 0, -15)");
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

class A320_Neo_SAI_Pressure extends NavSystemElement {
    init(root) {
        this.pressureElement = this.gps.getChildById("Pressure");
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        this.pressureElement.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_SAI_PressureIndicator extends HTMLElement {
    connectedCallback() {
        this.construct();
    }
    construct() {
        Utils.RemoveAllChildren(this);
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 200 30");
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "Pressure");
        } else {
            Utils.RemoveAllChildren(this.rootGroup);
        }

        if (!this.pressureSVG) {
            this.pressureSVG = document.createElementNS(Avionics.SVG.NS, "text");
        }
        this.pressureSVG.textContent = "";
        this.pressureSVG.setAttribute("x", "195");
        this.pressureSVG.setAttribute("y", "15");
        this.pressureSVG.setAttribute("fill", "cyan");
        this.pressureSVG.setAttribute("font-size", "29");
        this.pressureSVG.setAttribute("font-family", "ECAMFontRegular");
        this.pressureSVG.setAttribute("text-anchor", "end");
        this.pressureSVG.setAttribute("alignment-baseline", "central");

        this.rootGroup.appendChild(this.pressureSVG);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    update() {
        if (this.pressureSVG) {
            const pressureInHg = SimVar.GetSimVarValue("KOHLSMAN SETTING HG:2", "inches of mercury");
            if (pressureInHg !== this.lastPressureValue) {
                this.lastPressureValue = pressureInHg;
                const pressureHpa = SimVar.GetSimVarValue("KOHLSMAN SETTING HG:2", "millibar");
                this.pressureSVG.textContent = fastToFixed(pressureHpa, 0) + "/" + pressureInHg.toFixed(2);
            }
        }
    }
}
customElements.define('a320-neo-sai-pressure-indicator', A320_Neo_SAI_PressureIndicator);

class A320_Neo_SAI_Brightness extends NavSystemElement {
    init(root) {
        this.brightnessElement = this.gps.getChildById("Brightness");
        this.bugsElement = this.gps.getChildById("Bugs");
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
        const brightness = SimVar.GetSimVarValue("L:A32NX_BARO_BRIGHTNESS","number");
        const bright_gran = 0.05;
        const minimum = 0.15;
        switch (_event) {
            case "BTN_BARO_PLUS":
                if (this.bugsElement.getDisplay() === "none" && brightness < 1) {
                    const new_brightness = brightness + bright_gran;
                    SimVar.SetSimVarValue("L:A32NX_BARO_BRIGHTNESS","number", new_brightness);
                    this.brightnessElement.updateBrightness(new_brightness); //TODO: Remove line on model update
                }
                break;
            case "BTN_BARO_MINUS":
                if (this.bugsElement.getDisplay() === "none" && brightness > minimum) {
                    const new_brightness = brightness - bright_gran;
                    SimVar.SetSimVarValue("L:A32NX_BARO_BRIGHTNESS","number", new_brightness);
                    this.brightnessElement.updateBrightness(new_brightness); //TODO: Remove line on model update
                }
                break;
        }
    }
}

class A320_Neo_SAI_BrightnessBox extends HTMLElement {
    connectedCallback() {
        this.construct();
    }

    update(dTime) {

    }
    construct() {
        Utils.RemoveAllChildren(this);
        // TODO: Remove when model change arrives
        const brightness_init = SimVar.GetSimVarValue("L:A32NX_BARO_BRIGHTNESS","number");
        const opacity = 1.0 - brightness_init;

        this.brightnessDiv = document.createElement("div");
        this.brightnessDiv.id = "BrightnessDiv";
        this.brightnessDiv.setAttribute("border", "none");
        this.brightnessDiv.setAttribute("position", "absolute");
        this.brightnessDiv.setAttribute("display", "block");
        this.brightnessDiv.setAttribute("top", "0%");
        this.brightnessDiv.setAttribute("left", "0%");
        this.brightnessDiv.setAttribute("width", "100%");
        this.brightnessDiv.setAttribute("height", "100%");
        this.appendChild(this.brightnessDiv);

        this.brightnessSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.brightnessSVG.setAttribute("id", "BrightnessSVG");
        this.brightnessSVG.setAttribute("viewBox", "0 0 600 600");
        this.brightnessSVG.style.position = "absolute";
        this.brightnessSVG.style.top = "0%";
        this.brightnessSVG.style.left = "0%";
        this.brightnessSVG.style.width = "100%";
        this.brightnessSVG.style.height = "100%";
        this.brightnessSVG.style.backgroundColor = "rgba(0,0,0," + opacity + ")";
        this.brightnessSVG.style.zIndex = "3";
        this.brightnessDiv.appendChild(this.brightnessSVG);
    }

    updateBrightness(brightness) {
        const opacity = 1.0 - brightness;
        this.brightnessSVG.style.backgroundColor = "rgba(0,0,0," + opacity + ")";
    }
}

customElements.define('a320-neo-sai-brightness', A320_Neo_SAI_BrightnessBox);

class A320_Neo_SAI_SelfTest extends NavSystemElement {
    init(root) {
        this.selfTestElement = this.gps.getChildById("SelfTest");
        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator();
        const interval = 5;
        this.getFrameCounter = A32NX_Util.createFrameCounter(interval);
        const cold_dark = SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool');
        const ac_pwr = SimVar.GetSimVarValue("L:ACPowerAvailable", "bool");
        const dc_pwr = SimVar.GetSimVarValue("L:DCPowerAvailable", "bool");
        this.state = A32NX_Util.createMachine(sai_state_machine);

        if (!cold_dark) {
            this.selfTestElement.finishTest();
            this.state.setState("spawn");
        } else {
            this.state.setState("off");
            this.selfTestElement.offDisplay();
        }
        /*
        if ((!ac_pwr && !dc_pwr)) {
            this.selfTestElement.offDisplay();
        }
        */
    }
    onEnter() {
    }
    isReady() {
        return true;
    }

    checkShutdown() {
        const ac_pwr = SimVar.GetSimVarValue("L:ACPowerAvailable", "bool");
        const dc_pwr = SimVar.GetSimVarValue("L:DCPowerAvailable", "bool");

        if (ac_pwr || dc_pwr) {
            return;
        } else {
            const _updateF = this.getFrameCounter();
            // Airspeed > 50 knots, check every 10th frame
            if (_updateF === 0) {
                const airspeed = Simplane.getTrueSpeed();
                if (airspeed < 50.0) {
                    this.selfTestElement.offDisplay();
                    this.state.action("reset");
                }
            }
        }
    }
    onUpdate(_deltaTime) {
        const _dTime = this.getDeltaTime();

        const complete = this.selfTestElement.complete;
        const ac_pwr = SimVar.GetSimVarValue("L:ACPowerAvailable", "bool");
        const dc_pwr = SimVar.GetSimVarValue("L:DCPowerAvailable", "bool");

        switch (this.state.value) {
            case "off":
                if ((ac_pwr || dc_pwr)) {
                    this.selfTestElement.onDisplay();
                    this.state.action("next");
                }
                break;
            case "test":
                this.checkShutdown();
                if (!complete) {
                    this.selfTestElement.update(_dTime);
                } else if (complete) {
                    this.state.action("next");
                }
                break;
            case "on":
                this.checkShutdown();
                break;
            case "spawn":
                if (ac_pwr || dc_pwr) {
                    this.state.action("next");
                }
                break;
        }
    }
    onEvent(_event) {
    }
}

class A320_Neo_SAI_SelfTestTimer extends HTMLElement {

    connectedCallback() {
        this.construct();
    }

    construct() {
        Utils.RemoveAllChildren(this);
        const boxHeight = 7;
        const boxWidthSmall = 15;
        const boxWidth = 18;
        const boxWidthInit = 34;
        const boxRow1 = 32.5;
        const boxRow2 = 46.5;
        const boxRow3 = 64;
        const txt_off = 6;

        this.start_time = 90;
        this.complete = false;
        this.testTimer = this.start_time;

        this.hide_inst_div = document.querySelector("#SelfTestHider");
        this.hide_inst_div.style.display = "none";
        this.hide_disp_div = document.querySelector("#PressureHider");

        this.selfTestDiv = document.createElement("div");
        this.selfTestDiv.id = "SelfTestDiv";
        this.selfTestDiv.setAttribute("border", "none");
        this.selfTestDiv.setAttribute("position", "absolute");
        this.selfTestDiv.setAttribute("display", "block");
        this.selfTestDiv.setAttribute("top", "0%");
        this.selfTestDiv.setAttribute("left", "0%");
        this.selfTestDiv.setAttribute("width", "100%");
        this.selfTestDiv.setAttribute("height", "100%");
        this.appendChild(this.selfTestDiv);

        const selfTestSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        selfTestSVG.setAttribute("id", "SelfTestSVG");
        selfTestSVG.setAttribute("viewBox", "0 0 600 600");
        selfTestSVG.style.position = "absolute";
        selfTestSVG.style.top = "0%";
        selfTestSVG.style.left = "0%";
        selfTestSVG.style.width = "100%";
        selfTestSVG.style.height = "100%";
        selfTestSVG.style.backgroundColor = "rgba(13,20,35,1)";
        this.selfTestDiv.appendChild(selfTestSVG);

        const st_spd = document.createElementNS(Avionics.SVG.NS, "rect");
        st_spd.setAttribute("id", "SpeedTest");
        st_spd.setAttribute("fill", "#afbb3a");
        st_spd.setAttribute("x", "8%");
        st_spd.setAttribute("y", boxRow2 + "%");
        st_spd.setAttribute("width", boxWidthSmall + "%");
        st_spd.setAttribute("height", boxHeight + "%");
        selfTestSVG.appendChild(st_spd);

        const st_spd_txt = document.createElementNS(Avionics.SVG.NS, "text");
        st_spd_txt.setAttribute("id", "SpeedTestTxt");
        st_spd_txt.textContent = "SPD";
        st_spd_txt.setAttribute("font-family", "ECAMFontRegular");
        st_spd_txt.setAttribute("font-weight", "900");
        st_spd_txt.setAttribute("font-size", "42px");
        st_spd_txt.setAttribute("fill", "#1f242d");
        st_spd_txt.setAttribute("x", "8.75%");
        st_spd_txt.setAttribute("y", boxRow2 + txt_off + "%");
        selfTestSVG.appendChild(st_spd_txt);

        const st_alt = document.createElementNS(Avionics.SVG.NS, "rect");
        st_alt.setAttribute("id", "AltTest");
        st_alt.setAttribute("fill", "#afbb3a");
        st_alt.setAttribute("x", "70%");
        st_alt.setAttribute("y", boxRow2 + "%");
        st_alt.setAttribute("width", boxWidth + "%");
        st_alt.setAttribute("height", boxHeight + "%");
        selfTestSVG.appendChild(st_alt);

        const st_alt_txt = document.createElementNS(Avionics.SVG.NS, "text");
        st_alt_txt.setAttribute("id", "AltTestTxt");
        st_alt_txt.textContent = "ALT";
        st_alt_txt.setAttribute("font-family", "ECAMFontRegular");
        st_alt_txt.setAttribute("font-size", "42px");
        st_alt_txt.setAttribute("fill", "#1f242d");
        st_alt_txt.setAttribute("x", "72.5%");
        st_alt_txt.setAttribute("y", boxRow2 + txt_off + "%");
        selfTestSVG.appendChild(st_alt_txt);

        const st_tmr = document.createElementNS(Avionics.SVG.NS, "rect");
        st_tmr.setAttribute("id", "TmrTest");
        st_tmr.setAttribute("fill", "#afbb3a");
        st_tmr.setAttribute("x", "30%");
        st_tmr.setAttribute("y", boxRow3 + "%");
        st_tmr.setAttribute("width", boxWidthInit + "%");
        st_tmr.setAttribute("height", boxHeight + "%");
        selfTestSVG.appendChild(st_tmr);

        this.st_tmr_txt = document.createElementNS(Avionics.SVG.NS, "text");
        this.st_tmr_txt.setAttribute("id", "TmrTestTxt");
        this.st_tmr_txt.textContent = "INIT " + Math.ceil(this.testTimer) + "S";
        this.st_tmr_txt.setAttribute("font-family", "ECAMFontRegular");
        this.st_tmr_txt.setAttribute("font-size", "37px");
        this.st_tmr_txt.setAttribute("fill", "#1f242d");
        this.st_tmr_txt.setAttribute("x", "31%");
        this.st_tmr_txt.setAttribute("y", boxRow3 + txt_off + "%");
        selfTestSVG.appendChild(this.st_tmr_txt);

        const st_att = document.createElementNS(Avionics.SVG.NS, "rect");
        st_att.setAttribute("id", "AttTest");
        st_att.setAttribute("fill", "#afbb3a");
        st_att.setAttribute("x", "36%");
        st_att.setAttribute("y", boxRow1 + "%");
        st_att.setAttribute("width", boxWidth + "%");
        st_att.setAttribute("height", boxHeight + "%");
        selfTestSVG.appendChild(st_att);

        const st_att_txt = document.createElementNS(Avionics.SVG.NS, "text");
        st_att_txt.setAttribute("id", "AttTestTxt");
        st_att_txt.textContent = "ATT";
        st_att_txt.setAttribute("font-family", "ECAMFontRegular");
        st_att_txt.setAttribute("font-size", "42px");
        st_att_txt.setAttribute("fill", "#1f242d");
        st_att_txt.setAttribute("x", "38%");
        st_att_txt.setAttribute("y", boxRow1 + txt_off + "%");
        selfTestSVG.appendChild(st_att_txt);

    }
    update(dTime) {
        if (this.complete) {
            return;
        }
        if (this.testTimer >= 0) {
            this.testTimer -= dTime / 1000;
        }
        if (this.testTimer > 9) {
            this.st_tmr_txt.textContent = "INIT " + Math.ceil(this.testTimer) + "S";
        } else {
            this.st_tmr_txt.textContent = "INIT 0" + Math.ceil(this.testTimer) + "S";
        }
        if (this.testTimer <= 0) {
            this.finishTest();
        }
    }

    onDisplay() {
        this.selfTestDiv.style.display = "block";
        this.hide_disp_div.style.display = "block";
    }
    offDisplay() {
        if (this.testTimer > this.start_time) {
            return;
        }
        this.testTimer = this.start_time;
        this.complete = false;
        this.hide_inst_div.style.display = "none";
        this.hide_disp_div.style.display = "none";
        this.selfTestDiv.style.display = "none";
    }
    finishTest() {
        if (this.complete) {
            return;
        }
        this.testTimer = 0;
        this.selfTestDiv.style.display = "none";
        this.hide_inst_div.style.display = "block";
        this.complete = true;
    }
}
customElements.define('a320-neo-sai-self-test', A320_Neo_SAI_SelfTestTimer);

class A320_Neo_SAI_AttReset extends NavSystemElement {

    init(root) {
        this.attResetElement = this.gps.getChildById("AttReset");
        this.bugsElement = this.gps.getChildById("Bugs");
        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator();
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        const _dTime = this.getDeltaTime();
        this.attResetElement.update(_dTime);
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BTN_BARO_RST":
                if (this.bugsElement.getDisplay() === "none") {
                    this.attResetElement.startReset();
                }
                break;
        }
    }
}

class A320_Neo_SAI_AttResetIndicator extends HTMLElement {
    connectedCallback() {
        this.construct();
    }

    construct() {
        Utils.RemoveAllChildren(this);

        this.complete = true;
        this.start_time = 10;
        this.resetTimer = this.start_time;

        const att_x = 33.5;
        const boxHeight = 7;
        const boxWidth = 30;
        const boxRow = 64;
        const txt_off_x = 2.5;
        const txt_off_y = 6;

        this.attResetDiv = document.createElement("div");
        this.attResetDiv.id = "AttResetDiv";
        this.attResetDiv.setAttribute("border", "none");
        this.attResetDiv.setAttribute("position", "absolute");
        this.attResetDiv.setAttribute("display", "block");
        this.attResetDiv.setAttribute("top", "0%");
        this.attResetDiv.setAttribute("left", "0%");
        this.attResetDiv.setAttribute("width", "100%");
        this.attResetDiv.setAttribute("height", "100%");
        this.attResetDiv.style.display = "none";
        this.appendChild(this.attResetDiv);

        this.attResetSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.attResetSVG.setAttribute("id", "AttResetSVG");
        this.attResetSVG.setAttribute("viewBox", "0 0 600 600");
        this.attResetSVG.style.position = "absolute";
        this.attResetSVG.style.top = "0%";
        this.attResetSVG.style.left = "0%";
        this.attResetSVG.style.width = "100%";
        this.attResetSVG.style.height = "100%";
        this.attResetDiv.appendChild(this.attResetSVG);

        const st_att = document.createElementNS(Avionics.SVG.NS, "rect");
        st_att.setAttribute("id", "AttReset");
        st_att.setAttribute("fill", "#afbb3a");
        st_att.setAttribute("x", att_x + "%");
        st_att.setAttribute("y", boxRow + "%");
        st_att.setAttribute("width", boxWidth + "%");
        st_att.setAttribute("height", boxHeight + "%");
        this.attResetSVG.appendChild(st_att);

        this.st_att_txt = document.createElementNS(Avionics.SVG.NS, "text");
        this.st_att_txt.setAttribute("id", "AttResetTxt");
        this.st_att_txt.textContent = "ATT " + Math.ceil(this.resetTimer) + "s";
        this.st_att_txt.setAttribute("font-family", "ECAMFontRegular");
        this.st_att_txt.setAttribute("font-weight", "900");
        this.st_att_txt.setAttribute("font-size", "37px");
        this.st_att_txt.setAttribute("fill", "#1f242d");
        this.st_att_txt.setAttribute("x", att_x + txt_off_x + "%");
        this.st_att_txt.setAttribute("y", boxRow + txt_off_y + "%");
        this.attResetSVG.appendChild(this.st_att_txt);

    }

    update(dTime) {
        if (this.complete) {
            return;
        }
        if (this.resetTimer >= 0) {
            this.resetTimer -= dTime / 1000;
        }
        if (this.resetTimer <= 0) {
            this.finishReset();
        }
        if (this.resetTimer > 9) {
            this.st_att_txt.textContent = "ATT " + Math.ceil(this.resetTimer) + "s";
        } else {
            this.st_att_txt.textContent = "ATT 0" + Math.ceil(this.resetTimer) + "s";
        }
    }
    startReset() {
        SimVar.SetSimVarValue("L:A32NX_BARO_ATT_RESET","Bool", true);
        if (this.resetTimer > this.start_time) {
            return;
        }
        this.resetTimer = this.start_time;
        this.attResetDiv.style.display = "block";
        this.complete = false;
    }
    finishReset() {
        SimVar.SetSimVarValue("L:A32NX_BARO_ATT_RESET","Bool", false);
        if (this.complete) {
            return;
        }
        this.attResetDiv.style.display = "none";
        this.complete = true;
    }
}
customElements.define('a320-neo-sai-att-reset-indicator', A320_Neo_SAI_AttResetIndicator);

class A320_Neo_SAI_Bugs extends NavSystemElement {
    init(root) {
        const check_interval = 5;
        SimVar.SetSimVarValue("L:A32NX_BARO_BUGS_ACTIVE","Bool", false);
        this.bugsElement = this.gps.getChildById("Bugs");
        this.blink_status = false;
        this.current_bug = 0;
        this.getFrameCounter = A32NX_Util.createFrameCounter(check_interval);
    }

    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        const blink_interval = 2;
        const count = this.getFrameCounter();

        if (this.blink_status && count != 0 && count % blink_interval) {
            this.bugsElement.toggleBugBox(this.current_bug);
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BTN_BARO_BUGS":
                this.blink_status = false;
                this.bugsElement.freezeBugBox(this.current_bug);
                this.bugsElement.togglePage();
                break;
            case "BTN_BARO_PLUS":
                this.blink_status = true;
                if (this.bugsElement.getDisplay() !== "none") {
                    this.bugsElement.freezeBugBox(this.current_bug);
                    this.current_bug = (this.current_bug + 5) % 6;
                }
                break;
            case "BTN_BARO_MINUS":
                this.blink_status = true;
                if (this.bugsElement.getDisplay() !== "none") {
                    this.bugsElement.freezeBugBox(this.current_bug);
                    this.current_bug = (this.current_bug + 1) % 6;
                }
                break;
            case "KNOB_BARO_C":
                this.blink_status = true;
                if (this.current_bug < 4) {
                    this.bugsElement.setBug(this.current_bug, this.bugsElement.getBug(this.current_bug) + 1);
                } else {
                    this.bugsElement.setBug(this.current_bug, this.bugsElement.getBug(this.current_bug) + 100);
                }
                break;
            case "KNOB_BARO_AC":
                this.blink_status = true;
                if (this.current_bug < 4) {
                    this.bugsElement.setBug(this.current_bug, this.bugsElement.getBug(this.current_bug) - 1);
                } else {
                    this.bugsElement.setBug(this.current_bug, this.bugsElement.getBug(this.current_bug) - 100);
                }
                break;
            case "BTN_BARO_RST":
                this.bugsElement.freezeBugBox(this.current_bug);
                this.bugsElement.toggleBug(this.current_bug);
                break;
        }
    }
}

class A320_Neo_SAI_BugsPage extends HTMLElement {
    connectedCallback() {
        this.construct();
    }

    construct() {
        Utils.RemoveAllChildren(this);

        this.bugStatus = [];
        this.bugBox = [];
        this.bugTxt = [];

        this.bugsDiv = document.createElement("div");
        this.bugsDiv.id = "BugsDiv";
        this.bugsDiv.setAttribute("border", "none");
        this.bugsDiv.setAttribute("position", "absolute");
        this.bugsDiv.setAttribute("display", "block");
        this.bugsDiv.setAttribute("top", "0%");
        this.bugsDiv.setAttribute("left", "0%");
        this.bugsDiv.setAttribute("width", "100%");
        this.bugsDiv.setAttribute("height", "100%");
        this.bugsDiv.style.display = "none";
        this.appendChild(this.bugsDiv);

        this.bugsSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.bugsSVG.setAttribute("id", "BugsSvg");
        this.bugsSVG.setAttribute("viewBox", "0 0 600 600");
        this.bugsSVG.style.position = "absolute";
        this.bugsSVG.style.top = "0%";
        this.bugsSVG.style.left = "0%";
        this.bugsSVG.style.width = "100%";
        this.bugsSVG.style.height = "100%";
        this.bugsSVG.style.zIndex = "2";
        this.bugsSVG.style.backgroundColor = "rgba(13,20,35,1)";
        this.bugsDiv.appendChild(this.bugsSVG);

        const bugsTitle = document.createElementNS(Avionics.SVG.NS, "text");
        bugsTitle.setAttribute("id", "BugsTitle");
        bugsTitle.textContent = "BUGS";
        bugsTitle.setAttribute("font-family", "ECAMFontRegular");
        bugsTitle.setAttribute("font-weight", "100");
        bugsTitle.setAttribute("font-size", "36px");
        bugsTitle.setAttribute("fill", "white");
        bugsTitle.setAttribute("transform", "matrix(1 0 0 1 259.5 86)");
        this.bugsSVG.appendChild(bugsTitle);

        const bugsExitTxt = document.createElementNS(Avionics.SVG.NS, "text");
        bugsExitTxt.setAttribute("id", "BugsExitTxt");
        bugsExitTxt.textContent = "EXIT";
        bugsExitTxt.setAttribute("font-family", "ECAMFontRegular");
        bugsExitTxt.setAttribute("font-weight", "100");
        bugsExitTxt.setAttribute("font-size", "36px");
        bugsExitTxt.setAttribute("fill", "#27AAE1");
        bugsExitTxt.setAttribute("transform", "matrix(1 0 0 1 56.5 86)");
        this.bugsSVG.appendChild(bugsExitTxt);
        const bugsExitLine = document.createElementNS(Avionics.SVG.NS, "line");
        bugsExitLine.setAttribute("id", "BugsExitLine");
        bugsExitLine.setAttribute("stroke", "#27AAE1");
        bugsExitLine.setAttribute("stroke-width", "6");
        bugsExitLine.setAttribute("x1", "162");
        bugsExitLine.setAttribute("x2", "162");
        bugsExitLine.setAttribute("y1", "50");
        bugsExitLine.setAttribute("y2", "82");
        this.bugsSVG.appendChild(bugsExitLine);
        const bugsExitLineEnd = document.createElementNS(Avionics.SVG.NS, "polygon");
        bugsExitLineEnd.setAttribute("id", "BugsExitLineEnd");
        bugsExitLineEnd.setAttribute("fill", "#27AAE1");
        bugsExitLineEnd.setAttribute("points", "156,54 168,54 162,38");
        this.bugsSVG.appendChild(bugsExitLineEnd);

        const bugsPlusSymbol = document.createElementNS(Avionics.SVG.NS, "text");
        bugsPlusSymbol.setAttribute("id", "BugsPlusSymbol");
        bugsPlusSymbol.textContent = "(+)";
        bugsPlusSymbol.setAttribute("font-family", "ECAMFontRegular");
        bugsPlusSymbol.setAttribute("font-weight", "100");
        bugsPlusSymbol.setAttribute("font-size", "24px");
        bugsPlusSymbol.setAttribute("fill", "white");
        bugsPlusSymbol.setAttribute("transform", "matrix(1 0 0 1 244.5 160)");
        this.bugsSVG.appendChild(bugsPlusSymbol);

        const bugsMinusSymbol = document.createElementNS(Avionics.SVG.NS, "text");
        bugsMinusSymbol.setAttribute("id", "BugsMinusSymbol");
        bugsMinusSymbol.textContent = "(-)";
        bugsMinusSymbol.setAttribute("font-family", "ECAMFontRegular");
        bugsMinusSymbol.setAttribute("font-weight", "100");
        bugsMinusSymbol.setAttribute("font-size", "24px");
        bugsMinusSymbol.setAttribute("fill", "white");
        bugsMinusSymbol.setAttribute("transform", "matrix(1 0 0 1 140 237)");
        this.bugsSVG.appendChild(bugsMinusSymbol);

        const bugsSpdHeadTxt = document.createElementNS(Avionics.SVG.NS, "text");
        bugsSpdHeadTxt.setAttribute("id", "BugsSpdHeader");
        bugsSpdHeadTxt.textContent = "SPD";
        bugsSpdHeadTxt.setAttribute("font-family", "ECAMFontRegular");
        bugsSpdHeadTxt.setAttribute("font-weight", "100");
        bugsSpdHeadTxt.setAttribute("font-size", "36px");
        bugsSpdHeadTxt.setAttribute("fill", "white");
        bugsSpdHeadTxt.setAttribute("transform", "matrix(1 0 0 1 152 150)");
        this.bugsSVG.appendChild(bugsSpdHeadTxt);

        const bugLine = [];
        const bugLineX = [];

        bugLineX[0] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLineX[0].setAttribute("id", "BugsSpdLineX0");
        bugLineX[0].setAttribute("stroke", "white");
        bugLineX[0].setAttribute("stroke-width", "4");
        bugLineX[0].setAttribute("x1", "237");
        bugLineX[0].setAttribute("x2", "424");
        bugLineX[0].setAttribute("y1", "182");
        bugLineX[0].setAttribute("y2", "182");
        this.bugsSVG.appendChild(bugLineX[0]);

        this.bugStatus[0] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugStatus[0].setAttribute("id", "BugsSpd1Status");
        this.bugStatus[0].textContent = "OFF";
        this.bugStatus[0].style.display = "block";
        this.bugStatus[0].setAttribute("font-family", "ECAMFontRegular");
        this.bugStatus[0].setAttribute("font-weight", "100");
        this.bugStatus[0].setAttribute("font-size", "36px");
        this.bugStatus[0].setAttribute("fill", "white");
        this.bugStatus[0].setAttribute("transform", "matrix(1 0 0 1 54 193)");
        this.bugsSVG.appendChild(this.bugStatus[0]);
        this.bugBox[0] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.bugBox[0].setAttribute("id", "BugsSpd1Box");
        this.bugBox[0].setAttribute("stroke", "white");
        this.bugBox[0].setAttribute("stroke-width", "4");
        this.bugBox[0].setAttribute("x", "143.25");
        this.bugBox[0].setAttribute("y", "160");
        this.bugBox[0].setAttribute("width", "93.75");
        this.bugBox[0].setAttribute("height", "44.25");
        this.bugsSVG.appendChild(this.bugBox[0]);
        this.bugTxt[0] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugTxt[0].setAttribute("id", "BugsSpd1Txt");
        this.bugTxt[0].textContent = "030";
        this.bugTxt[0].setAttribute("font-family", "ECAMFontRegular");
        this.bugTxt[0].setAttribute("font-weight", "100");
        this.bugTxt[0].setAttribute("font-size", "36px");
        this.bugTxt[0].setAttribute("fill", "white");
        this.bugTxt[0].setAttribute("transform", "matrix(1 0 0 1 157 195)");
        this.bugsSVG.appendChild(this.bugTxt[0]);

        bugLine[0] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLine[0].setAttribute("id", "BugsSpdLine1");
        bugLine[0].setAttribute("stroke", "white");
        bugLine[0].setAttribute("stroke-width", "4");
        bugLine[0].setAttribute("x1", "190");
        bugLine[0].setAttribute("x2", "190");
        bugLine[0].setAttribute("y1", "204");
        bugLine[0].setAttribute("y2", "259");
        this.bugsSVG.appendChild(bugLine[0]);

        this.bugStatus[1] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugStatus[1].setAttribute("id", "BugsSpd2Status");
        this.bugStatus[1].textContent = "OFF";
        this.bugStatus[1].style.display = "block";
        this.bugStatus[1].setAttribute("font-family", "ECAMFontRegular");
        this.bugStatus[1].setAttribute("font-weight", "100");
        this.bugStatus[1].setAttribute("font-size", "36px");
        this.bugStatus[1].setAttribute("fill", "white");
        this.bugStatus[1].setAttribute("transform", "matrix(1 0 0 1 54 294)");
        this.bugsSVG.appendChild(this.bugStatus[1]);
        this.bugBox[1] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.bugBox[1].setAttribute("id", "BugsSpd2Box");
        this.bugBox[1].setAttribute("stroke", "white");
        this.bugBox[1].setAttribute("stroke-width", "4");
        this.bugBox[1].setAttribute("x", "143.25");
        this.bugBox[1].setAttribute("y", "259");
        this.bugBox[1].setAttribute("width", "93.75");
        this.bugBox[1].setAttribute("height", "44.25");
        this.bugsSVG.appendChild(this.bugBox[1]);
        this.bugTxt[1] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugTxt[1].setAttribute("id", "BugsSpd2Txt");
        this.bugTxt[1].textContent = "030";
        this.bugTxt[1].setAttribute("font-family", "ECAMFontRegular");
        this.bugTxt[1].setAttribute("font-weight", "100");
        this.bugTxt[1].setAttribute("font-size", "36px");
        this.bugTxt[1].setAttribute("fill", "white");
        this.bugTxt[1].setAttribute("transform", "matrix(1 0 0 1 157 294)");
        this.bugsSVG.appendChild(this.bugTxt[1]);

        bugLine[1] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLine[1].setAttribute("id", "BugsSpdLine2");
        bugLine[1].setAttribute("stroke", "white");
        bugLine[1].setAttribute("stroke-width", "4");
        bugLine[1].setAttribute("x1", "190");
        bugLine[1].setAttribute("x2", "190");
        bugLine[1].setAttribute("y1", "303");
        bugLine[1].setAttribute("y2", "358");
        this.bugsSVG.appendChild(bugLine[1]);

        this.bugStatus[2] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugStatus[2].setAttribute("id", "BugsSpd3Status");
        this.bugStatus[2].textContent = "OFF";
        this.bugStatus[2].style.display = "block";
        this.bugStatus[2].setAttribute("font-family", "ECAMFontRegular");
        this.bugStatus[2].setAttribute("font-weight", "100");
        this.bugStatus[2].setAttribute("font-size", "36px");
        this.bugStatus[2].setAttribute("fill", "white");
        this.bugStatus[2].setAttribute("transform", "matrix(1 0 0 1 54 392)");
        this.bugsSVG.appendChild(this.bugStatus[2]);
        this.bugBox[2] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.bugBox[2].setAttribute("id", "BugsSpd3Box");
        this.bugBox[2].setAttribute("stroke", "white");
        this.bugBox[2].setAttribute("stroke-width", "4");
        this.bugBox[2].setAttribute("x", "143.25");
        this.bugBox[2].setAttribute("y", "359");
        this.bugBox[2].setAttribute("width", "93.75");
        this.bugBox[2].setAttribute("height", "44.25");
        this.bugsSVG.appendChild(this.bugBox[2]);
        this.bugTxt[2] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugTxt[2].setAttribute("id", "BugsSpd3Txt");
        this.bugTxt[2].textContent = "030";
        this.bugTxt[2].setAttribute("font-family", "ECAMFontRegular");
        this.bugTxt[2].setAttribute("font-weight", "100");
        this.bugTxt[2].setAttribute("font-size", "36px");
        this.bugTxt[2].setAttribute("fill", "white");
        this.bugTxt[2].setAttribute("transform", "matrix(1 0 0 1 157 392)");
        this.bugsSVG.appendChild(this.bugTxt[2]);

        bugLine[2] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLine[2].setAttribute("id", "BugsSpdLine3");
        bugLine[2].setAttribute("stroke", "white");
        bugLine[2].setAttribute("stroke-width", "4");
        bugLine[2].setAttribute("x1", "190");
        bugLine[2].setAttribute("x2", "190");
        bugLine[2].setAttribute("y1", "402.5");
        bugLine[2].setAttribute("y2", "458");
        this.bugsSVG.appendChild(bugLine[2]);

        this.bugStatus[3] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugStatus[3].setAttribute("id", "BugsSpd4Status");
        this.bugStatus[3].textContent = "OFF";
        this.bugStatus[3].style.display = "block";
        this.bugStatus[3].setAttribute("font-family", "ECAMFontRegular");
        this.bugStatus[3].setAttribute("font-weight", "100");
        this.bugStatus[3].setAttribute("font-size", "36px");
        this.bugStatus[3].setAttribute("fill", "white");
        this.bugStatus[3].setAttribute("transform", "matrix(1 0 0 1 54 492)");
        this.bugsSVG.appendChild(this.bugStatus[3]);
        this.bugBox[3] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.bugBox[3].setAttribute("id", "BugsSpd4Box");
        this.bugBox[3].setAttribute("stroke", "white");
        this.bugBox[3].setAttribute("stroke-width", "4");
        this.bugBox[3].setAttribute("x", "143.25");
        this.bugBox[3].setAttribute("y", "459");
        this.bugBox[3].setAttribute("width", "93.75");
        this.bugBox[3].setAttribute("height", "44.25");
        this.bugsSVG.appendChild(this.bugBox[3]);
        this.bugTxt[3] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugTxt[3].setAttribute("id", "BugsSpd4Txt");
        this.bugTxt[3].textContent = "030";
        this.bugTxt[3].setAttribute("font-family", "ECAMFontRegular");
        this.bugTxt[3].setAttribute("font-weight", "100");
        this.bugTxt[3].setAttribute("font-size", "36px");
        this.bugTxt[3].setAttribute("fill", "white");
        this.bugTxt[3].setAttribute("transform", "matrix(1 0 0 1 157 492)");
        this.bugsSVG.appendChild(this.bugTxt[3]);

        bugLineX[1] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLineX[1].setAttribute("id", "BugsSpdLineX1");
        bugLineX[1].setAttribute("stroke", "white");
        bugLineX[1].setAttribute("stroke-width", "4");
        bugLineX[1].setAttribute("x1", "237");
        bugLineX[1].setAttribute("x2", "424");
        bugLineX[1].setAttribute("y1", "480");
        bugLineX[1].setAttribute("y2", "480");
        this.bugsSVG.appendChild(bugLineX[1]);

        const bugsAltHeadTxt = document.createElementNS(Avionics.SVG.NS, "text");
        bugsAltHeadTxt.setAttribute("id", "BugsAltHeader");
        bugsAltHeadTxt.textContent = "ALT";
        bugsAltHeadTxt.setAttribute("font-family", "ECAMFontRegular");
        bugsAltHeadTxt.setAttribute("font-weight", "100");
        bugsAltHeadTxt.setAttribute("font-size", "36px");
        bugsAltHeadTxt.setAttribute("fill", "white");
        bugsAltHeadTxt.setAttribute("transform", "matrix(1 0 0 1 387 150)");
        this.bugsSVG.appendChild(bugsAltHeadTxt);

        bugLine[3] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLine[3].setAttribute("id", "BugsAltLine1");
        bugLine[3].setAttribute("stroke", "white");
        bugLine[3].setAttribute("stroke-width", "4");
        bugLine[3].setAttribute("x1", "424");
        bugLine[3].setAttribute("x2", "424");
        bugLine[3].setAttribute("y1", "182");
        bugLine[3].setAttribute("y2", "259");
        this.bugsSVG.appendChild(bugLine[3]);

        this.bugStatus[5] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugStatus[5].setAttribute("id", "BugsAlt1Status");
        this.bugStatus[5].textContent = "OFF";
        this.bugStatus[5].style.display = "block";
        this.bugStatus[5].setAttribute("font-family", "ECAMFontRegular");
        this.bugStatus[5].setAttribute("font-weight", "100");
        this.bugStatus[5].setAttribute("font-size", "36px");
        this.bugStatus[5].setAttribute("fill", "white");
        this.bugStatus[5].setAttribute("transform", "matrix(1 0 0 1 500 294)");
        this.bugsSVG.appendChild(this.bugStatus[5]);
        this.bugBox[5] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.bugBox[5].setAttribute("id", "BugsAlt1Box");
        this.bugBox[5].setAttribute("stroke", "white");
        this.bugBox[5].setAttribute("stroke-width", "4");
        this.bugBox[5].setAttribute("x", "365");
        this.bugBox[5].setAttribute("y", "259");
        this.bugBox[5].setAttribute("width", "120");
        this.bugBox[5].setAttribute("height", "44.25");
        this.bugsSVG.appendChild(this.bugBox[5]);
        this.bugTxt[5] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugTxt[5].setAttribute("id", "BugsAlt1Txt");
        this.bugTxt[5].textContent = "00100";
        this.bugTxt[5].setAttribute("font-family", "ECAMFontRegular");
        this.bugTxt[5].setAttribute("font-weight", "100");
        this.bugTxt[5].setAttribute("font-size", "36px");
        this.bugTxt[5].setAttribute("fill", "white");
        this.bugTxt[5].setAttribute("transform", "matrix(1 0 0 1 370 294)");
        this.bugsSVG.appendChild(this.bugTxt[5]);

        bugLine[5] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLine[5].setAttribute("id", "BugsAltLineMid");
        bugLine[5].setAttribute("stroke", "white");
        bugLine[5].setAttribute("stroke-width", "4");
        bugLine[5].setAttribute("x1", "424");
        bugLine[5].setAttribute("x2", "424");
        bugLine[5].setAttribute("y1", "304");
        bugLine[5].setAttribute("y2", "358");
        this.bugsSVG.appendChild(bugLine[5]);

        this.bugStatus[4] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugStatus[4].setAttribute("id", "BugsAlt2Status");
        this.bugStatus[4].textContent = "OFF";
        this.bugStatus[4].style.display = "block";
        this.bugStatus[4].setAttribute("font-family", "ECAMFontRegular");
        this.bugStatus[4].setAttribute("font-weight", "100");
        this.bugStatus[4].setAttribute("font-size", "36px");
        this.bugStatus[4].setAttribute("fill", "white");
        this.bugStatus[4].setAttribute("transform", "matrix(1 0 0 1 500 392)");
        this.bugsSVG.appendChild(this.bugStatus[4]);
        this.bugBox[4] = document.createElementNS(Avionics.SVG.NS, "rect");
        this.bugBox[4].setAttribute("id", "BugsAlt2Box");
        this.bugBox[4].setAttribute("stroke", "white");
        this.bugBox[4].setAttribute("stroke-width", "4");
        this.bugBox[4].setAttribute("x", "365");
        this.bugBox[4].setAttribute("y", "358");
        this.bugBox[4].setAttribute("width", "120");
        this.bugBox[4].setAttribute("height", "44.25");
        this.bugsSVG.appendChild(this.bugBox[4]);
        this.bugTxt[4] = document.createElementNS(Avionics.SVG.NS, "text");
        this.bugTxt[4].setAttribute("id", "BugsAlt2Txt");
        this.bugTxt[4].textContent = "00100";
        this.bugTxt[4].setAttribute("font-family", "ECAMFontRegular");
        this.bugTxt[4].setAttribute("font-weight", "100");
        this.bugTxt[4].setAttribute("font-size", "36px");
        this.bugTxt[4].setAttribute("fill", "white");
        this.bugTxt[4].setAttribute("transform", "matrix(1 0 0 1 370 392)");
        this.bugsSVG.appendChild(this.bugTxt[4]);

        bugLine[4] = document.createElementNS(Avionics.SVG.NS, "line");
        bugLine[4].setAttribute("id", "BugsAltLine1");
        bugLine[4].setAttribute("stroke", "white");
        bugLine[4].setAttribute("stroke-width", "4");
        bugLine[4].setAttribute("x1", "424");
        bugLine[4].setAttribute("x2", "424");
        bugLine[4].setAttribute("y1", "402.5");
        bugLine[4].setAttribute("y2", "480");
        this.bugsSVG.appendChild(bugLine[4]);

        const bugsSelectTxt = document.createElementNS(Avionics.SVG.NS, "text");
        bugsSelectTxt.setAttribute("id", "BugsSelectTxt");
        bugsSelectTxt.textContent = "SET/SELECT";
        bugsSelectTxt.setAttribute("font-family", "ECAMFontRegular");
        bugsSelectTxt.setAttribute("font-weight", "100");
        bugsSelectTxt.setAttribute("font-size", "38px");
        bugsSelectTxt.setAttribute("fill", "#27AAE1");
        bugsSelectTxt.setAttribute("transform", "matrix(1 0 0 1 210 553)");
        this.bugsSVG.appendChild(bugsSelectTxt);
        const bugsSelectLine = document.createElementNS(Avionics.SVG.NS, "line");
        bugsSelectLine.setAttribute("id", "BugsSelectLine");
        bugsSelectLine.setAttribute("stroke", "#27AAE1");
        bugsSelectLine.setAttribute("stroke-width", "4");
        bugsSelectLine.setAttribute("x1", "440");
        bugsSelectLine.setAttribute("x2", "460");
        bugsSelectLine.setAttribute("y1", "541");
        bugsSelectLine.setAttribute("y2", "541");
        this.bugsSVG.appendChild(bugsSelectLine);
        const bugsSelectLineEnd = document.createElementNS(Avionics.SVG.NS, "polygon");
        bugsSelectLineEnd.setAttribute("id", "BugsSelectLineEnd");
        bugsSelectLineEnd.setAttribute("fill", "#27AAE1");
        bugsSelectLineEnd.setAttribute("points", "458,535 457.5,547 473.5,541");
        this.bugsSVG.appendChild(bugsSelectLineEnd);
    }

    getSpdBugs() {
        const bugs = [];
        for (let i = 0; i < 4; i++) {
            if (this.bugStatus[i].style.display !== "block") {
                bugs.push(this.bugTxt[i].textContent);
            }
        }
        return bugs;
    }

    getAltBugs() {
        const bugs = [];
        for (let i = 4; i < Object.keys(this.bugStatus).length; i++) {
            if (this.bugStatus[i].style.display !== "block") {
                bugs.push(this.bugTxt[i].textContent);
            }
        }
        return bugs;
    }

    getBug(bug) {
        return parseInt(this.bugTxt[bug].textContent);
    }

    setBug(bug, value) {
        if (bug < 4) {
            if (value < 30 || value > 520) {
                return;
            }
            let txt = value.toString();
            if (txt.length < 3) {
                txt = "0" + txt;
            }
            this.bugTxt[bug].textContent = txt;
        } else {
            if (value < 100 || value > 50000) {
                return;
            }
            let txt = value.toString();
            if (txt.length < 4) {
                txt = "0" + txt;
            }
            if (txt.length < 5) {
                txt = "0" + txt;
            }
            this.bugTxt[bug].textContent = txt;
        }
    }

    toggleBugBox(bug) {
        if (this.bugBox[bug].style.display === "block") {
            this.bugBox[bug].style.display = "none";
        } else {
            this.bugBox[bug].style.display = "block";
        }
    }

    freezeBugBox(bug) {
        if (this.bugBox[bug].style.display === "none") {
            this.bugBox[bug].style.display = "block";
        }
    }
    toggleBug(bug) {
        if (this.bugStatus[bug].style.display === "block") {
            this.bugStatus[bug].style.display = "none";
        } else {
            this.bugStatus[bug].style.display = "block";
        }
    }
    togglePage() {
        if (this.bugsDiv.style.display === "block") {
            SimVar.SetSimVarValue("L:A32NX_BARO_BUGS_ACTIVE","Bool", false);
            this.bugsDiv.style.display = "none";
        } else {
            SimVar.SetSimVarValue("L:A32NX_BARO_BUGS_ACTIVE","Bool", true);
            this.bugsDiv.style.display = "block";
        }
    }
    getDisplay() {
        return this.bugsDiv.style.display;
    }
}

customElements.define('a320-neo-sai-bugs-page', A320_Neo_SAI_BugsPage);

class A320_Neo_SAI_LandingSys extends NavSystemElement {
    init(root) {
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}

class A320_Neo_SAI_LandingSysIndicator extends HTMLElement {
    connectedCallback() {
        this.construct();
    }

    construct() {
        Utils.RemoveAllChildren(this);

    }
}

customElements.define('a320-neo-sai-landingsys-indicator', A320_Neo_SAI_LandingSysIndicator);

registerInstrument("a320-neo-sai", A320_Neo_SAI);
//# sourceMappingURL=A320_Neo_SAI.js.map