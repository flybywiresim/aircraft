import { MaxSpeedConstraint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
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

    /**
     * This is used for guidance.
     */
    getCurrentSpeedTarget(): Knots;
    shouldTakeSpeedLimitIntoAccount(): boolean;

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
    private maxSpeedCacheHits: number = 0;

    private maxSpeedLookups: number = 0;

    private maxSpeedCache: Map<number, Knots> = new Map();

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

    private isValidSpeedLimit(): boolean {
        const { speed, underAltitude } = this.parameters.get().climbSpeedLimit;

        return Number.isFinite(speed) && Number.isFinite(underAltitude);
    }

    getTarget(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots {
        const { fcuSpeed, flightPhase, preselectedClbSpeed } = this.parameters.get();

        const hasPreselectedSpeed = flightPhase < FmgcFlightPhase.Climb && preselectedClbSpeed > 1;
        // In the descent, the MCDU assumes an immediate return to managed speed, and selecting a speed should not affect the profile
        const hasSelectedSpeed = fcuSpeed > 100 && flightPhase > FmgcFlightPhase.Takeoff && flightPhase < FlightPhase.FLIGHT_PHASE_DESCENT;

        if (!hasPreselectedSpeed && !hasSelectedSpeed) {
            return this.getManagedTarget(distanceFromStart, altitude, managedSpeedType);
        }

        const nextSpeedChange = this.findDistanceAlongTrackOfNextSpeedChange(this.aircraftDistanceAlongTrack);

        if (distanceFromStart > nextSpeedChange) {
            return this.getManagedTarget(distanceFromStart, altitude, managedSpeedType);
        }

        if (hasPreselectedSpeed) {
            return preselectedClbSpeed;
        }

        return fcuSpeed;
    }

    getTargetWithoutConstraints(altitude: Feet, managedSpeedType: ManagedSpeedType) {
        let managedSpeed = this.getManagedSpeedForType(managedSpeedType);
        const { speed, underAltitude } = this.parameters.get().climbSpeedLimit;

        if (this.isValidSpeedLimit() && altitude < underAltitude) {
            managedSpeed = Math.min(speed, managedSpeed);
        }

        return managedSpeed;
    }

    private getManagedTarget(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots {
        let managedSpeed = this.getManagedSpeedForType(managedSpeedType);
        const { speed, underAltitude } = this.parameters.get().climbSpeedLimit;

        if (this.isValidSpeedLimit() && altitude < underAltitude) {
            managedSpeed = Math.min(speed, managedSpeed);
        }

        return Math.min(managedSpeed, this.findMaxSpeedAtDistanceAlongTrack(distanceFromStart));
    }

    getCurrentSpeedTarget(): Knots {
        return this.findMaxSpeedAtDistanceAlongTrack(this.aircraftDistanceAlongTrack);
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
            constraintToSpeed(this.getMaxDescentSpeedConstraint(distanceAlongTrack)),
        );

        this.maxSpeedCache.set(distanceAlongTrack, maxSpeed);

        return maxSpeed;
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

    showDebugStats() {
        if (this.maxSpeedLookups === 0) {
            console.log('[FMS/VNAV] No max speed lookups done so far.');
            return;
        }

        console.log(
            `[FMS/VNAV] Performed ${this.maxSpeedLookups} max speed lookups. Of whics ${this.maxSpeedCacheHits} (${100 * this.maxSpeedCacheHits / this.maxSpeedLookups}%) had been cached`,
        );
    }

    shouldTakeSpeedLimitIntoAccount(): boolean {
        return this.isValidSpeedLimit();
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

    shouldTakeSpeedLimitIntoAccount(): boolean {
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

    private isValidSpeedLimit(): boolean {
        const { speed, underAltitude } = this.parameters.get().climbSpeedLimit;

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
        const { speed, underAltitude } = this.parameters.get().climbSpeedLimit;

        if (this.isValidSpeedLimit() && altitude < underAltitude) {
            managedSpeed = Math.min(speed, managedSpeed);
        }

        return managedSpeed;
    }

    private getManaged(distanceFromStart: NauticalMiles, altitude: Feet, managedSpeedType: ManagedSpeedType): Knots {
        let managedSpeed = this.getManagedSpeedForType(managedSpeedType);
        const { speed, underAltitude } = this.parameters.get().climbSpeedLimit;

        if (this.isValidSpeedLimit() && altitude < underAltitude) {
            managedSpeed = Math.min(speed, managedSpeed);
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

    shouldTakeSpeedLimitIntoAccount(): boolean {
        return this.isValidSpeedLimit() && !this.isSelectedSpeed();
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
