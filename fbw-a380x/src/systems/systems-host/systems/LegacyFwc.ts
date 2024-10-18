/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
// TODO remove this once Rust implementation is up and running
import { Arinc429Word, UpdateThrottler } from '@flybywiresim/fbw-sdk';

enum FwcFlightPhase {
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

/**
 * This 1:1 port from the A32NX's FWC serves as temporary replacement, until a more sophisticated system simulation is in place.
 * After merge of PR #4872 (https://github.com/flybywiresim/aircraft/pull/4872) (intended for A32NX), the FWS architecture has to
 * be ported to the A380X, then this class can be removed.
 */
export class LegacyFwc {
  private updateThrottler = new UpdateThrottler(125); // has to be > 100 due to pulse nodes

  toConfigTest: boolean;

  flightPhase: FwcFlightPhase;

  ldgMemo: boolean;

  toMemo: boolean;

  gndMemo: NXLogic_ConfirmNode;

  oneEngineRunningConf: NXLogic_ConfirmNode;

  speedAbove80KtsMemo: NXLogic_MemoryNode;

  speedAboveV1Memo: NXLogic_MemoryNode;

  mctMemo: NXLogic_ConfirmNode;

  firePBOutConf: NXLogic_ConfirmNode;

  firePBOutMemo: NXLogic_TriggeredMonostableNode;

  firePBClear12: NXLogic_MemoryNode;

  phase112Memo: NXLogic_TriggeredMonostableNode;

  phase10GroundMemo: NXLogic_TriggeredMonostableNode;

  ac80KtsMemo: NXLogic_TriggeredMonostableNode;

  prevPhase11InvertMemo: NXLogic_TriggeredMonostableNode;

  twoEnginesTOPowerInvertMemo: NXLogic_TriggeredMonostableNode;

  phase9Nvm: NXLogic_MemoryNode;

  prevPhase11: boolean;

  groundImmediateMemo: NXLogic_TriggeredMonostableNode;

  phase6Memo: NXLogic_TriggeredMonostableNode;

  phase7Memo: NXLogic_TriggeredMonostableNode;

  phase89Memo: NXLogic_TriggeredMonostableNode;

  memoTo_conf01: NXLogic_ConfirmNode;

  memoTo_memo: NXLogic_MemoryNode;

  memoLdgMemo_conf01: NXLogic_ConfirmNode;

  memoLdgMemo_inhibit: NXLogic_MemoryNode;

  memoLdgMemo_conf02: NXLogic_ConfirmNode;

  memoLdgMemo_below2000ft: NXLogic_MemoryNode;

  memoToInhibit_conf01: NXLogic_ConfirmNode;

  memoLdgInhibit_conf01: NXLogic_ConfirmNode;

  previousTargetAltitude: number;

  _wasBellowThreshold: boolean;

  _wasAboveThreshold: boolean;

  _wasInRange: boolean;

  _wasReach200ft: boolean;

  aircraft: Aircraft;

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
    this.oneEngineRunningConf = new NXLogic_ConfirmNode(30);

    // ESDL 1. 0. 73
    this.speedAbove80KtsMemo = new NXLogic_MemoryNode(true);

    this.speedAboveV1Memo = new NXLogic_MemoryNode();

    // ESDL 1. 0. 79 / ESDL 1. 0. 80
    this.mctMemo = new NXLogic_ConfirmNode(60, false);

    // ESDL 1. 0.100
    this.firePBOutConf = new NXLogic_ConfirmNode(0.2); // CONF01
    this.firePBOutMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 05
    this.firePBClear12 = new NXLogic_MemoryNode(false);
    this.phase112Memo = new NXLogic_TriggeredMonostableNode(300); // MTRIG 03
    this.phase10GroundMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 06
    this.ac80KtsMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 04
    this.prevPhase11InvertMemo = new NXLogic_TriggeredMonostableNode(3, false); // MTRIG 02
    this.twoEnginesTOPowerInvertMemo = new NXLogic_TriggeredMonostableNode(1, false); // MTRIG 01
    this.phase9Nvm = new NXLogic_MemoryNode(true, true);
    this.prevPhase11 = false;

    // ESDL 1. 0.110
    this.groundImmediateMemo = new NXLogic_TriggeredMonostableNode(2); // MTRIG 03
    this.phase6Memo = new NXLogic_TriggeredMonostableNode(15);
    this.phase7Memo = new NXLogic_TriggeredMonostableNode(120);
    this.phase89Memo = new NXLogic_TriggeredMonostableNode(180); // MTRIG 02

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

    // altitude warning
    this.previousTargetAltitude = NaN;
    this._wasBellowThreshold = false;
    this._wasAboveThreshold = false;
    this._wasInRange = false;
    this._wasReach200ft = false;
  }

  update(_deltaTime: number) {
    const throttledT = this.updateThrottler.canUpdate(_deltaTime);

    if (throttledT > 0) {
      this._updateFlightPhase(throttledT);
      this._updateTakeoffMemo(throttledT);
      this._updateLandingMemo(throttledT);
      this._updateAltitudeWarning();
    }
  }

  _updateFlightPhase(_deltaTime: number) {
    const radioHeight1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
    const radioHeight2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
    const radioHeight3 = Arinc429Word.fromSimVarValue('L:A32NX_RA_3_RADIO_ALTITUDE');

    const raHeight1InValid = radioHeight1.isFailureWarning() || radioHeight1.isNoComputedData();
    const raHeight2InValid = radioHeight2.isFailureWarning() || radioHeight2.isNoComputedData();
    let radioHeight;
    if (raHeight1InValid) {
      if (raHeight2InValid) {
        radioHeight = radioHeight3;
      } else {
        radioHeight = radioHeight2;
      }
    } else {
      radioHeight = radioHeight1;
    }
    const eng1N1 = SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent');
    const eng2N1 = SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent');
    const eng3N1 = SimVar.GetSimVarValue('ENG N1 RPM:3', 'Percent');
    const eng4N1 = SimVar.GetSimVarValue('ENG N1 RPM:4', 'Percent');
    // TODO find a better source for the following value ("core speed at or above idle")
    // Note that N1 starts below idle on spawn on the runway, so this should be below 16 to not jump back to phase 1
    const oneEngRunning = eng1N1 > 15 || eng2N1 > 15 || eng3N1 > 15 || eng4N1 > 15;
    const oneEngineRunning = this.oneEngineRunningConf.write(oneEngRunning, _deltaTime);
    const noEngineRunning = !oneEngineRunning;
    const hFail = radioHeight1.isFailureWarning() && radioHeight2.isFailureWarning() && radioHeight3.isFailureWarning();
    const adcTestInhib = false;

    // ESLD 1.0.60
    const groundImmediate = Simplane.getIsGrounded();
    const ground = this.gndMemo.write(groundImmediate, _deltaTime);

    // ESLD 1.0.73
    const ias = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots');
    const acSpeedAbove80kts = this.speedAbove80KtsMemo.write(ias > 83, ias < 77);

    const v1 = SimVar.GetSimVarValue('L:AIRLINER_V1_SPEED', 'knots');
    let acAboveV1;
    if (v1) {
      acAboveV1 = this.speedAboveV1Memo.write(ias > v1 + 3, ias < v1 - 3);
    } else {
      acAboveV1 = false;
    }

    // ESLD 1.0.90
    const hAbv1500 = radioHeight.isNoComputedData() || radioHeight.value > 1500;
    const hAbv800 = radioHeight.isNoComputedData() || radioHeight.value > 800;
    const hAbv400 = radioHeight.isNoComputedData() || radioHeight.value > 400;

    // ESLD 1.0.79 + 1.0.80
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

    const eng4TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:5', 'number');
    const eng4TLAFTO = eng1TLAFTO; // until we have proper FADECs
    const eng4MCT = eng3TLA > 33.3 && eng3TLA < 36.7;
    const eng4TLAFullPwr = eng3TLA > 43.3;
    const eng4MCL = eng3TLA > 22.9;
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

    // ESLD 1.0.100
    const eng1FirePbOut = SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG1', 'Bool');
    const eng1FirePbMemo = this.firePBOutMemo.write(this.firePBOutConf.write(eng1FirePbOut, _deltaTime), _deltaTime);
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
    const phase112Memo = this.phase112Memo.write(phase112MemoA && phase112Cond, _deltaTime); // MTRIG 03
    const phase1 = phase112Cond && !phase112Memo;
    const phase12 = phase112Cond && phase112Memo;

    this.prevPhase11 = phase11;

    // ESLD 1.0.110
    const ground2sMemorized = this.groundImmediateMemo.write(groundImmediate, _deltaTime) || groundImmediate;

    const phase6Cond = !hAbv400 && twoEnginesTOPower && !hFail && !ground2sMemorized;
    const phase6 = this.phase6Memo.write(phase6Cond, _deltaTime) && phase6Cond;

    const phase7Cond = !phase6 && !hAbv1500 && twoEnginesTOPower && !hFail && !ground2sMemorized;
    const phase7 = this.phase7Memo.write(phase7Cond, _deltaTime) && phase7Cond;

    const phase89Cond = !ground2sMemorized && !hFail && !twoEnginesTOPower && !hAbv1500 && !hAbv800;
    const phase89Memo = this.phase89Memo.write(phase89Cond, _deltaTime) && phase89Cond;

    const phase8 = !phase7 && !ground2sMemorized && !phase89Memo;
    const phase9 = phase89Memo && !phase10;

    /** * End of ESLD logic ** */

    // consolidate into single variable (just to be safe)
    const phases = [phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8, phase9, phase10, phase11, phase12];

    if (this.flightPhase === null && phases.indexOf(true) !== -1) {
      // if we aren't initialized, just grab the first one that is valid
      this._setFlightPhase(phases.indexOf(true) + 1);
      console.log(`FWC flight phase: ${this.flightPhase}`);
      return;
    }

    const activePhases = phases
      .map((x, i) => [x ? 1 : 0, i + 1])
      .filter((y) => y[0] === 1)
      .map((z) => z[1]);

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
      if (activePhases.indexOf(this.flightPhase) !== -1) {
        // if the currently active one is present, keep it
        return;
      }
      // pick the earliest one
      this._setFlightPhase(activePhases[0]);
      return;
    }

    // otherwise, no flight phase is valid => warn
    if (this.flightPhase === null) {
      this._setFlightPhase(null);
    }
  }

  _setFlightPhase(flightPhase: FwcFlightPhase) {
    if (flightPhase === this.flightPhase) {
      return;
    }

    // update flight phase
    this.flightPhase = flightPhase;
    SimVar.SetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', this.flightPhase || 0);
  }

  _updateTakeoffMemo(_deltaTime: number) {
    /// FWC ESLD 1.0.180
    const setFlightPhaseMemo = this.flightPhase === FwcFlightPhase.FirstEngineStarted && this.toConfigTest;
    const resetFlightPhaseMemo =
      this.flightPhase === FwcFlightPhase.EnginesShutdown ||
      this.flightPhase === FwcFlightPhase.SecondEngineTakeOffPower ||
      this.flightPhase === FwcFlightPhase.ElecPwr ||
      this.flightPhase === FwcFlightPhase.AtOrAbove1500FeetTo800Feet;
    const flightPhaseMemo = this.memoTo_memo.write(setFlightPhaseMemo, resetFlightPhaseMemo);

    const eng1NotRunning = SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent') < 15;
    const eng2NotRunning = SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent') < 15;
    const eng3NotRunning = SimVar.GetSimVarValue('ENG N1 RPM:3', 'Percent') < 15;
    const eng4NotRunning = SimVar.GetSimVarValue('ENG N1 RPM:4', 'Percent') < 15;
    const toTimerElapsed = this.memoTo_conf01.write(
      !eng1NotRunning && !eng2NotRunning && !eng3NotRunning && !eng4NotRunning,
      _deltaTime,
    );

    this.toMemo = flightPhaseMemo || (this.flightPhase === FwcFlightPhase.FirstEngineStarted && toTimerElapsed);
    SimVar.SetSimVarValue('L:A32NX_FWC_TOMEMO', 'Bool', this.toMemo);
  }

  _updateLandingMemo(_deltaTime: number) {
    const radioHeight1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
    const radioHeight2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
    const radioHeight3 = Arinc429Word.fromSimVarValue('L:A32NX_RA_3_RADIO_ALTITUDE');
    const radioHeight1Invalid = radioHeight1.isFailureWarning() || radioHeight1.isNoComputedData();
    const radioHeight2Invalid = radioHeight2.isFailureWarning() || radioHeight2.isNoComputedData();
    const radioHeight3Invalid = radioHeight3.isFailureWarning() || radioHeight3.isNoComputedData();
    const gearDownlocked = SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') > 0.95;

    // FWC ESLD 1.0.190
    const setBelow2000ft =
      (radioHeight1.value < 2000 && !radioHeight1Invalid) ||
      (radioHeight2.value < 2000 && !radioHeight2Invalid) ||
      (radioHeight3.value < 2000 && !radioHeight3Invalid);
    const resetBelow2000ft =
      (radioHeight1.value > 2200 || radioHeight1Invalid) &&
      (radioHeight2.value > 2200 || radioHeight2Invalid) &&
      (radioHeight3.value > 2200 || radioHeight3Invalid);
    const memo2 = this.memoLdgMemo_below2000ft.write(setBelow2000ft, resetBelow2000ft);

    const setInhibitMemo = this.memoLdgMemo_conf01.write(
      resetBelow2000ft && !radioHeight1Invalid && !radioHeight2Invalid && !radioHeight3Invalid,
      _deltaTime,
    );
    const resetInhibitMemo = !(
      this.flightPhase === FwcFlightPhase.AtOrBelow800Feet ||
      this.flightPhase === FwcFlightPhase.TouchDown ||
      this.flightPhase === FwcFlightPhase.AtOrAbove1500FeetTo800Feet
    );
    const memo1 = this.memoLdgMemo_inhibit.write(setInhibitMemo, resetInhibitMemo);

    const showInApproach = memo1 && memo2 && this.flightPhase === FwcFlightPhase.AtOrAbove1500FeetTo800Feet;

    const invalidRadioMemo = this.memoLdgMemo_conf02.write(
      radioHeight1Invalid &&
        radioHeight2Invalid &&
        radioHeight3Invalid &&
        gearDownlocked &&
        this.flightPhase === FwcFlightPhase.AtOrAbove1500FeetTo800Feet,
      _deltaTime,
    );

    this.ldgMemo =
      showInApproach ||
      invalidRadioMemo ||
      this.flightPhase === FwcFlightPhase.TouchDown ||
      this.flightPhase === FwcFlightPhase.AtOrBelow800Feet;
    SimVar.SetSimVarValue('L:A32NX_FWC_LDGMEMO', 'Bool', this.ldgMemo);
  }

  _updateAltitudeWarning() {
    const indicatedAltitude = Simplane.getAltitude();
    const shortAlert = SimVar.GetSimVarValue('L:A32NX_ALT_DEVIATION_SHORT', 'Bool');
    if (shortAlert === 1) {
      SimVar.SetSimVarValue('L:A32NX_ALT_DEVIATION_SHORT', 'Bool', false);
    }

    const warningPressed =
      !!SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_L', 'Bool') ||
      !!SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_R', 'Bool');
    if (warningPressed === true) {
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
    const targetAltitude =
      currentAltitudeConstraint && !this.hasAltitudeConstraint() ? currentAltitudeConstraint : currentFCUAltitude;

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

    const landingGearIsDown =
      SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Enum') >= 1 &&
      SimVar.GetSimVarValue('L:A32NX_GEAR_HANDLE_POSITION', 'Percent over 100') > 0.5;
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
      if (
        !SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_1_ACTIVE', 'Bool') &&
        !SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_2_ACTIVE', 'Bool')
      ) {
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
    if (
      Simplane.getAutoPilotAltitudeManaged() &&
      SimVar.GetSimVarValue('L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT', 'number') !== 0
    ) {
      return false;
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
  t: number;

  risingEdge: boolean;

  _timer: number;

  _previousValue: boolean;

  constructor(t: number, risingEdge = true) {
    this.t = t;
    this.risingEdge = risingEdge;
    this._timer = 0;
    this._previousValue = null;
  }

  write(value: boolean, _deltaTime: number) {
    if (this._previousValue === null && SimVar.GetSimVarValue('L:A32NX_FWC_SKIP_STARTUP', 'Bool')) {
      this._previousValue = value;
    }
    if (this.risingEdge) {
      if (this._timer > 0) {
        this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
        this._previousValue = value;
        return true;
      }
      if (!this._previousValue && value) {
        this._timer = this.t;
        this._previousValue = value;
        return true;
      }
    } else {
      if (this._timer > 0) {
        this._timer = Math.max(this._timer - _deltaTime / 1000, 0);
        this._previousValue = value;
        return true;
      }
      if (this._previousValue && !value) {
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
  t: number;

  risingEdge: boolean;

  _timer: number;

  _previousInput: boolean;

  _previousOutput: boolean;

  constructor(t: number, risingEdge = true) {
    this.t = t;
    this.risingEdge = risingEdge;
    this._timer = 0;
    this._previousInput = null;
    this._previousOutput = null;
  }

  write(value: boolean, _deltaTime: number) {
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
  setStar: boolean;

  nvm: boolean;

  _value: boolean;

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
