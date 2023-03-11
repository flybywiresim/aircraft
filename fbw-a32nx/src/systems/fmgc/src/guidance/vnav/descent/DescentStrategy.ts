import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlightPathAngleStrategy, VerticalSpeedStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
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
     * Computes a step from an initial altitude until the aircraft reaches finalSpeed
     * @param initialAltitude
     * @param speed
     * @param finalSpeed
     * @param mach
     * @param fuelOnBoard
     */
    predictToSpeed(
        initialAltitude: number, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration
    ): StepResults
}

export class DesModeStrategy implements DescentStrategy {
    private readonly decelerationStrategy: DescentStrategy;

    private constructor(
        observer: VerticalProfileComputationParametersObserver,
        atmosphericConditions: AtmosphericConditions,
        private readonly descentStrategy: DescentStrategy,
    ) {
        this.decelerationStrategy = new IdleDescentStrategy(observer, atmosphericConditions);
    }

    static aboveProfile(observer: VerticalProfileComputationParametersObserver, atmosphericConditions: AtmosphericConditions): DesModeStrategy {
        return new DesModeStrategy(observer, atmosphericConditions,
            new IdleDescentStrategy(observer, atmosphericConditions, { flapConfig: FlapConf.CLEAN, gearExtended: false, speedbrakesExtended: true }));
    }

    static belowProfileVs(observer: VerticalProfileComputationParametersObserver, atmosphericConditions: AtmosphericConditions, verticalSpeed: FeetPerMinute): DescentStrategy {
        return new DesModeStrategy(observer, atmosphericConditions,
            new VerticalSpeedStrategy(observer, atmosphericConditions, verticalSpeed));
    }

    static belowProfileFpa(observer: VerticalProfileComputationParametersObserver, atmosphericConditions: AtmosphericConditions, flightPathAngle: Degrees): DescentStrategy {
        return new DesModeStrategy(observer, atmosphericConditions,
            new FlightPathAngleStrategy(observer, atmosphericConditions, flightPathAngle));
    }

    predictToAltitude(
        initialAltitude: number, finalAltitude: number, speed: number, mach: number, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration,
    ): StepResults {
        return this.descentStrategy.predictToAltitude(initialAltitude, finalAltitude, speed, mach, fuelOnBoard, headwindComponent, config);
    }

    predictToDistance(
        initialAltitude: number, distance: number, speed: number, mach: number, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration,
    ): StepResults {
        return this.descentStrategy.predictToDistance(initialAltitude, distance, speed, mach, fuelOnBoard, headwindComponent, config);
    }

    predictToSpeed(
        initialAltitude: number, finalSpeed: number, speed: number, mach: number, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration,
    ): StepResults {
        return this.decelerationStrategy.predictToSpeed(initialAltitude, finalSpeed, speed, mach, fuelOnBoard, headwindComponent, config);
    }
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

    predictToSpeed(
        initialAltitude: number, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config: AircraftConfiguration = this.defaultConfig,
    ): StepResults {
        const { zeroFuelWeight, perfFactor, tropoPause } = this.observer.get();

        const computedMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, speed), mach);
        const predictedN1 = EngineModel.getIdleN1(initialAltitude, computedMach) + VnavConfig.IDLE_N1_MARGIN;

        const initialMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, speed), mach);
        const finalMach = Math.min(this.atmosphericConditions.computeMachFromCas(initialAltitude, finalSpeed), mach);

        return Predictions.speedChangeStep(
            -1,
            initialAltitude,
            speed,
            finalSpeed,
            initialMach,
            finalMach,
            predictedN1,
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            config.gearExtended,
            config.flapConfig,
            config.speedbrakesExtended,
            perfFactor,
        );
    }
}
