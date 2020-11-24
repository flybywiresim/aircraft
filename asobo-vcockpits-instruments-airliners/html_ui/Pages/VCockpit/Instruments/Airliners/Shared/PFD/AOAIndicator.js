class Jet_PFD_AOAIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.fontSize = 25;
        this.cursorWidth = 0;
        this.cursorHeight = 0;
        this.cursorMinY = 0;
        this.cursorMaxY = 0;
        this._aircraft = Aircraft.A320_NEO;
    }
    static get observedAttributes() {
        return [
            "angle"
        ];
    }
    get aircraft() {
        return this._aircraft;
    }
    set aircraft(_val) {
        if (this._aircraft != _val) {
            this._aircraft = _val;
            this.construct();
        }
    }
    connectedCallback() {
        this.construct();
    }
    construct() {
        if (this.aircraft == Aircraft.CJ4) {
            this.construct_CJ4();
        }
    }
    construct_CJ4() {
        this.rootSVG = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSVG.setAttribute("id", "ViewBox");
        this.rootSVG.setAttribute("viewBox", "0 0 250 500");
        var width = 70.5;
        var centerHeight = 380;
        var posX = width * 0.5;
        var posY = 435;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "AoA");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerGroup) {
            this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.centerGroup.setAttribute("id", "CenterGroup");
        }
        else {
            Utils.RemoveAllChildren(this.centerGroup);
        }
        posY -= centerHeight;
        {
            var _top = posY;
            var _left = posX - width * 0.5;
            var _width = width;
            var _height = centerHeight;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", _left.toString());
            bg.setAttribute("y", _top.toString());
            bg.setAttribute("width", _width.toString());
            bg.setAttribute("height", _height.toString());
            bg.setAttribute("fill", "black");
            bg.setAttribute("fill-opacity", "0.5");
            this.centerGroup.appendChild(bg);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.textContent = "AOA";
            text.setAttribute("x", (_left + _width * 0.75).toString());
            text.setAttribute("y", (_top + 20).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", (this.fontSize).toString());
            text.setAttribute("font-family", "Roboto-Light");
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "central");
            this.centerGroup.appendChild(text);
            var _graduationStartY = _top + 60;
            var _graduationHeight = (_top + 325) - _graduationStartY;
            if (!this.graduationsGroup) {
                this.graduationsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.graduationsGroup.setAttribute("id", "GraduationsGroup");
            }
            else {
                Utils.RemoveAllChildren(this.graduationsGroup);
            }
            var _nbGrads = 9;
            var _gradSpacing = _graduationHeight / (_nbGrads - 1);
            var _gradTexts = ["1.0", ".8", ".6", ".4", ".2"];
            var _textId = 0;
            var _gradX = (_left + _width * 0.75);
            for (var i = 0; i < _nbGrads; i++) {
                var isPrimary = (i % 2) ? false : true;
                var y = _graduationStartY + (_gradSpacing * i);
                var len = isPrimary ? 12 : 6;
                var line = document.createElementNS(Avionics.SVG.NS, "rect");
                line.setAttribute("x", (_gradX - len).toString());
                line.setAttribute("y", y.toString());
                line.setAttribute("width", len.toString());
                line.setAttribute("height", "2");
                line.setAttribute("fill", "white");
                this.graduationsGroup.appendChild(line);
                if (isPrimary) {
                    var text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = _gradTexts[_textId];
                    text.setAttribute("x", (_gradX - len - 5).toString());
                    text.setAttribute("y", y.toString());
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", (this.fontSize * 0.7).toString());
                    text.setAttribute("font-family", "Roboto-Light");
                    text.setAttribute("text-anchor", "end");
                    text.setAttribute("alignment-baseline", "central");
                    this.graduationsGroup.appendChild(text);
                    _textId++;
                }
            }
            var graduationVLine = document.createElementNS(Avionics.SVG.NS, "line");
            graduationVLine.setAttribute("x1", _gradX.toString());
            graduationVLine.setAttribute("y1", _graduationStartY.toString());
            graduationVLine.setAttribute("x2", _gradX.toString());
            graduationVLine.setAttribute("y2", (_graduationStartY + (_gradSpacing * (_nbGrads - 1))).toString());
            graduationVLine.setAttribute("fill", "none");
            graduationVLine.setAttribute("stroke", "white");
            graduationVLine.setAttribute("stroke-width", "2");
            this.graduationsGroup.appendChild(graduationVLine);
            this.centerGroup.appendChild(this.graduationsGroup);
            this.bottomText = document.createElementNS(Avionics.SVG.NS, "text");
            this.bottomText.textContent = ".";
            this.bottomText.setAttribute("x", (_left + _width * 0.75).toString());
            this.bottomText.setAttribute("y", (_top + _height - 20).toString());
            this.bottomText.setAttribute("fill", "white");
            this.bottomText.setAttribute("font-size", (this.fontSize * 0.83).toString());
            this.bottomText.setAttribute("font-family", "Roboto-Light");
            this.bottomText.setAttribute("text-anchor", "end");
            this.bottomText.setAttribute("alignment-baseline", "central");
            this.centerGroup.appendChild(this.bottomText);
            this.cursorMinY = _graduationStartY + _graduationHeight;
            this.cursorMaxY = _graduationStartY;
            this.cursorWidth = 40;
            this.cursorHeight = 16;
            var cursorPosX = _gradX - this.cursorWidth * 0.5;
            var cursorPosY = this.cursorMinY;
            if (!this.cursorSVG) {
                this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorSVG.setAttribute("id", "CursorGroup");
            }
            else
                Utils.RemoveAllChildren(this.cursorSVG);
            this.cursorSVG.setAttribute("x", cursorPosX.toString());
            this.cursorSVG.setAttribute("y", (cursorPosY - this.cursorHeight * 0.5).toString());
            this.cursorSVG.setAttribute("width", this.cursorWidth.toString());
            this.cursorSVG.setAttribute("height", this.cursorHeight.toString());
            this.cursorSVG.setAttribute("viewBox", "0 0 " + this.cursorWidth + " " + this.cursorHeight);
            {
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "white");
                this.cursorSVGShape.setAttribute("d", "M10 0 l25 0 l-4 8 l5 8 l-25 0 l-5 -8 l5 -8 Z");
                this.cursorSVGShape.setAttribute("fill", "none");
                this.cursorSVGShape.setAttribute("stroke", "white");
                this.cursorSVGShape.setAttribute("stroke-width", "2");
                this.cursorSVG.appendChild(this.cursorSVGShape);
            }
            this.centerGroup.appendChild(this.cursorSVG);
            this.rootGroup.appendChild(this.centerGroup);
        }
        this.rootSVG.appendChild(this.rootGroup);
        this.appendChild(this.rootSVG);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "angle":
                let angle = parseFloat(newValue);
                angle = Math.min(Math.max(angle, 0), 16) / 16;
                if (this.cursorSVG) {
                    var posY = this.cursorMinY + (this.cursorMaxY - this.cursorMinY) * angle;
                    this.cursorSVG.setAttribute("y", (posY - this.cursorHeight * 0.5).toString());
                }
                var fixedAngle = angle.toFixed(2);
                if (angle < 1.0) {
                    var radixPos = fixedAngle.indexOf('.');
                    this.bottomText.textContent = fixedAngle.slice(radixPos);
                }
                else {
                    this.bottomText.textContent = fixedAngle;
                }
                break;
        }
    }
}
customElements.define("jet-pfd-aoa-indicator", Jet_PFD_AOAIndicator);
//# sourceMappingURL=AOAIndicator.js.map