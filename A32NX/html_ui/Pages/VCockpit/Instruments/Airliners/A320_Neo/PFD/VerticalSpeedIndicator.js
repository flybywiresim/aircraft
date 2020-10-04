class Jet_PFD_VerticalSpeedIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.cursorTextColor = "rgb(26,255,0)";
        this.fontSize = 25;
        this.cursorPosX1 = 0;
        this.cursorPosY1 = 0;
        this.cursorPosX2 = 0;
        this.cursorPosY2 = 0;
        this.cursorBgOffsetY = 0;
        this.selectedCursorOffsetY = 0;
        this.maxSpeed = 0;
        this.gradSpeeds = [];
        this.gradYPos = [];
        this._aircraft = Aircraft.A320_NEO;
    }
    static get dynamicAttributes() {
        return [
            "vspeed",
            "selected_vspeed",
            "selected_vspeed_active"
        ];
    }
    static get observedAttributes() {
        return this.dynamicAttributes.concat([]);
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
    destroyLayout() {
        Utils.RemoveAllChildren(this);
        this.topSpeedText = null;
        this.bottomSpeedText = null;
        for (let i = 0; i < Jet_PFD_AttitudeIndicator.dynamicAttributes.length; i++) {
            this.removeAttribute(Jet_PFD_AttitudeIndicator.dynamicAttributes[i]);
        }
    }
    construct() {
        this.destroyLayout();
        this.construct_A320_Neo();
    }

    construct_A320_Neo() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 600");
        var posX = 0;
        var posY = 0;
        var width = 100;
        var height = 600;
        this.maxSpeed = 10000; // was 6000, raised to keep on displaying the values
        this.cursorTextColor = "rgb(26,255,0)";
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "VerticalSpeed");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerGroup) {
            this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.centerGroup.setAttribute("id", "CenterGroup");
        }
        else {
            Utils.RemoveAllChildren(this.centerGroup);
        }
        var smallBg = document.createElementNS(Avionics.SVG.NS, "path");
        smallBg.setAttribute("fill", "#343B51");
        smallBg.setAttribute("d", "M 0 0 L 0 " + height + " L 30 " + height + " L 50 " + (height - 100) + " L 50 100 L 30 0 Z");
        smallBg.setAttribute("transform", "translate(" + posX + " " + posY + ")");
        this.centerGroup.appendChild(smallBg);
        var _width = width;
        var _height = height;
        var _top = posY;
        var _left = posX + 50 - _width * 0.5;
        var _graduationStartY = _top + _height * 0.05;
        var _graduationHeight = (_top + _height * 0.95) - _graduationStartY;
        if (!this.graduationsGroup) {
            this.graduationsGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.graduationsGroup.setAttribute("id", "GraduationsGroup");
        }
        else {
            Utils.RemoveAllChildren(this.graduationsGroup);
        }
        this.gradSpeeds = [500, 1000, 1500, 2000, 4000, 6000];
        this.gradYPos = [70, 140, 175, 210, 245, 280];
        for (var i = 0; i < this.gradSpeeds.length; i++) {
            var isPrimary = (i % 2 != 0) ? true : false;
            var y = _graduationStartY + _graduationHeight * 0.5 + this.gradYPos[i];
            var line = document.createElementNS(Avionics.SVG.NS, "rect");
            line.setAttribute("x", (_left + _width * 0.2).toString());
            line.setAttribute("y", y.toString());
            line.setAttribute("width", isPrimary ? "9" : "9");
            line.setAttribute("height", isPrimary ? "8" : "2");
            line.setAttribute("fill", "white");
            this.graduationsGroup.appendChild(line);
            if (isPrimary) {
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = (this.gradSpeeds[i] / 1000).toString();
                text.setAttribute("x", _left.toString());
                text.setAttribute("y", y.toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", (this.fontSize * 1.15).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "start");
                text.setAttribute("alignment-baseline", "central");
                this.graduationsGroup.appendChild(text);
            }
            y = _graduationStartY + _graduationHeight * 0.5 - this.gradYPos[i];
            var line = document.createElementNS(Avionics.SVG.NS, "rect");
            line.setAttribute("x", (_left + _width * 0.2).toString());
            line.setAttribute("y", y.toString());
            line.setAttribute("width", isPrimary ? "9" : "9");
            line.setAttribute("height", isPrimary ? "8" : "2");
            line.setAttribute("fill", "white");
            this.graduationsGroup.appendChild(line);
            if (isPrimary) {
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = (this.gradSpeeds[i] / 1000).toString();
                text.setAttribute("x", _left.toString());
                text.setAttribute("y", y.toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", (this.fontSize * 1.15).toString());
                text.setAttribute("font-family", "Roboto-Bold");
                text.setAttribute("text-anchor", "start");
                text.setAttribute("alignment-baseline", "central");
                this.graduationsGroup.appendChild(text);
            }
        }
        this.centerGroup.appendChild(this.graduationsGroup);
        {
            this.cursorPosX1 = _left + _width * 0.30;
            this.cursorPosY1 = _graduationStartY + _graduationHeight * 0.5;
            this.cursorPosX2 = _left + _width;
            this.cursorPosY2 = _graduationStartY + _graduationHeight * 0.5;
            if (!this.cursorSVGGroup) {
                this.cursorSVGGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.cursorSVGGroup.setAttribute("id", "CursorGroup");
            }
            else
                Utils.RemoveAllChildren(this.cursorSVGGroup);
            if (!this.cursorSVGLine)
                this.cursorSVGLine = document.createElementNS(Avionics.SVG.NS, "line");
            this.cursorSVGLine.setAttribute("stroke", this.cursorTextColor);
            this.cursorSVGLine.setAttribute("stroke-width", "4.5");
            this.cursorSVGGroup.appendChild(this.cursorSVGLine);
            var cursorSVGNeutral = document.createElementNS(Avionics.SVG.NS, "line");
            cursorSVGNeutral.setAttribute("x1", _left.toString());
            cursorSVGNeutral.setAttribute("y1", this.cursorPosY1.toString());
            cursorSVGNeutral.setAttribute("x2", this.cursorPosX1.toString());
            cursorSVGNeutral.setAttribute("y2", this.cursorPosY1.toString());
            cursorSVGNeutral.setAttribute("stroke", "yellow");
            cursorSVGNeutral.setAttribute("stroke-width", "8");
            this.cursorSVGGroup.appendChild(cursorSVGNeutral);
            let cursorBgWidth = 34;
            let cursorBgHeight = 25;
            this.cursorBgOffsetY = cursorBgHeight * 0.45;
            this.cursorSVGTextBg = document.createElementNS(Avionics.SVG.NS, "rect");
            this.cursorSVGTextBg.setAttribute("x", (this.cursorPosX1).toString());
            this.cursorSVGTextBg.setAttribute("y", (this.cursorPosY1 - this.cursorBgOffsetY).toString());
            this.cursorSVGTextBg.setAttribute("width", cursorBgWidth.toString());
            this.cursorSVGTextBg.setAttribute("height", cursorBgHeight.toString());
            this.cursorSVGTextBg.setAttribute("fill", "url(#Backlight)");
            this.cursorSVGGroup.appendChild(this.cursorSVGTextBg);
            this.cursorSVGText = document.createElementNS(Avionics.SVG.NS, "text");
            this.cursorSVGText.textContent = "17";
            this.cursorSVGText.setAttribute("x", this.cursorPosX1.toString());
            this.cursorSVGText.setAttribute("y", this.cursorPosY1.toString());
            this.cursorSVGText.setAttribute("fill", this.cursorTextColor);
            this.cursorSVGText.setAttribute("font-size", (this.fontSize * 1.0).toString());
            this.cursorSVGText.setAttribute("font-family", "Roboto-Bold");
            this.cursorSVGText.setAttribute("text-anchor", "start");
            this.cursorSVGText.setAttribute("alignment-baseline", "central");
            this.cursorSVGGroup.appendChild(this.cursorSVGText);
            this.centerGroup.appendChild(this.cursorSVGGroup);
        }
        {
            this.failMask = document.createElementNS(Avionics.SVG.NS, "path");
            this.failMask.setAttribute("fill", "#343B51");
            this.failMask.setAttribute("d", "M 0 0 L 0 " + height + " L 30 " + height + " L 50 " + (height - 100) + " L 50 100 L 30 0 Z");
            this.failMask.setAttribute("transform", "translate(" + posX + " " + posY + ")");
            this.centerGroup.appendChild(this.failMask);
        }
        this.rootGroup.appendChild(this.centerGroup);
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.updateFail();
        if (oldValue == newValue)
            return;
        switch (name) {
            case "vspeed":
                let vSpeed = parseFloat(newValue);
                this.updateVSpeed(vSpeed);
                break;
            case "selected_vspeed_active":
                if (this.selectedCursorSVG) {
                    if (newValue == "true")
                        this.selectedCursorSVG.setAttribute("visibility", "visible");
                    else
                        this.selectedCursorSVG.setAttribute("visibility", "hidden");
                }
                break;
            case "selected_vspeed":
                let selVSpeed = parseFloat(newValue);
                this.updateSelectedVSpeed(selVSpeed);
                break;
        }
    }

    updateVSpeed(_speed) {
        if (this.gradSpeeds) {
            {
                let vSpeed = Math.min(this.maxSpeed, Math.max(-this.maxSpeed, _speed));
                let height = this.heightFromSpeed(vSpeed);
                if (vSpeed >= 0)
                    this.cursorPosY1 = this.cursorPosY2 - height;
                else
                    this.cursorPosY1 = this.cursorPosY2 + height;
                let alert = false;
                {
                    let altitude = Simplane.getAltitudeAboveGround();
                    if ((altitude < 2500 && altitude > 1000 && vSpeed <= -2000) || (altitude < 1000 && vSpeed <= -1200)) //airbus alerts thresholds
                        alert = true;
                    if ((vSpeed >=6000) || (vSpeed <= -6000)) alert = true; // airbus alerts thresholds
                }

                if (this.cursorSVGLine) {
                    this.cursorSVGLine.setAttribute("x1", this.cursorPosX1.toString());
                    this.cursorSVGLine.setAttribute("y1", this.cursorPosY1.toString());
                    this.cursorSVGLine.setAttribute("x2", this.cursorPosX2.toString());
                    this.cursorSVGLine.setAttribute("y2", this.cursorPosY2.toString());
                    if (alert)
                        this.cursorSVGLine.setAttribute("stroke", "orange");
                    else
                        this.cursorSVGLine.setAttribute("stroke", this.cursorTextColor);
                }
                if (this.cursorSVGText) {
                    var displaySpeed = Math.floor(vSpeed / 100);
                    if (Math.abs(displaySpeed) > 2) {//text is displayed above +/-200ft/min only was 0 
                        this.cursorSVGText.textContent = Math.abs(displaySpeed).toString();
                        let posY;
                        if (displaySpeed > 0)
                            posY = this.cursorPosY1 - 13;
                        else
                            posY = this.cursorPosY1 + 13;
                        this.cursorSVGText.setAttribute("y", posY.toString());
                        if (this.cursorSVGTextBg) {
                            this.cursorSVGTextBg.setAttribute("y", (posY - this.cursorBgOffsetY).toString());
                            this.cursorSVGTextBg.setAttribute("visibility", "visible");
                        }
                    }
                    else {
                        this.cursorSVGText.textContent = "";
                        if (this.cursorSVGTextBg) {
                            this.cursorSVGTextBg.setAttribute("visibility", "hidden");
                        }
                    }
                    if (alert)
                        this.cursorSVGText.setAttribute("fill", "orange");
                    else
                        this.cursorSVGText.setAttribute("fill", this.cursorTextColor);
                }
            }
            {
                let threshold = 400;
                var displaySpeed = Math.abs(Math.floor(_speed));
                displaySpeed = Math.round(displaySpeed / 5) * 5;
                if (this.topSpeedText) {
                    if (_speed >= threshold)
                        this.topSpeedText.textContent = displaySpeed.toString();
                    else if (_speed <= -threshold)
                        this.topSpeedText.textContent = "";
                    else
                        this.topSpeedText.textContent = "";
                }
                if (this.bottomSpeedText) {
                    if (_speed >= threshold)
                        this.bottomSpeedText.textContent = "";
                    else if (_speed <= -threshold)
                        this.bottomSpeedText.textContent = displaySpeed.toString();
                    else
                        this.bottomSpeedText.textContent = "";
                }
            }
        }
    }
    updateSelectedVSpeed(_speed) {
        if (this.gradSpeeds && this.selectedCursorSVG) {
            let vSpeed = Math.min(this.maxSpeed, Math.max(-this.maxSpeed, _speed));
            let height = this.heightFromSpeed(vSpeed);
            let posY = 0;
            if (vSpeed >= 0)
                posY = this.cursorPosY2 - height;
            else
                posY = this.cursorPosY2 + height;
            this.selectedCursorSVG.setAttribute("transform", "translate(0 " + (posY - this.selectedCursorOffsetY) + ")");
        }
    }
    heightFromSpeed(_speed) {
        var absSpeed = Math.abs(_speed);
        var height = 0;
        var found = false;
        if (absSpeed < this.gradSpeeds[0]) {
            var percent = absSpeed / this.gradSpeeds[0];
            height = this.gradYPos[0] * percent;
        }
        else {
            for (var i = 0; i < this.gradSpeeds.length - 1; i++) {
                if (absSpeed >= this.gradSpeeds[i] && absSpeed < this.gradSpeeds[i + 1]) {
                    var percent = (absSpeed - this.gradSpeeds[i]) / (this.gradSpeeds[i + 1] - this.gradSpeeds[i]);
                    height = this.gradYPos[i] + (this.gradYPos[i + 1] - this.gradYPos[i]) * percent;
                    found = true;
                    break;
                }
            }
            if (!found)
                height = this.gradYPos[this.gradYPos.length - 1];
        }
        return height;
    }
    updateFail() {
        var failed = !(SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") == 1);
        if (!failed) {
            this.failMask.setAttribute("visibility", "hidden");
            this.cursorSVGGroup.setAttribute("visibility", "visible");
        } else {
            this.failMask.setAttribute("visibility", "visible");
            this.cursorSVGGroup.setAttribute("visibility", "hidden");
        }
    }
}
customElements.define("jet-pfd-vspeed-indicator", Jet_PFD_VerticalSpeedIndicator);
//# sourceMappingURL=VerticalSpeedIndicator.js.map
