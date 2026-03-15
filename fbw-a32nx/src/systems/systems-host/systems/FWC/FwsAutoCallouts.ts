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
  NxSlopeNode,
  RegisteredSimVar,
} from '@flybywiresim/fbw-sdk';
import { SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS, A32NXRadioAutoCallOutFlags } from '@shared/AutoCallOuts';
import { PseudoFWC } from './PseudoFWC';

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
  private fiftyMtrigPreviousCycle = false;
  private readonly fiftyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private readonly fiftyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fiftyAudio = Subject.create(false);

  private fortyFeetTreshold = false;
  private readonly fortyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private fortyMtrigPreviousCycle = false;
  private readonly fortyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fortyAudio = Subject.create(false);

  private thirtyFeetTreshold = false;
  private readonly thirtyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private thirtyMtrigPreviousCycle = false;
  private readonly thirtyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly thirtyAudio = Subject.create(false);

  private twentyFeetTreshold = false;
  private readonly twentyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
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

  private readonly tenThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private tenMtrigPreviousCycle = false;
  private readonly tenMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly tenAudio = Subject.create(false);

  private heightLessThan10Feet = false;
  private heightLessThan20Feet = false;
  private readonly retardPulseNode = new NXLogicPulseNode();
  private readonly altInferiorTo10FeetConfNode = new NXLogicConfirmNode(0.1);
  private readonly altInferiorTo20FeetConfNode = new NXLogicConfirmNode(0.1);
  public readonly retardAudio = Subject.create(false);

  private fiveFeetTreshold = false;
  private fiveMtrigPreviousCycle = false;
  private readonly fiveAudioPulseNode = new NXLogicPulseNode();
  private readonly fiveMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fiveAudio = Subject.create(false);

  private retardInhibit = false;

  private newRetardInhibit = false;

  private readonly radioHeightSlopeNode = new NxSlopeNode();

  private readonly radioHeightNotDecreasingConfirmNode = new NXLogicConfirmNode(0.3, false);
  private radioHeightIncreasing = false;
  private heightLessThan3Feet = false;

  private heightAbove410Feet = false;
  private heightAbove50Feet = false;
  private intermediateDetectionThresholds = false;
  private intermediateDetectionActiveThresholds = false;

  private radioHeightCallOutInhibition1 = false;
  private radioHeightCallOutInhibition2 = false;
  private radioHeightCallOutInhibition3 = false;
  private gpwsInhibition = false;
  private tcasAural = false;

  private autoCalloutMdaInhibit = false;
  private dmcDiscreteWord270: Arinc429Register = Arinc429Register.empty();
  private readonly dmcLDiscreteWord270 = RegisteredSimVar.create(
    'L:A32NX_DMC_DISCRETE_WORD_270_LEFT',
    SimVarValueType.Enum,
  );
  private readonly dmcRDiscreteWord270 = RegisteredSimVar.create(
    'L:A32NX_DMC_DISCRETE_WORD_270_RIGHT',
    SimVarValueType.Enum,
  );
  private readonly hundredAboveMdaMtrig = new NXLogicTriggeredMonostableNode(3);
  private readonly hundredAboveMdaMemoryNode = new NXLogicMemoryNode(true);

  private readonly HundredAboveDhConfNode = new NXLogicConfirmNode(0.1);
  private readonly hundredAboveDhMtrig = new NXLogicTriggeredMonostableNode(3);
  private readonly hundredAboveDhMemoryNode = new NXLogicMemoryNode(true);

  public readonly hundredAbove = Subject.create(false);
  private readonly fmDh = Arinc429Register.empty();
  private readonly fm1DhRegisteredSimVar = RegisteredSimVar.create('L:A32NX_FM1_DECISION_HEIGHT', SimVarValueType.Enum);
  private readonly fm2DhRegisteredSimVar = RegisteredSimVar.create('L:A32NX_FM2_DECISION_HEIGHT', SimVarValueType.Enum);

  private autoCalloutDhInbit = false;
  private dhGenerated = false;

  private readonly minimumMdaMtrigNode = new NXLogicTriggeredMonostableNode(3);
  private readonly minimumMdaMemoryNode = new NXLogicMemoryNode(true);
  private readonly dhMinimumConfNode = new NXLogicConfirmNode(0.1);
  private readonly dhMinimumMtrigNode = new NXLogicTriggeredMonostableNode(3);
  private readonly minimumDhMemoryNode = new NXLogicMemoryNode(true);
  public readonly minimum = Subject.create(false);

  constructor(private readonly fws: PseudoFWC) {}

  public update(deltaTime: number) {
    const flightPhase = this.fws.fwcFlightPhase.get();
    const height = this.fws.radioHeight1.isInvalid()
      ? this.fws.radioHeight2.valueOr(null)
      : this.fws.radioHeight1.value;
    const stallWarning = this.fws.stallWarning.get();
    const speedWarning = false;
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
    this.dmcDiscreteWord270.set(this.dmcLDiscreteWord270.get());
    if (this.dmcDiscreteWord270.isInvalid()) {
      this.dmcDiscreteWord270.set(this.dmcRDiscreteWord270.get());
    }
    this.fmDh.set(this.fm1DhRegisteredSimVar.get());
    if (this.fmDh.isInvalid()) {
      this.fmDh.set(this.fm2DhRegisteredSimVar.get());
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
    const hundredAboveDmc = this.dmcDiscreteWord270.bitValueOr(20, false);
    const hundredAboveDmcMtrig = this.hundredAboveMdaMtrig.write(hundredAboveDmc, deltaTime);
    const hundredAboveMdaMemory = this.hundredAboveMdaMemoryNode.write(
      this.fws.hundredAboveGenerated,
      !hundredAboveDmcMtrig,
    );
    const hundredAboveMda = !this.autoCalloutMdaInhibit && !hundredAboveMdaMemory && hundredAboveDmcMtrig;
    // DH
    const dhValue = this.fmDh.valueOr(0);
    const dhLessThan90Feet = dhValue < 90;
    const dhAndRaFirstComparison = height !== null && height < 105 + dhValue;
    const dhAndRaSecondComparison = height !== null && height < 115 + dhValue;
    const dhHundredAbovePreRequisite =
      (dhLessThan90Feet && dhAndRaFirstComparison) || (!dhLessThan90Feet && dhAndRaSecondComparison);
    const dhHundredAboveDhConf = this.HundredAboveDhConfNode.write(dhHundredAbovePreRequisite, deltaTime);
    const hundredAboveDhMtrig = this.hundredAboveDhMtrig.write(dhHundredAboveDhConf, deltaTime);
    const hundredAboveDhMemory = this.hundredAboveDhMemoryNode.write(
      this.fws.hundredAboveGenerated,
      !hundredAboveDhMtrig,
    );
    const hundredAboveDh = !hundredAboveDhMemory && hundredAboveDhMtrig && !this.autoCalloutDhInbit;
    const hundredAbove = hundredAboveMda || hundredAboveDh;
    this.hundredAbove.set(hundredAbove);
    /// Minimums
    // MDA
    const minimumDmc = this.dmcDiscreteWord270.bitValueOr(21, false);
    const minimumDmcMtrig = this.minimumMdaMtrigNode.write(minimumDmc, deltaTime);
    const minimumMdaMemory = this.minimumMdaMemoryNode.write(this.fws.minimumGenerated, !minimumDmcMtrig);
    const minimumMda = !this.autoCalloutMdaInhibit && !minimumMdaMemory && minimumDmcMtrig;

    // DH
    const dhAndRaMinimumFirstComparison = height !== null && height < 5 + dhValue;
    const dhAndRaMinimumSecondComparison = height !== null && height < 15 + dhValue;
    const dhMinimumPreRequisite =
      (dhLessThan90Feet && dhAndRaMinimumFirstComparison) || (!dhLessThan90Feet && dhAndRaMinimumSecondComparison);
    const dhMinimumConf = this.dhMinimumConfNode.write(dhMinimumPreRequisite, deltaTime);
    const dhMinimumMtrig = this.dhMinimumMtrigNode.write(dhMinimumConf, deltaTime);
    const minimumDhMemory = this.minimumDhMemoryNode.write(this.fws.minimumGenerated, !dhMinimumMtrig);
    const minimumDh = !minimumDhMemory && dhMinimumMtrig && !this.autoCalloutDhInbit;

    const minimum = minimumMda || minimumDh;
    this.dhGenerated = this.fws.minimumGenerated || this.fws.hundredAboveGenerated || hundredAbove || minimum;
    this.minimum.set(minimum);
  }

  private computeThresholds(height: number | null, deltaTime: number) {
    this.radioHeightIncreasing = this.radioHeightSlopeNode.write(height ?? 0, deltaTime) > 0;
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
    this.heightLessThan3Feet = height !== null && height < 3;
    this.heightAbove410Feet = height !== null && height >= 410;
    this.heightAbove50Feet = height !== null && height > 50;
    this.intermediateDetectionThresholds =
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
    const radioHeightNotDecreasing = this.radioHeightNotDecreasingConfirmNode.write(
      this.radioHeightIncreasing,
      deltaTime,
    );
    const takeoffAndGroundDetection = this.heightLessThan3Feet || this.radioHeightIncreasing;
    this.radioHeightCallOutInhibition1 = takeoffAndGroundDetection || this.dhGenerated; // TODO check for GPWS
    this.radioHeightCallOutInhibition2 = takeoffAndGroundDetection || this.dhGenerated;
    this.radioHeightCallOutInhibition3 = this.heightLessThan3Feet || radioHeightNotDecreasing || this.dhGenerated;
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
    const raInvalidOrLowSpeedWarningOrFlex = height === null || stallWarning || speedWarning; // TODO some missing
    this.autoCalloutInhibit = raInvalidOrLowSpeedWarningOrFlex || (onGround && engine1MasterOn && engine2MasterOn);
    const onGroundAndNotPhase8 = onGround && flightPhase !== 8;
    this.newRetardInhibit =
      raInvalidOrLowSpeedWarningOrFlex || (onGroundAndNotPhase8 && engine1MasterOn && engine2MasterOn);

    this.autoCalloutMdaInhibit = speedWarning || stallWarning || this.gpwsInhibition || this.tcasAural;

    this.autoCalloutDhInbit = height === null || this.autoCalloutInhibit || this.fmDh.valueOr(0) <= 3;
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
    const gpwsOrTcasInhibit = this.gpwsInhibition || this.tcasAural;
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
    const inhibit1OrTcas = this.radioHeightCallOutInhibition1 || this.tcasAural;
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
      !this.radioHeightCallOutInhibition1;

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
      !this.radioHeightCallOutInhibition1;
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
      !this.radioHeightCallOutInhibition1;
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
      !this.radioHeightCallOutInhibition1;
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
      !this.radioHeightCallOutInhibition1;
    const fiftyAudio =
      !this.fortyAudio.get() &&
      this.fiftyThresholdAndNoAudioInhibitPulseNode.write(
        fiftyFeetThresholdActive && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.fiftyMtrigPreviousCycle;
    this.fiftyAudio.set(fiftyAudio);
    this.fiftyMtrigPreviousCycle = this.fiftyMtrigNode.write(fiftyAudio, deltaTime);
    // 40
    const fourtyFeetThresholdActive =
      (A32NXRadioAutoCallOutFlags.Forty & this.autoCallOutPins) != 0 &&
      this.fortyFeetTreshold &&
      !this.radioHeightCallOutInhibition2;
    const fortyAudio =
      !this.thirtyAudio.get() &&
      this.fortyThresholdAndNoAudioInhibitPulseNode.write(
        fourtyFeetThresholdActive && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.fortyMtrigPreviousCycle;
    this.fortyAudio.set(fortyAudio);
    this.fortyMtrigPreviousCycle = this.fortyMtrigNode.write(fortyAudio, deltaTime);
    // 30
    const thirtyFeetThresholdActive =
      (A32NXRadioAutoCallOutFlags.Thirty & this.autoCallOutPins) != 0 &&
      this.thirtyFeetTreshold &&
      !this.radioHeightCallOutInhibition2;
    const thirtyAudio =
      !this.twentyAudio.get() &&
      this.thirtyThresholdAndNoAudioInhibitPulseNode.write(
        thirtyFeetThresholdActive && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.thirtyMtrigPreviousCycle;
    this.thirtyAudio.set(thirtyAudio);
    this.thirtyMtrigPreviousCycle = this.thirtyMtrigNode.write(thirtyAudio, deltaTime);
    // 20 no retard
    const twentyThreshold = this.twentyFeetTreshold;
    const twentyPinProgrammed = (A32NXRadioAutoCallOutFlags.Twenty & this.autoCallOutPins) != 0;
    const twentyFeetThresholdActive = twentyPinProgrammed && twentyThreshold && !this.radioHeightCallOutInhibition2;
    const ap1Engaged = fm1DiscreteWord4.bitValue(12);
    const fm1LandActive = fm1DiscreteWord4.bitValue(13);
    const ap2Engaged = fm2DiscreteWord4.bitValue(12);
    const fm2LandActive = fm2DiscreteWord4.bitValue(13);
    const athrActive = atsDiscreteWord.bitValue(13);
    const oneApActiveAndinLand = (ap1Engaged && fm1LandActive) || (ap2Engaged && fm2LandActive);
    const oneApActiveAndAthr = oneApActiveAndinLand && athrActive;
    const twentyAudio =
      this.twentyThresholdAndNoAudioInhibitPulseNode.write(
        twentyFeetThresholdActive && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.tenAudio.get() &&
      oneApActiveAndAthr &&
      !this.twentyMtrigPreviousCycle;
    this.twentyAudio.set(twentyAudio);
    this.twentyMtrigPreviousCycle = this.twentyMtrigNode.write(twentyAudio, deltaTime);

    // 20 retard
    const goAround = tla1 > 43.3 || tla2 > 43.3; // TODO some missing, will suffice for now.
    const retardInhibitOrToga = this.newRetardInhibit || goAround;
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
    const tenFeetThresholdActive = tenPinProgrammed && tenThreshold && !this.radioHeightCallOutInhibition3;
    this.tenAudio.set(
      this.tenThresholdAndNoAudioInhibitPulseNode.write(
        tenFeetThresholdActive && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
        !this.fiveAudio.get() &&
        !this.retardInhibit &&
        noAutolandAndAthrOrNoAthr &&
        !this.tenMtrigPreviousCycle,
    );
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

    // TLA logic for retard
    const eng1TlaIdleRetard = tla1 < 2.6 && tla1 >= -4.3;
    const eng1RunningAndTlaIdleAndEng2NotRunning = eng1TlaIdleRetard && !engine1NotRunning && engine2NotRunning;

    const eng2TlaIdleRetard = tla2 < 2.6 && tla2 >= -4.3;
    const eng2RunningAndTlaIdleAndEng1NotRunning = eng2TlaIdleRetard && !engine2NotRunning && engine1NotRunning;

    const bothEnginesRunningAndIdle =
      eng1TlaIdleRetard && eng2TlaIdleRetard && !engine1NotRunning && !engine2NotRunning;

    const tlaNotInIdle =
      eng1RunningAndTlaIdleAndEng2NotRunning ||
      eng2RunningAndTlaIdleAndEng1NotRunning ||
      bothEnginesRunningAndIdle ||
      tla1Reverse ||
      tla2Reverse; // TODO toga inhibition

    const raBelow10Feet = this.altInferiorTo10FeetConfNode.write(this.heightLessThan10Feet, deltaTime);
    const raBelow20Feet = this.altInferiorTo20FeetConfNode.write(this.heightLessThan20Feet, deltaTime);
    const flightPhase67Or8 = flightPhase === 6 || flightPhase === 7 || flightPhase === 8;

    this.retardInhibit =
      !tlaNotInIdle &&
      flightPhase67Or8 &&
      ((raBelow10Feet && oneApActiveAndAthr) || (raBelow20Feet && noAutolandAndAthrOrNoAthr));

    const twentyNotPinProgrammedAndNoAutoland = !twentyPinProgrammed && twentyThreshold && noAutolandAndAthrOrNoAthr;
    const tenNotPinProgrammedAndAutoland = !tenPinProgrammed && tenThreshold && oneApActiveAndAthr;

    const retardPulse = this.retardPulseNode.write(
      twentyNotPinProgrammedAndNoAutoland || tenNotPinProgrammedAndAutoland,
      deltaTime,
    );
    const retardAudio =
      !(retardInhibitOrToga || this.radioHeightNotDecreasingConfirmNode.read()) && (this.retardInhibit || retardPulse); // TODO ROW/ROP, THR LVR NOT IDLE
    this.retardAudio.set(retardAudio);

    // 5
    const fiveFeetThresholdActive =
      (A32NXRadioAutoCallOutFlags.Five & this.autoCallOutPins) != 0 &&
      this.fiveFeetTreshold &&
      !this.radioHeightCallOutInhibition3;
    const fivePulse = this.fiveAudioPulseNode.write(
      fiveFeetThresholdActive && !this.autoCalloutInhibit && !this.fiveMtrigPreviousCycle && !this.retardInhibit,
      deltaTime,
    );
    this.fiveMtrigPreviousCycle = this.fiveMtrigNode.write(fivePulse, deltaTime);
    this.fiveAudioPulseNode.write(fivePulse, deltaTime);
    this.fiveAudio.set(fivePulse);
    // TODO intermediate callouts
    this.intermediateDetectionActiveThresholds =
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
