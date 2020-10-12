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
        get templateID() {
            return "LowerECAMBLEEDTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {

            this.isInitialised = true;
            //finding all html element for the display, first element of array is always the open on, the second is the closed one
            this.apuBleedIndication = [this.querySelector("#apu-switch-open"), this.querySelector("#apu-switch-closed")];
            this.leftEngineHp = [this.querySelector("#left-engine-hp-open"), this.querySelector("#left-engine-hp-closed")];
            this.leftEngineIp = [this.querySelector("#left-engine-ip-open"), this.querySelector("#left-engine-ip-closed")];
            this.rightEngineIp = [this.querySelector("#right-engine-ip-open"), this.querySelector("#right-engine-ip-closed")];
            this.rightEngineHp = [this.querySelector("#right-engine-hp-open"), this.querySelector("#right-engine-hp-closed")];
            this.leftPack = [this.querySelector("#left-pack-connection-open"), this.querySelector("#left-pack-connection-closed")];
            this.rightPack = [this.querySelector("#right-pack-connection-open"), this.querySelector("#right-pack-connection-closed")];
            this.xBleed = [this.querySelector("#xbleed-connection-open"), this.querySelector("#xbleed-connection-closed")];
            this.ramAir = [this.querySelector("#ram-air-on"), this.querySelector("#ram-air-off")];
            this.packFlow = [this.querySelector("#pack-flow-low"), this.querySelector("#pack-flow-normal"), this.querySelector("#pack-flow-high")];
            this.packIndicators = [(this.querySelector("#pack-out-temp-indicator-0")), (this.querySelector("#pack-out-temp-indicator-1")),
                (this.querySelector("#pack-out-temp-indicator-2")), (this.querySelector("#pack-out-temp-indicator-3")),
                (this.querySelector("#pack-out-temp-indicator-4")), (this.querySelector("#pack-out-temp-indicator-5")),
                (this.querySelector("#pack-out-temp-indicator-6")),];
            this.apuProvidesBleed = false;
            this.apuBleedTemperature = 250;
            this.apuBleedStartTimer = -1;

            //placeholder logic for packs
            this.engTempMultiplier = 0.35;
            this.packInMultiplier = 0.20;
            this.packOutMultiplier1 = 0.055;
            this.packOutMultiplier2 = 0.055;
            this.packInMultiplierApu = 0.4;
            this.packOutMultiplierApu = 0.1;
            this.temperatureVariationSpeed = 0.01;
        }
        //placeholder logic for packs
        setPackIndicators(p0, p1, p2, p3, p4, p5, p6) {
            if (p0) {
                this.packIndicators[0].setAttribute("visibility", "visible");
                this.packIndicators[1].setAttribute("visibility", "hidden");
                this.packIndicators[2].setAttribute("visibility", "hidden");
                this.packIndicators[3].setAttribute("visibility", "hidden");
                this.packIndicators[4].setAttribute("visibility", "hidden");
                this.packIndicators[5].setAttribute("visibility", "hidden");
                this.packIndicators[6].setAttribute("visibility", "hidden");
            } else if (p1) {
                this.packIndicators[0].setAttribute("visibility", "hidden");
                this.packIndicators[1].setAttribute("visibility", "visible");
                this.packIndicators[2].setAttribute("visibility", "hidden");
                this.packIndicators[3].setAttribute("visibility", "hidden");
                this.packIndicators[4].setAttribute("visibility", "hidden");
                this.packIndicators[5].setAttribute("visibility", "hidden");
                this.packIndicators[6].setAttribute("visibility", "hidden");
            } else if (p2) {
                this.packIndicators[0].setAttribute("visibility", "hidden");
                this.packIndicators[1].setAttribute("visibility", "hidden");
                this.packIndicators[2].setAttribute("visibility", "visible");
                this.packIndicators[3].setAttribute("visibility", "hidden");
                this.packIndicators[4].setAttribute("visibility", "hidden");
                this.packIndicators[5].setAttribute("visibility", "hidden");
                this.packIndicators[6].setAttribute("visibility", "hidden");
            } else if (p3) {
                this.packIndicators[0].setAttribute("visibility", "hidden");
                this.packIndicators[1].setAttribute("visibility", "hidden");
                this.packIndicators[2].setAttribute("visibility", "hidden");
                this.packIndicators[3].setAttribute("visibility", "visible");
                this.packIndicators[4].setAttribute("visibility", "hidden");
                this.packIndicators[5].setAttribute("visibility", "hidden");
                this.packIndicators[6].setAttribute("visibility", "hidden");
            } else if (p4) {
                this.packIndicators[0].setAttribute("visibility", "hidden");
                this.packIndicators[1].setAttribute("visibility", "hidden");
                this.packIndicators[2].setAttribute("visibility", "hidden");
                this.packIndicators[3].setAttribute("visibility", "hidden");
                this.packIndicators[4].setAttribute("visibility", "visible");
                this.packIndicators[5].setAttribute("visibility", "hidden");
                this.packIndicators[6].setAttribute("visibility", "hidden");
            } else if (p5) {
                this.packIndicators[0].setAttribute("visibility", "hidden");
                this.packIndicators[1].setAttribute("visibility", "hidden");
                this.packIndicators[2].setAttribute("visibility", "hidden");
                this.packIndicators[3].setAttribute("visibility", "hidden");
                this.packIndicators[4].setAttribute("visibility", "hidden");
                this.packIndicators[5].setAttribute("visibility", "visible");
                this.packIndicators[6].setAttribute("visibility", "hidden");
            } else if (p6) {
                this.packIndicators[0].setAttribute("visibility", "hidden");
                this.packIndicators[1].setAttribute("visibility", "hidden");
                this.packIndicators[2].setAttribute("visibility", "hidden");
                this.packIndicators[3].setAttribute("visibility", "hidden");
                this.packIndicators[4].setAttribute("visibility", "hidden");
                this.packIndicators[5].setAttribute("visibility", "hidden");
                this.packIndicators[6].setAttribute("visibility", "visible");
            }
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            const currentEngineBleedState = [SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool"), SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool")];
            const currentApuN = SimVar.GetSimVarValue("APU PCT RPM", "percent");

            const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "bool");
            const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "bool");

            if (!this.apuProvidesBleed && (currentApuN > 0.94)) {
                this.apuBleedStartTimer = 2;
            }

            if (this.apuBleedStartTimer >= 0) {
                this.apuBleedStartTimer -= _deltaTime / 1000;
                if (this.apuBleedStartTimer < 0) {
                    this.apuProvidesBleed = true;
                    this.querySelector("#apu-connecting-line").setAttribute("style", "stroke:008000");
                }
            }

            if (currentEngineBleedState[0] === 1 && eng1Running) {
                this.leftEngineHp[0].setAttribute("visibility", "visible");
                this.leftEngineHp[1].setAttribute("visibility", "hidden");
                this.leftEngineIp[0].setAttribute("visibility", "visible");
                this.leftEngineIp[1].setAttribute("visibility", "hidden");
            } else {
                this.leftEngineHp[0].setAttribute("visibility", "hidden");
                this.leftEngineHp[1].setAttribute("visibility", "visible");
                this.leftEngineIp[0].setAttribute("visibility", "hidden");
                this.leftEngineIp[1].setAttribute("visibility", "visible");
            }
            if (currentEngineBleedState[1] === 1 && eng2Running) {
                this.rightEngineHp[0].setAttribute("visibility", "visible");
                this.rightEngineHp[1].setAttribute("visibility", "hidden");
                this.rightEngineIp[0].setAttribute("visibility", "visible");
                this.rightEngineIp[1].setAttribute("visibility", "hidden");
            } else {
                this.rightEngineHp[0].setAttribute("visibility", "hidden");
                this.rightEngineHp[1].setAttribute("visibility", "visible");
                this.rightEngineIp[0].setAttribute("visibility", "hidden");
                this.rightEngineIp[1].setAttribute("visibility", "visible");
            }

            //find if the APU bleed is on
            const currentApuBleedSate = SimVar.GetSimVarValue("BLEED AIR APU", "Bool");

            if (currentApuBleedSate) {
                this.apuBleedIndication[0].setAttribute("visibility", 'visible');
                this.apuBleedIndication[1].setAttribute("visibility", "hidden");
            } else {
                this.apuBleedIndication[0].setAttribute("visibility", "hidden");
                this.apuBleedIndication[1].setAttribute("visibility", "visible");
            }

            //find left pack status
            const currentLeftPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "bool");

            if (currentLeftPackState) {
                this.leftPack[0].setAttribute("visibility", "visible");
                this.leftPack[1].setAttribute("visibility", "hidden");
            } else {
                this.leftPack[0].setAttribute("visibility", "hidden");
                this.leftPack[1].setAttribute("visibility", "visible");
            }

            //find right pack status
            const currentRightPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "bool");

            if (currentRightPackState) {
                this.rightPack[0].setAttribute("visibility", "visible");
                this.rightPack[1].setAttribute("visibility", "hidden");
            } else {
                this.rightPack[0].setAttribute("visibility", "hidden");
                this.rightPack[1].setAttribute("visibility", "visible");
            }

            //find xbleed switch state
            const currentXbleedState = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position", "Position(0-2)");

            if (currentXbleedState == 2) {
                SimVar.SetSimVarValue("L:x_bleed_valve", "bool", 1);
                this.xBleed[0].setAttribute("visibility", "visible");
                this.xBleed[1].setAttribute("visibility", "hidden");
            } else if (currentApuBleedSate && currentXbleedState == 1) {
                SimVar.SetSimVarValue("L:x_bleed_valve", "bool", 1);
                this.xBleed[0].setAttribute("visibility", "visible");
                this.xBleed[1].setAttribute("visibility", "hidden");
            } else {
                SimVar.SetSimVarValue("L:x_bleed_valve", "bool", 0);
                this.xBleed[0].setAttribute("visibility", "hidden");
                this.xBleed[1].setAttribute("visibility", "visible");
            }

            //find ram air state
            const currentRamState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_RAMAIR_TOGGLE", "bool");

            if (currentRamState) {
                this.ramAir[0].setAttribute("visibility", "hidden");
                this.ramAir[1].setAttribute("visibility", "visible");
            } else {
                this.ramAir[0].setAttribute("visibility", "visible");
                this.ramAir[1].setAttribute("visibility", "hidden");
            }

            //find pack flow state
            const currentPackFlow = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position", "Position(0-2)");

            if (currentPackFlow == 0) {
                this.packFlow[0].setAttribute("visibility", "visible");
                this.packFlow[1].setAttribute("visibility", "hidden");
                this.packFlow[2].setAttribute("visibility", "hidden");
            } else if (currentPackFlow == 1) {
                this.packFlow[0].setAttribute("visibility", "hidden");
                this.packFlow[1].setAttribute("visibility", "visible");
                this.packFlow[2].setAttribute("visibility", "hidden");
            } else {
                this.packFlow[0].setAttribute("visibility", "hidden");
                this.packFlow[1].setAttribute("visibility", "hidden");
                this.packFlow[2].setAttribute("visibility", "visible");
            }

            //placeholder logic for the bleed page temperatures and pressures, to be replaced/updated/removed when the cond-packs system is implemented
            if (!this.packOutMultiplier1) {
                this.packOutMultiplier1 = 0.055;
            }

            if (!this.packOutMultiplier2) {
                this.packOutMultiplier2 = 0.055;
            }

            const packRequestedlvl = Math.min(...[SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_1", "Position(0-6)"),
                SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_2", "Position(0-6)"),
                SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_3", "Position(0-6)")]);

            const packRequestedTemp = 18 + (2 * packRequestedlvl);

            const eng1TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:1", "Rankine");
            const eng1PSI = parseInt(SimVar.GetSimVarValue("TURB ENG BLEED AIR:1", "Ratio (0-16384)") / 2);
            const eng1TMPcomputed = parseInt(((eng1TMP - 491.67) * (5 / 9)) * this.engTempMultiplier);

            const eng2TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:2", "Rankine");
            const eng2PSI = parseInt(SimVar.GetSimVarValue("TURB ENG BLEED AIR:2", "Ratio (0-16384)") / 2);
            const eng2TMPcomputed = parseInt(((eng2TMP - 491.67) * (5 / 9)) * this.engTempMultiplier);

            const packTMPComputedIn = [(parseInt(((eng1TMP - 491.67) * (5 / 9)) * this.packInMultiplier)),
                (parseInt(((eng2TMP - 491.67) * (5 / 9)) * this.packInMultiplier)),
                (parseInt(this.apuBleedTemperature * this.packInMultiplierApu))];

            const packTMPComputedOut = [(parseInt(((eng1TMP - 491.67) * (5 / 9)) * this.packOutMultiplier1)),
                (parseInt(((eng2TMP - 491.67) * (5 / 9)) * this.packOutMultiplier2)),
                (parseInt(this.apuBleedTemperature * this.packOutMultiplierApu))];

            const xBleedValveOpen = SimVar.GetSimVarValue("L:x_bleed_valve", "bool");

            let packTemperatureVariation1 = 0;
            let packTemperatureVariation2 = 0;

            if (eng1Running && packRequestedTemp && packTMPComputedOut[0] && this.packOutMultiplier1 && this.temperatureVariationSpeed && currentPackFlow) {
                packTemperatureVariation1 = ((((packRequestedTemp / packTMPComputedOut[0]) * this.packOutMultiplier1) - this.packOutMultiplier1));
                this.packOutMultiplier1 += packTemperatureVariation1 * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
            }

            if (eng2Running && packRequestedTemp && packTMPComputedOut[1] && this.packOutMultiplier2 && this.temperatureVariationSpeed && currentPackFlow) {
                packTemperatureVariation2 = ((((packRequestedTemp / packTMPComputedOut[1]) * this.packOutMultiplier2) - this.packOutMultiplier2));
                this.packOutMultiplier2 += packTemperatureVariation2 * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
            }

            const packTemperatureVariationAPU = ((((packRequestedTemp / packTMPComputedOut[2]) * this.packOutMultiplierApu) - this.packOutMultiplierApu));
            this.packOutMultiplierApu += packTemperatureVariationAPU * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));

            switch (packRequestedlvl) {
                case 0:
                    this.setPackIndicators(1, 0, 0, 0, 0, 0, 0);
                    break;
                case 1:
                    this.setPackIndicators(0, 1, 0, 0, 0, 0, 0);
                    break;
                case 2:
                    this.setPackIndicators(0, 0, 1, 0, 0, 0, 0);
                    break;
                case 3:
                    this.setPackIndicators(0, 0, 0, 1, 0, 0, 0);
                    break;
                case 4:
                    this.setPackIndicators(0, 0, 0, 0, 1, 0, 0);
                    break;
                case 5:
                    this.setPackIndicators(0, 0, 0, 0, 0, 1, 0);
                    break;
                case 6:
                    this.setPackIndicators(0, 0, 0, 0, 0, 0, 1);
                    break;
            }

            if (currentEngineBleedState[0] && eng1Running) {
                this.querySelector("#eng1-bleed-tmp").textContent = eng1TMPcomputed;
                this.querySelector("#eng1-bleed-psi").textContent = eng1PSI;
            } else {
                this.querySelector("#eng1-bleed-tmp").textContent = "XXX";
                this.querySelector("#eng1-bleed-psi").textContent = "xx";
            }

            if (currentLeftPackState && currentEngineBleedState[0] && eng1Running) {
                this.querySelector("#left-pack-in").textContent = packTMPComputedIn[0];
                this.querySelector("#left-pack-out").textContent = packTMPComputedOut[0];
            } else if (currentLeftPackState && xBleedValveOpen && eng2Running && currentEngineBleedState[1]) {
                this.querySelector("#left-pack-in").textContent = packTMPComputedIn[1];
                this.querySelector("#left-pack-out").textContent = packTMPComputedOut[1];
            } else if (currentLeftPackState && currentApuBleedSate && this.apuProvidesBleed) {
                this.querySelector("#left-pack-in").textContent = packTMPComputedIn[2];
                this.querySelector("#left-pack-out").textContent = packTMPComputedOut[2];
            } else {
                this.querySelector("#left-pack-in").textContent = "xx";
                this.querySelector("#left-pack-out").textContent = "xx";
            }

            if (currentEngineBleedState[1] && eng2Running) {
                this.querySelector("#eng2-bleed-tmp").textContent = eng2TMPcomputed;
                this.querySelector("#eng2-bleed-psi").textContent = eng2PSI;
            } else {
                this.querySelector("#eng2-bleed-tmp").textContent = "XXX";
                this.querySelector("#eng2-bleed-psi").textContent = "xx";
            }

            if (currentRightPackState && currentEngineBleedState[1] && eng2Running) {
                this.querySelector("#right-pack-in").textContent = packTMPComputedIn[1];
                this.querySelector("#right-pack-out").textContent = packTMPComputedOut[1];
            } else if (currentRightPackState && xBleedValveOpen && eng1Running && currentEngineBleedState[0]) {
                this.querySelector("#right-pack-in").textContent = packTMPComputedIn[0];
                this.querySelector("#right-pack-out").textContent = packTMPComputedOut[0];
            } else if (currentRightPackState && currentApuBleedSate && xBleedValveOpen && this.apuProvidesBleed) {
                this.querySelector("#right-pack-in").textContent = packTMPComputedIn[2];
                this.querySelector("#right-pack-out").textContent = packTMPComputedOut[2];
            } else {
                this.querySelector("#right-pack-in").textContent = "xx";
                this.querySelector("#right-pack-out").textContent = "xx";
            }

            //end of placeholder logic

        }
    }
    A320_Neo_LowerECAM_BLEED.Page = Page;
})(A320_Neo_LowerECAM_BLEED || (A320_Neo_LowerECAM_BLEED = {}));
customElements.define("a320-neo-lower-ecam-bleed", A320_Neo_LowerECAM_BLEED.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_BLEED.js.map