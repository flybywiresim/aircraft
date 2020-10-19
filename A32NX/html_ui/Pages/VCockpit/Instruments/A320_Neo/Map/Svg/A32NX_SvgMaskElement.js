class SvgMaskElement extends SvgMapElement {
    constructor(name) {
        super();
        this.name = name;
        if (!this.name) {
            this.name = (Math.random() * 10).toFixed(0).padStart(10, "0");
        }
    }
    id(map) {
        return "mask-" + this.name + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        if (this.createDrawCallback) {
            return this.createDrawCallback(map);
        }
    }
    updateDraw(map) {
    }
}
class SvgBottomMaskElement extends SvgMaskElement {
    constructor(name, offsetX = 0, offsetY = 0) {
        super();
        this.name = name;
        if (!this.name) {
            this.name = (Math.random() * 10).toFixed(0).padStart(10, "0");
        }
        this.createDrawCallback = (map) => {
            const rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.id = this.id(map);
            rect.setAttribute("x", offsetX.toString());
            rect.setAttribute("y", (530 + offsetY).toString());
            rect.setAttribute("width", "1000");
            rect.setAttribute("height", "470");
            rect.setAttribute("fill", "url(#Backlight)");
            return rect;
        };
    }
    id(map) {
        return "mask-" + this.name + "-map-" + map.index;
        ;
    }
}
class SvgPlanMaskElement extends SvgMaskElement {
    constructor(name, offsetX = 0, offsetY = 0) {
        super();
        this.name = name;
        if (!this.name) {
            this.name = (Math.random() * 10).toFixed(0).padStart(10, "0");
        }
        this.createDrawCallback = (map) => {
            this.path = document.createElementNS(Avionics.SVG.NS, "path");
            this.path.id = this.id(map);
            this.path.setAttribute("x", "0");
            this.path.setAttribute("y", "0");
            this.path.setAttribute("fill", "url(#Backlight)");
            this.path.setAttribute("transform", "translate(" + offsetX + " " + offsetY + ")");
            const d = "M0,0v1000h1000V0H0z M813.559,500H186.442V264.5h627.117V500z";
            this.path.setAttribute("d", d);
            return this.path;
        };
    }

    offset(offsetX, offsetY) {
        if (this.path) {
            this.path.setAttribute("transform", "translate(" + offsetX + " " + offsetY + ")");
        }
    }
    id(map) {
        return "mask-" + this.name + "-map-" + map.index;
        ;
    }
}
//# sourceMappingURL=SvgMaskElement.js.map