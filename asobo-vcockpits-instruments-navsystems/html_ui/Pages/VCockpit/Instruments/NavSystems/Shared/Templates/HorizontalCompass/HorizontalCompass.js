class HorizontalCompass extends HTMLElement {
    static get observedAttributes() {
        return [
            "bearing",
            "course-active",
            "course"
        ];
    }
    connectedCallback() {
        this.createSVG();
    }
    createSVG() {
        let width = 288;
        const truncateLeft_Text = this.getAttribute("TruncateLeft");
        const truncateRight_Text = this.getAttribute("TruncateRight");
        let truncateLeft = 0;
        let truncateRight = 0;
        if (truncateLeft_Text) {
            truncateLeft = parseInt(truncateLeft_Text);
            width -= truncateLeft;
        }
        if (truncateRight_Text) {
            truncateRight = parseInt(truncateRight_Text);
            width -= truncateRight;
        }
        const center = (width - truncateLeft + truncateRight) / 2;
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 " + width + " 20");
        this.appendChild(this.root);
        const background = document.createElementNS(Avionics.SVG.NS, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", width.toString());
        background.setAttribute("height", "20");
        background.setAttribute("fill", "#1a1d21");
        background.setAttribute("fill-opacity", "0.25");
        this.root.appendChild(background);
        this.movingRibbon = document.createElementNS(Avionics.SVG.NS, "g");
        this.root.appendChild(this.movingRibbon);
        this.digits = [];
        for (let i = -8; i <= 8; i++) {
            const digit = document.createElementNS(Avionics.SVG.NS, "text");
            digit.setAttribute("fill", "white");
            digit.setAttribute("text-anchor", "middle");
            digit.setAttribute("x", (center + 20.6 * i).toString());
            digit.setAttribute("y", "16");
            digit.setAttribute("font-size", "8");
            digit.setAttribute("font-family", "Roboto-Bold");
            digit.textContent = "XXX";
            this.movingRibbon.appendChild(digit);
            this.digits.push(digit);
        }
        for (let i = -80; i <= 80; i++) {
            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (center - 0.5 + 2.06 * i).toString());
            rect.setAttribute("y", i % 5 == 0 ? "17" : "18.5");
            rect.setAttribute("width", "1");
            rect.setAttribute("height", i % 5 == 0 ? "3" : "1.5");
            rect.setAttribute("fill", "white");
            this.movingRibbon.appendChild(rect);
        }
        this.courseElement = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.courseElement.setAttribute("points", center + ",20 " + (center + 6) + ",16 " + (center + 10) + ",16 " + (center + 10) + ",20 " + (center - 10) + ",20 " + (center - 10) + ",16 " + (center - 6) + ",16");
        this.courseElement.setAttribute("fill", "aqua");
        this.root.appendChild(this.courseElement);
        const bearingBackground = document.createElementNS(Avionics.SVG.NS, "polygon");
        bearingBackground.setAttribute("points", center + ",20 " + (center + 6) + ",16 " + (center + 14) + ",16 " + (center + 14) + ",0 " + (center - 14) + ",0 " + (center - 14) + ",16 " + (center - 6) + ",16");
        bearingBackground.setAttribute("fill", "black");
        this.root.appendChild(bearingBackground);
        this.bearingText = document.createElementNS(Avionics.SVG.NS, "text");
        this.bearingText.setAttribute("fill", "white");
        this.bearingText.setAttribute("text-anchor", "middle");
        this.bearingText.setAttribute("x", center.toString());
        this.bearingText.setAttribute("y", "13");
        this.bearingText.setAttribute("font-size", "14");
        this.bearingText.setAttribute("font-family", "Roboto-Bold");
        this.bearingText.textContent = "XXX";
        this.root.appendChild(this.bearingText);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "bearing":
                this.bearing = parseFloat(newValue);
                const roundedBearing = Math.round(this.bearing / 10) * 10;
                const bearingString = Math.round(this.bearing).toString();
                this.bearingText.textContent = "000".slice(0, 3 - bearingString.length) + bearingString;
                for (let i = -8; i <= 8; i++) {
                    const string = ((roundedBearing + i * 10 + 360) % 360).toString();
                    this.digits[i + 8].textContent = "000".slice(0, 3 - string.length) + string;
                }
                this.movingRibbon.setAttribute("transform", "translate(" + ((roundedBearing - this.bearing) * 2.06) + ",0)");
                this.courseElement.setAttribute("transform", "translate(" + ((this.course - this.bearing) * 2.06) + ",0)");
                break;
            case "course-active":
                if (newValue == "True") {
                    this.courseElement.setAttribute("visibility", "");
                } else {
                    this.courseElement.setAttribute("visibility", "hidden");
                }
                break;
            case "course":
                this.course = parseFloat(newValue);
                this.courseElement.setAttribute("transform", "translate(" + ((this.course - this.bearing) * 2.06) + ",0)");
                break;
        }
    }
}
customElements.define('glasscockpit-horizontal-compass', HorizontalCompass);
//# sourceMappingURL=HorizontalCompass.js.map