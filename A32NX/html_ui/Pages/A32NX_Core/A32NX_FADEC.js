class A32NX_FADEC {
    constructor(_engine) {
        this.engine = _engine;
        this.fadecTimer = -1;
    }

    init() {
        this.updateSimVars();
    }

    update(_deltaTime) {
        const dcAvail = SimVar.GetSimVarValue("L:DCPowerAvailable", "Bool");
        const masterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:" + (this.engine), "Bool");
        const ignitionState = SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum") == 2;

        if ((this.lastDCState != dcAvail && dcAvail == 1) || this.lastMasterState != masterState) {
            this.fadecTimer = 5 * 60;
        }

        if (this.lastIgnitionState != ignitionState && !ignitionState) {
            this.fadecTimer = 30;
        }
        this.fadecTimer -= _deltaTime / 1000;
        this.updateSimVars();
    }

    updateSimVars() {
        this.lastDCState = SimVar.GetSimVarValue("L:DCPowerAvailable", "Bool");
        this.lastMasterState = SimVar.GetSimVarValue("FUELSYSTEM VALVE SWITCH:" + (this.engine), "Bool");
        this.lastIgnitionState = SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum") == 2;
        SimVar.SetSimVarValue("L:A32NX_FADEC_POWERED_ENG" + this.engine, "Bool", this.isPowered() ? 1 : 0);
    }

    isPowered() {
        if (SimVar.GetSimVarValue("L:A32NX_FIRE_BUTTON_ENG" + this.engine, "Bool") == 1) {
            return false;
        }
        if (SimVar.GetSimVarValue("TURB ENG N2:" + this.engine, "Percent") > 15) {
            return true;
        }
        if (SimVar.GetSimVarValue("L:XMLVAR_ENG_MODE_SEL", "Enum") == 2) {
            return true;
        }
        if (this.fadecTimer > 0) {
            return true;
        }
        return false;
    }
}