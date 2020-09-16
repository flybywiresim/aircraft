class Jet_PFD_AttitudeIndicator extends HTMLElement {
    constructor() {
        super();
        this.backgroundVisible = true;
        this.radioAltitudeColorOk = "white";
        this.radioAltitudeColorBad = "white";
        this.radioAltitudeColorLimit = 0;
        this.radioAltitudeRotate = false;
        this.cj4_FlightDirectorActive = true;
        this.cj4_FlightDirectorPitch = 0;
        this.cj4_FlightDirectorBank = 0;
        this.pitchGradFactor = 1.0;
        this.pitchAngleFactor = 1.0;
        this._aircraft = Aircraft.A320_NEO;
    }
    static get dynamicAttributes() {
        return [
            "pitch",
            "bank",
            "slip_skid",
            "flight_director-active",
            "flight_director-pitch",
            "flight_director-bank",
            "radio_altitude",
            "decision_height"
        ];
    }
    static get observedAttributes() {
        return this.dynamicAttributes.concat([
            "background",
        ]);
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
    showFPV(_active) {
    }
    destroyLayout() {
        Utils.RemoveAllChildren(this);
        for (let i = 0; i < Jet_PFD_AttitudeIndicator.dynamicAttributes.length; i++) {
            this.removeAttribute(Jet_PFD_AttitudeIndicator.dynamicAttributes[i]);
        }
        this.pitchGradFactor = 1.0;
        this.pitchAngleFactor = 1.0;
        this.radioAltitudeRotate = false;
        this.radioAltitudeColorLimit = 0;
    }
    construct() {
        this.destroyLayout();
        if (this.aircraft == Aircraft.CJ4)
            this.construct_CJ4();
        else if (this.aircraft == Aircraft.B747_8)
            this.construct_B747_8();
        else if (this.aircraft == Aircraft.AS01B)
            this.construct_AS01B();
        else
            this.construct_A320_Neo();
    }
    construct_A320_Neo() {
        let pitchFactor = -7;
        this.pitchAngleFactor = pitchFactor;
        this.pitchGradFactor = 1.0;
        this.horizonHeight = 300;
        this.attitudeHeight = 250;
        this.horizonToAttitudeRatio = this.attitudeHeight / this.horizonHeight;

        {
            this.horizon_root = document.createElementNS(Avionics.SVG.NS, "svg");
            this.horizon_root.setAttribute("width", "100%");
            this.horizon_root.setAttribute("height", "100%");
            this.horizon_root.setAttribute("viewBox", "-200 -200 400 300");
            this.horizon_root.setAttribute("x", "-100");
            this.horizon_root.setAttribute("y", "-100");
            this.horizon_root.setAttribute("overflow", "visible");
            this.horizon_root.setAttribute("style", "position:absolute; z-index: -3;");
            this.horizon_root.setAttribute("transform", "translate(0, 100)");
            this.appendChild(this.horizon_root);
            this.horizonTopColor = "#19A0E0";//"#5384EC";
            this.horizonBottomColor = "#8B3D18"//"#612C27";
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
            let separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "0");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "3");
            this.bottomPart.appendChild(separator);
        }
        {
            let pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-12%";
            pitchContainer.style.left = "-10%";
            pitchContainer.style.width = "120%";
            pitchContainer.style.height = "120%";
            pitchContainer.style.position = "absolute";
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
                let borders = document.createElementNS(Avionics.SVG.NS, "rect");
                borders.setAttribute("x", "-200");
                borders.setAttribute("y", "-125");
                borders.setAttribute("width", "400");
                borders.setAttribute("height", "250");
                borders.setAttribute("fill", "transparent");
                borders.setAttribute("stroke", "white");
                borders.setAttribute("stroke-width", "3");
                borders.setAttribute("stroke-opacity", "1");
                this.pitch_root_group.appendChild(borders);
                var x = -115;
                var y = -(this.attitudeHeight / 2);
                var w = 230;
                var h = this.attitudeHeight;
                let attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
                attitudePitchContainer.setAttribute("width", w.toString());
                attitudePitchContainer.setAttribute("height", h.toString());
                attitudePitchContainer.setAttribute("x", x.toString());
                attitudePitchContainer.setAttribute("y", y.toString());
                attitudePitchContainer.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
                attitudePitchContainer.setAttribute("overflow", "hidden");
                this.pitch_root_group.appendChild(attitudePitchContainer);
                this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
                attitudePitchContainer.appendChild(this.attitude_pitch);
                let maxDash = 80;
                let fullPrecisionLowerLimit = -20;
                let fullPrecisionUpperLimit = 20;
                let halfPrecisionLowerLimit = -30;
                let halfPrecisionUpperLimit = 45;
                let unusualAttitudeLowerLimit = -30;
                let unusualAttitudeUpperLimit = 50;
                let bigWidth = 120;
                let bigHeight = 3;
                let mediumWidth = 45;
                let mediumHeight = 3;
                let smallWidth = 20;
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
                            text = false;
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
                        rect.setAttribute("y", (pitchFactor * angle - height / 2).toString());
                        rect.setAttribute("width", width.toString());
                        rect.setAttribute("height", height.toString());
                        this.attitude_pitch.appendChild(rect);
                        if (text) {
                            let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                            leftText.textContent = Math.abs(angle).toString();
                            leftText.setAttribute("x", ((-width / 2) - 5).toString());
                            leftText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                            leftText.setAttribute("text-anchor", "end");
                            leftText.setAttribute("font-size", fontSize.toString());
                            leftText.setAttribute("font-family", "Roboto-Light");
                            leftText.setAttribute("fill", "white");
                            this.attitude_pitch.appendChild(leftText);
                            let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                            rightText.textContent = Math.abs(angle).toString();
                            rightText.setAttribute("x", ((width / 2) + 5).toString());
                            rightText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                            rightText.setAttribute("text-anchor", "start");
                            rightText.setAttribute("font-size", fontSize.toString());
                            rightText.setAttribute("font-family", "Roboto-Light");
                            rightText.setAttribute("fill", "white");
                            this.attitude_pitch.appendChild(rightText);
                        }
                        if (angle < unusualAttitudeLowerLimit) {
                            let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                            let path = "M" + -smallWidth / 2 + " " + (pitchFactor * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                            path += "L" + bigWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                            path += "L0 " + (pitchFactor * nextAngle + 20) + " ";
                            path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                            chevron.setAttribute("d", path);
                            chevron.setAttribute("fill", "red");
                            this.attitude_pitch.appendChild(chevron);
                        }
                        if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                            let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                            let path = "M" + -smallWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                            path += "L" + (bigWidth / 2) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                            path += "L0 " + (pitchFactor * angle - 20) + " ";
                            path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                            chevron.setAttribute("d", path);
                            chevron.setAttribute("fill", "red");
                            this.attitude_pitch.appendChild(chevron);
                        }
                    }
                    angle = nextAngle;
                }
            }
        }
        {
            this.masks = document.createElementNS(Avionics.SVG.NS, "svg");
            this.masks.setAttribute("id", "Masks");
            this.masks.setAttribute("viewBox", "0 0 500 500");
            this.masks.setAttribute("overflow", "visible");
            this.masks.setAttribute("style", "position:absolute; z-index: -1; top:-58%; left: -68.3%; width: 250%; height:250%;");
            this.appendChild(this.masks);
            {
                let topMask = document.createElementNS(Avionics.SVG.NS, "path");
                topMask.setAttribute("d", "M 0 0 L 0 250 L 123 250 L 123 190 C 123 190, 143 120, 233 120 C 233 120, 323 120, 343 190 L 343 250 L 500 250 L 500 0 Z");
                topMask.setAttribute("fill", "black");
                this.masks.appendChild(topMask);
                let bottomMask = document.createElementNS(Avionics.SVG.NS, "path");
                bottomMask.setAttribute("d", "M 0 500 L 0 250 L 123 250 L 123 310 C 123 310, 143 380, 233 380 C 233 380, 323 380, 343 310 L 343 250 L 500 250 L 500 500 Z");
                bottomMask.setAttribute("fill", "black");
                this.masks.appendChild(bottomMask);
            }
        }
        {
            let attitudeContainer = document.createElement("div");
            attitudeContainer.setAttribute("id", "Attitude");
            attitudeContainer.style.top = "-12%";
            attitudeContainer.style.left = "-10%";
            attitudeContainer.style.width = "120%";
            attitudeContainer.style.height = "120%";
            attitudeContainer.style.position = "absolute";
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
                let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                topTriangle.setAttribute("d", "M0 -180 l-10 -18 l20 0 Z");
                topTriangle.setAttribute("fill", "transparent");
                topTriangle.setAttribute("stroke", "yellow");
                topTriangle.setAttribute("stroke-width", "3");
                topTriangle.setAttribute("stroke-opacity", "1");
                this.attitude_bank.appendChild(topTriangle);
                let smallDashesAngle = [-45, -30, -20, -10, 10, 20, 30, 45];
                let smallDashesWidth = [1, 6, 6, 6, 6, 6, 6, 1];
                let smallDashesHeight = [13, 13, 8, 8, 8, 8, 13, 13];
                let radius = 180;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    let dash = document.createElementNS(Avionics.SVG.NS, "rect");
                    dash.setAttribute("x", (-smallDashesWidth[i] / 2).toString());
                    dash.setAttribute("y", (-radius - smallDashesHeight[i]).toString());
                    dash.setAttribute("height", smallDashesHeight[i].toString());
                    dash.setAttribute("width", smallDashesWidth[i].toString());
                    dash.setAttribute("stroke", "white");
                    dash.setAttribute("stroke-width", "3");
                    dash.setAttribute("transform", "rotate(" + smallDashesAngle[i] + ",0,0)");
                    this.attitude_bank.appendChild(dash);
                }
            }
            {
                let cursors = document.createElementNS(Avionics.SVG.NS, "g");
                {
                    let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
                    leftUpper.setAttribute("d", "M-145 4 l0 -6 l55 0 l0 28 l-5 0 l0 -22 l-40 0 Z");
                    leftUpper.setAttribute("fill", "black");
                    leftUpper.setAttribute("stroke", "yellow");
                    leftUpper.setAttribute("stroke-width", "1");
                    leftUpper.setAttribute("stroke-opacity", "1.0");
                    cursors.appendChild(leftUpper);
                    let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
                    rightUpper.setAttribute("d", "M140 4 l0 -6 l-55 0 l0 28 l5 0 l0 -22 l40 0 Z");
                    rightUpper.setAttribute("fill", "black");
                    rightUpper.setAttribute("stroke", "yellow");
                    rightUpper.setAttribute("stroke-width", "1");
                    rightUpper.setAttribute("stroke-opacity", "1.0");
                    cursors.appendChild(rightUpper);
                    let centerRect = document.createElementNS(Avionics.SVG.NS, "rect");
                    centerRect.setAttribute("x", "-4");
                    centerRect.setAttribute("y", "-4");
                    centerRect.setAttribute("height", "8");
                    centerRect.setAttribute("width", "8");
                    centerRect.setAttribute("stroke", "white");
                    centerRect.setAttribute("stroke-width", "3");
                    cursors.appendChild(centerRect);
                }
                this.attitude_root.appendChild(cursors);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -170 l-13 20 l26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-20 -140 L-16 -146 L16 -146 L20 -140 Z");
                this.slipSkid.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkid);
            }
            {
                this.radioAltitudeGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.radioAltitudeGroup.setAttribute("id", "RadioAltitude");
                this.attitude_root.appendChild(this.radioAltitudeGroup);
                this.radioAltitudeColorOk = "rgb(36,255,0)";
                this.radioAltitudeColorBad = "orange";
                this.radioAltitudeColorLimit = 400;
                this.radioAltitudeRotate = true;
                this.radioAltitude = document.createElementNS(Avionics.SVG.NS, "text");
                this.radioAltitude.textContent = "";
                this.radioAltitude.setAttribute("x", "0");
                this.radioAltitude.setAttribute("y", "165");
                this.radioAltitude.setAttribute("text-anchor", "middle");
                this.radioAltitude.setAttribute("font-size", "30");
                this.radioAltitude.setAttribute("font-family", "Roboto-Bold");
                this.radioAltitude.setAttribute("fill", "white");
                this.radioAltitudeGroup.appendChild(this.radioAltitude);
            }
        }
        this.flightDirector = new Jet_PFD_FlightDirector.A320_Neo_Handler();
        this.flightDirector.init(this.attitude_root);
        this.applyAttributes();
    }
    construct_B747_8() {
        let pitchFactor = -6.5;
        this.pitchAngleFactor = pitchFactor;
        this.pitchGradFactor = 1.0;
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
            this.horizonTopColor = "#135B82";
            this.horizonBottomColor = "#726B31";
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
            let separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "-3");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "6");
            this.bottomPart.appendChild(separator);
        }
        {
            let pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-14%";
            pitchContainer.style.left = "-10%";
            pitchContainer.style.width = "120%";
            pitchContainer.style.height = "120%";
            pitchContainer.style.position = "absolute";
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
                var x = -115;
                var y = -120;
                var w = 230;
                var h = 265;
                let attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
                attitudePitchContainer.setAttribute("width", w.toString());
                attitudePitchContainer.setAttribute("height", h.toString());
                attitudePitchContainer.setAttribute("x", x.toString());
                attitudePitchContainer.setAttribute("y", y.toString());
                attitudePitchContainer.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
                attitudePitchContainer.setAttribute("overflow", "hidden");
                this.pitch_root_group.appendChild(attitudePitchContainer);
                this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
                attitudePitchContainer.appendChild(this.attitude_pitch);
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
                            text = false;
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
                        rect.setAttribute("y", (pitchFactor * angle - height / 2).toString());
                        rect.setAttribute("width", width.toString());
                        rect.setAttribute("height", height.toString());
                        this.attitude_pitch.appendChild(rect);
                        if (text) {
                            let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                            leftText.textContent = Math.abs(angle).toString();
                            leftText.setAttribute("x", ((-width / 2) - 5).toString());
                            leftText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                            leftText.setAttribute("text-anchor", "end");
                            leftText.setAttribute("font-size", fontSize.toString());
                            leftText.setAttribute("font-family", "Roboto-Light");
                            leftText.setAttribute("fill", "white");
                            this.attitude_pitch.appendChild(leftText);
                            let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                            rightText.textContent = Math.abs(angle).toString();
                            rightText.setAttribute("x", ((width / 2) + 5).toString());
                            rightText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                            rightText.setAttribute("text-anchor", "start");
                            rightText.setAttribute("font-size", fontSize.toString());
                            rightText.setAttribute("font-family", "Roboto-Light");
                            rightText.setAttribute("fill", "white");
                            this.attitude_pitch.appendChild(rightText);
                        }
                        if (angle < unusualAttitudeLowerLimit) {
                            let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                            let path = "M" + -smallWidth / 2 + " " + (pitchFactor * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                            path += "L" + bigWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                            path += "L0 " + (pitchFactor * nextAngle + 20) + " ";
                            path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                            chevron.setAttribute("d", path);
                            chevron.setAttribute("fill", "red");
                            this.attitude_pitch.appendChild(chevron);
                        }
                        if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                            let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                            let path = "M" + -smallWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                            path += "L" + (bigWidth / 2) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                            path += "L0 " + (pitchFactor * angle - 20) + " ";
                            path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                            chevron.setAttribute("d", path);
                            chevron.setAttribute("fill", "red");
                            this.attitude_pitch.appendChild(chevron);
                        }
                    }
                    angle = nextAngle;
                }
            }
        }
        {
            this.masks = document.createElementNS(Avionics.SVG.NS, "svg");
            this.masks.setAttribute("id", "Masks");
            this.masks.setAttribute("viewBox", "0 0 500 500");
            this.masks.setAttribute("overflow", "visible");
            this.masks.setAttribute("style", "position:absolute; z-index: -1; top:-61%; left: -68.3%; width: 250%; height:250%;");
            this.appendChild(this.masks);
            {
                let topMask = document.createElementNS(Avionics.SVG.NS, "path");
                topMask.setAttribute("d", "M 0 0 L 0 250 L 123 250 L 123 142 C 123 142, 125 122, 143 122 L 233 122 L 315 122 C 315 122, 343 122, 345 142 L 345 250 L 500 250 L 500 0 Z");
                topMask.setAttribute("fill", "black");
                this.masks.appendChild(topMask);
                let bottomMask = document.createElementNS(Avionics.SVG.NS, "path");
                bottomMask.setAttribute("d", "M 0 500 L 0 250 L 123 250 L 123 358 C 123 358, 125 378, 143 378 L 233 378 L 315 378 C 315 378, 343 378, 345 358 L 345 250 L 500 250 L 500 500 Z");
                bottomMask.setAttribute("fill", "black");
                this.masks.appendChild(bottomMask);
            }
        }
        {
            let attitudeContainer = document.createElement("div");
            attitudeContainer.setAttribute("id", "Attitude");
            attitudeContainer.style.top = "-14%";
            attitudeContainer.style.left = "-10%";
            attitudeContainer.style.width = "120%";
            attitudeContainer.style.height = "120%";
            attitudeContainer.style.position = "absolute";
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
                let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                topTriangle.setAttribute("d", "M0 -152 l-8 -12 l16 0 Z");
                topTriangle.setAttribute("fill", "white");
                this.attitude_bank.appendChild(topTriangle);
                let smallDashesAngle = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];
                let smallDashesHeight = [26, 13, 26, 13, 13, 13, 13, 26, 13, 26];
                let radius = 131;
                let offsetY = 22;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    let dash = document.createElementNS(Avionics.SVG.NS, "line");
                    dash.setAttribute("x1", "0");
                    dash.setAttribute("y1", (-radius - offsetY).toString());
                    dash.setAttribute("x2", "0");
                    dash.setAttribute("y2", (-radius - smallDashesHeight[i] - offsetY).toString());
                    dash.setAttribute("stroke", "white");
                    dash.setAttribute("stroke-width", "3");
                    dash.setAttribute("transform", "rotate(" + smallDashesAngle[i] + " 0 " + (-offsetY).toString() + ")");
                    this.attitude_bank.appendChild(dash);
                }
            }
            {
                let cursors = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(cursors);
                let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
                leftUpper.setAttribute("d", "M-110 6 l0 -6 l55 0 l0 28 l-5 0 l0 -22 l-40 0 Z");
                leftUpper.setAttribute("fill", "black");
                leftUpper.setAttribute("stroke", "white");
                leftUpper.setAttribute("stroke-width", "1");
                leftUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(leftUpper);
                let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
                rightUpper.setAttribute("d", "M110 6 l0 -6 l-55 0 l0 28 l5 0 l0 -22 l40 0 Z");
                rightUpper.setAttribute("fill", "black");
                rightUpper.setAttribute("stroke", "white");
                rightUpper.setAttribute("stroke-width", "1");
                rightUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(rightUpper);
                let centerRect = document.createElementNS(Avionics.SVG.NS, "rect");
                centerRect.setAttribute("x", "-4");
                centerRect.setAttribute("y", "0");
                centerRect.setAttribute("height", "8");
                centerRect.setAttribute("width", "8");
                centerRect.setAttribute("fill", "white");
                cursors.appendChild(centerRect);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -149 l-13 18 l26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "transparent");
                this.slipSkidTriangle.setAttribute("stroke", "white");
                this.slipSkidTriangle.setAttribute("stroke-width", "1.5");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-14 -122 L-14 -128 L14 -128 L14 -122 Z");
                this.slipSkid.setAttribute("fill", "transparent");
                this.slipSkid.setAttribute("stroke", "white");
                this.slipSkid.setAttribute("stroke-width", "1.5");
                this.attitude_root.appendChild(this.slipSkid);
            }
            {
                this.radioAltitudeGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.radioAltitudeGroup.setAttribute("id", "RadioAltitude");
                this.attitude_root.appendChild(this.radioAltitudeGroup);
                let decisionHeightTitle = document.createElementNS(Avionics.SVG.NS, "text");
                decisionHeightTitle.textContent = "RADIO";
                decisionHeightTitle.setAttribute("x", "140");
                decisionHeightTitle.setAttribute("y", "-208");
                decisionHeightTitle.setAttribute("text-anchor", "end");
                decisionHeightTitle.setAttribute("font-size", "14");
                decisionHeightTitle.setAttribute("font-family", "Roboto-Bold");
                decisionHeightTitle.setAttribute("fill", "lime");
                this.radioAltitudeGroup.appendChild(decisionHeightTitle);
                this.radioDecisionHeight = document.createElementNS(Avionics.SVG.NS, "text");
                this.radioDecisionHeight.textContent = "";
                this.radioDecisionHeight.setAttribute("x", "140");
                this.radioDecisionHeight.setAttribute("y", "-192");
                this.radioDecisionHeight.setAttribute("text-anchor", "end");
                this.radioDecisionHeight.setAttribute("font-size", "14");
                this.radioDecisionHeight.setAttribute("font-family", "Roboto-Bold");
                this.radioDecisionHeight.setAttribute("fill", "lime");
                this.radioAltitudeGroup.appendChild(this.radioDecisionHeight);
                this.radioAltitude = document.createElementNS(Avionics.SVG.NS, "text");
                this.radioAltitude.textContent = "";
                this.radioAltitude.setAttribute("x", "140");
                this.radioAltitude.setAttribute("y", "-172");
                this.radioAltitude.setAttribute("text-anchor", "end");
                this.radioAltitude.setAttribute("font-size", "18");
                this.radioAltitude.setAttribute("font-family", "Roboto-Bold");
                this.radioAltitude.setAttribute("fill", "white");
                this.radioAltitudeGroup.appendChild(this.radioAltitude);
            }
        }
        this.flightDirector = new Jet_PFD_FlightDirector.B747_8_Handler();
        this.flightDirector.init(this.attitude_root);
        this.applyAttributes();
    }
    construct_AS01B() {
        let pitchFactor = -6.5;
        this.pitchAngleFactor = pitchFactor;
        this.pitchGradFactor = 1.0;
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
            this.horizonTopColor = "#0B3B82";
            this.horizonBottomColor = "#4F371E";
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
            let separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "-3");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "6");
            this.bottomPart.appendChild(separator);
        }
        {
            let pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-14%";
            pitchContainer.style.left = "-10%";
            pitchContainer.style.width = "120%";
            pitchContainer.style.height = "120%";
            pitchContainer.style.position = "absolute";
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
                var x = -115;
                var y = -120;
                var w = 230;
                var h = 280;
                let attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
                attitudePitchContainer.setAttribute("width", w.toString());
                attitudePitchContainer.setAttribute("height", h.toString());
                attitudePitchContainer.setAttribute("x", x.toString());
                attitudePitchContainer.setAttribute("y", y.toString());
                attitudePitchContainer.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
                attitudePitchContainer.setAttribute("overflow", "hidden");
                this.pitch_root_group.appendChild(attitudePitchContainer);
                this.attitude_pitch = document.createElementNS(Avionics.SVG.NS, "g");
                attitudePitchContainer.appendChild(this.attitude_pitch);
                let maxDash = 80;
                let fullPrecisionLowerLimit = -25;
                let fullPrecisionUpperLimit = 25;
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
                            text = false;
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
                        rect.setAttribute("y", (pitchFactor * angle - height / 2).toString());
                        rect.setAttribute("width", width.toString());
                        rect.setAttribute("height", height.toString());
                        this.attitude_pitch.appendChild(rect);
                        if (text) {
                            let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                            leftText.textContent = Math.abs(angle).toString();
                            leftText.setAttribute("x", ((-width / 2) - 5).toString());
                            leftText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                            leftText.setAttribute("text-anchor", "end");
                            leftText.setAttribute("font-size", fontSize.toString());
                            leftText.setAttribute("font-family", "Roboto-Light");
                            leftText.setAttribute("fill", "white");
                            this.attitude_pitch.appendChild(leftText);
                            let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                            rightText.textContent = Math.abs(angle).toString();
                            rightText.setAttribute("x", ((width / 2) + 5).toString());
                            rightText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                            rightText.setAttribute("text-anchor", "start");
                            rightText.setAttribute("font-size", fontSize.toString());
                            rightText.setAttribute("font-family", "Roboto-Light");
                            rightText.setAttribute("fill", "white");
                            this.attitude_pitch.appendChild(rightText);
                        }
                        if (angle < unusualAttitudeLowerLimit) {
                            let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                            let path = "M" + -smallWidth / 2 + " " + (pitchFactor * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                            path += "L" + bigWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                            path += "L0 " + (pitchFactor * nextAngle + 20) + " ";
                            path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                            chevron.setAttribute("d", path);
                            chevron.setAttribute("fill", "red");
                            this.attitude_pitch.appendChild(chevron);
                        }
                        if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                            let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                            let path = "M" + -smallWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                            path += "L" + (bigWidth / 2) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                            path += "L0 " + (pitchFactor * angle - 20) + " ";
                            path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                            chevron.setAttribute("d", path);
                            chevron.setAttribute("fill", "red");
                            this.attitude_pitch.appendChild(chevron);
                        }
                    }
                    angle = nextAngle;
                }
            }
        }
        this.masks = document.createElementNS(Avionics.SVG.NS, "svg");
        this.masks.setAttribute("id", "Masks");
        this.masks.setAttribute("viewBox", "0 0 500 500");
        this.masks.setAttribute("overflow", "visible");
        this.masks.setAttribute("style", "position:absolute; z-index: -1; top:-61%; left: -68.3%; width: 250%; height:250%;");
        this.appendChild(this.masks);
        {
            let topMask = document.createElementNS(Avionics.SVG.NS, "path");
            topMask.setAttribute("d", "M 0 0 L 0 250 L 123 250 L 123 150 C 123 150, 125 130, 143 130 L 233 130 L 315 130 C 315 130, 343 130, 345 150 L 345 250 L 500 250 L 500 0 Z");
            topMask.setAttribute("fill", "black");
            this.masks.appendChild(topMask);
            let bottomMask = document.createElementNS(Avionics.SVG.NS, "path");
            bottomMask.setAttribute("d", "M 0 500 L 0 250 L 123 250 L 123 350 C 123 350, 125 370, 143 370 L 233 370 L 315 370 C 315 370, 343 370, 345 350 L 345 250 L 500 250 L 500 500 Z");
            bottomMask.setAttribute("fill", "black");
            this.masks.appendChild(bottomMask);
        }
        {
            let attitudeContainer = document.createElement("div");
            attitudeContainer.setAttribute("id", "Attitude");
            attitudeContainer.style.top = "-13%";
            attitudeContainer.style.left = "-10%";
            attitudeContainer.style.width = "120%";
            attitudeContainer.style.height = "120%";
            attitudeContainer.style.position = "absolute";
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
                let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                topTriangle.setAttribute("d", "M0 -152 l-8 -12 l16 0 Z");
                topTriangle.setAttribute("fill", "white");
                this.attitude_bank.appendChild(topTriangle);
                let smallDashesAngle = [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60];
                let smallDashesHeight = [26, 13, 26, 13, 13, 13, 13, 26, 13, 26];
                let radius = 150;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    let dash = document.createElementNS(Avionics.SVG.NS, "line");
                    dash.setAttribute("x1", "0");
                    dash.setAttribute("y1", (-radius).toString());
                    dash.setAttribute("x2", "0");
                    dash.setAttribute("y2", (-radius - smallDashesHeight[i]).toString());
                    dash.setAttribute("stroke", "white");
                    dash.setAttribute("stroke-width", "3");
                    dash.setAttribute("transform", "rotate(" + smallDashesAngle[i] + ",0,0)");
                    this.attitude_bank.appendChild(dash);
                }
            }
            {
                let cursors = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(cursors);
                let leftUpper = document.createElementNS(Avionics.SVG.NS, "path");
                leftUpper.setAttribute("d", "M-115 4 l0 -6 l55 0 l0 28 l-5 0 l0 -22 l-40 0 Z");
                leftUpper.setAttribute("fill", "black");
                leftUpper.setAttribute("stroke", "white");
                leftUpper.setAttribute("stroke-width", "1");
                leftUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(leftUpper);
                let rightUpper = document.createElementNS(Avionics.SVG.NS, "path");
                rightUpper.setAttribute("d", "M120 4 l0 -6 l-55 0 l0 28 l5 0 l0 -22 l40 0 Z");
                rightUpper.setAttribute("fill", "black");
                rightUpper.setAttribute("stroke", "white");
                rightUpper.setAttribute("stroke-width", "1");
                rightUpper.setAttribute("stroke-opacity", "1.0");
                cursors.appendChild(rightUpper);
                let centerRect = document.createElementNS(Avionics.SVG.NS, "rect");
                centerRect.setAttribute("x", "-4");
                centerRect.setAttribute("y", "-4");
                centerRect.setAttribute("height", "8");
                centerRect.setAttribute("width", "8");
                centerRect.setAttribute("fill", "white");
                cursors.appendChild(centerRect);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -149 l-13 18 l26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "transparent");
                this.slipSkidTriangle.setAttribute("stroke", "white");
                this.slipSkidTriangle.setAttribute("stroke-width", "1.5");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-14 -122 L-14 -128 L14 -128 L14 -122 Z");
                this.slipSkid.setAttribute("fill", "transparent");
                this.slipSkid.setAttribute("stroke", "white");
                this.slipSkid.setAttribute("stroke-width", "1.5");
                this.attitude_root.appendChild(this.slipSkid);
            }
            {
                this.radioAltitudeGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.radioAltitudeGroup.setAttribute("id", "RadioAltitude");
                this.attitude_root.appendChild(this.radioAltitudeGroup);
                let x = 0;
                let y = 225;
                let w = 70;
                let h = 38;
                let bg = document.createElementNS(Avionics.SVG.NS, "rect");
                bg.setAttribute("x", (x - w * 0.5).toString());
                bg.setAttribute("y", (y - h * 0.5).toString());
                bg.setAttribute("width", w.toString());
                bg.setAttribute("height", h.toString());
                bg.setAttribute("fill", "black");
                this.radioAltitudeGroup.appendChild(bg);
                this.radioAltitude = document.createElementNS(Avionics.SVG.NS, "text");
                this.radioAltitude.textContent = "";
                this.radioAltitude.setAttribute("x", x.toString());
                this.radioAltitude.setAttribute("y", y.toString());
                this.radioAltitude.setAttribute("text-anchor", "middle");
                this.radioAltitude.setAttribute("font-size", "32");
                this.radioAltitude.setAttribute("font-family", "Roboto-Bold");
                this.radioAltitude.setAttribute("fill", "white");
                this.radioAltitude.setAttribute("alignment-baseline", "central");
                this.radioAltitudeGroup.appendChild(this.radioAltitude);
            }
        }
        this.flightDirector = new Jet_PFD_FlightDirector.AS01B_Handler();
        this.flightDirector.init(this.attitude_root);
        this.applyAttributes();
    }
    construct_CJ4() {
        let pitchFactor = -7;
        this.pitchAngleFactor = -11.7;
        this.pitchGradFactor = 0.6;
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
            this.horizonTopColor = "#045CEB";
            this.horizonBottomColor = "#9E6345";
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
            let separator = document.createElementNS(Avionics.SVG.NS, "rect");
            separator.setAttribute("fill", "#e0e0e0");
            separator.setAttribute("x", "-1500");
            separator.setAttribute("y", "-3");
            separator.setAttribute("width", "3000");
            separator.setAttribute("height", "6");
            this.bottomPart.appendChild(separator);
        }
        {
            let pitchContainer = document.createElement("div");
            pitchContainer.setAttribute("id", "Pitch");
            pitchContainer.style.top = "-21%";
            pitchContainer.style.left = "-10%";
            pitchContainer.style.width = "120%";
            pitchContainer.style.height = "120%";
            pitchContainer.style.position = "absolute";
            pitchContainer.style.transform = "scale(1.4)";
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
                var x = -215;
                var y = -175;
                var w = 530;
                var h = 365;
                let attitudePitchContainer = document.createElementNS(Avionics.SVG.NS, "svg");
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
                    let maxDash = 80;
                    let fullPrecisionLowerLimit = -20;
                    let fullPrecisionUpperLimit = 20;
                    let halfPrecisionLowerLimit = -30;
                    let halfPrecisionUpperLimit = 45;
                    let unusualAttitudeLowerLimit = -30;
                    let unusualAttitudeUpperLimit = 50;
                    let bigWidth = 60;
                    let bigHeight = 3;
                    let mediumWidth = 32.5;
                    let mediumHeight = 3;
                    let smallWidth = 10;
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
                                text = false;
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
                            rect.setAttribute("y", (pitchFactor * angle - height / 2).toString());
                            rect.setAttribute("width", width.toString());
                            rect.setAttribute("height", height.toString());
                            this.attitude_pitch.appendChild(rect);
                            if (text) {
                                let leftText = document.createElementNS(Avionics.SVG.NS, "text");
                                leftText.textContent = Math.abs(angle).toString();
                                leftText.setAttribute("x", ((-width / 2) - 5).toString());
                                leftText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                                leftText.setAttribute("text-anchor", "end");
                                leftText.setAttribute("font-size", fontSize.toString());
                                leftText.setAttribute("font-family", "Roboto-Light");
                                leftText.setAttribute("fill", "white");
                                this.attitude_pitch.appendChild(leftText);
                                let rightText = document.createElementNS(Avionics.SVG.NS, "text");
                                rightText.textContent = Math.abs(angle).toString();
                                rightText.setAttribute("x", ((width / 2) + 5).toString());
                                rightText.setAttribute("y", (pitchFactor * angle - height / 2 + fontSize / 2).toString());
                                rightText.setAttribute("text-anchor", "start");
                                rightText.setAttribute("font-size", fontSize.toString());
                                rightText.setAttribute("font-family", "Roboto-Light");
                                rightText.setAttribute("fill", "white");
                                this.attitude_pitch.appendChild(rightText);
                            }
                            if (angle < unusualAttitudeLowerLimit) {
                                let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                                let path = "M" + -smallWidth / 2 + " " + (pitchFactor * nextAngle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                                path += "L" + bigWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 ";
                                path += "L0 " + (pitchFactor * nextAngle + 20) + " ";
                                path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * angle - bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                                chevron.setAttribute("d", path);
                                chevron.setAttribute("fill", "red");
                                this.attitude_pitch.appendChild(chevron);
                            }
                            if (angle >= unusualAttitudeUpperLimit && nextAngle <= maxDash) {
                                let chevron = document.createElementNS(Avionics.SVG.NS, "path");
                                let path = "M" + -smallWidth / 2 + " " + (pitchFactor * angle - bigHeight / 2) + " l" + smallWidth + "  0 ";
                                path += "L" + (bigWidth / 2) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 ";
                                path += "L0 " + (pitchFactor * angle - 20) + " ";
                                path += "L" + (-bigWidth / 2 + smallWidth) + " " + (pitchFactor * nextAngle + bigHeight / 2) + " l" + -smallWidth + " 0 Z";
                                chevron.setAttribute("d", path);
                                chevron.setAttribute("fill", "red");
                                this.attitude_pitch.appendChild(chevron);
                            }
                        }
                        angle = nextAngle;
                    }
                }
                {
                    this.cj4_FlightDirector = document.createElementNS(Avionics.SVG.NS, "g");
                    attitudePitchContainer.appendChild(this.cj4_FlightDirector);
                    let triangleOuterLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleOuterLeft.setAttribute("d", "M-110 23 l20 7 L0 0 Z");
                    triangleOuterLeft.setAttribute("fill", "#F8A2DE");
                    triangleOuterLeft.setAttribute("stroke", "black");
                    triangleOuterLeft.setAttribute("stroke-width", "0.5");
                    this.cj4_FlightDirector.appendChild(triangleOuterLeft);
                    let triangleBottomLeft = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleBottomLeft.setAttribute("d", "M-110 23 l20 7 l-20 7 Z");
                    triangleBottomLeft.setAttribute("fill", "#F8A2DE");
                    triangleBottomLeft.setAttribute("stroke", "black");
                    triangleBottomLeft.setAttribute("stroke-width", "0.5");
                    this.cj4_FlightDirector.appendChild(triangleBottomLeft);
                    let triangleOuterRight = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleOuterRight.setAttribute("d", "M110 23 l-20 7 L0 0 Z");
                    triangleOuterRight.setAttribute("fill", "#F8A2DE");
                    triangleOuterRight.setAttribute("stroke", "black");
                    triangleOuterRight.setAttribute("stroke-width", "0.5");
                    this.cj4_FlightDirector.appendChild(triangleOuterRight);
                    let triangleBottomRight = document.createElementNS(Avionics.SVG.NS, "path");
                    triangleBottomRight.setAttribute("d", "M110 23 l-20 7 l20 7 Z");
                    triangleBottomRight.setAttribute("fill", "#F8A2DE");
                    triangleBottomRight.setAttribute("stroke", "black");
                    triangleBottomRight.setAttribute("stroke-width", "0.5");
                    this.cj4_FlightDirector.appendChild(triangleBottomRight);
                }
            }
        }
        {
            let attitudeContainer = document.createElement("div");
            attitudeContainer.setAttribute("id", "Attitude");
            attitudeContainer.style.top = "-21%";
            attitudeContainer.style.left = "-10%";
            attitudeContainer.style.width = "120%";
            attitudeContainer.style.height = "120%";
            attitudeContainer.style.position = "absolute";
            attitudeContainer.style.transform = "scale(1.4)";
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
                let topTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                topTriangle.setAttribute("d", "M0 -180 l-7.5 -10 l15 0 Z");
                topTriangle.setAttribute("fill", "transparent");
                topTriangle.setAttribute("stroke", "white");
                topTriangle.setAttribute("stroke-width", "1");
                topTriangle.setAttribute("stroke-opacity", "1");
                this.attitude_bank.appendChild(topTriangle);
                let smallDashesAngle = [-60, -30, -20, -10, 10, 20, 30, 60];
                let smallDashesHeight = [18, 18, 11, 11, 11, 11, 18, 18];
                let radius = 178;
                for (let i = 0; i < smallDashesAngle.length; i++) {
                    let dash = document.createElementNS(Avionics.SVG.NS, "line");
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
                let leftTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                leftTriangle.setAttribute("d", "M0 -180 l-7.5 -10 l15 0 Z");
                leftTriangle.setAttribute("fill", "transparent");
                leftTriangle.setAttribute("stroke", "white");
                leftTriangle.setAttribute("stroke-width", "1");
                leftTriangle.setAttribute("stroke-opacity", "1");
                leftTriangle.setAttribute("transform", "rotate(45,0,0)");
                this.attitude_bank.appendChild(leftTriangle);
                let rightTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                rightTriangle.setAttribute("d", "M0 -180 l-7.5 -10 l15 0 Z");
                rightTriangle.setAttribute("fill", "transparent");
                rightTriangle.setAttribute("stroke", "white");
                rightTriangle.setAttribute("stroke-width", "1");
                rightTriangle.setAttribute("stroke-opacity", "1");
                rightTriangle.setAttribute("transform", "rotate(-45,0,0)");
                this.attitude_bank.appendChild(rightTriangle);
            }
            {
                let cursors = document.createElementNS(Avionics.SVG.NS, "g");
                this.attitude_root.appendChild(cursors);
                let leftUpper1 = document.createElementNS(Avionics.SVG.NS, "rect");
                leftUpper1.setAttribute("fill", "black");
                leftUpper1.setAttribute("stroke", "white");
                leftUpper1.setAttribute("stroke-width", "2");
                leftUpper1.setAttribute("x", "130");
                leftUpper1.setAttribute("y", "-4");
                leftUpper1.setAttribute("width", "32");
                leftUpper1.setAttribute("height", "9");
                cursors.appendChild(leftUpper1);
                let rightUpper1 = document.createElementNS(Avionics.SVG.NS, "rect");
                rightUpper1.setAttribute("fill", "black");
                rightUpper1.setAttribute("stroke", "white");
                rightUpper1.setAttribute("stroke-width", "2");
                rightUpper1.setAttribute("x", "-162");
                rightUpper1.setAttribute("y", "-4");
                rightUpper1.setAttribute("width", "32");
                rightUpper1.setAttribute("height", "9");
                cursors.appendChild(rightUpper1);
                let triangleInnerLeft = document.createElementNS(Avionics.SVG.NS, "path");
                triangleInnerLeft.setAttribute("d", "M-90 30 l30 0 L0 0 Z");
                triangleInnerLeft.setAttribute("fill", "#black");
                triangleInnerLeft.setAttribute("stroke", "white");
                triangleInnerLeft.setAttribute("stroke-width", "0.5");
                cursors.appendChild(triangleInnerLeft);
                let triangleInnerRight = document.createElementNS(Avionics.SVG.NS, "path");
                triangleInnerRight.setAttribute("d", "M90 30 l-30 0 L0 0 Z");
                triangleInnerRight.setAttribute("fill", "#black");
                triangleInnerRight.setAttribute("stroke", "white");
                triangleInnerRight.setAttribute("stroke-width", "0.5");
                cursors.appendChild(triangleInnerRight);
                this.slipSkidTriangle = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkidTriangle.setAttribute("d", "M0 -170 l-13 20 l26 0 Z");
                this.slipSkidTriangle.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkidTriangle);
                this.slipSkid = document.createElementNS(Avionics.SVG.NS, "path");
                this.slipSkid.setAttribute("d", "M-20 -140 L-16 -146 L16 -146 L20 -140 Z");
                this.slipSkid.setAttribute("fill", "white");
                this.attitude_root.appendChild(this.slipSkid);
            }
        }
        this.applyAttributes();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
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
                if (newValue == "false")
                    this.backgroundVisible = false;
                else
                    this.backgroundVisible = true;
                break;
            case "flight_director-active":
                this.cj4_FlightDirectorActive = newValue == "true";
                break;
            case "flight_director-pitch":
                this.cj4_FlightDirectorPitch = parseFloat(newValue);
                break;
            case "flight_director-bank":
                this.cj4_FlightDirectorBank = parseFloat(newValue);
                break;
            case "radio_altitude":
                if (this.radioAltitude) {
                    let val = parseFloat(newValue);
                    this.updateRadioAltitude(val);
                }
                break;
            case "decision_height":
                if (this.radioDecisionHeight) {
                    let val = parseFloat(newValue);
                    this.radioDecisionHeight.textContent = fastToFixed(val, 0);
                }
                break;
            default:
                return;
        }
        this.applyAttributes();
    }
    applyAttributes() {
        const deltaY = this.pitch * this.pitchAngleFactor * this.pitchGradFactor;

        if (this.bottomPart)
            this.bottomPart.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(0," + (deltaY) + ")");
        if (this.pitch_root_group)
            this.pitch_root_group.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.attitude_pitch)
            // The viewbox height for attitude is different from the horizon - multiply by ratio to keep horizon and pitch lines aligned
            this.attitude_pitch.setAttribute("transform", "translate(0," + (deltaY * this.horizonToAttitudeRatio) + ")");
        if (this.slipSkid)
            this.slipSkid.setAttribute("transform", "rotate(" + this.bank + ", 0, 0) translate(" + (this.slipSkidValue * 40) + ", 0)");
        if (this.slipSkidTriangle)
            this.slipSkidTriangle.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
        if (this.radioAltitude && this.radioAltitudeRotate)
            this.radioAltitude.setAttribute("transform", "rotate(" + this.bank + ", 0, 0)");
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
        if (this.cj4_FlightDirector != null) {
            if (this.cj4_FlightDirectorActive) {
                this.cj4_FlightDirector.setAttribute("transform", "rotate(" + (-this.cj4_FlightDirectorBank) + ") translate(0 " + ((this.pitch - this.cj4_FlightDirectorPitch) * this.pitchAngleFactor * this.pitchGradFactor) + ")");
                this.cj4_FlightDirector.setAttribute("display", "");
            }
            else {
                this.cj4_FlightDirector.setAttribute("display", "none");
            }
        }
    }
    update(_deltaTime) {
        if (this.flightDirector != null) {
            this.flightDirector.refresh(_deltaTime);
        }
    }
    updateRadioAltitude(_altitude) {
        var xyz = Simplane.getOrientationAxis();
        let val = Math.floor(_altitude);
        if ((val <= 2500) && (Math.abs(xyz.bank) < Math.PI * 0.35)) {
            let textVal;
            {
                let absVal = Math.abs(val);
                if (absVal <= 10)
                    textVal = absVal;
                else if (absVal <= 50)
                    textVal = absVal - (absVal % 5);
                else
                    textVal = absVal - (absVal % 10);
            }
            this.radioAltitude.textContent = (textVal * Math.sign(val)).toString();
            if (this.radioAltitudeColorLimit > 0) {
                if (val >= this.radioAltitudeColorLimit)
                    this.radioAltitude.setAttribute("fill", this.radioAltitudeColorOk);
                else
                    this.radioAltitude.setAttribute("fill", this.radioAltitudeColorBad);
            }
            this.radioAltitudeGroup.setAttribute("visibility", "visible");
        }
        else
            this.radioAltitudeGroup.setAttribute("visibility", "hidden");
    }
}
var Jet_PFD_FlightDirector;
(function (Jet_PFD_FlightDirector) {
    class DisplayBase {
        constructor(_root) {
            this.group = null;
            this.isActive = false;
            if (_root != null) {
                this.group = document.createElementNS(Avionics.SVG.NS, "g");
                this.group.setAttribute("id", this.getGroupName());
                this.group.setAttribute("display", "none");
                this.create();
                _root.appendChild(this.group);
            }
        }
        set active(_active) {
            if (_active != this.isActive) {
                this.isActive = _active;
                if (this.group != null) {
                    this.group.setAttribute("display", this.isActive ? "block" : "none");
                }
            }
        }
        get active() {
            return this.isActive;
        }
        calculatePosXFromBank(_startBank, _targetBank) {
            var bankDiff = _targetBank - _startBank;
            var angleDiff = Math.abs(bankDiff) % 360;
            if (angleDiff > 180) {
                angleDiff = 360 - angleDiff;
            }
            if (angleDiff > DisplayBase.HEADING_MAX_ANGLE) {
                angleDiff = DisplayBase.HEADING_MAX_ANGLE;
            }
            var sign = (((bankDiff >= 0) && (bankDiff <= 180)) || ((bankDiff <= -180) && (bankDiff >= -360))) ? -1 : 1;
            angleDiff *= sign;
            var x = angleDiff * DisplayBase.HEADING_ANGLE_TO_POS;
            return x;
        }
        calculatePosYFromPitch(_startPitch, _targetPitch) {
            var pitchDiff = _targetPitch - _startPitch;
            var y = Utils.Clamp(pitchDiff * DisplayBase.PITCH_ANGLE_TO_POS, -DisplayBase.PITCH_MAX_POS_Y, DisplayBase.PITCH_MAX_POS_Y);
            return y;
        }
        createCircle(_radius) {
            var circle = document.createElementNS(Avionics.SVG.NS, "circle");
            circle.setAttribute("cx", "0");
            circle.setAttribute("cy", "0");
            circle.setAttribute("r", _radius.toString());
            this.applyStyle(circle);
            return circle;
        }
        createLine(_x1, _y1, _x2, _y2) {
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            line.setAttribute("x1", _x1.toString());
            line.setAttribute("y1", _y1.toString());
            line.setAttribute("x2", _x2.toString());
            line.setAttribute("y2", _y2.toString());
            this.applyStyle(line);
            return line;
        }
        applyStyle(_element) {
            if (_element != null) {
                _element.setAttribute("stroke", this.getColour());
                _element.setAttribute("stroke-width", this.getStrokeWidth());
                _element.setAttribute("fill", "none");
            }
        }
        getStrokeWidth() { return "1.5"; }
    }
    DisplayBase.HEADING_MAX_POS_X = 60;
    DisplayBase.HEADING_MAX_ANGLE = 10;
    DisplayBase.HEADING_ANGLE_TO_POS = DisplayBase.HEADING_MAX_POS_X / DisplayBase.HEADING_MAX_ANGLE;
    DisplayBase.PITCH_MAX_POS_Y = 100;
    DisplayBase.PITCH_MAX_ANGLE = 15;
    DisplayBase.PITCH_ANGLE_TO_POS = DisplayBase.PITCH_MAX_POS_Y / DisplayBase.PITCH_MAX_ANGLE;
    class CommandBarsDisplay extends DisplayBase {
        constructor() {
            super(...arguments);
            this._pitchIsNotReadyYet = true;
            this._fdPitch = 0;
            this._fForcedFdPitch = 0.0;
            this._fForcedFdPitchSmoothingTime = 0.0;
            this._fdBank = 0;
        }
        getGroupName() {
            return "CommandBars";
        }
        create() {
            var halfLineLength = this.getLineLength() * 0.5;
            this.headingLine = this.createLine(0, -halfLineLength, 0, halfLineLength);
            this.group.appendChild(this.headingLine);
            this.pitchLine = this.createLine(-halfLineLength, 0, halfLineLength, 0);
            this.group.appendChild(this.pitchLine);
        }
        refresh(_deltaTime) {
            if (this.headingLine != null) {
                let currentPlaneBank = Simplane.getBank();
                let currentFDBank = Simplane.getFlightDirectorBank();
                let altAboveGround = Simplane.getAltitudeAboveGround();
                if (altAboveGround > 0 && altAboveGround < 10) {
                    currentFDBank = 0;
                }
                this._fdBank = (currentPlaneBank + (currentFDBank - currentPlaneBank) * 0.1);
                var lineX = this.calculatePosXFromBank(currentPlaneBank, this._fdBank);
                this.headingLine.setAttribute("transform", "translate(" + lineX + ", 0)");
            }
            if (this.pitchLine != null) {
                let currentPlanePitch = Simplane.getPitch();
                let currentFDPitch = Simplane.getFlightDirectorPitch();
                let altAboveGround = Simplane.getAltitudeAboveGround();
                let _bForcedFdPitchThisFrame = false;
                if (altAboveGround > 0 && altAboveGround < 10) {
                    currentFDPitch = -8;
                    _bForcedFdPitchThisFrame = true;
                }
                if (this._pitchIsNotReadyYet) {
                    this._pitchIsNotReadyYet = Math.abs(currentFDPitch) < 2;
                }
                if (this._pitchIsNotReadyYet) {
                    currentFDPitch = currentPlanePitch;
                    _bForcedFdPitchThisFrame = true;
                }
                if (_bForcedFdPitchThisFrame) {
                    this._fForcedFdPitchSmoothingTime = 1000;
                    this._fForcedFdPitch = currentFDPitch;
                }
                else if (this._fForcedFdPitchSmoothingTime > 0.0) {
                    this._fForcedFdPitchSmoothingTime = Math.max(0.0, this._fForcedFdPitchSmoothingTime - _deltaTime);
                    let fProgression = (this._fForcedFdPitchSmoothingTime / 1000);
                    currentFDPitch = (currentFDPitch * (1 - fProgression)) + (this._fForcedFdPitch * fProgression);
                }
                this._fdPitch = (currentPlanePitch + (currentFDPitch - currentPlanePitch) * 0.2);
                var lineY = this.calculatePosYFromPitch(currentPlanePitch, this._fdPitch);
                this.pitchLine.setAttribute("transform", "translate(0, " + lineY + ")");
            }
        }
        getLineLength() { return 140; }
        getStrokeWidth() { return "4"; }
    }
    class CommandBarsDisplay_Airbus extends CommandBarsDisplay {
        getLineLength() { return 160; }
        getColour() { return "#24FF00"; }
    }
    class CommandBarsDisplay_Boeing extends CommandBarsDisplay {
        getColour() { return "magenta"; }
    }
    class PathVectorDisplay extends DisplayBase {
        getGroupName() {
            return "PathVector";
        }
        create() {
            var circleRadius = this.getCircleRadius();
            var verticalLineLength = this.getVerticalLineLength();
            var horizontalLineLength = this.getHorizontalLineLength();
            this.group.appendChild(this.createCircle(circleRadius));
            this.group.appendChild(this.createLine(-circleRadius, 0, -(circleRadius + horizontalLineLength), 0));
            this.group.appendChild(this.createLine(circleRadius, 0, (circleRadius + horizontalLineLength), 0));
            this.group.appendChild(this.createLine(0, -circleRadius, 0, -(circleRadius + verticalLineLength)));
        }
        refresh(_deltaTime) {
            if (this.group != null) {
                var originalBodyVelocityZ = SimVar.GetSimVarValue("VELOCITY BODY Z", "feet per second");
                if (originalBodyVelocityZ >= PathVectorDisplay.MIN_SPEED_TO_DISPLAY) {
                    var originalBodyVelocityX = SimVar.GetSimVarValue("VELOCITY BODY X", "feet per second");
                    var originalBodyVelocityY = SimVar.GetSimVarValue("VELOCITY WORLD Y", "feet per second");
                    var originalBodyVelocityXSquared = originalBodyVelocityX * originalBodyVelocityX;
                    var originalBodyVelocityYSquared = originalBodyVelocityY * originalBodyVelocityY;
                    var originalBodyVelocityZSquared = originalBodyVelocityZ * originalBodyVelocityZ;
                    var currentHeading = 0;
                    {
                        var bodyNorm = Math.sqrt(originalBodyVelocityXSquared + originalBodyVelocityZSquared);
                        var bodyNormInv = 1 / bodyNorm;
                        var bodyVelocityX = originalBodyVelocityX * bodyNormInv;
                        var bodyVelocityZ = originalBodyVelocityZ * bodyNormInv;
                        bodyNorm = Math.sqrt((bodyVelocityX * bodyVelocityX) + (bodyVelocityZ * bodyVelocityZ));
                        var angle = bodyVelocityZ / bodyNorm;
                        angle = Utils.Clamp(angle, -1, 1);
                        currentHeading = Math.acos(angle) * (180 / Math.PI);
                        if (bodyVelocityX > 0) {
                            currentHeading *= -1;
                        }
                    }
                    var currentPitch = 0;
                    {
                        var bodyNorm = Math.sqrt(originalBodyVelocityYSquared + originalBodyVelocityZSquared);
                        var bodyNormInv = 1 / bodyNorm;
                        var bodyVelocityY = originalBodyVelocityY * bodyNormInv;
                        var bodyVelocityZ = originalBodyVelocityZ * bodyNormInv;
                        bodyNorm = Math.sqrt((bodyVelocityY * bodyVelocityY) + (bodyVelocityZ * bodyVelocityZ));
                        var angle = bodyVelocityZ / bodyNorm;
                        angle = Utils.Clamp(angle, -1, 1);
                        currentPitch = Math.acos(angle) * (180 / Math.PI);
                        if (bodyVelocityY > 0) {
                            currentPitch *= -1;
                        }
                    }
                    var x = this.calculatePosXFromBank(currentHeading, 0);
                    var y = this.calculatePosYFromPitch(currentPitch, 0);
                    this.group.setAttribute("transform", "translate(" + x + ", " + y + ")");
                }
                else {
                    this.group.setAttribute("transform", "translate(0, 0)");
                }
            }
        }
    }
    PathVectorDisplay.MIN_SPEED_TO_DISPLAY = 25;
    class FPV_Airbus extends PathVectorDisplay {
        getColour() { return "#24FF00"; }
        getCircleRadius() { return 10; }
        getVerticalLineLength() { return 15; }
        getHorizontalLineLength() { return 15; }
    }
    class FPV_Boeing extends PathVectorDisplay {
        getColour() { return "white"; }
        getCircleRadius() { return 10; }
        getVerticalLineLength() { return 15; }
        getHorizontalLineLength() { return 40; }
    }
    class FPD_Airbus extends DisplayBase {
        getGroupName() {
            return "FlightPathDirector";
        }
        create() {
            this.group.appendChild(this.createCircle(FPD_Airbus.CIRCLE_RADIUS));
            var path = document.createElementNS(Avionics.SVG.NS, "path");
            var d = [
                "M", -(FPD_Airbus.LINE_LENGTH * 0.5), ", 0",
                " l", -FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5),
                " l0,", FPD_Airbus.TRIANGLE_HEIGHT,
                " l", FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5),
                " l", FPD_Airbus.LINE_LENGTH, ",0",
                " l", FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5),
                " l0,", FPD_Airbus.TRIANGLE_HEIGHT,
                " l", -FPD_Airbus.TRIANGLE_LENGTH, ",", -(FPD_Airbus.TRIANGLE_HEIGHT * 0.5)
            ].join("");
            path.setAttribute("d", d);
            this.applyStyle(path);
            this.group.appendChild(path);
        }
        refresh(_deltaTime) {
            if (this.group != null) {
                var x = this.calculatePosXFromBank(Simplane.getBank(), Simplane.getFlightDirectorBank());
                var y = this.calculatePosYFromPitch(Simplane.getPitch(), Simplane.getFlightDirectorPitch());
                var angle = -Simplane.getBank();
                this.group.setAttribute("transform", "translate(" + x + ", " + y + ") rotate(" + angle + ")");
            }
        }
        getColour() { return "#24FF00"; }
    }
    FPD_Airbus.CIRCLE_RADIUS = 5;
    FPD_Airbus.LINE_LENGTH = 40;
    FPD_Airbus.TRIANGLE_LENGTH = 20;
    FPD_Airbus.TRIANGLE_HEIGHT = 10;
    class FPA_Boeing extends DisplayBase {
        getGroupName() {
            return "FlightPathAngle";
        }
        create() {
            var path = document.createElementNS(Avionics.SVG.NS, "path");
            var d = [
                "M", -FPA_Boeing.LINE_OFFSET.x, ",", -FPA_Boeing.LINE_OFFSET.y,
                " l", -FPA_Boeing.LINE_LENGTH, ",0",
                " m0,", (FPA_Boeing.LINE_OFFSET.y * 2),
                " l", FPA_Boeing.LINE_LENGTH, ",0",
                " m", (FPA_Boeing.LINE_OFFSET.x * 2), ",0",
                " l", FPA_Boeing.LINE_LENGTH, ",0",
                " m0,", -(FPA_Boeing.LINE_OFFSET.y * 2),
                " l", -FPA_Boeing.LINE_LENGTH, ",0",
            ].join("");
            path.setAttribute("d", d);
            this.applyStyle(path);
            this.group.appendChild(path);
        }
        refresh(_deltaTime) {
            if (this.group != null) {
                var y = this.calculatePosYFromPitch(0, Simplane.getAutoPilotFlightPathAngle());
                this.group.setAttribute("transform", "translate(0, " + y + ") rotate(0)");
            }
        }
        getColour() { return "white"; }
    }
    FPA_Boeing.LINE_LENGTH = 30;
    FPA_Boeing.LINE_OFFSET = new Vec2(30, 6);
    class Handler {
        constructor() {
            this.root = null;
            this.displayMode = new Array();
            this.fFDPitchOffset = 0.0;
        }
        init(_root) {
            this.root = _root;
            if (this.root != null) {
                this.initDefaultValues();
                var group = document.createElementNS(Avionics.SVG.NS, "g");
                group.setAttribute("id", "FlightDirectorDisplay");
                group.setAttribute("transform", "translate(0, " + this.fFDPitchOffset + ")");
                this.createDisplayModes(group);
                this.root.appendChild(group);
            }
        }
        refresh(_deltaTime) {
            this.refreshActiveModes();
            for (var mode = 0; mode < this.displayMode.length; ++mode) {
                if ((this.displayMode[mode] != null) && this.displayMode[mode].active) {
                    this.displayMode[mode].refresh(_deltaTime);
                }
            }
        }
        setModeActive(_mode, _active) {
            if ((_mode >= 0) && (_mode < this.displayMode.length) && (this.displayMode[_mode] != null)) {
                this.displayMode[_mode].active = _active;
            }
        }
    }
    Jet_PFD_FlightDirector.Handler = Handler;
    class A320_Neo_Handler extends Handler {
        createDisplayModes(_group) {
            this.displayMode.push(new CommandBarsDisplay_Airbus(_group));
            this.displayMode.push(new FPV_Airbus(_group));
            this.displayMode.push(new FPD_Airbus(_group));
        }
        refreshActiveModes() {
            var fdActive = (Simplane.getAutoPilotFlightDirectorActive(1));
            var trkfpaMode = Simplane.getAutoPilotTRKFPAModeActive();
            this.setModeActive(0, fdActive && !trkfpaMode);
            this.setModeActive(1, trkfpaMode);
            this.setModeActive(2, fdActive && trkfpaMode);
        }
        initDefaultValues() {
            this.fFDPitchOffset = 0.0;
        }
    }
    Jet_PFD_FlightDirector.A320_Neo_Handler = A320_Neo_Handler;
    class B747_8_Handler extends Handler {
        createDisplayModes(_group) {
            this.displayMode.push(new CommandBarsDisplay_Boeing(_group));
            this.displayMode.push(new FPV_Boeing(_group));
        }
        refreshActiveModes() {
            var fdActive = (Simplane.getAutoPilotFlightDirectorActive(1));
            this.setModeActive(0, fdActive);
            this.setModeActive(1, fdActive && Simplane.getAutoPilotFPAModeActive());
        }
        initDefaultValues() {
            this.fFDPitchOffset = 4.0;
        }
    }
    Jet_PFD_FlightDirector.B747_8_Handler = B747_8_Handler;
    class AS01B_Handler extends Handler {
        createDisplayModes(_group) {
            this.displayMode.push(new CommandBarsDisplay_Boeing(_group));
            this.displayMode.push(new FPV_Boeing(_group));
            this.displayMode.push(new FPA_Boeing(_group));
        }
        refreshActiveModes() {
            var fdActive = (Simplane.getAutoPilotFlightDirectorActive(1));
            var fpaMode = Simplane.getAutoPilotFPAModeActive();
            this.setModeActive(0, fdActive);
            this.setModeActive(1, fdActive && fpaMode);
            this.setModeActive(2, fdActive && fpaMode);
        }
        initDefaultValues() {
            this.fFDPitchOffset = 0.0;
        }
    }
    Jet_PFD_FlightDirector.AS01B_Handler = AS01B_Handler;
})(Jet_PFD_FlightDirector || (Jet_PFD_FlightDirector = {}));
customElements.define("jet-pfd-attitude-indicator", Jet_PFD_AttitudeIndicator);
//# sourceMappingURL=AttitudeIndicator.js.map