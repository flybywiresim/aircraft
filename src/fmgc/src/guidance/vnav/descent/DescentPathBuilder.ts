import { DescentAltitudeConstraint, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { GeometricPathBuilder } from '@fmgc/guidance/vnav/descent/GeometricPathBuilder';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { AltitudeConstraint, AltitudeConstraintType } from '@fmgc/guidance/lnav/legs';
import { MathUtils } from '@shared/MathUtils';

export class DescentPathBuilder {
    private geometricPathBuilder: GeometricPathBuilder;

    private idleDescentStrategy: DescentStrategy;

    constructor(
        private computationParametersObserver: VerticalProfileComputationParametersObserver,
        atmosphericConditions: AtmosphericConditions,
    ) {
        this.geometricPathBuilder = new GeometricPathBuilder(
            computationParametersObserver,
            atmosphericConditions,
        );

        this.idleDescentStrategy = new IdleDescentStrategy(computationParametersObserver, atmosphericConditions);
    }

    computeManagedDescentPath(
        sequence: TemporaryCheckpointSequence,
        profile: BaseGeometryProfile,
        speedProfile: SpeedProfile,
        windProfile: HeadwindProfile,
        cruiseAltitude: Feet,
    ) {
        const TOL = 10;
        const decelPoint: VerticalCheckpoint = { ...sequence.lastCheckpoint };

        const geometricSequence = new TemporaryCheckpointSequence(decelPoint);
        const idleSequence = new TemporaryCheckpointSequence(decelPoint);

        this.buildIdlePath(idleSequence, profile, speedProfile, windProfile, cruiseAltitude);

        for (let i = profile.descentAltitudeConstraints.length - 1; i >= 0; i -= 1) {
            const constraintPoint = profile.descentAltitudeConstraints[i];

            if (constraintPoint.distanceFromStart >= decelPoint.distanceFromStart) {
                // If we've found a constraint that's beyond the decel point, we can ignore it.
                continue;
            } else if (constraintPoint.distanceFromStart < idleSequence.lastCheckpoint.distanceFromStart
                || !this.isConstraintBelowCruisingAltitude(constraintPoint.constraint, cruiseAltitude)) {
                // If we arrive at the constraints before the idle path, we are done
                break;
            }

            const altAtConstraint = idleSequence.interpolateAltitudeBackwards(constraintPoint.distanceFromStart);
            const [isAltitudeConstraintMet, altitudeToContinueFrom] = evaluateAltitudeConstraint(constraintPoint.constraint, altAtConstraint, TOL);
            if (!isAltitudeConstraintMet) {
                const geometricPathPoint = { distanceFromStart: constraintPoint.distanceFromStart, altitude: altitudeToContinueFrom };

                // Plan geometric path between decel point and geometric path point (point between geometric and idle path)
                const geometricSegments: PlannedGeometricSegment[] = [];
                GeometricPathPlanner.planDescentSegments(profile.descentAltitudeConstraints, decelPoint, geometricPathPoint, geometricSegments, TOL);

                // Execute
                geometricSequence.reset(geometricSequence.at(0));
                this.geometricPathBuilder.executeGeometricSegments(geometricSequence, geometricSegments, profile.descentSpeedConstraints.slice(), windProfile);

                idleSequence.reset(geometricSequence.lastCheckpoint);
                this.buildIdlePath(idleSequence, profile, speedProfile, windProfile, cruiseAltitude);
            }
        }

        if (geometricSequence.length > 1) {
            geometricSequence.lastCheckpoint.reason = VerticalCheckpointReason.GeometricPathStart;
        } else {
            geometricSequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.GeometricPathStart });
        }

        sequence.push(...geometricSequence.get());
        sequence.push(...idleSequence.get());
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

            if (altitude >= topOfDescentAltitude) {
                break;
            }

            if (constraint.distanceFromStart >= distanceFromStart) {
                speedConstraints.splice(0, 1);
                continue;
            }

            const speedTargetBeforeCurrentPosition = speedProfile.getTarget(constraint.distanceFromStart, altitude, ManagedSpeedType.Descent);
            // It is safe to use the current altitude here. This way, the speed limit will certainly be obeyed
            if (speedTargetBeforeCurrentPosition - speed > 1) {
                const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);

                const decelerationStep = this.idleDescentStrategy.predictToSpeed(
                    altitude,
                    speed,
                    speedTargetBeforeCurrentPosition,
                    managedDescentSpeedMach,
                    remainingFuelOnBoard,
                    headwind,
                );

                sequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);

                continue;
            }

            const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
            const descentStep = this.idleDescentStrategy.predictToDistance(
                altitude,
                constraint.distanceFromStart - sequence.lastCheckpoint.distanceFromStart,
                speed,
                managedDescentSpeedMach,
                remainingFuelOnBoard,
                headwind,
            );

            if (descentStep.finalAltitude > Math.max(topOfDescentAltitude, descentStep.initialAltitude)) {
                const scaling = (topOfDescentAltitude - descentStep.initialAltitude) / (descentStep.finalAltitude - descentStep.initialAltitude);

                this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, descentStep, scaling);
            }

            sequence.addCheckpointFromStep(descentStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);
        }

        let j = 0;
        for (let altitude = sequence.lastCheckpoint.altitude; altitude < topOfDescentAltitude && j++ < 50; altitude = Math.min(altitude + 1500, topOfDescentAltitude)) {
            const { distanceFromStart, remainingFuelOnBoard, speed } = sequence.lastCheckpoint;

            const startingAltitudeForSegment = Math.min(altitude + 1500, topOfDescentAltitude);
            // Get target slightly before to figure out if we want to accelerate
            const speedTarget = speedProfile.getTarget(distanceFromStart - 1e-4, altitude, ManagedSpeedType.Descent);

            if ((speedTarget - speed) > 1) {
                const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
                const decelerationStep = this.idleDescentStrategy.predictToSpeed(altitude, speed, speedTarget, managedDescentSpeedMach, remainingFuelOnBoard, headwind);

                // If we shoot through the final altitude trying to accelerate, pretend we didn't accelerate all the way
                if (decelerationStep.initialAltitude > topOfDescentAltitude) {
                    const scaling = (decelerationStep.initialAltitude - decelerationStep.finalAltitude) !== 0
                        ? (topOfDescentAltitude - decelerationStep.finalAltitude) / (decelerationStep.initialAltitude - decelerationStep.finalAltitude)
                        : 0;

                    this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, decelerationStep, scaling);
                }

                sequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.IdlePathAtmosphericConditions);

                // Stupid hack
                altitude = sequence.lastCheckpoint.altitude - 1500;
                continue;
            }

            const headwind = windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude);

            const step = this.idleDescentStrategy.predictToAltitude(altitude, startingAltitudeForSegment, speed, managedDescentSpeedMach, remainingFuelOnBoard, headwind);
            sequence.addCheckpointFromStep(step, VerticalCheckpointReason.IdlePathAtmosphericConditions);
        }

        if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.IdlePathAtmosphericConditions) {
            sequence.lastCheckpoint.reason = VerticalCheckpointReason.TopOfDescent;
        } else {
            sequence.copyLastCheckpoint(({ reason: VerticalCheckpointReason.TopOfDescent }));
        }
    }

    private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
        step.distanceTraveled *= scaling;
        step.fuelBurned *= scaling;
        step.timeElapsed *= scaling;
        step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
        step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
    }

    isConstraintBelowCruisingAltitude(constraint: AltitudeConstraint, finalCruiseAltitude: Feet): boolean {
        if (constraint.type === AltitudeConstraintType.at) {
            return constraint.altitude1 <= finalCruiseAltitude;
        } if (constraint.type === AltitudeConstraintType.atOrAbove) {
            return constraint.altitude1 <= finalCruiseAltitude;
        } if (constraint.type === AltitudeConstraintType.atOrBelow) {
            return true;
        } if (constraint.type === AltitudeConstraintType.range) {
            return constraint.altitude2 <= finalCruiseAltitude;
        }

        return true;
    }
}

export class GeometricPathPlanner {
    static planDescentSegments(
        constraints: DescentAltitudeConstraint[],
        start: GeometricPathPoint,
        end: GeometricPathPoint,
        segments: PlannedGeometricSegment[] = [],
        tolerance: number,
    ): PlannedGeometricSegment[] {
        // A "gradient" is just a quantity of units Feet / NauticalMiles
        const gradient = calculateGradient(start, end);

        for (let i = 0; i < constraints.length; i++) {
            const constraintPoint = constraints[i];

            if (constraintPoint.distanceFromStart >= start.distanceFromStart || constraintPoint.distanceFromStart <= end.distanceFromStart) {
                continue;
            }

            const altAtConstraint = start.altitude + gradient * (constraintPoint.distanceFromStart - start.distanceFromStart);

            const [isAltitudeConstraintMet, altitudeToContinueFrom] = evaluateAltitudeConstraint(constraintPoint.constraint, altAtConstraint, tolerance);
            if (!isAltitudeConstraintMet) {
                const center = { distanceFromStart: constraintPoint.distanceFromStart, altitude: altitudeToContinueFrom };

                this.planDescentSegments(constraints, start, center, segments, tolerance);
                this.planDescentSegments(constraints, center, end, segments, tolerance);

                return;
            }
        }

        segments.push({ end, gradient });
    }
}

function evaluateAltitudeConstraint(constraint: AltitudeConstraint, altitude: Feet, tol: number): [boolean, Feet] {
    // Even though in the MCDU constraints count as met if within 250 ft, we use 10 ft here for the initial path construction.
    switch (constraint.type) {
    case AltitudeConstraintType.at:
        return [isAltitudeConstraintMet(constraint, altitude, tol), MathUtils.clamp(altitude, constraint.altitude1, constraint.altitude1)];
    case AltitudeConstraintType.atOrAbove:
        return [isAtOrAboveAltitudeConstraintMet(constraint, altitude, tol), Math.max(altitude, constraint.altitude1)];
    case AltitudeConstraintType.atOrBelow:
        return [isAtOrBelowAltitudeConstraintMet(constraint, altitude, tol), Math.min(altitude, constraint.altitude1)];
    case AltitudeConstraintType.range:
        return [isRangeAltitudeConstraintMet(constraint, altitude, tol), MathUtils.clamp(altitude, constraint.altitude2, constraint.altitude1)];
    default:
        console.error('[FMS/VNAV] Invalid altitude constraint type');
        return [true, altitude];
    }
}

const isAtAltitudeConstraintMet = (constraint: AltitudeConstraint, altitude: Feet, tol: Feet = 250) => Math.abs(altitude - constraint.altitude1) < tol;
const isAtOrAboveAltitudeConstraintMet = (constraint: AltitudeConstraint, altitude: Feet, tol: Feet = 250) => (altitude - constraint.altitude1) > -tol;
const isAtOrBelowAltitudeConstraintMet = (constraint: AltitudeConstraint, altitude: Feet, tol: Feet = 250) => (altitude - constraint.altitude1) < tol;
const isRangeAltitudeConstraintMet = (constraint: AltitudeConstraint, altitude: Feet, tol: Feet = 250) => (altitude - constraint.altitude2) > -tol
    && (altitude - constraint.altitude1) < tol;
export const isAltitudeConstraintMet = (constraint: AltitudeConstraint, altitude: Feet, tol: Feet = 250) => {
    switch (constraint.type) {
    case AltitudeConstraintType.at:
        return isAtAltitudeConstraintMet(constraint, altitude, tol);
    case AltitudeConstraintType.atOrAbove:
        return isAtOrAboveAltitudeConstraintMet(constraint, altitude, tol);
    case AltitudeConstraintType.atOrBelow:
        return isAtOrBelowAltitudeConstraintMet(constraint, altitude, tol);
    case AltitudeConstraintType.range:
        return isRangeAltitudeConstraintMet(constraint, altitude, tol);
    default:
        return true;
    }
};

export type GeometricPathPoint = {
    distanceFromStart: NauticalMiles,
    altitude: Feet
}

export type PlannedGeometricSegment = {
    gradient: number,
    end: GeometricPathPoint,
    isTooSteep?: boolean,
}

export function calculateGradient(start: GeometricPathPoint, end: GeometricPathPoint): number {
    return Math.abs(start.distanceFromStart - end.distanceFromStart) < 1e-9
        ? 0
        : (start.altitude - end.altitude) / (start.distanceFromStart - end.distanceFromStart);
}
