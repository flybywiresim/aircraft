import { Arinc429Word } from '@shared/arinc429';
import { FlightPhaseManager } from '../../flightphases/FlightPhaseManager';
import { Cids } from '../CidsConstants';
import { DIR1 } from './DIR1';
import { Director } from './Director';
import { DirectorMemory } from './DirectorMemory';

export class DIR2 extends Director {
    private isInit: boolean;

    private dir1: DIR1;

    private flightPhaseManager: FlightPhaseManager;

    public memory: DirectorMemory;

    constructor() {
        super();

        this.memory = new DirectorMemory();

        /* Instantiate Managers */
        this.flightPhaseManager = new FlightPhaseManager(this);
        // new managers here...

        this.isInit = false;
    }

    public init(dir1: DIR1): void {
        console.log('[CIDS/DIR2] Initializing...');
        this.dir1 = dir1;

        this.isInit = true;
    }

    public update(): void {
        if (!this.isInit) {
            throw new Error('[CIDS/DIR2] update() was called before initialization!');
        }

        this.updateActiveState();

        if (this.isFaulty()) return;

        this.writeMemory();

        if (Cids.DEBUG) {
            const set = SimVar.SetSimVarValue;
            const varname = 'L:A32NX_CIDS_DEBUG_DIR_2';

            set(`${varname}_FWC_FLIGHT_PHASE`, 'number', this.memory.fwcFlightPhase);
            set(`${varname}_ALL_DOORS_CLSD_LCKED`, 'Bool', this.memory.allDoorsClosedLocked);
            set(`${varname}_NW_STRG_DISC`, 'Bool', this.memory.nwStrgPinInserted);
            set(`${varname}_THR_LVR_1_POS`, 'number', this.memory.thrustLever1Position);
            set(`${varname}_THR_LVR_2_POS`, 'number', this.memory.thrustLever2Position);
            set(`${varname}_GPWS_FLAP_3`, 'Bool', this.memory.gpwsFlap3);
            set(`${varname}_FLAPS_CONF`, 'number', this.memory.flapsConfig);
            set(`${varname}_ALT`, 'number', this.memory.altitude);
            set(`${varname}_FCU_SEL_ALT`, 'number', this.memory.fcuSelectedAlt);
            set(`${varname}_FMA_VERT_MODE`, 'number', this.memory.fmaVerticalMode);
            set(`${varname}_FPA_SEL`, 'number', this.memory.fpaSelected);
            set(`${varname}_VS_SEL`, 'number', this.memory.vsSelected);
            set(`${varname}_CRZ_ALT`, 'number', this.memory.cruiseAltitude);
            set(`${varname}_ALT_CRZ_ACTIVE`, 'Bool', this.memory.altCrzActive);
            set(`${varname}_GS`, 'number', this.memory.groundSpeed);
            set(`${varname}_GEAR_DWN_LCKD`, 'Bool', this.memory.gearDownLocked);
        }

        /* UPdate Managers */
        this.flightPhaseManager.update();

        this.memory.clear();
    }

    public startup(): void {
        if (!this.isInit) {
            throw new Error('[CIDS/DIR2] startup() was called before initialization!');
        }

        console.log('[CIDS/DIR2] Booting...');

        // Should BITE ever be implemented a power up test should be performed before setting these simvars
        this.output(Cids.SimVar.DIR2.FAULT, 'Bool', false, null, true);
        this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', true, null, true);

        /* Initialize Managers */
        this.flightPhaseManager.init();
    }

    public shutdown(): void {
        console.log('[CIDS/DIR2] Shutting down...');

        this.memory.clear();
        this.output(Cids.SimVar.FLIGHT_PHASE, 'Enum', 0, null, true);
        this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', false, null, true);
    }

    public fail(): void {
        this.output(Cids.SimVar.DIR2.FAULT, 'Bool', true, () => console.log('[CIDS/DIR2] FAULT'));
        this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', false);
        this.memory.clear();
    }

    public isFaulty(): boolean {
        return SimVar.GetSimVarValue(Cids.SimVar.DIR2.FAULT, 'Bool');
    }

    public isActive(): boolean {
        return SimVar.GetSimVarValue(Cids.SimVar.DIR2.ACTIVE, 'Bool');
    }

    /**
     * Reads data from all physically connected systems and writes them to memory.
     */
    private writeMemory(): void {
        this.memory.fwcFlightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');
        this.memory.onGround = this.isOnGround();
        this.memory.allDoorsClosedLocked = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 20
                                    && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent') < 20
                                    && SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'Bool');
        this.memory.nwStrgPinInserted = SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool');
        this.memory.thrustLever1Position = SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'number');
        this.memory.thrustLever2Position = SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'number');
        this.memory.gpwsFlap3 = SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'Bool');
        this.memory.flapsConfig = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'number'); // TODO: This should use ARINC429 once both SFCCs are implemented.
        this.memory.altitude = this.decodeAltitude();
        this.memory.fcuSelectedAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue(); // TODO: This should use ARINC429 once https://github.com/flybywiresim/a32nx/pull/7587 is merged.
        this.memory.fmaVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
        this.memory.fpaSelected = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'degrees');
        this.memory.vsSelected = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
        this.memory.cruiseAltitude = SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number');
        this.memory.altCrzActive = SimVar.GetSimVarValue('L:A32NX_FMA_CRUISE_ALT_MODE', 'Bool');
        this.memory.groundSpeed = this.decodeGroundSpeed();
        this.memory.gearDownLocked = this.isGearDownLocked();

        this.totalPax = this.getTotalPax();
        this.totalPaxDesired = this.getTotalPaxDesired();
        this.boardingInProgress = this.isBoardingInProgress();
        this.deboardingInProgress = this.isDeboardingInProgess();
    }

    private updateActiveState(): void {
        if (this.dir1.isActive()) {
            this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', false, null, true);
        } else if (!this.isFaulty()) {
            this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', true, null, true);
        } else {
            this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', false, null, true);
        }
    }

    private decodeAltitude(): number {
        const alt2 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_2_ALTITUDE', 'number'));
        const alt3 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_3_ALTITUDE', 'number'));

        if (alt2.isNormalOperation()) {
            return alt2.value;
        }
        if (alt3.isNormalOperation()) {
            return alt3.value;
        }
        if (this.memory.fwcFlightPhase === 1 || this.memory.fwcFlightPhase === 10) return 0;

        console.log('decode alt: calling fail');
        this.fail();
        return 0;
    }

    private decodeGroundSpeed(): number {
        const gs2 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_2_GROUND_SPEED', 'number'));
        const gs3 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_3_GROUND_SPEED', 'number'));

        if (gs2.isNormalOperation()) {
            return gs2.value;
        }
        if (gs3.isNormalOperation()) {
            return gs3.value;
        }
        if (gs2.isNoComputedData() || gs3.isNoComputedData() && (this.memory.fwcFlightPhase === 1 || this.memory.fwcFlightPhase === 10)) {
            return 0;
        }

        console.log('decode gs: calling fail');
        this.fail();
        return 0;
    }

    private isGearDownLocked(): boolean {
        const lgciu2Discrete = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_LGCIU_2_DISCRETE_WORD_1', 'number'));

        if (lgciu2Discrete.isNormalOperation()) {
            return lgciu2Discrete.getBitValue(25);
        }

        console.log('geardownlocked: calling fail');
        this.fail();
        return false;
    }

    private isOnGround(): boolean {
        const lgciu2Discrete = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_LGCIU_2_DISCRETE_WORD_2', 'number'));

        if (lgciu2Discrete.isNormalOperation()) {
            return lgciu2Discrete.getBitValue(12);
        }

        console.log('onground: calling fail');
        this.fail();
        return false;
    }
}
