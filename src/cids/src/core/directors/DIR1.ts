import { Arinc429Word } from '@shared/arinc429';
import { DIR2 } from './DIR2';
import { Director } from './Director';
import { FlightPhase } from '../../flightphases/FlightPhase';
import { FlightPhaseManager } from '../../flightphases/FlightPhaseManager';
import { CidsOrchestrator } from '../CidsOrchestrator';

export class DIR1 extends Director {
    private isInit: boolean;

    private dir2: DIR2;

    private flightPhaseManager: FlightPhaseManager;

    private isDir2Faulty: boolean;

    private isDir2Active: boolean;

    public isFaulty: boolean;

    public isActive: boolean;

    private fwcFlightPhase: number;

    public flightPhase: FlightPhase;

    public onGround: boolean;

    public allDoorsClosedLocked: boolean;

    public nwStrgPinInserted: boolean;

    public thrustLever1Position: number;

    public thrustLever2Position: number;

    public gpwsFlap3: boolean;

    public flapsConfig: FlapsConfig;

    public altitude: number;

    public fcuSelectedAlt: number;

    public fmaVerticalMode: number;

    public fpaSelected: number;

    public vsSelected: number;

    public cruiseAltitude: number;

    public altCrzActive: boolean;

    public groundSpeed: number;

    public gearDownLocked: boolean;

    constructor() {
        super();

        /* Instantiate Managers */
        this.flightPhaseManager = new FlightPhaseManager(this);
        // new managers here...

        this.isFaulty = false;
        this.isActive = true;
        this.isInit = false;
    }

    public init(dir2: DIR2): void {
        console.log('[CIDS/DIR1] Initializing...');
        this.dir2 = dir2;

        /* Set simvars */
        this.output('FAULT', 'Bool', this.isFaulty, null, true);
        this.output('ACTIVE', 'Bool', this.isActive, null, true);

        /* Initialize Managers */
        this.flightPhaseManager.init();

        this.isInit = true;
    }

    public update(): void {
        if (!this.isInit) {
            throw new Error('[CIDS/DIR1] update() was called before initialization!');
        }

        this.updateActiveStatus();

        this.readDataInterfaces();

        /* Update Managers */
        this.flightPhaseManager.update();

        if (CidsOrchestrator.DEBUG) {
            const set = SimVar.SetSimVarValue;
            const get = SimVar.GetSimVarValue;
            const varname = 'L:A32NX_CIDS_DEBUG_DIR_1';
            set(`${varname}_IS_ACTIVE`, 'Bool', this.isActive);
            set(`${varname}_LGCIU_1_DISCRETE_1_SSM`, 'number', new Arinc429Word(get(`${varname}_LGCIU_1_SSM`, 'number')).ssm);
            set(`${varname}_ADIRS_ADR_1_ALTITUDE_SSM`, 'number', new Arinc429Word(get('L:A32NX_ADIRS_ADR_1_ALTITUDE', 'number')).ssm);
            set(`${varname}_ADIRS_IR_GROUD_SPEED_SSM`, 'number', new Arinc429Word(get('L:A32NX_ADIRS_IR_3_GROUND_SPEED', 'number')).ssm);
            set(`${varname}_LGCIU_1_DISCRETE_2_SSM`, 'number', new Arinc429Word(get('L:A32NX_LGCIU_1_DISCRETE_WORD_2', 'number')).ssm);
            set(`${varname}_FWC_FLIGHT_PHASE`, 'number', this.fwcFlightPhase);
            set(`${varname}_ON_GROUND`, 'Bool', this.onGround);
            set(`${varname}_ALL_DOORS_CLOSED_LOCKED`, 'Bool', this.allDoorsClosedLocked);
            set(`${varname}_NW_STRG_PIN_INSERTED`, 'Bool', this.nwStrgPinInserted);
            set(`${varname}_THR_LVR_1_POS`, 'number', this.thrustLever1Position);
            set(`${varname}_THR_LVR_2_POS`, 'number', this.thrustLever2Position);
            set(`${varname}_GPWS_FLAP_3`, 'Bool', this.gpwsFlap3);
            set(`${varname}_FLAPS_CONFIG`, 'number', this.flapsConfig);
            set(`${varname}_ALTITUDE`, 'number', this.altitude);
            set(`${varname}_FMA_VERTICAL_MODE`, 'number', this.fmaVerticalMode);
            set(`${varname}_ALT_SELECTED`, 'feet', this.fcuSelectedAlt);
            set(`${varname}_FPA_SELECTED`, 'degrees', this.fpaSelected);
            set(`${varname}_VS_SELECTED`, 'feet per minute', this.vsSelected);
            set(`${varname}_CRUISE_ALTITUDE`, 'number', this.cruiseAltitude);
            set(`${varname}_ALT_CRZ_ACTIVE`, 'Bool', this.altCrzActive);
            set(`${varname}_GS`, 'number', this.groundSpeed);
            set(`${varname}_GEAR_DOWN_LOCKED`, 'Bool', this.gearDownLocked);
            set('L:A32NX_CIDS_DEBUG_BOARDING_IN_PROGRESS', 'Bool', this.boardingInProgress);
            set('L:A32NX_CIDS_DEBUG_DEBOARDING_IN_PROGRESS', 'Bool', this.deboardingInProgress);
            set('L:A32NX_CIDS_DEBUG_TOTAL_PAX', 'number', this.totalPax);
            set('L:A32NX_CIDS_DEBUG_TOTAL_PAX_DESIRED', 'number', this.totalPaxDesired);
        }
    }

    public output(varName: string, unit: SimVar.SimVarUnit, value: any, onComplete?: () => void, force?: boolean): void {
        if (CidsOrchestrator.DEBUG) {
            console.log('[CIDS/DIR1] Received output command. Payload:', { varName, unit, value, onComplete });
        }

        const completeVarName = `L:A32NX_CIDS_DIR_1_${varName}`;
        if (this.isActive && !this.isFaulty || force) {
            SimVar.SetSimVarValue(completeVarName, unit, value)
                .then(onComplete)
                .catch((error) => console.error('[CIDS/DIR1] There was an error while writing to output! Error:', error, '\rInput:', { completeVarName, unit, value }));
        }
    }

    /**
     * Fails this director.
     */
    public fail(): void {
        this.output('FAULT', 'Bool', true, () => console.log('[CIDS/DIR1] FAULT'));
        this.isFaulty = true;
    }

    /**
     * Reads data from all physically connected systems and writes them to memory.
     */
    private readDataInterfaces(): void {
        this.isDir2Faulty = this.dir2.isFaulty; // TODO: use simvar instead of instance method
        this.isDir2Active = this.dir2.isActive; // TODO: use simvar instead of instance method
        this.isFaulty = SimVar.GetSimVarValue('L:A32NX_CIDS_DIR_1_FAULT', 'Bool');
        this.isActive = SimVar.GetSimVarValue('L:A32NX_CIDS_DIR_1_ACTIVE', 'Bool');
        this.fwcFlightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');
        this.flightPhase = this.flightPhaseManager.getFlightPhaseFromId(SimVar.GetSimVarValue('L:A32NX_CIDS_DIR_1_FLIGHT_PHASE', 'Enum'));
        this.onGround = this.isOnGround();
        this.allDoorsClosedLocked = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 20
                                    && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent') < 20
                                    && SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'Bool');
        this.nwStrgPinInserted = SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool');
        this.thrustLever1Position = SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'number');
        this.thrustLever2Position = SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'number');
        this.gpwsFlap3 = SimVar.GetSimVarValue('L:A32NX_GPWS_FLAP_OFF', 'Bool');
        this.flapsConfig = this.getFlapsConfig();
        this.altitude = this.decodeAltitude();
        this.fcuSelectedAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue(); // TODO: This should use ARINC429 once https://github.com/flybywiresim/a32nx/pull/7587 is merged.
        this.fmaVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');
        this.fpaSelected = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'degrees');
        this.vsSelected = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'feet per minute');
        this.cruiseAltitude = SimVar.GetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number');
        this.altCrzActive = SimVar.GetSimVarValue('L:A32NX_FMA_CRUISE_ALT_MODE', 'Bool');
        this.groundSpeed = this.decodeGroundSpeed();
        this.gearDownLocked = this.isGearDownLocked();

        this.totalPax = this.getTotalPax();
        this.totalPaxDesired = this.getTotalPaxDesired();
        this.boardingInProgress = this.isBoardingInProgress();
        this.deboardingInProgress = this.isDeboardingInProgess();
    }

    /**
     * Checks if this director should be active and sets the flag accordingly.
     */
    private updateActiveStatus(): void {
        if (this.isActive) {
            if (!this.isFaulty) {
                this.isActive = true;
            } else if (!this.isDir2Faulty) {
                this.isActive = false;
            } else {
                this.isActive = true;
            }
        } else if (this.isDir2Active) {
            this.isActive = false;
        } else {
            this.isActive = true;
        }
    }

    private decodeAltitude(): number {
        const alt1 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_1_ALTITUDE', 'number'));
        const alt3 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_3_ALTITUDE', 'number'));

        if (alt1.isNormalOperation()) {
            return alt1.value;
        }
        if (alt3.isNormalOperation()) {
            return alt3.value;
        }
        if (this.fwcFlightPhase === 1 || this.fwcFlightPhase === 10) return 0;

        console.log('decode alt: calling fail');
        this.fail();
        return 0;
    }

    private decodeGroundSpeed(): number {
        const gs1 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_1_GROUND_SPEED', 'number'));
        const gs3 = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_ADIRS_IR_3_GROUND_SPEED', 'number'));

        if (gs1.isNormalOperation()) {
            return gs1.value;
        }
        if (gs3.isNormalOperation()) {
            return gs3.value;
        }
        if (gs1.isNoComputedData() && gs3.isNoComputedData() && (this.fwcFlightPhase === 1 || this.fwcFlightPhase === 10)) {
            return 0;
        }

        console.log('decode gs: calling fail');
        this.fail();
        return 0;
    }

    private isGearDownLocked(): boolean {
        const lgciu1Discrete = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_LGCIU_1_DISCRETE_WORD_1', 'number'));

        if (lgciu1Discrete.isNormalOperation()) {
            return lgciu1Discrete.getBitValue(25);
        }
        if (this.fwcFlightPhase === 1 || this.fwcFlightPhase === 10) return true;

        console.log('geardownlocked: calling fail');
        this.fail();
        return false;
    }

    private isOnGround(): boolean {
        const lgciu1Discrete = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_LGCIU_1_DISCRETE_WORD_2', 'number'));

        if (lgciu1Discrete.isNormalOperation()) {
            return lgciu1Discrete.getBitValue(12);
        }

        console.log('onground: calling fail');
        this.fail();
        return false;
    }

    private getFlapsConfig(): FlapsConfig {
        const flapConfig = new Arinc429Word(SimVar.GetSimVarValue('L:A32NX_SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD', 'number'));

        if (flapConfig.isNormalOperation() && flapConfig.getBitValue(18)) {
            if (flapConfig.getBitValue(23)) return 4;
            if (flapConfig.getBitValue(22)) return 3;
            if (flapConfig.getBitValue(21)) return 2;
            if (flapConfig.getBitValue(20)) return 1;
            if (flapConfig.getBitValue(19)) return 0;
        }
        if (flapConfig.isNoComputedData() && (this.fwcFlightPhase === 1 || this.fwcFlightPhase === 10)) return 0;

        console.log('flaps decode: callling fail');
        this.fail();
        return 0;
    }
}
