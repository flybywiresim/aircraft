class A32NX_TipsManager {
    constructor() {
        this.notif = new NXNotifManager();
        this.checkThrottleCalibration();
        this.updateThrottler = new UpdateThrottler(15000);
        this.wasAnyAssistanceActive = false;
    }

    update(deltaTime) {
        if (this.updateThrottler.canUpdate(deltaTime) !== -1) {
            this.checkAssistenceConfiguration();
        }
    }

    checkThrottleCalibration() {
        let once = false;
        let input = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_INPUT:1", "Number") * 100) / 100;

        const throttleConfig = SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_LOADED_CONFIG:1", "Boolean");

        if (!throttleConfig) {
            const checkThrottle = setInterval(() => {
                if (SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_LOADED_CONFIG:1", "Boolean")) {
                    clearInterval(checkThrottle);
                    return;
                }
                if (input === Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_INPUT:1", "Number") * 100) / 100) {
                    const fwcFlightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
                    const atPhase = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_MODE_MESSAGE", "Enum");
                    const clbLow = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_CLIMB_LOW:1", "Number") * 100) / 100;
                    const clbHigh = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_CLIMB_HIGH:1", "Number") * 100) / 100;

                    // If thrust lever is within 0.03 range of the default CLB detent limits in CRZ and A/THR MODE is LVR CLB
                    if ((input >= (clbLow - 0.03) && input <= (clbHigh + 0.03)) && fwcFlightPhase === 6 && atPhase === 3) {
                        (!once) ? once = true : this.notif.showNotification({message: "Please calibrate your throttles in the flyPad tablet (EFB). Potentially inaccurate throttle calibration has been detected.", timeout: 60000});
                    } else {
                        once = false;
                    }
                } else {
                    input = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_INPUT:1", "Number") * 100) / 100;
                }
            }, 300000);
        }
    }

    checkAssistenceConfiguration() {
        // only check when actually flying, otherwise return
        if (SimVar.GetSimVarValue("L:A32NX_IS_READY", "Number") !== 1) {
            this.wasAnyAssistanceActive = false;
            return;
        }

        // determine if any assistance is active
        const assistanceAiControls = SimVar.GetSimVarValue("AI CONTROLS", "Bool");
        const assistanceTakeOffEnabled = SimVar.GetSimVarValue("ASSISTANCE TAKEOFF ENABLED", "Bool");
        const assistanceLandingEnabled = SimVar.GetSimVarValue("ASSISTANCE LANDING ENABLED", "Bool");
        const assistanceAutotrimActive = SimVar.GetSimVarValue("AI AUTOTRIM ACTIVE", "Bool");
        const isAnyAssistanceActive = (assistanceAiControls || assistanceTakeOffEnabled || assistanceLandingEnabled || assistanceAutotrimActive);

        // show popup when an enabled assistance is detected and it was not active before
        if (!this.wasAnyAssistanceActive && isAnyAssistanceActive) {
            this.notif.showNotification({message: "Ensure you have turned off all assistance functions:\n\n• AUTO-RUDDER\n• ASSISTED YOKE\n• ASSISTED LANDING\n• ASSISTED TAKEOFF\n• AI ANTI-STALL PROTECTION\n• AI AUTO-TRIM\n• ASSISTED CONTROLLER SENSITIVITY\n\nThey cause serious incompatibility!", timeout: 15000});
        }

        // remember if any assistance was active
        this.wasAnyAssistanceActive = isAnyAssistanceActive;
    }

}
