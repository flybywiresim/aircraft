/** @type A320_Neo_LowerECAM_APU */
var A320_Neo_LowerECAM_APU;
(function (A320_Neo_LowerECAM_APU) {
    const absoluteZeroThermodynamicTemperature = -273.15;

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
            this.APUGenInfo = this.querySelector("#APUGenInfo_On");
            this.APUGenAvailArrow = this.querySelector("#APUGenAvailArrow");
            this.APUGenLoad = this.querySelector("#APUGenLoad");
            this.APUVolts = this.querySelector("#APUGenVoltage");
            this.APUFrequency = this.querySelector("#APUGenFrequency");
            this.APUGenTitle = this.querySelector("#APUGenParams");

            this.APUAvail = this.querySelector("#APUAvail_On");

            this.FuelLoPr = this.querySelector("#FuelLoPr_On");
            this.APUFlapOpen = this.querySelector("#APUFlapOpen_On");

            this.APUBleedOn = this.querySelector("#APUBleed_On");
            this.APUBleedOff = this.querySelector("#APUBleed_Off");
            this.APUBleedPressure = this.querySelector("#APUBleedAirPressure");

            this.apuInfo = new APUInfo(this.querySelector("#APUGauges"));

            this.updateThrottler = new UpdateThrottler(75);

            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised || !A320_Neo_EICAS.isOnBottomScreen()) {
                return;
            }

            _deltaTime = this.updateThrottler.canUpdate(_deltaTime);
            if (_deltaTime === -1) {
                return;
            }

            this.apuInfo.update(_deltaTime);

            // *******************************************************************************************************
            // APU Logic that isn't tied to the APU ECAM SCREEN belongs in flybywire-aircraft-a320-neo/html_ui/Pages/A32NX_Core/A32NX_APU.js
            // *******************************************************************************************************

            // Bleed
            const apuBleedAirValveOpen = SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool");
            toggleVisibility(this.APUBleedOn, apuBleedAirValveOpen);
            toggleVisibility(this.APUBleedOff, !apuBleedAirValveOpen);

            const showApuData = this.shouldShowApuData();
            let allParametersWithinAcceptableRange = false;
            if (showApuData) {
                this.APUGenLoad.textContent = Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_LOAD", "Percent"));
                const loadWithinNormalRange = !!SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_LOAD_NORMAL", "Bool");
                this.APUGenLoad.classList.toggle("APUGenParamValue", loadWithinNormalRange);
                this.APUGenLoad.classList.toggle("APUGenParamValueWarn", !loadWithinNormalRange);

                this.APUVolts.textContent = Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_POTENTIAL", "Volts"));
                const potentialWithinNormalRange = SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_POTENTIAL_NORMAL", "Bool");
                this.APUVolts.classList.toggle("APUGenParamValue", potentialWithinNormalRange);
                this.APUVolts.classList.toggle("APUGenParamValueWarn", !potentialWithinNormalRange);

                this.APUFrequency.textContent = Math.round(SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_FREQUENCY", "Hertz"));
                const frequencyWithinNormalRange = SimVar.GetSimVarValue("L:A32NX_ELEC_APU_GEN_1_FREQUENCY_NORMAL", "Bool");
                this.APUFrequency.classList.toggle("APUGenParamValue", frequencyWithinNormalRange);
                this.APUFrequency.classList.toggle("APUGenParamValueWarn", !frequencyWithinNormalRange);

                allParametersWithinAcceptableRange = loadWithinNormalRange && potentialWithinNormalRange && frequencyWithinNormalRange;
            }

            this.APUGenTitle.classList.toggle("APUGenTitle", showApuData && allParametersWithinAcceptableRange);
            this.APUGenTitle.classList.toggle("APUGenTitleWarn", showApuData && !allParametersWithinAcceptableRange);
            this.APUGenTitle.classList.toggle("APUGenTitleInactive", !showApuData);

            toggleVisibility(this.APUGenInfo, showApuData);

            const available = SimVar.GetSimVarValue("L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE", "Bool");
            toggleVisibility(this.APUAvail, available);

            const apuGeneratorContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_3XS_IS_CLOSED", "Bool");
            const atLeastOneBusTieContactorClosed = !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_11XU1_IS_CLOSED", "Bool") ||
                !!SimVar.GetSimVarValue("L:A32NX_ELEC_CONTACTOR_11XU2_IS_CLOSED", "Bool");
            toggleVisibility(this.APUGenAvailArrow, apuGeneratorContactorClosed && atLeastOneBusTieContactorClosed);

            // ADIRS1 on NAV is the normal operation situation.
            // Komp: If you switch the displays to DMC 3, then ADIRU 3 is the one providing the data.
            // Same when you select the air data selector to CAPT ON 3.
            // We'll wait for further implementation of those systems before making that functionality fully correct.
            const adirs1OnNav = SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'Enum') === 1;
            if (adirs1OnNav) {
                this.APUBleedPressure.textContent = SimVar.GetSimVarValue("L:APU_BLEED_PRESSURE","PSI");
                this.APUBleedPressure.setAttribute("class", "APUGenParamValue");
            } else {
                this.APUBleedPressure.textContent = "XX";
                this.APUBleedPressure.setAttribute("class", "APUGenParamValueWarn");
            }

            const lowFuelPressure = Arinc429Word.fromSimVarValue("L:A32NX_APU_LOW_FUEL_PRESSURE_FAULT");
            toggleVisibility(this.FuelLoPr, lowFuelPressure.isNormalOperation() && lowFuelPressure.value);

            const apuFlapFullyOpen = Arinc429Word.fromSimVarValue("L:A32NX_APU_FLAP_FULLY_OPEN");
            toggleVisibility(this.APUFlapOpen, apuFlapFullyOpen.isNormalOperation() && apuFlapFullyOpen.value);
        }

        shouldShowApuData() {
            return this.apuInfo.shouldShowApuData();
        }
    }
    A320_Neo_LowerECAM_APU.Page = Page;

    class APUInfo {
        constructor(_gaugeDiv) {
            this.n = Arinc429Word.empty();
            this.warningEgt = Arinc429Word.empty();
            this.cautionEgt = Arinc429Word.empty();

            //APU N Gauge
            const gaugeDef1 = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef1.arcSize = 180;
            gaugeDef1.startAngle = -210;
            gaugeDef1.currentValuePrecision = 0;
            gaugeDef1.minValue = 0;
            gaugeDef1.maxValue = 110;
            gaugeDef1.minRedValue = 101;
            gaugeDef1.maxRedValue = 110;
            gaugeDef1.dangerRange[0] = 101;
            gaugeDef1.dangerRange[1] = 110;
            gaugeDef1.currentValuePos.x = 0.8;
            gaugeDef1.currentValuePos.y = 0.74;
            gaugeDef1.currentValueFunction = () => {
                return this.n.value;
            };
            this.apuNGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.apuNGauge.id = "APU_N_Gauge";
            this.apuNGauge.init(gaugeDef1);
            this.apuNGauge.addGraduation(0, true, "0");
            this.apuNGauge.addGraduation(50, true);
            this.apuNGauge.addGraduation(100, true, "10");
            this.apuNGauge.active = false;
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.apuNGauge);
            }

            //APU EGT Gauge
            const gaugeDef2 = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef2.arcSize = 200;
            gaugeDef2.startAngle = -210;
            gaugeDef2.currentValuePrecision = 0;
            gaugeDef2.minValue = 300;
            gaugeDef2.maxValue = 1100;
            gaugeDef2.minRedValue = this.warningEgt.value;
            gaugeDef2.maxRedValue = 1100;
            gaugeDef2.warningRange[0] = this.cautionEgt.value;
            gaugeDef2.warningRange[1] = this.warningEgt.value;
            gaugeDef2.dangerRange[0] = this.warningEgt.value;
            gaugeDef2.dangerRange[1] = 1100;
            gaugeDef2.currentValuePos.x = 0.8;
            gaugeDef2.currentValuePos.y = 0.74;
            gaugeDef2.currentValueFunction = () => {
                return this.egt.value;
            };
            gaugeDef2.roundDisplayValueToNearest = 5;
            gaugeDef2.outerDynamicMarkerFunction = () => {
                return ["EGTCaution", this.cautionEgt.value];
            };
            this.apuEGTGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.apuEGTGauge.id = "APU_EGT_Gauge";
            this.apuEGTGauge.init(gaugeDef2);
            this.apuEGTGauge.addGraduation(300, true, "3");
            this.apuEGTGauge.addGraduation(700, true, "7");
            this.apuEGTGauge.addGraduation(1000, true, "10");
            this.apuEGTGauge.addGraduation(1100, false, "", true, true, "EGTCaution");
            this.apuEGTGauge.active = false;
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.apuEGTGauge);
            }

            // Last state tracking inits to -1 since we don't know what the state is.
            // The first update sets it correctly for us.
            this.apuShuttingDown = false;
            this.apuInactiveTimer = -1;
        }

        update(_deltaTime) {
            this.n = Arinc429Word.fromSimVarValue("L:A32NX_APU_N");
            this.apuNGauge.active = this.n.isNormalOperation();

            this.egt = Arinc429Word.fromSimVarValue("L:A32NX_APU_EGT");
            this.apuEGTGauge.active = this.egt.isNormalOperation();

            this.warningEgt = Arinc429Word.fromSimVarValue("L:A32NX_APU_EGT_WARNING");
            this.cautionEgt = Arinc429Word.fromSimVarValue("L:A32NX_APU_EGT_CAUTION");

            this.setCautionAndWarningRanges();

            this.apuNGauge.update(_deltaTime);
            this.apuEGTGauge.update(_deltaTime);
        }

        setCautionAndWarningRanges() {
            this.apuEGTGauge.minRedValue = this.warningEgt.value;
            this.apuEGTGauge.dangerRange[0] = this.warningEgt.value;
            this.apuEGTGauge.warningRange[0] = this.cautionEgt.value;
            this.apuEGTGauge.warningRange[1] = this.warningEgt.value;
        }

        shouldShowApuData() {
            return this.n.isNormalOperation() && this.egt.isNormalOperation();
        }
    }

    function toggleVisibility(element, condition) {
        element.setAttribute("visibility", condition ? "visible" : "hidden");
    }
})(A320_Neo_LowerECAM_APU || (A320_Neo_LowerECAM_APU = {}));

customElements.define("a320-neo-lower-ecam-apu", A320_Neo_LowerECAM_APU.Page);
