var A320_Neo_LowerECAM_COND;
(function (A320_Neo_LowerECAM_COND) {
    class Definitions {
    }
    A320_Neo_LowerECAM_COND.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() {
            return "LowerECAMCONDTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            if (BaseAirliners.unitIsMetric(Aircraft.A320_NEO)) {
                this.querySelector("#CondTempUnit").textContent = "°C";
            } else {
                this.querySelector("#CondTempUnit").textContent = "°F";
            }

            this.isInitialised = true;
            // finding all html element for the display, first element of array is always the open on, the second is the closed one
            this.hotAirValveIndication = [this.querySelector("#HotAirValveOpen"), this.querySelector("#HotAirValveClosed")];

            // fan warnings, hidden on initialisation
            this.fanWarningIndication = [this.querySelector("#LeftFanWarning"), this.querySelector("#RightFanWarning")];
            this.fanWarningIndication[0].setAttribute("visibility", "hidden");
            this.fanWarningIndication[1].setAttribute("visibility", "hidden");

            this.querySelector("#AltnMode").setAttribute("visibility", "hidden");
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            // display zone and trim temperature for each zone
            var zoneTemp = SimVar.GetSimVarValue("L:CKPT_TEMP", "celsius");
            this.querySelector("#CkptTemp").textContent = parseInt(zoneTemp);
            var trimTemp = SimVar.GetSimVarValue("L:CKPT_DUCT_TEMP", "celsius");
            this.querySelector("#CkptTrimTemp").textContent = parseInt(trimTemp);

            zoneTemp = SimVar.GetSimVarValue("L:FWD_TEMP", "celsius");
            this.querySelector("#FwdTemp").textContent = parseInt(zoneTemp);
            trimTemp = SimVar.GetSimVarValue("L:FWD_DUCT_TEMP", "celsius");
            this.querySelector("#FwdTrimTemp").textContent = parseInt(trimTemp);

            zoneTemp = SimVar.GetSimVarValue("L:AFT_TEMP", "celsius");
            this.querySelector("#AftTemp").textContent = parseInt(zoneTemp);
            trimTemp = SimVar.GetSimVarValue("L:AFT_DUCT_TEMP", "celsius");
            this.querySelector("#AftTrimTemp").textContent = parseInt(trimTemp);

            // TODO: disaply trim valve position for each zone

            // find if the hot air valve is open or not
            var currentHotAirSate = SimVar.GetSimVarValue("L:A32NX_AIRCOND_HOTAIR_TOGGLE", "Bool");
            this.hotAirValveIndication[0].setAttribute("visibility", currentHotAirSate ? 'visible' : 'hidden');
            this.hotAirValveIndication[1].setAttribute("visibility", currentHotAirSate ? 'hidden' : 'visible');
        }
    }
    A320_Neo_LowerECAM_COND.Page = Page;
})(A320_Neo_LowerECAM_COND || (A320_Neo_LowerECAM_COND = {}));
customElements.define("a320-neo-lower-ecam-cond", A320_Neo_LowerECAM_COND.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_COND.js.map
