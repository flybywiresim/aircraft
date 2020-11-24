class RoadNetworkLink {
    constructor(start, end, type = 0) {
        this.type = 0;
        this.start = start;
        this.end = end;
        this.type = type;
    }
    compare(other) {
        if (this.type < other.type) {
            return -1;
        }
        if (this.type > other.type) {
            return 1;
        }
        const sCompare = this.start.compare(other.start);
        if (sCompare < 0) {
            return -1;
        } else if (sCompare === 0) {
            const eCompare = this.end.compare(other.end);
            if (eCompare < 0) {
                return -1;
            } else if (eCompare === 0) {
                return 0;
            }
            return 1;
        }
        return 1;
    }
    clone() {
        return new RoadNetworkLink(this.start, this.end, this.type);
    }
}
class RoadNetworkNode {
    constructor(lat, long, epsilon = 0.001) {
        this.isPointUpToDate = false;
        this.x = 0;
        this.y = 0;
        this.isInFrame = false;
        this.valuesCount = 1;
        this.epsilon = 0.001;
        this.lat = lat;
        this.long = long;
        this.epsilon = epsilon;
    }
    compare(other) {
        if (Math.abs(this.lat - other.lat) < this.epsilon && Math.abs(this.long - other.long) < this.epsilon) {
            return 0;
        }
        if (this.long < other.long) {
            return -1;
        } else if (this.long === other.long) {
            if (this.lat < other.lat) {
                return -1;
            } else if (this.lat === other.lat) {
                return 0;
            }
            return 1;
        }
        return 1;
    }
    clone() {
        return new RoadNetworkNode(this.lat, this.long, this.epsilon);
    }
    lerp(other) {
        const d = 1 / (this.valuesCount + 1);
        this.lat = this.lat * d + other.lat * (1 - d);
        this.long = this.long * d + other.long * (1 - d);
    }
}
class RoadNetworkLODedData {
    constructor(epsilon, _log = false) {
        this._log = _log;
        this.maxRoadLength = 0;
        this.maxAddRoadTime = 0;
        this.maxAddRoadTimeRoadLength = 0;
        this.epsilon = 0.001;
        this.epsilon = epsilon;
        this.nodes = new SortedList();
        this.links = new SortedList();
        this._tmpNode1 = new RoadNetworkNode(0, 0, 0);
        this._tmpNode2 = new RoadNetworkNode(0, 0, 0);
        this._tmpLink = new RoadNetworkLink(undefined, undefined, 0);
        if (this._log) {
            setInterval(() => {
                console.log("-----");
                console.log("nodesLength " + this.nodes.length);
                console.log("linksLength " + this.links.length);
                console.log("maxRoadLength " + this.maxRoadLength);
                console.log("maxAddRoadTime " + this.maxAddRoadTime);
                console.log("maxAddRoadTimeRoadLength " + this.maxAddRoadTimeRoadLength);
                console.log("-----");
            }, 1000);
        }
    }
    addRoad(road, type = 0) {
        const t0 = performance.now();
        for (let i = 0; i < road.length - 1; i++) {
            this._tmpNode1.lat = road[i].lat;
            this._tmpNode1.long = road[i].long;
            this._tmpNode1.epsilon = this.epsilon;
            const start = this.nodes.add(this._tmpNode1);
            this._tmpNode2.lat = road[i + 1].lat;
            this._tmpNode2.long = road[i + 1].long;
            this._tmpNode2.epsilon = this.epsilon;
            const end = this.nodes.add(this._tmpNode2);
            const compare = start.compare(end);
            if (compare < 0) {
                this._tmpLink.start = start;
                this._tmpLink.end = end;
                this._tmpLink.type = type;
                this.links.add(this._tmpLink);
            } else if (compare > 0) {
                this._tmpLink.start = end;
                this._tmpLink.end = start;
                this._tmpLink.type = type;
                this.links.add(this._tmpLink);
            }
        }
        if (this._log) {
            const t1 = performance.now();
            const dt = t1 - t0;
            if (dt > this.maxAddRoadTime) {
                this.maxAddRoadTime = dt;
                this.maxAddRoadTimeRoadLength = road.length;
            }
            if (road.length > this.maxRoadLength) {
                this.maxRoadLength = road.length;
            }
        }
        if (this.nodes.length > 30000 || this.links.length > 30000) {
            this.nodes.clear();
            this.links.clear();
        }
    }
}
class RoadCanvas {
    constructor(_canvas) {
        this.canvas = _canvas;
        if (this.canvas) {
            this.context2D = this.canvas.getContext("2d");
        }
    }
}
class SvgRoadNetworkElement extends SvgMapElement {
    constructor() {
        super();
        this._hasNewRoads = false;
        this._iterator = Infinity;
        this._lastCoords = new LatLong();
        this._forcedDirection = 0;
        this._forcedCoords = new LatLong();
        this._deprecatePointsIterator = Infinity;
        this._activeInvisibleCanvasIndex = 0;
        this.parentWidth = 0;
        this.parentHeight = 0;
        this.svgMapSize = 1000;
        this.displayedSize = 1000;
        this.canvasSize = 1000;
        this.canvasOffset = 0;
        this.canvasClipping = new Avionics.Intersect();
        this.visible = true;
        this.k = 0;
        this.datas = [
            new RoadNetworkLODedData(SvgRoadNetworkElement.EPSILON_ROADS_LEVEL0),
            new RoadNetworkLODedData(SvgRoadNetworkElement.EPSILON_ROADS_LEVEL1),
            new RoadNetworkLODedData(SvgRoadNetworkElement.EPSILON_ROADS_LEVEL2)
        ];
    }
    nodes(map) {
        if (map.NMWidth > SvgRoadNetworkElement.EPSILON_ROADS_LEVEL0) {
            return this.datas[0].nodes;
        }
        if (map.NMWidth > SvgRoadNetworkElement.EPSILON_ROADS_LEVEL1) {
            return this.datas[1].nodes;
        }
        return this.datas[1].nodes;
    }
    links(map) {
        if (map.NMWidth > SvgRoadNetworkElement.EPSILON_ROADS_LEVEL0) {
            return this.datas[0].links;
        }
        if (map.NMWidth > SvgRoadNetworkElement.EPSILON_ROADS_LEVEL1) {
            return this.datas[1].links;
        }
        return this.datas[2].links;
    }
    id(map) {
        return "road-network" + "-map-" + map.index;
        ;
    }
    addRoad(road, type = 0, lod = -1) {
        if (road.length > 1) {
            this._hasNewRoads = true;
            if (lod === 8) {
                this.datas[0].addRoad(road, type);
            } else if (lod === 12) {
                this.datas[1].addRoad(road, type);
            } else if (lod === 14) {
                this.datas[2].addRoad(road, type);
            }
        }
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        return container;
    }
    setVisible(_visible) {
        if (this.visible != _visible) {
            this.visible = _visible;
            if (this._visibleCanvas) {
                if (this.visible) {
                    this._visibleCanvas.canvas.style.display = "block";
                } else {
                    this._visibleCanvas.canvas.style.display = "none";
                }
            }
        }
    }
    updateDraw(map) {
        if (!this._visibleCanvas) {
            const canvasImage = map.htmlRoot.querySelector("#road-network-canvas");
            if (!(canvasImage instanceof HTMLCanvasElement)) {
                return;
            }
            this._visibleCanvas = new RoadCanvas(canvasImage);
            if (this.visible) {
                this._visibleCanvas.canvas.style.display = "block";
            } else {
                this._visibleCanvas.canvas.style.display = "none";
            }
        }
        this.parentWidth = map.htmlRoot.getWidth();
        this.parentHeight = map.htmlRoot.getHeight();
        if (this.parentWidth * this.parentHeight < 1) {
            return;
        }
        this.displayedSize = Math.max(this.parentWidth, this.parentHeight);
        this.canvasSize = Math.min(SvgRoadNetworkElement.ROADS_CANVAS_OVERFLOW_FACTOR * this.displayedSize, SvgRoadNetworkElement.MAX_SIZE_ROADS_CANVAS);
        this.canvasOffset = (this.canvasSize - this.displayedSize) * 0.5;
        const thresholdLat = 0.25 * map.angularHeight;
        const thresholdLong = 0.25 * map.angularWidth;
        let resized = false;
        if (this._visibleCanvas.canvas.style.width !== fastToFixed(this.canvasSize, 0) + "px") {
            console.log("Resize RoadNetworkElement " + fastToFixed(this.canvasSize, 0) + "px");
            this._visibleCanvas.canvas.width = this.canvasSize;
            this._visibleCanvas.canvas.height = this.canvasSize;
            this._visibleCanvas.canvas.style.width = fastToFixed(this.canvasSize, 0) + "px";
            this._visibleCanvas.canvas.style.height = fastToFixed(this.canvasSize, 0) + "px";
            this._visibleCanvas.canvas.style.top = "0px";
            this._visibleCanvas.canvas.style.left = "0px";
            let top = 0;
            let left = 0;
            if (this.parentHeight < this.canvasSize) {
                top = Math.round((this.parentHeight - this.canvasSize) / 2);
            }
            if (this.parentWidth < this.canvasSize) {
                left = Math.round((this.parentWidth - this.canvasSize) / 2);
            }
            this.translateCanvas(this._visibleCanvas.canvas, left, top, 0);
            if (this._visibleCanvas.context2D) {
                this._visibleCanvas.context2D.imageSmoothingEnabled = false;
                this._visibleCanvas.context2D.globalCompositeOperation = "copy";
            }
            if (!this._invisibleCanvases) {
                this._invisibleCanvases = [];
                this._invisibleCanvases[0] = new RoadCanvas(document.createElement("canvas"));
                this._invisibleCanvases[1] = new RoadCanvas(document.createElement("canvas"));
            }
            this._invisibleCanvases[0].canvas.width = this.canvasSize;
            this._invisibleCanvases[0].canvas.height = this.canvasSize;
            document.body.appendChild(this._invisibleCanvases[0].canvas);
            this._invisibleCanvases[0].canvas.style.position = "fixed";
            this.translateCanvas(this._invisibleCanvases[0].canvas, 10000, 10000, 0);
            this._invisibleCanvases[1].canvas.width = this.canvasSize;
            this._invisibleCanvases[1].canvas.height = this.canvasSize;
            document.body.appendChild(this._invisibleCanvases[1].canvas);
            this._invisibleCanvases[1].canvas.style.position = "fixed";
            this.translateCanvas(this._invisibleCanvases[1].canvas, 10000, 10000, 0);
            this.canvasClipping.initRect(this.canvasSize, this.canvasSize);
            resized = true;
        }
        let invisibleContext = this._invisibleCanvases[this._activeInvisibleCanvasIndex].context2D;
        invisibleContext.strokeStyle = "gray";
        invisibleContext.lineWidth = 3;
        const links = this.links(map);
        const l = links.length;
        if (l === 0) {
            return;
        }
        this.onLatLongChanged(map, this._lastCoords);
        const diffLastLat = Math.abs(this._lastCoords.lat - map.centerCoordinates.lat);
        const diffLastLong = Math.abs(this._lastCoords.long - map.centerCoordinates.long);
        if (this._lastRange !== map.NMWidth || resized) {
            this._iterator = 0;
            this._lastRange = map.NMWidth;
            this._visibleCanvas.context2D.clearRect(0, 0, this.canvasSize, this.canvasSize);
            invisibleContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
            this._deprecatePoints = true;
            this._hasNewRoads = false;
            this._deprecatePointsIterator = 0;
            this._forcedCoords.lat = map.centerCoordinates.lat;
            this._forcedCoords.long = map.centerCoordinates.long;
            this._forcedDirection = map.planeDirection;
            this._lastCoords.lat = map.centerCoordinates.lat;
            this._lastCoords.long = map.centerCoordinates.long;
            return;
        }
        if (this._iterator >= l) {
            if (this._iterator !== Infinity) {
                const visibleContext = this._visibleCanvas.context2D;
                visibleContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
                visibleContext.drawImage(this._invisibleCanvases[this._activeInvisibleCanvasIndex].canvas, 0, 0, this.canvasSize, this.canvasSize);
                this._lastCoords.lat = this._forcedCoords.lat;
                this._lastCoords.long = this._forcedCoords.long;
                this._forcedDirection = map.planeDirection;
                this.onLatLongChanged(map, this._lastCoords);
            }
            if (this._hasNewRoads || diffLastLat > thresholdLat || diffLastLong > thresholdLong || Math.abs(this._forcedDirection - map.planeDirection) > 2) {
                this._iterator = 0;
                this._activeInvisibleCanvasIndex = (this._activeInvisibleCanvasIndex + 1) % 2;
                invisibleContext = this._invisibleCanvases[this._activeInvisibleCanvasIndex].context2D;
                invisibleContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
                this._forcedCoords.lat = map.centerCoordinates.lat;
                this._forcedCoords.long = map.centerCoordinates.long;
                this._deprecatePoints = true;
                this._hasNewRoads = false;
                this._deprecatePointsIterator = 0;
            } else {
                this._iterator = Infinity;
                this.onLatLongChanged(map, this._lastCoords);
            }
            return;
        }
        if (this._deprecatePoints) {
            const nodes = this.nodes(map);
            const l = nodes.length;
            const t0 = performance.now();
            while ((performance.now() - t0) < SvgRoadNetworkElement.MAX_STALL_NODE_DEPRECATION && this._deprecatePointsIterator < l) {
                nodes.get(this._deprecatePointsIterator).isPointUpToDate = false;
                this._deprecatePointsIterator++;
            }
            if (this._deprecatePointsIterator >= l) {
                this._deprecatePoints = false;
            }
            this.onLatLongChanged(map, this._lastCoords);
            return;
        }
        const t0 = performance.now();
        let lastLinkType = NaN;
        const s1 = new Vec2();
        const s2 = new Vec2();
        let prevWasClipped = false;
        invisibleContext.beginPath();
        while ((performance.now() - t0) < SvgRoadNetworkElement.MAX_STALL_DRAW_ROADS && this._iterator < l) {
            const link = links.get(this._iterator++);
            if (link) {
                if (lastLinkType !== link.type || prevWasClipped) {
                    if (link.type === 0) {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = "gray";
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = map.config.roadMotorWayWidth;
                        lastLinkType = link.type;
                    } else if (link.type === 2) {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = "gray";
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = map.config.roadTrunkWidth;
                        lastLinkType = link.type;
                    } else if (link.type === 4) {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = "gray";
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = map.config.roadPrimaryWidth;
                        lastLinkType = link.type;
                    } else if (link.type >= 100) {
                        const t = link.type - 100;
                        if (t === 1) {
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "red";
                            invisibleContext.beginPath();
                            invisibleContext.lineWidth = 1;
                            lastLinkType = link.type;
                        } else if (t === 3) {
                            invisibleContext.lineWidth = 1;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#0b80fa";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        } else if (t === 4) {
                            invisibleContext.lineWidth = 1;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#bb09c5";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        } else if (t === 5) {
                            invisibleContext.lineWidth = 1;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#a0bcee";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        } else if (t === 15) {
                            invisibleContext.lineWidth = 2;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#0b80fa";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        } else if (t === 16) {
                            invisibleContext.lineWidth = 2;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#580982";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        } else {
                            invisibleContext.lineWidth = 2;
                            invisibleContext.stroke();
                            invisibleContext.strokeStyle = "#f99509";
                            invisibleContext.beginPath();
                            lastLinkType = link.type;
                        }
                    } else {
                        invisibleContext.stroke();
                        invisibleContext.strokeStyle = "magenta";
                        invisibleContext.beginPath();
                        invisibleContext.lineWidth = 2;
                        lastLinkType = link.type;
                    }
                }
                const n1 = link.start;
                const n2 = link.end;
                if (n1 && n2) {
                    if (!n1.isPointUpToDate) {
                        map.latLongToXYToRefForceCenter(n1.lat, n1.long, n1, this._forcedCoords);
                        n1.x *= this.displayedSize / this.svgMapSize;
                        n1.x += this.canvasOffset;
                        n1.y *= this.displayedSize / this.svgMapSize;
                        n1.y += this.canvasOffset;
                        n1.isPointUpToDate = true;
                    }
                    if (!n2.isPointUpToDate) {
                        map.latLongToXYToRefForceCenter(n2.lat, n2.long, n2, this._forcedCoords);
                        n2.isInFrame = map.isVec2InFrame(n2, 1.4);
                        n2.x *= this.displayedSize / this.svgMapSize;
                        n2.x += this.canvasOffset;
                        n2.y *= this.displayedSize / this.svgMapSize;
                        n2.y += this.canvasOffset;
                        n2.isPointUpToDate = true;
                    }
                    if (this.canvasClipping.segmentVsRect(n1, n2, s1, s2)) {
                        invisibleContext.moveTo(Math.round(s1.x), Math.round(s1.y));
                        invisibleContext.lineTo(Math.round(s2.x), Math.round(s2.y));
                        prevWasClipped = (s2.Equals(n2)) ? false : true;
                    } else {
                        prevWasClipped = true;
                    }
                }
            }
        }
        invisibleContext.stroke();
        this.onLatLongChanged(map, this._lastCoords);
    }
    onLatLongChanged(_map, _coords) {
        const p = _map.coordinatesToXY(_coords);
        p.x -= this.svgMapSize * 0.5;
        p.y -= this.svgMapSize * 0.5;
        p.x *= this.displayedSize / this.svgMapSize;
        p.y *= this.displayedSize / this.svgMapSize;
        let top = Math.round(p.y);
        let left = Math.round(p.x);
        if (this.parentHeight < this.canvasSize) {
            top = Math.round((this.parentHeight - this.canvasSize) * 0.5 + p.y);
        }
        if (this.parentWidth < this.canvasSize) {
            left = Math.round((this.parentWidth - this.canvasSize) * 0.5 + p.x);
        }
        let deltaRotation = 0;
        if (_map.rotateWithPlane) {
            deltaRotation = this._forcedDirection - _map.planeDirection;
        }
        this.translateCanvas(this._visibleCanvas.canvas, left, top, deltaRotation);
    }
    translateCanvas(_canvas, _x, _y, _rotation) {
        _canvas.style.transform = "translate(" + _x + "px, " + _y + "px) rotate(" + _rotation.toFixed(0) + "deg)";
    }
}
SvgRoadNetworkElement.MAX_STALL_PENDING_ROADS_UNSTACK = 0.5;
SvgRoadNetworkElement.MAX_STALL_NODE_DEPRECATION = 0.5;
SvgRoadNetworkElement.MAX_STALL_DRAW_ROADS = 2;
SvgRoadNetworkElement.MAX_LENGTH_PENDING_ROADS_BUFFER = 500;
SvgRoadNetworkElement.ROADS_CANVAS_OVERFLOW_FACTOR = 1.5;
SvgRoadNetworkElement.MAX_SIZE_ROADS_CANVAS = 2048;
SvgRoadNetworkElement.EPSILON_ROADS_LEVEL0 = 0.0008;
SvgRoadNetworkElement.EPSILON_ROADS_LEVEL1 = 0.0056;
SvgRoadNetworkElement.EPSILON_ROADS_LEVEL2 = 0.016;
SvgRoadNetworkElement.MIN_RANGE_LEVEL0 = 50;
SvgRoadNetworkElement.MIN_RANGE_LEVEL1 = 15;
//# sourceMappingURL=SvgRoadNetworkElement.js.map