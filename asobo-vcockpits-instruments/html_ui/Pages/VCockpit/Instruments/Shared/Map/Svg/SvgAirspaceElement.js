class StringedVec2 {
    constructor(a, b, c) {
        if (typeof (a) === "string" && typeof (b) === "string") {
            this.x = a;
            this.y = b;
        }
        else if (a && typeof (a.x) === "number" && typeof (a.y) === "number") {
            let decimals = 1;
            if (typeof (b) === "number") {
                decimals = b;
            }
            this.x = fastToFixed(a.x, decimals);
            this.y = fastToFixed(a.y, decimals);
        }
        else if (typeof (a) === "number" && typeof (b) === "number") {
            let decimals = 1;
            if (typeof (c) === "number") {
                decimals = c;
            }
            this.x = fastToFixed(a, decimals);
            this.y = fastToFixed(b, decimals);
        }
    }
}
class SvgAirspaceElementPathStep {
    constructor(t, p, r) {
        this.t = t;
        this.p = p;
        this.r = r;
        this.pFixed = new StringedVec2(p, 0);
    }
}
class SvgAirspaceElement extends SvgMapElement {
    constructor() {
        super();
        this.ident = "BOD";
        this.class = "MOA";
        this.path = [];
        this._tmpDP = new Vec2();
        this._tmpDN = new Vec2();
        this.distanceForUpdate = 1.5 + 3.5 * Math.random();
    }
    id(map) {
        if (this.source) {
            return "airspace-" + this.source.ident + "-map-" + map.index;
        }
        return "airspace-" + this.ident + "-map-" + map.index;
    }
    getLatLongPath() {
        let path = [];
        if (this.source && this.source.geometry) {
            let splitGeometry = this.source.geometry.split(" ");
            for (let i = 0; i < splitGeometry.length; i++) {
                let point = splitGeometry[i];
                let splitPoint = point.split(":");
                if (point !== "X") {
                    let type = parseInt(splitPoint[0]);
                    if (type === 1 || type === 2) {
                        let sLat = splitPoint[1];
                        let sLong = splitPoint[2];
                        path.push(new LatLong(parseFloat(sLat), parseFloat(sLong)));
                    }
                }
            }
        }
        return path;
    }
    createDraw(map) {
        let shape = document.createElementNS(Avionics.SVG.NS, "path");
        shape.id = this.id(map);
        shape.setAttribute("fill", "none");
        if (this.source.type === 1) {
            shape.setAttribute("stroke-width", "2");
            shape.setAttribute("stroke", "red");
        }
        else if (this.source.type === 3) {
            shape.setAttribute("stroke-width", "2");
            shape.setAttribute("stroke", "#0b80fa");
        }
        else if (this.source.type === 4) {
            shape.setAttribute("stroke-width", "2");
            shape.setAttribute("stroke", "#bb09c5");
        }
        else if (this.source.type === 5) {
            shape.setAttribute("stroke-width", "2");
            shape.setAttribute("stroke", "#a0bcee");
        }
        else if (this.source.type === 15) {
            shape.setAttribute("stroke-width", "3");
            shape.setAttribute("stroke", "#0b80fa");
        }
        else if (this.source.type === 16) {
            shape.setAttribute("stroke-width", "3");
            shape.setAttribute("stroke", "#580982");
        }
        else {
            shape.setAttribute("stroke", "#f99509");
        }
        return shape;
    }
    updateDraw(map) {
        let d = "";
        let isInFrame = false;
        if (this.source && this.source.segments) {
            for (let i = 0; i < this.source.segments.length; i++) {
                let p = this.source.segments[i];
                if (this.path[i]) {
                    if (i === 0) {
                        let newP = map.coordinatesToXY(p);
                        if ((Math.abs(this.path[i].p.x - newP.x) + Math.abs(this.path[i].p.y - newP.y)) < this.distanceForUpdate) {
                            return;
                        }
                    }
                    map.coordinatesToXYToRef(p, this.path[i].p);
                }
                else {
                    this.path.push(new SvgAirspaceElementPathStep(i === 0 ? 1 : 2, map.coordinatesToXY(p), 1));
                }
            }
            if (this.path.length >= 2) {
                let cX = this.path[0].p.x;
                let cY = this.path[0].p.y;
                if (map.isVec2InFrame(this.path[0].p)) {
                    isInFrame = true;
                }
                let minX = cX;
                let maxX = cX;
                let minY = cY;
                let maxY = cY;
                for (let i = 1; i < this.path.length; i++) {
                    let x = this.path[i].p.x;
                    let y = this.path[i].p.y;
                    cX += x;
                    cY += y;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
                cX /= this.path.length;
                cY /= this.path.length;
                let size = Math.max(maxX - minX, maxY - minY);
                let ratio = (size - 15) / size;
                for (let i = 0; i < this.path.length; i++) {
                    let x = this.path[i].p.x;
                    let y = this.path[i].p.y;
                    this.path[i].p.x = cX + ratio * (x - cX);
                    this.path[i].p.y = cY + ratio * (y - cY);
                    this.path[i].pFixed = new StringedVec2(this.path[i].p, 0);
                }
            }
        }
        if (this.path && isInFrame) {
            for (let i = 0; i < this.path.length; i++) {
                let p = this.path[i];
                if (p.t === 1 || (p.t === 3 && this.path.length === 2)) {
                    d += "M " + p.pFixed.x + " " + p.pFixed.y + " ";
                }
                else if (p.t === 2) {
                    d += "L " + p.pFixed.x + " " + p.pFixed.y + " ";
                }
                else if (p.t === 4 || p.t === 5) {
                    let pPrev = this.path[i - 1];
                    this._tmpDP.x = pPrev.p.x - p.p.x;
                    this._tmpDP.y = pPrev.p.y - p.p.y;
                    this._tmpDN.x = pPrev.p.x - p.p.x;
                    this._tmpDP.y = pPrev.p.y - p.p.y;
                    let dist = (p.p.x - pPrev.p.x) * (p.p.x - pPrev.p.x);
                    dist += (p.p.y - pPrev.p.y) * (p.p.y - pPrev.p.y);
                    let distFixed = fastToFixed(Math.sqrt(dist), 0);
                    d += "A " + distFixed + " " + distFixed + " 0 0 " + (p.t === 4 ? 1 : 0) + " " + p.pFixed.x + " " + p.pFixed.y + " ";
                }
                else if (p.t === 6) {
                    let pPrev = this.path[i - 1];
                    let r = map.NMToPixels(p.r / 1800);
                    d = "M " + fastToFixed(pPrev.p.x, 1) + " " + fastToFixed((pPrev.p.y + r), 1) + " ";
                    d += "A " + fastToFixed(r, 0) + " " + fastToFixed(r, 0) + " 0 1 1 " + fastToFixed(pPrev.p.x, 1) + " " + fastToFixed((pPrev.p.y + r), 1);
                    this.source.type = 42;
                    i = Infinity;
                }
            }
        }
        this.svgElement.setAttribute("d", d);
    }
}
//# sourceMappingURL=SvgAirspaceElement.js.map