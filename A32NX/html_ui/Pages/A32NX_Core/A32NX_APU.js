class A32NX_APU {
    constructor() {
        console.log('A32NX_APU constructed');
        this.previousApuGenActiveRaw = false;
    }
    init() {
        console.log('A32NX_APU init');
        this.lastAPUBleedState = -1;
    }
    update(_deltaTime) {
        const available = SimVar.GetSimVarValue("L:A32NX_APU_AVAILABLE", "Bool");
        const apuSwitchIsOn = SimVar.GetSimVarValue("A:APU SWITCH", "Bool") === 1;

        // Until everything that depends on the APU is moved into WASM,
        // we still need to synchronise some of the WASM state with the sim's state.
        if (available && !apuSwitchIsOn) {
            // This event will set `A:APU SWITCH` to 1, meaning the sim will start the APU.
            // In systems.cfg, the `apu_pct_rpm_per_second` setting is set to 1, meaning the APU starts in one second.
            SimVar.SetSimVarValue("K:APU_STARTER", "Number", 1);
        } else if (!available && apuSwitchIsOn) {
            // This event will set `A:APU SWITCH` to 0, meaning the sim will stop the APU.
            // In systems.cfg, the `apu_pct_rpm_per_second` setting is set to 1, meaning the APU stops in one second.
            SimVar.SetSimVarValue("K:APU_OFF_SWITCH", "Number", 1);
        }

        // Something outside of our code is setting the APU SWITCH to 0, meaning the sim stops the APU.
        // The code above will turn the APU back on, however the APU GENERATOR ACTIVE value will be wrong
        // for a single update tick. Thus, to work around this problem until all electrical systems are handled
        // by us, we will ignore a false value for one update tick.
        // If the APU GENERATOR ACTIVE is false for two ticks, we can be sure it was due to manual user interaction.
        const apuGenActiveRaw = SimVar.GetSimVarValue("APU GENERATOR ACTIVE", "Bool");
        const apuGenActive = apuGenActiveRaw || this.previousApuGenActiveRaw;
        this.previousApuGenActiveRaw = apuGenActiveRaw;

        if (apuGenActive === apuGenActiveRaw) {
            if (available && apuGenActive) {
                SimVar.SetSimVarValue("L:APU_GEN_ONLINE", "Bool", 1);
                SimVar.SetSimVarValue(
                    "L:APU_LOAD_PERCENT",
                    "percent",
                    Math.max(
                        SimVar.GetSimVarValue("L:A32NX_APU_GEN_AMPERAGE", "Amperes")
                            / SimVar.GetSimVarValue("ELECTRICAL TOTAL LOAD AMPS", "Amperes")
                        , 0)
                );
            } else {
                SimVar.SetSimVarValue("L:APU_GEN_ONLINE", "Bool",0);
                SimVar.SetSimVarValue("L:APU_LOAD_PERCENT", "percent", 0);
            }
        }

        if (available) {
            SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",35);
        } else {
            SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",0);
        }

        const currentAPUBleedState = SimVar.GetSimVarValue("BLEED AIR APU","Bool");
        if (currentAPUBleedState !== this.lastAPUBleedState) {
            this.lastAPUBleedState = currentAPUBleedState;
            if (currentAPUBleedState === 1) {
                this.APUBleedTimer = 3;
            } else {
                this.APUBleedTimer = 0;
            }
        }

        const apuN = SimVar.GetSimVarValue("L:A32NX_APU_N", "percent");
        if (apuN > 95) {
            if (this.APUBleedTimer > 0) {
                this.APUBleedTimer -= _deltaTime / 1000;
                SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",Math.round(35 - this.APUBleedTimer));
            }
        }
    }
}
