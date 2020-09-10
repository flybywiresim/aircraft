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

            // ---
            this.selfTestTimer = 3;
            this.newTimer = 3;
            this.textAmber;

            this.autoBrakeText = this.querySelector("#autoBrakeText");

            // Hyd Indicator for Steering
            this.speedbrakeHyd = this.querySelector("#speedbrakeHyd");
            this.normBrkHyd = this.querySelector("#normBrkHyd");
            this.atlnBrk = this.querySelector("#atlnBrk");
            //
            this.steeringNW = this.querySelector("#steering");
            this.antiSkidd = this.querySelector("#antiskid");
            this.lastSkiddState = -1;

            // Break Temp Precentage 
            this.BreakTemp1 = this.querySelector("#WheelTemp1");
            this.BreakTemp2 = this.querySelector("#WheelTemp2");
            this.BreakTemp3 = this.querySelector("#WheelTemp3");
            this.BreakTemp4 = this.querySelector("#WheelTemp4");

            this.autoBreakIndicator = this.querySelector("#autobrake");
            this.autoBreakIndicator.setAttribute("visibility","hidden");
            this.autoBreakBlinker = this.querySelector("#blinkAutoBreak")
            this.autoBreakBlinker.setAttribute("visibility","hidden");

            // Spoiler
            this.spoilerRight = this.querySelector("#spoilerRight");
            this.spoilerRight.setAttribute("visibility","hidden");

            this.spoilerLeft = this.querySelector("#spoilerLeft");
            this.spoilerLeft.setAttribute("visibility","hidden");

            this.tempText = this.querySelector("#temp");
            this.tempText.setAttribute("visibility","hidden");

            // Need to finish making failure logic
            this.failureLGCIUS1 = false;
            this.failureLGCIUS2 = false;

            // End of Failures

            this.dummyTempCounter = 1;
            this.dummyTempCounterCoolDown = 1;

            // The code below can be stream line better for now it works 
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


            //LandingGEAR
            this.leftLGGroup = this.querySelector("#leftSideLandingGear");
            this.rightLGGroup = this.querySelector("#RightSideLandingGear");
            this.centerLGGroup = this.querySelector("#centerLandingGroup");

            this.LGFailureXX = this.querySelector("#LGFailure");
            this.LGFailureXX.setAttribute("visibility","hidden");

            this.greenBarLeft = this.querySelector("#leftLGBar");
            this.greenBarRight = this.querySelector("#rightLGBar");
            this.greenBarCenter = this.querySelector("#LGFailure");

            this.orangeBars = this.querySelector("#orangeLGDown");
            this.orangeBars.setAttribute("visibility","hidden");

            this.greenBarUp = this.querySelector("#greenBarUp");

        }   


        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            this.updateTempColor(_deltaTime);
            this.updateHydroSymbols(_deltaTime);
            this.updateAutoBreak(_deltaTime);
            this.updateSkidToggle(_deltaTime);
            this.updateSpoilerSpeedBreak(_deltaTime);
            this.updateLandingGear(_deltaTime);


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

        // Need to check if Engine 1 or 2 have pushed enough Hydralics Also need to push alerts into ECAM Messages
        updateHydroSymbols(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            const hydroLeftEnginePrecentage = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:1","pound-force per square foot");
            const hydroRightEnginePrecentage = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:2","pound-force per square foot");

            if(hydroRightEnginePrecentage >= 250000 && hydroRightEnginePrecentage >= 250000) {
                this.tempText.setAttribute("class","ALTNBRKIndicator");
                if (this.selfTestTimer >= 0 ) {
                    this.selfTestTimer -= _deltaTime / 1000;
                    if (this.selfTestTimer <= 0) {
                        this.tempText.setAttribute("visibility","hidden");
                        this.selfTestTimer = 3;
                        this.textAmber = false;
                    }
                }
            } else if(hydroRightEnginePrecentage <= 250000 && hydroRightEnginePrecentage <= 250000) {
                this.tempText.setAttribute("visibility","visible");
                this.tempText.setAttribute("class","WHEELBREAKWARNING");
                this.textAmber = true;
            }

            // Why two ifs, cause part of breaks system works with G and Y hydralics depending on Engine
            if(hydroLeftEnginePrecentage >= 250000) {
                this.normBrkHyd.setAttribute("visibility","hidden");
            } else {
                this.normBrkHyd.setAttribute("visibility","visible");
            }
            
            if(hydroRightEnginePrecentage >= 250000) {
                this.speedbrakeHyd.setAttribute("visibility","hidden");
                this.atlnBrk.setAttribute("visibility","hidden");
            } else {
                this.speedbrakeHyd.setAttribute("visibility","visible");
                this.atlnBrk.setAttribute("visibility","visible");
            }

        }

        // Need to update the ECAM Messages left side when Skidd is turned off casue when off AUTO Break is off too
        updateSkidToggle(_deltaTime) {
            //console.log("Calling from Wheels Page");
            const currentSkiddState = SimVar.GetSimVarValue("ANTISKID BRAKES ACTIVE","Bool");

            if(currentSkiddState === 1 && this.textAmber == false)
            {
                this.steeringNW.setAttribute("class", "ALTNBRKIndicator");
                this.antiSkidd.setAttribute("class", "ALTNBRKIndicator");
                if (this.newTimer >= 0 ) {
                    this.newTimer -= _deltaTime / 1000;
                    if (this.newTimer <= 0) {
                        this.steeringNW.setAttribute("visibility","hidden");
                        this.antiSkidd.setAttribute("visibility","hidden");
                        this.newTimer = 3;
                    }
                }
            }

            if (currentSkiddState === 0) {
                this.steeringNW.setAttribute("visibility","visible");
                this.antiSkidd.setAttribute("visibility","visible");
                this.steeringNW.setAttribute("class", "WHEELBREAKWARNING");
                this.antiSkidd.setAttribute("class", "WHEELBREAKWARNING");
            }
        }


        updateAutoBreak(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            const autoBreakSelected = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Number");
            const autoBrakeActive =  SimVar.GetSimVarValue("AUTOBRAKES ACTIVE", "Bool");

            if(autoBreakSelected === 0) {
                this.autoBrakeText.setAttribute("visibility","hidden");
                this.autoBreakIndicator.setAttribute("visibility","hidden");
                return;
            } 

            // if user selects AUTO BRAKE LOW , MED, MAX show it
            if(autoBreakSelected === 1 && !this.isAutoBrakeIndiShown) {
                this.autoBreakIndicator.setAttribute("visibility","visible");
                this.autoBrakeText.setAttribute("visibility","visible");
                this.autoBrakeText.textContent = this.autoBrakeLow;

            } else if(autoBreakSelected === 2 && !this.isAutoBrakeIndiShown) {
                this.autoBreakIndicator.setAttribute("visibility","visible");
                this.autoBrakeText.setAttribute("visibility","visible");
                this.autoBrakeText.textContent = this.autoBrakeMed;

            } else if(autoBreakSelected === 3 && !this.isAutoBrakeIndiShown) {
                this.autoBreakIndicator.setAttribute("visibility","visible");
                this.autoBrakeText.setAttribute("visibility","visible");
                this.autoBrakeText.textContent = this.autoBrakeMax;
            }


            // When landing flash auto break on wheel page then let it go away
            if(autoBrakeActive) {
                this.autoBreakIndicator.setAttribute("visibility","hidden");
                this.autoBreakBlinker.setAttribute("visibility","visible");
                if (this.selfTestTimer >= 0 ) {
                    this.selfTestTimer -= _deltaTime / 1000;
                    if (this.selfTestTimer <= 0) {
                        this.autoBreakBlinker.setAttribute("visibility","hidden");
                        this.selfTestTimer = 3;
                    }
                }
            }

        }


        // Spoiler / Speed Break updater
        updateSpoilerSpeedBreak(_deltaTime) {
            if(!this.isInitialised || !SimVar.GetSimVarValue("SPOILER AVAILABLE","Bool")) {
                return;
            }

            const spoilerLeftPos = SimVar.GetSimVarValue("SPOILERS LEFT POSITION","percent");
            const spoilerRightPos = SimVar.GetSimVarValue("SPOILERS RIGHT POSITION","percent");

            if(spoilerRightPos >= 1) {
                this.spoilerRight.setAttribute("visibility","visible");
            } else {
                this.spoilerRight.setAttribute("visibility","hidden");
            }

            if(spoilerLeftPos >= 1) {
                this.spoilerLeft.setAttribute("visibility","visible");
            } else {
                this.spoilerLeft.setAttribute("visibility","hidden");
            }
        }


        updateLandingGear(_deltaTime) {
            //-- LandingGear

            const landingGearRight = SimVar.GetSimVarValue("GEAR RIGHT POSITION","Percent Over 100");
            const landingGearLeft = SimVar.GetSimVarValue("GEAR LEFT POSITION","Percent Over 100");
            const landingGearCenter = SimVar.GetSimVarValue("GEAR CENTER POSITION","Percent Over 100");
            
            if(landingGearRight >= 0.1 && landingGearRight <= 0.9) {
                this.rightLGGroup.setAttribute("class","BlinkLandingGear");
                this.orangeBars.setAttribute("visibility","visible");
                this.greenBarUp.setAttribute("visibility","hidden");
            } else {
                this.rightLGGroup.setAttribute("class","LANDINGGEARGREEN");
                this.orangeBars.setAttribute("visibility","hidden");
                this.greenBarUp.setAttribute("visibility","visible");
            }

            if(landingGearLeft >= 0.1 && landingGearLeft <= 0.9) {
                this.leftLGGroup.setAttribute("class","BlinkLandingGear");
                this.orangeBars.setAttribute("visibility","visible");
                this.greenBarUp.setAttribute("visibility","hidden");
            } else {
                this.leftLGGroup.setAttribute("class","LANDINGGEARGREEN");
                this.orangeBars.setAttribute("visibility","hidden");
                this.greenBarUp.setAttribute("visibility","visible");
            }

            if(landingGearCenter >= 0.1 && landingGearCenter <= 0.9) {
                this.centerLGGroup.setAttribute("class","BlinkLandingGear");
                this.orangeBars.setAttribute("visibility","visible");
                this.greenBarUp.setAttribute("visibility","hidden");
            } else {
                this.centerLGGroup.setAttribute("class","LANDINGGEARGREEN");
                this.orangeBars.setAttribute("visibility","hidden");
                this.greenBarUp.setAttribute("visibility","visible");
            }


            // Now hide them since gear is retracted
            if(landingGearRight == 0) {
              this.rightLGGroup.setAttribute("visibility","hidden");
            } else if(landingGearRight >= 0.1) {
                this.rightLGGroup.setAttribute("visibility","visible");
            }

            if(landingGearLeft == 0) {
                this.leftLGGroup.setAttribute("visibility","hidden");
            } else if(landingGearRight >= 0.1) {
                this.leftLGGroup.setAttribute("visibility","visible");
            }

            if(landingGearCenter == 0) {
                this.centerLGGroup.setAttribute("visibility","hidden");
            } else if(landingGearRight >= 0.1) {
                this.centerLGGroup.setAttribute("visibility","visible");
            }
        }

        _checkBreakPressure() {
            // HERE WE NEED TO LOOP THROUGH HYDRALICS
        }



    }
    A320_Neo_LowerECAM_WHEEL.Page = Page;
})(A320_Neo_LowerECAM_WHEEL || (A320_Neo_LowerECAM_WHEEL = {}));
customElements.define("a320-neo-lower-ecam-wheel", A320_Neo_LowerECAM_WHEEL.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_WHEEL.js.map
