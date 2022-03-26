import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { AircraftConfiguration } from '@fmgc/guidance/vnav/descent/ApproachPathBuilder';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { Predictions, StepResults } from '@fmgc/guidance/vnav/Predictions';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { WindComponent } from '@fmgc/guidance/vnav/wind';

const DEFAULT_CONFIG: AircraftConfiguration = {
    flapConfig: FlapConf.CLEAN,
    speedbrakesExtended: false,
    gearExtended: false,
};

export interface DescentStrategy {
    /**
     * Computes predictions for a single segment using the atmospheric conditions in the middle.
     * @param initialAltitude Altitude at the start of descent
     * @param finalAltitude Altitude to terminate the descent
     * @param speed
     * @param mach
     * @param fuelOnBoard Remainging fuel on board at the start of the descent
     * @returns `StepResults`
     */
    predictToAltitude(
        initialAltitude: number, finalAltitude: number, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration
    ): StepResults;

    /**
     * Computes a descent step forwards
     * @param initialAltitude Altitude that you should end up at after descending
     * @param distance
     * @param speed
     * @param mach
     * @param fuelOnBoard
     */
    predictToDistance(
        initialAltitude: number, distance: NauticalMiles, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration
    ): StepResults;

        /**
     * Computes a descent step backwards
     * @param finalAltitude Altitude that you should end up at after descending
     * @param distance
     * @param speed
     * @param mach
     * @param fuelOnBoard
     */
    predictToDistanceBackwards(
        finalAltitude: number, distance: NauticalMiles, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration
    ): StepResults;

    /**
     * Computes a step from an initial altitude until the aircraft reaches finalSpeed
     * @param initialAltitude
     * @param speed
     * @param finalSpeed
     * @param mach
     * @param fuelOnBoard
     */
    predictToSpeed(
        initialAltitude: number, speed: Knots, finalSpeed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration
    ): StepResults

    /**
     * Computes a descending deceleration backwards
     * @param finalAltitude Altitude that you should end up at after descending
     * @param finalSpeed Speed that you should be at after decelerating
     * @param speed
     * @param mach
     * @param fuelOnBoard
     */
    predictToSpeedBackwards(
        finalAltitude: number, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration
    ): StepResults;
}

export class IdleDescentStrategy implements DescentStrategy {
    constructor(private observer: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
        private defaultConfig: AircraftConfiguration = DEFAULT_CONFIG) { }

    predictToAltitude(
        initialAltitude: number, finalAltitude: number, speed: number, mach: number, fuelOnBoard: number, headwindComponent: WindComponent, config: AircraftConfiguration = this.defaultConfig,
    ): StepResults {
        const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();

        const midwayAltitude = (initialAltitude + finalAltitude) / 2;
        const computedMach = Math.min(this.atmosphericConditions.computeMachFromCas(midwayAltitude, speed), mach);
        const predictedN1 = EngineModel.getIdleN1(midwayAltitude, computedMach) + VnavConfig.IDLE_N1_MARGIN;

        return Predictions.altitudeStep(
            initialAltitude,
            finalAltitude - initialAltitude,
            speed,
            mach,
            predictedN1,
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            config.speedbrakesExtended,
            config.flapConfig,
            perfFactor,
        );
    }

    predictToDistance(
        initialAltitude: number, distance: number, speed: number, mach: number, fuelOnBoard: number, headwindComponent: WindComponent, config: AircraftConfiguration = this.defaultConfig,
    ): StepResults {
        const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();

        const computedMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, speed), mach);
        const predictedN1 = EngineModel.getIdleN1(initialAltitude, computedMach) + VnavConfig.IDLE_N1_MARGIN;

        return Predictions.distanceStep(
            initialAltitude,
            distance,
            speed,
            mach,
            predictedN1,
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            config.speedbrakesExtended,
            config.flapConfig,
            perfFactor,
        );
    }

    predictToDistanceBackwards(
        finalAltitude: number, distance: number, speed: number, mach: number, fuelOnBoard: number, headwindComponent: WindComponent, config: AircraftConfiguration = this.defaultConfig,
    ): StepResults {
        const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();

        const computedMach = Math.min(this.atmosphericConditions.computeMachFromCas(finalAltitude, speed), mach);
        const predictedN1 = EngineModel.getIdleN1(finalAltitude, computedMach) + VnavConfig.IDLE_N1_MARGIN;

        return Predictions.reverseDistanceStep(
            finalAltitude,
            distance,
            speed,
            mach,
            predictedN1,
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            config.speedbrakesExtended,
            config.flapConfig,
            perfFactor,
        );
    }

    predictToSpeed(
        _initialAltitude: number, _speed: Knots, _finalSpeed: Knots, _mach: Mach, _fuelOnBoard: number, _headwindComponent: WindComponent, _config: AircraftConfiguration = this.defaultConfig,
    ): StepResults {
        throw new Error('[FMS/VNAV] predictToSpeed not implemented for IdleDescentStrategy');
    }

    predictToSpeedBackwards(
        finalAltitude: number, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config: AircraftConfiguration = this.defaultConfig,
    ): StepResults {
        const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();

        const initialMach = Math.min(this.atmosphericConditions.computeMachFromCas(finalAltitude, speed), mach);
        const finalMach = Math.min(this.atmosphericConditions.computeMachFromCas(finalAltitude, finalSpeed), mach);

        const predictedN1 = EngineModel.getIdleN1(finalAltitude, (initialMach + finalMach) / 2) + VnavConfig.IDLE_N1_MARGIN;

        return Predictions.reverseAltitudeStepWithSpeedChange(
            finalAltitude,
            speed,
            finalSpeed,
            mach,
            predictedN1,
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            config.speedbrakesExtended,
            config.flapConfig,
            perfFactor,
        );
    }
}
