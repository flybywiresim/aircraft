class SvgMap {
    constructor(_root, arg) {
        this._maxUpdateTime = 0;
        this._lastMaxUpdateTime = 0;
        this._mediumUpdateTime = 0;
        this._iterations = 0;
        this.configLoaded = false;
        this.rotateWithPlane = false;
        this.lineCanvasClipping = new Avionics.Intersect();
        this.mapElements = [];
        this._elementsWithTextBox = [];
        this._previousCenterCoordinates = [];
        this.planeDirection = 0;
        this.planeDirectionRadian = 0;
        this.planeAltitude = 0;
        this._ratio = 1;
        this._NMWidth = 100;
        this._ftWidth = 0;
        this._angularHeight = 0;
        this._angularWidth = 0;
        this._angularWidthNorth = 0;
        this._angularWidthSouth = 0;
        this._frameClipping = new Avionics.Intersect();
        this._bottomLeftCoordinates = new LatLongAlt();
        this._topRightCoordinates = new LatLongAlt();
        this.index = SvgMap.Index;
        console.log("New SvgMap of index " + this.index);
        SvgMap.Index++;
        this.htmlRoot = _root;
        this._planeXY = new Vec2(0.5, 0.5);
        let configPath = "./";
        let elementId = "MapSVG";
        if (typeof (arg) === "string") {
            configPath = arg;
        } else if (arg) {
            if (arg.svgElement instanceof Element) {
                this._svgHtmlElement = arg.svgElement;
            } else if (typeof (arg.svgElementId) === "string") {
                elementId = arg.svgElementId;
            }
            if (typeof (arg.configPath) === "string") {
                configPath = arg.configPath;
            }
        }
        if (!this._svgHtmlElement) {
            this._svgHtmlElement = _root.querySelector("#" + elementId);
        }
        this.svgHtmlElement.setAttribute("viewBox", "0 0 1000 1000");
        this._frameClipping.initRect(1000, 1000);
        const loadConfig = () => {
            if (typeof (SvgMapConfig) !== "undefined") {
                this.config = new SvgMapConfig();
                this.config.load(configPath, () => {
                    this.configLoaded = true;
                });
            } else {
                setTimeout(loadConfig, 200);
            }
        };
        loadConfig();
    }
    get svgHtmlElement() {
        return this._svgHtmlElement;
    }
    get lineCanvas() {
        return this._lineCanvas;
    }
    set lineCanvas(_canvas) {
        this._lineCanvas = _canvas;
        if (_canvas) {
            this.lineCanvasClipping.initRect(_canvas.width, _canvas.height);
        }
    }
    get lastCenterCoordinates() {
        if (this._previousCenterCoordinates.length <= 0) {
            return null;
        }
        return this._previousCenterCoordinates[this._previousCenterCoordinates.length - 1];
    }
    get centerCoordinates() {
        if (this._previousCenterCoordinates.length <= 0) {
            return null;
        }
        return this._previousCenterCoordinates[0];
    }
    setCenterCoordinates(a, b, c) {
        if (a === undefined) {
            return;
        }
        let lat = NaN;
        let long = NaN;
        if ((a instanceof LatLong) || (a instanceof LatLongAlt) || (typeof (a.lat) === "number" && typeof (a.long) === "number")) {
            lat = a.lat;
            long = a.long;
        } else if (typeof (a) === "number" && typeof (b) === "number") {
            if (isFinite(a)) {
                lat = a;
            }
            if (isFinite(b)) {
                long = b;
            }
        }
        if (isFinite(lat) && isFinite(long)) {
            if (!isFinite(c)) {
                c = 5;
            }
            this._previousCenterCoordinates.push(new LatLong(lat, long));
            while (this._previousCenterCoordinates.length > c) {
                this._previousCenterCoordinates.splice(0, 1);
            }
        }
    }
    get planeCoordinates() {
        return this._planeCoordinates;
    }
    setPlaneCoordinates(a, b, c) {
        if (a === undefined) {
            return false;
        }
        let lat = NaN;
        let long = NaN;
        let smoothness = 0;
        let unsmoothedMove = false;
        if (((a instanceof LatLong) || (a instanceof LatLongAlt)) && (typeof (a.lat) === "number" && typeof (a.long) === "number")) {
            lat = a.lat;
            long = a.long;
            if (isFinite(b)) {
                smoothness = Math.min(1, Math.max(b, 0));
            }
        } else if (typeof (a) === "number" && typeof (b) === "number") {
            if (isFinite(a)) {
                lat = a;
            }
            if (isFinite(b)) {
                long = b;
            }
            if (isFinite(c)) {
                smoothness = Math.min(1, Math.max(c, 0));
            }
        }
        if (isFinite(lat) && isFinite(long)) {
            if (!this._planeCoordinates) {
                this._planeCoordinates = new LatLong(lat, long);
            } else {
                if (Math.abs(this._planeCoordinates.lat - lat) > 0.01 || Math.abs(this._planeCoordinates.long - long) > 0.01) {
                    this._planeCoordinates.lat = lat;
                    this._planeCoordinates.long = long;
                    if (Math.abs(this._planeCoordinates.lat - lat) > 0.5 || Math.abs(this._planeCoordinates.long - long) > 0.5) {
                        unsmoothedMove = true;
                    }
                } else {
                    this._planeCoordinates.lat *= smoothness;
                    this._planeCoordinates.lat += lat * (1 - smoothness);
                    this._planeCoordinates.long *= smoothness;
                    this._planeCoordinates.long += long * (1 - smoothness);
                }
            }
        }
        return unsmoothedMove;
    }
    get NMWidth() {
        return this._NMWidth;
    }
    set NMWidth(v) {
        if (this.NMWidth !== v) {
            this._NMWidth = v;
            this.computeCoordinates();
        }
    }
    setRange(r) {
        if (this._ratio < 1) {
            this.NMWidth = r / this._ratio;
        } else {
            this.NMWidth = r * this._ratio;
        }
    }
    computeCoordinates() {
        this._ftWidth = 6076.11 * this._NMWidth;
        if (this.centerCoordinates) {
            const centerCoordinates = this.centerCoordinates;
            this._angularWidth = this._NMWidth / 60 / Math.cos(centerCoordinates.lat * Avionics.Utils.DEG2RAD);
            this._angularHeight = this._NMWidth / 60;
            this._bottomLeftCoordinates.lat = centerCoordinates.lat - this._angularHeight * 0.5;
            this._bottomLeftCoordinates.long = centerCoordinates.long - this._angularWidth * 0.5;
            this._topRightCoordinates.lat = centerCoordinates.lat + this._angularHeight * 0.5;
            this._topRightCoordinates.long = centerCoordinates.long + this._angularWidth * 0.5;
            this._angularWidthNorth = this._NMWidth / 60 / Math.cos(this._topRightCoordinates.lat * Avionics.Utils.DEG2RAD);
            this._angularWidthSouth = this._NMWidth / 60 / Math.cos(this._bottomLeftCoordinates.lat * Avionics.Utils.DEG2RAD);
        }
    }
    get angularWidth() {
        return this._angularWidth;
    }
    get angularHeight() {
        return this._angularHeight;
    }
    get ftWidth() {
        return this._ftWidth;
    }
    get bottomLeftCoordinates() {
        return this._bottomLeftCoordinates;
    }
    get topRightCoordinates() {
        return this._topRightCoordinates;
    }
    update() {
        if (!this.configLoaded) {
            return;
        }
        this.htmlRoot.onBeforeMapRedraw();
        if (!this.centerCoordinates) {
            return;
        }
        if (!this.flightPlanLayer) {
            this.flightPlanLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.flightPlanLayer);
        }
        if (!this.defaultLayer) {
            this.defaultLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.defaultLayer);
        }
        if (!this.textLayer) {
            this.textLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.textLayer);
        }
        if (!this.maskLayer) {
            this.maskLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.maskLayer);
        }
        if (!this.planeLayer) {
            this.planeLayer = document.createElementNS(Avionics.SVG.NS, "g");
            this.svgHtmlElement.appendChild(this.planeLayer);
        }
        let newPlaneDirectionDeg = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "radians");
        newPlaneDirectionDeg *= 180 / Math.PI;
        while (newPlaneDirectionDeg < 0) {
            newPlaneDirectionDeg += 360;
        }
        while (newPlaneDirectionDeg >= 360) {
            newPlaneDirectionDeg -= 360;
        }
        this.planeDirection = newPlaneDirectionDeg;
        this.planeDirectionRadian = -this.planeDirection / 180 * Math.PI;
        this.cosPlaneDirection = Math.cos(this.planeDirectionRadian);
        this.sinPlaneDirection = Math.sin(this.planeDirectionRadian);
        this.planeAltitude = SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet");
        const w = this.htmlRoot.getWidth();
        const h = this.htmlRoot.getHeight();
        const r = w / h;
        if (isFinite(r) && r > 0) {
            this._ratio = r;
        }
        if (this._lastW !== w || this._lastH !== h) {
            this._lastW = w;
            this._lastH = h;
            this.resize(w, h);
        }
        this.computeCoordinates();
        let t0 = 0;
        if (SvgMap.LOG_PERFS) {
            t0 = performance.now();
        }
        ;
        for (let i = 0; i < this.planeLayer.children.length; i++) {
            this.planeLayer.children[i].setAttribute("needDeletion", "true");
        }
        for (let i = 0; i < this.maskLayer.children.length; i++) {
            this.maskLayer.children[i].setAttribute("needDeletion", "true");
        }
        for (let i = 0; i < this.defaultLayer.children.length; i++) {
            this.defaultLayer.children[i].setAttribute("needDeletion", "true");
        }
        for (let i = 0; i < this.flightPlanLayer.children.length; i++) {
            this.flightPlanLayer.children[i].setAttribute("needDeletion", "true");
        }
        if (this.lineCanvas) {
            this.lineCanvas.getContext("2d").clearRect(0, 0, this.lineCanvas.width, this.lineCanvas.height);
        }
        for (let i = 0; i < this.mapElements.length; i++) {
            const svgElement = this.mapElements[i].draw(this);
            svgElement.setAttribute("needDeletion", "false");
        }
        let i = 0;
        while (i < this.planeLayer.children.length) {
            const e = this.planeLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.planeLayer.removeChild(e);
            } else {
                i++;
            }
        }
        i = 0;
        while (i < this.defaultLayer.children.length) {
            const e = this.defaultLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.defaultLayer.removeChild(e);
                if (e.getAttribute("hasTextBox") === "true") {
                    const textElement = this.htmlRoot.querySelector("#" + e.id + "-text-" + this.index);
                    if (textElement) {
                        this.textLayer.removeChild(textElement);
                    }
                    const rectElement = this.htmlRoot.querySelector("#" + e.id + "-rect-" + this.index);
                    if (rectElement) {
                        this.textLayer.removeChild(rectElement);
                    }
                }
            } else {
                i++;
            }
        }
        i = 0;
        while (i < this.flightPlanLayer.children.length) {
            const e = this.flightPlanLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.flightPlanLayer.removeChild(e);
            } else {
                i++;
            }
        }
        i = 0;
        while (i < this.maskLayer.children.length) {
            const e = this.maskLayer.children[i];
            if (e.getAttribute("needDeletion") === "true") {
                this.maskLayer.removeChild(e);
            } else {
                i++;
            }
        }
        if (this.config.preventLabelOverlap) {
            this._elementsWithTextBox = [];
            for (let i = 0; i < this.mapElements.length; i++) {
                const e = this.mapElements[i];
                if (e instanceof SvgNearestAirportElement) {
                    this._elementsWithTextBox.push(e);
                } else if (e instanceof SvgWaypointElement) {
                    this._elementsWithTextBox.push(e);
                } else if (e instanceof SvgConstraintElement) {
                    this._elementsWithTextBox.push(e);
                }
            }
            if (!this.textManager) {
                this.textManager = new SvgTextManager();
            }
            this.textManager.update(this, this._elementsWithTextBox);
        }
        if (SvgMap.LOG_PERFS) {
            const dt = performance.now() - t0;
            this._iterations += 1;
            this._mediumUpdateTime *= 99 / 100;
            this._mediumUpdateTime += dt / 100;
            this._maxUpdateTime = Math.max(dt, this._maxUpdateTime);
            this._lastMaxUpdateTime = Math.max(dt, this._lastMaxUpdateTime);
            if (this._iterations >= 60) {
                console.log("-----------------------------------------------");
                console.log("Medium Update Time   " + this._mediumUpdateTime.toFixed(3) + " ms");
                console.log("Last Max Update Time " + this._lastMaxUpdateTime.toFixed(3) + " ms");
                console.log("Max Update Time      " + this._maxUpdateTime.toFixed(3) + " ms");
                console.log("-----------------------------------------------");
                this._lastMaxUpdateTime = 0;
                this._iterations = 0;
                SvgMapElement.logPerformances();
            }
        }
    }
    appendChild(mapElement, svgElement) {
        if (mapElement instanceof SvgAirplaneElement) {
            this.planeLayer.appendChild(svgElement);
        } else if (mapElement instanceof SvgMaskElement) {
            this.maskLayer.appendChild(svgElement);
        } else if (mapElement instanceof SvgFlightPlanElement) {
            this.flightPlanLayer.appendChild(svgElement);
        } else if (mapElement instanceof SvgBackOnTrackElement) {
            this.flightPlanLayer.appendChild(svgElement);
        } else if (mapElement instanceof SvgWaypointElement) {
            this.defaultLayer.appendChild(svgElement);
            if (mapElement._label) {
                this.textLayer.appendChild(mapElement._label);
            }
            mapElement.needRepaint = true;
        } else {
            this.defaultLayer.appendChild(svgElement);
        }
    }
    resize(w, h) {
        console.log("SvgMap Resize : " + w + " " + h);
        const max = Math.max(w, h);
        this.svgHtmlElement.setAttribute("width", fastToFixed(max, 0) + "px");
        this.svgHtmlElement.setAttribute("height", fastToFixed(max, 0) + "px");
        let top = "0px";
        let left = "0px";
        if (h < max) {
            top = fastToFixed((h - max) / 2, 0) + "px";
        }
        if (w < max) {
            left = fastToFixed((w - max) / 2, 0) + "px";
        }
        this.svgHtmlElement.style.top = top;
        this.svgHtmlElement.style.left = left;
        if (this.lineCanvas) {
            this.lineCanvas.width = w;
            this.lineCanvas.height = h;
            this.lineCanvasClipping.initRect(w, h);
        }
    }
    NMToPixels(distanceInNM) {
        return distanceInNM / this._NMWidth * 1000;
    }
    feetsToPixels(distanceInFeets) {
        return distanceInFeets / this._ftWidth * 1000;
    }
    deltaLatitudeToPixels(deltaLatitude) {
        return deltaLatitude / this._angularHeight * 1000;
    }
    deltaLongitudeToPixels(deltaLongitude) {
        return deltaLongitude / this._angularWidth * 1000;
    }
    deltaLatitudeToNM(deltaLatitude) {
        return deltaLatitude / this._angularHeight * this.NMWidth;
    }
    deltaLongitudeToNM(deltaLongitude) {
        return deltaLongitude / this._angularWidth * this.NMWidth;
    }
    isInFrame(arg, safetyMarginFactor = 0) {
        if (arg && typeof (arg.x) === "number" && typeof (arg.y) === "number") {
            return this.isVec2InFrame(arg, safetyMarginFactor);
        }
        if (arg instanceof LatLong || arg instanceof LatLongAlt) {
            return this.isLatLongInFrame(arg, safetyMarginFactor);
        }
    }
    isVec2InFrame(p, safetyMarginFactor = 0) {
        return p.x >= (0 - 1000 * safetyMarginFactor) && p.y >= (0 - 1000 * safetyMarginFactor) && p.x < (1000 + 1000 * safetyMarginFactor) && p.y < (1000 + 1000 * safetyMarginFactor);
    }
    isLatLongInFrame(ll, safetyMarginFactor = 0) {
        const dLat = this._angularHeight * safetyMarginFactor;
        const dLong = this._angularWidth * safetyMarginFactor;
        return (ll.lat >= this._bottomLeftCoordinates.lat - dLat &&
            ll.long >= this._bottomLeftCoordinates.long - dLong &&
            ll.lat <= this._topRightCoordinates.lat + dLat &&
            ll.long <= this._topRightCoordinates.long + dLong);
    }
    segmentVsFrame(s1, s2, out1, out2) {
        return this._frameClipping.segmentVsRect(s1, s2, out1, out2);
    }
    coordinatesToXY(coordinates) {
        const xy = new Vec2();
        this.coordinatesToXYToRef(coordinates, xy);
        return xy;
    }
    latLongToXYToRef(lat, long, ref) {
        const xNorth = (long - this.centerCoordinates.long) / this._angularWidthNorth * 1000;
        const xSouth = (long - this.centerCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (lat - this.centerCoordinates.lat) / this._angularHeight;
        const y = -deltaLat * 1000;
        deltaLat += 0.5;
        const x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.rotateWithPlane) {
            ref.x = x * this.cosPlaneDirection - y * this.sinPlaneDirection + 500;
            ref.y = x * this.sinPlaneDirection + y * this.cosPlaneDirection + 500;
        } else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
    coordinatesToXYToRef(coordinates, ref) {
        const xNorth = (coordinates.long - this.centerCoordinates.long) / this._angularWidthNorth * 1000;
        const xSouth = (coordinates.long - this.centerCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (coordinates.lat - this.centerCoordinates.lat) / this._angularHeight;
        const y = -deltaLat * 1000;
        deltaLat += 0.5;
        const x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.rotateWithPlane) {
            ref.x = x * this.cosPlaneDirection - y * this.sinPlaneDirection + 500;
            ref.y = x * this.sinPlaneDirection + y * this.cosPlaneDirection + 500;
        } else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
    latLongToXYToRefForceCenter(lat, long, ref, forcedCenterCoordinates) {
        const xNorth = (long - forcedCenterCoordinates.long) / this._angularWidthNorth * 1000;
        const xSouth = (long - forcedCenterCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (lat - forcedCenterCoordinates.lat) / this._angularHeight;
        const y = -deltaLat * 1000;
        deltaLat += 0.5;
        const x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.rotateWithPlane) {
            ref.x = x * this.cosPlaneDirection - y * this.sinPlaneDirection + 500;
            ref.y = x * this.sinPlaneDirection + y * this.cosPlaneDirection + 500;
        } else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
    coordinatesToXYToRefForceCenter(coordinates, ref, forcedCenterCoordinates) {
        const xNorth = (coordinates.long - forcedCenterCoordinates.long) / this._angularWidthNorth * 1000;
        const xSouth = (coordinates.long - forcedCenterCoordinates.long) / this._angularWidthSouth * 1000;
        let deltaLat = (coordinates.lat - forcedCenterCoordinates.lat) / this._angularHeight;
        const y = -deltaLat * 1000;
        deltaLat += 0.5;
        const x = xNorth * deltaLat + xSouth * (1 - deltaLat);
        if (this.rotateWithPlane) {
            ref.x = x * this.cosPlaneDirection - y * this.sinPlaneDirection + 500;
            ref.y = x * this.sinPlaneDirection + y * this.cosPlaneDirection + 500;
        } else {
            ref.x = x + 500;
            ref.y = y + 500;
        }
    }
    XYToCoordinates(xy) {
        const lat = this.centerCoordinates.lat - ((xy.y - 500) / 1000) * this._angularHeight;
        const long = this.centerCoordinates.long + ((xy.x - 500) / 1000) * this._angularWidth;
        return new LatLongAlt(lat, long);
    }
    bearingDistanceToXY(bearing, distance) {
        const x = 1000 * (this._planeXY.x + Math.sin(bearing * Avionics.Utils.DEG2RAD) * distance / this.NMWidth);
        const y = 1000 * (this._planeXY.y - Math.cos(bearing * Avionics.Utils.DEG2RAD) * distance / this.NMWidth);
        return { x: x, y: y };
    }
}
SvgMap.Index = 0;
SvgMap.LOG_PERFS = false;
checkAutoload();
//# sourceMappingURL=SvgMap.js.map