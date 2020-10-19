class A32NX_Pressurization {
    constructor() {
        console.log("A32NX_Pressurization constructed");
    }
    init() {
        console.log("A32NX_Pressurization init");

        this.coldAndDarkStart = SimVar.GetSimVarValue("L:A32NX_COLD_AND_DARK_SPAWN", "bool");
        if (this.coldAndDarkStart) {
            this.flightPhase = -1;
        } else {
            this.flightPhase = 1;
        }

        this.airborne = 0;
        this.touchdownTime = -1;
        this.valveFullOpen = 0;

        this.cabinVSRate = 0;
        this.cabinPSIDelta = 0;
        this.cabinPressAltitude = 0;

        this.lastTimeMeasurement = 0;
        this.lastTimeMeasurementPID = 0;
        this.I = 0;
        this.lastP = 0;

        this.longitude = 0;
        this.lastLongitude = 0;
        this.safetyValveOpen = 0;

        this.feetToMeters = 0.3048;
        this.seaLevelPressurePascal = 101325;
        this.barometricPressureFactor = -0.00011857591;
        this.pascalToPSI = 0.000145038;
        this.inHgToPSI = 0.491154;

    }

    setFlightPhase() {
        const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second");
        const gameFlightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "value");
        const externalPower = SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE", "Bool");

        const timeS = (new Date()).getTime();

        if (externalPower && this.flightPhase == -1) {
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 0;
            this.I = 0;
        } else if (!externalPower && !this.airborne && this.flightPhase == 0 && groundSpeed > 0) {
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 1;
            this.I = 0;
        } else if (this.airborne && this.flightPhase == 1) {
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 2;
            this.I = 0;
        } else if (gameFlightPhase == 4 && this.flightPhase == 2) {
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 3;
            this.I = 0;
        } else if (gameFlightPhase == 5 && this.flightPhase == 3) {
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 4;
            this.I = 0;
        } else if (!this.airborne && this.flightPhase == 4) {
            this.lastTimeMeasurement = timeS;
            this.touchdownTime = timeS;
            this.flightPhase = 5;
        } else if (this.flightPhase == 5 && (timeS - this.touchdownTime) > 55000) {
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 6;
        }
    }

    checkIfAirborne() {
        const radioAlt = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        if (radioAlt > 250) {
            this.airborne = true;
        } else {
            this.airborne = false;
        }
    }

    simVarUpdater(cabinPress, ditching) {
        const timeS = (new Date()).getTime();
        const timeDelta = timeS - this.lastTimeMeasurement;
        this.lastTimeMeasurement = timeS;

        this.cabinPressAltitude = cabinPress;

        let currentVS = SimVar.GetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min");
        let currentCabinAlt = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "ft");

        if (Math.abs(currentCabinAlt) > 50000) {
            currentCabinAlt = 0;
        }

        const differenceVS = this.cabinVSRate - currentVS;
        const differenceCabinAlt = this.cabinPressAltitude - currentCabinAlt;
        if (differenceVS != 0) {
            currentVS += Math.sign(differenceVS) * 2;
        } else {
            currentVS = this.cabinVSRate;
        }
        SimVar.SetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min", currentVS);

        if (!ditching) {
            if (Math.abs(differenceCabinAlt) > 10) {
                currentCabinAlt += currentVS * (timeDelta / 60000);
            } else {
                currentCabinAlt = this.cabinPressAltitude;
            }

            SimVar.SetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "ft", currentCabinAlt);
        }
    }

    groundPhase(ditching) {
        const currCabinAltitude = parseInt(SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet"));
        const currOutsideAltitude = parseInt(SimVar.GetSimVarValue("PRESSURE ALTITUDE", "Meters") / this.feetToMeters);
        this.cabinVSRate = (Math.sign(parseInt(currOutsideAltitude) - parseInt(currCabinAltitude)) * 500) * (1 - ditching);
        this.simVarUpdater(currOutsideAltitude, ditching);
    }

    prePressurizationPhase(cabAltitude, ditching) {
        const currCabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
        this.cabinVSRate = (Math.sign(parseInt(cabAltitude) - parseInt(currCabinAltitude)) * 400) * (1 - ditching);
        this.simVarUpdater(cabAltitude, ditching);
    }

    airPhase(cabAltitude, vsSpeed, ditching) {
        const currCabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
        let calculatedVSpeed = ((vsSpeed * 60 / 4) + this.PIDController(currCabinAltitude, cabAltitude, 3, 0.005, 0.002) + this.safetyValveOpen * 500) * (1 - ditching);
        if (calculatedVSpeed > 2400) {
            calculatedVSpeed = 2400;
        } else if (calculatedVSpeed < -2400) {
            calculatedVSpeed = -2400;
        }
        this.cabinVSRate = calculatedVSpeed;
        this.simVarUpdater(cabAltitude, ditching);
    }

    PIDController(value, targetValue, kP, kI, kD) {
        const time = (new Date()).getTime();
        let deltaTime = 0;
        if (this.lastTimeMeasurementPID != 0) {
            deltaTime = time - this.lastTimeMeasurementPID;
            this.lastTimeMeasurementPID = time;
        } else {
            this.lastTimeMeasurementPID = time;
        }
        if (deltaTime > 100) {
            deltaTime = 0;
        }
        const P = targetValue - value;
        let D = 0;
        this.I += P * deltaTime / 60000;
        if (this.lastP != 0) {
            D = (P - this.lastP) / (deltaTime / 60000);
            this.lastP = P;
        } else {
            this.lastP = P;
        }
        return P * kP + this.I * kI + D * kD;
    }

    update(_deltaTime, _core) {
        const landingElev = SimVar.GetSimVarValue("L:A32NX_LANDING_ELEVATION", "feet");
        const verticalSpeed = SimVar.GetSimVarValue("VERTICAL SPEED", "Feet per second");

        const cabinAltMeters = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet") * this.feetToMeters;
        const outsideAltMeters = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "Meters");

        const cabinPressurePascal = this.seaLevelPressurePascal * Math.exp(this.barometricPressureFactor * cabinAltMeters);
        const cabinPressurePSI = cabinPressurePascal * this.pascalToPSI;

        const outsidePressurePascal = this.seaLevelPressurePascal * Math.exp(this.barometricPressureFactor * outsideAltMeters);
        const outsidePressurePSI = outsidePressurePascal * this.pascalToPSI;
        const pressureDiff = cabinPressurePSI - outsidePressurePSI;
        const cabinPressurePascalPrePress = (0.11 + outsidePressurePSI) / this.pascalToPSI;
        const cabinAltPrePress = Math.log(cabinPressurePascalPrePress / this.seaLevelPressurePascal) / this.barometricPressureFactor;
        const ditchingOn = SimVar.GetSimVarValue("L:A32NX_DITCHING", "bool");

        let targetAltitude = (outsideAltMeters * 3.28084) / 4.875;
        if (landingElev != -2000 && this.flightPhase == 4) {
            targetAltitude = landingElev + Math.abs((outsideAltMeters / this.feetToMeters) - landingElev) / 4.875;
        }

        SimVar.SetSimVarValue("L:A32NX_CABIN_PSI_DELTA", "Psi", pressureDiff);

        if (pressureDiff > 8.2) {
            this.safetyValveOpen = 1;
        } else {
            this.safetyValveOpen = 0;
        }

        if (!SimVar.GetSimVarValue("L:A32NX_CAB_PRESS_MODE_MAN", "bool")) {
            this.checkIfAirborne();
            this.setFlightPhase();

            switch (this.flightPhase) {
                case 0:
                    this.groundPhase(ditchingOn);
                    break;
                case 1:
                    this.prePressurizationPhase(cabinAltPrePress * 3.28084, ditchingOn);
                    break;
                case 2:
                    this.airPhase(targetAltitude, verticalSpeed, ditchingOn);
                    break;
                case 3:
                    this.airPhase(targetAltitude, verticalSpeed, ditchingOn);
                    break;
                case 4:
                    this.airPhase(targetAltitude, verticalSpeed, ditchingOn);
                    break;
                case 5:
                    this.prePressurizationPhase(cabinAltPrePress * 3.28084, ditchingOn);
                    break;
                case 6:
                    this.groundPhase(ditchingOn);
                    break;
            }
        } else {
            const manVSSwitchPos = SimVar.GetSimVarValue("L:A32NX_MAN_VS_CONTROL", "Position(0-2)");
            if (!ditchingOn) {
                if (manVSSwitchPos == 0) {
                    this.cabinVSRate += 0.5;
                } else if (manVSSwitchPos == 2) {
                    this.cabinVSRate += -0.5;
                }
                this.simVarUpdater(20000);
            } else {
                this.cabinVSRate = 0;
                this.simVarUpdater(20000);
            }
        }
    }
}