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
            this.ramAirConnection = this.querySelector("#ram-air-connection-line");
            this.packFlowIndicator = [this.querySelector("#pack-flow-indicator1"), this.querySelector("#pack-flow-indicator2")];
            this.packIndicator = [this.querySelector("#pack-out-temp-indicator1"), this.querySelector("#pack-out-temp-indicator2")];
            this.apuConnectingLine = this.querySelector("#apu-connecting-line");
            this.apuText = this.querySelector("#APUtext");
            this.apuValve = this.querySelector("#apu-valve");
            this.gndText = this.querySelector("#GND");
            this.gndTriangle = this.querySelector("#GND-triangle");
            this.antiIceText = this.querySelector("#anti-ice-text");
            this.antiIceTriangles = [this.querySelector("#anti-ice-indicators-1"), this.querySelector("#anti-ice-indicators-2")];
            this.centerLines = [this.querySelector("#center-line-1"), this.querySelector("#center-line-2"), this.querySelector("#center-line-3"),
                this.querySelector("#center-line-4"), this.querySelector("#center-line-5"), this.querySelector("#center-line-6"),];

            this.htmlEngNumb1 = this.querySelector("#eng-numb-1");
            this.htmlEng1Tmp = this.querySelector("#eng1-bleed-tmp");
            this.htmlEng1Psi = this.querySelector("#eng1-bleed-psi");
            this.htmlEng1Conn1 = this.querySelector("#left-engine-connection-obj1");//connections for IP and HP left
            this.htmlEng1Conn2 = this.querySelector("#left-engine-connection-obj2");
            this.htmlEng1Conn3 = this.querySelector("#left-engine-connection-obj3");
            this.htmlEng1Conn4 = this.querySelector("#left-engine-connection-obj4");
            this.htmlUnderLeft = this.querySelector("#under-left");

            this.htmlEngNumb2 = this.querySelector("#eng-numb-2");
            this.htmlEng2Tmp = this.querySelector("#eng2-bleed-tmp");
            this.htmlEng2Psi = this.querySelector("#eng2-bleed-psi");
            this.htmlEng2Conn1 = this.querySelector("#right-engine-connection-obj1");//connections for IP and HP right
            this.htmlEng2Conn2 = this.querySelector("#right-engine-connection-obj2");
            this.htmlEng2Conn3 = this.querySelector("#right-engine-connection-obj3");
            this.htmlEng2Conn4 = this.querySelector("#right-engine-connection-obj4");
            this.htmlUnderRight = this.querySelector("#under-right");

            this.htmlLeftPackIn = this.querySelector("#left-pack-in");
            this.htmlLeftPackOut = this.querySelector("#left-pack-out");
            this.htmlRightPackIn = this.querySelector("#right-pack-in");
            this.htmlRightPackOut = this.querySelector("#right-pack-out");

            this.apuProvidesBleed = false;
            this.apuBleedStartTimer = -1;

            this.eng1N2BelowIdle = true;
            this.eng2N2BelowIdle = true;

            this.thrustTOGAApplied = false;
            this.bothPacksOn = false;
            this.singlePackOn = false;
            this.flying = false;
            this.engineIdle = 58;

            this.feetToMeters = 0.3048;
            this.seaLevelPressurePascal = 101325;
            this.barometricPressureFactor = -0.00011857591;
            this.pascalToPSI = 0.000145038;
            this.inHgToPSI = 0.491154;

            //placeholder logic for packs
            this.engTempMultiplier1 = 0.08;
            this.engTempMultiplier2 = 0.0000009;
            this.engTempMultiplier3 = 0.31;
            this.engTempOffsetH = -510;
            this.engTempOffsetV = 200;
            this.engTempOffsetH2 = -860;
            this.engTempOffsetV2 = 276.4;

            this.packInMultiplier = 0.9;
            this.packOutMultiplier1 = 0.055;
            this.packOutMultiplier2 = 0.055;
            this.packInMultiplierApu = 0.8;
            this.packOutMultiplierApu = 0.1;
            this.temperatureVariationSpeed = 0.01;

            this.updateThrottler = new UpdateThrottler(500);
        }

        setWarningColorVal(value, htmlObj, upperLimit, lowerLimit) {
            if (value > upperLimit || value < lowerLimit) {
                htmlObj.setAttribute("class", "warning st2 st6");
            } else {
                htmlObj.setAttribute("class", "st7 st2 st6");
            }
        }

        setWarningOnLines(value, htmlObj) {
            if (value) {
                htmlObj.setAttribute("class", "st5");
            } else {
                htmlObj.setAttribute("class", "warning st5");
            }
        }

        setWarningOnNumbers(value1, value2, htmlObj) {
            if (value1 && value2) {
                htmlObj.setAttribute("class", "warning st1 st2 st6");
            } else {
                htmlObj.setAttribute("class", "st1 st2 st6");
            }
        }

        update(_deltaTime) {
            if (!this.isInitialised || !A320_Neo_EICAS.isOnBottomScreen()) {
                return;
            }

            if (this.updateThrottler.canUpdate(_deltaTime) === -1) {
                return;
            }

            const currentApuN = Arinc429Word.fromSimVarValue("L:A32NX_APU_N");
            const currentEng1N2 = SimVar.GetSimVarValue("ENG N2 RPM:1", "Rpm(0 to 16384 = 0 to 100%)");
            const currentEng2N2 = SimVar.GetSimVarValue("ENG N2 RPM:2", "Rpm(0 to 16384 = 0 to 100%)");
            const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "bool");
            const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "bool");
            const xBleedValveOpen = SimVar.GetSimVarValue("L:x_bleed_valve", "bool");
            const throttleEng1 = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "number");
            const throttleEng2 = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_TLA:1", "number");
            const apuBleedAirValveOpen = SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool");
            const currentXbleedState = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position", "number");
            const radioHeight = SimVar.GetSimVarValue("RADIO HEIGHT", "Feet");
            const apuSwitchState = SimVar.GetSimVarValue("L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON", "Bool") || SimVar.GetSimVarValue("L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON", "Bool");
            const fadecStatus = [SimVar.GetSimVarValue("L:A32NX_FADEC_POWERED_ENG1", "bool"), SimVar.GetSimVarValue("L:A32NX_FADEC_POWERED_ENG1", "bool")];
            const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second");
            const wingAntiInceState = SimVar.GetSimVarValue("STRUCTURAL DEICE SWITCH", "bool");
            const packRequestedlvl = Math.min(
                SimVar.GetSimVarValue("L:A32NX_OVHD_COND_CKPT_SELECTOR_KNOB", "number"),
                SimVar.GetSimVarValue("L:A32NX_OVHD_COND_FWD_SELECTOR_KNOB", "number"),
                SimVar.GetSimVarValue("L:A32NX_OVHD_COND_AFT_SELECTOR_KNOB", "number")
            );
            const outsidePressureINHG = SimVar.GetSimVarValue("AMBIENT PRESSURE", "inHg");
            const cabinAltFeet = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet");
            const cabinAltMeters = cabinAltFeet * this.feetToMeters;
            const cabinPressurePascal = this.seaLevelPressurePascal * Math.exp(this.barometricPressureFactor * cabinAltMeters); // Barometric formula
            const cabinPressurePSI = cabinPressurePascal * this.pascalToPSI;
            const outsidePressurePSI = outsidePressureINHG * this.inHgToPSI;
            const pressureDiff = cabinPressurePSI - outsidePressurePSI;

            const currentLeftPackState = SimVar.GetSimVarValue("L:A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN", "bool");
            const currentRightPackState = SimVar.GetSimVarValue("L:A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN", "bool");
            let currentPackFlow = SimVar.GetSimVarValue("L:A32NX_COND_PACK_FLOW", "number");
            if (currentPackFlow === 80) {
                currentPackFlow = 0;
            } else if (currentPackFlow === 120) {
                currentPackFlow = 2;
            } else {
                currentPackFlow = 1;
            }
            let currentRamState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_RAMAIR_TOGGLE", "bool");
            let currentEngineBleedState = [0, 0];
            currentEngineBleedState = [SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool"), SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool")];

            if (throttleEng1 > 42 && throttleEng2 > 42) {
                this.thrustTOGAApplied = true;
            } else {
                this.thrustTOGAApplied = false;
            }

            if (currentLeftPackState && currentRightPackState) {
                this.bothPacksOn = true;
                this.singlePackOn = false;
            } else if (currentLeftPackState || currentRightPackState) {
                this.bothPacksOn = false;
                this.singlePackOn = true;
            } else {
                this.bothPacksOn = false;
                this.singlePackOn = false;
            }

            if (radioHeight > 10) {
                this.flying = true;
            } else {
                this.flying = false;
            }

            if (!this.apuProvidesBleed && currentApuN.isNormalOperation() && currentApuN.value > 95) {
                this.apuProvidesBleed = true;
            }

            //checks if engines are below idle
            if (currentEng1N2 < this.engineIdle) {
                this.eng1N2BelowIdle = true;
            } else {
                this.eng1N2BelowIdle = false;
            }

            if (currentEng2N2 < this.engineIdle) {
                this.eng2N2BelowIdle = true;
            } else {
                this.eng2N2BelowIdle = false;
            }

            //closes the ram on takeoff and landing
            if (this.thrustTOGAApplied || (!this.flying && groundSpeed > 70) || Math.abs(pressureDiff) > 1) {
                currentRamState = 0;
            }

            //sets the engine bleed local variable to 0 if the engine is not running
            if (!eng1Running) {
                currentEngineBleedState[0] = 0;
            }

            if (!eng2Running) {
                currentEngineBleedState[1] = 0;
            }

            //sets IP valve to open or closed
            if (currentEngineBleedState[0] === 1) {
                this.leftEngineIp[0].setAttribute("visibility", "visible");
                this.leftEngineIp[1].setAttribute("visibility", "hidden");
                this.htmlUnderLeft.setAttribute("visibility", "visible");
            } else {
                this.leftEngineIp[0].setAttribute("visibility", "hidden");
                this.leftEngineIp[1].setAttribute("visibility", "visible");
                this.htmlUnderLeft.setAttribute("visibility", "hidden");
            }
            if (currentEngineBleedState[1] === 1) {
                this.rightEngineIp[0].setAttribute("visibility", "visible");
                this.rightEngineIp[1].setAttribute("visibility", "hidden");
                this.htmlUnderRight.setAttribute("visibility", "visible");
            } else {
                this.rightEngineIp[0].setAttribute("visibility", "hidden");
                this.rightEngineIp[1].setAttribute("visibility", "visible");
                this.htmlUnderRight.setAttribute("visibility", "hidden");
            }

            //closes HP valves if engine slightly above idle
            if (currentEngineBleedState[0] == 1 && eng1Running && currentEng1N2 < 60 && !this.flying) {
                this.leftEngineHp[0].setAttribute("visibility", "visible");
                this.leftEngineHp[1].setAttribute("visibility", "hidden");
                this.htmlEng1Conn4.setAttribute("visibility", "visible");
            } else {
                this.leftEngineHp[0].setAttribute("visibility", "hidden");
                this.leftEngineHp[1].setAttribute("visibility", "visible");
                this.htmlEng1Conn4.setAttribute("visibility", "hidden");
            }

            if (currentEngineBleedState[1] == 1 && eng2Running && currentEng2N2 < 60 && !this.flying) {
                this.rightEngineHp[0].setAttribute("visibility", "visible");
                this.rightEngineHp[1].setAttribute("visibility", "hidden");
                this.htmlEng2Conn4.setAttribute("visibility", "visible");
            } else {
                this.rightEngineHp[0].setAttribute("visibility", "hidden");
                this.rightEngineHp[1].setAttribute("visibility", "visible");
                this.htmlEng2Conn4.setAttribute("visibility", "hidden");
            }

            //find xbleed switch state
            if (currentXbleedState == 2) {
                SimVar.SetSimVarValue("L:x_bleed_valve", "bool", 1);
                this.centerLines[2].setAttribute("visibility", "visible");
                this.centerLines[1].setAttribute("visibility", "visible");
                this.xBleed[0].setAttribute("visibility", "visible");
                this.xBleed[1].setAttribute("visibility", "hidden");
            } else if (apuBleedAirValveOpen && currentXbleedState == 1) {
                SimVar.SetSimVarValue("L:x_bleed_valve", "bool", 1);
                this.centerLines[2].setAttribute("visibility", "visible");
                this.centerLines[1].setAttribute("visibility", "visible");
                this.xBleed[0].setAttribute("visibility", "visible");
                this.xBleed[1].setAttribute("visibility", "hidden");
            } else {
                SimVar.SetSimVarValue("L:x_bleed_valve", "bool", 0);
                this.centerLines[2].setAttribute("visibility", "hidden");
                this.centerLines[1].setAttribute("visibility", "hidden");
                this.xBleed[0].setAttribute("visibility", "hidden");
                this.xBleed[1].setAttribute("visibility", "visible");
            }

            //find if the APU bleed is on
            if (apuBleedAirValveOpen) {
                this.apuBleedIndication[0].setAttribute("visibility", 'visible');
                this.apuBleedIndication[1].setAttribute("visibility", "hidden");
                this.centerLines[1].setAttribute("visibility", "visible");
                if (apuSwitchState) {
                    this.centerLines[3].setAttribute("visibility", "visible");
                }
            } else {
                this.apuBleedIndication[0].setAttribute("visibility", "hidden");
                this.apuBleedIndication[1].setAttribute("visibility", "visible");
                this.centerLines[3].setAttribute("visibility", "hidden");
                if (!xBleedValveOpen) {
                    this.centerLines[1].setAttribute("visibility", "hidden");
                }
            }

            //shows or hides APU in the ecam page based on switch status
            if (apuSwitchState) {
                this.apuText.setAttribute("visibility", "visible");
                this.apuValve.setAttribute("visibility", "visible");
                this.apuConnectingLine.setAttribute("visibility", "visible");
            } else {
                this.apuText.setAttribute("visibility", "hidden");
                this.apuValve.setAttribute("visibility", "hidden");
                this.apuConnectingLine.setAttribute("visibility", "hidden");
                this.apuBleedIndication[0].setAttribute("visibility", 'hidden');
                this.apuBleedIndication[1].setAttribute("visibility", "hidden");
            }

            //hide GND during flight/when moving/at least one engine is running
            if (this.flying || eng1Running || eng2Running || groundSpeed > 1) {
                this.gndText.setAttribute("visibility", "hidden");
                this.gndTriangle.setAttribute("visibility", "hidden");
            } else {
                this.gndText.setAttribute("visibility", "visible");
                this.gndTriangle.setAttribute("visibility", "visible");
            }

            //find left pack status
            if (currentLeftPackState) {
                this.leftPack[0].setAttribute("visibility", "visible");
                this.leftPack[1].setAttribute("visibility", "hidden");
            } else {
                this.leftPack[0].setAttribute("visibility", "hidden");
                this.leftPack[1].setAttribute("visibility", "visible");
            }

            //find right pack status
            if (currentRightPackState) {
                this.rightPack[0].setAttribute("visibility", "visible");
                this.rightPack[1].setAttribute("visibility", "hidden");
            } else {
                this.rightPack[0].setAttribute("visibility", "hidden");
                this.rightPack[1].setAttribute("visibility", "visible");
            }

            //find ram air state
            if (currentRamState) {
                this.ramAir[0].setAttribute("visibility", "hidden");
                this.ramAir[1].setAttribute("visibility", "visible");
                this.ramAirConnection.setAttribute("visibility", "visible");
            } else {
                this.ramAir[0].setAttribute("visibility", "visible");
                this.ramAir[1].setAttribute("visibility", "hidden");
                this.ramAirConnection.setAttribute("visibility", "hidden");
            }

            //find wing anti ice state
            if (wingAntiInceState) {
                this.antiIceText.setAttribute("visibility", "visible");
                this.antiIceTriangles[0].setAttribute("visibility", "visible");
                this.antiIceTriangles[1].setAttribute("visibility", "visible");
            } else {
                this.antiIceText.setAttribute("visibility", "hidden");
                this.antiIceTriangles[0].setAttribute("visibility", "hidden");
                this.antiIceTriangles[1].setAttribute("visibility", "hidden");
            }

            //pack flow indicators, ready for continous knob
            this.packFlowIndicator[0].setAttribute("style", "transform-origin: 121px 227px; transform: rotate(" + currentPackFlow * 57.5 + "deg); stroke-width: 4.5px; stroke-linecap: round;");
            this.packFlowIndicator[1].setAttribute("style", "transform-origin: 479px 227px; transform: rotate(" + currentPackFlow * 57.5 + "deg); stroke-width: 4.5px; stroke-linecap: round;");

            //pack outflow indicators
            this.packIndicator[0].setAttribute("style", "transform-origin: 479px 152px; transform: rotate(" + packRequestedlvl * 1.23 + "deg); stroke-width: 4.5px; stroke-linecap: round;");
            this.packIndicator[1].setAttribute("style", "transform-origin: 121px 152px; transform: rotate(" + packRequestedlvl * 1.23 + "deg); stroke-width: 4.5px; stroke-linecap: round;");

            //placeholder logic for the bleed page temperatures and pressures, to be replaced/updated/removed when the cond-packs system is implemented
            const packRequestedTemp = 18 + (0.12 * packRequestedlvl);

            const eng1TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:1", "Celsius");
            const eng1PSI = parseInt(SimVar.GetSimVarValue("TURB ENG BLEED AIR:1", "Ratio (0-16384)") / 2.9);

            const eng2TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:2", "Celsius");
            const eng2PSI = parseInt(SimVar.GetSimVarValue("TURB ENG BLEED AIR:2", "Ratio (0-16384)") / 2.9);

            const apuTMPcomputed = parseInt(currentApuN.isNormalOperation() ? 100 * 2.5 : 0);
            const apuPSI = parseInt(currentApuN.isNormalOperation() ? 100 * 0.35 : 0);

            let eng1TMPcomputed;
            let eng2TMPcomputed;
            let packTemperatureVariation1 = 0;
            let packTemperatureVariation2 = 0;

            //prevents NaN error
            if (!this.packOutMultiplier1) {
                this.packOutMultiplier1 = 0.055;
            }

            if (!this.packOutMultiplier2) {
                this.packOutMultiplier2 = 0.055;
            }

            if (eng1TMP < 860) {
                eng1TMPcomputed = parseInt(((this.engTempMultiplier1 * (eng1TMP + this.engTempOffsetH)) + (this.engTempMultiplier2 * Math.pow((eng1TMP + this.engTempOffsetH), 3)) + this.engTempOffsetV));
            } else {
                eng1TMPcomputed = parseInt(this.engTempMultiplier3 * (eng1TMP + this.engTempOffsetH2) + this.engTempOffsetV2);
            }

            if (eng2TMP < 860) {
                eng2TMPcomputed = parseInt(((this.engTempMultiplier1 * (eng2TMP + this.engTempOffsetH)) + (this.engTempMultiplier2 * Math.pow((eng2TMP + this.engTempOffsetH), 3)) + this.engTempOffsetV));
            } else {
                eng2TMPcomputed = parseInt(this.engTempMultiplier3 * (eng2TMP + this.engTempOffsetH2) + this.engTempOffsetV2);
            }

            const packTMPComputedIn = [(parseInt((eng1TMPcomputed * this.packInMultiplier))),
                (parseInt((eng2TMPcomputed * this.packInMultiplier))),
                (parseInt(apuTMPcomputed * this.packInMultiplierApu))];

            const packTMPComputedOut = [(parseInt(eng1TMPcomputed * this.packOutMultiplier1)),
                (parseInt(eng2TMPcomputed * this.packOutMultiplier2)),
                (parseInt(apuTMPcomputed * this.packOutMultiplierApu))];

            if (eng1Running && packRequestedTemp && packTMPComputedOut[0] && this.packOutMultiplier1 && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow) && this.bothPacksOn && !this.thrustTOGAApplied) {
                packTemperatureVariation1 = ((((packRequestedTemp / packTMPComputedOut[0]) * this.packOutMultiplier1) - this.packOutMultiplier1));
                this.packOutMultiplier1 += packTemperatureVariation1 * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
            } else if (eng1Running && packRequestedTemp && packTMPComputedOut[0] && this.packOutMultiplier1 && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow)) {
                packTemperatureVariation1 = ((((packRequestedTemp / packTMPComputedOut[0]) * this.packOutMultiplier1) - this.packOutMultiplier1));
                this.packOutMultiplier1 += packTemperatureVariation1 * (this.temperatureVariationSpeed * (1.2));
            }

            if (eng2Running && packRequestedTemp && packTMPComputedOut[1] && this.packOutMultiplier2 && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow) && this.bothPacksOn && !this.thrustTOGAApplied) {
                packTemperatureVariation2 = ((((packRequestedTemp / packTMPComputedOut[1]) * this.packOutMultiplier2) - this.packOutMultiplier2));
                this.packOutMultiplier2 += packTemperatureVariation2 * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
            } else if (eng2Running && packRequestedTemp && packTMPComputedOut[1] && this.packOutMultiplier2 && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow)) {
                packTemperatureVariation2 = ((((packRequestedTemp / packTMPComputedOut[0]) * this.packOutMultiplier2) - this.packOutMultiplier2));
                this.packOutMultiplier2 += packTemperatureVariation2 * (this.temperatureVariationSpeed * (1.2));
            }

            if (packRequestedTemp && packTMPComputedOut[2] && this.packOutMultiplierApu && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow) && this.bothPacksOn && !this.thrustTOGAApplied) {
                const packTemperatureVariationAPU = ((((packRequestedTemp / packTMPComputedOut[2]) * this.packOutMultiplierApu) - this.packOutMultiplierApu));
                this.packOutMultiplierApu += packTemperatureVariationAPU * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
            } else if (packRequestedTemp && packTMPComputedOut[2] && this.packOutMultiplierApu && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow)) {
                const packTemperatureVariationAPU = ((((packRequestedTemp / packTMPComputedOut[2]) * this.packOutMultiplierApu) - this.packOutMultiplierApu));
                this.packOutMultiplierApu += packTemperatureVariationAPU * (this.temperatureVariationSpeed * (1.2));
            }

            if (currentEngineBleedState[1] && !currentEngineBleedState[0] && !apuBleedAirValveOpen && eng2Running && !xBleedValveOpen) {
                this.htmlEng2Tmp.textContent = eng2TMPcomputed;
                this.htmlEng2Psi.textContent = eng2PSI;
                this.htmlEng1Tmp.textContent = "XXX";
                this.htmlEng1Psi.textContent = "xx";
            } else if (currentEngineBleedState[1] && !currentEngineBleedState[0] && apuBleedAirValveOpen && eng2Running && !xBleedValveOpen) {
                this.htmlEng1Tmp.textContent = apuTMPcomputed;
                this.htmlEng1Psi.textContent = apuPSI;
                this.htmlEng2Tmp.textContent = eng2TMPcomputed;
                this.htmlEng2Psi.textContent = eng2PSI;
            } else if (currentEngineBleedState[1] && !currentEngineBleedState[0] && eng2Running && xBleedValveOpen) {
                this.htmlEng1Tmp.textContent = eng2TMPcomputed;
                this.htmlEng1Psi.textContent = eng2PSI;
                this.htmlEng2Tmp.textContent = eng2TMPcomputed;
                this.htmlEng2Psi.textContent = eng2PSI;
            } else if (xBleedValveOpen && apuBleedAirValveOpen && !currentEngineBleedState[0] && !currentEngineBleedState[1] && apuSwitchState) {
                this.htmlEng1Tmp.textContent = apuTMPcomputed;
                this.htmlEng1Psi.textContent = apuPSI;
                this.htmlEng2Tmp.textContent = apuTMPcomputed;
                this.htmlEng2Psi.textContent = apuPSI;
            } else if (currentEngineBleedState[0] && currentEngineBleedState[1] && xBleedValveOpen && eng1Running && eng2Running) {
                this.htmlEng1Tmp.textContent = eng1TMPcomputed;
                this.htmlEng1Psi.textContent = eng1PSI;
                this.htmlEng2Tmp.textContent = eng2TMPcomputed;
                this.htmlEng2Psi.textContent = eng2PSI;
            } else if (currentEngineBleedState[0] && currentEngineBleedState[1] && xBleedValveOpen && eng2Running) {
                this.htmlEng1Tmp.textContent = eng2TMPcomputed;
                this.htmlEng1Psi.textContent = eng2PSI;
                this.htmlEng2Tmp.textContent = eng2TMPcomputed;
                this.htmlEng2Psi.textContent = eng2PSI;
            } else if (currentEngineBleedState[0] && !currentEngineBleedState[1] && xBleedValveOpen && eng1Running) {
                this.htmlEng1Tmp.textContent = eng1TMPcomputed;
                this.htmlEng1Psi.textContent = eng1PSI;
                this.htmlEng2Tmp.textContent = eng1TMPcomputed;
                this.htmlEng2Psi.textContent = eng1PSI;
            } else if (currentEngineBleedState[0] && currentEngineBleedState[1] && !xBleedValveOpen && eng1Running && eng2Running) {
                this.htmlEng1Tmp.textContent = eng1TMPcomputed;
                this.htmlEng1Psi.textContent = eng1PSI;
                this.htmlEng2Tmp.textContent = eng2TMPcomputed;
                this.htmlEng2Psi.textContent = eng2PSI;
            } else if (!currentEngineBleedState[0] && !currentEngineBleedState[1] && !xBleedValveOpen && apuBleedAirValveOpen) {
                this.htmlEng1Tmp.textContent = apuTMPcomputed;
                this.htmlEng1Psi.textContent = apuPSI;
                this.htmlEng2Tmp.textContent = "XXX";
                this.htmlEng2Psi.textContent = "xx";
            } else if (currentEngineBleedState[0] && eng1Running && !xBleedValveOpen) {
                this.htmlEng1Tmp.textContent = eng1TMPcomputed;
                this.htmlEng1Psi.textContent = eng1PSI;
                this.htmlEng2Tmp.textContent = "XXX";
                this.htmlEng2Psi.textContent = "xx";
            } else if (currentEngineBleedState[0] && currentEngineBleedState[1] && !eng1Running && !eng2Running && xBleedValveOpen) {
                this.htmlEng1Tmp.textContent = apuTMPcomputed;
                this.htmlEng1Psi.textContent = apuPSI;
                this.htmlEng2Tmp.textContent = apuTMPcomputed;
                this.htmlEng2Psi.textContent = apuPSI;
            } else {
                this.htmlEng1Tmp.textContent = "XXX";
                this.htmlEng1Psi.textContent = "xx";
                this.htmlEng2Tmp.textContent = "XXX";
                this.htmlEng2Psi.textContent = "xx";
            }

            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK1_FAULT", "bool", 0);
            this.antiIceTriangles[0].setAttribute("class", "st5");
            if (currentLeftPackState && currentEngineBleedState[0] && eng1Running) {
                this.htmlLeftPackIn.textContent = packTMPComputedIn[0];
                this.htmlLeftPackOut.textContent = packTMPComputedOut[0];
            } else if (currentLeftPackState && xBleedValveOpen && eng2Running && currentEngineBleedState[1]) {
                this.htmlLeftPackIn.textContent = packTMPComputedIn[1];
                this.htmlLeftPackOut.textContent = packTMPComputedOut[1];
            } else if (currentLeftPackState && apuBleedAirValveOpen && this.apuProvidesBleed) {
                this.htmlLeftPackIn.textContent = packTMPComputedIn[2];
                this.htmlLeftPackOut.textContent = packTMPComputedOut[2];
            } else {
                if (currentLeftPackState) {
                    SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK1_FAULT", "bool", 1);
                }
                this.antiIceTriangles[0].setAttribute("class", "warning_trg st5");
                this.htmlLeftPackIn.textContent = "xx";
                this.htmlLeftPackOut.textContent = "xx";
            }

            SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK2_FAULT", "bool", 0);
            this.antiIceTriangles[1].setAttribute("class", "st5");
            if (currentRightPackState && currentEngineBleedState[1] && eng2Running) {
                this.htmlRightPackIn.textContent = packTMPComputedIn[1];
                this.htmlRightPackOut.textContent = packTMPComputedOut[1];
            } else if (currentRightPackState && xBleedValveOpen && eng1Running && currentEngineBleedState[0]) {
                this.htmlRightPackIn.textContent = packTMPComputedIn[0];
                this.htmlRightPackOut.textContent = packTMPComputedOut[0];
            } else if (currentRightPackState && apuBleedAirValveOpen && xBleedValveOpen && this.apuProvidesBleed) {
                this.htmlRightPackIn.textContent = packTMPComputedIn[2];
                this.htmlRightPackOut.textContent = packTMPComputedOut[2];
            } else {
                if (currentRightPackState) {
                    SimVar.SetSimVarValue("L:A32NX_AIRCOND_PACK2_FAULT", "bool", 1);
                }
                this.antiIceTriangles[1].setAttribute("class", "warning_trg st5");
                this.htmlRightPackIn.textContent = "xx";
                this.htmlRightPackOut.textContent = "xx";
            }

            //end of placeholder logic
            //sets temperatures and pressure to warning color if not in range, might wanna use this when switching system
            this.setWarningColorVal(this.htmlEng1Psi.textContent, this.htmlEng1Psi, 57, 4);
            this.setWarningColorVal(this.htmlEng2Psi.textContent, this.htmlEng2Psi, 57, 4);
            this.setWarningColorVal(this.htmlEng1Tmp.textContent, this.htmlEng1Tmp, 270, 150);
            this.setWarningColorVal(this.htmlEng2Tmp.textContent, this.htmlEng2Tmp, 270, 150);

            this.setWarningColorVal(this.htmlRightPackIn.textContent, this.htmlRightPackIn, 230, 0);
            this.setWarningColorVal(this.htmlLeftPackIn.textContent, this.htmlLeftPackIn, 230, 0);
            this.setWarningColorVal(this.htmlRightPackOut.textContent, this.htmlRightPackOut, 90, 0);
            this.setWarningColorVal(this.htmlLeftPackOut.textContent, this.htmlLeftPackOut, 90, 0);

            this.setWarningOnLines(eng1Running, this.htmlEng1Conn1);
            this.setWarningOnLines(eng1Running, this.htmlEng1Conn2);
            this.setWarningOnLines(eng1Running, this.htmlEng1Conn3);
            this.setWarningOnNumbers(this.eng1N2BelowIdle, fadecStatus[0], this.htmlEngNumb1);

            this.setWarningOnLines(eng2Running, this.htmlEng2Conn1);
            this.setWarningOnLines(eng2Running, this.htmlEng2Conn2);
            this.setWarningOnLines(eng2Running, this.htmlEng2Conn3);
            this.setWarningOnNumbers(this.eng2N2BelowIdle, fadecStatus[1], this.htmlEngNumb2);
        }
    }
    A320_Neo_LowerECAM_BLEED.Page = Page;
})(A320_Neo_LowerECAM_BLEED || (A320_Neo_LowerECAM_BLEED = {}));
customElements.define("a320-neo-lower-ecam-bleed", A320_Neo_LowerECAM_BLEED.Page);
