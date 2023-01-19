import { CidsOrchestrator } from '../CidsOrchestrator';
import { DirectorMemory } from './DirectorMemory';

export abstract class Director {
    abstract memory: DirectorMemory;

    public boardingInProgress: boolean;

    public deboardingInProgress: boolean;

    public totalPax: number;

    public totalPaxDesired: number;

    constructor() {
        this.totalPax = this.getTotalPax();
        this.totalPaxDesired = this.getTotalPaxDesired();
    }

    /**
     * This method should not call methods only available when the CIDS is powered as it will run them regardless of the power state.
     * @param oppositeDirector The second director. E.g. If this method is an instance of DIR1, DIR2 will be the opposite director.
     */
    abstract init(oppositeDirector: Director): void;

    abstract update(): void;

    abstract isFaulty(): boolean;

    abstract isActive(): boolean;

    abstract fail(): void;

    /**
     * Output of each director which filters if computed values should really be output -> aka the director is active and not faulty.
     * @param varName The simvar to output the value to.
     * @param unit The unit of type {@link SimVar.SimVarUnit}.
     * @param value The value the simvar should hold.
     * @param onComplete Callback which is called once the simvar is set.
     * @param force Forces the output to be written regardless of active/faulty state.
     */
    public output(varName: string, unit: SimVar.SimVarUnit, value: any, onComplete?: () => void, force = false): void {
        if (CidsOrchestrator.DEBUG) {
            console.log('[CIDS/DIR] Received output command. Payload:', { 'SimVar name': varName, 'Unit': unit, 'Value:': value, 'Force': force });
        }

        if (this.isActive && !this.isFaulty || force) {
            SimVar.SetSimVarValue(varName, unit, value)
                .then(onComplete)
                .catch((error) => console.error(
                    '[CIDS/DIR] There was an error while writing to output! Error:',
                    error,
                    '\rInput:',
                    { 'SimVar name': varName, 'Unit': unit, 'Value:': value },
                ));
        }
    }

    protected isBoardingInProgress(): boolean {
        return (
            SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Number') === 1
            && this.totalPaxDesired > this.totalPax
        );
    }

    protected isDeboardingInProgess(): boolean {
        return (
            SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Number') === 1
            && this.totalPaxDesired < this.totalPax
        );
    }

    protected getTotalPax(): number {
        return (
            SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_14_21', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_22_29', 'Number')
        );
    }

    protected getTotalPaxDesired(): number {
        return (
            SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_1_6_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_7_13_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_14_21_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_22_29_DESIRED', 'Number')
        );
    }
}
