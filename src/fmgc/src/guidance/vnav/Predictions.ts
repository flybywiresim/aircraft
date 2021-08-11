// Local imports
import { Common, FlapConf, AccelFactorMode } from './common';
import { EngineModel } from './EngineModel';
import { FlightModel } from './FlightModel';

export interface StepResults {
    pathAngle: number,
    verticalSpeed: number,
    distanceTraveled: number,
    fuelBurned: number,
    timeElapsed: number,
    finalAltitude: number,
}

export class Predictions {
    /**
     * THIS IS DONE.
     * @param initialAltitude altitude at beginning of step, in feet
     * @param stepSize the size of the altitude step, in feet
     * @param econCAS airspeed during climb (taking SPD LIM & restrictions into account)
     * @param econMach mach during climb, after passing crossover altitude
     * @param commandedN1 N1% at CLB (or idle) setting, depending on flight phase
     * @param zeroFuelWeight zero fuel weight of the aircraft (from INIT B)
     * @param initialFuelWeight weight of fuel at the end of last step
     * @param headwindAtMidStepAlt headwind component (in knots) at initialAltitude + (stepSize / 2); tailwind is negative
     * @param isaDev ISA deviation (in celsius)
     * @param tropoAltitude tropopause altitude (feet)
     */
    static altitudeStep(
        initialAltitude: number,
        stepSize: number,
        econCAS: number,
        econMach: number,
        commandedN1: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        headwindAtMidStepAlt: number,
        isaDev: number,
        tropoAltitude: number,
    ): StepResults {
        const midStepAltitude = initialAltitude + (stepSize / 2);
        const theta = Common.getTheta(midStepAltitude, isaDev);
        const delta = Common.getDelta(theta);
        let mach = Common.CAStoMach(econCAS, delta);

        let eas;
        let tas;
        let usingMach = false;
        // If above crossover altitude, use econMach
        if (mach > econMach) {
            mach = econMach;
            eas = Common.machToEAS(mach, delta);
            tas = Common.machToTAS(mach, theta);
            usingMach = true;
        } else {
            eas = Common.CAStoEAS(econCAS, delta);
            tas = Common.CAStoTAS(econCAS, theta, delta);
        }

        // Engine model calculations
        const theta2 = Common.getTheta2(theta, mach);
        const delta2 = Common.getDelta2(delta, mach);
        const correctedN1 = EngineModel.getCorrectedN1(commandedN1, theta2);
        const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, mach) * 2 * EngineModel.maxThrust;
        const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, mach, midStepAltitude) * 2;
        const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf
        const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2); // in lbs/hour

        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        let pathAngle;
        let verticalSpeed;
        let stepTime;
        let distanceTraveled;
        let fuelBurned;
        let lift = weightEstimate;
        let midStepWeight = weightEstimate;
        let previousMidStepWeight = midStepWeight;
        let iterations = 0;
        do {
            // Assume lift force is equal to weight as an initial approximation
            const liftCoefficient = FlightModel.getLiftCoefficientFromEAS(lift, eas);
            const dragCoefficient = FlightModel.getDragCoefficient(liftCoefficient);
            const accelFactorMode = usingMach ? AccelFactorMode.CONSTANT_MACH : AccelFactorMode.CONSTANT_CAS;
            const accelFactor = Common.getAccelerationFactor(mach, midStepAltitude, isaDev, midStepAltitude > tropoAltitude, accelFactorMode);
            const pathAngle = FlightModel.getConstantThrustPathAngleFromCoefficients(
                thrust,
                midStepWeight,
                liftCoefficient,
                dragCoefficient,
                accelFactor,
            );

            verticalSpeed = 101.268 * tas * Math.sin(pathAngle); // in feet per minute
            stepTime = stepSize / verticalSpeed; // in minutes
            distanceTraveled = (tas - headwindAtMidStepAlt) * stepTime;
            fuelBurned = (fuelFlow / 60) * stepTime;
            // const endStepWeight = zeroFuelWeight + (initialFuelWeight - fuelBurned); <- not really needed

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            lift = midStepWeight * Math.cos(pathAngle);
            iterations++;
        } while (iterations < 5 && Math.abs(previousMidStepWeight - midStepWeight) < 100);

        let result: StepResults;
        result.pathAngle = pathAngle;
        result.verticalSpeed = verticalSpeed;
        result.timeElapsed = stepTime;
        result.distanceTraveled = distanceTraveled;
        result.fuelBurned = fuelBurned;
        result.finalAltitude = initialAltitude + stepSize;
        return result;
    }

    /**
     * THIS IS DONE.
     * @param altitude altitude of this level segment
     * @param stepSize the distance of the step, in NM
     * @param econCAS airspeed during level segment
     * @param econMach mach during level segment (when over crossover altitude)
     * @param zeroFuelWeight zero fuel weight of the aircraft (from INIT B)
     * @param initialFuelWeight weight of fuel at the end of last step
     * @param headwind headwind component (in knots) at altitude; tailwind is negative
     * @param isaDev ISA deviation (in celsius)
     */
    static levelFlightStep(
        altitude: number,
        stepSize: number,
        econCAS: number,
        econMach: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        headwind: number,
        isaDev: number,
    ): StepResults {
        const theta = Common.getTheta(altitude, isaDev);
        const delta = Common.getDelta(theta);
        let mach = Common.CAStoMach(econCAS, delta);

        let tas;
        // TODO: add usingMach?
        // If above crossover altitude, use econMach
        if (mach > econMach) {
            mach = econMach;
            tas = Common.machToTAS(mach, theta);
        } else {
            tas = Common.CAStoTAS(econCAS, theta, delta);
        }

        const initialWeight = zeroFuelWeight + initialFuelWeight;
        const thrust = FlightModel.getDrag(initialWeight, mach, delta, false, false, FlapConf.CLEAN);

        // Engine model calculations
        const theta2 = Common.getTheta2(theta, mach);
        const delta2 = Common.getDelta2(delta, mach);
        // Divide by 2 to get thrust per engine
        const correctedThrust = (thrust / delta2) / 2;
        // Since table 1506 describes corrected thrust as a fraction of max thrust, divide it
        const correctedN1 = EngineModel.reverseTableInterpolation(EngineModel.table1506, mach, (correctedThrust / EngineModel.maxThrust));
        const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, mach, altitude) * 2;
        const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2); // in lbs/hour

        const stepTime = ((tas - headwind) / stepSize) / 60; // in minutes
        const fuelBurned = (fuelFlow / 60) * stepTime;

        let result: StepResults;
        result.pathAngle = 0;
        result.verticalSpeed = 0;
        result.timeElapsed = stepTime;
        result.distanceTraveled = stepSize;
        result.fuelBurned = fuelBurned;
        result.finalAltitude = altitude;
        return result;
    }

    /**
     * THIS IS DONE.
     * @param initialAltitude altitude at beginning of step, in feet
     * @param initialCAS airspeed at beginning of step
     * @param finalCAS airspeed at end of step
     * @param initialMach initial mach, above crossover altitude
     * @param initialMach final mach, above crossover altitude
     * @param commandedN1 N1% at CLB (or idle) setting, depending on flight phase
     * @param zeroFuelWeight zero fuel weight of the aircraft (from INIT B)
     * @param initialFuelWeight weight of fuel at the end of last step
     * @param headwindAtInitialAltitude headwind component (in knots) at initialAltitude
     * @param isaDev ISA deviation (in celsius)
     */
    static speedChangeStep(
        initialAltitude: number,
        initialCAS: number,
        finalCAS: number,
        initialMach: number,
        finalMach: number,
        commandedN1: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        headwindAtInitialAltitude: number,
        isaDev: number,
    ): StepResults {
        const theta = Common.getTheta(initialAltitude, isaDev);
        const delta = Common.getDelta(theta);

        let actualInitialMach = Common.CAStoMach(initialCAS, delta);
        let actualFinalMach = Common.CAStoMach(finalCAS, delta);
        let initialTas;
        let finalTas;
        let initialEas;
        let finalEas;

        // If above crossover altitude, use mach
        if (actualInitialMach > initialMach) {
            actualInitialMach = initialMach;
            initialTas = Common.machToTAS(actualInitialMach, theta);
            initialEas = Common.machToEAS(actualInitialMach, delta);
        } else {
            initialTas = Common.CAStoTAS(initialCAS, theta, delta);
            initialEas = Common.CAStoEAS(initialCAS, delta);
        }

        if (actualFinalMach > finalMach) {
            actualFinalMach = finalMach;
            finalTas = Common.machToTAS(actualFinalMach, theta);
            finalEas = Common.machToEAS(actualFinalMach, delta);
        } else {
            finalTas = Common.CAStoTAS(initialCAS, theta, delta);
            finalEas = Common.CAStoEAS(initialCAS, delta);
        }

        const averageMach = (actualInitialMach + actualFinalMach) / 2;
        const averageEas = (initialEas + finalEas) / 2;
        const averageTas = (initialTas + finalTas) / 2;

        // Engine model calculations
        const theta2 = Common.getTheta2(theta, averageMach);
        const delta2 = Common.getDelta2(delta, averageMach);
        const correctedN1 = EngineModel.getCorrectedN1(commandedN1, theta2);
        const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, averageMach) * 2 * EngineModel.maxThrust;
        const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, averageMach, initialAltitude) * 2;
        const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf
        const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2); // in lbs/hour

        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        let pathAngle;
        let verticalSpeed;
        let stepTime;
        let distanceTraveled;
        let fuelBurned;
        let finalAltitude;
        let lift = weightEstimate;
        let midStepWeight = weightEstimate;
        let previousMidStepWeight = midStepWeight;
        let iterations = 0;
        do {
            // Assume lift force is equal to weight as an initial approximation
            const liftCoefficient = FlightModel.getLiftCoefficientFromEAS(lift, averageEas);
            const dragCoefficient = FlightModel.getDragCoefficient(liftCoefficient);

            const pathAngle = FlightModel.getSpeedChangePathAngleFromCoefficients(
                thrust,
                midStepWeight,
                liftCoefficient,
                dragCoefficient,
            );

            verticalSpeed = 101.268 * averageTas * Math.sin(pathAngle); // in feet per minute
            // TODO: double-check if accel rate operates on TAS or CAS
            stepTime = Math.abs(finalTas - initialTas) / FlightModel.requiredAccelRateKNS; // in minutes
            finalAltitude = initialAltitude + (verticalSpeed * stepTime);
            // TODO: now that we have final altitude, we could get accurate mid-step headwind instead of using initial headwind...
            distanceTraveled = (averageTas - headwindAtInitialAltitude) * stepTime; // in NM
            fuelBurned = (fuelFlow / 60) * stepTime;
            // const endStepWeight = zeroFuelWeight + (initialFuelWeight - fuelBurned); <- not really needed

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            lift = midStepWeight * Math.cos(pathAngle);
            iterations++;
        } while (iterations < 5 && Math.abs(previousMidStepWeight - midStepWeight) < 100);

        let result: StepResults;
        result.pathAngle = pathAngle;
        result.verticalSpeed = verticalSpeed;
        result.timeElapsed = stepTime;
        result.distanceTraveled = distanceTraveled;
        result.fuelBurned = fuelBurned;
        result.finalAltitude = finalAltitude;
        return result;
    }
}
