class A32NX_Warning {
    constructor(_core) {
        console.log('A32NX_Warning constructed');

        this.warningLeft = false;
        this.warningRight = false;
        this.cautionLeft = false;
        this.cautionRight = false;
        this.AutothrottleWarningCanceled = false;
        this.athrdeltaTime = 0;
        this.apdeltaTime = 0;
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

        this.autopilotDisconnect(_deltaTime, this.cautionLeft, this.cautionRight, this.warningLeft, this.warningRight);
    } 

    autopilotDisconnect(_deltaTime, cautionLeft, cautionRight, warningLeft, warningRight) {
        const apStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
        const atherStatus = SimVar.GetSimVarValue("AUTOTHROTTLE ACTIVE", "Bool");

        if (atherStatus === 1) {
            SimVar.SetSimVarValue("L:A32NX_ATHR_DISC", "Bool", false);
            SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", false);
            this.AutothrottleWarningCanceled = false;
            this.athrdeltaTime = 0;
        }

        if (atherStatus === 0 && this.AutothrottleWarningCanceled === false) {
            SimVar.SetSimVarValue("L:A32NX_ATHR_DISC", "Bool", true);
            SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", true);
            this.athrdeltaTime += _deltaTime;
            if (cautionLeft === 1 || cautionRight === 1 || (this.athrdeltaTime / 1000) >= 3) {
                this.AutothrottleWarningCanceled = true;
                SimVar.SetSimVarValue("L:A32NX_ATHR_DISC", "Bool", false);
                SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", false);
                this.athrdeltaTime = 0;
            }
        }

        if (apStatus === 1) {
            SimVar.SetSimVarValue("L:A32NX_AP_DISC", "Bool", false);
            SimVar.SetSimVarValue("L:Generic_Master_Warning_Active", "Bool", false);
            this.AutopiloteWarningCanceled = false;
            this.apdeltaTime = 0;
        }

        if (apStatus === 0 && this.AutopiloteWarningCanceled === false) {
            SimVar.SetSimVarValue("L:A32NX_AP_DISC", "Bool", true);
            SimVar.SetSimVarValue("L:Generic_Master_Warning_Active", "Bool", true);
            this.apdeltaTime += _deltaTime;
            if (warningLeft === 1 || warningRight === 1 || (this.apdeltaTime / 1000) >= 3) {
                this.AutopiloteWarningCanceled = true;
                SimVar.SetSimVarValue("L:A32NX_AP_DISC", "Bool", false);
                SimVar.SetSimVarValue("L:Generic_Master_Warning_Active", "Bool", false);
                this.apdeltaTime = 0;
            }
        }
    }
}
