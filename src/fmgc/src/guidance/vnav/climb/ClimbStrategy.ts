import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { DescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { EngineModel } from '../EngineModel';
import { FlapConf } from '../common';
import { Predictions, StepResults } from '../Predictions';
import { AtmosphericConditions } from '../AtmosphericConditions';

export interface ClimbStrategy {
    /**
     * Computes predictions for a single segment using the atmospheric conditions in the middle.
     * @param initialAltitude Altitude at the start of climb
     * @param finalAltitude Altitude to terminate the climb
     * @param speed
     * @param mach
     * @param fuelOnBoard Remainging fuel on board at the start of the climb
     * @returns `StepResults`
     */
    predictToAltitude(initialAltitude: number, finalAltitude: number, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults;

    predictToDistance(initialAltitude: number, distance: NauticalMiles, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults;

    predictToSpeed(initialAltitude: number, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults;
}

export class VerticalSpeedStrategy implements ClimbStrategy, DescentStrategy {
    constructor(private observer: VerticalProfileComputationParametersObserver, private atmosphericConditions: AtmosphericConditions, private verticalSpeed: FeetPerMinute) { }

    predictToAltitude(initialAltitude: Feet, finalAltitude: Feet, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults {
        const { zeroFuelWeight, perfFactor } = this.observer.get();

        return Predictions.verticalSpeedStep(
            initialAltitude,
            finalAltitude,
            this.verticalSpeed,
            speed,
            mach,
            zeroFuelWeight,
            fuelOnBoard,
            this.atmosphericConditions.isaDeviation,
            headwindComponent.value,
            perfFactor,
        );
    }

    predictToDistance(initialAltitude: Feet, distance: NauticalMiles, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults {
        const { zeroFuelWeight, perfFactor } = this.observer.get();

        return Predictions.verticalSpeedDistanceStep(
            initialAltitude,
            distance,
            this.verticalSpeed,
            speed,
            mach,
            zeroFuelWeight,
            fuelOnBoard,
            this.atmosphericConditions.isaDeviation,
            headwindComponent.value,
            perfFactor,
        );
    }

    predictToSpeed(initialAltitude: Feet, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults {
        const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();

        return Predictions.verticalSpeedStepWithSpeedChange(
            initialAltitude,
            speed,
            finalSpeed,
            this.verticalSpeed,
            mach,
            getClimbThrustN1Limit(this.atmosphericConditions, initialAltitude, speed),
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            false,
            FlapConf.CLEAN,
            perfFactor,
        );
    }

    predictToDistanceBackwards(_finalAltitude: number, _distance: NauticalMiles, _speed: Knots, _mach: Mach, _fuelOnBoard: number): StepResults {
        throw new Error('[FMS/VNAV] Backwards distance predictions not implemented for V/S strategy');
    }

    predictToSpeedBackwards(_finalAltitude: number, _finalSpeed: Knots, _speed: Knots, _mach: Mach, _fuelOnBoard: number): StepResults {
        throw new Error('[FMS/VNAV] Backwards speed predictions not implemented for V/S strategy');
    }
}

export class ClimbThrustClimbStrategy implements ClimbStrategy {
    constructor(private observer: VerticalProfileComputationParametersObserver, private atmosphericConditions: AtmosphericConditions) { }

    predictToAltitude(initialAltitude: Feet, finalAltitude: Feet, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults {
        const { zeroFuelWeight, tropoPause, perfFactor } = this.observer.get();

        return Predictions.altitudeStep(
            initialAltitude,
            finalAltitude - initialAltitude,
            speed,
            mach,
            getClimbThrustN1Limit(this.atmosphericConditions, (initialAltitude + finalAltitude) / 2, speed),
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            false,
            FlapConf.CLEAN,
            perfFactor,
        );
    }

    predictToDistance(initialAltitude: Feet, distance: NauticalMiles, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults {
        const { zeroFuelWeight, tropoPause, perfFactor } = this.observer.get();

        return Predictions.distanceStep(
            initialAltitude,
            distance,
            speed,
            mach,
            getClimbThrustN1Limit(this.atmosphericConditions, initialAltitude, speed),
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            false,
            FlapConf.CLEAN,
            perfFactor,
        );
    }

    predictToSpeed(initialAltitude: Feet, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent): StepResults {
        const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();

        return Predictions.altitudeStepWithSpeedChange(
            initialAltitude,
            speed,
            finalSpeed,
            mach,
            getClimbThrustN1Limit(this.atmosphericConditions, initialAltitude, speed),
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            false,
            FlapConf.CLEAN,
            perfFactor,
        );
    }
}

function getClimbThrustN1Limit(atmosphericConditions: AtmosphericConditions, altitude: Feet, speed: Knots) {
    // This Mach number is the Mach number for the predicted climb speed, not the Mach to use after crossover altitude.
    const climbSpeedMach = atmosphericConditions.computeMachFromCas(altitude, speed);
    const estimatedTat = atmosphericConditions.totalAirTemperatureFromMach(altitude, climbSpeedMach);

    return EngineModel.tableInterpolation(EngineModel.maxClimbThrustTableLeap, estimatedTat, altitude);
}
