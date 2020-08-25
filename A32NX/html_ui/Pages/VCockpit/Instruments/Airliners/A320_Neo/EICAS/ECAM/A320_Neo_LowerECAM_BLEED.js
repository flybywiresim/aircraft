var A320_Neo_LowerECAM_BLEED;
(function (A320_Neo_LowerECAM_BLEED) {
    class Definitions {
    }
    A320_Neo_LowerECAM_BLEED.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "LowerECAMBLEEDTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.isInitialised = true;
            // finding all html element for the display, first element of array is always the open on, the second is the closed one
            this.apuBleedIndication = [this.querySelector("#apu-switch-open"), this.querySelector("#apu-switch-closed")]
            this.leftEngineHp = [this.querySelector("#left-engine-hp-open"), this.querySelector("#left-engine-hp-closed")]
            this.leftEngineIp = [this.querySelector("#left-engine-ip-open"), this.querySelector("#left-engine-ip-closed")]
            this.rightEngineIp = [this.querySelector("#right-engine-ip-open"), this.querySelector("#right-engine-ip-closed")]
            this.rightEngineHp = [this.querySelector("#right-engine-hp-open"), this.querySelector("#right-engine-hp-closed")]
           
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            var currentEngineBleedState = [SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool"), SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool")]

            
            if (currentEngineBleedState[0] === 1) {
                this.leftEngineHp[0].setAttribute("visibility", "visible");
                this.leftEngineHp[1].setAttribute("visibility", "hidden");
                this.leftEngineIp[0].setAttribute("visibility", "visible");
                this.leftEngineIp[1].setAttribute("visibility", "hidden");
            } else {
                this.leftEngineHp[0].setAttribute("visibility", "hidden")
                this.leftEngineHp[1].setAttribute("visibility", "visible")
                this.leftEngineIp[0].setAttribute("visibility", "hidden")
                this.leftEngineIp[1].setAttribute("visibility", "visible")
            }
            if (currentEngineBleedState[1] === 1) {
                this.rightEngineHp[0].setAttribute("visibility", "visible");
                this.rightEngineHp[1].setAttribute("visibility", "hidden");
                this.rightEngineIp[0].setAttribute("visibility", "visible");
                this.rightEngineIp[1].setAttribute("visibility", "hidden");
            } else {
                this.rightEngineHp[0].setAttribute("visibility", "hidden")
                this.rightEngineHp[1].setAttribute("visibility", "visible")
                this.rightEngineIp[0].setAttribute("visibility", "hidden")
                this.rightEngineIp[1].setAttribute("visibility", "visible")
            }



            //find if the APU bleed is on
            var currentApuBleedSate = SimVar.GetSimVarValue("BLEED AIR APU", "Bool")

            if (currentApuBleedSate === 1) {
                this.apuBleedIndication[0].setAttribute("visibility", 'visible')
                this.apuBleedIndication[1].setAttribute("visibility", "hidden")
            } else {
                this.apuBleedIndication[0].setAttribute("visibility", "hidden")
                this.apuBleedIndication[1].setAttribute("visibility", "visible")
            }
        }
    }
    A320_Neo_LowerECAM_BLEED.Page = Page;
})(A320_Neo_LowerECAM_BLEED || (A320_Neo_LowerECAM_BLEED = {}));
customElements.define("a320-neo-lower-ecam-bleed", A320_Neo_LowerECAM_BLEED.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_BLEED.js.map