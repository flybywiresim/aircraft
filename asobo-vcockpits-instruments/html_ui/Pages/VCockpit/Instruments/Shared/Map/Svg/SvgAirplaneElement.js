class SvgAirplaneElement extends SvgMapElement {
    constructor() {
        super();
        this._scale = 1.0;
        this._iconid = 1;
        this._lastTrack = NaN;
        this._forcePosAndRot = false;
        this._forcedPos = undefined;
        this._forcedRot = 0;
        this._forceCoordinates = true;
        this._forcedCoordinates = new LatLong();
        this._pos = new Vec2();
    }
    id(map) {
        return "airplane-icon-map-" + map.index;
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("x", fastToFixed(((1000 - map.config.airplaneIconSize) * 0.5), 0));
        container.setAttribute("y", fastToFixed(((1000 - map.config.airplaneIconSize) * 0.5), 0));
        container.setAttribute("width", fastToFixed(map.config.airplaneIconSize, 0));
        container.setAttribute("height", fastToFixed(map.config.airplaneIconSize, 0));
        container.setAttribute("overflow", "visible");
        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.getIconPath(map));
        const newScale = 100 * this._scale;
        this._image.setAttribute("x", ((100 - newScale) * 0.5) + "%");
        this._image.setAttribute("y", ((100 - newScale) * 0.5) + "%");
        this._image.setAttribute("width", newScale + "%");
        this._image.setAttribute("height", newScale + "%");
        container.appendChild(this._image);
        return container;
    }
    updateDraw(map) {
        const track = map.planeDirection;
        if (this._forcePosAndRot) {
            const rotation = "rotate(" + fastToFixed(this._forcedRot, 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + ")";
            this.svgElement.children[0].setAttribute("transform", rotation);
        } else if (!map.rotateWithPlane) {
            if (this._lastTrack !== track && isFinite(track)) {
                if (this.svgElement.children[0]) {
                    this._lastTrack = track;
                    const rotation = "rotate(" + fastToFixed(track, 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.5), 1) + ")";
                    this.svgElement.children[0].setAttribute("transform", rotation);
                }
            }
        } else {
            this._lastTrack = NaN;
            this.svgElement.children[0].removeAttribute("transform");
        }
        if (this._forcePosAndRot) {
            this.svgElement.setAttribute("x", fastToFixed(500 + this._forcedPos.x - map.config.airplaneIconSize * 0.5, 1));
            this.svgElement.setAttribute("y", fastToFixed(500 + this._forcedPos.y - map.config.airplaneIconSize * 0.5, 1));
        } else {
            if (this._forceCoordinates) {
                map.coordinatesToXYToRef(this._forcedCoordinates, this._pos);
                this._forceCoordinates = false;
            } else {
                map.coordinatesToXYToRef(map.planeCoordinates, this._pos);
            }
            if (isFinite(this._pos.x) && isFinite(this._pos.y)) {
                this.svgElement.setAttribute("x", fastToFixed((this._pos.x - map.config.airplaneIconSize * 0.5), 1));
                this.svgElement.setAttribute("y", fastToFixed((this._pos.y - map.config.airplaneIconSize * 0.5), 1));
            }
        }
    }
    setIcon(_map, _id) {
        if (this._iconid != _id) {
            this._iconid = _id;
            if (this._image) {
                this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.getIconPath(_map));
            }
        }
    }
    setScale(_map, _scale) {
        if (Math.abs(this._scale - _scale) > Number.EPSILON) {
            this._scale = _scale;
            if (this._image) {
                const newScale = 100 * _scale;
                this._image.setAttribute("x", ((100 - newScale) * 0.5) + "%");
                this._image.setAttribute("y", ((100 - newScale) * 0.5) + "%");
                this._image.setAttribute("width", newScale + "%");
                this._image.setAttribute("height", newScale + "%");
            }
        }
    }
    force2DPosAndRot(_force, _pos = undefined, _rot = 0) {
        this._forcePosAndRot = _force;
        this._forcedPos = _pos;
        this._forcedRot = _rot;
    }
    forceCoordinates(_lat, _long) {
        this._forceCoordinates = true;
        this._forcedCoordinates.lat = _lat;
        this._forcedCoordinates.long = _long;
    }
    getIconPath(map) {
        let iconPath = map.config.imagesDir;
        switch (this._iconid) {
            case 2:
                iconPath += map.config.airplaneIcon2;
                break;
            case 3:
                iconPath += map.config.airplaneIcon3;
                break;
            default:
                iconPath += map.config.airplaneIcon1;
                break;
        }
        iconPath += ".svg";
        return iconPath;
    }
}
class NPCAirplaneManager {
    constructor() {
        this.npcAirplanes = [];
        this.useTCAS = false;
        this._timer = Infinity;
    }
    update() {
        this._timer++;
        if (this._timer >= 60) {
            this._timer = 0;
            Coherent.call("GET_AIR_TRAFFIC").then((obj) => {
                for (let i = 0; i < this.npcAirplanes.length; i++) {
                    const npcAirplane = this.npcAirplanes[i];
                    npcAirplane.alive = 0;
                }
                for (let i = 0; i < obj.length; i++) {
                    const data = obj[i];
                    let npcAirplane = this.npcAirplanes.find(p => {
                        return p.name === data.uId.toFixed(0);
                    });
                    if (!npcAirplane) {
                        npcAirplane = new SvgNPCAirplaneElement(data.uId.toFixed(0));
                        npcAirplane.useTCAS = this.useTCAS;
                        this.npcAirplanes.push(npcAirplane);
                    }
                    npcAirplane.alive = 3;
                    npcAirplane.targetLat = obj[i].lat;
                    npcAirplane.targetLon = obj[i].lon;
                    npcAirplane.targetAlt = obj[i].alt;
                    npcAirplane.targetHeading = obj[i].heading;
                    if (isFinite(npcAirplane.lat) && isFinite(npcAirplane.lon) && isFinite(npcAirplane.alt)) {
                        npcAirplane.deltaLat = (npcAirplane.targetLat - npcAirplane.lat) / 60;
                        npcAirplane.deltaLon = (npcAirplane.targetLon - npcAirplane.lon) / 60;
                        npcAirplane.deltaAlt = (npcAirplane.targetAlt - npcAirplane.alt) / 60;
                        npcAirplane.targetHeading = Math.atan(npcAirplane.deltaLon / npcAirplane.deltaLat / Math.cos(npcAirplane.targetLat * Avionics.Utils.DEG2RAD)) * Avionics.Utils.RAD2DEG;
                        if (npcAirplane.deltaLat < 0) {
                            npcAirplane.targetHeading += 180;
                        }
                    }
                }
            });
        }
        for (let i = 0; i < this.npcAirplanes.length; i++) {
            const npcAirplane = this.npcAirplanes[i];
            npcAirplane.alive -= 1 / 60;
            if (npcAirplane.alive < 0) {
                this.npcAirplanes.splice(i, 1);
                i--;
            } else {
                if (isFinite(npcAirplane.lat) && isFinite(npcAirplane.lon) && isFinite(npcAirplane.heading)) {
                    npcAirplane.lat += npcAirplane.deltaLat;
                    npcAirplane.lon += npcAirplane.deltaLon;
                    npcAirplane.alt += npcAirplane.deltaAlt;
                    const deltaHeading = Avionics.Utils.angleDiff(npcAirplane.heading, npcAirplane.targetHeading);
                    if (deltaHeading > 60) {
                        npcAirplane.heading = npcAirplane.targetHeading;
                    } else {
                        npcAirplane.heading = Avionics.Utils.lerpAngle(npcAirplane.heading, npcAirplane.targetHeading, 1 / 60);
                    }
                } else {
                    npcAirplane.lat = npcAirplane.targetLat;
                    npcAirplane.lon = npcAirplane.targetLon;
                    npcAirplane.alt = npcAirplane.targetAlt;
                    npcAirplane.heading = npcAirplane.targetHeading;
                }
            }
        }
    }
}
class SvgNPCAirplaneElement extends SvgMapElement {
    constructor(name = "") {
        super();
        this.name = name;
        this._delay = 120;
        this.alive = 5;
        this.useTCAS = false;
        this.lat = NaN;
        this.lon = NaN;
        this.alt = NaN;
        this.deltaLat = 0;
        this.deltaLon = 0;
        this.deltaAlt = 0;
        this.targetLat = NaN;
        this.targetLon = NaN;
        this.targetAlt = NaN;
        this.heading = NaN;
        this.targetHeading = NaN;
        this._lastHeading = NaN;
        this._lastCase = NaN;
        if (this.name === "") {
            this.name = "A" + Math.floor(Math.random() * 1000000).toFixed(0);
        }
        this._id = "npc-airplaine-" + this.name;
        this._pos = new Vec2();
    }
    id(map) {
        return this._id + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("width", fastToFixed(map.config.airplaneIconSize * 0.7, 0));
        container.setAttribute("height", fastToFixed(map.config.airplaneIconSize * 0.7, 0));
        container.setAttribute("overflow", "visible");
        let iconPath = map.config.imagesDir;
        iconPath += map.config.airplaneIcon1;
        iconPath += ".svg";
        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.setAttribute("width", "100%");
        this._image.setAttribute("height", "100%");
        this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", iconPath);
        container.appendChild(this._image);
        container.setAttribute("x", fastToFixed(((1000 - map.config.airplaneIconSize * 0.7) * 0.5), 0));
        container.setAttribute("y", fastToFixed(((1000 - map.config.airplaneIconSize * 0.7) * 0.5), 0));
        return container;
    }
    updateDraw(map) {
        if (this._delay > 0) {
            this._delay--;
            this.svgElement.setAttribute("x", "-1000");
            this.svgElement.setAttribute("y", "-1000");
            return;
        }
        if (!this.useTCAS) {
            if (this._lastHeading !== this.heading && isFinite(this.heading)) {
                if (this.svgElement.children[0]) {
                    this._lastHeading = this.heading;
                    let angle = this.heading;
                    if (map.rotateWithPlane) {
                        angle -= map.planeDirection;
                    }
                    const rotation = "rotate(" + fastToFixed(angle, 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.7 * 0.5), 1) + " " + fastToFixed((map.config.airplaneIconSize * 0.7 * 0.5), 1) + ")";
                    this.svgElement.children[0].setAttribute("transform", rotation);
                }
            }
        }
        map.coordinatesToXYToRef(new LatLong(this.lat, this.lon), this._pos);
        if (isFinite(this._pos.x) && isFinite(this._pos.y)) {
            this.svgElement.setAttribute("x", fastToFixed((this._pos.x - map.config.airplaneIconSize * 0.7 * 0.5), 1));
            this.svgElement.setAttribute("y", fastToFixed((this._pos.y - map.config.airplaneIconSize * 0.7 * 0.5), 1));
        }
        if (this.useTCAS) {
            const altitudeAGL = map.planeAltitude;
            const deltaAltitude = Math.abs(altitudeAGL - this.alt);
            const distanceHorizontal = Avionics.Utils.computeDistance(new LatLong(this.lat, this.lon), map.planeCoordinates);
            if (distanceHorizontal < 2 && altitudeAGL > 1000 && deltaAltitude < 800) {
                if (this._lastCase !== 0) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_RA_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 0;
                }
            } else if (distanceHorizontal < 4 && altitudeAGL > 500 && deltaAltitude < 1000) {
                if (this._lastCase !== 1) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_TA_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 1;
                }
            } else if (distanceHorizontal < 6 && deltaAltitude < 1200) {
                if (this._lastCase !== 2) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_PROX_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 2;
                }
            } else if (distanceHorizontal < 30 && deltaAltitude < 2700) {
                if (this._lastCase !== 3) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + "ICON_MAP_TCAS_OTHER_A320.svg");
                    this.svgElement.setAttribute("visibility", "visible");
                    this._lastCase = 3;
                }
            } else {
                if (this._lastCase !== 4) {
                    this.svgElement.setAttribute("visibility", "hidden");
                    this._lastCase = 4;
                }
            }
        }
    }
}
//# sourceMappingURL=SvgAirplaneElement.js.map