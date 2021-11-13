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
            const dragCoefficient = FlightModel.getDragCoefficient(liftCoefficient, speedbrakesExtended, false, flapsConfig);
            const accelFactorMode = usingMach ? AccelFactorMode.CONSTANT_MACH : AccelFactorMode.CONSTANT_CAS;
            const accelFactor = Common.getAccelerationFactor(mach, midStepAltitude, isaDev, midStepAltitude > tropoAltitude, accelFactorMode);
            pathAngle = FlightModel.getConstantThrustPathAngleFromCoefficients(
                thrust,
                midStepWeight,
                liftCoefficient,
                dragCoefficient,
                accelFactor,
            );

            verticalSpeed = 101.268 * tas * Math.sin(pathAngle); // in feet per minute
            stepTime = stepSize / verticalSpeed; // in minutes
            distanceTraveled = (tas - headwindAtMidStepAlt) * (stepTime / 60); // in nautical miles
            fuelBurned = (fuelFlow / 60) * stepTime;
            // const endStepWeight = zeroFuelWeight + (initialFuelWeight - fuelBurned); <- not really needed

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            lift = midStepWeight * Math.cos(pathAngle);
            iterations++;
        } while (iterations < 4 && Math.abs(previousMidStepWeight - midStepWeight) < 100);

        return {
            pathAngle: pathAngle * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled,
            fuelBurned,
            finalAltitude: initialAltitude + stepSize,
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
        const delta = Common.getDelta(theta);
        let mach = Common.CAStoMach(econCAS, delta);

        let tas;
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
        flightPahAngle: number,
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
        minimumAbsoluteAcceleration?: number,
    ): StepResults {
        const theta = Common.getTheta(initialAltitude, isaDev);
        const delta = Common.getDelta(theta);

        let actualInitialMach = Common.CAStoMach(initialCAS, delta);
        let actualFinalMach = Common.CAStoMach(finalCAS, delta);
        let initialTas;
        let finalTas;
        // let initialEas;
        // let finalEas;

        // let usingMachAtStart;
        // If above crossover altitude, use mach
        if (actualInitialMach > initialMach) {
            actualInitialMach = initialMach;
            initialTas = Common.machToTAS(actualInitialMach, theta);
            // initialEas = Common.machToEAS(actualInitialMach, delta);
            // usingMachAtStart = true;
        } else {
            initialTas = Common.CAStoTAS(initialCAS, theta, delta);
            // initialEas = Common.CAStoEAS(initialCAS, delta);
            // usingMachAtStart = false;
        }

        // let usingMachAtEnd;
        if (actualFinalMach > finalMach) {
            actualFinalMach = finalMach;
            finalTas = Common.machToTAS(actualFinalMach, theta);
            // finalEas = Common.machToEAS(actualFinalMach, delta);
            // usingMachAtEnd = true;
        } else {
            finalTas = Common.CAStoTAS(finalCAS, theta, delta);
            // finalEas = Common.CAStoEAS(finalCAS, delta);
            // usingMachAtEnd = false;
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
        const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2); // in lbs/hour

        const weightEstimate = zeroFuelWeight + initialFuelWeight;

        const pathAngleRadians = flightPahAngle * MathUtils.DEGREES_TO_RADIANS;

        let error;
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
            // Calculate the available gradient
            const drag = FlightModel.getDrag(lift, averageMach, delta, false, gearExtended, flapConfig);
            const availableGradient = FlightModel.getAvailableGradient(thrust, drag, weightEstimate);

            if (Math.abs(availableGradient) < Math.abs(pathAngleRadians)) {
                if (DEBUG) {
                    console.warn('[FMS/VNAV/ConstantSlopeSegment] Desired path angle is greater than available gradient.');
                }
                error = VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT;
            }

            const acceleration = FlightModel.accelerationForGradient(
                availableGradient,
                pathAngleRadians,
                9.81,
            );

            // TODO what do we do with this
            // const accelFactorMode = usingMachAtStart ? AccelFactorMode.CONSTANT_MACH : AccelFactorMode.CONSTANT_CAS;
            // const accelFactor = Common.getAccelerationFactor(averageMach,
            //     initialAltitude,
            //     isaDev,
            //     initialAltitude > tropoAltitude,
            //     accelFactorMode);

            // pathAngle = FlightModel.fpaForGradient(
            //     availableGradient,
            //     FlightModel.requiredAccelRateMS2,
            //     accelFactor,
            // );

            const accelerationKNS = (FlightModel.requiredAccelRateKNS * acceleration) / FlightModel.requiredAccelRateMS2;

            if (Math.abs(accelerationKNS) < minimumAbsoluteAcceleration) {
                if (DEBUG) {
                    console.warn('[FMS/VNAV/ConstantSlopeSegment] Minimum absolute acceleration not achieved with given desired path angle.');
                }
                error = VnavStepError.TOO_LOW_DECELERATION;
            }

            stepTime = Math.abs(finalTas - initialTas) / Math.abs(accelerationKNS);

            distanceTraveled = (stepTime / 3600) * averageTas;

            verticalSpeed = 101.268 * averageTas * Math.sin(pathAngleRadians); // in feet per minute
            // // TODO: double-check if accel rate operates on TAS or CAS
            // stepTime = Math.abs(finalTas - initialTas) / accelerationKNS; // in seconds
            finalAltitude = initialAltitude + (verticalSpeed * (stepTime / 60)); // in feet
            // TODO: now that we have final altitude, we could get accurate mid-step headwind instead of using initial headwind...
            // distanceTraveled = (averageTas - headwindAtInitialAltitude) * (stepTime / 3_600); // in NM
            fuelBurned = (fuelFlow / 60) * stepTime;
            // const endStepWeight = zeroFuelWeight + (initialFuelWeight - fuelBurned); <- not really needed

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            lift = midStepWeight * Math.cos(pathAngleRadians);
            iterations++;
        } while (iterations < 4 && Math.abs(previousMidStepWeight - midStepWeight) < 100);

        return {
            pathAngle: pathAngleRadians * MathUtils.RADIANS_TO_DEGREES,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled,
            fuelBurned,
            finalAltitude,
            error,
        };
    }

    /**
     * THIS IS DONE.
     * @param initialAltitude altitude at beginning of step, in feet
     * @param finalAltitude altitude at end of step, in feet
     * @param distance distance of step, in NM
     * @param econCAS airspeed during step
     * @param econMach mach during step
     * @param idleN1 N1% at idle setting
     * @param zeroFuelWeight zero fuel weight of the aircraft (from INIT B)
     * @param initialFuelWeight weight of fuel at the end of last step
     * @param headwindAtMidStepAlt headwind component (in knots) at initialAltitude + (stepSize / 2); tailwind is negative
     * @param isaDev ISA deviation (in celsius)
     * @param tropoAltitude tropopause altitude (feet)
     */
    static geometricStepAchievable(
        initialAltitude: number,
        finalAltitude: number,
        distance: number,
        econCAS: number,
        econMach: number,
        idleN1: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        headwindAtMidStepAlt: number,
        isaDev: number,
        tropoAltitude: number,
    ): boolean {
        const idleStepResults = Predictions.altitudeStep(
            initialAltitude,
            (finalAltitude - initialAltitude),
            econCAS,
            econMach,
            idleN1,
            zeroFuelWeight,
            initialFuelWeight,
            headwindAtMidStepAlt,
            isaDev,
            tropoAltitude,
            true,
        );

        // If converted FPA is less than the FPA from altitudeStep, then this path is too steep :(
        const distanceInFeet = distance * 6076.12;
        const stepFPA = Math.atan((finalAltitude - initialAltitude) / distanceInFeet) * MathUtils.RADIANS_TO_DEGREES;
        return idleStepResults.pathAngle <= stepFPA;
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
        tropoAltitude: number,
    ): StepResults {
        const distanceInFeet = distance * 6076.12;
        const fpaRadians = Math.atan((finalAltitude - initialAltitude) / distanceInFeet);
        const fpaDegrees = fpaRadians * MathUtils.RADIANS_TO_DEGREES;
        const midStepAltitude = (initialAltitude + finalAltitude) / 2;

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

        const weightEstimate = zeroFuelWeight + initialFuelWeight;
        const theta2 = Common.getTheta2(theta, mach);
        const delta2 = Common.getDelta2(delta, mach);

        let thrust;
        let verticalSpeed;
        let stepTime;
        let fuelBurned;
        let lift = weightEstimate * Math.cos(fpaRadians);
        let midStepWeight = weightEstimate;
        let previousMidStepWeight = midStepWeight;
        let iterations = 0;
        do {
            const liftCoefficient = FlightModel.getLiftCoefficientFromEAS(lift, eas);
            const dragCoefficient = FlightModel.getDragCoefficient(liftCoefficient);
            const accelFactorMode = usingMach ? AccelFactorMode.CONSTANT_MACH : AccelFactorMode.CONSTANT_CAS;
            const accelFactor = Common.getAccelerationFactor(mach, midStepAltitude, isaDev, midStepAltitude > tropoAltitude, accelFactorMode);

            thrust = FlightModel.getThrustFromConstantPathAngleCoefficients(
                fpaDegrees,
                midStepWeight,
                liftCoefficient,
                dragCoefficient,
                accelFactor,
            );

            verticalSpeed = 101.268 * tas * Math.sin(fpaRadians); // in feet per minute
            stepTime = (finalAltitude - initialAltitude) / verticalSpeed; // in minutes

            // Divide by 2 to get thrust per engine
            const correctedThrust = (thrust / delta2) / 2;
            // Since table 1506 describes corrected thrust as a fraction of max thrust, divide it
            const correctedN1 = EngineModel.reverseTableInterpolation(EngineModel.table1506, mach, (correctedThrust / EngineModel.maxThrust));
            const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(correctedN1, mach, midStepAltitude) * 2;
            const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2); // in lbs/hour

            fuelBurned = (fuelFlow / 60) * stepTime;

            // Adjust variables for better accuracy next iteration
            previousMidStepWeight = midStepWeight;
            midStepWeight = zeroFuelWeight + (initialFuelWeight - (fuelBurned / 2));
            lift = midStepWeight * Math.cos(fpaRadians);
            iterations++;
        } while (iterations < 4 && Math.abs(previousMidStepWeight - midStepWeight) < 100);

        return {
            pathAngle: fpaDegrees,
            verticalSpeed,
            timeElapsed: stepTime,
            distanceTraveled: distance,
            fuelBurned,
            finalAltitude,
        };
    }

    // static constantSlopeSegment(
    //
    // ): StepResults {
    //     // e = ((T - D / W)
    //     // a = g * (sin(available climb angle) - sin (desired fpa))
    //     // d = ((final velocity squared) - (initial velocity squared)) / (2 * a)
    // }

    /**
     * THIS IS DONE.
     * @param initialAltitude altitude at beginning of step, in feet
     * @param finalAltitude altitude at end of step, in feet
     * @param distance distance of step, in NM
     * @param econCAS airspeed during step
     * @param econMach mach during step
     * @param idleN1 N1% at idle setting
     * @param zeroFuelWeight zero fuel weight of the aircraft (from INIT B)
     * @param initialFuelWeight weight of fuel at the end of last step
     * @param isaDev ISA deviation (in celsius)
     */
    static decelerationFromGeometricStep(
        initialAltitude: number,
        finalAltitude: number,
        econCAS: number,
        econMach: number,
        idleN1: number,
        zeroFuelWeight: number,
        initialFuelWeight: number,
        isaDev: number,
    ): number {
        const distanceInFeet = distance * 6076.12;
        const fpaRadians = Math.atan((finalAltitude - initialAltitude) / distanceInFeet);
        const fpaDegrees = fpaRadians * MathUtils.RADIANS_TO_DEGREES;
        const midStepAltitude = (initialAltitude + finalAltitude) / 2;

        const theta = Common.getTheta(midStepAltitude, isaDev);
        const delta = Common.getDelta(theta);
        let mach = Common.CAStoMach(econCAS, delta);

        let eas;
        // If above crossover altitude, use econMach
        if (mach > econMach) {
            mach = econMach;
            eas = Common.machToEAS(mach, delta);
        } else {
            eas = Common.CAStoEAS(econCAS, delta);
        }

        const theta2 = Common.getTheta2(theta, mach);
        const delta2 = Common.getDelta2(delta, mach);
        const correctedN1 = EngineModel.getCorrectedN1(idleN1, theta2);
        const correctedThrust = EngineModel.tableInterpolation(EngineModel.table1506, correctedN1, mach) * 2 * EngineModel.maxThrust;
        const thrust = EngineModel.getUncorrectedThrust(correctedThrust, delta2); // in lbf

        const weightEstimate = zeroFuelWeight + initialFuelWeight;
        const lift = weightEstimate * Math.cos(fpaRadians);
        const liftCoefficient = FlightModel.getLiftCoefficientFromEAS(lift, eas);
        const dragCoefficient = FlightModel.getDragCoefficient(liftCoefficient);

        const accelRate = FlightModel.getAccelRateFromIdleGeoPathCoefficients(
            thrust,
            weightEstimate,
            liftCoefficient,
            dragCoefficient,
            fpaDegrees,
        );

        return accelRate;
    }
}
