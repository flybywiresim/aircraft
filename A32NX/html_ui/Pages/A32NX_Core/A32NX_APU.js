class A32NX_APU {
    constructor() {
        console.log('A32NX_APU constructed');
    }
    init() {
        console.log('A32NX_APU init');
        SimVar.SetSimVarValue("L:APU_FLAP_OPEN", "Percent", 0);
        this.lastAPUBleedState = -1;
    }
    update(_deltaTime) {
        const currentAPUMasterState = SimVar.GetSimVarValue("A:FUELSYSTEM VALVE SWITCH:8", "Bool");
        const apuFlapOpenPercent = SimVar.GetSimVarValue("L:APU_FLAP_OPEN", "Percent");
        const APUPctRPM = SimVar.GetSimVarValue("APU PCT RPM", "percent");

        if (apuFlapOpenPercent === 100 && SimVar.GetSimVarValue("A:APU SWITCH", "Bool") === 0) {
            const apuFuelsystemValveOpen = SimVar.GetSimVarValue("A:FUELSYSTEM VALVE OPEN:8", "Percent");
            const apuStartButtonPressed = SimVar.GetSimVarValue("L:A32NX_APU_START_ACTIVATED", "Bool");
            if (apuFuelsystemValveOpen === 100 && apuStartButtonPressed) {
                // This fires the APU_STARTER key event, which will cause `A:APU SWITCH` to be set to 1
                SimVar.SetSimVarValue("K:APU_STARTER", "Number", 1);
            }
        }

        // Takes 20 seconds to open
        const apuFlapOpenPercentSpeed = 20;

        if (currentAPUMasterState === 1 && apuFlapOpenPercent < 100) {
            const newFlap = Math.min(apuFlapOpenPercent + ((100 / apuFlapOpenPercentSpeed) * (_deltaTime / 1000)), 100);
            SimVar.SetSimVarValue("L:APU_FLAP_OPEN", "Percent", newFlap);
        } else if (currentAPUMasterState === 0 && apuFlapOpenPercent > 0 && APUPctRPM <= 7) {
            const newFlap = Math.max(apuFlapOpenPercent - ((100 / apuFlapOpenPercentSpeed) * (_deltaTime / 1000)), 0);
            SimVar.SetSimVarValue("L:APU_FLAP_OPEN", "Percent", newFlap);
        }

        //APU start, stop
        if(APUPctRPM >= 87){
            SimVar.SetSimVarValue("L:APU_GEN_ONLINE","Bool",1);
            SimVar.SetSimVarValue("L:APU_GEN_VOLTAGE","Volts",115);
            SimVar.SetSimVarValue("L:APU_GEN_AMPERAGE","Amperes",782.609); // 1000 * 90 kVA / 115V = 782.609A
            SimVar.SetSimVarValue("L:APU_GEN_FREQ","Hertz",Math.round((4.46*APUPctRPM)-46.15));
            SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",35);
            SimVar.SetSimVarValue(
                "L:APU_LOAD_PERCENT",
                "percent",
                Math.max(SimVar.GetSimVarValue("L:APU_GEN_AMPERAGE","Amperes")/SimVar.GetSimVarValue("ELECTRICAL TOTAL LOAD AMPS","Amperes"), 0)
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
            this.lastAPUBleedState = currentAPUBleedState
            if (currentAPUBleedState === 1) {
                this.APUBleedTimer = 3;
            } else {
                this.APUBleedTimer = 0;
            }
        }

        //AVAIL indication & bleed pressure
        if (APUPctRPM > 95) {
            if (this.APUBleedTimer > 0) {
                this.APUBleedTimer -= _deltaTime/1000;
                SimVar.SetSimVarValue("L:APU_BLEED_PRESSURE","PSI",Math.round(35-this.APUBleedTimer));
            }
        }
    }
}
