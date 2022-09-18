import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlightPathAngleStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { PlannedGeometricSegment } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { StepResults, VnavStepError } from '@fmgc/guidance/vnav/Predictions';
import { MaxSpeedConstraint, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { MathUtils } from '@shared/MathUtils';

export class GeometricPathBuilder {
    private flightPathAngleStrategy: FlightPathAngleStrategy;

    constructor(
        private observer: VerticalProfileComputationParametersObserver,
        atmosphericConditions: AtmosphericConditions,
    ) {
        this.flightPathAngleStrategy = new FlightPathAngleStrategy(observer, atmosphericConditions, -3.0);
    }

    executeGeometricSegments(sequence: TemporaryCheckpointSequence, segments: PlannedGeometricSegment[], speedConstraints: MaxSpeedConstraint[], windProfile: HeadwindProfile) {
        for (const segment of segments) {
            const currentSegmentSequence = new TemporaryCheckpointSequence(sequence.lastCheckpoint);

            if (!this.executeGeometricSegment(currentSegmentSequence, segment, speedConstraints, windProfile, false)) {
                if (!this.executeGeometricSegment(currentSegmentSequence, segment, speedConstraints, windProfile, true)) {
                    // Marking the segment as too steep, so that we ignore speed constraints on the next try and just fly at the maximum possible gradient
                    segment.isTooSteep = true;

                    this.executeGeometricSegment(currentSegmentSequence, segment, speedConstraints, windProfile, true);

                    sequence.push(...currentSegmentSequence.get());
                    sequence.copyLastCheckpoint({
                        reason: VerticalCheckpointReason.GeometricPathTooSteep,
                        altitude: segment.end.altitude,
                    });

                    continue;
                }
            }

            sequence.push(...currentSegmentSequence.get());
        }
    }

    private executeGeometricSegment(
        sequence: TemporaryCheckpointSequence, segment: PlannedGeometricSegment, speedConstraints: MaxSpeedConstraint[], windProfile: HeadwindProfile, useSpeedbrakes: boolean,
    ) {
        const { managedDescentSpeed, managedDescentSpeedMach, descentSpeedLimit } = this.observer.get();
        this.flightPathAngleStrategy.flightPathAngle = MathUtils.RADIANS_TO_DEGREES * Math.atan(segment.gradient / 6076.12);

        let econSpeed = managedDescentSpeed;

        // We treat the speed limit like a constraint if we cross it on this segment
        const isSpeedLimitValid = Number.isFinite(descentSpeedLimit.speed) && Number.isFinite(descentSpeedLimit.underAltitude);
        const isBelowSpeedLimitAlt = sequence.lastCheckpoint.altitude <= descentSpeedLimit.underAltitude;
        if (isSpeedLimitValid && isBelowSpeedLimitAlt) {
            if (segment.end.altitude > descentSpeedLimit.underAltitude) {
                const distanceToSpeedLimit = (descentSpeedLimit.underAltitude - sequence.lastCheckpoint.altitude) / segment.gradient;

                speedConstraints.push({
                    distanceFromStart: sequence.lastCheckpoint.distanceFromStart + distanceToSpeedLimit,
                    maxSpeed: descentSpeedLimit.speed,
                });

                speedConstraints.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
            } else {
                econSpeed = Math.min(econSpeed, descentSpeedLimit.speed);
            }
        }

        for (let i = speedConstraints.length - 1; i >= 0 && !segment.isTooSteep; i--) {
            const speedConstraint = speedConstraints[i];
            const maxDistance = segment.end.distanceFromStart - sequence.lastCheckpoint.distanceFromStart;

            if (speedConstraint.distanceFromStart > sequence.lastCheckpoint.distanceFromStart || maxDistance >= 0) {
                continue;
            }

            let maxSpeed = econSpeed;
            for (let j = 0; j <= i; j++) {
                const sc = speedConstraints[j];

                if (sc.distanceFromStart > sequence.lastCheckpoint.distanceFromStart) {
                    break;
                }

                maxSpeed = Math.min(econSpeed, speedConstraint.maxSpeed);
            }

            // Decelerate to speed target
            const decelerationStep = this.flightPathAngleStrategy.predictToSpeed(
                sequence.lastCheckpoint.altitude,
                maxSpeed,
                sequence.lastCheckpoint.speed,
                managedDescentSpeedMach,
                sequence.lastCheckpoint.remainingFuelOnBoard,
                windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
                { speedbrakesExtended: useSpeedbrakes, flapConfig: FlapConf.CLEAN, gearExtended: false },
            );

            if (decelerationStep.error === VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT) {
                if (!useSpeedbrakes) {
                    if (VnavConfig.DEBUG_PROFILE) {
                        console.log(`[FMS/VNAV]: Too steep: ${this.flightPathAngleStrategy.flightPathAngle}°. Trying with speedbrakes.`);
                    }

                    // Break out and try the whole segment with speedbrakes
                    return false;
                }

                if (VnavConfig.DEBUG_PROFILE) {
                    console.log(`[FMS/VNAV]: Too steep: ${this.flightPathAngleStrategy.flightPathAngle}°.`);
                }

                segment.gradient = Math.tan(decelerationStep.pathAngle * MathUtils.DEGREES_TO_RADIANS) * 6076.12;
                return false;
            }

            // These are negative distances
            if (decelerationStep.distanceTraveled < Math.min(maxDistance, 0)) {
                const scaling = maxDistance / decelerationStep.distanceTraveled;

                this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, decelerationStep, scaling);
                sequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.SpeedConstraint);
            } else if (Math.max(speedConstraint.distanceFromStart, segment.end.distanceFromStart) - sequence.lastCheckpoint.distanceFromStart < 0) {
                sequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.AtmosphericConditions);

                // Fly to constraint
                const stepToConstraint = this.flightPathAngleStrategy.predictToDistance(
                    sequence.lastCheckpoint.altitude,
                    Math.max(speedConstraint.distanceFromStart, segment.end.distanceFromStart) - sequence.lastCheckpoint.distanceFromStart,
                    sequence.lastCheckpoint.speed,
                    managedDescentSpeedMach,
                    sequence.lastCheckpoint.remainingFuelOnBoard,
                    windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
                );

                sequence.addCheckpointFromStep(stepToConstraint, VerticalCheckpointReason.SpeedConstraint);
            }
        }

        if (segment.end.distanceFromStart - sequence.lastCheckpoint.distanceFromStart < 0) {
            // Fly to end of segment
            // TODO: It's possible we are not at the econSpeed yet. If so, we should accelerate to it
            const stepToEndOfSegment = this.flightPathAngleStrategy.predictToDistance(
                sequence.lastCheckpoint.altitude,
                segment.end.distanceFromStart - sequence.lastCheckpoint.distanceFromStart,
                sequence.lastCheckpoint.speed,
                managedDescentSpeedMach,
                sequence.lastCheckpoint.remainingFuelOnBoard,
                windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
            );

            sequence.addCheckpointFromStep(stepToEndOfSegment, VerticalCheckpointReason.AtmosphericConditions);
        }

        return true;
    }

    private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
        step.distanceTraveled *= scaling;
        step.fuelBurned *= scaling;
        step.timeElapsed *= scaling;
        step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
        step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
    }
}
