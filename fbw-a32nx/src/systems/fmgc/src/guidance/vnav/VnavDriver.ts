//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DescentPathBuilder } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { CoarsePredictions } from '@fmgc/guidance/vnav/CoarsePredictions';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { VerticalMode, ArmedLateralMode, ArmedVerticalMode, isArmed, LateralMode } from '@shared/autopilot';
import { PseudoWaypointFlightPlanInfo } from '@fmgc/guidance/PseudoWaypoint';
import { VerticalProfileComputationParameters, VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { CruisePathBuilder } from '@fmgc/guidance/vnav/cruise/CruisePathBuilder';
import { CruiseToDescentCoordinator } from '@fmgc/guidance/vnav/CruiseToDescentCoordinator';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { McduSpeedProfile, ExpediteSpeedProfile, NdSpeedProfile, ManagedSpeedType } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { SelectedGeometryProfile } from '@fmgc/guidance/vnav/profile/SelectedGeometryProfile';
import { BaseGeometryProfile, PerfCrzToPrediction } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { TakeoffPathBuilder } from '@fmgc/guidance/vnav/takeoff/TakeoffPathBuilder';
import { ClimbThrustClimbStrategy, FlightPathAngleStrategy, VerticalSpeedStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { ConstraintReader } from '@fmgc/guidance/vnav/ConstraintReader';
import { FmgcFlightPhase } from '@shared/flightphase';
import { TacticalDescentPathBuilder } from '@fmgc/guidance/vnav/descent/TacticalDescentPathBuilder';
import { DescentStrategy, DesModeStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { LatchedDescentGuidance } from '@fmgc/guidance/vnav/descent/LatchedDescentGuidance';
import { DescentGuidance } from '@fmgc/guidance/vnav/descent/DescentGuidance';
import { ProfileInterceptCalculator } from '@fmgc/guidance/vnav/descent/ProfileInterceptCalculator';
import { ApproachPathBuilder } from '@fmgc/guidance/vnav/descent/ApproachPathBuilder';
import { AircraftToDescentProfileRelation } from '@fmgc/guidance/vnav/descent/AircraftToProfileRelation';
import { WindProfileFactory } from '@fmgc/guidance/vnav/wind/WindProfileFactory';
import { NavHeadingProfile } from '@fmgc/guidance/vnav/wind/AircraftHeadingProfile';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Geometry } from '../Geometry';
import { GuidanceComponent } from '../GuidanceComponent';
import {
    isSpeedChangePoint,
    NavGeometryProfile,
    VerticalCheckpoint,
    VerticalCheckpointForDeceleration,
    VerticalCheckpointReason,
    VerticalWaypointPrediction,
} from './profile/NavGeometryProfile';
import { ClimbPathBuilder } from './climb/ClimbPathBuilder';

export class VnavDriver implements GuidanceComponent {
    version: number = 0;

    private takeoffPathBuilder: TakeoffPathBuilder;

    private climbPathBuilder: ClimbPathBuilder;

    private cruisePathBuilder: CruisePathBuilder;

    private tacticalDescentPathBuilder: TacticalDescentPathBuilder;

    private managedDescentPathBuilder: DescentPathBuilder;

    private approachPathBuilder: ApproachPathBuilder;

    private cruiseToDescentCoordinator: CruiseToDescentCoordinator;

    currentNavGeometryProfile: NavGeometryProfile;

    currentNdGeometryProfile?: BaseGeometryProfile;

    // eslint-disable-next-line camelcase
    private coarsePredictionsUpdate = new A32NX_Util.UpdateThrottler(5000);

    currentMcduSpeedProfile: McduSpeedProfile;

    timeMarkers = new Map<Seconds, PseudoWaypointFlightPlanInfo | undefined>()

    private constraintReader: ConstraintReader;

    private aircraftToDescentProfileRelation: AircraftToDescentProfileRelation;

    private descentGuidance: DescentGuidance | LatchedDescentGuidance;

    private headingProfile: NavHeadingProfile;

    constructor(
        private readonly guidanceController: GuidanceController,
        private readonly computationParametersObserver: VerticalProfileComputationParametersObserver,
        private readonly atmosphericConditions: AtmosphericConditions,
        private readonly windProfileFactory: WindProfileFactory,
        private readonly flightPlanManager: FlightPlanManager,
    ) {
        this.headingProfile = new NavHeadingProfile(flightPlanManager);
        this.currentMcduSpeedProfile = new McduSpeedProfile(this.computationParametersObserver, 0, [], []);

        this.takeoffPathBuilder = new TakeoffPathBuilder(computationParametersObserver, this.atmosphericConditions);
        this.climbPathBuilder = new ClimbPathBuilder(computationParametersObserver, this.atmosphericConditions);
        this.cruisePathBuilder = new CruisePathBuilder(computationParametersObserver, this.atmosphericConditions);
        this.tacticalDescentPathBuilder = new TacticalDescentPathBuilder(this.computationParametersObserver, this.atmosphericConditions);
        this.managedDescentPathBuilder = new DescentPathBuilder(computationParametersObserver, this.atmosphericConditions);
        this.approachPathBuilder = new ApproachPathBuilder(computationParametersObserver, this.atmosphericConditions);
        this.cruiseToDescentCoordinator = new CruiseToDescentCoordinator(computationParametersObserver, this.cruisePathBuilder, this.managedDescentPathBuilder, this.approachPathBuilder);

        this.constraintReader = new ConstraintReader(guidanceController);

        this.aircraftToDescentProfileRelation = new AircraftToDescentProfileRelation(this.computationParametersObserver);
        this.descentGuidance = VnavConfig.VNAV_USE_LATCHED_DESCENT_MODE
            ? new LatchedDescentGuidance(this.guidanceController, this.aircraftToDescentProfileRelation, computationParametersObserver, this.atmosphericConditions)
            : new DescentGuidance(this.guidanceController, this.aircraftToDescentProfileRelation, computationParametersObserver, this.atmosphericConditions);
    }

    init(): void {
        console.log('[FMGC/Guidance] VnavDriver initialized!');
    }

    acceptMultipleLegGeometry(geometry: Geometry) {
        this.recompute(geometry);
    }

    private lastParameters: VerticalProfileComputationParameters = null;

    // Here, we keep a copy of the whatever legs we used to update the descent profile last. We compare it with the legs we get from any new geometries to figure out
    // if the descent profile should be recomputed.
    private oldLegs: Map<number, Leg> = new Map();

    private requestDescentProfileRecomputation: boolean = false;

    update(deltaTime: number): void {
        try {
            const { presentPosition, flightPhase } = this.computationParametersObserver.get();

            if (this.coarsePredictionsUpdate.canUpdate(deltaTime) !== -1) {
                CoarsePredictions.updatePredictions(this.guidanceController, this.atmosphericConditions);
            }

            if (flightPhase >= FmgcFlightPhase.Takeoff) {
                this.constraintReader.updateDistanceToEnd(presentPosition);
                this.updateTimeMarkers();
                this.updateHoldSpeed();
                this.updateDescentSpeedGuidance();
                this.descentGuidance.update(deltaTime, this.constraintReader.distanceToEnd);
            }
        } catch (e) {
            console.error('[FMS] Failed to calculate vertical profile. See exception below.');
            console.error(e);
        }
    }

    recompute(geometry: Geometry): void {
        const newParameters = this.computationParametersObserver.get();

        this.constraintReader.updateGeometry(geometry, newParameters.presentPosition);
        this.windProfileFactory.updateAircraftDistanceFromStart(this.constraintReader.distanceToPresentPosition);
        this.headingProfile.updateGeometry(geometry);
        this.currentMcduSpeedProfile?.update(this.constraintReader.distanceToPresentPosition);

        this.computeVerticalProfileForMcdu(geometry);

        const newLegs = new Map(geometry?.legs ?? []);
        if (this.shouldUpdateDescentProfile(newParameters, newLegs) || this.requestDescentProfileRecomputation) {
            this.oldLegs = new Map(newLegs);
            this.lastParameters = newParameters;
            this.requestDescentProfileRecomputation = false;
            this.previousManagedDescentSpeedTarget = newParameters.managedDescentSpeed;

            if (this.currentNavGeometryProfile?.isReadyToDisplay) {
                this.descentGuidance.updateProfile(this.currentNavGeometryProfile);
            }
        }

        this.computeVerticalProfileForNd();
        this.guidanceController.pseudoWaypoints.acceptVerticalProfile();

        this.version++;
    }

    private updateTimeMarkers() {
        if (!this.currentNavGeometryProfile.isReadyToDisplay) {
            return;
        }

        for (const [time] of this.timeMarkers.entries()) {
            const prediction = this.currentNavGeometryProfile.predictAtTime(time);

            this.timeMarkers.set(time, prediction);
        }
    }

    /**
     * Based on the last checkpoint in the profile, we build a profile to the destination
     * @param profile: The profile to build to the destination
     * @param fromFlightPhase: The flight phase to start building the profile from
     */
    private finishProfileInManagedModes(profile: BaseGeometryProfile, fromFlightPhase: FmgcFlightPhase) {
        const { cruiseAltitude } = this.computationParametersObserver.get();

        const managedClimbStrategy = new ClimbThrustClimbStrategy(this.computationParametersObserver, this.atmosphericConditions);
        const stepDescentStrategy = new VerticalSpeedStrategy(this.computationParametersObserver, this.atmosphericConditions, -1000);

        const climbWinds = new HeadwindProfile(this.windProfileFactory.getClimbWinds(), this.headingProfile);
        const cruiseWinds = new HeadwindProfile(this.windProfileFactory.getCruiseWinds(), this.headingProfile);
        const descentWinds = new HeadwindProfile(this.windProfileFactory.getDescentWinds(), this.headingProfile);

        if (fromFlightPhase < FmgcFlightPhase.Climb) {
            this.takeoffPathBuilder.buildTakeoffPath(profile);
        }

        this.currentMcduSpeedProfile = new McduSpeedProfile(
            this.computationParametersObserver,
            this.currentNavGeometryProfile.distanceToPresentPosition,
            this.currentNavGeometryProfile.maxClimbSpeedConstraints,
            this.currentNavGeometryProfile.descentSpeedConstraints,
        );

        if (fromFlightPhase < FmgcFlightPhase.Cruise) {
            this.climbPathBuilder.computeClimbPath(profile, managedClimbStrategy, this.currentMcduSpeedProfile, climbWinds, cruiseAltitude);
        }

        if (profile instanceof NavGeometryProfile && this.cruiseToDescentCoordinator.canCompute(profile)) {
            this.cruiseToDescentCoordinator.buildCruiseAndDescentPath(profile, this.currentMcduSpeedProfile, cruiseWinds, descentWinds, managedClimbStrategy, stepDescentStrategy);

            if (this.currentMcduSpeedProfile.shouldTakeDescentSpeedLimitIntoAccount()) {
                this.cruiseToDescentCoordinator.addSpeedLimitAsCheckpoint(profile);
            }
        }
    }

    private computeVerticalProfileForMcdu(geometry: Geometry) {
        const { flightPhase, presentPosition, fuelOnBoard, approachSpeed } = this.computationParametersObserver.get();

        this.currentNavGeometryProfile = new NavGeometryProfile(this.guidanceController, this.constraintReader, this.atmosphericConditions, this.flightPlanManager.getWaypointsCount());

        if (geometry.legs.size <= 0 || !this.computationParametersObserver.canComputeProfile()) {
            return;
        }

        console.time('VNAV computation');
        // TODO: This is where the return to trajectory would go:
        if (flightPhase >= FmgcFlightPhase.Climb) {
            this.currentNavGeometryProfile.addPresentPositionCheckpoint(presentPosition, fuelOnBoard, this.currentMcduSpeedProfile.getManagedMachTarget(), this.getVman(approachSpeed));
        }

        this.finishProfileInManagedModes(this.currentNavGeometryProfile, Math.max(FmgcFlightPhase.Takeoff, flightPhase));

        this.currentNavGeometryProfile.finalizeProfile();
        this.decelPoint = this.currentNavGeometryProfile.findVerticalCheckpoint(VerticalCheckpointReason.Decel);

        console.timeEnd('VNAV computation');

        if (VnavConfig.DEBUG_PROFILE) {
            console.log('this.currentNavGeometryProfile:', this.currentNavGeometryProfile);
        }
    }

    private computeVerticalProfileForNd() {
        const {
            approachSpeed,
            fcuAltitude,
            fcuArmedVerticalMode,
            fcuVerticalMode,
            presentPosition,
            fuelOnBoard,
            fcuVerticalSpeed,
            fcuFlightPathAngle,
            flightPhase,
        } = this.computationParametersObserver.get();

        this.currentNdGeometryProfile = this.isLatAutoControlActive()
            ? new NavGeometryProfile(this.guidanceController, this.constraintReader, this.atmosphericConditions, this.flightPlanManager.getWaypointsCount())
            : new SelectedGeometryProfile();

        if (!this.computationParametersObserver.canComputeProfile()) {
            return;
        }

        if (flightPhase >= FmgcFlightPhase.Climb) {
            // TODO: Using the current managed Mach target is probably not right when in selected speed?
            this.currentNdGeometryProfile.addPresentPositionCheckpoint(presentPosition, fuelOnBoard, this.currentMcduSpeedProfile.getManagedMachTarget(), this.getVman(approachSpeed));
        } else {
            this.takeoffPathBuilder.buildTakeoffPath(this.currentNdGeometryProfile);
        }

        if (!this.shouldObeyAltitudeConstraints()) {
            this.currentNdGeometryProfile.resetAltitudeConstraints();
        }

        if (!this.shouldObeySpeedConstraints()) {
            this.currentNdGeometryProfile.resetSpeedConstraints();
        }

        const speedProfile = this.shouldObeySpeedConstraints()
            ? this.currentMcduSpeedProfile
            : new NdSpeedProfile(
                this.computationParametersObserver,
                this.currentNdGeometryProfile.distanceToPresentPosition,
                this.currentNdGeometryProfile.maxClimbSpeedConstraints,
                this.currentNdGeometryProfile.descentSpeedConstraints,
            );

        const tacticalClimbModes = [
            VerticalMode.OP_CLB,
        ];

        const tacticalLevelModes = [
            VerticalMode.ALT,
            VerticalMode.ALT_CST,
            VerticalMode.ALT_CPT,
            VerticalMode.ALT_CST_CPT,
        ];

        const tacticalDescentModes = [
            VerticalMode.OP_DES,
            VerticalMode.DES,
        ];

        const isInDescentOrApproachPhase = flightPhase >= FmgcFlightPhase.Descent && flightPhase <= FmgcFlightPhase.Approach;
        const isInLevelFlight = tacticalLevelModes.includes(fcuVerticalMode);
        const shouldApplyClimbPredictions = tacticalClimbModes.includes(fcuVerticalMode)
            || fcuVerticalMode === VerticalMode.VS && fcuVerticalSpeed > 0
            || fcuVerticalMode === VerticalMode.FPA && fcuFlightPathAngle > 0;
        const shouldApplyDescentPredictions = isInDescentOrApproachPhase && (
            tacticalDescentModes.includes(fcuVerticalMode)
            || isInLevelFlight
            || fcuVerticalMode === VerticalMode.VS && fcuVerticalSpeed <= 0
            || fcuVerticalMode === VerticalMode.FPA && fcuFlightPathAngle <= 0
        );

        // During the descent, the guidance profile and the tactical profile agree on the distance to destination by design.
        // However, since the guidance profile is not refreshed after starting descent whereas the tactical profile is,
        // they won't agree on total flight plan length, so the distance from start as difference between total length and distance to end changes
        let tacticalToGuidanceProfileOffset = 0;

        // Check if we're in the climb or descent phase and compute an appropriate tactical path.
        // A tactical path is a profile in the currently selected modes.
        if (shouldApplyClimbPredictions) {
            const climbStrategy = fcuVerticalMode === VerticalMode.VS
                ? new VerticalSpeedStrategy(this.computationParametersObserver, this.atmosphericConditions, fcuVerticalSpeed)
                : new ClimbThrustClimbStrategy(this.computationParametersObserver, this.atmosphericConditions);

            const climbWinds = new HeadwindProfile(this.windProfileFactory.getClimbWinds(), this.headingProfile);

            this.climbPathBuilder.computeClimbPath(this.currentNdGeometryProfile, climbStrategy, speedProfile, climbWinds, fcuAltitude);
        } else if (shouldApplyDescentPredictions) {
            // The idea here is that we compute a profile to FCU alt in the current modes, find the intercept with the managed profile. And then compute the managed profile from there.

            const descentStrategy = this.getAppropriateTacticalDescentStrategy(fcuVerticalMode, fcuVerticalSpeed, fcuFlightPathAngle, this.aircraftToDescentProfileRelation);
            const descentWinds = new HeadwindProfile(this.windProfileFactory.getDescentWinds(), this.headingProfile);

            // The guidance profile and the tactical profile agree on the distance to destination by design.
            // However, since the guidance profile is not refreshed after starting descent whereas the tactical profile is,
            // they won't agree on total flight plan length, so the distance from start as difference between total length and distance to end changes
            const guidanceDistanceFromStart = this.aircraftToDescentProfileRelation.distanceFromStart;
            const tacticalDistanceFromStart = this.currentNdGeometryProfile.checkpoints[0].distanceFromStart;
            tacticalToGuidanceProfileOffset = tacticalDistanceFromStart - guidanceDistanceFromStart;

            const plannedDecelerations = this.aircraftToDescentProfileRelation.currentProfile.checkpoints.filter(
                (c) => c.reason === VerticalCheckpointReason.StartDecelerationToConstraint || c.reason === VerticalCheckpointReason.StartDecelerationToLimit,
            ).map((c: VerticalCheckpointForDeceleration) => ({ ...c, distanceFromStart: c.distanceFromStart + tacticalToGuidanceProfileOffset }));

            // Build path to FCU altitude.
            this.tacticalDescentPathBuilder.buildTacticalDescentPath(this.currentNdGeometryProfile, descentStrategy, speedProfile, descentWinds,
                isInLevelFlight ? this.currentNdGeometryProfile.checkpoints[0].altitude : fcuAltitude, plannedDecelerations);

            // Compute intercept with managed profile
            if (this.isLatAutoControlActive() && this.aircraftToDescentProfileRelation.isValid) {
                // Compute intercept between managed profile and tactical path.
                const interceptDistance = ProfileInterceptCalculator.calculateIntercept(
                    this.currentNdGeometryProfile.checkpoints,
                    this.aircraftToDescentProfileRelation.currentProfile.checkpoints,
                    tacticalToGuidanceProfileOffset,
                );

                if (interceptDistance) {
                    const isManagedDescent = fcuVerticalMode === VerticalMode.DES;
                    const isManagedDescentArmed = isArmed(fcuArmedVerticalMode, ArmedVerticalMode.DES);
                    const reason = isManagedDescent || isManagedDescentArmed
                        ? VerticalCheckpointReason.InterceptDescentProfileManaged
                        : VerticalCheckpointReason.InterceptDescentProfileSelected;
                    const interceptCheckpoint = this.currentNdGeometryProfile.addInterpolatedCheckpoint(interceptDistance, { reason });

                    const isTooCloseToDrawIntercept = Math.abs(this.aircraftToDescentProfileRelation.computeLinearDeviation()) < 100;
                    const isInterceptOnlyAtFcuAlt = interceptCheckpoint.altitude - fcuAltitude < 100;

                    // In managed mode, we remove all checkpoints after (maybe including) the intercept
                    // In selected mode, we keep the checkpoints after the intercept
                    const interceptIndex = this.currentNdGeometryProfile.checkpoints.findIndex((checkpoint) => checkpoint.reason === reason);
                    if (isManagedDescent) {
                        this.currentNdGeometryProfile.checkpoints.splice(
                            isTooCloseToDrawIntercept || isInterceptOnlyAtFcuAlt ? interceptIndex : interceptIndex + 1,
                            this.currentNdGeometryProfile.checkpoints.length,
                        );
                    } else if (isTooCloseToDrawIntercept || isInterceptOnlyAtFcuAlt) {
                        this.currentNdGeometryProfile.checkpoints.splice(
                            isTooCloseToDrawIntercept || isInterceptOnlyAtFcuAlt ? interceptIndex : interceptIndex + 1,
                            1,
                        );
                    }
                }
            }
        }

        // After computing the tactical profile, we wish to finish it up in managed modes.
        if (this.isLatAutoControlActive() && this.currentNdGeometryProfile) {
            if (shouldApplyDescentPredictions) {
                const minDistanceToAppend = this.currentNdGeometryProfile.lastCheckpoint?.distanceFromStart ?? -Infinity;

                for (const checkpoint of this.aircraftToDescentProfileRelation.currentProfile.checkpoints) {
                    const tacticalDistanceFromStart = checkpoint.distanceFromStart + tacticalToGuidanceProfileOffset;

                    if (tacticalDistanceFromStart > minDistanceToAppend) {
                        this.currentNdGeometryProfile.checkpoints.push(
                            { ...checkpoint, distanceFromStart: tacticalDistanceFromStart },
                        );
                    }
                }

                // It's possible that the level off arrow was spliced from the profile because we spliced it at the intercept, so we need to add it back.
                const levelOffArrow = this.currentNdGeometryProfile.findVerticalCheckpoint(VerticalCheckpointReason.CrossingFcuAltitudeDescent);
                let levelOffDistance = levelOffArrow?.distanceFromStart ?? 0;

                if ((fcuVerticalMode === VerticalMode.DES || isArmed(fcuArmedVerticalMode, ArmedVerticalMode.DES)) && !levelOffArrow) {
                    levelOffDistance = this.currentNdGeometryProfile.interpolateDistanceAtAltitudeBackwards(fcuAltitude, true);
                    this.currentNdGeometryProfile.addInterpolatedCheckpoint(levelOffDistance, { reason: VerticalCheckpointReason.CrossingFcuAltitudeDescent });
                }

                const currentAlt = this.currentNdGeometryProfile.checkpoints[0].altitude;
                const isDescentArmed = isArmed(fcuArmedVerticalMode, ArmedVerticalMode.DES) || isArmed(fcuArmedVerticalMode, ArmedVerticalMode.FINAL);
                let constraintAlt: Feet = -Infinity;
                // Find next descent segment
                for (let i = 1; i < this.currentNdGeometryProfile.checkpoints.length; i++) {
                    const checkpoint = this.currentNdGeometryProfile.checkpoints[i];
                    if (checkpoint.reason === VerticalCheckpointReason.LevelOffForDescentConstraint) {
                        // This removes the magenta arrow if we're closer than 100 ft. (I have a reference for that)
                        // This piece of code should not really be here, but because we happen to be iterating over the ND profile, it's convenient.
                        if (currentAlt - checkpoint.altitude < 100) {
                            checkpoint.reason = VerticalCheckpointReason.AtmosphericConditions;
                        } else {
                            constraintAlt = Math.round(checkpoint.altitude);
                        }
                    }

                    const previousCheckpoint = this.currentNdGeometryProfile.checkpoints[i - 1];
                    // Either in level flight and DES armed or in descent and checkpoint under cstr alt found
                    if (isInLevelFlight && isDescentArmed && currentAlt - checkpoint.altitude > 100 || constraintAlt - checkpoint.altitude > 100) {
                        this.currentNdGeometryProfile.addInterpolatedCheckpoint(
                            previousCheckpoint.distanceFromStart, { reason: VerticalCheckpointReason.ContinueDescentArmed },
                        );

                        break;
                    }

                    // `checkpoint.altitude - fcuAltitude >= -100` works like this: If you have a constraint at 4450 feet causing a level segment,
                    // but you set the FCU altitude to 4500 ft, then the continue descent arrow should be drawn where you continue the descent from 4450 ft
                    // I have evidence of this somewhere.
                    if (checkpoint.distanceFromStart < levelOffDistance || checkpoint.altitude - fcuAltitude >= -100) {
                        continue;
                    }

                    // Here, we don't need to check whether the checkpoint is lower than the previous one,
                    // because we should only get to this point if we find the first checkpoint below the FCU altitude.
                    if (previousCheckpoint.reason === VerticalCheckpointReason.PresentPosition) {
                        break;
                    }

                    this.currentNdGeometryProfile.addInterpolatedCheckpoint(
                        Math.max(levelOffDistance, previousCheckpoint.distanceFromStart),
                        { reason: VerticalCheckpointReason.ContinueDescent },
                    );

                    break;
                }
            } else {
                this.currentNdGeometryProfile.checkpoints.push(
                    ...this.currentNavGeometryProfile.checkpoints.filter((checkpoint) => checkpoint.distanceFromStart > this.currentNdGeometryProfile.lastCheckpoint?.distanceFromStart ?? 0),
                );
            }
        }

        this.currentNdGeometryProfile.finalizeProfile();

        if (VnavConfig.DEBUG_PROFILE) {
            console.log('this.currentNdGeometryProfile:', this.currentNdGeometryProfile);
        }
    }

    private getAppropriateTacticalDescentStrategy(
        fcuVerticalMode: VerticalMode, fcuVerticalSpeed: FeetPerMinute, fcuFlightPathAngle: Degrees, relation: AircraftToDescentProfileRelation,
    ): DescentStrategy {
        const linearDeviation = relation.computeLinearDeviation();

        if (fcuVerticalMode === VerticalMode.VS && fcuVerticalSpeed <= 0) {
            return new VerticalSpeedStrategy(this.computationParametersObserver, this.atmosphericConditions, fcuVerticalSpeed);
        } if (fcuVerticalMode === VerticalMode.FPA && fcuFlightPathAngle <= 0) {
            return new FlightPathAngleStrategy(this.computationParametersObserver, this.atmosphericConditions, fcuFlightPathAngle);
        }
        if (fcuVerticalMode === VerticalMode.OP_DES) {
            return new IdleDescentStrategy(this.computationParametersObserver, this.atmosphericConditions);
        }

        if (relation.isValid && fcuVerticalMode === VerticalMode.DES) {
            if (linearDeviation > 0 && relation.isPastTopOfDescent()) {
                return DesModeStrategy.aboveProfile(this.computationParametersObserver, this.atmosphericConditions);
            } if (relation.isOnGeometricPath()) {
                const fpaTarget = relation.currentTargetPathAngle() / 2;
                return DesModeStrategy.belowProfileFpa(this.computationParametersObserver, this.atmosphericConditions, fpaTarget);
            }

            const vsTarget = relation.isAboveSpeedLimitAltitude() && !relation.isCloseToAirfieldElevation() ? -1000 : -500;
            return DesModeStrategy.belowProfileVs(
                this.computationParametersObserver, this.atmosphericConditions, vsTarget,
            );
        }

        // Assume level flight if we're in a different mode
        return new VerticalSpeedStrategy(this.computationParametersObserver, this.atmosphericConditions, 0);
    }

    private shouldObeySpeedConstraints(): boolean {
        const { fcuSpeed } = this.computationParametersObserver.get();

        // TODO: Take MACH into account
        return this.isLatAutoControlActive() && fcuSpeed <= 0;
    }

    shouldObeyAltitudeConstraints(): boolean {
        const { fcuArmedLateralMode, fcuArmedVerticalMode, fcuVerticalMode } = this.computationParametersObserver.get();

        const verticalModesToApplyAltitudeConstraintsFor = [
            VerticalMode.CLB,
            VerticalMode.ALT,
            VerticalMode.ALT_CPT,
            VerticalMode.ALT_CST_CPT,
            VerticalMode.ALT_CST,
            VerticalMode.DES,
        ];

        return isArmed(fcuArmedVerticalMode, ArmedVerticalMode.CLB)
            || isArmed(fcuArmedLateralMode, ArmedLateralMode.NAV)
            || verticalModesToApplyAltitudeConstraintsFor.includes(fcuVerticalMode);
    }

    computeVerticalProfileForExpediteClimb(): SelectedGeometryProfile | undefined {
        try {
            const { approachSpeed, fcuAltitude, presentPosition, fuelOnBoard } = this.computationParametersObserver.get();

            // TODO: I wonder where GD speed comes from IRL. Should probably be an FMGC computation rather than FAC since it's just for predictions
            const greenDotSpeed = Simplane.getGreenDotSpeed();
            if (!greenDotSpeed) {
                return undefined;
            }

            const selectedSpeedProfile = new ExpediteSpeedProfile(greenDotSpeed);
            const expediteGeometryProfile = new SelectedGeometryProfile();
            const climbStrategy = new ClimbThrustClimbStrategy(this.computationParametersObserver, this.atmosphericConditions);
            const climbWinds = new HeadwindProfile(this.windProfileFactory.getClimbWinds(), this.headingProfile);

            expediteGeometryProfile.addPresentPositionCheckpoint(presentPosition, fuelOnBoard, this.currentMcduSpeedProfile.getManagedMachTarget(), this.getVman(approachSpeed));
            this.climbPathBuilder.computeClimbPath(expediteGeometryProfile, climbStrategy, selectedSpeedProfile, climbWinds, fcuAltitude);

            expediteGeometryProfile.finalizeProfile();

            if (VnavConfig.DEBUG_PROFILE) {
                console.log(expediteGeometryProfile);
            }

            return expediteGeometryProfile;
        } catch (e) {
            console.error(e);
            return new SelectedGeometryProfile();
        }
    }

    isLatAutoControlActive(): boolean {
        const { fcuLateralMode } = this.computationParametersObserver.get();

        return fcuLateralMode === LateralMode.NAV
            || fcuLateralMode === LateralMode.LOC_CPT
            || fcuLateralMode === LateralMode.LOC_TRACK
            || fcuLateralMode === LateralMode.RWY;
    }

    isSelectedVerticalModeActive(): boolean {
        const { fcuVerticalMode } = this.computationParametersObserver.get();
        const isExpediteModeActive = SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number') === 1;

        return isExpediteModeActive
            || fcuVerticalMode === VerticalMode.VS
            || fcuVerticalMode === VerticalMode.FPA
            || fcuVerticalMode === VerticalMode.OP_CLB
            || fcuVerticalMode === VerticalMode.OP_DES;
    }

    private previousManagedDescentSpeedTarget: Knots;

    // We cache this here, so we don't have to recompute it every guidance step
    private decelPoint: VerticalCheckpoint = null;

    private updateDescentSpeedGuidance() {
        const { flightPhase, managedDescentSpeed, managedDescentSpeedMach, presentPosition, approachSpeed } = this.computationParametersObserver.get();
        const isExpediteModeActive = SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number') === 1;
        const isHoldActive = this.guidanceController.isManualHoldActive() || this.guidanceController.isManualHoldNext();
        const currentDistanceFromStart = this.isLatAutoControlActive() ? this.constraintReader.distanceToPresentPosition : 0;
        const currentAltitude = presentPosition.alt;

        // Speed guidance for holds is handled elsewhere for now, so we don't want to interfere here
        if (flightPhase !== FmgcFlightPhase.Descent || isExpediteModeActive || isHoldActive) {
            return;
        }

        // We get this value because we only want to a speed constraint if this is not covered by the decel point already
        const decelPointSpeed = this.decelPoint?.speed ?? 0;

        let newSpeedTarget = Math.min(managedDescentSpeed, this.previousManagedDescentSpeedTarget);
        if (this.isLatAutoControlActive()) {
            // We get the managed target here because this function is only supposed to update the managed speed
            const targetFromProfile = this.currentMcduSpeedProfile.getManagedTarget(currentDistanceFromStart, currentAltitude, ManagedSpeedType.Descent);

            newSpeedTarget = Math.min(newSpeedTarget, targetFromProfile);
        }

        for (let i = 0; i < this.currentNdGeometryProfile.checkpoints.length - 2; i++) {
            const checkpoint = this.currentNdGeometryProfile.checkpoints[i];

            if (checkpoint.distanceFromStart - currentDistanceFromStart > 1) {
                break;
            }

            const isPastCstrDeceleration = checkpoint.reason === VerticalCheckpointReason.StartDecelerationToConstraint && currentDistanceFromStart - checkpoint.distanceFromStart > -1e-4;
            const isPastLimitDeceleration = checkpoint.reason === VerticalCheckpointReason.StartDecelerationToLimit && currentAltitude - checkpoint.altitude < 1e-4;

            if (isSpeedChangePoint(checkpoint) && checkpoint.targetSpeed >= decelPointSpeed && (isPastCstrDeceleration || isPastLimitDeceleration)) {
                newSpeedTarget = Math.min(newSpeedTarget, checkpoint.targetSpeed);

                break;
            }
        }

        this.previousManagedDescentSpeedTarget = newSpeedTarget;

        const vLs = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');
        const vMan = this.getVman(approachSpeed);
        const econMachAsCas = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', managedDescentSpeedMach);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', Math.max(vLs, vMan, Math.min(newSpeedTarget, econMachAsCas)));
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

    private updateHoldSpeed(): void {
        if (!this.guidanceController.isManualHoldActive() && !this.guidanceController.isManualHoldNext()) {
            return;
        }

        let holdSpeedCas = SimVar.GetSimVarValue('L:A32NX_FM_HOLD_SPEED', 'number');
        const holdDecelReached = SimVar.GetSimVarValue('L:A32NX_FM_HOLD_DECEL', 'bool');

        const speedControlManual = Simplane.getAutoPilotAirspeedSelected();
        const isMach = Simplane.getAutoPilotMachModeActive();
        if (speedControlManual && holdDecelReached) {
            if (isMach) {
                const holdValue = Simplane.getAutoPilotMachHoldValue();
                holdSpeedCas = this.atmosphericConditions.computeCasFromMach(this.atmosphericConditions.currentAltitude, holdValue);
            } else {
                holdSpeedCas = Simplane.getAutoPilotAirspeedHoldValue();
            }
        }

        const holdSpeedTas = this.atmosphericConditions.computeTasFromCas(this.atmosphericConditions.currentAltitude, holdSpeedCas);

        this.guidanceController.setHoldSpeed(holdSpeedTas);
    }

    getLinearDeviation(): Feet | null {
        if (!this.aircraftToDescentProfileRelation.isValid) {
            return null;
        }

        return this.aircraftToDescentProfileRelation.computeLinearDeviation();
    }

    private shouldUpdateDescentProfile(newParameters: VerticalProfileComputationParameters, newLegs: Map<number, Leg>): boolean {
        // While in the descent phase, we don't want to update the profile anymore
        if (this.lastParameters === null) {
            return true;
        }

        return newParameters.flightPhase < FmgcFlightPhase.Descent || newParameters.flightPhase > FmgcFlightPhase.Approach
            || (!this.flightPlanManager.isCurrentFlightPlanTemporary() && this.didLegsChange(this.oldLegs, newLegs))
            || numberOrNanChanged(this.lastParameters.cruiseAltitude, newParameters.cruiseAltitude)
            || numberOrNanChanged(this.lastParameters.managedDescentSpeed, newParameters.managedDescentSpeed)
            || numberOrNanChanged(this.lastParameters.managedDescentSpeedMach, newParameters.managedDescentSpeedMach)
            || numberOrNanChanged(this.lastParameters.approachQnh, newParameters.approachQnh)
            || numberOrNanChanged(this.lastParameters.approachTemperature, newParameters.approachTemperature);
    }

    private didLegsChange(oldLegs: Map<number, Leg>, newLegs: Map<number, Leg>): boolean {
        for (const [index, legA] of newLegs) {
            const legB = oldLegs.get(index);

            if (index < this.guidanceController.activeLegIndex) {
                continue;
            }

            if (!legA?.ident !== !legB?.ident) {
                return true;
            }
        }

        return false;
    }

    public getDestinationPrediction(): VerticalWaypointPrediction | null {
        return this.currentNavGeometryProfile?.waypointPredictions?.get(this.flightPlanManager.getDestinationIndex());
    }

    public getPerfCrzToPrediction(): PerfCrzToPrediction | null {
        if (!this.currentNavGeometryProfile?.isReadyToDisplay) {
            return null;
        }

        const todOrStep = this.currentNavGeometryProfile.findVerticalCheckpoint(
            VerticalCheckpointReason.StepClimb, VerticalCheckpointReason.StepDescent, VerticalCheckpointReason.TopOfDescent,
        );

        if (!todOrStep) {
            return null;
        }

        return {
            reason: todOrStep.reason,
            distanceFromPresentPosition: todOrStep.distanceFromStart - this.constraintReader.distanceToPresentPosition,
            secondsFromPresent: todOrStep.secondsFromPresent,
        };
    }

    public get distanceToEnd(): NauticalMiles {
        return this.constraintReader.distanceToEnd;
    }

    public findNextSpeedChange(): NauticalMiles | null {
        const { presentPosition, flightPhase, fcuAltitude } = this.computationParametersObserver.get();

        if (!Simplane.getAutoPilotAirspeedManaged() || SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number') === 1 || flightPhase === FmgcFlightPhase.Approach) {
            return null;
        }

        let speedTargetType: ManagedSpeedType = ManagedSpeedType.Climb;
        if (flightPhase === FmgcFlightPhase.Cruise) {
            speedTargetType = ManagedSpeedType.Cruise;
        } else if (flightPhase === FmgcFlightPhase.Descent) {
            speedTargetType = ManagedSpeedType.Descent;
        }

        const distanceToPresentPosition = this.constraintReader.distanceToPresentPosition;
        const decelPointSpeed = this.decelPoint?.speed;

        // We don't want to show the speed change dot at acceleration altiude, so we have to make sure the speed target is econ speed, not SRS speed.
        const speedTarget = flightPhase < FmgcFlightPhase.Climb
            ? this.currentMcduSpeedProfile.getTarget(distanceToPresentPosition, presentPosition.alt, ManagedSpeedType.Climb)
            : SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots');

        for (let i = 1; i < this.currentNdGeometryProfile.checkpoints.length - 1; i++) {
            const checkpoint = this.currentNdGeometryProfile.checkpoints[i];

            if (checkpoint.distanceFromStart < distanceToPresentPosition) {
                continue;
            } else if (checkpoint.reason === VerticalCheckpointReason.TopOfClimb || checkpoint.reason === VerticalCheckpointReason.TopOfDescent) {
                // At T/C, T/D, we expect to see a speed change the the respective ECON speed, but this is not indicated to the pilots
                return null;
            }

            if (speedTargetType === ManagedSpeedType.Climb || speedTargetType === ManagedSpeedType.Cruise) {
                if (Math.min(checkpoint.speed, this.atmosphericConditions.computeCasFromMach(checkpoint.altitude, checkpoint.mach))
                    - Math.max(this.currentNdGeometryProfile.checkpoints[i - 1].speed, speedTarget) > 1) {
                // Candiate for a climb speed change
                    return this.currentNdGeometryProfile.checkpoints[i - 1].distanceFromStart;
                }
            } else if (isSpeedChangePoint(checkpoint) && checkpoint.targetSpeed - speedTarget < -1 && checkpoint.targetSpeed >= decelPointSpeed) {
                // Check if decel point, or `StartDeceleration` point with target speed lower than current target, but larger than the speed the decel point is placed at.

                // Only show deceleration to speed limit if we are going to descend below it.
                if (checkpoint.reason === VerticalCheckpointReason.StartDecelerationToConstraint || fcuAltitude < checkpoint.altitude) {
                    return checkpoint.distanceFromStart;
                }
            }
        }

        return null;
    }

    public invalidateFlightPlanProfile(): void {
        this.requestDescentProfileRecomputation = true;

        if (this.currentNavGeometryProfile) {
            this.currentNavGeometryProfile.invalidate();
        }
    }

    // Only used to check whether T/D PWP should be displayed despite not being in lat auto control
    public isFlightPhasePreflight(): boolean {
        return this.computationParametersObserver.get().flightPhase === FmgcFlightPhase.Preflight;
    }
}

/// To check whether the value changed from old to new, but not if both values are NaN. (NaN !== NaN in JS)
export function numberOrNanChanged(oldValue: number, newValue: number): boolean {
    return (!Number.isNaN(oldValue) || !Number.isNaN(newValue)) && oldValue !== newValue;
}
