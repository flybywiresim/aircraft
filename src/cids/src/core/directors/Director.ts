import { FlightPhase } from '../../flightphases/FlightPhase';

export abstract class Director {
    abstract isFaulty: boolean;

    /**
     * Note that a director can be faulty and active at the same time!
     */
    abstract isActive: boolean;

    abstract flightPhase: FlightPhase;

    abstract onGround: boolean;

    abstract allDoorsClosedLocked: boolean;

    abstract nwStrgPinInserted: boolean;

    abstract thrustLever1Position: number;

    abstract thrustLever2Position: number;

    abstract gpwsFlap3: boolean;

    abstract flapsConfig: FlapsConfig;

    abstract altitude: number;

    abstract fcuSelectedAlt: number;

    abstract fmaVerticalMode: number;

    abstract fpaSelected: number;

    abstract vsSelected: number;

    abstract cruiseAltitude: number;

    abstract altCrzActive: boolean;

    abstract groundSpeed: number;

    abstract gearDownLocked: boolean;

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
     * @param oppositeDirector The second director. E.g. If this method belongs to DIR1, DIR2 will be the opposite director.
     */
    abstract init(oppositeDirector: Director): void;

    abstract update(): void;

    /* eslint-disable no-trailing-spaces */
    /**
     * Output computations to simvars. Will only execute if the executing director is active.
     * @param varName The name of the simvar to output the value to.
     *
     * **Note:** The correct prefix `L:A32NX_CIDS_DIR_{number}` is prepended and should be omitted when passing the simvar name to this method!
     * @param unit The unit of type {@link SimVar.SimVarUnit}.
     * @param value The value the simvar should hold.
     * @param force Output regardless of active/failed state.
     * @param onComplete Callback which is called once the simvar is set (promise has resolved).
     */
    abstract output(varName: string, unit: SimVar.SimVarUnit, value: any, onComplete?: () => void, force?: boolean,): void;
    /* eslint-enable no-trailing-spaces */

    abstract fail(): void;

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
