export class A32NX_FADEC {
    engine: any;

    fadecTimer: number;

    dcEssPoweredInPreviousUpdate: any;

    lastMasterState: number;

    lastIgnitionState: boolean;

    constructor(engine) {
        this.engine = engine;
        this.fadecTimer = -1;
        this.dcEssPoweredInPreviousUpdate = false;
    }

    init() {
        this.updateSimVars();
    }

    update(deltaTime) {
        const dcEssIsPowered = this.isDcEssPowered();
        const masterState = SimVar.GetSimVarValue(`FUELSYSTEM VALVE SWITCH:${this.engine}`, 'Bool');
        const ignitionState = SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'Enum') === 2;

        if ((this.dcEssPoweredInPreviousUpdate !== dcEssIsPowered && dcEssIsPowered === 1) || this.lastMasterState !== masterState) {
            this.fadecTimer = 5 * 60;
        }

        if (this.lastIgnitionState !== ignitionState && !ignitionState) {
            this.fadecTimer = 30;
        }
        this.fadecTimer -= deltaTime / 1000;
        this.updateSimVars();
        this.dcEssPoweredInPreviousUpdate = dcEssIsPowered;
    }

    updateSimVars() {
        this.lastMasterState = SimVar.GetSimVarValue(`FUELSYSTEM VALVE SWITCH:${this.engine}`, 'Bool');
        this.lastIgnitionState = SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'Enum') === 2;
        SimVar.SetSimVarValue(`L:A32NX_FADEC_POWERED_ENG${this.engine}`, 'Bool', this.isPowered() ? 1 : 0);
    }

    isPowered() {
        if (SimVar.GetSimVarValue(`L:A32NX_FIRE_BUTTON_ENG${this.engine}`, 'Bool') === 1) {
            return false;
        }
        if (SimVar.GetSimVarValue(`TURB ENG N2:${this.engine}`, 'Percent') > 15) {
            return true;
        }
        if (SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'Enum') === 2) {
            return true;
        }
        if (this.fadecTimer > 0) {
            return true;
        }
        return false;
    }

    isDcEssPowered() {
        // This will have to be revisited when implementing the FADEC. One shouldn't consider this reference
        // to DC ESS valuable: it might be powered by multiple buses or related to other things altogether.
        return SimVar.GetSimVarValue('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'Bool');
    }
}
