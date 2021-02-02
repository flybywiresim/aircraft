class A32NX_Warning {
    constructor(_core) {
        console.log('A32NX_Warning constructed');

        this.warningLeft = false;
        this.warningRight = false;
        this.cautionLeft = false;
        this.cautionRight = false;
    }

    init() {
        console.log('A32NX_Warning init');
    }

    update(_deltaTime, _core) {
        this.warningLeft = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERAWARN_L", "Bool");
        this.warningRight = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERAWARN_R", "Bool");
        this.cautionLeft = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERCAUT_L", "Bool");
        this.cautionRight = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERCAUT_R", "Bool");

        if (this.warningLeft === 1 || this.warningRight === 1) {
            SimVar.SetSimVarValue("L:A32NX_MASTER_WARNING", "Bool", false);
            SimVar.SetSimVarValue("L:Generic_Master_Warning_Active", "Bool", false);
        }
        if (this.cautionLeft === 1 || this.cautionRight === 1) {
            SimVar.SetSimVarValue("L:A32NX_MASTER_CAUTION", "Bool", false);
            SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", false);
        }
    }
}
