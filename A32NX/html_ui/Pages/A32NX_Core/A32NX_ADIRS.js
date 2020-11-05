class ADIRS {
    constructor(num) {
        this.num = num;
        // 0 -> OFF
        // 1 -> NAV
        // 2 -> ATT
        this.knob = -1;

        // -1 -> no timer
        //  0 -> timer finished
        // >0 -> timer remaining
        this.timer = -1;
    }

    init() {
        this.knob = SimVar.GetSimVarValue(`L:A32NX_ADIRS_KNOB_${this.num}`, 'Enum');
        SimVar.SetSimVarValue(`L:A32NX_ADIRS_TIMER_${this.num}`, 'Seconds', -1);
    }

    update(deltaTime) {
        this.knob = SimVar.GetSimVarValue(`L:A32NX_ADIRS_KNOB_${this.num}`, 'Enum');
        this.timer = SimVar.GetSimVarValue(`L:A32NX_ADIRS_TIMER_${this.num}`, 'Seconds');

        if (this.knob === 0) {
            this.timer = -1;
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
                SimVar.SetSimVarValue(`L:A32NX_ADIRS_${this.num}_FAULT`, 'Bool', 1);
                setTimeout(() => {
                    SimVar.SetSimVarValue(`L:A32NX_ADIRS_${this.num}_FAULT`, 'Bool', 0);
                }, 90);
            } else if (this.timer > 0) {
                this.timer = Math.max(this.timer - (deltaTime / 1000), 0);
            }
        }

        SimVar.SetSimVarValue(`L:A32NX_ADIRS_TIMER_${this.num}`, 'Seconds', this.timer);
    }
}

class A32NX_ADIRS {
    constructor() {
        this.ADIRS = [
            new ADIRS(1),
            new ADIRS(2),
            new ADIRS(3),
        ];
    }

    init() {
        this.ADIRS.forEach((ADIRS) => {
            ADIRS.init();
        });
    }

    update(deltaTime) {
        let atLeastOneADIRS = false;
        let timeToAlign = Infinity;
        this.ADIRS.forEach((ADIRS) => {
            ADIRS.update(deltaTime);

            if (ADIRS.timer >= 0) {
                atLeastOneADIRS = true;
            }
            if (ADIRS.timer !== -1 && ADIRS.timer < timeToAlign) {
                timeToAlign = ADIRS.timer;
            }
        });
        // ASSERT_IMPLIES(atLeastOneADIRS, timeToAlign !== Infinity)

        // ADIRS_STATE
        // 0 -> Off
        // 1 -> Aligning
        // 2 -> Aligned
        const state = SimVar.GetSimVarValue('L:A320_Neo_ADIRS_STATE', 'Enum');
        if (atLeastOneADIRS) {
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
    }
}