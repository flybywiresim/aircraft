class DoubleHorizontalGauge extends HTMLElement {
    constructor() {
        super();
        this.min = NaN;
        this.max = NaN;
        this.lowLimit = NaN;
        this.highLimit = NaN;
        this.redStart = NaN;
        this.redEnd = NaN;
        this.yellowStart = NaN;
        this.yellowEnd = NaN;
        this.greenStart = NaN;
        this.greenEnd = NaN;
        this.graduations = [];
        this.graduationTexts = [];
        this.val1 = 0;
        this.val2 = 0;
        this.gaugeTitle = "";
        this.unit = "";
    }
    static get observedAttributes() {
        return [
            "value",
            "value2",
            "min-value",
            "max-value",
            "limit-low",
            "limit-high",
            "red-start",
            "red-end",
            "yellow-start",
            "yellow-end",
            "green-start",
            "green-end",
            "title",
            "unit",
            "fixed-font-size",
            "cursor-text1",
            "cursor-text2"
        ];
    }
    connectedCallback() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "-7 -10 114 60");
        this.appendChild(this.root);
        const centralLine = document.createElementNS(Avionics.SVG.NS, "rect");
        centralLine.setAttribute("x", "0");
        centralLine.setAttribute("y", "24");
        centralLine.setAttribute("height", "2");
        centralLine.setAttribute("width", "100");
        centralLine.setAttribute("fill", "white");
        this.root.appendChild(centralLine);
        this.greenElement = document.createElementNS(Avionics.SVG.NS, "rect");
        this.greenElement.setAttribute("x", "0");
        this.greenElement.setAttribute("y", "22.5");
        this.greenElement.setAttribute("height", "5");
        this.greenElement.setAttribute("width", "0");
        this.greenElement.setAttribute("fill", "green");
        this.root.appendChild(this.greenElement);
        this.yellowElement = document.createElementNS(Avionics.SVG.NS, "rect");
        this.yellowElement.setAttribute("x", "0");
        this.yellowElement.setAttribute("y", "22.5");
        this.yellowElement.setAttribute("height", "5");
        this.yellowElement.setAttribute("width", "0");
        this.yellowElement.setAttribute("fill", "yellow");
        this.root.appendChild(this.yellowElement);
        this.redElement = document.createElementNS(Avionics.SVG.NS, "rect");
        this.redElement.setAttribute("x", "0");
        this.redElement.setAttribute("y", "22.5");
        this.redElement.setAttribute("height", "5");
        this.redElement.setAttribute("width", "0");
        this.redElement.setAttribute("fill", "red");
        this.root.appendChild(this.redElement);
        this.cursor1 = document.createElementNS(Avionics.SVG.NS, "g");
        this.root.appendChild(this.cursor1);
        const cursor1Bg = document.createElementNS(Avionics.SVG.NS, "polygon");
        cursor1Bg.setAttribute("points", "0,25 -7,14 7,14");
        cursor1Bg.setAttribute("fill", "white");
        this.cursor1.appendChild(cursor1Bg);
        this.cursor1Text = document.createElementNS(Avionics.SVG.NS, "text");
        this.cursor1Text.setAttribute("x", "0");
        this.cursor1Text.setAttribute("y", "22.5");
        this.cursor1Text.setAttribute("fill", "black");
        this.cursor1Text.setAttribute("font-size", "10");
        this.cursor1Text.setAttribute("font-family", "Roboto-Bold");
        this.cursor1Text.setAttribute("text-anchor", "middle");
        this.cursor1Text.textContent = "R";
        this.cursor1.appendChild(this.cursor1Text);
        this.cursor2 = document.createElementNS(Avionics.SVG.NS, "g");
        this.root.appendChild(this.cursor2);
        const cursor2Bg = document.createElementNS(Avionics.SVG.NS, "polygon");
        cursor2Bg.setAttribute("points", "0,25 -7,36 7,36");
        cursor2Bg.setAttribute("fill", "white");
        this.cursor2.appendChild(cursor2Bg);
        this.cursor2Text = document.createElementNS(Avionics.SVG.NS, "text");
        this.cursor2Text.setAttribute("x", "0");
        this.cursor2Text.setAttribute("y", "35");
        this.cursor2Text.setAttribute("fill", "black");
        this.cursor2Text.setAttribute("font-size", "10");
        this.cursor2Text.setAttribute("font-family", "Roboto-Bold");
        this.cursor2Text.setAttribute("text-anchor", "middle");
        this.cursor2Text.textContent = "L";
        this.cursor2.appendChild(this.cursor2Text);
        this.titleElement = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleElement.setAttribute("x", "0");
        this.titleElement.setAttribute("y", "14");
        this.titleElement.setAttribute("fill", "white");
        this.titleElement.setAttribute("font-size", "10");
        this.titleElement.setAttribute("font-family", "Roboto-Bold");
        this.titleElement.textContent = "";
        this.root.appendChild(this.titleElement);
    }
    drawArcs() {
        if (!isNaN(this.min) && !isNaN(this.max)) {
            if (!isNaN(this.redStart) && !isNaN(this.redEnd)) {
                const start = this.valueToPosX(this.redStart);
                this.redElement.setAttribute("x", start.toString());
                this.redElement.setAttribute("width", (this.valueToPosX(this.redEnd) - start).toString());
            }
            if (!isNaN(this.greenStart) && !isNaN(this.greenEnd)) {
                const start = this.valueToPosX(this.greenStart);
                this.greenElement.setAttribute("x", start.toString());
                this.greenElement.setAttribute("width", (this.valueToPosX(this.greenEnd) - start).toString());
            }
            if (!isNaN(this.yellowStart) && !isNaN(this.yellowEnd)) {
                const start = this.valueToPosX(this.yellowStart);
                this.yellowElement.setAttribute("x", start.toString());
                this.yellowElement.setAttribute("width", (this.valueToPosX(this.yellowEnd) - start).toString());
            }
            this.cursor1.setAttribute("transform", "translate(" + this.valueToPosX(this.val1) + ",0)");
            this.cursor2.setAttribute("transform", "translate(" + this.valueToPosX(this.val2) + ",0)");
        }
    }
    drawGraduations() {
        for (let i = 0; i < this.graduations.length; i++) {
            this.graduations[i].remove();
            this.graduationTexts[i].remove();
        }
        this.graduations = [];
        this.graduationTexts = [];
        if (!isNaN(this.min) && !isNaN(this.max)) {
            for (let i = Math.ceil(this.min / 10); i <= Math.floor(this.max / 10); i++) {
                const xPos = this.valueToPosX(10 * i);
                const line = document.createElementNS(Avionics.SVG.NS, "rect");
                line.setAttribute("x", (xPos - 0.5).toString());
                line.setAttribute("y", "20");
                line.setAttribute("height", "10");
                line.setAttribute("width", "1");
                line.setAttribute("fill", "white");
                this.root.appendChild(line);
                this.graduations.push(line);
                const graduationText = document.createElementNS(Avionics.SVG.NS, "text");
                graduationText.setAttribute("x", xPos.toString());
                graduationText.setAttribute("y", "50");
                graduationText.setAttribute("fill", "white");
                graduationText.setAttribute("font-size", "12");
                graduationText.setAttribute("font-family", "Roboto-Bold");
                graduationText.setAttribute("text-anchor", "middle");
                graduationText.textContent = i == this.max / 10 ? "F" : (10 * i).toString();
                this.root.appendChild(graduationText);
                this.graduationTexts.push(graduationText);
            }
            if (this.max % 10 != 0) {
                const xPos = this.valueToPosX(this.max);
                const line = document.createElementNS(Avionics.SVG.NS, "rect");
                line.setAttribute("x", (xPos - 0.5).toString());
                line.setAttribute("y", "20");
                line.setAttribute("height", "10");
                line.setAttribute("width", "1");
                line.setAttribute("fill", "white");
                this.root.appendChild(line);
                this.graduations.push(line);
                const graduationText = document.createElementNS(Avionics.SVG.NS, "text");
                graduationText.setAttribute("x", xPos.toString());
                graduationText.setAttribute("y", "50");
                graduationText.setAttribute("fill", "white");
                graduationText.setAttribute("font-size", "12");
                graduationText.setAttribute("font-family", "Roboto-Bold");
                graduationText.setAttribute("text-anchor", "middle");
                graduationText.textContent = "F";
                this.root.appendChild(graduationText);
                this.graduationTexts.push(graduationText);
            }
        }
    }
    valueToPosX(_value) {
        if (this.min == this.max) {
            return this.min;
        }
        return ((_value - this.min) / (this.max - this.min)) * 100;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "value":
                this.val1 = parseFloat(newValue);
                this.cursor1.setAttribute("transform", "translate(" + this.valueToPosX(newValue) + ",0)");
                break;
            case "value2":
                this.val2 = parseFloat(newValue);
                this.cursor2.setAttribute("transform", "translate(" + this.valueToPosX(newValue) + ",0)");
                break;
            case "min-value":
                this.min = parseFloat(newValue);
                this.drawArcs();
                this.drawGraduations();
                break;
            case "max-value":
                this.max = parseFloat(newValue);
                this.drawArcs();
                this.drawGraduations();
                break;
            case "limit-low":
                break;
            case "limit-high":
                break;
            case "red-start":
                this.redStart = parseFloat(newValue);
                this.drawArcs();
                break;
            case "red-end":
                this.redEnd = parseFloat(newValue);
                this.drawArcs();
                break;
            case "yellow-start":
                this.yellowStart = parseFloat(newValue);
                this.drawArcs();
                break;
            case "yellow-end":
                this.yellowEnd = parseFloat(newValue);
                this.drawArcs();
                break;
            case "green-start":
                this.greenStart = parseFloat(newValue);
                this.drawArcs();
                break;
            case "green-end":
                this.greenEnd = parseFloat(newValue);
                this.drawArcs();
                break;
            case "title":
                this.gaugeTitle = newValue;
                this.titleElement.textContent = this.gaugeTitle + " " + this.unit;
                break;
            case "unit":
                this.unit = newValue;
                this.titleElement.textContent = this.gaugeTitle + " " + this.unit;
                break;
        }
    }
}
customElements.define('double-horizontal-gauge', DoubleHorizontalGauge);
//# sourceMappingURL=DoubleHorizontalGauge.js.map