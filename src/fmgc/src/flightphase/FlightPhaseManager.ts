import { Phase, PreFlightPhase, TakeOffPhase, ClimbPhase, CruisePhase, DescentPhase, ApproachPhase, GoAroundPhase, DonePhase } from '@fmgc/flightphase/Phase';
import { VerticalMode } from '@shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';

function canInitiateDes(distanceToDestination: number): boolean {
    const fl = Math.round(Simplane.getAltitude() / 100);
    const fcuSelFl = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') / 100;
    const cruiseFl = SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number') / 100;

    // Can initiate descent? OR Can initiate early descent?
    return ((distanceToDestination < 200 || fl < 200) && fcuSelFl < cruiseFl && fcuSelFl < fl)
        || (distanceToDestination >= 200 && fl > 200 && fcuSelFl <= 200);
}

export class FlightPhaseManager {
    private activePhase: FmgcFlightPhase = SimVar.GetSimVarValue('L:A32NX_INITIAL_FLIGHT_PHASE', 'number') || FmgcFlightPhase.Preflight;

    private phases: { [key in FmgcFlightPhase]: Phase } = {
        [FmgcFlightPhase.Preflight]: new PreFlightPhase(),
        [FmgcFlightPhase.Takeoff]: new TakeOffPhase(),
        [FmgcFlightPhase.Climb]: new ClimbPhase(),
        [FmgcFlightPhase.Cruise]: new CruisePhase(),
        [FmgcFlightPhase.Descent]: new DescentPhase(),
        [FmgcFlightPhase.Approach]: new ApproachPhase(),
        [FmgcFlightPhase.GoAround]: new GoAroundPhase(),
        [FmgcFlightPhase.Done]: new DonePhase(),
    }

    private phaseChangeListeners: Array<(prev: FmgcFlightPhase, next: FmgcFlightPhase) => void> = [];

    get phase() {
        return this.activePhase;
    }

    init(): void {
        console.log(`FMGC Flight Phase: ${this.phase}`);
        this.phases[this.phase].init();
    }

    shouldActivateNextPhase(_deltaTime: number): void {
        if (this.phases[this.phase].shouldActivateNextPhase(_deltaTime)) {
            this.changePhase(this.phases[this.phase].nextPhase);
        }
    }

    addOnPhaseChanged(cb: (prev: FmgcFlightPhase, next: FmgcFlightPhase) => void): void {
        this.phaseChangeListeners.push(cb);
    }

    handleFcuAltKnobPushPull(distanceToDestination: number): void {
        switch (this.phase) {
        case FmgcFlightPhase.Takeoff:
            this.changePhase(FmgcFlightPhase.Climb);
            break;
        case FmgcFlightPhase.Climb:
        case FmgcFlightPhase.Cruise:
            if (canInitiateDes(distanceToDestination)) {
                this.changePhase(FmgcFlightPhase.Descent);
            }
            break;
        default:
        }
    }

    handleFcuAltKnobTurn(distanceToDestination: number): void {
        if (this.phase === FmgcFlightPhase.Cruise) {
            const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
            const VS = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
            const FPA = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees');
            if (
                (activeVerticalMode === VerticalMode.OP_DES
                     || (activeVerticalMode === VerticalMode.VS && VS < 0)
                     || (activeVerticalMode === VerticalMode.FPA && FPA < 0)
                     || activeVerticalMode === VerticalMode.DES)
                && canInitiateDes(distanceToDestination)) {
                this.changePhase(FmgcFlightPhase.Descent);
            }
        }
    }

    handleFcuVSKnob(distanceToDestination: number, onStepClimbDescent: () => void): void {
        if (this.phase === FmgcFlightPhase.Climb || this.phase === FmgcFlightPhase.Cruise) {
            /** a timeout of 100ms is required in order to receive the updated autopilot vertical mode */
            setTimeout(() => {
                const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
                const VS = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
                const FPA = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees');
                if ((activeVerticalMode === VerticalMode.VS && VS < 0) || (activeVerticalMode === VerticalMode.FPA && FPA < 0)) {
                    if (canInitiateDes(distanceToDestination)) {
                        this.changePhase(FmgcFlightPhase.Descent);
                    } else {
                        onStepClimbDescent();
                    }
                }
            }, 100);
        }
    }

    changePhase(newPhase: FmgcFlightPhase): void {
        const prevPhase = this.phase;
        console.log(`FMGC Flight Phase: ${prevPhase} => ${newPhase}`);
        this.activePhase = newPhase;
        SimVar.SetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'number', newPhase);
        // Updating old SimVar to ensure backwards compatibility
        SimVar.SetSimVarValue('L:AIRLINER_FLIGHT_PHASE', 'number', (newPhase < FmgcFlightPhase.Takeoff ? FmgcFlightPhase.Preflight : newPhase + 1));

        this.phases[this.phase].init();

        for (const pcl of this.phaseChangeListeners) {
            pcl(prevPhase, newPhase);
        }

        this.shouldActivateNextPhase(0);
    }

    tryGoInApproachPhase(): boolean {
        if (
            this.phase === FmgcFlightPhase.Preflight
            || this.phase === FmgcFlightPhase.Takeoff
            || this.phase === FmgcFlightPhase.Done
        ) {
            return false;
        }

        if (this.phase !== FmgcFlightPhase.Approach) {
            this.changePhase(FmgcFlightPhase.Approach);
        }

        return true;
    }
}
