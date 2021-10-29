/* Original file licensed under Xbox Game Content Usage Rules */

class LiveryRegistration extends TemplateElement {
    constructor() {
        super();
        this.curTime = 0.0;
        this.needUpdate = false;
        this.frameCount = 0;
        this._isConnected = false;
        this.regEnabled = false;
        this.registration = '';
    }

    get templateID() {
        return "LiveryRegistration";
    }

    connectedCallback() {
        super.connectedCallback();
        this.text = this.querySelector("#text");
        if (this.text) {
            NXDataStore.getAndSubscribe('DYNAMIC_REGISTRATION_DECAL', (key, value) => {
                const wasEnabled = this.regEnabled;
                this.regEnabled = value === '1';
                if (wasEnabled !== this.regEnabled) {
                    this.needUpdate = true;
                }
            }, '0');
            this.initMainLoop();
        }
    }

    initMainLoop() {
        const updateLoop = () => {
            if (!this._isConnected) {
                return;
            }
            this.Update();
            requestAnimationFrame(updateLoop);
        };
        this._isConnected = true;
        requestAnimationFrame(updateLoop);
    }

    disconnectedCallback() {
    }

    Update() {
        if ((this.frameCount++ % 100) == 0) {
            if (this.regEnabled) {
                const atcId = SimVar.GetSimVarValue("ATC ID", "string");
                if (atcId !== this.registration) {
                    this.registration = atcId;
                    this.needUpdate = true;
                }
            } else {
                this.registration = '';
            }
        }

        if (this.needUpdate) {
            this.needUpdate = false;
            if (this.regEnabled) {
                diffAndSetText(this.text, this.registration);
                var rect = this.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    var maxWidth = rect.width;
                    var maxHeight = rect.height;
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
                    const textWidth = Math.ceil(this.text.clientWidth);
                    const textHeight = Math.ceil(this.text.clientHeight);
                    var deltaW = rect.width - textWidth;
                    var deltaH = rect.height - textHeight;
                    this.text.style.marginLeft = deltaW * 0.5 + "px";
                    this.text.style.marginTop = deltaH * 0.5 + "px";
                }
            } else {
                diffAndSetText(this.text, '');
            }
        }
    }
}
registerLivery("livery-registration-element", LiveryRegistration);
//# sourceMappingURL=Registration.js.map
