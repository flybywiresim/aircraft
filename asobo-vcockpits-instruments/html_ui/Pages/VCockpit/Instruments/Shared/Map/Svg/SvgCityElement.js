var CitySize;
(function (CitySize) {
    CitySize[CitySize["Large"] = 0] = "Large";
    CitySize[CitySize["Medium"] = 1] = "Medium";
    CitySize[CitySize["Small"] = 2] = "Small";
})(CitySize || (CitySize = {}));
class SvgCityElement extends SvgMapElement {
    constructor() {
        super();
        this.name = "";
        this.size = 1;
        this._lastX = 0;
        this._lastY = 0;
    }
    id(map) {
        return "city-" + this.name + "-map-" + map.index;
        ;
    }
    imageFileName() {
        let fName = "ICON_MAP_MEDIUM_CITY.svg";
        if (this.size === CitySize.Small) {
            fName = "ICON_MAP_SMALL_CITY.svg";
        } else if (this.size === CitySize.Large) {
            fName = "ICON_MAP_LARGE_CITY.svg";
        }
        return fName;
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        const text = document.createElementNS(Avionics.SVG.NS, "text");
        text.classList.add("map-city-text");
        text.textContent = this.name;
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("x", fastToFixed((map.config.cityIconSize * 0.5), 0));
        text.setAttribute("y", fastToFixed((map.config.cityIconSize * map.config.cityLabelDistance * 0.5), 0));
        text.setAttribute("fill", map.config.cityLabelColor);
        text.setAttribute("stroke", map.config.cityLabelStrokeColor);
        text.setAttribute("stroke-width", fastToFixed(map.config.cityLabelStrokeWidth, 0));
        text.setAttribute("font-size", fastToFixed(map.config.cityLabelFontSize, 0));
        text.setAttribute("font-family", map.config.cityLabelFontFamily);
        container.appendChild(text);
        if (map.config.cityLabelUseBackground) {
            setTimeout(() => {
                const bbox = text.getBBox();
                const rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.classList.add("map-city-text-background");
                rect.setAttribute("width", fastToFixed((bbox.width - 4 + map.config.cityLabelBackgroundPaddingRight + map.config.cityLabelBackgroundPaddingLeft), 0));
                rect.setAttribute("height", fastToFixed(Math.max((bbox.height - 17 + map.config.cityLabelBackgroundPaddingTop + map.config.cityLabelBackgroundPaddingBottom), 1), 0));
                rect.setAttribute("x", fastToFixed((bbox.x + 4 - map.config.cityLabelBackgroundPaddingLeft), 0));
                rect.setAttribute("y", fastToFixed((bbox.y + 10 - map.config.cityLabelBackgroundPaddingTop), 0));
                rect.setAttribute("fill", map.config.cityLabelBackgroundColor);
                rect.setAttribute("stroke", map.config.cityLabelBackgroundStrokeColor);
                rect.setAttribute("stroke-width", fastToFixed(map.config.cityLabelBackgroundStrokeWidth, 0));
                container.insertBefore(rect, text);
            }, 0);
        }
        const image = document.createElementNS(Avionics.SVG.NS, "image");
        image.classList.add("map-city-icon");
        image.setAttribute("width", "100%");
        image.setAttribute("height", "100%");
        image.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName() + "?_= " + new Date().getTime());
        container.appendChild(image);
        container.setAttribute("width", fastToFixed(map.config.cityIconSize, 0));
        container.setAttribute("height", fastToFixed(map.config.cityIconSize, 0));
        return container;
    }
    updateDraw(map) {
        map.latLongToXYToRef(this.lat, this.long, this);
        if (isFinite(this.x) && isFinite(this.y)) {
            if (Math.abs(this.x - this._lastX) > 0.1 || Math.abs(this.y - this._lastY) > 0.1) {
                this.svgElement.setAttribute("x", fastToFixed((this.x - map.config.cityIconSize * 0.5), 1));
                this.svgElement.setAttribute("y", fastToFixed((this.y - map.config.cityIconSize * 0.5), 2));
                this._lastX = this.x;
                this._lastY = this.y;
            }
        }
    }
}
//# sourceMappingURL=SvgCityElement.js.map