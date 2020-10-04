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
            this.leftPack = [this.querySelector("#left-pack-connection-open"), this.querySelector("#left-pack-connection-closed")]
            this.rightPack = [this.querySelector("#right-pack-connection-open"), this.querySelector("#right-pack-connection-closed")]
            this.xBleed = [this.querySelector("#xbleed-connection-open"), this.querySelector("#xbleed-connection-closed")]
            this.ramAir = [this.querySelector("#ram-air-on"), this.querySelector("#ram-air-off")]
            this.packFlow = [this.querySelector("#pack-flow-low"), this.querySelector("#pack-flow-normal"), this.querySelector("#pack-flow-high")]
            this.apuProvidesBleed = false
            this.apuBleedStartTimer = -1

        }   
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            var currentEngineBleedState = [SimVar.GetSimVarValue("BLEED AIR ENGINE:1", "Bool"), SimVar.GetSimVarValue("BLEED AIR ENGINE:2", "Bool")]
            var currentApuN = SimVar.GetSimVarValue("APU PCT RPM", "percent")

            if (!this.apuProvidesBleed && (currentApuN > 0.94)) {
                this.apuBleedStartTimer = 2
            }

            if (this.apuBleedStartTimer >= 0) {
                this.apuBleedStartTimer -= _deltaTime/1000
                if (this.apuBleedStartTimer < 0) {
                    this.apuProvidesBleed = true
                    this.querySelector("#apu-connecting-line").setAttribute("style", "stroke:008000")
                }
            }
            
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

            if (currentApuBleedSate) {
                this.apuBleedIndication[0].setAttribute("visibility", 'visible')
                this.apuBleedIndication[1].setAttribute("visibility", "hidden")
            } else {
                this.apuBleedIndication[0].setAttribute("visibility", "hidden")
                this.apuBleedIndication[1].setAttribute("visibility", "visible")
            }

            //find left pack status
            var currentLeftPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "bool")

            if(currentLeftPackState){
                this.leftPack[0].setAttribute("visibility", "visible")
                this.leftPack[1].setAttribute("visibility", "hidden")
            } else {
                this.leftPack[0].setAttribute("visibility", "hidden")
                this.leftPack[1].setAttribute("visibility", "visible")
            }

            //find right pack status
            var currentRightPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "bool")

            if(currentRightPackState){
                this.rightPack[0].setAttribute("visibility", "visible")
                this.rightPack[1].setAttribute("visibility", "hidden")
            } else {
                this.rightPack[0].setAttribute("visibility", "hidden")
                this.rightPack[1].setAttribute("visibility", "visible")
            }

            //find xbleed switch state
            var currentXbleedState = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_XBLEED_Position", "Position(0-2)")

            if(currentXbleedState == 2 ){
                this.xBleed[0].setAttribute("visibility", "visible")
                this.xBleed[1].setAttribute("visibility", "hidden")
            } else if(currentApuBleedSate && currentXbleedState == 1){
                this.xBleed[0].setAttribute("visibility", "visible")
                this.xBleed[1].setAttribute("visibility", "hidden")
            } else {
                this.xBleed[0].setAttribute("visibility", "hidden")
                this.xBleed[1].setAttribute("visibility", "visible")
            }

            //find ram air state
            var currentRamState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_RAMAIR_TOGGLE", "bool")

            if(currentRamState) {
                this.ramAir[0].setAttribute("visibility", "hidden")
                this.ramAir[1].setAttribute("visibility", "visible")
            } else {
                this.ramAir[0].setAttribute("visibility", "visible")
                this.ramAir[1].setAttribute("visibility", "hidden")
            }

             //find pack flow state
             var currentPackFlow = SimVar.GetSimVarValue("L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position", "Position(0-2)")

            if(currentPackFlow == 0){
                 this.packFlow[0].setAttribute("visibility", "visible")
                 this.packFlow[1].setAttribute("visibility", "hidden")
                 this.packFlow[2].setAttribute("visibility", "hidden")
            } else if(currentPackFlow == 1) {
                 this.packFlow[0].setAttribute("visibility", "hidden")
                 this.packFlow[1].setAttribute("visibility", "visible")
                 this.packFlow[2].setAttribute("visibility", "hidden")
            } else {
                 this.packFlow[0].setAttribute("visibility", "hidden")
                 this.packFlow[1].setAttribute("visibility", "hidden")
                 this.packFlow[2].setAttribute("visibility", "visible")
            }

            //mock logic for the bleed page temperatures and pressures, to be replaced/updated/removed when the cond-packs system is implemented

            var eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "bool")
            var eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "bool")

            var eng1TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:1", "Rankine")      
            var eng1PSI = SimVar.GetSimVarValue("TURB ENG BLEED AIR:1", "Ratio (0-16384)")

            var eng2TMP = SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:2", "Rankine")
            var eng2PSI = SimVar.GetSimVarValue("TURB ENG BLEED AIR:2", "Ratio (0-16384)")

            var xBleedValveOpen = false

            if((currentXbleedState == 2 || (currentXbleedState == 1 && currentApuBleedSate))){
                xBleedValveOpen = true
            }else{
                xBleedValveOpen = false
            }

            if(currentEngineBleedState[0] && eng1Running){
                this.querySelector("#eng1-bleed-tmp").textContent = parseInt(((eng1TMP - 491.67) * (5 / 9)) / 4)
                this.querySelector("#eng1-bleed-psi").textContent = parseInt(eng1PSI)
                } else {
                this.querySelector("#eng1-bleed-tmp").textContent = "XXX"
                this.querySelector("#eng1-bleed-psi").textContent = "xx"
            }

            if(currentLeftPackState && currentEngineBleedState[0] && eng1Running){
                this.querySelector("#left-pack-in").textContent = parseInt(((eng1TMP - 491.67) * (5 / 9)) / 9)
                this.querySelector("#left-pack-out").textContent = parseInt(((eng1TMP - 491.67) * (5 / 9)) / 20)
                console.log("catch")
            } else if (currentLeftPackState && xBleedValveOpen && eng2Running && currentEngineBleedState[1]){
                this.querySelector("#left-pack-in").textContent = parseInt(((eng2TMP - 491.67) * (5 / 9)) / 9)
                this.querySelector("#left-pack-out").textContent = parseInt(((eng2TMP - 491.67) * (5 / 9)) / 20)
            } else if (currentLeftPackState && currentApuBleedSate){
                this.querySelector("#left-pack-in").textContent = parseInt(400 / 7)
                this.querySelector("#left-pack-out").textContent = parseInt(400 / 18)
            } else {
                this.querySelector("#left-pack-in").textContent = "xx"
                this.querySelector("#left-pack-out").textContent = "xx"
            }

            if(currentEngineBleedState[1] && eng2Running){
                this.querySelector("#eng2-bleed-tmp").textContent = parseInt(((eng2TMP - 491.67) * (5 / 9)) / 4)
                this.querySelector("#eng2-bleed-psi").textContent = parseInt(eng2PSI)    
            } else {
                this.querySelector("#eng2-bleed-tmp").textContent = "XXX"
                this.querySelector("#eng2-bleed-psi").textContent = "xx"
            }

            if(currentRightPackState && currentEngineBleedState[1] && eng2Running ){          
                this.querySelector("#right-pack-in").textContent = parseInt(((eng2TMP - 491.67) * (5 / 9)) / 9) 
                this.querySelector("#right-pack-out").textContent = parseInt(((eng2TMP - 491.67) * (5 / 9)) / 20) 
            } else if (currentRightPackState && xBleedValveOpen && eng1Running && currentEngineBleedState[0]) {
                this.querySelector("#right-pack-in").textContent = parseInt(((eng1TMP - 491.67) * (5 / 9)) / 9) 
                this.querySelector("#right-pack-out").textContent = parseInt(((eng1TMP - 491.67) * (5 / 9)) / 20) 
            } else if (currentRightPackState && currentApuBleedSate && xBleedValveOpen){
                this.querySelector("#right-pack-in").textContent = parseInt(400 / 7)
                this.querySelector("#right-pack-out").textContent = parseInt(400 / 18)
            } else {
                this.querySelector("#right-pack-in").textContent = "xx"
                this.querySelector("#right-pack-out").textContent = "xx"
            } 
             //end of mock logic
        }
    }
    A320_Neo_LowerECAM_BLEED.Page = Page;
})(A320_Neo_LowerECAM_BLEED || (A320_Neo_LowerECAM_BLEED = {}));
customElements.define("a320-neo-lower-ecam-bleed", A320_Neo_LowerECAM_BLEED.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_BLEED.js.map