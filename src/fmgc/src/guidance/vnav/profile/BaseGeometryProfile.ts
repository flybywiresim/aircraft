import { Common } from '@fmgc/guidance/vnav/common';
import { PseudoWaypointFlightPlanInfo } from '@fmgc/guidance/PseudoWaypoint';
import { DescentAltitudeConstraint, MaxAltitudeConstraint, MaxSpeedConstraint, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { MathUtils } from '@shared/MathUtils';

export interface PerformancePagePrediction {
    altitude: Feet,
    distanceFromStart: NauticalMiles,
    secondsFromPresent: Seconds,
}

export abstract class BaseGeometryProfile {
    public isReadyToDisplay: boolean = false;

    public checkpoints: VerticalCheckpoint[] = [];

    abstract get maxAltitudeConstraints(): MaxAltitudeConstraint[];

    abstract get descentAltitudeConstraints(): DescentAltitudeConstraint[];

    abstract get maxClimbSpeedConstraints(): MaxSpeedConstraint[];

    abstract get descentSpeedConstraints(): MaxSpeedConstraint[];

    abstract get distanceToPresentPosition(): NauticalMiles;

    get lastCheckpoint(): VerticalCheckpoint | null {
        if (this.checkpoints.length < 1) {
            return null;
        }

        return this.checkpoints[this.checkpoints.length - 1];
    }

    addCheckpointFromLast(checkpointBuilder: (lastCheckpoint: VerticalCheckpoint) => Partial<VerticalCheckpoint>) {
        this.checkpoints.push({ ...this.lastCheckpoint, ...checkpointBuilder(this.lastCheckpoint) });
    }

    predictAtTime(secondsFromPresent: Seconds): PseudoWaypointFlightPlanInfo {
        const distanceFromStart = this.interpolateDistanceAtTime(secondsFromPresent);
        const { altitude, speed } = this.interpolateEverythingFromStart(distanceFromStart);

        return {
            distanceFromStart,
            altitude,
            speed,
            secondsFromPresent,
        };
    }

    private interpolateFromCheckpoints<T extends number, U extends number>(
        indexValue: T, keySelector: (checkpoint: VerticalCheckpoint) => T, valueSelector: (checkpoint: VerticalCheckpoint) => U,
    ) {
        if (indexValue <= keySelector(this.checkpoints[0])) {
            return valueSelector(this.checkpoints[0]);
        }

        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            if (indexValue > keySelector(this.checkpoints[i]) && indexValue <= keySelector(this.checkpoints[i + 1])) {
                return Common.interpolate(
                    indexValue,
                    keySelector(this.checkpoints[i]),
                    keySelector(this.checkpoints[i + 1]),
                    valueSelector(this.checkpoints[i]),
                    valueSelector(this.checkpoints[i + 1]),
                );
            }
        }

        return valueSelector(this.checkpoints[this.checkpoints.length - 1]);
    }

    private interpolateFromCheckpointsBackwards<T extends number, U extends number>(
        indexValue: T, keySelector: (checkpoint: VerticalCheckpoint) => T, valueSelector: (checkpoint: VerticalCheckpoint) => U,
    ) {
        if (indexValue < keySelector(this.checkpoints[this.checkpoints.length - 1])) {
            return valueSelector(this.checkpoints[this.checkpoints.length - 1]);
        }

        for (let i = this.checkpoints.length - 2; i >= 0; i--) {
            if (indexValue <= keySelector(this.checkpoints[i]) && indexValue > keySelector(this.checkpoints[i + 1])) {
                return Common.interpolate(
                    indexValue,
                    keySelector(this.checkpoints[i]),
                    keySelector(this.checkpoints[i + 1]),
                    valueSelector(this.checkpoints[i]),
                    valueSelector(this.checkpoints[i + 1]),
                );
            }
        }

        return valueSelector(this.checkpoints[0]);
    }

    /**
     * Find the time from start at which the profile predicts us to be at a distance along the flightplan.
     * @param distanceFromStart Distance along that path
     * @returns Predicted altitude
     */
    interpolateTimeAtDistance(distanceFromStart: NauticalMiles): Seconds {
        return this.interpolateFromCheckpoints(distanceFromStart, (checkpoint) => checkpoint.distanceFromStart, (checkpoint) => checkpoint.secondsFromPresent);
    }

    /**
     * Find the altitude at which the profile predicts us to be at a distance along the flightplan.
     * @param distanceFromStart Distance along that path
     * @returns Predicted altitude
     */
    interpolateAltitudeAtDistance(distanceFromStart: NauticalMiles): Feet {
        return this.interpolateFromCheckpoints(distanceFromStart, (checkpoint) => checkpoint.distanceFromStart, (checkpoint) => checkpoint.altitude);
    }

    /**
     * Find the speed at which the profile predicts us to be at a distance along the flightplan.
     * @param distanceFromStart Distance along that path
     * @returns Predicted speed
     */
    interpolateSpeedAtDistance(distanceFromStart: NauticalMiles): Feet {
        return this.interpolateFromCheckpoints(distanceFromStart, (checkpoint) => checkpoint.distanceFromStart, (checkpoint) => checkpoint.speed);
    }

    /**
     * Find the distanceFromStart at which the profile predicts us to be at a time since departure
     * @param secondsFromPresent Time since departure
     * @returns Predicted distance
     */
    interpolateDistanceAtTime(secondsFromPresent: Seconds): NauticalMiles {
        return this.interpolateFromCheckpoints(secondsFromPresent, (checkpoint) => checkpoint.secondsFromPresent, (checkpoint) => checkpoint.distanceFromStart);
    }

    interpolateEverythingFromStart(distanceFromStart: NauticalMiles, doInterpolateAltitude = true): Omit<VerticalCheckpoint, 'reason'> {
        if (distanceFromStart <= this.checkpoints[0].distanceFromStart) {
            return {
                distanceFromStart,
                secondsFromPresent: this.checkpoints[0].secondsFromPresent,
                altitude: this.checkpoints[0].altitude,
                remainingFuelOnBoard: this.checkpoints[0].remainingFuelOnBoard,
                speed: this.checkpoints[0].speed,
                mach: this.checkpoints[0].mach,
            };
        }

        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            if (distanceFromStart > this.checkpoints[i].distanceFromStart && distanceFromStart <= this.checkpoints[i + 1].distanceFromStart) {
                return {
                    distanceFromStart,
                    secondsFromPresent: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].secondsFromPresent,
                        this.checkpoints[i + 1].secondsFromPresent,
                    ),
                    altitude: doInterpolateAltitude ? Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].altitude,
                        this.checkpoints[i + 1].altitude,
                    ) : this.checkpoints[i].altitude,
                    remainingFuelOnBoard: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].remainingFuelOnBoard,
                        this.checkpoints[i + 1].remainingFuelOnBoard,
                    ),
                    speed: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].speed,
                        this.checkpoints[i + 1].speed,
                    ),
                    mach: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].mach,
                        this.checkpoints[i + 1].mach,
                    ),
                };
            }
        }

        return {
            distanceFromStart,
            secondsFromPresent: this.lastCheckpoint.secondsFromPresent,
            altitude: this.lastCheckpoint.altitude,
            remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard,
            speed: this.lastCheckpoint.speed,
            mach: this.lastCheckpoint.mach,
        };
    }

    interpolateDistanceAtAltitude(altitude: Feet): NauticalMiles {
        return this.interpolateFromCheckpoints(altitude, (checkpoint) => checkpoint.altitude, (checkpoint) => checkpoint.distanceFromStart);
    }

    interpolateDistanceAtAltitudeBackwards(altitude: Feet): NauticalMiles {
        return this.interpolateFromCheckpointsBackwards(altitude, (checkpoint) => checkpoint.altitude, (checkpoint) => checkpoint.distanceFromStart);
    }

    interpolateFuelAtDistance(distance: NauticalMiles): NauticalMiles {
        return this.interpolateFromCheckpoints(distance, (checkpoint) => checkpoint.distanceFromStart, (checkpoint) => checkpoint.remainingFuelOnBoard);
    }

    interpolatePathAngleAtDistance(distanceFromStart: NauticalMiles): Degrees {
        if (distanceFromStart < this.checkpoints[0].distanceFromStart) {
            return 0;
        }

        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            if (distanceFromStart > this.checkpoints[i].distanceFromStart && distanceFromStart <= this.checkpoints[i + 1].distanceFromStart) {
                return MathUtils.RADIANS_TO_DEGREES * Math.atan(
                    (this.checkpoints[i + 1].altitude - this.checkpoints[i].altitude)
                    / (this.checkpoints[i + 1].distanceFromStart - this.checkpoints[i].distanceFromStart) / 6076.12,
                );
            }
        }

        return 0;
    }

    findVerticalCheckpoint(...reasons: VerticalCheckpointReason[]): VerticalCheckpoint | undefined {
        return this.checkpoints.find((checkpoint) => reasons.includes(checkpoint.reason));
    }

    findLastVerticalCheckpoint(...reasons: VerticalCheckpointReason[]): VerticalCheckpoint | undefined {
        return [...this.checkpoints].reverse().find((checkpoint) => reasons.includes(checkpoint.reason));
    }

    findLastVerticalCheckpointIndex(...reasons: VerticalCheckpointReason[]): number {
        return findLastIndex(this.checkpoints, ({ reason }) => reasons.includes(reason));
    }

    purgeVerticalCheckpoints(reason: VerticalCheckpointReason): void {
        this.checkpoints = this.checkpoints.filter((checkpoint) => checkpoint.reason !== reason);
    }

    // TODO: We shouldn't have to go looking for this here...
    // This logic probably belongs to `ClimbPathBuilder`.
    findSpeedLimitCrossing(): [NauticalMiles, Knots] | undefined {
        const speedLimit = this.checkpoints.find((checkpoint) => checkpoint.reason === VerticalCheckpointReason.CrossingClimbSpeedLimit);

        if (!speedLimit) {
            return undefined;
        }

        return [speedLimit.distanceFromStart, speedLimit.speed];
    }

    // TODO: Make this not iterate over map
    findDistancesToSpeedChanges(): NauticalMiles[] {
        const result: NauticalMiles[] = [];

        const speedLimitCrossing = this.findSpeedLimitCrossing();
        if (!speedLimitCrossing) {
            return [];
        }

        const [speedLimitDistance, _] = speedLimitCrossing;
        result.push(speedLimitDistance);

        return result;
    }

    findNextSpeedTarget(distanceFromStart: NauticalMiles): Knots {
        if (distanceFromStart < this.checkpoints[0].distanceFromStart) {
            return this.checkpoints[0].speed;
        }

        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            if (distanceFromStart > this.checkpoints[i].distanceFromStart && distanceFromStart <= this.checkpoints[i + 1].distanceFromStart) {
                return this.checkpoints[i + 1].speed;
            }
        }

        return this.lastCheckpoint.speed;
    }

    addInterpolatedCheckpoint(distanceFromStart: NauticalMiles, additionalProperties: HasAtLeast<VerticalCheckpoint, 'reason'>) {
        if (distanceFromStart <= this.checkpoints[0].distanceFromStart) {
            this.checkpoints.unshift({
                distanceFromStart,
                secondsFromPresent: this.checkpoints[0].secondsFromPresent,
                altitude: this.checkpoints[0].altitude,
                remainingFuelOnBoard: this.checkpoints[0].remainingFuelOnBoard,
                speed: this.checkpoints[0].speed,
                mach: this.checkpoints[0].mach,
                ...additionalProperties,
            });

            return;
        }

        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            if (distanceFromStart > this.checkpoints[i].distanceFromStart && distanceFromStart <= this.checkpoints[i + 1].distanceFromStart) {
                this.checkpoints.splice(i + 1, 0, {
                    distanceFromStart,
                    secondsFromPresent: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].secondsFromPresent,
                        this.checkpoints[i + 1].secondsFromPresent,
                    ),
                    altitude: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].altitude,
                        this.checkpoints[i + 1].altitude,
                    ),
                    remainingFuelOnBoard: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].remainingFuelOnBoard,
                        this.checkpoints[i + 1].remainingFuelOnBoard,
                    ),
                    speed: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].speed,
                        this.checkpoints[i + 1].speed,
                    ),
                    mach: Common.interpolate(
                        distanceFromStart,
                        this.checkpoints[i].distanceFromStart,
                        this.checkpoints[i + 1].distanceFromStart,
                        this.checkpoints[i].mach,
                        this.checkpoints[i + 1].mach,
                    ),
                    ...additionalProperties,
                });

                return;
            }
        }

        this.checkpoints.push({
            distanceFromStart,
            secondsFromPresent: this.lastCheckpoint.secondsFromPresent,
            altitude: this.lastCheckpoint.altitude,
            remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard,
            speed: this.lastCheckpoint.speed,
            mach: this.lastCheckpoint.mach,
            ...additionalProperties,
        });
    }

    addCheckpointAtDistanceFromStart(distanceFromStart: NauticalMiles, ...checkpoints: VerticalCheckpoint[]) {
        if (distanceFromStart <= this.checkpoints[0].distanceFromStart) {
            this.checkpoints.unshift(...checkpoints);

            return;
        }

        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            if (distanceFromStart > this.checkpoints[i].distanceFromStart && distanceFromStart <= this.checkpoints[i + 1].distanceFromStart) {
                this.checkpoints.splice(i + 1, 0, ...checkpoints);

                return;
            }
        }

        this.checkpoints.push(...checkpoints);
    }

    sortCheckpoints() {
        this.checkpoints.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
    }

    finalizeProfile() {
        this.sortCheckpoints();

        this.isReadyToDisplay = true;
    }

    computePredictionToFcuAltitude(fcuAltitude: Feet): PerformancePagePrediction | undefined {
        const maxAltitude = this.checkpoints.reduce((currentMax, checkpoint) => Math.max(currentMax, checkpoint.altitude), 0);

        if (fcuAltitude < this.checkpoints[0].altitude || fcuAltitude > maxAltitude) {
            return undefined;
        }

        const distanceToFcuAltitude = this.interpolateFromCheckpoints(fcuAltitude, (checkpoint) => checkpoint.altitude, (checkpoint) => checkpoint.distanceFromStart);
        const timeToFcuAltitude = this.interpolateTimeAtDistance(distanceToFcuAltitude);

        return {
            altitude: fcuAltitude,
            distanceFromStart: distanceToFcuAltitude,
            secondsFromPresent: timeToFcuAltitude,
        };
    }

    getCheckpointsToDrawOnNd(): VerticalCheckpoint[] {
        if (!this.isReadyToDisplay) {
            return [];
        }

        const CHECKPOINTS_TO_DRAW_ON_ND = new Set([
            VerticalCheckpointReason.TopOfClimb,
            VerticalCheckpointReason.LevelOffForClimbConstraint,
            VerticalCheckpointReason.ContinueClimb,
            VerticalCheckpointReason.CrossingFcuAltitudeClimb,
            VerticalCheckpointReason.TopOfDescent,
            VerticalCheckpointReason.CrossingFcuAltitudeDescent,
            VerticalCheckpointReason.LevelOffForDescentConstraint,
            VerticalCheckpointReason.InterceptDescentProfileManaged,
            VerticalCheckpointReason.InterceptDescentProfileSelected,
            VerticalCheckpointReason.Decel,
            VerticalCheckpointReason.Flaps1,
            VerticalCheckpointReason.Flaps2,
            VerticalCheckpointReason.Flaps3,
            VerticalCheckpointReason.FlapsFull,
        ]);

        return this.checkpoints.filter((checkpoint) => CHECKPOINTS_TO_DRAW_ON_ND.has(checkpoint.reason));
    }

    getCheckpointsInMcdu(): VerticalCheckpoint[] {
        if (!this.isReadyToDisplay) {
            return [];
        }

        const CHECKPOINTS_TO_PUT_IN_MCDU = new Set([
            VerticalCheckpointReason.TopOfClimb,
            VerticalCheckpointReason.CrossingClimbSpeedLimit,

            VerticalCheckpointReason.StepClimb,
            VerticalCheckpointReason.StepDescent,

            // Descent
            VerticalCheckpointReason.TopOfDescent,
            VerticalCheckpointReason.CrossingDescentSpeedLimit,

            // Approach
            VerticalCheckpointReason.Decel,
            VerticalCheckpointReason.Flaps1,
            VerticalCheckpointReason.Flaps2,
            VerticalCheckpointReason.Flaps3,
            VerticalCheckpointReason.FlapsFull,
        ]);

        return this.checkpoints.filter((checkpoint) => CHECKPOINTS_TO_PUT_IN_MCDU.has(checkpoint.reason));
    }

    addPresentPositionCheckpoint(presentPosition: LatLongAlt, remainingFuelOnBoard: number) {
        this.checkpoints.push({
            reason: VerticalCheckpointReason.PresentPosition,
            distanceFromStart: this.distanceToPresentPosition,
            secondsFromPresent: 0,
            altitude: presentPosition.alt,
            remainingFuelOnBoard,
            speed: SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots'),
            mach: SimVar.GetSimVarValue('AIRSPEED MACH', 'number'),
        });
    }

    abstract resetAltitudeConstraints(): void;

    getRemainingFuelAtDestination(): Pounds | null {
        if (this.checkpoints.length < 1) {
            return null;
        }

        if (this.lastCheckpoint.reason !== VerticalCheckpointReason.Landing) {
            return null;
        }

        return this.lastCheckpoint.remainingFuelOnBoard;
    }

    getTimeToDestination(): Pounds | null {
        if (this.checkpoints.length < 1) {
            return null;
        }

        if (this.lastCheckpoint.reason !== VerticalCheckpointReason.Landing) {
            return null;
        }

        return this.lastCheckpoint.secondsFromPresent;
    }
}

type HasAtLeast<T, U extends keyof T> = Pick<T, U> & Partial<Omit<T, U>>

function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;

    while (l--) {
        if (predicate(array[l], l, array)) {
            return l;
        }
    }

    return -1;
}
