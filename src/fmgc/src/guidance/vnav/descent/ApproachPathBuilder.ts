//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Predictions, StepResults } from '@fmgc/guidance/vnav/Predictions';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { DescentAltitudeConstraint, NavGeometryProfile, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { AltitudeConstraintType } from '@fmgc/guidance/lnav/legs';
import { MathUtils } from '@shared/MathUtils';
import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';

class FlapConfigurationProfile {
    static getBySpeed(speed: Knots): FlapConf {
        if (speed > 230) {
            return FlapConf.CLEAN;
        } if (speed > 200) {
            return FlapConf.CONF_1;
        } if (speed > 185) {
            return FlapConf.CONF_2;
        } if (speed > 177) {
            return FlapConf.CONF_3;
        }

        return FlapConf.CONF_FULL;
    }

    static findNextExtensionSpeed(speed: Knots) {
        if (speed < 177) {
            return 177;
        } if (speed < 185) {
            return 185;
        } if (speed < 200) {
            return 200;
        } if (speed < 230) {
            return 230;
        }

        return Infinity;
    }
}

export interface AircraftConfiguration {
    flapConfig: FlapConf
    speedbrakesExtended: boolean
    gearExtended: boolean
}

export class AircraftConfigurationProfile {
    static getBySpeed(speed: Knots): AircraftConfiguration {
        return {
            flapConfig: FlapConfigurationProfile.getBySpeed(speed),
            speedbrakesExtended: false,
            gearExtended: speed < 200, // Below 200 kts, you will have the flaps extended, so we assume the gear to be down
        };
    }
}

export class ApproachPathBuilder {
    private idleStrategy: DescentStrategy

    constructor(private observer: VerticalProfileComputationParametersObserver, private atmosphericConditions: AtmosphericConditions) {
        this.idleStrategy = new IdleDescentStrategy(this.observer, this.atmosphericConditions);
    }

    computeApproachPath(
        profile: NavGeometryProfile, speedProfile: SpeedProfile, estimatedFuelOnBoardAtDestination: number, estimatedSecondsFromPresentAtDestination: number,
    ): TemporaryCheckpointSequence {
        const { approachSpeed, managedDescentSpeedMach, zeroFuelWeight, tropoPause, destinationAirfieldElevation } = this.observer.get();

        const approachConstraints = profile.descentAltitudeConstraints.slice().reverse();

        if (!this.canCompute(profile)) {
            throw new Error('[FMS/VNAV] Cannot compute approach path, make sure to check `canCompute` before calling `computeApproachPath`!');
        }

        // Find starting point for computation
        // Use either last constraint with its alt or just place a point wherever the end of the track is
        const finalAltitude = this.canUseLastAltConstraintAsStartingPoint(profile) ? approachConstraints[0].constraint.altitude1 : destinationAirfieldElevation;

        const sequence = new TemporaryCheckpointSequence({
            reason: VerticalCheckpointReason.Landing,
            speed: approachSpeed,
            distanceFromStart: profile.getDistanceFromStart(0),
            altitude: this.canUseLastAltConstraintAsStartingPoint(profile) ? approachConstraints[0].constraint.altitude1 : destinationAirfieldElevation,
            remainingFuelOnBoard: estimatedFuelOnBoardAtDestination,
            secondsFromPresent: estimatedSecondsFromPresentAtDestination,
            mach: managedDescentSpeedMach,
        });

        // 6076.12
        const distanceForThreeDegreeApproach = 1000 / Math.tan(3 * MathUtils.DEGREES_TO_RADIANS) / 6076.12;

        // Build final segment
        const finalApproachStep = Predictions.geometricStep(
            finalAltitude + 1000,
            finalAltitude,
            distanceForThreeDegreeApproach,
            approachSpeed,
            managedDescentSpeedMach,
            zeroFuelWeight,
            estimatedFuelOnBoardAtDestination,
            this.atmosphericConditions.isaDeviation,
            0,
            tropoPause,
            true,
            FlapConf.CONF_FULL,
        );

        sequence.addCheckpointFromStepBackwards(finalApproachStep, VerticalCheckpointReason.AtmosphericConditions);

        // Assume idle thrust from there
        for (const altitudeConstraint of approachConstraints) {
            this.handleAltitudeConstraint(sequence, speedProfile, altitudeConstraint);

            // If you're at or above your descent speed (taking speed limit into account, place the decel point)
            if (sequence.lastCheckpoint.speed - speedProfile.getTargetWithoutConstraints(sequence.lastCheckpoint.altitude, ManagedSpeedType.Descent) > -1) {
                break;
            }
        }

        const speedTarget = speedProfile.getTarget(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);

        if (speedTarget - sequence.lastCheckpoint.speed > 0.1) {
            const decelerationToDescentSpeed = this.buildDecelerationPath(sequence, this.idleStrategy, speedProfile, 0);
            sequence.push(...decelerationToDescentSpeed.get());
        }

        // There are cases where the decel point is not added when we handle the constraints above, in this case, we just add it here.
        if (sequence.lastCheckpoint.reason !== VerticalCheckpointReason.Decel) {
            sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.Decel });
        }

        return sequence;
    }

    private handleAltitudeConstraint(sequence: TemporaryCheckpointSequence, speedProfile: SpeedProfile, constraint: DescentAltitudeConstraint) {
        // We compose this segment of two segments:
        //  A descent segment
        //  A level deceleration segment
        // This is how they appear along the track

        // Going in reverse:
        // We try to choose make the deceleration segment just as long that we manage to make the descent part
        const { managedDescentSpeedMach } = this.observer.get();
        const { distanceFromStart, altitude } = sequence.lastCheckpoint;

        if (distanceFromStart < constraint.distanceFromStart
            || constraint.constraint.type === AltitudeConstraintType.atOrBelow
            || altitude - constraint.constraint.altitude1 > -50 // If we are already above the constraint
        ) {
            return;
        }

        const minimumAltitude = constraint.constraint.type === AltitudeConstraintType.range
            ? constraint.constraint.altitude2
            : constraint.constraint.altitude1;

        const desiredDistanceToCover = distanceFromStart - constraint.distanceFromStart;

        let i = 0;
        let decelerationSegmentDistance = 0;
        let decelerationSegmentDistanceError = Infinity;

        let decelerationSequence: TemporaryCheckpointSequence = null;
        let descentSegment = null;

        while (i++ < 4 && Math.abs(decelerationSegmentDistanceError) > 0.05) {
            decelerationSequence = this.buildDecelerationPath(
                sequence,
                this.idleStrategy,
                speedProfile,
                distanceFromStart - decelerationSegmentDistance,
            );

            descentSegment = this.idleStrategy.predictToAltitude(
                minimumAltitude,
                altitude,
                decelerationSequence.lastCheckpoint.speed,
                managedDescentSpeedMach,
                decelerationSequence.lastCheckpoint.remainingFuelOnBoard,
                WindComponent.zero(),
                AircraftConfigurationProfile.getBySpeed(decelerationSequence.lastCheckpoint.speed),
            );

            const distanceTraveled = descentSegment.distanceTraveled + (distanceFromStart - decelerationSequence.lastCheckpoint.distanceFromStart);

            decelerationSegmentDistanceError = distanceTraveled - desiredDistanceToCover;
            decelerationSegmentDistance = Math.max(0, decelerationSegmentDistance - decelerationSegmentDistanceError);
        }

        sequence.push(...decelerationSequence.get());

        // Don't bother considering the climb step in the profile if we have already reached the target speed in the deceleration segment
        if (speedProfile.getTargetWithoutConstraints(decelerationSequence.lastCheckpoint.altitude, ManagedSpeedType.Descent) - decelerationSequence.lastCheckpoint.speed > 1) {
            sequence.addCheckpointFromStepBackwards(descentSegment, VerticalCheckpointReason.AltitudeConstraint);
        }
    }

    canCompute(profile: NavGeometryProfile): boolean {
        return this.canUseLastAltConstraintAsStartingPoint(profile)
            || Number.isFinite(this.observer.get().destinationAirfieldElevation);
    }

    private canUseLastAltConstraintAsStartingPoint(profile: NavGeometryProfile): boolean {
        if (profile.descentAltitudeConstraints.length < 1) {
            return false;
        }

        const lastAltConstraint = profile.descentAltitudeConstraints[profile.descentAltitudeConstraints.length - 1];

        return lastAltConstraint.constraint.type === AltitudeConstraintType.at && Math.abs(lastAltConstraint.distanceFromStart - profile.totalFlightPlanDistance) < 1;
    }

    private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
        step.distanceTraveled *= scaling;
        step.fuelBurned *= scaling;
        step.timeElapsed *= scaling;
        step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.initialAltitude;
        step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
    }

    /**
     * This builds a level deceleration path, bringing out flaps as needed, and obeying speed constraints
     * @param sequence
     * @param strategy
     * @param speedProfile
     * @param targetDistanceFromStart
     * @returns
     */
    private buildDecelerationPath(
        sequence: TemporaryCheckpointSequence, strategy: DescentStrategy, speedProfile: SpeedProfile, targetDistanceFromStart: NauticalMiles,
    ): TemporaryCheckpointSequence {
        const decelerationSequence = new TemporaryCheckpointSequence(sequence.lastCheckpoint);

        const { managedDescentSpeedMach } = this.observer.get();

        let i = 0;
        while (i++ < 10
            && decelerationSequence.lastCheckpoint.reason !== VerticalCheckpointReason.Decel
            && Math.abs(decelerationSequence.lastCheckpoint.distanceFromStart - targetDistanceFromStart) > 0.1
        ) {
            const { distanceFromStart, altitude, speed, remainingFuelOnBoard } = decelerationSequence.lastCheckpoint;

            const speedConstraint = speedProfile.getMaxDescentSpeedConstraint(distanceFromStart - 1e-4);
            const flapTargetSpeed = FlapConfigurationProfile.findNextExtensionSpeed(speed);

            // This is the managed descent speed, or the speed limit speed.
            const limitingSpeed = speedProfile.getTargetWithoutConstraints(decelerationSequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);

            // If the constraint is limiting, decelerate to the constraint, then fly constant speed until it is resolved
            // If the flapTarget is limiting, decelerate to the flap target
            // If the limitingSpeed is limiting, decelerate to it and return

            // Constraint is constraining
            if (speedConstraint !== null && speedConstraint.maxSpeed < flapTargetSpeed && speedConstraint.maxSpeed < limitingSpeed) {
                const remainingDistance = distanceFromStart - Math.max(speedConstraint.distanceFromStart, targetDistanceFromStart);

                // Decelerate to constraint
                const decelerationStep = this.levelDecelerationSegment(
                    altitude,
                    speed,
                    speedConstraint.maxSpeed,
                    managedDescentSpeedMach,
                    remainingFuelOnBoard,
                    WindComponent.zero(),
                    AircraftConfigurationProfile.getBySpeed(speed),
                );

                if (decelerationStep.distanceTraveled > 1e-4) {
                    // We tried to declerate, but it took us beyond targetDistanceFromStart, so we scale down the step
                    const scaling = Math.min(1, remainingDistance / decelerationStep.distanceTraveled);
                    this.scaleStepBasedOnLastCheckpoint(decelerationSequence.lastCheckpoint, decelerationStep, scaling);
                    decelerationSequence.addCheckpointFromStepBackwards(decelerationStep, VerticalCheckpointReason.AtmosphericConditions);
                }

                const remainingDistanceToConstraint = distanceFromStart - decelerationStep.distanceTraveled - Math.max(speedConstraint.distanceFromStart, targetDistanceFromStart);

                if (remainingDistanceToConstraint > 0.1) {
                    // If we decelerated, but aren't at the constraint yet, fly level, at constant speed to the constraint

                    const constantStep = this.levelFlightSegment(
                        altitude,
                        remainingDistanceToConstraint,
                        speedConstraint.maxSpeed,
                        managedDescentSpeedMach,
                        remainingFuelOnBoard - decelerationStep.fuelBurned,
                        WindComponent.zero(),
                        AircraftConfigurationProfile.getBySpeed(speedConstraint.maxSpeed),
                    );

                    decelerationSequence.addCheckpointFromStepBackwards(constantStep, VerticalCheckpointReason.SpeedConstraint);
                } else {
                    decelerationSequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.SpeedConstraint });
                }
            } else {
                const remainingDistance = distanceFromStart - targetDistanceFromStart;
                const speedTargetWithConstraints = speedProfile.getTarget(distanceFromStart, decelerationSequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);

                const targetSpeed = Math.min(flapTargetSpeed, speedTargetWithConstraints);
                // flapTarget is constraining
                const decelerationStep = this.levelDecelerationSegment(
                    altitude,
                    speed,
                    targetSpeed,
                    managedDescentSpeedMach,
                    remainingFuelOnBoard,
                    WindComponent.zero(),
                    AircraftConfigurationProfile.getBySpeed(speed),
                );

                if (decelerationStep.distanceTraveled > remainingDistance) {
                    const scaling = Math.min(1, remainingDistance / decelerationStep.distanceTraveled);
                    this.scaleStepBasedOnLastCheckpoint(decelerationSequence.lastCheckpoint, decelerationStep, scaling);
                    decelerationSequence.addCheckpointFromStepBackwards(decelerationStep, VerticalCheckpointReason.AtmosphericConditions);

                    return decelerationSequence;
                }

                decelerationSequence.addCheckpointFromStepBackwards(decelerationStep, this.getFlapCheckpointReasonByFlapConf(FlapConfigurationProfile.getBySpeed(targetSpeed)));
            }
        }

        return decelerationSequence;
    }

    // TODO: This should not be here.
    // It assumes idle thrust, which is correct, but I am using a dynamic DescentStrategy everywhere in this class except here.
    private levelDecelerationSegment(
        finalAltitude: number, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration,
    ): StepResults {
        const { zeroFuelWeight, tropoPause } = this.observer.get();
        const actualMach = this.atmosphericConditions.computeMachFromCas(finalAltitude, (finalSpeed + speed) / 2);

        const step = Predictions.speedChangeStep(
            0,
            finalAltitude,
            speed,
            finalSpeed,
            mach,
            mach,
            EngineModel.getIdleN1(finalAltitude, actualMach),
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            config.gearExtended,
            config.flapConfig,
        );

        // Change this to the initial speed as it comes back as the final speed, but we are trying to compute the profile backwards
        step.speed = speed;

        return step;
    }

    private levelFlightSegment(
        altitude: Feet, distance: NauticalMiles, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration,
    ): StepResults {
        const { zeroFuelWeight } = this.observer.get();

        return Predictions.levelFlightStep(
            altitude,
            distance,
            speed,
            mach,
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
        );
    }

    private getFlapCheckpointReasonByFlapConf(flapConfig: FlapConf) {
        switch (flapConfig) {
        case FlapConf.CONF_FULL:
            return VerticalCheckpointReason.FlapsFull;
        case FlapConf.CONF_3:
            return VerticalCheckpointReason.Flaps3;
        case FlapConf.CONF_2:
            return VerticalCheckpointReason.Flaps2;
        case FlapConf.CONF_1:
            return VerticalCheckpointReason.Flaps1;
        case FlapConf.CLEAN:
            return VerticalCheckpointReason.Decel;
        default:
            throw new Error(`[FMS/VNAV] Unknown flap config: ${flapConfig}`);
        }
    }
}
