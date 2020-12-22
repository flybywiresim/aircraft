class SvgAirportElement extends SvgMapElement {
    get ident() {
        if (this._ident) {
            return this._ident;
        }
        if (this.source) {
            return this.source.ident;
        }
    }
    set ident(v) {
        this._ident = v;
    }
    get icao() {
        if (this._icao) {
            return this._icao;
        }
        if (this.source) {
            return this.source.icao;
        }
    }
    set icao(v) {
        this._icao = v;
    }
    get coordinates() {
        if (this._coordinates) {
            return this._coordinates;
        }
        if (this.source) {
            return this.source.coordinates;
        }
    }
    set coordinates(v) {
        this._coordinates = v;
    }
    get runways() {
        if (this._runways) {
            return this._runways;
        }
        if (this.source) {
            return this.source.runways;
        }
    }
    set runways(v) {
        this._runways = v;
    }
    constructor() {
        super();
        this._tmpCenter = new Vec2();
    }
    id(map) {
        return "airport-" + this.icao + "-map-" + map.index;
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        return container;
    }
    updateDraw(map) {
        console.log(this.runways.length);
        for (let i = 0; i < this.runways.length; i++) {
            let rectStroke = this.svgElement.children[i];
            if (!rectStroke) {
                rectStroke = document.createElementNS(Avionics.SVG.NS, "rect");
                rectStroke.setAttribute("stroke-width", fastToFixed(map.config.runwayStrokeWidth, 0));
                this.svgElement.appendChild(rectStroke);
            }
            rectStroke.setAttribute("stroke", map.config.runwayStrokeColor);
            rectStroke.setAttribute("rx", fastToFixed(map.config.runwayCornerRadius, 0));
            rectStroke.setAttribute("ry", fastToFixed(map.config.runwayCornerRadius, 0));
        }
        for (let i = 0; i < this.runways.length; i++) {
            const runway = this.runways[i];
            const rectStroke = this.svgElement.children[i];
            let rectNoStroke = this.svgElement.children[i + this.runways.length];
            if (!rectNoStroke) {
                rectNoStroke = document.createElementNS(Avionics.SVG.NS, "rect");
                rectNoStroke.setAttribute("stroke-width", fastToFixed(map.config.runwayStrokeWidth, 0));
                this.svgElement.appendChild(rectNoStroke);
            }
            rectNoStroke.setAttribute("fill", map.config.runwayFillColor);
            rectNoStroke.setAttribute("stroke", "none");
            rectNoStroke.setAttribute("rx", fastToFixed(map.config.runwayCornerRadius, 0));
            rectNoStroke.setAttribute("ry", fastToFixed(map.config.runwayCornerRadius, 0));
            map.coordinatesToXYToRef(new LatLongAlt(runway.latitude, runway.longitude), this._tmpCenter);
            const l = map.feetsToPixels(runway.length);
            const w = Math.max(map.feetsToPixels(runway.width), map.config.runwayMinimalWidth);
            const x = fastToFixed((this._tmpCenter.x - w * 0.5), 0);
            const y = fastToFixed((this._tmpCenter.y - l * 0.5), 0);
            const width = fastToFixed(w, 0);
            const height = fastToFixed(l, 0);
            const transform = "rotate(" +
                fastToFixed((runway.direction), 0) + " " +
                fastToFixed((this._tmpCenter.x), 0) + " " +
                fastToFixed((this._tmpCenter.y), 0) + ")";
            rectStroke.setAttribute("x", "" + x);
            rectStroke.setAttribute("y", "" + y);
            rectStroke.setAttribute("width", "" + width);
            rectStroke.setAttribute("height", "" + height);
            rectStroke.setAttribute("transform", transform);
            rectNoStroke.setAttribute("x", "" + x);
            rectNoStroke.setAttribute("y", "" + y);
            rectNoStroke.setAttribute("width", "" + width);
            rectNoStroke.setAttribute("height", "" + height);
            rectNoStroke.setAttribute("transform", transform);
        }
        while (this.svgElement.children.length > this.runways.length * 2) {
            this.svgElement.removeChild(this.svgElement.lastElementChild);
        }
    }
}
//# sourceMappingURL=SvgAirportElement.js.map