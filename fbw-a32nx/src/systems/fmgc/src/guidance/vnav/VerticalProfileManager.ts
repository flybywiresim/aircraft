import { DescentPathBuilder } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalMode, LateralMode, isArmed, ArmedVerticalMode } from '@shared/autopilot';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { CruisePathBuilder } from '@fmgc/guidance/vnav/cruise/CruisePathBuilder';
import { CruiseToDescentCoordinator } from '@fmgc/guidance/vnav/CruiseToDescentCoordinator';
import { McduSpeedProfile, ExpediteSpeedProfile, NdSpeedProfile, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { SelectedGeometryProfile } from '@fmgc/guidance/vnav/profile/SelectedGeometryProfile';
import { TakeoffPathBuilder } from '@fmgc/guidance/vnav/takeoff/TakeoffPathBuilder';
import { ClimbStrategy, ClimbThrustClimbStrategy, FlightPathAngleStrategy, VerticalSpeedStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { ConstraintReader } from '@fmgc/guidance/vnav/ConstraintReader';
import { FmgcFlightPhase } from '@shared/flightphase';
import { TacticalDescentPathBuilder } from '@fmgc/guidance/vnav/descent/TacticalDescentPathBuilder';
import { DescentStrategy, DesModeStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { ApproachPathBuilder } from '@fmgc/guidance/vnav/descent/ApproachPathBuilder';
import { WindProfileFactory } from '@fmgc/guidance/vnav/wind/WindProfileFactory';
import { NavHeadingProfile } from '@fmgc/guidance/vnav/wind/AircraftHeadingProfile';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { ProfileInterceptCalculator } from '@fmgc/guidance/vnav/descent/ProfileInterceptCalculator';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { AircraftToDescentProfileRelation } from '@fmgc/guidance/vnav/descent/AircraftToProfileRelation';
import {
    NavGeometryProfile,
    VerticalCheckpointForDeceleration,
    VerticalCheckpointReason,
} from './profile/NavGeometryProfile';
import { ClimbPathBuilder } from './climb/ClimbPathBuilder';

export class VerticalProfileManager {
    private takeoffPathBuilder: TakeoffPathBuilder;

    private climbPathBuilder: ClimbPathBuilder;

    private cruisePathBuilder: CruisePathBuilder;

    private tacticalDescentPathBuilder: TacticalDescentPathBuilder;

    private managedDescentPathBuilder: DescentPathBuilder;

    private approachPathBuilder: ApproachPathBuilder;

    private cruiseToDescentCoordinator: CruiseToDescentCoordinator;

    private fcuModes: FcuModeObserver;

    descentProfile: NavGeometryProfile | undefined;

    ndProfile: BaseGeometryProfile | undefined;

    mcduProfile: NavGeometryProfile | undefined;

    expediteProfile: SelectedGeometryProfile | undefined;

    constructor(
        private guidanceController: GuidanceController,
        private observer: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
        private constraintReader: ConstraintReader,
        private headingProfile: NavHeadingProfile,
        private windProfileFactory: WindProfileFactory,
        private aircraftToDescentProfileRelation: AircraftToDescentProfileRelation,
    ) {
        this.takeoffPathBuilder = new TakeoffPathBuilder(observer, this.atmosphericConditions);
        this.climbPathBuilder = new ClimbPathBuilder(observer, this.atmosphericConditions);
        this.cruisePathBuilder = new CruisePathBuilder(observer, this.atmosphericConditions);
        this.tacticalDescentPathBuilder = new TacticalDescentPathBuilder(this.observer, this.atmosphericConditions);
        this.managedDescentPathBuilder = new DescentPathBuilder(observer, this.atmosphericConditions);
        this.approachPathBuilder = new ApproachPathBuilder(observer, this.atmosphericConditions);
        this.cruiseToDescentCoordinator = new CruiseToDescentCoordinator(observer, this.cruisePathBuilder, this.managedDescentPathBuilder, this.approachPathBuilder);

        this.fcuModes = new FcuModeObserver(observer);
    }

    // PROFILE COMPUTATIONS

    computeTacticalMcduPath(): void {
        const { flightPhase, presentPosition, fuelOnBoard, approachSpeed, cruiseAltitude } = this.observer.get();

        const managedClimbStrategy = new ClimbThrustClimbStrategy(this.observer, this.atmosphericConditions);
        const stepDescentStrategy = new VerticalSpeedStrategy(this.observer, this.atmosphericConditions, -1000);

        const climbWinds = new HeadwindProfile(this.windProfileFactory.getClimbWinds(), this.headingProfile);
        const cruiseWinds = new HeadwindProfile(this.windProfileFactory.getCruiseWinds(), this.headingProfile);
        const descentWinds = new HeadwindProfile(this.windProfileFactory.getDescentWinds(), this.headingProfile);

        const mcduProfile = new NavGeometryProfile(
            this.guidanceController,
            this.constraintReader,
            this.atmosphericConditions,
        );

        const speedProfile = new McduSpeedProfile(this.observer,
            this.constraintReader.distanceToPresentPosition,
            this.constraintReader.climbSpeedConstraints,
            this.constraintReader.descentSpeedConstraints);

        if (flightPhase < FmgcFlightPhase.Climb) {
            this.takeoffPathBuilder.buildTakeoffPath(mcduProfile);
        } else {
            mcduProfile.addPresentPositionCheckpoint(presentPosition, fuelOnBoard, this.getManagedMachTarget(), this.getVman(approachSpeed));
        }

        if (flightPhase < FmgcFlightPhase.Cruise) {
            this.climbPathBuilder.computeClimbPath(mcduProfile, managedClimbStrategy, speedProfile, climbWinds, cruiseAltitude);
        }

        if (this.aircraftToDescentProfileRelation.isValid
            && (flightPhase >= FmgcFlightPhase.Descent && flightPhase <= FmgcFlightPhase.Approach || this.aircraftToDescentProfileRelation.isPastTopOfDescent())
        ) {
            const offset = this.computeTacticalToGuidanceProfileOffset();
            const forcedDecelerations = this.getForcedDecelerationsFromDescentPath(offset);
            const finalDistance = this.constraintReader.totalFlightPlanDistance;

            this.tacticalDescentPathBuilder.buildMcduPredictionPath(mcduProfile, this.getDesModeStrategy(), speedProfile, descentWinds, finalDistance, forcedDecelerations);
        } else if (this.cruiseToDescentCoordinator.canCompute(mcduProfile)) {
            this.cruiseToDescentCoordinator.buildCruiseAndDescentPath(mcduProfile, speedProfile, cruiseWinds, descentWinds, managedClimbStrategy, stepDescentStrategy);
        }

        this.mcduProfile = mcduProfile;
        this.mcduProfile.finalizeProfile();
    }

    computeDescentPath(): void {
        const descentProfile = new NavGeometryProfile(
            this.guidanceController,
            this.constraintReader,
            this.atmosphericConditions,
        );

        const speedProfile = new McduSpeedProfile(this.observer,
            this.constraintReader.distanceToPresentPosition,
            this.constraintReader.climbSpeedConstraints,
            this.constraintReader.descentSpeedConstraints);

        const descentWinds = new HeadwindProfile(this.windProfileFactory.getDescentWinds(), this.headingProfile);

        const { estimatedDestinationFuel } = this.observer.get();
        // Use INIT FUEL PRED entry as initial estimate for destination EFOB. Clamp it to avoid unrealistic entries from erroneous pilot input.
        const fuelEstimation = Number.isFinite(estimatedDestinationFuel) ? Math.min(Math.max(estimatedDestinationFuel, 0), 40000) : 4000;
        const finalCruiseAltitude = this.cruisePathBuilder.getFinalCruiseAltitude(descentProfile.cruiseSteps);

        const sequence = this.approachPathBuilder.computeApproachPath(descentProfile, speedProfile, descentWinds, fuelEstimation, 0);
        this.managedDescentPathBuilder.computeManagedDescentPath(sequence, descentProfile, speedProfile, descentWinds, finalCruiseAltitude);

        descentProfile.checkpoints.push(...sequence.get(true).reverse());

        this.descentProfile = descentProfile;
        this.descentProfile.finalizeProfile();
    }

    private computeVerticalProfileForExpediteClimb(): void {
        try {
            const { approachSpeed, fcuAltitude, presentPosition, fuelOnBoard, managedClimbSpeedMach } = this.observer.get();

            // TODO: I wonder where GD speed comes from IRL. Should probably be an FMGC computation rather than FAC since it's just for predictions
            const greenDotSpeed = Simplane.getGreenDotSpeed();
            if (!greenDotSpeed) {
                return;
            }

            const selectedSpeedProfile = new ExpediteSpeedProfile(greenDotSpeed);
            this.expediteProfile = new SelectedGeometryProfile();
            const climbStrategy = new ClimbThrustClimbStrategy(this.observer, this.atmosphericConditions);
            const climbWinds = new HeadwindProfile(this.windProfileFactory.getClimbWinds(), this.headingProfile);

            this.expediteProfile.addPresentPositionCheckpoint(presentPosition, fuelOnBoard, managedClimbSpeedMach, this.getVman(approachSpeed));
            this.climbPathBuilder.computeClimbPath(this.expediteProfile, climbStrategy, selectedSpeedProfile, climbWinds, fcuAltitude);

            this.expediteProfile.finalizeProfile();
        } catch (e) {
            console.error(e);
            this.expediteProfile = new SelectedGeometryProfile();
        }
    }

    /**
     * Build a path from the present position to the FCU altitude
     */
    computeTacticalNdProfile(): void {
        const { fcuAltitude, cleanSpeed, presentPosition, fuelOnBoard, approachSpeed } = this.observer.get();

        const ndProfile = this.fcuModes.isLatAutoControlActive()
            ? new NavGeometryProfile(this.guidanceController, this.constraintReader, this.atmosphericConditions)
            : new SelectedGeometryProfile();

        let speedProfile: SpeedProfile;
        if (this.fcuModes.isExpediteModeActive()) {
            speedProfile = new ExpediteSpeedProfile(cleanSpeed);
        } else if (this.fcuModes.isSpeedAutoControlActive()) {
            speedProfile = new McduSpeedProfile(
                this.observer, this.constraintReader.distanceToPresentPosition, this.constraintReader.climbSpeedConstraints, this.constraintReader.descentSpeedConstraints,
            );
        } else {
            speedProfile = new NdSpeedProfile(
                this.observer, this.constraintReader.distanceToPresentPosition, this.constraintReader.climbSpeedConstraints, this.constraintReader.descentSpeedConstraints,
            );
        }

        // TODO: Handle Takeoff and Go arounds

        ndProfile.addPresentPositionCheckpoint(presentPosition, fuelOnBoard, this.getManagedMachTarget(), this.getVman(approachSpeed));

        // Build path to FCU altitude
        if (this.fcuModes.isInTakeoffMode() || this.fcuModes.isInClimbingMode()) {
            const climbStrategy = this.getClimbStrategyForVerticalMode();
            const climbWinds = new HeadwindProfile(this.windProfileFactory.getClimbWinds(), this.headingProfile);

            this.climbPathBuilder.computeClimbPath(ndProfile, climbStrategy, speedProfile, climbWinds, fcuAltitude);
        } else if (this.fcuModes.isInDescentMode()) {
            const descentStrategy = this.getDescentStrategyForVerticalMode();
            const descentWinds = new HeadwindProfile(this.windProfileFactory.getDescentWinds(), this.headingProfile);
            const offset = this.computeTacticalToGuidanceProfileOffset();
            const forcedDecelerations = this.getForcedDecelerationsFromDescentPath(offset);

            this.tacticalDescentPathBuilder.buildTacticalDescentPathToAltitude(ndProfile, descentStrategy, speedProfile, descentWinds, fcuAltitude, forcedDecelerations);

            this.interceptNdWithGuidanceProfile();
            this.insertLevelSegmentPwp();
            this.insertNextDescentPwp();
        }

        ndProfile.finalizeProfile();
        this.ndProfile = ndProfile;
    }

    /**
     * Computes an intercept point between the profile that's predicted in the currently active modes and the precomputed descent profile.
     */
    private interceptNdWithGuidanceProfile(): void {
        const { flightPhase, fcuVerticalMode, fcuArmedVerticalMode, presentPosition, fcuAltitude } = this.observer.get();
        if (!this.descentProfile || !this.ndProfile
            || flightPhase !== FmgcFlightPhase.Descent && flightPhase !== FmgcFlightPhase.Approach) {
            return;
        }

        const offset = this.computeTacticalToGuidanceProfileOffset();
        const [index, interceptDistance] = ProfileInterceptCalculator.calculateIntercept(this.ndProfile.checkpoints, this.descentProfile.checkpoints, offset);

        if (index < 0) {
            return;
        }

        const isDesActive = fcuVerticalMode === VerticalMode.DES;
        const isDesArmed = isArmed(fcuArmedVerticalMode, ArmedVerticalMode.DES);

        const interceptReason = isDesActive ? VerticalCheckpointReason.InterceptDescentProfileManaged : VerticalCheckpointReason.InterceptDescentProfileSelected;
        // Insert intercept point
        const interceptCheckpoint = this.ndProfile.addInterpolatedCheckpoint(interceptDistance, { reason: interceptReason });

        const isAircraftTooCloseToIntercept = Math.abs(presentPosition.alt - interceptCheckpoint.altitude) < 100;
        if (isAircraftTooCloseToIntercept) {
            // If we're close to the intercept, we don't want to draw the intercept point, so use a reason that does not create a PWP
            interceptCheckpoint.reason = VerticalCheckpointReason.AtmosphericConditions;
        }

        if (isDesActive || isDesArmed) {
            this.ndProfile.checkpoints.splice(
                index,
                Infinity,
                ...this.descentProfile.checkpoints.map(
                    (checkpoint) => ({ ...checkpoint, reason: VerticalCheckpointReason.AtmosphericConditions, distanceFromStart: checkpoint.distanceFromStart + offset }),
                ),
            );

            const levelOffDistance = this.ndProfile.interpolateDistanceAtAltitudeBackwards(fcuAltitude, true);
            this.ndProfile.addInterpolatedCheckpoint(levelOffDistance, { reason: VerticalCheckpointReason.CrossingFcuAltitudeDescent });
        }
    }

    /**
     * Find level segments in ND profile and add magenta arrows to them.
     */
    private insertLevelSegmentPwp(): void {
        const { flightPhase, fcuArmedVerticalMode, presentPosition } = this.observer.get();
        if (!this.descentProfile || !this.ndProfile
            || flightPhase !== FmgcFlightPhase.Descent && flightPhase !== FmgcFlightPhase.Approach) {
            return;
        }

        const currentAlt = presentPosition.alt;
        const isDescentArmed = isArmed(fcuArmedVerticalMode, ArmedVerticalMode.DES) || isArmed(fcuArmedVerticalMode, ArmedVerticalMode.FINAL);
        const isInLevelFlight = this.fcuModes.isInLevelFlightMode();

        let constraintAlt: Feet = -Infinity;
        // Find next descent segment
        for (let i = 1; i < this.ndProfile.checkpoints.length; i++) {
            const checkpoint = this.ndProfile.checkpoints[i];
            if (checkpoint.reason === VerticalCheckpointReason.LevelOffForDescentConstraint) {
                // This removes the magenta arrow if we're closer than 100 ft. (I have a reference for that)
                if (currentAlt - checkpoint.altitude < 100) {
                    checkpoint.reason = VerticalCheckpointReason.AtmosphericConditions;
                } else {
                    constraintAlt = Math.round(checkpoint.altitude);
                }
            }

            const previousCheckpoint = this.ndProfile.checkpoints[i - 1];
            // Either in level flight and DES armed or in descent and checkpoint under cstr alt found
            if (isInLevelFlight && isDescentArmed && currentAlt - checkpoint.altitude > 100 || constraintAlt - checkpoint.altitude > 100) {
                this.ndProfile.addInterpolatedCheckpoint(
                    previousCheckpoint.distanceFromStart, { reason: VerticalCheckpointReason.ContinueDescentArmed },
                );

                break;
            }
        }
    }

    /**
     * Insert a T/D checkpoint into the ND profile where we want to start the descent from FCU altitude
     */
    private insertNextDescentPwp(): void {
        const { flightPhase, fcuAltitude } = this.observer.get();
        if (!this.ndProfile || flightPhase !== FmgcFlightPhase.Descent && flightPhase !== FmgcFlightPhase.Approach) {
            return;
        }

        let levelOffDistance = 0;

        // Find next descent segment
        for (let i = 1; i < this.ndProfile.checkpoints.length; i++) {
            const checkpoint = this.ndProfile.checkpoints[i];
            const previousCheckpoint = this.ndProfile.checkpoints[i - 1];

            if (checkpoint.reason === VerticalCheckpointReason.CrossingFcuAltitudeDescent) {
                levelOffDistance = previousCheckpoint.distanceFromStart;
            }

            if (checkpoint.reason === VerticalCheckpointReason.ContinueDescentArmed) {
                return;
            }

            // `checkpoint.altitude - fcuAltitude >= -100` works like this: If you have a constraint at 4450 feet causing a level segment,
            // but you set the FCU altitude to 4500 ft, then the continue descent arrow should be drawn where you continue the descent from 4450 ft
            // I have evidence of this somewhere.
            if (checkpoint.altitude - fcuAltitude >= -100) {
                continue;
            }

            this.ndProfile.addInterpolatedCheckpoint(
                Math.max(levelOffDistance, previousCheckpoint.distanceFromStart), { reason: VerticalCheckpointReason.ContinueDescent },
            );

            return;
        }
    }

    // INTERNAL HELPERS

    private getClimbStrategyForVerticalMode(): ClimbStrategy {
        const { fcuVerticalMode, fcuVerticalSpeed, fcuFlightPathAngle } = this.observer.get();

        if (fcuVerticalMode === VerticalMode.VS) {
            return new VerticalSpeedStrategy(this.observer, this.atmosphericConditions, Math.max(0, fcuVerticalSpeed));
        } if (fcuVerticalMode === VerticalMode.FPA) {
            return new FlightPathAngleStrategy(this.observer, this.atmosphericConditions, Math.max(0, fcuFlightPathAngle));
        }

        return new ClimbThrustClimbStrategy(this.observer, this.atmosphericConditions);
    }

    private getDescentStrategyForVerticalMode(): DescentStrategy {
        const { fcuVerticalMode, fcuVerticalSpeed, fcuFlightPathAngle } = this.observer.get();

        if (fcuVerticalMode === VerticalMode.VS) {
            return new VerticalSpeedStrategy(this.observer, this.atmosphericConditions, Math.min(0, fcuVerticalSpeed));
        } if (fcuVerticalMode === VerticalMode.FPA) {
            return new FlightPathAngleStrategy(this.observer, this.atmosphericConditions, Math.min(0, fcuFlightPathAngle));
        } if (fcuVerticalMode === VerticalMode.OP_DES) {
            return new IdleDescentStrategy(this.observer, this.atmosphericConditions);
        }

        // DES
        if (!this.aircraftToDescentProfileRelation.isValid) {
            return new IdleDescentStrategy(this.observer, this.atmosphericConditions);
        }

        return this.getDesModeStrategy();
    }

    /**
     * Important: Make sure the descent profile is valid before calling this method.
     * Figures out what descent strategy to use in DES mode based on whether we're above or below the descent profile.
     * @returns The descent strategy to use
     */
    private getDesModeStrategy(): DescentStrategy {
        const linearDeviation = this.aircraftToDescentProfileRelation.computeLinearDeviation();

        if (linearDeviation > 0 && this.aircraftToDescentProfileRelation.isPastTopOfDescent()) {
            return DesModeStrategy.aboveProfile(this.observer, this.atmosphericConditions);
        } if (this.aircraftToDescentProfileRelation.isOnGeometricPath()) {
            const fpaTarget = this.aircraftToDescentProfileRelation.currentTargetPathAngle() / 2;
            return DesModeStrategy.belowProfileFpa(this.observer, this.atmosphericConditions, fpaTarget);
        }

        const vsTarget = this.aircraftToDescentProfileRelation.isAboveSpeedLimitAltitude() && !this.aircraftToDescentProfileRelation.isCloseToAirfieldElevation() ? -1000 : -500;
        return DesModeStrategy.belowProfileVs(
            this.observer, this.atmosphericConditions, vsTarget,
        );
    }

    private getVman(vApp: Knots): Knots {
        // TODO: I wonder where these speeds come from IRL. It's probably the FAC.
        switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
        case 0: return SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
        case 1: return SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
        case 2: return SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
        case 3:
        case 4:
            return vApp;
        default:
            return SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');
        }
    }

    private getForcedDecelerationsFromDescentPath(offset: NauticalMiles): VerticalCheckpointForDeceleration[] {
        if (!this.descentProfile) {
            return [];
        }

        return this.descentProfile.checkpoints.filter(
            (c) => c.reason === VerticalCheckpointReason.StartDecelerationToConstraint || c.reason === VerticalCheckpointReason.StartDecelerationToLimit,
        ).map((c: VerticalCheckpointForDeceleration) => ({ ...c, distanceFromStart: c.distanceFromStart + offset }));
    }

    private computeTacticalToGuidanceProfileOffset(): NauticalMiles {
        // TODO
        if (!this.descentProfile) {
            return 0;
        }

        return 0;
    }

    private getManagedMachTarget() {
        const { flightPhase, managedClimbSpeedMach, managedCruiseSpeedMach, managedDescentSpeedMach } = this.observer.get();

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

class FcuModeObserver {
    private LAT_AUTO_CONTROL_MODES: LateralMode[] = [LateralMode.NAV, LateralMode.LOC_CPT, LateralMode.LOC_TRACK, LateralMode.RWY];

    private VERT_CLIMB_MODES: VerticalMode[] = [VerticalMode.CLB, VerticalMode.OP_CLB, VerticalMode.SRS, VerticalMode.SRS_GA];

    private VERT_DESCENT_MODES: VerticalMode[] = [VerticalMode.DES, VerticalMode.OP_DES];

    private VERT_LEVEL_MODES: VerticalMode[] = [VerticalMode.ALT, VerticalMode.ALT_CPT, VerticalMode.ALT_CST, VerticalMode.ALT_CST_CPT];

    constructor(private readonly observer: VerticalProfileComputationParametersObserver) {

    }

    public isLatAutoControlActive(): boolean {
        return this.LAT_AUTO_CONTROL_MODES.includes(this.observer.get().fcuLateralMode);
    }

    public isSpeedAutoControlActive(): boolean {
        return this.observer.get().fcuSpeedManaged;
    }

    public isInTakeoffMode(): boolean {
        const { fcuVerticalMode } = this.observer.get();

        return fcuVerticalMode === VerticalMode.SRS;
    }

    public isInClimbingMode(): boolean {
        const { fcuVerticalMode, fcuVerticalSpeed, fcuFlightPathAngle } = this.observer.get();

        return this.VERT_CLIMB_MODES.includes(fcuVerticalMode) || fcuVerticalMode === VerticalMode.FPA && fcuFlightPathAngle > 0 || fcuVerticalMode === VerticalMode.VS && fcuVerticalSpeed > 0;
    }

    public isInDescentMode(): boolean {
        const { fcuVerticalMode, fcuVerticalSpeed, fcuFlightPathAngle } = this.observer.get();

        return this.VERT_DESCENT_MODES.includes(fcuVerticalMode)
            || fcuVerticalMode === VerticalMode.FPA && fcuFlightPathAngle < 0 || fcuVerticalMode === VerticalMode.VS && fcuVerticalSpeed < 0;
    }

    public isInLevelFlightMode(): boolean {
        const { fcuVerticalMode, fcuVerticalSpeed, fcuFlightPathAngle } = this.observer.get();

        return this.VERT_LEVEL_MODES.includes(fcuVerticalMode)
            || fcuVerticalMode === VerticalMode.FPA && Math.abs(fcuFlightPathAngle) < 10 || fcuVerticalMode === VerticalMode.VS && Math.abs(fcuVerticalSpeed) < 10;
    }

    public isExpediteModeActive(): boolean {
        return this.observer.get().fcuExpediteModeActive;
    }

    public isInGoAroundMode(): boolean {
        const { fcuVerticalMode } = this.observer.get();

        return fcuVerticalMode === VerticalMode.SRS_GA;
    }
}
