//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Predictions, StepResults } from '@fmgc/guidance/vnav/Predictions';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { DescentAltitudeConstraint, NavGeometryProfile, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParameters, VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { AltitudeConstraintType } from '@fmgc/guidance/lnav/legs';
import { MathUtils } from '@shared/MathUtils';
import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';

class FlapConfigurationProfile {
    static getBySpeed(speed: Knots, parameters: VerticalProfileComputationParameters): FlapConf {
        if (speed > parameters.cleanSpeed) {
            return FlapConf.CLEAN;
        } if (speed > parameters.slatRetractionSpeed) {
            return FlapConf.CONF_1; // Between S and O
        } if (speed > parameters.flapRetractionSpeed) {
            return FlapConf.CONF_2; // Between F and S
        } if (speed > (parameters.flapRetractionSpeed + parameters.approachSpeed) / 2) {
            return FlapConf.CONF_3;
        }

        return FlapConf.CONF_FULL;
    }

    static findNextExtensionSpeed(speed: Knots, parameters: VerticalProfileComputationParameters) {
        if (speed < (parameters.flapRetractionSpeed + parameters.approachSpeed) / 2) {
            return (parameters.flapRetractionSpeed + parameters.approachSpeed) / 2;
        } if (speed < parameters.flapRetractionSpeed) {
            return parameters.flapRetractionSpeed;
        } if (speed < parameters.slatRetractionSpeed) {
            return parameters.slatRetractionSpeed;
        } if (speed < parameters.cleanSpeed) {
            return parameters.cleanSpeed;
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
    static getBySpeed(speed: Knots, parameters: VerticalProfileComputationParameters): AircraftConfiguration {
        return {
            flapConfig: FlapConfigurationProfile.getBySpeed(speed, parameters),
            speedbrakesExtended: false,
            gearExtended: speed < parameters.flapRetractionSpeed,
        };
    }
}

export class ApproachPathBuilder {
    private idleStrategy: DescentStrategy

    constructor(private observer: VerticalProfileComputationParametersObserver, private atmosphericConditions: AtmosphericConditions) {
        this.idleStrategy = new IdleDescentStrategy(this.observer, this.atmosphericConditions);
    }

    computeApproachPath(
        profile: NavGeometryProfile, speedProfile: SpeedProfile, windProfile: HeadwindProfile, estimatedFuelOnBoardAtDestination: number, estimatedSecondsFromPresentAtDestination: number,
    ): TemporaryCheckpointSequence {
        const { approachSpeed, managedDescentSpeedMach, zeroFuelWeight, tropoPause, destinationAirfieldElevation, cleanSpeed } = this.observer.get();

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

        const distanceToOneThousandAgl = 1000 / Math.tan(profile.finalDescentAngle * MathUtils.DEGREES_TO_RADIANS) / 6076.12;

        // Build final segment
        const finalApproachStep = Predictions.geometricStep(
            finalAltitude + 1000,
            finalAltitude,
            distanceToOneThousandAgl,
            approachSpeed,
            managedDescentSpeedMach,
            zeroFuelWeight,
            estimatedFuelOnBoardAtDestination,
            this.atmosphericConditions.isaDeviation,
            windProfile.getHeadwindComponent(profile.getDistanceFromStart(0), finalAltitude).value,
            tropoPause,
            true,
            FlapConf.CONF_FULL,
            false,
        );

        sequence.addCheckpointFromStepBackwards(finalApproachStep, VerticalCheckpointReason.AtmosphericConditions);

        const fafStep = this.buildDecelerationPath(sequence, -profile.finalDescentAngle, speedProfile, windProfile, profile.getDistanceFromStart(profile.fafDistanceToEnd));
        sequence.push(...fafStep.get());

        // Assume idle thrust from there
        for (const altitudeConstraint of approachConstraints) {
            this.handleAltitudeConstraint(sequence, speedProfile, windProfile, altitudeConstraint);

            // If you're at or above your descent speed (taking speed limit into account, place the decel point)
            const speedTarget = speedProfile.getTarget(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);
            if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.Decel || sequence.lastCheckpoint.speed > cleanSpeed && sequence.lastCheckpoint.speed > speedTarget) {
                break;
            }
        }

        const speedTarget = speedProfile.getTarget(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);

        if (speedTarget - sequence.lastCheckpoint.speed > 0.1) {
            // We use -Infinty because we just want to decelerate to the descent speed without and constraint on distance
            const decelerationToDescentSpeed = this.buildDecelerationPath(sequence, 0, speedProfile, windProfile, -Infinity);
            sequence.push(...decelerationToDescentSpeed.get());
        }

        // There are cases where the decel point is not added when we handle the constraints above, in this case, we just add it here.
        if (sequence.lastCheckpoint.reason !== VerticalCheckpointReason.Decel) {
            sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.Decel });
        }

        return sequence;
    }

    private handleAltitudeConstraint(sequence: TemporaryCheckpointSequence, speedProfile: SpeedProfile, windProfile: HeadwindProfile, constraint: DescentAltitudeConstraint) {
        // We compose this segment of two segments:
        //  A descent segment
        //  A level deceleration segment
        // This is how they appear along the track

        // Going in reverse:
        // We try to choose make the deceleration segment just as long that we manage to make the descent part
        const { managedDescentSpeedMach, cleanSpeed } = this.observer.get();
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

        let decelerationSequence: TemporaryCheckpointSequence = null;
        let descentSegment: StepResults = null;

        const tryDecelDistance = (decelerationSegmentDistance: NauticalMiles): NauticalMiles => {
            decelerationSequence = this.buildDecelerationPath(
                sequence,
                0,
                speedProfile,
                windProfile,
                distanceFromStart - decelerationSegmentDistance,
            );

            descentSegment = this.idleStrategy.predictToAltitude(
                minimumAltitude,
                altitude,
                decelerationSequence.lastCheckpoint.speed,
                managedDescentSpeedMach,
                decelerationSequence.lastCheckpoint.remainingFuelOnBoard,
                windProfile.getHeadwindComponent(distanceFromStart - decelerationSegmentDistance, minimumAltitude),
                AircraftConfigurationProfile.getBySpeed(decelerationSequence.lastCheckpoint.speed, this.observer.get()),
            );

            const distanceTraveled = descentSegment.distanceTraveled + (distanceFromStart - decelerationSequence.lastCheckpoint.distanceFromStart);

            return distanceTraveled - desiredDistanceToCover;
        };

        let a = 0;
        let b = desiredDistanceToCover;

        let fa = tryDecelDistance(0);
        // We can't reach the altitude constraint even if we do not decelerate at all
        if (fa < 0) {
            let i = 0;
            while (i++ < 10) {
                const c = (a + b) / 2;
                const fc = tryDecelDistance(c);

                if (fc < 0.05 && decelerationSequence.lastCheckpoint.reason === VerticalCheckpointReason.Decel) {
                    if (VnavConfig.DEBUG_PROFILE) {
                        console.log('[FMS/VNAV] Stopping iteration because DECEL point was found.');
                    }

                    break;
                }

                if (Math.abs(fc) < 0.05 || (b - a) < 0.05) {
                    if (VnavConfig.DEBUG_PROFILE) {
                        console.log(`[FMS/VNAV] Final error ${fc} after ${i} iterations.`);
                    }

                    break;
                }

                if (fa * fc > 0) {
                    a = c;
                } else {
                    b = c;
                }

                fa = tryDecelDistance(a);
            }

            if (i > 10) {
                console.log(`[FMS/VNAV] Iteration did not terminate when going from ${altitude} ft to ${minimumAltitude} ft in ${desiredDistanceToCover} NM.`);
            }
        }

        sequence.push(...decelerationSequence.get());

        const speedTarget = speedProfile.getTarget(decelerationSequence.lastCheckpoint.distanceFromStart, decelerationSequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);
        // Don't bother considering the climb step in the profile if we have already reached the target speed in the deceleration segment
        if (speedTarget - decelerationSequence.lastCheckpoint.speed > 1 || decelerationSequence.lastCheckpoint.speed < cleanSpeed) {
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
        step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
        step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
    }

    /**
     * This builds a level deceleration path, bringing out flaps as needed, and obeying speed constraints
     * @param sequence
     * @param fpa
     * @param speedProfile
     * @param targetDistanceFromStart
     * @returns
     */
    private buildDecelerationPath(
        sequence: TemporaryCheckpointSequence, fpa: Degrees, speedProfile: SpeedProfile, windProfile: HeadwindProfile, targetDistanceFromStart: NauticalMiles,
    ): TemporaryCheckpointSequence {
        const decelerationSequence = new TemporaryCheckpointSequence(sequence.lastCheckpoint);

        const parameters = this.observer.get();
        const { managedDescentSpeedMach } = parameters;

        for (let i = 0; i < 10
            && decelerationSequence.lastCheckpoint.reason !== VerticalCheckpointReason.Decel
            && decelerationSequence.lastCheckpoint.distanceFromStart - targetDistanceFromStart > 0.05;
            i++
        ) {
            const { distanceFromStart, altitude, speed, remainingFuelOnBoard } = decelerationSequence.lastCheckpoint;

            const speedConstraint = speedProfile.getMaxDescentSpeedConstraint(distanceFromStart - 1e-4);
            const flapTargetSpeed = FlapConfigurationProfile.findNextExtensionSpeed(speed, parameters);

            // This is the managed descent speed, or the speed limit speed.
            const limitingSpeed = speedProfile.getTargetWithoutConstraints(decelerationSequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);

            // If the constraint is limiting, decelerate to the constraint, then fly constant speed until it is resolved
            // If the flapTarget is limiting, decelerate to the flap target
            // If the limitingSpeed is limiting, decelerate to it and return

            // Constraint is constraining
            if (speedConstraint !== null && speedConstraint.maxSpeed < flapTargetSpeed && speedConstraint.maxSpeed < limitingSpeed) {
                // This is meant to be negative
                const remainingDistance = Math.max(speedConstraint.distanceFromStart, targetDistanceFromStart) - distanceFromStart;

                // Decelerate to constraint
                const decelerationStep = this.fpaDecelerationSegment(
                    fpa,
                    altitude,
                    speed,
                    speedConstraint.maxSpeed,
                    managedDescentSpeedMach,
                    remainingFuelOnBoard,
                    windProfile.getHeadwindComponent(distanceFromStart, altitude),
                    AircraftConfigurationProfile.getBySpeed(speed, parameters),
                );

                if (decelerationStep.distanceTraveled < 1e-4) {
                    // We tried to declerate, but it took us beyond targetDistanceFromStart, so we scale down the step
                    const scaling = Math.min(1, remainingDistance / decelerationStep.distanceTraveled);
                    this.scaleStepBasedOnLastCheckpoint(decelerationSequence.lastCheckpoint, decelerationStep, scaling);
                    decelerationSequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.AtmosphericConditions);
                }

                const remainingDistanceToConstraint = distanceFromStart + decelerationStep.distanceTraveled - Math.max(speedConstraint.distanceFromStart, targetDistanceFromStart);

                if (remainingDistanceToConstraint > 0.05) {
                    if (speedConstraint.maxSpeed > parameters.cleanSpeed) {
                        decelerationSequence.lastCheckpoint.reason = VerticalCheckpointReason.Decel;
                        return decelerationSequence;
                    }

                    // If we decelerated, but aren't at the constraint yet, fly level, at constant speed to the constraint
                    const constantStep = this.fpaSegment(
                        fpa,
                        altitude,
                        remainingDistanceToConstraint,
                        speedConstraint.maxSpeed,
                        managedDescentSpeedMach,
                        remainingFuelOnBoard - decelerationStep.fuelBurned,
                        windProfile.getHeadwindComponent(distanceFromStart, altitude),
                        AircraftConfigurationProfile.getBySpeed(speedConstraint.maxSpeed, parameters),
                    );

                    decelerationSequence.addCheckpointFromStepBackwards(constantStep, VerticalCheckpointReason.SpeedConstraint);
                } else {
                    decelerationSequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.SpeedConstraint });
                }
            } else {
                const remainingDistance = targetDistanceFromStart - distanceFromStart; // This should be negative
                const speedTargetWithConstraints = speedProfile.getTarget(distanceFromStart, decelerationSequence.lastCheckpoint.altitude, ManagedSpeedType.Descent);

                const targetSpeed = Math.min(flapTargetSpeed, speedTargetWithConstraints);
                // flapTarget is constraining
                const decelerationStep = this.fpaDecelerationSegment(
                    fpa,
                    altitude,
                    speed,
                    targetSpeed,
                    managedDescentSpeedMach,
                    remainingFuelOnBoard,
                    windProfile.getHeadwindComponent(distanceFromStart, altitude),
                    AircraftConfigurationProfile.getBySpeed(speed, parameters),
                );

                if (decelerationStep.distanceTraveled < remainingDistance) {
                    const scaling = Math.min(1, remainingDistance / decelerationStep.distanceTraveled);
                    this.scaleStepBasedOnLastCheckpoint(decelerationSequence.lastCheckpoint, decelerationStep, scaling);
                    decelerationSequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.AtmosphericConditions);

                    return decelerationSequence;
                }

                decelerationSequence.addCheckpointFromStep(decelerationStep, this.getFlapCheckpointReasonByFlapConf(FlapConfigurationProfile.getBySpeed(targetSpeed, parameters)));
            }
        }

        return decelerationSequence;
    }

    // TODO: Should this be part of a strategy?
    private fpaDecelerationSegment(
        fpa: Degrees, finalAltitude: number, finalSpeed: Knots, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration,
    ): StepResults {
        const { zeroFuelWeight, tropoPause } = this.observer.get();
        const actualMach = this.atmosphericConditions.computeMachFromCas(finalAltitude, (finalSpeed + speed) / 2);

        const step = Predictions.speedChangeStep(
            fpa,
            finalAltitude,
            finalSpeed,
            speed,
            mach,
            mach,
            EngineModel.getIdleN1(finalAltitude, actualMach) + VnavConfig.IDLE_N1_MARGIN,
            zeroFuelWeight,
            fuelOnBoard,
            headwindComponent.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            config.gearExtended,
            config.flapConfig,
        );

        return step;
    }

    private fpaSegment(
        fpa: Degrees, finalAltitde: Feet, distance: NauticalMiles, speed: Knots, mach: Mach, fuelOnBoard: number, headwindComponent: WindComponent, config?: AircraftConfiguration,
    ): StepResults {
        const { zeroFuelWeight, tropoPause } = this.observer.get();
        const initialAltitude = finalAltitde - distance * Math.tan(fpa * MathUtils.DEGREES_TO_RADIANS);

        return Predictions.geometricStep(
            initialAltitude,
            finalAltitde,
            distance,
            speed,
            mach,
            zeroFuelWeight,
            fuelOnBoard,
            this.atmosphericConditions.isaDeviation,
            headwindComponent.value,
            tropoPause,
            config.gearExtended,
            config.flapConfig,
            config.speedbrakesExtended,
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
