// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import {
  NXLogicConfirmNode,
  NXLogicPulseNode,
  NXLogicMemoryNode,
  NXLogicTriggeredMonostableNode,
  Arinc429Register,
  RegisteredSimVar,
} from '@flybywiresim/fbw-sdk';
import { SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { FwsCore } from './FwsCore';

export class FwsAutoCallouts {
  /** ROW/ROP Callouts **/
  private readonly rowRopStatusWord = Arinc429Register.empty();
  private readonly rowRopStatusWordVar = RegisteredSimVar.create('L:A32NX_ROW_ROP_WORD_1', SimVarValueType.Enum);

  // BRAKE MAX BRAKING
  private readonly pedalInputLeft = RegisteredSimVar.create('L:A32NX_LEFT_BRAKE_PEDAL_INPUT', SimVarValueType.Number);
  private readonly pedalInputRight = RegisteredSimVar.create('L:A32NX_RIGHT_BRAKE_PEDAL_INPUT', SimVarValueType.Number);
  private readonly phase10RowRopMtrig = new NXLogicTriggeredMonostableNode(4.5, false, true);
  public readonly brakeMaxBraking = Subject.create(false);
  // SET MAX REVERSE
  private readonly setMaxReverseConf = new NXLogicConfirmNode(0.2);
  public readonly setMaxReverse = Subject.create(false);

  // KEEP MAX REVERSE
  private readonly keepMaxReverseMemory = new NXLogicMemoryNode(false);
  private readonly phase11DownPulse = new NXLogicPulseNode(false);
  private readonly setReversePulse = new NXLogicPulseNode(false);
  private readonly keepMaxReverseConfirm = new NXLogicConfirmNode(0.6);
  public readonly keepMaxReverse = Subject.create(false);

  // RUNWAY TOO SHORT
  public readonly runwayTooShort = Subject.create(false);

  constructor(private readonly fws: FwsCore) {}

  public update(deltaTime: number) {
    const flightPhase = this.fws.flightPhase.get();
    this.updateRowRopWarnings(flightPhase, deltaTime);
  }

  updateRowRopWarnings(flightPhase: number, deltaTime: number) {
    this.rowRopStatusWord.set(this.rowRopStatusWordVar.get());
    const phase10RowRopMtrigOutput = this.phase10RowRopMtrig.write(flightPhase === 10, deltaTime);
    const rolloutOrBouncedLanding =
      flightPhase == 11 || flightPhase == 10 || (phase10RowRopMtrigOutput && (flightPhase === 8 || flightPhase === 9));

    // MAX BRAKING
    const maxBrakingRequested = this.rowRopStatusWord.bitValueOr(11, false);
    const maxBrakingSet = this.pedalInputLeft.get() > 90 || this.pedalInputRight.get() > 90;
    const brakeMaxBraking = maxBrakingRequested && !maxBrakingSet && rolloutOrBouncedLanding;
    this.brakeMaxBraking.set(brakeMaxBraking);

    // SET MAX REVERSE
    const maxReverseRequested = this.rowRopStatusWord.bitValueOr(12, false);
    this.setMaxReverse.set(this.setMaxReverseConf.write(maxReverseRequested, deltaTime) && rolloutOrBouncedLanding); //FIXME: Check reverser INOP

    // KEEP MAX REVERSE.
    const keepMaxReverseMemory = this.keepMaxReverseMemory.write(
      this.keepMaxReverseConfirm.write(this.rowRopStatusWord.bitValueOr(13, false), deltaTime),
      this.setReversePulse.write(maxReverseRequested) ||
        !maxBrakingRequested ||
        flightPhase === 2 ||
        flightPhase === 12 ||
        this.phase11DownPulse.write(flightPhase === 11),
    );
    this.keepMaxReverse.set(flightPhase === 11 && keepMaxReverseMemory);

    // RUNWAY TOO SHORT
    this.runwayTooShort.set(flightPhase >= 8 && flightPhase <= 10 && this.rowRopStatusWord.bitValueOr(15, false));
  }
}
