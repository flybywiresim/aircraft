import {
  NXLogicConfirmNode,
  NxHysterisNode,
  NXLogicPulseNode,
  NXLogicMemoryNode,
  NXLogicTriggeredMonostableNode,
  Arinc429WordData,
  Arinc429Register,
} from '@flybywiresim/fbw-sdk';
import { Subject } from '@microsoft/msfs-sdk';
import { A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS, A32NXRadioAutoCallOutFlags } from '@shared/AutoCallOuts';
import { PseudoFWC } from './PseudoFWC';

export class FwsRadioCallouts {
  /** Radio Altimeter callouts */

  private readonly noFlightPhaseInhibit: number[] = [];

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

  private fourHundredThresholdPreviousCycle = false;

  private fourHundredMtrigPreviousCycle = false;

  private readonly fourHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);

  public readonly fourHundredAudio = Subject.create(false);

  private threeHundredThresholdPreviousCycle = false;

  private threeHundredMtrigPreviousCycle = false;

  private readonly threeHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);

  public readonly threeHundredAudio = Subject.create(false);

  private twoHundredThresholdPreviousCycle = false;

  private twoHundredMtrigPreviousCycle = false;

  private readonly twoHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);

  public readonly twoHundredAudio = Subject.create(false);

  private oneHundredThresholdPreviousCycle = false;
  private oneHundredMtrigPreviousCycle = false;
  private readonly oneHundredMtrigNode = new NXLogicTriggeredMonostableNode(5);
  public readonly oneHundredAudio = Subject.create(false);

  private fiftyMtrigPreviousCycle = false;
  private readonly fiftyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private readonly fiftyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fiftyAudio = Subject.create(false);

  private readonly fortyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private fortyMtrigPreviousCycle = false;
  private readonly fortyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fortyAudio = Subject.create(false);

  private readonly thirtyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private thirtyMtrigPreviousCycle = false;
  private readonly thirtyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly thirtyAudio = Subject.create(false);

  private readonly twentyThresholdAndNoAudioInhibitPulseNode = new NXLogicPulseNode();
  private twentyMtrigPreviousCycle = false;
  private readonly twentyMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly twentyAudio = Subject.create(false);

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

  private fiveMtrigPreviousCycle = false;
  private readonly fiveAudioPulseNode = new NXLogicPulseNode();
  private readonly fiveMtrigNode = new NXLogicTriggeredMonostableNode(2);
  public readonly fiveAudio = Subject.create(false);

  private retardInhibit = false; // TODO

  private newRetardInhibit = false;

  constructor(private readonly fws: PseudoFWC) {}

  public update(
    deltaTime: number,
    height: number | null,
    flightPhase: number,
    tla1: number,
    tla2: number,
    atsDiscreteWord: Arinc429Register,
    fm1DiscreteWord4: Arinc429WordData,
    fm2DiscreteWord4: Arinc429WordData,
    stallWarning: boolean,
    speedWarning: boolean,
    onGround: boolean,
    engine1MasterOn: boolean,
    engine2MasterOn: boolean,
  ) {
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
    this.autoCalloutLogic(
      deltaTime,
      height ?? 0,
      flightPhase,
      tla1,
      tla2,
      atsDiscreteWord,
      fm1DiscreteWord4,
      fm2DiscreteWord4,
    );
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
    const raInvalidOrLowSpeedWarningOrFlex = height === null || stallWarning || speedWarning;
    this.autoCalloutInhibit = raInvalidOrLowSpeedWarningOrFlex || (onGround && engine1MasterOn && engine2MasterOn);
    const onGroundAndNotPhase8 = onGround && flightPhase !== 8;

    this.newRetardInhibit =
      raInvalidOrLowSpeedWarningOrFlex || (onGroundAndNotPhase8 && engine1MasterOn && engine2MasterOn);
  }

  private autoCalloutLogic(
    deltaTime: number,
    height: number,
    flightPhase: number,
    tla1: number,
    tla2: number,
    atsDiscreteWord: Arinc429Register,
    fm1DiscreteWord4: Arinc429WordData,
    fm2DiscreteWord4: Arinc429WordData,
  ): void {
    // 2500
    const twentyFiveHundredPin = (A32NXRadioAutoCallOutFlags.TwentyFiveHundred & this.autoCallOutPins) > 0;
    const twoThousandFiveHundredPin = (A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred & this.autoCallOutPins) > 0;
    const twentyFiveOrTwoThousandFiveHundredPin = twentyFiveHundredPin || twoThousandFiveHundredPin;
    const twoThousandFiveHundredFeetTreshold = this.twoThousandFiveHundredWithinRangeConfNode.write(
      twentyFiveOrTwoThousandFiveHundredPin && height < 2530 && height >= 2500,
      deltaTime,
    );
    const twoThousandFiveHundredHysteresis = twentyFiveOrTwoThousandFiveHundredPin
      ? this.twoThousandFiveHundredHystherisis.write(height)
      : false;

    const twoThousandFiveHundredActivePreviously = this.twoThousandFiveHundredActivePrev;
    const twoThousandFiveHundredMemory = this.twoThousandFiveHundredHasPlayedMemoryNode.write(
      twoThousandFiveHundredActivePreviously,
      this.twoThousandFiveHundredHystherisisPulseNode.write(twoThousandFiveHundredHysteresis, deltaTime),
    );

    const twoThousandFiveHundredActive =
      twoThousandFiveHundredFeetTreshold &&
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
      twoThousandFeetPin && height < 2030 && height >= 2000,
      deltaTime,
    );
    const twoThousandFeetHysteresis = twoThousandFeetPin ? this.twoThousandHystherisis.write(height) : false;
    const twoThousandFeetActivePreviously = this.twoThousandActivePrev;
    const twoThousandFeetMemory = this.twoThousandHasPlayedMemoryNode.write(
      twoThousandFeetActivePreviously,
      this.twoThousandHystherisisPulseNode.write(twoThousandFeetHysteresis, deltaTime),
    );
    const twoThousandAudio =
      twoThousandFeetTreshold && twoThousandFeetHysteresis && !twoThousandFeetMemory && !this.autoCalloutInhibit;
    this.twoThousandAudio.set(twoThousandAudio);
    this.twoThousandActivePrev = this.twoThousandAudioPulseNode.write(twoThousandAudio, deltaTime);

    // 1000
    const oneThousandFeetPin = (A32NXRadioAutoCallOutFlags.OneThousand & this.autoCallOutPins) > 0;
    const oneThousandFeetTreshold = this.oneThousandWithinRangeConfNode.write(
      oneThousandFeetPin && height < 1030 && height >= 1000,
      deltaTime,
    );
    const oneThousandFeetHysteresis = oneThousandFeetPin ? this.oneThousandHystherisis.write(height) : false;
    const oneThousandFeetActivePreviously = this.oneThousandActivePrev;
    const oneThousandFeetMemory = this.oneThousandHasPlayedMemoryNode.write(
      oneThousandFeetActivePreviously,
      this.oneThousandHystherisisPulseNode.write(oneThousandFeetHysteresis, deltaTime),
    );
    const oneThousandAudio =
      oneThousandFeetTreshold && oneThousandFeetHysteresis && !oneThousandFeetMemory && !this.autoCalloutInhibit;
    this.oneThousandAudio.set(oneThousandAudio);
    this.oneThousandActivePrev = this.oneThousandAudioPulseNode.write(oneThousandAudio, deltaTime);

    // 500
    const fiveHundredFeetThreshold = this.fiveHundredWithinRangeConfNode.write(
      height < 530 && height >= 500,
      deltaTime,
    );
    const fiveHundredSmartPin = (A32NXRadioAutoCallOutFlags.FiveHundredGlide & this.autoCallOutPins) > 0;
    const fiveHundredAudio =
      !this.fiveHundredMtrigPreviousCycle &&
      fiveHundredFeetThreshold &&
      !this.autoCalloutInhibit &&
      (fiveHundredSmartPin
        ? !this.fws.glideSlopeValid.get() ||
          this.fiveHundredSmartGlideDeviation.write(this.fws.glideSlopeDeviation.get() > 0.175, deltaTime)
        : (A32NXRadioAutoCallOutFlags.FiveHundred & this.autoCallOutPins) > 0);
    this.fiveHundredMtrigPreviousCycle = this.fiveHundredMtrigNode.write(fiveHundredAudio, deltaTime);
    if (fiveHundredAudio) {
      console.log('500ft callout triggered with values:');
      console.log(`Height: ${height}`);
      console.log(`Auto callout inhibit: ${this.autoCalloutInhibit}`);
      console.log(`Five hundred smart pin: ${fiveHundredSmartPin}`);
      console.log(`Glide slope valid: ${this.fws.glideSlopeValid.get()}`);
      console.log(`Glide deviation: ${this.fws.glideSlopeDeviation.get()}`);
    }
    this.fiveHundredAudio.set(fiveHundredAudio);

    // 400
    const fourHundredFeetTreshold =
      (A32NXRadioAutoCallOutFlags.FourHundred & this.autoCallOutPins) != 0 && height < 410 && height >= 400;

    const fourHundredAudio =
      fourHundredFeetTreshold &&
      !this.fourHundredThresholdPreviousCycle && // Could be pulse node
      !this.fourHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.fourHundredAudio.set(fourHundredAudio);
    this.fourHundredThresholdPreviousCycle = fourHundredFeetTreshold;
    this.fourHundredMtrigPreviousCycle = this.fourHundredMtrigNode.write(fourHundredAudio, deltaTime);

    // 300
    const threeHundredFeetTreshold =
      (A32NXRadioAutoCallOutFlags.ThreeHundred & this.autoCallOutPins) != 0 && height < 310 && height >= 300;
    const threeHundredAudio =
      threeHundredFeetTreshold &&
      !this.threeHundredThresholdPreviousCycle &&
      !this.threeHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.threeHundredAudio.set(threeHundredAudio);
    this.threeHundredThresholdPreviousCycle = threeHundredFeetTreshold;
    this.threeHundredMtrigPreviousCycle = this.threeHundredMtrigNode.write(threeHundredAudio, deltaTime);

    // 200
    const twoHundredFeetTreshold =
      (A32NXRadioAutoCallOutFlags.TwoHundred & this.autoCallOutPins) != 0 && height < 210 && height >= 200;
    const twoHundredAudio =
      twoHundredFeetTreshold &&
      !this.twoHundredThresholdPreviousCycle &&
      !this.twoHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.twoHundredAudio.set(twoHundredAudio);
    this.twoHundredThresholdPreviousCycle = twoHundredFeetTreshold;
    this.twoHundredMtrigPreviousCycle = this.twoHundredMtrigNode.write(twoHundredAudio, deltaTime);

    // 100
    const oneHundredFeetTreshold =
      (A32NXRadioAutoCallOutFlags.OneHundred & this.autoCallOutPins) != 0 && height < 110 && height >= 100;
    const oneHundredAudio =
      oneHundredFeetTreshold &&
      !this.oneHundredThresholdPreviousCycle &&
      !this.oneHundredMtrigPreviousCycle &&
      !this.autoCalloutInhibit;
    this.oneHundredAudio.set(oneHundredAudio);
    this.oneHundredThresholdPreviousCycle = oneHundredFeetTreshold;
    this.oneHundredMtrigPreviousCycle = this.oneHundredMtrigNode.write(oneHundredAudio, deltaTime);

    // 50
    const fiftyTresholdAndPinProgrammed =
      (A32NXRadioAutoCallOutFlags.Fifty & this.autoCallOutPins) != 0 && height < 53 && height >= 50;
    const fiftyAudio =
      !this.fortyAudio.get() &&
      this.fiftyThresholdAndNoAudioInhibitPulseNode.write(
        fiftyTresholdAndPinProgrammed && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.fiftyMtrigPreviousCycle;
    this.fiftyAudio.set(fiftyAudio);
    this.fiftyMtrigPreviousCycle = this.fiftyMtrigNode.write(fiftyAudio, deltaTime);
    // 40
    const fourtyThresholdAndPinProgrammed =
      (A32NXRadioAutoCallOutFlags.Forty & this.autoCallOutPins) != 0 && height < 42 && height >= 40;
    const fortyAudio =
      !this.thirtyAudio.get() &&
      this.fortyThresholdAndNoAudioInhibitPulseNode.write(
        fourtyThresholdAndPinProgrammed && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.fortyMtrigPreviousCycle;
    this.fortyAudio.set(fortyAudio);
    this.fortyMtrigPreviousCycle = this.fortyMtrigNode.write(fortyAudio, deltaTime);
    // 30
    const thirtyThresholdAndPinProgrammed =
      (A32NXRadioAutoCallOutFlags.Thirty & this.autoCallOutPins) != 0 && height < 32 && height >= 30;
    const thirtyAudio =
      !this.twentyAudio.get() &&
      this.thirtyThresholdAndNoAudioInhibitPulseNode.write(
        thirtyThresholdAndPinProgrammed && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.thirtyMtrigPreviousCycle;
    this.thirtyAudio.set(thirtyAudio);
    this.thirtyMtrigPreviousCycle = this.thirtyMtrigNode.write(thirtyAudio, deltaTime);
    // 20 no retard
    const twentyThreshold = height < 22 && height >= 20;
    const twentyThresholdAndPinProgrammed =
      (A32NXRadioAutoCallOutFlags.Twenty & this.autoCallOutPins) != 0 && twentyThreshold;
    const ap1Engaged = fm1DiscreteWord4.bitValue(12);
    const fm1LandActive = fm1DiscreteWord4.bitValue(13);
    const ap2Engaged = fm2DiscreteWord4.bitValue(12);
    const fm2LandActive = fm2DiscreteWord4.bitValue(13);
    const athrActive = atsDiscreteWord.bitValue(13);

    const oneApActiveAndinLand = (ap1Engaged && fm1LandActive) || (ap2Engaged && fm2LandActive);

    const twentyAudio =
      this.twentyThresholdAndNoAudioInhibitPulseNode.write(
        twentyThresholdAndPinProgrammed && !this.autoCalloutInhibit,
        deltaTime,
      ) &&
      !this.tenAudio.get() &&
      oneApActiveAndinLand &&
      athrActive &&
      !this.twentyMtrigPreviousCycle;
    this.twentyAudio.set(twentyAudio);
    this.twentyMtrigPreviousCycle = this.twentyMtrigNode.write(twentyAudio, deltaTime);

    // TLA logic for retard
    const tlaIdle = false;

    // 20 retard
    const goAround = tla1 > 43.3 || tla2 > 43.3;
    const retardInhibitOrGoAround = this.retardInhibit || goAround;
    const noAutoland = !oneApActiveAndinLand;
    const noAutolandAndAthr = noAutoland && athrActive;
    const noAutolandAndAthrOrNoAthr = noAutolandAndAthr || !athrActive;
    const twentyRetard =
      (!goAround || !this.autoCalloutInhibit) &&
      twentyThresholdAndPinProgrammed &&
      noAutolandAndAthrOrNoAthr &&
      !this.twentyRetardActiveMtrigPreviousCycle;
    const playRetardAudio = !this.twentyRetardActivePreviousCycle && twentyRetard;
    this.twentyRetardAudio.set(playRetardAudio);
    this.twentyRetardActivePreviousCycle = playRetardAudio;
    this.twentyRetardActiveMtrigPreviousCycle = this.twentyRetardActiveMtrigNode.write(playRetardAudio, deltaTime);
    // 10 no retard
    const tenThreshold = height < 12 && height >= 10;
    const tenThresholdAndPinProgrammed = (A32NXRadioAutoCallOutFlags.Ten & this.autoCallOutPins) != 0 && tenThreshold;
    this.tenAudio.set(
      this.tenThresholdAndNoAudioInhibitPulseNode.write(
        tenThresholdAndPinProgrammed && !this.autoCalloutInhibit,
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
    // 5
    const fiveThresholdAndPinProgrammed =
      (A32NXRadioAutoCallOutFlags.Five & this.autoCallOutPins) != 0 && height < 6 && height >= 5;
    const fivePulse = this.fiveAudioPulseNode.write(
      fiveThresholdAndPinProgrammed && !this.autoCalloutInhibit && !this.fiveMtrigPreviousCycle && !this.retardInhibit,
      deltaTime,
    );
    this.fiveMtrigPreviousCycle = this.fiveMtrigNode.write(fivePulse, deltaTime);
    this.fiveAudioPulseNode.write(fivePulse, deltaTime);
    this.fiveAudio.set(fivePulse);
  }
}
