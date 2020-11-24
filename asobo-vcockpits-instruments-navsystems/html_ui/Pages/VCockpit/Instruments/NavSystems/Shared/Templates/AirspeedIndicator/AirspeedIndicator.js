class ReferenceBug {
}
class AirspeedIndicator extends HTMLElement {
    constructor() {
        super();
        this.trendValue = 0;
        this.redBegin = 0;
        this.redEnd = 0;
        this.greenBegin = 0;
        this.greenEnd = 0;
        this.flapsBegin = 0;
        this.flapsEnd = 0;
        this.yellowBegin = 0;
        this.yellowEnd = 0;
        this.minValue = 0;
        this.maxValue = 0;
        this.currentCenterGrad = 0;
        this.referenceBugs = [];
        this.nocolor = false;
    }
    static get observedAttributes() {
        return [
            "airspeed",
            "airspeed-trend",
            "min-speed",
            "green-begin",
            "green-end",
            "flaps-begin",
            "flaps-end",
            "yellow-begin",
            "yellow-end",
            "red-begin",
            "red-end",
            "max-speed",
            "true-airspeed",
            "reference-bugs",
            "display-ref-speed",
            "ref-speed"
        ];
    }
    connectedCallback() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 -50 250 700");
        this.appendChild(this.root);
        {
            this.airspeedReferenceGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.airspeedReferenceGroup);
            const background = document.createElementNS(Avionics.SVG.NS, "rect");
            background.setAttribute("x", "0");
            background.setAttribute("y", "-50");
            background.setAttribute("width", "200");
            background.setAttribute("height", "50");
            background.setAttribute("fill", "#1a1d21");
            background.setAttribute("fill-opacity", "1");
            this.airspeedReferenceGroup.appendChild(background);
            this.selectedSpeedFixedBug = document.createElementNS(Avionics.SVG.NS, "polygon");
            this.selectedSpeedFixedBug.setAttribute("points", "190,-40 180,-40 180,-30 185,-25 180,-20 180,-10 190,-10 ");
            this.selectedSpeedFixedBug.setAttribute("fill", "#36c8d2");
            this.airspeedReferenceGroup.appendChild(this.selectedSpeedFixedBug);
            this.selectedSpeedText = document.createElementNS(Avionics.SVG.NS, "text");
            this.selectedSpeedText.setAttribute("x", "20");
            this.selectedSpeedText.setAttribute("y", "-10");
            this.selectedSpeedText.setAttribute("fill", "#36c8d2");
            this.selectedSpeedText.setAttribute("font-size", "45");
            this.selectedSpeedText.setAttribute("font-family", "Roboto-Bold");
            this.selectedSpeedText.setAttribute("text-anchor", "start");
            this.selectedSpeedText.textContent = "---";
            this.airspeedReferenceGroup.appendChild(this.selectedSpeedText);
        }
        {
            const background = document.createElementNS(Avionics.SVG.NS, "rect");
            background.setAttribute("x", "0");
            background.setAttribute("y", "0");
            background.setAttribute("width", "200");
            background.setAttribute("height", "600");
            background.setAttribute("fill", "#1a1d21");
            background.setAttribute("fill-opacity", "0.25");
            this.root.appendChild(background);
            this.centerSvg = document.createElementNS(Avionics.SVG.NS, "svg");
            this.centerSvg.setAttribute("x", "0");
            this.centerSvg.setAttribute("y", "0");
            this.centerSvg.setAttribute("width", "250");
            this.centerSvg.setAttribute("height", "600");
            this.centerSvg.setAttribute("viewBox", "0 0 250 600");
            this.root.appendChild(this.centerSvg);
            {
                this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.centerSvg.appendChild(this.centerGroup);
                {
                    this.gradTexts = [];
                    if (this.getAttribute("NoColor") != "True") {
                        this.redElement = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.redElement.setAttribute("x", "175");
                        this.redElement.setAttribute("y", "-1");
                        this.redElement.setAttribute("width", "25");
                        this.redElement.setAttribute("height", "0");
                        this.redElement.setAttribute("fill", "red");
                        this.centerGroup.appendChild(this.redElement);
                        this.yellowElement = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.yellowElement.setAttribute("x", "175");
                        this.yellowElement.setAttribute("y", "-1");
                        this.yellowElement.setAttribute("width", "25");
                        this.yellowElement.setAttribute("height", "0");
                        this.yellowElement.setAttribute("fill", "yellow");
                        this.centerGroup.appendChild(this.yellowElement);
                        this.greenElement = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.greenElement.setAttribute("x", "175");
                        this.greenElement.setAttribute("y", "-1");
                        this.greenElement.setAttribute("width", "25");
                        this.greenElement.setAttribute("height", "0");
                        this.greenElement.setAttribute("fill", "green");
                        this.centerGroup.appendChild(this.greenElement);
                        this.flapsElement = document.createElementNS(Avionics.SVG.NS, "rect");
                        this.flapsElement.setAttribute("x", "187.5");
                        this.flapsElement.setAttribute("y", "-1");
                        this.flapsElement.setAttribute("width", "12.5");
                        this.flapsElement.setAttribute("height", "0");
                        this.flapsElement.setAttribute("fill", "white");
                        this.centerGroup.appendChild(this.flapsElement);
                        const dashSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                        dashSvg.setAttribute("id", "DASH");
                        dashSvg.setAttribute("x", "175");
                        dashSvg.setAttribute("y", "0");
                        dashSvg.setAttribute("width", "25");
                        dashSvg.setAttribute("height", "600");
                        dashSvg.setAttribute("viewBox", "0 0 25 600");
                        this.root.appendChild(dashSvg);
                        this.startElement = document.createElementNS(Avionics.SVG.NS, "g");
                        dashSvg.appendChild(this.startElement);
                        const startBg = document.createElementNS(Avionics.SVG.NS, "rect");
                        startBg.setAttribute("x", "0");
                        startBg.setAttribute("y", "-935");
                        startBg.setAttribute("width", "25");
                        startBg.setAttribute("height", "800");
                        startBg.setAttribute("fill", "white");
                        this.startElement.appendChild(startBg);
                        for (let i = 0; i <= 32; i++) {
                            const redLine = document.createElementNS(Avionics.SVG.NS, "rect");
                            redLine.setAttribute("x", "0");
                            redLine.setAttribute("y", (-125 - 25 * i).toString());
                            redLine.setAttribute("width", "25");
                            redLine.setAttribute("height", "12.5");
                            redLine.setAttribute("transform", "skewY(-30)");
                            redLine.setAttribute("fill", "red");
                            this.startElement.appendChild(redLine);
                        }
                        this.endElement = document.createElementNS(Avionics.SVG.NS, "g");
                        dashSvg.appendChild(this.endElement);
                        const endBg = document.createElementNS(Avionics.SVG.NS, "rect");
                        endBg.setAttribute("x", "0");
                        endBg.setAttribute("y", "-900");
                        endBg.setAttribute("width", "25");
                        endBg.setAttribute("height", "800");
                        endBg.setAttribute("fill", "white");
                        this.endElement.appendChild(endBg);
                        for (let i = 0; i <= 32; i++) {
                            const redLine = document.createElementNS(Avionics.SVG.NS, "rect");
                            redLine.setAttribute("x", "0");
                            redLine.setAttribute("y", (-125 - 25 * i).toString());
                            redLine.setAttribute("width", "25");
                            redLine.setAttribute("height", "12.5");
                            redLine.setAttribute("transform", "skewY(-30)");
                            redLine.setAttribute("fill", "red");
                            this.endElement.appendChild(redLine);
                        }
                    } else {
                        this.nocolor = true;
                    }
                    for (let i = -4; i <= 4; i++) {
                        const grad = document.createElementNS(Avionics.SVG.NS, "rect");
                        grad.setAttribute("x", "150");
                        grad.setAttribute("y", (298 + 100 * i).toString());
                        grad.setAttribute("height", "4");
                        grad.setAttribute("width", "50");
                        grad.setAttribute("fill", "white");
                        this.centerGroup.appendChild(grad);
                        if (i != 0) {
                            const halfGrad = document.createElementNS(Avionics.SVG.NS, "rect");
                            halfGrad.setAttribute("x", "175");
                            halfGrad.setAttribute("y", (298 + 100 * i + (i < 0 ? 50 : -50)).toString());
                            halfGrad.setAttribute("height", "4");
                            halfGrad.setAttribute("width", "25");
                            halfGrad.setAttribute("fill", "black");
                            this.centerGroup.appendChild(halfGrad);
                        }
                        const gradText = document.createElementNS(Avionics.SVG.NS, "text");
                        gradText.setAttribute("x", "140");
                        gradText.setAttribute("y", (320 + 100 * i).toString());
                        gradText.setAttribute("fill", "white");
                        gradText.setAttribute("font-size", "50");
                        gradText.setAttribute("text-anchor", "end");
                        gradText.setAttribute("font-family", "Roboto-Bold");
                        gradText.setAttribute("letter-spacing", "12");
                        gradText.textContent = "XXX";
                        this.gradTexts.push(gradText);
                        this.centerGroup.appendChild(gradText);
                    }
                    const center = 300;
                    this.selectedSpeedBug = document.createElementNS(Avionics.SVG.NS, "polygon");
                    this.selectedSpeedBug.setAttribute("points", "200, " + (center - 20) + " 180, " + (center - 20) + " 180, " + (center - 15) + " 190, " + center + " 180, " + (center + 15) + " 180, " + (center + 20) + " 200, " + (center + 20));
                    this.selectedSpeedBug.setAttribute("fill", "#36c8d2");
                    this.centerSvg.appendChild(this.selectedSpeedBug);
                }
                this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.cursor.setAttribute("points", "200,300 170,260 150,260 150,240 100,240 100,260 0,260 0,340 100,340 100,360 150,360 150,340 170,340");
                this.cursor.setAttribute("fill", "#1a1d21");
                this.root.appendChild(this.cursor);
                this.trendElement = document.createElementNS(Avionics.SVG.NS, "rect");
                this.trendElement.setAttribute("x", "200");
                this.trendElement.setAttribute("y", "-1");
                this.trendElement.setAttribute("width", "8");
                this.trendElement.setAttribute("height", "0");
                this.trendElement.setAttribute("fill", "#d12bc7");
                this.root.appendChild(this.trendElement);
                const baseCursorSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                baseCursorSvg.setAttribute("x", "0");
                baseCursorSvg.setAttribute("y", "260");
                baseCursorSvg.setAttribute("width", "100");
                baseCursorSvg.setAttribute("height", "80");
                baseCursorSvg.setAttribute("viewBox", "0 0 100 80");
                this.root.appendChild(baseCursorSvg);
                {
                    this.digit1Top = document.createElementNS(Avionics.SVG.NS, "text");
                    this.digit1Top.setAttribute("x", "28");
                    this.digit1Top.setAttribute("y", "-1");
                    this.digit1Top.setAttribute("fill", "white");
                    this.digit1Top.setAttribute("font-size", "50");
                    this.digit1Top.setAttribute("font-family", "Roboto-Bold");
                    this.digit1Top.textContent = "-";
                    baseCursorSvg.appendChild(this.digit1Top);
                    this.digit1Bot = document.createElementNS(Avionics.SVG.NS, "text");
                    this.digit1Bot.setAttribute("x", "28");
                    this.digit1Bot.setAttribute("y", "55");
                    this.digit1Bot.setAttribute("fill", "white");
                    this.digit1Bot.setAttribute("font-size", "50");
                    this.digit1Bot.setAttribute("font-family", "Roboto-Bold");
                    this.digit1Bot.textContent = "-";
                    baseCursorSvg.appendChild(this.digit1Bot);
                    this.digit2Top = document.createElementNS(Avionics.SVG.NS, "text");
                    this.digit2Top.setAttribute("x", "70");
                    this.digit2Top.setAttribute("y", "-1");
                    this.digit2Top.setAttribute("fill", "white");
                    this.digit2Top.setAttribute("font-size", "50");
                    this.digit2Top.setAttribute("font-family", "Roboto-Bold");
                    this.digit2Top.textContent = "-";
                    baseCursorSvg.appendChild(this.digit2Top);
                    this.digit2Bot = document.createElementNS(Avionics.SVG.NS, "text");
                    this.digit2Bot.setAttribute("x", "70");
                    this.digit2Bot.setAttribute("y", "55");
                    this.digit2Bot.setAttribute("fill", "white");
                    this.digit2Bot.setAttribute("font-size", "50");
                    this.digit2Bot.setAttribute("font-family", "Roboto-Bold");
                    this.digit2Bot.textContent = "-";
                    baseCursorSvg.appendChild(this.digit2Bot);
                }
                const rotatingCursorSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                rotatingCursorSvg.setAttribute("x", "100");
                rotatingCursorSvg.setAttribute("y", "240");
                rotatingCursorSvg.setAttribute("width", "70");
                rotatingCursorSvg.setAttribute("height", "120");
                rotatingCursorSvg.setAttribute("viewBox", "0 -60 50 120");
                this.root.appendChild(rotatingCursorSvg);
                {
                    this.endDigitsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    rotatingCursorSvg.appendChild(this.endDigitsGroup);
                    this.endDigits = [];
                    for (let i = -2; i <= 2; i++) {
                        const digit = document.createElementNS(Avionics.SVG.NS, "text");
                        digit.setAttribute("x", "0");
                        digit.setAttribute("y", (15 + 45 * i).toString());
                        digit.setAttribute("fill", "white");
                        digit.setAttribute("font-size", "50");
                        digit.setAttribute("font-family", "Roboto-Bold");
                        digit.textContent = i == 0 ? "-" : " ";
                        this.endDigits.push(digit);
                        this.endDigitsGroup.appendChild(digit);
                    }
                }
            }
        }
        {
            this.bottomBackground = document.createElementNS(Avionics.SVG.NS, "rect");
            this.bottomBackground.setAttribute("x", "0");
            this.bottomBackground.setAttribute("y", "600");
            this.bottomBackground.setAttribute("width", "200");
            this.bottomBackground.setAttribute("height", "50");
            this.bottomBackground.setAttribute("fill", "#1a1d21");
            this.root.appendChild(this.bottomBackground);
            const tasTasText = document.createElementNS(Avionics.SVG.NS, "text");
            tasTasText.setAttribute("x", "5");
            tasTasText.setAttribute("y", "638");
            tasTasText.setAttribute("fill", "white");
            tasTasText.setAttribute("font-size", "35");
            tasTasText.setAttribute("font-family", "Roboto-Bold");
            tasTasText.setAttribute("text-anchor", "start");
            tasTasText.textContent = "TAS";
            this.root.appendChild(tasTasText);
            this.tasText = document.createElementNS(Avionics.SVG.NS, "text");
            this.tasText.setAttribute("x", "195");
            this.tasText.setAttribute("y", "638");
            this.tasText.setAttribute("fill", "white");
            this.tasText.setAttribute("font-size", "35");
            this.tasText.setAttribute("font-family", "Roboto-Bold");
            this.tasText.setAttribute("text-anchor", "end");
            this.tasText.textContent = "0KT";
            this.root.appendChild(this.tasText);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue && name != "airspeed") {
            return;
        }
        switch (name) {
            case "airspeed":
                this.value = Math.max(parseFloat(newValue), 20);
                const center = Math.max(Math.round(this.value / 10) * 10, 60);
                if (!this.nocolor && ((this.minValue > 0) && (this.value < this.minValue)) || ((this.maxValue > 0) && (this.value > this.maxValue))) {
                    Avionics.Utils.diffAndSetAttribute(this.cursor, "fill", "red");
                    Avionics.Utils.diffAndSetAttribute(this.bottomBackground, "fill", "red");
                } else {
                    Avionics.Utils.diffAndSetAttribute(this.cursor, "fill", "#1a1d21");
                    Avionics.Utils.diffAndSetAttribute(this.bottomBackground, "fill", "#1a1d21");
                }
                this.centerGroup.setAttribute("transform", "translate(0, " + ((this.value - center) * 10) + ")");
                if (!this.nocolor) {
                    if (this.minValue > 0) {
                        var val = 835 + ((center + 40 - this.minValue) * 10) + ((this.value - center) * 10);
                        this.startElement.setAttribute("transform", "translate(0," + val + ")");
                    }
                    if (this.maxValue > 0) {
                        var val = ((Math.min(Math.max(center + 40 - this.maxValue, -10), 80) * 10) + (this.value - center) * 10);
                        this.endElement.setAttribute("transform", "translate(0," + val + ")");
                    }
                }
                for (let i = 0; i < this.referenceBugs.length; i++) {
                    this.referenceBugs[i].group.setAttribute("transform", "translate(0," + ((this.value - this.referenceBugs[i].value) * 10) + ")");
                }
                this.selectedSpeedBug.setAttribute("transform", "translate(0," + ((this.value - this.selectedSpeedBugValue) * 10) + ")");
                if (this.currentCenterGrad != center) {
                    this.currentCenterGrad = center;
                    for (let i = 0; i < this.gradTexts.length; i++) {
                        this.gradTexts[i].textContent = fastToFixed(((4 - i) * 10) + center, 0);
                    }
                    if (!this.nocolor) {
                        const greenEnd = Math.min(Math.max(-100, (300 + (-10 * (this.greenEnd - center)))), 700);
                        const greenBegin = Math.min(Math.max(-100, (300 + (-10 * (this.greenBegin - center)))), 700);
                        this.greenElement.setAttribute("y", greenEnd.toString());
                        this.greenElement.setAttribute("height", (greenBegin - greenEnd).toString());
                        const yellowEnd = Math.min(Math.max(-100, (300 + (-10 * (this.yellowEnd - center)))), 700);
                        const yellowBegin = Math.min(Math.max(-100, (300 + (-10 * (this.yellowBegin - center)))), 700);
                        this.yellowElement.setAttribute("y", yellowEnd.toString());
                        this.yellowElement.setAttribute("height", (yellowBegin - yellowEnd).toString());
                        const redEnd = Math.min(Math.max(-100, (300 + (-10 * (this.redEnd - center)))), 700);
                        const redBegin = Math.min(Math.max(-100, (300 + (-10 * (this.redBegin - center)))), 700);
                        this.redElement.setAttribute("y", redEnd.toString());
                        this.redElement.setAttribute("height", (redBegin - redEnd).toString());
                        const flapsEnd = Math.min(Math.max(-100, (300 + (-10 * (this.flapsEnd - center)))), 700);
                        const flapsBegin = Math.min(Math.max(-100, (300 + (-10 * (this.flapsBegin - center)))), 700);
                        this.flapsElement.setAttribute("y", flapsEnd.toString());
                        this.flapsElement.setAttribute("height", (flapsBegin - flapsEnd).toString());
                    }
                }
                const endValue = this.value % 10;
                const endCenter = Math.round(endValue);
                this.endDigitsGroup.setAttribute("transform", "translate(0, " + ((endValue - endCenter) * 45) + ")");
                for (let i = 0; i < this.endDigits.length; i++) {
                    if (this.value == 20) {
                        this.endDigits[i].textContent = (i == 2 ? "-" : " ");
                    } else {
                        const digitValue = (2 - i + endCenter);
                        this.endDigits[i].textContent = fastToFixed((10 + digitValue) % 10, 0);
                    }
                }
                if (this.value > 20) {
                    const d2Value = (Math.abs(this.value) % 100) / 10;
                    this.digit2Bot.textContent = fastToFixed(Math.floor(d2Value), 0);
                    this.digit2Top.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                    if (endValue > 9) {
                        const translate = (endValue - 9) * 55;
                        this.digit2Bot.setAttribute("transform", "translate(0, " + translate + ")");
                        this.digit2Top.setAttribute("transform", "translate(0, " + translate + ")");
                    } else {
                        this.digit2Bot.setAttribute("transform", "");
                        this.digit2Top.setAttribute("transform", "");
                    }
                    if (Math.abs(this.value) >= 99) {
                        const d1Value = (Math.abs(this.value) % 1000) / 100;
                        this.digit1Bot.textContent = Math.abs(this.value) < 100 ? "" : fastToFixed(Math.floor(d1Value), 0);
                        this.digit1Top.textContent = fastToFixed((Math.floor(d1Value) + 1) % 10, 0);
                        if (endValue > 9 && d2Value > 9) {
                            const translate = (endValue - 9) * 55;
                            this.digit1Bot.setAttribute("transform", "translate(0, " + translate + ")");
                            this.digit1Top.setAttribute("transform", "translate(0, " + translate + ")");
                        } else {
                            this.digit1Bot.setAttribute("transform", "");
                            this.digit1Top.setAttribute("transform", "");
                        }
                    } else {
                        this.digit1Bot.textContent = "";
                        this.digit1Top.textContent = "";
                    }
                } else {
                    this.digit2Bot.textContent = "-";
                    this.digit1Bot.textContent = "-";
                    this.digit1Bot.setAttribute("transform", "");
                    this.digit1Top.setAttribute("transform", "");
                    this.digit2Bot.setAttribute("transform", "");
                    this.digit2Top.setAttribute("transform", "");
                }
                break;
            case "airspeed-trend":
                this.trendValue = Math.min(Math.max(300 + parseFloat(newValue) * 6 * -10, 0), 600);
                this.trendElement.setAttribute("y", Math.min(this.trendValue, 300).toString());
                this.trendElement.setAttribute("height", Math.abs(this.trendValue - 300).toString());
                break;
            case "min-speed":
                this.minValue = parseFloat(newValue);
                break;
            case "green-begin":
                this.greenBegin = parseFloat(newValue);
                break;
            case "green-end":
                this.greenEnd = parseFloat(newValue);
                break;
            case "yellow-begin":
                this.yellowBegin = parseFloat(newValue);
                break;
            case "yellow-end":
                this.yellowEnd = parseFloat(newValue);
                break;
            case "flaps-begin":
                this.flapsBegin = parseFloat(newValue);
                break;
            case "flaps-end":
                this.flapsEnd = parseFloat(newValue);
                break;
            case "red-begin":
                this.redBegin = parseFloat(newValue);
                break;
            case "red-end":
                this.redEnd = parseFloat(newValue);
                break;
            case "max-speed":
                this.maxValue = parseFloat(newValue);
                break;
            case "true-airspeed":
                this.tasText.textContent = fastToFixed(parseFloat(newValue), 0) + "KT";
                break;
            case "reference-bugs":
                let elements;
                if (newValue != "") {
                    elements = newValue.split(";");
                } else {
                    elements = [];
                }
                for (let i = 0; i < elements.length; i++) {
                    if (i >= this.referenceBugs.length) {
                        const newRef = new ReferenceBug();
                        newRef.group = document.createElementNS(Avionics.SVG.NS, "g");
                        this.centerSvg.appendChild(newRef.group);
                        newRef.bug = document.createElementNS(Avionics.SVG.NS, "polygon");
                        newRef.bug.setAttribute("points", "200,300 210,315 250,315 250,285 210,285");
                        newRef.bug.setAttribute("fill", "#1a1d21");
                        newRef.group.appendChild(newRef.bug);
                        newRef.text = document.createElementNS(Avionics.SVG.NS, "text");
                        newRef.text.setAttribute("fill", "aqua");
                        newRef.text.setAttribute("x", "230");
                        newRef.text.setAttribute("y", "310");
                        newRef.text.setAttribute("font-size", "25");
                        newRef.text.setAttribute("text-anchor", "middle");
                        newRef.text.setAttribute("font-family", "Roboto-Bold");
                        newRef.group.appendChild(newRef.text);
                        this.referenceBugs.push(newRef);
                    }
                    const values = elements[i].split(':');
                    this.referenceBugs[i].value = parseFloat(values[1]);
                    this.referenceBugs[i].text.textContent = values[0];
                    this.referenceBugs[i].group.setAttribute("transform", "translate(0," + ((this.value - this.referenceBugs[i].value) * 10) + ")");
                    this.referenceBugs[i].group.setAttribute("display", "");
                }
                for (let i = elements.length; i < this.referenceBugs.length; i++) {
                    this.referenceBugs[i].group.setAttribute("display", "none");
                }
                break;
            case "display-ref-speed":
                this.airspeedReferenceGroup.setAttribute("display", newValue == "True" ? "" : "none");
                this.selectedSpeedBug.setAttribute("display", newValue == "True" ? "" : "none");
                break;
            case "ref-speed":
                this.selectedSpeedBugValue = parseFloat(newValue);
                this.selectedSpeedText.textContent = Math.round(parseFloat(newValue)).toString();
                break;
        }
    }
}
customElements.define('glasscockpit-airspeed-indicator', AirspeedIndicator);
//# sourceMappingURL=AirspeedIndicator.js.map