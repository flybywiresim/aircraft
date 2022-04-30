class A32NX_TipsManager {
    constructor() {
        this.notif = new NXNotif();
        this.checkThrottleCalibration();
        this.updateThrottler = new UpdateThrottler(30000);
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
        const assistenceTakeOffEnabled = SimVar.GetSimVarValue("ASSISTANCE TAKEOFF ENABLED", "Bool");
        const assistenceLandingEnabled = SimVar.GetSimVarValue("ASSISTANCE LANDING ENABLED", "Bool");
        const assistenceAutotrimActive = SimVar.GetSimVarValue("AI AUTOTRIM ACTIVE", "Bool");
        if (assistenceTakeOffEnabled || assistenceLandingEnabled || assistenceAutotrimActive) {
            this.notif.showNotification({message: "Ensure you have turned off the following assistance functions:\n- ASSISTED TAKEOFF\n- ASSISTED LANDING\n- AI AUTO-TRIM\n\nThey cause serious incompatibility!", timeout: 20000});
        }
    }

}
