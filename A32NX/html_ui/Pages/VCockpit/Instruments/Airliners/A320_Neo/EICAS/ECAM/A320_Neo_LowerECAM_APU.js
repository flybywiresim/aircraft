var A320_Neo_LowerECAM_APU;
(function (A320_Neo_LowerECAM_APU) {
    class Definitions {
    }
    A320_Neo_LowerECAM_APU.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "LowerECAMAPUTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.lastAPUMasterState = 0;
            SimVar.SetSimVarValue("L:APU_FLAP_OPEN", "Bool", 0);
            SimVar.SetSimVarValue("L:APU_STARTERSW_AVAIL","Bool",0);

            //Generator
            this.APUGenInfo = this.querySelector("#APUGenInfo_On");
            this.APUGenAvailArrow = this.querySelector("#APUGenAvailArrow");
            this.APUGenLoad = this.querySelector("#APUGenLoad");
            this.APUVolts = this.querySelector("#APUGenVoltage");
            this.APUFrequency = this.querySelector("#APUGenFrequency");

            //Avail
            this.APUAvail = this.querySelector("#APUAvail_On");

            //Flap Open
            this.APUFlapOpen = this.querySelector("#APUFlapOpen_On");

            //Bleed
            this.APUBleedOn = this.querySelector("#APUBleed_On");
            this.APUBleedOff = this.querySelector("#APUBleed_Off");
            this.APUBleedPressure = this.querySelector("#APUBleedAirPressure");

            //Gauges
            this.apuInfo = new APUInfo(this.querySelector("#APUGauges"));

            this.APUStartTimer = -1;
            this.APUFlapTimer = -1;
            this.APUBleedTimer = -1;
            this.APULastBleedState = 0;
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            var currentAPUMasterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool");


            if (this.lastAPUMasterState != currentAPUMasterState) {
                this.lastAPUMasterState = currentAPUMasterState;
                this.APUStartTimer = 2;
                this.APUFlapTimer = 20;
                this.APUGenInfo.setAttribute("visibility", "visible");
            }
            //starter sw delay
            if (this.APUStartTimer >= 0) {
                this.APUStartTimer -= _deltaTime/1000;
                if (this.APUStartTimer <= 0) {
                    this.APUStartTimer = -1;
                    SimVar.SetSimVarValue("L:APU_STARTERSW_AVAIL", "Bool", 1);
                }
            }
            //flap open delay
            if (this.APUFlapTimer >= 0) {
                this.APUFlapTimer -= _deltaTime/1000;
                if (this.APUFlapTimer <= 0) {
                    this.APUFlapTimer = -1;
                    SimVar.SetSimVarValue("L:APU_FLAP_OPEN", "Bool", 1);
                }
            }

            if (SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool") === 0) {
                this.APUStartTimer = -1;
                this.APUFlapTimer = -1;
                SimVar.SetSimVarValue("L:APU_FLAP_OPEN", "Bool", 0);
                SimVar.SetSimVarValue("L:APU_STARTSW_AVAIL","Bool",0);
            }

            //APU start, stop
            var APUPctRPM = SimVar.GetSimVarValue("APU PCT RPM", "percent");
            if(APUPctRPM >= 87){
                SimVar.SetSimVarValue("L:APU_GEN_ONLINE","Bool",1);
                SimVar.SetSimVarValue("L:APU_GEN_VOLTAGE","Volts",115);
                SimVar.SetSimVarValue("L:APU_GEN_AMPERAGE","Amperes",782.609); // 1000 * 90 kVA / 115V = 782.609A
                SimVar.SetSimVarValue("L:APU_GEN_FREQ","Hertz",Math.round((4.46*APUPctRPM)-46.15));
                SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",35);
                SimVar.SetSimVarValue("L:APU_LOAD_PERCENT","percent",SimVar.GetSimVarValue("L:APU_GEN_AMPERAGE","Amperes")/SimVar.GetSimVarValue("ELECTRICAL TOTAL LOAD AMPS","Amperes"));
            }
            else{
                SimVar.SetSimVarValue("L:APU_GEN_ONLINE","Bool",0);
                SimVar.SetSimVarValue("L:APU_GEN_VOLTAGE","Volts",0);
                SimVar.SetSimVarValue("L:APU_GEN_AMPERAGE","Amperes",0);
                SimVar.SetSimVarValue("L:APU_GEN_FREQ","Hertz",0);
                SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",0);
                SimVar.SetSimVarValue("L:APU_LOAD_PERCENT","percent",0);
            }
            //Bleed
            if ((SimVar.GetSimVarValue("BLEED AIR APU","Bool") && !(this.APULastBleedState == 1))) {
                this.APUBleedTimer = 4;
                this.APULastBleedState = 1;
            }
            //display volt,load,freq
            this.APUGenLoad.textContent = Math.round(SimVar.GetSimVarValue("L:APU_LOAD_PERCENT","percent"));
            this.APUVolts.textContent = SimVar.GetSimVarValue("L:APU_GEN_VOLTAGE","Volts");
            this.APUVolts.setAttribute("class", "APUGenParamValue");
            this.APUFrequency.textContent = SimVar.GetSimVarValue("L:APU_GEN_FREQ","Hertz");
            this.APUFrequency.setAttribute("class", "APUGenParamValue");

            if (SimVar.GetSimVarValue("BLEED AIR APU", "Bool") == 1){
                this.APUBleedOn.setAttribute("visibility", "visible");
                this.APUBleedOff.setAttribute("visibility", "hidden");
            } else {
                this.APULastBleedState = 0;
                this.APUBleedOn.setAttribute("visibility", "hidden");
                this.APUBleedOff.setAttribute("visibility", "visible");
            }

            //AVAIL indication & bleed pressure
            if (APUPctRPM > 95) {
                if(this.APUBleedTimer > 0){
                    this.APUBleedTimer -= _deltaTime/1000;
                    SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",Math.round(36-this.APUBleedTimer));
                }
                else{
                    this.APUBleedTimer = -1;
                }
                this.APUAvail.setAttribute("visibility", "visible");
                if (SimVar.GetSimVarValue("APU GENERATOR ACTIVE", "Bool") == 1 && SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool") === 0) this.APUGenAvailArrow.setAttribute("visibility", "visible");
                else this.APUGenAvailArrow.setAttribute("visibility", "hidden");
                this.APUBleedPressure.textContent = SimVar.GetSimVarValue("L:APU_BLEED_PRESSURE","PSI");
                this.APUBleedPressure.setAttribute("class", "APUGenParamValue");
            } else {
                this.APUAvail.setAttribute("visibility", "hidden");
                this.APUGenAvailArrow.setAttribute("visibility", "hidden");
                this.APUBleedPressure.textContent = "XX";
                this.APUBleedPressure.setAttribute("class", "APUGenParamValueWarn");
            }

            //Gauges
            if (this.apuInfo != null) {
                this.apuInfo.update(_deltaTime);
            }

            //Flap Open
            if (SimVar.GetSimVarValue("L:APU_FLAP_OPEN", "Bool") == 1) {
                this.APUFlapOpen.setAttribute("visibility", "visible");
                this.APUGenInfo.setAttribute("visibility", "visible");
            } else {
                if (APUPctRPM <= 7) {
                    this.APUFlapOpen.setAttribute("visibility", "hidden");
                }
                this.APUGenInfo.setAttribute("visibility", "hidden");
            }

        }
    }
    A320_Neo_LowerECAM_APU.Page = Page;

    class APUInfo {
        constructor(_gaugeDiv) {

            this.lastN = 0;
            this.APUWarm = false;

            //APU N Gauge
            var gaugeDef1 = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef1.arcSize = 200;
            gaugeDef1.currentValuePrecision = 0;
            gaugeDef1.minValue = 0;
            gaugeDef1.maxValue = 110;
            gaugeDef1.minRedValue = 101;
            gaugeDef1.maxRedValue = 110;
            gaugeDef1.dangerRange[0] = 101;
            gaugeDef1.dangerRange[1] = 110;
            gaugeDef1.currentValueFunction = this.getAPUN.bind(this);
            this.apuNGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.apuNGauge.id = "APU_N_Gauge";
            this.apuNGauge.init(gaugeDef1);
            this.apuNGauge.addGraduation(0, true, "0");
            this.apuNGauge.addGraduation(50, true);
            this.apuNGauge.addGraduation(100, true, "10");
            this.apuNGauge.active = false
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.apuNGauge);
            }

            //APU EGT Gauge
            var gaugeDef2 = new A320_Neo_ECAM_Common.GaugeDefinition();
            gaugeDef2.arcSize = 220;
            gaugeDef2.currentValuePrecision = 0;
            gaugeDef2.minValue = 300;
            gaugeDef2.maxValue = 1200;
            gaugeDef2.minRedValue = 1000;
            gaugeDef2.maxRedValue = 1200;
            gaugeDef2.dangerRange[0] = 1000;
            gaugeDef2.dangerRange[1] = 1200;
            gaugeDef2.currentValueFunction = this.getAPUEGT.bind(this);
            this.apuEGTGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.apuEGTGauge.id = "APU_EGT_Gauge";
            this.apuEGTGauge.init(gaugeDef2);
            this.apuEGTGauge.addGraduation(300, true, "3");
            this.apuEGTGauge.addGraduation(700, true, "7");
            this.apuEGTGauge.addGraduation(1000, true, "10");
            this.apuEGTGauge.active = false
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.apuEGTGauge);
            }
            this.apuInactiveTimer = -1
            this.lastAPUMasterState = 0
            this.apuShuttingDown = false
        }

        update(_deltaTime) {
            //Update gauges
            var currentAPUMasterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool");
            if ((currentAPUMasterState !== this.lastAPUMasterState) && currentAPUMasterState === 1) {
                this.apuInactiveTimer = 3
                this.lastAPUMasterState = currentAPUMasterState
                this.apuShuttingDown = false
            }
            if ((currentAPUMasterState !== this.lastAPUMasterState) && currentAPUMasterState === 0) {
                this.apuShuttingDown = true
            }
            if (this.apuShuttingDown && SimVar.GetSimVarValue("APU PCT RPM", "percent") === 0) {
                this.apuEGTGauge.active = false
                this.apuNGauge.active = false
            }
            if (this.apuInactiveTimer >= 0) {
                this.apuInactiveTimer -= _deltaTime/1000
                if (this.apuInactiveTimer <= 0) {
                    this.apuInactiveTimer = -1
                    this.apuEGTGauge.active = true
                    this.apuNGauge.active = true
                }
            }
            if (this.apuNGauge != null && this.apuEGTGauge != null) {
                this.apuNGauge.update(_deltaTime);
                this.apuEGTGauge.update(_deltaTime);
            }
        }

        getAPUN() {
            return SimVar.GetSimVarValue("APU PCT RPM", "percent");
        }

        //Calculates the APU EGT Based on the RPM, APU now reaches peak EGT of 765'C
        getAPUEGTRaw(startup) {
            var n = this.getAPUN();
            if (startup) {
                if (n < 10) {
                    return 10;
                } else if(n <14){
                    reuturn ((90/6*n)- 140);
                } else if (n < 20) {
                    return ((215/4*n)-760);
                } else if(n < 32){
                    return ((420/11*n)-481.8);
                } else if (n < 36) {
                    return (20/3*n)+525;
                } else if (n < 43) {
                    return ((-15/6*n)+888.3);
                } else if(n < 50){
                    return ((3*n)+618)
                } else if(n < 74){
                    return ((-100/13)*n+1152.3);
                } else {
                    return ((-104/10*n)+1430);
                }
            } else {
                return ((18/5)*n)+35;
            }
        }

        getAPUEGT() {
            let ambient = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");

            var n = this.getAPUN();
            var egt = (Math.round(this.getAPUEGTRaw(this.lastN <= n)));
            this.lastN = n;
            if (this.APUWarm && egt < 100) {
                return 100;
            } else {
                if (n > 1) this.APUWarm = false;
                // range from getAPUEGTRaw is 10~900 C
                return ambient + (egt - 10);
            }
        }

    }
    A320_Neo_LowerECAM_APU.APUInfo = APUInfo;
})(A320_Neo_LowerECAM_APU || (A320_Neo_LowerECAM_APU = {}));
customElements.define("a320-neo-lower-ecam-apu", A320_Neo_LowerECAM_APU.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_APU.js.map
