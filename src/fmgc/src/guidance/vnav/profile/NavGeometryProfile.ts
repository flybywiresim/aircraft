import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ConstraintReader } from '@fmgc/guidance/vnav/ConstraintReader';
import { Geometry } from '../../Geometry';
import { AltitudeConstraint, AltitudeConstraintType, PathAngleConstraint, SpeedConstraint, SpeedConstraintType } from '../../lnav/legs';

// TODO: Merge this with VerticalCheckpoint
export interface VerticalWaypointPrediction {
    waypointIndex: number,
    distanceFromStart: NauticalMiles,
    secondsFromPresent: Seconds,
    altitude: Feet,
    speed: Knots,
    altitudeConstraint: AltitudeConstraint,
    speedConstraint: SpeedConstraint,
    isAltitudeConstraintMet: boolean,
    isSpeedConstraintMet: boolean,
    altError: number,
    distanceToTopOfDescent: NauticalMiles | null,
}

export enum VerticalCheckpointReason {
    Liftoff = 'Liftoff',
    ThrustReductionAltitude = 'ThrustReductionAltitude',
    AccelerationAltitude = 'AccelerationAltitude',
    TopOfClimb = 'TopOfClimb',
    AtmosphericConditions = 'AtmosphericConditions',
    PresentPosition = 'PresentPosition',
    LevelOffForClimbConstraint = 'LevelOffForClimbConstraint',
    AltitudeConstraint = 'AltitudeConstraint',
    ContinueClimb = 'ContinueClimb',
    CrossingClimbSpeedLimit = 'CrossingClimbSpeedLimit',
    SpeedConstraint = 'SpeedConstraint',
    CrossingFcuAltitudeClimb = 'FcuAltitudeClimb',

    // Cruise
    StepClimb = 'StepClimb',
    TopOfStepClimb = 'TopOfStepClimb',
    StepDescent = 'StepDescent',
    BottomOfStepDescent = 'BottomOfStepDescent', // I don't think this actually exists?

    // Descent
    CrossingFcuAltitudeDescent = 'FcuAltitudeDescent',
    InterceptDescentProfileManaged = 'InterceptDescentProfileManaged',
    InterceptDescentProfileSelected = 'InterceptDescentProfileSelected',
    LevelOffForDescentConstraint = 'LevelOffForDescentConstraint',
    ContinueDescent = 'ContinueDescent',
    TopOfDescent = 'TopOfDescent',
    CrossingDescentSpeedLimit = 'CrossingDescentSpeedLimit',
    IdlePathAtmosphericConditions = 'IdlePathAtmosphericConditions',
    IdlePathEnd = 'IdlePathEnd',
    GeometricPathStart = 'GeometricPathStart',
    GeometricPathConstraint = 'GeometricPathConstraint',
    GeometricPathTooSteep = 'GeometricPathTooSteep',
    GeometricPathEnd = 'GeometricPathEnd',

    // Approach
    Decel = 'Decel',
    Flaps1 = 'Flaps1',
    Flaps2 = 'Flaps2',
    Flaps3 = 'Flaps3',
    FlapsFull = 'FlapsFull',
    Landing = 'Landing',
}

export interface VerticalCheckpoint {
    reason: VerticalCheckpointReason,
    distanceFromStart: NauticalMiles,
    secondsFromPresent: Seconds,
    altitude: Feet,
    remainingFuelOnBoard: number,
    speed: Knots,
}

export interface MaxAltitudeConstraint {
    distanceFromStart: NauticalMiles,
    maxAltitude: Feet,
}

export interface MaxSpeedConstraint {
    distanceFromStart: NauticalMiles,
    maxSpeed: Feet,
}

export interface DescentAltitudeConstraint {
    distanceFromStart: NauticalMiles,
    constraint: AltitudeConstraint,
}

export interface ApproachPathAngleConstraint {
    distanceFromStart: NauticalMiles,
    pathAngle: PathAngleConstraint,
}

export class NavGeometryProfile extends BaseGeometryProfile {
    public waypointPredictions: Map<number, VerticalWaypointPrediction> = new Map();

    constructor(
        public geometry: Geometry,
        private constraintReader: ConstraintReader,
        public waypointCount: number,
    ) {
        super();
    }

    override get maxAltitudeConstraints(): MaxAltitudeConstraint[] {
        return this.constraintReader.climbAlitudeConstraints;
    }

    override get descentAltitudeConstraints(): DescentAltitudeConstraint[] {
        return this.constraintReader.descentAltitudeConstraints;
    }

    override get maxClimbSpeedConstraints(): MaxSpeedConstraint[] {
        return this.constraintReader.climbSpeedConstraints;
    }

    override get descentSpeedConstraints(): MaxSpeedConstraint[] {
        return this.constraintReader.descentSpeedConstraints;
    }

    override get distanceToPresentPosition(): number {
        return this.constraintReader.distanceToPresentPosition;
    }

    get totalFlightPlanDistance(): number {
        return this.constraintReader.totalFlightPlanDistance;
    }

    get lastCheckpoint(): VerticalCheckpoint | null {
        if (this.checkpoints.length < 1) {
            return null;
        }

        return this.checkpoints[this.checkpoints.length - 1];
    }

    addCheckpointFromLast(checkpointBuilder: (lastCheckpoint: VerticalCheckpoint) => Partial<VerticalCheckpoint>) {
        this.checkpoints.push({ ...this.lastCheckpoint, ...checkpointBuilder(this.lastCheckpoint) });
    }

    /**
     * This is used to display predictions in the MCDU
     */
    private computePredictionsAtWaypoints(): Map<number, VerticalWaypointPrediction> {
        const predictions = new Map<number, VerticalWaypointPrediction>();

        if (!this.isReadyToDisplay) {
            return predictions;
        }

        let totalDistance = 0;

        const topOfDescent = this.findVerticalCheckpoint(VerticalCheckpointReason.TopOfDescent);

        for (let i = 0; i < this.waypointCount; i++) {
            const leg = this.geometry.legs.get(i);
            if (!leg) {
                continue;
            }

            const inboundTransition = this.geometry.transitions.get(i - 1);

            totalDistance += Geometry.completeLegPathLengths(
                leg, (inboundTransition?.isNull || !inboundTransition?.isComputed) ? null : inboundTransition, this.geometry.transitions.get(i),
            ).reduce((sum, el) => sum + (!Number.isNaN(el) ? el : 0), 0);

            const { secondsFromPresent, altitude, speed } = this.interpolateEverythingFromStart(totalDistance);

            predictions.set(i, {
                waypointIndex: i,
                distanceFromStart: totalDistance,
                secondsFromPresent,
                altitude,
                speed,
                altitudeConstraint: leg.metadata.altitudeConstraint,
                isAltitudeConstraintMet: this.isAltitudeConstraintMet(altitude, leg.metadata.altitudeConstraint),
                speedConstraint: leg.metadata.speedConstraint,
                isSpeedConstraintMet: this.isSpeedConstraintMet(speed, leg.metadata.speedConstraint),
                altError: this.computeAltError(altitude, leg.metadata.altitudeConstraint),
                distanceToTopOfDescent: topOfDescent ? topOfDescent.distanceFromStart - totalDistance : null,
            });
        }

        return predictions;
    }

    override findDistancesToSpeedChanges(): NauticalMiles[] {
        const result = [];

        const checkpointBlacklist = [
            VerticalCheckpointReason.AccelerationAltitude,
            VerticalCheckpointReason.PresentPosition,
            VerticalCheckpointReason.CrossingFcuAltitudeClimb,
            VerticalCheckpointReason.CrossingFcuAltitudeDescent,
        ];

        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            const checkpoint = this.checkpoints[i];

            if (checkpointBlacklist.includes(checkpoint.reason)) {
                continue;
            }

            if (this.checkpoints[i + 1].speed - checkpoint.speed > 5) {
                result.push(checkpoint.distanceFromStart);
            }
        }

        return result;
    }

    private isAltitudeConstraintMet(altitude: Feet, constraint?: AltitudeConstraint): boolean {
        if (!constraint) {
            return true;
        }

        switch (constraint.type) {
        case AltitudeConstraintType.at:
            return Math.abs(altitude - constraint.altitude1) < 250;
        case AltitudeConstraintType.atOrAbove:
            return (altitude - constraint.altitude1) > -250;
        case AltitudeConstraintType.atOrBelow:
            return (altitude - constraint.altitude1) < 250;
        case AltitudeConstraintType.range:
            return (altitude - constraint.altitude2) > -250 && (altitude - constraint.altitude1) < 250;
        default:
            console.error('Invalid altitude constraint type');
            return null;
        }
    }

    private isSpeedConstraintMet(speed: Knots, constraint?: SpeedConstraint): boolean {
        if (!constraint) {
            return true;
        }

        switch (constraint.type) {
        case SpeedConstraintType.at:
            return Math.abs(speed - constraint.speed) < 5;
        case SpeedConstraintType.atOrBelow:
            return speed - constraint.speed < 5;
        case SpeedConstraintType.atOrAbove:
            return speed - constraint.speed > -5;
        default:
            console.error('Invalid speed constraint type');
            return null;
        }
    }

    private computeAltError(predictedAltitude: Feet, constraint?: AltitudeConstraint): number {
        if (!constraint) {
            return 0;
        }

        switch (constraint.type) {
        case AltitudeConstraintType.at:
            return predictedAltitude - constraint.altitude1;
        case AltitudeConstraintType.atOrAbove:
            return Math.min(predictedAltitude - constraint.altitude1, 0);
        case AltitudeConstraintType.atOrBelow:
            return Math.max(predictedAltitude - constraint.altitude1, 0);
        case AltitudeConstraintType.range:
            if (predictedAltitude >= constraint.altitude1) {
                return predictedAltitude - constraint.altitude1;
            } if (predictedAltitude <= constraint.altitude2) {
                return predictedAltitude - constraint.altitude1;
            }

            return 0;
        default:
            console.error('Invalid altitude constraint type');
            return 0;
        }
    }

    override finalizeProfile(): void {
        super.finalizeProfile();

        this.waypointPredictions = this.computePredictionsAtWaypoints();
    }

    getDistanceFromStart(distanceFromEnd: NauticalMiles): NauticalMiles {
        return this.constraintReader.totalFlightPlanDistance - distanceFromEnd;
    }

    override resetAltitudeConstraints() {
        this.constraintReader.resetAltitudeConstraints();
    }
}
