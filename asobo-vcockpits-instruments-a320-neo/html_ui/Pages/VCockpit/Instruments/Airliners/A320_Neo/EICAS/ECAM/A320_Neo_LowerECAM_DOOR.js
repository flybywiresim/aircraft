var A320_Neo_LowerECAM_DOOR;
(function (A320_Neo_LowerECAM_DOOR) {
    class Definitions {
    }
    A320_Neo_LowerECAM_DOOR.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "LowerECAMDOORTemplate"; }
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
    A320_Neo_LowerECAM_DOOR.Page = Page;
})(A320_Neo_LowerECAM_DOOR || (A320_Neo_LowerECAM_DOOR = {}));
customElements.define("a320-neo-lower-ecam-door", A320_Neo_LowerECAM_DOOR.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_DOOR.js.map