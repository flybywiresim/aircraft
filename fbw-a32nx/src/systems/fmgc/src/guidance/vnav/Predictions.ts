import { MathUtils } from '@shared/MathUtils';
import { AccelFactorMode, Common, FlapConf } from './common';
import { EngineModel } from './EngineModel';
import { FlightModel } from './FlightModel';

export enum VnavStepError {

    /**
     * The desired path angle is not achievable
     */
    AVAILABLE_GRADIENT_INSUFFICIENT,

    /**
     * While the desired path angle is achievable in theory, the resulting deceleration is lower than the given minimum deceleration
     */
    TOO_LOW_DECELERATION

}

export interface StepResults {
    pathAngle: number,
    verticalSpeed: number,
    distanceTraveled: number,
    fuelBurned: number,
    timeElapsed: number,
    initialAltitude?: number,
    finalAltitude: number,
    error?: VnavStepError,
    speed?: Knots,
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
     * @param speedbrakesExtended whether or not speedbrakes are extended at half (for geometric segment path test only)
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
        speedbrakesExtended = false,
        flapsConfig: FlapConf = FlapConf.CLEAN,
        perfFactorPercent: number = 0,
    ): StepResults {
        const midStepAltitude = initialAltitude + (stepSize / 2);

        const theta = Common.getTheta(midStepAltitude, isaDev, midStepAltitude > tropoAltitude);
        const delta = Common.getDelta(midStepAltitude, midStepAltitude > tropoAltitude);
        let mach = Common.CAStoMach(econCAS, delta);

        let tas: Knots;
        let accelFactorMode: AccelFactorMode = AccelFactorMode.CONSTANT_CAS;
        // If above crossover altitude, use econMach
        if (mach > econMach) {
            mach = econMach;
            tas = Common.machToTAS(mach, theta);
            accelFactorMode = AccelFactorMode.CONSTANT_MACH;
        } else {
            tas = Common.CAStoTAS(econCAS, theta, delta);
        }

        // Engine model calculations
        const theta2 = Common.getTheta2(theta, mach);
        const delta2 = Common.getDelta2(delta, mach);
        const correctedN1 = EngineModel.getCorrectedN1(commandedN1, theta2);
        const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, mach) * 2 * EngineModel.maxThrust;
        const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, mach, midStepAltitude) * 2;
        const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf
        const fuelFlow = Math.max(0, EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2) * (1 + perfFactorPercent / 100)); // in lbs/hour

        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        let pathAngle: Radians;
        let verticalSpeed: FeetPerMinute;
        let stepTime: Seconds;
        let distanceTraveled: NauticalMiles;
        let fuelBurned: Pounds;
        let midStepWeight = weightEstimate;
        let previousMidStepWeight = midStepWeight;
        let iterations = 0;
        do {
            const drag = FlightModel.getDrag(midStepWeight, mach, delta, speedbrakesExtended, false, flapsConfig);

            const accelerationFactor = Common.getAccelerationFactor(mach, midStepAltitude, isaDev, midStepAltitude > tropoAltitude, accelFactorMode);
            pathAngle = FlightModel.getConstantThrustPathAngle(thrust, midStepWeight, drag, accelerationFactor);

            verticalSpeed = 101.268 * tas * Math.sin(pathAngle); // in feet per minute
            stepTime = verticalSpeed !== 0 ? 60 * stepSize / verticalSpeed : 0; // in seconds
            distanceTraveled = (tas - headwindAtMidStepAlt) * (stepTime / 3600); // in nautical miles
            fuelBurned = (fuelFlow / 3600) * stepTime;
            // const endStepWeight = zeroFuelWeight + (initialFuelWeight - fuelBurned); <- not really needed

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            iterations++;
        } while (iterations < 4 && Math.abs(previousMidStepWeight - midStepWeight) > 10);

        return {
            pathAngle: pathAngle * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled,
            fuelBurned,
            initialAltitude,
            finalAltitude: initialAltitude + stepSize,
            speed: econCAS,
        };
    }

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
     * @param speedbrakesExtended whether or not speedbrakes are extended at half (for geometric segment path test only)
     */
    static distanceStep(
        initialAltitude: number,
        distance: number,
        econCAS: number,
        econMach: number,
        commandedN1: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        headwindAtMidStepAlt: number,
        isaDev: number,
        tropoAltitude: number,
        speedbrakesExtended = false,
        flapsConfig: FlapConf = FlapConf.CLEAN,
        perfFactorPercent: number = 0,
    ): StepResults {
        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        let finalAltitude = initialAltitude;
        let previousFinalAltitude = finalAltitude;

        let pathAngle: number;
        let verticalSpeed: FeetPerMinute;
        let stepTime: Seconds;
        let stepSize: Feet;
        let fuelBurned: Pounds;

        let midStepWeight = weightEstimate;
        let iterations = 0;
        do {
            const midStepAltitude = (initialAltitude + finalAltitude) / 2;

            const theta = Common.getTheta(midStepAltitude, isaDev, midStepAltitude > tropoAltitude);
            const delta = Common.getDelta(midStepAltitude, midStepAltitude > tropoAltitude);
            let mach = Common.CAStoMach(econCAS, delta);

            let tas: Knots;
            let accelFactorMode: AccelFactorMode = AccelFactorMode.CONSTANT_CAS;
            // If above crossover altitude, use econMach
            if (mach > econMach) {
                mach = econMach;
                tas = Common.machToTAS(mach, theta);
                accelFactorMode = AccelFactorMode.CONSTANT_MACH;
            } else {
                tas = Common.CAStoTAS(econCAS, theta, delta);
            }

            // Engine model calculations
            const theta2 = Common.getTheta2(theta, mach);
            const delta2 = Common.getDelta2(delta, mach);
            const correctedN1 = EngineModel.getCorrectedN1(commandedN1, theta2);
            const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, mach) * 2 * EngineModel.maxThrust;
            const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, mach, initialAltitude) * 2;
            const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf
            const fuelFlow = Math.max(0, EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2) * (1 + perfFactorPercent / 100)); // in lbs/hour

            const drag = FlightModel.getDrag(midStepWeight, mach, delta, speedbrakesExtended, false, flapsConfig);

            const accelerationFactor = Common.getAccelerationFactor(mach, midStepAltitude, isaDev, midStepAltitude > tropoAltitude, accelFactorMode);
            pathAngle = FlightModel.getConstantThrustPathAngle(thrust, midStepWeight, drag, accelerationFactor);

            verticalSpeed = 101.268 * tas * Math.sin(pathAngle); // in feet per minute
            stepTime = (tas - headwindAtMidStepAlt) !== 0 ? 3600 * distance / (tas - headwindAtMidStepAlt) : 0; // in seconds
            stepSize = stepTime / 60 * verticalSpeed;
            fuelBurned = (fuelFlow / 3600) * stepTime;
            // const endStepWeight = zeroFuelWeight + (initialFuelWeight - fuelBurned); <- not really needed

            // Adjust variables for better accuracy next iteration
            previousFinalAltitude = finalAltitude;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            finalAltitude = initialAltitude + stepSize;
            iterations++;
        } while (iterations < 4 && Math.abs(finalAltitude - previousFinalAltitude) > 10);

        return {
            pathAngle: pathAngle * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled: distance,
            fuelBurned,
            initialAltitude,
            finalAltitude,
            speed: econCAS,
        };
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
        const delta = Common.getDelta(altitude);
        let mach = Common.CAStoMach(econCAS, delta);

        let tas: Knots;
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

        const stepTime = (stepSize / (tas - headwind)) * 3600; // in seconds
        const fuelBurned = (fuelFlow / 3600) * stepTime;

        return {
            pathAngle: 0,
            verticalSpeed: 0,
            timeElapsed: stepTime,
            distanceTraveled: stepSize,
            fuelBurned,
            finalAltitude: altitude,
            initialAltitude: altitude,
            speed: econCAS,
        };
    }

    /**
     * THIS IS DONE.
     * @param flightPathAngle flight path angle (in degrees) to fly the speed change step at
     * @param initialAltitude altitude at beginning of step, in feet
     * @param initialCAS airspeed at beginning of step
     * @param finalCAS airspeed at end of step
     * @param initialMach initial mach, above crossover altitude
     * @param finalMach final mach, above crossover altitude
     * @param commandedN1 N1% at CLB (or idle) setting, depending on flight phase
     * @param zeroFuelWeight zero fuel weight of the aircraft (from INIT B)
     * @param initialFuelWeight weight of fuel at the end of last step
     * @param headwindAtInitialAltitude headwind component (in knots) at initialAltitude
     * @param isaDev ISA deviation (in celsius)
     * @param tropoAltitude tropopause altitude (feet)
     * @param gearExtended whether the gear is extended
     * @param flapConfig the flaps configuration
     * @param minimumAbsoluteAcceleration the minimum absolute acceleration before emitting TOO_LOW_DECELERATION (kts/s)
     */
    static speedChangeStep(
        flightPathAngle: number,
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
        tropoAltitude: number,
        gearExtended = false,
        flapConfig = FlapConf.CLEAN,
        speedbrakesExtended = false,
        minimumAbsoluteAcceleration?: number,
        perfFactorPercent = 0,
    ): StepResults {
        const theta = Common.getTheta(initialAltitude, isaDev, initialAltitude > tropoAltitude);
        const delta = Common.getDelta(initialAltitude, initialAltitude > tropoAltitude);

        let actualInitialMach = Common.CAStoMach(initialCAS, delta);
        let actualFinalMach = Common.CAStoMach(finalCAS, delta);
        let initialTas: Knots;
        let finalTas: Knots;

        // If above crossover altitude, use mach
        if (actualInitialMach > initialMach) {
            actualInitialMach = initialMach;
            initialTas = Common.machToTAS(actualInitialMach, theta);
        } else {
            initialTas = Common.CAStoTAS(initialCAS, theta, delta);
        }

        if (actualFinalMach > finalMach) {
            actualFinalMach = finalMach;
            finalTas = Common.machToTAS(actualFinalMach, theta);
        } else {
            finalTas = Common.CAStoTAS(finalCAS, theta, delta);
        }

        const averageMach = (actualInitialMach + actualFinalMach) / 2;
        const averageTas = (initialTas + finalTas) / 2;

        // Engine model calculations
        const theta2 = Common.getTheta2(theta, averageMach);
        const delta2 = Common.getDelta2(delta, averageMach);
        const correctedN1 = EngineModel.getCorrectedN1(commandedN1, theta2);
        const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, averageMach) * 2 * EngineModel.maxThrust;
        const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, averageMach, initialAltitude) * 2;
        const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf
        const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2) * (1 + perfFactorPercent / 100); // in lbs/hour

        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        let pathAngleRadians = flightPathAngle * MathUtils.DEGREES_TO_RADIANS;
        let error: VnavStepError | null;
        let verticalSpeed: FeetPerMinute;
        let stepTime: Seconds;
        let distanceTraveled: NauticalMiles;
        let fuelBurned: Pounds;
        let finalAltitude: Feet;
        let lift = weightEstimate;
        let midStepWeight = weightEstimate;
        let previousMidStepWeight = midStepWeight;
        let iterations = 0;
        do {
            // Calculate the available gradient
            const drag = FlightModel.getDrag(lift, averageMach, delta, speedbrakesExtended, gearExtended, flapConfig);
            const availableGradient = FlightModel.getAvailableGradient(thrust, drag, weightEstimate);

            pathAngleRadians = flightPathAngle * MathUtils.DEGREES_TO_RADIANS;
            if (Math.abs(availableGradient) < Math.abs(pathAngleRadians)) {
                error = VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT;
                // Save the achievable gradient here, so it can be used by the caller
                pathAngleRadians = availableGradient;

                break;
            }

            const acceleration = FlightModel.accelerationForGradient(availableGradient, pathAngleRadians, FlightModel.gravityConstKNS); // in kts/s

            if (Math.abs(acceleration) < minimumAbsoluteAcceleration) {
                error = VnavStepError.TOO_LOW_DECELERATION;

                break;
            }

            stepTime = (finalTas - initialTas) / acceleration; // in seconds
            distanceTraveled = (stepTime / 3600) * (averageTas - headwindAtInitialAltitude);
            finalAltitude = initialAltitude + 6076.12 * distanceTraveled * Math.tan(pathAngleRadians);
            verticalSpeed = Math.abs(stepTime) < 1e-12 ? 0 : 60 * (finalAltitude - initialAltitude) / stepTime; // in feet per minute
            fuelBurned = (fuelFlow / 3600) * stepTime;

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            lift = midStepWeight * Math.cos(pathAngleRadians);
            iterations++;
        } while (iterations < 4 && Math.abs(previousMidStepWeight - midStepWeight) > 100);

        return {
            pathAngle: pathAngleRadians * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled,
            fuelBurned,
            initialAltitude,
            finalAltitude,
            error,
            speed: finalCAS,
        };
    }

    /**
     * THIS IS DONE.
     * @param initialAltitude altitude at beginning of step, in feet
     * @param finalAltitude altitude at end of step, in feet
     * @param distance distance of step, in NM
     * @param econCAS airspeed during step
     * @param econMach mach during step
     * @param zeroFuelWeight zero fuel weight of the aircraft (from INIT B)
     * @param initialFuelWeight weight of fuel at the end of last step
     * @param isaDev ISA deviation (in celsius)
     * @param tropoAltitude tropopause altitude (feet)
     * @param gearExtended whether or not the landing gear is extended
     * @param flapConfig the current flap configuration
     */
    static geometricStep(
        initialAltitude: number,
        finalAltitude: number,
        distance: number,
        econCAS: number,
        econMach: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        isaDev: number,
        headwind: number,
        tropoAltitude: number,
        gearExtended: boolean,
        flapConfig: FlapConf,
        speedbrakesExtended: boolean,
    ): StepResults {
        const distanceInFeet = distance * 6076.12;
        const fpaRadians = Math.atan((finalAltitude - initialAltitude) / distanceInFeet);
        const fpaDegrees = fpaRadians * MathUtils.RADIANS_TO_DEGREES;
        const midStepAltitude = (initialAltitude + finalAltitude) / 2;

        const theta = Common.getTheta(midStepAltitude, isaDev);
        const delta = Common.getDelta(midStepAltitude);
        let mach = Common.CAStoMach(econCAS, delta);

        let eas;
        let tas;
        let accelFactorMode: AccelFactorMode = AccelFactorMode.CONSTANT_CAS;
        // If above crossover altitude, use econMach
        if (mach > econMach) {
            mach = econMach;
            eas = Common.machToEAS(mach, delta);
            tas = Common.machToTAS(mach, theta);
            accelFactorMode = AccelFactorMode.CONSTANT_MACH;
        } else {
            eas = Common.CAStoEAS(econCAS, delta);
            tas = Common.CAStoTAS(econCAS, theta, delta);
        }

        const weightEstimate = zeroFuelWeight + initialFuelWeight;
        const theta2 = Common.getTheta2(theta, mach);
        const delta2 = Common.getDelta2(delta, mach);

        let thrust: number; // In lbs force
        let verticalSpeed: FeetPerMinute;
        let stepTime: Seconds;
        let fuelBurned: Pounds;
        let lift = weightEstimate * Math.cos(fpaRadians);
        let midStepWeight = weightEstimate;
        let previousMidStepWeight = midStepWeight;
        let iterations = 0;
        do {
            const liftCoefficient = FlightModel.getLiftCoefficientFromEAS(lift, eas);
            const dragCoefficient = FlightModel.getDragCoefficient(liftCoefficient, speedbrakesExtended, gearExtended, flapConfig);
            const accelFactor = Common.getAccelerationFactor(mach, midStepAltitude, isaDev, midStepAltitude > tropoAltitude, accelFactorMode);

            thrust = FlightModel.getThrustFromConstantPathAngleCoefficients(
                fpaDegrees,
                midStepWeight,
                liftCoefficient,
                dragCoefficient,
                accelFactor,
            );

            verticalSpeed = 101.268 * (tas - headwind) * Math.sin(fpaRadians); // in feet per minute
            stepTime = verticalSpeed !== 0 ? 60 * (finalAltitude - initialAltitude) / verticalSpeed : 0; // in seconds

            // Divide by 2 to get thrust per engine
            const correctedThrust = (thrust / delta2) / 2;
            // Since table 1506 describes corrected thrust as a fraction of max thrust, divide it
            const correctedN1 = EngineModel.reverseTableInterpolation(EngineModel.table1506, mach, (correctedThrust / EngineModel.maxThrust));
            const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, mach, midStepAltitude) * 2;
            const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2); // in lbs/hour

            fuelBurned = (fuelFlow / 3600) * stepTime;

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            lift = midStepWeight * Math.cos(fpaRadians);
            iterations++;
        } while (iterations < 4 && Math.abs(previousMidStepWeight - midStepWeight) > 100);

        return {
            pathAngle: fpaDegrees,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled: distance,
            fuelBurned,
            finalAltitude,
            initialAltitude,
            speed: econCAS,
        };
    }

    static verticalSpeedStep(
        initialAltitude: number,
        finalAltitude: number,
        verticalSpeed: number,
        econCAS: number,
        econMach: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        isaDev: number,
        headwind: number,
        perfFactorPercent: number,
    ): StepResults & { predictedN1: number } {
        const midStepAltitude = (initialAltitude + finalAltitude) / 2;

        const theta = Common.getTheta(midStepAltitude, isaDev);
        const delta = Common.getDelta(midStepAltitude);

        let mach = Common.CAStoMach(econCAS, delta);
        const delta2 = Common.getDelta2(delta, mach);
        const theta2 = Common.getTheta2(theta, mach);

        let tas: Knots;
        let accelFactorMode: AccelFactorMode = AccelFactorMode.CONSTANT_CAS;
        // If above crossover altitude, use econMach
        if (mach > econMach) {
            mach = econMach;
            tas = Common.machToTAS(mach, theta);
            accelFactorMode = AccelFactorMode.CONSTANT_MACH;
        } else {
            tas = Common.CAStoTAS(econCAS, theta, delta);
        }

        const pathAngle: Radians = Math.atan2(verticalSpeed, tas * 101.269); // radians
        const stepTime: Seconds = 60 * (finalAltitude - initialAltitude) / verticalSpeed; // seconds
        const distanceTraveled: NauticalMiles = (tas - headwind) * Math.cos(pathAngle) * stepTime / 3600;

        let fuelBurned = 0;
        let iterations = 0;
        let midstepWeight = zeroFuelWeight + initialFuelWeight;
        let previousMidstepWeight = midstepWeight;
        let predictedN1 = 0;
        do {
            const drag = FlightModel.getDrag(midstepWeight, mach, delta, false, false, FlapConf.CLEAN);
            const thrust = FlightModel.getThrustFromConstantPathAngle(pathAngle * MathUtils.RADIANS_TO_DEGREES, midstepWeight, drag, accelFactorMode);

            const correctedThrust = (thrust / delta2) / 2;
            // Since table 1506 describes corrected thrust as a fraction of max thrust, divide it
            predictedN1 = EngineModel.reverseTableInterpolation(EngineModel.table1506, mach, (correctedThrust / EngineModel.maxThrust));

            const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(predictedN1, mach, midStepAltitude) * 2;
            const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2) * (1 + perfFactorPercent / 100); // in lbs/hour

            fuelBurned = fuelFlow / 3600 * stepTime;
            previousMidstepWeight = midstepWeight;
            midstepWeight -= (fuelBurned / 2);
        } while (++iterations < 4 && Math.abs(previousMidstepWeight - midstepWeight) > 100);

        return {
            pathAngle: pathAngle * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            distanceTraveled,
            fuelBurned,
            timeElapsed: stepTime,
            finalAltitude,
            predictedN1,
            speed: econCAS,
        };
    }

    static verticalSpeedDistanceStep(
        initialAltitude: number,
        distance: NauticalMiles,
        verticalSpeed: number,
        econCAS: number,
        econMach: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        isaDev: number,
        headwind: number,
        perfFactorPercent: number,
    ): StepResults & { predictedN1: number } {
        let finalAltitude = initialAltitude;
        let previousFinalAltitude = finalAltitude;

        let pathAngle: Radians = 0;
        let stepTime: Seconds = 0;
        let fuelBurned: Pounds = 0;
        let iterations = 0;
        let midstepWeight: Pounds = zeroFuelWeight + initialFuelWeight;
        let predictedN1 = 0;
        do {
            const midStepAltitude = (initialAltitude + finalAltitude) / 2;

            const theta = Common.getTheta(midStepAltitude, isaDev);
            const delta = Common.getDelta(midStepAltitude);

            let mach = Common.CAStoMach(econCAS, delta);
            const delta2 = Common.getDelta2(delta, mach);
            const theta2 = Common.getTheta2(theta, mach);

            let tas: Knots;
            let accelFactorMode: AccelFactorMode = AccelFactorMode.CONSTANT_CAS;
            // If above crossover altitude, use econMach
            if (mach > econMach) {
                mach = econMach;
                tas = Common.machToTAS(mach, theta);
                accelFactorMode = AccelFactorMode.CONSTANT_MACH;
            } else {
                tas = Common.CAStoTAS(econCAS, theta, delta);
            }

            // TODO: Use headwind
            pathAngle = Math.atan2(verticalSpeed, tas * 101.269); // radians
            stepTime = (tas - headwind) !== 0 ? 3600 * distance / (tas - headwind) : 0;

            const drag = FlightModel.getDrag(midstepWeight, mach, delta, false, false, FlapConf.CLEAN);
            const thrust = FlightModel.getThrustFromConstantPathAngle(pathAngle * MathUtils.RADIANS_TO_DEGREES, midstepWeight, drag, accelFactorMode);

            const correctedThrust = (thrust / delta2) / 2;
            // Since table 1506 describes corrected thrust as a fraction of max thrust, divide it
            predictedN1 = EngineModel.reverseTableInterpolation(EngineModel.table1506, mach, (correctedThrust / EngineModel.maxThrust));

            const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(predictedN1, mach, midStepAltitude) * 2;
            const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2) * (1 + perfFactorPercent / 100); // in lbs/hour

            previousFinalAltitude = finalAltitude;
            finalAltitude = initialAltitude + verticalSpeed * stepTime / 60;
            fuelBurned = fuelFlow / 3600 * stepTime;
            midstepWeight -= (fuelBurned / 2);
        } while (++iterations < 4 && Math.abs(previousFinalAltitude - finalAltitude) > 10);

        return {
            pathAngle: pathAngle * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            distanceTraveled: distance,
            fuelBurned,
            timeElapsed: stepTime,
            initialAltitude,
            finalAltitude,
            predictedN1,
            speed: econCAS,
        };
    }

    static verticalSpeedStepWithSpeedChange(
        initialAltitude: number,
        initialCAS: number,
        finalCAS: number,
        verticalSpeed: number,
        econMach: number,
        commandedN1: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        headwindAtMidStepAlt: number,
        isaDev: number,
        tropoAltitude: number,
        speedbrakesExtended = false,
        flapsConfig: FlapConf = FlapConf.CLEAN,
        perfFactorPercent: number = 0,
    ): StepResults {
        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        let pathAngle: Radians;
        let finalAltitude = initialAltitude;
        let previousFinalAltitude = finalAltitude;
        let stepTime: Seconds;
        let distanceTraveled: NauticalMiles;
        let fuelBurned: Pounds;
        let midStepWeight = weightEstimate;
        let iterations = 0;

        do {
            const midStepAltitude = (initialAltitude + finalAltitude) / 2;
            const isAboveTropo = midStepAltitude > tropoAltitude;

            const theta = Common.getTheta(midStepAltitude, isaDev, isAboveTropo);
            const delta = Common.getDelta(midStepAltitude, isAboveTropo);

            let initialMach = Common.CAStoMach(initialCAS, delta);
            let finalMach = Common.CAStoMach(finalCAS, delta);

            let initialTas: Knots;
            // If above crossover altitude, use econMach
            if (initialMach > econMach) {
                initialMach = econMach;
                initialTas = Common.machToTAS(initialMach, theta);
            } else {
                initialTas = Common.CAStoTAS(initialCAS, theta, delta);
            }

            let finalTas: Knots;
            if (finalMach > econMach) {
                finalMach = econMach;
                finalTas = Common.machToTAS(finalMach, theta);
            } else {
                finalTas = Common.CAStoTAS(finalCAS, theta, delta);
            }

            const midwayTas = (initialTas + finalTas) / 2;
            const midwayMach = (initialMach + finalMach) / 2;

            // Engine model calculations
            const theta2 = Common.getTheta2(theta, midwayMach);
            const delta2 = Common.getDelta2(delta, midwayMach);
            const correctedN1 = EngineModel.getCorrectedN1(commandedN1, theta2);
            const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, midwayMach) * 2 * EngineModel.maxThrust;
            const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, midwayMach, midStepAltitude) * 2;
            const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf
            const fuelFlow = Math.max(0, EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2) * (1 + perfFactorPercent / 100)); // in lbs/hour

            const drag = FlightModel.getDrag(midStepWeight, midwayMach, delta, speedbrakesExtended, false, flapsConfig);

            const availableGradient = FlightModel.getAvailableGradient(thrust, drag, midStepWeight);
            pathAngle = Math.atan2(verticalSpeed, midwayTas * 101.269); // radians

            const acceleration = FlightModel.accelerationForGradient(availableGradient, pathAngle, FlightModel.gravityConstKNS); // kts/s

            stepTime = (finalCAS - initialCAS) / acceleration; // in seconds
            distanceTraveled = (midwayTas - headwindAtMidStepAlt) * (stepTime / 3600); // in nautical miles
            fuelBurned = (fuelFlow / 3600) * stepTime;

            // Adjust variables for better accuracy next iteration
            previousFinalAltitude = finalAltitude;
            finalAltitude = initialAltitude + stepTime / 60 * verticalSpeed;

            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            iterations++;
        } while (iterations < 4 && Math.abs(previousFinalAltitude - finalAltitude) > 10);

        return {
            pathAngle: pathAngle * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled,
            fuelBurned,
            initialAltitude,
            finalAltitude,
            speed: finalCAS,
        };
    }

    static altitudeStepWithSpeedChange(
        initialAltitude: number,
        initialCAS: number,
        finalCAS: number,
        econMach: number,
        commandedN1: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        headwindAtMidStepAlt: number,
        isaDev: number,
        tropoAltitude: number,
        speedbrakesExtended = false,
        flapsConfig: FlapConf = FlapConf.CLEAN,
        perfFactorPercent: number = 0,
    ): StepResults {
        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        let pathAngle: Radians;
        let finalAltitude = initialAltitude;
        let previousFinalAltitude = finalAltitude;
        let verticalSpeed: FeetPerMinute;
        let stepTime: Seconds;
        let distanceTraveled: NauticalMiles;
        let fuelBurned: Pounds;
        let midStepWeight = weightEstimate;
        let iterations = 0;

        do {
            const midStepAltitude = (initialAltitude + finalAltitude) / 2;
            const isAboveTropo = midStepAltitude > tropoAltitude;

            const theta = Common.getTheta(midStepAltitude, isaDev, isAboveTropo);
            const delta = Common.getDelta(midStepAltitude, isAboveTropo);

            let initialMach = Common.CAStoMach(initialCAS, delta);
            let finalMach = Common.CAStoMach(finalCAS, delta);

            let initialTas: Knots;
            // If above crossover altitude, use econMach
            if (initialMach > econMach) {
                initialMach = econMach;
                initialTas = Common.machToTAS(initialMach, theta);
            } else {
                initialTas = Common.CAStoTAS(initialCAS, theta, delta);
            }

            let finalTas: Knots;
            // If above crossover altitude, use econMach
            if (finalMach > econMach) {
                finalMach = econMach;
                finalTas = Common.machToTAS(finalMach, theta);
            } else {
                finalTas = Common.CAStoTAS(finalCAS, theta, delta);
            }

            const midwayMach = (initialMach + finalMach) / 2;
            const midwayTas = (initialTas + finalTas) / 2;

            // Engine model calculations
            const theta2 = Common.getTheta2(theta, midwayMach);
            const delta2 = Common.getDelta2(delta, midwayMach);
            const correctedN1 = EngineModel.getCorrectedN1(commandedN1, theta2);
            const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, midwayMach) * 2 * EngineModel.maxThrust;
            const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, midwayMach, midStepAltitude) * 2;
            const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf
            const fuelFlow = Math.max(0, EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2) * (1 + perfFactorPercent / 100)); // in lbs/hour

            const drag = FlightModel.getDrag(midStepWeight, midwayMach, delta, speedbrakesExtended, false, flapsConfig);

            const availableGradient = FlightModel.getAvailableGradient(thrust, drag, midStepWeight);
            pathAngle = FlightModel.getSpeedChangePathAngle(thrust, midStepWeight, drag); // radians
            const acceleration = FlightModel.accelerationForGradient(availableGradient, pathAngle, FlightModel.gravityConstKNS); // kts/s

            verticalSpeed = 101.268 * midwayTas * Math.sin(pathAngle); // in feet per minute
            stepTime = (finalCAS - initialCAS) / acceleration; // in seconds
            distanceTraveled = (midwayTas - headwindAtMidStepAlt) * (stepTime / 3600); // in nautical miles
            fuelBurned = (fuelFlow / 3600) * stepTime;

            // Adjust variables for better accuracy next iteration
            previousFinalAltitude = finalAltitude;
            finalAltitude = initialAltitude + stepTime / 60 * verticalSpeed;

            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            iterations++;
        } while (iterations < 4 && Math.abs(previousFinalAltitude - finalAltitude) > 10);

        return {
            pathAngle: pathAngle * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled,
            fuelBurned,
            initialAltitude,
            finalAltitude,
            speed: finalCAS,
        };
    }
}
