class A32NX_Warning {
    constructor(_core) {
        console.log('A32NX_Warning constructed');

        this.previousTargetAltitude = NaN;
        this._wasBellowThreshold = false;
        this._wasAboveThreshold = false;
        this._wasInRange = false;
        this.warning = false;
        this.caution = false;
        this.timerWarning = 0;
        this.timerCaution = 0;
        this.warningLeft = false;
        this.warningRight = false;
        this.cautionLeft = false;
        this.cautionRight = false;
    }

    init() {
        console.log('A32NX_Warning init');
    }

    update(_deltaTime, _core) {
        let indicatedAltitude = Simplane.getAltitude();
        this.warningLeft = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERAWARN_L", "Bool");
        this.warningRight = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERAWARN_R", "Bool");
        this.cautionLeft = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERCAUT_L", "Bool");
        this.cautionRight = SimVar.GetSimVarValue("L:PUSH_AUTOPILOT_MASTERCAUT_R", "Bool");

        this.altitudeWarning(indicatedAltitude, _deltaTime, this.warningLeft, this.warningRight);
    }

    altitudeWarning(indicatedAltitude, _deltaTime, warningLeft, warningRight) {
        SimVar.SetSimVarValue("L:A32NX_ALT_DEVIATION_SHORT", "Bool", false);
        SimVar.SetSimVarValue("L:A32NX_ALT_DEVIATION", "Bool", false);

        // Exit when:
        // - Landing gear down
        // - Glide slope captured
        const landingGearIsDown = !SimVar.GetSimVarValue("IS GEAR RETRACTABLE", "Boolean") || SimVar.GetSimVarValue("GEAR HANDLE POSITION", "Boolean");
        const glideSlopeCaptured = SimVar.GetSimVarValue("L:GLIDE_SLOPE_CAPTURED", "bool") === 1;
        if (landingGearIsDown || glideSlopeCaptured) {
            return;
        }

        const currentAltitudeConstraint = SimVar.GetSimVarValue("L:A32NX_AP_CSTN_ALT", "feet");
        // Use the constraint altitude if provided otherwise use selected altitude lock value
        const targetAltitude = currentAltitudeConstraint && !this.getAutopilotMode() ? currentAltitudeConstraint : Simplane.getAutoPilotSelectedAltitudeLockValue();

        // Exit when selected altitude is being changed
        if (this.previousTargetAltitude !== targetAltitude) {
            this.previousTargetAltitude = targetAltitude;
            this._wasBellowThreshold = false;
            this._wasAboveThreshold = false;
            this._wasInRange = false;
            return;
        }

        if (warningLeft === 1 || warningRight === 1) {
            this._wasBellowThreshold = false;
            this._wasInRange = false;
            SimVar.SetSimVarValue("L:A32NX_ALT_DEVIATION", "Bool", false);
            return;
        }

        const delta = Math.abs(indicatedAltitude - targetAltitude);

        if (delta < 250) {
            this._wasBellowThreshold = true;
            this._wasAboveThreshold = false;
        }

        if (750 < delta) {
            this._wasAboveThreshold = true;
            this._wasBellowThreshold = false;
        }

        if (250 <= delta && delta <= 750) {
            this._wasInRange = true;
        }

        if (250 <= delta) {
            if (this._wasBellowThreshold) {
                SimVar.SetSimVarValue("L:A32NX_ALT_DEVIATION", "Bool", true);
            } else if (this._wasAboveThreshold && delta <= 750) {
                if (Simplane.getAutoPilotActive(1) == 0 && Simplane.getAutoPilotActive(2) == 0) {
                    SimVar.SetSimVarValue("L:A32NX_ALT_DEVIATION_SHORT", "Bool", 1);
                }
            } else if (750 < delta && this._wasInRange) {
                SimVar.SetSimVarValue("L:A32NX_ALT_DEVIATION", "Bool", 1);
            } else if (this._wasInRange) {
                if (SimVar.GetSimVarValue("L:XMLVAR_Autopilot_1_Status", "Bool") === true && SimVar.GetSimVarValue("L:XMLVAR_Autopilot_2_Status", "Bool") === true) {
                    SimVar.SetSimVarValue("L:A32NX_ALT_DEVIATION_SHORT", "Bool", true);
                }
            }
        }
    }

    getAutopilotMode() {
        if (this.aircraft == Aircraft.A320_NEO) {
            if (Simplane.getAutoPilotAltitudeManaged() && SimVar.GetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number") != 0) {
                return false;
            }
        }
        return true;
    }
}
