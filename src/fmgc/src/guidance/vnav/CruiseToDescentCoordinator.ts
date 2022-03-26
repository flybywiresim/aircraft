import { CruisePathBuilder } from '@fmgc/guidance/vnav/cruise/CruisePathBuilder';
import { DescentPathBuilder } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { NavGeometryProfile, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { ClimbStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { DescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { ApproachPathBuilder } from '@fmgc/guidance/vnav/descent/ApproachPathBuilder';
import { SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { FmgcFlightPhase } from '@shared/flightphase';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';

export class CruiseToDescentCoordinator {
    private lastEstimatedFuelAtDestination: Pounds = 2300;

    private lastEstimatedTimeAtDestination: Seconds = 0;

    constructor(
        private observer: VerticalProfileComputationParametersObserver,
        private cruisePathBuilder: CruisePathBuilder,
        private descentPathBuilder: DescentPathBuilder,
        private approachPathBuilder: ApproachPathBuilder,
    ) { }

    resetEstimations() {
        this.lastEstimatedFuelAtDestination = 2300;
        this.lastEstimatedTimeAtDestination = 0;
    }

    buildCruiseAndDescentPath(
        profile: NavGeometryProfile,
        speedProfile: SpeedProfile,
        cruiseWinds: HeadwindProfile,
        descentWinds: HeadwindProfile,
        stepClimbStrategy: ClimbStrategy,
        stepDescentStrategy: DescentStrategy,
    ) {
        // - Start with initial guess for fuel on board at destination
        // - Compute descent profile to get distance to T/D and burnt fuel during descent
        // - Compute cruise profile to T/D -> guess new guess for fuel at start T/D, use fuel burn to get new estimate for fuel at destination
        // - Repeat
        const startingPointIndex = profile.findLastVerticalCheckpointIndex(
            VerticalCheckpointReason.TopOfClimb,
            VerticalCheckpointReason.PresentPosition,
        );

        if (startingPointIndex < 0) {
            return;
        }

        const startingPoint = profile.checkpoints[startingPointIndex];

        let iterationCount = 0;
        let todFuelError = Infinity;
        let todTimeError = Infinity;

        if (Number.isNaN(this.lastEstimatedFuelAtDestination) || Number.isNaN(this.lastEstimatedTimeAtDestination)) {
            this.resetEstimations();
        }

        let descentPath = new TemporaryCheckpointSequence();
        let cruisePath = new TemporaryCheckpointSequence();

        while (iterationCount++ < 4 && (Math.abs(todFuelError) > 100 || Math.abs(todTimeError) > 1)) {
            descentPath = this.approachPathBuilder.computeApproachPath(profile, speedProfile, this.lastEstimatedFuelAtDestination, this.lastEstimatedTimeAtDestination);

            if (descentPath.lastCheckpoint.reason !== VerticalCheckpointReason.Decel) {
                console.error('[FMS/VNAV] Approach path did not end in DECEL. Discarding descent profile.');
                return;
            }

            // Geometric and idle
            this.descentPathBuilder.computeManagedDescentPath(descentPath, profile, speedProfile, descentWinds, this.cruisePathBuilder.getFinalCruiseAltitude());

            if (descentPath.lastCheckpoint.reason !== VerticalCheckpointReason.TopOfDescent) {
                console.error('[FMS/VNAV] Approach path did not end in T/D. Discarding descent profile.');
                return;
            }

            // This means we are in the descent.
            if (descentPath.lastCheckpoint.distanceFromStart < startingPoint.distanceFromStart) {
                // At this point, there will still be a PresentPosition checkpoint in the profile, but we use it and remove it in DescentGuidance
                profile.checkpoints.push(...descentPath.get(true).reverse());

                return;
            }

            cruisePath = this.cruisePathBuilder.computeCruisePath(
                profile, startingPoint, descentPath.lastCheckpoint.distanceFromStart, stepClimbStrategy, stepDescentStrategy, speedProfile, cruiseWinds,
            );

            if (!cruisePath) {
                console.error('[FMS/VNAV] Could not coordinate cruise and descent path. Discarding descent profile');
                return;
            }

            todFuelError = cruisePath.lastCheckpoint.remainingFuelOnBoard - descentPath.lastCheckpoint.remainingFuelOnBoard;
            todTimeError = cruisePath.lastCheckpoint.secondsFromPresent - descentPath.lastCheckpoint.secondsFromPresent;

            this.lastEstimatedFuelAtDestination += todFuelError;
            this.lastEstimatedTimeAtDestination += todTimeError;
        }

        profile.checkpoints.push(...cruisePath.get());
        profile.checkpoints.push(...descentPath.get(true).reverse());
    }

    addSpeedLimitAsCheckpoint(profile: NavGeometryProfile) {
        const { flightPhase, descentSpeedLimit: { underAltitude }, presentPosition: { alt }, cruiseAltitude } = this.observer.get();

        // Don't try to place speed limit if the cruise alt is higher
        if (underAltitude > cruiseAltitude) {
            return;
        }

        if ((underAltitude <= alt) && flightPhase >= FmgcFlightPhase.Descent) {
            return;
        }

        const distance = profile.interpolateDistanceAtAltitudeBackwards(underAltitude);

        profile.addInterpolatedCheckpoint(distance, { reason: VerticalCheckpointReason.CrossingDescentSpeedLimit });
    }

    canCompute(profile: NavGeometryProfile) {
        return this.approachPathBuilder?.canCompute(profile);
    }
}
