import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ConstraintReader } from '@fmgc/guidance/vnav/ConstraintReader';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlightPlans } from '@fmgc/flightplanning/FlightPlanManager';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { isAltitudeConstraintMet } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import {
    AltitudeConstraint,
    AltitudeConstraintType,
    getAltitudeConstraintFromWaypoint,
    getSpeedConstraintFromWaypoint,
    PathAngleConstraint,
    SpeedConstraint,
    SpeedConstraintType,
} from '../../lnav/legs';

// TODO: Merge this with VerticalCheckpoint
export interface VerticalWaypointPrediction {
    waypointIndex: number,
    distanceFromStart: NauticalMiles,
    secondsFromPresent: Seconds,
    altitude: Feet,
    speed: Knots | Mach,
    altitudeConstraint: AltitudeConstraint,
    speedConstraint: SpeedConstraint,
    isAltitudeConstraintMet: boolean,
    isSpeedConstraintMet: boolean,
    altError: number,
    distanceToTopOfDescent: NauticalMiles | null,
    estimatedFuelOnBoard: Pounds
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
    ContinueDescentArmed = 'ContinueDescentArmed',
    TopOfDescent = 'TopOfDescent',
    CrossingDescentSpeedLimit = 'CrossingDescentSpeedLimit',
    IdlePathAtmosphericConditions = 'IdlePathAtmosphericConditions',
    IdlePathEnd = 'IdlePathEnd',
    GeometricPathStart = 'GeometricPathStart',
    GeometricPathConstraint = 'GeometricPathConstraint',
    GeometricPathTooSteep = 'GeometricPathTooSteep',
    GeometricPathEnd = 'GeometricPathEnd',
    StartDecelerationToConstraint = 'StartDecelerationToConstraint',
    StartDecelerationToLimit = 'StartDecelerationToLimit',

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
    mach: Mach,
}

export interface VerticalCheckpointForDeceleration extends VerticalCheckpoint {
    targetSpeed: Knots
}

// I'm sure there's a better way to handle the distinction between `VerticalCheckpoint` and `VerticalCheckpointForDeceleration`
export function isSpeedChangePoint(checkpoint: VerticalCheckpoint): checkpoint is VerticalCheckpointForDeceleration {
    return checkpoint.reason === VerticalCheckpointReason.StartDecelerationToConstraint || checkpoint.reason === VerticalCheckpointReason.StartDecelerationToLimit;
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

export interface GeographicCruiseStep {
    distanceFromStart: NauticalMiles,
    toAltitude: Feet,
    waypointIndex: string,
    isIgnored: boolean,
}

export class NavGeometryProfile extends BaseGeometryProfile {
    public waypointPredictions: Map<number, VerticalWaypointPrediction> = new Map();

    constructor(
        public guidanceControler: GuidanceController,
        private constraintReader: ConstraintReader,
        private atmosphericConditions: AtmosphericConditions,
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

    override get cruiseSteps(): GeographicCruiseStep[] {
        return this.constraintReader.cruiseSteps;
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

    get finalDescentAngle(): Degrees {
        return this.constraintReader.finalDescentAngle;
    }

    get fafDistanceToEnd(): NauticalMiles {
        return this.constraintReader.fafDistanceToEnd;
    }

    addCheckpointFromLast(checkpointBuilder: (lastCheckpoint: VerticalCheckpoint) => Partial<VerticalCheckpoint>) {
        this.checkpoints.push({ ...this.lastCheckpoint, ...checkpointBuilder(this.lastCheckpoint) });
    }

    /**
     * This is used to display predictions in the MCDU
     */
    private computePredictionsAtWaypoints(): Map<number, VerticalWaypointPrediction> {
        const predictions = new Map<number, VerticalWaypointPrediction>();
        const fpm = this.guidanceControler.flightPlanManager;

        if (!this.isReadyToDisplay) {
            return predictions;
        }

        const topOfDescent = this.findVerticalCheckpoint(VerticalCheckpointReason.TopOfDescent);

        for (let i = this.guidanceControler.activeLegIndex - 1; i < fpm.getWaypointsCount(FlightPlans.Active); i++) {
            const waypoint = fpm.getWaypoint(i, FlightPlans.Active);
            if (!waypoint) {
                continue;
            }

            const distanceFromStart = this.getDistanceFromStart(waypoint.additionalData.distanceToEnd);
            const { secondsFromPresent, altitude, speed, mach, remainingFuelOnBoard } = this.interpolateEverythingFromStart(distanceFromStart);

            const altitudeConstraint = getAltitudeConstraintFromWaypoint(waypoint);
            const speedConstraint = getSpeedConstraintFromWaypoint(waypoint);

            predictions.set(i, {
                waypointIndex: i,
                distanceFromStart,
                secondsFromPresent,
                altitude,
                speed: this.atmosphericConditions.casOrMach(speed, mach, altitude),
                altitudeConstraint,
                isAltitudeConstraintMet: altitudeConstraint && isAltitudeConstraintMet(altitudeConstraint, altitude, 250),
                speedConstraint,
                isSpeedConstraintMet: this.isSpeedConstraintMet(speed, speedConstraint),
                altError: this.computeAltError(altitude, altitudeConstraint),
                distanceToTopOfDescent: topOfDescent ? topOfDescent.distanceFromStart - distanceFromStart : null,
                estimatedFuelOnBoard: remainingFuelOnBoard,
            });
        }

        return predictions;
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

    invalidate(): void {
        this.isReadyToDisplay = false;
        this.waypointPredictions = new Map();
    }

    getDistanceFromStart(distanceFromEnd: NauticalMiles): NauticalMiles {
        return this.constraintReader.totalFlightPlanDistance - distanceFromEnd;
    }

    override resetAltitudeConstraints() {
        this.constraintReader.climbAlitudeConstraints = [];
        this.constraintReader.descentAltitudeConstraints = [];
    }

    override resetSpeedConstraints() {
        this.constraintReader.climbSpeedConstraints = [];
        this.constraintReader.descentSpeedConstraints = [];
    }
}
