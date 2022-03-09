import { VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { GeometricPathBuilder } from '@fmgc/guidance/vnav/descent/GeometricPathBuilder';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { AircraftHeadingProfile } from '@fmgc/guidance/vnav/wind/AircraftHeadingProfile';
import { WindProfile } from '@fmgc/guidance/vnav/wind/WindProfile';

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
        profile: BaseGeometryProfile,
        speedProfile: SpeedProfile,
        windProfile: WindProfile,
        headingProfile: AircraftHeadingProfile,
        cruiseAltitude: Feet,
    ): VerticalCheckpoint {
        const decelCheckpoint = profile.checkpoints.find((checkpoint) => checkpoint.reason === VerticalCheckpointReason.Decel);

        if (!decelCheckpoint) {
            return undefined;
        }

        this.geometricPathBuilder.buildGeometricPath(profile, speedProfile, headingProfile, windProfile, cruiseAltitude);

        const geometricPathStart = profile.findVerticalCheckpoint(VerticalCheckpointReason.GeometricPathStart);

        if (geometricPathStart) {
            // The last checkpoint here is the start of the Geometric path
            this.buildIdlePath(profile, speedProfile, windProfile, headingProfile, cruiseAltitude);
            const tod = profile.lastCheckpoint;

            // TODO: This should not be here ideally
            profile.sortCheckpoints();

            return tod;
        }

        console.error('[FMS/VNAV](computeDescentPath) Cannot compute idle path without geometric path');

        return undefined;
    }

    private buildIdlePath(profile: BaseGeometryProfile, speedProfile: SpeedProfile, windProfile: WindProfile, headingProfile: AircraftHeadingProfile, topOfDescentAltitude: Feet): void {
        // Assume the last checkpoint is the start of the geometric path
        profile.addCheckpointFromLast((lastCheckpoint) => ({ ...lastCheckpoint, reason: VerticalCheckpointReason.IdlePathEnd }));

        const { managedDescentSpeedMach } = this.computationParametersObserver.get();

        const speedConstraints = profile.descentSpeedConstraints.slice().sort((a, b) => b.distanceFromStart - a.distanceFromStart);
        let i = 0;
        while (i++ < 50 && speedConstraints.length > 0) {
            const constraint = speedConstraints[0];
            const { distanceFromStart, remainingFuelOnBoard, speed, altitude } = profile.lastCheckpoint;

            if (constraint.distanceFromStart >= distanceFromStart) {
                speedConstraints.splice(0, 1);
                continue;
            }

            const speedTargetBeforeCurrentPosition = speedProfile.getTarget(constraint.distanceFromStart, altitude, ManagedSpeedType.Descent);
            // It is safe to use the current altitude here. This way, the speed limit will certainly be obeyed
            if (speedTargetBeforeCurrentPosition - speed > 1) {
                const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude, headingProfile.get(distanceFromStart));

                const decelerationStep = this.idleDescentStrategy.predictToSpeedBackwards(
                    altitude,
                    speed,
                    speedTargetBeforeCurrentPosition,
                    managedDescentSpeedMach,
                    remainingFuelOnBoard,
                    headwind,
                );

                this.addCheckpointFromStepBackwards(profile, decelerationStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);

                continue;
            }

            const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude, headingProfile.get(distanceFromStart));
            const descentStep = this.idleDescentStrategy.predictToDistanceBackwards(
                altitude,
                profile.lastCheckpoint.distanceFromStart - constraint.distanceFromStart,
                speed,
                managedDescentSpeedMach,
                remainingFuelOnBoard,
                headwind,
            );

            this.addCheckpointFromStepBackwards(profile, descentStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);
        }

        let j = 0;
        for (let altitude = profile.lastCheckpoint.altitude; altitude < topOfDescentAltitude && j++ < 50; altitude = Math.min(altitude + 1500, topOfDescentAltitude)) {
            const { distanceFromStart, remainingFuelOnBoard, speed } = profile.lastCheckpoint;

            const startingAltitudeForSegment = Math.min(altitude + 1500, topOfDescentAltitude);
            // Get target slightly before to figure out if we want to accelerate
            const speedTarget = speedProfile.getTarget(distanceFromStart - 1e-4, altitude, ManagedSpeedType.Descent);

            if ((speedTarget - speed) > 1) {
                const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude, headingProfile.get(distanceFromStart));
                const decelerationStep = this.idleDescentStrategy.predictToSpeedBackwards(altitude, speed, speedTarget, managedDescentSpeedMach, remainingFuelOnBoard, headwind);

                // If we shoot through the final altitude trying to accelerate, pretend we didn't accelerate all the way
                if (decelerationStep.initialAltitude > topOfDescentAltitude) {
                    const scaling = (decelerationStep.initialAltitude - decelerationStep.finalAltitude) === 0
                        ? (topOfDescentAltitude - decelerationStep.finalAltitude) / (decelerationStep.initialAltitude - decelerationStep.finalAltitude)
                        : 0;

                    this.scaleStep(decelerationStep, scaling);
                }

                this.addCheckpointFromStepBackwards(profile, decelerationStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);

                // Stupid hack
                altitude = profile.lastCheckpoint.altitude - 1500;
                continue;
            }

            const headwind = windProfile.getHeadwindComponent(
                profile.lastCheckpoint.distanceFromStart,
                profile.lastCheckpoint.altitude,
                headingProfile.get(profile.lastCheckpoint.distanceFromStart),
            );

            const step = this.idleDescentStrategy.predictToAltitude(startingAltitudeForSegment, altitude, speed, managedDescentSpeedMach, remainingFuelOnBoard, headwind);
            this.addCheckpointFromStepBackwards(profile, step, VerticalCheckpointReason.IdlePathAtmosphericConditions);
        }

        if (profile.lastCheckpoint.reason === VerticalCheckpointReason.IdlePathAtmosphericConditions) {
            profile.lastCheckpoint.reason = VerticalCheckpointReason.TopOfDescent;
        } else {
            profile.addCheckpointFromLast((lastCheckpoint) => ({ ...lastCheckpoint, reason: VerticalCheckpointReason.TopOfDescent }));
        }
    }

    private addCheckpointFromStepBackwards(profile: BaseGeometryProfile, step: StepResults, reason: VerticalCheckpointReason) {
        // Because we assume we are computing the profile backwards, there's a lot of minus signs where one might expect a plus
        profile.addCheckpointFromLast(({ distanceFromStart, secondsFromPresent, remainingFuelOnBoard }) => ({
            reason,
            distanceFromStart: distanceFromStart - step.distanceTraveled,
            altitude: step.initialAltitude,
            secondsFromPresent: secondsFromPresent - step.timeElapsed,
            speed: step.speed,
            remainingFuelOnBoard: remainingFuelOnBoard + step.fuelBurned,
        }));
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
