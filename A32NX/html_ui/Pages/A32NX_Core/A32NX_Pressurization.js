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
        this.lastTimeMeasurementPID = 0;
        this.I = 0;
        this.lastP = 0;

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
            console.log("flight phase 0");
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 0;
            this.I = 0; 
        } else if (!externalPower && !this.airborne && this.flightPhase == 0 && groundSpeed > 0) {
            console.log("flight phase 1");
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 1;
            this.I = 0; 
        } else if (this.airborne && this.flightPhase == 1) {
            console.log("flight phase 2");
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 2;
            this.I = 0; 
        } else if (gameFlightPhase == 4 && this.flightPhase == 2) {
            console.log("flight phase 3");
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 3;   
            this.I = 0; 
        } else if (gameFlightPhase == 5 && this.flightPhase == 3) {
            console.log("flight phase 4");
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 4;
            this.I = 0; 
        } else if (!this.airborne && this.flightPhase == 4) {
            console.log("flight phase 5");
            this.lastTimeMeasurement = timeS;
            this.touchdownTime = timeS;
            this.flightPhase = 5;
        } else if (this.flightPhase == 5 && (timeS - this.touchdownTime) > 55000) {
            console.log("flight phase 6");
            this.lastTimeMeasurement = timeS;
            this.flightPhase = 6;
        }
    }


    checkIfAirborne() {
        const radioAlt = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        if (radioAlt > 50) {
            this.airborne = true;
        } else {
            this.airborne = false;
        }
    }

    simVarUpdater(cabinPress) {
            const timeS = (new Date()).getTime();
            const timeDelta = timeS - this.lastTimeMeasurement
            this.lastTimeMeasurement = timeS;

            this.cabinPressAltitude = cabinPress;

            let currentVS = SimVar.GetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min");
            let currentCabinAlt = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "ft"); 
            const differenceVS = this.cabinVSRate - currentVS;
            const differenceCabinAlt = this.cabinPressAltitude - currentCabinAlt;
        
            if (differenceVS != 0) {
                currentVS += Math.sign(differenceVS);
            }

            if (differenceCabinAlt != 0 && Math.abs(differenceCabinAlt) > 1) {
                currentCabinAlt += currentVS * (timeDelta / 60000);
            }

            SimVar.SetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min", currentVS);
            SimVar.SetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "ft", currentCabinAlt);
    }

    groundPhase() {

        const currCabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
        const currOutsideAltitude = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "Meters") / this.feetToMeters;
        this.cabinVSRate = this.PIDController(currCabinAltitude, currOutsideAltitude, 3, 0.005, 0.002);
        this.simVarUpdater(currOutsideAltitude);
    }

    prePressurizationPhase(cabAltitude) {
        if (this.coldAndDarkStart) {
            const currCabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
            this.cabinVSRate = this.PIDController(currCabinAltitude, cabAltitude, 3, 0.005, 0.002);
            this.simVarUpdater(cabAltitude);
        } else {
            SimVar.SetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min", 0);
            SimVar.SetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "ft", cabAltitude);
            SimVar.SetSimVarValue("L:A32NX_CABIN_PSI_DELTA", "psi", 0.1);
        }
    }

    climbPhase(cabAltitude, vsSpeed) {
        const currCabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
        let calculatedVSpeed = (vsSpeed * 60 / 3.5) + this.PIDController(currCabinAltitude, cabAltitude, 3, 0.005, 0.002);
        if (calculatedVSpeed > 2400) {
            calculatedVSpeed = 2400;
        } else if (calculatedVSpeed < -2400) {
            calculatedVSpeed = -2400;
        }
        this.cabinVSRate = calculatedVSpeed;
        this.simVarUpdater(cabAltitude);
    }


    descentPhase(cabAltitude, vSpeed) {
        const currCabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
        this.cabinVSRate = (Math.sign(cabAltitude - currCabinAltitude) * Math.abs(vSpeed * 60 / 4)) + this.PIDController(currCabinAltitude, cabAltitude, 3, 0.005, 0.002);
        console.log(this.cabinVSRate, cabAltitude);
 
        this.simVarUpdater(cabAltitude);
    }

    cruisePhase(cabAltitude, vsSpeed) {
        const currCabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
        let calculatedVSpeed = (vsSpeed * 60 / 4) + this.PIDController(currCabinAltitude, cabAltitude, 3, 0.005, 0.002);
        if (calculatedVSpeed > 2400) {
            calculatedVSpeed = 2400;
        } else if (calculatedVSpeed < -2400) {
            calculatedVSpeed = -2400;
        }
        this.cabinVSRate = calculatedVSpeed ;
        this.simVarUpdater(cabAltitude);
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
        const P = targetValue - value ;
        
        this.I += P * deltaTime / 60000;
        let D = 0;
        if (this.lastP != 0) {
            D = (P - this.lastP) / (deltaTime/60000);
            this.lastP = P;
        } else {
            this.lastP = P;
        }
        return P * kP + this.I * kI + D * kD;
    }

    update(_deltaTime, _core) {
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

        SimVar.SetSimVarValue("L:A32NX_CABIN_PSI_DELTA", "Psi", pressureDiff);

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
                this.climbPhase((outsideAltMeters * 3.28084) / 4.5, verticalSpeed);
                break;
            case 3:
                this.cruisePhase((outsideAltMeters * 3.28084) / 4.5, verticalSpeed);
                break;
            case 4:
                this.descentPhase((outsideAltMeters * 3.28084) / 4.5, verticalSpeed);
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