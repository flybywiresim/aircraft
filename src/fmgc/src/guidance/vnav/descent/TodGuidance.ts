import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { AircraftToDescentProfileRelation } from '@fmgc/guidance/vnav/descent/AircraftToProfileRelation';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { LateralMode } from '@shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';
import { NXDataStore } from '@shared/persistence';
import { PopUp } from '@shared/popup';

const TIMEOUT = 10_000;

export class TodGuidance {
    private tdReached: boolean;

    private tdPaused: boolean;

    private apEngaged: boolean;

    private cooldown: number;

    constructor(
        private aircraftToDescentProfileRelation: AircraftToDescentProfileRelation,
        private observer: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
    ) {
        this.cooldown = 0;
        this.apEngaged = false;
        this.tdReached = false;
        this.tdPaused = false;
    }

    showPausePopup(title: string, message: string) {
        this.cooldown = TIMEOUT;
        SimVar.SetSimVarValue('K:PAUSE_SET', 'number', 1);
        let popup = new PopUp();
        popup.showInformation(title, message, 'small',
            () => {
                SimVar.SetSimVarValue('K:PAUSE_SET', 'number', 0);
                this.cooldown = TIMEOUT;
                popup = null;
            });
    }

    update(deltaTime: number) {
        this.updateTdReached(deltaTime);
        this.updateTdPause(deltaTime);
    }

    updateTdPause(deltaTime: number) {
        if (
            this.cooldown <= 0
            && NXDataStore.get('PAUSE_AT_TOD', 'DISABLED') === 'ENABLED'
        ) {
            // Only watching if T/D pause untriggered + between flight phase CLB and CRZ
            if (!this.tdPaused
                && this.observer.get().flightPhase >= FmgcFlightPhase.Climb
                && this.observer.get().flightPhase <= FmgcFlightPhase.Cruise
                && Simplane.getAutoPilotAirspeedManaged()
            ) {
                // Check T/D pause first, then AP mode reversion
                if ((this.aircraftToDescentProfileRelation.distanceToTopOfDescent() ?? Number.POSITIVE_INFINITY) < parseFloat(NXDataStore.get('PAUSE_AT_TOD_DISTANCE', '10'))) {
                    this.tdPaused = true;
                    this.showPausePopup(
                        'TOP OF DESCENT',
                        `Paused before the calculated top of descent. System Time was ${new Date().toLocaleTimeString()}.`,
                    );
                // Only guard AP above transitional altitude
                } else if (this.atmosphericConditions.currentAltitude ? this.atmosphericConditions.currentAltitude > this.observer.get().originTransitionAltitude : false) {
                    const apActive = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'boolean') && SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Enum') === LateralMode.NAV;

                    if (this.apEngaged && !apActive) {
                        this.showPausePopup(
                            'AP PROTECTION',
                            `Autopilot or lateral guidance disengaged before the calculated top of descent. System Time was ${new Date().toLocaleTimeString()}.`,
                        );
                    }

                    if (this.apEngaged !== apActive) {
                        this.apEngaged = apActive;
                    }
                }
            }

            // Reset flags on turnaround
            if (this.observer.get().flightPhase === FmgcFlightPhase.Done || this.observer.get().flightPhase === FmgcFlightPhase.Preflight) {
                this.tdPaused = false;
                this.apEngaged = false;
            }
        }

        if (this.cooldown > 0) {
            this.cooldown = Math.max(0, this.cooldown - deltaTime);
        }
    }

    updateTdReached(_deltaTime: number) {
        const tdReached = this.observer.get().flightPhase >= FmgcFlightPhase.Climb
            && this.observer.get().flightPhase <= FmgcFlightPhase.Cruise
            && Simplane.getAutoPilotAirspeedManaged()
            && this.aircraftToDescentProfileRelation.isPastTopOfDescent();

        if (tdReached !== this.tdReached) {
            this.tdReached = tdReached;
            SimVar.SetSimVarValue('L:A32NX_PFD_MSG_TD_REACHED', 'boolean', this.tdReached);
        }
    }
}
