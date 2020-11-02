var A320_Neo_LowerECAM_HYD;
(function (A320_Neo_LowerECAM_HYD) {
    class Definitions {
    }
    A320_Neo_LowerECAM_HYD.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() {
            return "LowerECAMHYDTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.isInitialised.bind(this));
        }
        init() {

        //insert init
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            //insert update
        }
    }
    A320_Neo_LowerECAM_HYD.Page = Page;
})(A320_Neo_LowerECAM_HYD || (A320_Neo_LowerECAM_HYD = {}));
customElements.define("a320-neo-lower-ecam-hyd", A320_Neo_LowerECAM_HYD.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_HYD.js.map
