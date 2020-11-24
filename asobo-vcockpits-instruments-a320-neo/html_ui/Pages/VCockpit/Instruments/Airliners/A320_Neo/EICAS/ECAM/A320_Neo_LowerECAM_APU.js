var A320_Neo_LowerECAM_APU;
(function (A320_Neo_LowerECAM_APU) {
    class Definitions {
    }
    A320_Neo_LowerECAM_APU.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() {
            return "LowerECAMAPUTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
        }
    }
    A320_Neo_LowerECAM_APU.Page = Page;
})(A320_Neo_LowerECAM_APU || (A320_Neo_LowerECAM_APU = {}));
customElements.define("a320-neo-lower-ecam-apu", A320_Neo_LowerECAM_APU.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_APU.js.map