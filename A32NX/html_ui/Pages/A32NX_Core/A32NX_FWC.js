class A32NX_FWC {
    constructor() {
        this.flightPhase = null;

        // ESDL 1. 0. 60
        this.gndMemo = new NXLogic_ConfirmNode(1);

        // ESDL 1. 0. 60
        this.eng1OrTwoRunningConf = new NXLogic_ConfirmNode(30);

        // ESDL 1. 0. 73
        this.speedAbove80KtsMemo = new NXLogic_MemoryNode(true);

        // ESDL 1. 0. 79 / ESDL 1. 0. 80
        this.mctMemo = new NXLogic_TriggeredMonostableNode(60, false);

        // ESDL 1. 0.100
        this.firePBOutConf = new NXLogic_ConfirmNode(0.2); // CONF01
        this.firePBOutMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 05
        this.firePBClear10 = new NXLogic_MemoryNode(false);
        this.phase110Memo = new NXLogic_TriggeredMonostableNode(300); // MTRIG 03
        this.phase8GroundMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 06
        this.ac80KtsMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 04
        this.prevPhase9InvertMemo = new NXLogic_TriggeredMonostableNode(3, false); // MTRIG 02
        this.eng1Or2TOPowerInvertMemo = new NXLogic_TriggeredMonostableNode(1, false); // MTRIG 01
        this.phase9Nvm = new NXLogic_MemoryNode(true, true);
        this.prevPhase9 = false;

        // ESDL 1. 0.110
        this.groundImmediateMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 03
        this.phase5Memo = new NXLogic_TriggeredMonostableNode(120); // MTRIG 01
        this.phase67Memo = new NXLogic_TriggeredMonostableNode(180); // MTRIG 02
    }

    update(_deltaTime) {
        this.updateFlightPhase(_deltaTime);
    }

    updateFlightPhase(_deltaTime) {
        const radioHeight = SimVar.GetSimVarValue("RADIO HEIGHT", "Feet");
        const eng1N1 = SimVar.GetSimVarValue("ENG N1 RPM:1", "Percent");
        const eng2N1 = SimVar.GetSimVarValue("ENG N1 RPM:2", "Percent");
        // TODO find a better source for the following value ("core speed at or above idle")
        // Note that N1 starts below idle on spawn on the runway, so this should be below 16 to not jump back to phase 1
        const oneEngRunning = (
            eng1N1 > 15 || eng2N1 > 15
        );
        const eng1Or2Running = this.eng1OrTwoRunningConf.write(oneEngRunning, _deltaTime);
        const engOneAndTwoNotRunning = !eng1Or2Running;
        const hFail = false;
        const adcTestInhib = false;

        // ESLD 1.0.60
        const groundImmediate = Simplane.getIsGrounded();
        const ground = this.gndMemo.write(groundImmediate, _deltaTime);

        // ESLD 1.0.73
        const ias = SimVar.GetSimVarValue("AIRSPEED INDICATED", "knots");
        const acSpeedAbove80kts = this.speedAbove80KtsMemo.write(ias > 83, ias < 77);

        // ESLD 1.0.90
        const hAbv1500 = radioHeight > 1500;
        const hAbv800 = radioHeight > 800;

        // ESLD 1.0.79 + 1.0.80
        const eng1TLA = Simplane.getEngineThrottleMode(0);
        const eng2TLA = Simplane.getEngineThrottleMode(1);
        const eng1OrEng2MCT = eng1TLA >= ThrottleMode.FLEX_MCT || eng2TLA >= ThrottleMode.FLEX_MCT;
        const eng1AndEng2MCL = eng1TLA >= ThrottleMode.CLIMB && eng2TLA >= ThrottleMode.CLIMB;
        const eng1Or2TOPower = (
            eng1OrEng2MCT ||
            (this.mctMemo.write(eng1OrEng2MCT, _deltaTime) && !hAbv1500 && eng1AndEng2MCL)
        );

        // ESLD 1.0.100
        const eng1FirePbOut = SimVar.GetSimVarValue("L:A32NX_FIRE_BUTTON_ENG1", "Bool");
        const eng1FirePbMemo = this.firePBOutMemo.write(
            this.firePBOutConf.write(eng1FirePbOut, _deltaTime),
            _deltaTime
        );
        const resetFirePbClear10 = eng1FirePbMemo && ground;

        const phase8 = (
            (this.phase8GroundMemo.write(groundImmediate, _deltaTime) || groundImmediate) &&
            !eng1Or2TOPower &&
            acSpeedAbove80kts
        );

        const phase34Cond = ground && eng1Or2TOPower;
        const phase3 = !acSpeedAbove80kts && eng1Or2Running && phase34Cond;
        const phase4 = acSpeedAbove80kts && phase34Cond;

        const setPhase9Nvm = phase3 || phase8;
        const resetPhase9Nvm = (
            (
                !this.ac80KtsMemo.write(!acSpeedAbove80kts, _deltaTime) &&
                (
                    (ground && this.prevPhase9InvertMemo.write(this.prevPhase9, _deltaTime)) ||
                    resetFirePbClear10 ||
                    (ground && this.eng1Or2TOPowerInvertMemo.write(eng1Or2TOPower, _deltaTime))
                ) &&
                !this.prevPhase9
            ) || adcTestInhib
        );
        const phase9Nvm = this.phase9Nvm.write(setPhase9Nvm, resetPhase9Nvm); // S* / R (NVM)
        const phase29Cond = ground && !eng1Or2TOPower && !acSpeedAbove80kts;
        const phase9 = oneEngRunning && phase9Nvm && phase29Cond;
        const phase2 = phase29Cond && !phase9Nvm && eng1Or2Running;

        const phase110MemoA = this.firePBClear10.write(phase9, resetFirePbClear10); // S / R*
        const phase110Cond = !phase9 && engOneAndTwoNotRunning && groundImmediate;
        const phase110Memo = this.phase110Memo.write(phase110MemoA && phase110Cond, _deltaTime); // MTRIG 03
        const phase1 = phase110Cond && !phase110Memo;
        const phase10 = phase110Cond && phase110Memo;

        this.prevPhase9 = phase9;

        // ESLD 1.0.110
        const ground2sMemorized = this.groundImmediateMemo.write(groundImmediate, _deltaTime) || groundImmediate;
        const phase5Cond = !hAbv1500 && eng1Or2TOPower && !hFail && !ground2sMemorized;
        const phase5 = this.phase5Memo.write(phase5Cond, _deltaTime) && phase5Cond;

        const phase67Cond = (
            !ground2sMemorized &&
            !hFail &&
            !eng1Or2TOPower &&
            !hAbv1500 &&
            !hAbv800
        );
        const phase67Memo = this.phase67Memo.write(phase67Cond, _deltaTime) && phase67Cond;

        const phase6 = !phase5 && !ground2sMemorized && !phase67Memo;
        const phase7 = phase67Memo && !phase8;

        /*** End of ESLD logic ***/

        // consolidate into single variable (just to be safe)
        const phases = [phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8, phase9, phase10];

        if (this.flightPhase === null && phases.indexOf(true) !== -1) {
            // if we aren't initialized, just grab the first one that is valid
            this.flightPhase = phases.indexOf(true) + 1;
            SimVar.SetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum", this.flightPhase);
            console.log(`FWC flight phase: ${this.flightPhase}`);
            return;
        }

        const activePhases = phases.map((x, i) => [x, i + 1]).filter(y => !!y[0]).map(z => z[1]);

        // the usual and easy case: only one flight phase is valid
        if (activePhases.length === 1) {
            if (activePhases[0] !== this.flightPhase) {
                console.log(`FWC flight phase: ${this.flightPhase} => ${activePhases[0]}`);
                this.flightPhase = activePhases[0];
                SimVar.SetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum", this.flightPhase);
            }
            return;
        }

        // the mixed case => warn
        if (activePhases.length > 1) {
            console.warn(`Multiple FWC flight phases are valid: ${activePhases.join(", ")}`);
            if (activePhases.indexOf(this.flightPhase) !== -1) {
                // if the currently active one is present, keep it
                console.warn(`Remaining in FWC flight phase ${this.flightPhase}`);
                return;
            }
            // pick the earliest one
            this.flightPhase = activePhases[0];
            SimVar.SetSimVarValue(`L:A32NX_FWC_FLIGHT_PHASE`, "Enum", this.flightPhase);
            console.log(`Resolving by switching FWC flight phase: ${this.flightPhase} => ${activePhases[0]}`);
            return;
        }

        // otherwise, no flight phase is valid => warn
        console.warn("No valid FWC flight phase");
        if (this.flightPhase === null) {
            this.flightPhase = 6;
            SimVar.SetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum", this.flightPhase);
        }
    }
}
