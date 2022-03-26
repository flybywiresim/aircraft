import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { Step, StepCoordinator } from '@fmgc/guidance/vnav/StepCoordinator';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { ClimbStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { DescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { Predictions, StepResults } from '../Predictions';
import { MaxSpeedConstraint, VerticalCheckpoint, VerticalCheckpointReason } from '../profile/NavGeometryProfile';
import { AtmosphericConditions } from '../AtmosphericConditions';

export class CruisePathBuilder {
    constructor(private computationParametersObserver: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
        private stepCoordinator: StepCoordinator) { }

    computeCruisePath(
        profile: BaseGeometryProfile,
        startOfCruise: VerticalCheckpoint,
        targetDistanceFromStart: NauticalMiles,
        stepClimbStrategy: ClimbStrategy,
        stepDescentStrategy: DescentStrategy,
        speedProfile: SpeedProfile,
        windProfile: HeadwindProfile,
    ): TemporaryCheckpointSequence {
        const sequence = new TemporaryCheckpointSequence(startOfCruise);

        for (const step of this.stepCoordinator.steps) {
            // If the step is too close to T/D
            if (step.isIgnored) {
                continue;
            }

            if (step.distanceFromStart < startOfCruise.distanceFromStart || step.distanceFromStart > targetDistanceFromStart) {
                if (VnavConfig.DEBUG_PROFILE) {
                    console.warn(
                        `[FMS/VNAV] Cruise step is not within cruise segment \
                        (${step.distanceFromStart.toFixed(2)} NM, T/C: ${startOfCruise.distanceFromStart.toFixed(2)} NM, T/D: ${targetDistanceFromStart.toFixed(2)} NM)`,
                    );
                }

                continue;
            }

            // See if there are any speed constraints before the step
            for (const speedConstraint of profile.maxClimbSpeedConstraints) {
                if (speedConstraint.distanceFromStart > step.distanceFromStart) {
                    continue;
                }

                this.addSegmentToSpeedConstraint(sequence, speedConstraint, speedProfile, windProfile);
            }

            const { distanceFromStart, altitude, remainingFuelOnBoard } = sequence.lastCheckpoint;

            const speed = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Cruise);
            const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
            const segmentToStep = this.computeCruiseSegment(step.distanceFromStart - distanceFromStart, remainingFuelOnBoard, speed, headwind);
            sequence.addCheckpointFromStep(segmentToStep, VerticalCheckpointReason.AtmosphericConditions);

            this.addStepFromLastCheckpoint(sequence, step, stepClimbStrategy, stepDescentStrategy);
        }

        // Once again, we check if there are any speed constraints before the T/D
        for (const speedConstraint of profile.maxClimbSpeedConstraints) {
            // If speed constraint does not lie along the remaining cruise track
            if (speedConstraint.distanceFromStart > targetDistanceFromStart) {
                continue;
            }

            this.addSegmentToSpeedConstraint(sequence, speedConstraint, speedProfile, windProfile);
        }

        const speedTarget = speedProfile.getTarget(
            sequence.lastCheckpoint.distanceFromStart,
            sequence.lastCheckpoint.altitude,
            ManagedSpeedType.Cruise,
        );

        if (speedTarget - sequence.lastCheckpoint.speed > 1) {
            const accelerationStep = this.levelAccelerationStep(
                sequence.lastCheckpoint.distanceFromStart,
                sequence.lastCheckpoint.speed,
                speedTarget,
                windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.distanceFromStart),
            );

            sequence.addCheckpointFromStep(accelerationStep, VerticalCheckpointReason.AtmosphericConditions);
        }

        if (targetDistanceFromStart < sequence.lastCheckpoint.distanceFromStart) {
            console.warn('[FMS/VNAV] An acceleration step in the cruise took us past T/D. This is not implemented properly yet. Blame BBK');
        }

        const step = this.computeCruiseSegment(
            targetDistanceFromStart - sequence.lastCheckpoint.distanceFromStart,
            startOfCruise.remainingFuelOnBoard,
            speedTarget,
            windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
        );

        sequence.addCheckpointFromStep(step, VerticalCheckpointReason.AtmosphericConditions);

        return sequence;
    }

    private addSegmentToSpeedConstraint(sequence: TemporaryCheckpointSequence, speedConstraint: MaxSpeedConstraint, speedProfile: SpeedProfile, windProfile: HeadwindProfile) {
        const { distanceFromStart, altitude, remainingFuelOnBoard } = sequence.lastCheckpoint;

        if (speedConstraint.distanceFromStart < distanceFromStart) {
            return;
        }

        const speed = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Cruise);
        const segmentResult = this.computeCruiseSegment(
            speedConstraint.distanceFromStart - distanceFromStart,
            remainingFuelOnBoard,
            speed,
            windProfile.getHeadwindComponent(distanceFromStart, altitude),
        );

        sequence.addCheckpointFromStep(segmentResult, VerticalCheckpointReason.SpeedConstraint);
    }

    private addStepFromLastCheckpoint(sequence: TemporaryCheckpointSequence, step: Step, stepClimbStrategy: ClimbStrategy, stepDescentStrategy: DescentStrategy) {
        // TODO: What happens if the step is at cruise altitude?
        const { managedCruiseSpeed, managedCruiseSpeedMach } = this.computationParametersObserver.get();
        const { altitude, remainingFuelOnBoard } = sequence.lastCheckpoint;

        const isClimbVsDescent = step.toAltitude > altitude;
        // Instead of just atmospheric conditions, the last checkpoint is now a step climb point
        if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.AtmosphericConditions) {
            sequence.lastCheckpoint.reason = isClimbVsDescent
                ? VerticalCheckpointReason.StepClimb
                : VerticalCheckpointReason.StepDescent;
        }

        const stepResults = isClimbVsDescent
            ? stepClimbStrategy.predictToAltitude(altitude, step.toAltitude, managedCruiseSpeed, managedCruiseSpeedMach, remainingFuelOnBoard, WindComponent.zero())
            : stepDescentStrategy.predictToAltitude(altitude, step.toAltitude, managedCruiseSpeed, managedCruiseSpeed, remainingFuelOnBoard, WindComponent.zero());

        sequence.addCheckpointFromStep(stepResults, isClimbVsDescent ? VerticalCheckpointReason.TopOfStepClimb : VerticalCheckpointReason.BottomOfStepDescent);
    }

    private computeCruiseSegment(distance: NauticalMiles, remainingFuelOnBoard: number, speed: Knots, headwind: WindComponent): StepResults {
        const { zeroFuelWeight, cruiseAltitude, managedCruiseSpeedMach } = this.computationParametersObserver.get();

        return Predictions.levelFlightStep(
            cruiseAltitude,
            distance,
            speed,
            managedCruiseSpeedMach,
            zeroFuelWeight,
            remainingFuelOnBoard,
            headwind.value,
            this.atmosphericConditions.isaDeviation,
        );
    }

    private levelAccelerationStep(remainingFuelOnBoard: number, speed: Knots, finalSpeed: Knots, headwind: WindComponent): StepResults {
        const { zeroFuelWeight, cruiseAltitude, managedCruiseSpeedMach, tropoPause } = this.computationParametersObserver.get();

        return Predictions.speedChangeStep(
            0,
            cruiseAltitude,
            speed,
            finalSpeed,
            managedCruiseSpeedMach,
            managedCruiseSpeedMach,
            this.getClimbThrustN1Limit(this.atmosphericConditions, cruiseAltitude, speed),
            zeroFuelWeight,
            remainingFuelOnBoard,
            headwind.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
        );
    }

    getFinalCruiseAltitude(): Feet {
        const { cruiseAltitude } = this.computationParametersObserver.get();

        if (this.stepCoordinator.steps.length === 0) {
            return cruiseAltitude;
        }

        return this.stepCoordinator.steps[this.stepCoordinator.steps.length - 1].toAltitude;
    }

    private getClimbThrustN1Limit(atmosphericConditions: AtmosphericConditions, altitude: Feet, speed: Knots) {
        // This Mach number is the Mach number for the predicted climb speed, not the Mach to use after crossover altitude.
        const climbSpeedMach = atmosphericConditions.computeMachFromCas(altitude, speed);
        const estimatedTat = atmosphericConditions.totalAirTemperatureFromMach(altitude, climbSpeedMach);

        return EngineModel.tableInterpolation(EngineModel.maxClimbThrustTableLeap, estimatedTat, altitude);
    }
}
