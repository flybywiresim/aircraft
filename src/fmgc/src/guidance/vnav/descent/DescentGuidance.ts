import { RequestedVerticalMode, TargetAltitude, TargetVerticalSpeed } from '@fmgc/guidance/ControlLaws';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { AircraftToDescentProfileRelation } from '@fmgc/guidance/vnav/descent/AircraftToProfileRelation';
import { NavGeometryProfile } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VerticalMode } from '@shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';
import { SpeedMargin } from './SpeedMargin';

enum DescentGuidanceState {
    InvalidProfile,
    ProvidingGuidance,
    Observing
}

export class DescentGuidance {
    private state: DescentGuidanceState = DescentGuidanceState.InvalidProfile;

    private requestedVerticalMode: RequestedVerticalMode = RequestedVerticalMode.None;

    private targetAltitude: TargetAltitude = 0;

    private targetAltitudeGuidance: TargetAltitude = 0;

    private targetVerticalSpeed: TargetVerticalSpeed = 0;

    private showLinearDeviationOnPfd: boolean = false;

    private showDescentLatchOnPfd: boolean = false;

    private showSpeedMargin: boolean = false;

    private speedMargin: SpeedMargin;

    private speedTarget: Knots | Mach;

    private tdReached: boolean;

    constructor(
        private aircraftToDescentProfileRelation: AircraftToDescentProfileRelation,
        private observer: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
    ) {
        const { managedDescentSpeed } = this.observer.get();
        this.speedMargin = new SpeedMargin(managedDescentSpeed);

        this.writeToSimVars();
    }

    updateProfile(profile: NavGeometryProfile) {
        this.aircraftToDescentProfileRelation.updateProfile(profile);

        if (!this.aircraftToDescentProfileRelation.isValid) {
            this.changeState(DescentGuidanceState.InvalidProfile);
            return;
        }

        this.changeState(DescentGuidanceState.Observing);
    }

    private changeState(newState: DescentGuidanceState) {
        if (this.state === newState) {
            return;
        }

        if (this.state !== DescentGuidanceState.InvalidProfile && newState === DescentGuidanceState.InvalidProfile) {
            this.reset();
            this.writeToSimVars();
        }

        this.state = newState;
    }

    private reset() {
        this.requestedVerticalMode = RequestedVerticalMode.None;
        this.targetAltitude = 0;
        this.targetVerticalSpeed = 0;
        this.showLinearDeviationOnPfd = false;
        this.showDescentLatchOnPfd = false;
    }

    update() {
        this.aircraftToDescentProfileRelation.update();

        if (!this.aircraftToDescentProfileRelation.isValid) {
            return;
        }

        if ((this.observer.get().fcuVerticalMode === VerticalMode.DES) !== (this.state === DescentGuidanceState.ProvidingGuidance)) {
            this.changeState(this.state === DescentGuidanceState.ProvidingGuidance ? DescentGuidanceState.Observing : DescentGuidanceState.ProvidingGuidance);
        }

        this.updateLinearDeviation();

        if (this.state === DescentGuidanceState.ProvidingGuidance) {
            this.updateDesModeGuidance();
            this.updateSpeedTarget();

            if (Simplane.getAutoPilotAirspeedManaged()) {
                this.updateSpeedGuidance();
            }
        }

        this.writeToSimVars();
        this.updateTdReached();
    }

    updateTdReached() {
        const { flightPhase } = this.observer.get();
        const isPastTopOfDescent = this.aircraftToDescentProfileRelation.isPastTopOfDescent();
        const isInManagedSpeed = Simplane.getAutoPilotAirspeedManaged();

        const tdReached = flightPhase <= FmgcFlightPhase.Cruise && isPastTopOfDescent && isInManagedSpeed;
        if (tdReached !== this.tdReached) {
            this.tdReached = tdReached;
            SimVar.SetSimVarValue('L:A32NX_PFD_MSG_TD_REACHED', 'boolean', this.tdReached);
        }
    }

    private updateLinearDeviation() {
        this.targetAltitude = this.aircraftToDescentProfileRelation.currentTargetAltitude();

        this.showLinearDeviationOnPfd = this.observer.get().flightPhase >= FmgcFlightPhase.Descent || this.aircraftToDescentProfileRelation.isPastTopOfDescent();
    }

    private updateDesModeGuidance() {
        const isOnGeometricPath = this.aircraftToDescentProfileRelation.isOnGeometricPath();
        const isAboveSpeedLimitAltitude = this.aircraftToDescentProfileRelation.isAboveSpeedLimitAltitude();
        const isBeforeTopOfDescent = !this.aircraftToDescentProfileRelation.isPastTopOfDescent();
        const linearDeviation = this.aircraftToDescentProfileRelation.computeLinearDeviation();

        this.targetAltitudeGuidance = this.atmosphericConditions.estimatePressureAltitudeInMsfs(
            this.aircraftToDescentProfileRelation.currentTargetAltitude(),
        );

        if (isBeforeTopOfDescent || linearDeviation < -200) {
            // below path
            if (isOnGeometricPath) {
                this.requestedVerticalMode = RequestedVerticalMode.FpaSpeed;
                this.targetVerticalSpeed = this.aircraftToDescentProfileRelation.currentTargetPathAngle() / 2;
            } else {
                this.requestedVerticalMode = RequestedVerticalMode.VsSpeed;
                this.targetVerticalSpeed = (isAboveSpeedLimitAltitude ? -1000 : -500);
            }
        } else if (linearDeviation > 200) {
            // above path
            this.requestedVerticalMode = RequestedVerticalMode.SpeedThrust;
        } else if (isOnGeometricPath) {
            // on geometric path

            this.requestedVerticalMode = RequestedVerticalMode.VpathSpeed;
            this.targetVerticalSpeed = this.aircraftToDescentProfileRelation.currentTargetVerticalSpeed();
        } else {
            // on idle path

            this.requestedVerticalMode = RequestedVerticalMode.VpathThrust;
            this.targetVerticalSpeed = this.aircraftToDescentProfileRelation.currentTargetVerticalSpeed();
        }
    }

    private updateSpeedTarget() {
        const { fcuSpeed } = this.observer.get();
        const inManagedSpeed = Simplane.getAutoPilotAirspeedManaged();

        this.speedTarget = inManagedSpeed
            ? Math.round(this.aircraftToDescentProfileRelation.currentTargetSpeed())
            : fcuSpeed;
    }

    private writeToSimVars() {
        SimVar.SetSimVarValue('L:A32NX_FG_REQUESTED_VERTICAL_MODE', 'Enum', this.requestedVerticalMode);
        SimVar.SetSimVarValue('L:A32NX_FG_TARGET_ALTITUDE', 'Feet', this.targetAltitudeGuidance);
        SimVar.SetSimVarValue('L:A32NX_FG_TARGET_VERTICAL_SPEED', 'number', this.targetVerticalSpeed);

        SimVar.SetSimVarValue('L:A32NX_PFD_TARGET_ALTITUDE', 'Feet', this.targetAltitude);
        SimVar.SetSimVarValue('L:A32NX_PFD_LINEAR_DEVIATION_ACTIVE', 'Bool', this.showLinearDeviationOnPfd);
        SimVar.SetSimVarValue('L:A32NX_PFD_VERTICAL_PROFILE_LATCHED', 'Bool', this.showDescentLatchOnPfd);
    }

    private updateSpeedGuidance() {
        const { flightPhase } = this.observer.get();
        const isActive = flightPhase === FmgcFlightPhase.Descent && this.state === DescentGuidanceState.ProvidingGuidance && Simplane.getAutoPilotAirspeedManaged();
        this.showSpeedMargin = isActive;

        if (!isActive) {
            return;
        }

        SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', this.speedTarget);

        const airspeed = this.atmosphericConditions.currentAirspeed;
        const guidanceTarget = this.speedMargin.getTarget(airspeed, this.speedTarget);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', guidanceTarget);

        const [lower, upper] = this.speedMargin.getMargins(this.speedTarget);

        SimVar.SetSimVarValue('L:A32NX_PFD_SHOW_SPEED_MARGINS', 'boolean', this.showSpeedMargin);
        SimVar.SetSimVarValue('L:A32NX_PFD_LOWER_SPEED_MARGIN', 'Knots', lower);
        SimVar.SetSimVarValue('L:A32NX_PFD_UPPER_SPEED_MARGIN', 'Knots', upper);
    }
}
