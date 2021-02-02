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

        this.autopilotDisconnect(_deltaTime, this.cautionLeft, this.cautionRight);
    }

    autopilotDisconnect(_deltaTime, cautionLeft, cautionRight) {
        this.AutothrottleWarningCanceled = false;

        const apStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
        const atherStatus = SimVar.GetSimVarValue("AUTOTHROTTLE ACTIVE", "Bool");

        if (atherStatus === true) {
            this.AutothrottleWarningCanceled = false;
        }

        if (atherStatus === false && this.AutothrottleWarningCanceled === false) {
            if (cautionLeft === 1 || cautionRight === 1) {
                this.AutothrottleWarningCanceled === true
                SimVar.SetSimVarValue("L:A32NX_ATHR_DISC", "Bool", false);
                SimVar.SetSimVarValue("L:A32NX_MASTER_CAUTION", "Bool", false);
                SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", false);
            }
            SimVar.SetSimVarValue("L:A32NX_ATHR_DISC", "Bool", true);
            SimVar.SetSimVarValue("L:A32NX_MASTER_CAUTION", "Bool", true);
            SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", true);
        }
    }
}
