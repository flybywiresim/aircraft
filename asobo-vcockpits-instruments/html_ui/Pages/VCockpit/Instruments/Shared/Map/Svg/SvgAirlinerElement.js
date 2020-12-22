class SvgAirlinerPlanElement extends SvgMapElement {
    constructor() {
        super();
    }
    id(map) {
        return "airliner-plan-map-" + map.index;
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("width", "1");
        container.setAttribute("height", "1");
        container.setAttribute("overflow", "visible");
        this._wideRange = document.createElementNS(Avionics.SVG.NS, "circle");
        this._wideRange.setAttribute("cx", "500");
        this._wideRange.setAttribute("cy", "500");
        this._wideRange.setAttribute("r", "222");
        this._wideRange.setAttribute("fill", "none");
        this._wideRange.setAttribute("stroke", "white");
        this._wideRange.setAttribute("stroke-width", "1");
        container.appendChild(this._wideRange);
        const segCount = 30;
        for (let i = 0; i < segCount; i++) {
            const segment = document.createElementNS(Avionics.SVG.NS, "line");
            segment.setAttribute("stroke", "white");
            segment.setAttribute("stroke-width", "1");
            const a1 = 2 * i * 2 * Math.PI / (2 * segCount);
            const a2 = (2 * i + 1) * 2 * Math.PI / (2 * segCount);
            const x1 = 500 + 111 * Math.cos(a1);
            const y1 = 500 + 111 * Math.sin(a1);
            const x2 = 500 + 111 * Math.cos(a2);
            const y2 = 500 + 111 * Math.sin(a2);
            segment.setAttribute("x1", x1.toFixed(0));
            segment.setAttribute("y1", y1.toFixed(0));
            segment.setAttribute("x2", x2.toFixed(0));
            segment.setAttribute("y2", y2.toFixed(0));
            container.appendChild(segment);
        }
        for (let i = 0; i < 4; i++) {
            const a = i * Math.PI / 2;
            const cosa = Math.cos(a);
            const sina = Math.sin(a);
            const polygon = document.createElementNS(Avionics.SVG.NS, "polygon");
            polygon.setAttribute("fill", "white");
            polygon.setAttribute("points", (-10 * cosa - 212 * sina + 500).toFixed(0) + "," +
                (-10 * sina + 212 * cosa + 500).toFixed(0) + " " +
                (-222 * sina + 500).toFixed(0) + "," +
                (222 * cosa + 500).toFixed(0) + " " +
                (10 * cosa - 212 * sina + 500).toFixed(0) + "," +
                (10 * sina + 212 * cosa + 500).toFixed(0) + " ");
            container.appendChild(polygon);
        }
        const northMark = document.createElementNS(Avionics.SVG.NS, "text");
        northMark.setAttribute("x", "500");
        northMark.setAttribute("y", "310");
        northMark.setAttribute("text-anchor", "middle");
        northMark.setAttribute("fill", "white");
        northMark.setAttribute("font-size", "20");
        northMark.textContent = "N";
        container.appendChild(northMark);
        const eastMark = document.createElementNS(Avionics.SVG.NS, "text");
        eastMark.setAttribute("x", "700");
        eastMark.setAttribute("y", "505");
        eastMark.setAttribute("text-anchor", "middle");
        eastMark.setAttribute("fill", "white");
        eastMark.setAttribute("font-size", "20");
        eastMark.textContent = "E";
        container.appendChild(eastMark);
        const southMark = document.createElementNS(Avionics.SVG.NS, "text");
        southMark.setAttribute("x", "500");
        southMark.setAttribute("y", "705");
        southMark.setAttribute("text-anchor", "middle");
        southMark.setAttribute("fill", "white");
        southMark.setAttribute("font-size", "20");
        southMark.textContent = "S";
        container.appendChild(southMark);
        const westMark = document.createElementNS(Avionics.SVG.NS, "text");
        westMark.setAttribute("x", "300");
        westMark.setAttribute("y", "505");
        westMark.setAttribute("text-anchor", "middle");
        westMark.setAttribute("fill", "white");
        westMark.setAttribute("font-size", "20");
        westMark.textContent = "W";
        container.appendChild(westMark);
        return container;
    }
    updateDraw(map) {
    }
}
//# sourceMappingURL=SvgAirlinerElement.js.map