class A32NX_Pressurization {
    constructor() {
        console.log("A32NX_Pressurization constructed");
    }
    init() {
        console.log("A32NX_Pressurization init");

        this.coldAndDarkStart = SimVar.GetSimVarValue("L:A32NX_COLD_AND_DARK_SPAWN", "bool")
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
        this.reachedTarget = false;

        this.feetToMeters = 0.3048;
        this.seaLevelPressurePascal = 101325;
        this.barometricPressureFactor = -0.00011857591;
        this.pascalToPSI = 0.000145038;
        this.inHgToPSI = 0.491154;

    }

    setFlightPhase() {
        const groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second");
        const gameFlightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "value");
        const externalPower = SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool");

        const time = new Date();
        const timeS = time.getTime();
        console.log(" " + this.airborne+ " " +this.flightPhase+ " " +externalPower + "\n");

        if (externalPower && (this.flightPhase == 6 || this.flightPhase == -1 || this.flightPhase == -1)) {
            console.log("0");
            this.lastTimeMeasurement = timeS;
            this.reachedTarget = false;
            this.flightPhase = 0;
        } else if (!externalPower && !this.airborne && this.flightPhase == 0 && groundSpeed > 0) {
            console.log("1");
            this.lastTimeMeasurement = timeS;
            this.reachedTarget = false;
            this.flightPhase = 1;
        } else if (this.airborne && this.flightPhase == 1) {
            console.log("2");
            this.lastTimeMeasurement = timeS;
            this.reachedTarget = false;
            this.flightPhase = 2;
        } else if (gameFlightPhase == 4 && this.flightPhase == 2) {
            console.log("3");
            this.lastTimeMeasurement = timeS;
            this.reachedTarget = false;
            this.flightPhase = 3;
        } else if (gameFlightPhase == 5 && this.flightPhase == 3) {
            console.log("4");
            this.lastTimeMeasurement = timeS;
            this.reachedTarget = false;
            this.flightPhase = 4;
        } else if (!this.airborne && this.flightPhase == 4) {
            console.log("5");
            this.lastTimeMeasurement = timeS;
            this.reachedTarget = false;
            this.flightPhase = 5;
        } else if (this.valveFullOpen && this.flightPhase == 5) {
            console.log("6");
            this.lastTimeMeasurement = timeS;
            this.reachedTarget = false;
            this.flightPhase = 6;
        } else {
            console.log("null")
        }
    }

    setTouchdownTime() {
        const timeVar = new Date();
        const touchdownTimeTemp = timeVar.getTime();
        if (this.flightPhase == 4 && !this.airborne) {
            this.touchdownTime = touchdownTimeTemp;
        }
    }

    setValveFullOpenSignal() {
        const timeVar = new Date();
        const time = timeVar.getTime();
        if (this.flightPhase == 5 && time - this.touchdownTime > 10000) {
            this.valveFullOpen = 1;
        }
    }

    checkIfAirborne() {
        const radioAlt = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        if (radioAlt > 10) {
            this.airborne = true;
        } else {
            this.airborne = false;
        }
    }

    simVarUpdater(cabinPress) {
            const time = new Date();
            const timeS = time.getTime();
            const timeDelta = timeS - this.lastTimeMeasurement
            this.lastTimeMeasurement = timeS;

            this.cabinPressAltitude = cabinPress;

            let currentVS = SimVar.GetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min");
            let currentCabinAlt = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "ft"); 
            const differenceVS = this.cabinVSRate - currentVS;
            const differenceCabinAlt = Math.abs(this.cabinPressAltitude - currentCabinAlt);
        if (!this.reachedTarget) {
            if (differenceVS != 0) {
                currentVS += Math.sign(differenceVS);
            }

            if (differenceCabinAlt != 0 && Math.abs(differenceCabinAlt) > 1) {
                currentCabinAlt += currentVS * (timeDelta / 60000);
            } else {
                currentCabinAlt = this.currentCabinAlt;
                this.reachedTarget = true;
            }

            SimVar.SetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min", currentVS);
            SimVar.SetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "ft", currentCabinAlt);
        } else {
            SimVar.SetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min", 0);
        }
    }

    groundPhase() {
        this.cabinVSRate = 500;
        this.simVarUpdater(SimVar.GetSimVarValue("PRESSURE ALTITUDE", "Meters") * 3.28084);
    }

    prePressurizationPhase(cabAltitude) {
        if (this.coldAndDarkStart) {
            this.cabinVSRate = -400;
            this.simVarUpdater(cabAltitude);
        } else {
            SimVar.SetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min", 0);
            SimVar.SetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet", cabAltitude);
            SimVar.SetSimVarValue("L:A32NX_CABIN_PSI_DELTA", "Psi", 0.1);
        } 
    }

    climbPhase(cabAltitude, vsSpeed) {

        let calculatedVSpeed = vsSpeed * 60 / 3;
        if (calculatedVSpeed > 2400) {
            calculatedVSpeed = 2400;
        } else if (calculatedVSpeed < -2400) {
            calculatedVSpeed = -2400;
        }
        this.cabinVSRate = calculatedVSpeed;
        this.simVarUpdater(cabAltitude);
    }


    descentPhase(cabAltitude, vsSpeed) {

        let calculatedVSpeed = vsSpeed * 60 / 3;
        if (calculatedVSpeed > 2400) {
            calculatedVSpeed = 2400;
        } else if (calculatedVSpeed < -750) {
            calculatedVSpeed = -750;
        }
        this.cabinVSRate = calculatedVSpeed;
        this.simVarUpdater(cabAltitude);
    }

    cruisePhase(cabAltitude, vsSpeed) {
        let calculatedVSpeed = vsSpeed * 60 / 3;
        if (calculatedVSpeed > 2400) {
            calculatedVSpeed = 2400;
        } else if (calculatedVSpeed < -2400) {
            calculatedVSpeed = -2400;
        }
        this.simVarUpdater(cabAltitude);
    }
    update(_deltaTime, _core) {
        const verticalSpeed = SimVar.GetSimVarValue("VERTICAL SPEED", "Feet per second");

        const cabinAltMeters = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet") * this.feetToMeters;
        const outsideAltMeters = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "Meters");

        const cabinPressurePascal = this.seaLevelPressurePascal * Math.exp(this.barometricPressureFactor * cabinAltMeters); // Barometric formula
        const cabinPressurePSI = cabinPressurePascal * this.pascalToPSI;

        const outsidePressurePascal = this.seaLevelPressurePascal * Math.exp(this.barometricPressureFactor * outsideAltMeters);
        const outsidePressurePSI = outsidePressurePascal * this.pascalToPSI;

        const pressureDiff = cabinPressurePSI - outsidePressurePSI;
        const cabinPressurePascalPrePress = (0.1 + outsidePressurePSI) / this.pascalToPSI;
        

        const cabinAltPrePress = Math.log(cabinPressurePascalPrePress / this.seaLevelPressurePascal) / this.barometricPressureFactor;

        SimVar.SetSimVarValue("L:A32NX_CABIN_PSI_DELTA", "Psi", pressureDiff);

        this.setTouchdownTime();
        this.setValveFullOpenSignal();
        this.checkIfAirborne();
        this.setFlightPhase();

        switch (this.flightPhase) {
            case 0:
                this.groundPhase();
                break;
            case 1:
                this.prePressurizationPhase(cabinAltPrePress * 3.28084);
                break;
            case 2:
                this.climbPhase(8000, verticalSpeed);
                break;
            case 3:
                this.cruisePhase(8000, verticalSpeed);
                break;
            case 4:
                this.descentPhase(cabinAltPrePress * 3.28084, verticalSpeed);
                break;
            case 5:
                this.prePressurizationPhase(cabinAltPrePress * 3.28084);
                break;
            case 6:
                this.groundPhase();
                break;
        }      
    }
}