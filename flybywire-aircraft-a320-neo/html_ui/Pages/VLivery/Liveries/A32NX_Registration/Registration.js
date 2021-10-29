class LiveryRegistration extends TemplateElement {
    constructor() {
        super();
        this.textScale = 1.0;
        this.location = "exterior";
        this.curTime = 0.0;
        this.needUpdate = false;
        this.frameCount = 0;
        this._isConnected = false;
    }
    get templateID() { return "LiveryRegistration"; }
    connectedCallback() {
        super.connectedCallback();
        this.bg = this.querySelector("#background");
        this.text = this.querySelector("#text");
        if (this.text) {
            this.parseURL();
            this.initMainLoop();
        }
    }
    parseURL() {
        let url = new URL(this.getAttribute("Url").toLowerCase());
        var sizeAttribute = url.searchParams.get("font_scale");
        if (sizeAttribute) {
            this.textScale = parseFloat(sizeAttribute);
        }
        var colorAttribute = url.searchParams.get("font_color");
        if (colorAttribute) {
            if (colorAttribute.startsWith("0x"))
                colorAttribute = colorAttribute.replace("0x", "#");
            this.text.style.color = colorAttribute;
        }
        var styleAttribute = url.searchParams.get("font_style");
        if (styleAttribute) {
            var style = styleAttribute.toLowerCase();
            if (style == "bold") {
                this.text.style.fontFamily = "Font-Bold";
            }
            else if (style == "italic") {
                this.text.style.fontFamily = "Font-Italic";
            }
            else if (style == "bold-italic" || style == "italic-bold") {
                this.text.style.fontFamily = "Font-BoldItalic";
            }
            else
                this.text.style.fontFamily = "Font-Medium";
        }
        var strokeSizeAttribute = url.searchParams.get("stroke_size");
        if (strokeSizeAttribute) {
            this.text.style.setProperty("--stroke-width", (parseFloat(strokeSizeAttribute) / 4) + "px");
        }
        var strokeColorAttribute = url.searchParams.get("stroke_color");
        if (strokeColorAttribute) {
            if (strokeColorAttribute.startsWith("0x"))
                strokeColorAttribute = strokeColorAttribute.replace("0x", "#");
            this.text.style.setProperty("--stroke-color", strokeColorAttribute + "");
        }
        var bgColorAttribute = url.searchParams.get("back_color");
        if (bgColorAttribute) {
            if (bgColorAttribute.startsWith("0x"))
                bgColorAttribute = bgColorAttribute.replace("0x", "#");
            this.bg.style.backgroundColor = bgColorAttribute;
            diffAndSetStyle(this.bg, StyleProperty.display, "block");
        }
        var locationAttribute = url.searchParams.get("location");
        if (locationAttribute) {
            this.location = locationAttribute;
        }
    }
    initMainLoop() {
        let updateLoop = () => {
            if (!this._isConnected)
                return;
            this.Update();
            requestAnimationFrame(updateLoop);
        };
        this._isConnected = true;
        requestAnimationFrame(updateLoop);
    }
    disconnectedCallback() {
    }
    Update() {
        if ((this.frameCount % 100) == 0) {
            var tailNumber = SimVar.GetSimVarValue("ATC ID", "string");
            this.SetTailNumber(tailNumber);
        }
        if (this.needUpdate) {
            let timeSinceUpdate = (Date.now() - this.curTime) * 0.001;
            if (timeSinceUpdate >= 1.5) {
                var rect = this.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    var maxWidth = rect.width * this.textScale;
                    var maxHeight = rect.height * this.textScale;
                    maxWidth *= 0.9;
                    maxHeight *= 1.5;
                    var charHeight = 1;
                    this.text.style.fontSize = charHeight + "px";
                    while ((this.text.clientWidth < maxWidth) && (this.text.clientHeight < maxHeight)) {
                        charHeight++;
                        this.text.style.fontSize = charHeight + "px";
                    }
                    charHeight--;
                    this.text.style.fontSize = charHeight + "px";
                    let textWidth = Math.ceil(this.text.clientWidth);
                    let textHeight = Math.ceil(this.text.clientHeight);
                    var deltaW = rect.width - textWidth;
                    var deltaH = rect.height - textHeight;
                    this.text.style.marginLeft = deltaW * 0.5 + "px";
                    this.text.style.marginTop = deltaH * 0.5 + "px";
                    this.needUpdate = false;
                }
            }
        }
        this.frameCount++;
    }
    SetTailNumber(_tailNumber) {
        if (_tailNumber != this.tailNumber) {
            this.tailNumber = _tailNumber;
            diffAndSetText(this.text, _tailNumber);
            if (_tailNumber && _tailNumber != "") {
                this.needUpdate = true;
                this.curTime = Date.now();
            }
            else
                this.needUpdate = false;
        }
    }
}
registerLivery("livery-registration-element", LiveryRegistration);
//# sourceMappingURL=Registration.js.map