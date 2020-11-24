class SvgRoadElement extends SvgMapElement {
    constructor(type, path) {
        super();
        this.lod = 1;
        this.ident = "UKNWN";
        this._mnhtSummedLength = 0;
        this.ident += "-" + fastToFixed((SvgRoadElement.roadIndex++), 0);
        if (isFinite(type)) {
            this.roadType = type;
        }
        if (path) {
            this.path = path;
            if (this.path.length > 1) {
                let pi = this.path[0];
                let pi1;
                for (let i = 1; i < this.path.length; i++) {
                    pi1 = this.path[i];
                    this._mnhtSummedLength += Math.abs(pi.lat - pi1.lat) + Math.abs(pi.long - pi1.long);
                    pi = pi1;
                }
            }
        }
    }
    get mnhtSummedLength() {
        if (isNaN(this._mnhtSummedLength)) {
            return 0;
        }
        return this._mnhtSummedLength;
    }
    get start() {
        return this.path[0];
    }
    get end() {
        return this.path[this.path.length - 1];
    }
    id(map) {
        return "road-" + this.ident + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        const shape = document.createElementNS(Avionics.SVG.NS, "path");
        shape.classList.add("map-road");
        shape.classList.add("map-road-" + this.roadType);
        shape.setAttribute("fill", "none");
        shape.setAttribute("stroke", "gray");
        shape.setAttribute("stroke-width", "3");
        container.appendChild(shape);
        return container;
    }
    updateDraw(map) {
        const pCenter = new Vec2(0, 0);
        let outOfFrame = true;
        let points = "";
        const pos = new Vec2();
        const s1 = new Vec2();
        const s2 = new Vec2();
        let p1 = null;
        let p2 = null;
        let first = true;
        let prevWasClipped = false;
        for (let i = 0; i < this.path.length; i++) {
            map.coordinatesToXYToRef(this.path[i], pos);
            if (!pos || isNaN(pos.x) || isNaN(pos.y)) {
                continue;
            }
            pCenter.x += pos.x;
            pCenter.y += pos.y;
            if (!p1) {
                p1 = pos;
                continue;
            }
            p2 = pos;
            if (p1.x != p2.x || p1.y != p2.y) {
                if (map.segmentVsFrame(p1, p2, s1, s2)) {
                    const x1 = fastToFixed(s1.x, 0);
                    const y1 = fastToFixed(s1.y, 0);
                    const x2 = fastToFixed(s2.x, 0);
                    const y2 = fastToFixed(s2.y, 0);
                    if (first || prevWasClipped) {
                        points += "M" + x1 + " " + y1 + " L" + x2 + " " + y2 + " ";
                    } else {
                        points += "L" + x2 + " " + y2 + " ";
                    }
                    first = false;
                    prevWasClipped = (s2.Equals(p2)) ? false : true;
                    outOfFrame = false;
                } else {
                    prevWasClipped = true;
                }
            }
        }
        const polyline = this.svgElement.children[0];
        if (polyline instanceof SVGPathElement) {
            polyline.setAttribute("d", points);
        }
        const text = this.svgElement.children[1];
        if (text instanceof SVGTextElement) {
            const c1 = this.path[Math.floor(this.path.length / 2)];
            const c2 = this.path[Math.ceil(this.path.length / 2)];
            if (c1 && c2) {
                const p1 = map.coordinatesToXY(c1);
                const p2 = map.coordinatesToXY(c2);
                pCenter.x = (p1.x + p2.x) * 0.5;
                pCenter.y = (p1.y + p2.y) * 0.5;
            } else if (c1) {
                const p1 = map.coordinatesToXY(c1);
                pCenter.x = p1.x;
                pCenter.y = p1.y;
            } else if (c2) {
                const p2 = map.coordinatesToXY(c2);
                pCenter.x = p2.x;
                pCenter.y = p2.y;
            }
            if (isFinite(pCenter.x) && isFinite(pCenter.y)) {
                text.setAttribute("x", fastToFixed(pCenter.x, 0));
                text.setAttribute("y", fastToFixed(pCenter.y, 0));
            }
        }
        if (outOfFrame) {
            if (this.onDrawOutOfFrame) {
                this.onDrawOutOfFrame();
            }
        }
    }
    isEqual(other, epsilon = 0.0001) {
        let dStart = Math.abs(this.start.lat - other.start.lat) + Math.abs(this.start.long - other.start.long);
        if (dStart < epsilon) {
            const dEnd = Math.abs(this.end.lat - other.end.lat) + Math.abs(this.end.long - other.end.long);
            if (dEnd < epsilon) {
                return true;
            }
        } else {
            dStart = Math.abs(this.start.lat - other.end.lat) + Math.abs(this.start.long - other.end.long);
            if (dStart < epsilon) {
                const dEnd = Math.abs(this.end.lat - other.start.lat) + Math.abs(this.end.long - other.start.long);
                if (dEnd < epsilon) {
                    return true;
                }
            }
        }
        return false;
    }
}
SvgRoadElement.roadIndex = 0;
//# sourceMappingURL=SvgRoadElement.js.map