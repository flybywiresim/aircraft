// @ts-strict-ignore
import {
  Arinc429Word,
  NXLogicConfirmNode,
  NXLogicMemoryNode,
  NXLogicTriggeredMonostableNode,
} from '@flybywiresim/fbw-sdk';

// FIXME move to PseudoFWC
export class A32NX_FWC {
  // persistent
  private flightPhase = null;

  // ESDL 1. 0. 60
  private gndMemo = new NXLogicConfirmNode(1); // outptuts ZGND

  // ESDL 1. 0. 60
  private eng1OrTwoRunningConf = new NXLogicConfirmNode(30);

  // ESDL 1. 0. 73
  private speedAbove80KtsMemo = new NXLogicMemoryNode(true);

  // ESDL 1. 0. 79 / ESDL 1. 0. 80
  private mctMemo = new NXLogicConfirmNode(60, false);

  // ESDL 1. 0.100
  private firePBOutConf = new NXLogicConfirmNode(0.2); // CONF01
  private firePBOutMemo = new NXLogicTriggeredMonostableNode(2); // MTRIG 05
  private firePBClear10 = new NXLogicMemoryNode(false);
  private phase110Memo = new NXLogicTriggeredMonostableNode(300); // MTRIG 03
  private phase8GroundMemo = new NXLogicTriggeredMonostableNode(2); // MTRIG 06
  private ac80KtsMemo = new NXLogicTriggeredMonostableNode(2); // MTRIG 04
  private prevPhase9InvertMemo = new NXLogicTriggeredMonostableNode(3, false); // MTRIG 02
  private eng1Or2TOPowerInvertMemo = new NXLogicTriggeredMonostableNode(1, false); // MTRIG 01
  private phase9Nvm = new NXLogicMemoryNode(true, true);
  private prevPhase9 = false;

  // ESDL 1. 0.110
  private groundImmediateMemo = new NXLogicTriggeredMonostableNode(2); // MTRIG 03
  private phase5Memo = new NXLogicTriggeredMonostableNode(120); // MTRIG 01
  private phase67Memo = new NXLogicTriggeredMonostableNode(180); // MTRIG 02

  update(_deltaTime, _core) {
    this._updateFlightPhase(_deltaTime);
  }

  _updateFlightPhase(_deltaTime) {
    const radioHeight1 = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
    const radioHeight2 = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
    const radioHeight =
      radioHeight1.isFailureWarning() || radioHeight1.isNoComputedData() ? radioHeight2 : radioHeight1;
    const eng1N1 = SimVar.GetSimVarValue('ENG N1 RPM:1', 'Percent');
    const eng2N1 = SimVar.GetSimVarValue('ENG N1 RPM:2', 'Percent');
    // TODO find a better source for the following value ("core speed at or above idle")
    // Note that N1 starts below idle on spawn on the runway, so this should be below 16 to not jump back to phase 1
    const oneEngRunning = eng1N1 > 15 || eng2N1 > 15;
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
    const eng1TLAFTO = SimVar.GetSimVarValue('L:A32NX_AIRLINER_TO_FLEX_TEMP', 'number') !== 0; // is a flex temp is set?
    const eng1MCT = eng1TLA > 33.3 && eng1TLA < 36.7;
    const eng1TLAFullPwr = eng1TLA > 43.3;
    const eng2TLA = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number');
    const eng2TLAFTO = eng1TLAFTO; // until we have proper FADECs
    const eng2MCT = eng2TLA > 33.3 && eng2TLA < 36.7;
    const eng2TLAFullPwr = eng2TLA > 43.3;
    const eng1OrEng2SupMCT = !(eng1TLA < 36.7) || !(eng2TLA < 36.7);
    const eng1AndEng2MCL = eng1TLA > 22.9 && eng2TLA > 22.9;
    const eng1Or2TOPowerSignal =
      (eng1TLAFTO && eng1MCT) ||
      (eng2TLAFTO && eng2MCT) ||
      eng1OrEng2SupMCT ||
      eng1OrEng2SupMCT ||
      eng1TLAFullPwr ||
      eng2TLAFullPwr;
    const eng1Or2TOPower =
      eng1Or2TOPowerSignal || (this.mctMemo.write(eng1Or2TOPowerSignal, _deltaTime) && !hAbv1500 && eng1AndEng2MCL);

    // ESLD 1.0.100
    const eng1FirePbOut = SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG1', 'Bool');
    const eng1FirePbMemo = this.firePBOutMemo.write(this.firePBOutConf.write(eng1FirePbOut, _deltaTime), _deltaTime);
    const resetFirePbClear10 = eng1FirePbMemo && ground;

    const phase8 =
      (this.phase8GroundMemo.write(groundImmediate, _deltaTime) || groundImmediate) &&
      !eng1Or2TOPower &&
      acSpeedAbove80kts;

    const phase34Cond = ground && eng1Or2TOPower;
    const phase3 = !acSpeedAbove80kts && eng1Or2Running && phase34Cond;
    const phase4 = acSpeedAbove80kts && phase34Cond;

    const setPhase9Nvm = phase3 || phase8;
    const resetPhase9Nvm =
      (!this.ac80KtsMemo.write(!acSpeedAbove80kts, _deltaTime) &&
        ((ground && this.prevPhase9InvertMemo.write(this.prevPhase9, _deltaTime)) ||
          resetFirePbClear10 ||
          (ground && this.eng1Or2TOPowerInvertMemo.write(eng1Or2TOPower, _deltaTime))) &&
        !this.prevPhase9) ||
      adcTestInhib;
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

    const phase67Cond = !ground2sMemorized && !hFail && !eng1Or2TOPower && !hAbv1500 && !hAbv800;
    const phase67Memo = this.phase67Memo.write(phase67Cond, _deltaTime) && phase67Cond;

    const phase6 = !phase5 && !ground2sMemorized && !phase67Memo;
    const phase7 = phase67Memo && !phase8;

    /*** End of ESLD logic ***/

    // consolidate into single variable (just to be safe)
    const phases = [phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8, phase9, phase10];

    if (this.flightPhase === null && phases.indexOf(true) !== -1) {
      // if we aren't initialized, just grab the first one that is valid
      this._setFlightPhase(phases.indexOf(true) + 1);
      console.log(`FWC flight phase: ${this.flightPhase}`);
      return;
    }

    const activePhases = phases
      .map((x, i) => [x, i + 1])
      .filter((y) => !!y[0])
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
}
