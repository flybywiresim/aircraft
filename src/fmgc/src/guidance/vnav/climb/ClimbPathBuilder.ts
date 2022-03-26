import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { ArmedVerticalMode, isArmed, VerticalMode } from '@shared/autopilot';
import { ClimbStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { Predictions, StepResults } from '../Predictions';
import { VerticalCheckpoint, VerticalCheckpointReason } from '../profile/NavGeometryProfile';
import { BaseGeometryProfile } from '../profile/BaseGeometryProfile';
import { AtmosphericConditions } from '../AtmosphericConditions';

export class ClimbPathBuilder {
    constructor(private computationParametersObserver: VerticalProfileComputationParametersObserver, private atmosphericConditions: AtmosphericConditions) { }

    /**
     * Compute climb profile assuming climb thrust until top of climb. This does not care if we're below acceleration/thrust reduction altitude.
     * @param profile
     * @returns
     */
    computeClimbPath(
        profile: BaseGeometryProfile, climbStrategy: ClimbStrategy, speedProfile: SpeedProfile, windProfile: HeadwindProfile, targetAltitude: Feet,
    ) {
        const { fcuVerticalMode, fcuArmedVerticalMode } = this.computationParametersObserver.get();

        this.addClimbSteps(profile, climbStrategy, speedProfile, windProfile, targetAltitude, VerticalCheckpointReason.TopOfClimb);

        if (this.shouldAddFcuAltAsCheckpoint(fcuVerticalMode, fcuArmedVerticalMode)) {
            this.addFcuAltitudeAsCheckpoint(profile);
        }

        if (speedProfile.shouldTakeSpeedLimitIntoAccount()) {
            this.addSpeedLimitAsCheckpoint(profile);
        }
    }

    private addClimbSteps(
        profile: BaseGeometryProfile,
        climbStrategy: ClimbStrategy,
        speedProfile: SpeedProfile,
        windProfile: HeadwindProfile,
        finalAltitude: Feet,
        finalAltitudeReason: VerticalCheckpointReason = VerticalCheckpointReason.AtmosphericConditions,
    ) {
        for (const constraint of profile.maxAltitudeConstraints) {
            const { maxAltitude: constraintAltitude, distanceFromStart: constraintDistanceFromStart } = constraint;

            if (constraintAltitude >= finalAltitude) {
                break;
            }

            // Code is WIP. Idea is to make ClimbPathBuilder more aware of speed constraints,
            // so we can properly integrate acceleration segments

            if (constraintAltitude > profile.lastCheckpoint.altitude) {
                // Continue climb
                if (profile.lastCheckpoint.reason === VerticalCheckpointReason.AltitudeConstraint) {
                    profile.lastCheckpoint.reason = VerticalCheckpointReason.ContinueClimb;
                }

                // Mark where we are
                let indexToResetTo = profile.checkpoints.length;
                // Try going to the next altitude
                this.buildIteratedClimbSegment(profile, climbStrategy, speedProfile, windProfile, profile.lastCheckpoint.altitude, constraintAltitude);

                let currentSpeedConstraint = speedProfile.getMaxClimbSpeedConstraint(profile.lastCheckpoint.distanceFromStart);
                for (let i = 0; i++ < 10 && currentSpeedConstraint; currentSpeedConstraint = speedProfile.getMaxClimbSpeedConstraint(profile.lastCheckpoint.distanceFromStart)) {
                    // This means we did not pass a constraint during the climb
                    if (currentSpeedConstraint.distanceFromStart > profile.lastCheckpoint.distanceFromStart) {
                        break;
                    }

                    // Reset
                    profile.checkpoints.splice(indexToResetTo);

                    const averageDistanceFromStart = (currentSpeedConstraint.distanceFromStart + profile.lastCheckpoint.distanceFromStart) / 2;
                    const headwind = windProfile.getHeadwindComponent(averageDistanceFromStart, profile.lastCheckpoint.altitude);

                    // Use distance step instead
                    this.distanceStepFromLastCheckpoint(
                        profile,
                        climbStrategy,
                        currentSpeedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart,
                        headwind,
                        VerticalCheckpointReason.SpeedConstraint,
                    );

                    // Repeat
                    indexToResetTo = profile.checkpoints.length;
                    this.buildIteratedClimbSegment(profile, climbStrategy, speedProfile, windProfile, profile.lastCheckpoint.altitude, constraintAltitude);
                }

                // We reach the target altitude before the constraint, so we insert a level segment.
                if (profile.lastCheckpoint.distanceFromStart < constraintDistanceFromStart) {
                    profile.lastCheckpoint.reason = VerticalCheckpointReason.LevelOffForClimbConstraint;

                    this.addLevelSegmentSteps(profile, speedProfile, constraintDistanceFromStart);
                }
            } else if (Math.abs(profile.lastCheckpoint.altitude - constraintAltitude) < 250) {
                // Continue in level flight to the next constraint
                this.addLevelSegmentSteps(profile, speedProfile, constraintDistanceFromStart);
            }
        }

        if (profile.lastCheckpoint.reason === VerticalCheckpointReason.AltitudeConstraint) {
            profile.lastCheckpoint.reason = VerticalCheckpointReason.ContinueClimb;
        }

        const { managedClimbSpeedMach } = this.computationParametersObserver.get();

        // We get here if there are still waypoints with speed constrainst after all the altitude constraints
        for (const speedConstraint of profile.maxClimbSpeedConstraints) {
            const { distanceFromStart, altitude, speed, remainingFuelOnBoard } = profile.lastCheckpoint;

            if (distanceFromStart > speedConstraint.distanceFromStart) {
                continue;
            }

            const speedTarget = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Climb);
            if ((speedTarget - speed) > 1) {
                const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);

                const accelerationStep = climbStrategy.predictToSpeed(altitude, speedTarget, speed, managedClimbSpeedMach, remainingFuelOnBoard, headwind);

                // If we shoot through the final altitude trying to accelerate, pretend we didn't accelerate all the way
                if (accelerationStep.finalAltitude > finalAltitude) {
                    const scaling = (accelerationStep.finalAltitude - accelerationStep.initialAltitude) !== 0
                        ? (finalAltitude - accelerationStep.initialAltitude) / (accelerationStep.finalAltitude - accelerationStep.initialAltitude)
                        : 0;

                    this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, accelerationStep, scaling);
                }

                this.addCheckpointFromStep(profile, accelerationStep, VerticalCheckpointReason.AtmosphericConditions);
            }

            if (speedConstraint.distanceFromStart > profile.lastCheckpoint.distanceFromStart) {
                const averageDistanceFromStart = (speedConstraint.distanceFromStart + profile.lastCheckpoint.distanceFromStart) / 2;
                const headwind = windProfile.getHeadwindComponent(averageDistanceFromStart, profile.lastCheckpoint.altitude);

                this.distanceStepFromLastCheckpoint(
                    profile, climbStrategy, speedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart, headwind, VerticalCheckpointReason.AtmosphericConditions,
                );

                // This occurs if we somehow overshot the target altitude
                if (profile.lastCheckpoint.altitude > finalAltitude) {
                    profile.checkpoints.splice(profile.checkpoints.length - 1);

                    this.buildIteratedClimbSegment(profile, climbStrategy, speedProfile, windProfile, profile.lastCheckpoint.altitude, finalAltitude);
                }
            }
        }

        // We get here if we have passed all speed and altitude constraints, but are not at our final altitude yet.
        this.buildIteratedClimbSegment(profile, climbStrategy, speedProfile, windProfile, profile.lastCheckpoint.altitude, finalAltitude);
        profile.lastCheckpoint.reason = finalAltitudeReason;
    }

    private buildIteratedClimbSegment(
        profile: BaseGeometryProfile,
        climbStrategy: ClimbStrategy,
        speedProfile: SpeedProfile,
        windProfile: HeadwindProfile,
        startingAltitude: Feet,
        targetAltitude: Feet,
    ): void {
        const { managedClimbSpeedMach } = this.computationParametersObserver.get();

        for (let altitude = startingAltitude; altitude < targetAltitude;) {
            const { speed, remainingFuelOnBoard, distanceFromStart } = profile.lastCheckpoint;

            const speedTarget = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Climb);

            const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);

            const step = speedTarget - speed < 1
                ? climbStrategy.predictToAltitude(altitude, Math.min(altitude + 1500, targetAltitude), speedTarget, managedClimbSpeedMach, remainingFuelOnBoard, headwind)
                : climbStrategy.predictToSpeed(altitude, speedTarget, speed, managedClimbSpeedMach, remainingFuelOnBoard, headwind);

            if (step.finalAltitude - targetAltitude > 10) {
                const scaling = (step.finalAltitude - step.initialAltitude) !== 0
                    ? (targetAltitude - step.initialAltitude) / (step.finalAltitude - step.initialAltitude)
                    : 0;
                this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, step, scaling);
            }

            this.addCheckpointFromStep(profile, step, VerticalCheckpointReason.AtmosphericConditions);

            altitude = step.finalAltitude;
        }
    }

    private distanceStepFromLastCheckpoint(profile: BaseGeometryProfile, climbStrategy: ClimbStrategy, distance: NauticalMiles, headwind: WindComponent, reason: VerticalCheckpointReason) {
        const { managedClimbSpeedMach } = this.computationParametersObserver.get();
        const { altitude, speed: initialSpeed, remainingFuelOnBoard } = profile.lastCheckpoint;

        const step = climbStrategy.predictToDistance(altitude, distance, initialSpeed, managedClimbSpeedMach, remainingFuelOnBoard, headwind);

        this.addCheckpointFromStep(profile, step, reason);
    }

    private addLevelSegmentSteps(profile: BaseGeometryProfile, speedProfile: SpeedProfile, toDistanceFromStart: NauticalMiles): void {
        // The only reason we have to build this iteratively is because there could be speed constraints along the way
        const altitude = profile.lastCheckpoint.altitude;

        // Go over all constraints
        for (const speedConstraint of profile.maxClimbSpeedConstraints) {
            // Ignore constraint since we're already past it
            if (profile.lastCheckpoint.distanceFromStart >= speedConstraint.distanceFromStart || toDistanceFromStart <= speedConstraint.distanceFromStart) {
                continue;
            }

            const currentSpeed = profile.lastCheckpoint.speed;
            const speedTarget = speedProfile.getTarget(profile.lastCheckpoint.distanceFromStart, altitude, ManagedSpeedType.Climb);

            if (speedTarget > currentSpeed) {
                const step = this.computeLevelFlightAccelerationStep(altitude, currentSpeed, speedTarget, profile.lastCheckpoint.remainingFuelOnBoard);

                // We could not accelerate in time
                if (profile.lastCheckpoint.distanceFromStart + step.distanceTraveled > speedConstraint.distanceFromStart) {
                    const scaling = step.distanceTraveled / (speedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart);

                    this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, step, scaling);
                    this.addCheckpointFromStep(profile, step, VerticalCheckpointReason.AtmosphericConditions);

                    continue;
                } else {
                    // End of acceleration
                    this.addCheckpointFromStep(profile, step, VerticalCheckpointReason.AtmosphericConditions);
                }
            }

            // Compute step after accelerating to next constraint
            const levelStepToConstraint = this.computeLevelFlightSegmentPrediction(
                speedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart,
                altitude,
                profile.lastCheckpoint.speed,
                profile.lastCheckpoint.remainingFuelOnBoard,
            );

            this.addCheckpointFromStep(profile, levelStepToConstraint, VerticalCheckpointReason.AltitudeConstraint);
        }

        // TODO: This exact piece of code appears a couple of lines above, extract to function!
        const currentSpeed = profile.lastCheckpoint.speed;
        const speedTarget = speedProfile.getTarget(profile.lastCheckpoint.distanceFromStart, altitude, ManagedSpeedType.Climb);

        if (speedTarget > currentSpeed) {
            const accelerationStep = this.computeLevelFlightAccelerationStep(altitude, currentSpeed, speedTarget, profile.lastCheckpoint.remainingFuelOnBoard);

            // We could not accelerate in time
            if (profile.lastCheckpoint.distanceFromStart + accelerationStep.distanceTraveled > toDistanceFromStart) {
                const scaling = accelerationStep.distanceTraveled / (toDistanceFromStart - profile.lastCheckpoint.distanceFromStart);
                this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, accelerationStep, scaling);
                this.addCheckpointFromStep(profile, accelerationStep, VerticalCheckpointReason.AtmosphericConditions);

                return;
            }

            // End of acceleration
            this.addCheckpointFromStep(profile, accelerationStep, VerticalCheckpointReason.AtmosphericConditions);
        }

        const levelStepToConstraint = this.computeLevelFlightSegmentPrediction(
            toDistanceFromStart - profile.lastCheckpoint.distanceFromStart,
            altitude,
            profile.lastCheckpoint.speed,
            profile.lastCheckpoint.remainingFuelOnBoard,
        );

        this.addCheckpointFromStep(profile, levelStepToConstraint, VerticalCheckpointReason.AltitudeConstraint);
    }

    private computeLevelFlightSegmentPrediction(stepSize: Feet, altitude: Feet, initialSpeed: Knots, fuelWeight: number): StepResults {
        const { zeroFuelWeight, managedClimbSpeedMach } = this.computationParametersObserver.get();

        return Predictions.levelFlightStep(
            altitude,
            stepSize,
            initialSpeed,
            managedClimbSpeedMach,
            zeroFuelWeight,
            fuelWeight,
            0,
            this.atmosphericConditions.isaDeviation,
        );
    }

    private computeLevelFlightAccelerationStep(altitude: Feet, initialSpeed: Knots, speedTarget: Knots, fuelWeight: number): StepResults {
        const { zeroFuelWeight, managedClimbSpeedMach, tropoPause } = this.computationParametersObserver.get();

        return Predictions.speedChangeStep(
            0,
            altitude,
            initialSpeed,
            speedTarget,
            managedClimbSpeedMach,
            managedClimbSpeedMach,
            getClimbThrustN1Limit(this.atmosphericConditions, altitude, (initialSpeed + speedTarget) / 2, managedClimbSpeedMach), // TOD0
            zeroFuelWeight,
            fuelWeight,
            0,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
        );
    }

    addSpeedLimitAsCheckpoint(profile: BaseGeometryProfile) {
        const { climbSpeedLimit: { underAltitude }, presentPosition: { alt }, cruiseAltitude } = this.computationParametersObserver.get();

        if (underAltitude <= alt || underAltitude > cruiseAltitude) {
            return;
        }

        const distance = profile.interpolateDistanceAtAltitude(underAltitude);

        profile.addInterpolatedCheckpoint(distance, { reason: VerticalCheckpointReason.CrossingClimbSpeedLimit });
    }

    private addFcuAltitudeAsCheckpoint(profile: BaseGeometryProfile) {
        const { fcuAltitude, presentPosition, cruiseAltitude } = this.computationParametersObserver.get();

        if (fcuAltitude <= presentPosition.alt || fcuAltitude > cruiseAltitude) {
            if (VnavConfig.DEBUG_PROFILE) {
                console.warn(`[FMS/VNAV] FCU altitude was above cruise altitude (${fcuAltitude} > ${cruiseAltitude})`);
            }

            return;
        }

        const distance = profile.interpolateDistanceAtAltitude(fcuAltitude);

        profile.addInterpolatedCheckpoint(distance, { reason: VerticalCheckpointReason.CrossingFcuAltitudeClimb });
    }

    private shouldAddFcuAltAsCheckpoint(verticalMode: VerticalMode, armedVerticalMode: ArmedVerticalMode) {
        const verticalModesToShowLevelOffArrowFor = [
            VerticalMode.OP_CLB,
            VerticalMode.VS,
            VerticalMode.FPA,
            VerticalMode.CLB,
            VerticalMode.SRS,
            VerticalMode.SRS_GA,
        ];

        return isArmed(armedVerticalMode, ArmedVerticalMode.CLB) || verticalModesToShowLevelOffArrowFor.includes(verticalMode);
    }

    private addCheckpointFromStep(profile: BaseGeometryProfile, step: StepResults, reason: VerticalCheckpointReason) {
        profile.addCheckpointFromLast(({ distanceFromStart, secondsFromPresent, remainingFuelOnBoard }) => ({
            reason,
            distanceFromStart: distanceFromStart + step.distanceTraveled,
            altitude: step.finalAltitude,
            secondsFromPresent: secondsFromPresent + step.timeElapsed,
            speed: step.speed,
            remainingFuelOnBoard: remainingFuelOnBoard - step.fuelBurned,
            mach: this.computationParametersObserver.get().managedClimbSpeedMach,
        }));
    }

    private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
        step.distanceTraveled *= scaling;
        step.fuelBurned *= scaling;
        step.timeElapsed *= scaling;
        step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.initialAltitude;
        step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
    }
}

// TODO: Deduplicate this from here and ClimbStrategy.ts
function getClimbThrustN1Limit(atmosphericConditions: AtmosphericConditions, altitude: Feet, speed: Knots, maxMach: Mach) {
    const climbSpeedMach = Math.min(maxMach, atmosphericConditions.computeMachFromCas(altitude, speed));
    const estimatedTat = atmosphericConditions.totalAirTemperatureFromMach(altitude, climbSpeedMach);

    return EngineModel.tableInterpolation(EngineModel.maxClimbThrustTableLeap, estimatedTat, altitude);
}
