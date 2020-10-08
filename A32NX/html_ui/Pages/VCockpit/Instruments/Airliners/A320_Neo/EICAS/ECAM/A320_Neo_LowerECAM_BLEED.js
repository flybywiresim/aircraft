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
            this.centerLines = [this.querySelector("#center-line-1"), this.querySelector("#center-line-2"), this.querySelector("#center-line-3"),
                this.querySelector("#center-line-4"), this.querySelector("#center-line-5"), this.querySelector("#center-line-6"),];
            this.apuConnectingLine =  this.querySelector("#apu-connecting-line");
            this.apuText = this.querySelector("#APUtext");
            this.apuValve = this.querySelector("#apu-valve");
            this.gndText = this.querySelector("#GND");
            this.gndTriangle = this.querySelector("#GND-triangle");
            this.htmlEngNumb1 = this.querySelector("#eng-numb-1");    
            this.htmlEng1Tmp = this.querySelector("#eng1-bleed-tmp");
            this.htmlEng1Psi = this.querySelector("#eng1-bleed-psi");   
            this.htmlEng1Conn1 = this.querySelector("#left-engine-connection-obj1");//connections for IP and HP left
            this.htmlEng1Conn2 = this.querySelector("#left-engine-connection-obj2");
            this.htmlEng1Conn3 = this.querySelector("#left-engine-connection-obj3");    

            this.htmlEngNumb2 = this.querySelector("#eng-numb-2"); 
            this.htmlEng2Tmp = this.querySelector("#eng2-bleed-tmp");
            this.htmlEng2Psi = this.querySelector("#eng2-bleed-psi");
            this.htmlEng2Conn1 = this.querySelector("#right-engine-connection-obj1");//connections for IP and HP right
            this.htmlEng2Conn2 = this.querySelector("#right-engine-connection-obj2");
            this.htmlEng2Conn3 = this.querySelector("#right-engine-connection-obj3");

            this.htmlLeftPackIn = this.querySelector("#left-pack-in");
            this.htmlLeftPackOut = this.querySelector("#left-pack-out");
            this.htmlRightPackIn = this.querySelector("#right-pack-in");
            this.htmlRightPackOut = this.querySelector("#right-pack-out");

            this.apuProvidesBleed = false;
            this.apuBleedTemperature = 250;
            this.apuBleedStartTimer = -1;

            this.eng1N2BelowIdle = true;
            this.eng2N2BelowIdle = true;

            this.thrustTOGAApplied = false;
            this.bothPacksOn = false;
            this.singlePackOn = false;
            this.flying = false;

            //placeholder logic for packs
            this.engTempMultiplier1 = 0.06;
            this.engTempMultiplier2 = 0.0000012;
            this.engTempOffsetH = -494;
            this.engTempOffsetV = 173;

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

        setWarningColorVal(value, htmlObj, upperLimit, lowerLimit){
            if(value > upperLimit || value < lowerLimit){
                htmlObj.setAttribute("class", "warning st2 st6");
            }else{
                htmlObj.setAttribute("class", "st7 st2 st6");
            }
        }

        setWarningOnLines(value, htmlObj){
            if(value){
                htmlObj.setAttribute("class", "st5")
            } else {
                htmlObj.setAttribute("class", "warning st5");
            }
        }  

        setWarningOnNumbers(value, htmlObj){
            if(value){
                htmlObj.setAttribute("class", "st1 st2 st6")
            } else {
                htmlObj.setAttribute("class", "warning st1 st2 st6");
            }
        }    
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            const currentEngineBleedState = [SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool"), SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool")];
            const currentApuN = SimVar.GetSimVarValue("APU PCT RPM", "percent");

            const currentEng1N2 = SimVar.GetSimVarValue("ENG N2 RPM:1", "Rpm(0 to 16384 = 0 to 100%)");
            const currentEng2N2 = SimVar.GetSimVarValue("ENG N2 RPM:2", "Rpm(0 to 16384 = 0 to 100%)");

            const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "bool");
            const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "bool");

            const xBleedValveOpen = SimVar.GetSimVarValue("L:x_bleed_valve", "bool");

            const throttleEng1 = SimVar.GetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "number");
            const throttleEng2 = SimVar.GetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "number");

            const currentApuBleedSate = SimVar.GetSimVarValue("BLEED AIR APU", "Bool");

            const currentLeftPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "bool");
            const currentRightPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "bool");

            const currentXbleedState = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position", "Position(0-2)");

            const currentRamState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_RAMAIR_TOGGLE", "bool");

            const currentPackFlow = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position", "Position(0-2)");

            const packRequestedlvl = Math.min(...[SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_1", "Position(0-6)"),
                SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_2", "Position(0-6)"),
                SimVar.GetSimVarValue("L:A320_Neo_AIRCOND_LVL_3", "Position(0-6)")]);

            const radioHeight = SimVar.GetSimVarValue("RADIO HEIGHT", "Feet");
            
            if(throttleEng1 > 0.891 && throttleEng2 > 0.891) {
                this.thrustTOGAApplied = true;
            } else {
                this.thrustTOGAApplied = false;
            }

            if(currentLeftPackState && currentRightPackState) {
                this.bothPacksOn = true;
                this.singlePackOn = false;
            } else if (currentLeftPackState || currentRightPackState) {
                this.bothPacksOn = false;
                this.singlePackOn = true;
            } else {
                this.bothPacksOn = false;
                this.singlePackOn = false;
            }

            if(radioHeight > 10) {
                this.flying = true;
            } else {
                this.flying = false;
            }

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

            if(currentEng1N2 < 58.3) {
                this.eng1N2BelowIdle = true;
            }else{
                this.eng1N2BelowIdle = false;
            }

            if(currentEng2N2 < 58.3) {
                this.eng2N2BelowIdle = true;
            }else{
                this.eng2N2BelowIdle = false;
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
            if (currentApuBleedSate) {
                this.apuBleedIndication[0].setAttribute("visibility", 'visible');
                this.apuBleedIndication[1].setAttribute("visibility", "hidden");
            } else {
                this.apuBleedIndication[0].setAttribute("visibility", "hidden");
                this.apuBleedIndication[1].setAttribute("visibility", "visible");
            }

            //hide central part during flight
            if(this.flying){  
                this.centerLines[1].setAttribute("visibility", "hidden");
                this.centerLines[2].setAttribute("visibility", "hidden");
                this.centerLines[3].setAttribute("visibility", "hidden");        
                this.gndText.setAttribute("visibility", "hidden");
                this.gndTriangle.setAttribute("visibility", "hidden");
                this.apuBleedIndication[0].setAttribute("visibility", "hidden");
                this.apuBleedIndication[1].setAttribute("visibility", "hidden");
                this.apuConnectingLine.setAttribute("visibility", "hidden");
                this.apuText.setAttribute("visibility", "hidden");
                this.apuValve.setAttribute("visibility", "hidden");
            } else {             
                this.centerLines[1].setAttribute("visibility", "visible");
                this.centerLines[2].setAttribute("visibility", "visible");
                this.centerLines[3].setAttribute("visibility", "visible");         
                this.gndText.setAttribute("visibility", "visible");
                this.gndTriangle.setAttribute("visibility", "visible");
                this.apuConnectingLine.setAttribute("visibility", "visible");
                this.apuText.setAttribute("visibility", "visible");
                this.apuValve.setAttribute("visibility", "visible");
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

            //find xbleed switch state
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
            if (currentRamState) {
                this.ramAir[0].setAttribute("visibility", "hidden");
                this.ramAir[1].setAttribute("visibility", "visible");
            } else {
                this.ramAir[0].setAttribute("visibility", "visible");
                this.ramAir[1].setAttribute("visibility", "hidden");
            }

            //find pack flow state
            if (currentPackFlow == 0 && !this.thrustTOGAApplied && this.bothPacksOn) {
                this.packFlow[0].setAttribute("visibility", "visible");
                this.packFlow[1].setAttribute("visibility", "hidden");
                this.packFlow[2].setAttribute("visibility", "hidden");
            } else if (currentPackFlow == 1 && !this.thrustTOGAApplied && this.bothPacksOn) {
                this.packFlow[0].setAttribute("visibility", "hidden");
                this.packFlow[1].setAttribute("visibility", "visible");
                this.packFlow[2].setAttribute("visibility", "hidden");
            } else {
                this.packFlow[0].setAttribute("visibility", "hidden");
                this.packFlow[1].setAttribute("visibility", "hidden");
                this.packFlow[2].setAttribute("visibility", "visible");
            }

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

            this.setWarningOnLines(eng1Running, this.htmlEng1Conn1);
            this.setWarningOnLines(eng1Running, this.htmlEng1Conn2);
            this.setWarningOnLines(eng1Running, this.htmlEng1Conn3);
            this.setWarningOnNumbers(!this.eng1N2BelowIdle, this.htmlEngNumb1);

            this.setWarningOnLines(eng2Running, this.htmlEng2Conn1);
            this.setWarningOnLines(eng2Running, this.htmlEng2Conn2);
            this.setWarningOnLines(eng2Running, this.htmlEng2Conn3);
            this.setWarningOnNumbers(!this.eng2N2BelowIdle, this.htmlEngNumb2);

            //placeholder logic for the bleed page temperatures and pressures, to be replaced/updated/removed when the cond-packs system is implemented
            if (!this.packOutMultiplier1) {
                this.packOutMultiplier1 = 0.055;
            }

            if (!this.packOutMultiplier2) {
                this.packOutMultiplier2 = 0.055;
            }

            const packRequestedTemp = 18 + (2 * packRequestedlvl);

            const eng1TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:1", "Rankine");
            const eng1TMPconverted = ((eng1TMP - 491.67) * (5 / 9));
            const eng1TMPcomputed = parseInt(((this.engTempMultiplier1 * (eng1TMPconverted + this.engTempOffsetH)) + (this.engTempMultiplier2 * Math.pow((eng1TMPconverted + this.engTempOffsetH), 3)) + this.engTempOffsetV));
            const eng1PSI = parseInt(SimVar.GetSimVarValue("TURB ENG BLEED AIR:1", "Ratio (0-16384)") / 2);
            
            const eng2TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:2", "Rankine");
            const eng2TMPConverted = ((eng2TMP - 491.67) * (5 / 9));
            const eng2TMPcomputed = parseInt(((this.engTempMultiplier1 * (eng2TMPConverted + this.engTempOffsetH)) + (this.engTempMultiplier2 * Math.pow((eng2TMPConverted + this.engTempOffsetH), 3)) + this.engTempOffsetV));
            const eng2PSI = parseInt(SimVar.GetSimVarValue("TURB ENG BLEED AIR:2", "Ratio (0-16384)") / 2);

            const apuTMPcomputed = currentApuN * 2.5;
           
            const packTMPComputedIn = [(parseInt(((eng1TMP - 491.67) * (5 / 9)) * this.packInMultiplier)),
                (parseInt(((eng2TMP - 491.67) * (5 / 9)) * this.packInMultiplier)),
                (parseInt(apuTMPcomputed * this.packInMultiplierApu))];

            const packTMPComputedOut = [(parseInt(((eng1TMP - 491.67) * (5 / 9)) * this.packOutMultiplier1)),
                (parseInt(((eng2TMP - 491.67) * (5 / 9)) * this.packOutMultiplier2)),
                (parseInt(apuTMPcomputed * this.packOutMultiplierApu))];

            let packTemperatureVariation1 = 0;
            let packTemperatureVariation2 = 0;

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

            if(packRequestedTemp && packTMPComputedOut[2] && this.packOutMultiplierApu && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow) && this.bothPacksOn && !this.thrustTOGAApplied){
                const packTemperatureVariationAPU = ((((packRequestedTemp / packTMPComputedOut[2]) * this.packOutMultiplierApu) - this.packOutMultiplierApu));
                this.packOutMultiplierApu += packTemperatureVariationAPU * (this.temperatureVariationSpeed * (0.8 + (currentPackFlow * 0.2)));
            } else if (packRequestedTemp && packTMPComputedOut[2] && this.packOutMultiplierApu && this.temperatureVariationSpeed && (currentPackFlow == 0 || currentPackFlow)){
                const packTemperatureVariationAPU = ((((packRequestedTemp / packTMPComputedOut[2]) * this.packOutMultiplierApu) - this.packOutMultiplierApu));
                this.packOutMultiplierApu += packTemperatureVariationAPU * (this.temperatureVariationSpeed * (1.2));
            }

            //sets temperatures and pressure to warning color if not in range, might wanna use this when switching system
            this.setWarningColorVal(eng1TMPcomputed, this.htmlEng1Tmp, 270, 150);
            this.setWarningColorVal(eng2TMPcomputed, this.htmlEng2Tmp, 270, 150);
            this.setWarningColorVal(eng1PSI, this.htmlEng1Psi, 57, 4);
            this.setWarningColorVal(eng2PSI, this.htmlEng2Psi, 57, 4);
      
            if (currentEngineBleedState[0] && eng1Running) {
                this.htmlEng1Tmp.textContent = eng1TMPcomputed;
                this.htmlEng1Psi.textContent = eng1PSI;
            } else {
                this.htmlEng1Tmp.textContent = "XXX";
                this.htmlEng1Psi.textContent = "xx";
                this.htmlEng1Tmp.setAttribute("class", "st7 st2 st6");
                this.htmlEng1Psi.setAttribute("class", "st7 st2 st6");
            }

            if (currentLeftPackState && currentEngineBleedState[0] && eng1Running) {
                this.htmlLeftPackIn.textContent = packTMPComputedIn[0];
                this.htmlLeftPackOut.textContent = packTMPComputedOut[0];
                this.setWarningColorVal(packTMPComputedIn[0], this.htmlLeftPackIn, 257, 0);
                this.setWarningColorVal(packTMPComputedOut[0], this.htmlLeftPackOut, 90, 0);
            } else if (currentLeftPackState && xBleedValveOpen && eng2Running && currentEngineBleedState[1]) {
                this.htmlLeftPackIn.textContent = packTMPComputedIn[1];
                this.htmlLeftPackOut.textContent = packTMPComputedOut[1];
                this.setWarningColorVal(packTMPComputedIn[1], this.htmlLeftPackIn, 257, 0);
                this.setWarningColorVal(packTMPComputedOut[1], this.htmlLeftPackOut, 90, 0);
            } else if (currentLeftPackState && currentApuBleedSate && this.apuProvidesBleed) {
                this.htmlLeftPackIn.textContent = packTMPComputedIn[2];
                this.htmlLeftPackOut.textContent = packTMPComputedOut[2];
                this.setWarningColorVal(packTMPComputedIn[2], this.htmlLeftPackIn, 257, 0);
                this.setWarningColorVal(packTMPComputedOut[2], this.htmlLeftPackOut, 90, 0);
            } else {
                this.htmlLeftPackIn.textContent = "xx";
                this.htmlLeftPackOut.textContent = "xx";
            }

            if (currentEngineBleedState[1] && eng2Running) {
                this.htmlEng2Tmp.textContent = eng2TMPcomputed;
                this.htmlEng2Psi.textContent = eng2PSI;
            } else {
                this.htmlEng2Tmp.textContent = "XXX";
                this.htmlEng2Psi.textContent = "xx";
                this.htmlEng2Tmp.setAttribute("class", "st7 st2 st6");
                this.htmlEng2Psi.setAttribute("class", "st7 st2 st6");
            }

            if (currentRightPackState && currentEngineBleedState[1] && eng2Running) {
                this.htmlRightPackIn.textContent = packTMPComputedIn[1];
                this.htmlRightPackOut.textContent = packTMPComputedOut[1];
                this.setWarningColorVal(packTMPComputedIn[1], this.htmlRightPackIn, 257, 0);
                this.setWarningColorVal(packTMPComputedOut[1], this.htmlRightPackOut, 90, 0);
            } else if (currentRightPackState && xBleedValveOpen && eng1Running && currentEngineBleedState[0]) {
                this.htmlRightPackIn.textContent = packTMPComputedIn[0];
                this.htmlRightPackOut.textContent = packTMPComputedOut[0];
                this.setWarningColorVal(packTMPComputedIn[0], this.htmlRightPackIn, 257, 0);
                this.setWarningColorVal(packTMPComputedOut[0], this.htmlRightPackOut, 90, 0);
            } else if (currentRightPackState && currentApuBleedSate && xBleedValveOpen && this.apuProvidesBleed) {
                this.htmlRightPackIn.textContent = packTMPComputedIn[2];
                this.htmlRightPackOut.textContent = packTMPComputedOut[2];
                this.setWarningColorVal(packTMPComputedIn[2], this.htmlRightPackIn, 257, 0);
                this.setWarningColorVal(packTMPComputedOut[2], this.htmlRightPackOut, 90, 0);
            } else {
                this.htmlRightPackIn.textContent = "xx";
                this.htmlRightPackOut.textContent = "xx";
            }
            //end of placeholder logic
        }
    }
    A320_Neo_LowerECAM_BLEED.Page = Page;
})(A320_Neo_LowerECAM_BLEED || (A320_Neo_LowerECAM_BLEED = {}));
customElements.define("a320-neo-lower-ecam-bleed", A320_Neo_LowerECAM_BLEED.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_BLEED.js.map