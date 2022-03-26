import { VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { GeometricPathBuilder } from '@fmgc/guidance/vnav/descent/GeometricPathBuilder';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';

export class DescentPathBuilder {
    private geometricPathBuilder: GeometricPathBuilder;

    private idleDescentStrategy: DescentStrategy;

    constructor(
        private computationParametersObserver: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
    ) {
        this.geometricPathBuilder = new GeometricPathBuilder(
            computationParametersObserver,
            atmosphericConditions,
        );

        this.idleDescentStrategy = new IdleDescentStrategy(computationParametersObserver, atmosphericConditions);
    }

    update() {
        this.atmosphericConditions.update();
    }

    computeManagedDescentPath(
        sequence: TemporaryCheckpointSequence,
        profile: BaseGeometryProfile,
        speedProfile: SpeedProfile,
        windProfile: HeadwindProfile,
        cruiseAltitude: Feet,
    ) {
        this.geometricPathBuilder.buildGeometricPath(sequence, profile, speedProfile, windProfile, cruiseAltitude);

        if (sequence.lastCheckpoint.reason !== VerticalCheckpointReason.GeometricPathStart) {
            console.error('[FMS/VNAV] Geometric path did not end in GeometricPathStart. Discarding descent profile.');
            return;
        }

        this.buildIdlePath(sequence, profile, speedProfile, windProfile, cruiseAltitude);
    }

    private buildIdlePath(sequence: TemporaryCheckpointSequence, profile: BaseGeometryProfile, speedProfile: SpeedProfile, windProfile: HeadwindProfile, topOfDescentAltitude: Feet): void {
        // Assume the last checkpoint is the start of the geometric path
        sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.IdlePathEnd });

        const { managedDescentSpeedMach } = this.computationParametersObserver.get();

        const speedConstraints = profile.descentSpeedConstraints.slice().sort((a, b) => b.distanceFromStart - a.distanceFromStart);
        let i = 0;
        while (i++ < 50 && speedConstraints.length > 0) {
            const constraint = speedConstraints[0];
            const { distanceFromStart, remainingFuelOnBoard, speed, altitude } = sequence.lastCheckpoint;

            if (constraint.distanceFromStart >= distanceFromStart) {
                speedConstraints.splice(0, 1);
                continue;
            }

            const speedTargetBeforeCurrentPosition = speedProfile.getTarget(constraint.distanceFromStart, altitude, ManagedSpeedType.Descent);
            // It is safe to use the current altitude here. This way, the speed limit will certainly be obeyed
            if (speedTargetBeforeCurrentPosition - speed > 1) {
                const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);

                const decelerationStep = this.idleDescentStrategy.predictToSpeedBackwards(
                    altitude,
                    speed,
                    speedTargetBeforeCurrentPosition,
                    managedDescentSpeedMach,
                    remainingFuelOnBoard,
                    headwind,
                );

                sequence.addCheckpointFromStepBackwards(decelerationStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);

                continue;
            }

            const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
            const descentStep = this.idleDescentStrategy.predictToDistanceBackwards(
                altitude,
                sequence.lastCheckpoint.distanceFromStart - constraint.distanceFromStart,
                speed,
                managedDescentSpeedMach,
                remainingFuelOnBoard,
                headwind,
            );

            sequence.addCheckpointFromStepBackwards(descentStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);
        }

        let j = 0;
        for (let altitude = sequence.lastCheckpoint.altitude; altitude < topOfDescentAltitude && j++ < 50; altitude = Math.min(altitude + 1500, topOfDescentAltitude)) {
            const { distanceFromStart, remainingFuelOnBoard, speed } = sequence.lastCheckpoint;

            const startingAltitudeForSegment = Math.min(altitude + 1500, topOfDescentAltitude);
            // Get target slightly before to figure out if we want to accelerate
            const speedTarget = speedProfile.getTarget(distanceFromStart - 1e-4, altitude, ManagedSpeedType.Descent);

            if ((speedTarget - speed) > 1) {
                const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
                const decelerationStep = this.idleDescentStrategy.predictToSpeedBackwards(altitude, speed, speedTarget, managedDescentSpeedMach, remainingFuelOnBoard, headwind);

                // If we shoot through the final altitude trying to accelerate, pretend we didn't accelerate all the way
                if (decelerationStep.initialAltitude > topOfDescentAltitude) {
                    const scaling = (decelerationStep.initialAltitude - decelerationStep.finalAltitude) === 0
                        ? (topOfDescentAltitude - decelerationStep.finalAltitude) / (decelerationStep.initialAltitude - decelerationStep.finalAltitude)
                        : 0;

                    this.scaleStep(decelerationStep, scaling);
                }

                sequence.addCheckpointFromStepBackwards(decelerationStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);

                // Stupid hack
                altitude = sequence.lastCheckpoint.altitude - 1500;
                continue;
            }

            const headwind = windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude);

            const step = this.idleDescentStrategy.predictToAltitude(startingAltitudeForSegment, altitude, speed, managedDescentSpeedMach, remainingFuelOnBoard, headwind);
            sequence.addCheckpointFromStepBackwards(step, VerticalCheckpointReason.IdlePathAtmosphericConditions);
        }

        if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.IdlePathAtmosphericConditions) {
            sequence.lastCheckpoint.reason = VerticalCheckpointReason.TopOfDescent;
        } else {
            sequence.copyLastCheckpoint(({ reason: VerticalCheckpointReason.TopOfDescent }));
        }
    }

    // TODO: Rethink the existence of thsi
    private scaleStep(step: StepResults, scaling: number) {
        step.distanceTraveled *= scaling;
        step.fuelBurned *= scaling;
        step.timeElapsed *= scaling;
        step.finalAltitude *= scaling;
        step.speed *= scaling;
    }
}
