class WindDataDisplay extends HTMLElement {
    static get observedAttributes() {
        return [
            "wind-mode",
            "wind-direction",
            "wind-strength",
            "wind-true-direction",
        ];
    }
    constructor() {
        super();
    }
    connectedCallback() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 90 60");
        this.appendChild(this.root);
        this.windDataBackground = document.createElementNS(Avionics.SVG.NS, "rect");
        this.windDataBackground.setAttribute("x", "0");
        this.windDataBackground.setAttribute("y", "0");
        this.windDataBackground.setAttribute("width", "100%");
        this.windDataBackground.setAttribute("height", "100%");
        this.windDataBackground.setAttribute("fill", "#1a1d21");
        this.root.appendChild(this.windDataBackground);
        {
            this.windDataOptn1 = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.windDataOptn1);
            this.o1ArrowX = document.createElementNS(Avionics.SVG.NS, "path");
            this.o1ArrowX.setAttribute("d", "M22.5 5 L17.5 15 L21 15 L21 35 L24 35 L24 15 L27.5 15 Z");
            this.o1ArrowX.setAttribute("fill", "white");
            this.windDataOptn1.appendChild(this.o1ArrowX);
            this.o1ArrowY = document.createElementNS(Avionics.SVG.NS, "path");
            this.o1ArrowY.setAttribute("d", "M22.5 5 L17.5 15 L21 15 L21 35 L24 35 L24 15 L27.5 15 Z");
            this.o1ArrowY.setAttribute("fill", "white");
            this.windDataOptn1.appendChild(this.o1ArrowY);
            this.o1TextX = document.createElementNS(Avionics.SVG.NS, "text");
            this.o1TextX.textContent = "";
            this.o1TextX.setAttribute("fill", "white");
            this.o1TextX.setAttribute("x", "50");
            this.o1TextX.setAttribute("y", "25");
            this.o1TextX.setAttribute("font-size", "20");
            this.o1TextX.setAttribute("font-family", "Roboto-Bold");
            this.windDataOptn1.appendChild(this.o1TextX);
            this.o1TextY = document.createElementNS(Avionics.SVG.NS, "text");
            this.o1TextY.textContent = "";
            this.o1TextY.setAttribute("fill", "white");
            this.o1TextY.setAttribute("x", "22.5");
            this.o1TextY.setAttribute("y", "55");
            this.o1TextY.setAttribute("font-size", "20");
            this.o1TextY.setAttribute("text-anchor", "middle");
            this.o1TextY.setAttribute("font-family", "Roboto-Bold");
            this.windDataOptn1.appendChild(this.o1TextY);
        }
        {
            this.windDataOptn2 = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.windDataOptn2);
            this.o2Arrow = document.createElementNS(Avionics.SVG.NS, "path");
            this.o2Arrow.setAttribute("d", "M22.5 10 L15 20 L21 20 L21 50 L24 50 L24 20 L30 20 Z");
            this.o2Arrow.setAttribute("fill", "white");
            this.windDataOptn2.appendChild(this.o2Arrow);
            this.o2Text = document.createElementNS(Avionics.SVG.NS, "text");
            this.o2Text.textContent = "";
            this.o2Text.setAttribute("fill", "white");
            this.o2Text.setAttribute("x", "50");
            this.o2Text.setAttribute("y", "40");
            this.o2Text.setAttribute("font-size", "30");
            this.o2Text.setAttribute("font-family", "Roboto-Bold");
            this.windDataOptn2.appendChild(this.o2Text);
        }
        {
            this.windDataOptn3 = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.windDataOptn3);
            this.o3Arrow = document.createElementNS(Avionics.SVG.NS, "path");
            this.o3Arrow.setAttribute("d", "M22.5 10 L15 20 L21 20 L21 50 L24 50 L24 20 L30 20 Z");
            this.o3Arrow.setAttribute("fill", "white");
            this.windDataOptn3.appendChild(this.o3Arrow);
            this.o3TextDirection = document.createElementNS(Avionics.SVG.NS, "text");
            this.o3TextDirection.textContent = "";
            this.o3TextDirection.setAttribute("fill", "white");
            this.o3TextDirection.setAttribute("x", "40");
            this.o3TextDirection.setAttribute("y", "20");
            this.o3TextDirection.setAttribute("font-size", "20");
            this.o3TextDirection.setAttribute("font-family", "Roboto-Bold");
            this.windDataOptn3.appendChild(this.o3TextDirection);
            this.o3TextSpeed = document.createElementNS(Avionics.SVG.NS, "text");
            this.o3TextSpeed.textContent = "";
            this.o3TextSpeed.setAttribute("fill", "white");
            this.o3TextSpeed.setAttribute("x", "40");
            this.o3TextSpeed.setAttribute("y", "50");
            this.o3TextSpeed.setAttribute("font-size", "20");
            this.o3TextSpeed.setAttribute("font-family", "Roboto-Bold");
            this.windDataOptn3.appendChild(this.o3TextSpeed);
        }
        {
            this.windDataNoData = document.createElementNS(Avionics.SVG.NS, "g");
            this.root.appendChild(this.windDataNoData);
            const text = document.createElementNS(Avionics.SVG.NS, "text");
            text.innerHTML = "NO WIND";
            text.setAttribute("fill", "white");
            text.setAttribute("x", "45");
            text.setAttribute("y", "25");
            text.setAttribute("font-size", "17");
            text.setAttribute("font-family", "Roboto-Bold");
            text.setAttribute("text-anchor", "middle");
            this.windDataNoData.appendChild(text);
            const text2 = document.createElementNS(Avionics.SVG.NS, "text");
            text2.innerHTML = "DATA";
            text2.setAttribute("fill", "white");
            text2.setAttribute("x", "45");
            text2.setAttribute("y", "45");
            text2.setAttribute("font-size", "17");
            text2.setAttribute("font-family", "Roboto-Bold");
            text2.setAttribute("text-anchor", "middle");
            this.windDataNoData.appendChild(text2);
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "wind-mode":
                let bg = "inherit";
                let o1 = "none";
                let o2 = "none";
                let o3 = "none";
                let noData = "none";
                this.displayMode = parseFloat(newValue);
                switch (newValue) {
                    case "0":
                        bg = "none";
                        break;
                    case "1":
                        o1 = "inherit";
                        break;
                    case "2":
                        o2 = "inherit";
                        break;
                    case "3":
                        o3 = "inherit";
                        break;
                    case "4":
                        noData = "inherit";
                        break;
                }
                this.windDataBackground.setAttribute("display", bg);
                this.windDataOptn1.setAttribute("display", o1);
                this.windDataOptn2.setAttribute("display", o2);
                this.windDataOptn3.setAttribute("display", o3);
                this.windDataNoData.setAttribute("display", noData);
                break;
            case "wind-direction":
                this.o2Arrow.setAttribute("transform", "rotate(" + newValue + ", 22.5, 30)");
                this.o3Arrow.setAttribute("transform", "rotate(" + newValue + ", 22.5, 30)");
                this.windDirection = parseFloat(newValue);
                if (this.displayMode == 1) {
                    this.updateO1();
                }
                break;
            case "wind-strength":
                this.windSpeed = parseFloat(newValue);
                this.o2Text.textContent = fastToFixed(this.windSpeed, 0);
                this.o3TextSpeed.textContent = fastToFixed(this.windSpeed, 0) + "KT";
                if (this.displayMode == 1) {
                    this.updateO1();
                }
                break;
            case "wind-true-direction":
                this.o3TextDirection.textContent = fastToFixed(parseFloat(newValue), 0) + "°";
                break;
        }
    }
    updateO1() {
        const velX = this.windSpeed * Math.sin(this.windDirection / 180 * Math.PI);
        const velY = this.windSpeed * Math.cos(this.windDirection / 180 * Math.PI);
        if (velX > 0) {
            this.o1ArrowX.setAttribute("transform", "rotate(90, 22.5, 20)");
        } else {
            this.o1ArrowX.setAttribute("transform", "rotate(-90, 22.5, 20)");
        }
        this.o1TextX.textContent = fastToFixed(Math.abs(velX), 0);
        if (velY > 0) {
            this.o1ArrowY.setAttribute("transform", "rotate(0, 22.5, 20)");
        } else {
            this.o1ArrowY.setAttribute("transform", "rotate(180, 22.5, 20)");
        }
        this.o1TextY.textContent = fastToFixed(Math.abs(velY), 0);
    }
}
customElements.define('glasscockpit-wind-data', WindDataDisplay);
//# sourceMappingURL=WindDataDisplay.js.map