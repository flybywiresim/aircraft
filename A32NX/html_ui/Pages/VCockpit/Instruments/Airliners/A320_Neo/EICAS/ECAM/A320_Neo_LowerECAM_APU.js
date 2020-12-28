/** @type A320_Neo_LowerECAM_APU */
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
        get templateID() {
            return "LowerECAMAPUTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            // Last state tracking inits to -1 since we don't know what the state is.
            // The first update sets it correctly for us.
            this.lastAPUMasterState = -1;
            this.lastAdirsAligned = -1;
            this.lastAPUBleedState = -1;

            //Generator
            this.APUGenInfo = this.querySelector("#APUGenInfo_On");
            this.APUGenAvailArrow = this.querySelector("#APUGenAvailArrow");
            this.APUGenLoad = this.querySelector("#APUGenLoad");
            this.APUVolts = this.querySelector("#APUGenVoltage");
            this.APUFrequency = this.querySelector("#APUGenFrequency");
            this.APUGenTitle = this.querySelector("#APUGenParams");

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

            this.previousState = {
                APUPctRPM: undefined,
                adirsAligned: undefined,
                apuGenActive: undefined,
                externalPowerOn: undefined
            };

            this.APUBleedTimer = 0;
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            // *******************************************************************************************************
            // APU Logic that isn't tied to the APU ECAM SCREEN belongs in A32NX/html_ui/Pages/A32NX_Core/A32NX_APU.js
            // *******************************************************************************************************

            const currentAPUMasterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool");

            if (this.lastAPUMasterState != currentAPUMasterState) {
                this.lastAPUMasterState = currentAPUMasterState;
                if (currentAPUMasterState === 1) {
                    this.APUGenInfo.setAttribute("visibility", "visible");
                    this.APUGenTitle.setAttribute("class", "APUGenTitle");
                }
            }

            const APUPctRPM = SimVar.GetSimVarValue("APU PCT RPM", "percent");

            const apuFlapOpenPercent = SimVar.GetSimVarValue("L:APU_FLAP_OPEN", "Percent");

            // Bleed
            const currentAPUBleedState = SimVar.GetSimVarValue("BLEED AIR APU","Bool");

            if (currentAPUBleedState !== this.lastAPUBleedState) {
                this.lastAPUBleedState = currentAPUBleedState;

                if (currentAPUBleedState === 1) {
                    this.APUBleedOn.setAttribute("visibility", "visible");
                    this.APUBleedOff.setAttribute("visibility", "hidden");
                } else {
                    this.APUBleedOn.setAttribute("visibility", "hidden");
                    this.APUBleedOff.setAttribute("visibility", "visible");
                }
            }

            //display volt,load,freq
            this.APUGenLoad.textContent = Math.round(SimVar.GetSimVarValue("L:APU_LOAD_PERCENT","percent"));
            this.APUVolts.textContent = SimVar.GetSimVarValue("L:APU_GEN_VOLTAGE","Volts");
            this.APUVolts.setAttribute("class", "APUGenParamValue");
            this.APUFrequency.textContent = SimVar.GetSimVarValue("L:APU_GEN_FREQ","Hertz");
            this.APUFrequency.setAttribute("class", "APUGenParamValue");

            const adirsAligned = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Number") === 2;
            const apuGenActive = SimVar.GetSimVarValue("APU GENERATOR ACTIVE", "Bool") === 1;
            const externalPowerOn = SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool") === 0;

            // AVAIL indication & bleed pressure
            const doUpdateAvailAndBleed =
                   APUPctRPM !== this.previousState.APUPctRPM
                || adirsAligned !== this.previousState.adirsAligned
                || apuGenActive !== this.previousState.apuGenActive
                || externalPowerOn !== this.previousState.externalPowerOn;

            if (doUpdateAvailAndBleed) {
                this.previousState.APUPctRPM = APUPctRPM;
                this.previousState.adirsAligned = adirsAligned;
                this.previousState.apuGenActive = apuGenActive;
                this.previousState.externalPowerOn = apuGenActive;

                if (APUPctRPM > 95) {
                    this.APUAvail.setAttribute("visibility", "visible");

                    if (apuGenActive && externalPowerOn) {
                        this.APUGenAvailArrow.setAttribute("visibility", "visible");
                    } else {
                        this.APUGenAvailArrow.setAttribute("visibility", "hidden");
                    }

                    this.APUBleedPressure.textContent = SimVar.GetSimVarValue("L:APU_BLEED_PRESSURE","PSI");
                    this.APUBleedPressure.setAttribute("class", "APUGenParamValue");
                }

                if (APUPctRPM < 95 || !adirsAligned) {
                    this.APUAvail.setAttribute("visibility", "hidden");
                    this.APUGenAvailArrow.setAttribute("visibility", "hidden");
                    this.APUBleedPressure.textContent = "XX";
                    this.APUBleedPressure.setAttribute("class", "APUGenParamValueWarn");

                    if (currentAPUMasterState === 0) {
                        this.APUGenInfo.setAttribute("visibility", "hidden");
                        this.APUGenTitle.setAttribute("class", "APUGenTitleInactive");
                    }
                }
            }

            //Flap Open
            if (apuFlapOpenPercent === 100) {
                this.APUFlapOpen.setAttribute("visibility", "visible");
            } else {
                this.APUFlapOpen.setAttribute("visibility", "hidden");
            }

            //Gauges
            if (this.apuInfo != null) {
                this.apuInfo.update(_deltaTime);
            }
        }
    }
    A320_Neo_LowerECAM_APU.Page = Page;

    class APUInfo {
        constructor(_gaugeDiv) {

            this.lastN = 0;
            this.APUWarm = false;

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
            gaugeDef1.currentValueFunction = this.getAPUN.bind(this);
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
            gaugeDef2.minRedValue = 1000;
            gaugeDef2.maxRedValue = 1100;
            gaugeDef2.dangerRange[0] = 1000;
            gaugeDef2.dangerRange[1] = 1100;
            gaugeDef2.currentValuePos.x = 0.8;
            gaugeDef2.currentValuePos.y = 0.74;
            gaugeDef2.currentValueFunction = this.getAPUEGT.bind(this);
            gaugeDef2.outerDynamicMarkerFunction = this.getAPUEGTWarn.bind(this,"EGTWarn");
            this.apuEGTGauge = window.document.createElement("a320-neo-ecam-gauge");
            this.apuEGTGauge.id = "APU_EGT_Gauge";
            this.apuEGTGauge.init(gaugeDef2);
            this.apuEGTGauge.addGraduation(300, true, "3");
            this.apuEGTGauge.addGraduation(700, true, "7");
            this.apuEGTGauge.addGraduation(1000, true, "10");
            this.apuEGTGauge.addGraduation(1100,false,"",true,true,"EGTWarn");
            this.apuEGTGauge.active = false;
            if (_gaugeDiv != null) {
                _gaugeDiv.appendChild(this.apuEGTGauge);
            }

            // Last state tracking inits to -1 since we don't know what the state is.
            // The first update sets it correctly for us.
            this.lastAPUMasterState = -1;
            this.apuShuttingDown = false;
            this.apuInactiveTimer = -1;
        }

        update(_deltaTime) {
            //Update gauges
            const currentAPUMasterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:8", "Bool");
            if ((currentAPUMasterState !== this.lastAPUMasterState)) {
                this.lastAPUMasterState = currentAPUMasterState;
                if (currentAPUMasterState === 1) {
                    this.apuInactiveTimer = 3;
                    this.apuShuttingDown = false;
                } else {
                    this.apuShuttingDown = true;
                }
            }

            if (this.apuShuttingDown && this.getAPUN() === 0) {
                this.apuEGTGauge.active = false;
                this.apuNGauge.active = false;
            }

            if (this.apuInactiveTimer >= 0) {
                this.apuInactiveTimer -= _deltaTime / 1000;
                if (this.apuInactiveTimer <= 0) {
                    this.apuInactiveTimer = -1;
                    this.apuEGTGauge.active = true;
                    this.apuNGauge.active = true;
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

        //function accepts ID of the marker and returns an array with ID and EGT
        getAPUEGTWarn(_id) {
            const n = this.getAPUN();
            const ID_EGT = [];
            ID_EGT.push(_id);
            if (n < 11) {
                ID_EGT.push(1100);
                return ID_EGT;
            } else if (n <= 15) {
                ID_EGT.push(((-50 * n) + 1650));
                return ID_EGT;
            } else if (n <= 65) {
                ID_EGT.push(((-3 * n) + 945));
                return ID_EGT;
            } else {
                ID_EGT.push(((-30 / 7 * n) + 1028.6));
                return ID_EGT;
            }
        }
        //Calculates the APU EGT Based on the RPM, APU now reaches peak EGT of 765'C
        getAPUEGTRaw(startup) {
            const n = this.getAPUN();
            if (startup) {
                if (n < 10) {
                    return 10;
                } else if (n <= 14) {
                    return (90 / 6 * n) - 140;
                } else if (n <= 20) {
                    return (215 / 4 * n) - 760;
                } else if (n <= 32) {
                    return (420 / 11 * n) - 481.8;
                } else if (n <= 36) {
                    return (20 / 3 * n) + 525;
                } else if (n <= 43) {
                    return (-15 / 6 * n) + 888.3;
                } else if (n <= 50) {
                    return (3 * n) + 618;
                } else if (n <= 74) {
                    return (-100 / 13 * n) + 1152.3;
                } else {
                    return (-104 / 10 * n) + 1430;
                }
            } else {
                return (18 / 5 * n) + 35;
            }
        }

        getAPUEGT() {
            const ambient = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");

            const n = this.getAPUN();
            const egt = (Math.round(this.getAPUEGTRaw(this.lastN <= n)));
            this.lastN = n;
            if (this.APUWarm && egt < 100) {
                return 100;
            } else {
                if (n > 1) {
                    this.APUWarm = false;
                }
                // range from getAPUEGTRaw is 10~900 C
                return ambient + (egt - 10);
            }
        }

    }
    A320_Neo_LowerECAM_APU.APUInfo = APUInfo;
})(A320_Neo_LowerECAM_APU || (A320_Neo_LowerECAM_APU = {}));

customElements.define("a320-neo-lower-ecam-apu", A320_Neo_LowerECAM_APU.Page);