class ElevatorTrim extends HTMLElement {
    static get observedAttributes() {
        return [
            "trim"
        ];
    }
    constructor() {
        super();
    }
    connectedCallback() {
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 30 100");
        this.appendChild(this.root);
        const background = document.createElementNS(Avionics.SVG.NS, "rect");
        background.setAttribute("x", "0");
        background.setAttribute("y", "0");
        background.setAttribute("width", "30");
        background.setAttribute("height", "100");
        background.setAttribute("fill", "#1a1d21");
        background.setAttribute("fill-opacity", "0.25");
        this.root.appendChild(background);
        const leftbar = document.createElementNS(Avionics.SVG.NS, "rect");
        leftbar.setAttribute("x", "3");
        leftbar.setAttribute("y", "20");
        leftbar.setAttribute("height", "60");
        leftbar.setAttribute("width", "2");
        leftbar.setAttribute("fill", "white");
        this.root.appendChild(leftbar);
        const topBar = document.createElementNS(Avionics.SVG.NS, "rect");
        topBar.setAttribute("x", "3");
        topBar.setAttribute("y", "20");
        topBar.setAttribute("height", "2");
        topBar.setAttribute("width", "20");
        topBar.setAttribute("fill", "white");
        this.root.appendChild(topBar);
        const bottomBar = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBar.setAttribute("x", "3");
        bottomBar.setAttribute("y", "78");
        bottomBar.setAttribute("height", "2");
        bottomBar.setAttribute("width", "20");
        bottomBar.setAttribute("fill", "white");
        this.root.appendChild(bottomBar);
        const dnText = document.createElementNS(Avionics.SVG.NS, "text");
        dnText.setAttribute("x", "6");
        dnText.setAttribute("y", "15");
        dnText.setAttribute("font-family", "Roboto-Bold");
        dnText.setAttribute("font-size", "15");
        dnText.setAttribute("fill", "white");
        dnText.textContent = "DN";
        this.root.appendChild(dnText);
        const upText = document.createElementNS(Avionics.SVG.NS, "text");
        upText.setAttribute("x", "6");
        upText.setAttribute("y", "95");
        upText.setAttribute("font-family", "Roboto-Bold");
        upText.setAttribute("font-size", "15");
        upText.setAttribute("fill", "white");
        upText.textContent = "UP";
        this.root.appendChild(upText);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "g");
        this.root.appendChild(this.cursor);
        const cursorBg = document.createElementNS(Avionics.SVG.NS, "polygon");
        cursorBg.setAttribute("points", "5,50 20,42 20,58");
        cursorBg.setAttribute("fill", "white");
        this.cursor.appendChild(cursorBg);
        const cursorText = document.createElementNS(Avionics.SVG.NS, "text");
        cursorText.setAttribute("x", "12");
        cursorText.setAttribute("y", "54");
        cursorText.setAttribute("font-family", "Roboto-Bold");
        cursorText.setAttribute("font-size", "10");
        cursorText.setAttribute("fill", "black");
        cursorText.textContent = "E";
        this.cursor.appendChild(cursorText);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue) {
            return;
        }
        switch (name) {
            case "trim":
                this.cursor.setAttribute("transform", "translate(0," + (parseFloat(newValue) * 30) + ")");
                break;
        }
    }
}
customElements.define('glasscockpit-elevator-trim', ElevatorTrim);
//# sourceMappingURL=ElevatorTrim.js.map