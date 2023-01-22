import { MaxSpeedConstraint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { FmgcFlightPhase } from '@shared/flightphase';

export enum ManagedSpeedType {
    Climb,
    Cruise,
    Descent
}

export interface SpeedProfile {
    /**
     * This is used for predictions
     * @param distanceFromStart - The distance at which the target should be queried
     * @param altitude
     */
    getTarget(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots;

    /**
     * This is used for predictions
     * @param altitude
     * @param managedSpeedType
     */
    getTargetWithoutConstraints(altitude: NauticalMiles, managedSpeedType: ManagedSpeedType): Knots;

    shouldTakeClimbSpeedLimitIntoAccount(): boolean;
    shouldTakeDescentSpeedLimitIntoAccount(): boolean;

    /**
     * This is used for predictions
     * @param distanceFromStart
     */
    getMaxClimbSpeedConstraint(distanceFromStart: NauticalMiles): MaxSpeedConstraint;

    /**
     * This is used for predictions
     * @param distanceAlongTrack
     */
    getMaxDescentSpeedConstraint(distanceAlongTrack: NauticalMiles): MaxSpeedConstraint;
}

function constraintToSpeed(constraint?: MaxSpeedConstraint): Knots {
    return constraint?.maxSpeed ?? Infinity;
}

/**
 * This class's purpose is to provide a predicted speed at a given position and altitude.
 */
export class McduSpeedProfile implements SpeedProfile {
    /**
     *
     * @param parameters
     * @param aircraftDistanceAlongTrack
     * @param climbSpeedConstraints - This should be sorted in increasing distance along track
     * @param descentSpeedConstraints - This should be sorted in increasing distance along track
     */
    constructor(
        private parameters: VerticalProfileComputationParametersObserver,
        private aircraftDistanceAlongTrack: NauticalMiles,
        private climbSpeedConstraints: MaxSpeedConstraint[],
        private descentSpeedConstraints: MaxSpeedConstraint[],
    ) { }

    private isValidSpeedLimit(speedLimit: SpeedLimit): boolean {
        if (!speedLimit) {
            return false;
        }

        const { speed, underAltitude } = speedLimit;

        return Number.isFinite(speed) && Number.isFinite(underAltitude);
    }

    update(aircraftDistanceAlongTrack: NauticalMiles) {
        this.aircraftDistanceAlongTrack = aircraftDistanceAlongTrack;
    }

    getTarget(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots {
        const { fcuSpeed, flightPhase, preselectedClbSpeed, preselectedCruiseSpeed, preselectedDescentSpeed } = this.parameters.get();

        let preselectedSpeed = -1;
        if (flightPhase < FmgcFlightPhase.Climb && preselectedClbSpeed > 100) {
            preselectedSpeed = preselectedClbSpeed;
        } else if (flightPhase < FmgcFlightPhase.Cruise && preselectedCruiseSpeed > 100) {
            preselectedSpeed = preselectedCruiseSpeed;
        } else if (flightPhase < FmgcFlightPhase.Descent && preselectedDescentSpeed > 100) {
            preselectedSpeed = preselectedDescentSpeed;
        }
        const hasPreselectedSpeed = preselectedSpeed > 0;

        const isPredictingForCurrentPhase = managedSpeedType === ManagedSpeedType.Climb && flightPhase === FmgcFlightPhase.Climb
            || managedSpeedType === ManagedSpeedType.Cruise && flightPhase === FmgcFlightPhase.Cruise
            || managedSpeedType === ManagedSpeedType.Descent && (flightPhase === FmgcFlightPhase.Descent || flightPhase === FmgcFlightPhase.Approach);

        // In the descent, the MCDU assumes an immediate return to managed speed, and selecting a speed should not affect the profile
        const hasSelectedSpeed = fcuSpeed > 100 && isPredictingForCurrentPhase;

        if (!hasPreselectedSpeed && !hasSelectedSpeed) {
            return this.getManagedTarget(distanceFromStart, altitude, managedSpeedType);
        }

        const nextSpeedChange = this.findDistanceAlongTrackOfNextSpeedChange(this.aircraftDistanceAlongTrack);

        if (distanceFromStart > nextSpeedChange) {
            return this.getManagedTarget(distanceFromStart, altitude, managedSpeedType);
        }

        if (hasPreselectedSpeed) {
            return preselectedSpeed;
        }

        return fcuSpeed;
    }

    getTargetWithoutConstraints(altitude: Feet, managedSpeedType: ManagedSpeedType) {
        let managedSpeed = this.getManagedSpeedForType(managedSpeedType);
        const { climbSpeedLimit, descentSpeedLimit } = this.parameters.get();

        if (managedSpeedType === ManagedSpeedType.Climb || managedSpeedType === ManagedSpeedType.Cruise) {
            if (this.shouldTakeClimbSpeedLimitIntoAccount() && altitude < climbSpeedLimit.underAltitude) {
                managedSpeed = Math.min(climbSpeedLimit.speed, managedSpeed);
            }
        } else if (this.shouldTakeDescentSpeedLimitIntoAccount() && altitude < descentSpeedLimit.underAltitude) {
            managedSpeed = Math.min(descentSpeedLimit.speed, managedSpeed);
        }

        return managedSpeed;
    }

    getManagedTarget(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots {
        const constraintSpeed = constraintToSpeed(managedSpeedType === ManagedSpeedType.Climb || managedSpeedType === ManagedSpeedType.Cruise
            ? this.getMaxClimbSpeedConstraint(distanceFromStart)
            : this.getMaxDescentSpeedConstraint(distanceFromStart));

        return Math.min(
            this.getTargetWithoutConstraints(altitude, managedSpeedType),
            constraintSpeed,
        );
    }

    getMaxClimbSpeedConstraint(distanceAlongTrack: NauticalMiles): MaxSpeedConstraint {
        let activeConstraint: MaxSpeedConstraint = null;

        for (const constraint of this.climbSpeedConstraints) {
            if (distanceAlongTrack < constraint.distanceFromStart && constraint.maxSpeed < constraintToSpeed(activeConstraint)) {
                activeConstraint = constraint;
            }
        }

        return activeConstraint;
    }

    getMaxDescentSpeedConstraint(distanceAlongTrack: NauticalMiles): MaxSpeedConstraint {
        let activeConstraint: MaxSpeedConstraint = null;

        for (const constraint of this.descentSpeedConstraints) {
            if (constraint.maxSpeed >= constraintToSpeed(activeConstraint)) {
                continue;
            }

            // Since the constraint are ordered, there is no need to search further
            if (distanceAlongTrack < constraint.distanceFromStart) {
                return activeConstraint;
            }

            activeConstraint = constraint;
        }

        return activeConstraint;
    }

    private findDistanceAlongTrackOfNextSpeedChange(distanceAlongTrack: NauticalMiles) {
        let distance = Infinity;

        for (const constraint of this.climbSpeedConstraints) {
            if (distanceAlongTrack <= constraint.distanceFromStart && constraint.distanceFromStart < distance) {
                distance = constraint.distanceFromStart;
            }
        }

        // TODO: Handle speed limit

        return distance;
    }

    shouldTakeClimbSpeedLimitIntoAccount(): boolean {
        return this.isValidSpeedLimit(this.parameters.get().climbSpeedLimit);
    }

    shouldTakeDescentSpeedLimitIntoAccount(): boolean {
        return this.isValidSpeedLimit(this.parameters.get().descentSpeedLimit);
    }

    private getManagedSpeedForType(managedSpeedType: ManagedSpeedType) {
        const { managedClimbSpeed, managedCruiseSpeed, managedDescentSpeed } = this.parameters.get();

        switch (managedSpeedType) {
        case ManagedSpeedType.Climb:
            return managedClimbSpeed;
        case ManagedSpeedType.Cruise:
            return managedCruiseSpeed;
        case ManagedSpeedType.Descent:
            return managedDescentSpeed;
        default:
            throw new Error(`[FMS/VNAV] Invalid managedSpeedType: ${managedSpeedType}`);
        }
    }

    getManagedMachTarget() {
        const { flightPhase, managedClimbSpeedMach, managedCruiseSpeedMach, managedDescentSpeedMach } = this.parameters.get();

        switch (flightPhase) {
        case FmgcFlightPhase.Cruise:
            return managedCruiseSpeedMach;
        case FmgcFlightPhase.Descent:
        case FmgcFlightPhase.Approach:
        case FmgcFlightPhase.Done:
            return managedDescentSpeedMach;
        default:
            return managedClimbSpeedMach;
        }
    }
}

export class ExpediteSpeedProfile implements SpeedProfile {
    constructor(private greenDotSpeed: Knots) { }

    getTarget(_distanceFromStart: number, _altitude: number): Knots {
        return this.greenDotSpeed;
    }

    getTargetWithoutConstraints(_altitude: number, _managedSpeedType: ManagedSpeedType): number {
        return this.greenDotSpeed;
    }

    getCurrentSpeedTarget(): Knots {
        return Infinity;
    }

    shouldTakeClimbSpeedLimitIntoAccount(): boolean {
        return false;
    }

    shouldTakeDescentSpeedLimitIntoAccount(): boolean {
        return false;
    }

    getMaxClimbSpeedConstraint(_distanceFromStart: number): MaxSpeedConstraint {
        return null;
    }

    getMaxDescentSpeedConstraint(_distanceFromStart: number): MaxSpeedConstraint {
        return null;
    }
}

/**
 * The NdSpeedProfile is different from the MCDU speed profile because it assumes a selected speed is
 * held until the end of the flight phase rather than only until the next speed constraint
 */
export class NdSpeedProfile implements SpeedProfile {
    private maxSpeedCacheHits: number = 0;

    private maxSpeedLookups: number = 0;

    private maxSpeedCache: Map<number, Knots> = new Map();

    constructor(
        private parameters: VerticalProfileComputationParametersObserver,
        private aircraftDistanceAlongTrack: NauticalMiles,
        private maxSpeedConstraints: MaxSpeedConstraint[],
        private descentSpeedConstraints: MaxSpeedConstraint[],
    ) { }

    private isValidSpeedLimit(speedLimit: SpeedLimit): boolean {
        if (!speedLimit) {
            return false;
        }

        const { speed, underAltitude } = speedLimit;

        return Number.isFinite(speed) && Number.isFinite(underAltitude);
    }

    getTarget(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots {
        const { fcuSpeed, flightPhase, preselectedClbSpeed } = this.parameters.get();

        const hasPreselectedSpeed = flightPhase < FmgcFlightPhase.Climb && preselectedClbSpeed > 1;
        const hasSelectedSpeed = fcuSpeed > 100 && flightPhase > FmgcFlightPhase.Takeoff;

        if (hasPreselectedSpeed) {
            return preselectedClbSpeed;
        }

        if (hasSelectedSpeed) {
            return fcuSpeed;
        }

        return this.getManaged(distanceFromStart, altitude, managedSpeedType);
    }

    getTargetWithoutConstraints(altitude: Feet, managedSpeedType: ManagedSpeedType) {
        let managedSpeed = this.getManagedSpeedForType(managedSpeedType);
        const { climbSpeedLimit, descentSpeedLimit } = this.parameters.get();

        if (managedSpeedType === ManagedSpeedType.Climb || managedSpeedType === ManagedSpeedType.Cruise) {
            if (this.shouldTakeClimbSpeedLimitIntoAccount() && altitude < climbSpeedLimit.underAltitude) {
                managedSpeed = Math.min(climbSpeedLimit.speed, managedSpeed);
            }
        } else if (this.shouldTakeDescentSpeedLimitIntoAccount() && altitude < descentSpeedLimit.underAltitude) {
            managedSpeed = Math.min(descentSpeedLimit.speed, managedSpeed);
        }

        return managedSpeed;
    }

    private getManaged(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots {
        let managedSpeed = this.getManagedSpeedForType(managedSpeedType);
        const { climbSpeedLimit, descentSpeedLimit } = this.parameters.get();

        if (managedSpeedType === ManagedSpeedType.Climb || managedSpeedType === ManagedSpeedType.Cruise) {
            if (this.shouldTakeClimbSpeedLimitIntoAccount() && altitude < climbSpeedLimit.underAltitude) {
                managedSpeed = Math.min(climbSpeedLimit.speed, managedSpeed);
            }
        } else if (this.shouldTakeDescentSpeedLimitIntoAccount() && altitude < descentSpeedLimit.underAltitude) {
            managedSpeed = Math.min(descentSpeedLimit.speed, managedSpeed);
        }

        return Math.min(managedSpeed, this.findMaxSpeedAtDistanceAlongTrack(distanceFromStart));
    }

    getCurrentSpeedTarget(): Knots {
        return this.findMaxSpeedAtDistanceAlongTrack(this.aircraftDistanceAlongTrack);
    }

    isSelectedSpeed(): boolean {
        const { fcuSpeed, flightPhase, preselectedClbSpeed } = this.parameters.get();

        const hasPreselectedSpeed = flightPhase < FmgcFlightPhase.Climb && preselectedClbSpeed > 1;
        const hasSelectedSpeed = fcuSpeed > 100 && flightPhase > FmgcFlightPhase.Takeoff;

        return hasSelectedSpeed || hasPreselectedSpeed;
    }

    private findMaxSpeedAtDistanceAlongTrack(distanceAlongTrack: NauticalMiles): Knots {
        this.maxSpeedLookups++;

        const cachedMaxSpeed = this.maxSpeedCache.get(distanceAlongTrack);
        if (cachedMaxSpeed) {
            this.maxSpeedCacheHits++;
            return cachedMaxSpeed;
        }

        const maxSpeed = Math.min(
            constraintToSpeed(this.getMaxClimbSpeedConstraint(distanceAlongTrack)),
            constraintToSpeed(this.findMaxDescentSpeedConstraint(distanceAlongTrack)),
        );
        this.maxSpeedCache.set(distanceAlongTrack, maxSpeed);

        return maxSpeed;
    }

    getMaxClimbSpeedConstraint(distanceAlongTrack: NauticalMiles): MaxSpeedConstraint {
        let activeConstraint: MaxSpeedConstraint = null;

        for (const constraint of this.maxSpeedConstraints) {
            if (distanceAlongTrack < constraint.distanceFromStart && constraint.maxSpeed < constraintToSpeed(activeConstraint)) {
                activeConstraint = constraint;
            }
        }

        return activeConstraint;
    }

    getMaxDescentSpeedConstraint(distanceAlongTrack: NauticalMiles): MaxSpeedConstraint {
        let activeConstraint: MaxSpeedConstraint = null;

        // TODO: I think this is unnecessarily complex, we can probably just return the first constraint that is in front of us.
        for (const constraint of this.descentSpeedConstraints) {
            // Since the constraint are ordered, there is no need to search further
            if (distanceAlongTrack < constraint.distanceFromStart) {
                return activeConstraint;
            }

            activeConstraint = constraint;
        }

        return activeConstraint;
    }

    private findMaxDescentSpeedConstraint(distanceAlongTrack: NauticalMiles): MaxSpeedConstraint {
        let activeConstraint: MaxSpeedConstraint = null;

        // TODO: I think this is unnecessarily complex, we can probably just return the first constraint that is in front of us.
        for (const constraint of this.descentSpeedConstraints) {
            // Since the constraint are ordered, there is no need to search further
            if (distanceAlongTrack < constraint.distanceFromStart) {
                return activeConstraint;
            }

            activeConstraint = constraint;
        }

        return activeConstraint;
    }

    showDebugStats() {
        if (this.maxSpeedLookups === 0) {
            console.log('[FMS/VNAV] No max speed lookups done so far.');
            return;
        }

        console.log(
            `[FMS/VNAV] Performed ${this.maxSpeedLookups} max speed lookups. Of which ${this.maxSpeedCacheHits} (${100 * this.maxSpeedCacheHits / this.maxSpeedLookups}%) had been cached`,
        );
    }

    shouldTakeClimbSpeedLimitIntoAccount(): boolean {
        return this.isValidSpeedLimit(this.parameters.get().climbSpeedLimit) && !this.isSelectedSpeed();
    }

    shouldTakeDescentSpeedLimitIntoAccount(): boolean {
        return this.isValidSpeedLimit(this.parameters.get().descentSpeedLimit) && !this.isSelectedSpeed();
    }

    private getManagedSpeedForType(managedSpeedType: ManagedSpeedType) {
        const { managedClimbSpeed, managedCruiseSpeed, managedDescentSpeed } = this.parameters.get();

        switch (managedSpeedType) {
        case ManagedSpeedType.Climb:
            return managedClimbSpeed;
        case ManagedSpeedType.Cruise:
            return managedCruiseSpeed;
        case ManagedSpeedType.Descent:
            return managedDescentSpeed;
        default:
            throw new Error(`[FMS/VNAV] Invalid managedSpeedType: ${managedSpeedType}`);
        }
    }
}
