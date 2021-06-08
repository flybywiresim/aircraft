class ADIRU {
    constructor(number) {
        this.number = number;

        this.KNOB = Object.freeze({
            OFF: 0,
            NAV: 1,
            ATT: 2
        });
        this.knob = this.KNOB.OFF;

        // -1 -> no timer
        //  0 -> timer finished
        // >0 -> timer remaining
        this.timer = -1;

        // Start at 0 to prevent light from coming on when starting with ADIRS aligned
        this.onBatTimer = 0;
    }

    init() {
        this.knob = SimVar.GetSimVarValue(`L:A32NX_ADIRS_KNOB_${this.number}`, 'Enum');

        const startingAligned = this.knob === this.KNOB.NAV;
        this.timer = startingAligned ? 0 : -1;
    }

    update(deltaTime) {
        this.knob = SimVar.GetSimVarValue(`L:A32NX_ADIRS_KNOB_${this.number}`, 'Enum');

        if (this.knob === this.KNOB.OFF) {
            this.timer = -1;
            this.onBatTimer = -1;
        } else {
            if (this.timer === -1) {
                // Align time changes depending on latitude.
                const currentLatitude = SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude");
                const storedAlignMode = NXDataStore.get("CONFIG_ALIGN_TIME", "REAL");
                switch (storedAlignMode) {
                    case "INSTANT":
                        this.timer = 1;
                        break;
                    case "FAST":
                        this.timer = 90;
                        break;
                    default:
                        this.timer = ((currentLatitude ** 2) * 0.095) + 310;
                }

                // Flash FAULT light
                SimVar.SetSimVarValue(`L:A32NX_ADIRS_${this.number}_FAULT`, 'Bool', 1);
                setTimeout(() => {
                    SimVar.SetSimVarValue(`L:A32NX_ADIRS_${this.number}_FAULT`, 'Bool', 0);
                }, 90);
            } else if (this.timer > 0) {
                this.timer = Math.max(this.timer - (deltaTime / 1000), 0);
            }

            if (this.onBatTimer === -1) {
                this.onBatTimer = 16;
            } else if (this.onBatTimer > 0) {
                this.onBatTimer = Math.max(this.onBatTimer - (deltaTime / 1000), 0);
            }
        }
    }
}

class A32NX_ADIRS {
    constructor() {
        this.adirus = [
            new ADIRU(1),
            new ADIRU(2),
            new ADIRU(3),
        ];
    }

    init() {
        this.adirus.forEach((adiru) => {
            adiru.init();
        });
    }

    update(deltaTime) {
        let atLeastOneAdiru = false;
        let onBat = false;
        let timeToAlign = Infinity;
        this.adirus.forEach((adiru) => {
            adiru.update(deltaTime);

            if (adiru.timer >= 0) {
                atLeastOneAdiru = true;
            }
            if (adiru.onBatTimer > 0 && adiru.onBatTimer < 5) {
                onBat = true;
            }
            if (adiru.timer !== -1 && adiru.timer < timeToAlign) {
                timeToAlign = adiru.timer;
            }
        });
        // ASSERT_IMPLIES(atLeastOneADIRS, timeToAlign !== Infinity)

        // ADIRS_STATE
        // 0 -> Off
        // 1 -> Aligning
        // 2 -> Aligned
        const state = SimVar.GetSimVarValue('L:A320_Neo_ADIRS_STATE', 'Enum');
        if (atLeastOneAdiru) {
            if (state === 0) {
                // transition to aligning
                SimVar.SetSimVarValue('L:A320_Neo_ADIRS_STATE', 'Enum', 1);
                SimVar.SetSimVarValue("L:A32NX_ADIRS_START_TIME", "Seconds", timeToAlign);
            } else if (state === 1) {
                SimVar.SetSimVarValue('L:A320_Neo_ADIRS_IN_ALIGN', 'Bool', 1);
                SimVar.SetSimVarValue('L:A320_Neo_ADIRS_TIME', 'Seconds', timeToAlign);
                if (timeToAlign > 0) {
                    const secondsIntoAlignment = SimVar.GetSimVarValue("L:A32NX_ADIRS_START_TIME", "Seconds") - timeToAlign;
                    if (SimVar.GetSimVarValue('L:A32NX_ADIRS_PFD_ALIGNED_FIRST', 'Bool') === 0 && secondsIntoAlignment > 18) {
                        SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool", 1);
                    }
                    if (SimVar.GetSimVarValue('L:A32NX_ADIRS_PFD_ALIGNED_ATT', 'Bool') === 0 && secondsIntoAlignment > 28) {
                        SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool", 1);
                    }
                } else {
                    // transition to aligned
                    SimVar.SetSimVarValue('L:A320_Neo_ADIRS_STATE', 'Enum', 2);
                }
            } else if (state === 2) {
                if (timeToAlign > 0) {
                    // An aligned ADIRS was lost while another one is currently aligning, go back to aligning state.
                    SimVar.SetSimVarValue('L:A320_Neo_ADIRS_STATE', 'Enum', 1);
                } else {
                    SimVar.SetSimVarValue('L:A320_Neo_ADIRS_IN_ALIGN', 'Bool', 0);
                    SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool", 1);
                    SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool", 1);
                }
            }
        } else if (state !== 0) {
            // transition to off state
            SimVar.SetSimVarValue('L:A320_Neo_ADIRS_STATE', 'Enum', 0);
            SimVar.SetSimVarValue('L:A320_Neo_ADIRS_TIME', 'Seconds', 0);
            SimVar.SetSimVarValue('L:A320_Neo_ADIRS_IN_ALIGN', 'Bool', 0);
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_FIRST", "Bool", 0);
            SimVar.SetSimVarValue("L:A32NX_ADIRS_PFD_ALIGNED_ATT", "Bool", 0);
        }
        SimVar.SetSimVarValue("L:A32NX_ADIRS_ON_BAT", "Bool", onBat);
    }
}
