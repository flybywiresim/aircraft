var A320_Neo_LowerECAM_FTCL;
(function (A320_Neo_LowerECAM_FTCL) {
    class Definitions {
    }
    A320_Neo_LowerECAM_FTCL.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "LowerECAMFTCLTemplate"; }
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
    A320_Neo_LowerECAM_FTCL.Page = Page;
})(A320_Neo_LowerECAM_FTCL || (A320_Neo_LowerECAM_FTCL = {}));
customElements.define("a320-neo-lower-ecam-ftcl", A320_Neo_LowerECAM_FTCL.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_FTCL.js.map