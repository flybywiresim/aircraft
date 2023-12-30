import { Arinc429Word } from '@flybywiresim/fbw-sdk';

export class A32NX_FWC {
    constructor() {
        // momentary
        this.toConfigTest = null; // WTOCT

        // persistent
        this.flightPhase = null;
        this.ldgMemo = null;
        this.toMemo = null;

        // ESDL 1. 0. 60
        this.gndMemo = new NXLogic_ConfirmNode(1); // outptuts ZGND

        // ESDL 1. 0. 60
        this.eng1OrTwoRunningConf = new NXLogic_ConfirmNode(30);

        // ESDL 1. 0. 73
        this.speedAbove80KtsMemo = new NXLogic_MemoryNode(true);

        // ESDL 1. 0. 79 / ESDL 1. 0. 80
        this.mctMemo = new NXLogic_ConfirmNode(60, false);

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

        // ESDL 1. 0.180
        this.memoTo_conf01 = new NXLogic_ConfirmNode(120, true); // CONF 01
        this.memoTo_memo = new NXLogic_MemoryNode(false);

        // ESDL 1. 0.190
        this.memoLdgMemo_conf01 = new NXLogic_ConfirmNode(1, true); // CONF 01
        this.memoLdgMemo_inhibit = new NXLogic_MemoryNode(false);
        this.memoLdgMemo_conf02 = new NXLogic_ConfirmNode(10, true); // CONF 01
        this.memoLdgMemo_below2000ft = new NXLogic_MemoryNode(true);

        // ESDL 1. 0.310
        this.memoToInhibit_conf01 = new NXLogic_ConfirmNode(3, true); // CONF 01

        // ESDL 1. 0.320
        this.memoLdgInhibit_conf01 = new NXLogic_ConfirmNode(3, true); // CONF 01

        // master warning & caution buttons
        this.warningPressed = false;
        this.cautionPressed = false;

        // altitude warning
        this.previousTargetAltitude = NaN;
        this._wasBellowThreshold = false;
        this._wasAboveThreshold = false;
        this._wasInRange = false;
        this._wasReach200ft = false;
    }

    update(_deltaTime, _core) {
        this._updateFlightPhase(_deltaTime);
        this._updateButtons(_deltaTime);
        this._updateTakeoffMemo(_deltaTime);
        this._updateLandingMemo(_deltaTime);
        this._updateAltitudeWarning();
    }

    _updateButtons(_deltaTime) {
        this.toConfigTest = SimVar.GetSimVarValue('L:A32NX_FWS_TO_CONFIG_TEST', 'boolean');

        if (SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_L', 'Bool') || SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_R', 'Bool')) {
            this.warningPressed = true;
        } else {
            this.warningPressed = false;
        }
        if (SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERCAUT_L', 'Bool') || SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERCAUT_R', 'Bool')) {
            this.cautionPressed = true;
        } else {
            this.cautionPressed = false;
        }
    }

    _updateFlightPhase(_deltaTime) {
        const radioHeight1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
        const radioHeight2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
        const radioHeight = radioHeight1.isFailureWarning() || radioHeight1.isNoComputedData() ? radioHeight2 : radioHeight1;
        const eng1N1 = SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent');
        const eng2N1 = SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent');
        // TODO find a better source for the following value ("core speed at or above idle")
        // Note that N1 starts below idle on spawn on the runway, so this should be below 16 to not jump back to phase 1
        const oneEngRunning = (
            eng1N1 > 15 || eng2N1 > 15
        );
        const eng1Or2Running = this.eng1OrTwoRunningConf.write(oneEngRunning, _deltaTime);
        const engOneAndTwoNotRunning = !eng1Or2Running;
        const hFail = radioHeight1.isFailureWarning() && radioHeight2.isFailureWarning();
        const adcTestInhib = false;

        // ESLD 1.0.60
        const groundImmediate = Simplane.getIsGrounded();
        const ground = this.gndMemo.write(groundImmediate, _deltaTime);

        // ESLD 1.0.73
        const ias = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots');
        const acSpeedAbove80kts = this.speedAbove80KtsMemo.write(ias > 83, ias < 77);

        // ESLD 1.0.90
        const hAbv1500 = radioHeight.isNoComputedData() || radioHeight.value > 1500;
        const hAbv800 = radioHeight.isNoComputedData() || radioHeight.value > 800;

        // ESLD 1.0.79 + 1.0.80
        const eng1TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number');
        const eng1TLAFTO = SimVar.GetSimVarValue('L:AIRLINER_TO_FLEX_TEMP', 'number') !== 0; // is a flex temp is set?
        const eng1MCT = eng1TLA > 33.3 && eng1TLA < 36.7;
        const eng1TLAFullPwr = eng1TLA > 43.3;
        const eng2TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number');
        const eng2TLAFTO = eng1TLAFTO; // until we have proper FADECs
        const eng2MCT = eng2TLA > 33.3 && eng2TLA < 36.7;
        const eng2TLAFullPwr = eng2TLA > 43.3;
        const eng1OrEng2SupMCT = !(eng1TLA < 36.7) || !(eng2TLA < 36.7);
        const eng1AndEng2MCL = eng1TLA > 22.9 && eng2TLA > 22.9;
        const eng1Or2TOPowerSignal = (
            (eng1TLAFTO && eng1MCT)
            || (eng2TLAFTO && eng2MCT)
            || (eng1OrEng2SupMCT || eng1OrEng2SupMCT)
            || (eng1TLAFullPwr || eng2TLAFullPwr)
        );
        const eng1Or2TOPower = (
            eng1Or2TOPowerSignal
            || (this.mctMemo.write(eng1Or2TOPowerSignal, _deltaTime) && !hAbv1500 && eng1AndEng2MCL)
        );

        // ESLD 1.0.100
        const eng1FirePbOut = SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG1', 'Bool');
        const eng1FirePbMemo = this.firePBOutMemo.write(
            this.firePBOutConf.write(eng1FirePbOut, _deltaTime),
            _deltaTime,
        );
        const resetFirePbClear10 = eng1FirePbMemo && ground;

        const phase8 = (
            (this.phase8GroundMemo.write(groundImmediate, _deltaTime) || groundImmediate)
            && !eng1Or2TOPower
            && acSpeedAbove80kts
        );

        const phase34Cond = ground && eng1Or2TOPower;
        const phase3 = !acSpeedAbove80kts && eng1Or2Running && phase34Cond;
        const phase4 = acSpeedAbove80kts && phase34Cond;

        const setPhase9Nvm = phase3 || phase8;
        const resetPhase9Nvm = (
            (
                !this.ac80KtsMemo.write(!acSpeedAbove80kts, _deltaTime)
                && (
                    (ground && this.prevPhase9InvertMemo.write(this.prevPhase9, _deltaTime))
                    || resetFirePbClear10
                    || (ground && this.eng1Or2TOPowerInvertMemo.write(eng1Or2TOPower, _deltaTime))
                )
                && !this.prevPhase9
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
            !ground2sMemorized
            && !hFail
            && !eng1Or2TOPower
            && !hAbv1500
            && !hAbv800
        );
        const phase67Memo = this.phase67Memo.write(phase67Cond, _deltaTime) && phase67Cond;

        const phase6 = !phase5 && !ground2sMemorized && !phase67Memo;
        const phase7 = phase67Memo && !phase8;

        /** * End of ESLD logic ** */

        // consolidate into single variable (just to be safe)
        const phases = [phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8, phase9, phase10];

        if (this.flightPhase === null && phases.indexOf(true) !== -1) {
            // if we aren't initialized, just grab the first one that is valid
            this._setFlightPhase(phases.indexOf(true) + 1);
            console.log(`FWC flight phase: ${this.flightPhase}`);
            return;
        }

        const activePhases = phases.map((x, i) => [x, i + 1]).filter((y) => !!y[0]).map((z) => z[1]);

        // the usual and easy case: only one flight phase is valid
        if (activePhases.length === 1) {
            if (activePhases[0] !== this.flightPhase) {
                console.log(`FWC flight phase: ${this.flightPhase} => ${activePhases[0]}`);
                this._setFlightPhase(activePhases[0]);
            }
            return;
        }

        // the mixed case => warn
        if (activePhases.length > 1) {
            console.warn(`Multiple FWC flight phases are valid: ${activePhases.join(', ')}`);
            if (activePhases.indexOf(this.flightPhase) !== -1) {
                // if the currently active one is present, keep it
                console.warn(`Remaining in FWC flight phase ${this.flightPhase}`);
                return;
            }
            // pick the earliest one
            this._setFlightPhase(activePhases[0]);
            console.log(`Resolving by switching FWC flight phase: ${this.flightPhase} => ${activePhases[0]}`);
            return;
        }

        // otherwise, no flight phase is valid => warn
        console.warn('No valid FWC flight phase');
        if (this.flightPhase === null) {
            this._setFlightPhase(null);
        }
    }

    _setFlightPhase(flightPhase) {
        if (flightPhase === this.flightPhase) {
            return;
        }

        // update flight phase
        this.flightPhase = flightPhase;
        SimVar.SetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', this.flightPhase || 0);
    }

    _updateTakeoffMemo(_deltaTime) {
        /// FWC ESLD 1.0.180
        const setFlightPhaseMemo = this.flightPhase === 2 && this.toConfigTest;
        const resetFlightPhaseMemo = (
            this.flightPhase === 10
            || this.flightPhase === 3
            || this.flightPhase === 1
            || this.flightPhase === 6
        );
        const flightPhaseMemo = this.memoTo_memo.write(setFlightPhaseMemo, resetFlightPhaseMemo);

        const eng1NotRunning = SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent') < 15;
        const eng2NotRunning = SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent') < 15;
        const toTimerElapsed = this.memoTo_conf01.write(!eng1NotRunning && !eng2NotRunning, _deltaTime);

        this.toMemo = flightPhaseMemo || (this.flightPhase === 2 && toTimerElapsed);
        SimVar.SetSimVarValue('L:A32NX_FWC_TOMEMO', 'Bool', this.toMemo);
    }

    _updateLandingMemo(_deltaTime) {
        const radioHeight1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
        const radioHeight2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
        const radioHeight1Invalid = radioHeight1.isFailureWarning() || radioHeight1.isNoComputedData();
        const radioHeight2Invalid = radioHeight2.isFailureWarning() || radioHeight2.isNoComputedData();
        const gearDownlocked = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') > 0.95;

        // FWC ESLD 1.0.190
        const setBelow2000ft = (radioHeight1.value < 2000 && !radioHeight1Invalid) || (radioHeight2.value < 2000 && !radioHeight2Invalid);
        const resetBelow2000ft = (radioHeight1.value > 2200 || radioHeight1Invalid) && (radioHeight2.value > 2200 || radioHeight2Invalid);
        const memo2 = this.memoLdgMemo_below2000ft.write(setBelow2000ft, resetBelow2000ft);

        const setInhibitMemo = this.memoLdgMemo_conf01.write(resetBelow2000ft && !radioHeight1Invalid && !radioHeight2Invalid, _deltaTime);
        const resetInhibitMemo = !(this.flightPhase === 7 || this.flightPhase === 8 || this.flightPhase === 6);
        const memo1 = this.memoLdgMemo_inhibit.write(setInhibitMemo, resetInhibitMemo);

        const showInApproach = memo1 && memo2 && this.flightPhase === 6;

        const invalidRadioMemo = this.memoLdgMemo_conf02.write(radioHeight1Invalid && radioHeight2Invalid && gearDownlocked && this.flightPhase === 6);

        this.ldgMemo = showInApproach || invalidRadioMemo || this.flightPhase === 8 || this.flightPhase === 7;
        SimVar.SetSimVarValue('L:A32NX_FWC_LDGMEMO', 'Bool', this.ldgMemo);
    }

    _updateAltitudeWarning() {
        const indicatedAltitude = Simplane.getAltitude();
        const shortAlert = SimVar.GetSimVarValue('L:A32NX_ALT_DEVIATION_SHORT', 'Bool');
        if (shortAlert === 1) {
            SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION_SHORT', 'Bool', false);
        }

        if (this.warningPressed === true) {
            this._wasBellowThreshold = false;
            this._wasAboveThreshold = false;
            this._wasInRange = false;
            SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', false);
            return;
        }

        if (Simplane.getIsGrounded()) {
            SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', false);
        }

        // Use FCU displayed value
        const currentAltitudeConstraint = SimVar.GetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet');
        const currentFCUAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
        const targetAltitude = currentAltitudeConstraint && !this.hasAltitudeConstraint() ? currentAltitudeConstraint : currentFCUAltitude;

        // Exit when selected altitude is being changed
        if (this.previousTargetAltitude !== targetAltitude) {
            this.previousTargetAltitude = targetAltitude;
            this._wasBellowThreshold = false;
            this._wasAboveThreshold = false;
            this._wasInRange = false;
            this._wasReach200ft = false;
            SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION_SHORT', 'Bool', false);
            SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', false);
            return;
        }

        // Exit when:
        // - Landing gear down & slats extended
        // - Glide slope captured
        // - Landing locked down

        const landingGearIsDown = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Enum') >= 1 && SimVar.GetSimVarValue('L:A32NX_GEAR_HANDLE_POSITION', 'Percent over 100') > 0.5;
        const verticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Number');
        const glideSlopeCaptured = verticalMode >= 30 && verticalMode <= 34;
        const landingGearIsLockedDown = SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') > 0.9;
        const isTcasResolutionAdvisoryActive = SimVar.GetSimVarValue('L:A32NX_TCAS_STATE', 'Enum') > 1;
        if (landingGearIsDown || glideSlopeCaptured || landingGearIsLockedDown || isTcasResolutionAdvisoryActive) {
            this._wasBellowThreshold = false;
            this._wasAboveThreshold = false;
            this._wasInRange = false;
            this._wasReach200ft = false;
            SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION_SHORT', 'Bool', false);
            SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', false);
            return;
        }

        const delta = Math.abs(indicatedAltitude - targetAltitude);

        if (delta < 200) {
            this._wasBellowThreshold = true;
            this._wasAboveThreshold = false;
            this._wasReach200ft = true;
        }
        if (delta > 750) {
            this._wasAboveThreshold = true;
            this._wasBellowThreshold = false;
        }
        if (delta >= 200 && delta <= 750) {
            this._wasInRange = true;
        }

        if (this._wasBellowThreshold && this._wasReach200ft) {
            if (delta >= 200) {
                SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', true);
            } else if (delta < 200) {
                SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', false);
            }
        } else if (this._wasAboveThreshold && delta <= 750 && !this._wasReach200ft) {
            if (!SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_1_ACTIVE', 'Bool') && !SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_2_ACTIVE', 'Bool')) {
                SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', false);
                SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION_SHORT', 'Bool', true);
            }
        } else if (delta > 750 && this._wasInRange && !this._wasReach200ft) {
            if (delta > 750) {
                SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', true);
            } else if (delta >= 750) {
                SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION', 'Bool', false);
            }
        }
    }

    hasAltitudeConstraint() {
        if (this.aircraft == Aircraft.A320_NEO) {
            if (Simplane.getAutoPilotAltitudeManaged() && SimVar.GetSimVarValue('L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT', 'number') != 0) {
                return false;
            }
        }
        return true;
    }
}

/*
 * This file contains various nodes that can be used for logical processing. Systems like the FWC may use them to
 * accurately implement their functionality.
 */

/**
 * The following class represents a monostable circuit. It is inspired by the MTRIG nodes as described in the ESLD and
 * used by the FWC.
 * When it detects either a rising or a falling edge (depending on it's type) it will emit a signal for a certain time t
 * after the detection. It is not retriggerable, so a rising/falling edge within t will not reset the timer.
 */
class NXLogic_TriggeredMonostableNode {
    constructor(t, risingEdge = true) {
        this.t = t;
        this.risingEdge = risingEdge;
        this._timer = 0;
        this._previousValue = null;
    }

    write(value, _deltaTime) {
        if (this._previousValue === null && SimVar.GetSimVarValue('L:A32NX_FWC_SKIP_STARTUP', 'Bool')) {
            this._previousValue = value;
        }
        if (this.risingEdge) {
            if (this._timer > 0) {
                this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
                this._previousValue = value;
                return true;
            } if (!this._previousValue && value) {
                this._timer = this.t;
                this._previousValue = value;
                return true;
            }
        } else {
            if (this._timer > 0) {
                this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
                this._previousValue = value;
                return true;
            } if (this._previousValue && !value) {
                this._timer = this.t;
                this._previousValue = value;
                return true;
            }
        }
        this._previousValue = value;
        return false;
    }
}

/**
 * The following class represents a "confirmation" circuit, which only passes a signal once it has been stable for a
 * certain amount of time. It is inspired by the CONF nodes as described in the ESLD and used by the FWC.
 * When it detects either a rising or falling edge (depending on it's type) it will wait for up to time t and emit the
 * incoming signal if it was stable throughout t. If at any point the signal reverts during t the state is fully reset,
 * and the original signal will be emitted again.
 */
class NXLogic_ConfirmNode {
    constructor(t, risingEdge = true) {
        this.t = t;
        this.risingEdge = risingEdge;
        this._timer = 0;
        this._previousInput = null;
        this._previousOutput = null;
    }

    write(value, _deltaTime) {
        if (this._previousInput === null && SimVar.GetSimVarValue('L:A32NX_FWC_SKIP_STARTUP', 'Bool')) {
            this._previousInput = value;
            this._previousOutput = value;
        }
        if (this.risingEdge) {
            if (!value) {
                this._timer = 0;
            } else if (this._timer > 0) {
                this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
                this._previousInput = value;
                this._previousOutput = !value;
                return !value;
            } else if (!this._previousInput && value) {
                this._timer = this.t;
                this._previousInput = value;
                this._previousOutput = !value;
                return !value;
            }
        } else if (value) {
            this._timer = 0;
        } else if (this._timer > 0) {
            this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
            this._previousInput = value;
            this._previousOutput = !value;
            return !value;
        } else if (this._previousInput && !value) {
            this._timer = this.t;
            this._previousInput = value;
            this._previousOutput = !value;
            return !value;
        }
        this._previousInput = value;
        this._previousOutput = value;
        return value;
    }

    read() {
        return this._previousOutput;
    }
}

/**
 * The following class represents a flip-flop or memory circuit that can be used to store a single bit. It is inspired
 * by the S+R nodes as described in the ESLD.
 * It has two inputs: Set and Reset. At first it will always emit a falsy value, until it receives a signal on the set
 * input, at which point it will start emitting a truthy value. This will continue until a signal is received on the
 * reset input, at which point it reverts to the original falsy output. It a signal is sent on both set and reset at the
 * same time, the input with a star will have precedence.
 * The NVM flag is not implemented right now but can be used to indicate non-volatile memory storage, which means the
 * value will persist even when power is lost and subsequently restored.
 */
class NXLogic_MemoryNode {
    /**
     * @param setStar Whether set has precedence over reset if both are applied simultaneously.
     * @param nvm Whether the is non-volatile and will be kept even when power is lost.
     */
    constructor(setStar = true, nvm = false) {
        this.setStar = setStar;
        this.nvm = nvm; // TODO in future, reset non-nvm on power cycle
        this._value = false;
    }

    write(set, reset) {
        if (set && reset) {
            this._value = this.setStar;
        } else if (set && !this._value) {
            this._value = true;
        } else if (reset && this._value) {
            this._value = false;
        }
        return this._value;
    }

    read() {
        return this._value;
    }
}
