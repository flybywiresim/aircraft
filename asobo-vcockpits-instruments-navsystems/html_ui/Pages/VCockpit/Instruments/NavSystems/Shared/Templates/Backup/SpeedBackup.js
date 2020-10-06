class SpeedBackup extends HTMLElement {
    constructor() {
        super();
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
        this.cursorSizeFactor = 1;
        this.aspectRatio = 1.0;
        this.isBackup = false;
    }
    static get observedAttributes() {
        return [
            "altitude",
            "pressure",
            "airspeed",
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
            "aspect-ratio",
            "is-backup"
        ];
    }
    connectedCallback() {
        this.construct();
    }
    construct() {
        if (this.hasAttribute("cursorSizeFactor")) {
            this.cursorSizeFactor = parseFloat(this.getAttribute("cursorSizeFactor"));
        }
        let refHeight = 350;
        let refCenter = 175;
        let baroDeltaY = 0;
        if (this.isBackup && this.aspectRatio < 1.0) {
            refHeight = 512;
            refCenter = 250;
            baroDeltaY = -15;
        }
        Utils.RemoveAllChildren(this);
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 512 " + refHeight);
        this.appendChild(this.root);
        this.baroGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.baroGroup.setAttribute("transform", "translate(0," + baroDeltaY + ")");
        {
            const baroTitle = document.createElementNS(Avionics.SVG.NS, "text");
            baroTitle.setAttribute("x", "256");
            baroTitle.setAttribute("y", "30");
            baroTitle.setAttribute("font-size", "35");
            baroTitle.setAttribute("text-anchor", "middle");
            baroTitle.setAttribute("font-family", "Roboto-Bold");
            baroTitle.setAttribute("fill", "white");
            baroTitle.textContent = "BARO";
            this.baroGroup.appendChild(baroTitle);
            const baroBg = document.createElementNS(Avionics.SVG.NS, "rect");
            baroBg.setAttribute("x", "190");
            baroBg.setAttribute("y", "40");
            baroBg.setAttribute("width", "132");
            baroBg.setAttribute("height", "40");
            baroBg.setAttribute("fill", "black");
            baroBg.setAttribute("stroke", "white");
            baroBg.setAttribute("stroke-width", "3");
            this.baroGroup.appendChild(baroBg);
            this.baroText = document.createElementNS(Avionics.SVG.NS, "text");
            this.baroText.setAttribute("x", "256");
            this.baroText.setAttribute("y", "70");
            this.baroText.setAttribute("font-size", "35");
            this.baroText.setAttribute("text-anchor", "middle");
            this.baroText.setAttribute("font-family", "Roboto-Bold");
            this.baroText.setAttribute("fill", "white");
            this.baroText.textContent = "29.99";
            this.baroGroup.appendChild(this.baroText);
        }
        this.root.appendChild(this.baroGroup);
        this.airspeedGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.root.appendChild(this.airspeedGroup);
        {
            this.airspeedCenter = document.createElementNS(Avionics.SVG.NS, "svg");
            this.airspeedCenter.setAttribute("x", "0");
            this.airspeedCenter.setAttribute("y", "0");
            this.airspeedCenter.setAttribute("width", "200");
            this.airspeedCenter.setAttribute("height", refHeight.toString());
            this.airspeedCenter.setAttribute("viewBox", "0 0 200 " + refHeight);
            this.airspeedGroup.appendChild(this.airspeedCenter);
            {
                this.airspeedCenterGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.airspeedCenter.appendChild(this.airspeedCenterGroup);
                {
                    this.airspeedGradTexts = [];
                    this.redElement = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.redElement.setAttribute("x", "0");
                    this.redElement.setAttribute("y", "-1");
                    this.redElement.setAttribute("width", "25");
                    this.redElement.setAttribute("height", "0");
                    this.redElement.setAttribute("fill", "red");
                    this.airspeedCenterGroup.appendChild(this.redElement);
                    this.yellowElement = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.yellowElement.setAttribute("x", "0");
                    this.yellowElement.setAttribute("y", "-1");
                    this.yellowElement.setAttribute("width", "25");
                    this.yellowElement.setAttribute("height", "0");
                    this.yellowElement.setAttribute("fill", "yellow");
                    this.airspeedCenterGroup.appendChild(this.yellowElement);
                    this.greenElement = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.greenElement.setAttribute("x", "0");
                    this.greenElement.setAttribute("y", "-1");
                    this.greenElement.setAttribute("width", "25");
                    this.greenElement.setAttribute("height", "0");
                    this.greenElement.setAttribute("fill", "green");
                    this.airspeedCenterGroup.appendChild(this.greenElement);
                    this.flapsElement = document.createElementNS(Avionics.SVG.NS, "rect");
                    this.flapsElement.setAttribute("x", "0");
                    this.flapsElement.setAttribute("y", "-1");
                    this.flapsElement.setAttribute("width", "12.5");
                    this.flapsElement.setAttribute("height", "0");
                    this.flapsElement.setAttribute("fill", "white");
                    this.airspeedCenterGroup.appendChild(this.flapsElement);
                    const dashSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                    dashSvg.setAttribute("id", "DASH");
                    dashSvg.setAttribute("x", "0");
                    dashSvg.setAttribute("y", "0");
                    dashSvg.setAttribute("width", "25");
                    dashSvg.setAttribute("height", refHeight.toString());
                    dashSvg.setAttribute("viewBox", "0 0 25 " + refHeight);
                    this.root.appendChild(dashSvg);
                    this.startElement = document.createElementNS(Avionics.SVG.NS, "g");
                    dashSvg.appendChild(this.startElement);
                    const startBg = document.createElementNS(Avionics.SVG.NS, "rect");
                    startBg.setAttribute("x", "0");
                    startBg.setAttribute("y", "-940");
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
                    var center = refCenter;
                    for (let i = -3; i <= 5; i++) {
                        const grad = document.createElementNS(Avionics.SVG.NS, "rect");
                        grad.setAttribute("x", "0");
                        grad.setAttribute("y", (center + 80 * i).toString());
                        grad.setAttribute("height", "4");
                        grad.setAttribute("width", "50");
                        grad.setAttribute("fill", "white");
                        this.airspeedCenterGroup.appendChild(grad);
                        if (i != 0) {
                            const halfGrad = document.createElementNS(Avionics.SVG.NS, "rect");
                            halfGrad.setAttribute("x", "0");
                            halfGrad.setAttribute("y", (center + 80 * i + (i < 0 ? 40 : -40)).toString());
                            halfGrad.setAttribute("height", "4");
                            halfGrad.setAttribute("width", "25");
                            halfGrad.setAttribute("fill", "white");
                            this.airspeedCenterGroup.appendChild(halfGrad);
                        }
                        const gradText = document.createElementNS(Avionics.SVG.NS, "text");
                        gradText.setAttribute("x", "55");
                        gradText.setAttribute("y", (center + 10 + 80 * i).toString());
                        gradText.setAttribute("fill", "white");
                        gradText.setAttribute("font-size", "30");
                        gradText.setAttribute("font-family", "Roboto-Bold");
                        gradText.textContent = "XXX";
                        this.airspeedGradTexts.push(gradText);
                        this.airspeedCenterGroup.appendChild(gradText);
                    }
                }
                this.airspeedCursor = document.createElementNS(Avionics.SVG.NS, "polygon");
                this.airspeedCursor.setAttribute("points", 200 * this.cursorSizeFactor + "," + (center - 40 * this.cursorSizeFactor) + " " +
                    180 * this.cursorSizeFactor + "," + (center - 40 * this.cursorSizeFactor) + " " +
                    180 * this.cursorSizeFactor + "," + (center - 60 * this.cursorSizeFactor) + " " +
                    130 * this.cursorSizeFactor + "," + (center - 60 * this.cursorSizeFactor) + " " +
                    130 * this.cursorSizeFactor + "," + (center - 40 * this.cursorSizeFactor) + " " +
                    35 * this.cursorSizeFactor + "," + (center - 40 * this.cursorSizeFactor) + " " +
                    "5," + center + " " +
                    35 * this.cursorSizeFactor + "," + (center + 40 * this.cursorSizeFactor) + " " +
                    130 * this.cursorSizeFactor + "," + (center + 40 * this.cursorSizeFactor) + " " +
                    130 * this.cursorSizeFactor + "," + (center + 60 * this.cursorSizeFactor) + " " +
                    180 * this.cursorSizeFactor + "," + (center + 60 * this.cursorSizeFactor) + " " +
                    180 * this.cursorSizeFactor + "," + (center + 40 * this.cursorSizeFactor) + " " +
                    200 * this.cursorSizeFactor + "," + (center + 40 * this.cursorSizeFactor));
                this.airspeedCursor.setAttribute("stroke", "white");
                this.airspeedCursor.setAttribute("stroke-width", "3");
                this.airspeedCursor.setAttribute("fill", "black");
                this.airspeedGroup.appendChild(this.airspeedCursor);
                const baseCursorSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                baseCursorSvg.setAttribute("x", (30 * this.cursorSizeFactor).toString());
                baseCursorSvg.setAttribute("y", (center - 40 * this.cursorSizeFactor).toString());
                baseCursorSvg.setAttribute("width", (100 * this.cursorSizeFactor).toString());
                baseCursorSvg.setAttribute("height", (80 * this.cursorSizeFactor).toString());
                baseCursorSvg.setAttribute("viewBox", "0 0 " + (100 * this.cursorSizeFactor) + " " + (80 * this.cursorSizeFactor));
                this.airspeedGroup.appendChild(baseCursorSvg);
                {
                    this.airspeedDigit1Top = document.createElementNS(Avionics.SVG.NS, "text");
                    this.airspeedDigit1Top.setAttribute("x", (28 * this.cursorSizeFactor).toString());
                    this.airspeedDigit1Top.setAttribute("y", "-1");
                    this.airspeedDigit1Top.setAttribute("fill", "white");
                    this.airspeedDigit1Top.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.airspeedDigit1Top.setAttribute("font-family", "Roboto-Bold");
                    this.airspeedDigit1Top.textContent = "-";
                    baseCursorSvg.appendChild(this.airspeedDigit1Top);
                    this.airspeedDigit1Bot = document.createElementNS(Avionics.SVG.NS, "text");
                    this.airspeedDigit1Bot.setAttribute("x", (28 * this.cursorSizeFactor).toString());
                    this.airspeedDigit1Bot.setAttribute("y", (55 * this.cursorSizeFactor).toString());
                    this.airspeedDigit1Bot.setAttribute("fill", "white");
                    this.airspeedDigit1Bot.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.airspeedDigit1Bot.setAttribute("font-family", "Roboto-Bold");
                    this.airspeedDigit1Bot.textContent = "-";
                    baseCursorSvg.appendChild(this.airspeedDigit1Bot);
                    this.airspeedDigit2Top = document.createElementNS(Avionics.SVG.NS, "text");
                    this.airspeedDigit2Top.setAttribute("x", (70 * this.cursorSizeFactor).toString());
                    this.airspeedDigit2Top.setAttribute("y", "-1");
                    this.airspeedDigit2Top.setAttribute("fill", "white");
                    this.airspeedDigit2Top.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.airspeedDigit2Top.setAttribute("font-family", "Roboto-Bold");
                    this.airspeedDigit2Top.textContent = "-";
                    baseCursorSvg.appendChild(this.airspeedDigit2Top);
                    this.airspeedDigit2Bot = document.createElementNS(Avionics.SVG.NS, "text");
                    this.airspeedDigit2Bot.setAttribute("x", (70 * this.cursorSizeFactor).toString());
                    this.airspeedDigit2Bot.setAttribute("y", (55 * this.cursorSizeFactor).toString());
                    this.airspeedDigit2Bot.setAttribute("fill", "white");
                    this.airspeedDigit2Bot.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.airspeedDigit2Bot.setAttribute("font-family", "Roboto-Bold");
                    this.airspeedDigit2Bot.textContent = "-";
                    baseCursorSvg.appendChild(this.airspeedDigit2Bot);
                }
                const rotatingCursorSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                rotatingCursorSvg.setAttribute("x", (130 * this.cursorSizeFactor).toString());
                rotatingCursorSvg.setAttribute("y", (center - 60 * this.cursorSizeFactor).toString());
                rotatingCursorSvg.setAttribute("width", (70 * this.cursorSizeFactor).toString());
                rotatingCursorSvg.setAttribute("height", (120 * this.cursorSizeFactor).toString());
                rotatingCursorSvg.setAttribute("viewBox", "0 " + (-60 * this.cursorSizeFactor) + " " + (50 * this.cursorSizeFactor) + " " + (120 * this.cursorSizeFactor));
                this.airspeedGroup.appendChild(rotatingCursorSvg);
                {
                    this.airspeedEndDigitsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    rotatingCursorSvg.appendChild(this.airspeedEndDigitsGroup);
                    this.airspeedEndDigits = [];
                    for (let i = -2; i <= 2; i++) {
                        const digit = document.createElementNS(Avionics.SVG.NS, "text");
                        digit.setAttribute("x", "0");
                        digit.setAttribute("y", ((15 + 45 * i) * this.cursorSizeFactor).toString());
                        digit.setAttribute("fill", "white");
                        digit.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                        digit.setAttribute("font-family", "Roboto-Bold");
                        digit.textContent = i == 0 ? "-" : " ";
                        this.airspeedEndDigits.push(digit);
                        this.airspeedEndDigitsGroup.appendChild(digit);
                    }
                }
            }
        }
        this.altimeterGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.root.appendChild(this.altimeterGroup);
        {
            this.altimeterCenter = document.createElementNS(Avionics.SVG.NS, "svg");
            this.altimeterCenter.setAttribute("x", "312");
            this.altimeterCenter.setAttribute("y", "0");
            this.altimeterCenter.setAttribute("width", "200");
            this.altimeterCenter.setAttribute("height", refHeight.toString());
            this.altimeterCenter.setAttribute("viewBox", "0 0 200 " + refHeight);
            this.altimeterGroup.appendChild(this.altimeterCenter);
            {
                const graduationSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                graduationSvg.setAttribute("x", "0");
                graduationSvg.setAttribute("y", "0");
                graduationSvg.setAttribute("width", "200");
                graduationSvg.setAttribute("height", refHeight.toString());
                graduationSvg.setAttribute("viewBox", "0 0 200 " + refHeight);
                this.altimeterCenter.appendChild(graduationSvg);
                const center = refCenter;
                this.altimeterGraduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
                graduationSvg.appendChild(this.altimeterGraduationGroup);
                {
                    const graduationSize = 60;
                    this.altimeterGraduationTexts = [];
                    for (let i = -5; i <= 5; i++) {
                        const mainGrad = document.createElementNS(Avionics.SVG.NS, "rect");
                        mainGrad.setAttribute("x", "160");
                        mainGrad.setAttribute("y", fastToFixed(center - 2 + i * graduationSize, 0));
                        mainGrad.setAttribute("height", "4");
                        mainGrad.setAttribute("width", "40");
                        mainGrad.setAttribute("fill", "white");
                        this.altimeterGraduationGroup.appendChild(mainGrad);
                        const gradText = document.createElementNS(Avionics.SVG.NS, "text");
                        gradText.setAttribute("x", "155");
                        gradText.setAttribute("y", fastToFixed(center + 8 + i * graduationSize, 0));
                        gradText.setAttribute("fill", "white");
                        gradText.setAttribute("font-size", "30");
                        gradText.setAttribute("font-family", "Roboto-Bold");
                        gradText.setAttribute("text-anchor", "end");
                        gradText.textContent = "XXXX";
                        this.altimeterGraduationGroup.appendChild(gradText);
                        this.altimeterGraduationTexts.push(gradText);
                        for (let j = 1; j < 5; j++) {
                            const grad = document.createElementNS(Avionics.SVG.NS, "rect");
                            grad.setAttribute("x", "185");
                            grad.setAttribute("y", fastToFixed(center - 2 + i * graduationSize + j * (graduationSize / 5), 0));
                            grad.setAttribute("height", "4");
                            grad.setAttribute("width", "15");
                            grad.setAttribute("fill", "white");
                            this.altimeterGraduationGroup.appendChild(grad);
                        }
                    }
                }
                const cursor = document.createElementNS(Avionics.SVG.NS, "path");
                cursor.setAttribute("d", "M" + (200 - (200 * this.cursorSizeFactor)) + " " + (center - (40 * this.cursorSizeFactor)) +
                    " L" + (200 - (100 * this.cursorSizeFactor)) + " " + (center - (40 * this.cursorSizeFactor)) +
                    " L" + (200 - (100 * this.cursorSizeFactor)) + " " + (center - (60 * this.cursorSizeFactor)) +
                    " L" + (200 - (35 * this.cursorSizeFactor)) + " " + (center - (60 * this.cursorSizeFactor)) +
                    " L" + (200 - (35 * this.cursorSizeFactor)) + " " + (center - (40 * this.cursorSizeFactor)) +
                    " L" + 195 + " " + center +
                    " L" + (200 - (35 * this.cursorSizeFactor)) + " " + (center + (40 * this.cursorSizeFactor)) +
                    " L" + (200 - (35 * this.cursorSizeFactor)) + " " + (center + (60 * this.cursorSizeFactor)) +
                    " L" + (200 - (100 * this.cursorSizeFactor)) + " " + (center + (60 * this.cursorSizeFactor)) +
                    " L" + (200 - (100 * this.cursorSizeFactor)) + " " + (center + (40 * this.cursorSizeFactor)) +
                    " L" + (200 - (200 * this.cursorSizeFactor)) + " " + (center + (40 * this.cursorSizeFactor)) + "Z");
                cursor.setAttribute("fill", "black");
                cursor.setAttribute("stroke", "white");
                cursor.setAttribute("stroke-width", "3");
                graduationSvg.appendChild(cursor);
                const cursorBaseSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                cursorBaseSvg.setAttribute("x", (200 - (200 * this.cursorSizeFactor)).toString());
                cursorBaseSvg.setAttribute("y", (center - (40 * this.cursorSizeFactor)).toString());
                cursorBaseSvg.setAttribute("width", (100 * this.cursorSizeFactor).toString());
                cursorBaseSvg.setAttribute("height", (80 * this.cursorSizeFactor).toString());
                cursorBaseSvg.setAttribute("viewBox", "0 0 " + (100 * this.cursorSizeFactor) + " " + (80 * this.cursorSizeFactor));
                graduationSvg.appendChild(cursorBaseSvg);
                {
                    this.altimeterDigit1Top = document.createElementNS(Avionics.SVG.NS, "text");
                    this.altimeterDigit1Top.setAttribute("x", (16 * this.cursorSizeFactor).toString());
                    this.altimeterDigit1Top.setAttribute("y", "-1");
                    this.altimeterDigit1Top.setAttribute("fill", "white");
                    this.altimeterDigit1Top.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.altimeterDigit1Top.setAttribute("font-family", "Roboto-Bold");
                    this.altimeterDigit1Top.textContent = "X";
                    cursorBaseSvg.appendChild(this.altimeterDigit1Top);
                    this.altimeterDigit1Bot = document.createElementNS(Avionics.SVG.NS, "text");
                    this.altimeterDigit1Bot.setAttribute("x", (16 * this.cursorSizeFactor).toString());
                    this.altimeterDigit1Bot.setAttribute("y", (57 * this.cursorSizeFactor).toString());
                    this.altimeterDigit1Bot.setAttribute("fill", "white");
                    this.altimeterDigit1Bot.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.altimeterDigit1Bot.setAttribute("font-family", "Roboto-Bold");
                    this.altimeterDigit1Bot.textContent = "X";
                    cursorBaseSvg.appendChild(this.altimeterDigit1Bot);
                    this.altimeterDigit2Top = document.createElementNS(Avionics.SVG.NS, "text");
                    this.altimeterDigit2Top.setAttribute("x", (44 * this.cursorSizeFactor).toString());
                    this.altimeterDigit2Top.setAttribute("y", "-1");
                    this.altimeterDigit2Top.setAttribute("fill", "white");
                    this.altimeterDigit2Top.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.altimeterDigit2Top.setAttribute("font-family", "Roboto-Bold");
                    this.altimeterDigit2Top.textContent = "X";
                    cursorBaseSvg.appendChild(this.altimeterDigit2Top);
                    this.altimeterDigit2Bot = document.createElementNS(Avionics.SVG.NS, "text");
                    this.altimeterDigit2Bot.setAttribute("x", (44 * this.cursorSizeFactor).toString());
                    this.altimeterDigit2Bot.setAttribute("y", (57 * this.cursorSizeFactor).toString());
                    this.altimeterDigit2Bot.setAttribute("fill", "white");
                    this.altimeterDigit2Bot.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.altimeterDigit2Bot.setAttribute("font-family", "Roboto-Bold");
                    this.altimeterDigit2Bot.textContent = "X";
                    cursorBaseSvg.appendChild(this.altimeterDigit2Bot);
                    this.altimeterDigit3Top = document.createElementNS(Avionics.SVG.NS, "text");
                    this.altimeterDigit3Top.setAttribute("x", (72 * this.cursorSizeFactor).toString());
                    this.altimeterDigit3Top.setAttribute("y", "-1");
                    this.altimeterDigit3Top.setAttribute("fill", "white");
                    this.altimeterDigit3Top.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.altimeterDigit3Top.setAttribute("font-family", "Roboto-Bold");
                    this.altimeterDigit3Top.textContent = "X";
                    cursorBaseSvg.appendChild(this.altimeterDigit3Top);
                    this.altimeterDigit3Bot = document.createElementNS(Avionics.SVG.NS, "text");
                    this.altimeterDigit3Bot.setAttribute("x", (72 * this.cursorSizeFactor).toString());
                    this.altimeterDigit3Bot.setAttribute("y", (57 * this.cursorSizeFactor).toString());
                    this.altimeterDigit3Bot.setAttribute("fill", "white");
                    this.altimeterDigit3Bot.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                    this.altimeterDigit3Bot.setAttribute("font-family", "Roboto-Bold");
                    this.altimeterDigit3Bot.textContent = "X";
                    cursorBaseSvg.appendChild(this.altimeterDigit3Bot);
                }
                const cursorRotatingSvg = document.createElementNS(Avionics.SVG.NS, "svg");
                cursorRotatingSvg.setAttribute("x", (200 - 105 * this.cursorSizeFactor).toString());
                cursorRotatingSvg.setAttribute("y", (center - (60 * this.cursorSizeFactor)).toString());
                cursorRotatingSvg.setAttribute("width", (70 * this.cursorSizeFactor).toString());
                cursorRotatingSvg.setAttribute("height", (120 * this.cursorSizeFactor).toString());
                cursorRotatingSvg.setAttribute("viewBox", "0 " + (-50 * this.cursorSizeFactor) + " " + (70 * this.cursorSizeFactor) + " " + (120 * this.cursorSizeFactor));
                graduationSvg.appendChild(cursorRotatingSvg);
                {
                    this.altimeterEndDigitsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    cursorRotatingSvg.appendChild(this.altimeterEndDigitsGroup);
                    this.altimeterEndDigits = [];
                    for (let i = -2; i <= 2; i++) {
                        const digit = document.createElementNS(Avionics.SVG.NS, "text");
                        digit.setAttribute("x", (7 * this.cursorSizeFactor).toString());
                        digit.setAttribute("y", ((27 + 45 * i) * this.cursorSizeFactor).toString().toString());
                        digit.setAttribute("fill", "white");
                        digit.setAttribute("font-size", (50 * this.cursorSizeFactor).toString());
                        digit.setAttribute("font-family", "Roboto-Bold");
                        digit.textContent = "XX";
                        this.altimeterEndDigits.push(digit);
                        this.altimeterEndDigitsGroup.appendChild(digit);
                    }
                }
            }
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "is-backup":
            {
                this.isBackup = newValue == "true";
                break;
            }
            case "aspect-ratio":
            {
                this.aspectRatio = parseFloat(newValue);
                this.construct();
                break;
            }
            case "altitude":
                {
                    const value = parseFloat(newValue);
                    this.altitude = value;
                    const center = Math.round(value / 100) * 100;
                    this.altimeterGraduationGroup.setAttribute("transform", "translate(0, " + ((value - center) * 60 / 100) + ")");
                    if (this.currentCenterGrad != center) {
                        this.currentCenterGrad = center;
                        for (let i = 0; i < this.altimeterGraduationTexts.length; i++) {
                            this.altimeterGraduationTexts[i].textContent = fastToFixed(((5 - i) * 100) + center, 0);
                        }
                    }
                    const endValue = value % 100;
                    const endCenter = Math.round(endValue / 10) * 10;
                    this.altimeterEndDigitsGroup.setAttribute("transform", "translate(0, " + ((endValue - endCenter) * 45 * this.cursorSizeFactor / 10) + ")");
                    for (let i = 0; i < this.altimeterEndDigits.length; i++) {
                        const digitValue = Math.round((((2 - i) * 10) + value) % 100 / 10) * 10;
                        this.altimeterEndDigits[i].textContent = fastToFixed(Math.abs((digitValue % 100) / 10), 0) + "0";
                    }
                    if (Math.abs(value) >= 90) {
                        const d3Value = (Math.abs(value) % 1000) / 100;
                        this.altimeterDigit3Bot.textContent = Math.abs(value) < 100 ? "" : fastToFixed(Math.floor(d3Value), 0);
                        this.altimeterDigit3Top.textContent = fastToFixed((Math.floor(d3Value) + 1) % 10, 0);
                        if (endValue > 90 || endValue < -90) {
                            if (endValue < 0) {
                                this.altimeterDigit3Bot.textContent = fastToFixed((Math.floor(d3Value) + 1) % 10, 0);
                                this.altimeterDigit3Top.textContent = Math.abs(value) < 100 ? "" : fastToFixed(Math.floor(d3Value), 0);
                            }
                            const translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 57 * this.cursorSizeFactor / 10;
                            this.altimeterDigit3Bot.setAttribute("transform", "translate(0, " + translate + ")");
                            this.altimeterDigit3Top.setAttribute("transform", "translate(0, " + translate + ")");
                        } else {
                            this.altimeterDigit3Bot.setAttribute("transform", "");
                            this.altimeterDigit3Top.setAttribute("transform", "");
                        }
                        if (Math.abs(value) >= 990) {
                            const d2Value = (Math.abs(value) % 10000) / 1000;
                            this.altimeterDigit2Bot.textContent = Math.abs(value) < 1000 ? "" : fastToFixed(Math.floor(d2Value), 0);
                            this.altimeterDigit2Top.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                            if ((endValue > 90 || endValue < -90) && d3Value > 9) {
                                if (endValue < 0) {
                                    this.altimeterDigit2Bot.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                                    this.altimeterDigit2Top.textContent = Math.abs(value) < 1000 ? "" : fastToFixed(Math.floor(d2Value), 0);
                                }
                                const translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 57 * this.cursorSizeFactor / 10;
                                this.altimeterDigit2Bot.setAttribute("transform", "translate(0, " + translate + ")");
                                this.altimeterDigit2Top.setAttribute("transform", "translate(0, " + translate + ")");
                            } else {
                                this.altimeterDigit2Bot.setAttribute("transform", "");
                                this.altimeterDigit2Top.setAttribute("transform", "");
                            }
                            if (Math.abs(value) >= 9990) {
                                const d1Value = (Math.abs(value) % 100000) / 10000;
                                this.altimeterDigit1Bot.textContent = Math.abs(value) < 10000 ? "" : fastToFixed(Math.floor(d1Value), 0);
                                this.altimeterDigit1Top.textContent = fastToFixed((Math.floor(d1Value) + 1) % 10, 0);
                                if ((endValue > 90 || endValue < -90) && d3Value > 9 && d2Value > 9) {
                                    if (endValue < 0) {
                                        this.altimeterDigit1Bot.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                                        this.altimeterDigit1Top.textContent = Math.abs(value) < 10000 ? "" : fastToFixed(Math.floor(d2Value), 0);
                                    }
                                    const translate = (endValue > 0 ? (endValue - 90) : (endValue + 100)) * 57 * this.cursorSizeFactor / 10;
                                    this.altimeterDigit1Bot.setAttribute("transform", "translate(0, " + translate + ")");
                                    this.altimeterDigit1Top.setAttribute("transform", "translate(0, " + translate + ")");
                                } else {
                                    this.altimeterDigit1Bot.setAttribute("transform", "");
                                    this.altimeterDigit1Top.setAttribute("transform", "");
                                }
                            } else {
                                this.altimeterDigit1Bot.setAttribute("transform", "");
                                this.altimeterDigit1Top.setAttribute("transform", "");
                                if (value < 0) {
                                    this.altimeterDigit1Bot.textContent = "-";
                                } else {
                                    this.altimeterDigit1Bot.textContent = "";
                                }
                                this.altimeterDigit1Top.textContent = "";
                            }
                        } else {
                            this.altimeterDigit2Bot.setAttribute("transform", "");
                            this.altimeterDigit2Top.setAttribute("transform", "");
                            if (value < 0) {
                                this.altimeterDigit2Bot.textContent = "-";
                            } else {
                                this.altimeterDigit2Bot.textContent = "";
                            }
                            this.altimeterDigit1Bot.textContent = "";
                            this.altimeterDigit1Top.textContent = "";
                            this.altimeterDigit2Top.textContent = "";
                        }
                    } else {
                        if (value < 0) {
                            this.altimeterDigit3Bot.textContent = "-";
                        } else {
                            this.altimeterDigit3Bot.textContent = "";
                        }
                        this.altimeterDigit2Bot.textContent = "";
                        this.altimeterDigit1Bot.textContent = "";
                        this.altimeterDigit2Top.textContent = "";
                        this.altimeterDigit1Top.textContent = "";
                        this.altimeterDigit3Bot.setAttribute("transform", "");
                        this.altimeterDigit3Top.setAttribute("transform", "");
                    }
                }
                break;
            case "pressure":
                this.baroText.textContent = parseFloat(newValue).toFixed(2);
                break;
            case "airspeed":
                {
                    this.airspeed = Math.max(parseFloat(newValue), 20);
                    const center = Math.max(Math.round(this.airspeed / 10) * 10, 50);
                    if (((this.minValue > 0) && (this.airspeed < this.minValue)) || ((this.maxValue > 0) && (this.airspeed > this.maxValue))) {
                        Avionics.Utils.diffAndSetAttribute(this.airspeedCursor, "fill", "red");
                    } else {
                        Avionics.Utils.diffAndSetAttribute(this.airspeedCursor, "fill", "black");
                    }
                    this.airspeedCenterGroup.setAttribute("transform", "translate(0, " + ((this.airspeed - center) * 8) + ")");
                    if (this.minValue > 0) {
                        var val = 708 + ((center + 40 - this.minValue) * 10) + ((this.airspeed - center) * 10);
                        this.startElement.setAttribute("transform", "translate(0," + val + ")");
                    }
                    if (this.maxValue > 0) {
                        var val = ((Math.min(Math.max(center + 40 - this.maxValue, -10), 80) * 10) + (this.airspeed - center) * 10);
                        this.endElement.setAttribute("transform", "translate(0," + val + ")");
                    }
                    if (this.airspeedCurrentCenterGrad != center) {
                        this.airspeedCurrentCenterGrad = center;
                        for (let i = 0; i < this.airspeedGradTexts.length; i++) {
                            this.airspeedGradTexts[i].textContent = fastToFixed(((3 - i) * 10) + center, 0);
                        }
                        const greenEnd = Math.min(Math.max(-300, (175 + (-8 * (this.greenEnd - center)))), 800);
                        const greenBegin = Math.min(Math.max(-300, (175 + (-8 * (this.greenBegin - center)))), 800);
                        this.greenElement.setAttribute("y", greenEnd.toString());
                        this.greenElement.setAttribute("height", (greenBegin - greenEnd).toString());
                        const yellowEnd = Math.min(Math.max(-300, (175 + (-8 * (this.yellowEnd - center)))), 800);
                        const yellowBegin = Math.min(Math.max(-300, (175 + (-8 * (this.yellowBegin - center)))), 800);
                        this.yellowElement.setAttribute("y", yellowEnd.toString());
                        this.yellowElement.setAttribute("height", (yellowBegin - yellowEnd).toString());
                        const redEnd = Math.min(Math.max(-300, (175 + (-8 * (this.redEnd - center)))), 800);
                        const redBegin = Math.min(Math.max(-300, (175 + (-8 * (this.redBegin - center)))), 800);
                        this.redElement.setAttribute("y", redEnd.toString());
                        this.redElement.setAttribute("height", (redBegin - redEnd).toString());
                        const flapsEnd = Math.min(Math.max(-300, (175 + (-8 * (this.flapsEnd - center)))), 800);
                        const flapsBegin = Math.min(Math.max(-300, (175 + (-8 * (this.flapsBegin - center)))), 800);
                        this.flapsElement.setAttribute("y", flapsEnd.toString());
                        this.flapsElement.setAttribute("height", (flapsBegin - flapsEnd).toString());
                    }
                    const endValue = this.airspeed % 10;
                    const endCenter = Math.round(endValue);
                    this.airspeedEndDigitsGroup.setAttribute("transform", "translate(0, " + ((endValue - endCenter) * 45) * this.cursorSizeFactor + ")");
                    for (let i = 0; i < this.airspeedEndDigits.length; i++) {
                        if (this.airspeed == 20) {
                            this.airspeedEndDigits[i].textContent = (i == 2 ? "-" : " ");
                        } else {
                            const digitValue = (2 - i + endCenter);
                            this.airspeedEndDigits[i].textContent = fastToFixed((10 + digitValue) % 10, 0);
                        }
                    }
                    if (this.airspeed > 20) {
                        const d2Value = (Math.abs(this.airspeed) % 100) / 10;
                        this.airspeedDigit2Bot.textContent = fastToFixed(Math.floor(d2Value), 0);
                        this.airspeedDigit2Top.textContent = fastToFixed((Math.floor(d2Value) + 1) % 10, 0);
                        if (endValue > 9) {
                            const translate = (endValue - 9) * 55 * this.cursorSizeFactor;
                            this.airspeedDigit2Bot.setAttribute("transform", "translate(0, " + translate + ")");
                            this.airspeedDigit2Top.setAttribute("transform", "translate(0, " + translate + ")");
                        } else {
                            this.airspeedDigit2Bot.setAttribute("transform", "");
                            this.airspeedDigit2Top.setAttribute("transform", "");
                        }
                        if (Math.abs(this.airspeed) >= 99) {
                            const d1Value = (Math.abs(this.airspeed) % 1000) / 100;
                            this.airspeedDigit1Bot.textContent = Math.abs(this.airspeed) < 100 ? "" : fastToFixed(Math.floor(d1Value), 0);
                            this.airspeedDigit1Top.textContent = fastToFixed((Math.floor(d1Value) + 1) % 10, 0);
                            if (endValue > 9 && d2Value > 9) {
                                const translate = (endValue - 9) * 55 * this.cursorSizeFactor;
                                this.airspeedDigit1Bot.setAttribute("transform", "translate(0, " + translate + ")");
                                this.airspeedDigit1Top.setAttribute("transform", "translate(0, " + translate + ")");
                            } else {
                                this.airspeedDigit1Bot.setAttribute("transform", "");
                                this.airspeedDigit1Top.setAttribute("transform", "");
                            }
                        } else {
                            this.airspeedDigit1Bot.textContent = "";
                            this.airspeedDigit1Top.textContent = "";
                        }
                    } else {
                        this.airspeedDigit2Bot.textContent = "-";
                        this.airspeedDigit1Bot.textContent = "-";
                        this.airspeedDigit1Bot.setAttribute("transform", "");
                        this.airspeedDigit1Top.setAttribute("transform", "");
                        this.airspeedDigit2Bot.setAttribute("transform", "");
                        this.airspeedDigit2Top.setAttribute("transform", "");
                    }
                }
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
        }
    }
}
customElements.define('speed-backup', SpeedBackup);
//# sourceMappingURL=SpeedBackup.js.map