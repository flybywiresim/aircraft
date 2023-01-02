import { Arinc429Word } from '@shared/arinc429';
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

    public onGround(): boolean {
        const lgciu1Nose = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED', 'Bool');
        const lgciu2Nose = SimVar.GetSimVarValue('L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED', 'Bool');

        return lgciu1Nose || lgciu2Nose;
    }

    public isStationary(): boolean {
        const isStationary = SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'Bool');

        return isStationary;
    }

    public door1LPercentOpen(): number {
        const door1LState = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent');

        return door1LState;
    }

    public door3RPercentOpen(): number {
        const door3RState = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent');

        return door3RState;
    }

    public fwdDoorCargoLocked(): boolean {
        const fwdDoorCargoLocked = SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'percent');

        return fwdDoorCargoLocked;
    }

    public allDoorsClosedLocked(): boolean {
        const allDoorsClosedLocked = this.door1LPercentOpen() < 20
        && this.door3RPercentOpen() < 20
        && this.fwdDoorCargoLocked();

        return allDoorsClosedLocked;
    }

    public nwStrgPinInserted(): boolean {
        const nwStrgPinInserted = SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool');

        return nwStrgPinInserted;
    }

    public thrustLever1Position(): number {
        const thrustLever1Position = SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'Number');

        return thrustLever1Position;
    }

    public thrustLever2Position(): number {
        const thrustLever2Position = SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'Number');

        return thrustLever2Position;
    }

    public altitude(): number {
        const alt1: Arinc429Word = SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_1_ALTITUDE', 'Number');
        const alt2: Arinc429Word = SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_2_ALTITUDE', 'Number');
        const alt3: Arinc429Word = SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_3_ALTITUDE', 'Number');

        return alt1.isNormalOperation() && alt1.value
        || alt2.isNormalOperation() && alt2.value
        || alt3.isNormalOperation() && alt3.value
        || -1;
    }

    public cruiseAltitude(): number {
        const cruiseAltitude = SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'feet');

        return cruiseAltitude;
    }

    public altCrzActive(): boolean {
        const altCrzActive = SimVar.GetSimVarValue('L:A32NX_FMA_CRUISE_ALT_MODE', 'Bool');

        return altCrzActive;
    }

    public radioAltitude(): number {
        const ra1: Arinc429Word = SimVar.GetSimVarValue('A32NX_RA_1_RADIO_ALTITUDE', 'feet');
        const ra2: Arinc429Word = SimVar.GetSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE', 'feet');

        return ra1.isNormalOperation() && ra1.value
        || ra2.isNormalOperation() && ra2.value
        || -1;
    }

    public groundSpeed(): number {
        const gs1: Arinc429Word = SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_1_GROUND_SPEED', 'number');
        const gs2: Arinc429Word = SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_2_GROUND_SPEED', 'number');
        const gs3: Arinc429Word = SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_3_GROUND_SPEED', 'number');

        return gs1.isNormalOperation() && gs1.value
        || gs2.isNormalOperation() && gs2.value
        || gs3.isNormalOperation() && gs3.value
        || -1;
    }

    public gearDownLocked(): boolean {
        const lgciu1Nose = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_NOSE_GEAR_DOWNLOCKED', 'Bool');
        const lgciu1Left = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_LEFT_GEAR_DOWNLOCKED', 'Bool');
        const lgciu1Right = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_RIGHT_GEAR_DOWNLOCKED', 'Bool');

        const lgciu2Nose = SimVar.GetSimVarValue('L:A32NX_LGCIU_2_NOSE_GEAR_DOWNLOCKED', 'Bool');
        const lgciu2Left = SimVar.GetSimVarValue('L:A32NX_LGCIU_2_LEFT_GEAR_DOWNLOCKED', 'Bool');
        const lgciu2Right = SimVar.GetSimVarValue('L:A32NX_LGCIU_2_RIGHT_GEAR_DOWNLOCKED', 'Bool');

        return lgciu1Nose && lgciu1Left && lgciu1Right
        || lgciu2Nose && lgciu2Left && lgciu2Right;
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
