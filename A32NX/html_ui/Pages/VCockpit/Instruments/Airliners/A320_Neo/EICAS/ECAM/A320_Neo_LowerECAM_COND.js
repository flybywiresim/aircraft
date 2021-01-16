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
            this.trimAirValveIndicator = [this.querySelector("#CkptGauge"), this.querySelector("#FwdGauge"), this.querySelector("#AftGauge")];

            this.cockpitTrimTemp = this.querySelector("#CkptTrimTemp");
            this.fwdTrimTemp = this.querySelector("#FwdTrimTemp");
            this.aftTrimTemp = this.querySelector("#AftTrimTemp");

            this.cockpitCabinTemp = this.querySelector("#CkptCabinTemp");
            this.fwdCabinTemp = this.querySelector("#FwdCabinTemp");
            this.aftCabinTemp = this.querySelector("#AftCabinTemp");

            // fan warnings, hidden on initialisation
            this.fanWarningIndication = [this.querySelector("#LeftFanWarning"), this.querySelector("#RightFanWarning")];
            this.fanWarningIndication[0].setAttribute("visibility", "hidden");
            this.fanWarningIndication[1].setAttribute("visibility", "hidden");

            this.querySelector("#AltnMode").setAttribute("visibility", "hidden");

            this.updateThrottler = new UpdateThrottler(500);
        }

        update(_deltaTime) {
            if (!this.isInitialised || !A320_Neo_EICAS.isOnBottomScreen()) {
                return;
            }
            if (this.updateThrottler.canUpdate(_deltaTime) === -1) {
                return;
            }
            // Disaply trim valve position for each zone
            const gaugeOffset = -50; //Gauges range is from -50 degree to +50 degree, AC-selector value is 0-100 - added an offset for this

            var airconSelectedTempCockpit = SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_1", "number");
            var airconSelectedTempFWD = SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_2", "number");
            var airconSelectedTempAFT = SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_3", "number");

            this.trimAirValveIndicator[0].setAttribute("style", "transform-origin: 155px 230px; transform: rotate(" + (gaugeOffset + airconSelectedTempCockpit) + "deg); stroke-width: 4.5px; stroke-linecap: round;");
            this.trimAirValveIndicator[1].setAttribute("style", "transform-origin: 285px 230px; transform: rotate(" + (gaugeOffset + airconSelectedTempFWD) + "deg); stroke-width: 4.5px; stroke-linecap: round;");
            this.trimAirValveIndicator[2].setAttribute("style", "transform-origin: 426px 230px; transform: rotate(" + (gaugeOffset + airconSelectedTempAFT) + "deg); stroke-width: 4.5px; stroke-linecap: round;");

            // Generate trim outlet values
            this.cockpitTrimTemp.textContent = parseInt(SimVar.GetSimVarValue("L:A32NX_CKPT_TRIM_TEMP", "celsius"));
            this.fwdTrimTemp.textContent = parseInt(SimVar.GetSimVarValue("L:A32NX_FWD_TRIM_TEMP", "celsius"));
            this.aftTrimTemp.textContent = parseInt(SimVar.GetSimVarValue("L:A32NX_AFT_TRIM_TEMP", "celsius"));

            // Display cabin temp
            this.cockpitCabinTemp.textContent = parseInt(SimVar.GetSimVarValue("L:A32NX_CKPT_TEMP", "celsius"));
            this.fwdCabinTemp.textContent = parseInt(SimVar.GetSimVarValue("L:A32NX_FWD_TEMP", "celsius"));
            this.aftCabinTemp.textContent = parseInt(SimVar.GetSimVarValue("L:A32NX_AFT_TEMP", "celsius"));

            // find if the hot air valve is open or not
            var currentHotAirSate = SimVar.GetSimVarValue("L:A32NX_AIRCOND_HOTAIR_TOGGLE", "Bool");
            this.hotAirValveIndication[0].setAttribute("visibility", currentHotAirSate ? 'visible' : 'hidden');
            this.hotAirValveIndication[1].setAttribute("visibility", currentHotAirSate ? 'hidden' : 'visible');
        }
    }
    A320_Neo_LowerECAM_COND.Page = Page;
})(A320_Neo_LowerECAM_COND || (A320_Neo_LowerECAM_COND = {}));
customElements.define("a320-neo-lower-ecam-cond", A320_Neo_LowerECAM_COND.Page);
