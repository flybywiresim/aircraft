class SvgObstacleElement extends SvgMapElement {
    constructor(name) {
        super();
        this.alt = 1000;
        this.isLit = false;
        this._checkAltitude = 0;
        this._lastX = 0;
        this._lastY = 0;
        this._lastFileName = "";
        this.name = name;
        if (!this.name) {
            this.name = (Math.random() * 10).toFixed(0).padStart(10, "0");
        }
        this._checkAltitude = Math.floor(Math.random() * 60);
    }
    id(map) {
        return "obstacle-" + this.name + "-map-" + map.index;
        ;
    }
    imageFileName(color = "GREY") {
        let moreLess = "LESS";
        if (this.alt > 1000) {
            moreLess = "MORE";
        }
        let litUnlit = "UNLIGHTED";
        if (this.isLit) {
            litUnlit = "LIGHTED";
        }
        return "ICON_MAP_OBSTACLE_" + litUnlit + "_" + moreLess + "_1000_AGL_" + color + ".svg";
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.classList.add("map-city-icon");
        this._image.setAttribute("width", "100%");
        this._image.setAttribute("height", "100%");
        this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName());
        container.appendChild(this._image);
        container.setAttribute("width", fastToFixed(map.config.cityIconSize, 0));
        container.setAttribute("height", fastToFixed(map.config.cityIconSize, 0));
        return container;
    }
    updateDraw(map) {
        map.latLongToXYToRef(this.lat, this.long, this);
        if (isFinite(this.x) && isFinite(this.y)) {
            this._checkAltitude -= 1;
            if (this._image && this._checkAltitude < 0) {
                this._checkAltitude = 60;
                let color;
                if (map.planeAltitude - this.alt < 100) {
                    color = "RED";
                } else if (map.planeAltitude - this.alt < 1000) {
                    color = "YELLOW";
                } else {
                    color = "GREY";
                }
                const fileName = this.imageFileName(color);
                if (fileName !== this._lastFileName) {
                    this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + fileName);
                    this._lastFileName = fileName;
                }
            }
            if (Math.abs(this.x - this._lastX) > 0.1 || Math.abs(this.y - this._lastY) > 0.1) {
                this.svgElement.setAttribute("x", fastToFixed((this.x - map.config.cityIconSize * 0.5), 1));
                this.svgElement.setAttribute("y", fastToFixed((this.y - map.config.cityIconSize * 0.5), 1));
                this._lastX = this.x;
                this._lastY = this.y;
            }
        }
    }
}
//# sourceMappingURL=SvgObstacleElement.js.map