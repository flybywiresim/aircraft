class SvgRailwayElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.ident = "Bdx-Medoc";
    }
    id(map) {
        return "railway-" + this.ident + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        const shape = document.createElementNS(Avionics.SVG.NS, "polyline");
        shape.classList.add("map-railway");
        shape.setAttribute("stroke", map.config.railwayStrokeColor);
        shape.setAttribute("stroke-width", fastToFixed(map.config.railwayWidth, 0));
        shape.setAttribute("fill", "none");
        container.appendChild(shape);
        const shapeRail = document.createElementNS(Avionics.SVG.NS, "polyline");
        shapeRail.classList.add("map-railway");
        shapeRail.setAttribute("stroke", map.config.railwayStrokeColor);
        shapeRail.setAttribute("stroke-width", fastToFixed((map.config.railwayWidth * 3), 0));
        shapeRail.setAttribute("stroke-dasharray", map.config.railwayWidth + " " + map.config.railwayDashLength);
        shapeRail.setAttribute("fill", "none");
        container.appendChild(shapeRail);
        return container;
    }
    updateDraw(map) {
        let points = "";
        const pos = new Vec2();
        this.path.forEach((p) => {
            map.coordinatesToXYToRef(p, pos);
            points += fastToFixed(pos.x, 0) + "," + fastToFixed(pos.y, 0) + " ";
        });
        this.svgElement.children[0].setAttribute("points", points);
        this.svgElement.children[1].setAttribute("points", points);
    }
}
//# sourceMappingURL=SvgRailwayElement.js.map