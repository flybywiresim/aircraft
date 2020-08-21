var A320_Neo_LowerECAM_APU;
(function (A320_Neo_LowerECAM_APU) {
    class Definitions {
    }
    A320_Neo_LowerECAM_APU.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
            //this.allToggleElements = new Array();
        }
        get templateID() { return "LowerECAMAPUTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.APUGenLoad = this.querySelector("#APUGenLoad");
            this.APUVolts = this.querySelector("#APUGenVoltage");
            this.APUFrequency = this.querySelector("#APUGenFrequency");
            //this.APUN = this.querySelector("#APUN");

            //Avail
            this.APUAvail = this.querySelector("#APUAvail");

            //Gauges
            //this.apuInfo = new APUInfo(this.querySelector("#Gauges"));

            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            //Get APU N%
            var APUPctRPM = SimVar.GetSimVarValue("APU PCT RPM", "percent");
            var totalElectricalLoad = SimVar.GetSimVarValue("ELECTRICAL TOTAL LOAD AMPS", "amperes");
            var APULoadPercent = totalElectricalLoad / 782.609 // 1000 * 90 kVA / 115V = 782.609A

            //APU N Indication
            //this.APUN.textContent = Math.round(APUPctRPM);

            //APU Load/Volts/Frequency Indication
            if (APUPctRPM >= 87) {
                this.APUGenLoad.textContent = Math.round(APULoadPercent * 100);
                this.APUVolts.textContent = "115";
                this.APUFrequency.textContent = Math.round((4.46*APUPctRPM)-46.15);
            } else {
                this.APUGenLoad.textContent = "0";
                this.APUVolts.textContent = "0";
                this.APUFrequency.textContent = "0";
            }

            //AVAIL Indication
            if (APUPctRPM > 95) {
                this.APUAvail.setAttribute("visibility", "visible");
            } else {
                this.APUAvail.setAttribute("Visibility", "hidden");
            }

            //Gauges
            /*if (this.apuInfo != null) {
                this.apuInfo.update(_deltaTime);
            }*/

        }
    }
    A320_Neo_LowerECAM_APU.Page = Page;

    /*class APUInfo {
        constructor(_gaugeDiv) {
            var gaugeDef = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef.arcSize = 200;
            gaugeDef.currentValuePrecision = 0;
            gaugeDef.minValue = 0;
            gaugeDef.maxValue = 110;
            gaugeDef.currentValueFunction = this.getAPUN.bind(this);
            this.apuNGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.apuNGauge.id = "APU_N_Gauge";
            this.apuNGauge.init(gaugeDef);
            this.apuNGauge.addGraduation(0, true, "0");
            this.apuNGauge.addGraduation(50, true);
            this.apuNGauge.addGraduation(100, true, "100");
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.apuNGauge);
            }
        }

        update(_deltaTime) {
            if (this.apuNGauge != null) {
                this.apuNGauge.update(_deltaTime);
            }
        }

        getAPUN() {
            return SimVar.GetSimVarValue("APU PCT RPM", "percent");
        }
    }
    A320_Neo_LowerECAM_APU.APUInfo = APUInfo;*/
})(A320_Neo_LowerECAM_APU || (A320_Neo_LowerECAM_APU = {}));
customElements.define("a320-neo-lower-ecam-apu", A320_Neo_LowerECAM_APU.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_APU.js.map