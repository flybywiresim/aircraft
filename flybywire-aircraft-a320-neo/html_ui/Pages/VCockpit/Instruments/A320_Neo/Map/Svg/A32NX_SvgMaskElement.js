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
    constructor(name, offsetX = 0, offsetY = 0, mask = "M 0,0 V 1000 H 1000 V 0 Z m 500,282.07812 c 44.58849,0.034 88.09441,13.74154 124.64648,39.27735 H 774.50781 V 778.27148 H 225.49219 V 321.35547 H 375.64062 C 412.1126,295.87541 455.50922,282.16887 500,282.07812 Z") {
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
            this.path.setAttribute("d", mask);
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
