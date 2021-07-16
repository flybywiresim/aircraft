class NXEvents {
    static createEvents() {
        this.checkThrottleCalibration();
    }

    static checkThrottleCalibration() {

        let once = false;
        let input = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_INPUT:1", "Number") * 100) / 100;
        const notif = new NXNotif();
        const rvrOnAxis = SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:1", "Boolean");
        const rvrLow = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_REVERSE_LOW:1", "Number") * 100) / 100;
        const rvrHigh = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_REVERSE_HIGH:1", "Number") * 100) / 100;
        const rvrIdleLow = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_LOW:1", "Number") * 100) / 100;
        const rvrIdleHigh = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_HIGH:1", "Number") * 100) / 100;
        const idleLow = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_IDLE_LOW:1", "Number") * 100) / 100;
        const idleHigh = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_IDLE_HIGH:1", "Number") * 100) / 100;
        const clbLow = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_CLIMB_LOW:1", "Number") * 100) / 100;
        const clbHigh = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_CLIMB_HIGH:1", "Number") * 100) / 100;
        const flexLow = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_FLEXMCT_LOW:1", "Number") * 100) / 100;
        const flexHigh = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_FLEXMCT_HIGH:1", "Number") * 100) / 100;
        const togaLow = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_TOGA_LOW:1", "Number") * 100) / 100;
        const togaHigh = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_TOGA_HIGH:1", "Number") * 100) / 100;

        // Only for uncalibrated defaults
        if (
            rvrOnAxis &&
            rvrLow === -1 &&
            rvrHigh === -0.95 &&
            rvrIdleLow === -0.72 &&
            rvrIdleHigh === -0.62 &&
            idleLow === -0.5 &&
            idleHigh === -0.4 &&
            clbLow === -0.03 &&
            clbHigh === -0.07 &&
            flexLow === 0.42 &&
            flexHigh === 0.52 &&
            togaLow === 0.95 &&
            togaHigh === 1) {
            setInterval(() => {
                if (input === Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_INPUT:1", "Number") * 100) / 100) {
                    const fwcFlightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
                    const atPhase = SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_MODE_MESSAGE", "Enum");

                    if (input >= (clbLow - 0.03) && fwcFlightPhase === 6 && atPhase === 3) {
                        (!once) ? once = true : notif.showNotification({message: "No throttle calibration detected. Please calibrate your throttles in the flyPad tablet (EFB).", timeout: 180000});
                    } else {
                        once = false;
                    }
                } else {
                    input = Math.round(SimVar.GetSimVarValue("L:A32NX_THROTTLE_MAPPING_INPUT:1", "Number") * 100) / 100;
                }
            }, 300000);
        }
    }

}
