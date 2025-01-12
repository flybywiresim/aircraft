// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Subject,
  Subscribable,
  MappedSubject,
  DebounceTimer,
  ConsumerValue,
  EventBus,
  ConsumerSubject,
  SimVarValueType,
  SubscribableMapFunctions,
  StallWarningEvents,
  KeyEventManager,
  GameStateProvider,
  Wait,
  KeyEvents,
} from '@microsoft/msfs-sdk';

import {
  AirDataSwitchingKnob,
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  Arinc429RegisterSubject,
  Arinc429SignStatusMatrix,
  Arinc429Word,
  Arinc429WordData,
  NXDataStore,
  NXLogicClockNode,
  NXLogicConfirmNode,
  NXLogicMemoryNode,
  NXLogicPulseNode,
  NXLogicTriggeredMonostableNode,
  UpdateThrottler,
} from '@flybywiresim/fbw-sdk';
import { VerticalMode } from '@shared/autopilot';
import { FuelSystemEvents } from '../../../instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';
import { A32NXAdrBusEvents } from '../../../shared/src/publishers/A32NXAdrBusPublisher';
import { A32NXDisplayManagementEvents } from '../../../shared/src/publishers/A32NXDisplayManagementPublisher';
import { A32NXElectricalSystemEvents } from '../../../shared/src/publishers/A32NXElectricalSystemPublisher';
import { A32NXFcuBusEvents } from '../../../shared/src/publishers/A32NXFcuBusPublisher';
import { FwsSoundManager } from 'systems-host/systems/FWC/FwsSoundManager';
import { PseudoFwcSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/PseudoFwcPublisher';

export function xor(a: boolean, b: boolean): boolean {
  return !!((a ? 1 : 0) ^ (b ? 1 : 0));
}

/**
 * Counts the number of truthy values in an array of booleans
 * @param args
 * @returns
 */
function countTrue(...args: boolean[]): number {
  return args.reduce((accu, b) => (b ? accu + 1 : accu), 0);
}

interface EWDItem {
  flightPhaseInhib: number[];
  /** warning is active */
  simVarIsActive: Subscribable<boolean>;
  /** aural warning, defaults to simVarIsActive and SC for level 2 or CRC for level 3 if not provided */
  auralWarning?: Subscribable<FwcAuralWarning>;
  whichCodeToReturn: () => any[];
  codesToReturn: string[];
  memoInhibit: () => boolean;
  failure: number;
  sysPage: number;
  side: string;
  /** Cancel flag for level 3 warning audio (only emergency cancel can cancel if false), defaults to true. */
  cancel?: boolean;
}

interface EWDMessageDict {
  [key: string]: EWDItem;
}

enum FwcAuralWarning {
  None,
  SingleChime,
  Crc,
  CavalryCharge,
}

export class PseudoFWC {
  private readonly sub = this.bus.getSubscriber<
    A32NXAdrBusEvents &
      A32NXDisplayManagementEvents &
      A32NXElectricalSystemEvents &
      A32NXFcuBusEvents &
      KeyEvents &
      PseudoFwcSimvars &
      StallWarningEvents
  >();

  private readonly fwsUpdateThrottler = new UpdateThrottler(125); // has to be > 100 due to pulse nodes

  private keyEventManager: KeyEventManager;

  private readonly startupCompleted = Subject.create(false);

  public readonly soundManager = new FwsSoundManager(this.bus, this.startupCompleted);

  /** Time to inhibit master warnings and cautions during startup in ms */
  private static readonly FWC_STARTUP_TIME = 5000;

  /** Time to inhibit SCs after one is trigger in ms */
  private static readonly AURAL_SC_INHIBIT_TIME = 2000;

  private static readonly EWD_MESSAGE_LINES = 7;

  private static readonly ewdMessageSimVarsLeft = Array.from(
    { length: PseudoFWC.EWD_MESSAGE_LINES },
    (_, i) => `L:A32NX_EWD_LOWER_LEFT_LINE_${i + 1}`,
  );

  private readonly ewdMessageLinesLeft = Array.from({ length: PseudoFWC.EWD_MESSAGE_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly ewdMessageSimVarsRight = Array.from(
    { length: PseudoFWC.EWD_MESSAGE_LINES },
    (_, i) => `L:A32NX_EWD_LOWER_RIGHT_LINE_${i + 1}`,
  );

  private readonly ewdMessageLinesRight = Array.from({ length: PseudoFWC.EWD_MESSAGE_LINES }, (_, _i) =>
    Subject.create(''),
  );

  // Input buffering
  public readonly toConfigInputBuffer = new NXLogicMemoryNode(false);
  public readonly clearButtonInputBuffer = new NXLogicMemoryNode(false);
  public readonly recallButtonInputBuffer = new NXLogicMemoryNode(false);
  public readonly aThrDiscInputBuffer = new NXLogicMemoryNode(false);
  public readonly apDiscInputBuffer = new NXLogicMemoryNode(false);

  /* PSEUDO FWC VARIABLES */
  private readonly startupTimer = new DebounceTimer();

  private readonly allCurrentFailures: string[] = [];

  private readonly failuresLeft: string[] = [];

  private readonly failuresRight: string[] = [];

  private recallFailures: string[] = [];

  private requestMasterCautionFromFaults = false;
  private requestMasterCautionFromABrkOff = false;
  private requestMasterCautionFromAThrOff = false;

  private requestSingleChimeFromAThrOff = false;

  private requestMasterWarningFromFaults = false;
  private requestMasterWarningFromApOff = false;

  private auralCrcKeys: string[] = [];

  private auralScKeys: string[] = [];

  private readonly auralCrcActive = Subject.create(false);

  private auralSingleChimePending = false;

  private readonly auralSingleChimeInhibitTimer = new DebounceTimer();

  private readonly masterWarning = Subject.create(false);

  private readonly masterCaution = Subject.create(false);

  private readonly fireActive = Subject.create(false);

  private nonCancellableWarningCount = 0;

  private readonly stallWarning = Subject.create(false);

  private readonly masterWarningOutput = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.masterWarning,
    this.fireActive,
    this.stallWarning,
  );

  private readonly auralCrcOutput = MappedSubject.create(
    ([auralCrc, fireActive]) => auralCrc || fireActive,
    this.auralCrcActive,
    this.fireActive,
  );

  private readonly fwcOut124 = Arinc429RegisterSubject.createEmpty();

  private readonly fwcOut126 = Arinc429RegisterSubject.createEmpty();

  /* 21 - AIR CONDITIONING AND PRESSURIZATION */

  private readonly acsc1DiscreteWord1 = Arinc429Register.empty();

  private readonly acsc1DiscreteWord2 = Arinc429Register.empty();

  private readonly acsc2DiscreteWord1 = Arinc429Register.empty();

  private readonly acsc2DiscreteWord2 = Arinc429Register.empty();

  private readonly cpc1DiscreteWord = Arinc429Register.empty();

  private readonly cpc2DiscreteWord = Arinc429Register.empty();

  private readonly apuBleedValveOpen = Subject.create(false);

  private readonly cabAltSetReset1 = new NXLogicMemoryNode();

  private readonly cabAltSetReset2 = new NXLogicMemoryNode();

  private readonly cabAltSetResetState1 = Subject.create(false);

  private readonly cabAltSetResetState2 = Subject.create(false);

  private readonly cabFanHasFault1 = Subject.create(false);

  private readonly cabFanHasFault2 = Subject.create(false);

  private readonly excessPressure = Subject.create(false);

  private readonly enginesOffAndOnGroundSignal = new NXLogicConfirmNode(7);

  private readonly excessResidualPrConfirm = new NXLogicConfirmNode(5);

  private readonly excessResidualPr = Subject.create(false);

  private readonly lowDiffPress = Subject.create(false);

  private readonly acsc1Lane1Fault = Subject.create(false);

  private readonly acsc1Lane2Fault = Subject.create(false);

  private readonly acsc2Lane1Fault = Subject.create(false);

  private readonly acsc2Lane2Fault = Subject.create(false);

  private readonly acsc1Fault = Subject.create(false);

  private readonly acsc2Fault = Subject.create(false);

  private readonly pack1And2Fault = Subject.create(false);

  private readonly ramAirOn = Subject.create(false);

  private readonly hotAirDisagrees = Subject.create(false);

  private readonly hotAirOpen = Subject.create(false);

  private readonly hotAirPbOn = Subject.create(false);

  private readonly trimAirFault = Subject.create(false);

  private readonly ckptTrimFault = Subject.create(false);

  private readonly fwdTrimFault = Subject.create(false);

  private readonly aftTrimFault = Subject.create(false);

  private readonly trimAirHighPressure = Subject.create(false);

  private readonly ckptDuctOvht = Subject.create(false);

  private readonly fwdDuctOvht = Subject.create(false);

  private readonly aftDuctOvht = Subject.create(false);

  private readonly anyDuctOvht = Subject.create(false);

  private readonly lavGalleyFanFault = Subject.create(false);

  private readonly pack1On = Subject.create(false);

  private readonly pack2On = Subject.create(false);

  private readonly packOffBleedAvailable1 = new NXLogicConfirmNode(5, false);

  private readonly packOffBleedAvailable2 = new NXLogicConfirmNode(5, false);

  private readonly packOffNotFailed1 = new NXLogicConfirmNode(60);

  private readonly packOffNotFailed1Status = Subject.create(false);

  private readonly packOffNotFailed2 = new NXLogicConfirmNode(60);

  private readonly packOffNotFailed2Status = Subject.create(false);

  private readonly cpc1Fault = Subject.create(false);

  private readonly cpc2Fault = Subject.create(false);

  private readonly bothCpcFault = new NXLogicConfirmNode(3, false);

  private readonly bothCpcFaultOutput = Subject.create(false);

  private readonly pressurizationAuto = Subject.create(false);

  private readonly outflowValveOpenAmount = Subject.create(0);

  private readonly outflowValveNotOpen = new NXLogicConfirmNode(70);

  private readonly outflowValveResetCondition = new NXLogicConfirmNode(30);

  private readonly outflowValveNotOpenOutput = Subject.create(false);

  private readonly outflowValveNotOpenSetReset = new NXLogicMemoryNode();

  private readonly safetyValveNotClosedAir = new NXLogicConfirmNode(60);

  private readonly safetyValveNotClosedOutput = Subject.create(false);

  private readonly cabinDeltaPressure = Subject.create(0);

  /* 22 - AUTOFLIGHT */

  private readonly toConfigAndNoToSpeedsPulseNode = new NXLogicPulseNode();

  /** TO speeds not inserted RS */
  private toSpeedsNotInserted = false;

  private toSpeedsNotInsertedWarning = Subject.create(false);

  /** If multiple AP discs are triggered between FWS cycles, memorize the amount */
  public autoPilotInstinctiveDiscCountSinceLastFwsCycle = 0;

  public readonly autoPilotDisengagedInstantPulse = new NXLogicPulseNode(false);

  /** 1.8s according to references, but was raised to 1.9s to allow for triple click to finish */
  public readonly autoPilotInstinctiveDiscPressedInLast1p5Sec = new NXLogicTriggeredMonostableNode(1.5, true);

  /** 1.8s according to references, but was raised to 1.9s to allow for triple click to finish */
  public readonly autoPilotInstinctiveDiscPressedTwiceInLast1p5Sec = new NXLogicTriggeredMonostableNode(1.5, true);

  public readonly autoPilotInstinctiveDiscPressedPulse = new NXLogicPulseNode(true);

  /** Stay in first warning stage for 1.8s. Raised to 1.9s to allow for triple click to finish */
  public readonly autoPilotOffVoluntaryEndAfter1p5s = new NXLogicTriggeredMonostableNode(1.5, true);

  public readonly autoPilotOffVoluntaryFirstCavalryChargeActive = new NXLogicTriggeredMonostableNode(0.8, true);

  public readonly autoPilotOffVoluntaryFirstCavalryChargeActivePulse = new NXLogicPulseNode(false);

  public readonly autoPilotOffVoluntaryDiscPulse = new NXLogicPulseNode(true);

  public readonly autoPilotOffVoluntaryMemory = new NXLogicMemoryNode(true);

  public readonly autoPilotOffInvoluntaryMemory = new NXLogicMemoryNode(false);

  public readonly autoPilotOffAlertShown = Subject.create(false);

  public readonly autoPilotOffInvoluntary = Subject.create(false);

  public readonly autoPilotOffAlertShownMemory = new NXLogicMemoryNode(false);

  public readonly autoPilotOffUnacknowledged = new NXLogicMemoryNode(false);

  public readonly autoPilotOffShowMemo = Subject.create(false);

  public readonly fmgc1DiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmgc1DiscreteWord3'));

  public readonly fmgc2DiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmgc2DiscreteWord3'));

  public readonly fmgc1DiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmgc1DiscreteWord4'));

  public readonly fmgc2DiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmgc2DiscreteWord4'));

  public readonly fmgcApproachCapability = Subject.create(0);

  public readonly approachCapabilityDowngradeDebounce = new NXLogicTriggeredMonostableNode(0.5, true);

  public readonly approachCapabilityDowngradeSuppress = new NXLogicTriggeredMonostableNode(3, true);

  public readonly approachCapabilityDowngradeDebouncePulse = new NXLogicPulseNode(false);

  public readonly autoThrustDisengagedInstantPulse = new NXLogicPulseNode(false);

  public readonly autoThrustInstinctiveDiscPressed = new NXLogicTriggeredMonostableNode(1.5, true); // Save event for 1.5 sec

  public readonly autoThrustOffVoluntaryMemoNode = new NXLogicTriggeredMonostableNode(9, false); // Emit memo for max. 9 sec

  public readonly autoThrustOffVoluntaryCautionNode = new NXLogicTriggeredMonostableNode(3, false); // Emit master caution for max. 3 sec

  public readonly autoThrustOffInvoluntaryNode = new NXLogicMemoryNode(false);

  public autoThrustInhibitCaution = false; // Inhibit for 10 sec

  public readonly autoThrustOffVoluntary = Subject.create(false);

  public readonly autoThrustOffInvoluntary = Subject.create(false);

  public autoThrustOffVoluntaryMemoInhibited = false;

  /** TO CONF pressed in phase 2 or 3 SR */
  private toConfigCheckedInPhase2Or3 = false;

  private toSpeedsTooLowWarning = Subject.create(false);

  private toV2VRV2DisagreeWarning = Subject.create(false);

  private readonly fcu1DiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_fcu_discrete_word_2'));
  private readonly fcu2DiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_fcu_discrete_word_2'));

  private readonly fcu12Fault = Subject.create(false);
  private readonly fcu1Fault = Subject.create(false);
  private readonly fcu2Fault = Subject.create(false);

  /* 24 - ELECTRICAL */

  private readonly ac1BusPowered = ConsumerSubject.create(this.sub.on('a32nx_elec_ac_1_bus_is_powered'), false);

  private readonly ac2BusPowered = ConsumerSubject.create(this.sub.on('a32nx_elec_ac_2_bus_is_powered'), false);

  private readonly acESSBusPowered = ConsumerSubject.create(this.sub.on('a32nx_elec_ac_ess_bus_is_powered'), false);

  private readonly dcESSBusPowered = ConsumerSubject.create(this.sub.on('a32nx_elec_dc_ess_bus_is_powered'), false);

  private readonly dc2BusPowered = ConsumerSubject.create(this.sub.on('a32nx_elec_dc_2_bus_is_powered'), false);

  /* 27 - FLIGHT CONTROLS */

  private readonly altn1LawConfirmNode = new NXLogicConfirmNode(0.3, true);

  private readonly altn1LawConfirmNodeOutput = Subject.create(false);

  private readonly altn2LawConfirmNode = new NXLogicConfirmNode(0.3, true);

  private readonly altn2LawConfirmNodeOutput = Subject.create(false);

  private readonly directLawCondition = Subject.create(false);

  private readonly elac1HydConfirmNode = new NXLogicConfirmNode(3, false);

  private readonly elac1FaultConfirmNode = new NXLogicConfirmNode(0.6, true);

  private readonly elac1FaultConfirmNodeOutput = Subject.create(false);

  private readonly elac1FaultLine123Display = Subject.create(false);

  private readonly elac1FaultLine45Display = Subject.create(false);

  private readonly elac1HydConfirmNodeOutput = Subject.create(false);

  private readonly elac2FaultConfirmNode = new NXLogicConfirmNode(0.6, true);

  private readonly elac2FaultConfirmNodeOutput = Subject.create(false);

  private readonly elac2FaultLine123Display = Subject.create(false);

  private readonly elac2FaultLine45Display = Subject.create(false);

  private readonly elac2HydConfirmNode = new NXLogicConfirmNode(3, false);

  private readonly elac2HydConfirmNodeOutput = Subject.create(false);

  private readonly fcdc1FaultCondition = Subject.create(false);

  private readonly fcdc12FaultCondition = Subject.create(false);

  private readonly fcdc2FaultCondition = Subject.create(false);

  private readonly flapsAngle = Subject.create(0);

  private readonly flapsHandle = Subject.create(0);

  private readonly lrElevFaultCondition = Subject.create(false);

  private readonly sec1FaultCondition = Subject.create(false);

  private readonly sec2FaultCondition = Subject.create(false);

  private readonly sec3FaultCondition = Subject.create(false);

  private readonly sec1FaultLine123Display = Subject.create(false);

  private readonly sec1FaultLine45Display = Subject.create(false);

  private readonly sec2FaultLine123Display = Subject.create(false);

  private readonly sec3FaultLine123Display = Subject.create(false);

  private readonly showLandingInhibit = Subject.create(false);

  private readonly showTakeoffInhibit = Subject.create(false);

  private readonly slatsAngle = Subject.create(0);

  private readonly speedBrakeCommand = Subject.create(false);

  private readonly spoilersArmed = Subject.create(false);

  private slatFlapSelectionS0F0 = false;

  private slatFlapSelectionS18F10 = false;

  private slatFlapSelectionS22F15 = false;

  private slatFlapSelectionS22F20 = false;

  private readonly flapsInferiorToPositionA = Subject.create(false);

  private readonly flapsSuperiorToPositionD = Subject.create(false);

  private readonly flapsSuperiorToPositionF = Subject.create(false);

  private readonly slatsInferiorToPositionD = Subject.create(false);

  private readonly slatsSuperiorToPositionG = Subject.create(false);

  private readonly flapsSuperiorToPositionDOrSlatsSuperiorToPositionC = Subject.create(false);

  private readonly flapsNotTo = Subject.create(false);

  private readonly flapsNotToMemo = Subject.create(false);

  private readonly flapConfigSr = new NXLogicMemoryNode(true);

  private readonly flapConfigAural = Subject.create(false);

  private readonly flapConfigWarning = Subject.create(false);

  private readonly slatsNotTo = Subject.create(false);

  private readonly slatConfigSr = new NXLogicMemoryNode(true);

  private readonly slatConfigAural = Subject.create(false);

  private readonly slatConfigWarning = Subject.create(false);

  private readonly speedbrakesNotTo = Subject.create(false);

  private readonly speedbrakesConfigSr = new NXLogicMemoryNode(true);

  private readonly speedbrakesConfigAural = Subject.create(false);

  private readonly speedbrakesConfigWarning = Subject.create(false);

  private readonly flapsMcduDisagree = Subject.create(false);

  private readonly flapsAndPitchMcduDisagreeEnable = Subject.create(false);

  private readonly pitchConfigInPhase3or4Sr = new NXLogicMemoryNode(true);

  private readonly pitchTrimNotTo = Subject.create(false);

  private readonly pitchTrimNotToAudio = Subject.create(false);

  private readonly pitchTrimNotToWarning = Subject.create(false);

  private readonly pitchTrimMcduCgDisagree = Subject.create(false);

  private readonly trimDisagreeMcduStab1Conf = new NXLogicConfirmNode(1, true);

  private readonly trimDisagreeMcduStab2Conf = new NXLogicConfirmNode(1, true);

  private readonly rudderTrimConfigInPhase3or4Sr = new NXLogicMemoryNode(true);

  private readonly rudderTrimNotTo = Subject.create(false);

  private readonly rudderTrimNotToAudio = Subject.create(false);

  private readonly rudderTrimNotToWarning = Subject.create(false);

  private readonly flapsLeverNotZeroWarning = Subject.create(false);

  private readonly speedBrakeCommand5sConfirm = new NXLogicConfirmNode(5, true);

  private readonly speedBrakeCommand50sConfirm = new NXLogicConfirmNode(50, true);

  private readonly speedBrakeCaution1Confirm = new NXLogicConfirmNode(30, true);

  private readonly engAboveIdleWithSpeedBrakeConfirm = new NXLogicConfirmNode(10, false);

  private readonly apTcasRaNoseUpConfirm = new NXLogicConfirmNode(4, true);

  private readonly speedBrakeCaution3Confirm = new NXLogicConfirmNode(3, true);

  private readonly speedBrakeCaution3Monostable = new NXLogicTriggeredMonostableNode(1.5, true);

  private readonly speedBrakeCaution1Pulse = new NXLogicPulseNode(true);

  private readonly speedBrakeCaution2Pulse = new NXLogicPulseNode(true);

  private readonly speedBrakeStillOutWarning = Subject.create(false);

  private readonly amberSpeedBrake = Subject.create(false);

  private readonly phase84s5Trigger = new NXLogicTriggeredMonostableNode(4.5, false);

  private readonly groundSpoiler5sDelayed = new NXLogicConfirmNode(5, false);

  private readonly speedBrake5sDelayed = new NXLogicConfirmNode(5, false);

  private readonly groundSpoilerNotArmedWarning = Subject.create(false);

  /* FUEL */

  private readonly centerFuelPump1Auto = ConsumerValue.create(null, false);

  private readonly centerFuelPump2Auto = ConsumerValue.create(null, false);

  private readonly centerFuelQuantity = Subject.create(0);

  private readonly fuelXFeedPBOn = Subject.create(false);

  private readonly leftOuterInnerValve = ConsumerSubject.create(null, 0);

  private readonly leftFuelLow = Subject.create(false);

  private readonly leftFuelLowConfirm = new NXLogicConfirmNode(30, true);

  private readonly leftFuelPump1Auto = ConsumerValue.create(null, false);

  private readonly leftFuelPump2Auto = ConsumerValue.create(null, false);

  private readonly lrTankLow = Subject.create(false);

  private readonly lrTankLowConfirm = new NXLogicConfirmNode(30, true);

  private readonly rightOuterInnerValve = ConsumerSubject.create(null, 0);

  private readonly rightFuelLow = Subject.create(false);

  private readonly rightFuelLowConfirm = new NXLogicConfirmNode(30, true);

  private readonly rightFuelPump1Auto = ConsumerValue.create(null, false);

  private readonly rightFuelPump2Auto = ConsumerValue.create(null, false);

  private readonly fuelCtrTankModeSelMan = ConsumerValue.create(null, false);

  /* HYDRAULICS */

  private readonly blueElecPumpPBAuto = Subject.create(false);

  private readonly blueLP = Subject.create(false);

  private readonly blueRvrLow = Subject.create(false);

  private readonly blueRvrOvht = Subject.create(false);

  private readonly eng1pumpPBisAuto = Subject.create(false);

  private readonly eng2pumpPBisAuto = Subject.create(false);

  private readonly greenHydEng1PBAuto = Subject.create(false);

  private readonly greenLP = Subject.create(false);

  private readonly greenRvrOvht = Subject.create(false);

  private readonly hydPTU = Subject.create(false);

  private readonly ptuAuto = Subject.create(false);

  private readonly ratDeployed = Subject.create(0);

  private readonly yellowLP = Subject.create(false);

  private readonly yellowRvrOvht = Subject.create(false);

  private readonly yepumpPBisAuto = Subject.create(false);

  /* 31 - FWS */

  private readonly fwcFlightPhase = Subject.create(-1);

  private readonly flightPhase126 = Subject.create(false);

  private readonly flightPhase23 = Subject.create(false);

  private readonly flightPhase34 = Subject.create(false);

  private readonly flightPhase345 = Subject.create(false);

  private readonly flightPhase129 = Subject.create(false);

  private readonly flightPhase67 = Subject.create(false);

  private readonly flightPhase78 = Subject.create(false);

  private readonly ldgInhibitTimer = new NXLogicConfirmNode(3);

  private readonly toInhibitTimer = new NXLogicConfirmNode(3);

  /** TO CONFIG TEST raw button input */
  private toConfigTestRaw = false;

  /** TO CONFIG TEST pulse with 0.5s monostable trigger */
  private toConfigTest = false;

  private readonly toConfigPulseNode = new NXLogicPulseNode();

  private readonly toConfigTriggerNode = new NXLogicTriggeredMonostableNode(0.5, true);

  private readonly toConfigTestHeldMin1s5PulseNode = new NXLogicTriggeredMonostableNode(1.5, true);

  /** this will be true whenever the TO CONFIG TEST button is pressed, and stays on for a minimum of 1.5s */
  private readonly toConfigTestHeldMin1s5Pulse = Subject.create(false);

  private toConfigNormalConf = new NXLogicConfirmNode(0.3, false);

  private readonly clr1PulseNode = new NXLogicPulseNode();

  private readonly clr2PulseNode = new NXLogicPulseNode();

  private readonly clrPulseUpTrigger = new NXLogicTriggeredMonostableNode(0.5, true);

  private clrTriggerRisingEdge = false;

  private readonly rclUpPulseNode = new NXLogicPulseNode();

  private readonly rclUpTriggerNode = new NXLogicTriggeredMonostableNode(0.5, true);

  private recallTriggerRisingEdge = false;

  private readonly flightPhase3PulseNode = new NXLogicPulseNode();

  private readonly flightPhaseEndedPulseNode = new NXLogicPulseNode();

  private readonly flightPhaseInhibitOverrideNode = new NXLogicMemoryNode(false);

  /** 31 - EIS */
  private readonly dmcLeftDiscreteWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_dmc_discrete_word_350_left'),
  );
  private readonly dmcRightDiscreteWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_dmc_discrete_word_350_right'),
  );
  private readonly dmcLeftAltitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_dmc_altitude_left'));
  private readonly dmcRightAltitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_dmc_altitude_right'));

  /* LANDING GEAR AND LIGHTS */

  private readonly aircraftOnGround = Subject.create(false);

  private readonly antiskidActive = Subject.create(false);

  private readonly brakeFan = Subject.create(false);

  private readonly brakesHot = Subject.create(false);

  private readonly leftLandingLightExtended = Subject.create(false);

  private readonly rightlandingLightExtended = Subject.create(false);

  private readonly lgciu1Fault = Subject.create(false);

  private readonly lgciu2Fault = Subject.create(false);

  private readonly lgciu1DiscreteWord1 = Arinc429Register.empty();

  private readonly lgciu2DiscreteWord1 = Arinc429Register.empty();

  private readonly lgciu1DiscreteWord2 = Arinc429Register.empty();

  private readonly lgciu2DiscreteWord2 = Arinc429Register.empty();

  private isAllGearDownlocked = false;

  private readonly nwSteeringDisc = Subject.create(false);

  private readonly parkBrake = Subject.create(false);

  private readonly lgNotDown = Subject.create(false);

  private readonly lgNotDownNoCancel = Subject.create(false);

  private readonly lgLeverRedArrow = Subject.create(false);

  private readonly lgNotDownPulse1 = new NXLogicPulseNode();

  private readonly lgNotDownPulse2 = new NXLogicPulseNode();

  private readonly lgciu1OnGroundDisagreeConf = new NXLogicConfirmNode(1, true);

  private readonly lgciu1OnGroundAgreeConf = new NXLogicConfirmNode(0.5, true);

  private readonly lgciu1OnGroundDisagreeMem = new NXLogicMemoryNode(true);

  private readonly lgciu2OnGroundDisagreeConf = new NXLogicConfirmNode(1, true);

  private readonly lgciu2OnGroundAgreeConf = new NXLogicConfirmNode(0.5, true);

  private readonly lgciu2OnGroundDisagreeMem = new NXLogicMemoryNode(true);

  private readonly ra1OnGroundMem = new NXLogicMemoryNode(true);

  private readonly ra2OnGroundMem = new NXLogicMemoryNode(true);

  private readonly ignoreRaOnGroundTrigger = new NXLogicTriggeredMonostableNode(10, true);

  private readonly onGroundConf = new NXLogicConfirmNode(1, true);

  private onGroundImmediate = false;

  public readonly autoBrakeDeactivatedNode = new NXLogicTriggeredMonostableNode(9, false); // When ABRK deactivated, emit this for 9 sec

  public readonly autoBrakeOffAuralConfirmNode = new NXLogicConfirmNode(1, true);

  public readonly autoBrakeOff = Subject.create(false);

  public autoBrakeOffAuralTriggered = false;

  /* NAVIGATION */

  private readonly adirsRemainingAlignTime = Subject.create(0);

  private readonly adiru1State = Subject.create(0);

  private readonly adiru2State = Subject.create(0);

  private readonly adiru3State = Subject.create(0);

  private readonly adr1Cas = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_computed_airspeed_1'));

  private readonly adr2Cas = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_computed_airspeed_2'));

  private readonly adr3Cas = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_computed_airspeed_3'));

  private readonly computedAirSpeedToNearest2 = this.adr1Cas.map((it) => Math.round(it.value / 2) * 2);

  private readonly adr1CorrectedAltLeft = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_adr_baro_corrected_altitude_left_1'),
  );
  private readonly adr3CorrectedAltLeft = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_adr_baro_corrected_altitude_left_3'),
  );
  private readonly adr2CorrectedAltRight = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_adr_baro_corrected_altitude_right_2'),
  );
  private readonly adr3CorrectedAltRight = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_adr_baro_corrected_altitude_right_3'),
  );
  private readonly adr1PressureAlt = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_altitude_1'));
  private readonly adr2PressureAlt = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_altitude_2'));
  private readonly adr3PressureAlt = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_adr_altitude_3'));

  private readonly height1Failed = Subject.create(false);

  private readonly height2Failed = Subject.create(false);

  private adr3OverspeedWarning = new NXLogicMemoryNode(false, false);

  private readonly overspeedWarning = Subject.create(false);

  private readonly flapsIndex = Subject.create(0);

  private stallWarningRaw = ConsumerValue.create(this.sub.on('stall_warning_on'), false);

  private readonly baroRefDiscrepancyConf1 = new NXLogicConfirmNode(10, true);
  private readonly baroRefDiscrepancyConf2 = new NXLogicConfirmNode(20, true);
  private readonly baroRefDiscrepancy = Subject.create(false);

  private readonly altiDiscrepancyConf1 = new NXLogicConfirmNode(5, true);
  private readonly altiDiscrepancyConf2 = new NXLogicConfirmNode(5, true);
  private readonly altiStdDiscrepancy = Subject.create(false);
  private readonly altiBaroDiscrepancy = Subject.create(false);
  private readonly altiDiscrepancy = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.altiBaroDiscrepancy,
    this.altiStdDiscrepancy,
  );

  /** ENGINE AND THROTTLE */

  private readonly engine1Master = ConsumerSubject.create(this.sub.on('engine1Master'), 0);

  private readonly engine2Master = ConsumerSubject.create(this.sub.on('engine2Master'), 0);

  private readonly engine1State = Subject.create(0);

  private readonly engine2State = Subject.create(0);

  private readonly N1Eng1 = Subject.create(0);

  private readonly N1Eng2 = Subject.create(0);

  private readonly N2Eng1 = Subject.create(0);

  private readonly N2Eng2 = Subject.create(0);

  private readonly N1IdleEng = Subject.create(0);

  private readonly engineOnFor30Seconds = new NXLogicConfirmNode(30);

  // FIXME ECU should provide this in a discrete word
  private readonly engine1AboveIdle = MappedSubject.create(
    ([n1, idleN1]) => n1 > idleN1 + 2,
    this.N1Eng1,
    this.N1IdleEng,
  );

  private readonly engine2AboveIdle = MappedSubject.create(
    ([n1, idleN1]) => n1 > idleN1 + 2,
    this.N1Eng2,
    this.N1IdleEng,
  );

  // FIXME ECU should provide this in a discrete word, and calculate based on f(OAT)
  // this is absolute min at low temperatures
  private readonly engine1CoreAtOrAboveMinIdle = MappedSubject.create(
    ([n2]) => n2 >= (100 * 10630) / 16645,
    this.N2Eng1,
  );

  private readonly engine2CoreAtOrAboveMinIdle = MappedSubject.create(
    ([n2]) => n2 >= (100 * 10630) / 16645,
    this.N2Eng2,
  );

  private readonly engDualFault = Subject.create(false);

  private readonly engine1Generator = Subject.create(false);

  private readonly engine2Generator = Subject.create(false);

  private readonly emergencyElectricGeneratorPotential = Subject.create(0);

  private readonly emergencyGeneratorOn = this.emergencyElectricGeneratorPotential.map((it) => it > 0);

  private readonly apuMasterSwitch = Subject.create(0);

  private readonly apuAvail = Subject.create(0);

  /** @deprecated use radioHeight vars */
  private readonly radioAlt = Subject.create(0);

  private readonly radioHeight1 = Arinc429Register.empty();

  private readonly radioHeight2 = Arinc429Register.empty();

  private readonly fac1Failed = Subject.create(0);

  private readonly toMemo = Subject.create(0);

  private readonly ldgMemo = Subject.create(0);

  private readonly autoBrake = Subject.create(0);

  private readonly fuel = Subject.create(0);

  private readonly usrStartRefueling = Subject.create(0);

  private readonly engSelectorPosition = Subject.create(0);

  private readonly eng1AntiIce = Subject.create(false);

  private readonly eng2AntiIce = Subject.create(false);

  private readonly throttle1Position = Subject.create(0);

  private readonly throttle2Position = Subject.create(0);

  public readonly allThrottleIdle = Subject.create(false);

  private readonly engine1ValueSwitch = ConsumerValue.create(null, false);

  private readonly engine2ValueSwitch = ConsumerValue.create(null, false);

  private readonly autoThrustStatus = Subject.create(0);

  private readonly atsDiscreteWord = Arinc429Register.empty();

  private readonly ecu1MaintenanceWord6 = Arinc429Register.empty();

  private readonly ecu2MaintenanceWord6 = Arinc429Register.empty();

  private readonly thrLocked = Subject.create(false);

  private readonly autothrustLeverWarningFlex = Subject.create(false);

  private readonly autothrustLeverWarningToga = Subject.create(false);

  private readonly thrustLeverNotSet = Subject.create(false);

  private readonly eng1Or2TakeoffPowerConfirm = new NXLogicConfirmNode(60, false);

  private readonly eng1Or2TakeoffPower = Subject.create(false);

  /* FIRE */

  private readonly agent1Eng1Discharge = Subject.create(0);

  private readonly agent1Eng1DischargeTimer = new NXLogicClockNode(10, 0);

  private readonly agent2Eng1Discharge = Subject.create(0);

  private readonly agent2Eng1DischargeTimer = new NXLogicClockNode(30, 0);

  private readonly agent1Eng2Discharge = Subject.create(0);

  private readonly agent1Eng2DischargeTimer = new NXLogicClockNode(10, 0);

  private readonly agent2Eng2Discharge = Subject.create(0);

  private readonly agent2Eng2DischargeTimer = new NXLogicClockNode(30, 0);

  private readonly agentAPUDischarge = Subject.create(0);

  private readonly agentAPUDischargeTimer = new NXLogicClockNode(10, 0);

  private readonly apuAgentPB = Subject.create(false);

  private readonly apuFireTest = Subject.create(false);

  private readonly cargoFireAgentDisch = Subject.create(false);

  private readonly cargoFireTest = Subject.create(false);

  private readonly eng1Agent1PB = Subject.create(false);

  private readonly eng1Agent2PB = Subject.create(false);

  private readonly eng1FireTest = Subject.create(false);

  private readonly eng2Agent1PB = Subject.create(false);

  private readonly eng2Agent2PB = Subject.create(false);

  private readonly eng2FireTest = Subject.create(false);

  private readonly fireButton1 = Subject.create(false);

  private readonly fireButton2 = Subject.create(false);

  private readonly fireButtonAPU = Subject.create(false);

  /* ICE */

  private readonly iceDetectedTimer1 = new NXLogicConfirmNode(40, false);

  private readonly iceDetectedTimer2 = new NXLogicConfirmNode(5);

  private readonly iceDetectedTimer2Status = Subject.create(false);

  private readonly iceNotDetTimer1 = new NXLogicConfirmNode(60);

  private readonly iceNotDetTimer2 = new NXLogicConfirmNode(130);

  private readonly iceNotDetTimer2Status = Subject.create(false);

  private readonly iceSevereDetectedTimer = new NXLogicConfirmNode(40, false);

  private readonly iceSevereDetectedTimerStatus = Subject.create(false);

  /* OTHER STUFF */

  private readonly airKnob = Subject.create(0);

  private readonly attKnob = Subject.create(0);

  private readonly compMesgCount = Subject.create(0);

  private readonly dmcSwitchingKnob = Subject.create(0);

  private readonly gpwsFlaps3 = Subject.create(false);

  private readonly gpwsFlapMode = Subject.create(0);

  private readonly gpwsTerrOff = Subject.create(false);

  private readonly landAsapRed = Subject.create(false);

  private readonly ndXfrKnob = Subject.create(0);

  private readonly manLandingElevation = Subject.create(false);

  private readonly noSmoking = Subject.create(0);

  private readonly noSmokingSwitchPosition = Subject.create(0);

  private readonly predWSOn = Subject.create(false);

  private readonly seatBelt = Subject.create(0);

  private readonly strobeLightsOn = Subject.create(0);

  private readonly tcasFault = Subject.create(false);

  private readonly tcasSensitivity = Subject.create(0);

  private readonly toConfigNormal = Subject.create(false);

  private readonly wingAntiIce = Subject.create(false);

  private readonly voiceVhf3 = Subject.create(0);

  /* SETTINGS */

  private readonly configPortableDevices = Subject.create(false);

  constructor(
    private readonly bus: EventBus,
    private readonly instrument: BaseInstrument,
  ) {
    this.ewdMessageLinesLeft.forEach((ls, i) =>
      ls.sub((l) => {
        SimVar.SetSimVarValue(PseudoFWC.ewdMessageSimVarsLeft[i], 'string', l ?? '');
      }),
    );

    this.ewdMessageLinesRight.forEach((ls, i) =>
      ls.sub((l) => {
        SimVar.SetSimVarValue(PseudoFWC.ewdMessageSimVarsRight[i], 'string', l ?? '');
      }),
    );

    SimVar.SetSimVarValue('L:A32NX_STATUS_LEFT_LINE_8', 'string', '000000001');
  }

  init(): void {
    Promise.all([
      KeyEventManager.getManager(this.bus),
      Wait.awaitSubscribable(GameStateProvider.get(), (state) => state === GameState.ingame, true),
    ]).then(([keyEventManager]) => {
      this.keyEventManager = keyEventManager;
      this.registerKeyEvents();
    });

    this.sub
      .on('key_intercept')
      .atFrequency(50)
      .handle((keyData) => {
        switch (keyData.key) {
          case 'A32NX.AUTO_THROTTLE_DISCONNECT':
            this.autoThrottleInstinctiveDisconnect();
            break;
          case 'A32NX.FCU_AP_DISCONNECT_PUSH':
          case 'A32NX.AUTOPILOT_DISENGAGE':
          case 'AUTOPILOT_OFF':
            this.autoPilotInstinctiveDisconnect();
            break;
        }
      });

    this.toConfigNormal.sub((normal) => SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', normal));
    this.fwcFlightPhase.sub(() => this.flightPhaseEndedPulseNode.write(true, 0));

    this.auralCrcOutput.sub((crc) => this.soundManager.handleSoundCondition('continuousRepetitiveChime', crc), true);

    this.masterCaution.sub((caution) => {
      // Inhibit master warning/cautions until FWC startup has been completed
      SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', 'bool', this.startupCompleted.get() ? caution : false);
    }, true);

    this.masterWarningOutput.sub((warning) => {
      // Inhibit master warning/cautions until FWC startup has been completed
      SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'Bool', this.startupCompleted.get() ? warning : false);
    }, true);

    // L/G lever red arrow sinking outputs
    this.lgLeverRedArrow.sub((on) => {
      // TODO FWCs need to be powered...
      SimVar.SetSimVarValue('L:A32NX_FWC_1_LG_RED_ARROW', SimVarValueType.Bool, on);
      SimVar.SetSimVarValue('L:A32NX_FWC_2_LG_RED_ARROW', SimVarValueType.Bool, on);
    }, true);

    this.altiBaroDiscrepancy.sub((v) => this.fwcOut124.setBitValue(25, v));
    this.altiStdDiscrepancy.sub((v) => this.fwcOut124.setBitValue(24, v));
    this.fwcOut124.sub((v) => {
      v.writeToSimVar('L:A32NX_FWC_1_DISCRETE_WORD_124');
      v.writeToSimVar('L:A32NX_FWC_2_DISCRETE_WORD_124');
    }, true);

    this.stallWarning.sub((v) => {
      this.fwcOut126.setBitValue(17, v);
      // set the sound on/off
      SimVar.SetSimVarValue('L:A32NX_AUDIO_STALL_WARNING', 'bool', v);
    }, true);
    this.aircraftOnGround.sub((v) => this.fwcOut126.setBitValue(28, v));

    this.fwcOut126.sub((v) => {
      v.writeToSimVar('L:A32NX_FWC_1_DISCRETE_WORD_126');
      v.writeToSimVar('L:A32NX_FWC_2_DISCRETE_WORD_126');
    }, true);

    // FIXME depend on FWC state
    this.fwcOut126.setSsm(Arinc429SignStatusMatrix.NormalOperation);

    const sub = this.bus.getSubscriber<FuelSystemEvents>();

    this.fuelCtrTankModeSelMan.setConsumer(sub.on('fuel_ctr_tk_mode_sel_man'));
    this.engine1ValueSwitch.setConsumer(sub.on('fuel_valve_switch_1'));
    this.engine2ValueSwitch.setConsumer(sub.on('fuel_valve_switch_2'));
    this.centerFuelPump1Auto.setConsumer(sub.on('fuel_pump_switch_1'));
    this.centerFuelPump2Auto.setConsumer(sub.on('fuel_pump_switch_4'));
    this.leftOuterInnerValve.setConsumer(sub.on('fuel_valve_open_4'));
    this.leftFuelPump1Auto.setConsumer(sub.on('fuel_pump_switch_2'));
    this.leftFuelPump2Auto.setConsumer(sub.on('fuel_pump_switch_5'));
    this.rightOuterInnerValve.setConsumer(sub.on('fuel_valve_open_5'));
    this.rightFuelPump1Auto.setConsumer(sub.on('fuel_pump_switch_3'));
    this.rightFuelPump2Auto.setConsumer(sub.on('fuel_pump_switch_6'));

    // Inhibit single chimes for the first two seconds after power-on
    this.auralSingleChimeInhibitTimer.schedule(
      () => (this.auralSingleChimePending = false),
      PseudoFWC.AURAL_SC_INHIBIT_TIME,
    );

    this.acESSBusPowered.sub((v) => {
      if (v) {
        this.startupTimer.schedule(() => {
          this.startupCompleted.set(true);
          console.log('PseudoFWC startup completed.');
        }, PseudoFWC.FWC_STARTUP_TIME);
      } else {
        this.startupTimer.clear();
        this.startupCompleted.set(false);
        console.log('PseudoFWC shut down.');
      }
    });
  }

  private registerKeyEvents() {
    this.keyEventManager.interceptKey('A32NX.AUTO_THROTTLE_DISCONNECT', true);
    this.keyEventManager.interceptKey('A32NX.FCU_AP_DISCONNECT_PUSH', true);
    this.keyEventManager.interceptKey('A32NX.AUTOPILOT_DISENGAGE', false); // internal event, for FWS only
    this.keyEventManager.interceptKey('AUTOPILOT_OFF', true);
    this.keyEventManager.interceptKey('AUTO_THROTTLE_ARM', true);
  }

  mapOrder(array, order): [] {
    array.sort((a, b) => {
      if (order.indexOf(a) > order.indexOf(b)) {
        return 1;
      }
      return -1;
    });
    return array;
  }

  private adirsMessage1(adirs, engineRunning) {
    let rowChoice = 0;

    switch (true) {
      case Math.ceil(adirs / 60) >= 7 && !engineRunning:
        rowChoice = 0;
        break;
      case Math.ceil(adirs / 60) >= 7 && engineRunning:
        rowChoice = 1;
        break;
      case Math.ceil(adirs / 60) === 6 && !engineRunning:
        rowChoice = 2;
        break;
      case Math.ceil(adirs / 60) === 6 && engineRunning:
        rowChoice = 3;
        break;
      case Math.ceil(adirs / 60) === 5 && !engineRunning:
        rowChoice = 4;
        break;
      case Math.ceil(adirs / 60) === 5 && engineRunning:
        rowChoice = 5;
        break;
      case Math.ceil(adirs / 60) === 4 && !engineRunning:
        rowChoice = 6;
        break;
      case Math.ceil(adirs / 60) === 4 && engineRunning:
        rowChoice = 7;
        break;
      default:
        break;
    }

    return rowChoice;
  }

  private adirsMessage2(adirs, engineRunning) {
    let rowChoice = 0;

    switch (true) {
      case Math.ceil(adirs / 60) === 3 && !engineRunning:
        rowChoice = 0;
        break;
      case Math.ceil(adirs / 60) === 3 && engineRunning:
        rowChoice = 1;
        break;
      case Math.ceil(adirs / 60) === 2 && !engineRunning:
        rowChoice = 2;
        break;
      case Math.ceil(adirs / 60) === 2 && engineRunning:
        rowChoice = 3;
        break;
      case Math.ceil(adirs / 60) === 1 && !engineRunning:
        rowChoice = 4;
        break;
      case Math.ceil(adirs / 60) === 1 && engineRunning:
        rowChoice = 5;
        break;
      default:
        break;
    }

    return rowChoice;
  }

  /**
   * Periodic update
   */
  update(_deltaTime: number) {
    const deltaTime = this.fwsUpdateThrottler.canUpdate(_deltaTime);

    // Acquire discrete inputs at a higher frequency, buffer them until the next FWS cycle.
    // T.O CONFIG button
    if (SimVar.GetSimVarValue('L:A32NX_BTN_TOCONFIG', 'bool')) {
      this.toConfigInputBuffer.write(true, false);
    }

    // CLR buttons
    const clearButtonLeft = SimVar.GetSimVarValue('L:A32NX_BTN_CLR', 'bool');
    const clearButtonRight = SimVar.GetSimVarValue('L:A32NX_BTN_CLR2', 'bool');
    if (clearButtonLeft || clearButtonRight) {
      this.clearButtonInputBuffer.write(true, false);
    }

    // RCL button
    const recallButton = SimVar.GetSimVarValue('L:A32NX_BTN_RCL', 'bool');
    if (recallButton) {
      this.recallButtonInputBuffer.write(true, false);
    }

    // Enforce cycle time for the logic computation (otherwise pulse nodes would be broken)
    if (deltaTime === -1 || _deltaTime === 0) {
      return;
    }

    // Play sounds
    this.soundManager.onUpdate(deltaTime);

    // Write pulse nodes for buffered inputs
    this.toConfigPulseNode.write(this.toConfigInputBuffer.read(), deltaTime);
    this.clr1PulseNode.write(this.clearButtonInputBuffer.read(), deltaTime);
    this.clr2PulseNode.write(this.clearButtonInputBuffer.read(), deltaTime);
    this.rclUpPulseNode.write(this.recallButtonInputBuffer.read(), deltaTime);
    this.autoThrustInstinctiveDiscPressed.write(this.aThrDiscInputBuffer.read(), deltaTime);
    this.autoPilotInstinctiveDiscPressedPulse.write(this.apDiscInputBuffer.read(), deltaTime);

    // Inputs update
    this.flightPhaseEndedPulseNode.write(false, deltaTime);

    this.fwcFlightPhase.set(SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum'));
    this.flightPhase3PulseNode.write(this.fwcFlightPhase.get() === 3, deltaTime);
    // flight phase convenience vars
    this.flightPhase126.set([1, 2, 6].includes(this.fwcFlightPhase.get()));
    this.flightPhase23.set([2, 3].includes(this.fwcFlightPhase.get()));
    this.flightPhase34.set([3, 4].includes(this.fwcFlightPhase.get()));
    this.flightPhase345.set(this.flightPhase34.get() || this.fwcFlightPhase.get() === 5);
    this.flightPhase129.set([1, 2, 9].includes(this.fwcFlightPhase.get()));
    this.flightPhase67.set([6, 7].includes(this.fwcFlightPhase.get()));
    this.flightPhase78.set([7, 8].includes(this.fwcFlightPhase.get()));
    const flightPhase567 = [5, 6, 7].includes(this.fwcFlightPhase.get());
    const flightPhase167 = [1, 6, 7].includes(this.fwcFlightPhase.get());

    // TO CONFIG button
    this.toConfigTestRaw = SimVar.GetSimVarValue('L:A32NX_BTN_TOCONFIG', 'bool') > 0;
    this.toConfigPulseNode.write(this.toConfigTestRaw, _deltaTime);
    const toConfigTest = this.toConfigTriggerNode.write(this.toConfigPulseNode.read(), deltaTime);
    if (toConfigTest !== this.toConfigTest) {
      // temporary var for the old FWC stuff
      SimVar.SetSimVarValue('L:A32NX_FWS_TO_CONFIG_TEST', 'boolean', toConfigTest);
      this.toConfigTest = toConfigTest;
    }
    this.toConfigTestHeldMin1s5Pulse.set(
      this.toConfigTestHeldMin1s5PulseNode.write(this.toConfigTestRaw, deltaTime) || this.toConfigTestRaw,
    );

    // CLR buttons
    const previousClrPulseUpTrigger = this.clrPulseUpTrigger.read();
    this.clrPulseUpTrigger.write(this.clr1PulseNode.read() || this.clr2PulseNode.read(), deltaTime);
    this.clrTriggerRisingEdge = !previousClrPulseUpTrigger && this.clrPulseUpTrigger.read();

    // RCL button
    const previousRclUpTriggerNode = this.rclUpTriggerNode.read();
    this.rclUpTriggerNode.write(recallButton, deltaTime);

    this.recallTriggerRisingEdge = !previousRclUpTriggerNode && this.rclUpTriggerNode.read();

    this.flightPhaseInhibitOverrideNode.write(this.rclUpPulseNode.read(), this.flightPhaseEndedPulseNode.read());

    this.showTakeoffInhibit.set(
      this.toInhibitTimer.write(this.flightPhase345.get() && !this.flightPhaseInhibitOverrideNode.read(), deltaTime),
    );
    this.showLandingInhibit.set(
      this.ldgInhibitTimer.write(this.flightPhase78.get() && !this.flightPhaseInhibitOverrideNode.read(), deltaTime),
    );

    this.flapsIndex.set(SimVar.GetSimVarValue('L:A32NX_FLAPS_CONF_INDEX', 'number'));

    // RA acquisition
    this.radioHeight1.setFromSimVar('L:A32NX_RA_1_RADIO_ALTITUDE');
    this.radioHeight2.setFromSimVar('L:A32NX_RA_2_RADIO_ALTITUDE');

    /* ENGINE AND THROTTLE acquisition */

    this.engine1State.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'Enum'));
    this.engine2State.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'Enum'));
    this.N1Eng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'number'));
    this.N1Eng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'number'));
    this.N2Eng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:1', 'number'));
    this.N2Eng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:2', 'number'));
    this.N1IdleEng.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_IDLE_N1', 'number'));
    // FIXME move out of acquisition to logic below
    const oneEngineAboveMinPower = this.engine1AboveIdle.get() || this.engine2AboveIdle.get();
    this.engineOnFor30Seconds.write(this.engine1State.get() === 1 || this.engine2State.get() === 1, deltaTime);

    this.engine1Generator.set(SimVar.GetSimVarValue('L:A32NX_ELEC_ENG_GEN_1_POTENTIAL_NORMAL', 'bool'));
    this.engine2Generator.set(SimVar.GetSimVarValue('L:A32NX_ELEC_ENG_GEN_2_POTENTIAL_NORMAL', 'bool'));
    this.emergencyElectricGeneratorPotential.set(SimVar.GetSimVarValue('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'number'));

    this.apuMasterSwitch.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool'));

    this.apuAvail.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool'));
    this.apuBleedValveOpen.set(SimVar.GetSimVarValue('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool'));

    this.radioAlt.set(SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND MINUS CG', 'feet'));

    this.fac1Failed.set(SimVar.GetSimVarValue('L:A32NX_FBW_FAC_FAILED:1', 'boost psi'));

    this.toMemo.set(SimVar.GetSimVarValue('L:A32NX_FWC_TOMEMO', 'bool'));

    this.autoBrake.set(SimVar.GetSimVarValue('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum'));

    this.ldgMemo.set(SimVar.GetSimVarValue('L:A32NX_FWC_LDGMEMO', 'bool'));

    this.fuel.set(SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:9', 'percent'));
    this.usrStartRefueling.set(SimVar.GetSimVarValue('L:A32NX_REFUEL_STARTED_BY_USR', 'bool'));
    this.engSelectorPosition.set(SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'Enum'));
    this.eng1AntiIce.set(SimVar.GetSimVarValue('ENG ANTI ICE:1', 'bool'));
    this.eng2AntiIce.set(SimVar.GetSimVarValue('ENG ANTI ICE:2', 'bool'));
    this.throttle1Position.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number'));
    this.throttle2Position.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number'));
    this.autoThrustStatus.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_STATUS', 'enum'));
    this.atsDiscreteWord.setFromSimVar('L:A32NX_FCU_ATS_DISCRETE_WORD');
    this.ecu1MaintenanceWord6.setFromSimVar('L:A32NX_ECU_1_MAINTENANCE_WORD_6');
    this.ecu2MaintenanceWord6.setFromSimVar('L:A32NX_ECU_2_MAINTENANCE_WORD_6');
    this.autothrustLeverWarningFlex.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX', 'bool'));
    this.autothrustLeverWarningToga.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA', 'bool'));
    this.allThrottleIdle.set(this.throttle1Position.get() < 1 && this.throttle2Position.get() < 1);

    const masterCautionButtonLeft = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERCAUT_L', 'bool');
    const masterCautionButtonRight = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERCAUT_R', 'bool');
    const masterWarningButtonLeft = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_L', 'bool');
    const masterWarningButtonRight = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_R', 'bool');

    /* HYDRAULICS acquisition */

    this.blueElecPumpPBAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'bool'));
    this.blueLP.set(SimVar.GetSimVarValue('L:A32NX_HYD_BLUE_EDPUMP_LOW_PRESS', 'bool'));
    this.blueRvrLow.set(SimVar.GetSimVarValue('L:A32NX_HYD_BLUE_RESERVOIR_LEVEL_IS_LOW', 'bool'));
    this.blueRvrOvht.set(SimVar.GetSimVarValue('L:A32NX_HYD_BLUE_RESERVOIR_OVHT', 'bool'));
    this.eng1pumpPBisAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'bool'));
    this.eng2pumpPBisAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'bool'));
    this.greenLP.set(SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'bool'));
    this.greenRvrOvht.set(SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_RESERVOIR_OVHT', 'bool'));
    this.hydPTU.set(SimVar.GetSimVarValue('L:A32NX_HYD_PTU_ON_ECAM_MEMO', 'Bool'));
    this.ptuAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_PTU_PB_IS_AUTO', 'bool'));
    this.ratDeployed.set(SimVar.GetSimVarValue('L:A32NX_RAT_STOW_POSITION', 'percent over 100'));
    this.yellowLP.set(SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS', 'bool'));
    this.yellowRvrOvht.set(SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_RESERVOIR_OVHT', 'bool'));
    this.yepumpPBisAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_EPUMPY_PB_IS_AUTO', 'bool'));

    const blueSysPressurised = SimVar.GetSimVarValue('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool');
    const greenSysPressurised = SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool');
    const yellowSysPressurised = SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool');

    /* ADIRS acquisition */

    this.adirsRemainingAlignTime.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME', 'Seconds'));

    const adr1PressureAltitude = this.adr1PressureAlt.get();
    const adr2PressureAltitude = this.adr2PressureAlt.get();
    const adr3PressureAltitude = this.adr3PressureAlt.get();
    // TODO use GPS alt if ADRs not available
    const pressureAltitude =
      adr1PressureAltitude.valueOr(null) ?? adr2PressureAltitude.valueOr(null) ?? adr3PressureAltitude.valueOr(null);
    this.adiru1State.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADIRU_1_STATE', 'enum'));
    this.adiru2State.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADIRU_2_STATE', 'enum'));
    this.adiru3State.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADIRU_3_STATE', 'enum'));
    const height1: Arinc429Word = Arinc429Word.fromSimVarValue('L:A32NX_RA_1_RADIO_ALTITUDE');
    const height2: Arinc429Word = Arinc429Word.fromSimVarValue('L:A32NX_RA_2_RADIO_ALTITUDE');
    this.height1Failed.set(height1.isFailureWarning());
    this.height2Failed.set(height2.isFailureWarning());
    // overspeed
    const adr3MaxCas = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_MAX_AIRSPEED');
    const adr1Discrete1 = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_DISCRETE_WORD_1');
    const adr2Discrete1 = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_2_DISCRETE_WORD_1');

    /* LANDING GEAR AND LIGHTS acquisition */

    this.antiskidActive.set(SimVar.GetSimVarValue('ANTISKID BRAKES ACTIVE', 'bool'));
    this.brakeFan.set(SimVar.GetSimVarValue('L:A32NX_BRAKE_FAN_RUNNING', 'bool'));
    this.brakesHot.set(SimVar.GetSimVarValue('L:A32NX_BRAKES_HOT', 'bool'));
    // FIX ME ldg lt extended signal should come from SDAC
    const leftLdgLtPosition = SimVar.GetSimVarValue('L:A32NX_LANDING_2_POSITION', 'number');
    const rightLdgLtPosition = SimVar.GetSimVarValue('L:A32NX_LANDING_3_POSITION', 'number');
    this.leftLandingLightExtended.set(leftLdgLtPosition >= 30);
    this.rightlandingLightExtended.set(rightLdgLtPosition >= 30);
    this.lgciu1Fault.set(SimVar.GetSimVarValue('L:A32NX_LGCIU_1_FAULT', 'bool'));
    this.lgciu2Fault.set(SimVar.GetSimVarValue('L:A32NX_LGCIU_2_FAULT', 'bool'));
    this.lgciu1DiscreteWord1.setFromSimVar('L:A32NX_LGCIU_1_DISCRETE_WORD_1');
    this.lgciu2DiscreteWord1.setFromSimVar('L:A32NX_LGCIU_2_DISCRETE_WORD_1');
    this.lgciu1DiscreteWord2.setFromSimVar('L:A32NX_LGCIU_1_DISCRETE_WORD_2');
    this.lgciu2DiscreteWord2.setFromSimVar('L:A32NX_LGCIU_2_DISCRETE_WORD_2');
    this.parkBrake.set(SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool'));
    this.nwSteeringDisc.set(SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool'));
    const leftCompressedHardwireLgciu1 =
      this.dcESSBusPowered.get() && SimVar.GetSimVarValue('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool') > 0;
    const leftCompressedHardwireLgciu2 =
      this.dc2BusPowered.get() && SimVar.GetSimVarValue('L:A32NX_LGCIU_2_LEFT_GEAR_COMPRESSED', 'bool') > 0;

    // General logic
    const mainGearDownlocked =
      (this.lgciu1DiscreteWord1.bitValueOr(23, false) || this.lgciu2DiscreteWord1.bitValueOr(23, false)) &&
      (this.lgciu1DiscreteWord1.bitValueOr(24, false) || this.lgciu2DiscreteWord1.bitValueOr(24, false));
    this.isAllGearDownlocked =
      mainGearDownlocked &&
      (this.lgciu1DiscreteWord1.bitValueOr(25, false) || this.lgciu2DiscreteWord1.bitValueOr(25, false));

    // on ground logic
    const lgciu1Disagree = xor(leftCompressedHardwireLgciu1, this.lgciu1DiscreteWord2.bitValue(13));
    this.lgciu1OnGroundDisagreeConf.write(lgciu1Disagree, deltaTime);
    this.lgciu1OnGroundAgreeConf.write(!lgciu1Disagree, deltaTime);
    this.lgciu1OnGroundDisagreeMem.write(
      (!this.lgciu1DiscreteWord2.isNormalOperation() && !this.lgciu1DiscreteWord2.isFunctionalTest()) ||
        this.lgciu1OnGroundDisagreeConf.read(),
      this.lgciu1OnGroundAgreeConf.read(),
    );
    const lgciu2Disagree = xor(leftCompressedHardwireLgciu2, this.lgciu2DiscreteWord2.bitValue(13));
    this.lgciu2OnGroundDisagreeConf.write(lgciu2Disagree, deltaTime);
    this.lgciu2OnGroundAgreeConf.write(!lgciu2Disagree, deltaTime);
    this.lgciu2OnGroundDisagreeMem.write(
      (!this.lgciu2DiscreteWord2.isNormalOperation() && !this.lgciu2DiscreteWord2.isFunctionalTest()) ||
        this.lgciu2OnGroundDisagreeConf.read(),
      this.lgciu2OnGroundAgreeConf.read(),
    );
    const lgciuOnGroundDisagree = this.lgciu1OnGroundDisagreeMem.read() || this.lgciu2OnGroundDisagreeMem.read();
    const onGroundA =
      leftCompressedHardwireLgciu1 &&
      this.lgciu1DiscreteWord2.bitValue(13) &&
      leftCompressedHardwireLgciu2 &&
      this.lgciu2DiscreteWord2.bitValue(13);

    // TODO some renaming
    this.ignoreRaOnGroundTrigger.write(
      this.radioHeight1.isNoComputedData() && this.radioHeight2.isNoComputedData() && !lgciuOnGroundDisagree,
      deltaTime,
    );
    this.ra1OnGroundMem.write(
      this.radioHeight1.value < 5,
      !leftCompressedHardwireLgciu1 || !leftCompressedHardwireLgciu2,
    );
    this.ra2OnGroundMem.write(
      this.radioHeight2.value < 5,
      !leftCompressedHardwireLgciu1 || !leftCompressedHardwireLgciu2,
    );
    const ra1OnGround =
      (this.radioHeight1.isNormalOperation() || this.radioHeight1.isFunctionalTest()) &&
      (this.radioHeight1.value < 5 || this.ra1OnGroundMem.read());
    const ra2OnGround =
      (this.radioHeight2.isNormalOperation() || this.radioHeight2.isFunctionalTest()) &&
      (this.radioHeight2.value < 5 || this.ra2OnGroundMem.read());
    const onGroundCount = countTrue(
      leftCompressedHardwireLgciu1,
      leftCompressedHardwireLgciu2,
      ra1OnGround,
      ra2OnGround,
    );
    const raInvalid = this.radioHeight1.isFailureWarning() || this.radioHeight2.isFailureWarning();
    this.onGroundImmediate =
      (onGroundA && this.ignoreRaOnGroundTrigger.read()) ||
      (onGroundCount > 2 && !raInvalid) ||
      (onGroundCount > 1 && raInvalid);
    this.aircraftOnGround.set(this.onGroundConf.write(this.onGroundImmediate, deltaTime));

    // AP OFF
    const apEngaged: boolean =
      SimVar.GetSimVarValue('L:A32NX_FMGC_1_AP_ENGAGED', SimVarValueType.Bool) ||
      SimVar.GetSimVarValue('L:A32NX_FMGC_2_AP_ENGAGED', SimVarValueType.Bool);
    this.autoPilotDisengagedInstantPulse.write(apEngaged, deltaTime);

    const apDiscPressedInLast1p8SecBeforeThisCycle = this.autoPilotInstinctiveDiscPressedInLast1p5Sec.read();
    this.autoPilotInstinctiveDiscPressedInLast1p5Sec.write(this.autoPilotInstinctiveDiscPressedPulse.read(), deltaTime);

    const voluntaryApDisc =
      this.autoPilotDisengagedInstantPulse.read() && this.autoPilotInstinctiveDiscPressedInLast1p5Sec.read();
    this.autoPilotOffVoluntaryEndAfter1p5s.write(voluntaryApDisc, deltaTime);
    this.autoPilotOffVoluntaryDiscPulse.write(voluntaryApDisc, deltaTime);

    this.autoPilotOffVoluntaryFirstCavalryChargeActive.write(this.autoPilotOffVoluntaryDiscPulse.read(), deltaTime);
    this.autoPilotOffVoluntaryFirstCavalryChargeActivePulse.write(
      this.autoPilotOffVoluntaryFirstCavalryChargeActive.read(),
      deltaTime,
    );

    this.autoPilotInstinctiveDiscPressedTwiceInLast1p5Sec.write(
      this.autoPilotInstinctiveDiscPressedPulse.read() &&
        (this.autoPilotInstinctiveDiscCountSinceLastFwsCycle > 1 || apDiscPressedInLast1p8SecBeforeThisCycle),
      deltaTime,
    );

    this.autoPilotOffVoluntaryMemory.write(
      this.autoPilotOffVoluntaryDiscPulse.read(),
      apEngaged ||
        this.autoPilotInstinctiveDiscPressedTwiceInLast1p5Sec.read() ||
        !this.autoPilotOffVoluntaryEndAfter1p5s.read(),
    );

    const discPbPressedAfterDisconnection =
      !this.autoPilotDisengagedInstantPulse.read() &&
      (this.autoPilotInstinctiveDiscPressedPulse.read() || masterWarningButtonLeft || masterWarningButtonRight);

    this.autoPilotOffUnacknowledged.write(
      this.autoPilotDisengagedInstantPulse.read(),
      apEngaged || this.autoPilotInstinctiveDiscPressedTwiceInLast1p5Sec.read() || discPbPressedAfterDisconnection,
    );

    this.autoPilotOffInvoluntaryMemory.write(
      !apEngaged && !this.autoPilotOffVoluntaryMemory.read() && this.autoPilotOffUnacknowledged.read(),
      !this.autoPilotOffUnacknowledged.read(),
    );

    this.autoPilotOffAlertShownMemory.write(
      this.autoPilotOffInvoluntaryMemory.read(),
      this.fwcFlightPhase.get() === 1 || apEngaged,
    );
    this.autoPilotOffAlertShown.set(this.autoPilotOffAlertShownMemory.read());
    this.autoPilotOffInvoluntary.set(this.autoPilotOffInvoluntaryMemory.read());
    this.autoPilotOffShowMemo.set(this.autoPilotOffVoluntaryMemory.read() || this.autoPilotOffInvoluntaryMemory.read());

    if (this.autoPilotDisengagedInstantPulse.read()) {
      // Request quiet CRC one time
      this.requestMasterWarningFromApOff = true;
      this.soundManager.enqueueSound('cavalryChargeOnce'); // On the A320, play first cav charge completely no matter what
    }
    if (this.autoPilotOffVoluntaryFirstCavalryChargeActivePulse.read()) {
      this.soundManager.dequeueSound('cavalryChargeOnce');
    }
    if (!this.autoPilotOffVoluntaryMemory.read() && !this.autoPilotOffInvoluntaryMemory.read()) {
      this.requestMasterWarningFromApOff = false;
      this.soundManager.dequeueSound('cavalryChargeOnce');
      this.soundManager.dequeueSound('cavalryChargeCont');
    }

    this.autoPilotInstinctiveDiscPressedPulse.write(false, deltaTime);

    // approach capability downgrade. Debounce first, then suppress for a certain amount of time
    // (to avoid multiple triple clicks, and a delay which is too long)
    let fmgcApproachCapability = 0;
    const getApproachCapability = (dw3: Arinc429WordData, dw4: Arinc429WordData): number => {
      let appCap = 0;
      const landModeActive = dw4.bitValueOr(14, false);
      const landModeArmed = dw3.bitValueOr(20, false);
      const land2Capacity = dw4.bitValueOr(23, false);
      const land3FailPassiveCapacity = dw4.bitValueOr(24, false);
      const land3FailOperationalCapacity = dw4.bitValueOr(25, false);

      if (land2Capacity) {
        appCap = 2;
      } else if (land3FailPassiveCapacity) {
        appCap = 3;
      } else if (land3FailOperationalCapacity) {
        appCap = 4;
      } else if (landModeActive || landModeArmed) {
        appCap = 1;
      } else {
        appCap = 0;
      }
      return appCap;
    };

    if (this.fmgc1DiscreteWord3.get().isNormalOperation() && this.fmgc1DiscreteWord4.get().isNormalOperation()) {
      fmgcApproachCapability = getApproachCapability(this.fmgc1DiscreteWord3.get(), this.fmgc1DiscreteWord4.get());
    } else if (this.fmgc2DiscreteWord3.get().isNormalOperation() && this.fmgc2DiscreteWord4.get().isNormalOperation()) {
      fmgcApproachCapability = getApproachCapability(this.fmgc2DiscreteWord3.get(), this.fmgc2DiscreteWord4.get());
    }

    const capabilityDowngrade =
      fmgcApproachCapability < this.fmgcApproachCapability.get() && fmgcApproachCapability > 0;
    this.approachCapabilityDowngradeDebounce.write(
      capabilityDowngrade && flightPhase167 && !this.approachCapabilityDowngradeSuppress.read(),
      deltaTime,
    );
    this.approachCapabilityDowngradeDebouncePulse.write(this.approachCapabilityDowngradeDebounce.read(), deltaTime);
    this.approachCapabilityDowngradeSuppress.write(this.approachCapabilityDowngradeDebouncePulse.read(), deltaTime);
    // Capability downgrade after debounce --> triple click
    if (this.approachCapabilityDowngradeDebouncePulse.read()) {
      this.soundManager.enqueueSound('pause0p8s');
      this.soundManager.enqueueSound('tripleClick');
    }
    this.fmgcApproachCapability.set(fmgcApproachCapability);

    // A/THR OFF
    const aThrEngaged = this.atsDiscreteWord.bitValueOr(13, false);
    this.autoThrustDisengagedInstantPulse.write(aThrEngaged, deltaTime);
    this.autoThrustInstinctiveDiscPressed.write(false, deltaTime);

    const below50ft = this.radioHeight1.valueOr(2500) < 50 && this.radioHeight2.valueOr(2500) < 50;

    if (below50ft && this.allThrottleIdle.get()) {
      this.autoThrustInhibitCaution = true;
    }

    const voluntaryAThrDisc =
      !this.aircraftOnGround.get() &&
      this.autoThrustDisengagedInstantPulse.read() &&
      (this.autoThrustInstinctiveDiscPressed.read() || this.allThrottleIdle.get()) &&
      !this.autoThrustInhibitCaution;

    // Voluntary A/THR disconnect
    this.autoThrustOffVoluntaryMemoNode.write(voluntaryAThrDisc && !aThrEngaged, deltaTime);
    this.autoThrustOffVoluntaryCautionNode.write(voluntaryAThrDisc && !aThrEngaged, deltaTime);
    this.thrLocked.set(
      this.ecu1MaintenanceWord6.bitValueOr(12, false) || this.ecu2MaintenanceWord6.bitValueOr(12, false),
    );

    if (!this.autoThrustOffVoluntaryMemoNode.read()) {
      this.autoThrustInhibitCaution = false;
    }

    if (
      this.autoThrustOffVoluntaryCautionNode.read() &&
      !this.autoThrustOffVoluntary.get() &&
      !this.autoThrustInhibitCaution
    ) {
      // First triggered in this cycle, request master caution
      this.requestMasterCautionFromAThrOff = true;
      this.requestSingleChimeFromAThrOff = true;
    } else if (!this.autoThrustOffVoluntaryCautionNode.read() || this.autoThrustInhibitCaution) {
      this.requestMasterCautionFromAThrOff = false;
      this.requestSingleChimeFromAThrOff = false;
    }
    this.autoThrustOffVoluntary.set(
      this.autoThrustOffVoluntaryMemoNode.read() && !this.autoThrustInhibitCaution && !aThrEngaged,
    );

    // Involuntary A/THR disconnect
    const involuntaryAThrDisc =
      !this.aircraftOnGround.get() &&
      this.autoThrustDisengagedInstantPulse.read() &&
      !(this.autoThrustInstinctiveDiscPressed.read() || (below50ft && this.allThrottleIdle.get()));

    this.autoThrustOffInvoluntaryNode.write(involuntaryAThrDisc, aThrEngaged || voluntaryAThrDisc);
    this.autoThrustOffInvoluntary.set(this.autoThrustOffInvoluntaryNode.read());

    // AUTO BRAKE OFF
    this.autoBrakeDeactivatedNode.write(!!SimVar.GetSimVarValue('L:A32NX_AUTOBRAKES_ACTIVE', 'boolean'), deltaTime);

    if (!this.autoBrakeDeactivatedNode.read()) {
      this.requestMasterCautionFromABrkOff = false;
      this.autoBrakeOffAuralTriggered = false;
    }

    this.autoBrakeOffAuralConfirmNode.write(this.autoBrakeDeactivatedNode.read(), deltaTime);

    const autoBrakeOffShouldTrigger =
      this.aircraftOnGround.get() && this.computedAirSpeedToNearest2.get() > 33 && this.autoBrakeDeactivatedNode.read();

    if (autoBrakeOffShouldTrigger && !this.autoBrakeOff.get()) {
      // Triggered in this cycle -> request master caution
      this.requestMasterCautionFromABrkOff = true;
    }

    // FIXME double callout if ABRK fails
    this.autoBrakeOff.set(autoBrakeOffShouldTrigger);
    if (autoBrakeOffShouldTrigger && this.autoBrakeOffAuralConfirmNode.read() && !this.autoBrakeOffAuralTriggered) {
      this.soundManager.enqueueSound('autoBrakeOff');
      this.autoBrakeOffAuralTriggered = true;
    }

    // Engine Logic
    this.thrustLeverNotSet.set(this.autothrustLeverWarningFlex.get() || this.autothrustLeverWarningToga.get());
    // FIXME ECU doesn't have the necessary output words so we go purely on TLA
    const flexThrustLimit = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', 'number') === 3;
    const toPower =
      this.throttle1Position.get() >= 45 ||
      (this.throttle1Position.get() >= 35 && flexThrustLimit) ||
      this.throttle2Position.get() >= 45 ||
      (this.throttle2Position.get() >= 35 && flexThrustLimit);
    this.eng1Or2TakeoffPowerConfirm.write(toPower, deltaTime);
    const raAbove1500 = this.radioHeight1.valueOr(0) > 1500 || this.radioHeight2.valueOr(0) > 1500;
    this.eng1Or2TakeoffPower.set(toPower || (this.eng1Or2TakeoffPowerConfirm.read() && !raAbove1500));

    this.engDualFault.set(
      !this.aircraftOnGround.get() &&
        ((this.fireButton1.get() && this.fireButton2.get()) ||
          (!this.engine1ValueSwitch.get() && !this.engine2ValueSwitch.get()) ||
          (this.engine1State.get() === 0 && this.engine2State.get() === 0) ||
          (!this.engine1CoreAtOrAboveMinIdle.get() && !this.engine2CoreAtOrAboveMinIdle.get())),
    );

    /* 22 - AUTOFLIGHT */
    const fm1DiscreteWord3 = Arinc429Word.fromSimVarValue('L:A32NX_FM1_DISCRETE_WORD_3');
    const fm2DiscreteWord3 = Arinc429Word.fromSimVarValue('L:A32NX_FM2_DISCRETE_WORD_3');

    if (!this.flightPhase23.get()) {
      this.toConfigCheckedInPhase2Or3 = false;
    } else if (this.toConfigTestRaw) {
      this.toConfigCheckedInPhase2Or3 = true;
    }

    const adr3Cas = this.adr3Cas.get();
    let overspeedWarning = this.adr3OverspeedWarning.write(
      adr3Cas.isNormalOperation() && adr3MaxCas.isNormalOperation() && adr3Cas.value > adr3MaxCas.value + 8,
      this.aircraftOnGround.get() ||
        !(adr3Cas.isNormalOperation() && adr3MaxCas.isNormalOperation()) ||
        adr3Cas.value < adr3MaxCas.value + 4,
    );
    if (
      !(adr1Discrete1.isNormalOperation() || adr1Discrete1.isFunctionalTest()) ||
      !(adr2Discrete1.isNormalOperation() || adr2Discrete1.isFunctionalTest())
    ) {
      const adr3Discrete1 = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_DISCRETE_WORD_1');
      overspeedWarning ||= adr3Discrete1.bitValueOr(9, false);
    }
    overspeedWarning ||= adr1Discrete1.bitValueOr(9, false) || adr2Discrete1.bitValueOr(9, false);
    this.overspeedWarning.set(overspeedWarning);

    // In reality FWC1 takes 1B, and FWC2 2B.
    const fcu1Healthy = this.fcu1DiscreteWord2.get().bitValueOr(24, false);
    const fcu2Healthy = this.fcu1DiscreteWord2.get().bitValueOr(25, false);

    this.fcu12Fault.set(!fcu1Healthy && !fcu2Healthy && this.dcESSBusPowered.get() && this.dc2BusPowered.get());
    this.fcu1Fault.set(!fcu1Healthy && fcu2Healthy && this.dcESSBusPowered.get());
    this.fcu2Fault.set(fcu1Healthy && !fcu2Healthy && this.dc2BusPowered.get());

    // TO SPEEDS NOT INSERTED
    const fmToSpeedsNotInserted = fm1DiscreteWord3.bitValueOr(18, false) && fm2DiscreteWord3.bitValueOr(18, false);

    this.toConfigAndNoToSpeedsPulseNode.write(fmToSpeedsNotInserted && this.toConfigTestRaw, deltaTime);

    if (
      fmToSpeedsNotInserted &&
      (this.toConfigTestRaw || this.fwcFlightPhase.get() === 3) &&
      !this.toSpeedsNotInserted
    ) {
      this.toSpeedsNotInserted = true;
    }
    if (!(this.flightPhase23.get() && fmToSpeedsNotInserted) && this.toSpeedsNotInserted) {
      this.toSpeedsNotInserted = false;
    }

    this.toSpeedsNotInsertedWarning.set(
      !this.toConfigAndNoToSpeedsPulseNode.read() && this.toSpeedsNotInserted && !this.flightPhase3PulseNode.read(),
    );

    // TO SPEEDS TOO LOW
    const toSpeedsTooLow = fm1DiscreteWord3.bitValueOr(17, false) && fm2DiscreteWord3.bitValueOr(17, false);
    this.toSpeedsTooLowWarning.set(
      (this.toConfigCheckedInPhase2Or3 || this.fwcFlightPhase.get() === 3) &&
        !this.toConfigPulseNode.read() &&
        !this.flightPhase3PulseNode.read() &&
        toSpeedsTooLow,
    );

    // TO V1/VR/V2 DISAGREE
    const toV2VRV2Disagree = fm1DiscreteWord3.bitValueOr(16, false) && fm2DiscreteWord3.bitValueOr(16, false);
    this.toV2VRV2DisagreeWarning.set(
      (this.toConfigCheckedInPhase2Or3 || this.fwcFlightPhase.get() === 3) &&
        !this.toConfigPulseNode.read() &&
        !this.flightPhase3PulseNode.read() &&
        toV2VRV2Disagree,
    );

    // FMS takeoff flap settings
    const fm1DiscreteWord2 = Arinc429Word.fromSimVarValue('L:A32NX_FM1_DISCRETE_WORD_2');
    const fm2DiscreteWord2 = Arinc429Word.fromSimVarValue('L:A32NX_FM2_DISCRETE_WORD_2');

    /** MCDU TO CONF 0 selected */
    const mcduToFlapPos0 = fm1DiscreteWord2.bitValueOr(13, false) || fm2DiscreteWord2.bitValueOr(13, false);
    /** MCDU TO CONF 1 selected */
    const mcduToFlapPos1 = fm1DiscreteWord2.bitValueOr(14, false) || fm2DiscreteWord2.bitValueOr(14, false);
    /** MCDU TO CONF 2 selected */
    const mcduToFlapPos2 = fm1DiscreteWord2.bitValueOr(15, false) || fm2DiscreteWord2.bitValueOr(15, false);
    /** MCDU TO CONF 3 selected */
    const mcduToFlapPos3 = fm1DiscreteWord2.bitValueOr(16, false) || fm2DiscreteWord2.bitValueOr(16, false);

    /* 21 - AIR CONDITIONING AND PRESSURIZATION */

    this.acsc1DiscreteWord1.setFromSimVar('L:A32NX_COND_ACSC_1_DISCRETE_WORD_1');
    this.acsc1DiscreteWord2.setFromSimVar('L:A32NX_COND_ACSC_1_DISCRETE_WORD_2');
    this.acsc2DiscreteWord1.setFromSimVar('L:A32NX_COND_ACSC_2_DISCRETE_WORD_1');
    this.acsc2DiscreteWord2.setFromSimVar('L:A32NX_COND_ACSC_2_DISCRETE_WORD_2');

    this.acsc1Lane1Fault.set(this.acsc1DiscreteWord1.bitValueOr(21, false));
    this.acsc1Lane2Fault.set(this.acsc1DiscreteWord1.bitValueOr(22, false));
    this.acsc2Lane1Fault.set(this.acsc2DiscreteWord1.bitValueOr(21, false));
    this.acsc2Lane2Fault.set(this.acsc2DiscreteWord1.bitValueOr(22, false));

    const acsc1FT = this.acsc1DiscreteWord1.isFailureWarning();
    const acsc2FT = this.acsc2DiscreteWord1.isFailureWarning();
    this.acsc1Fault.set(acsc1FT && !acsc2FT);
    this.acsc2Fault.set(!acsc1FT && acsc2FT);
    const acscBothFault = acsc1FT && acsc2FT;

    this.ramAirOn.set(SimVar.GetSimVarValue('L:A32NX_AIRCOND_RAMAIR_TOGGLE', 'bool'));

    this.cabFanHasFault1.set(
      this.acsc1DiscreteWord1.bitValueOr(25, false) || this.acsc2DiscreteWord1.bitValueOr(25, false),
    );
    this.cabFanHasFault2.set(
      this.acsc1DiscreteWord1.bitValueOr(26, false) || this.acsc2DiscreteWord1.bitValueOr(26, false),
    );

    this.hotAirDisagrees.set(
      this.acsc1DiscreteWord1.bitValueOr(27, false) && this.acsc2DiscreteWord1.bitValueOr(27, false),
    );
    this.hotAirOpen.set(
      !this.acsc1DiscreteWord1.bitValueOr(20, false) || !this.acsc2DiscreteWord1.bitValueOr(20, false),
    );
    this.hotAirPbOn.set(this.acsc1DiscreteWord1.bitValueOr(23, false) || this.acsc2DiscreteWord1.bitValueOr(23, false));

    this.trimAirFault.set(
      this.acsc1DiscreteWord1.bitValueOr(28, false) || this.acsc2DiscreteWord1.bitValueOr(28, false),
    );
    this.ckptTrimFault.set(
      this.acsc1DiscreteWord2.bitValueOr(18, false) || this.acsc2DiscreteWord2.bitValueOr(18, false),
    );
    this.fwdTrimFault.set(
      this.acsc1DiscreteWord2.bitValueOr(19, false) || this.acsc2DiscreteWord2.bitValueOr(19, false),
    );
    this.aftTrimFault.set(
      this.acsc1DiscreteWord2.bitValueOr(20, false) || this.acsc2DiscreteWord2.bitValueOr(20, false),
    );
    this.trimAirHighPressure.set(
      this.acsc1DiscreteWord1.bitValueOr(18, false) || this.acsc2DiscreteWord1.bitValueOr(18, false),
    );

    this.ckptDuctOvht.set(
      this.acsc1DiscreteWord1.bitValueOr(11, false) || this.acsc2DiscreteWord1.bitValueOr(11, false),
    );
    this.fwdDuctOvht.set(
      this.acsc1DiscreteWord1.bitValueOr(12, false) || this.acsc2DiscreteWord1.bitValueOr(12, false),
    );
    this.aftDuctOvht.set(
      this.acsc1DiscreteWord1.bitValueOr(13, false) || this.acsc2DiscreteWord1.bitValueOr(13, false),
    );
    this.anyDuctOvht.set(this.ckptDuctOvht.get() || this.fwdDuctOvht.get() || this.aftDuctOvht.get());

    this.lavGalleyFanFault.set(
      this.acsc1DiscreteWord1.bitValueOr(24, false) || this.acsc2DiscreteWord1.bitValueOr(24, false),
    );

    const crossbleedFullyClosed = SimVar.GetSimVarValue('L:A32NX_PNEU_XBLEED_VALVE_FULLY_CLOSED', 'bool');
    const eng1Bleed = SimVar.GetSimVarValue('L:A32NX_OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO', 'bool');
    const eng1BleedPbFault = SimVar.GetSimVarValue('L:A32NX_OVHD_PNEU_ENG_1_BLEED_PB_HAS_FAULT', 'bool');
    const eng2Bleed = SimVar.GetSimVarValue('L:A32NX_OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO', 'bool');
    const eng2BleedPbFault = SimVar.GetSimVarValue('L:A32NX_OVHD_PNEU_ENG_2_BLEED_PB_HAS_FAULT', 'bool');
    const pack1Fault = SimVar.GetSimVarValue('L:A32NX_OVHD_COND_PACK_1_PB_HAS_FAULT', 'bool');
    const pack2Fault = SimVar.GetSimVarValue('L:A32NX_OVHD_COND_PACK_2_PB_HAS_FAULT', 'bool');
    this.pack1On.set(SimVar.GetSimVarValue('L:A32NX_OVHD_COND_PACK_1_PB_IS_ON', 'bool'));
    this.pack2On.set(SimVar.GetSimVarValue('L:A32NX_OVHD_COND_PACK_2_PB_IS_ON', 'bool'));

    this.cpc1DiscreteWord.setFromSimVar('L:A32NX_PRESS_CPC_1_DISCRETE_WORD');
    this.cpc2DiscreteWord.setFromSimVar('L:A32NX_PRESS_CPC_2_DISCRETE_WORD');

    const activeCpcNumber = this.cpc1DiscreteWord.bitValueOr(11, false) ? 1 : 2;
    const activeCpc = activeCpcNumber === 1 ? this.cpc1DiscreteWord : this.cpc2DiscreteWord;

    this.cpc1Fault.set(this.cpc1DiscreteWord.isFailureWarning());
    this.cpc2Fault.set(this.cpc2DiscreteWord.isFailureWarning());
    this.bothCpcFaultOutput.set(this.bothCpcFault.write(this.cpc1Fault.get() && this.cpc2Fault.get(), deltaTime));

    const manExcessAltitude = SimVar.GetSimVarValue('L:A32NX_PRESS_MAN_EXCESSIVE_CABIN_ALTITUDE', 'bool');
    this.excessPressure.set(activeCpc.bitValueOr(14, false) || manExcessAltitude);

    const eng1And2NotRunning = !this.engine1CoreAtOrAboveMinIdle.get() && !this.engine2CoreAtOrAboveMinIdle.get();
    this.enginesOffAndOnGroundSignal.write(this.aircraftOnGround.get() && eng1And2NotRunning, deltaTime);
    const residualPressureSignal = SimVar.GetSimVarValue('L:A32NX_PRESS_EXCESS_RESIDUAL_PR', 'bool');
    this.excessResidualPr.set(
      this.excessResidualPrConfirm.write(this.enginesOffAndOnGroundSignal.read() && residualPressureSignal, deltaTime),
    );

    this.lowDiffPress.set(activeCpc.bitValueOr(15, false));

    this.pressurizationAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_PRESS_MODE_SEL_PB_IS_AUTO', 'bool'));

    this.cabAltSetResetState1.set(
      this.cabAltSetReset1.write(
        (pressureAltitude ?? 0) > 10000 && this.excessPressure.get(),
        this.excessPressure.get() && [3, 10].includes(this.fwcFlightPhase.get()),
      ),
    );
    this.cabAltSetResetState2.set(
      this.cabAltSetReset2.write(
        (pressureAltitude ?? 0) > 16000 && this.excessPressure.get(),
        this.excessPressure.get() && [3, 10].includes(this.fwcFlightPhase.get()),
      ),
    );
    this.packOffBleedAvailable1.write((eng1Bleed === 1 && !eng1BleedPbFault) || !crossbleedFullyClosed, deltaTime);
    this.packOffBleedAvailable2.write((eng2Bleed === 1 && !eng2BleedPbFault) || !crossbleedFullyClosed, deltaTime);
    this.packOffNotFailed1Status.set(
      this.packOffNotFailed1.write(
        !this.pack1On.get() && !pack1Fault && this.packOffBleedAvailable1.read() && this.fwcFlightPhase.get() === 6,
        deltaTime,
      ),
    );
    this.packOffNotFailed2Status.set(
      this.packOffNotFailed2.write(
        !this.pack2On.get() && !pack2Fault && this.packOffBleedAvailable2.read() && this.fwcFlightPhase.get() === 6,
        deltaTime,
      ),
    );
    this.pack1And2Fault.set(
      acscBothFault ||
        (this.packOffNotFailed1Status.get() && this.acsc2Fault.get()) ||
        (this.packOffNotFailed2Status.get() && this.acsc1Fault.get()),
    );

    const manOutflowValueOpenPercentage = SimVar.GetSimVarValue(
      'L:A32NX_PRESS_MAN_OUTFLOW_VALVE_OPEN_PERCENTAGE',
      'percent',
    );
    this.outflowValveOpenAmount.set(
      Arinc429Word.fromSimVarValue(`L:A32NX_PRESS_CPC_${activeCpcNumber}_OUTFLOW_VALVE_OPEN_PERCENTAGE`).valueOr(
        manOutflowValueOpenPercentage,
      ),
    );
    this.outflowValveNotOpenOutput.set(
      this.outflowValveNotOpenSetReset.write(
        this.outflowValveNotOpen.write(
          this.outflowValveOpenAmount.get() < 85 && [8, 9, 10].includes(this.fwcFlightPhase.get()),
          deltaTime,
        ),
        this.outflowValveOpenAmount.get() > 95 ||
          this.outflowValveResetCondition.write(this.fwcFlightPhase.get() === 1, deltaTime),
      ),
    );

    const safetyValveNotClosed = SimVar.GetSimVarValue('L:A32NX_PRESS_SAFETY_VALVE_OPEN_PERCENTAGE', 'percent') > 0;
    this.safetyValveNotClosedAir.write(safetyValveNotClosed, deltaTime);
    this.safetyValveNotClosedOutput.set(
      (safetyValveNotClosed && [1, 2, 3].includes(this.fwcFlightPhase.get())) ||
        (this.safetyValveNotClosedAir.read() && this.fwcFlightPhase.get() === 6),
    );

    const manCabinDeltaPressure = SimVar.GetSimVarValue('L:A32NX_PRESS_MAN_CABIN_DELTA_PRESSURE', 'percent');
    this.cabinDeltaPressure.set(
      Arinc429Word.fromSimVarValue(`L:A32NX_PRESS_CPC_${activeCpcNumber}_CABIN_DELTA_PRESSURE`).valueOr(
        manCabinDeltaPressure,
      ),
    );

    /* OTHER STUFF */

    this.airKnob.set(SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum'));
    this.attKnob.set(SimVar.GetSimVarValue('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum'));
    this.compMesgCount.set(SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'number'));
    this.dmcSwitchingKnob.set(SimVar.GetSimVarValue('L:A32NX_EIS_DMC_SWITCHING_KNOB', 'enum'));
    this.manLandingElevation.set(activeCpc.bitValueOr(17, false));
    this.seatBelt.set(SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'));
    this.ndXfrKnob.set(SimVar.GetSimVarValue('L:A32NX_ECAM_ND_XFR_SWITCHING_KNOB', 'enum'));
    this.noSmoking.set(SimVar.GetSimVarValue('L:A32NX_NO_SMOKING_MEMO', 'bool'));
    this.noSmokingSwitchPosition.set(SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'Enum'));
    this.strobeLightsOn.set(SimVar.GetSimVarValue('L:LIGHTING_STROBE_0', 'Bool'));
    this.gpwsFlaps3.set(SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'Bool'));
    this.gpwsFlapMode.set(SimVar.GetSimVarValue('L:A32NX_GPWS_FLAP_OFF', 'Bool'));
    this.gpwsTerrOff.set(SimVar.GetSimVarValue('L:A32NX_GPWS_TERR_OFF', 'Bool'));
    this.predWSOn.set(SimVar.GetSimVarValue('L:A32NX_SWITCH_RADAR_PWS_Position', 'Bool'));
    this.tcasFault.set(SimVar.GetSimVarValue('L:A32NX_TCAS_FAULT', 'bool'));
    this.tcasSensitivity.set(SimVar.GetSimVarValue('L:A32NX_TCAS_SENSITIVITY', 'Enum'));
    this.wingAntiIce.set(SimVar.GetSimVarValue('L:A32NX_PNEU_WING_ANTI_ICE_SYSTEM_SELECTED', 'bool'));
    this.voiceVhf3.set(SimVar.GetSimVarValue('A:COM ACTIVE FREQUENCY:3', 'number'));

    /* FUEL */
    const fuelGallonsToKg = SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'kilogram');
    this.centerFuelQuantity.set(SimVar.GetSimVarValue('FUEL TANK CENTER QUANTITY', 'gallons') * fuelGallonsToKg);
    this.fuelXFeedPBOn.set(SimVar.GetSimVarValue('L:XMLVAR_Momentary_PUSH_OVHD_FUEL_XFEED_Pressed', 'bool'));

    const leftInnerFuelQuantity = SimVar.GetSimVarValue('FUEL TANK LEFT MAIN QUANTITY', 'gallons') * fuelGallonsToKg;
    const rightInnerFuelQuantity = SimVar.GetSimVarValue('FUEL TANK RIGHT MAIN QUANTITY', 'gallons') * fuelGallonsToKg;
    const leftFuelLow = leftInnerFuelQuantity < 750;
    const rightFuelLow = rightInnerFuelQuantity < 750;
    this.lrTankLow.set(this.lrTankLowConfirm.write(leftFuelLow && rightFuelLow, deltaTime));
    this.leftFuelLow.set(this.leftFuelLowConfirm.write(leftFuelLow && !this.lrTankLow.get(), deltaTime));
    this.rightFuelLow.set(this.rightFuelLowConfirm.write(rightFuelLow && !this.lrTankLow.get(), deltaTime));

    /* F/CTL */
    const fcdc1DiscreteWord1 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_1');
    const fcdc2DiscreteWord1 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_1');
    const fcdc1DiscreteWord2 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_2');
    const fcdc2DiscreteWord2 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_2');
    const fcdc1DiscreteWord3 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_3');
    const fcdc2DiscreteWord3 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_3');
    const fcdc1DiscreteWord4 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_4');
    const fcdc2DiscreteWord4 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_4');
    const fcdc1DiscreteWord5 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_DISCRETE_WORD_5');
    const fcdc2DiscreteWord5 = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_DISCRETE_WORD_5');

    // ELAC 1 FAULT computation
    const se1f =
      (fcdc1DiscreteWord1.bitValueOr(19, false) || fcdc2DiscreteWord1.bitValueOr(19, false)) &&
      (fcdc1DiscreteWord1.bitValueOr(20, false) || fcdc2DiscreteWord1.bitValueOr(20, false));
    const elac1FaultCondition =
      !(
        [1, 10].includes(this.fwcFlightPhase.get()) &&
        (fcdc1DiscreteWord3.bitValueOr(19, false) || fcdc2DiscreteWord3.bitValueOr(19, false))
      ) &&
      this.dcESSBusPowered.get() &&
      (fcdc1DiscreteWord1.bitValueOr(23, false) ||
        fcdc2DiscreteWord1.bitValueOr(23, false) ||
        (!this.elac1HydConfirmNodeOutput.get() && se1f));
    this.elac1FaultLine123Display.set(
      !(fcdc1DiscreteWord3.bitValueOr(19, false) || fcdc2DiscreteWord3.bitValueOr(19, false)) &&
        (fcdc1DiscreteWord1.bitValueOr(23, false) || fcdc2DiscreteWord1.bitValueOr(23, false)),
    );
    this.elac1HydConfirmNodeOutput.set(
      this.elac1HydConfirmNode.write(!greenSysPressurised && !blueSysPressurised, deltaTime),
    );
    this.elac1FaultConfirmNodeOutput.set(this.elac1FaultConfirmNode.write(elac1FaultCondition, deltaTime));

    // ELAC 2 FAULT computation
    const se2f =
      (fcdc1DiscreteWord1.bitValueOr(21, false) || fcdc2DiscreteWord1.bitValueOr(21, false)) &&
      (fcdc1DiscreteWord1.bitValueOr(22, false) || fcdc2DiscreteWord1.bitValueOr(22, false));
    const elac2FaultCondition =
      !(
        [1, 10].includes(this.fwcFlightPhase.get()) &&
        (fcdc1DiscreteWord3.bitValueOr(20, false) || fcdc2DiscreteWord3.bitValueOr(20, false))
      ) &&
      this.dc2BusPowered.get() &&
      (fcdc1DiscreteWord1.bitValueOr(24, false) ||
        fcdc2DiscreteWord1.bitValueOr(24, false) ||
        (!this.elac2HydConfirmNodeOutput.get() && se2f));
    this.elac2FaultLine123Display.set(
      !(fcdc1DiscreteWord3.bitValueOr(20, false) || fcdc2DiscreteWord3.bitValueOr(20, false)) &&
        (fcdc1DiscreteWord1.bitValueOr(24, false) || fcdc2DiscreteWord1.bitValueOr(24, false)),
    );
    this.elac2HydConfirmNodeOutput.set(
      this.elac2HydConfirmNode.write((!greenSysPressurised || !yellowSysPressurised) && !blueSysPressurised, deltaTime),
    );
    this.elac2FaultConfirmNodeOutput.set(this.elac2FaultConfirmNode.write(elac2FaultCondition, deltaTime));

    // SEC 1 FAULT computation
    const ss1f = fcdc1DiscreteWord1.bitValueOr(25, false) || fcdc2DiscreteWord1.bitValueOr(25, false);
    this.sec1FaultCondition.set(
      !(
        [1, 10].includes(this.fwcFlightPhase.get()) &&
        (fcdc1DiscreteWord3.bitValueOr(27, false) || fcdc2DiscreteWord3.bitValueOr(27, false))
      ) &&
        this.dcESSBusPowered.get() &&
        ss1f,
    );
    this.sec1FaultLine123Display.set(
      !(fcdc1DiscreteWord3.bitValueOr(27, false) || fcdc2DiscreteWord3.bitValueOr(27, false)),
    );

    // SEC 2 FAULT computation
    const ss2f = fcdc1DiscreteWord1.bitValueOr(26, false) || fcdc2DiscreteWord1.bitValueOr(26, false);
    this.sec2FaultCondition.set(
      !(
        [1, 10].includes(this.fwcFlightPhase.get()) &&
        (fcdc1DiscreteWord3.bitValueOr(28, false) || fcdc2DiscreteWord3.bitValueOr(28, false))
      ) &&
        this.dc2BusPowered.get() &&
        ss2f,
    );
    this.sec2FaultLine123Display.set(
      !(fcdc1DiscreteWord3.bitValueOr(28, false) || fcdc2DiscreteWord3.bitValueOr(28, false)),
    );

    // SEC 3 FAULT computation
    const ss3f = fcdc1DiscreteWord1.bitValueOr(29, false) || fcdc2DiscreteWord1.bitValueOr(29, false);
    this.sec3FaultCondition.set(
      !(
        [1, 10].includes(this.fwcFlightPhase.get()) &&
        (fcdc1DiscreteWord3.bitValueOr(29, false) || fcdc2DiscreteWord3.bitValueOr(29, false))
      ) &&
        this.dc2BusPowered.get() &&
        ss3f,
    );
    this.sec3FaultLine123Display.set(
      !(fcdc1DiscreteWord3.bitValueOr(29, false) || fcdc2DiscreteWord3.bitValueOr(29, false)),
    );

    // FCDC 1+2 FAULT computation
    const SFCDC1FT =
      fcdc1DiscreteWord1.isFailureWarning() &&
      fcdc1DiscreteWord2.isFailureWarning() &&
      fcdc1DiscreteWord3.isFailureWarning();
    const SFCDC2FT =
      fcdc2DiscreteWord1.isFailureWarning() &&
      fcdc2DiscreteWord2.isFailureWarning() &&
      fcdc2DiscreteWord3.isFailureWarning();
    const SFCDC12FT = SFCDC1FT && SFCDC2FT;
    this.fcdc12FaultCondition.set(SFCDC12FT && this.dc2BusPowered.get());
    this.fcdc1FaultCondition.set(SFCDC1FT && !SFCDC12FT);
    this.fcdc2FaultCondition.set(SFCDC2FT && !(SFCDC12FT || !this.dc2BusPowered.get()));

    // ALTN LAW 2 computation
    const SPA2 = fcdc1DiscreteWord1.bitValueOr(13, false) || fcdc2DiscreteWord1.bitValueOr(13, false);
    this.altn2LawConfirmNodeOutput.set(
      this.altn2LawConfirmNode.write(SPA2 && ![1, 10].includes(this.fwcFlightPhase.get()), deltaTime),
    );

    // ALTN LAW 1 computation
    const SPA1 = fcdc1DiscreteWord1.bitValueOr(12, false) || fcdc2DiscreteWord1.bitValueOr(12, false);
    this.altn1LawConfirmNodeOutput.set(
      this.altn1LawConfirmNode.write(SPA1 && ![1, 10].includes(this.fwcFlightPhase.get()), deltaTime),
    );

    // DIRECT LAW computation
    const SPBUL =
      (false && SFCDC12FT) || fcdc1DiscreteWord1.bitValueOr(15, false) || fcdc2DiscreteWord1.bitValueOr(15, false);
    this.directLawCondition.set(SPBUL && ![1, 10].includes(this.fwcFlightPhase.get()));

    // L+R ELEV FAULT computation
    const lhElevBlueFail =
      (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.bitValueOr(15, false)) ||
      (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.bitValueOr(15, false));
    const lhElevGreenFail =
      (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.bitValueOr(16, false)) ||
      (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.bitValueOr(16, false));
    const rhElevBlueFail =
      (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.bitValueOr(17, false)) ||
      (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.bitValueOr(17, false));
    const rhElevGreenFail =
      (fcdc1DiscreteWord3.isNormalOperation() && !fcdc1DiscreteWord3.bitValueOr(18, false)) ||
      (fcdc2DiscreteWord3.isNormalOperation() && !fcdc2DiscreteWord3.bitValueOr(18, false));
    this.lrElevFaultCondition.set(
      lhElevBlueFail &&
        lhElevGreenFail &&
        rhElevBlueFail &&
        rhElevGreenFail &&
        ![1, 10].includes(this.fwcFlightPhase.get()),
    );

    // GND SPLRS FAULT status
    const sec1GroundSpoilerFault = fcdc1DiscreteWord5.bitValue(14) || fcdc2DiscreteWord5.bitValue(14);
    const sec2GroundSpoilerFault = fcdc1DiscreteWord5.bitValue(15) || fcdc2DiscreteWord5.bitValue(15);
    const sec3GroundSpoilerFault = fcdc1DiscreteWord5.bitValue(16) || fcdc2DiscreteWord5.bitValue(16);
    const sec1SpeedbrakeLeverFault = fcdc1DiscreteWord5.bitValue(11) || fcdc2DiscreteWord5.bitValue(11);
    const sec2SpeedbrakeLeverFault = fcdc1DiscreteWord5.bitValue(12) || fcdc2DiscreteWord5.bitValue(12);
    const sec3SpeedbrakeLeverFault = fcdc1DiscreteWord5.bitValue(13) || fcdc2DiscreteWord5.bitValue(13);
    const allGroundSpoilersInop =
      (sec1GroundSpoilerFault || sec1SpeedbrakeLeverFault) &&
      (sec2GroundSpoilerFault || sec2SpeedbrakeLeverFault) &&
      (sec3GroundSpoilerFault || sec3SpeedbrakeLeverFault);

    this.spoilersArmed.set(fcdc1DiscreteWord4.bitValueOr(27, false) || fcdc2DiscreteWord4.bitValueOr(27, false));
    this.speedBrakeCommand.set(fcdc1DiscreteWord4.bitValueOr(28, false) || fcdc2DiscreteWord4.bitValueOr(28, false));
    this.flapsAngle.set(SimVar.GetSimVarValue('L:A32NX_LEFT_FLAPS_ANGLE', 'degrees'));
    this.flapsHandle.set(SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum'));
    this.slatsAngle.set(SimVar.GetSimVarValue('L:A32NX_LEFT_SLATS_ANGLE', 'degrees'));

    // FIXME these should be split between the two systems and the two sides
    const flapsPos = Arinc429Word.fromSimVarValue('L:A32NX_SFCC_FLAP_ACTUAL_POSITION_WORD');
    const slatsPos = Arinc429Word.fromSimVarValue('L:A32NX_SFCC_SLAT_ACTUAL_POSITION_WORD');

    // WARNING these vary for other variants... A320 CFM LEAP values here
    // flap/slat internal signals
    this.flapsInferiorToPositionA.set(flapsPos.isNormalOperation() && flapsPos.value < 65);
    this.flapsSuperiorToPositionD.set(flapsPos.isNormalOperation() && flapsPos.value > 152);
    this.flapsSuperiorToPositionF.set(flapsPos.isNormalOperation() && flapsPos.value > 179);
    this.slatsInferiorToPositionD.set(slatsPos.isNormalOperation() && slatsPos.value < 210.46);
    this.slatsSuperiorToPositionG.set(slatsPos.isNormalOperation() && slatsPos.value > 309.53);
    this.flapsSuperiorToPositionDOrSlatsSuperiorToPositionC.set(
      this.flapsSuperiorToPositionD.get() || (slatsPos.isNormalOperation() && slatsPos.value > 198.1),
    );

    // flap, slat and speedbrake config warning logic
    const flapsNotInToPos = this.flapsSuperiorToPositionF.get() || this.flapsInferiorToPositionA.get();
    this.flapConfigSr.write(
      this.flightPhase34.get() && flapsNotInToPos,
      !flapsNotInToPos || this.fwcFlightPhase.get() === 5,
    );
    this.flapsNotTo.set(this.flightPhase129.get() && flapsNotInToPos);
    this.flapsNotToMemo.set(this.flapConfigSr.read() || this.flapsNotTo.get());
    this.flapConfigAural.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.flapsNotTo.get()) ||
        (this.flightPhase34.get() && flapsNotInToPos),
    );
    this.flapConfigWarning.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.flapsNotTo.get()) || this.slatConfigSr.read(),
    );

    const slatsNotInToPos = this.slatsInferiorToPositionD.get() || this.slatsSuperiorToPositionG.get();
    this.slatConfigSr.write(
      this.flightPhase34.get() && slatsNotInToPos,
      !slatsNotInToPos || this.fwcFlightPhase.get() === 5,
    );
    this.slatsNotTo.set(this.flightPhase129.get() && slatsNotInToPos);
    this.slatConfigAural.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.slatsNotTo.get()) ||
        (this.flightPhase34.get() && slatsNotInToPos),
    );
    this.slatConfigWarning.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.slatsNotTo.get()) || this.slatConfigSr.read(),
    );

    const speedbrakesNotInToPos = fcdc1DiscreteWord4.bitValueOr(28, false) || fcdc2DiscreteWord4.bitValueOr(28, false);
    this.speedbrakesConfigSr.write(
      this.flightPhase34.get() && speedbrakesNotInToPos,
      !speedbrakesNotInToPos || this.fwcFlightPhase.get() === 5,
    );
    this.speedbrakesNotTo.set(this.flightPhase129.get() && speedbrakesNotInToPos);
    this.speedbrakesConfigAural.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.speedbrakesNotTo.get()) ||
        (this.flightPhase34.get() && speedbrakesNotInToPos),
    );
    this.speedbrakesConfigWarning.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.speedbrakesNotTo.get()) || this.speedbrakesConfigSr.read(),
    );

    // flap/slat MCDU disagree
    // FIXME should come from SDAC via ARINC429
    this.slatFlapSelectionS0F0 = this.flapsHandle.get() === 0;
    this.slatFlapSelectionS18F10 = this.flapsHandle.get() === 1; // FIXME assuming 1+F and not considering 1
    this.slatFlapSelectionS22F15 = this.flapsHandle.get() === 2;
    this.slatFlapSelectionS22F20 = this.flapsHandle.get() === 3;

    const flapsMcduPos1Disagree = xor(this.slatFlapSelectionS18F10, mcduToFlapPos1);
    const flapsMcduPos2Disagree = xor(this.slatFlapSelectionS22F15, mcduToFlapPos2);
    const flapsMcduPos3Disagree = xor(this.slatFlapSelectionS22F20, mcduToFlapPos3);

    this.flapsMcduDisagree.set(
      (flapsMcduPos1Disagree || flapsMcduPos2Disagree || flapsMcduPos3Disagree) &&
        (mcduToFlapPos0 || mcduToFlapPos1 || mcduToFlapPos2 || mcduToFlapPos3),
    );

    this.flapsAndPitchMcduDisagreeEnable.set(
      !this.flightPhase3PulseNode.read() &&
        !this.toConfigPulseNode.read() &&
        (this.fwcFlightPhase.get() === 3 || this.toConfigCheckedInPhase2Or3),
    );

    // pitch trim not takeoff
    const fcdc1Stab1Pos = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_1_ELEVATOR_TRIM_POS');
    const fcdc2Stab1Pos = Arinc429Word.fromSimVarValue('L:A32NX_FCDC_2_ELEVATOR_TRIM_POS');
    const fcdc1Stab2Pos = fcdc1Stab1Pos;
    const fcdc2Stab2Pos = fcdc2Stab1Pos;

    // TODO stab1Pos proper logic
    const stab1Pos = fcdc1Stab1Pos.value;
    const stab1PosInvalid = !fcdc1Stab1Pos.isNormalOperation();
    const stab2Pos = fcdc2Stab2Pos.value;
    const stab2PosInvalid = !fcdc2Stab2Pos.isNormalOperation();

    // A320neo config
    const pitchConfig1 =
      fcdc1Stab1Pos.valueOr(0) > 2.6 ||
      fcdc1Stab1Pos.valueOr(0) < -3.9 ||
      fcdc2Stab1Pos.valueOr(0) > 2.6 ||
      fcdc2Stab1Pos.valueOr(0) < -3.9;
    const pitchConfig2 =
      fcdc1Stab2Pos.valueOr(0) > 2.6 ||
      fcdc1Stab2Pos.valueOr(0) < -3.9 ||
      fcdc2Stab2Pos.valueOr(0) > 2.6 ||
      fcdc2Stab2Pos.valueOr(0) < -3.9;
    const pitchConfig = pitchConfig1 || pitchConfig2;

    this.pitchTrimNotTo.set(this.flightPhase129.get() && pitchConfig);
    const pitchConfigTestInPhase129 =
      pitchConfig && this.toConfigTestHeldMin1s5Pulse.get() && this.flightPhase129.get();
    const pitchConfigInPhase3or4 = this.flightPhase34.get() && pitchConfig;
    this.pitchConfigInPhase3or4Sr.write(pitchConfigInPhase3or4, this.fwcFlightPhase.get() === 5 || !pitchConfig);
    this.pitchTrimNotToAudio.set(pitchConfigTestInPhase129 || pitchConfigInPhase3or4);
    this.pitchTrimNotToWarning.set(pitchConfigTestInPhase129 || this.pitchConfigInPhase3or4Sr.read());

    // pitch trim/mcdu disagree
    // we don't check the trim calculated from CG as it's not available yet
    const fm1PitchTrim = Arinc429Word.fromSimVarValue('L:A32NX_FM1_TO_PITCH_TRIM');
    const fm2PitchTrim = Arinc429Word.fromSimVarValue('L:A32NX_FM2_TO_PITCH_TRIM');
    const fmPitchTrim =
      !fm1PitchTrim.isNormalOperation() && fm2PitchTrim.isNormalOperation() ? fm2PitchTrim : fm1PitchTrim;
    this.trimDisagreeMcduStab1Conf.write(
      !stab1PosInvalid && fmPitchTrim.isNormalOperation() && Math.abs(fmPitchTrim.value - stab1Pos) > 1.2,
      deltaTime,
    );
    this.trimDisagreeMcduStab2Conf.write(
      !stab2PosInvalid && fmPitchTrim.isNormalOperation() && Math.abs(fmPitchTrim.value - stab2Pos) > 1.2,
      deltaTime,
    );
    this.pitchTrimMcduCgDisagree.set(
      !this.pitchTrimNotToWarning.get() &&
        (this.trimDisagreeMcduStab1Conf.read() || this.trimDisagreeMcduStab2Conf.read()),
    );

    // rudder trim not takeoff
    const fac1RudderTrimPosition = Arinc429Word.fromSimVarValue('L:A32NX_FAC_1_RUDDER_TRIM_POS');
    const fac2RudderTrimPosition = Arinc429Word.fromSimVarValue('L:A32NX_FAC_2_RUDDER_TRIM_POS');
    const fac1Healthy = SimVar.GetSimVarValue('L:A32NX_FAC_1_HEALTHY', 'boolean') > 0;
    const fac2Healthy = SimVar.GetSimVarValue('L:A32NX_FAC_2_HEALTHY', 'boolean') > 0;

    const rudderTrimConfig =
      (fac1Healthy && Math.abs(fac1RudderTrimPosition.valueOr(0)) > 3.6) ||
      (fac2Healthy && Math.abs(fac2RudderTrimPosition.valueOr(0)) > 3.6);

    this.rudderTrimNotTo.set(this.flightPhase129.get() && rudderTrimConfig);
    const rudderTrimConfigTestInPhase129 =
      this.toConfigTestHeldMin1s5Pulse.get() && this.flightPhase129.get() && rudderTrimConfig;
    const rudderTrimConfigInPhase3or4 = this.flightPhase34.get() && rudderTrimConfig;
    this.rudderTrimConfigInPhase3or4Sr.write(
      rudderTrimConfigInPhase3or4,
      this.fwcFlightPhase.get() === 5 || !rudderTrimConfig,
    );
    this.rudderTrimNotToAudio.set(rudderTrimConfigTestInPhase129 || rudderTrimConfigInPhase3or4);
    this.rudderTrimNotToWarning.set(rudderTrimConfigTestInPhase129 || this.rudderTrimConfigInPhase3or4Sr.read());

    // flaps lvr not zero
    this.flapsLeverNotZeroWarning.set(
      (adr1PressureAltitude.valueOr(0) >= 22000 ||
        adr2PressureAltitude.valueOr(0) >= 22000 ||
        adr3PressureAltitude.valueOr(0) >= 22000) &&
        this.fwcFlightPhase.get() === 6 &&
        !this.slatFlapSelectionS0F0,
    );

    // spd brk still out
    this.speedBrakeCommand5sConfirm.write(this.speedBrakeCommand.get(), deltaTime);
    this.speedBrakeCommand50sConfirm.write(this.speedBrakeCommand.get(), deltaTime);
    this.engAboveIdleWithSpeedBrakeConfirm.write(
      this.speedBrakeCommand50sConfirm.read() && !oneEngineAboveMinPower,
      deltaTime,
    );
    this.speedBrakeCaution1Confirm.write(
      this.fwcFlightPhase.get() === 6 &&
        this.speedBrakeCommand50sConfirm.read() &&
        !this.engAboveIdleWithSpeedBrakeConfirm.read(),
      deltaTime,
    );
    const speedBrakeCaution1 = this.speedBrakeCaution1Confirm.read();
    const speedBrakeCaution2 = this.fwcFlightPhase.get() === 7 && this.speedBrakeCommand5sConfirm.read();
    // FIXME FCU does not provide the bit, so we synthesize it
    const apVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'number');
    const apTcasRaNoseUp =
      apVerticalMode === VerticalMode.TCAS &&
      SimVar.GetSimVarValue('L:A32NX_TCAS_RA_CORRECTIVE', 'bool') > 0 &&
      SimVar.GetSimVarValue('L:A32NX_TCAS_VSPEED_GREEN:1', 'number') > 0;
    this.apTcasRaNoseUpConfirm.write(apTcasRaNoseUp, deltaTime);
    this.speedBrakeCaution3Confirm.write(
      this.speedBrakeCommand.get() &&
        this.fwcFlightPhase.get() === 6 &&
        oneEngineAboveMinPower &&
        this.apTcasRaNoseUpConfirm.read(),
      deltaTime,
    );
    this.speedBrakeCaution3Monostable.write(this.speedBrakeCaution3Confirm.read(), deltaTime);
    const speedBrakeCaution3 = this.speedBrakeCaution3Confirm.read() || this.speedBrakeCaution3Monostable.read();
    this.amberSpeedBrake.set(
      this.speedBrakeCaution1Confirm.previousInput ||
        speedBrakeCaution2 ||
        speedBrakeCaution3 ||
        !this.flightPhase67.get(),
    );
    const speedBrakeDoNotUse = fcdc1DiscreteWord5.bitValue(27) || fcdc2DiscreteWord5.bitValue(27);
    this.speedBrakeCaution1Pulse.write(speedBrakeCaution1, deltaTime);
    this.speedBrakeCaution2Pulse.write(speedBrakeCaution2, deltaTime);
    const speedBrakeCaution = speedBrakeCaution1 || speedBrakeCaution2 || speedBrakeCaution3;
    this.speedBrakeStillOutWarning.set(
      !this.speedBrakeCaution1Pulse.read() &&
        !this.speedBrakeCaution2Pulse.read() &&
        speedBrakeCaution &&
        !speedBrakeDoNotUse,
    );

    // gnd splr not armed
    const raBelow500 = this.radioHeight1.valueOr(Infinity) < 500 || this.radioHeight2.valueOr(Infinity) < 500;

    const lgDown =
      this.lgciu1DiscreteWord1.bitValueOr(29, false) ||
      (this.lgciu2DiscreteWord1.bitValueOr(29, false) && mainGearDownlocked);
    this.phase84s5Trigger.write(this.fwcFlightPhase.get() === 8, deltaTime);
    this.groundSpoiler5sDelayed.write(
      fcdc1DiscreteWord4.bitValueOr(27, false) || fcdc2DiscreteWord4.bitValueOr(27, false),
      deltaTime,
    );
    this.speedBrake5sDelayed.write(
      fcdc1DiscreteWord4.bitValueOr(28, false) || fcdc2DiscreteWord4.bitValueOr(28, false),
      deltaTime,
    );

    this.groundSpoilerNotArmedWarning.set(
      raBelow500 &&
        lgDown &&
        this.flightPhase67.get() &&
        !this.phase84s5Trigger.read() &&
        !this.eng1Or2TakeoffPower.get() &&
        !allGroundSpoilersInop &&
        !(this.groundSpoiler5sDelayed.read() || this.speedBrake5sDelayed.read()) &&
        (fcdc1DiscreteWord4.isNormalOperation() || fcdc2DiscreteWord4.isNormalOperation()),
    );

    // l/g gear not down
    const fwcFlightPhase = this.fwcFlightPhase.get();
    const flightPhase45 = fwcFlightPhase === 4 || fwcFlightPhase === 5;
    const flightPhase6 = fwcFlightPhase === 6;
    const below750Ra = Math.min(this.radioHeight1.valueOr(Infinity), this.radioHeight2.valueOr(Infinity)) < 750;
    const altInhibit =
      (pressureAltitude ?? 0) > 18500 &&
      !this.radioHeight1.isNoComputedData() &&
      !this.radioHeight1.isNormalOperation() &&
      !this.radioHeight2.isNoComputedData() &&
      !this.radioHeight2.isNormalOperation();
    const gearNotDownlocked = !mainGearDownlocked && (!this.lgciu1Fault.get() || !this.lgciu2Fault.get());
    const below750Condition =
      this.flapsSuperiorToPositionDOrSlatsSuperiorToPositionC.get() &&
      !this.eng1Or2TakeoffPower.get() &&
      below750Ra &&
      gearNotDownlocked;
    const bothRaInvalid = this.radioHeight1.isFailureWarning() && this.radioHeight2.isFailureWarning();
    const bothRaInvalidOrNcd =
      (this.radioHeight1.isNoComputedData || this.radioHeight1.isFailureWarning()) &&
      (this.radioHeight2.isNoComputedData() || this.radioHeight2.isFailureWarning());
    const flapsApprCondition =
      ((this.flapsSuperiorToPositionD.get() && !this.flapsSuperiorToPositionF.get() && bothRaInvalid) ||
        (this.flapsSuperiorToPositionF.get() && bothRaInvalidOrNcd)) &&
      flightPhase6 &&
      gearNotDownlocked;
    const lgNotDownResetPulse =
      this.lgNotDownPulse1.write(below750Condition, deltaTime) ||
      this.lgNotDownPulse2.write(flapsApprCondition, deltaTime);
    this.lgNotDownNoCancel.set((below750Condition || flapsApprCondition) && !lgNotDownResetPulse);
    const n1Eng1 = this.N1Eng1.get();
    const n1Eng2 = this.N1Eng2.get();
    const apprN1 =
      (n1Eng1 < 75 && n1Eng2 < 75) ||
      (n1Eng1 < 97 && n1Eng2 < 97 && !this.engine1Master.get() && !this.engine2Master.get());
    this.lgNotDown.set(gearNotDownlocked && !altInhibit && !this.eng1Or2TakeoffPower.get() && apprN1 && below750Ra);
    // goes to discrete out (RMP02B) and out word 126-11/25
    const redArrow =
      !((flightPhase6 && !bothRaInvalid) || flightPhase45) && (this.lgNotDownNoCancel.get() || this.lgNotDown.get());
    this.lgLeverRedArrow.set(redArrow);

    // 32 - Surveillance Logic
    const isNormalLaw = fcdc1DiscreteWord1.bitValue(11) || fcdc2DiscreteWord1.bitValue(11);
    // we need to check this since the MSFS SDK stall warning does not.
    const isCasAbove60 =
      this.adr1Cas.get().valueOr(0) > 60 || this.adr2Cas.get().valueOr(0) > 60 || adr3Cas.valueOr(0) > 60;
    this.stallWarning.set(
      !isNormalLaw &&
        isCasAbove60 &&
        this.stallWarningRaw.get() &&
        flightPhase567 &&
        this.radioHeight1.valueOr(Infinity) > 1500 &&
        this.radioHeight2.valueOr(Infinity) > 1500,
    );

    /* FIRE */

    this.fireButton1.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG1', 'bool'));
    this.fireButton2.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG2', 'bool'));
    this.fireButtonAPU.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_APU', 'bool'));
    this.eng1FireTest.set(SimVar.GetSimVarValue('L:A32NX_FIRE_TEST_ENG1', 'bool'));
    this.eng2FireTest.set(SimVar.GetSimVarValue('L:A32NX_FIRE_TEST_ENG2', 'bool'));
    this.apuFireTest.set(SimVar.GetSimVarValue('L:A32NX_FIRE_TEST_APU', 'bool'));
    this.eng1Agent1PB.set(SimVar.GetSimVarValue('L:A32NX_FIRE_ENG1_AGENT1_Discharge', 'bool'));
    this.eng1Agent2PB.set(SimVar.GetSimVarValue('L:A32NX_FIRE_ENG1_AGENT2_Discharge', 'bool'));
    this.eng2Agent1PB.set(SimVar.GetSimVarValue('L:A32NX_FIRE_ENG2_AGENT1_Discharge', 'bool'));
    this.eng2Agent2PB.set(SimVar.GetSimVarValue('L:A32NX_FIRE_ENG2_AGENT2_Discharge', 'bool'));
    this.apuAgentPB.set(SimVar.GetSimVarValue('L:A32NX_FIRE_APU_AGENT1_Discharge', 'bool'));
    this.cargoFireTest.set(SimVar.GetSimVarValue('L:A32NX_FIRE_TEST_CARGO', 'bool'));
    this.cargoFireAgentDisch.set(SimVar.GetSimVarValue('L:A32NX_CARGOSMOKE_FWD_DISCHARGED', 'bool'));

    this.agent1Eng1Discharge.set(this.agent1Eng1DischargeTimer.write(this.fireButton1.get(), deltaTime));
    this.agent2Eng1Discharge.set(
      this.agent2Eng1DischargeTimer.write(
        this.fireButton1.get() && this.eng1Agent1PB.get() && !this.aircraftOnGround.get(),
        deltaTime,
      ),
    );
    this.agent1Eng2Discharge.set(
      this.agent1Eng2DischargeTimer.write(this.fireButton2.get() && !this.eng1Agent1PB.get(), deltaTime),
    );
    this.agent2Eng2Discharge.set(
      this.agent2Eng2DischargeTimer.write(this.fireButton2.get() && this.eng1Agent1PB.get(), deltaTime),
    );
    this.agentAPUDischarge.set(
      this.agentAPUDischargeTimer.write(this.fireButton2.get() && this.eng1Agent1PB.get(), deltaTime),
    );

    /* ANTI ICE */

    const icePercentage = SimVar.GetSimVarValue('STRUCTURAL ICE PCT', 'percent over 100');
    const tat = SimVar.GetSimVarValue('TOTAL AIR TEMPERATURE', 'celsius');
    const inCloud = SimVar.GetSimVarValue('AMBIENT IN CLOUD', 'boolean');
    const iceDetected1 = this.iceDetectedTimer1.write(
      icePercentage >= 0.1 && tat < 10 && !this.aircraftOnGround.get(),
      deltaTime,
    );
    this.iceDetectedTimer2Status.set(
      this.iceDetectedTimer2.write(iceDetected1 && !(this.eng1AntiIce.get() && this.eng2AntiIce.get()), deltaTime),
    );
    this.iceSevereDetectedTimerStatus.set(
      this.iceSevereDetectedTimer.write(icePercentage >= 0.5 && tat < 10 && !this.aircraftOnGround.get(), deltaTime),
    );
    const iceNotDetected1 = this.iceNotDetTimer1.write(
      this.eng1AntiIce.get() || this.eng2AntiIce.get() || this.wingAntiIce.get(),
      deltaTime,
    );
    this.iceNotDetTimer2Status.set(
      this.iceNotDetTimer2.write(iceNotDetected1 && !(icePercentage >= 0.1 || (tat < 10 && inCloud === 1)), deltaTime),
    );

    /* NAV logic */
    const dmcLStdBit = this.dmcLeftDiscreteWord.get().bitValueOr(11, false) && fcu1Healthy;
    const dmcLQnhBit = this.dmcLeftDiscreteWord.get().bitValueOr(12, false) && fcu1Healthy;
    const dmcLIsQnh = dmcLQnhBit && !dmcLStdBit;
    const dmcLIsStd = dmcLStdBit && !dmcLQnhBit;
    const dmcLIsQfe = !dmcLQnhBit && !dmcLStdBit && fcu1Healthy;

    const dmcRStdBit = this.dmcRightDiscreteWord.get().bitValueOr(11, false) && fcu2Healthy;
    const dmcRQnhBit = this.dmcRightDiscreteWord.get().bitValueOr(12, false) && fcu2Healthy;
    const dmcRIsQnh = dmcRQnhBit && !dmcRStdBit;
    const dmcRIsStd = dmcRStdBit && !dmcRQnhBit;
    const dmcRIsQfe = !dmcRQnhBit && !dmcRStdBit && fcu2Healthy;

    this.baroRefDiscrepancyConf1.write((dmcLIsQnh && dmcRIsQfe) || (dmcLIsQfe && dmcRIsQnh), deltaTime);
    this.baroRefDiscrepancyConf2.write(
      ((dmcRIsQfe || dmcRIsQnh) && dmcLIsStd) || ((dmcLIsQfe || dmcLIsQnh) && dmcRIsStd),
      deltaTime,
    );
    this.baroRefDiscrepancy.set(this.baroRefDiscrepancyConf1.read() || this.baroRefDiscrepancyConf2.read());

    const leftAdrCorrectedAlt =
      this.airKnob.get() === AirDataSwitchingKnob.Capt
        ? this.adr3CorrectedAltLeft.get()
        : this.adr1CorrectedAltLeft.get();
    const leftAdrPressureAlt =
      this.airKnob.get() === AirDataSwitchingKnob.Capt ? this.adr3PressureAlt.get() : this.adr1PressureAlt.get();
    const leftDmcAlt = this.dmcLeftAltitude.get();
    const rightAdrCorrectedAlt =
      this.airKnob.get() === AirDataSwitchingKnob.Fo
        ? this.adr3CorrectedAltRight.get()
        : this.adr2CorrectedAltRight.get();
    const rightAdrPressureAlt =
      this.airKnob.get() === AirDataSwitchingKnob.Fo ? this.adr3PressureAlt.get() : this.adr2PressureAlt.get();
    const rightDmcAlt = this.dmcRightAltitude.get();

    const baroAltDiscrepancy =
      (((leftAdrCorrectedAlt.isNormalOperation() || leftAdrCorrectedAlt.isFunctionalTest()) &&
        (rightDmcAlt.isNormalOperation() || rightDmcAlt.isFunctionalTest()) &&
        Math.abs(leftAdrCorrectedAlt.value - rightDmcAlt.value) > 250) ||
        ((rightAdrCorrectedAlt.isNormalOperation() || rightAdrCorrectedAlt.isFunctionalTest()) &&
          (leftDmcAlt.isNormalOperation() || leftDmcAlt.isFunctionalTest()) &&
          Math.abs(rightAdrCorrectedAlt.value - leftDmcAlt.value) > 250)) &&
      ((dmcLIsQnh && dmcRIsQnh) || (dmcLIsQfe && dmcRIsQfe));
    this.altiDiscrepancyConf1.write(baroAltDiscrepancy, deltaTime);

    const pressureAltDiscrepancy =
      (((leftAdrPressureAlt.isNormalOperation() || leftAdrPressureAlt.isFunctionalTest()) &&
        (rightDmcAlt.isNormalOperation() || rightDmcAlt.isFunctionalTest()) &&
        Math.abs(leftAdrPressureAlt.value - rightDmcAlt.value) > 250) ||
        ((rightAdrPressureAlt.isNormalOperation() || rightAdrPressureAlt.isFunctionalTest()) &&
          (leftDmcAlt.isNormalOperation() || leftDmcAlt.isFunctionalTest()) &&
          Math.abs(rightAdrPressureAlt.value - leftDmcAlt.value) > 250)) &&
      dmcLIsStd &&
      dmcRIsStd;
    this.altiDiscrepancyConf2.write(pressureAltDiscrepancy, deltaTime);

    const altiDiscrepancyInhibit =
      this.adr1PressureAlt.get().isFailureWarning() ||
      this.adr2PressureAlt.get().isFailureWarning() ||
      this.adr3PressureAlt.get().isFailureWarning();

    this.altiBaroDiscrepancy.set(!altiDiscrepancyInhibit && this.altiDiscrepancyConf1.read());
    this.altiStdDiscrepancy.set(!altiDiscrepancyInhibit && this.altiDiscrepancyConf2.read());

    /* SETTINGS */

    this.configPortableDevices.set(NXDataStore.get('CONFIG_USING_PORTABLE_DEVICES', '0') !== '0');

    /* CABIN READY */

    const callPushAft = SimVar.GetSimVarValue('L:PUSH_OVHD_CALLS_AFT', 'bool');
    const callPushAll = SimVar.GetSimVarValue('L:PUSH_OVHD_CALLS_ALL', 'bool');
    const callPushFwd = SimVar.GetSimVarValue('L:PUSH_OVHD_CALLS_FWD', 'bool');
    if (callPushAft || callPushAll || callPushFwd) {
      SimVar.SetSimVarValue('L:A32NX_CABIN_READY', 'bool', 1);
    }

    /* MASTER CAUT/WARN BUTTONS */
    if (masterCautionButtonLeft || masterCautionButtonRight) {
      this.auralSingleChimePending = false;
      this.requestMasterCautionFromFaults = false;
      this.requestMasterCautionFromABrkOff = false;
      this.requestMasterCautionFromAThrOff = false;
      this.autoThrustInhibitCaution = true;
    }
    if ((masterWarningButtonLeft || masterWarningButtonRight) && this.nonCancellableWarningCount === 0) {
      this.requestMasterWarningFromFaults = this.nonCancellableWarningCount > 0;
      this.requestMasterWarningFromApOff = false;
      this.auralCrcActive.set(this.nonCancellableWarningCount > 0);
    }

    /* T.O. CONFIG CHECK */

    if (this.toMemo.get() && this.toConfigTestRaw) {
      // TODO Note that fuel tank low pressure and gravity feed warnings are not included
      const systemStatus =
        this.engine1Generator.get() &&
        this.engine2Generator.get() &&
        !this.greenLP.get() &&
        !this.yellowLP.get() &&
        !this.blueLP.get() &&
        this.eng1pumpPBisAuto.get() &&
        this.eng2pumpPBisAuto.get();

      const cabin = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent');
      const catering = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent');
      const cargofwdLocked = SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'bool');
      const cargoaftLocked = SimVar.GetSimVarValue('L:A32NX_AFT_DOOR_CARGO_LOCKED', 'bool');
      const brakesHot = SimVar.GetSimVarValue('L:A32NX_BRAKES_HOT', 'bool');

      const speeds = !toSpeedsTooLow && !toV2VRV2Disagree && !fmToSpeedsNotInserted;
      const doors = !!(cabin === 0 && catering === 0 && cargoaftLocked && cargofwdLocked);
      const surfacesNotTo =
        flapsNotInToPos ||
        slatsNotInToPos ||
        this.speedbrakesNotTo.get() ||
        this.rudderTrimNotTo.get() ||
        this.pitchTrimNotTo.get();

      const toConfigNormal =
        systemStatus && speeds && !brakesHot && doors && !this.flapsMcduDisagree.get() && !surfacesNotTo;

      this.toConfigNormal.set(this.toConfigNormalConf.write(toConfigNormal, deltaTime));
    }

    /* CLEAR AND RECALL */
    if (this.clrTriggerRisingEdge) {
      // delete the first failure
      this.failuresLeft.splice(0, 1);
      this.recallFailures = this.allCurrentFailures.filter((item) => !this.failuresLeft.includes(item));
    }

    if (this.recallTriggerRisingEdge) {
      if (this.recallFailures.length > 0) {
        this.failuresLeft.push(this.recallFailures.shift());
      }
    }

    // Output logic

    this.landAsapRed.set(
      !this.aircraftOnGround.get() &&
        (this.fireButton1.get() ||
          this.eng1FireTest.get() ||
          this.fireButton2.get() ||
          this.eng2FireTest.get() ||
          this.fireButtonAPU.get() ||
          this.apuFireTest.get() ||
          this.emergencyGeneratorOn.get() ||
          (this.engine1State.get() === 0 && this.engine2State.get() === 0) ||
          (this.greenLP.get() && this.yellowLP.get()) ||
          (this.yellowLP.get() && this.blueLP.get()) ||
          (this.greenLP.get() && this.blueLP.get())),
    );

    // fire always forces the master warning and SC aural on
    this.fireActive.set(
      [this.eng1FireTest.get(), this.eng2FireTest.get(), this.apuFireTest.get(), this.cargoFireTest.get()].some(
        (e) => e,
      ),
    );

    const flightPhase = this.fwcFlightPhase.get();
    let tempMemoArrayLeft: string[] = [];
    let tempMemoArrayRight: string[] = [];
    const allFailureKeys: string[] = [];
    let tempFailureArrayLeft: string[] = [];
    let failureKeysLeft: string[] = this.failuresLeft;
    let recallFailureKeys: string[] = this.recallFailures;
    let tempFailureArrayRight: string[] = [];
    const failureKeysRight: string[] = this.failuresRight;
    let leftFailureSystemCount = 0;
    let rightFailureSystemCount = 0;
    const auralCrcKeys: string[] = [];
    const auralScKeys: string[] = [];

    // Update failuresLeft list in case failure has been resolved
    for (const [key, value] of Object.entries(this.ewdMessageFailures)) {
      if (!value.simVarIsActive.get() || value.flightPhaseInhib.some((e) => e === flightPhase)) {
        failureKeysLeft = failureKeysLeft.filter((e) => e !== key);
        recallFailureKeys = recallFailureKeys.filter((e) => e !== key);
      }
    }

    this.recallFailures.length = 0;
    this.recallFailures.push(...recallFailureKeys);
    this.nonCancellableWarningCount = 0;

    // Failures first
    for (const [key, value] of Object.entries(this.ewdMessageFailures)) {
      if (value.flightPhaseInhib.some((e) => e === flightPhase)) {
        continue;
      }

      // new warning?
      const newWarning =
        (value.side === 'LEFT' && !this.failuresLeft.includes(key) && !recallFailureKeys.includes(key)) ||
        (value.side === 'RIGHT' && !this.failuresRight.includes(key));

      if (value.simVarIsActive.get()) {
        if (newWarning) {
          if (value.side === 'LEFT') {
            failureKeysLeft.push(key);
          } else {
            failureKeysRight.push(key);
          }

          if (value.failure === 3) {
            this.requestMasterWarningFromFaults = true;
          }
          if (value.failure === 2) {
            this.requestMasterCautionFromFaults = true;
          }
        }

        if (value.cancel === false && value.failure === 3) {
          this.nonCancellableWarningCount++;
        }

        // if the warning is the same as the aural
        if (value.auralWarning === undefined && value.failure === 3) {
          if (newWarning) {
            this.auralCrcActive.set(true);
          }
          auralCrcKeys.push(key);
        }
        if (value.auralWarning === undefined && value.failure === 2) {
          if (newWarning) {
            this.auralSingleChimePending = true;
          }
          auralScKeys.push(key);
        }

        if (value.side === 'LEFT') {
          allFailureKeys.push(key);
        }

        const newCode: string[] = [];
        if (!recallFailureKeys.includes(key)) {
          const codeIndex = value.whichCodeToReturn().filter((e) => e !== null);

          for (const e of codeIndex) {
            newCode.push(value.codesToReturn[e]);
          }

          if (value.sysPage > -1) {
            if (value.side === 'LEFT') {
              leftFailureSystemCount++;
            } else {
              rightFailureSystemCount++;
            }
          }
        }
        if (value.side === 'LEFT') {
          tempFailureArrayLeft = tempFailureArrayLeft.concat(newCode);
        } else {
          tempFailureArrayRight = tempFailureArrayRight.concat(newCode);
        }

        if (value.sysPage > -1) {
          SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', value.sysPage);
        }
      }

      if (value.auralWarning?.get() === FwcAuralWarning.Crc) {
        if (!this.auralCrcKeys.includes(key)) {
          this.auralCrcActive.set(true);
        }
        auralCrcKeys.push(key);
      }

      if (value.auralWarning?.get() === FwcAuralWarning.SingleChime) {
        if (!this.auralScKeys.includes(key)) {
          this.auralSingleChimePending = true;
        }
        auralScKeys.push(key);
      }

      if (value.auralWarning?.get() === FwcAuralWarning.CavalryCharge) {
        this.soundManager.enqueueSound('cavalryChargeCont');
      }
    }

    this.auralCrcKeys = auralCrcKeys;
    this.auralScKeys = auralScKeys;

    if (this.auralCrcKeys.length === 0) {
      this.auralCrcActive.set(false);
    }

    if (this.auralScKeys.length === 0) {
      this.auralSingleChimePending = false;
    }

    const failLeft = tempFailureArrayLeft.length > 0;

    const mesgFailOrderLeft: string[] = [];
    const mesgFailOrderRight: string[] = [];

    for (const [, value] of Object.entries(this.ewdMessageFailures)) {
      if (value.side === 'LEFT') {
        mesgFailOrderLeft.push(...value.codesToReturn);
      } else {
        mesgFailOrderRight.push(...value.codesToReturn);
      }
    }

    const orderedFailureArrayLeft = this.mapOrder(tempFailureArrayLeft, mesgFailOrderLeft);
    const orderedFailureArrayRight = this.mapOrder(tempFailureArrayRight, mesgFailOrderRight);

    this.allCurrentFailures.length = 0;
    this.allCurrentFailures.push(...allFailureKeys);

    this.failuresLeft.length = 0;
    this.failuresLeft.push(...failureKeysLeft);

    this.failuresRight.length = 0;
    this.failuresRight.push(...failureKeysRight);

    if (tempFailureArrayLeft.length > 0) {
      this.ewdMessageLinesLeft.forEach((l, i) => l.set(orderedFailureArrayLeft[i]));
    }

    for (const [, value] of Object.entries(this.ewdMessageMemos)) {
      if (
        value.simVarIsActive.get() &&
        !value.memoInhibit() &&
        !value.flightPhaseInhib.some((e) => e === flightPhase)
      ) {
        const newCode: string[] = [];

        const codeIndex = value.whichCodeToReturn().filter((e) => e !== null);
        codeIndex.forEach((e: number) => {
          newCode.push(value.codesToReturn[e]);
        });

        if (value.side === 'LEFT' && !failLeft) {
          tempMemoArrayLeft = tempMemoArrayLeft.concat(newCode);
        }
        if (value.side === 'RIGHT') {
          const tempArrayRight = tempMemoArrayRight.filter((e) => !value.codesToReturn.includes(e));
          tempMemoArrayRight = tempArrayRight.concat(newCode);
        }

        if (value.sysPage > -1) {
          SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', value.sysPage);
        }
      }
    }

    const mesgOrderLeft: string[] = [];
    const mesgOrderRight: string[] = [];

    for (const [, value] of Object.entries(this.ewdMessageMemos)) {
      if (value.side === 'LEFT') {
        mesgOrderLeft.push(...value.codesToReturn);
      } else {
        mesgOrderRight.push(...value.codesToReturn);
      }
    }

    const orderedMemoArrayLeft = this.mapOrder(tempMemoArrayLeft, mesgOrderLeft);
    let orderedMemoArrayRight: string[] = this.mapOrder(tempMemoArrayRight, mesgOrderRight);

    if (!failLeft) {
      this.ewdMessageLinesLeft.forEach((l, i) => l.set(orderedMemoArrayLeft[i]));

      if (orderedFailureArrayRight.length === 0) {
        this.requestMasterCautionFromFaults = false;
        if (this.nonCancellableWarningCount === 0) {
          this.requestMasterWarningFromFaults = false;
        }
      }
    }

    this.masterCaution.set(
      this.requestMasterCautionFromFaults ||
        this.requestMasterCautionFromABrkOff ||
        this.requestMasterCautionFromAThrOff,
    );

    this.masterWarning.set(this.requestMasterWarningFromFaults || this.requestMasterWarningFromApOff);

    if (leftFailureSystemCount + rightFailureSystemCount === 0) {
      SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', -1);
    }

    if (orderedFailureArrayRight.length > 0) {
      // Right side failures need to be inserted between special lines
      // and the rest of the memo
      const specialLines = ['000014001', '000015001', '000035001', '000036001', '220001501', '220002101'];
      const filteredMemo = orderedMemoArrayRight.filter((e) => !specialLines.includes(e));
      const specLinesInMemo = orderedMemoArrayRight.filter((e) => specialLines.includes(e));
      if (specLinesInMemo.length > 0) {
        orderedMemoArrayRight = [...specLinesInMemo, ...orderedFailureArrayRight, ...filteredMemo];
      } else {
        orderedMemoArrayRight = [...orderedFailureArrayRight, ...orderedMemoArrayRight];
      }
    }

    this.ewdMessageLinesRight.forEach((l, i) => l.set(orderedMemoArrayRight[i]));

    const chimeRequested =
      (this.auralSingleChimePending || this.requestSingleChimeFromAThrOff) && !this.auralCrcActive.get();
    if (chimeRequested && !this.auralSingleChimeInhibitTimer.isPending()) {
      this.auralSingleChimePending = false;
      this.requestSingleChimeFromAThrOff = false;
      this.soundManager.enqueueSound('singleChime');
      // there can only be one SC per 2 seconds, non-cumulative, so clear any pending ones at the end of that inhibit period
      this.auralSingleChimeInhibitTimer.schedule(
        () => (this.auralSingleChimePending = false),
        PseudoFWC.AURAL_SC_INHIBIT_TIME,
      );
    }

    this.updateRowRopWarnings();

    // Reset all buffered inputs
    this.toConfigInputBuffer.write(false, true);
    this.clearButtonInputBuffer.write(false, true);
    this.recallButtonInputBuffer.write(false, true);
    this.aThrDiscInputBuffer.write(false, true);
    this.apDiscInputBuffer.write(false, true);
    this.autoPilotInstinctiveDiscCountSinceLastFwsCycle = 0;
  }

  updateRowRopWarnings() {
    const w = Arinc429Word.fromSimVarValue('L:A32NX_ROW_ROP_WORD_1');

    // ROW
    this.soundManager.handleSoundCondition('runwayTooShort', w.bitValueOr(15, false));

    // ROP
    // MAX BRAKING, only for manual braking, if maximum pedal braking is not applied
    const maxBrakingSet =
      SimVar.GetSimVarValue('L:A32NX_LEFT_BRAKE_PEDAL_INPUT', 'number') > 90 ||
      SimVar.GetSimVarValue('L:A32NX_RIGHT_BRAKE_PEDAL_INPUT', 'number') > 90;
    const maxBraking = w.bitValueOr(13, false) && !maxBrakingSet;
    this.soundManager.handleSoundCondition('brakeMaxBraking', maxBraking);

    // SET MAX REVERSE, if not already max. reverse set and !MAX_BRAKING
    const maxReverseSet =
      SimVar.GetSimVarValue('L:XMLVAR_Throttle1Position', 'number') < 0.1 &&
      SimVar.GetSimVarValue('L:XMLVAR_Throttle2Position', 'number') < 0.1;
    const maxReverse = (w.bitValueOr(12, false) || w.bitValueOr(13, false)) && !maxReverseSet;
    this.soundManager.handleSoundCondition('setMaxReverse', !maxBraking && maxReverse);

    // At 80kt, KEEP MAX REVERSE once, if max. reversers deployed
    const ias = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots');
    this.soundManager.handleSoundCondition(
      'keepMaxReverse',
      ias <= 80 && ias > 4 && (w.bitValueOr(12, false) || w.bitValueOr(13, false)),
    );
  }

  autoThrottleInstinctiveDisconnect() {
    // When instinctive A/THR disc. p/b is pressed after ABRK deactivation, inhibit audio+memo, don't request master caution
    // Unclear refs, whether this has to happen within the audio confirm node time (1s)
    if (this.autoBrakeDeactivatedNode.read()) {
      this.requestMasterCautionFromABrkOff = false;
    }

    this.aThrDiscInputBuffer.write(true, false);

    if (this.autoThrustOffVoluntary.get()) {
      // Pressed a second time -> silence
      this.autoThrustInhibitCaution = true;
      this.requestMasterCautionFromAThrOff = false;
    }
  }

  autoPilotInstinctiveDisconnect() {
    this.apDiscInputBuffer.write(true, false);
    if (this.apDiscInputBuffer.read()) {
      this.autoPilotInstinctiveDiscCountSinceLastFwsCycle++;
    }
  }

  ewdMessageFailures: EWDMessageDict = {
    // 22 - FLIGHT GUIDANCE
    220800001: {
      // AP OFF involuntary
      flightPhaseInhib: [],
      simVarIsActive: this.autoPilotOffAlertShown,
      auralWarning: this.autoPilotOffInvoluntary.map((a) => (a ? FwcAuralWarning.CavalryCharge : FwcAuralWarning.None)),
      whichCodeToReturn: () => [0],
      codesToReturn: ['220800001'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
    },
    220800004: {
      // A/THR OFF involuntary
      flightPhaseInhib: [3, 4, 8],
      simVarIsActive: this.autoThrustOffInvoluntary,
      whichCodeToReturn: () => [0, this.thrLocked.get() ? 1 : null],
      codesToReturn: ['220800004', '220800005'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    // 22 - AUTOFLIGHT
    2200202: {
      // FCU 1+2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fcu12Fault,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['220020201', '220020202'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    2200210: {
      // FCU 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fcu1Fault,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['220021001', '220021002'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2200215: {
      // FCU 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fcu2Fault,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['220021501', '220021502'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2210700: {
      // TO SPEEDS TOO LOW
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.toSpeedsTooLowWarning,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['221070001', '221070002'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    2210710: {
      // TO V1/VR/V2 DISAGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.toV2VRV2DisagreeWarning,
      whichCodeToReturn: () => [0],
      codesToReturn: ['221071001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    2210720: {
      // TO SPEEDS NOT INSERTED
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: this.toSpeedsNotInsertedWarning,
      whichCodeToReturn: () => [0],
      codesToReturn: ['221072001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    // 34 - NAVIGATION & SURVEILLANCE
    3400100: {
      // BARO REF DISCREPANCY
      flightPhaseInhib: [3, 4, 8],
      simVarIsActive: this.baroRefDiscrepancy,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['340010001', '340010002'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3400105: {
      // ALTI DISCREPANCY
      flightPhaseInhib: [4, 5, 8],
      simVarIsActive: this.altiDiscrepancy,
      whichCodeToReturn: () => [0, 1, 2],
      codesToReturn: ['340010501', '340010502', '340010503'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3400170: {
      // OVER SPEED VMO/MMO
      flightPhaseInhib: [2, 3, 4, 8, 9, 10],
      simVarIsActive: this.overspeedWarning,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['340017001', '340017002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: false,
    },
    3400210: {
      // OVERSPEED FLAPS FULL
      flightPhaseInhib: [2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 5 && computedAirSpeedToNearest2 > 181,
        this.flapsIndex,
        this.computedAirSpeedToNearest2,
      ),
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['340021001', '340021002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: false,
    },
    3400220: {
      // OVERSPEED FLAPS 3
      flightPhaseInhib: [2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 4 && computedAirSpeedToNearest2 > 189,
        this.flapsIndex,
        this.computedAirSpeedToNearest2,
      ),
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['340022001', '340022002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: false,
    },
    3400230: {
      // OVERSPEED FLAPS 2
      flightPhaseInhib: [2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 3 && computedAirSpeedToNearest2 > 203,
        this.flapsIndex,
        this.computedAirSpeedToNearest2,
      ),
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['340023001', '340023002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: false,
    },
    3400235: {
      // OVERSPEED FLAPS 1+F
      flightPhaseInhib: [2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 2 && computedAirSpeedToNearest2 > 219,
        this.flapsIndex,
        this.computedAirSpeedToNearest2,
      ),
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['340023501', '340023502'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: false,
    },
    3400240: {
      // OVERSPEED FLAPS 1
      flightPhaseInhib: [2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([flapsIndex, computedAirSpeedToNearest2]) => flapsIndex === 1 && computedAirSpeedToNearest2 > 233,
        this.flapsIndex,
        this.computedAirSpeedToNearest2,
      ),
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['340024001', '340024002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: false,
    },
    7700027: {
      // DUAL ENGINE FAILURE
      flightPhaseInhib: [],
      simVarIsActive: this.engDualFault,
      whichCodeToReturn: () => [
        0,
        !this.emergencyGeneratorOn.get() ? 1 : null,
        5,
        !(this.apuMasterSwitch.get() === 1 || this.apuAvail.get() === 1) && this.radioAlt.get() < 2500 ? 6 : null,
        this.throttle1Position.get() > 0 || this.throttle2Position.get() > 0 ? 7 : null,
        this.fac1Failed.get() === 1 ? 8 : null,
        9,
        10,
        11,
      ],
      codesToReturn: [
        '770002701',
        '770002702',
        '770002703',
        '770002704',
        '770002705',
        '770002706',
        '770002707',
        '770002708',
        '770002709',
        '770002710',
        '770002711',
        '770002712',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 0,
      side: 'LEFT',
    },
    2600010: {
      // ENG 1 FIRE
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([eng1FireTest, fireButton1]) => eng1FireTest || fireButton1,
        this.eng1FireTest,
        this.fireButton1,
      ),
      whichCodeToReturn: () => [
        0,
        this.throttle1Position.get() !== 0 && !this.aircraftOnGround.get() ? 1 : null,
        (this.throttle1Position.get() !== 0 || this.throttle2Position.get() !== 0) && this.aircraftOnGround.get()
          ? 2
          : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 3 : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 4 : null,
        this.aircraftOnGround.get() ? 5 : null,
        this.aircraftOnGround.get() ? 6 : null,
        !this.engine1ValueSwitch.get() ? null : 7,
        !this.fireButton1.get() ? 8 : null,
        !this.aircraftOnGround.get() && this.agent1Eng1Discharge.get() === 1 && !this.eng1Agent1PB.get() ? 9 : null,
        this.agent1Eng1Discharge.get() === 2 && !this.aircraftOnGround.get() && !this.eng1Agent1PB.get() ? 10 : null,
        !this.eng1Agent1PB.get() && this.aircraftOnGround.get() ? 11 : null,
        !this.eng1Agent2PB.get() && this.aircraftOnGround.get() ? 12 : null,
        this.aircraftOnGround.get() ? 13 : null,
        !this.aircraftOnGround.get() ? 14 : null,
        this.agent2Eng1Discharge.get() === 1 && !this.eng1Agent2PB.get() ? 15 : null,
        (this.agent2Eng1Discharge.get() === 1 && !this.eng1Agent2PB.get()) ||
        (this.agent2Eng1Discharge.get() === 2 && !this.eng1Agent2PB.get())
          ? 16
          : null,
      ],
      codesToReturn: [
        '260001001',
        '260001002',
        '260001003',
        '260001004',
        '260001005',
        '260001006',
        '260001007',
        '260001008',
        '260001009',
        '260001010',
        '260001011',
        '260001012',
        '260001013',
        '260001014',
        '260001015',
        '260001016',
        '260001017',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 0,
      side: 'LEFT',
    },
    2600020: {
      // ENG 2 FIRE
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([eng2FireTest, fireButton2]) => eng2FireTest || fireButton2,
        this.eng2FireTest,
        this.fireButton2,
      ),
      whichCodeToReturn: () => [
        0,
        this.throttle2Position.get() !== 0 && !this.aircraftOnGround.get() ? 1 : null,
        (this.throttle1Position.get() !== 0 || this.throttle2Position.get() !== 0) && this.aircraftOnGround.get()
          ? 2
          : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 3 : null,
        !this.parkBrake.get() && this.aircraftOnGround.get() ? 4 : null,
        this.aircraftOnGround.get() ? 5 : null,
        this.aircraftOnGround.get() ? 6 : null,
        !this.engine2ValueSwitch.get() ? null : 7,
        !this.fireButton2.get() ? 8 : null,
        !this.aircraftOnGround.get() && this.agent1Eng2Discharge.get() === 1 && !this.eng2Agent1PB.get() ? 9 : null,
        this.agent1Eng2Discharge.get() === 2 && !this.aircraftOnGround.get() && !this.eng2Agent1PB.get() ? 10 : null,
        !this.eng2Agent1PB.get() && this.aircraftOnGround.get() ? 11 : null,
        !this.eng2Agent2PB.get() && this.aircraftOnGround.get() ? 12 : null,
        this.aircraftOnGround.get() ? 13 : null,
        !this.aircraftOnGround.get() ? 14 : null,
        this.agent2Eng2Discharge.get() === 1 && !this.eng2Agent2PB.get() ? 15 : null,
        (this.agent2Eng2Discharge.get() === 1 && !this.eng2Agent2PB.get()) ||
        (this.agent2Eng2Discharge.get() === 2 && !this.eng2Agent2PB.get())
          ? 16
          : null,
      ],
      codesToReturn: [
        '260002001',
        '260002002',
        '260002003',
        '260002004',
        '260002005',
        '260002006',
        '260002007',
        '260002008',
        '260002009',
        '260002010',
        '260002011',
        '260002012',
        '260002013',
        '260002014',
        '260002015',
        '260002016',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 0,
      side: 'LEFT',
    },
    2600030: {
      // APU FIRE
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([apuFireTest, fireButtonAPU]) => apuFireTest || fireButtonAPU,
        this.apuFireTest,
        this.fireButtonAPU,
      ),
      whichCodeToReturn: () => [
        0,
        !this.fireButtonAPU.get() ? 1 : null,
        this.agentAPUDischarge.get() === 1 && !this.apuAgentPB.get() ? 2 : null,
        this.agentAPUDischarge.get() === 2 && !this.apuAgentPB.get() ? 3 : null,
        this.apuMasterSwitch.get() === 1 ? 4 : null,
      ],
      codesToReturn: ['260003001', '260003002', '260003003', '260003004', '260003005'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 6,
      side: 'LEFT',
    },
    2700052: {
      // FLAP LVR NOT ZERO
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.flapsLeverNotZeroWarning,
      whichCodeToReturn: () => [0],
      codesToReturn: ['270005201'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
    },
    2700085: {
      // SLATS NOT IN TO CONFIG
      flightPhaseInhib: [5, 6, 7, 8],
      auralWarning: this.slatConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.slatConfigWarning,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['270008501', '270008502'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
    },
    2700090: {
      // FLAPS NOT IN TO CONFIG
      flightPhaseInhib: [5, 6, 7, 8],
      auralWarning: this.flapConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.flapConfigWarning,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['270009001', '270009002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
    },
    2700110: {
      // ELAC 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.elac1FaultConfirmNodeOutput,
      whichCodeToReturn: () => [
        0,
        this.elac1FaultLine123Display.get() ? 1 : null,
        this.elac1FaultLine123Display.get() ? 2 : null,
        this.elac1FaultLine123Display.get() ? 3 : null,
        this.elac1FaultLine45Display.get() ? 4 : null,
        this.elac1FaultLine45Display.get() ? 5 : null,
      ],
      codesToReturn: ['270011001', '270011002', '270011003', '270011004', '270011005', '270011006'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700120: {
      // ELAC 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.elac2FaultConfirmNodeOutput,
      whichCodeToReturn: () => [
        0,
        this.elac2FaultLine123Display.get() ? 1 : null,
        this.elac2FaultLine123Display.get() ? 2 : null,
        this.elac2FaultLine123Display.get() ? 3 : null,
        this.elac2FaultLine45Display.get() ? 4 : null,
        this.elac2FaultLine45Display.get() ? 5 : null,
      ],
      codesToReturn: ['270012001', '270012002', '270012003', '270012004', '270012005', '270012006'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700210: {
      // SEC 1 FAULT
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.sec1FaultCondition,
      whichCodeToReturn: () => [
        0,
        this.sec1FaultLine123Display.get() ? 1 : null,
        this.sec1FaultLine123Display.get() ? 2 : null,
        this.sec1FaultLine123Display.get() ? 3 : null,
        this.sec1FaultLine45Display.get() ? 4 : null,
      ],
      codesToReturn: ['270021001', '270021002', '270021003', '270021004', '270021005'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700220: {
      // SEC 2 FAULT
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.sec2FaultCondition,
      whichCodeToReturn: () => [
        0,
        this.sec2FaultLine123Display.get() ? 1 : null,
        this.sec2FaultLine123Display.get() ? 2 : null,
        this.sec2FaultLine123Display.get() ? 3 : null,
      ],
      codesToReturn: ['270022001', '270022002', '270022003', '270022004'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700230: {
      // SEC 3 FAULT
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.sec3FaultCondition,
      whichCodeToReturn: () => [
        0,
        this.sec3FaultLine123Display.get() ? 1 : null,
        this.sec3FaultLine123Display.get() ? 2 : null,
        this.sec3FaultLine123Display.get() ? 3 : null,
      ],
      codesToReturn: ['270023001', '270023002', '270023003', '270023004'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700240: {
      // PITCH TRIM CONFIG
      flightPhaseInhib: [5, 6, 7, 8],
      auralWarning: this.pitchTrimNotToAudio.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.pitchTrimNotToWarning,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['270024001', '270024002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 10,
      side: 'LEFT',
    },
    2700340: {
      // SPD BRK NOT RETRACTED
      flightPhaseInhib: [5, 6, 7, 8],
      auralWarning: this.speedbrakesConfigAural.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.speedbrakesConfigWarning,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['270034001', '270034002'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 10,
      side: 'LEFT',
    },
    2700360: {
      // FCDC 1+2 FAULT
      flightPhaseInhib: [3, 4, 5, 7],
      simVarIsActive: this.fcdc12FaultCondition,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['270036001', '270036002'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700365: {
      // DIRECT LAW
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.directLawCondition,
      whichCodeToReturn: () => [0, 1, 2, 3, 4, null, 6, 7],
      codesToReturn: [
        '270036501',
        '270036502',
        '270036503',
        '270036504',
        '270036505',
        '270036506',
        '270036507',
        '270036508',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700373: {
      // RUDDER TRIM CONFIG
      flightPhaseInhib: [5, 6, 7, 8],
      auralWarning: this.rudderTrimNotToAudio.map((on) => (on ? FwcAuralWarning.Crc : FwcAuralWarning.None)),
      simVarIsActive: this.rudderTrimNotToWarning,
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['270037301', '270037302'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 10,
      side: 'LEFT',
    },
    2700375: {
      // ALTN 2
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.altn2LawConfirmNodeOutput,
      whichCodeToReturn: () => [0, 1, null, 3, 4, null, 6],
      codesToReturn: ['270037501', '270037502', '270037503', '270037504', '270037505', '270037506', '270037507'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700390: {
      // ALTN 1
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.altn1LawConfirmNodeOutput,
      whichCodeToReturn: () => [0, 1, null, 3, 4, null, 6],
      codesToReturn: ['270039001', '270039002', '270039003', '270039004', '270039005', '270039006', '270039007'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 10,
      side: 'LEFT',
    },
    2700400: {
      // L+R ELEV FAULT
      flightPhaseInhib: [],
      simVarIsActive: this.lrElevFaultCondition,
      whichCodeToReturn: () => [0, 1, 2, null, null, 5],
      codesToReturn: ['270040001', '270040002', '270040003', '270040004', '270040005', '270040006'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 10,
      side: 'LEFT',
    },
    2700460: {
      // PITCH TRIM/MCDU/CG DISAGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([pitchTrimMcduCgDisagree, flapsAndPitchMcduDisagreeEnable]) =>
          pitchTrimMcduCgDisagree && flapsAndPitchMcduDisagreeEnable,
        this.pitchTrimMcduCgDisagree,
        this.flapsAndPitchMcduDisagreeEnable,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['270046001', '270046002'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    2700466: {
      // FLAPS/MCDU DISGREE
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([flapsMcduDisagree, flapsNotToMemo, flapsAndPitchMcduDisagreeEnable]) =>
          flapsMcduDisagree && !flapsNotToMemo && flapsAndPitchMcduDisagreeEnable,
        this.flapsMcduDisagree,
        this.flapsNotToMemo,
        this.flapsAndPitchMcduDisagreeEnable,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['270046501'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    2700502: {
      // SPD BRK STILL OUT
      flightPhaseInhib: [1, 2, 3, 4, 5, 8, 9, 10],
      simVarIsActive: this.speedBrakeStillOutWarning,
      whichCodeToReturn: () => [0],
      codesToReturn: ['270050201'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    2700555: {
      // FCDC 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fcdc1FaultCondition,
      whichCodeToReturn: () => [0],
      codesToReturn: ['270055501'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2700557: {
      // FCDC 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fcdc2FaultCondition,
      whichCodeToReturn: () => [0],
      codesToReturn: ['270055701'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2700870: {
      // GND SPLR NOT ARMED
      flightPhaseInhib: [1, 2, 3, 4, 5, 8, 9, 10],
      simVarIsActive: this.groundSpoilerNotArmedWarning,
      whichCodeToReturn: () => [0],
      codesToReturn: ['270087001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3200050: {
      // PK BRK ON
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([fwcFlightPhase, parkBrake]) => fwcFlightPhase === 3 && parkBrake,
        this.fwcFlightPhase,
        this.parkBrake,
      ),
      // TODO no separate slats indication
      whichCodeToReturn: () => [0],
      codesToReturn: ['320005001'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
    },
    2131221: {
      // EXCESS CAB ALT
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, excessPressure]) => !aircraftOnGround && excessPressure,
        this.aircraftOnGround,
        this.excessPressure,
      ),
      // TODO no separate slats indication
      whichCodeToReturn: () => [
        0,
        this.cabAltSetResetState1.get() ? 1 : null,
        this.cabAltSetResetState2.get() && this.seatBelt.get() !== 1 ? 2 : null,
        this.cabAltSetResetState2.get() ? 3 : null,
        this.cabAltSetResetState1.get() ? 4 : null,
        this.cabAltSetResetState2.get() &&
        (this.throttle1Position.get() !== 0 || this.throttle2Position.get() !== 0) &&
        this.autoThrustStatus.get() !== 2
          ? 5
          : null,
        this.cabAltSetResetState2.get() && !this.speedBrakeCommand.get() ? 6 : null,
        this.cabAltSetResetState2.get() ? 7 : null,
        this.cabAltSetResetState2.get() && this.engSelectorPosition.get() !== 2 ? 8 : null,
        this.cabAltSetResetState2.get() ? 9 : null,
        this.cabAltSetResetState1.get() && !this.cabAltSetResetState2.get() ? 10 : null,
        this.cabAltSetResetState2.get() ? 11 : null,
        this.cabAltSetResetState2.get() ? 12 : null,
        this.cabAltSetResetState2.get() ? 13 : null,
        14,
        15,
        16,
      ],
      codesToReturn: [
        '213122101',
        '213122102',
        '213122103',
        '213122104',
        '213122105',
        '213122106',
        '213122107',
        '213122108',
        '213122109',
        '213122110',
        '213122111',
        '213122112',
        '213122113',
        '213122114',
        '213122115',
        '213122116',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 2,
      side: 'LEFT',
    },
    2131222: {
      // SYS 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([cpc1Fault, cpc2Fault]) => cpc1Fault && !cpc2Fault,
        this.cpc1Fault,
        this.cpc2Fault,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['213122201'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: 2,
      side: 'LEFT',
    },
    2131223: {
      // SYS 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([cpc1Fault, cpc2Fault]) => !cpc1Fault && cpc2Fault,
        this.cpc1Fault,
        this.cpc2Fault,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['213122301'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: 2,
      side: 'LEFT',
    },
    2131224: {
      // SYS 1+2 FAULT
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.bothCpcFaultOutput,
      whichCodeToReturn: () => [0, this.pressurizationAuto.get() ? 1 : null, 2],
      codesToReturn: ['213122401', '213122402', '213122403'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
      side: 'LEFT',
    },
    2131231: {
      // LO DIFF PR
      flightPhaseInhib: [2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.lowDiffPress,
      whichCodeToReturn: () => [0, 1, 2],
      codesToReturn: ['213123101', '213123102', '213123103'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
      side: 'LEFT',
    },
    2131232: {
      // OFV NOT OPEN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8],
      simVarIsActive: this.outflowValveNotOpenOutput,
      whichCodeToReturn: () => [
        0,
        this.pressurizationAuto.get() ? 1 : null,
        this.outflowValveOpenAmount.get() < 95 ? 2 : null,
        this.pack1On.get() || this.pack2On.get() ? 3 : null,
        this.pack1On.get() ? 4 : null,
        this.pack2On.get() ? 5 : null,
      ],
      codesToReturn: ['213123201', '213123202', '213123203', '213123204', '213123205', '213123206'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
      side: 'LEFT',
    },
    2131233: {
      // SAFETY VALVE OPEN
      flightPhaseInhib: [4, 5, 7, 8, 9, 10],
      simVarIsActive: this.safetyValveNotClosedOutput,
      whichCodeToReturn: () => [
        0,
        this.cabinDeltaPressure.get() < 1 ? 1 : null,
        this.cabinDeltaPressure.get() < 1 ? 2 : null,
        this.cabinDeltaPressure.get() < 1 && !this.excessPressure.get() ? 3 : null,
        this.cabinDeltaPressure.get() > 4 && this.pressurizationAuto.get() ? 4 : null,
        this.cabinDeltaPressure.get() > 4 ? 5 : null,
        this.cabinDeltaPressure.get() > 4 ? 6 : null,
        this.cabinDeltaPressure.get() > 4 ? 7 : null,
        this.cabinDeltaPressure.get() > 4 ? 8 : null,
      ],
      codesToReturn: [
        '213123301',
        '213123302',
        '213123303',
        '213123304',
        '213123305',
        '213123306',
        '213123307',
        '213123308',
        '213123309',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 2,
      side: 'LEFT',
    },
    2131235: {
      // EXCES RESIDUAL PR
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: this.excessResidualPr,
      whichCodeToReturn: () => [0, this.pack1On.get() ? 1 : null, this.pack2On.get() ? 2 : null, 3],
      codesToReturn: ['213123501', '213123502', '213123503', '213123504'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: 2,
      side: 'LEFT',
    },
    2161206: {
      // PACK 1+2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.pack1And2Fault,
      whichCodeToReturn: () => [
        0,
        this.pack1On.get() ? 1 : null,
        this.pack2On.get() ? 2 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 3 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 4 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 5 : null,
        !this.aircraftOnGround.get() && !this.ramAirOn.get() ? 6 : null,
        !this.aircraftOnGround.get() ? 7 : null,
      ],
      codesToReturn: [
        '216120601',
        '216120602',
        '216120603',
        '216120604',
        '216120605',
        '216120606',
        '216120607',
        '216120608',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
      side: 'LEFT',
    },
    2161202: {
      // PACK 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.acsc1Fault,
      whichCodeToReturn: () => [0, this.pack1On.get() ? 1 : null],
      codesToReturn: ['216120201', '216120202'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
      side: 'LEFT',
    },
    2161203: {
      // PACK 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.acsc2Fault,
      whichCodeToReturn: () => [0, this.pack2On.get() ? 1 : null],
      codesToReturn: ['216120301', '216120302'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
      side: 'LEFT',
    },
    2161207: {
      // PACK 1 ABNORMALLY OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.packOffNotFailed1Status,
      whichCodeToReturn: () => [0],
      codesToReturn: ['216120701'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
      side: 'LEFT',
    },
    2161208: {
      // PACK 2 ABNORMALLY OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.packOffNotFailed2Status,
      whichCodeToReturn: () => [0],
      codesToReturn: ['216120801'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 1,
      side: 'LEFT',
    },
    2161291: {
      // COND CTL 1-A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc1Lane1Fault, acsc1Lane2Fault]) => acsc1Lane1Fault && !acsc1Lane2Fault,
        this.acsc1Lane1Fault,
        this.acsc1Lane2Fault,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['216129101'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2161297: {
      // COND CTL 1-B FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc1Lane1Fault, acsc1Lane2Fault]) => !acsc1Lane1Fault && acsc1Lane2Fault,
        this.acsc1Lane1Fault,
        this.acsc1Lane2Fault,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['216129701'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2161294: {
      // COND CTL 2-A FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc2Lane1Fault, acsc2Lane2Fault]) => acsc2Lane1Fault && !acsc2Lane2Fault,
        this.acsc2Lane1Fault,
        this.acsc2Lane2Fault,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['216129401'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2161298: {
      // COND CTL 2-B FAULT
      flightPhaseInhib: [2, 3, 4, 5, 6, 7, 8, 9],
      simVarIsActive: MappedSubject.create(
        ([acsc2Lane1Fault, acsc2Lane2Fault]) => !acsc2Lane1Fault && acsc2Lane2Fault,
        this.acsc2Lane1Fault,
        this.acsc2Lane2Fault,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['216129801'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2163210: {
      // CKPT DUCT OVHT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.ckptDuctOvht,
      whichCodeToReturn: () => [0, 1, null, 3], // TODO: Add support for Fahrenheit
      codesToReturn: ['216321001', '216321002', '216321003', '216321004'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
      side: 'LEFT',
    },
    2163211: {
      // FWD DUCT OVHT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.fwdDuctOvht,
      whichCodeToReturn: () => [0, 1, null, 3], // TODO: Add support for Fahrenheit
      codesToReturn: ['216321101', '216321102', '216321103', '216321104'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
      side: 'LEFT',
    },
    2163212: {
      // AFT DUCT OVHT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.aftDuctOvht,
      whichCodeToReturn: () => [0, 1, null, 3], // TODO: Add support for Fahrenheit
      codesToReturn: ['216321201', '216321202', '216321203', '216321204'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
      side: 'LEFT',
    },
    2163218: {
      // L+R CAB FAN FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([cabFanHasFault1, cabFanHasFault2]) => cabFanHasFault1 && cabFanHasFault2,
        this.cabFanHasFault1,
        this.cabFanHasFault2,
      ),
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['216321801', '216321802'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
      side: 'LEFT',
    },
    2163260: {
      // LAV+GALLEY FAN FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.lavGalleyFanFault,
      whichCodeToReturn: () => [0],
      codesToReturn: ['216326001'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2163290: {
      // HOT AIR FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.hotAirDisagrees,
      whichCodeToReturn: () => [
        0,
        this.hotAirPbOn.get() ? 1 : null,
        this.anyDuctOvht.get() && this.hotAirPbOn.get() ? 2 : null,
        this.anyDuctOvht.get() && this.pack1On.get() ? 3 : null,
        this.anyDuctOvht.get() && this.pack2On.get() ? 4 : null,
      ],
      codesToReturn: ['216329001', '216329002', '216329003', '216329004', '216329005'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 7,
      side: 'LEFT',
    },
    2163305: {
      // TRIM AIR SYS FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.trimAirFault,
      whichCodeToReturn: () => [
        0,
        this.ckptTrimFault.get() ? 1 : null,
        this.fwdTrimFault.get() ? 2 : null,
        this.aftTrimFault.get() ? 3 : null,
        this.trimAirHighPressure.get() ? 4 : null,
      ],
      codesToReturn: ['216330501', '216330502', '216330503', '216330504', '216330505'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    2600150: {
      // SMOKE FWD CARGO SMOKE
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: this.cargoFireTest,
      // TODO no separate slats indication
      whichCodeToReturn: () => [
        0,
        SimVar.GetSimVarValue('L:A32NX_OVHD_VENT_CAB_FANS_PB_IS_ON', 'bool') === 1 ? 2 : null,
        [1, 10].includes(this.fwcFlightPhase.get()) && !this.cargoFireAgentDisch.get() ? 3 : null,
        !this.cargoFireAgentDisch.get() ? 4 : null,
        !this.aircraftOnGround.get() ? 5 : null,
        !this.aircraftOnGround.get() ? 6 : null,
        this.aircraftOnGround.get() ? 7 : null,
        this.aircraftOnGround.get() ? 8 : null,
      ],
      codesToReturn: [
        '260015001',
        '260015002',
        '260015003',
        '260015004',
        '260015005',
        '260015006',
        '260015007',
        '260015008',
        '260015009',
      ],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
    },
    7700647: {
      // THR LEVERS NOT SET  (on ground)
      flightPhaseInhib: [1, 4, 5, 6, 7, 8, 10],
      simVarIsActive: MappedSubject.create(
        ([throttle1Position, throttle2Position, thrustLeverNotSet]) =>
          (throttle1Position !== 35 && thrustLeverNotSet) || (throttle2Position !== 35 && thrustLeverNotSet),
        this.throttle1Position,
        this.throttle2Position,
        this.thrustLeverNotSet,
      ),
      whichCodeToReturn: () => [
        0,
        this.autothrustLeverWarningFlex.get() ? 1 : null,
        this.autothrustLeverWarningToga.get() ? 2 : null,
      ],
      codesToReturn: ['770064701', '770064702', '770064703'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3200060: {
      // NW ANTI SKID INACTIVE
      flightPhaseInhib: [4, 5],
      simVarIsActive: this.antiskidActive.map((v) => !v),
      whichCodeToReturn: () => [0, 1],
      codesToReturn: ['320006001', '320006002'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 9,
      side: 'LEFT',
    },
    3200150: {
      // GEAR NOT DOWN
      flightPhaseInhib: [3, 4, 5],
      simVarIsActive: this.lgNotDownNoCancel,
      whichCodeToReturn: () => [0],
      codesToReturn: ['320015001'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: false,
    },
    3200155: {
      // GEAR NOT DOWN
      flightPhaseInhib: [3, 4, 5, 6],
      simVarIsActive: MappedSubject.create(
        ([noCancel, lgNotDown]) => !noCancel && lgNotDown,
        this.lgNotDownNoCancel,
        this.lgNotDown,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['320015501'],
      memoInhibit: () => false,
      failure: 3,
      sysPage: -1,
      side: 'LEFT',
      cancel: true,
    },
    3200180: {
      // LGCIU 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([lgciu1Fault, lgciu2Fault, dcESSBusPowered]) =>
          lgciu1Fault && !(lgciu1Fault && lgciu2Fault) && dcESSBusPowered,
        this.lgciu1Fault,
        this.lgciu2Fault,
        this.dcESSBusPowered,
      ),
      whichCodeToReturn: () => [0, !SimVar.GetSimVarValue('L:A32NX_GPWS_SYS_OFF', 'Bool') ? 1 : null],
      codesToReturn: ['320018001', '320018002'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    3200190: {
      // LGCIU 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([lgciu1Fault, lgciu2Fault, dc2BusPowered]) => lgciu2Fault && !(lgciu1Fault && lgciu2Fault) && dc2BusPowered,
        this.lgciu1Fault,
        this.lgciu2Fault,
        this.dc2BusPowered,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['320019001'],
      memoInhibit: () => false,
      failure: 1,
      sysPage: -1,
      side: 'LEFT',
    },
    3200195: {
      // LGCIU 1+2 FAULT
      flightPhaseInhib: [4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([lgciu1Fault, lgciu2Fault, dc2BusPowered, dcESSBusPowered]) =>
          lgciu1Fault && lgciu2Fault && dc2BusPowered && dcESSBusPowered,
        this.lgciu1Fault,
        this.lgciu2Fault,
        this.dc2BusPowered,
        this.dcESSBusPowered,
      ),
      whichCodeToReturn: () => [0, 1, !SimVar.GetSimVarValue('L:A32NX_GPWS_SYS_OFF', 'Bool') ? 2 : null],
      codesToReturn: ['320019501', '320019502', '320019503'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 9,
      side: 'LEFT',
    },
    3400140: {
      // RA 1 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([height1Failed, ac1BusPowered]) => height1Failed && ac1BusPowered,
        this.height1Failed,
        this.ac1BusPowered,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['340014001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3400150: {
      // RA 2 FAULT
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([height2Failed, ac2BusPowered]) => height2Failed && ac2BusPowered,
        this.height2Failed,
        this.ac2BusPowered,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['340015001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3400500: {
      // TCAS FAULT
      flightPhaseInhib: [1, 3, 4, 5, 7, 8, 10],
      simVarIsActive: this.tcasFault,
      whichCodeToReturn: () => [0],
      codesToReturn: ['340050001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3400507: {
      // NAV TCAS STBY (in flight)
      flightPhaseInhib: [1, 2, 3, 4, 5, 7, 8, 9, 10],
      simVarIsActive: this.tcasSensitivity.map((v) => v === 1),
      whichCodeToReturn: () => [0],
      codesToReturn: ['340050701'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3200010: {
      // L/G-BRAKES OVHT
      flightPhaseInhib: [4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([toConfigNormal, fwcFlightPhase, brakesHot]) => (toConfigNormal || fwcFlightPhase === 3) && brakesHot,
        this.toConfigNormal,
        this.fwcFlightPhase,
        this.brakesHot,
      ),
      whichCodeToReturn: () => [
        0,
        !this.aircraftOnGround.get() ? 1 : null,
        [1, 10].includes(this.fwcFlightPhase.get()) ? 2 : null,
        !this.aircraftOnGround.get() ? 3 : null,
        [1, 2].includes(this.fwcFlightPhase.get()) && !this.brakeFan.get() ? 4 : null,
        this.aircraftOnGround.get() ? 5 : null,
        !this.aircraftOnGround.get() ? 6 : null,
        !this.aircraftOnGround.get() ? 7 : null,
        !this.aircraftOnGround.get() ? 8 : null,
      ],
      codesToReturn: [
        '320001001',
        '320001002',
        '320001003',
        '320001004',
        '320001005',
        '320001006',
        '320001007',
        '320001008',
        '320001009',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 9,
      side: 'LEFT',
    },
    3081186: {
      // SEVERE ICE DETECTED
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.iceSevereDetectedTimerStatus,
      whichCodeToReturn: () => [0, !this.wingAntiIce.get() ? 1 : null, this.engSelectorPosition.get() !== 2 ? 2 : null],
      codesToReturn: ['308128001', '308128002', '308128003'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    3081280: {
      // ICE DETECTED
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.iceDetectedTimer2Status,
      whichCodeToReturn: () => [0, !this.eng1AntiIce.get() ? 1 : null, !this.eng2AntiIce.get() ? 2 : null],
      codesToReturn: ['308128001', '308128002', '308128003'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: -1,
      side: 'LEFT',
    },
    2900126: {
      // *HYD  - Blue reservoir overheat
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.blueRvrOvht,
      whichCodeToReturn: () => [0, this.blueElecPumpPBAuto.get() ? 1 : null],
      codesToReturn: ['290012601', '290012602'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
      side: 'LEFT',
    },
    2900127: {
      // *HYD  - Yellow reservoir overheat
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.yellowRvrOvht,
      whichCodeToReturn: () => [
        0,
        this.ptuAuto.get() ? 1 : null,
        this.eng2pumpPBisAuto.get() ? 2 : null,
        !this.yepumpPBisAuto.get() ? 3 : null,
      ],
      codesToReturn: ['290012701', '290012702', '290012703', '290012704'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
      side: 'LEFT',
    },
    2900128: {
      // *HYD  - Green reservoir overheat
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.greenRvrOvht,
      whichCodeToReturn: () => [0, this.ptuAuto.get() ? 1 : null, this.eng1pumpPBisAuto.get() ? 2 : null],
      codesToReturn: ['290012801', '290012802', '290012803'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
      side: 'LEFT',
    },
    2900310: {
      // *HYD  - Blue
      flightPhaseInhib: [1, 4, 5, 10],
      simVarIsActive: MappedSubject.create(
        ([blueRvrOvht, blueRvrLow, blueElecPumpPBAuto, dcESSBusPowered, ac1BusPowered, blueLP, emergencyGeneratorOn]) =>
          !(blueRvrOvht || blueRvrLow || !blueElecPumpPBAuto) &&
          (!dcESSBusPowered || !ac1BusPowered) &&
          blueLP &&
          !emergencyGeneratorOn,
        this.blueRvrOvht,
        this.blueRvrLow,
        this.blueElecPumpPBAuto,
        this.dcESSBusPowered,
        this.ac1BusPowered,
        this.blueLP,
        this.emergencyGeneratorOn,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['290031001'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
      side: 'RIGHT',
    },
    2900312: {
      // *HYD  - Green Engine 1 //
      flightPhaseInhib: [1, 2, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([greenLP, eng1pumpPBisAuto, emergencyGeneratorOn]) =>
          greenLP &&
          // && ENG 1 OUT - not implemented
          eng1pumpPBisAuto &&
          !emergencyGeneratorOn,
        this.greenLP,
        this.eng1pumpPBisAuto,
        this.emergencyGeneratorOn,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['290031201'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 4,
      side: 'RIGHT',
    },
    2800145: {
      // L+R WING TK LO LVL
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.lrTankLow,
      whichCodeToReturn: () => [
        0,
        1,
        !this.leftFuelPump1Auto.get() ? 2 : null,
        !this.leftFuelPump2Auto.get() ? 3 : null,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump1Auto.get() ? 4 : null,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump1Auto.get() ? 5 : null,
        this.rightFuelPump1Auto.get() ? null : 6,
        this.rightFuelPump2Auto.get() ? null : 7,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump2Auto.get() ? 8 : null,
        this.centerFuelQuantity.get() > 250 && !this.centerFuelPump2Auto.get() ? 9 : null,
        !this.fuelXFeedPBOn.get() ? 10 : null,
        !this.fuelXFeedPBOn.get() ? 11 : null,
        this.fuelXFeedPBOn.get() ? 12 : null, // TODO: Gravity feed signals
        this.fuelXFeedPBOn.get() ? 13 : null, // TODO: Gravity feed signals
      ],
      codesToReturn: [
        '280014501',
        '280014502',
        '280014503',
        '280014504',
        '280014505',
        '280014506',
        '280014507',
        '280014508',
        '280014509',
        '280014510',
        '280014511',
        '280014512',
        '280014513',
        '280014514',
      ],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 5,
      side: 'LEFT',
    },
    2800130: {
      // L WING TK LO LVL
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.leftFuelLow,
      whichCodeToReturn: () => [
        0,
        !this.fuelCtrTankModeSelMan.get() ? 1 : null,
        !this.fuelXFeedPBOn.get() ? 2 : null,
        !this.fuelXFeedPBOn.get() ? 3 : null,
        !this.fuelXFeedPBOn.get() ? 4 : null,
        this.leftFuelPump1Auto.get() ? 5 : null,
        this.leftFuelPump2Auto.get() ? 6 : null,
      ],
      codesToReturn: ['280013001', '280013002', '280013003', '280013004', '280013005', '280013006', '280013007'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 5,
      side: 'LEFT',
    },
    2800140: {
      // R WING TK LO LVL
      flightPhaseInhib: [3, 4, 5, 7, 8, 9],
      simVarIsActive: this.rightFuelLow,
      whichCodeToReturn: () => [
        0,
        !this.fuelCtrTankModeSelMan.get() ? 1 : null,
        !this.fuelXFeedPBOn.get() ? 2 : null,
        !this.fuelXFeedPBOn.get() ? 3 : null,
        !this.fuelXFeedPBOn.get() ? 4 : null,
        this.rightFuelPump1Auto.get() ? 5 : null,
        this.rightFuelPump2Auto.get() ? 6 : null,
      ],
      codesToReturn: ['280014001', '280014002', '280014003', '280014004', '280014005', '280014006', '280014007'],
      memoInhibit: () => false,
      failure: 2,
      sysPage: 5,
      side: 'LEFT',
    },
  };

  ewdMessageMemos: EWDMessageDict = {
    '0000010': {
      // T.O MEMO
      flightPhaseInhib: [1, 3, 6, 10],
      simVarIsActive: this.toMemo.map((t) => !!t),
      whichCodeToReturn: () => [
        this.autoBrake.get() === 3 ? 1 : 0,
        SimVar.GetSimVarValue('L:A32NX_NO_SMOKING_MEMO', 'bool') === 1 &&
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1
          ? 3
          : 2,
        SimVar.GetSimVarValue('L:A32NX_CABIN_READY', 'bool') ? 5 : 4,
        this.spoilersArmed.get() ? 7 : 6,
        this.slatFlapSelectionS18F10 || this.slatFlapSelectionS22F15 || this.slatFlapSelectionS22F20 ? 9 : 8,
        this.toConfigNormal.get() ? 11 : 10,
      ],
      codesToReturn: [
        '000001001',
        '000001002',
        '000001003',
        '000001004',
        '000001005',
        '000001006',
        '000001007',
        '000001008',
        '000001009',
        '000001010',
        '000001011',
        '000001012',
      ],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000020': {
      // LANDING MEMO
      flightPhaseInhib: [1, 2, 3, 4, 5, 9, 10],
      simVarIsActive: this.ldgMemo.map((t) => !!t),
      whichCodeToReturn: () => [
        this.isAllGearDownlocked ? 1 : 0,
        SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'enum') !== 2 &&
        SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool') === 1
          ? 3
          : 2,
        SimVar.GetSimVarValue('L:A32NX_CABIN_READY', 'bool') ? 5 : 4,
        this.spoilersArmed.get() ? 7 : 6,
        !SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') &&
        SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') !== 4
          ? 8
          : null,
        !SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') &&
        SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 4
          ? 9
          : null,
        SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') === 1 &&
        SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') !== 3
          ? 10
          : null,
        SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS3', 'bool') === 1 &&
        SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum') === 3
          ? 11
          : null,
      ],
      codesToReturn: [
        '000002001',
        '000002002',
        '000002003',
        '000002004',
        '000002005',
        '000002006',
        '000002007',
        '000002008',
        '000002009',
        '000002010',
        '000002011',
        '000002012',
      ],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000050': {
      // REFUELING
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([fuel, usrStartRefueling]) => !!(fuel === 100 || usrStartRefueling),
        this.fuel,
        this.usrStartRefueling,
      ),

      whichCodeToReturn: () => [0],
      codesToReturn: ['000005001'],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000030': {
      // IR IN ALIGN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([adirsRemainingAlignTime, adiru1State, adiru2State, adiru3State]) => {
          const remainingTimeAbove240 = adirsRemainingAlignTime >= 240;
          const allInState1 = adiru1State === 1 && adiru2State === 1 && adiru3State === 1;

          return remainingTimeAbove240 && allInState1;
        },
        this.adirsRemainingAlignTime,
        this.adiru1State,
        this.adiru2State,
        this.adiru3State,
      ),
      whichCodeToReturn: () => [
        this.adirsMessage1(
          this.adirsRemainingAlignTime.get(),
          (this.engine1State.get() > 0 && this.engine1State.get() < 4) ||
            (this.engine2State.get() > 0 && this.engine2State.get() < 4),
        ),
      ],
      codesToReturn: [
        '000003001',
        '000003002',
        '000003003',
        '000003004',
        '000003005',
        '000003006',
        '000003007',
        '000003008',
      ],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000031': {
      // IR IN ALIGN
      flightPhaseInhib: [3, 4, 5, 6, 7, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([adirsRemainingAlignTime, adiru1State, adiru2State, adiru3State]) => {
          const remainingTimeAbove0 = adirsRemainingAlignTime > 0;
          const remainingTimeBelow240 = adirsRemainingAlignTime < 240;
          const allInState1 = adiru1State === 1 && adiru2State === 1 && adiru3State === 1;

          return remainingTimeAbove0 && remainingTimeBelow240 && allInState1;
        },
        this.adirsRemainingAlignTime,
        this.adiru1State,
        this.adiru2State,
        this.adiru3State,
      ),
      whichCodeToReturn: () => [
        this.adirsMessage2(
          this.adirsRemainingAlignTime.get(),
          (this.engine1State.get() > 0 && this.engine1State.get() < 4) ||
            (this.engine2State.get() > 0 && this.engine2State.get() < 4),
        ),
      ],
      codesToReturn: [
        '000003101',
        '000003102',
        '000003103',
        '000003104',
        '000003105',
        '000003106',
        '000003107',
        '000003108',
      ],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000055': {
      // SPOILERS ARMED
      flightPhaseInhib: [],
      simVarIsActive: this.spoilersArmed,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000005501'],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000080': {
      // SEAT BELTS
      flightPhaseInhib: [],
      simVarIsActive: this.seatBelt.map((v) => !!v),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000008001'],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000090': {
      // NO SMOKING
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([noSmoking, configPortableDevices]) => noSmoking === 1 && !configPortableDevices,
        this.noSmoking,
        this.configPortableDevices,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000009001'],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000095': {
      // PORTABLE DEVICES
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([noSmoking, configPortableDevices]) => noSmoking === 1 && !!configPortableDevices,
        this.noSmoking,
        this.configPortableDevices,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000009501'],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000100': {
      // STROBE LIGHT OFF
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([aircraftOnGround, strobeLightsOn]) => !!(!aircraftOnGround && strobeLightsOn === 2),
        this.aircraftOnGround,
        this.strobeLightsOn,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000010001'],
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000105': {
      // OUTR TK FUEL XFRD
      flightPhaseInhib: [], // Plus check that outer tanks not empty
      simVarIsActive: MappedSubject.create(
        ([leftOuterInnerValve, rightOuterInnerValve]) => !!leftOuterInnerValve || !!rightOuterInnerValve,
        this.leftOuterInnerValve,
        this.rightOuterInnerValve,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000010501'], // config memo
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000305': {
      // GPWS FLAP MODE OFF
      flightPhaseInhib: [],
      simVarIsActive: this.gpwsFlapMode.map((v) => !!v),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000030501'], // Not inhibited
      memoInhibit: () => this.toMemo.get() === 1 || this.ldgMemo.get() === 1,
      failure: 0,
      sysPage: -1,
      side: 'LEFT',
    },
    '0000140': {
      // T.O. INHIBIT
      flightPhaseInhib: [],
      simVarIsActive: this.showTakeoffInhibit,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000014001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000150': {
      // LDG INHIBIT
      flightPhaseInhib: [],
      simVarIsActive: this.showLandingInhibit,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000015001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000350': {
      // LAND ASAP RED
      flightPhaseInhib: [],
      simVarIsActive: this.landAsapRed,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000035001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000360': {
      // LAND ASAP AMBER
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([landAsapRed, aircraftOnGround, engine1State, engine2State]) =>
          !landAsapRed && !aircraftOnGround && (engine1State === 0 || engine2State === 0),
        this.landAsapRed,
        this.aircraftOnGround,
        this.engine1State,
        this.engine2State,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000036001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000060': {
      // SPEED BRK
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([speedBrakeCommand, fwcFlightPhase]) => speedBrakeCommand && ![1, 8, 9, 10].includes(fwcFlightPhase),
        this.speedBrakeCommand,
        this.fwcFlightPhase,
      ),
      whichCodeToReturn: () => [this.amberSpeedBrake.get() ? 1 : 0],
      codesToReturn: ['000006001', '000006002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000200': {
      // PARK BRK
      flightPhaseInhib: [3, 4, 5, 6, 7, 8],
      simVarIsActive: this.parkBrake,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000020001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    // 32 LANDING GEAR
    320000001: {
      // AUTO BRK OFF
      flightPhaseInhib: [1, 2, 3, 4, 5, 6, 7, 10],
      simVarIsActive: this.autoBrakeOff,
      whichCodeToReturn: () => [0],
      codesToReturn: ['320000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000040': {
      // NW STRG DISC
      flightPhaseInhib: [],
      simVarIsActive: this.nwSteeringDisc,
      whichCodeToReturn: () => [this.engineOnFor30Seconds.read() ? 1 : 0],
      codesToReturn: ['000004001', '000004002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000160': {
      // PTU ON
      flightPhaseInhib: [],
      simVarIsActive: this.hydPTU,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000016001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000210': {
      // RAT OUT
      flightPhaseInhib: [],
      simVarIsActive: this.ratDeployed.map((v) => v > 0),
      whichCodeToReturn: () => [[1, 2].includes(this.fwcFlightPhase.get()) ? 1 : 0],
      codesToReturn: ['000021001', '000021002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000070': {
      // IGNITION
      flightPhaseInhib: [],
      simVarIsActive: this.engSelectorPosition.map((v) => v === 2),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000007001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000540': {
      // PRED W/S OFF
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([predWSOn, fwcFlightPhase]) => !predWSOn && ![1, 10].includes(fwcFlightPhase),
        this.predWSOn,
        this.fwcFlightPhase,
      ),
      whichCodeToReturn: () => [
        [3, 4, 5, 7, 8, 9].includes(this.fwcFlightPhase.get()) || this.toConfigNormal.get() ? 1 : 0,
      ],
      codesToReturn: ['000054001', '000054002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000545': {
      // TERR OFF
      flightPhaseInhib: [1, 10],
      simVarIsActive: this.gpwsTerrOff,
      whichCodeToReturn: () => [
        [3, 4, 5, 7, 8, 9].includes(this.fwcFlightPhase.get()) || this.toConfigNormal.get() ? 1 : 0,
      ],
      codesToReturn: ['000054501', '000054502'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000320': {
      // TCAS STBY
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([tcasSensitivity, fwcFlightPhase]) => tcasSensitivity === 1 && fwcFlightPhase !== 6,
        this.tcasSensitivity,
        this.fwcFlightPhase,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000032001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000325': {
      // TCAS STBY in flight
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([tcasSensitivity, fwcFlightPhase]) => tcasSensitivity === 1 && fwcFlightPhase === 6,
        this.tcasSensitivity,
        this.fwcFlightPhase,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000032501'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000552': {
      // COMPANY MESSAGE
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.compMesgCount.map((v) => v > 0),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000055201'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000260': {
      // ENG ANTI ICE
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: MappedSubject.create(
        ([eng1AntiIce, eng2AntiIce]) => eng1AntiIce || eng2AntiIce,
        this.eng1AntiIce,
        this.eng2AntiIce,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000026001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000270': {
      // WING ANTI ICE
      flightPhaseInhib: [],
      simVarIsActive: this.wingAntiIce,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000027001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000275': {
      // ICE NOT DETECTED
      flightPhaseInhib: [1, 2, 3, 4, 8, 9, 10],
      simVarIsActive: MappedSubject.create(
        ([iceNotDetTimer2Status, aircraftOnGround]) => iceNotDetTimer2Status && !aircraftOnGround,
        this.iceNotDetTimer2Status,
        this.aircraftOnGround,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000027501'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000170': {
      // APU AVAIL
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([apuAvail, apuBleedValveOpen]) => apuAvail === 1 && !apuBleedValveOpen,
        this.apuAvail,
        this.apuBleedValveOpen,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000017001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000180': {
      // APU BLEED
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([apuAvail, apuBleedValveOpen]) => apuAvail === 1 && apuBleedValveOpen,
        this.apuAvail,
        this.apuBleedValveOpen,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000018001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000190': {
      // LDG LT
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([leftLandingLightExtended, rightLandingLightExtended]) =>
          leftLandingLightExtended || rightLandingLightExtended,
        this.leftLandingLightExtended,
        this.rightlandingLightExtended,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000019001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000220': {
      // BRAKE FAN
      flightPhaseInhib: [],
      simVarIsActive: this.brakeFan,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000022001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000290': {
      // SWITCHING PNL
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([ndXfrKnob, dmcSwitchingKnob]) => ndXfrKnob !== 1 || dmcSwitchingKnob !== 1,
        this.ndXfrKnob,
        this.dmcSwitchingKnob,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000029001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000300': {
      // GPWS FLAPS 3
      flightPhaseInhib: [],
      simVarIsActive: this.gpwsFlaps3,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000030001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000022': {
      // AUTOBRAKE
      flightPhaseInhib: [],
      simVarIsActive: this.fwcFlightPhase.map((v) => v === 7 || v === 8),
      whichCodeToReturn: () => [this.autoBrake.get() - 1],
      codesToReturn: ['000002201', '000002202', '000002203', '000002204'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000230': {
      // MAN LANDING ELEVATION
      flightPhaseInhib: [],
      simVarIsActive: this.manLandingElevation,
      whichCodeToReturn: () => [0],
      codesToReturn: ['000023001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000250': {
      // FUEL X FEED
      flightPhaseInhib: [],
      simVarIsActive: this.fuelXFeedPBOn,
      whichCodeToReturn: () => [[3, 4, 5].includes(this.fwcFlightPhase.get()) ? 1 : 0],
      codesToReturn: ['000025001', '000025002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000680': {
      // ADIRS SWTG
      flightPhaseInhib: [],
      simVarIsActive: MappedSubject.create(
        ([airKnob, attKnob]) => attKnob !== 1 || airKnob !== 1,
        this.airKnob,
        this.attKnob,
      ),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000068001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    '0000567': {
      // VHF3 VOICE
      flightPhaseInhib: [3, 4, 5, 7, 8],
      simVarIsActive: this.voiceVhf3.map((v) => v !== 0),
      whichCodeToReturn: () => [0],
      codesToReturn: ['000056701'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    // 22 - Flight guidance
    220000001: {
      // A/THR OFF
      flightPhaseInhib: [],
      simVarIsActive: this.autoPilotOffShowMemo,
      whichCodeToReturn: () => [0],
      codesToReturn: ['220000001'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
    220000002: {
      // A/THR OFF
      flightPhaseInhib: [],
      simVarIsActive: this.autoThrustOffVoluntary,
      whichCodeToReturn: () => [0],
      codesToReturn: ['220000002'],
      memoInhibit: () => false,
      failure: 0,
      sysPage: -1,
      side: 'RIGHT',
    },
  };
}
