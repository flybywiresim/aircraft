class A32NX_APU {
    constructor() {
        console.log('A32NX_APU constructed');
    }
    init() {
        console.log('A32NX_APU init');
        this.lastAPUBleedState = -1;
    }
    update(_deltaTime) {
        const available = SimVar.GetSimVarValue("L:A32NX_APU_AVAILABLE", "Bool");
        const apuSwitchIsOn = !!SimVar.GetSimVarValue("A:APU SWITCH", "Bool");

        // Until everything that depends on the APU is moved into WASM,
        // we still need to synchronise some of the WASM state with the sim's state.
        if (available && !apuSwitchIsOn) {
            // This event will open the fuel valve leading to the APU.
            SimVar.SetSimVarValue("K:FUELSYSTEM_VALVE_TOGGLE", "Number", 8);
            // This event will set `A:APU SWITCH` to 1, meaning the sim will start the APU.
            // In systems.cfg, the `apu_pct_rpm_per_second` setting is set to 1, meaning the APU starts in one second.
            SimVar.SetSimVarValue("K:APU_STARTER", "Number", 1);
        } else if (!available && apuSwitchIsOn) {
            // This event will set `A:APU SWITCH` to 0, meaning the sim will stop the APU.
            // In systems.cfg, the `apu_pct_rpm_per_second` setting is set to 1, meaning the APU stops in one second.
            SimVar.SetSimVarValue("K:APU_OFF_SWITCH", "Number", 1);
            // This event will close the fuel valve leading to the APU.
            SimVar.SetSimVarValue("K:FUELSYSTEM_VALVE_TOGGLE", "Number", 8);
        }

        const apuGenActive = SimVar.GetSimVarValue("APU GENERATOR ACTIVE", "Bool");
        const externalPowerOff = SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool") === 0;

        // This logic is consistently faulty in the JavaScript code: of course it should also take into
        // account if engine generators are supplying electricity. We'll fix this when we create the electrical system.
        SimVar.SetSimVarValue("L:APU_GEN_ONLINE", "Bool", available && apuGenActive ? 1 : 0);
        SimVar.SetSimVarValue(
            "L:APU_LOAD_PERCENT",
            "percent",
            available && apuGenActive && externalPowerOff
                ? Math.max(SimVar.GetSimVarValue("L:A32NX_APU_GEN_AMPERAGE", "Amperes")
                        / SimVar.GetSimVarValue("ELECTRICAL TOTAL LOAD AMPS", "Amperes"), 0)
                : 0
        );

        const apuBleedOn = SimVar.GetSimVarValue("L:A32NX_APU_BLEED_ON", "Bool");
        if (apuBleedOn !== this.lastAPUBleedState) {
            this.lastAPUBleedState = apuBleedOn;
            if (apuBleedOn === 1) {
                this.APUBleedTimer = 3;
            } else {
                this.APUBleedTimer = 0;
            }
        }

        const apuN = SimVar.GetSimVarValue("L:A32NX_APU_N", "percent");
        const bleedAirValveOpen = SimVar.GetSimVarValue("L:A32NX_APU_BLEED_AIR_VALVE_OPEN", "Bool");
        let psi = 0;
        if (apuN > 95 && bleedAirValveOpen) {
            if (this.APUBleedTimer > 0) {
                this.APUBleedTimer -= _deltaTime / 1000;
                psi = Math.round(35 - this.APUBleedTimer);
            } else {
                psi = 35;
            }
        }
        SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE", "PSI", psi);

        // Until everything that depends on the APU is moved into WASM,
        // we still need to synchronise some of the WASM state with the sim's state.
        const simApuBleedAirOn = SimVar.GetSimVarValue("BLEED AIR APU", "Bool");
        if (psi > 0 && !simApuBleedAirOn) {
            // This event will open the sim's APU bleed air valve.
            SimVar.SetSimVarValue("K:APU_BLEED_AIR_SOURCE_TOGGLE", "Number", 0);
        } else if (psi === 0 && simApuBleedAirOn) {
            // This event will close the sim's APU bleed air valve.
            SimVar.SetSimVarValue("K:APU_BLEED_AIR_SOURCE_TOGGLE", "Number", 0);
        }
    }
}
