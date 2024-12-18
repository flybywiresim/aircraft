/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import {
  Arinc429Register,
  NXLogicConfirmNode,
  NXLogicMemoryNode,
  NXLogicTriggeredMonostableNode,
} from '@flybywiresim/fbw-sdk';
import { FwsCore } from 'systems-host/systems/FlightWarningSystem/FwsCore';

export enum FwcFlightPhase {
  ElecPwr = 1,
  FirstEngineStarted = 2,
  SecondEngineTakeOffPower = 3,
  AtOrAboveEightyKnots = 4,
  AtOrAboveV1 = 5,
  LiftOff = 6,
  AtOrAbove400Feet = 7,
  AtOrAbove1500FeetTo800Feet = 8,
  AtOrBelow800Feet = 9,
  TouchDown = 10,
  AtOrBelowEightyKnots = 11,
  EnginesShutdown = 12,
}

// FIXME use subjects from FwsCore
/**
 * This nearly a 1:1 port from the A32NX's FWC serves as temporary replacement, until a more sophisticated system simulation is in place.
 */
export class FwsFlightPhases {
  toConfigTest: boolean;

  ldgMemo: boolean;

  toMemo: boolean;

  gndMemo: NXLogicConfirmNode;

  oneEngineRunningConf: NXLogicConfirmNode;

  speedAbove80KtsMemo: NXLogicMemoryNode;

  speedAboveV1Memo: NXLogicMemoryNode;

  mctMemo: NXLogicConfirmNode;

  firePBOutConf: NXLogicConfirmNode;

  firePBOutMemo: NXLogicTriggeredMonostableNode;

  firePBClear12: NXLogicMemoryNode;

  phase112Memo: NXLogicTriggeredMonostableNode;

  phase10GroundMemo: NXLogicTriggeredMonostableNode;

  ac80KtsMemo: NXLogicTriggeredMonostableNode;

  prevPhase11InvertMemo: NXLogicTriggeredMonostableNode;

  twoEnginesTOPowerInvertMemo: NXLogicTriggeredMonostableNode;

  phase9Nvm: NXLogicMemoryNode;

  prevPhase11: boolean;

  groundImmediateMemo: NXLogicTriggeredMonostableNode;

  phase6Memo: NXLogicTriggeredMonostableNode;

  phase7Memo: NXLogicTriggeredMonostableNode;

  phase89Memo: NXLogicTriggeredMonostableNode;

  memoTo_conf01: NXLogicConfirmNode;

  memoTo_memo: NXLogicMemoryNode;

  memoLdgMemo_conf01: NXLogicConfirmNode;

  memoLdgMemo_inhibit: NXLogicMemoryNode;

  memoLdgMemo_conf02: NXLogicConfirmNode;

  memoLdgMemo_below2000ft: NXLogicMemoryNode;

  memoToInhibit_conf01: NXLogicConfirmNode;

  memoLdgInhibit_conf01: NXLogicConfirmNode;

  previousTargetAltitude: number;

  _wasBelowThreshold: boolean;

  _wasAboveThreshold: boolean;

  _wasInRange: boolean;

  _wasReach200ft: boolean;

  _cChordShortWasTriggered: boolean;

  aircraft: Aircraft;

  private readonly adrAltitude = Arinc429Register.empty();

  constructor(private fws: FwsCore) {
    // momentary
    this.toConfigTest = null;

    // persistent
    this.ldgMemo = null;
    this.toMemo = null;

    this.gndMemo = new NXLogicConfirmNode(1);

    this.oneEngineRunningConf = new NXLogicConfirmNode(30);

    this.speedAbove80KtsMemo = new NXLogicMemoryNode(true);

    this.speedAboveV1Memo = new NXLogicMemoryNode();

    this.mctMemo = new NXLogicConfirmNode(60, false);

    this.firePBOutConf = new NXLogicConfirmNode(0.2);
    this.firePBOutMemo = new NXLogicTriggeredMonostableNode(2);
    this.firePBClear12 = new NXLogicMemoryNode(false);
    this.phase112Memo = new NXLogicTriggeredMonostableNode(300);
    this.phase10GroundMemo = new NXLogicTriggeredMonostableNode(2);
    this.ac80KtsMemo = new NXLogicTriggeredMonostableNode(2);
    this.prevPhase11InvertMemo = new NXLogicTriggeredMonostableNode(3, false);
    this.twoEnginesTOPowerInvertMemo = new NXLogicTriggeredMonostableNode(1, false);
    this.phase9Nvm = new NXLogicMemoryNode(true, true);
    this.prevPhase11 = false;

    this.groundImmediateMemo = new NXLogicTriggeredMonostableNode(2);
    this.phase6Memo = new NXLogicTriggeredMonostableNode(15);
    this.phase7Memo = new NXLogicTriggeredMonostableNode(120);
    this.phase89Memo = new NXLogicTriggeredMonostableNode(180);

    this.memoTo_conf01 = new NXLogicConfirmNode(120, true);
    this.memoTo_memo = new NXLogicMemoryNode(false);

    this.memoLdgMemo_conf01 = new NXLogicConfirmNode(1, true);
    this.memoLdgMemo_inhibit = new NXLogicMemoryNode(false);
    this.memoLdgMemo_conf02 = new NXLogicConfirmNode(10, true);
    this.memoLdgMemo_below2000ft = new NXLogicMemoryNode(true);

    this.memoToInhibit_conf01 = new NXLogicConfirmNode(3, true);

    this.memoLdgInhibit_conf01 = new NXLogicConfirmNode(3, true);

    // altitude warning
    this.previousTargetAltitude = NaN;
    this._wasBelowThreshold = false;
    this._wasAboveThreshold = false;
    this._wasInRange = false;
    this._wasReach200ft = false;
  }

  update(deltaTime: number) {
    this._updateFlightPhase(deltaTime);
    this._updateTakeoffMemo(deltaTime);
    this._updateLandingMemo(deltaTime);
    this._updateAltitudeWarning();
  }

  _updateFlightPhase(_deltaTime: number) {
    const raHeight1Invalid = this.fws.radioHeight1.isFailureWarning() || this.fws.radioHeight1.isNoComputedData();
    const raHeight2Invalid = this.fws.radioHeight2.isFailureWarning() || this.fws.radioHeight2.isNoComputedData();
    let radioHeight;
    if (raHeight1Invalid) {
      if (raHeight2Invalid) {
        radioHeight = this.fws.radioHeight3;
      } else {
        radioHeight = this.fws.radioHeight2;
      }
    } else {
      radioHeight = this.fws.radioHeight1;
    }
    // TODO find a better source for the following value ("core speed at or above idle")
    // Note that N1 starts below idle on spawn on the runway, so this should be below 16 to not jump back to phase 1
    const oneEngRunning =
      this.fws.N1Eng1.get() > 15 ||
      this.fws.N1Eng2.get() > 15 ||
      this.fws.N1Eng3.get() > 15 ||
      this.fws.N1Eng4.get() > 15;
    const oneEngineRunning = this.oneEngineRunningConf.write(oneEngRunning, _deltaTime);
    const noEngineRunning = !oneEngineRunning;
    const hFail =
      this.fws.radioHeight1.isFailureWarning() &&
      this.fws.radioHeight2.isFailureWarning() &&
      this.fws.radioHeight3.isFailureWarning();
    const adcTestInhib = false;

    const groundImmediate = Simplane.getIsGrounded();
    const ground = this.gndMemo.write(groundImmediate, _deltaTime);

    const ias = this.fws.computedAirSpeedToNearest2.get();
    const acSpeedAbove80kts = this.speedAbove80KtsMemo.write(ias > 83, ias < 77);

    const v1 = SimVar.GetSimVarValue('L:AIRLINER_V1_SPEED', 'knots');
    let acAboveV1: boolean;
    if (v1) {
      acAboveV1 = this.speedAboveV1Memo.write(ias > v1 + 3, ias < v1 - 3);
    } else {
      acAboveV1 = false;
    }

    const hAbv1500 = radioHeight.isNoComputedData() || radioHeight.value > 1500;
    const hAbv800 = radioHeight.isNoComputedData() || radioHeight.value > 800;
    const hAbv400 = radioHeight.isNoComputedData() || radioHeight.value > 400;

    const eng1TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number');
    const eng1TLAFTO = SimVar.GetSimVarValue('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'number') !== 0; // is a flex temp is set?
    const eng1MCT = eng1TLA > 33.3 && eng1TLA < 36.7;
    const eng1TLAFullPwr = eng1TLA > 43.3;
    const eng1MCL = eng1TLA > 22.9;
    const eng1SupMCT = !(eng1TLA < 36.7);

    const eng2TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number');
    const eng2TLAFTO = eng1TLAFTO; // until we have proper FADECs
    const eng2MCT = eng2TLA > 33.3 && eng2TLA < 36.7;
    const eng2TLAFullPwr = eng2TLA > 43.3;
    const eng2MCL = eng2TLA > 22.9;
    const eng2SupMCT = !(eng2TLA < 36.7);

    const eng3TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:3', 'number');
    const eng3TLAFTO = eng1TLAFTO; // until we have proper FADECs
    const eng3MCT = eng3TLA > 33.3 && eng3TLA < 36.7;
    const eng3TLAFullPwr = eng3TLA > 43.3;
    const eng3MCL = eng3TLA > 22.9;
    const eng3SupMCT = !(eng3TLA < 36.7);

    const eng4TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:4', 'number');
    const eng4TLAFTO = eng1TLAFTO; // until we have proper FADECs
    const eng4MCT = eng4TLA > 33.3 && eng4TLA < 36.7;
    const eng4TLAFullPwr = eng3TLA > 43.3;
    const eng4MCL = eng4TLA > 22.9;
    const eng4SupMCT = !(eng4TLA < 36.7);

    const twoEnginesMcl = [eng1MCL, eng2MCL, eng3MCL, eng4MCL].filter(Boolean).length >= 2;
    const eng1TOPowerSignal = (eng1TLAFTO && eng1MCT) || eng1TLAFullPwr || eng1SupMCT;
    const eng2TOPowerSignal = (eng2TLAFTO && eng2MCT) || eng2TLAFullPwr || eng2SupMCT;
    const eng3TOPowerSignal = (eng3TLAFTO && eng3MCT) || eng3TLAFullPwr || eng3SupMCT;
    const eng4TOPowerSignal = (eng4TLAFTO && eng4MCT) || eng4TLAFullPwr || eng4SupMCT;

    const twoEnginesTOPowerSignal =
      [eng1TOPowerSignal, eng2TOPowerSignal, eng3TOPowerSignal, eng4TOPowerSignal].filter(Boolean).length >= 2;

    const twoEnginesTOPower =
      twoEnginesTOPowerSignal ||
      (this.mctMemo.write(twoEnginesTOPowerSignal, _deltaTime) && !hAbv1500 && twoEnginesMcl);

    const eng1FirePbMemo = this.firePBOutMemo.write(
      this.firePBOutConf.write(this.fws.fireButtonEng1.get(), _deltaTime),
      _deltaTime,
    );
    const resetFirePbClear12 = eng1FirePbMemo && ground;

    const phase10 =
      (this.phase10GroundMemo.write(groundImmediate, _deltaTime) || groundImmediate) &&
      !twoEnginesTOPower &&
      acSpeedAbove80kts;

    const phase345Cond = ground && twoEnginesTOPower;
    const phase3 = !acSpeedAbove80kts && oneEngRunning && phase345Cond;
    const phase4 = acSpeedAbove80kts && phase345Cond && !acAboveV1;
    const phase5 = acSpeedAbove80kts && phase345Cond && acAboveV1;

    const setPhase11Nvm = phase3 || phase10;
    const resetPhase11Nvm =
      (!this.ac80KtsMemo.write(!acSpeedAbove80kts, _deltaTime) &&
        ((ground && this.prevPhase11InvertMemo.write(this.prevPhase11, _deltaTime)) ||
          resetFirePbClear12 ||
          (ground && this.twoEnginesTOPowerInvertMemo.write(twoEnginesTOPower, _deltaTime))) &&
        !this.prevPhase11) ||
      adcTestInhib;
    const phase11Nvm = this.phase9Nvm.write(setPhase11Nvm, resetPhase11Nvm); // S* / R (NVM)
    const phase211Cond = ground && !twoEnginesTOPower && !acSpeedAbove80kts;
    const phase11 = oneEngRunning && phase11Nvm && phase211Cond;
    const phase2 = phase211Cond && !phase11Nvm && oneEngRunning;

    const phase112MemoA = this.firePBClear12.write(phase11, resetFirePbClear12); // S / R*
    const phase112Cond = !phase11 && noEngineRunning && groundImmediate;
    const phase112Memo = this.phase112Memo.write(phase112MemoA && phase112Cond, _deltaTime);
    const phase1 = phase112Cond && !phase112Memo;
    const phase12 = phase112Cond && phase112Memo;

    this.prevPhase11 = phase11;

    const ground2sMemorized = this.groundImmediateMemo.write(groundImmediate, _deltaTime) || groundImmediate;

    const phase6Cond = !hAbv400 && twoEnginesTOPower && !hFail && !ground2sMemorized;
    const phase6 = this.phase6Memo.write(phase6Cond, _deltaTime) && phase6Cond;

    const phase7Cond = !phase6 && !hAbv1500 && twoEnginesTOPower && !hFail && !ground2sMemorized;
    const phase7 = this.phase7Memo.write(phase7Cond, _deltaTime) && phase7Cond;

    const phase89Cond = !ground2sMemorized && !hFail && !twoEnginesTOPower && !hAbv1500 && !hAbv800;
    const phase89Memo = this.phase89Memo.write(phase89Cond, _deltaTime) && phase89Cond;

    const phase8 = !phase7 && !ground2sMemorized && !phase89Memo;
    const phase9 = phase89Memo && !phase10;

    // consolidate into single variable (just to be safe)
    const phases = [phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8, phase9, phase10, phase11, phase12];

    if (this.fws.flightPhase.get() === null && phases.indexOf(true) !== -1) {
      // if we aren't initialized, just grab the first one that is valid
      this.fws.flightPhase.set(phases.indexOf(true) + 1);
      console.log(`FWC flight phase: ${this.fws.flightPhase.get()}`);
      return;
    }

    const activePhases = phases
      .map((x, i) => [x ? 1 : 0, i + 1])
      .filter((y) => y[0] === 1)
      .map((z) => z[1]);

    // the usual and easy case: only one flight phase is valid
    if (activePhases.length === 1) {
      if (activePhases[0] !== this.fws.flightPhase.get()) {
        console.log(`FWC flight phase: ${this.fws.flightPhase.get()} => ${activePhases[0]}`);
        this.fws.flightPhase.set(activePhases[0]);
      }
      return;
    }

    // the mixed case => warn
    if (activePhases.length > 1) {
      if (activePhases.indexOf(this.fws.flightPhase.get()) !== -1) {
        // if the currently active one is present, keep it
        return;
      }
      // pick the earliest one
      this.fws.flightPhase.set(activePhases[0]);
      return;
    }

    // otherwise, no flight phase is valid => warn
    if (this.fws.flightPhase.get() === null) {
      this.fws.flightPhase.set(null);
    }
  }

  _updateTakeoffMemo(_deltaTime: number) {
    const setFlightPhaseMemo = this.fws.flightPhase.get() === FwcFlightPhase.FirstEngineStarted && this.toConfigTest;
    const resetFlightPhaseMemo =
      this.fws.flightPhase.get() === FwcFlightPhase.EnginesShutdown ||
      this.fws.flightPhase.get() === FwcFlightPhase.SecondEngineTakeOffPower ||
      this.fws.flightPhase.get() === FwcFlightPhase.ElecPwr ||
      this.fws.flightPhase.get() === FwcFlightPhase.AtOrAbove1500FeetTo800Feet;
    const flightPhaseMemo = this.memoTo_memo.write(setFlightPhaseMemo, resetFlightPhaseMemo);

    this.fws.engine1Running.get();
    const toTimerElapsed = this.memoTo_conf01.write(
      this.fws.engine1Running.get() &&
        this.fws.engine2Running.get() &&
        this.fws.engine3Running.get() &&
        this.fws.engine4Running.get(),
      _deltaTime,
    );

    this.toMemo =
      flightPhaseMemo || (this.fws.flightPhase.get() === FwcFlightPhase.FirstEngineStarted && toTimerElapsed);
    SimVar.SetSimVarValue('L:A32NX_FWC_TOMEMO', 'Bool', this.toMemo);
  }

  _updateLandingMemo(_deltaTime: number) {
    const radioHeight1Invalid = this.fws.radioHeight1.isFailureWarning() || this.fws.radioHeight1.isNoComputedData();
    const radioHeight2Invalid = this.fws.radioHeight2.isFailureWarning() || this.fws.radioHeight2.isNoComputedData();
    const radioHeight3Invalid = this.fws.radioHeight3.isFailureWarning() || this.fws.radioHeight3.isNoComputedData();
    const gearDownlocked = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') > 0.95;

    const setBelow2000ft =
      (this.fws.radioHeight1.value < 2000 && !radioHeight1Invalid) ||
      (this.fws.radioHeight2.value < 2000 && !radioHeight2Invalid) ||
      (this.fws.radioHeight3.value < 2000 && !radioHeight3Invalid);
    const resetBelow2000ft =
      (this.fws.radioHeight1.value > 2200 || radioHeight1Invalid) &&
      (this.fws.radioHeight2.value > 2200 || radioHeight2Invalid) &&
      (this.fws.radioHeight3.value > 2200 || radioHeight3Invalid);
    const memo2 = this.memoLdgMemo_below2000ft.write(setBelow2000ft, resetBelow2000ft);

    const setInhibitMemo = this.memoLdgMemo_conf01.write(
      resetBelow2000ft && !radioHeight1Invalid && !radioHeight2Invalid && !radioHeight3Invalid,
      _deltaTime,
    );
    const resetInhibitMemo = !(
      this.fws.flightPhase.get() === FwcFlightPhase.AtOrBelow800Feet ||
      this.fws.flightPhase.get() === FwcFlightPhase.TouchDown ||
      this.fws.flightPhase.get() === FwcFlightPhase.AtOrAbove1500FeetTo800Feet
    );
    const memo1 = this.memoLdgMemo_inhibit.write(setInhibitMemo, resetInhibitMemo);

    const showInApproach = memo1 && memo2 && this.fws.flightPhase.get() === FwcFlightPhase.AtOrAbove1500FeetTo800Feet;

    const invalidRadioMemo = this.memoLdgMemo_conf02.write(
      radioHeight1Invalid &&
        radioHeight2Invalid &&
        radioHeight3Invalid &&
        gearDownlocked &&
        this.fws.flightPhase.get() === FwcFlightPhase.AtOrAbove1500FeetTo800Feet,
      _deltaTime,
    );

    this.ldgMemo =
      showInApproach ||
      invalidRadioMemo ||
      this.fws.flightPhase.get() === FwcFlightPhase.TouchDown ||
      this.fws.flightPhase.get() === FwcFlightPhase.AtOrBelow800Feet;
    SimVar.SetSimVarValue('L:A32NX_FWC_LDGMEMO', 'Bool', this.ldgMemo);
  }

  _updateAltitudeWarning() {
    const warningPressed =
      !!SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_L', 'Bool') ||
      !!SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_R', 'Bool');
    if (warningPressed === true) {
      this._wasBelowThreshold = false;
      this._wasAboveThreshold = false;
      this._wasInRange = false;
      this._cChordShortWasTriggered = false;
      this.fws.soundManager.dequeueSound('cChordOnce');
      this.fws.soundManager.dequeueSound('cChordCont');
      return;
    }

    if (Simplane.getIsGrounded()) {
      this.fws.soundManager.dequeueSound('cChordCont');
    }

    // Use FCU displayed value
    const currentAltitudeConstraint = SimVar.GetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet');
    const currentFCUAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const targetAltitude =
      currentAltitudeConstraint && !this.hasAltitudeConstraint() ? currentAltitudeConstraint : currentFCUAltitude;

    // Exit when selected altitude is being changed
    if (this.previousTargetAltitude !== targetAltitude) {
      this.previousTargetAltitude = targetAltitude;
      this._wasBelowThreshold = false;
      this._wasAboveThreshold = false;
      this._wasInRange = false;
      this._wasReach200ft = false;
      this._cChordShortWasTriggered = false;
      this.fws.soundManager.dequeueSound('cChordOnce');
      this.fws.soundManager.dequeueSound('cChordCont');
      return;
    }

    // Exit when:
    // - Landing gear down & slats extended
    // - Glide slope captured
    // - Landing locked down

    const landingGearIsDown =
      SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Enum') >= 1 &&
      SimVar.GetSimVarValue('L:A32NX_GEAR_HANDLE_POSITION', 'Percent over 100') > 0.5;
    const verticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Number');
    const glideSlopeCaptured = verticalMode >= 30 && verticalMode <= 34;
    const landingGearIsLockedDown = SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum') > 0.9;
    const isTcasResolutionAdvisoryActive = SimVar.GetSimVarValue('L:A32NX_TCAS_STATE', 'Enum') > 1;
    if (landingGearIsDown || glideSlopeCaptured || landingGearIsLockedDown || isTcasResolutionAdvisoryActive) {
      this._wasBelowThreshold = false;
      this._wasAboveThreshold = false;
      this._wasInRange = false;
      this._wasReach200ft = false;
      this._cChordShortWasTriggered = false;
      this.fws.soundManager.dequeueSound('cChordOnce');
      this.fws.soundManager.dequeueSound('cChordCont');
      return;
    }

    // FIXME better altitude selection
    this.adrAltitude.setFromSimVar(`L:A32NX_ADIRS_ADR_1_BARO_CORRECTED_ALTITUDE_${this.fws.fwsNumber}`);
    if (!this.adrAltitude.isNormalOperation()) {
      return;
    }
    const delta = Math.abs(this.adrAltitude.value - targetAltitude);

    if (delta < 200) {
      this._wasBelowThreshold = true;
      this._wasAboveThreshold = false;
      this._wasReach200ft = true;
    }
    if (delta > 750) {
      this._wasAboveThreshold = true;
      this._wasBelowThreshold = false;
      this._cChordShortWasTriggered = false;
    }
    if (delta >= 200 && delta <= 750) {
      this._wasInRange = true;
    }

    const apEngaged =
      SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_1_ACTIVE', 'Bool') ||
      SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_2_ACTIVE', 'Bool');
    if (this._wasBelowThreshold && this._wasReach200ft) {
      if (delta >= 200) {
        this.fws.soundManager.enqueueSound('cChordCont');
      } else {
        this.fws.soundManager.dequeueSound('cChordCont');
      }
    } else if (
      this._wasAboveThreshold &&
      delta <= 750 &&
      !this._wasReach200ft &&
      !this._cChordShortWasTriggered &&
      !apEngaged
    ) {
      this._cChordShortWasTriggered = true;
      this.fws.soundManager.dequeueSound('cChordCont');
      this.fws.soundManager.enqueueSound('cChordOnce');
    } else if (delta > 750 && this._wasInRange && !this._wasReach200ft) {
      if (delta > 750) {
        this.fws.soundManager.enqueueSound('cChordCont');
      } else {
        this.fws.soundManager.dequeueSound('cChordCont');
      }
    }
  }

  hasAltitudeConstraint() {
    if (
      Simplane.getAutoPilotAltitudeManaged() &&
      SimVar.GetSimVarValue('L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT', 'number') !== 0
    ) {
      return false;
    }
    return true;
  }
}
