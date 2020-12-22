class SvgMapElementPerfProbe {
    constructor(type) {
        this.type = type;
        this.count = 0;
        this.mean = 0;
        this.recentMax = 0;
        this.max = 0;
    }
    add(t) {
        if (this.count < 1000000) {
            this.count++;
        }
        let invCount = 1 / this.count;
        this.mean *= 1 - invCount;
        this.mean += t * invCount;
        this.recentMax = Math.max(this.recentMax, t);
        this.max = Math.max(this.max, t);
    }
    reset() {
        this.count = 0;
        this.mean = 0;
        this.max = 0;
    }
}
class SvgMapElement {
    constructor() {
        this.sortIndex = 0;
    }
    findSvgElement(map) {
        let element;
        try {
            element = map.htmlRoot.querySelector("#" + this.id(map));
        }
        catch (error) {
            console.log("DOM 12 Exception with id '" + this.id(map) + "'");
        }
        finally {
            if (element instanceof SVGElement) {
                return element;
            }
        }
    }
    draw(map) {
        let t0 = 0;
        if (SvgMap.LOG_PERFS) {
            t0 = performance.now();
        }
        ;
        if (!this.svgElement) {
            this.svgElement = this.findSvgElement(map);
            if (!this.svgElement) {
                this.svgElement = this.createDraw(map);
                map.appendChild(this, this.svgElement);
            }
        }
        else {
            if (!this.svgElement.parentElement) {
                map.appendChild(this, this.svgElement);
            }
        }
        this.svgElement.removeAttribute("display");
        this.updateDraw(map);
        if (SvgMap.LOG_PERFS) {
            let t = performance.now() - t0;
            let className = this.constructor.name;
            let probe = SvgMapElement.probes.get(className);
            if (!probe) {
                probe = new SvgMapElementPerfProbe(className);
                SvgMapElement.probes.set(className, probe);
            }
            probe.add(t);
        }
        return this.svgElement;
    }
    static padEnd(text, pad, length) {
        while (text.length < length) {
            text += pad;
        }
        return text;
    }
    static logPerformances() {
        console.log("-----------------------------------------------");
        SvgMapElement.probes.forEach((probe, name) => {
            console.log("class " + SvgMapElement.padEnd(name, " ", 40) + " mean " + probe.mean.toFixed(3) + " ms | recentMax " + probe.recentMax.toFixed(3) + " ms | max " + probe.max.toFixed(3) + " ms");
            probe.recentMax = 0;
        });
        console.log("-----------------------------------------------");
    }
}
SvgMapElement.probes = new Map();
//# sourceMappingURL=SvgMapElement.js.map