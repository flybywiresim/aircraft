import { FlightPhaseManager } from './FlightPhaseManager';

export class Cids {
    private readonly flightPhaseManager: FlightPhaseManager;

    // eslint-disable-next-line camelcase
    private readonly flightPhaseManagerUpdateThrottler: A32NX_Util.UpdateThrottler;

    constructor() {
        this.flightPhaseManager = new FlightPhaseManager(this);
        this.flightPhaseManagerUpdateThrottler = new A32NX_Util.UpdateThrottler(1500);
    }

    public init(): void {
        console.log('[CIDS] Initializing CIDS...');
        this.flightPhaseManager.init();
        console.log('[CIDS] Initialition complete.');
    }

    public update(_deltaTime: number): void {
        console.log('[CIDS] Update started...');

        if (!SimVar.GetSimVarValue('L:A32NX_IS_READY', 'Bool')) {
            console.log('[CIDS] Aircraft not ready, aborting update.');
            return;
        }

        if (this.flightPhaseManagerUpdateThrottler.canUpdate(_deltaTime) !== -1) {
            this.flightPhaseManager.update(_deltaTime);
        }
        console.log('[CIDS] Update complete.');
    }

    public boardingInProgress(): boolean {
        const boardingInProgress = SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Number') === 1
                                && this.getTotalPaxDesired() > this.getTotalPax();

        return boardingInProgress;
    }

    public deboardingInProgess(): boolean {
        const deboardingInProgess = SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Number') === 1
                                 && this.getTotalPaxDesired() < this.getTotalPax();

        return deboardingInProgess;
    }

    public onGround(): boolean {
        const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');

        return isOnGround;
    }

    public gearDown(): boolean {
        const isGearDown = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') === 1;

        return isGearDown;
    }

    public getTotalPax(): number {
        return (
            SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_14_21', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_22_29', 'Number')
        );
    }

    public getTotalPaxDesired(): number {
        return (
            SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_1_6_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_7_13_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_14_21_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_22_29_DESIRED', 'Number')
        );
    }
}
