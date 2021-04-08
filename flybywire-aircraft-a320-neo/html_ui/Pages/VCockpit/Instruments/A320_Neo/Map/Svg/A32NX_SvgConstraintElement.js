class SvgConstraintElement extends SvgMapElement {
    constructor(source, transitionAltitude) {
        super();
        this.textOffsetRatio = 3;
        this.showText = true;
        this.minimize = false;
        this._textWidth = NaN;
        this._textHeight = NaN;
        this.needRepaint = false;
        this._lastX = 0;
        this._lastY = 0;
        this._lastMinimize = false;
        this.source = source;
        this._id = SvgConstraintElement._ID++;
        // Default to 10000 feet when no transition altitude is provided to Navigation Display at startup
        this.transitionAltitude = transitionAltitude ? transitionAltitude : 10000;
    }

    get coordinates() {
        if (this._coordinates) {
            return this._coordinates;
        }
        if (this.source && this.source.infos.coordinates) {
            return this.source.infos.coordinates;
        }
    }
    set coordinates(v) {
        this._coordinates = v;
    }
    id(map) {
        if (this.source.ident.indexOf(" ") != -1) {
            return "constraint-" + this._id + "-map-" + map.index;
            ;
        } else {
            return "constraint-" + this.source.ident + "-map-" + map.index;
            ;
        }
    }
    imageFileName() {
        return "ICON_CSTR_MAGENTA.svg";
    }

    _getAltitudeDescriptionSymbol() {
        if (this.source.legAltitudeDescription == 2) {
            return '+';
        } else if (this.source.legAltitudeDescription == 3) {
            return '-';
        } else {
            return '';
        }
    }

    createDraw(map) {
        const fontSize = map.config.waypointLabelFontSize;
        let text = "CSTR";
        let speedText = "";
        const altitudeDescriptionSymbol = this._getAltitudeDescriptionSymbol();

        if (this.source) {
            if (this.source.legAltitude1 > this.transitionAltitude) {
                text = "FL" + (this.source.legAltitude1 / 100).toFixed(0);
            } else {
                text = (this.source.legAltitude1 / 10).toFixed(0) + "0";
            }
        }

        if (altitudeDescriptionSymbol) {
            text = altitudeDescriptionSymbol + text;
        }

        if (this.source.speedConstraint > 10) {
            speedText = this.source.speedConstraint.toFixed(0) + "KT";
        }
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        ctx.font = fontSize + "px " + map.config.waypointLabelFontFamily;
        this._textWidth = Math.max(ctx.measureText(text).width, ctx.measureText(speedText).width);
        this._textHeight = fontSize * 0.675;
        this._label = undefined;
        this.needRepaint = true;
        const labelId = this.id(map) + "-text-" + map.index;
        const label = document.getElementById(labelId);
        if (label instanceof SVGForeignObjectElement) {
            this._label = label;
            this.needRepaint = true;
        }
        if (!this._label) {
            this._label = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
            this._label.id = labelId;
            this._label.setAttribute("width", (this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight).toFixed(0) + "px");
            this._label.setAttribute("height", (this._textHeight * (this.source.speedConstraint > 0 ? 2.2 : 1) + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom).toFixed(0) + "px");
            const canvas = document.createElement("canvas");
            canvas.setAttribute("width", (this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight).toFixed(0) + "px");
            canvas.setAttribute("height", (this._textHeight * (this.source.speedConstraint > 0 ? 2.2 : 1) + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom).toFixed(0) + "px");
            this._label.appendChild(canvas);
            const context = canvas.getContext("2d");
            if (map.config.waypointLabelUseBackground) {
                context.fillStyle = "black";
                context.fillRect(0, 0, this._textWidth + map.config.waypointLabelBackgroundPaddingLeft + map.config.waypointLabelBackgroundPaddingRight, this._textHeight + map.config.waypointLabelBackgroundPaddingTop + map.config.waypointLabelBackgroundPaddingBottom);
            }
            context.fillStyle = "#ff94ff";
            context.font = fontSize + "px " + map.config.waypointLabelFontFamily;
            context.fillText(text, map.config.waypointLabelBackgroundPaddingLeft, this._textHeight + map.config.waypointLabelBackgroundPaddingTop);
            if (this.source.speedConstraint > 0) {
                context.fillText(speedText, map.config.waypointLabelBackgroundPaddingLeft, this._textHeight * 2.2 + map.config.waypointLabelBackgroundPaddingTop);
            }
            map.textLayer.appendChild(this._label);
        }
        this.svgElement = document.createElementNS(Avionics.SVG.NS, "image");
        this.svgElement.id = this.id(map);
        this.svgElement.classList.add("constraint-icon");
        this.svgElement.setAttribute("hasTextBox", "true");
        this.svgElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName());
        this.svgElement.setAttribute("width", fastToFixed(map.config.waypointIconSize * 1.3, 0));
        this.svgElement.setAttribute("height", fastToFixed(map.config.waypointIconSize * 1.3, 0));
        return this.svgElement;
    }
    updateDraw(map) {
        if (this.coordinates) {
            map.coordinatesToXYToRef(this.coordinates, this);
        }
        if (isFinite(this.x) && isFinite(this.y)) {
            if (this.svgElement && this._lastMinimize !== this.minimize) {
                if (this.minimize) {
                    this.svgElement.setAttribute("width", fastToFixed(map.config.waypointIconSize * 1.3 * 0.5, 0));
                    this.svgElement.setAttribute("height", fastToFixed(map.config.waypointIconSize * 1.3 * 0.5, 0));
                } else {
                    this.svgElement.setAttribute("width", fastToFixed(map.config.waypointIconSize * 1.3, 0));
                    this.svgElement.setAttribute("height", fastToFixed(map.config.waypointIconSize * 1.3, 0));
                }
                this._lastMinimize = this.minimize;
                this.needRepaint = true;
            }
            if (this.needRepaint || Math.abs(this._lastX - this.x) > 0.1 || Math.abs(this._lastY - this.y) > 0.1) {
                this._lastX = this.x;
                this._lastY = this.y;
                const x = (this.x - map.config.waypointIconSize * 1.3 * 0.5 * (this.minimize ? 0.5 : 1));
                const y = (this.y - map.config.waypointIconSize * 1.3 * 0.5 * (this.minimize ? 0.5 : 1));
                this.svgElement.setAttribute("x", x + "");
                this.svgElement.setAttribute("y", y + "");
                if (!this._label) {
                    const labelId = this.id(map) + "-text-" + map.index;
                    const label = document.getElementById(labelId);
                    if (label instanceof SVGForeignObjectElement) {
                        const c = document.createElement("canvas");
                        const ctx = c.getContext("2d");
                        const fontSize = map.config.waypointLabelFontSize;
                        const text = "CSTR";
                        ctx.font = fontSize + "px " + map.config.waypointLabelFontFamily;
                        this._textWidth = ctx.measureText(text).width;
                        this._textHeight = fontSize * 0.675;
                        this._label = label;
                        this.needRepaint = true;
                    }
                }
                if (this._label) {
                    const textX = (x + map.config.waypointIconSize * 0.5 - this._textWidth * 0.5 + map.config.waypointLabelDistanceX);
                    const textY = y + map.config.waypointLabelDistance + map.config.waypointLabelFontSize + 4;
                    this._label.setAttribute("x", textX + "");
                    this._label.setAttribute("y", textY + "");
                    this.needRepaint = false;
                } else {
                    this.needRepaint = true;
                }
            }
        }
    }
}
SvgConstraintElement._ID = 0;
class SvgTopOfXElement extends SvgMapElement {
    constructor(name, imageName) {
        super();
        this.imageName = imageName;
        this.heading = 0;
        this._lastX = 0;
        this._lastY = 0;
        this._lastFileName = "";
        this.name = name;
        if (!this.name) {
            this.name = (Math.random() * 10).toFixed(0).padStart(10, "0");
        }
    }
    id(map) {
        return this.name + "-map-" + map.index;
        ;
    }
    imageFileName() {
        return this.imageName + ".svg";
    }
    createDraw(map) {
        const container = document.createElementNS(Avionics.SVG.NS, "image");
        container.id = this.id(map);
        container.classList.add("map-city-icon");
        container.setAttribute("width", fastToFixed(map.config.waypointIconSize * 2, 0));
        container.setAttribute("height", fastToFixed(map.config.waypointIconSize * 2, 0));
        container.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName());
        return container;
    }
    updateDraw(map) {
        map.latLongToXYToRef(this.lat, this.long, this);
        if (isFinite(this.x) && isFinite(this.y)) {
            const fileName = this.imageFileName();
            if (fileName !== this._lastFileName) {
                this.svgElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + fileName);
                this._lastFileName = fileName;
            }
            if (Math.abs(this.x - this._lastX) > 0.1 || Math.abs(this.y - this._lastY) > 0.1) {
                this.svgElement.setAttribute("x", fastToFixed((this.x - map.config.waypointIconSize), 1));
                this.svgElement.setAttribute("y", fastToFixed((this.y - map.config.waypointIconSize), 1));
                let angle = this.heading;
                if (map.rotationMode != EMapRotationMode.NorthUp) {
                    angle -= map.mapUpDirection;
                }
                this.svgElement.setAttribute("transform", "rotate(" + angle.toFixed(0) + " " + this.x.toFixed(0) + " " + this.y.toFixed(0) + ")");
                this._lastX = this.x;
                this._lastY = this.y;
            }
        }
    }
}
//# sourceMappingURL=SvgConstraintElement.js.map
