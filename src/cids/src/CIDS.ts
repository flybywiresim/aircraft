import { Arinc429Word } from '@shared/arinc429';
import { FlightPhaseManager } from './FlightPhaseManager';

export class Cids {
    public static readonly DEBUG = true; // TODO: revert to false

    private readonly flightPhaseManager: FlightPhaseManager;

    // eslint-disable-next-line camelcase
    private readonly flightPhaseManagerUpdateThrottler: A32NX_Util.UpdateThrottler;

    constructor() {
        this.flightPhaseManager = new FlightPhaseManager(this);
        this.flightPhaseManagerUpdateThrottler = new A32NX_Util.UpdateThrottler(2000); // eslint-disable-line camelcase
    }

    public init(): void {
        console.log('[CIDS] Initializing CIDS...');
        this.flightPhaseManager.init();
    }

    public update(_deltaTime: number): void {
        if (this.flightPhaseManagerUpdateThrottler.canUpdate(_deltaTime) !== -1) {
            this.flightPhaseManager.update();
        }

        if (Cids.DEBUG) {
            const set = SimVar.SetSimVarValue;
            set('L:A32NX_CIDS_ON_GROUND', 'Bool', this.onGround());
            set('L:A32NX_CIDS_IS_STATIONARY', 'Bool', this.isStationary());
            set('L:A32NX_CIDS_ALL_DOORS_CLOSED_LOCKED', 'Bool', this.allDoorsClosedLocked());
            set('L:A32NX_CIDS_NW_STRG_PIN_INSERTED', 'Bool', this.nwStrgPinInserted());
            set('L:A32NX_CIDS_THR_LVR_1_POSITION', 'number', this.thrustLever1Position());
            set('L:A32NX_CIDS_THR_LVR_2_POSITION', 'number', this.thrustLever2Position());
            set('L:A32NX_CIDS_ALTITUDE', 'number', this.altitude());
            set('L:A32NX_CIDS_ALT_SELECTED', 'feet', this.fcuSelectedAlt());
            set('L:A32NX_CIDS_FPA_SELECTED', 'degrees', this.fpaSelected());
            set('L:A32NX_CIDS_VS_SELECTED', 'feet per minute', this.vsSelected());
            set('L:A32NX_CIDS_CRUISE_ALTITUDE', 'number', this.cruiseAltitude());
            set('L:A32NX_CIDS_ALT_CRZ_ACTIVE', 'Bool', this.altCrzActive());
            set('L:A32NX_CIDS_RA', 'number', this.radioAltitude());
            set('L:A32NX_CIDS_GS', 'number', this.groundSpeed());
            set('L:A32NX_CIDS_GEAR_DOWN_LOCKED', 'Bool', this.gearDownLocked());
            set('L:A32NX_CIDS_BOARDING_IN_PROGESS', 'Bool', this.boardingInProgress());
            set('L:A32NX_CIDS_DEBOARDING_IN_PROGRESS', 'Bool', this.deboardingInProgess());
            set('L:A32NX_CIDS_TOTAL_PAX', 'number', this.totalPax());
            set('L:A32NX_CIDS_TOTAL_PAX_DESIRED', 'number', this.totalPaxDesired());
        }
    }

    public onGround(): boolean {
        const lgciu1Nose = SimVar.GetSimVarValue('L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED', 'Bool');
        const lgciu2Nose = SimVar.GetSimVarValue('L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED', 'Bool');

        return lgciu1Nose || lgciu2Nose;
    }

    public isStationary(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'Bool');
    }

    public allDoorsClosedLocked(): boolean {
        return (
            SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 20
            && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent') < 20
            && SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'Bool')
        );
    }

    public nwStrgPinInserted(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool');
    }

    public thrustLever1Position(): number {
        return SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'number');
    }

    public thrustLever2Position(): number {
        return SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'number');
    }

    public altitude(): number {
        const alt1 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_1_ALTITUDE', 'Number'));
        const alt2 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_2_ALTITUDE', 'Number'));
        const alt3 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_3_ALTITUDE', 'Number'));

        return alt1.isNormalOperation() && alt1.value
        || alt2.isNormalOperation() && alt2.value
        || alt3.isNormalOperation() && alt3.value
        || -1;
    }

    public fcuSelectedAlt(): number {
        return Simplane.getAutoPilotDisplayedAltitudeLockValue('feet');
    }

    public fpaSelected(): number {
        return SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'degrees');
    }

    public vsSelected(): number {
        return SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
    }

    public cruiseAltitude(): number {
        return SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number');
    }

    public fmaVerticalMode(): number {
        return SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
    }

    public altCrzActive(): boolean {
        return SimVar.GetSimVarValue('L:A32NX_FMA_CRUISE_ALT_MODE', 'Bool');
    }

    public radioAltitude(): number {
        const ra1 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE', 'feet'));
        const ra2 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE', 'feet'));

        return ra1.isNormalOperation() && ra1.value
        || ra2.isNormalOperation() && ra2.value
        || -1;
    }

    public groundSpeed(): number {
        const gs1 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_1_GROUND_SPEED', 'number'));
        const gs2 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_2_GROUND_SPEED', 'number'));
        const gs3 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_3_GROUND_SPEED', 'number'));

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
        return (
            SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Number') === 1
            && this.totalPaxDesired() > this.totalPax()
        );
    }

    public deboardingInProgess(): boolean {
        return (
            SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'Number') === 1
            && this.totalPaxDesired() < this.totalPax()
        );
    }

    public totalPax(): number {
        return (
            SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_1_6', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_7_13', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_14_21', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_22_29', 'Number')
        );
    }

    public totalPaxDesired(): number {
        return (
            SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_1_6_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_7_13_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_14_21_DESIRED', 'Number')
          + SimVar.GetSimVarValue('L:A32NX_PAX_TOTAL_ROWS_22_29_DESIRED', 'Number')
        );
    }
}
