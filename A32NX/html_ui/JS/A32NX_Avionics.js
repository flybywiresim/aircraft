var A32NX_Avionics;
(function (A32NX_Avionics) {
    class AltitudeScroller extends Avionics.Scroller {
        constructor(_nbItems, _spacing, _increment, _moduloValue, _notched = 0.0) {
            super(_nbItems, _increment, false, _moduloValue, _notched);
            this.allTexts = [];
            this.posX = 0;
            this.posY = 0;
            this.spacing = 0;
            this.spacing = _spacing;
        }
        construct(_parent, _posX, _posY, _width, _fontFamily, _fontSize, _fontColor) {
            this.posX = _posX;
            this.posY = _posY;
            this.allTexts = [];
            for (let i = 0; i < this._nbItems; i++) {
                const text = document.createElementNS(Avionics.SVG.NS, "text");
                text.setAttribute("width", _width.toString());
                text.setAttribute("fill", _fontColor);
                text.setAttribute("font-size", _fontSize.toString());
                text.setAttribute("font-family", _fontFamily);
                text.setAttribute("text-anchor", "end");
                text.setAttribute("alignment-baseline", "central");
                this.allTexts.push(text);
                _parent.appendChild(text);
            }
        }
        setAttribute(attribute, value) {
            this.allTexts.forEach((text) => {
                text.setAttribute(attribute, value);
            });
        }
        clear(_value = "") {
            this.update(0);
            for (let i = 0; i < this.allTexts.length; i++) {
                this.allTexts[i].textContent = _value;
            }
        }
        update(_value, _divider = 1, _hideIfLower = undefined) {
            super.scroll(Math.abs(_value) / _divider);
            let currentVal = this.firstValue;
            let currentY = this.posY + this.offsetY * this.spacing;
            for (let i = 0; i < this.allTexts.length; i++) {
                const posX = this.posX;
                const posY = currentY;
                if (currentVal <= 0 && _hideIfLower != undefined && Math.abs(_value) < _hideIfLower) {
                    this.allTexts[i].textContent = "";
                } else if (currentVal == 0 && this._moduloValue == 100) {
                    this.allTexts[i].textContent = "00";
                } else {
                    this.allTexts[i].textContent = Math.abs(currentVal).toString();
                }
                this.allTexts[i].setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
                currentY -= this.spacing;
                currentVal = this.nextValue;
            }
        }
    }
    A32NX_Avionics.AltitudeScroller = AltitudeScroller;
})(A32NX_Avionics || (A32NX_Avionics = {}));
//# sourceMappingURL=A32NX_Avionics.js.map