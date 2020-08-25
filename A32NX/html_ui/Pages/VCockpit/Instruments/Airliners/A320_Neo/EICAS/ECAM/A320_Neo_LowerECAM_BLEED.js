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
            this.apuBleedIndication = [this.querySelector("#apu-open"), this.querySelector("#apu-closed")];
            this.left_hp = [this.querySelector("#left-hp-open"), this.querySelector("#left-hp-closed")];
            this.left_ip = [this.querySelector("#left-ip-open"), this.querySelector("#left-ip-closed")];
            this.right_ip = [this.querySelector("#right-ip-open"), this.querySelector("#right-ip-closed")];
            this.right_hp = [this.querySelector("#right-hp-open"), this.querySelector("#right-hp-closed")]
            this.apu = [this.querySelector("#apu-open"), this.querySelector("#apu-closed")]
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            // find if engine one and two are providing bleed air
            var currentEngineBleedState = [SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool",), SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool")]

            if (currentEngineGenState[0] === 1) {
                this.left_hp[0].setAttribute("visibility", 'visible')
                this.left_hp[1].setAttribute("visibility", 'hidden')
                this.right_ip[0].setAttribute("visibility", 'visible')
                this.right_ip[1].setAttribute("visibility", 'hiddeb')
            } else {
                this.left_hp[0].setAttribute("visibility", 'hidden')
                this.left_hp[1].setAttribute("visibility", 'visible')
                this.right_ip[0].setAttribute("visibility", 'hidden')
                this.right_ip[1].setAttribute("visibility", 'visible')
            }
            if (currentEngineGenState[1] === 1) {
                this.right_hp[0].setAttribute("visibility", 'visible')
                this.right_hp[1].setAttribute("visibility", 'hidden')
                this.right_ip[0].setAttribute("visibility", 'visible')
                this.right_ip[1].setAttribute("visibility", 'hiddeb')
            } else {
                this.right_hp[0].setAttribute("visibility", 'hidden')
                this.right_hp[1].setAttribute("visibility", 'visible')
                this.right_ip[0].setAttribute("visibility", 'hidden')
                this.right_ip[1].setAttribute("visibility", 'visible')
            }

            //find if the APU bleed is on
            var currentApuBleedSate = SimVar.GetSimVarValue("BLEED AIR APU", "Bool")

            if (currentApuBleedSate === 1) {
                this.apuBleedIndication[0].setAttribute("visibility", 'visible')
                this.apuBleedIndication[1].setAttribute("visibility", "hidden")
            } else {
                this.apuBleedIndication[0].setAttribute("visibility", "hidden")
                this.apuBleedIndication[1].setAttribute("visibility", "hidden")
            }
        }
    }
    A320_Neo_LowerECAM_BLEED.Page = Page;
})(A320_Neo_LowerECAM_BLEED || (A320_Neo_LowerECAM_BLEED = {}));
customElements.define("a320-neo-lower-ecam-bleed", A320_Neo_LowerECAM_BLEED.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_BLEED.js.map