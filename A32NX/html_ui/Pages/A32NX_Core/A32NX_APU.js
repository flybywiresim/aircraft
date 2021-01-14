class A32NX_APU {
    constructor() {
        console.log('A32NX_APU constructed');
    }
    init() {
        console.log('A32NX_APU init');
        this.lastAPUBleedState = -1;
    }
    update(_deltaTime) {
        const APUPctRPM = SimVar.GetSimVarValue("APU PCT RPM", "percent");
        const available = SimVar.GetSimVarValue("L:A32NX_APU_AVAILABLE", "Bool");
        const apuSwitch = SimVar.GetSimVarValue("A:APU SWITCH", "Bool");

        // Until everything that depends on the APU is moved into WASM,
        // we still need to synchronise some of the WASM state with the sim's state.
        if (available && apuSwitch === 0) {
            // This event will set `A:APU SWITCH` to 1, meaning the sim will start the APU.
            // In systems.cfg, the `apu_pct_rpm_per_second` setting is set to 1, meaning the APU starts in one second.
            SimVar.SetSimVarValue("K:APU_STARTER", "Number", 1);
        } else if (!available && apuSwitch !== 0) {
            // This event will set `A:APU SWITCH` to 0, meaning the sim will stop the APU.
            // In systems.cfg, the `apu_pct_rpm_per_second` setting is set to 1, meaning the APU stops in one second.
            SimVar.SetSimVarValue("K:APU_OFF_SWITCH", "Number", 1);
        }

        //APU start, stop
        if (APUPctRPM >= 87) {
            SimVar.SetSimVarValue("L:APU_GEN_ONLINE","Bool",1);
            SimVar.SetSimVarValue("L:APU_GEN_VOLTAGE","Volts",115);
            SimVar.SetSimVarValue("L:APU_GEN_AMPERAGE","Amperes",782.609); // 1000 * 90 kVA / 115V = 782.609A
            SimVar.SetSimVarValue("L:APU_GEN_FREQ","Hertz",Math.round((4.46 * APUPctRPM) - 46.15));
            SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",35);
            SimVar.SetSimVarValue(
                "L:APU_LOAD_PERCENT",
                "percent",
                Math.max(SimVar.GetSimVarValue("L:APU_GEN_AMPERAGE","Amperes") / SimVar.GetSimVarValue("ELECTRICAL TOTAL LOAD AMPS","Amperes"), 0)
            );
        } else {
            SimVar.SetSimVarValue("L:APU_GEN_ONLINE","Bool",0);
            SimVar.SetSimVarValue("L:APU_GEN_VOLTAGE","Volts",0);
            SimVar.SetSimVarValue("L:APU_GEN_AMPERAGE","Amperes",0);
            SimVar.SetSimVarValue("L:APU_GEN_FREQ","Hertz",0);
            SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",0);
            SimVar.SetSimVarValue("L:APU_LOAD_PERCENT","percent",0);
        }

        //Bleed
        const currentAPUBleedState = SimVar.GetSimVarValue("BLEED AIR APU","Bool");
        if (currentAPUBleedState !== this.lastAPUBleedState) {
            this.lastAPUBleedState = currentAPUBleedState;
            if (currentAPUBleedState === 1) {
                this.APUBleedTimer = 3;
            } else {
                this.APUBleedTimer = 0;
            }
        }

        //AVAIL indication & bleed pressure
        if (APUPctRPM > 95) {
            if (this.APUBleedTimer > 0) {
                this.APUBleedTimer -= _deltaTime / 1000;
                SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",Math.round(35 - this.APUBleedTimer));
            }
        }
    }
}
