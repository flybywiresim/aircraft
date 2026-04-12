// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import {
  NXLogicConfirmNode,
  NxHysterisNode,
  NXLogicPulseNode,
  NXLogicMemoryNode,
  NXLogicTriggeredMonostableNode,
  Arinc429WordData,
  Arinc429Register,
  RegisteredSimVar,
} from '@flybywiresim/fbw-sdk';
import { SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS, A32NXRadioAutoCallOutFlags } from '@shared/AutoCallOuts';
import { DEFAULT_MONITOR_TIME, PseudoFWC } from './PseudoFWC';

export class FwsAutoCallouts {
  private autoCalloutInhibit = false;

  public autoCallOutPins = A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS;

  private twoThousandFiveHundredActivePrev = false;

  private readonly twoThousandFiveHundredWithinRangeConfNode = new NXLogicConfirmNode(0.2, true);

  private readonly twoThousandFiveHundredHystherisis = new NxHysterisNode(3000, 2500);

  private readonly twoThousandFiveHundredHystherisisPulseNode = new NXLogicPulseNode(false);

  private readonly twoThousandFiveHundredAudioPulseNode = new NXLogicPulseNode(false);

  private readonly twoThousandFiveHundredHasPlayedMemoryNode = new NXLogicMemoryNode(true);

  public readonly twoThousandFiveHundredAudio = Subject.create(false);

  public readonly twentyFiveHundredAudio = Subject.create(false);

  private twoThousandActivePrev = false;

  private readonly twoThousandWithinRangeConfNode = new NXLogicConfirmNode(0.2, true);

  private readonly twoThousandHystherisis = new NxHysterisNode(2400, 2000);

  private readonly twoThousandHystherisisPulseNode = new NXLogicPulseNode(false);

  private readonly twoThousandHasPlayedMemoryNode = new NXLogicMemoryNode(true);

  public readonly twoThousandAudio = Subject.create(false);

  private readonly twoThousandAudioPulseNode = new NXLogicPulseNode(false);

  private oneThousandActivePrev = false;

  private readonly oneThousandWithinRangeConfNode = new NXLogicConfirmNode(0.2, true);

  private readonly oneThousandHystherisis = new NxHysterisNode(1100, 1000);

  private readonly oneThousandHystherisisPulseNode = new NXLogicPulseNode(false);

  private readonly oneThousandHasPlayedMemoryNode = new NXLogicMemoryNode(true);

  public readonly oneThousandAudio = Subject.create(false);

  private readonly oneThousandAudioPulseNode = new NXLogicPulseNode(false);

  private readonly fiveHundredWithinRangeConfNode = new NXLogicConfirmNode(0.2, true);

  private readonly fiveHundredSmartGlideDeviation = new NXLogicConfirmNode(0.5);

  private fiveHundredMtrigPreviousCycle = false;

  private readonly fiveHundredMtrigNode = new NXLogicTriggeredMonostableNode(11);

  public readonly fiveHundredAudio = Subject.create(false);

  private fourHoundredFeetTreshold = false;

  private fourHundredThresholdPreviousCycle = false;

  private fourHundredMtrigPreviousCycle = false;

  private readonly fourHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);

  public readonly fourHundredAudio = Subject.create(false);

  private threeHundredFeetTreshold = false;

  private threeHundredThresholdPreviousCycle = false;

  private threeHundredMtrigPreviousCycle = false;

  private readonly threeHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);

  public readonly threeHundredAudio = Subject.create(false);

  private twoHundredFeetTreshold = false;

  private twoHundredThresholdPreviousCycle = false;

  private twoHundredMtrigPreviousCycle = false;

  private readonly twoHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);

  public readonly twoHundredAudio = Subject.create(false);

  private oneHundredFeetTreshold = false;
  private oneHundredThresholdPreviousCycle = false;
  private oneHundredMtrigPreviousCycle = false;
  private readonly oneHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);
  public readonly oneHundredAudio = Subject.create(false);

  private fiftyFeetTreshold = false;
  private fiftyThresholdAndNoAudioInhibitPreviousCycle = false;
  private fiftyMtrigPreviousCycle = false;
  private readonly fiftyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fiftyAudio = Subject.create(false);

  private fortyFeetTreshold = false;
  private fortyThresholdAndNoAudioInhibitPreviousCycle = false;
  private fortyMtrigPreviousCycle = false;
  private readonly fortyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fortyAudio = Subject.create(false);

  private thirtyFeetTreshold = false;
  private thirtyThresholdAndNoAudioInhibitPreviousCycle = false;
  private thirtyMtrigPreviousCycle = false;
  private readonly thirtyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly thirtyAudio = Subject.create(false);

  private twentyFeetTreshold = false;
  private twentyThresholdAndNoAudioInhibitPreviousCycle = false;
  private twentyMtrigPreviousCycle = false;
  private readonly twentyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly twentyAudio = Subject.create(false);

  private tenFeetTreshold = false;
  private twentyRetardActivePreviousCycle = false;
  private twentyRetardActiveMtrigPreviousCycle = false;
  private readonly twentyRetardActiveMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly twentyRetardAudio = Subject.create(false);

  private tenRetardActivePreviousCycle = false;
  private tenRetardActiveMtrigPreviousCycle = false;
  private readonly tenRetardActiveMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly tenRetardAudio = Subject.create(false);

  private tenThresholdAndNoAudioInhibitPreviousCycle = false;
  private tenMtrigPreviousCycle = false;
  private readonly tenMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly tenAudio = Subject.create(false);

  private heightLessThan10Feet = false;
  private heightLessThan20Feet = false;
  private retardTriggerConditionPreviousCycle = false;
  private readonly heightInferiorTo10FeetConfNode = new NXLogicConfirmNode(0.1);
  private readonly heightInferiorTo20FeetConfNode = new NXLogicConfirmNode(0.1);
  public readonly retardAudio = Subject.create(false);

  private readonly togaRetardInhibitMemoryNode = new NXLogicMemoryNode(true);
  private readonly phase6Or7StartedPulseNode = new NXLogicPulseNode(false);

  private fiveFeetTreshold = false;
  private fiveThresholdAndNoAudioInhibitPreviousCycle = false;
  private fiveMtrigPreviousCycle = false;
  private readonly fiveMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fiveAudio = Subject.create(false);

  private thrLeverNotIdleRetardAudio = false; // TODO

  private inhibitCalloutDueToRetard = false;
  private generalRetardInhibit = false;

  private readonly heightNotDecreasingConfirmNode = new NXLogicConfirmNode(0.3, false);
  private previousHeight: number | null = null;
  private heightAbove410Feet = false;
  private heightAbove50Feet = false;
  private anyHeightThresholdBelow400Met = false;
  private anyActiveHeightThresholdBelow400Met = false;

  private heightCallOutInhibition1 = false;
  private heightCallOutInhibition2 = false;
  private heightCallOutInhibition3 = false;

  private readonly gpwsWarningLightOn = RegisteredSimVar.createBoolean(
    'L:A32NX_GPWS_WARNING_LIGHT_ON',
    SimVarValueType.Bool,
  );
  private readonly gpwsAlertLightOn = RegisteredSimVar.createBoolean(
    'L:A32NX_GPWS_ALERT_LIGHT_ON',
    SimVarValueType.Bool,
  );
  private readonly gpwsMtrig = new NXLogicTriggeredMonostableNode(2);
  private gpwsActive = false;

  private tcasAudio = false;
  // TODO
  private readonly tcasAudioMrtrigNode = new NXLogicTriggeredMonostableNode(5, true, true);

  private mdaInhibit = false;
  private dmcLDiscreteWord270: Arinc429Register = Arinc429Register.empty();
  private readonly dmcLDiscreteWord270Var = RegisteredSimVar.create(
    'L:A32NX_DMC_DISCRETE_WORD_270_LEFT',
    SimVarValueType.Enum,
  );
  private readonly dmcRDiscreteWord270: Arinc429Register = Arinc429Register.empty();
  private readonly dmcRDiscreteWord270Var = RegisteredSimVar.create(
    'L:A32NX_DMC_DISCRETE_WORD_270_RIGHT',
    SimVarValueType.Enum,
  );
  private readonly hundredAboveMdaMtrig = new NXLogicTriggeredMonostableNode(3);
  private readonly hundredAboveMdaMemoryNode = new NXLogicMemoryNode(false);

  private readonly hundredAboveDhConfNode = new NXLogicConfirmNode(0.1);
  private readonly hundredAboveDhMtrig = new NXLogicTriggeredMonostableNode(3);
  private readonly hundredAboveDhMemoryNode = new NXLogicMemoryNode(false);

  public readonly hundredAboveAudio = Subject.create(false);
  private fmDhToUse: Arinc429Register = Arinc429Register.empty();
  private readonly fm1Dh: Arinc429Register = Arinc429Register.empty();
  private readonly fm1DhRegisteredSimVar = RegisteredSimVar.create('L:A32NX_FM1_DECISION_HEIGHT', SimVarValueType.Enum);
  private readonly fm2Dh: Arinc429Register = Arinc429Register.empty();
  private readonly fm2DhRegisteredSimVar = RegisteredSimVar.create('L:A32NX_FM2_DECISION_HEIGHT', SimVarValueType.Enum);

  private dhInhibit = false;
  private minimumGenerated = false;

  private readonly minimumMdaMtrigNode = new NXLogicTriggeredMonostableNode(3);
  private readonly minimumMdaMemoryNode = new NXLogicMemoryNode(true);
  private readonly dhMinimumConfNode = new NXLogicConfirmNode(0.1);
  private readonly dhMinimumMtrigNode = new NXLogicTriggeredMonostableNode(3);
  private readonly minimumDhMemoryNode = new NXLogicMemoryNode(true);
  public readonly minimumAudio = Subject.create(false);

  constructor(private readonly fws: PseudoFWC) {}

  public update(deltaTime: number) {
    const flightPhase = this.fws.fwcFlightPhase.get();
    const height = this.fws.radioHeight1.isInvalid()
      ? this.fws.radioHeight2.valueOr(null)
      : this.fws.radioHeight1.value;
    const stallWarning = this.fws.stallWarning.get();
    const speedWarning = false; // TODO
    const onGround = this.fws.aircraftOnGround.get();
    const engine1MasterOn = this.fws.engine1Master.get();
    const engine2MasterOn = this.fws.engine2Master.get();
    const tla1 = this.fws.throttle1Position.get();
    const tla2 = this.fws.throttle2Position.get();
    const tla1Reverse = this.fws.eng1TLAReverse.get();
    const tla2Reverse = this.fws.eng2TLAReverse.get();
    const engine1NotRunning = this.fws.engine1NotRunning.get();
    const engine2NotRunning = this.fws.engine2NotRunning.get();
    const atsDiscreteWord = this.fws.atsDiscreteWord;
    const fm1DiscreteWord4 = this.fws.fmgc1DiscreteWord4.get();
    const fm2DiscreteWord4 = this.fws.fmgc2DiscreteWord4.get();
    this.dmcLDiscreteWord270.set(this.dmcLDiscreteWord270Var.get());
    this.dmcRDiscreteWord270.set(this.dmcRDiscreteWord270Var.get());
    this.fm1Dh.set(this.fm1DhRegisteredSimVar.get());
    this.fm2Dh.set(this.fm2DhRegisteredSimVar.get());
    // DH selection. Use DH 2 if 1 invalid or if both valid and DH 2 > DH1.
    if (this.fm1Dh.isInvalid() || this.fm2Dh.valueOr(0) > this.fm1Dh.valueOr(0)) {
      this.fmDhToUse = this.fm2Dh;
    } else {
      this.fmDhToUse = this.fm1Dh;
    }

    this.computeInhbits(
      deltaTime,
      height,
      flightPhase,
      stallWarning,
      speedWarning,
      onGround,
      engine1MasterOn,
      engine2MasterOn,
    );

    this.computeMinimumsCallouts(deltaTime, height);

    this.computeThresholds(height, deltaTime);

    this.radioAltimeterCalloutLogic(
      deltaTime,
      height,
      flightPhase,
      tla1,
      tla2,
      atsDiscreteWord,
      fm1DiscreteWord4,
      fm2DiscreteWord4,
      engine1NotRunning,
      engine2NotRunning,
      tla1Reverse,
      tla2Reverse,
    );
  }

  private computeMinimumsCallouts(deltaTime: number, height: number | null) {
    // 100 ABV
    // MDA
    const hundredAboveDmc =
      this.dmcLDiscreteWord270.bitValueOr(20, false) || this.dmcRDiscreteWord270.bitValueOr(20, false);
    const hundredAboveDmcMtrig = this.hundredAboveMdaMtrig.write(hundredAboveDmc, deltaTime);
    const hundredAboveMdaMemory = this.hundredAboveMdaMemoryNode.write(
      this.fws.hundredAboveEmitted,
      !hundredAboveDmcMtrig,
    );
    const hundredAboveMda = !this.mdaInhibit && !hundredAboveMdaMemory && hundredAboveDmcMtrig;
    // DH
    const dhValue = this.fmDhToUse.valueOr(0);
    const dhLessThan90Feet = dhValue < 90;
    const dhAndRaFirstComparison = height !== null && height <= 105 + dhValue;
    const dhAndRaSecondComparison = height !== null && height <= 115 + dhValue;
    const dhHundredAbovePreRequisite =
      (dhLessThan90Feet && dhAndRaFirstComparison) || (!dhLessThan90Feet && dhAndRaSecondComparison);
    const dhHundredAboveDhConf = this.hundredAboveDhConfNode.write(dhHundredAbovePreRequisite, deltaTime);
    const hundredAboveDhMtrig = this.hundredAboveDhMtrig.write(dhHundredAboveDhConf, deltaTime);
    const hundredAboveDhMemory = this.hundredAboveDhMemoryNode.write(
      this.fws.hundredAboveEmitted,
      !hundredAboveDhMtrig,
    );
    const hundredAboveDh = !hundredAboveDhMemory && hundredAboveDhMtrig && !this.dhInhibit;
    const hundredAbove = hundredAboveMda || hundredAboveDh;
    this.hundredAboveAudio.set(hundredAbove);
    /// Minimums
    // MDA
    const minimumDmc = this.dmcLDiscreteWord270.bitValueOr(21, false) || this.dmcRDiscreteWord270.bitValueOr(21, false);
    const minimumDmcMtrig = this.minimumMdaMtrigNode.write(minimumDmc, deltaTime);
    const minimumMdaMemory = this.minimumMdaMemoryNode.write(this.fws.minimumEmitted, !minimumDmcMtrig);
    const minimumMda = !this.mdaInhibit && !minimumMdaMemory && minimumDmcMtrig;

    // DH
    const dhAndRaMinimumFirstComparison = height !== null && height < 5 + dhValue;
    const dhAndRaMinimumSecondComparison = height !== null && height < 15 + dhValue;
    const dhMinimumPreRequisite =
      (dhLessThan90Feet && dhAndRaMinimumFirstComparison) || (!dhLessThan90Feet && dhAndRaMinimumSecondComparison);
    const dhMinimumConf = this.dhMinimumConfNode.write(dhMinimumPreRequisite, deltaTime);
    const dhMinimumMtrig = this.dhMinimumMtrigNode.write(dhMinimumConf, deltaTime);
    const minimumDhMemory = this.minimumDhMemoryNode.write(this.fws.minimumEmitted, !dhMinimumMtrig);
    const minimumDh = !minimumDhMemory && dhMinimumMtrig && !this.dhInhibit;

    const minimum = minimumMda || minimumDh;
    this.minimumGenerated = this.fws.minimumEmitted || this.fws.hundredAboveEmitted || hundredAbove || minimum;
    this.minimumAudio.set(minimum);
  }

  private computeThresholds(height: number | null, deltaTime: number) {
    this.fourHoundredFeetTreshold = height !== null && height < 410 && height >= 400;
    this.threeHundredFeetTreshold = height !== null && height < 310 && height >= 300;
    this.twoHundredFeetTreshold = height !== null && height < 210 && height >= 200;
    this.oneHundredFeetTreshold = height !== null && height < 110 && height >= 100;
    this.fiftyFeetTreshold = height !== null && height < 53 && height >= 50;
    this.fortyFeetTreshold = height !== null && height < 42 && height >= 40;
    this.thirtyFeetTreshold = height !== null && height < 32 && height >= 30;
    this.twentyFeetTreshold = height !== null && height < 22 && height >= 20;
    this.heightLessThan20Feet = height !== null && height <= 22 && height > -5;
    this.tenFeetTreshold = height !== null && height < 12 && height >= 10;
    this.heightLessThan10Feet = height !== null && height <= 12 && height > -5;
    this.fiveFeetTreshold = height !== null && height < 7 && height >= 5;
    this.heightAbove410Feet = height !== null && height >= 410;
    this.heightAbove50Feet = height !== null && height > 50;
    this.anyHeightThresholdBelow400Met =
      this.fourHoundredFeetTreshold ||
      this.threeHundredFeetTreshold ||
      this.twoHundredFeetTreshold ||
      this.oneHundredFeetTreshold ||
      this.fiftyFeetTreshold ||
      this.fortyFeetTreshold ||
      this.thirtyFeetTreshold ||
      this.twentyFeetTreshold ||
      this.tenFeetTreshold ||
      this.fiveFeetTreshold;
    const heightIncreased = height !== null && this.previousHeight !== null && height > this.previousHeight;
    const heightLessThan3Feet = height !== null && height < 3;
    const radioHeightNotDecreasing = this.heightNotDecreasingConfirmNode.write(heightIncreased, deltaTime);
    const climbingOrOnGround = heightLessThan3Feet || heightIncreased;
    this.heightCallOutInhibition1 = climbingOrOnGround || this.minimumGenerated || this.gpwsActive;
    this.heightCallOutInhibition2 = climbingOrOnGround || this.minimumGenerated;
    this.heightCallOutInhibition3 = heightLessThan3Feet || radioHeightNotDecreasing || this.minimumGenerated;
    this.previousHeight = height;
  }

  private computeInhbits(
    deltaTime: number,
    height: number | null,
    flightPhase: number,
    stallWarning: boolean,
    speedWarning: boolean,
    onGround: boolean,
    engine1MasterOn: boolean,
    engine2MasterOn: boolean,
  ) {
    const gpwsWarning = this.gpwsWarningLightOn.get();
    const gpwsAlert = this.gpwsAlertLightOn.get();
    const gpwsMtrig = this.gpwsMtrig.write(gpwsWarning || gpwsAlert, deltaTime);
    this.gpwsActive = gpwsWarning || gpwsAlert || gpwsMtrig;
    const raInvalidOrLowSpeedWarningOrFlex = height === null || stallWarning || speedWarning; // TODO some missing
    this.autoCalloutInhibit = raInvalidOrLowSpeedWarningOrFlex || (onGround && engine1MasterOn && engine2MasterOn);
    const onGroundAndNotPhase8 = onGround && flightPhase !== 8;
    this.generalRetardInhibit =
      raInvalidOrLowSpeedWarningOrFlex || (onGroundAndNotPhase8 && engine1MasterOn && engine2MasterOn);
    this.tcasAudio = this.tcasAudioMrtrigNode.write(false, deltaTime); // TODO
    this.mdaInhibit = speedWarning || stallWarning || this.gpwsActive || this.tcasAudio;
    this.dhInhibit = height === null || this.autoCalloutInhibit || this.fmDhToUse.valueOr(0) <= 3;
  }

  private radioAltimeterCalloutLogic(
    deltaTime: number,
    raValue: number | null,
    flightPhase: number,
    tla1: number,
    tla2: number,
    atsDiscreteWord: Arinc429Register,
    fm1DiscreteWord4: Arinc429WordData,
    fm2DiscreteWord4: Arinc429WordData,
    engine1NotRunning: boolean,
    engine2NotRunning: boolean,
    tla1Reverse: boolean,
    tla2Reverse: boolean,
  ): void {
    // 2500
    const height = raValue ?? 0;
    const twentyFiveHundredPin = (A32NXRadioAutoCallOutFlags.TwentyFiveHundred & this.autoCallOutPins) > 0;
    const twoThousandFiveHundredPin = (A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred & this.autoCallOutPins) > 0;
    const twentyFiveOrTwoThousandFiveHundredPin = twentyFiveHundredPin || twoThousandFiveHundredPin;
    const twoThousandFiveHundredFeetTreshold = this.twoThousandFiveHundredWithinRangeConfNode.write(
      height < 2530 && height >= 2500,
      deltaTime,
    );
    const gpwsOrTcasInhibit = this.gpwsActive || this.tcasAudio;
    const twoThousandFiveHundredFeetThresholdAndActive =
      (twentyFiveHundredPin || twoThousandFiveHundredPin) && twoThousandFiveHundredFeetTreshold && !gpwsOrTcasInhibit;

    const twoThousandFiveHundredHysteresis = twentyFiveOrTwoThousandFiveHundredPin
      ? this.twoThousandFiveHundredHystherisis.write(height)
      : false;

    const twoThousandFiveHundredActivePreviously = this.twoThousandFiveHundredActivePrev;
    const twoThousandFiveHundredMemory = this.twoThousandFiveHundredHasPlayedMemoryNode.write(
      twoThousandFiveHundredActivePreviously,
      this.twoThousandFiveHundredHystherisisPulseNode.write(twoThousandFiveHundredHysteresis, deltaTime),
    );

    const twoThousandFiveHundredActive =
      twoThousandFiveHundredFeetThresholdAndActive &&
      twoThousandFiveHundredHysteresis &&
      !twoThousandFiveHundredMemory &&
      !this.autoCalloutInhibit;

    this.twoThousandFiveHundredActivePrev = this.twoThousandFiveHundredAudioPulseNode.write(
      twoThousandFiveHundredActive,
      deltaTime,
    );
    this.twentyFiveHundredAudio.set(twentyFiveHundredPin && twoThousandFiveHundredActive);
    this.twoThousandFiveHundredAudio.set(twoThousandFiveHundredPin && twoThousandFiveHundredActive);

    // 2000
    const twoThousandFeetPin = (A32NXRadioAutoCallOutFlags.TwoThousand & this.autoCallOutPins) > 0;
    const twoThousandFeetTreshold = this.twoThousandWithinRangeConfNode.write(
      height < 2030 && height >= 2000,
      deltaTime,
    );
    const twoThousandThresholdAndActive = twoThousandFeetPin && twoThousandFeetTreshold && !gpwsOrTcasInhibit;
    const twoThousandFeetHysteresis = twoThousandFeetPin ? this.twoThousandHystherisis.write(height) : false;
    const twoThousandFeetActivePreviously = this.twoThousandActivePrev;
    const twoThousandFeetMemory = this.twoThousandHasPlayedMemoryNode.write(
      twoThousandFeetActivePreviously,
      this.twoThousandHystherisisPulseNode.write(twoThousandFeetHysteresis, deltaTime),
    );
    const twoThousandAudio =
      twoThousandThresholdAndActive && twoThousandFeetHysteresis && !twoThousandFeetMemory && !this.autoCalloutInhibit;
    this.twoThousandAudio.set(twoThousandAudio);
    this.twoThousandActivePrev = this.twoThousandAudioPulseNode.write(twoThousandAudio, deltaTime);

    // 1000
    const inhibit1OrTcas = this.heightCallOutInhibition1 || this.tcasAudio;
    const oneThousandFeetPin = (A32NXRadioAutoCallOutFlags.OneThousand & this.autoCallOutPins) > 0;
    const oneThousandFeetTreshold = this.oneThousandWithinRangeConfNode.write(
      height < 1030 && height >= 1000,
      deltaTime,
    );
    const oneThousandThresholdAndActive = oneThousandFeetPin && oneThousandFeetTreshold && !inhibit1OrTcas;
    const oneThousandFeetHysteresis = oneThousandFeetPin ? this.oneThousandHystherisis.write(height) : false;
    const oneThousandFeetActivePreviously = this.oneThousandActivePrev;
    const oneThousandFeetMemory = this.oneThousandHasPlayedMemoryNode.write(
      oneThousandFeetActivePreviously,
      this.oneThousandHystherisisPulseNode.write(oneThousandFeetHysteresis, deltaTime),
    );
    const oneThousandAudio =
      oneThousandThresholdAndActive && oneThousandFeetHysteresis && !oneThousandFeetMemory && !this.autoCalloutInhibit;
    this.oneThousandAudio.set(oneThousandAudio);
    this.oneThousandActivePrev = this.oneThousandAudioPulseNode.write(oneThousandAudio, deltaTime);

    // 500
    const fiveHundredFeetThreshold = this.fiveHundredWithinRangeConfNode.write(
      height < 530 && height >= 500,
      deltaTime,
    );
    const fiveHundredSmartPin = (A32NXRadioAutoCallOutFlags.FiveHundredGlide & this.autoCallOutPins) > 0;
    const fiveHundredHardPin = (A32NXRadioAutoCallOutFlags.FiveHundred & this.autoCallOutPins) > 0;
    const fiveHundredThresholdAndActive =
      fiveHundredFeetThreshold && (fiveHundredSmartPin || fiveHundredHardPin) && !inhibit1OrTcas;

    const fiveHundredAudio =
      !this.fiveHundredMtrigPreviousCycle &&
      fiveHundredThresholdAndActive &&
      !this.autoCalloutInhibit &&
      (fiveHundredSmartPin
        ? !this.fws.glideSlopeValid.get() ||
          this.fiveHundredSmartGlideDeviation.write(this.fws.glideSlopeDeviation.get() > 0.175, deltaTime)
        : fiveHundredHardPin);
    this.fiveHundredMtrigPreviousCycle = this.fiveHundredMtrigNode.write(fiveHundredAudio, deltaTime);
    this.fiveHundredAudio.set(fiveHundredAudio);

    // 400
    const fourHundredFeetTresholdAndActive =
      (A32NXRadioAutoCallOutFlags.FourHundred & this.autoCallOutPins) != 0 &&
      this.fourHoundredFeetTreshold &&
      !this.heightCallOutInhibition1;

    const fourHundredAudio =
      fourHundredFeetTresholdAndActive &&
      !this.fourHundredThresholdPreviousCycle && // Could be pulse node
      !this.fourHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.fourHundredAudio.set(fourHundredAudio);
    this.fourHundredThresholdPreviousCycle = fourHundredFeetTresholdAndActive;
    this.fourHundredMtrigPreviousCycle = this.fourHundredMtrigNode.write(fourHundredAudio, deltaTime);

    // 300
    const threeHundredFeetTresholdAndActive =
      (A32NXRadioAutoCallOutFlags.ThreeHundred & this.autoCallOutPins) != 0 &&
      this.threeHundredFeetTreshold &&
      !this.heightCallOutInhibition1;
    const threeHundredAudio =
      threeHundredFeetTresholdAndActive &&
      !this.threeHundredThresholdPreviousCycle &&
      !this.threeHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.threeHundredAudio.set(threeHundredAudio);
    this.threeHundredThresholdPreviousCycle = threeHundredFeetTresholdAndActive;
    this.threeHundredMtrigPreviousCycle = this.threeHundredMtrigNode.write(threeHundredAudio, deltaTime);

    // 200
    const twoHundredFeetTresholdAndActive =
      (A32NXRadioAutoCallOutFlags.TwoHundred & this.autoCallOutPins) != 0 &&
      this.twoHundredFeetTreshold &&
      !this.heightCallOutInhibition1;
    const twoHundredAudio =
      twoHundredFeetTresholdAndActive &&
      !this.twoHundredThresholdPreviousCycle &&
      !this.twoHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.twoHundredAudio.set(twoHundredAudio);
    this.twoHundredThresholdPreviousCycle = twoHundredFeetTresholdAndActive;
    this.twoHundredMtrigPreviousCycle = this.twoHundredMtrigNode.write(twoHundredAudio, deltaTime);

    // 100
    const oneHundredFeetTresholdAndActive =
      (A32NXRadioAutoCallOutFlags.OneHundred & this.autoCallOutPins) != 0 &&
      this.oneHundredFeetTreshold &&
      !this.heightCallOutInhibition1;
    const oneHundredAudio =
      oneHundredFeetTresholdAndActive &&
      !this.oneHundredThresholdPreviousCycle &&
      !this.oneHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.oneHundredAudio.set(oneHundredAudio);
    this.oneHundredThresholdPreviousCycle = oneHundredFeetTresholdAndActive;
    this.oneHundredMtrigPreviousCycle = this.oneHundredMtrigNode.write(oneHundredAudio, deltaTime);

    // 50
    const fiftyFeetThresholdActive =
      (A32NXRadioAutoCallOutFlags.Fifty & this.autoCallOutPins) != 0 &&
      this.fiftyFeetTreshold &&
      !this.heightCallOutInhibition1;
    const fiftyThresholdAndNoAudioInhibit = fiftyFeetThresholdActive && !this.autoCalloutInhibit;
    const fiftyThresholdAndNoInhibitRisingEdge =
      fiftyThresholdAndNoAudioInhibit && !this.fiftyThresholdAndNoAudioInhibitPreviousCycle;
    const fiftyAudio = !this.fortyAudio.get() && fiftyThresholdAndNoInhibitRisingEdge && !this.fiftyMtrigPreviousCycle;
    this.fiftyAudio.set(fiftyAudio);
    this.fiftyThresholdAndNoAudioInhibitPreviousCycle = fiftyThresholdAndNoAudioInhibit;
    this.fiftyMtrigPreviousCycle = this.fiftyMtrigNode.write(fiftyAudio, deltaTime);
    // 40
    const fourtyFeetThresholdActive =
      (A32NXRadioAutoCallOutFlags.Forty & this.autoCallOutPins) != 0 &&
      this.fortyFeetTreshold &&
      !this.heightCallOutInhibition2;
    const fortyThresholdAndNoAudioInhibit = fourtyFeetThresholdActive && !this.autoCalloutInhibit;
    const fortyThresholdAndNoInhibitRisingEdge =
      fortyThresholdAndNoAudioInhibit && !this.fortyThresholdAndNoAudioInhibitPreviousCycle;
    const fortyAudio = !this.thirtyAudio.get() && fortyThresholdAndNoInhibitRisingEdge && !this.fortyMtrigPreviousCycle;
    this.fortyAudio.set(fortyAudio);
    this.fortyThresholdAndNoAudioInhibitPreviousCycle = fortyThresholdAndNoAudioInhibit;
    this.fortyMtrigPreviousCycle = this.fortyMtrigNode.write(fortyAudio, deltaTime);
    // 30
    const thirtyFeetThresholdActive =
      (A32NXRadioAutoCallOutFlags.Thirty & this.autoCallOutPins) != 0 &&
      this.thirtyFeetTreshold &&
      !this.heightCallOutInhibition2;
    const thirtyThresholdAndNoAudioInhibit = thirtyFeetThresholdActive && !this.autoCalloutInhibit;
    const thirtyThresholdAndNoInhibitRisingEdge =
      thirtyThresholdAndNoAudioInhibit && !this.thirtyThresholdAndNoAudioInhibitPreviousCycle;
    const thirtyAudio =
      !this.twentyAudio.get() && thirtyThresholdAndNoInhibitRisingEdge && !this.thirtyMtrigPreviousCycle;
    this.thirtyAudio.set(thirtyAudio);
    this.thirtyThresholdAndNoAudioInhibitPreviousCycle = thirtyThresholdAndNoAudioInhibit;
    this.thirtyMtrigPreviousCycle = this.thirtyMtrigNode.write(thirtyAudio, deltaTime);
    // 20 no retard
    const twentyThreshold = this.twentyFeetTreshold;
    const twentyPinProgrammed = (A32NXRadioAutoCallOutFlags.Twenty & this.autoCallOutPins) != 0;
    const twentyFeetThresholdActive = twentyPinProgrammed && twentyThreshold && !this.heightCallOutInhibition2;
    const ap1Engaged = fm1DiscreteWord4.bitValueOr(12, false);
    const fm1LandActive = fm1DiscreteWord4.bitValueOr(13, false);
    const ap2Engaged = fm2DiscreteWord4.bitValueOr(12, false);
    const fm2LandActive = fm2DiscreteWord4.bitValueOr(13, false);
    const athrActive = atsDiscreteWord.bitValueOr(13, false);
    const oneApActiveAndinLand = (ap1Engaged && fm1LandActive) || (ap2Engaged && fm2LandActive);
    const oneApActiveAndAthr = oneApActiveAndinLand && athrActive;
    const twentyThresholdAndNoAudioInhibit = twentyFeetThresholdActive && !this.autoCalloutInhibit;
    const twentyThresholdAndNoInhibitRisingEdge =
      twentyThresholdAndNoAudioInhibit && !this.twentyThresholdAndNoAudioInhibitPreviousCycle;
    const twentyAudio =
      twentyThresholdAndNoInhibitRisingEdge &&
      !this.tenAudio.get() &&
      oneApActiveAndAthr &&
      !this.twentyMtrigPreviousCycle;
    this.twentyAudio.set(twentyAudio);
    this.twentyThresholdAndNoAudioInhibitPreviousCycle = twentyThresholdAndNoAudioInhibit;
    this.twentyMtrigPreviousCycle = this.twentyMtrigNode.write(twentyAudio, deltaTime);

    // 20 retard
    const goAround = tla1 > 43.3 || tla2 > 43.3; // TODO some missing, will suffice for now.
    const retardInhibitOrToga = this.generalRetardInhibit || goAround;
    const noAutoland = !oneApActiveAndinLand;
    const noAutolandAndAthr = noAutoland && athrActive;
    const noAutolandAndAthrOrNoAthr = noAutolandAndAthr || !athrActive;
    const twentyRetard =
      (!goAround || !this.autoCalloutInhibit) &&
      twentyFeetThresholdActive &&
      noAutolandAndAthrOrNoAthr &&
      !this.twentyRetardActiveMtrigPreviousCycle;
    const playRetardAudio = !this.twentyRetardActivePreviousCycle && twentyRetard;
    this.twentyRetardAudio.set(playRetardAudio);
    this.twentyRetardActivePreviousCycle = playRetardAudio;
    this.twentyRetardActiveMtrigPreviousCycle = this.twentyRetardActiveMtrigNode.write(playRetardAudio, deltaTime);
    // 10 no retard
    const tenThreshold = this.tenFeetTreshold;
    const tenPinProgrammed = (A32NXRadioAutoCallOutFlags.Ten & this.autoCallOutPins) != 0;
    const tenFeetThresholdActive = tenPinProgrammed && tenThreshold && !this.heightCallOutInhibition3;
    const tenThresholdAndNoAudioInhibit = tenFeetThresholdActive && !this.autoCalloutInhibit;
    const tenThresholdAndNoInhibitRisingEdge =
      tenThresholdAndNoAudioInhibit && !this.tenThresholdAndNoAudioInhibitPreviousCycle;
    this.tenAudio.set(
      tenThresholdAndNoInhibitRisingEdge &&
        !this.fiveAudio.get() &&
        !this.inhibitCalloutDueToRetard &&
        noAutolandAndAthrOrNoAthr &&
        !this.tenMtrigPreviousCycle,
    );
    this.tenThresholdAndNoAudioInhibitPreviousCycle = tenThresholdAndNoAudioInhibit;
    this.tenMtrigPreviousCycle = this.tenMtrigNode.write(this.tenAudio.get(), deltaTime);
    // 10 retard
    const tenRetard =
      (!goAround || this.autoCalloutInhibit) &&
      oneApActiveAndinLand &&
      athrActive &&
      tenThreshold &&
      !this.tenRetardActiveMtrigPreviousCycle;
    const playTenRetardAudio = !this.tenRetardActivePreviousCycle && tenRetard;
    this.tenRetardAudio.set(playTenRetardAudio);
    this.tenRetardActivePreviousCycle = playTenRetardAudio;
    this.tenRetardActiveMtrigPreviousCycle = this.tenRetardActiveMtrigNode.write(playTenRetardAudio, deltaTime);

    const engine1TlaIdle = tla1 < 2.6 && tla1 >= -4.3;
    const eng1RunningAndIdleAndEng2NotRunning = engine1TlaIdle && !engine1NotRunning && engine2NotRunning;
    const engine2TlaIdle = tla2 < 2.6 && tla2 >= -4.3;
    const eng2RunningAndIdleAndEng1NotRunning = engine2TlaIdle && !engine2NotRunning && engine1NotRunning;
    const bothEnginesRunningAndIdle = engine1TlaIdle && engine2TlaIdle && !engine1NotRunning && !engine2NotRunning;
    const bothEnginesIdle = engine1TlaIdle && engine2TlaIdle;
    const phase6Or7StartedPulse = this.phase6Or7StartedPulseNode.write(
      flightPhase === 6 || flightPhase === 7,
      deltaTime,
    );

    const retardToga = this.togaRetardInhibitMemoryNode.write(
      (bothEnginesIdle && flightPhase === 8) || (this.fws.flightPhase8PulseNode.read() && !phase6Or7StartedPulse),
      this.fws.flightPhase2PulseNode.read() ||
        this.fws.flightPhase3PulseNode.read() ||
        this.fws.flightPhase4PulseNode.read() ||
        this.fws.flightPhase7PulseNode.read() ||
        this.fws.flightPhase9PulseNode.read() ||
        this.thrLeverNotIdleRetardAudio,
    );

    const retardIdleOrToga =
      eng1RunningAndIdleAndEng2NotRunning ||
      eng2RunningAndIdleAndEng1NotRunning ||
      bothEnginesRunningAndIdle ||
      tla1Reverse ||
      tla2Reverse ||
      retardToga;
    const raBelow10Feet = this.heightInferiorTo10FeetConfNode.write(this.heightLessThan10Feet, deltaTime);
    const raBelow20Feet = this.heightInferiorTo20FeetConfNode.write(this.heightLessThan20Feet, deltaTime);
    const flightPhase67Or8 = flightPhase === 6 || flightPhase === 7 || flightPhase === 8;

    this.inhibitCalloutDueToRetard =
      !retardIdleOrToga &&
      flightPhase67Or8 &&
      ((raBelow10Feet && oneApActiveAndAthr) || (raBelow20Feet && noAutolandAndAthrOrNoAthr));

    const twentyNotPinProgrammedAndNoAutoland = !twentyPinProgrammed && twentyThreshold && noAutolandAndAthrOrNoAthr;
    const tenNotPinProgrammedAndAutoland = !tenPinProgrammed && tenThreshold && oneApActiveAndAthr;

    const retardTriggerCondition = twentyNotPinProgrammedAndNoAutoland || tenNotPinProgrammedAndAutoland;
    const retardTriggerRisingEdge = retardTriggerCondition && !this.retardTriggerConditionPreviousCycle;
    this.retardTriggerConditionPreviousCycle = retardTriggerCondition;
    const retardAudio =
      !this.thrLeverNotIdleRetardAudio &&
      !(retardInhibitOrToga || this.heightNotDecreasingConfirmNode.read()) &&
      (this.inhibitCalloutDueToRetard || retardTriggerRisingEdge); // TODO ROW/ROP
    this.retardAudio.set(retardAudio);

    // 5
    const fiveFeetThresholdActive =
      (A32NXRadioAutoCallOutFlags.Five & this.autoCallOutPins) != 0 &&
      this.fiveFeetTreshold &&
      !this.heightCallOutInhibition3;
    const fiveThresholdAndNoAudioInhibit =
      fiveFeetThresholdActive &&
      !this.autoCalloutInhibit &&
      !this.inhibitCalloutDueToRetard &&
      !this.fiveMtrigPreviousCycle;
    const fiveThresholdAndNoInhibitRisingEdge =
      fiveThresholdAndNoAudioInhibit && !this.fiveThresholdAndNoAudioInhibitPreviousCycle;
    this.fiveThresholdAndNoAudioInhibitPreviousCycle = fiveThresholdAndNoAudioInhibit;
    this.fiveAudio.set(fiveThresholdAndNoInhibitRisingEdge);
    this.fiveMtrigPreviousCycle = this.fiveMtrigNode.write(fiveThresholdAndNoInhibitRisingEdge, deltaTime);
    // TODO intermediate callouts
    this.anyActiveHeightThresholdBelow400Met =
      fourHundredFeetTresholdAndActive ||
      threeHundredFeetTresholdAndActive ||
      twoHundredFeetTresholdAndActive ||
      oneHundredFeetTresholdAndActive ||
      fiftyFeetThresholdActive ||
      fourtyFeetThresholdActive ||
      thirtyFeetThresholdActive ||
      twentyFeetThresholdActive ||
      tenFeetThresholdActive ||
      fiveFeetThresholdActive;
  }
}
