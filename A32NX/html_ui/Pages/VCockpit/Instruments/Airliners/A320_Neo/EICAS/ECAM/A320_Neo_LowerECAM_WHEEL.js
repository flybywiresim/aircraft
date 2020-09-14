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

            this.selfTestTimer = 3;
            this.newTimer = 3;

            this.autoBrakeText = this.querySelector("#autoBrakeText");

            // Hyd Indicator for Steering
            this.speedbrakeHyd = this.querySelector("#speedbrakeHyd");
            this.normBrkHyd = this.querySelector("#normBrkHyd");
            this.atlnBrk = this.querySelector("#atlnBrk");

            this.steeringNW = this.querySelector("#steering");
            this.antiSkidd = this.querySelector("#antiskid");
            this.lastSkiddState = -1;

            // Brake Temp Precentage 
            this.BrakeTemp1 = this.querySelector("#WheelTemp1");
            this.BrakeTemp2 = this.querySelector("#WheelTemp2");
            this.BrakeTemp3 = this.querySelector("#WheelTemp3");
            this.BrakeTemp4 = this.querySelector("#WheelTemp4");

            this.autoBrakeIndicator = this.querySelector("#autobrake");
            this.autoBrakeIndicator.setAttribute("visibility", "hidden");
            this.autoBrakeBlinker = this.querySelector("#blinkAutoBrake")
            this.autoBrakeBlinker.setAttribute("visibility", "hidden");

            // Spoiler
            this.spoilerRight = this.querySelector("#spoilerRight");
            this.spoilerRight.setAttribute("visibility", "hidden");

            this.spoilerLeft = this.querySelector("#spoilerLeft");
            this.spoilerLeft.setAttribute("visibility", "hidden");

            this.tempText = this.querySelector("#temp");
            this.tempText.setAttribute("visibility", "hidden");

            // TODO Need to finish making failure logic
            this.failureLGCIUS1 = false;
            this.failureLGCIUS2 = false;

            this.dummyTempCounter = 1;
            this.dummyTempCounterCoolDown = 1;

            // The code below can be stream line better for now it works 
            this.currentBrake1Temp = 45;
            this.currentBrake2Temp = 50;
            this.currentBrake3Temp = 45;
            this.currentBrake4Temp = 50;

            // Set Default State of Brakes Temp
            this.BrakeTemp1.textContent = 45;
            this.BrakeTemp2.textContent = 50;
            this.BrakeTemp3.textContent = 45;
            this.BrakeTemp4.textContent = 50;

            this.engineOneHydG = "G";
            this.engineOneHydY = "Y";
            this.autoBrakeLow = "LOW";
            this.autoBrakeMed = "MED";
            this.autoBrakeMax = "MAX";

            // LandingGEAR
            this.leftLGGroup = this.querySelector("#leftSideLandingGear");
            this.rightLGGroup = this.querySelector("#RightSideLandingGear");
            this.centerLGGroup = this.querySelector("#centerLandingGroup");

            this.LGFailureXX = this.querySelector("#LGFailure");
            this.LGFailureXX.setAttribute("visibility", "hidden");

            this.greenBarLeft = this.querySelector("#leftLGBar");
            this.greenBarRight = this.querySelector("#rightLGBar");
            this.greenBarCenter = this.querySelector("#LGFailure");

            this.orangeBars = this.querySelector("#orangeLGDown");
            this.orangeBars.setAttribute("visibility", "hidden");

            this.greenBarUp = this.querySelector("#greenBarUp");
        }

        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            this.updateTempColor(_deltaTime);
            this.updateHydroSymbols(_deltaTime);
            this.updateAutoBrake(_deltaTime);
            this.updateSkidToggle(_deltaTime);
            this.updateSpoilerSpeedBrake(_deltaTime);
            this.updateLandingGear(_deltaTime);

            // Brake Temp - this is a based loop checking both speed and current brake pressure
            const currentBrakeRight = SimVar.GetSimVarValue("BRAKE RIGHT POSITION", "position 32k");
            const currentBrakeLeft = SimVar.GetSimVarValue("BRAKE LEFT POSITION", "position 32k");
            const currentParkingBrake = SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool");
            const wheelRPM = SimVar.GetSimVarValue("WHEEL RPM", "rpm"); 

            if (wheelRPM > 150 && currentBrakeLeft >= 30000 && currentBrakeRight >= 30000 && !currentParkingBrake) {
                this.dummyTempCounter += _deltaTime / 1000;
                // Add temp slowly
                this.currentBrake1Temp = Math.round(this.currentBrake1Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;
                this.currentBrake2Temp = Math.round(this.currentBrake2Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;
                this.currentBrake3Temp = Math.round(this.currentBrake3Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;
                this.currentBrake4Temp = Math.round(this.currentBrake4Temp) + Math.floor(Math.random() * this.dummyTempCounter) + 1;

                this.BrakeTemp1.textContent = this.currentBrake1Temp;
                this.BrakeTemp2.textContent = this.currentBrake2Temp;
                this.BrakeTemp3.textContent = this.currentBrake3Temp;
                this.BrakeTemp4.textContent = this.currentBrake4Temp;
                this.dummyTempCounter = 0;

            } else if (currentBrakeLeft <= 0 && currentBrakeRight <= 0 && !currentParkingBrake) {

                if (this.currentBrake1Temp > 45 || this.currentBrake2Temp > 50 || this.currentBrake3Temp > 45 || this.currentBrake4Temp > 50) {
                    this.dummyTempCounter += _deltaTime / 1000;

                    // Add cool down slowly
                    this.currentBrake1Temp -= this.dummyTempCounter;
                    this.currentBrake2Temp -= this.dummyTempCounter;
                    this.currentBrake3Temp -= this.dummyTempCounter;
                    this.currentBrake4Temp -= this.dummyTempCounter;

                    this.BrakeTemp1.textContent = Math.round(this.currentBrake1Temp);
                    this.BrakeTemp2.textContent = Math.round(this.currentBrake2Temp);
                    this.BrakeTemp3.textContent = Math.round(this.currentBrake3Temp);
                    this.BrakeTemp4.textContent = Math.round(this.currentBrake4Temp);

                    this.dummyTempCounter = 0;
                }
            }
        }

        updateTempColor(_deltaTime) {
            if (this.currentBrake1Temp <= 100 || this.currentBrake2Temp <= 100 || this.currentBrake3Temp <= 100 || this.currentBrake4Temp <= 100) {
                this.BrakeTemp1.setAttribute("class", "WHEELTempPrecentage");
                this.BrakeTemp2.setAttribute("class", "WHEELTempPrecentage");
                this.BrakeTemp3.setAttribute("class", "WHEELTempPrecentage");
                this.BrakeTemp4.setAttribute("class", "WHEELTempPrecentage");
                SimVar.SetSimVarValue("L:A32NX_BRAKES_HOT", "Bool", 0);
            }
            if (this.currentBrake1Temp >= 300 || this.currentBrake2Temp >= 300 || this.currentBrake3Temp >= 300 || this.currentBrake4Temp >= 300) {
                this.BrakeTemp1.setAttribute("class", "WHEELBRAKEWARNING");
                this.BrakeTemp2.setAttribute("class", "WHEELBRAKEWARNING");
                this.BrakeTemp3.setAttribute("class", "WHEELBRAKEWARNING");
                this.BrakeTemp4.setAttribute("class", "WHEELBRAKEWARNING");
                SimVar.SetSimVarValue("L:A32NX_BRAKES_HOT", "Bool", 1);
            }
            if (this.currentBrake1Temp >= 500 || this.currentBrake2Temp >= 500 || this.currentBrake3Temp >= 500 || this.currentBrake4Temp >= 500) {
                this.BrakeTemp1.setAttribute("class", "WHEELBRAKERED");
                this.BrakeTemp2.setAttribute("class", "WHEELBRAKERED");
                this.BrakeTemp3.setAttribute("class", "WHEELBRAKERED");
                this.BrakeTemp4.setAttribute("class", "WHEELBRAKERED");
                SimVar.SetSimVarValue("L:A32NX_BRAKES_HOT", "Bool", 1);
                //SimVar.SetSimVarValue("BRAKE RIGHT POSITION","position 32k", 0);// -- Commit out this , was testing something 
                //SimVar.SetSimVarValue("BRAKE LEFT POSITION", "position 32k", 0); // --- Uncomment to allow brakes to fail when over 500c
            }
        }

        // Need to check if Engine 1 or 2 have pushed enough Hydralics Also need to push alerts into ECAM Messages
        updateHydroSymbols(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            const hydroLeftEnginePrecentage = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:1", "pound-force per square foot");
            const hydroRightEnginePrecentage = SimVar.GetSimVarValue("ENG HYDRAULIC PRESSURE:2", "pound-force per square foot");

            if (hydroRightEnginePrecentage >= 250000 && hydroRightEnginePrecentage >= 250000) {
                this.tempText.setAttribute("class", "ALTNBRKIndicator");
                if (this.selfTestTimer >= 0) {
                    this.selfTestTimer -= _deltaTime / 1000;
                    if (this.selfTestTimer <= 0) {
                        this.tempText.setAttribute("visibility", "hidden");
                        this.selfTestTimer = 3;
                        this.textAmber = false;
                    }
                }
            } else if (hydroRightEnginePrecentage <= 250000 && hydroRightEnginePrecentage <= 250000) {
                this.tempText.setAttribute("visibility", "visible");
                this.tempText.setAttribute("class", "WHEELBRAKEWARNING");
                this.textAmber = true;
            }

            // Why two ifs, cause part of brakes system works with G and Y hydralics depending on Engine
            if (hydroLeftEnginePrecentage >= 250000) {
                this.normBrkHyd.setAttribute("visibility", "hidden");
            } else {
                this.normBrkHyd.setAttribute("visibility", "visible");
            }

            if (hydroRightEnginePrecentage >= 250000) {
                this.speedbrakeHyd.setAttribute("visibility", "hidden");
                this.atlnBrk.setAttribute("visibility", "hidden");
            } else {
                this.speedbrakeHyd.setAttribute("visibility", "visible");
                this.atlnBrk.setAttribute("visibility", "visible");
            }
        }

        // Need to update the ECAM Messages left side when Skid is turned off casue when off AUTO Brake is off too
        updateSkidToggle(_deltaTime) {
            const currentSkiddState = SimVar.GetSimVarValue("ANTISKID BRAKES ACTIVE", "Bool");

            if (currentSkiddState === 1 && this.textAmber == false) {
                this.steeringNW.setAttribute("class", "ALTNBRKIndicator");
                this.antiSkidd.setAttribute("class", "ALTNBRKIndicator");
                if (this.newTimer >= 0) {
                    this.newTimer -= _deltaTime / 1000;
                    if (this.newTimer <= 0) {
                        this.steeringNW.setAttribute("visibility", "hidden");
                        this.antiSkidd.setAttribute("visibility", "hidden");
                        this.newTimer = 3;
                    }
                }
            }

            if (currentSkiddState === 0) {
                this.steeringNW.setAttribute("visibility", "visible");
                this.antiSkidd.setAttribute("visibility", "visible");
                this.steeringNW.setAttribute("class", "WHEELBRAKEWARNING");
                this.antiSkidd.setAttribute("class", "WHEELBRAKEWARNING");
            }
        }

        updateAutoBrake(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            const autoBrakeSelected = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Number");
            const autoBrakeActive = SimVar.GetSimVarValue("AUTOBRAKES ACTIVE", "Bool");

            if (autoBrakeSelected === 0) {
                this.autoBrakeText.setAttribute("visibility", "hidden");
                this.autoBrakeIndicator.setAttribute("visibility", "hidden");
                return;
            }

            // if user selects AUTO BRAKE LOW , MED, MAX show it
            if (autoBrakeSelected === 1 && !this.isAutoBrakeIndiShown) {
                this.autoBrakeIndicator.setAttribute("visibility", "visible");
                this.autoBrakeText.setAttribute("visibility", "visible");
                this.autoBrakeText.textContent = this.autoBrakeLow;

            } else if (autoBrakeSelected === 2 && !this.isAutoBrakeIndiShown) {
                this.autoBrakeIndicator.setAttribute("visibility", "visible");
                this.autoBrakeText.setAttribute("visibility", "visible");
                this.autoBrakeText.textContent = this.autoBrakeMed;

            } else if (autoBrakeSelected === 3 && !this.isAutoBrakeIndiShown) {
                this.autoBrakeIndicator.setAttribute("visibility", "visible");
                this.autoBrakeText.setAttribute("visibility", "visible");
                this.autoBrakeText.textContent = this.autoBrakeMax;
            }

            // When landing flash auto brake on wheel page then let it go away
            if (autoBrakeActive) {
                this.autoBrakeIndicator.setAttribute("visibility", "hidden");
                this.autoBrakeBlinker.setAttribute("visibility", "visible");
                if (this.selfTestTimer >= 0) {
                    this.selfTestTimer -= _deltaTime / 1000;
                    if (this.selfTestTimer <= 0) {
                        this.autoBrakeBlinker.setAttribute("visibility", "hidden");
                        this.selfTestTimer = 3;
                    }
                }
            }
        }

        updateSpoilerSpeedBrake(_deltaTime) {
            if (!this.isInitialised || !SimVar.GetSimVarValue("SPOILER AVAILABLE", "Bool")) {
                return;
            }

            const spoilerLeftPos = SimVar.GetSimVarValue("SPOILERS LEFT POSITION", "percent");
            const spoilerRightPos = SimVar.GetSimVarValue("SPOILERS RIGHT POSITION", "percent");

            if (spoilerRightPos >= 1) {
                this.spoilerRight.setAttribute("visibility", "visible");
            } else {
                this.spoilerRight.setAttribute("visibility", "hidden");
            }

            if (spoilerLeftPos >= 1) {
                this.spoilerLeft.setAttribute("visibility", "visible");
            } else {
                this.spoilerLeft.setAttribute("visibility", "hidden");
            }
        }

        updateLandingGear(_deltaTime) {
            const landingGearRight = SimVar.GetSimVarValue("GEAR RIGHT POSITION", "Percent Over 100");
            const landingGearLeft = SimVar.GetSimVarValue("GEAR LEFT POSITION", "Percent Over 100");
            const landingGearCenter = SimVar.GetSimVarValue("GEAR CENTER POSITION", "Percent Over 100");

            if (landingGearRight >= 0.1 && landingGearRight <= 0.9) {
                this.rightLGGroup.setAttribute("class", "BlinkLandingGear");
                this.orangeBars.setAttribute("visibility", "visible");
                this.greenBarUp.setAttribute("visibility", "hidden");
            } else {
                this.rightLGGroup.setAttribute("class", "LANDINGGEARGREEN");
                this.orangeBars.setAttribute("visibility", "hidden");
                this.greenBarUp.setAttribute("visibility", "visible");
            }

            if (landingGearLeft >= 0.1 && landingGearLeft <= 0.9) {
                this.leftLGGroup.setAttribute("class", "BlinkLandingGear");
                this.orangeBars.setAttribute("visibility", "visible");
                this.greenBarUp.setAttribute("visibility", "hidden");
            } else {
                this.leftLGGroup.setAttribute("class", "LANDINGGEARGREEN");
                this.orangeBars.setAttribute("visibility", "hidden");
                this.greenBarUp.setAttribute("visibility", "visible");
            }

            if (landingGearCenter >= 0.1 && landingGearCenter <= 0.9) {
                this.centerLGGroup.setAttribute("class", "BlinkLandingGear");
                this.orangeBars.setAttribute("visibility", "visible");
                this.greenBarUp.setAttribute("visibility", "hidden");
            } else {
                this.centerLGGroup.setAttribute("class", "LANDINGGEARGREEN");
                this.orangeBars.setAttribute("visibility", "hidden");
                this.greenBarUp.setAttribute("visibility", "visible");
            }

            // Now hide them since gear is retracted
            if (landingGearRight == 0) {
                this.rightLGGroup.setAttribute("visibility", "hidden");
            } else if (landingGearRight >= 0.1) {
                this.rightLGGroup.setAttribute("visibility", "visible");
            }

            if (landingGearLeft == 0) {
                this.leftLGGroup.setAttribute("visibility", "hidden");
            } else if (landingGearRight >= 0.1) {
                this.leftLGGroup.setAttribute("visibility", "visible");
            }

            if (landingGearCenter == 0) {
                this.centerLGGroup.setAttribute("visibility", "hidden");
            } else if (landingGearRight >= 0.1) {
                this.centerLGGroup.setAttribute("visibility", "visible");
            }
        }

        _checkBrakesPressure() {
            // TODO HERE WE NEED TO LOOP THROUGH HYDRALICS
        }
    }
    A320_Neo_LowerECAM_WHEEL.Page = Page;
})(A320_Neo_LowerECAM_WHEEL || (A320_Neo_LowerECAM_WHEEL = {}));
customElements.define("a320-neo-lower-ecam-wheel", A320_Neo_LowerECAM_WHEEL.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_WHEEL.js.map