/**
 * Graduation speeds
 * @type {number[]}
 */
const GRAD_SPEEDS = [500, 1000, 1500, 2000, 4000, 6000];

/**
 * Positions of each graduation
 * @type {number[]}
 */
const GRAD_Y_POS = [70, 140, 175, 210, 245, 280];

class PfdVerticalSpeedIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.cursorTextColor = "rgb(26,255,0)";
        this.fontSize = 22;
        this.cursorPosX1 = 0;
        this.cursorPosY1 = 0;
        this.cursorPosX2 = 0;
        this.cursorPosY2 = 0;
        this.cursorBgOffsetY = 0;
        this.selectedCursorOffsetY = 0;
        this.maxSpeed = 0;

        this._aircraft = Aircraft.A320_NEO;

        this.previousState = {
            selectedSpeed: NaN
        };
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
        if (this._aircraft !== _val) {
            this._aircraft = _val;
            this.construct();
        }
    }

    connectedCallback() {
        this.construct();
    }

    destroyLayout() {
        Utils.RemoveAllChildren(this);

        for (let i = 0; i < Jet_PFD_AttitudeIndicator.dynamicAttributes.length; i++) {
            this.removeAttribute(Jet_PFD_AttitudeIndicator.dynamicAttributes[i]);
        }
    }

    construct() {
        this.construct_A320_Neo();
    }

    construct_A320_Neo() {
        // Root

        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 600");

        const posX = 0;
        const posY = 0;
        const width = 100;
        const height = 600;

        this.maxSpeed = 10000;
        this.cursorTextColor = "rgb(26,255,0)";

        this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootGroup.setAttribute("id", "VerticalSpeed");

        this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.centerGroup.setAttribute("id", "CenterGroup");

        const smallBg = document.createElementNS(Avionics.SVG.NS, "path");
        smallBg.setAttribute("fill", "#343B51");
        smallBg.setAttribute("d", "M 0 0 L 0 " + height + " L 30 " + height + " L 50 " + (height - 100) + " L 50 100 L 30 0 Z");
        smallBg.setAttribute("transform", "translate(" + posX + " " + posY + ")");
        this.centerGroup.appendChild(smallBg);
        const _width = width;
        const _height = height;
        const _top = posY;
        const _left = posX + 50 - _width * 0.5;
        const _graduationStartY = _top + _height * 0.05;
        const _graduationHeight = (_top + _height * 0.95) - _graduationStartY;
        if (!this.graduationsGroup) {
            this.graduationsGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.graduationsGroup.setAttribute("id", "GraduationsGroup");
        } else {
            Utils.RemoveAllChildren(this.graduationsGroup);
        }

        for (let i = 0; i < GRAD_SPEEDS.length; i++) {
            const isPrimary = i % 2 !== 0;
            const y1 = _graduationStartY + _graduationHeight * 0.5 + GRAD_Y_POS[i];

            const line1 = document.createElementNS(Avionics.SVG.NS, "rect");

            line1.setAttribute("x", (_left + _width * 0.2).toString());
            line1.setAttribute("y", y1.toString());
            line1.setAttribute("width", isPrimary ? "9" : "9");
            line1.setAttribute("height", isPrimary ? "8" : "2");
            line1.setAttribute("fill", "white");
            this.graduationsGroup.appendChild(line1);

            if (isPrimary) {
                const text = document.createElementNS(Avionics.SVG.NS, "text");
                text.textContent = (GRAD_SPEEDS[i] / 1000).toString();
                text.setAttribute("x", _left.toString());
                text.setAttribute("y", (y1 + 5).toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", (this.fontSize * 1.15).toString());
                text.setAttribute("font-family", "ECAMFontRegular");
                text.setAttribute("text-anchor", "start");
                text.setAttribute("alignment-baseline", "central");
                this.graduationsGroup.appendChild(text);
            }

            const y2 = _graduationStartY + _graduationHeight * 0.5 - GRAD_Y_POS[i];

            const line2 = document.createElementNS(Avionics.SVG.NS, "rect");

            line2.setAttribute("x", (_left + _width * 0.2).toString());
            line2.setAttribute("y", (y2 - 5).toString());
            line2.setAttribute("width", isPrimary ? "9" : "9");
            line2.setAttribute("height", isPrimary ? "8" : "2");
            line2.setAttribute("fill", "white");
            this.graduationsGroup.appendChild(line2);

            if (isPrimary) {
                const text = document.createElementNS(Avionics.SVG.NS, "text");

                text.textContent = (GRAD_SPEEDS[i] / 1000).toString();
                text.setAttribute("x", _left.toString());
                text.setAttribute("y", y2.toString());
                text.setAttribute("fill", "white");
                text.setAttribute("font-size", (this.fontSize * 1.15).toString());
                text.setAttribute("font-family", "ECAMFontRegular");
                text.setAttribute("text-anchor", "start");
                text.setAttribute("alignment-baseline", "central");
                this.graduationsGroup.appendChild(text);
            }
        }
        this.centerGroup.appendChild(this.graduationsGroup);

        // Cursor

        this.cursorPosX1 = _left + _width * 0.30;
        this.cursorPosY1 = _graduationStartY + _graduationHeight * 0.5;
        this.cursorPosX2 = _left + _width;
        this.cursorPosY2 = _graduationStartY + _graduationHeight * 0.5;

        this.cursorSVGGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.cursorSVGGroup.setAttribute("id", "CursorGroup");

        this.cursorSVGLine = document.createElementNS(Avionics.SVG.NS, "line");
        this.cursorSVGLine.setAttribute("stroke", this.cursorTextColor);
        this.cursorSVGLine.setAttribute("stroke-width", "4.5");
        this.cursorSVGGroup.appendChild(this.cursorSVGLine);

        const cursorSVGNeutral = document.createElementNS(Avionics.SVG.NS, "line");
        cursorSVGNeutral.setAttribute("x1", _left.toString());
        cursorSVGNeutral.setAttribute("y1", this.cursorPosY1.toString());
        cursorSVGNeutral.setAttribute("x2", this.cursorPosX1.toString());
        cursorSVGNeutral.setAttribute("y2", this.cursorPosY1.toString());
        cursorSVGNeutral.setAttribute("stroke", "yellow");
        cursorSVGNeutral.setAttribute("stroke-width", "8");
        this.cursorSVGGroup.appendChild(cursorSVGNeutral);

        const cursorBgWidth = 34;
        const cursorBgHeight = 25;
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
        this.cursorSVGText.setAttribute("font-family", "ECAMFontRegular");
        this.cursorSVGText.setAttribute("text-anchor", "start");
        this.cursorSVGText.setAttribute("alignment-baseline", "central");

        this.cursorSVGGroup.appendChild(this.cursorSVGText);
        this.centerGroup.appendChild(this.cursorSVGGroup);

        // ADIRS not aligned overlay

        this.failMask = document.createElementNS(Avionics.SVG.NS, "path");
        this.failMask.setAttribute("fill", "#343B51");
        this.failMask.setAttribute("d", "M 0 0 L 0 " + height + " L 30 " + height + " L 50 " + (height - 100) + " L 50 100 L 30 0 Z");
        this.failMask.setAttribute("transform", "translate(" + posX + " " + posY + ")");
        this.centerGroup.appendChild(this.failMask);

        this.rootGroup.appendChild(this.centerGroup);
        this.rootSVG.appendChild(this.rootGroup);

        this.appendChild(this.rootSVG);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.updateFail();
        if (oldValue === newValue) {
            return;
        }
        switch (name) {
            case "vspeed":
                const vSpeed = parseFloat(newValue);
                this.updateVSpeed(vSpeed);
                break;
            case "selected_vspeed_active":
                if (this.selectedCursorSVG) {
                    if (newValue === "true") {
                        this.selectedCursorSVG.setAttribute("visibility", "visible");
                    } else {
                        this.selectedCursorSVG.setAttribute("visibility", "hidden");
                    }
                }
                break;
            case "selected_vspeed":
                const selVSpeed = parseFloat(newValue);
                this.updateSelectedVSpeed(selVSpeed);
                break;
        }
    }

    updateVSpeed(_speed) {
        if (GRAD_SPEEDS) {
            const vSpeed = Math.min(this.maxSpeed, Math.max(-this.maxSpeed, _speed));
            const height = this.heightFromSpeed(vSpeed);
            if (vSpeed >= 0) {
                this.cursorPosY1 = this.cursorPosY2 - height;
            } else {
                this.cursorPosY1 = this.cursorPosY2 + height;
            }
            let alert = false;
            const altitude = Simplane.getAltitudeAboveGround();

            if ((altitude < 2500 && altitude > 1000 && vSpeed <= -2000) || (altitude < 1000 && vSpeed <= -1200)) { //airbus alerts thresholds
                alert = true;
            }
            if ((vSpeed >= 6000) || (vSpeed <= -6000)) {
                alert = true;
            } // airbus alerts thresholds

            if (this.cursorSVGLine) {
                this.cursorSVGLine.setAttribute("x1", this.cursorPosX1.toString());
                this.cursorSVGLine.setAttribute("y1", this.cursorPosY1.toString());
                this.cursorSVGLine.setAttribute("x2", this.cursorPosX2.toString());
                this.cursorSVGLine.setAttribute("y2", this.cursorPosY2.toString());
                if (alert) {
                    this.cursorSVGLine.setAttribute("stroke", "orange");
                } else {
                    this.cursorSVGLine.setAttribute("stroke", this.cursorTextColor);
                }
            }

            const displaySpeed = Math.floor(vSpeed / 100);

            if (Math.abs(displaySpeed) > 2) { // text is displayed above +/-200ft/min only was 0
                this.cursorSVGText.textContent = Math.abs(displaySpeed).toString();
                let posY;
                if (displaySpeed > 0) {
                    posY = this.cursorPosY1 - 13;
                } else {
                    posY = this.cursorPosY1 + 13;
                }

                this.cursorSVGText.setAttribute("y", posY.toString());

                if (this.cursorSVGTextBg) {
                    this.cursorSVGTextBg.setAttribute("y", (posY - this.cursorBgOffsetY).toString());
                    this.cursorSVGTextBg.setAttribute("visibility", "visible");
                }
            } else {
                this.cursorSVGText.textContent = "";
                if (this.cursorSVGTextBg) {
                    this.cursorSVGTextBg.setAttribute("visibility", "hidden");
                }
            }
            if (alert) {
                this.cursorSVGText.setAttribute("fill", "orange");
            } else {
                this.cursorSVGText.setAttribute("fill", this.cursorTextColor);
            }
        }
    }

    updateSelectedVSpeed(_speed) {
        const vSpeed = Math.min(this.maxSpeed, Math.max(-this.maxSpeed, _speed));
        const height = this.heightFromSpeed(vSpeed);

        let posY = 0;
        if (vSpeed >= 0) {
            posY = this.cursorPosY2 - height;
        } else {
            posY = this.cursorPosY2 + height;
        }

        this.selectedCursorSVG.setAttribute("transform", "translate(0 " + (posY - this.selectedCursorOffsetY) + ")");
    }

    heightFromSpeed(_speed) {
        const absSpeed = Math.abs(_speed);
        let height = 0;
        let found = false;
        if (absSpeed < GRAD_SPEEDS[0]) {
            const percent = absSpeed / GRAD_SPEEDS[0];

            height = GRAD_Y_POS[0] * percent;
        } else {
            for (let i = 0; i < GRAD_SPEEDS.length - 1; i++) {
                if (absSpeed >= GRAD_SPEEDS[i] && absSpeed < GRAD_SPEEDS[i + 1]) {
                    const percent = (absSpeed - GRAD_SPEEDS[i]) / (GRAD_SPEEDS[i + 1] - GRAD_SPEEDS[i]);

                    height = GRAD_Y_POS[i] + (GRAD_Y_POS[i + 1] - GRAD_Y_POS[i]) * percent;
                    found = true;
                    break;
                }
            }
            if (!found) {
                height = GRAD_Y_POS[GRAD_Y_POS.length - 1];
            }
        }
        return height;
    }

    updateFail() {
        const pfdAdirsAligned = !(SimVar.GetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool") === 1);

        if (!pfdAdirsAligned) {
            this.failMask.setAttribute("visibility", "hidden");
            this.cursorSVGGroup.setAttribute("visibility", "visible");
        } else {
            this.failMask.setAttribute("visibility", "visible");
            this.cursorSVGGroup.setAttribute("visibility", "hidden");
        }
    }
}

customElements.define("a32nx-pfd-vspeed-indicator", PfdVerticalSpeedIndicator);