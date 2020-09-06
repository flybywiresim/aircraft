var A320_Neo_LowerECAM_WHEEL;
(function (A320_Neo_LowerECAM_WHEEL) {
    class Definitions {
    }
    A320_Neo_LowerECAM_WHEEL.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "LowerECAMWHEELTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            
            this.isInitialised = true;
            this.localVarUpdater = new LocalVarUpdater();
            //this.GearPrecentage = Simplane.getGearPosition();

            // ---
            this.selfTestTimer = 3;
            this.autoBrakeText = this.querySelector("#autoBrakeText");

            // Hyd Indicator for Steering
            this.speedbrakeHyd = this.querySelector("#speedbrakeHyd");
            this.normBrkHyd = this.querySelector("#normBrkHyd");
            this.atlnBrk = this.querySelector("#atlnBrk");
            //
            this.steeringNW = this.querySelector("#steering");
            this.lastSkiddState = -1;

            // Break Temp Precentage 
            this.BreakTemp1 = this.querySelector("#WheelTemp1");
            this.BreakTemp2 = this.querySelector("#WheelTemp2");
            this.BreakTemp3 = this.querySelector("#WheelTemp3");
            this.BreakTemp4 = this.querySelector("#WheelTemp4");

            this.dummyTempCounter = 1;
            this.dummyTempCounterCoolDown = 1;
            this.currentBreak1Temp = 45;
            this.currentBreak2Temp = 50;
            this.currentBreak3Temp = 45;
            this.currentBreak4Temp = 50;

            // Set Default State of Brakes Temp
            this.BreakTemp1.textContent = 45;
            this.BreakTemp2.textContent = 50;
            this.BreakTemp3.textContent = 45;
            this.BreakTemp4.textContent = 50;

                
            // - Some variables holders 
            this.engineOneHydG = "G";
            this.engineOneHydY = "Y";
            this.autoBrakeLow = "LOW";
            this.autoBrakeMed = "MED";
            this.autoBrakeMax = "MAX";

        }   


        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            this.updateTempColor(_deltaTime);
            this.updateHydroSymbols(_deltaTime);
            this.updateAutoBreak(_deltaTime);
            this.updateSkidToggle(_deltaTime);

            // Break Temp - this is a based loop checking both speed and current break pressure
            // 
            const currentBreakRight = SimVar.GetSimVarValue("BRAKE RIGHT POSITION", "position 32k");
            const currentBreakLeft =  SimVar.GetSimVarValue("BRAKE LEFT POSITION", "position 32k");
            const currentParkingBreak = SimVar.GetSimVarValue("BRAKE PARKING INDICATOR","Bool");

            if(Simplane.getGroundSpeed() > 20 && currentBreakLeft >= 30000 && currentBreakRight >= 30000 && !currentParkingBreak)
            {
                //console.warn("Speed is High and you are applying Breaks adjust temp");
                this.dummyTempCounter += _deltaTime/1000;
                // Add temp slowly
                this.currentBreak1Temp = Math.round(this.currentBreak1Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;
                this.currentBreak2Temp = Math.round(this.currentBreak1Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;
                this.currentBreak3Temp = Math.round(this.currentBreak1Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;
                this.currentBreak4Temp = Math.round(this.currentBreak1Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;

                this.BreakTemp1.textContent = this.currentBreak1Temp;
                this.BreakTemp2.textContent = this.currentBreak2Temp;
                this.BreakTemp3.textContent = this.currentBreak3Temp;
                this.BreakTemp4.textContent = this.currentBreak4Temp;
                this.dummyTempCounter = 0;
               
            } else if(currentBreakLeft <= 0 && currentBreakRight <= 0 && !currentParkingBreak) {

                if(this.currentBreak1Temp > 45 || this.currentBreak2Temp > 50 || this.currentBreak3Temp > 45 || this.currentBreak4Temp > 50)
                {
                    //console.warn("Speed is High and you are applying Breaks adjust temp");
                    this.dummyTempCounter += _deltaTime/1000;

                    // Add cool down slowly
                    this.currentBreak1Temp -= this.dummyTempCounter;
                    this.currentBreak2Temp -= this.dummyTempCounter;
                    this.currentBreak3Temp -= this.dummyTempCounter;
                    this.currentBreak4Temp -= this.dummyTempCounter;
                    
                    this.BreakTemp1.textContent = Math.round(this.currentBreak1Temp);
                    this.BreakTemp2.textContent = Math.round(this.currentBreak2Temp);
                    this.BreakTemp3.textContent = Math.round(this.currentBreak3Temp);
                    this.BreakTemp4.textContent = Math.round(this.currentBreak4Temp);

                    this.dummyTempCounter = 0;
                }
            }
           
        }

        updateTempColor(_deltaTime)
        {
            if(this.currentBreak1Temp <= 100 || this.currentBreak2Temp <= 100|| this.currentBreak3Temp <= 100|| this.currentBreak4Temp <= 100) {
                this.BreakTemp1.setAttribute("class", "WHEELTempPrecentage");
                this.BreakTemp2.setAttribute("class", "WHEELTempPrecentage");
                this.BreakTemp3.setAttribute("class", "WHEELTempPrecentage");
                this.BreakTemp4.setAttribute("class", "WHEELTempPrecentage");
            }
            if(this.currentBreak1Temp >= 300 || this.currentBreak2Temp >= 300 || this.currentBreak3Temp >= 300 || this.currentBreak4Temp >= 300)
            {
                this.BreakTemp1.setAttribute("class", "WHEELBREAKWARNING");
                this.BreakTemp2.setAttribute("class", "WHEELBREAKWARNING");
                this.BreakTemp3.setAttribute("class", "WHEELBREAKWARNING");
                this.BreakTemp4.setAttribute("class", "WHEELBREAKWARNING");
            } 
            if(this.currentBreak1Temp >= 500 || this.currentBreak2Temp >= 500 || this.currentBreak3Temp >= 500 || this.currentBreak4Temp >= 500) {
                this.BreakTemp1.setAttribute("class", "WHEELBREAKRED");
                this.BreakTemp2.setAttribute("class", "WHEELBREAKRED");
                this.BreakTemp3.setAttribute("class", "WHEELBREAKRED");
                this.BreakTemp4.setAttribute("class", "WHEELBREAKRED");
            } 
        }

        // Need to check if Engine 1 or 2 have pushed enough Hydralics 
        updateHydroSymbols(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            const hydroLeftEnginePrecentage = this.localVarUpdater._engineOneHydralicsPressure();
            const hydroRightEnginePrecentage = this.localVarUpdater._engineTwoHydralicsPressure();

            // Why two ifs, cause part of breaks work with G and Y hydralics depending on Engine
            if(hydroLeftEnginePrecentage >= 2500) {
                this.normBrkHyd.setAttribute("visibility","hidden");
            } else {
                this.normBrkHyd.setAttribute("visibility","visible");
            }
            
            if(hydroRightEnginePrecentage >= 2500) {
                this.speedbrakeHyd.setAttribute("visibility","hidden");
                this.atlnBrk.setAttribute("visibility","hidden");
            } else {
                this.speedbrakeHyd.setAttribute("visibility","visible");
                this.atlnBrk.setAttribute("visibility","visible");
            }

        }

        updateSkidToggle(_deltaTime) {
            const currentSkiddState = this.localVarUpdater._antiSkiddOn();

            if (this.lastSkiddState != currentSkiddState) {
                this.lastSkiddState = currentSkiddState;
                if (currentSkiddState === 1) {
                    this.steeringNW.setAttribute("class", "ALTNBRKIndicator");
                }
            }

            if (currentSkiddState === 0) {
                this.steeringNW.setAttribute("class", "WHEELBREAKWARNING");
            }
        }


        updateAutoBreak(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            const autoBreakSelected = this.localVarUpdater._autoBrakeIndicating();
            //const antiSkidOn = this.localVarUpdater._antiSkiddOn();

            if(autoBreakSelected === 0){
                this.autoBrakeText.setAttribute("visibility","hidden");
                this.autoBrakeTextShowned = false;
                return;
            }

            // if user selects AUTO BRAKE LOW , MED, MAX show it
            if(autoBreakSelected === 1 && !this.isAutoBrakeIndiShown) {
                this.autoBrakeText.setAttribute("visibility","visible");
                this.autoBrakeText.textContent = this.autoBrakeLow;

            } else if(autoBreakSelected === 2 && !this.isAutoBrakeIndiShown) {
                this.autoBrakeText.setAttribute("visibility","visible");
                this.autoBrakeText.textContent = this.autoBrakeMed;

            } else if(autoBreakSelected === 3 && !this.isAutoBrakeIndiShown) {
                this.autoBrakeText.setAttribute("visibility","visible");
                this.autoBrakeText.textContent = this.autoBrakeMax;
            }


        }


        



    }
    A320_Neo_LowerECAM_WHEEL.Page = Page;
})(A320_Neo_LowerECAM_WHEEL || (A320_Neo_LowerECAM_WHEEL = {}));
customElements.define("a320-neo-lower-ecam-wheel", A320_Neo_LowerECAM_WHEEL.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_WHEEL.js.map
