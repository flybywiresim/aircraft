class AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.bankSizeRatio = -24;
        this.backgroundVisible = true;
        this.flightDirectorActive = false;
        this.flightDirectorPitch = 0;
        this.flightDirectorBank = 0;
        this.aspectRatio = 1.0;
        this.isBackup = false;
        this.horizonTopColor = "#00569d";
        this.horizonBottomColor = "#48432e";
    }
    static get observedAttributes() {
        return [
            "pitch",
            "bank",
            "slip_skid",
            "background",
            "flight_director-active",
            "flight_director-pitch",
            "flight_director-bank",
            "bank_size_ratio",
            "aspect-ratio",
            "is-backup",
        ];
    }
    connectedCallback() {
        this.construct();
    }
    buildGraduations() {
        if (!this.attitude_pitch)
            return;
        this.attitude_pitch.innerHTML = "";
        let maxDash = 80;
        let fullPrecisionLowerLimit = -20;
        let fullPrecisionUpperLimit = 20;
        let halfPrecisionLowerLimit = -30;
        let halfPrecisionUpperLimit = 45;
        let unusualAttitudeLowerLimit = -30;
        let unusualAttitudeUpperLimit = 50;
        let bigWidth = 120;
        let bigHeight = 3;
        let mediumWidth = 60;
        let mediumHeight = 3;
        let smallWidth = 40;
        let smallHeight = 2;
        let fontSize = 20;
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
                }
                else if (angle >= halfPrecisionLowerLimit && angle < halfPrecisionUpperLimit) {
                    nextAngle = angle + 5;
                }
                else {
                    nextAngle = angle + 10;
                }
            }
            else {
                if (angle % 5 == 0) {
                    width = mediumWidth;
                    height = mediumHeight;
                    text = true;
                    if (angle >= fullPrecisionLowerLimit && angle < fullPrecisionUpperLimit) {
                        nextAngle = angle + 2.5;
                    }
                    else {
                        nextAngle = angle + 5;
                    }
                }
                else {
                    width = smallWidth;
                    height = smallHeight;
                    nextAngle = angle + 2.5;
                    text = false;
                }
            }
            if (angle != 0) {
                let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.setAttribute("fill", "white");
                rect.setAttribute("x", (-width / 2).toString());
                rect.setAttribute("y", (this.bankSizeRatio * angle - height / 2).toString());
                rect.setAttribute("width", width.toString());
                rect.setAttribute("height", height.toString());
                this.attitude_pitch.appendChild(rect);
                if (text) {
                    let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                    leftText.textContent = Math.abs(angle).toString();
                    leftText.setAttribute("x", ((-width / 2) - 5).toString());
                    leftText.setAttribute("y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                    leftText.setAttribute("text-anchor", "end");
                    leftText.setAttribute("font-size", fontSize.toString());
                    leftText.setAttribute("font-family", "Roboto-Bold");
                    leftText.setAttribute("fill", "white");
                    this.attitude_pitch.appendChild(leftText);
                    let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                    rightText.textContent = Math.abs(angle).toString();
                    rightText.setAttribute("x", ((width / 2) + 5).toString());
                    rightText.setAttribute("y", (this.bankSizeRatio * angle - height / 2 + fontSize / 2).toString());
                    rightText.setAttribute("text-anchor", "start");
                    rightText.setAttribute("font-size", fontSize.toString());
                    rightText.setAttribute("font-family", "Roboto-Bold");
                    rightText.setAttribute("fill", "white");
                    this.attitude_pitch.appendChild(rightText);
                }
                if (angle < unusualAttitudeLowerLimit) {
                    let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                    let path = "M" + -smallWidth / 2 + " " + (this.bankSizeRatio * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                    path += "L" + bigWidth / 2 + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                    path += "L0 " + (this.bankSizeRatio * nextAngle + 20) + " ";
                    path += "L" + (-bigWidth / 2 + smallWidth) + " " + (this.bankSizeRatio * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                    chevron.setAttribute("d", path);
                    chevron.setAttribute("fill", "red");
                    this.attitude_pitch.appendChild(chevron);
                }
                if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                    let chevron = document.createElementNS(Avionics.SVG.NS, "path");
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
    construct() {
        Utils.RemoveAllChildren(this);
        {
            this.horizon = document.createElementNS(Avionics.SVG.NS, "svg");
            this.horizon.setAttribute("width", "100%");
            this.horizon.setAttribute("height", "100%");
            this.horizon.setAttribute("viewBox", "-200 -200 400 300");
            this.horizon.setAttribute("x", "-100");
            this.horizon.setAttribute("y", "-100");
            this.horizon.setAttribute("overflow", "visible");
            this.horizon.setAttribute("style", "position:absolute; z-index: -2; width: 100%; height:100%;");
            this.appendChild(this.horizon);
            this.horizonTop = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonTop.setAttribute("fill", (this.backgroundVisible) ? this.horizonTopColor : "transparent");
            this.horizonTop.setAttribute("x", "-1000");
            this.horizonTop.setAttribute("y", "-1000");
            this.horizonTop.setAttribute("width", "2000");
            this.horizonTop.setAttribute("height", "2000");
            this.horizon.appendChild(this.horizonTop);
            this.bottomPart = document.createElementNS(Avionics.SVG.NS, "g");
            this.horizon.appendChild(this.bottomPart);
            this.horizonBottom = document.createElementNS(Avionics.SVG.NS, "rect");
            this.horizonBottom.setAttribute("fill", (this.backgroundVisible) ? this.horizonBottomColor : "transparent");
            this.horizonBottom.setAttribute("x", "-1500");
            this.horizonBottom.setAttribute("y", "0");
            this.horizonBottom.setAttribute("width", "3000");
            this.horizonBottom.setAttribute("height", "3000");
            this.bottomPart.appendChild(this.horizonBottom);
            let separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "-3");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "6");
            this.bottomPart.appendChild(separator);
        }
        let attitudeContainer = document.createElement("div");
        attitudeContainer.setAttribute("id", "Attitude");
        attitudeContainer.style.width = "100%";
        attitudeContainer.style.height = "100%";
        attitudeContainer.style.position = "absolute";
        this.appendChild(attitudeContainer);
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-200 -200 400 300");
        this.root.setAttribute("overflow", "visible");
        this.root.setAttribute("style", "position:absolute");
        attitudeContainer.appendChild(this.root);
        var refHeight = (this.isBackup) ? 330 : 230;
        let attitude_pitch_container = document.createElementNS(Avionics.SVG.NS, "svg");
        attitude_pitch_container.setAttribute("width", "230");
        attitude_pitch_container.setAttribute("height", refHeight.toString());
        attitude_pitch_container.setAttribute("x", "-115");
        attitude_pitch_container.setAttribute("y", "-130");
        attitude_pitch_container.setAttribute("viewBox", "-115 -130 230 " + refHeight.toString());
        attitude_pitch_container.setAttribute("overflow", "hidden");
        this.root.appendChild(attitude_pitch_container);
        this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
        attitude_pitch_container.appendChild(this.attitude_pitch);
        this.buildGraduations();
        this.flightDirector = document.createElementNS(Avionics.SVG.NS, "g");
        attitude_pitch_container.appendChild(this.flightDirector);
        let triangleOuterLeft = document.createElementNS(Avionics.SVG.NS, "path");
        triangleOuterLeft.setAttribute("d", "M-140 30 l50 0 L0 0 Z");
        triangleOuterLeft.setAttribute("fill", "#d12bc7");
        this.flightDirector.appendChild(triangleOuterLeft);
        let triangleOuterRight = document.createElementNS(Avionics.SVG.NS, "path");
        triangleOuterRight.setAttribute("d", "M140 30 l-50 0 L0 0 Z");
        triangleOuterRight.setAttribute("fill", "#d12bc7");
        this.flightDirector.appendChild(triangleOuterRight);
        {
            this.attitude_bank = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.attitude_bank);
            let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
            topTriangle.setAttribute("d", "M0 -170 l-20 -30 l40 0 Z");
            topTriangle.setAttribute("fill", "white");
            this.attitude_bank.appendChild(topTriangle);
            let bigDashes = [-60, -30, 30, 60];
            let smallDashes = [-45, -20, -10, 10, 20, 45];
            let radius = 170;
            let width = 4;
            let height = 30;
            for (let i = 0; i < bigDashes.length; i++) {
                let dash = document.createElementNS(Avionics.SVG.NS, "rect");
                dash.setAttribute("x", (-width / 2).toString());
                dash.setAttribute("y", (-radius - height).toString());
                dash.setAttribute("height", height.toString());
                dash.setAttribute("width", width.toString());
                dash.setAttribute("fill", "white");
                dash.setAttribute("transform", "rotate(" + bigDashes[i] + ",0,0)");
                this.attitude_bank.appendChild(dash);
            }
            width = 4;
            height = 20;
            for (let i = 0; i < smallDashes.length; i++) {
                let dash = document.createElementNS(Avionics.SVG.NS, "rect");
                dash.setAttribute("x", (-width / 2).toString());
                dash.setAttribute("y", (-radius - height).toString());
                dash.setAttribute("height", height.toString());
                dash.setAttribute("width", width.toString());
                dash.setAttribute("fill", "white");
                dash.setAttribute("transform", "rotate(" + smallDashes[i] + ",0,0)");
                this.attitude_bank.appendChild(dash);
            }
        }
        {
            let cursors = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(cursors);
            let leftLower = document.createElementNS(Avionics.SVG.NS, "path");
            leftLower.setAttribute("d", "M-190 0 l-10 12 l50 0 l10 -12 Z");
            leftLower.setAttribute("fill", "#cccc00");
            cursors.appendChild(leftLower);
            let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
            leftUpper.setAttribute("d", "M-190 0 l-10 -12 l50 0 l10 12 Z");
            leftUpper.setAttribute("fill", "#ffff00");
            cursors.appendChild(leftUpper);
            let rightLower = document.createElementNS(Avionics.SVG.NS, "path");
            rightLower.setAttribute("d", "M190 0 l10 12 l-50 0 l-10 -12 Z");
            rightLower.setAttribute("fill", "#cccc00");
            cursors.appendChild(rightLower);
            let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
            rightUpper.setAttribute("d", "M190 0 l10 -12 l-50 0 l-10 12 Z");
            rightUpper.setAttribute("fill", "#ffff00");
            cursors.appendChild(rightUpper);
            let triangleInnerLeft = document.createElementNS(Avionics.SVG.NS, "path");
            triangleInnerLeft.setAttribute("d", "M-90 30 l30 0 L0 0 Z");
            triangleInnerLeft.setAttribute("fill", "#ffff00");
            cursors.appendChild(triangleInnerLeft);
            let triangleInnerRight = document.createElementNS(Avionics.SVG.NS, "path");
            triangleInnerRight.setAttribute("d", "M90 30 l-30 0 L0 0 Z");
            triangleInnerRight.setAttribute("fill", "#ffff00");
            cursors.appendChild(triangleInnerRight);
            let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
            topTriangle.setAttribute("d", "M0 -170 l-13 20 l26 0 Z");
            topTriangle.setAttribute("fill", "white");
            this.root.appendChild(topTriangle);
            this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
            this.slipSkid.setAttribute("d", "M-20 -140 L-16 -146 L16 -146 L20 -140 Z");
            this.slipSkid.setAttribute("fill", "white");
            this.root.appendChild(this.slipSkid);
        }
        this.applyAttributes();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "is-backup":
                this.isBackup = newValue == "true";
                break;
            case "aspect-ratio":
                this.aspectRatio = parseFloat(newValue);
                this.construct();
                break;
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
                if (newValue == "false")
                    this.backgroundVisible = false;
                else
                    this.backgroundVisible = true;
                break;
            case "flight_director-active":
                this.flightDirectorActive = newValue == "true";
                break;
            case "flight_director-pitch":
                this.flightDirectorPitch = parseFloat(newValue);
                break;
            case "flight_director-bank":
                this.flightDirectorBank = parseFloat(newValue);
                break;
            case "bank_size_ratio":
                this.bankSizeRatio = parseFloat(newValue);
                this.buildGraduations();
                break;
            default:
                return;
        }
        this.applyAttributes();
    }
    applyAttributes() {
        if (this.bottomPart)
            this.bottomPart.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
        if (this.attitude_pitch)
            this.attitude_pitch.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (this.pitch * this.bankSizeRatio) + ")");
        if (this.attitude_bank)
            this.attitude_bank.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.slipSkid)
            this.slipSkid.setAttribute("transform", "translate(" + (this.slipSkidValue * 40) + ", 0)");
        if (this.horizonTop) {
            if (this.backgroundVisible) {
                this.horizonTop.setAttribute("fill", this.horizonTopColor);
                this.horizonBottom.setAttribute("fill", this.horizonBottomColor);
            }
            else {
                this.horizonTop.setAttribute("fill", "transparent");
                this.horizonBottom.setAttribute("fill", "transparent");
            }
        }
        if (this.flightDirector) {
            if (this.flightDirectorActive) {
                this.flightDirector.setAttribute("transform", "rotate(" + (this.bank - this.flightDirectorBank) + ") translate(0 " + ((this.pitch - this.flightDirectorPitch) * this.bankSizeRatio) + ")");
                this.flightDirector.setAttribute("display", "");
            }
            else {
                this.flightDirector.setAttribute("display", "none");
            }
        }
    }
}
customElements.define('glasscockpit-attitude-indicator', AttitudeIndicator);
//# sourceMappingURL=AttitudeIndicator.js.map