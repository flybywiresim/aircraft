// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Subject,
  MappedSubject,
  DebounceTimer,
  ConsumerValue,
  EventBus,
  ConsumerSubject,
  SimVarValueType,
  SubscribableMapFunctions,
  StallWarningEvents,
  MapSubject,
  KeyEvents,
  KeyEventManager,
  GameStateProvider,
  Wait,
  SetSubject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';

import {
  Arinc429Register,
  Arinc429RegisterSubject,
  Arinc429SignStatusMatrix,
  Arinc429Word,
  FailuresConsumer,
  FrequencyMode,
  MsfsFlightModelEvents,
  NXLogicConfirmNode,
  NXLogicMemoryNode,
  NXLogicPulseNode,
  NXLogicTriggeredMonostableNode,
  UpdateThrottler,
} from '@flybywiresim/fbw-sdk';
import { VerticalMode } from '@shared/autopilot';
import { VhfComManagerDataEvents } from '@flybywiresim/rmp';
import { PseudoFwcSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/PseudoFwcPublisher';
import {
  EcamAbnormalProcedures,
  EcamDeferredProcedures,
  EcamLimitations,
  EcamMemos,
  pfdMemoDisplay,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages';
import { ProcedureLinesGenerator } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/ProcedureLinesGenerator';
import PitchTrimUtils from '@shared/PitchTrimUtils';
import { ChecklistState, FwsEwdEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';
import { FwsMemos } from 'systems-host/systems/FlightWarningSystem/FwsMemos';
import { FwsNormalChecklists } from 'systems-host/systems/FlightWarningSystem/FwsNormalChecklists';
import {
  EwdAbnormalDict,
  EwdAbnormalItem,
  FwsAbnormalSensed,
} from 'systems-host/systems/FlightWarningSystem/FwsAbnormalSensed';
import { FwsAbnormalNonSensed } from 'systems-host/systems/FlightWarningSystem/FwsAbnormalNonSensed';
import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { Mle, Mmo, VfeF1, VfeF1F, VfeF2, VfeF3, VfeFF, Vle, Vmo } from '@shared/PerformanceConstants';
import { FwsAuralVolume, FwsSoundManager } from 'systems-host/systems/FlightWarningSystem/FwsSoundManager';
import { FwcFlightPhase, FwsFlightPhases } from 'systems-host/systems/FlightWarningSystem/FwsFlightPhases';
import { A380Failure } from '@failures';
import { FuelSystemEvents } from 'instruments/src/MsfsAvionicsCommon/providers/FuelSystemPublisher';

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

export enum FwcAuralWarning {
  None,
  SingleChime,
  Crc,
  CavalryCharge,
}

export class FwsCore {
  public readonly sub = this.bus.getSubscriber<
    PseudoFwcSimvars & StallWarningEvents & MfdSurvEvents & FuelSystemEvents & KeyEvents & MsfsFlightModelEvents
  >();

  private subs: Subscription[] = [];

  public readonly vhfSub = this.bus.getSubscriber<VhfComManagerDataEvents>();

  private readonly fwsUpdateThrottler = new UpdateThrottler(125); // has to be > 100 due to pulse nodes

  private keyEventManager: KeyEventManager;

  private readonly startupTimer = new DebounceTimer();

  public readonly startupCompleted = Subject.create(false);

  public readonly audioFunctionLost = Subject.create(false);

  public readonly fwsEcpFailed = Subject.create(false);

  public readonly soundManager = new FwsSoundManager(this.bus, this.startupCompleted, this.audioFunctionLost);

  private readonly flightPhases = new FwsFlightPhases(this);

  /** Time to inhibit master warnings and cautions during startup in ms */
  private static readonly FWC_STARTUP_TIME = 5000;

  /** Time to inhibit SCs after one is trigger in ms */
  private static readonly AURAL_SC_INHIBIT_TIME = 2000;

  private static readonly EWD_MESSAGE_LINES = 10;

  private static readonly PFD_MEMO_LINES = 3;

  private static readonly PFD_LIMITATIONS_LINES = 8;

  private static readonly EWD_LIMITATIONS_LINES = 10;

  private static readonly SD_STATUS_INFO_MAX_LINES = 5;

  private static readonly SD_STATUS_INOP_SYS_MAX_LINES = 10;

  private static readonly ewdMessageSimVarsLeft = Array.from(
    { length: FwsCore.EWD_MESSAGE_LINES },
    (_, i) => `L:A32NX_EWD_LOWER_LEFT_LINE_${i + 1}`,
  );

  private readonly ewdMessageLinesLeft = Array.from({ length: FwsCore.EWD_MESSAGE_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly ewdMessageSimVarsRight = Array.from(
    { length: FwsCore.EWD_MESSAGE_LINES },
    (_, i) => `L:A32NX_EWD_LOWER_RIGHT_LINE_${i + 1}`,
  );

  private readonly ewdMessageLinesRight = Array.from({ length: FwsCore.EWD_MESSAGE_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly pfdMemoSimVars = Array.from(
    { length: FwsCore.PFD_MEMO_LINES },
    (_, i) => `L:A32NX_PFD_MEMO_LINE_${i + 1}`,
  );

  private readonly pfdMemoLines = Array.from({ length: FwsCore.PFD_MEMO_LINES }, (_, _i) => Subject.create(''));

  private static readonly sdStatusInfoSimVars = Array.from(
    { length: FwsCore.SD_STATUS_INFO_MAX_LINES },
    (_, i) => `L:A32NX_SD_STATUS_INFO_LINE_${i + 1}`,
  );

  private readonly sdStatusInfoLines = Array.from({ length: FwsCore.SD_STATUS_INFO_MAX_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly sdStatusInopAllPhasesSimVars = Array.from(
    { length: FwsCore.SD_STATUS_INOP_SYS_MAX_LINES },
    (_, i) => `L:A32NX_SD_STATUS_INOP_ALL_LINE_${i + 1}`,
  );

  private readonly sdStatusInopAllPhasesLines = Array.from({ length: FwsCore.SD_STATUS_INOP_SYS_MAX_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly sdStatusInopApprLdgSimVars = Array.from(
    { length: FwsCore.SD_STATUS_INOP_SYS_MAX_LINES },
    (_, i) => `L:A32NX_SD_STATUS_INOP_LDG_LINE_${i + 1}`,
  );

  private readonly sdStatusInopApprLdgLines = Array.from({ length: FwsCore.SD_STATUS_INOP_SYS_MAX_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly pfdLimitationsSimVars = Array.from(
    { length: FwsCore.PFD_LIMITATIONS_LINES },
    (_, i) => `L:A32NX_PFD_LIMITATIONS_LINE_${i + 1}`,
  );

  private readonly pfdLimitationsLines = Array.from({ length: FwsCore.PFD_LIMITATIONS_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly ewdLimitationsAllPhasesSimVars = Array.from(
    { length: FwsCore.EWD_LIMITATIONS_LINES },
    (_, i) => `L:A32NX_EWD_LIMITATIONS_ALL_LINE_${i + 1}`,
  );

  private readonly ewdLimitationsAllPhasesLines = Array.from({ length: FwsCore.EWD_LIMITATIONS_LINES }, (_, _i) =>
    Subject.create(''),
  );

  private static readonly ewdLimitationsApprLdgSimVars = Array.from(
    { length: FwsCore.EWD_LIMITATIONS_LINES },
    (_, i) => `L:A32NX_EWD_LIMITATIONS_LDG_LINE_${i + 1}`,
  );

  private readonly ewdLimitationsApprLdgLines = Array.from({ length: FwsCore.EWD_LIMITATIONS_LINES }, (_, _i) =>
    Subject.create(''),
  );

  // SD STATUS NORMAL
  private readonly statusNormal = MappedSubject.create(
    ([limAll, limAppr, inopAll, inopAppr]) => !limAll && !limAppr && !inopAll && !inopAppr,
    this.ewdLimitationsAllPhasesLines[0],
    this.ewdLimitationsApprLdgLines[0],
    this.sdStatusInopAllPhasesLines[0],
    this.sdStatusInopApprLdgLines[0],
  );

  // Input buffering
  public readonly toConfigInputBuffer = new NXLogicMemoryNode(false);
  public readonly clearButtonInputBuffer = new NXLogicMemoryNode(false);
  public readonly recallButtonInputBuffer = new NXLogicMemoryNode(false);
  public readonly clInputBuffer = new NXLogicMemoryNode(false);
  public readonly clCheckInputBuffer = new NXLogicMemoryNode(false);
  public readonly clUpInputBuffer = new NXLogicMemoryNode(false);
  public readonly clDownInputBuffer = new NXLogicMemoryNode(false);
  public readonly abnProcInputBuffer = new NXLogicMemoryNode(false);
  public readonly aThrDiscInputBuffer = new NXLogicMemoryNode(false);
  public readonly apDiscInputBuffer = new NXLogicMemoryNode(false);

  /* PSEUDO FWC VARIABLES */

  /** Keys/IDs of all failures currently active, irrespective they are already cleared or not */
  public readonly allCurrentFailures: string[] = [];

  /** Keys/IDs of only the failures which are currently presented on the EWD */
  public readonly presentedFailures: string[] = [];

  /** Keys/IDs of the active abnormal non-sensed procedures */
  public readonly activeAbnormalNonSensedKeys: SetSubject<number> = SetSubject.create([]);

  /** Map to hold all failures which are currently active */
  public readonly presentedAbnormalProceduresList = MapSubject.create<string, ChecklistState>();

  /** Map to hold all failures which are currently active */
  public readonly clearedAbnormalProceduresList = MapSubject.create<string, ChecklistState>();

  /** Map to hold all deferred procs which are currently active */
  public readonly activeDeferredProceduresList = MapSubject.create<string, ChecklistState>();

  /** Indices of items which were updated */
  public readonly abnormalUpdatedItems = new Map<string, number[]>();

  /** Indices of items which were updated */
  public readonly deferredUpdatedItems = new Map<string, number[]>();

  public recallFailures: string[] = [];

  private requestMasterCautionFromFaults = false;
  private requestMasterCautionFromABrkOff = false;
  private requestMasterCautionFromAThrOff = false;

  private requestSingleChimeFromAThrOff = false;

  private requestMasterWarningFromFaults = false;
  private requestMasterWarningFromApOff = false;

  private auralCrcKeys: string[] = [];

  private auralScKeys: string[] = [];

  public readonly auralCrcActive = Subject.create(false);

  private auralSingleChimePending = false;

  public readonly auralSingleChimeInhibitTimer = new DebounceTimer();

  public readonly auralSingleChimePlayingTimer = new DebounceTimer();

  public readonly masterWarning = Subject.create(false);

  public readonly masterCaution = Subject.create(false);

  private nonCancellableWarningCount = 0;

  public readonly stallWarning = Subject.create(false);

  public readonly masterCautionOutput = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.masterCaution,
    this.startupCompleted,
  );

  public readonly masterWarningOutput = MappedSubject.create(
    ([mw, stall, startup]) => (mw || stall) && startup,
    this.masterWarning,
    this.stallWarning,
    this.startupCompleted,
  );

  public readonly ecamStsNormal = Subject.create(true);

  public readonly ecamEwdShowStsIndication = Subject.create(false);

  public readonly ecamEwdShowFailurePendingIndication = Subject.create(false);

  public readonly fwcOut126 = Arinc429RegisterSubject.createEmpty();

  public readonly approachAutoDisplayQnhSetPulseNode = new NXLogicPulseNode(true);
  public readonly approachAutoDisplaySlatsExtendedPulseNode = new NXLogicPulseNode(true);

  /* MISC STUFF */

  public readonly airKnob = Subject.create(0);

  public readonly airDataCaptOn3 = this.airKnob.map((it) => it === 0);

  public readonly airDataFoOn3 = this.airKnob.map((it) => it === 0);

  public readonly attKnob = Subject.create(0);

  public readonly compMesgCount = Subject.create(0);

  public readonly fmsSwitchingKnob = Subject.create(0);

  public readonly landAsapRed = Subject.create(false);

  public readonly ndXfrKnob = Subject.create(0);

  private readonly landingElevation = Arinc429Register.empty();

  public readonly highLandingFieldElevation = Subject.create(false);

  public readonly noMobileSwitchPosition = Subject.create(0);

  public readonly predWSOn = Subject.create(false);

  public readonly seatBelt = Subject.create(0);

  public readonly strobeLightsOn = Subject.create(0);

  public readonly toConfigNormal = Subject.create(false);

  public readonly wingAntiIce = Subject.create(false);

  public readonly voiceVhf3 = Subject.create(false);

  /* 21 - AIR CONDITIONING AND PRESSURIZATION */

  public readonly flightLevel = Subject.create(0);

  public readonly phase8ConfirmationNode60 = new NXLogicConfirmNode(60);

  public readonly phase8ConfirmationNode180 = new NXLogicConfirmNode(180);

  public readonly fdac1Channel1Failure = Subject.create(false);

  public readonly fdac1Channel2Failure = Subject.create(false);

  public readonly fdac2Channel1Failure = Subject.create(false);

  public readonly fdac2Channel2Failure = Subject.create(false);

  public readonly pack1RedundLost = Subject.create(false);

  public readonly pack2RedundLost = Subject.create(false);

  public readonly pack1Degraded = Subject.create(false);

  public readonly pack2Degraded = Subject.create(false);

  public readonly pack1On = Subject.create(false);

  public readonly pack2On = Subject.create(false);

  public readonly pack1Off = Subject.create(false);

  public readonly pack2Off = Subject.create(false);

  public readonly pack1And2Fault = Subject.create(false);

  public readonly ramAirOn = Subject.create(false);

  public readonly cabinAirExtractOn = Subject.create(false);

  public readonly numberOfCabinFanFaults = Subject.create(0);

  public readonly allCabinFansFault = Subject.create(false);

  public readonly bulkCargoHeaterFault = Subject.create(false);

  public readonly fwdIsolValveOpen = Subject.create(false);

  public readonly fwdIsolValvePbOn = Subject.create(false);

  public readonly fwdIsolValveFault = Subject.create(false);

  public readonly bulkIsolValveOpen = Subject.create(false);

  public readonly bulkIsolValvePbOn = Subject.create(false);

  public readonly bulkIsolValveFault = Subject.create(false);

  public readonly hotAir1Disagrees = Subject.create(false);

  public readonly hotAir2Disagrees = Subject.create(false);

  public readonly hotAir1Open = Subject.create(false);

  public readonly hotAir2Open = Subject.create(false);

  public readonly hotAir1PbOn = Subject.create(false);

  public readonly hotAir2PbOn = Subject.create(false);

  public readonly taddChannel1Failure = Subject.create(false);

  public readonly taddChannel2Failure = Subject.create(false);

  public readonly tempCtlFault = Subject.create(false);

  public readonly oneTcsAppFailed = Subject.create(false);

  public readonly tempCtrDegraded = Subject.create(false);

  public readonly vcmFwdChannel1Failure = Subject.create(false);

  public readonly vcmFwdChannel2Failure = Subject.create(false);

  public readonly vcmAftChannel1Failure = Subject.create(false);

  public readonly vcmAftChannel2Failure = Subject.create(false);

  public readonly fwdVentCtrDegraded = Subject.create(false);

  public readonly fwdVentRedundLost = Subject.create(false);

  public readonly aftVentCtrDegraded = Subject.create(false);

  public readonly aftVentRedundLost = Subject.create(false);

  public readonly apuBleedValveOpen = Subject.create(false);

  public readonly enginesOffAndOnGroundSignal = new NXLogicConfirmNode(7);

  public readonly excessCabinAltitude = Subject.create(false);

  public readonly excessDiffPressure = Subject.create(false);

  public readonly diffPressure = Arinc429Register.empty();

  public readonly allOutflowValvesOpen = Subject.create(false);

  public readonly ocsm1AutoFailure = Subject.create(false);

  public readonly ocsm2AutoFailure = Subject.create(false);

  public readonly ocsm3AutoFailure = Subject.create(false);

  public readonly ocsm4AutoFailure = Subject.create(false);

  public readonly ocsmAutoCtlFault = Subject.create(false);

  public readonly ocsm1Failure = Subject.create(false);

  public readonly ocsm2Failure = Subject.create(false);

  public readonly ocsm3Failure = Subject.create(false);

  public readonly ocsm4Failure = Subject.create(false);

  public readonly pressRedundLost = Subject.create(false);

  public readonly pressSysFault = Subject.create(false);

  public readonly flowSelectorKnob = Subject.create(0);

  public readonly manCabinAltMode = Subject.create(false);

  private readonly cabinAltitude = Arinc429Register.empty();

  private readonly cabinAltitudeTarget = Arinc429Register.empty();

  /* 22 - AUTOFLIGHT */

  public readonly toConfigAndNoToSpeedsPulseNode = new NXLogicPulseNode();

  /** TO speeds not inserted RS */
  public toSpeedsNotInserted = false;

  public readonly toSpeedsNotInsertedWarning = Subject.create(false);

  /** TO CONF pressed in phase 2 or 3 SR */
  private toConfigCheckedInPhase2Or3 = false;

  public readonly toSpeedsTooLowWarning = Subject.create(false);

  public readonly toV2VRV2DisagreeWarning = Subject.create(false);

  public readonly fmcAFault = Subject.create(false);

  public readonly fmcBFault = Subject.create(false);

  public readonly fmcCFault = Subject.create(false);

  public readonly fms1Fault = Subject.create(false);

  public readonly fms2Fault = Subject.create(false);

  /** If multiple AP discs are triggered between FWS cycles, memorize the amount */
  public autoPilotInstinctiveDiscCountSinceLastFwsCycle = 0;

  public readonly autoPilotDisengagedInstantPulse = new NXLogicPulseNode(false);

  /** 1.8s according to references, but was raised to 1.9s to allow for triple click to finish */
  public readonly autoPilotInstinctiveDiscPressedInLast1p9Sec = new NXLogicTriggeredMonostableNode(1.9, true);

  /** 1.8s according to references, but was raised to 1.9s to allow for triple click to finish */
  public readonly autoPilotInstinctiveDiscPressedTwiceInLast1p9Sec = new NXLogicTriggeredMonostableNode(1.9, true);

  /** Prohibits that CRC can be cancelled before even hearing it */
  public readonly autoPilotFirstCavalryStillWithinFirst0p3s = new NXLogicTriggeredMonostableNode(0.3, true);

  public readonly autoPilotInstinctiveDiscPressedPulse = new NXLogicPulseNode(true);

  /** Stay in first warning stage for 1.8s. Raised to 1.9s to allow for triple click to finish */
  public readonly autoPilotOffVoluntaryEndAfter1p9s = new NXLogicTriggeredMonostableNode(1.9, true);

  public readonly autoPilotOffVoluntaryFirstCavalryChargeActive = new NXLogicTriggeredMonostableNode(0.9, true);

  public readonly autoPilotOffVoluntaryFirstCavalryChargeActivePulse = new NXLogicPulseNode(false);

  public readonly autoPilotOffVoluntaryDiscPulse = new NXLogicPulseNode(true);

  public readonly autoPilotOffVoluntaryMemory = new NXLogicMemoryNode(true);

  public readonly autoPilotOffInvoluntaryMemory = new NXLogicMemoryNode(false);

  public readonly autoPilotOffInvoluntary = Subject.create(false);

  public readonly autoPilotOffUnacknowledged = new NXLogicMemoryNode(false);

  public readonly autoPilotOffShowMemo = Subject.create(false);

  public readonly approachCapability = Subject.create(0);

  public readonly approachCapabilityDowngradeDebounce = new NXLogicTriggeredMonostableNode(1, true);

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

  /* 23 - COMMUNICATION */
  public readonly rmp1Fault = Subject.create(false);

  public readonly rmp2Fault = Subject.create(false);

  public readonly rmp3Fault = Subject.create(false);

  public readonly rmp1Off = Subject.create(false);

  public readonly rmp2Off = Subject.create(false);

  public readonly rmp3Off = Subject.create(false);

  public readonly rmp3ActiveMode = ConsumerSubject.create(this.vhfSub.on(`vhf_com_active_mode_3`), FrequencyMode.Data);

  /* 24 - ELECTRICAL */

  public readonly ac1BusPowered = Subject.create(false);

  public readonly ac2BusPowered = Subject.create(false);

  public readonly ac3BusPowered = Subject.create(false);

  public readonly ac4BusPowered = Subject.create(false);

  public readonly acESSBusPowered = Subject.create(false);

  public readonly dcESSBusPowered = Subject.create(false);

  public readonly dc1BusPowered = Subject.create(false);

  public readonly dc2BusPowered = Subject.create(false);

  public readonly extPwrConnected = Subject.create(false);

  public readonly engine1Running = Subject.create(false);

  public readonly engine2Running = Subject.create(false);

  public readonly engine3Running = Subject.create(false);

  public readonly engine4Running = Subject.create(false);

  public readonly allBatteriesOff = Subject.create(false);
  /* 26 - FIRE */

  public readonly fduDiscreteWord = Arinc429Register.empty();

  public readonly apuFireDetected = Subject.create(false);

  public readonly eng1FireDetected = Subject.create(false);

  public readonly eng2FireDetected = Subject.create(false);

  public readonly eng3FireDetected = Subject.create(false);

  public readonly eng4FireDetected = Subject.create(false);

  public readonly apuFireDetectedAural = Subject.create(false);

  public readonly eng1FireDetectedAural = Subject.create(false);

  public readonly eng2FireDetectedAural = Subject.create(false);

  public readonly eng3FireDetectedAural = Subject.create(false);

  public readonly eng4FireDetectedAural = Subject.create(false);

  public readonly mlgFireDetected = Subject.create(false);

  public readonly apuAgentDischarged = Subject.create(false);

  public readonly eng1Agent1Discharged = Subject.create(false);

  public readonly eng1Agent2Discharged = Subject.create(false);

  public readonly eng2Agent1Discharged = Subject.create(false);

  public readonly eng2Agent2Discharged = Subject.create(false);

  public readonly eng3Agent1Discharged = Subject.create(false);

  public readonly eng3Agent2Discharged = Subject.create(false);

  public readonly eng4Agent1Discharged = Subject.create(false);

  public readonly eng4Agent2Discharged = Subject.create(false);

  public readonly apuLoopAFault = Subject.create(false);

  public readonly apuLoopBFault = Subject.create(false);

  public readonly eng1LoopAFault = Subject.create(false);

  public readonly eng1LoopBFault = Subject.create(false);

  public readonly eng2LoopAFault = Subject.create(false);

  public readonly eng2LoopBFault = Subject.create(false);

  public readonly eng3LoopAFault = Subject.create(false);

  public readonly eng3LoopBFault = Subject.create(false);

  public readonly eng4LoopAFault = Subject.create(false);

  public readonly eng4LoopBFault = Subject.create(false);

  public readonly mlgLoopAFault = Subject.create(false);

  public readonly mlgLoopBFault = Subject.create(false);

  public readonly evacCommand = Subject.create(false);

  public readonly cargoFireAgentDisch = Subject.create(false);

  public readonly cargoFireTest = Subject.create(false);

  public readonly fireButtonEng1 = Subject.create(false);

  public readonly fireButtonEng2 = Subject.create(false);

  public readonly fireButtonEng3 = Subject.create(false);

  public readonly fireButtonEng4 = Subject.create(false);

  public readonly fireButtonAPU = Subject.create(false);

  public readonly allFireButtons = Subject.create(false);

  public readonly fireTestPb = Subject.create(false);

  /* 27 - FLIGHT CONTROLS */

  public readonly altn1LawConfirmNode = new NXLogicConfirmNode(0.3, true);

  public readonly altn1LawConfirmNodeOutput = Subject.create(false);

  public readonly altn2LawConfirmNode = new NXLogicConfirmNode(0.3, true);

  public readonly altn2LawConfirmNodeOutput = Subject.create(false);

  public readonly directLawCondition = Subject.create(false);

  public readonly elac1HydConfirmNode = new NXLogicConfirmNode(3, false);

  public readonly elac1FaultConfirmNode = new NXLogicConfirmNode(0.6, true);

  public readonly elac1FaultConfirmNodeOutput = Subject.create(false);

  public readonly elac1FaultLine123Display = Subject.create(false);

  public readonly elac1FaultLine45Display = Subject.create(false);

  public readonly elac1HydConfirmNodeOutput = Subject.create(false);

  public readonly elac2FaultConfirmNode = new NXLogicConfirmNode(0.6, true);

  public readonly elac2FaultConfirmNodeOutput = Subject.create(false);

  public readonly elac2FaultLine123Display = Subject.create(false);

  public readonly elac2FaultLine45Display = Subject.create(false);

  public readonly elac2HydConfirmNode = new NXLogicConfirmNode(3, false);

  public readonly elac2HydConfirmNodeOutput = Subject.create(false);

  public readonly fcdc1FaultCondition = Subject.create(false);

  public readonly fcdc12FaultCondition = Subject.create(false);

  public readonly fcdc2FaultCondition = Subject.create(false);

  public readonly flapsAngle = Subject.create(0);

  public readonly flapsHandle = Subject.create(0);

  public readonly lrElevFaultCondition = Subject.create(false);

  public readonly sec1Healthy = Subject.create(false);

  public readonly sec2Healthy = Subject.create(false);

  public readonly sec3Healthy = Subject.create(false);

  public readonly sec1FaultCondition = Subject.create(false);
  public readonly sec1OffThenOnPulseNode = new NXLogicPulseNode(true);
  public readonly sec1OffThenOnMemoryNode = new NXLogicMemoryNode();

  public readonly sec2FaultCondition = Subject.create(false);
  public readonly sec2OffThenOnPulseNode = new NXLogicPulseNode(true);
  public readonly sec2OffThenOnMemoryNode = new NXLogicMemoryNode();

  public readonly sec3FaultCondition = Subject.create(false);
  public readonly sec3OffThenOnPulseNode = new NXLogicPulseNode(true);
  public readonly sec3OffThenOnMemoryNode = new NXLogicMemoryNode();

  public readonly prim2Healthy = Subject.create(false);

  public readonly prim3Healthy = Subject.create(false);

  public readonly showLandingInhibit = Subject.create(false);

  public readonly showTakeoffInhibit = Subject.create(false);

  public readonly slatsAngle = Subject.create(0);

  public readonly speedBrakeCommand = Subject.create(false);

  public readonly spoilersArmed = Subject.create(false);

  public slatFlapSelectionS0F0 = false;

  public slatFlapSelectionS18F10 = false;

  public slatFlapSelectionS22F15 = false;

  public slatFlapSelectionS22F20 = false;

  public readonly flapsInferiorTo8Deg = Subject.create(false);

  public readonly flapsSuperiorTo8Deg = Subject.create(false);

  public readonly flapsSuperiorTo17Deg = Subject.create(false);

  public readonly flapsSuperiorTo26Deg = Subject.create(false);

  public readonly slatsInferiorTo20Deg = Subject.create(false);

  public readonly flapsInConf3OrFull = Subject.create(false);

  public readonly flapsNotTo = Subject.create(false);

  public readonly flapsNotToMemo = Subject.create(false);

  public readonly flapConfigSr = new NXLogicMemoryNode(true);

  public readonly flapConfigAural = Subject.create(false);

  public readonly flapConfigWarning = Subject.create(false);

  public readonly slatsNotTo = Subject.create(false);

  public readonly slatConfigSr = new NXLogicMemoryNode(true);

  public readonly slatConfigAural = Subject.create(false);

  public readonly slatConfigWarning = Subject.create(false);

  public readonly speedbrakesNotTo = Subject.create(false);

  public readonly speedbrakesConfigSr = new NXLogicMemoryNode(true);

  public readonly speedbrakesConfigAural = Subject.create(false);

  public readonly speedbrakesConfigWarning = Subject.create(false);

  public readonly flapsMcduDisagree = Subject.create(false);

  public readonly flapsAndPitchMcduDisagreeEnable = Subject.create(false);

  public readonly pitchConfigInPhase3or4or5Sr = new NXLogicMemoryNode(true);

  public readonly pitchTrimNotTo = Subject.create(false);

  public readonly pitchTrimNotToAudio = Subject.create(false);

  public readonly pitchTrimNotToWarning = Subject.create(false);

  public readonly pitchTrimMcduCgDisagree = Subject.create(false);

  public readonly trimDisagreeMcduStabConf = new NXLogicConfirmNode(1, true);

  public readonly rudderTrimConfigInPhase3or4or5Sr = new NXLogicMemoryNode(true);

  public readonly rudderTrimNotTo = Subject.create(false);

  public readonly rudderTrimNotToAudio = Subject.create(false);

  public readonly rudderTrimNotToWarning = Subject.create(false);

  public readonly rudderTrimPosition = Subject.create(0);

  public readonly flapsLeverNotZeroWarning = Subject.create(false);

  public readonly speedBrakeCommand5sConfirm = new NXLogicConfirmNode(5, true);

  public readonly speedBrakeCommand50sConfirm = new NXLogicConfirmNode(50, true);

  public readonly speedBrakeCaution1Confirm = new NXLogicConfirmNode(30, true);

  public readonly engAboveIdleWithSpeedBrakeConfirm = new NXLogicConfirmNode(10, false);

  public readonly apTcasRaNoseUpConfirm = new NXLogicConfirmNode(4, true);

  public readonly speedBrakeCaution3Confirm = new NXLogicConfirmNode(3, true);

  public readonly speedBrakeCaution3Monostable = new NXLogicTriggeredMonostableNode(1.5, true);

  public readonly speedBrakeCaution1Pulse = new NXLogicPulseNode(true);

  public readonly speedBrakeCaution2Pulse = new NXLogicPulseNode(true);

  public readonly speedBrakeStillOutWarning = Subject.create(false);

  public readonly amberSpeedBrake = Subject.create(false);

  public readonly phase104s5Trigger = new NXLogicTriggeredMonostableNode(4.5, false);

  public readonly groundSpoiler5sDelayed = new NXLogicConfirmNode(5, false);

  public readonly speedBrake5sDelayed = new NXLogicConfirmNode(5, false);

  public readonly groundSpoilerNotArmedWarning = Subject.create(false);

  public readonly taxiInFlap0Check = new NXLogicConfirmNode(60, false);

  /* FUEL */

  public readonly engine1ValueSwitch = ConsumerSubject.create(this.sub.on('fuel_valve_switch_1'), false);

  public readonly engine2ValueSwitch = ConsumerSubject.create(this.sub.on('fuel_valve_switch_2'), false);

  public readonly engine3ValueSwitch = ConsumerSubject.create(this.sub.on('fuel_valve_switch_3'), false);

  public readonly engine4ValueSwitch = ConsumerSubject.create(this.sub.on('fuel_valve_switch_4'), false);

  public readonly allFuelPumpsOff = Subject.create(false);

  // Only check feed pumps for now, heavy enough
  private readonly feedTankPumps = Array.from(Array(8), (_, idx) =>
    ConsumerSubject.create(this.sub.on(`fuel_pump_active_${idx + 1}`), false),
  );

  public readonly feedTank1Low = Subject.create(false);

  public readonly feedTank1LowConfirm = new NXLogicConfirmNode(30, true);

  public readonly feedTank2Low = Subject.create(false);

  public readonly feedTank2LowConfirm = new NXLogicConfirmNode(30, true);

  public readonly feedTank3Low = Subject.create(false);

  public readonly feedTank3LowConfirm = new NXLogicConfirmNode(30, true);

  public readonly feedTank4Low = Subject.create(false);

  public readonly rightFuelLow = Subject.create(false);

  public readonly rightFuelLowConfirm = new NXLogicConfirmNode(30, true);

  public readonly feedTank4LowConfirm = new NXLogicConfirmNode(30, true);

  public readonly crossFeed1ValveOpen = Subject.create(false);
  public readonly crossFeed2ValveOpen = Subject.create(false);
  public readonly crossFeed3ValveOpen = Subject.create(false);
  public readonly crossFeed4ValveOpen = Subject.create(false);
  public readonly allCrossFeedValvesOpen = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.crossFeed1ValveOpen,
    this.crossFeed2ValveOpen,
    this.crossFeed3ValveOpen,
    this.crossFeed4ValveOpen,
  );

  public readonly allFeedTankPumpsOn = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.engine1ValueSwitch,
    this.engine2ValueSwitch,
    this.engine3ValueSwitch,
    this.engine4ValueSwitch,
  );

  public readonly crossFeedOpenMemo = MappedSubject.create(
    ([cf1, cf2, cf3, cf4]) => [cf1, cf2, cf3, cf4].filter((c) => c === true).length >= 2,
    this.crossFeed1ValveOpen,
    this.crossFeed2ValveOpen,
    this.crossFeed3ValveOpen,
    this.crossFeed4ValveOpen,
  );

  public readonly fmsZeroFuelWeight = Arinc429Register.empty();
  public readonly fmsZeroFuelWeightCg = Arinc429Register.empty();

  public readonly fmsZfwOrZfwCgNotSet = Subject.create(false);

  private readonly fuelOnBoard = ConsumerSubject.create(this.sub.on('fuel_on_board'), 0);

  private readonly refuelPanel = ConsumerSubject.create(this.sub.on('msfs_interactive_point_open_18'), 0);

  private readonly fuelingInitiated = ConsumerSubject.create(this.sub.on('fuel_refuel_started_by_user'), false);

  private readonly fuelingTarget = ConsumerSubject.create(this.sub.on('fuel_desired_by_user'), null);

  public readonly refuelPanelOpen = MappedSubject.create(
    ([refuelPanelOpen, fuelingInprogress]) => !!refuelPanelOpen || fuelingInprogress,
    this.refuelPanel,
    this.fuelingInitiated,
  );

  private readonly isRefuelFuelTarget = MappedSubject.create(
    ([fuelOnBoard, targetFuel]) => fuelOnBoard <= targetFuel,
    this.fuelOnBoard,
    this.fuelingTarget,
  );

  public readonly refuelInProgress = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.isRefuelFuelTarget,
    this.fuelingInitiated,
  );

  public readonly defuelInProgress = MappedSubject.create(
    ([fuelingInitiated, refuel]) => fuelingInitiated && !refuel,
    this.fuelingInitiated,
    this.isRefuelFuelTarget,
  );

  /* HYDRAULICS */

  public readonly ratDeployed = Subject.create(0);

  public readonly greenAPumpOn = Subject.create(false);

  public readonly greenBPumpOn = Subject.create(false);

  public readonly greenAPumpAuto = Subject.create(false);

  private readonly greenAPumpLoPressConfNode = new NXLogicConfirmNode(3);

  public readonly greenAPumpFault = Subject.create(false);

  private readonly greenBPumpLoPressConfNode = new NXLogicConfirmNode(3);

  public readonly greenBPumpFault = Subject.create(false);

  public readonly greenBPumpAuto = Subject.create(false);

  public readonly yellowAPumpOn = Subject.create(false);

  public readonly yellowBPumpOn = Subject.create(false);

  public readonly yellowAPumpAuto = Subject.create(false);

  public readonly yellowBPumpAuto = Subject.create(false);

  public readonly yellowAPumpFault = Subject.create(false);

  private readonly yellowAPumpLoPressConfNode = new NXLogicConfirmNode(3);

  public readonly yellowBPumpFault = Subject.create(false);

  private readonly yellowBPumpLoPressConfNode = new NXLogicConfirmNode(3);

  public readonly eng1APumpAuto = Subject.create(false);

  private readonly eng1APumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng1BPumpAuto = Subject.create(false);

  private readonly eng1BPumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng1APumpFault = Subject.create(false);

  public readonly eng1BPumpFault = Subject.create(false);

  public readonly eng1PumpDisc = Subject.create(false);

  public readonly eng2APumpAuto = Subject.create(false);

  private readonly eng2APumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng2BPumpAuto = Subject.create(false);

  private readonly eng2BPumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng2APumpFault = Subject.create(false);

  public readonly eng2BPumpFault = Subject.create(false);

  public readonly eng2PumpDisc = Subject.create(false);

  public readonly eng3APumpAuto = Subject.create(false);

  private readonly eng3APumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng3BPumpAuto = Subject.create(false);

  public readonly eng3APumpFault = Subject.create(false);

  public readonly eng3BPumpFault = Subject.create(false);

  private readonly eng3BPumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng3PumpDisc = Subject.create(false);

  public readonly eng4APumpAuto = Subject.create(false);

  private readonly eng4APumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng4BPumpAuto = Subject.create(false);

  private readonly eng4BPumpOffConfirmationNode = new NXLogicConfirmNode(10);

  public readonly eng4APumpFault = Subject.create(false);

  public readonly eng4BPumpFault = Subject.create(false);

  public readonly eng4PumpDisc = Subject.create(false);

  public readonly yellowAbnormLoPressure = Subject.create(false);

  public readonly yellowRsvLoAirPressure = Subject.create(false);

  public readonly yellowRsvOverheat = Subject.create(false);

  public readonly yellowRsvLoLevel = Subject.create(false);

  public readonly greenAbnormLoPressure = Subject.create(false);

  public readonly greenRsvLoAirPressure = Subject.create(false);

  public readonly greenRsvOverheat = Subject.create(false);

  public readonly greenRsvLoLevel = Subject.create(false);

  public readonly greenYellowAbnormLoPressure = Subject.create(false);

  private readonly eng1Or2RunningAndPhaseConfirmationNode = new NXLogicConfirmNode(1);

  private readonly eng3Or4RunningAndPhaseConfirmationNode = new NXLogicConfirmNode(1);

  public readonly threeYellowPumpsFailed = Subject.create(false);

  public readonly yellowElecAandBPumpOff = Subject.create(false);

  /* 31 - FWS */

  public readonly flightPhase = Subject.create<FwcFlightPhase | null>(null);

  public readonly flightPhase1Or2 = this.flightPhase.map((v) => v === 1 || v === 2);

  public readonly flightPhase128 = this.flightPhase.map((v) => v === 1 || v === 2 || v === 8);

  public readonly flightPhase23 = this.flightPhase.map((v) => v === 2 || v === 3);

  public readonly flightPhase345 = this.flightPhase.map((v) => v === 3 || v === 4 || v === 5);

  public readonly flightPhase34567 = this.flightPhase.map((v) => v === 3 || v === 4 || v === 5 || v === 6 || v === 7);

  public readonly flightPhase1211 = this.flightPhase.map((v) => v === 1 || v === 2 || v === 11);

  public readonly flightPhase89 = this.flightPhase.map((v) => v === 8 || v === 9);

  public readonly flightPhase910 = this.flightPhase.map((v) => v === 9 || v === 10);

  private readonly flightPhase112 = this.flightPhase.map((v) => v === 1 || v === 12);

  private readonly flightPhase6789 = this.flightPhase.map((v) => v === 6 || v === 7 || v === 8 || v === 9);

  private readonly flightPhase189 = this.flightPhase.map((v) => v === 1 || v === 8 || v === 9);

  private readonly flightPhase1112 = this.flightPhase.map((v) => v >= 11);

  private readonly flightPhase12Or1112 = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.flightPhase1Or2,
    this.flightPhase1112,
  );

  public readonly flightPhase1112MoreThanOneMin = Subject.create(false);

  public readonly flightPhase1112MoreThanOneMinConfNode = new NXLogicConfirmNode(60);

  public readonly ldgInhibitTimer = new NXLogicConfirmNode(3);

  public readonly toInhibitTimer = new NXLogicConfirmNode(3);

  /** TO CONFIG TEST raw button input */
  private toConfigTestRaw = false;

  /** TO CONFIG TEST pulse with 0.5s monostable trigger */
  private toConfigTest = false;

  public readonly toConfigPulseNode = new NXLogicPulseNode();

  public readonly toConfigTriggerNode = new NXLogicTriggeredMonostableNode(0.5, true);

  public readonly toConfigTestHeldMin1s5PulseNode = new NXLogicTriggeredMonostableNode(1.5, true);

  /** this will be true whenever the TO CONFIG TEST button is pressed, and stays on for a minimum of 1.5s */
  public readonly toConfigTestHeldMin1s5Pulse = Subject.create(false);

  private toConfigNormalConf = new NXLogicConfirmNode(0.3, false);

  public readonly clrPulseNode = new NXLogicPulseNode();

  public readonly rclUpPulseNode = new NXLogicPulseNode();

  public readonly clPulseNode = new NXLogicPulseNode();

  public readonly clCheckPulseNode = new NXLogicPulseNode();

  public readonly clUpPulseNode = new NXLogicPulseNode();

  public readonly clDownPulseNode = new NXLogicPulseNode();

  public readonly abnProcPulseNode = new NXLogicPulseNode();

  public readonly flightPhase3PulseNode = new NXLogicPulseNode();

  public readonly flightPhaseEndedPulseNode = new NXLogicPulseNode();

  public readonly flightPhaseInhibitOverrideNode = new NXLogicMemoryNode(false);

  public readonly manualCheckListReset = Subject.create(false);

  private readonly phase12ShutdownMemoryNode = new NXLogicMemoryNode();

  private readonly shutDownFor50MinutesClResetConfNode = new NXLogicConfirmNode(3000);

  public readonly shutDownFor50MinutesCheckListReset = Subject.create(false);

  /** If one of the ADR's CAS is above V1 - 4kts, confirm for 0.3s */
  public readonly v1SpeedConfirmNode = new NXLogicConfirmNode(0.3);

  /* LANDING GEAR AND LIGHTS */

  public readonly aircraftOnGround = Subject.create(false);

  public readonly antiSkidSwitchOff = Subject.create(false);

  public readonly brakesHot = Subject.create(false);

  public readonly phase815MinConfNode = new NXLogicConfirmNode(900);

  public readonly phase112 = this.flightPhase.map((v) => v === 1 || v === 12);

  public readonly lgciu1Fault = Subject.create(false);

  public readonly lgciu2Fault = Subject.create(false);

  public readonly lgciu1DiscreteWord1 = Arinc429Register.empty();

  public readonly lgciu2DiscreteWord1 = Arinc429Register.empty();

  public readonly lgciu1DiscreteWord2 = Arinc429Register.empty();

  public readonly lgciu2DiscreteWord2 = Arinc429Register.empty();

  public isAllGearDownlocked = false;

  public readonly nwSteeringDisc = Subject.create(false);

  public readonly parkBrake = Subject.create(false);

  private readonly parkBrake2sConfNode = new NXLogicConfirmNode(2);

  public readonly lgParkBrkOn = Subject.create(false);

  private readonly confingParkBrakeOnMemoryNode = new NXLogicMemoryNode();

  public readonly configParkBrakeOn = Subject.create(false);

  public readonly lgNotDown = Subject.create(false);

  public readonly lgNotDownNoCancel = Subject.create(false);

  public readonly lgLeverRedArrow = Subject.create(false);

  public readonly lgNotDownPulse1 = new NXLogicPulseNode();

  public readonly lgNotDownPulse2 = new NXLogicPulseNode();

  public readonly lgciu1OnGroundDisagreeConf = new NXLogicConfirmNode(1, true);

  public readonly lgciu1OnGroundAgreeConf = new NXLogicConfirmNode(0.5, true);

  public readonly lgciu1OnGroundDisagreeMem = new NXLogicMemoryNode(true);

  public readonly lgciu2OnGroundDisagreeConf = new NXLogicConfirmNode(1, true);

  public readonly lgciu2OnGroundAgreeConf = new NXLogicConfirmNode(0.5, true);

  public readonly lgciu2OnGroundDisagreeMem = new NXLogicMemoryNode(true);

  public readonly ra1OnGroundMem = new NXLogicMemoryNode(true);

  public readonly ra2OnGroundMem = new NXLogicMemoryNode(true);

  public readonly ra3OnGroundMem = new NXLogicMemoryNode(true);

  public readonly ignoreRaOnGroundTrigger = new NXLogicTriggeredMonostableNode(10, true);

  public readonly onGroundConf = new NXLogicConfirmNode(1, true);

  private onGroundImmediate = false;

  public readonly gearLeverPos = Subject.create(false);

  public readonly autoBrakeDeactivatedNode = new NXLogicTriggeredMonostableNode(9, false); // When ABRK deactivated, emit this for 9 sec

  public readonly autoBrakeOffAuralConfirmNode = new NXLogicConfirmNode(1, true);

  public readonly autoBrakeOff = Subject.create(false);

  public autoBrakeOffAuralTriggered = false;

  public autoBrakeOffMemoInhibited = false;

  public btvExitMissedPulseNode = new NXLogicPulseNode();

  /* NAVIGATION */

  public readonly adirsRemainingAlignTime = Subject.create(0);

  public readonly ir1Align = Subject.create(false);
  public readonly adiru1ModeSelector = Subject.create(0);

  public readonly ir2Align = Subject.create(false);
  public readonly adiru2ModeSelector = Subject.create(0);

  public readonly ir3Align = Subject.create(false);
  public readonly adiru3ModeSelector = Subject.create(0);

  public readonly adr1Cas = Arinc429RegisterSubject.createEmpty();
  public readonly adr2Cas = Arinc429RegisterSubject.createEmpty();
  public readonly adr3Cas = Arinc429RegisterSubject.createEmpty();

  public readonly adr1Mach = Arinc429RegisterSubject.createEmpty();
  public readonly adr2Mach = Arinc429RegisterSubject.createEmpty();
  public readonly adr3Mach = Arinc429RegisterSubject.createEmpty();

  public readonly adr1Faulty = Subject.create(false);
  public readonly adr2Faulty = Subject.create(false);
  public readonly adr3Faulty = Subject.create(false);

  private readonly adr3UsedLeft = Subject.create(false);
  private readonly adr3UsedRight = Subject.create(false);

  public readonly computedAirSpeedToNearest2 = MappedSubject.create(
    ([cas1, cas2, cas3, sideOn3]) =>
      Math.round((sideOn3 ? cas3.value : this.fwsNumber === 2 ? cas2.value : cas1.value) / 2) * 2,
    this.adr1Cas,
    this.adr2Cas,
    this.adr3Cas,
    this.fwsNumber === 2 ? this.airDataFoOn3 : this.airDataCaptOn3,
  );

  public readonly machSelectedFromAdr = MappedSubject.create(
    ([mach1, mach2, mach3, sideOn3]) => (sideOn3 ? mach3.value : this.fwsNumber === 2 ? mach2.value : mach1.value),
    this.adr1Mach,
    this.adr2Mach,
    this.adr3Mach,
    this.fwsNumber === 2 ? this.airDataFoOn3 : this.airDataCaptOn3,
  );

  public readonly adrPressureAltitude = Subject.create(0);

  public readonly ir1MaintWord = Arinc429Register.empty();
  public readonly ir2MaintWord = Arinc429Register.empty();
  public readonly ir3MaintWord = Arinc429Register.empty();

  public readonly ir1Pitch = Arinc429Register.empty();
  public readonly ir2Pitch = Arinc429Register.empty();
  public readonly ir3Pitch = Arinc429Register.empty();

  public readonly ir1Fault = Subject.create(false);
  public readonly ir2Fault = Subject.create(false);
  public readonly ir3Fault = Subject.create(false);

  private readonly ir3UsedLeft = Subject.create(false);
  private readonly ir3UsedRight = Subject.create(false);

  public readonly irExcessMotion = Subject.create(false);

  public readonly extremeLatitudeAlert = Subject.create(false);

  public readonly height1Failed = Subject.create(false);

  public readonly height2Failed = Subject.create(false);

  public readonly height3Failed = Subject.create(false);

  private adr3OverspeedWarning = new NXLogicMemoryNode(false, false);

  public readonly overspeedVmo = Subject.create(false);

  public readonly overspeedVle = Subject.create(false);

  public readonly overspeedVfeConf1 = Subject.create(false);

  public readonly overspeedVfeConf1F = Subject.create(false);

  public readonly overspeedVfeConf2 = Subject.create(false);

  public readonly overspeedVfeConf3 = Subject.create(false);

  public readonly overspeedVfeConfFull = Subject.create(false);

  public readonly flapsIndex = Subject.create(0);

  private stallWarningRaw = ConsumerValue.create(this.sub.on('stall_warning_on'), false);

  public readonly trueNorthRef = Subject.create(false);

  /* SURVEILLANCE */

  public readonly gpwsFlapModeOff = Subject.create(false);

  public readonly gpwsSysOff = Subject.create(false);

  public readonly gpwsGsOff = Subject.create(false);

  public readonly gpwsTerrOff = Subject.create(false);

  public readonly xpdrAltReportingRequest = ConsumerSubject.create(this.sub.on('mfd_xpdr_set_alt_reporting'), true); // fixme signal should come from XPDR?

  public readonly xpdrStby = Subject.create(false);

  public readonly xpdrAltReporting = Subject.create(false);

  public readonly tcas1Fault = Subject.create(false);

  private readonly tcas1FaultCond = Subject.create(false);

  private readonly tcas1AdrInopOrIrConfNode = new NXLogicConfirmNode(3, false);

  private readonly tcas1FaultAndNoAdiruInop = new NXLogicConfirmNode(3);

  public readonly tcas2Fault = Subject.create(false);

  private readonly tcas2FaultCond = Subject.create(false);

  private readonly tcas2AdrInopOrIrConfNode = new NXLogicConfirmNode(3, false);

  private readonly tcas2FaultAndNoAdiruInop = new NXLogicConfirmNode(3);

  public readonly tcas1And2Fault = Subject.create(false);

  private readonly tcasStandby3sConfNode = new NXLogicConfirmNode(3);

  public readonly tcasStandby = Subject.create(false);

  private readonly tcasStandbyMemo3sConfNode = new NXLogicConfirmNode(3);

  public readonly tcasStandbyMemo = Subject.create(false);

  /** 35 OXYGEN */
  public readonly paxOxyMasksDeployed = Subject.create(false);

  /** ENGINE AND THROTTLE */

  public readonly oneEngineRunning = Subject.create(false);

  public readonly engine1Master = ConsumerSubject.create(this.sub.on('engine1Master'), 0);

  public readonly engine2Master = ConsumerSubject.create(this.sub.on('engine2Master'), 0);

  public readonly engine3Master = ConsumerSubject.create(this.sub.on('engine3Master'), 0);

  public readonly engine4Master = ConsumerSubject.create(this.sub.on('engine4Master'), 0);

  public readonly engine1State = Subject.create(0);

  public readonly engine2State = Subject.create(0);

  public readonly engine3State = Subject.create(0);

  public readonly engine4State = Subject.create(0);

  public readonly N1Eng1 = Subject.create(0);

  public readonly N1Eng2 = Subject.create(0);

  public readonly N1Eng3 = Subject.create(0);

  public readonly N1Eng4 = Subject.create(0);

  public readonly N2Eng1 = Subject.create(0);

  public readonly N2Eng2 = Subject.create(0);

  public readonly N1IdleEng = Subject.create(0);

  // FIXME ECU should provide this in a discrete word
  public readonly engine1AboveIdle = MappedSubject.create(
    ([n1, idleN1]) => n1 > idleN1 + 2,
    this.N1Eng1,
    this.N1IdleEng,
  );

  public readonly engine2AboveIdle = MappedSubject.create(
    ([n1, idleN1]) => n1 > idleN1 + 2,
    this.N1Eng2,
    this.N1IdleEng,
  );

  // FIXME ECU should provide this in a discrete word, and calculate based on f(OAT)
  // this is absolute min at low temperatures
  public readonly engine1CoreAtOrAboveMinIdle = MappedSubject.create(
    ([n2]) => n2 >= (100 * 10630) / 16645,
    this.N2Eng1,
  );

  public readonly engine2CoreAtOrAboveMinIdle = MappedSubject.create(
    ([n2]) => n2 >= (100 * 10630) / 16645,
    this.N2Eng2,
  );

  public readonly engDualFault = Subject.create(false);

  public readonly engine1Generator = Subject.create(false);

  public readonly engine2Generator = Subject.create(false);

  public readonly emergencyElectricGeneratorPotential = Subject.create(0);

  public readonly emergencyGeneratorOn = this.emergencyElectricGeneratorPotential.map((it) => it > 0);

  public readonly apuMasterSwitch = Subject.create(0);

  public readonly apuAvail = Subject.create(0);

  public readonly radioHeight1 = Arinc429Register.empty();

  public readonly radioHeight2 = Arinc429Register.empty();

  public readonly radioHeight3 = Arinc429Register.empty();

  public readonly fac1Failed = Subject.create(0);

  public readonly toMemo = Subject.create(0);

  public readonly ldgMemo = Subject.create(0);

  public readonly autoBrake = Subject.create(0);

  public readonly engSelectorPosition = Subject.create(0);

  public readonly eng1AntiIce = Subject.create(false);

  public readonly eng2AntiIce = Subject.create(false);

  public readonly eng3AntiIce = Subject.create(false);

  public readonly eng4AntiIce = Subject.create(false);

  public readonly throttle1Position = Subject.create(0);

  public readonly throttle2Position = Subject.create(0);

  public readonly throttle3Position = Subject.create(0);

  public readonly throttle4Position = Subject.create(0);

  public readonly allThrottleIdle = Subject.create(false);

  public readonly allEngineSwitchOff = Subject.create(false);

  public readonly autoThrustStatus = Subject.create(0);

  public readonly autoThrustMode = Subject.create(0);

  public readonly autothrustLeverWarningFlex = Subject.create(false);

  public readonly autothrustLeverWarningToga = Subject.create(false);

  public readonly thrustLeverNotSet = Subject.create(false);

  public readonly eng1Or2TakeoffPowerConfirm = new NXLogicConfirmNode(60, false);

  public readonly eng1Or2TakeoffPower = Subject.create(false);

  public readonly eng3Or4TakeoffPowerConfirm = new NXLogicConfirmNode(60, false);

  public readonly eng3Or4TakeoffPower = Subject.create(false);

  /** 42 AVIONICS NETWORK */
  public readonly cpiomC1Available = Subject.create(false);
  public readonly cpiomC2Available = Subject.create(false);

  /* ICE */

  public readonly iceDetectedTimer1 = new NXLogicConfirmNode(40, false);

  public readonly iceDetectedTimer2 = new NXLogicConfirmNode(5);

  public readonly iceDetectedTimer2Status = Subject.create(false);

  public readonly iceNotDetTimer1 = new NXLogicConfirmNode(60);

  public readonly iceNotDetTimer2 = new NXLogicConfirmNode(130);

  public readonly iceNotDetTimer2Status = Subject.create(false);

  public readonly iceSevereDetectedTimer = new NXLogicConfirmNode(40, false);

  public readonly iceSevereDetectedTimerStatus = Subject.create(false);

  private static pushKeyUnique(val: () => string[] | undefined, pushTo: string[]) {
    if (val) {
      // Push only unique keys
      for (const key of val()) {
        if (key && !pushTo.includes(key)) {
          pushTo.push(key);
        }
      }
    }
  }

  public readonly memos = new FwsMemos(this);
  public readonly normalChecklists = new FwsNormalChecklists(this);
  public readonly abnormalNonSensed = new FwsAbnormalNonSensed(this);
  public readonly abnormalSensed = new FwsAbnormalSensed(this);
  public ewdAbnormal: EwdAbnormalDict;

  constructor(
    public readonly fwsNumber: 1 | 2,
    public readonly bus: EventBus,
    private readonly failuresConsumer: FailuresConsumer,
    public readonly fws1Failed: Subscribable<boolean>,
    public readonly fws2Failed: Subscribable<boolean>,
  ) {
    this.ewdAbnormal = Object.assign(
      {},
      this.abnormalSensed.ewdAbnormalSensed,
      this.abnormalNonSensed.ewdAbnormalNonSensed,
    );

    this.subs.push(
      this.startupCompleted.sub((v) => {
        if (v) {
          this.normalChecklists.reset(null);
          this.abnormalNonSensed.reset();
          this.activeDeferredProceduresList.clear();
          this.abnormalSensed.reset();
          this.presentedAbnormalProceduresList.clear();
          this.clearedAbnormalProceduresList.clear();
          this.allCurrentFailures.length = 0;
          this.presentedFailures.length = 0;
          this.recallFailures.length = 0;
        }
      }),
    );

    // Not a lot of references on which parts of the FWS to reset when
    this.subs.push(
      this.shutDownFor50MinutesCheckListReset.sub((v) => {
        if (v) {
          if (!this.manualCheckListReset.get()) {
            this.normalChecklists.reset(null);
          }
          this.abnormalNonSensed.reset();
          this.abnormalSensed.reset();
          this.presentedAbnormalProceduresList.clear();
          this.clearedAbnormalProceduresList.clear();
          this.activeDeferredProceduresList.clear();
          this.allCurrentFailures.length = 0;
          this.presentedFailures.length = 0;
          this.recallFailures.length = 0;
        }
      }),
    );

    this.ewdMessageLinesLeft.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.ewdMessageSimVarsLeft[i], 'string', l ?? '');
        }),
      ),
    );

    this.ewdMessageLinesRight.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.ewdMessageSimVarsRight[i], 'string', l ?? '');
        }),
      ),
    );

    this.pfdMemoLines.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.pfdMemoSimVars[i], 'string', l ?? '');
        }),
      ),
    );

    this.sdStatusInfoLines.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.sdStatusInfoSimVars[i], 'string', l ?? '');
        }),
      ),
    );

    this.sdStatusInopAllPhasesLines.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.sdStatusInopAllPhasesSimVars[i], 'string', l ?? '');
        }),
      ),
    );

    this.sdStatusInopApprLdgLines.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.sdStatusInopApprLdgSimVars[i], 'string', l ?? '');
        }),
      ),
    );

    this.pfdLimitationsLines.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.pfdLimitationsSimVars[i], 'string', l ?? '');
        }),
      ),
    );

    this.ewdLimitationsAllPhasesLines.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.ewdLimitationsAllPhasesSimVars[i], 'string', l ?? '');
        }),
      ),
    );

    this.ewdLimitationsApprLdgLines.forEach((ls, i) =>
      this.subs.push(
        ls.sub((l) => {
          SimVar.SetSimVarValue(FwsCore.ewdLimitationsApprLdgSimVars[i], 'string', l ?? '');
        }),
      ),
    );

    this.subs.push(this.statusNormal.sub((s) => SimVar.SetSimVarValue('L:A32NX_STATUS_NORMAL', 'boolean', s), true));

    this.subs.push(
      this.ecamEwdShowStsIndication.sub(
        (s) => this.bus.getPublisher<FwsEwdEvents>().pub('fws_show_sts_indication', s, true),
        true,
      ),
    );

    this.subs.push(
      this.ecamEwdShowFailurePendingIndication.sub(
        (s) => this.bus.getPublisher<FwsEwdEvents>().pub('fws_show_failure_pending', s, true),
        true,
      ),
    );

    const ecamMemoKeys = Object.keys(EcamMemos);
    Object.keys(this.memos.ewdToLdgMemos).forEach((key) => {
      this.memos.ewdToLdgMemos[key].codesToReturn.forEach((code) => {
        const found = ecamMemoKeys.find((it) => it === code);
        if (!found) {
          console.log(
            `ECAM message from PseudoFWC not found in EcamMemos: ${key}.\nIf MEMO, delete from PseudoFWC. If ECAM alert / ABN proc, move to ABN procs in the future.`,
          );
        }
      });
    });

    for (const s of this.feedTankPumps) {
      this.subs.push(s);
    }

    this.subs.push(
      this.statusNormal,
      this.masterCautionOutput,
      this.masterWarningOutput,
      this.fuelOnBoard,
      this.fuelingInitiated,
      this.fuelingTarget,
      this.refuelPanelOpen,
      this.allCrossFeedValvesOpen,
      this.crossFeedOpenMemo,
      this.refuelPanelOpen,
      this.isRefuelFuelTarget,
      this.defuelInProgress,
      this.refuelInProgress,
      this.airDataCaptOn3,
      this.airDataFoOn3,
      this.rmp3ActiveMode,
      this.xpdrAltReportingRequest,
      this.flightPhase1Or2,
      this.flightPhase128,
      this.flightPhase23,
      this.flightPhase345,
      this.flightPhase34567,
      this.flightPhase1211,
      this.flightPhase89,
      this.flightPhase910,
      this.flightPhase112,
      this.flightPhase6789,
      this.flightPhase189,
      this.flightPhase1112,
      this.flightPhase12Or1112,
      this.stallWarningRaw,
      this.computedAirSpeedToNearest2,
      this.machSelectedFromAdr,
      this.engine1ValueSwitch,
      this.engine2ValueSwitch,
      this.engine3ValueSwitch,
      this.engine4ValueSwitch,
      this.engine1Master,
      this.engine2Master,
      this.engine3Master,
      this.engine4Master,
      this.engine1AboveIdle,
      this.engine2AboveIdle,
      this.engine1CoreAtOrAboveMinIdle,
      this.engine2CoreAtOrAboveMinIdle,
    );
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

    this.subs.push(
      this.toConfigNormal.sub((normal) => SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_NORMAL', 'bool', normal)),
    );
    this.subs.push(
      this.flightPhase.sub((fp) => {
        SimVar.SetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum', fp || 0);
        if (fp !== null) {
          this.flightPhaseEndedPulseNode.write(true, 0);
        }
      }),
    );

    this.subs.push(
      this.auralCrcActive.sub((crc) => this.soundManager.handleSoundCondition('continuousRepetitiveChime', crc), true),
    );

    this.subs.push(
      this.masterCautionOutput.sub((caution) => {
        // Inhibit master warning/cautions until FWC startup has been completed
        SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', 'bool', caution);
      }, true),
    );

    this.subs.push(
      this.masterWarningOutput.sub((warning) => {
        // Inhibit master warning/cautions until FWC startup has been completed
        SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', 'bool', warning);
      }, true),
    );

    // L/G lever red arrow sinking outputs
    this.subs.push(
      this.lgLeverRedArrow.sub((on) => {
        // TODO FWCs need to be powered...
        SimVar.SetSimVarValue('L:A32NX_FWC_1_LG_RED_ARROW', SimVarValueType.Bool, on);
        SimVar.SetSimVarValue('L:A32NX_FWC_2_LG_RED_ARROW', SimVarValueType.Bool, on);
      }, true),
    );

    this.subs.push(
      this.stallWarning.sub((v) => {
        this.fwcOut126.setBitValue(17, v);
        // set the sound on/off
        this.soundManager.handleSoundCondition('stall', v);
      }, true),
    );
    this.subs.push(this.aircraftOnGround.sub((v) => this.fwcOut126.setBitValue(28, v)));

    this.subs.push(
      this.fwcOut126.sub((v) => {
        Arinc429Word.toSimVarValue('L:A32NX_FWC_1_DISCRETE_WORD_126', v.value, v.ssm);
        Arinc429Word.toSimVarValue('L:A32NX_FWC_2_DISCRETE_WORD_126', v.value, v.ssm);
      }, true),
    );

    // FIXME depend on FWC state
    this.fwcOut126.setSsm(Arinc429SignStatusMatrix.NormalOperation);

    // Inhibit single chimes for the first two seconds after power-on
    this.auralSingleChimeInhibitTimer.schedule(
      () => (this.auralSingleChimePending = false),
      FwsCore.AURAL_SC_INHIBIT_TIME,
    );

    if (this.fwsNumber === 1) {
      this.subs.push(this.dcESSBusPowered.sub((v) => this.handlePowerChange(v), true));
    } else {
      this.subs.push(this.dc2BusPowered.sub((v) => this.handlePowerChange(v), true));
    }
  }

  private handlePowerChange(powered: boolean) {
    if (powered) {
      this.startupTimer.schedule(() => {
        this.startupCompleted.set(true);
        console.log('PseudoFWC startup completed.');
      }, FwsCore.FWC_STARTUP_TIME);
    } else {
      this.startupTimer.clear();
      this.startupCompleted.set(false);
      console.log('PseudoFWC shut down.');
    }
  }

  private registerKeyEvents() {
    this.keyEventManager.interceptKey('A32NX.AUTO_THROTTLE_DISCONNECT', true);
    this.keyEventManager.interceptKey('A32NX.FCU_AP_DISCONNECT_PUSH', true);
    this.keyEventManager.interceptKey('A32NX.AUTOPILOT_DISENGAGE', false); // internal event, for FWS only
    this.keyEventManager.interceptKey('AUTOPILOT_OFF', true);
    this.keyEventManager.interceptKey('AUTO_THROTTLE_ARM', true);
  }

  healthInjector(): void {
    SimVar.SetSimVarValue('L:A32NX_NO_SMOKING_MEMO', SimVarValueType.Bool, true);
    SimVar.SetSimVarValue('L:A32NX_CABIN_READY', SimVarValueType.Bool, true);
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

  public adirsMessage1(adirs, engineRunning) {
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

  public adirsMessage2(adirs, engineRunning) {
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

    const ecpNotReachable =
      !SimVar.GetSimVarValue('L:A32NX_AFDX_3_3_REACHABLE', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_AFDX_13_13_REACHABLE', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_AFDX_4_4_REACHABLE', SimVarValueType.Bool) &&
      !SimVar.GetSimVarValue('L:A32NX_AFDX_14_14_REACHABLE', SimVarValueType.Bool);
    this.fwsEcpFailed.set(this.failuresConsumer.isActive(A380Failure.FwsEcp) || ecpNotReachable);

    // Acquire discrete inputs at a higher frequency, buffer them until the next FWS cycle.
    // T.O CONFIG button
    if (SimVar.GetSimVarValue('L:A32NX_BTN_TOCONFIG', 'bool') && !this.fwsEcpFailed.get()) {
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
    if (recallButton && !this.fwsEcpFailed.get()) {
      this.recallButtonInputBuffer.write(true, false);
    }

    // C/L buttons
    if (SimVar.GetSimVarValue('L:A32NX_BTN_CL', 'bool')) {
      this.clInputBuffer.write(true, false);
    }

    if (
      SimVar.GetSimVarValue('L:A32NX_BTN_CHECK_LH', 'bool') ||
      SimVar.GetSimVarValue('L:A32NX_BTN_CHECK_RH', 'bool')
    ) {
      this.clCheckInputBuffer.write(true, false);
    }

    if (SimVar.GetSimVarValue('L:A32NX_BTN_UP', 'bool')) {
      this.clUpInputBuffer.write(true, false);
    }
    if (SimVar.GetSimVarValue('L:A32NX_BTN_DOWN', 'bool')) {
      this.clDownInputBuffer.write(true, false);
    }

    if (SimVar.GetSimVarValue('L:A32NX_BTN_ABNPROC', 'bool')) {
      this.abnProcInputBuffer.write(true, false);
    }

    // Enforce cycle time for the logic computation (otherwise pulse nodes would be broken)
    if (deltaTime === -1 || _deltaTime === 0) {
      return;
    }

    if (!this.fuelingInitiated.get()) {
      this.fuelOnBoard.pause();
    } else {
      this.fuelOnBoard.resume();
    }

    // A380X hack: Inject healthy messages for some systems which are not yet implemented
    this.healthInjector();

    this.audioFunctionLost.set(
      this.failuresConsumer.isActive(A380Failure.Fws1AudioFunction) &&
        this.failuresConsumer.isActive(A380Failure.Fws2AudioFunction),
    );

    // Update flight phases
    this.flightPhases.update(deltaTime);

    // Play sounds
    this.soundManager.onUpdate(deltaTime);

    // Write pulse nodes for buffered inputs
    this.toConfigPulseNode.write(this.toConfigInputBuffer.read(), deltaTime);
    this.clrPulseNode.write(this.clearButtonInputBuffer.read(), deltaTime);
    this.rclUpPulseNode.write(this.recallButtonInputBuffer.read(), deltaTime);
    this.clPulseNode.write(this.clInputBuffer.read(), deltaTime);
    this.clCheckPulseNode.write(this.clCheckInputBuffer.read(), deltaTime);
    this.clUpPulseNode.write(this.clUpInputBuffer.read(), deltaTime);
    this.clDownPulseNode.write(this.clDownInputBuffer.read(), deltaTime);
    this.abnProcPulseNode.write(this.abnProcInputBuffer.read(), deltaTime);
    this.autoThrustInstinctiveDiscPressed.write(this.aThrDiscInputBuffer.read(), deltaTime);
    this.autoPilotInstinctiveDiscPressedPulse.write(this.apDiscInputBuffer.read(), deltaTime);

    // Inputs update
    this.flightPhaseEndedPulseNode.write(false, deltaTime);
    const phase3 = this.flightPhase.get() === 3;
    const phase6 = this.flightPhase.get() === 6;
    const flightPhase8 = this.flightPhase.get() === 8;
    this.flightPhase3PulseNode.write(phase3, deltaTime);

    // flight phase convinence vars
    const flightPhase6789 = this.flightPhase6789.get();
    const flightPhase112 = this.flightPhase112.get();
    const flightPhase189 = this.flightPhase189.get();

    this.phase815MinConfNode.write(this.flightPhase.get() === 8, deltaTime);

    this.flightPhase1112MoreThanOneMinConfNode.write(this.flightPhase1112.get(), deltaTime);
    this.flightPhase1112MoreThanOneMin.set(this.flightPhase1112MoreThanOneMinConfNode.read());

    this.phase12ShutdownMemoryNode.write(this.flightPhase.get() === 12, !this.phase112.get());

    this.shutDownFor50MinutesCheckListReset.set(
      this.shutDownFor50MinutesClResetConfNode.write(this.phase12ShutdownMemoryNode.read(), deltaTime),
    );

    // TO CONFIG button
    this.toConfigTestRaw = SimVar.GetSimVarValue('L:A32NX_BTN_TOCONFIG', 'bool') > 0 && !this.fwsEcpFailed.get();
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

    this.flightPhaseInhibitOverrideNode.write(this.rclUpPulseNode.read(), this.flightPhaseEndedPulseNode.read());

    this.showTakeoffInhibit.set(
      this.toInhibitTimer.write(this.flightPhase34567.get() && !this.flightPhaseInhibitOverrideNode.read(), deltaTime),
    );
    this.showLandingInhibit.set(
      this.ldgInhibitTimer.write(this.flightPhase910.get() && !this.flightPhaseInhibitOverrideNode.read(), deltaTime),
    );

    this.flapsIndex.set(SimVar.GetSimVarValue('L:A32NX_FLAPS_CONF_INDEX', 'number'));

    this.adr1Cas.setWord(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_1_COMPUTED_AIRSPEED', 'number'));
    this.adr2Cas.setWord(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_2_COMPUTED_AIRSPEED', 'number'));
    this.adr3Cas.setWord(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_3_COMPUTED_AIRSPEED', 'number'));

    this.adr1Mach.setWord(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_1_MACH', 'number'));
    this.adr2Mach.setWord(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_2_MACH', 'number'));
    this.adr3Mach.setWord(SimVar.GetSimVarValue('L:A32NX_ADIRS_ADR_3_MACH', 'number'));

    this.ir1Pitch.setFromSimVar('L:A32NX_ADIRS_IR_1_PITCH');
    this.ir2Pitch.setFromSimVar('L:A32NX_ADIRS_IR_2_PITCH');
    this.ir3Pitch.setFromSimVar('L:A32NX_ADIRS_IR_3_PITCH');

    this.ir1MaintWord.setFromSimVar('L:A32NX_ADIRS_IR_1_MAINT_WORD');
    this.ir2MaintWord.setFromSimVar('L:A32NX_ADIRS_IR_2_MAINT_WORD');
    this.ir3MaintWord.setFromSimVar('L:A32NX_ADIRS_IR_3_MAINT_WORD');

    this.extremeLatitudeAlert.set(
      (this.ir1MaintWord.bitValueOr(15, false) ||
        this.ir2MaintWord.bitValueOr(15, false) ||
        this.ir3MaintWord.bitValueOr(15, false)) &&
        !SimVar.GetSimVarValue('L:A32NX_PUSH_TRUE_REF', 'bool'),
    );

    /* ELECTRICAL acquisition */
    this.dcESSBusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool') > 0);
    this.dc1BusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'bool') > 0);
    this.dc2BusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'bool') > 0);
    this.ac1BusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool') > 0);
    this.ac2BusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool') > 0);
    this.ac3BusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_AC_3_BUS_IS_POWERED', 'bool') > 0);
    this.ac4BusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_AC_4_BUS_IS_POWERED', 'bool') > 0);
    this.acESSBusPowered.set(SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', 'bool') > 0);

    /* ENGINE AND THROTTLE acquisition */

    const engine1StatesimVar = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:1', 'Enum');
    const engine2StateSimVar = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:2', 'Enum');
    const engine3StateSiMVar = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:3', 'Enum');
    const engine4StateSiMVar = SimVar.GetSimVarValue('L:A32NX_ENGINE_STATE:4', 'Enum');

    this.engine1State.set(engine1StatesimVar);
    this.engine2State.set(engine2StateSimVar);
    this.engine3State.set(engine3StateSiMVar);
    this.engine4State.set(engine4StateSiMVar);

    this.engine1Running.set(engine1StatesimVar == 1);
    this.engine2Running.set(engine2StateSimVar == 1);
    this.engine3Running.set(engine3StateSiMVar == 1);
    this.engine4Running.set(engine4StateSiMVar == 1);

    this.oneEngineRunning.set(
      this.engine1Running.get() || this.engine2Running.get() || this.engine3Running.get() || this.engine4Running.get(),
    );

    this.N1Eng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:1', 'number'));
    this.N1Eng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:2', 'number'));
    this.N1Eng3.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:3', 'number'));
    this.N1Eng4.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N1:4', 'number'));
    this.N2Eng1.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:1', 'number'));
    this.N2Eng2.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_N2:2', 'number'));
    this.N1IdleEng.set(SimVar.GetSimVarValue('L:A32NX_ENGINE_IDLE_N1', 'number'));

    // Flaps
    this.flapsAngle.set(SimVar.GetSimVarValue('L:A32NX_LEFT_FLAPS_ANGLE', 'degrees'));
    this.flapsHandle.set(SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'enum'));
    this.slatsAngle.set(SimVar.GetSimVarValue('L:A32NX_LEFT_SLATS_ANGLE', 'degrees'));

    // FIXME move out of acquisition to logic below
    const oneEngineAboveMinPower = this.engine1AboveIdle.get() || this.engine2AboveIdle.get();

    this.engine1Generator.set(SimVar.GetSimVarValue('L:A32NX_ELEC_ENG_GEN_1_POTENTIAL_NORMAL', 'bool'));
    this.engine2Generator.set(SimVar.GetSimVarValue('L:A32NX_ELEC_ENG_GEN_2_POTENTIAL_NORMAL', 'bool'));
    this.emergencyElectricGeneratorPotential.set(SimVar.GetSimVarValue('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'number'));

    this.apuMasterSwitch.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'bool'));

    this.apuAvail.set(SimVar.GetSimVarValue('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'bool'));
    this.apuBleedValveOpen.set(SimVar.GetSimVarValue('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'bool'));

    this.fac1Failed.set(SimVar.GetSimVarValue('L:A32NX_FBW_FAC_FAILED:1', 'boost psi'));

    this.toMemo.set(SimVar.GetSimVarValue('L:A32NX_FWC_TOMEMO', 'bool'));

    this.autoBrake.set(SimVar.GetSimVarValue('L:A32NX_AUTOBRAKES_ARMED_MODE', 'enum'));

    this.ldgMemo.set(SimVar.GetSimVarValue('L:A32NX_FWC_LDGMEMO', 'bool'));

    this.engSelectorPosition.set(SimVar.GetSimVarValue('L:XMLVAR_ENG_MODE_SEL', 'Enum'));
    this.eng1AntiIce.set(!!SimVar.GetSimVarValue('A:ENG ANTI ICE:1', 'bool'));
    this.eng2AntiIce.set(!!SimVar.GetSimVarValue('A:ENG ANTI ICE:2', 'bool'));
    this.eng3AntiIce.set(!!SimVar.GetSimVarValue('A:ENG ANTI ICE:3', 'bool'));
    this.eng4AntiIce.set(!!SimVar.GetSimVarValue('A:ENG ANTI ICE:4', 'bool'));
    this.wingAntiIce.set(!!SimVar.GetSimVarValue('A:STRUCTURAL DEICE SWITCH', 'bool'));
    this.throttle1Position.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:1', 'number'));
    this.throttle2Position.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:2', 'number'));
    this.throttle3Position.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:3', 'number'));
    this.throttle4Position.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_TLA:4', 'number'));
    this.autoThrustStatus.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_STATUS', 'enum'));
    this.autoThrustMode.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_MODE', 'enum'));
    this.autothrustLeverWarningFlex.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_FLEX', 'bool'));
    this.autothrustLeverWarningToga.set(SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_THRUST_LEVER_WARNING_TOGA', 'bool'));
    this.allThrottleIdle.set(
      this.throttle1Position.get() < 1 &&
        this.throttle2Position.get() < 1 &&
        this.throttle3Position.get() < 1 &&
        this.throttle4Position.get() < 1,
    );

    const masterCautionButtonLeft = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERCAUT_L', 'bool');
    const masterCautionButtonRight = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERCAUT_R', 'bool');
    const masterWarningButtonLeft = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_L', 'bool');
    const masterWarningButtonRight = SimVar.GetSimVarValue('L:PUSH_AUTOPILOT_MASTERAWARN_R', 'bool');

    /* HYDRAULICS acquisition */

    const greenSysPressurised = SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool');
    const yellowSysPressurised = SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH', 'bool');

    const gLoPressure = !greenSysPressurised;
    const yLoPressure = !yellowSysPressurised;

    this.eng1Or2RunningAndPhaseConfirmationNode.write(
      this.engine1Running.get() || this.engine2Running.get() || !this.flightPhase12Or1112.get(),
      deltaTime,
    );

    this.eng3Or4RunningAndPhaseConfirmationNode.write(
      this.engine3Running.get() || this.engine4Running.get() || !this.flightPhase12Or1112.get(),
      deltaTime,
    );

    const greenAbnormLoPressure = gLoPressure && this.eng1Or2RunningAndPhaseConfirmationNode.read();
    const yellowAbnormLoPressure = yLoPressure && this.eng3Or4RunningAndPhaseConfirmationNode.read();

    this.greenAbnormLoPressure.set(greenAbnormLoPressure);
    this.yellowAbnormLoPressure.set(yellowAbnormLoPressure);
    this.greenYellowAbnormLoPressure.set(greenAbnormLoPressure && yellowAbnormLoPressure);

    // fixme OVHT signal should come from HSMU
    this.yellowRsvOverheat.set(SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_RESERVOIR_OVHT', 'bool'));
    const yellowHydralicRsvLoAirPressure = SimVar.GetSimVarValue(
      'L:A32NX_HYD_YELLOW_RESERVOIR_AIR_PRESSURE_IS_LOW',
      'bool',
    );
    this.yellowRsvLoAirPressure.set(yellowHydralicRsvLoAirPressure && !this.greenYellowAbnormLoPressure.get());
    this.yellowRsvLoLevel.set(SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_RESERVOIR_LEVEL_IS_LOW', 'bool'));
    this.greenRsvLoLevel.set(SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL_IS_LOW', 'bool'));

    this.greenRsvOverheat.set(SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_RESERVOIR_OVHT', 'bool'));
    this.greenRsvLoAirPressure.set(
      SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_RESERVOIR_AIR_PRESSURE_IS_LOW', 'bool') &&
        !this.greenYellowAbnormLoPressure.get(),
    );

    this.greenAPumpOn.set(SimVar.GetSimVarValue('L:A32NX_HYD_GA_EPUMP_ACTIVE', 'bool'));
    this.greenBPumpOn.set(SimVar.GetSimVarValue('L:A32NX_HYD_GB_EPUMP_ACTIVE', 'bool'));

    this.greenAPumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_EPUMPGA_OFF_PB_IS_AUTO', 'bool'));
    this.greenBPumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_EPUMPGB_OFF_PB_IS_AUTO', 'bool'));

    const yellowAPumpAuto = SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_EPUMPYA_OFF_PB_IS_AUTO', 'bool');
    const yellowBPumpAuto = SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_EPUMPYB_OFF_PB_IS_AUTO', 'bool');
    this.yellowAPumpAuto.set(yellowAPumpAuto);
    this.yellowBPumpAuto.set(yellowBPumpAuto);

    // fixme add fault signal condition of elec pump fault when implemented
    const greenAPumpLoPress = SimVar.GetSimVarValue('L:A32NX_HYD_GA_EPUMP_LOW_PRESS', 'bool');
    const greenAPumpOverheat = SimVar.GetSimVarValue('L:A32NX_HYD_GA_EPUMP_OVHT', 'bool');
    this.greenAPumpLoPressConfNode.write(greenAPumpLoPress, deltaTime);
    this.greenAPumpFault.set(this.ac1BusPowered.get() && (this.greenAPumpLoPressConfNode.read() || greenAPumpOverheat));

    const greenBPumpLoPress = SimVar.GetSimVarValue('L:A32NX_HYD_GB_EPUMP_LOW_PRESS', 'bool');
    const greenBPumpOverheat = SimVar.GetSimVarValue('L:A32NX_HYD_GB_EPUMP_OVHT', 'bool');
    this.greenBPumpLoPressConfNode.write(greenBPumpLoPress, deltaTime);
    this.greenBPumpFault.set(this.ac2BusPowered.get() && (this.greenBPumpLoPressConfNode.read() || greenBPumpOverheat));

    const yellowAPumpLoPress = SimVar.GetSimVarValue('L:A32NX_HYD_YA_EPUMP_LOW_PRESS', 'bool');
    const yellowAPumpOverheat = SimVar.GetSimVarValue('L:A32NX_HYD_YA_EPUMP_OVHT', 'bool');
    this.yellowAPumpLoPressConfNode.write(yellowAPumpLoPress, deltaTime);
    this.yellowAPumpFault.set(
      this.ac3BusPowered.get() && (this.yellowAPumpLoPressConfNode.read() || yellowAPumpOverheat),
    );

    const yellowBPumpLoPress = SimVar.GetSimVarValue('L:A32NX_HYD_YB_EPUMP_LOW_PRESS', 'bool');
    const yellowBPumpOverheat = SimVar.GetSimVarValue('L:A32NX_HYD_YB_EPUMP_OVHT', 'bool');
    this.yellowBPumpLoPressConfNode.write(yellowBPumpLoPress, deltaTime);
    this.yellowBPumpFault.set(
      this.ac4BusPowered.get() && (this.yellowBPumpLoPressConfNode.read() || yellowBPumpOverheat),
    );

    this.yellowElecAandBPumpOff.set(
      !yellowAPumpAuto &&
        !yellowBPumpAuto &&
        !yellowHydralicRsvLoAirPressure &&
        (!this.yellowAPumpFault.get() || !this.yellowBPumpFault.get()),
    );

    this.yellowAPumpOn.set(SimVar.GetSimVarValue('L:A32NX_HYD_YA_EPUMP_ACTIVE', 'bool'));
    this.yellowBPumpOn.set(SimVar.GetSimVarValue('L:A32NX_HYD_YB_EPUMP_ACTIVE', 'bool'));

    this.eng1APumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_1A_PUMP_PB_IS_AUTO', 'bool'));
    this.eng1BPumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_1B_PUMP_PB_IS_AUTO', 'bool'));
    this.eng1PumpDisc.set(SimVar.GetSimVarValue('L:A32NX_HYD_ENG_1AB_PUMP_DISC', 'bool'));

    this.eng1APumpOffConfirmationNode.write(
      !this.greenRsvLoAirPressure.get() &&
        !this.greenRsvOverheat.get() &&
        !this.greenAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng1APumpAuto.get(),
      deltaTime,
    );
    const eng1APumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_PUMP_1_SECTION_PRESSURE_SWITCH', 'bool');
    this.eng1APumpFault.set(
      this.eng1APumpOffConfirmationNode.read() ||
        (this.engine1Running.get() &&
          eng1APumpBelow2900 &&
          !this.greenYellowAbnormLoPressure.get() &&
          !this.greenRsvOverheat.get()),
    );

    this.eng1BPumpOffConfirmationNode.write(
      !this.greenRsvLoAirPressure.get() &&
        !this.greenRsvOverheat.get() &&
        !this.greenAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng1BPumpAuto.get(),
      deltaTime,
    );
    const eng1BPumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_PUMP_2_SECTION_PRESSURE_SWITCH', 'bool');
    this.eng1BPumpFault.set(
      this.eng1BPumpOffConfirmationNode.read() ||
        (this.engine1Running.get() &&
          eng1BPumpBelow2900 &&
          !this.greenYellowAbnormLoPressure.get() &&
          !this.greenRsvOverheat.get()),
    );

    this.eng2APumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_2A_PUMP_PB_IS_AUTO', 'bool'));
    this.eng2BPumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_2B_PUMP_PB_IS_AUTO', 'bool'));
    this.eng2PumpDisc.set(SimVar.GetSimVarValue('L:A32NX_HYD_ENG_2AB_PUMP_DISC', 'bool'));

    this.eng2APumpOffConfirmationNode.write(
      !this.greenRsvLoAirPressure.get() &&
        !this.greenRsvOverheat.get() &&
        !this.greenAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng2APumpAuto.get(),
      deltaTime,
    );

    const eng2APumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_PUMP_3_SECTION_PRESSURE_SWITCH', 'bool');
    this.eng2APumpFault.set(
      this.eng2APumpOffConfirmationNode.read() ||
        (this.engine2Running.get() &&
          eng2APumpBelow2900 &&
          !this.greenYellowAbnormLoPressure.get() &&
          !this.greenRsvOverheat.get()),
    );

    this.eng2BPumpOffConfirmationNode.write(
      !this.greenRsvLoAirPressure.get() &&
        !this.greenRsvOverheat.get() &&
        !this.greenAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng2BPumpAuto.get(),
      deltaTime,
    );

    const eng2BPumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_GREEN_PUMP_4_SECTION_PRESSURE_SWITCH', 'bool');
    this.eng2BPumpFault.set(
      this.eng2BPumpOffConfirmationNode.read() ||
        (this.engine2Running.get() &&
          eng2BPumpBelow2900 &&
          !this.greenYellowAbnormLoPressure.get() &&
          !this.greenRsvOverheat.get()),
    );

    this.eng3APumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_3A_PUMP_PB_IS_AUTO', 'bool'));

    this.eng3APumpOffConfirmationNode.write(
      !this.yellowRsvLoAirPressure.get() &&
        !this.yellowRsvOverheat.get() &&
        !this.yellowAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng3APumpAuto.get(),
      deltaTime,
    );

    this.eng3BPumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_3B_PUMP_PB_IS_AUTO', 'bool'));
    this.eng3PumpDisc.set(SimVar.GetSimVarValue('L:A32NX_HYD_ENG_3AB_PUMP_DISC', 'bool'));

    const eng3APumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_PUMP_1_SECTION_PRESSURE_SWITCH', 'bool');
    this.eng3APumpFault.set(
      this.eng3APumpOffConfirmationNode.read() ||
        (this.engine3Running.get() &&
          eng3APumpBelow2900 &&
          !this.greenYellowAbnormLoPressure.get() &&
          !this.yellowRsvOverheat.get()),
    );

    this.eng3BPumpOffConfirmationNode.write(
      !this.yellowRsvLoAirPressure.get() &&
        !this.yellowRsvOverheat.get() &&
        !this.yellowAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng3BPumpAuto.get(),
      deltaTime,
    );

    const eng3BPumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_PUMP_2_SECTION_PRESSURE_SWITCH', 'bool');
    this.eng3BPumpFault.set(
      this.eng3BPumpOffConfirmationNode.read() ||
        (this.engine3Running.get() &&
          eng3BPumpBelow2900 &&
          !this.greenYellowAbnormLoPressure.get() &&
          !this.yellowRsvOverheat.get()),
    );

    this.eng4APumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_4A_PUMP_PB_IS_AUTO', 'bool'));
    this.eng4BPumpAuto.set(SimVar.GetSimVarValue('L:A32NX_OVHD_HYD_ENG_4B_PUMP_PB_IS_AUTO', 'bool'));
    this.eng4PumpDisc.set(SimVar.GetSimVarValue('L:A32NX_HYD_ENG_4AB_PUMP_DISC', 'bool'));

    this.eng4APumpOffConfirmationNode.write(
      !this.yellowRsvLoAirPressure.get() &&
        !this.yellowRsvOverheat.get() &&
        !this.yellowAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng4APumpAuto,
      deltaTime,
    );

    const eng4APumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_PUMP_3_SECTION_PRESSURE_SWITCH', 'bool');

    this.eng4APumpFault.set(
      this.eng4APumpOffConfirmationNode.read() ||
        (this.engine4Running &&
          eng4APumpBelow2900 &&
          !this.greenYellowAbnormLoPressure &&
          !this.yellowRsvOverheat.get()),
    );

    this.eng4BPumpOffConfirmationNode.write(
      !this.yellowRsvLoAirPressure.get() &&
        !this.yellowRsvOverheat.get() &&
        !this.yellowAbnormLoPressure.get() &&
        this.flightPhase.get() === 2 &&
        !this.eng4BPumpAuto.get(),
      deltaTime,
    );

    const eng4BPumpBelow2900 = !SimVar.GetSimVarValue('L:A32NX_HYD_YELLOW_PUMP_4_SECTION_PRESSURE_SWITCH', 'bool');
    this.eng4BPumpFault.set(
      this.eng4BPumpOffConfirmationNode.read() ||
        (this.engine4Running.get() &&
          eng4BPumpBelow2900 &&
          !this.greenYellowAbnormLoPressure.get() &&
          !this.yellowRsvOverheat.get()),
    );

    this.threeYellowPumpsFailed.set(
      [eng3APumpBelow2900, eng3BPumpBelow2900, eng4APumpBelow2900, eng4BPumpBelow2900].filter((v) => v).length > 3,
    );

    this.ratDeployed.set(SimVar.GetSimVarValue('L:A32NX_RAT_STOW_POSITION', 'percent over 100'));

    /* ADIRS acquisition */
    /* NAVIGATION */

    const adr1Discrete1 = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_DISCRETE_WORD_1');
    const adr2Discrete1 = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_2_DISCRETE_WORD_1');
    const adr3Discrete1 = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_DISCRETE_WORD_1');
    const adr1Fault = adr1Discrete1.isFailureWarning() || adr1Discrete1.bitValueOr(3, false);
    const adr2Fault = adr2Discrete1.isFailureWarning() || adr2Discrete1.bitValueOr(3, false);
    const adr3Fault = adr3Discrete1.isFailureWarning() || adr3Discrete1.bitValueOr(3, false);

    this.ir1Fault.set(!flightPhase112 && (this.ir1Pitch.isFailureWarning() || this.ir1MaintWord.bitValueOr(9, true)));
    this.ir2Fault.set(!flightPhase112 && (this.ir2Pitch.isFailureWarning() || this.ir2MaintWord.bitValueOr(9, true)));
    this.ir3Fault.set(!flightPhase112 && (this.ir3Pitch.isFailureWarning() || this.ir3MaintWord.bitValueOr(9, true)));

    const adr1PressureAltitude = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_1_ALTITUDE');
    const adr2PressureAltitude = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_2_ALTITUDE');
    const adr3PressureAltitude = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_ALTITUDE');

    this.irExcessMotion.set(
      this.ir1MaintWord.bitValueOr(13, false) ||
        this.ir2MaintWord.bitValueOr(13, false) ||
        this.ir3MaintWord.bitValueOr(13, false),
    );

    this.adr1Faulty.set(!(!this.acESSBusPowered.get() || flightPhase112) && adr1Fault);
    this.adr2Faulty.set(!(!this.ac4BusPowered.get() || flightPhase112) && adr2Fault);
    this.adr3Faulty.set(!(!this.ac2BusPowered.get() || flightPhase112) && adr3Fault);

    this.adirsRemainingAlignTime.set(SimVar.GetSimVarValue('L:A32NX_ADIRS_REMAINING_IR_ALIGNMENT_TIME', 'Seconds'));

    // TODO use GPS alt if ADRs not available
    this.adrPressureAltitude.set(
      adr1PressureAltitude.valueOr(null) ?? adr2PressureAltitude.valueOr(null) ?? adr3PressureAltitude.valueOr(null),
    );
    this.ir1Align.set(
      this.ir1MaintWord.bitValueOr(16, false) ||
        this.ir1MaintWord.bitValueOr(17, false) ||
        this.ir1MaintWord.bitValueOr(18, false),
    );
    this.ir2Align.set(
      this.ir2MaintWord.bitValueOr(16, false) ||
        this.ir2MaintWord.bitValueOr(17, false) ||
        this.ir2MaintWord.bitValueOr(18, false),
    );
    this.ir3Align.set(
      this.ir3MaintWord.bitValueOr(16, false) ||
        this.ir3MaintWord.bitValueOr(17, false) ||
        this.ir3MaintWord.bitValueOr(18, false),
    );
    this.adiru1ModeSelector.set(SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'enum'));
    this.adiru2ModeSelector.set(SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB', 'enum'));
    this.adiru3ModeSelector.set(SimVar.GetSimVarValue('L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB', 'enum'));
    // RA acquisition
    this.radioHeight1.setFromSimVar('L:A32NX_RA_1_RADIO_ALTITUDE');
    this.radioHeight2.setFromSimVar('L:A32NX_RA_2_RADIO_ALTITUDE');
    this.radioHeight3.setFromSimVar('L:A32NX_RA_3_RADIO_ALTITUDE');
    this.height1Failed.set(this.radioHeight1.isFailureWarning());
    this.height2Failed.set(this.radioHeight2.isFailureWarning());
    this.height3Failed.set(this.radioHeight3.isFailureWarning());
    // overspeed
    const adr3MaxCas = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_MAX_AIRSPEED');

    this.trueNorthRef.set(SimVar.GetSimVarValue('L:A32NX_PUSH_TRUE_REF', 'number'));

    /* V1 callout */
    const v1 = SimVar.GetSimVarValue('L:AIRLINER_V1_SPEED', SimVarValueType.Knots);
    const v1Threshold = v1 - 4;
    const v1ConfirmNodeStatus = this.v1SpeedConfirmNode.read();
    this.v1SpeedConfirmNode.write(
      v1 &&
        (this.adr1Cas.get().valueOr(0) > v1Threshold ||
          this.adr2Cas.get().valueOr(0) > v1Threshold ||
          this.adr3Cas.get().valueOr(0) > v1Threshold),
      deltaTime,
    );
    if (
      this.flightPhase.get() === 4 &&
      this.v1SpeedConfirmNode.read() &&
      !v1ConfirmNodeStatus &&
      this.v1SpeedConfirmNode.read()
    ) {
      this.soundManager.enqueueSound('v1');
    }

    /* LANDING GEAR AND LIGHTS acquisition */

    this.antiSkidSwitchOff.set(!SimVar.GetSimVarValue('ANTISKID BRAKES ACTIVE', 'bool'));

    const brakesHot = SimVar.GetSimVarValue('L:A32NX_BRAKES_HOT', 'bool');

    this.brakesHot.set(brakesHot && !this.phase815MinConfNode.read());

    this.lgciu1Fault.set(SimVar.GetSimVarValue('L:A32NX_LGCIU_1_FAULT', 'bool'));
    this.lgciu2Fault.set(SimVar.GetSimVarValue('L:A32NX_LGCIU_2_FAULT', 'bool'));
    this.lgciu1DiscreteWord1.setFromSimVar('L:A32NX_LGCIU_1_DISCRETE_WORD_1');
    this.lgciu2DiscreteWord1.setFromSimVar('L:A32NX_LGCIU_2_DISCRETE_WORD_1');
    this.lgciu1DiscreteWord2.setFromSimVar('L:A32NX_LGCIU_1_DISCRETE_WORD_2');
    this.lgciu2DiscreteWord2.setFromSimVar('L:A32NX_LGCIU_2_DISCRETE_WORD_2');
    const parkBrakeSet = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
    this.parkBrake.set(parkBrakeSet);
    this.lgParkBrkOn.set(this.parkBrake2sConfNode.write(parkBrakeSet, deltaTime));
    this.configParkBrakeOn.set(
      this.confingParkBrakeOnMemoryNode.write(phase3 && parkBrakeSet, !parkBrakeSet || phase6),
    );
    this.nwSteeringDisc.set(SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool'));
    const leftCompressedHardwireLgciu1 =
      this.dcESSBusPowered.get() && SimVar.GetSimVarValue('L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', 'bool') > 0;
    const leftCompressedHardwireLgciu2 =
      this.dc2BusPowered.get() && SimVar.GetSimVarValue('L:A32NX_LGCIU_2_LEFT_GEAR_COMPRESSED', 'bool') > 0;
    this.gearLeverPos.set(SimVar.GetSimVarValue('GEAR HANDLE POSITION', 'bool'));

    // General logic
    const mainGearDownlocked =
      (this.lgciu1DiscreteWord1.bitValueOr(23, false) || this.lgciu2DiscreteWord1.bitValueOr(23, false)) &&
      (this.lgciu1DiscreteWord1.bitValueOr(24, false) || this.lgciu2DiscreteWord1.bitValueOr(24, false));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      this.radioHeight1.isNoComputedData() &&
        this.radioHeight2.isNoComputedData() &&
        this.radioHeight3.isNoComputedData() &&
        !lgciuOnGroundDisagree,
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
    this.ra3OnGroundMem.write(
      this.radioHeight3.value < 5,
      !leftCompressedHardwireLgciu1 || !leftCompressedHardwireLgciu2,
    );
    const ra1OnGround =
      (this.radioHeight1.isNormalOperation() || this.radioHeight1.isFunctionalTest()) &&
      (this.radioHeight1.value < 5 || this.ra1OnGroundMem.read());
    const ra2OnGround =
      (this.radioHeight2.isNormalOperation() || this.radioHeight2.isFunctionalTest()) &&
      (this.radioHeight2.value < 5 || this.ra2OnGroundMem.read());
    const ra3OnGround =
      (this.radioHeight3.isNormalOperation() || this.radioHeight3.isFunctionalTest()) &&
      (this.radioHeight3.value < 5 || this.ra3OnGroundMem.read());
    const onGroundCount = countTrue(
      leftCompressedHardwireLgciu1,
      leftCompressedHardwireLgciu2,
      ra1OnGround,
      ra2OnGround,
      ra3OnGround,
    );
    const raInvalid =
      this.radioHeight1.isFailureWarning() ||
      this.radioHeight2.isFailureWarning() ||
      this.radioHeight3.isFailureWarning();
    this.onGroundImmediate =
      (onGroundA && this.ignoreRaOnGroundTrigger.read()) ||
      (onGroundCount > 2 && !raInvalid) ||
      (onGroundCount > 1 && raInvalid);
    this.aircraftOnGround.set(this.onGroundConf.write(this.onGroundImmediate, deltaTime));

    // AP OFF
    const apEngaged = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'Bool');
    this.autoPilotDisengagedInstantPulse.write(apEngaged, deltaTime);

    const apDiscPressedInLast1p8SecBeforeThisCycle = this.autoPilotInstinctiveDiscPressedInLast1p9Sec.read();
    this.autoPilotInstinctiveDiscPressedInLast1p9Sec.write(this.autoPilotInstinctiveDiscPressedPulse.read(), deltaTime);

    const voluntaryApDisc =
      this.autoPilotDisengagedInstantPulse.read() && this.autoPilotInstinctiveDiscPressedInLast1p9Sec.read();
    this.autoPilotOffVoluntaryEndAfter1p9s.write(voluntaryApDisc, deltaTime);
    this.autoPilotOffVoluntaryDiscPulse.write(voluntaryApDisc, deltaTime);

    this.autoPilotOffVoluntaryFirstCavalryChargeActive.write(this.autoPilotOffVoluntaryDiscPulse.read(), deltaTime);
    this.autoPilotOffVoluntaryFirstCavalryChargeActivePulse.write(
      this.autoPilotOffVoluntaryFirstCavalryChargeActive.read(),
      deltaTime,
    );

    this.autoPilotFirstCavalryStillWithinFirst0p3s.write(
      this.autoPilotOffVoluntaryFirstCavalryChargeActive.read(),
      deltaTime,
    );

    this.autoPilotInstinctiveDiscPressedTwiceInLast1p9Sec.write(
      this.autoPilotInstinctiveDiscPressedPulse.read() &&
        (this.autoPilotInstinctiveDiscCountSinceLastFwsCycle > 1 || apDiscPressedInLast1p8SecBeforeThisCycle),
      deltaTime,
    );

    this.autoPilotOffVoluntaryMemory.write(
      this.autoPilotOffVoluntaryDiscPulse.read(),
      apEngaged ||
        (this.autoPilotInstinctiveDiscPressedTwiceInLast1p9Sec.read() &&
          !this.autoPilotFirstCavalryStillWithinFirst0p3s.read()) ||
        !this.autoPilotOffVoluntaryEndAfter1p9s.read(),
    );

    const discPbPressedAfterDisconnection =
      !this.autoPilotDisengagedInstantPulse.read() &&
      (this.autoPilotInstinctiveDiscPressedPulse.read() || masterWarningButtonLeft || masterWarningButtonRight);

    this.autoPilotOffUnacknowledged.write(
      this.autoPilotDisengagedInstantPulse.read(),
      apEngaged || this.autoPilotInstinctiveDiscPressedTwiceInLast1p9Sec.read() || discPbPressedAfterDisconnection,
    );

    this.autoPilotOffInvoluntaryMemory.write(
      !apEngaged && !this.autoPilotOffVoluntaryMemory.read() && this.autoPilotOffUnacknowledged.read(),
      !this.autoPilotOffUnacknowledged.read(),
    );
    this.autoPilotOffInvoluntary.set(this.autoPilotOffInvoluntaryMemory.read());
    this.autoPilotOffShowMemo.set(this.autoPilotOffVoluntaryMemory.read() || this.autoPilotOffInvoluntaryMemory.read());

    if (this.autoPilotDisengagedInstantPulse.read()) {
      // Request quiet CRC one time
      this.requestMasterWarningFromApOff = true;
      this.soundManager.setVolume(FwsAuralVolume.Attenuated);
      this.soundManager.enqueueSound('cavalryChargeCont'); // On the A380, first cav charge can be cancelled early
    }
    if (this.autoPilotOffVoluntaryFirstCavalryChargeActivePulse.read()) {
      this.soundManager.dequeueSound('cavalryChargeCont');
      this.soundManager.setVolume(FwsAuralVolume.Full);
    }
    if (!this.autoPilotOffVoluntaryMemory.read() && !this.autoPilotOffInvoluntaryMemory.read()) {
      this.requestMasterWarningFromApOff = false;
      this.soundManager.dequeueSound('cavalryChargeCont');
      this.soundManager.setVolume(FwsAuralVolume.Full);
    }

    this.autoPilotInstinctiveDiscPressedPulse.write(false, deltaTime);

    // approach capability downgrade. Debounce first, then suppress for a certain amount of time
    // (to avoid multiple triple clicks, and a delay which is too long)
    const newCapability = SimVar.GetSimVarValue('L:A32NX_APPROACH_CAPABILITY', SimVarValueType.Number);
    const capabilityDowngrade = newCapability < this.approachCapability.get() && newCapability > 0;
    this.approachCapabilityDowngradeDebounce.write(
      capabilityDowngrade && flightPhase189 && !this.approachCapabilityDowngradeSuppress.read(),
      deltaTime,
    );
    this.approachCapabilityDowngradeDebouncePulse.write(this.approachCapabilityDowngradeDebounce.read(), deltaTime);
    this.approachCapabilityDowngradeSuppress.write(this.approachCapabilityDowngradeDebouncePulse.read(), deltaTime);
    // Capability downgrade after debounce --> triple click
    if (this.approachCapabilityDowngradeDebouncePulse.read()) {
      this.soundManager.enqueueSound('tripleClick');
    }
    this.approachCapability.set(newCapability);

    // A/THR OFF
    const aThrEngaged = this.autoThrustStatus.get() === 2 || this.autoThrustMode.get() !== 0;
    this.autoThrustDisengagedInstantPulse.write(aThrEngaged, deltaTime);
    this.autoThrustInstinctiveDiscPressed.write(false, deltaTime);

    const below50ft =
      this.radioHeight1.valueOr(2500) < 50 &&
      this.radioHeight2.valueOr(2500) < 50 &&
      this.radioHeight3.valueOr(2500) < 50;

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
      this.autoBrakeOffMemoInhibited = false;
      this.requestMasterCautionFromABrkOff = false;
      this.autoBrakeOffAuralTriggered = false;
    }

    this.autoBrakeOffAuralConfirmNode.write(
      this.autoBrakeDeactivatedNode.read() && !this.autoBrakeOffMemoInhibited,
      deltaTime,
    );

    const autoBrakeOffShouldTrigger =
      this.aircraftOnGround.get() &&
      this.computedAirSpeedToNearest2.get() > 33 &&
      this.autoBrakeDeactivatedNode.read() &&
      !this.autoBrakeOffMemoInhibited;

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

    this.btvExitMissedPulseNode.write(
      SimVar.GetSimVarValue('L:A32NX_BTV_EXIT_MISSED', SimVarValueType.Bool),
      deltaTime,
    );

    if (this.btvExitMissedPulseNode.read()) {
      this.soundManager.enqueueSound('tripleClick');
    }

    // Engine Logic
    this.thrustLeverNotSet.set(this.autothrustLeverWarningFlex.get() || this.autothrustLeverWarningToga.get());
    // FIXME ECU doesn't have the necessary output words so we go purely on TLA
    const flexThrustLimit = SimVar.GetSimVarValue('L:A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE', 'number') === 3;
    const engOneOrTwoTakeoffPower =
      this.throttle1Position.get() >= 45 ||
      (this.throttle1Position.get() >= 35 && flexThrustLimit) ||
      this.throttle2Position.get() >= 45 ||
      (this.throttle2Position.get() >= 35 && flexThrustLimit);

    const engThreeOrFourTakeoffPower =
      this.throttle3Position.get() >= 45 ||
      (this.throttle3Position.get() >= 35 && flexThrustLimit) ||
      this.throttle4Position.get() >= 45 ||
      (this.throttle4Position.get() >= 35 && flexThrustLimit);

    this.eng1Or2TakeoffPowerConfirm.write(engOneOrTwoTakeoffPower, deltaTime);
    this.eng3Or4TakeoffPowerConfirm.write(engThreeOrFourTakeoffPower, deltaTime);
    const raAbove1500 =
      this.radioHeight1.valueOr(0) > 1500 || this.radioHeight2.valueOr(0) > 1500 || this.radioHeight3.valueOr(0) > 1500;
    this.eng1Or2TakeoffPower.set(engOneOrTwoTakeoffPower || (this.eng1Or2TakeoffPowerConfirm.read() && !raAbove1500));
    this.eng3Or4TakeoffPower.set(
      engThreeOrFourTakeoffPower || (this.eng3Or4TakeoffPowerConfirm.read() && !raAbove1500),
    );

    this.engDualFault.set(
      !this.aircraftOnGround.get() &&
        ((this.fireButtonEng1.get() && this.fireButtonEng2.get()) ||
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

    let overspeedWarning = this.adr3OverspeedWarning.write(
      this.adr3Cas.get().isNormalOperation() &&
        adr3MaxCas.isNormalOperation() &&
        this.adr3Cas.get().value > adr3MaxCas.value + 8,
      this.aircraftOnGround.get() ||
        !(this.adr3Cas.get().isNormalOperation() && adr3MaxCas.isNormalOperation()) ||
        this.adr3Cas.get().value < adr3MaxCas.value + 4,
    );
    if (
      !(adr1Discrete1.isNormalOperation() || adr1Discrete1.isFunctionalTest()) ||
      !(adr2Discrete1.isNormalOperation() || adr2Discrete1.isFunctionalTest())
    ) {
      const adr3Discrete1 = Arinc429Word.fromSimVarValue('L:A32NX_ADIRS_ADR_3_DISCRETE_WORD_1');
      overspeedWarning ||= adr3Discrete1.bitValueOr(9, false);
    }
    overspeedWarning ||= adr1Discrete1.bitValueOr(9, false) || adr2Discrete1.bitValueOr(9, false);
    const isOverspeed = (limit: number) => this.computedAirSpeedToNearest2.get() > limit + 4;
    const isOverMach = (limit: number) => this.machSelectedFromAdr.get() > limit + 0.006;
    this.overspeedVmo.set(
      !this.isAllGearDownlocked && this.flapsIndex.get() === 0 && (isOverspeed(Vmo) || isOverMach(Mmo)),
    );
    this.overspeedVle.set(
      this.isAllGearDownlocked && this.flapsIndex.get() === 0 && (isOverspeed(Vle) || isOverMach(Mle)),
    );
    this.overspeedVfeConf1.set(this.flapsIndex.get() === 1 && isOverspeed(VfeF1));
    this.overspeedVfeConf1F.set(this.flapsIndex.get() === 2 && isOverspeed(VfeF1F));
    this.overspeedVfeConf2.set(this.flapsIndex.get() === 3 && isOverspeed(VfeF2));
    this.overspeedVfeConf3.set((this.flapsIndex.get() === 4 || this.flapsIndex.get() === 5) && isOverspeed(VfeF3));
    this.overspeedVfeConfFull.set(this.flapsIndex.get() === 6 && isOverspeed(VfeFF));

    // TO SPEEDS NOT INSERTED
    const fmToSpeedsNotInserted = fm1DiscreteWord3.bitValueOr(18, false) && fm2DiscreteWord3.bitValueOr(18, false);

    this.toConfigAndNoToSpeedsPulseNode.write(fmToSpeedsNotInserted && this.toConfigTestRaw, deltaTime);

    if (fmToSpeedsNotInserted && (this.toConfigTestRaw || phase3) && !this.toSpeedsNotInserted) {
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
      (this.toConfigCheckedInPhase2Or3 || phase3) &&
        !this.toConfigPulseNode.read() &&
        !this.flightPhase3PulseNode.read() &&
        toSpeedsTooLow,
    );

    // TO V1/VR/V2 DISAGREE
    const toV2VRV2Disagree = fm1DiscreteWord3.bitValueOr(16, false) && fm2DiscreteWord3.bitValueOr(16, false);
    this.toV2VRV2DisagreeWarning.set(
      (this.toConfigCheckedInPhase2Or3 || phase3) &&
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

    this.fmcAFault.set(!SimVar.GetSimVarValue('L:A32NX_FMC_A_IS_HEALTHY', 'bool'));
    this.fmcBFault.set(!SimVar.GetSimVarValue('L:A32NX_FMC_B_IS_HEALTHY', 'bool'));
    this.fmcCFault.set(!SimVar.GetSimVarValue('L:A32NX_FMC_C_IS_HEALTHY', 'bool'));
    this.fms1Fault.set(this.fmcAFault.get() && this.fmcCFault.get());
    this.fms2Fault.set(this.fmcBFault.get() && this.fmcCFault.get());

    /* 21 - AIR CONDITIONING AND PRESSURIZATION */

    this.flightLevel.set(Math.round(this.adrPressureAltitude.get() / 100));

    this.phase8ConfirmationNode60.write(this.flightPhase.get() === 8, deltaTime);

    this.phase8ConfirmationNode180.write(this.flightPhase.get() === 8, deltaTime);

    this.fdac1Channel1Failure.set(SimVar.GetSimVarValue('L:A32NX_COND_FDAC_1_CHANNEL_1_FAILURE', 'bool'));
    this.fdac1Channel2Failure.set(SimVar.GetSimVarValue('L:A32NX_COND_FDAC_1_CHANNEL_2_FAILURE', 'bool'));
    this.fdac2Channel1Failure.set(SimVar.GetSimVarValue('L:A32NX_COND_FDAC_2_CHANNEL_1_FAILURE', 'bool'));
    this.fdac2Channel2Failure.set(SimVar.GetSimVarValue('L:A32NX_COND_FDAC_2_CHANNEL_2_FAILURE', 'bool'));

    const cpiomBAgsAppDiscreteWord1 = Arinc429Register.empty();
    const cpiomBAgsAppDiscreteWord2 = Arinc429Register.empty();
    const cpiomBAgsAppDiscreteWord3 = Arinc429Register.empty();
    const cpiomBAgsAppDiscreteWord4 = Arinc429Register.empty();

    cpiomBAgsAppDiscreteWord1.setFromSimVar('L:A32NX_COND_CPIOM_B1_AGS_DISCRETE_WORD');
    cpiomBAgsAppDiscreteWord2.setFromSimVar('L:A32NX_COND_CPIOM_B2_AGS_DISCRETE_WORD');
    cpiomBAgsAppDiscreteWord3.setFromSimVar('L:A32NX_COND_CPIOM_B3_AGS_DISCRETE_WORD');
    cpiomBAgsAppDiscreteWord4.setFromSimVar('L:A32NX_COND_CPIOM_B4_AGS_DISCRETE_WORD');

    const cpiomBVcsAppDiscreteWord1 = Arinc429Register.empty();
    const cpiomBVcsAppDiscreteWord2 = Arinc429Register.empty();
    const cpiomBVcsAppDiscreteWord3 = Arinc429Register.empty();
    const cpiomBVcsAppDiscreteWord4 = Arinc429Register.empty();

    cpiomBVcsAppDiscreteWord1.setFromSimVar('L:A32NX_COND_CPIOM_B1_VCS_DISCRETE_WORD');
    cpiomBVcsAppDiscreteWord2.setFromSimVar('L:A32NX_COND_CPIOM_B2_VCS_DISCRETE_WORD');
    cpiomBVcsAppDiscreteWord3.setFromSimVar('L:A32NX_COND_CPIOM_B3_VCS_DISCRETE_WORD');
    cpiomBVcsAppDiscreteWord4.setFromSimVar('L:A32NX_COND_CPIOM_B4_VCS_DISCRETE_WORD');

    const cpiomBTcsAppDiscreteWord1 = Arinc429Register.empty();
    const cpiomBTcsAppDiscreteWord2 = Arinc429Register.empty();
    const cpiomBTcsAppDiscreteWord3 = Arinc429Register.empty();
    const cpiomBTcsAppDiscreteWord4 = Arinc429Register.empty();

    cpiomBTcsAppDiscreteWord1.setFromSimVar('L:A32NX_COND_CPIOM_B1_TCS_DISCRETE_WORD');
    cpiomBTcsAppDiscreteWord2.setFromSimVar('L:A32NX_COND_CPIOM_B2_TCS_DISCRETE_WORD');
    cpiomBTcsAppDiscreteWord3.setFromSimVar('L:A32NX_COND_CPIOM_B3_TCS_DISCRETE_WORD');
    cpiomBTcsAppDiscreteWord4.setFromSimVar('L:A32NX_COND_CPIOM_B4_TCS_DISCRETE_WORD');

    const cpiomBCpcsAppDiscreteWord1 = Arinc429Register.empty();
    const cpiomBCpcsAppDiscreteWord2 = Arinc429Register.empty();
    const cpiomBCpcsAppDiscreteWord3 = Arinc429Register.empty();
    const cpiomBCpcsAppDiscreteWord4 = Arinc429Register.empty();

    cpiomBCpcsAppDiscreteWord1.setFromSimVar('L:A32NX_COND_CPIOM_B1_CPCS_DISCRETE_WORD');
    cpiomBCpcsAppDiscreteWord2.setFromSimVar('L:A32NX_COND_CPIOM_B2_CPCS_DISCRETE_WORD');
    cpiomBCpcsAppDiscreteWord3.setFromSimVar('L:A32NX_COND_CPIOM_B3_CPCS_DISCRETE_WORD');
    cpiomBCpcsAppDiscreteWord4.setFromSimVar('L:A32NX_COND_CPIOM_B4_CPCS_DISCRETE_WORD');

    let vcsDiscreteWordToUse;

    if (cpiomBVcsAppDiscreteWord1.isNormalOperation()) {
      vcsDiscreteWordToUse = cpiomBVcsAppDiscreteWord1;
    } else if (cpiomBVcsAppDiscreteWord2.isNormalOperation()) {
      vcsDiscreteWordToUse = cpiomBVcsAppDiscreteWord2;
    } else if (cpiomBVcsAppDiscreteWord3.isNormalOperation()) {
      vcsDiscreteWordToUse = cpiomBVcsAppDiscreteWord3;
    } else {
      vcsDiscreteWordToUse = cpiomBVcsAppDiscreteWord4;
    }

    let tcsDiscreteWordToUse;

    if (cpiomBTcsAppDiscreteWord1.isNormalOperation()) {
      tcsDiscreteWordToUse = cpiomBTcsAppDiscreteWord1;
    } else if (cpiomBTcsAppDiscreteWord2.isNormalOperation()) {
      tcsDiscreteWordToUse = cpiomBTcsAppDiscreteWord2;
    } else if (cpiomBTcsAppDiscreteWord3.isNormalOperation()) {
      tcsDiscreteWordToUse = cpiomBTcsAppDiscreteWord3;
    } else {
      tcsDiscreteWordToUse = cpiomBTcsAppDiscreteWord4;
    }

    let cpcsDiscreteWordToUse: Arinc429Register;
    let cpcsToUseId: number;

    if (cpiomBCpcsAppDiscreteWord1.isNormalOperation()) {
      cpcsDiscreteWordToUse = cpiomBCpcsAppDiscreteWord1;
      cpcsToUseId = 1;
    } else if (cpiomBCpcsAppDiscreteWord2.isNormalOperation()) {
      cpcsDiscreteWordToUse = cpiomBCpcsAppDiscreteWord2;
      cpcsToUseId = 2;
    } else if (cpiomBCpcsAppDiscreteWord3.isNormalOperation()) {
      cpcsDiscreteWordToUse = cpiomBCpcsAppDiscreteWord3;
      cpcsToUseId = 3;
    } else {
      cpcsDiscreteWordToUse = cpiomBCpcsAppDiscreteWord4;
      cpcsToUseId = 4;
    }

    this.oneTcsAppFailed.set(
      cpiomBTcsAppDiscreteWord1.isFailureWarning() ||
        cpiomBTcsAppDiscreteWord2.isFailureWarning() ||
        cpiomBTcsAppDiscreteWord3.isFailureWarning() ||
        cpiomBTcsAppDiscreteWord4.isFailureWarning(),
    );

    this.tempCtrDegraded.set(
      cpiomBTcsAppDiscreteWord1.isFailureWarning() &&
        cpiomBTcsAppDiscreteWord2.isFailureWarning() &&
        cpiomBTcsAppDiscreteWord3.isFailureWarning() &&
        cpiomBTcsAppDiscreteWord4.isFailureWarning(),
    );

    this.pack1Degraded.set(
      cpiomBAgsAppDiscreteWord1.isFailureWarning() && cpiomBAgsAppDiscreteWord3.isFailureWarning(),
    );
    this.pack2Degraded.set(
      cpiomBAgsAppDiscreteWord2.isFailureWarning() && cpiomBAgsAppDiscreteWord4.isFailureWarning(),
    );

    this.pack1RedundLost.set(
      cpiomBAgsAppDiscreteWord1.isFailureWarning() || cpiomBAgsAppDiscreteWord3.isFailureWarning(),
    );
    this.pack2RedundLost.set(
      cpiomBAgsAppDiscreteWord2.isFailureWarning() || cpiomBAgsAppDiscreteWord4.isFailureWarning(),
    );

    this.pack1On.set(SimVar.GetSimVarValue('L:A32NX_OVHD_COND_PACK_1_PB_IS_ON', 'bool'));
    this.pack2On.set(SimVar.GetSimVarValue('L:A32NX_OVHD_COND_PACK_2_PB_IS_ON', 'bool'));

    this.pack1Off.set(!this.pack1On.get() && this.phase8ConfirmationNode60.read());
    this.pack2Off.set(!this.pack2On.get() && this.phase8ConfirmationNode60.read());

    // TODO: Add fault when on ground, with one engine running and one door open
    // TODO: Add pack overheat
    this.pack1And2Fault.set(
      ((this.fdac1Channel1Failure.get() &&
        this.fdac1Channel2Failure.get() &&
        this.fdac2Channel1Failure.get() &&
        this.fdac2Channel2Failure.get()) ||
        (!this.pack1On.get() && !this.pack2On.get())) &&
        this.phase8ConfirmationNode180.read(),
    );

    this.ramAirOn.set(SimVar.GetSimVarValue('L:A32NX_OVHD_COND_RAM_AIR_PB_IS_ON', 'bool'));

    this.cabinAirExtractOn.set(SimVar.GetSimVarValue('L:A32NX_VENT_OVERPRESSURE_RELIEF_VALVE_IS_OPEN', 'bool'));

    const fan1Fault = vcsDiscreteWordToUse.bitValueOr(18, false);
    const fan2Fault = vcsDiscreteWordToUse.bitValueOr(19, false);
    const fan3Fault = vcsDiscreteWordToUse.bitValueOr(20, false);
    const fan4Fault = vcsDiscreteWordToUse.bitValueOr(21, false);

    this.numberOfCabinFanFaults.set([fan1Fault, fan2Fault, fan3Fault, fan4Fault].filter((fan) => fan === true).length);

    this.allCabinFansFault.set(fan1Fault && fan2Fault && fan3Fault && fan4Fault);

    this.bulkCargoHeaterFault.set(vcsDiscreteWordToUse.bitValueOr(22, false));
    this.fwdIsolValveOpen.set(vcsDiscreteWordToUse.bitValueOr(14, false));
    this.fwdIsolValveFault.set(vcsDiscreteWordToUse.bitValueOr(23, false));
    this.bulkIsolValveOpen.set(vcsDiscreteWordToUse.bitValueOr(16, false));
    this.bulkIsolValveFault.set(vcsDiscreteWordToUse.bitValueOr(24, false));

    this.fwdIsolValvePbOn.set(SimVar.GetSimVarValue('L:A32NX_OVHD_CARGO_AIR_ISOL_VALVES_FWD_PB_IS_ON', 'bool'));
    this.bulkIsolValvePbOn.set(SimVar.GetSimVarValue('L:A32NX_OVHD_CARGO_AIR_ISOL_VALVES_BULK_PB_IS_ON', 'bool'));

    this.hotAir1Disagrees.set(tcsDiscreteWordToUse.bitValueOr(13, false));
    this.hotAir2Disagrees.set(tcsDiscreteWordToUse.bitValueOr(14, false));

    this.hotAir1Open.set(tcsDiscreteWordToUse.bitValueOr(15, false));
    this.hotAir2Open.set(tcsDiscreteWordToUse.bitValueOr(16, false));

    this.hotAir1PbOn.set(SimVar.GetSimVarValue('L:A32NX_OVHD_COND_HOT_AIR_1_PB_IS_ON', 'bool'));
    this.hotAir2PbOn.set(SimVar.GetSimVarValue('L:A32NX_OVHD_COND_HOT_AIR_2_PB_IS_ON', 'bool'));

    this.taddChannel1Failure.set(SimVar.GetSimVarValue('L:A32NX_COND_TADD_CHANNEL_1_FAILURE', 'bool'));
    this.taddChannel2Failure.set(SimVar.GetSimVarValue('L:A32NX_COND_TADD_CHANNEL_2_FAILURE', 'bool'));

    this.tempCtlFault.set(
      (this.taddChannel1Failure.get() && this.taddChannel2Failure.get()) ||
        (this.fdac1Channel1Failure.get() &&
          this.fdac1Channel2Failure.get() &&
          this.fdac2Channel1Failure.get() &&
          this.fdac2Channel2Failure.get()),
    );

    this.vcmFwdChannel1Failure.set(SimVar.GetSimVarValue('L:A32NX_VENT_FWD_VCM_CHANNEL_1_FAILURE', 'bool'));
    this.vcmFwdChannel2Failure.set(SimVar.GetSimVarValue('L:A32NX_VENT_FWD_VCM_CHANNEL_2_FAILURE', 'bool'));
    this.vcmAftChannel1Failure.set(SimVar.GetSimVarValue('L:A32NX_VENT_AFT_VCM_CHANNEL_1_FAILURE', 'bool'));
    this.vcmAftChannel2Failure.set(SimVar.GetSimVarValue('L:A32NX_VENT_AFT_VCM_CHANNEL_2_FAILURE', 'bool'));

    this.fwdVentCtrDegraded.set(
      !cpiomBVcsAppDiscreteWord1.isNormalOperation() && !cpiomBVcsAppDiscreteWord3.isNormalOperation(),
    );
    this.fwdVentRedundLost.set(
      !cpiomBVcsAppDiscreteWord1.isNormalOperation() || !cpiomBVcsAppDiscreteWord3.isNormalOperation(),
    );

    this.aftVentCtrDegraded.set(
      !cpiomBVcsAppDiscreteWord2.isNormalOperation() && !cpiomBVcsAppDiscreteWord4.isNormalOperation(),
    );
    this.aftVentRedundLost.set(
      !cpiomBVcsAppDiscreteWord2.isNormalOperation() || !cpiomBVcsAppDiscreteWord4.isNormalOperation(),
    );

    const engNotRunning =
      !this.engine1Running.get() &&
      !this.engine2Running.get() &&
      !this.engine3Running.get() &&
      !this.engine4Running.get();
    this.enginesOffAndOnGroundSignal.write(this.aircraftOnGround.get() && engNotRunning, deltaTime); // FIXME eng running should use core speed at above min idle

    const manExcessAltitude = SimVar.GetSimVarValue('L:A32NX_PRESS_MAN_EXCESSIVE_CABIN_ALTITUDE', 'bool');
    this.excessCabinAltitude.set(cpcsDiscreteWordToUse.bitValueOr(13, false) || manExcessAltitude);

    this.excessDiffPressure.set(cpcsDiscreteWordToUse.bitValueOr(14, false));

    this.diffPressure.setFromSimVar(`L:A32NX_PRESS_CABIN_DELTA_PRESSURE_B${cpcsToUseId}`);

    const outflowValve1OpenAmount = Arinc429Register.empty();
    const outflowValve2OpenAmount = Arinc429Register.empty();
    const outflowValve3OpenAmount = Arinc429Register.empty();
    const outflowValve4OpenAmount = Arinc429Register.empty();

    outflowValve1OpenAmount.setFromSimVar(`L:A32NX_PRESS_OUTFLOW_VALVE_1_OPEN_PERCENTAGE_B${cpcsToUseId}`);
    outflowValve2OpenAmount.setFromSimVar(`L:A32NX_PRESS_OUTFLOW_VALVE_2_OPEN_PERCENTAGE_B${cpcsToUseId}`);
    outflowValve3OpenAmount.setFromSimVar(`L:A32NX_PRESS_OUTFLOW_VALVE_3_OPEN_PERCENTAGE_B${cpcsToUseId}`);
    outflowValve4OpenAmount.setFromSimVar(`L:A32NX_PRESS_OUTFLOW_VALVE_4_OPEN_PERCENTAGE_B${cpcsToUseId}`);

    this.allOutflowValvesOpen.set(
      outflowValve1OpenAmount.value > 99 &&
        outflowValve2OpenAmount.value > 99 &&
        outflowValve3OpenAmount.value > 99 &&
        outflowValve4OpenAmount.value > 99,
    );

    this.ocsm1AutoFailure.set(SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_1_AUTO_PARTITION_FAILURE', 'bool'));
    this.ocsm2AutoFailure.set(SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_2_AUTO_PARTITION_FAILURE', 'bool'));
    this.ocsm3AutoFailure.set(SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_3_AUTO_PARTITION_FAILURE', 'bool'));
    this.ocsm4AutoFailure.set(SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_4_AUTO_PARTITION_FAILURE', 'bool'));

    this.ocsmAutoCtlFault.set(
      (cpiomBCpcsAppDiscreteWord1.isFailureWarning() &&
        cpiomBCpcsAppDiscreteWord2.isFailureWarning() &&
        cpiomBCpcsAppDiscreteWord3.isFailureWarning() &&
        cpiomBCpcsAppDiscreteWord4.isFailureWarning()) ||
        (this.ocsm1AutoFailure.get() &&
          this.ocsm2AutoFailure.get() &&
          this.ocsm3AutoFailure.get() &&
          this.ocsm4AutoFailure.get()),
    );

    const ocsm1Channel1Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_1_CHANNEL_1_FAILURE', 'bool');
    const ocsm1Channel2Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_1_CHANNEL_2_FAILURE', 'bool');
    const ocsm2Channel1Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_2_CHANNEL_1_FAILURE', 'bool');
    const ocsm2Channel2Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_2_CHANNEL_2_FAILURE', 'bool');
    const ocsm3Channel1Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_3_CHANNEL_1_FAILURE', 'bool');
    const ocsm3Channel2Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_3_CHANNEL_2_FAILURE', 'bool');
    const ocsm4Channel1Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_4_CHANNEL_1_FAILURE', 'bool');
    const ocsm4Channel2Failure = SimVar.GetSimVarValue('L:A32NX_PRESS_OCSM_4_CHANNEL_2_FAILURE', 'bool');

    this.ocsm1Failure.set(ocsm1Channel1Failure && ocsm1Channel2Failure);
    this.ocsm2Failure.set(ocsm2Channel1Failure && ocsm2Channel2Failure);
    this.ocsm3Failure.set(ocsm3Channel1Failure && ocsm3Channel2Failure);
    this.ocsm4Failure.set(ocsm4Channel1Failure && ocsm4Channel2Failure);

    const numberOfCpcsFaults = [
      cpiomBCpcsAppDiscreteWord1.isFailureWarning(),
      cpiomBCpcsAppDiscreteWord2.isFailureWarning(),
      cpiomBCpcsAppDiscreteWord3.isFailureWarning(),
      cpiomBCpcsAppDiscreteWord4.isFailureWarning(),
    ].filter((cpcs) => cpcs === true).length;

    this.pressRedundLost.set(numberOfCpcsFaults > 1);

    this.pressSysFault.set(
      this.ocsm1Failure.get() && this.ocsm2Failure.get() && this.ocsm3Failure.get() && this.ocsm4Failure.get(),
    );

    this.manCabinAltMode.set(!SimVar.GetSimVarValue('L:A32NX_OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO', 'bool'));

    if (this.flightPhase12Or1112.get()) {
      this.cabinAltitude.setFromSimVar(`L:A32NX_PRESS_CABIN_ALTITUDE_B${cpcsToUseId}`);
    }

    if (flightPhase8) {
      this.landingElevation.setFromSimVar('L:A32NX_FM1_LANDING_ELEVATION');
      this.cabinAltitudeTarget.setFromSimVar(`L:A32NX_PRESS_CABIN_ALTITUDE_TARGET_B${cpcsToUseId}`);
    }

    // Cabin altitude in phase 1,2 11 or 12
    this.highLandingFieldElevation.set(
      (this.flightPhase.get() === 8
        ? this.manCabinAltMode.get()
          ? this.cabinAltitudeTarget.valueOr(0)
          : this.landingElevation.valueOr(0)
        : this.cabinAltitude.valueOr(0)) >= 8550,
    );

    // 0: Man, 1: Low, 2: Norm, 3: High
    this.flowSelectorKnob.set(SimVar.GetSimVarValue('L:A32NX_KNOB_OVHD_AIRCOND_PACKFLOW_Position', 'number'));

    /* 23 - COMMUNICATION */
    this.rmp1Fault.set(false); // Don't want to use failure consumer here, rather use health signal
    this.rmp1Off.set(SimVar.GetSimVarValue('L:A380X_RMP_1_BRIGHTNESS_KNOB', 'number') === 0);

    this.rmp2Fault.set(false);
    this.rmp2Off.set(SimVar.GetSimVarValue('L:A380X_RMP_2_BRIGHTNESS_KNOB', 'number') === 0);

    this.rmp3Fault.set(false);
    this.rmp3Off.set(SimVar.GetSimVarValue('L:A380X_RMP_3_BRIGHTNESS_KNOB', 'number') === 0);

    /* 24 - Electrical */
    this.extPwrConnected.set(
      SimVar.GetSimVarValue('L:A32NX_ELEC_CONTACTOR_990XG1_IS_CLOSED', 'bool') ||
        SimVar.GetSimVarValue('L:A32NX_ELEC_CONTACTOR_990XG2_IS_CLOSED', 'bool') ||
        SimVar.GetSimVarValue('L:A32NX_ELEC_CONTACTOR_990XG3_IS_CLOSED', 'bool') ||
        SimVar.GetSimVarValue('L:A32NX_ELEC_CONTACTOR_990XG4_IS_CLOSED', 'bool'),
    );

    this.allBatteriesOff.set(
      !(
        SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_1_PB_IS_AUTO', 'bool') ||
        SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_2_PB_IS_AUTO', 'bool') ||
        SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_ESS_PB_IS_AUTO', 'bool') ||
        SimVar.GetSimVarValue('L:A32NX_OVHD_ELEC_BAT_APU_PB_IS_AUTO', 'bool')
      ),
    );

    /* OTHER STUFF */

    const adrKnob = SimVar.GetSimVarValue('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum');
    this.airKnob.set(adrKnob);
    this.adr3UsedLeft.set(adrKnob === 0);
    this.adr3UsedRight.set(adrKnob === 2);
    const attKnob = SimVar.GetSimVarValue('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum');
    this.attKnob.set(attKnob);
    this.ir3UsedLeft.set(attKnob === 0);
    this.ir3UsedRight.set(attKnob === 2);
    this.compMesgCount.set(SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'number'));
    this.fmsSwitchingKnob.set(SimVar.GetSimVarValue('L:A32NX_FMS_SWITCHING_KNOB', 'enum'));
    this.seatBelt.set(SimVar.GetSimVarValue('A:CABIN SEATBELTS ALERT SWITCH', 'bool'));
    this.ndXfrKnob.set(SimVar.GetSimVarValue('L:A32NX_ECAM_ND_XFR_SWITCHING_KNOB', 'enum'));
    this.noMobileSwitchPosition.set(SimVar.GetSimVarValue('L:XMLVAR_SWITCH_OVHD_INTLT_NOSMOKING_Position', 'number'));
    this.strobeLightsOn.set(SimVar.GetSimVarValue('L:LIGHTING_STROBE_0', 'Bool'));

    this.voiceVhf3.set(this.rmp3ActiveMode.get() !== FrequencyMode.Data);

    /* FUEL */
    const feedTank1Low = SimVar.GetSimVarValue('FUELSYSTEM TANK WEIGHT:2', 'kilogram') < 1375;
    this.feedTank1Low.set(this.feedTank1LowConfirm.write(feedTank1Low, deltaTime));

    const feedTank2Low = SimVar.GetSimVarValue('FUELSYSTEM TANK WEIGHT:5', 'kilogram') < 1375;
    this.feedTank2Low.set(this.feedTank1LowConfirm.write(feedTank2Low, deltaTime));

    const feedTank3Low = SimVar.GetSimVarValue('FUELSYSTEM TANK WEIGHT:6', 'kilogram') < 1375;
    this.feedTank3Low.set(this.feedTank1LowConfirm.write(feedTank3Low, deltaTime));

    const feedTank4Low = SimVar.GetSimVarValue('FUELSYSTEM TANK WEIGHT:9', 'kilogram') < 1375;
    this.feedTank4Low.set(this.feedTank1LowConfirm.write(feedTank4Low, deltaTime));

    this.crossFeed1ValveOpen.set(SimVar.GetSimVarValue('FUELSYSTEM VALVE OPEN:46', 'kilogram') > 0.1);
    this.crossFeed2ValveOpen.set(SimVar.GetSimVarValue('FUELSYSTEM VALVE OPEN:47', 'kilogram') > 0.1);
    this.crossFeed3ValveOpen.set(SimVar.GetSimVarValue('FUELSYSTEM VALVE OPEN:48', 'kilogram') > 0.1);
    this.crossFeed4ValveOpen.set(SimVar.GetSimVarValue('FUELSYSTEM VALVE OPEN:49', 'kilogram') > 0.1);

    this.fmsZeroFuelWeight.setFromSimVar(`L:A32NX_FM${this.fwsNumber}_ZERO_FUEL_WEIGHT`);
    this.fmsZeroFuelWeightCg.setFromSimVar(`L:A32NX_FM${this.fwsNumber}_ZERO_FUEL_WEIGHT_CG`);

    this.fmsZfwOrZfwCgNotSet.set(
      this.fmsZeroFuelWeight.isNoComputedData() || this.fmsZeroFuelWeightCg.isNoComputedData(),
    );

    this.allEngineSwitchOff.set(
      !this.engine1ValueSwitch.get() &&
        !this.engine2ValueSwitch.get() &&
        !this.engine3ValueSwitch.get() &&
        !this.engine4ValueSwitch.get(),
    );
    this.allFuelPumpsOff.set(!this.feedTankPumps.some((v) => v.get()) && this.allEngineSwitchOff.get());

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

    this.prim2Healthy.set(SimVar.GetSimVarValue('L:A32NX_PRIM_2_HEALTHY', 'bool'));
    this.prim3Healthy.set(SimVar.GetSimVarValue('L:A32NX_PRIM_3_HEALTHY', 'bool'));

    // ELAC 1 FAULT computation
    const se1f =
      (fcdc1DiscreteWord1.bitValueOr(19, false) || fcdc2DiscreteWord1.bitValueOr(19, false)) &&
      (fcdc1DiscreteWord1.bitValueOr(20, false) || fcdc2DiscreteWord1.bitValueOr(20, false));
    const elac1FaultCondition =
      !(flightPhase112 && (fcdc1DiscreteWord3.bitValueOr(19, false) || fcdc2DiscreteWord3.bitValueOr(19, false))) &&
      this.dcESSBusPowered.get() &&
      (fcdc1DiscreteWord1.bitValueOr(23, false) ||
        fcdc2DiscreteWord1.bitValueOr(23, false) ||
        (!this.elac1HydConfirmNodeOutput.get() && se1f));
    this.elac1FaultLine123Display.set(
      !(fcdc1DiscreteWord3.bitValueOr(19, false) || fcdc2DiscreteWord3.bitValueOr(19, false)) &&
        (fcdc1DiscreteWord1.bitValueOr(23, false) || fcdc2DiscreteWord1.bitValueOr(23, false)),
    );
    this.elac1HydConfirmNodeOutput.set(this.elac1HydConfirmNode.write(!greenSysPressurised, deltaTime));
    this.elac1FaultConfirmNodeOutput.set(this.elac1FaultConfirmNode.write(elac1FaultCondition, deltaTime));

    // ELAC 2 FAULT computation
    const se2f =
      (fcdc1DiscreteWord1.bitValueOr(21, false) || fcdc2DiscreteWord1.bitValueOr(21, false)) &&
      (fcdc1DiscreteWord1.bitValueOr(22, false) || fcdc2DiscreteWord1.bitValueOr(22, false));
    const elac2FaultCondition =
      !(flightPhase112 && (fcdc1DiscreteWord3.bitValueOr(20, false) || fcdc2DiscreteWord3.bitValueOr(20, false))) &&
      this.dc2BusPowered.get() &&
      (fcdc1DiscreteWord1.bitValueOr(24, false) ||
        fcdc2DiscreteWord1.bitValueOr(24, false) ||
        (!this.elac2HydConfirmNodeOutput.get() && se2f));
    this.elac2FaultLine123Display.set(
      !(fcdc1DiscreteWord3.bitValueOr(20, false) || fcdc2DiscreteWord3.bitValueOr(20, false)) &&
        (fcdc1DiscreteWord1.bitValueOr(24, false) || fcdc2DiscreteWord1.bitValueOr(24, false)),
    );
    this.elac2HydConfirmNodeOutput.set(
      this.elac2HydConfirmNode.write(!greenSysPressurised || !yellowSysPressurised, deltaTime),
    );
    this.elac2FaultConfirmNodeOutput.set(this.elac2FaultConfirmNode.write(elac2FaultCondition, deltaTime));

    this.sec1Healthy.set(SimVar.GetSimVarValue('L:A32NX_SEC_1_HEALTHY', 'bool'));
    this.sec2Healthy.set(SimVar.GetSimVarValue('L:A32NX_SEC_2_HEALTHY', 'bool'));
    this.sec3Healthy.set(SimVar.GetSimVarValue('L:A32NX_SEC_3_HEALTHY', 'bool'));

    this.sec1FaultCondition.set(!flightPhase112 && !this.sec1Healthy.get() && this.dcESSBusPowered.get());
    this.sec1OffThenOnPulseNode.write(
      SimVar.GetSimVarValue('L:A32NX_SEC_1_PUSHBUTTON_PRESSED', SimVarValueType.Bool),
      deltaTime,
    );
    this.sec1OffThenOnMemoryNode.write(this.sec1OffThenOnPulseNode.read(), !this.sec1FaultCondition.get());

    this.sec2FaultCondition.set(!flightPhase112 && !this.sec2Healthy.get() && this.dc2BusPowered.get());
    this.sec2OffThenOnPulseNode.write(
      SimVar.GetSimVarValue('L:A32NX_SEC_2_PUSHBUTTON_PRESSED', SimVarValueType.Bool),
      deltaTime,
    );
    this.sec2OffThenOnMemoryNode.write(this.sec2OffThenOnPulseNode.read(), !this.sec2FaultCondition.get());

    this.sec3FaultCondition.set(!flightPhase112 && !this.sec3Healthy.get() && this.dc1BusPowered.get());
    this.sec3OffThenOnPulseNode.write(
      SimVar.GetSimVarValue('L:A32NX_SEC_3_PUSHBUTTON_PRESSED', SimVarValueType.Bool),
      deltaTime,
    );
    this.sec3OffThenOnMemoryNode.write(this.sec3OffThenOnPulseNode.read(), !this.sec3FaultCondition.get());

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
    this.altn2LawConfirmNodeOutput.set(this.altn2LawConfirmNode.write(SPA2 && !flightPhase112, deltaTime));

    // ALTN LAW 1 computation
    const SPA1 = fcdc1DiscreteWord1.bitValueOr(12, false) || fcdc2DiscreteWord1.bitValueOr(12, false);
    this.altn1LawConfirmNodeOutput.set(this.altn1LawConfirmNode.write(SPA1 && !flightPhase112, deltaTime));

    // DIRECT LAW computation
    const SPBUL =
      (false && SFCDC12FT) || fcdc1DiscreteWord1.bitValueOr(15, false) || fcdc2DiscreteWord1.bitValueOr(15, false);
    this.directLawCondition.set(SPBUL && !flightPhase112);

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
      lhElevBlueFail && lhElevGreenFail && rhElevBlueFail && rhElevGreenFail && !flightPhase112,
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

    // FIXME these should be split between the two systems and the two sides
    const flapsPos = Arinc429Word.fromSimVarValue('L:A32NX_SFCC_FLAP_ACTUAL_POSITION_WORD');
    const slatsPos = Arinc429Word.fromSimVarValue('L:A32NX_SFCC_SLAT_ACTUAL_POSITION_WORD');

    // WARNING these vary for other variants... A320 CFM LEAP values here
    // flap/slat internal signals
    this.flapsInferiorTo8Deg.set(flapsPos.isNormalOperation() && flapsPos.value < 50);
    this.flapsSuperiorTo8Deg.set(flapsPos.isNormalOperation() && flapsPos.value > 120);
    this.flapsSuperiorTo17Deg.set(flapsPos.isNormalOperation() && flapsPos.value > 179);
    this.flapsSuperiorTo26Deg.set(flapsPos.isNormalOperation() && flapsPos.value > 203);
    this.slatsInferiorTo20Deg.set(slatsPos.isNormalOperation() && slatsPos.value < 240);
    this.flapsInConf3OrFull.set(
      this.flapsSuperiorTo17Deg.get() || (slatsPos.isNormalOperation() && slatsPos.value > 255),
    );

    // flap, slat and speedbrake config warning logic
    const flapsNotInToPos = this.flapsSuperiorTo26Deg.get() || this.flapsInferiorTo8Deg.get();
    this.flapConfigSr.write(
      this.flightPhase345.get() && flapsNotInToPos,
      !flapsNotInToPos || phase6 || this.flightPhase.get() === 7,
    );
    this.flapsNotTo.set(this.flightPhase1211.get() && flapsNotInToPos);
    this.flapsNotToMemo.set(this.flapConfigSr.read() || this.flapsNotTo.get());
    this.flapConfigAural.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.flapsNotTo.get()) ||
        (this.flightPhase345.get() && flapsNotInToPos),
    );
    this.flapConfigWarning.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.flapsNotTo.get()) || this.slatConfigSr.read(),
    );

    const slatsNotInToPos = this.slatsInferiorTo20Deg.get();
    this.slatConfigSr.write(
      this.flightPhase345.get() && slatsNotInToPos,
      !slatsNotInToPos || phase6 || this.flightPhase.get() === 7,
    );
    this.slatsNotTo.set(this.flightPhase1211.get() && slatsNotInToPos);
    this.slatConfigAural.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.slatsNotTo.get()) ||
        (this.flightPhase345.get() && slatsNotInToPos),
    );
    this.slatConfigWarning.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.slatsNotTo.get()) || this.slatConfigSr.read(),
    );

    const speedbrakesNotInToPos = fcdc1DiscreteWord4.bitValueOr(28, false) || fcdc2DiscreteWord4.bitValueOr(28, false);
    this.speedbrakesConfigSr.write(
      this.flightPhase345.get() && speedbrakesNotInToPos,
      !speedbrakesNotInToPos || phase6 || this.flightPhase.get() === 7,
    );
    this.speedbrakesNotTo.set(this.flightPhase1211.get() && speedbrakesNotInToPos);
    this.speedbrakesConfigAural.set(
      (this.toConfigTestHeldMin1s5Pulse.get() && this.speedbrakesNotTo.get()) ||
        (this.flightPhase345.get() && speedbrakesNotInToPos),
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

    this.flapsAndPitchMcduDisagreeEnable.set(
      !this.flightPhase3PulseNode.read() &&
        !this.toConfigPulseNode.read() &&
        (phase3 || this.toConfigCheckedInPhase2Or3),
    );

    // taxi in flap 0 one minute check
    this.taxiInFlap0Check.write(this.slatFlapSelectionS0F0 && this.flightPhase.get() == 11, deltaTime);

    this.flapsMcduDisagree.set(
      (flapsMcduPos1Disagree || flapsMcduPos2Disagree || flapsMcduPos3Disagree) &&
        (mcduToFlapPos0 || mcduToFlapPos1 || mcduToFlapPos2 || mcduToFlapPos3) &&
        this.flapsAndPitchMcduDisagreeEnable.get(),
    );

    // pitch trim not takeoff
    const stabPos = SimVar.GetSimVarValue('ELEVATOR TRIM POSITION', 'degree');
    const cgPercent = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC', 'number');

    // A320neo config
    const pitchConfig = !PitchTrimUtils.pitchTrimInGreenBand(stabPos);
    this.pitchTrimNotTo.set(this.flightPhase1211.get() && pitchConfig);
    const pitchConfigTestInPhase1211 =
      pitchConfig && this.toConfigTestHeldMin1s5Pulse.get() && this.flightPhase1211.get();
    const pitchConfigInPhase3or4or5 = this.flightPhase345.get() && pitchConfig;
    this.pitchConfigInPhase3or4or5Sr.write(
      pitchConfigInPhase3or4or5,
      phase6 || this.flightPhase.get() === 7 || !pitchConfig,
    );
    this.pitchTrimNotToAudio.set(pitchConfigTestInPhase1211 || pitchConfigInPhase3or4or5);
    this.pitchTrimNotToWarning.set(pitchConfigTestInPhase1211 || this.pitchConfigInPhase3or4or5Sr.read());

    // pitch trim/mcdu disagree
    // we don't check the trim calculated from CG as it's not available yet. Need FQMS implementation for that
    const fm1PitchTrim = Arinc429Word.fromSimVarValue('L:A32NX_FM1_TO_PITCH_TRIM');
    const fm2PitchTrim = Arinc429Word.fromSimVarValue('L:A32NX_FM2_TO_PITCH_TRIM');
    const fmPitchTrim =
      !fm1PitchTrim.isNormalOperation() && fm2PitchTrim.isNormalOperation() ? fm2PitchTrim : fm1PitchTrim;
    this.trimDisagreeMcduStabConf.write(
      fmPitchTrim.isNormalOperation() &&
        (!PitchTrimUtils.pitchTrimInCyanBand(cgPercent, stabPos) ||
          !(Math.abs(fmPitchTrim.valueOr(0) - cgPercent) < 1)),
      deltaTime,
    );
    this.pitchTrimMcduCgDisagree.set(
      !this.pitchTrimNotToWarning.get() &&
        this.trimDisagreeMcduStabConf.read() &&
        this.flapsAndPitchMcduDisagreeEnable.get(),
    );

    // rudder trim not takeoff
    const sec1RudderTrimActualPos = Arinc429Word.fromSimVarValue('L:A32NX_SEC_1_RUDDER_ACTUAL_POSITION');
    const sec3RudderTrimActualPos = Arinc429Word.fromSimVarValue('L:A32NX_SEC_3_RUDDER_ACTUAL_POSITION');
    const sec1Healthy = SimVar.GetSimVarValue('L:A32NX_SEC_1_HEALTHY', 'boolean') > 0;
    const sec3Healthy = SimVar.GetSimVarValue('L:A32NX_SEC_3_HEALTHY', 'boolean') > 0;

    const rudderTrimConfig =
      (sec1Healthy && Math.abs(sec1RudderTrimActualPos.valueOr(0)) > 3.6) ||
      (sec3Healthy && Math.abs(sec3RudderTrimActualPos.valueOr(0)) > 3.6);

    this.rudderTrimPosition.set(sec1Healthy ? sec1RudderTrimActualPos.valueOr(0) : sec3RudderTrimActualPos.valueOr(0));

    this.rudderTrimNotTo.set(this.flightPhase1211.get() && rudderTrimConfig);
    const rudderTrimConfigTestInPhase129 =
      this.toConfigTestHeldMin1s5Pulse.get() && this.flightPhase1211.get() && rudderTrimConfig;
    const rudderTrimConfigInPhase3or4or5 = this.flightPhase345.get() && rudderTrimConfig;
    this.rudderTrimConfigInPhase3or4or5Sr.write(rudderTrimConfigInPhase3or4or5, phase6 || !rudderTrimConfig);
    this.rudderTrimNotToAudio.set(rudderTrimConfigTestInPhase129 || rudderTrimConfigInPhase3or4or5);
    this.rudderTrimNotToWarning.set(rudderTrimConfigTestInPhase129 || this.rudderTrimConfigInPhase3or4or5Sr.read());

    // flaps lvr not zero
    this.flapsLeverNotZeroWarning.set(
      (adr1PressureAltitude.valueOr(0) >= 22000 ||
        adr2PressureAltitude.valueOr(0) >= 22000 ||
        adr3PressureAltitude.valueOr(0) >= 22000) &&
        this.flightPhase.get() === 8 &&
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
      this.flightPhase.get() === 8 &&
        this.speedBrakeCommand50sConfirm.read() &&
        !this.engAboveIdleWithSpeedBrakeConfirm.read(),
      deltaTime,
    );
    const speedBrakeCaution1 = this.speedBrakeCaution1Confirm.read();
    const speedBrakeCaution2 = this.flightPhase.get() === 9 && this.speedBrakeCommand5sConfirm.read();
    // FIXME FCU does not provide the bit, so we synthesize it
    const apVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'number');
    const apTcasRaNoseUp =
      apVerticalMode === VerticalMode.TCAS &&
      SimVar.GetSimVarValue('L:A32NX_TCAS_RA_CORRECTIVE', 'bool') > 0 &&
      SimVar.GetSimVarValue('L:A32NX_TCAS_VSPEED_GREEN:1', 'number') > 0;
    this.apTcasRaNoseUpConfirm.write(apTcasRaNoseUp, deltaTime);
    this.speedBrakeCaution3Confirm.write(
      this.speedBrakeCommand.get() &&
        this.flightPhase.get() === 8 &&
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
        !this.flightPhase89.get(),
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
    const raBelow500 =
      this.radioHeight1.valueOr(Infinity) < 500 ||
      this.radioHeight2.valueOr(Infinity) < 500 ||
      this.radioHeight3.valueOr(Infinity) < 500;

    const lgDown =
      this.lgciu1DiscreteWord1.bitValueOr(29, false) ||
      (this.lgciu2DiscreteWord1.bitValueOr(29, false) && mainGearDownlocked);
    this.phase104s5Trigger.write(this.flightPhase.get() === 10, deltaTime);
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
        this.flightPhase89.get() &&
        !this.phase104s5Trigger.read() &&
        !this.eng1Or2TakeoffPower.get() &&
        !this.eng3Or4TakeoffPower.get() &&
        !allGroundSpoilersInop &&
        !(this.groundSpoiler5sDelayed.read() || this.speedBrake5sDelayed.read()) &&
        (fcdc1DiscreteWord4.isNormalOperation() || fcdc2DiscreteWord4.isNormalOperation()),
    );

    // l/g gear not down
    const fwcFlightPhase = this.flightPhase.get();
    const flightPhase4567 =
      fwcFlightPhase === 4 || fwcFlightPhase === 5 || fwcFlightPhase === 6 || fwcFlightPhase === 7;
    const below750Ra =
      Math.min(
        this.radioHeight1.valueOr(Infinity),
        this.radioHeight2.valueOr(Infinity),
        this.radioHeight3.valueOr(Infinity),
      ) < 750;
    const altInhibit =
      (this.adrPressureAltitude.get() ?? 0) > 18500 &&
      !this.radioHeight1.isNoComputedData() &&
      !this.radioHeight1.isNormalOperation() &&
      !this.radioHeight2.isNoComputedData() &&
      !this.radioHeight2.isNormalOperation() &&
      !this.radioHeight3.isNoComputedData() &&
      !this.radioHeight3.isNormalOperation();
    const gearNotDownlocked = !mainGearDownlocked && (!this.lgciu1Fault.get() || !this.lgciu2Fault.get());
    const below750Condition =
      this.flapsInConf3OrFull.get() &&
      !this.eng1Or2TakeoffPower.get() &&
      !this.eng3Or4TakeoffPower.get() &&
      below750Ra &&
      gearNotDownlocked;
    const allRaInvalid =
      this.radioHeight1.isFailureWarning() &&
      this.radioHeight2.isFailureWarning() &&
      this.radioHeight3.isFailureWarning();
    const allRaInvalidOrNcd =
      (this.radioHeight1.isNoComputedData || this.radioHeight1.isFailureWarning()) &&
      (this.radioHeight2.isNoComputedData() || this.radioHeight2.isFailureWarning()) &&
      (this.radioHeight3.isNoComputedData() || this.radioHeight3.isFailureWarning());
    const flapsApprCondition =
      ((this.flapsSuperiorTo8Deg.get() && !this.flapsSuperiorTo17Deg.get() && allRaInvalid) ||
        (this.flapsSuperiorTo17Deg.get() && allRaInvalidOrNcd)) &&
      flightPhase8 &&
      gearNotDownlocked;
    const lgNotDownResetPulse =
      this.lgNotDownPulse1.write(below750Condition, deltaTime) ||
      this.lgNotDownPulse2.write(flapsApprCondition, deltaTime);
    this.lgNotDownNoCancel.set((below750Condition || flapsApprCondition) && !lgNotDownResetPulse);
    const n1Eng1 = this.N1Eng1.get();
    const n1Eng2 = this.N1Eng2.get();
    const n1Eng3 = this.N1Eng3.get();
    const n1Eng4 = this.N1Eng4.get();
    const apprN1Eng1Or2 =
      (n1Eng1 < 75 && n1Eng2 < 75) ||
      (n1Eng1 < 97 && n1Eng2 < 97 && !this.engine1Master.get() && !this.engine2Master.get());

    const apprN1Eng3Or4 =
      (n1Eng3 < 75 && n1Eng4 < 75) ||
      (n1Eng3 < 97 && n1Eng4 < 97 && !this.engine3Master.get() && !this.engine4Master.get());

    this.lgNotDown.set(
      gearNotDownlocked &&
        !altInhibit &&
        !this.eng1Or2TakeoffPower.get() &&
        !this.eng3Or4TakeoffPower.get() &&
        apprN1Eng1Or2 &&
        apprN1Eng3Or4 &&
        below750Ra,
    );
    // goes to discrete out (RMP02B) and out word 126-11/25
    const redArrow =
      !((flightPhase8 && !allRaInvalid) || flightPhase4567) && (this.lgNotDownNoCancel.get() || this.lgNotDown.get());
    this.lgLeverRedArrow.set(redArrow);

    // 32 - Surveillance Logic
    this.gpwsFlapModeOff.set(SimVar.GetSimVarValue('L:A32NX_GPWS_FLAPS_OFF', 'Bool'));
    this.gpwsTerrOff.set(SimVar.GetSimVarValue('L:A32NX_GPWS_TERR_OFF', 'Bool'));
    this.gpwsGsOff.set(SimVar.GetSimVarValue('L:A32NX_GPWS_GS_OFF', 'Bool'));
    this.gpwsSysOff.set(SimVar.GetSimVarValue('L:A32NX_GPWS_SYS_OFF', 'Bool'));

    // fix me check for fault condition when implemented
    const transponder1State = SimVar.GetSimVarValue('TRANSPONDER STATE:1', 'Enum');
    this.xpdrStby.set(transponder1State === 1);
    this.xpdrAltReporting.set(
      this.aircraftOnGround.get()
        ? this.xpdrAltReportingRequest.get()
        : transponder1State === 5 || transponder1State === 4,
    ); // mode S or mode C

    const tcasFaulty = SimVar.GetSimVarValue('L:A32NX_TCAS_FAULT', 'bool');
    const tcasStandby = !SimVar.GetSimVarValue('L:A32NX_TCAS_MODE', 'Enum');

    // FIX ME Verify no XPDR fault once implemented
    this.tcasStandby3sConfNode.write(!tcasFaulty && tcasStandby, deltaTime);
    this.tcasStandbyMemo3sConfNode.write(tcasStandby, deltaTime);
    this.tcasStandby.set(this.tcasStandby3sConfNode.read() && flightPhase8);
    this.tcasStandbyMemo.set(this.tcasStandbyMemo3sConfNode.read());

    // TCAS fault SYS 1
    const oneUsedLeftAdrInop =
      (adr1Fault && !this.adr3UsedLeft.get()) ||
      (adr3Fault &&
        (adr3PressureAltitude.isFailureWarning() || adr3PressureAltitude.isNoComputedData()) &&
        this.adr3UsedLeft.get());
    const oneLeftUsedIrInop =
      (this.ir1Fault.get() && !this.ir3UsedLeft.get()) || (this.ir3Fault.get() && this.ir3UsedLeft.get());
    const leftIrFaultyOrInAlign = this.ir3UsedLeft.get()
      ? this.ir3Fault.get() || this.ir3Align.get()
      : this.ir1Fault.get() || this.ir1Align.get();

    this.tcas1AdrInopOrIrConfNode.write(oneUsedLeftAdrInop || oneLeftUsedIrInop || leftIrFaultyOrInAlign, deltaTime);
    this.tcas1FaultAndNoAdiruInop.write(
      tcasFaulty && !(flightPhase112 && this.tcas1AdrInopOrIrConfNode.read()),
      deltaTime,
    );
    this.tcas1FaultCond.set(!allRaInvalid && this.acESSBusPowered.get() && this.tcas1FaultAndNoAdiruInop.read());

    // TCAS FAULT SYS 2 FIXME: Replace with proper independent TCAS fault var once implemented as only one system exists currently
    const oneUsedRightAdrInop =
      (adr2Fault &&
        (adr2PressureAltitude.isFailureWarning() || adr2PressureAltitude.isNoComputedData()) &&
        !this.adr3UsedRight.get()) ||
      (adr3Fault &&
        (adr3PressureAltitude.isFailureWarning() || adr3PressureAltitude.isNoComputedData()) &&
        this.adr3UsedRight.get());
    const oneUsedRightIrInop =
      (this.ir2Fault.get() && !this.ir3UsedRight.get()) || (this.ir3Fault.get() && this.ir3UsedRight.get());
    const rightIrFaultyOrInAlign = this.ir3UsedRight.get()
      ? this.ir3Fault.get() || this.ir3Align.get()
      : this.ir2Fault.get() || this.ir2Align.get();

    this.tcas2AdrInopOrIrConfNode.write(oneUsedRightAdrInop || oneUsedRightIrInop || rightIrFaultyOrInAlign, deltaTime);
    this.tcas2FaultAndNoAdiruInop.write(
      tcasFaulty && !(flightPhase112 && this.tcas2AdrInopOrIrConfNode.read()),
      deltaTime,
    );
    this.tcas2FaultCond.set(!allRaInvalid && this.ac2BusPowered.get() && this.tcas2FaultAndNoAdiruInop.read());

    this.tcas1Fault.set(this.tcas1FaultCond.get() && !this.tcas2FaultCond.get());
    this.tcas2Fault.set(this.tcas2FaultCond.get() && !this.tcas1FaultCond.get());
    this.tcas1And2Fault.set(this.tcas1FaultCond.get() && this.tcas2FaultCond.get());
    const isNormalLaw = fcdc1DiscreteWord1.bitValue(11) || fcdc2DiscreteWord1.bitValue(11);
    // we need to check this since the MSFS SDK stall warning does not.
    const isCasAbove60 =
      this.adr1Cas.get().valueOr(0) > 60 || this.adr2Cas.get().valueOr(0) > 60 || this.adr3Cas.get().valueOr(0) > 60;
    this.stallWarning.set(
      !isNormalLaw &&
        isCasAbove60 &&
        this.stallWarningRaw.get() &&
        flightPhase6789 &&
        this.radioHeight1.valueOr(Infinity) > 1500 &&
        this.radioHeight2.valueOr(Infinity) > 1500 &&
        this.radioHeight3.valueOr(Infinity) > 1500,
    );

    /* 26 - FIRE */

    this.fduDiscreteWord.setFromSimVar('L:A32NX_FIRE_FDU_DISCRETE_WORD');

    this.apuFireDetected.set(this.fduDiscreteWord.bitValueOr(15, false));
    this.eng1FireDetected.set(this.fduDiscreteWord.bitValueOr(11, false));
    this.eng2FireDetected.set(this.fduDiscreteWord.bitValueOr(12, false));
    this.eng3FireDetected.set(this.fduDiscreteWord.bitValueOr(13, false));
    this.eng4FireDetected.set(this.fduDiscreteWord.bitValueOr(14, false));
    this.mlgFireDetected.set(this.fduDiscreteWord.bitValueOr(16, false));

    this.apuLoopAFault.set(this.fduDiscreteWord.bitValueOr(26, false));
    this.apuLoopBFault.set(this.fduDiscreteWord.bitValueOr(27, false));
    this.eng1LoopAFault.set(this.fduDiscreteWord.bitValueOr(18, false));
    this.eng1LoopBFault.set(this.fduDiscreteWord.bitValueOr(19, false));
    this.eng2LoopAFault.set(this.fduDiscreteWord.bitValueOr(20, false));
    this.eng2LoopBFault.set(this.fduDiscreteWord.bitValueOr(21, false));
    this.eng3LoopAFault.set(this.fduDiscreteWord.bitValueOr(22, false));
    this.eng3LoopBFault.set(this.fduDiscreteWord.bitValueOr(23, false));
    this.eng4LoopAFault.set(this.fduDiscreteWord.bitValueOr(24, false));
    this.eng4LoopBFault.set(this.fduDiscreteWord.bitValueOr(25, false));
    this.mlgLoopAFault.set(this.fduDiscreteWord.bitValueOr(28, false));
    this.mlgLoopBFault.set(this.fduDiscreteWord.bitValueOr(29, false));

    this.apuAgentDischarged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_1_APU_1_IS_DISCHARGED', 'bool'));
    this.eng1Agent1Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_1_ENG_1_IS_DISCHARGED', 'bool'));
    this.eng1Agent2Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_2_ENG_1_IS_DISCHARGED', 'bool'));
    this.eng2Agent1Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_1_ENG_2_IS_DISCHARGED', 'bool'));
    this.eng2Agent2Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_2_ENG_2_IS_DISCHARGED', 'bool'));
    this.eng3Agent1Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_1_ENG_3_IS_DISCHARGED', 'bool'));
    this.eng3Agent2Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_2_ENG_3_IS_DISCHARGED', 'bool'));
    this.eng4Agent1Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_1_ENG_4_IS_DISCHARGED', 'bool'));
    this.eng4Agent2Discharged.set(SimVar.GetSimVarValue('L:A32NX_FIRE_SQUIB_2_ENG_4_IS_DISCHARGED', 'bool'));

    this.fireButtonEng1.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG1', 'bool'));
    this.fireButtonEng2.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG2', 'bool'));
    this.fireButtonEng3.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG3', 'bool'));
    this.fireButtonEng4.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_ENG4', 'bool'));
    this.fireButtonAPU.set(SimVar.GetSimVarValue('L:A32NX_FIRE_BUTTON_APU', 'bool'));
    this.allFireButtons.set(
      this.fireButtonEng1.get() &&
        this.fireButtonEng2.get() &&
        this.fireButtonEng3.get() &&
        this.fireButtonEng4.get() &&
        this.fireButtonAPU.get(),
    );

    this.apuFireDetectedAural.set(this.apuFireDetected.get() && !this.fireButtonAPU.get());
    this.eng1FireDetectedAural.set(this.eng1FireDetected.get() && !this.fireButtonEng1.get());
    this.eng2FireDetectedAural.set(this.eng2FireDetected.get() && !this.fireButtonEng2.get());
    this.eng3FireDetectedAural.set(this.eng3FireDetected.get() && !this.fireButtonEng3.get());
    this.eng4FireDetectedAural.set(this.eng4FireDetected.get() && !this.fireButtonEng4.get());

    this.evacCommand.set(SimVar.GetSimVarValue('L:A32NX_EVAC_COMMAND_TOGGLE', 'bool'));

    this.cargoFireTest.set(SimVar.GetSimVarValue('L:A32NX_FIRE_TEST_CARGO', 'bool'));
    this.cargoFireAgentDisch.set(SimVar.GetSimVarValue('L:A32NX_CARGOSMOKE_FWD_DISCHARGED', 'bool'));

    this.fireTestPb.set(SimVar.GetSimVarValue('L:A32NX_OVHD_FIRE_TEST_PB_IS_PRESSED', 'bool'));

    /* 42 AVIONICS NETWORK */
    this.cpiomC1Available.set(SimVar.GetSimVarValue('L:A32NX_CPIOM_C1_AVAIL', 'bool'));
    this.cpiomC2Available.set(SimVar.GetSimVarValue('L:A32NX_CPIOM_C2_AVAIL', 'bool'));

    /* ANTI ICE */

    const icePercentage = SimVar.GetSimVarValue('STRUCTURAL ICE PCT', 'percent over 100');
    const tat = SimVar.GetSimVarValue('TOTAL AIR TEMPERATURE', 'celsius');
    const inCloud = SimVar.GetSimVarValue('AMBIENT IN CLOUD', 'boolean');
    const iceDetected1 = this.iceDetectedTimer1.write(
      icePercentage >= 0.1 && tat < 10 && !this.aircraftOnGround.get(),
      deltaTime,
    );
    this.iceDetectedTimer2Status.set(
      this.iceDetectedTimer2.write(
        iceDetected1 &&
          !(this.eng1AntiIce.get() && this.eng2AntiIce.get() && this.eng3AntiIce.get() && this.eng4AntiIce.get()),
        deltaTime,
      ),
    );
    this.iceSevereDetectedTimerStatus.set(
      this.iceSevereDetectedTimer.write(icePercentage >= 0.5 && tat < 10 && !this.aircraftOnGround.get(), deltaTime),
    );
    const iceNotDetected1 = this.iceNotDetTimer1.write(
      this.eng1AntiIce.get() ||
        this.eng2AntiIce.get() ||
        this.eng3AntiIce.get() ||
        this.eng4AntiIce.get() ||
        this.wingAntiIce.get(),
      deltaTime,
    );
    this.iceNotDetTimer2Status.set(
      this.iceNotDetTimer2.write(iceNotDetected1 && !(icePercentage >= 0.1 || (tat < 10 && inCloud === 1)), deltaTime),
    );

    /* OXYGEN */
    this.paxOxyMasksDeployed.set(SimVar.GetSimVarValue('L:A32NX_OXYGEN_MASKS_DEPLOYED', 'Bool'));

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
    if (masterWarningButtonLeft || masterWarningButtonRight) {
      this.requestMasterWarningFromFaults = this.nonCancellableWarningCount > 0;
      this.requestMasterWarningFromApOff = false;
      this.auralCrcActive.set(this.nonCancellableWarningCount > 0);
    }

    /* T.O. CONFIG CHECK */

    if (this.toMemo.get() && this.toConfigTestRaw) {
      // TODO Note that fuel tank low pressure and gravity feed warnings are not included
      const systemStatus = this.engine1Generator.get() && this.engine2Generator.get();

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
    if (this.clrPulseNode.read()) {
      if (this.abnormalSensed.abnormalShown.get()) {
        // delete the first failure
        this.abnormalSensed.clearActiveProcedure();
      } else if (this.normalChecklists.checklistShown.get()) {
        this.normalChecklists.navigateToParent();
      } else if (this.abnormalNonSensed.abnProcShown.get()) {
        this.abnormalNonSensed.navigateToParent();
      }
    }

    if (this.rclUpPulseNode.read()) {
      if (this.recallFailures.length > 0) {
        const recalledKey = this.recallFailures.shift();
        this.presentedFailures.push(recalledKey);

        this.presentedAbnormalProceduresList.setValue(
          recalledKey,
          this.clearedAbnormalProceduresList.getValue(recalledKey),
        );
        this.clearedAbnormalProceduresList.delete(recalledKey);
      }
    }

    // Output logic

    this.landAsapRed.set(
      !this.aircraftOnGround.get() &&
        (this.apuFireDetected.get() ||
          this.eng1FireDetected.get() ||
          this.eng2FireDetected.get() ||
          this.eng3FireDetected.get() ||
          this.eng4FireDetected.get() ||
          this.mlgFireDetected.get() ||
          this.emergencyGeneratorOn.get() ||
          (this.engine1State.get() === 0 && this.engine2State.get() === 0)),
    );

    const flightPhase = this.flightPhase.get();
    let tempMemoArrayLeft: string[] = [];
    let tempMemoArrayRight: string[] = [];
    const allFailureKeys: string[] = [];
    const stsInfoKeys: string[] = [];
    const stsInopAllPhasesKeys: string[] = [];
    const stsInopApprLdgKeys: string[] = [];
    const ewdLimitationsAllPhasesKeys: string[] = [];
    const ewdLimitationsApprLdgKeys: string[] = [];
    const pfdLimitationsKeys: string[] = [];
    let failureKeys: string[] = this.presentedFailures;
    let recallFailureKeys: string[] = this.recallFailures;
    let failureSystemCount = 0;
    const auralCrcKeys: string[] = [];
    const auralScKeys: string[] = [];

    const faultIsActiveConsideringFaultSuppression = (fault: EwdAbnormalItem) => {
      // Skip if other fault overrides this one
      const shouldBeSuppressed = fault.notActiveWhenFaults.some((val) => {
        if (val && this.ewdAbnormal[val]) {
          const otherFault = this.ewdAbnormal[val] as EwdAbnormalItem;
          if (otherFault.simVarIsActive.get()) {
            return true;
          }
          return false;
        }
      });
      return fault.simVarIsActive.get() && !shouldBeSuppressed;
    };

    // Update memos and failures list in case failure has been resolved
    for (const [key, value] of Object.entries(this.ewdAbnormal)) {
      if (!faultIsActiveConsideringFaultSuppression(value)) {
        failureKeys = failureKeys.filter((e) => e !== key);
        recallFailureKeys = recallFailureKeys.filter((e) => e !== key);
      }
    }

    this.recallFailures.length = 0;
    this.recallFailures.push(...recallFailureKeys);
    this.nonCancellableWarningCount = 0;

    // Abnormal sensed procedures
    const ewdAbnormalEntries: [string, EwdAbnormalItem][] = Object.entries(this.ewdAbnormal);
    const ewdDeferredEntries = Object.entries(this.abnormalSensed.ewdDeferredProcs);
    this.abnormalUpdatedItems.clear();
    this.deferredUpdatedItems.clear();
    for (const [key, value] of ewdAbnormalEntries) {
      // new warning?
      const newWarning = !this.presentedFailures.includes(key) && !recallFailureKeys.includes(key);
      const proc = EcamAbnormalProcedures[key];

      if (newWarning && value.flightPhaseInhib.some((e) => e === flightPhase)) {
        continue;
      }

      if (faultIsActiveConsideringFaultSuppression(value)) {
        const itemsChecked = value.whichItemsChecked().map((v, i) => (proc.items[i].sensed === false ? false : !!v));
        const itemsToShow = value.whichItemsToShow ? value.whichItemsToShow() : Array(itemsChecked.length).fill(true);
        const itemsActive = value.whichItemsActive ? value.whichItemsActive() : Array(itemsChecked.length).fill(true);
        ProcedureLinesGenerator.conditionalActiveItems(proc, itemsChecked, itemsActive);

        if (newWarning) {
          failureKeys.push(key);

          if (value.failure === 3) {
            this.requestMasterWarningFromFaults = true;
          }
          if (value.failure === 2) {
            this.requestMasterCautionFromFaults = true;
          }
        }

        if (!this.presentedAbnormalProceduresList.has(key) && !this.clearedAbnormalProceduresList.has(key)) {
          // Insert into internal map
          if (value.whichItemsActive) {
            if (proc.items.length !== value.whichItemsActive().length) {
              console.warn(
                proc.title,
                'ECAM alert definition error: whichItemsActive() not the same size as number of procedure items',
              );
            }
          }
          if (value.whichItemsToShow) {
            if (proc.items.length !== value.whichItemsToShow().length) {
              console.warn(
                proc.title,
                'ECAM alert definition error: whichItemsToShow() not the same size as number of procedure items',
              );
            }
          }
          if (proc.items.length !== value.whichItemsChecked().length) {
            console.warn(
              proc.title,
              'ECAM alert definition error: whichItemsChecked() not the same size as number of procedure items',
            );
          }
          this.presentedAbnormalProceduresList.setValue(key, {
            id: key,
            procedureActivated: true,
            procedureCompleted: false,
            itemsActive: itemsActive,
            itemsChecked: itemsChecked,
            itemsToShow: itemsToShow,
          });

          for (const [deferredKey, deferredValue] of ewdDeferredEntries) {
            if (
              EcamDeferredProcedures[deferredKey].fromAbnormalProcs.includes(key) &&
              this.abnormalSensed.ewdDeferredProcs[deferredKey]
            ) {
              const deferredItemsActive = deferredValue.whichItemsActive
                ? deferredValue.whichItemsActive()
                : Array(deferredValue.whichItemsChecked().length).fill(false);
              const deferredItemsChecked = deferredValue.whichItemsChecked
                ? deferredValue.whichItemsChecked()
                : Array(deferredValue.whichItemsChecked().length).fill(true);
              ProcedureLinesGenerator.conditionalActiveItems(
                EcamDeferredProcedures[deferredKey],
                deferredItemsChecked,
                deferredItemsActive,
              );
              this.activeDeferredProceduresList.setValue(deferredKey, {
                id: deferredKey,
                procedureCompleted: false,
                procedureActivated: false,
                itemsChecked: deferredItemsChecked,
                itemsActive: deferredItemsActive,
                itemsToShow: deferredValue.whichItemsToShow
                  ? deferredValue.whichItemsToShow()
                  : Array(deferredValue.whichItemsChecked().length).fill(true),
              });
            }
          }
        } else if (this.presentedAbnormalProceduresList.has(key)) {
          // Update internal map
          const prevEl = this.presentedAbnormalProceduresList.getValue(key);
          const fusedChecked = [...prevEl.itemsChecked].map((val, index) =>
            proc.items[index].sensed ? itemsChecked[index] : !!val,
          );
          ProcedureLinesGenerator.conditionalActiveItems(proc, fusedChecked, itemsActive);
          this.abnormalUpdatedItems.set(key, []);
          proc.items.forEach((item, idx) => {
            if (
              prevEl.itemsToShow[idx] !== itemsToShow[idx] ||
              prevEl.itemsActive[idx] !== itemsActive[idx] ||
              (prevEl.itemsChecked[idx] !== fusedChecked[idx] && item.sensed)
            ) {
              this.abnormalUpdatedItems.get(key).push(idx);
            }
          });

          if (this.abnormalUpdatedItems.has(key) && this.abnormalUpdatedItems.get(key).length > 0) {
            this.presentedAbnormalProceduresList.setValue(key, {
              id: key,
              procedureActivated: prevEl.procedureActivated,
              procedureCompleted: prevEl.procedureCompleted,
              itemsChecked: fusedChecked,
              itemsActive: [...prevEl.itemsActive].map((_, index) => itemsActive[index]),
              itemsToShow: [...prevEl.itemsToShow].map((_, index) => itemsToShow[index]),
            });
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
            console.log('single chime pending');
          }
          auralScKeys.push(key);
        }

        allFailureKeys.push(key);

        // Add keys for STS page
        FwsCore.pushKeyUnique(value.info, stsInfoKeys);
        FwsCore.pushKeyUnique(value.inopSysAllPhases, stsInopAllPhasesKeys);
        FwsCore.pushKeyUnique(value.inopSysApprLdg, stsInopApprLdgKeys);
        FwsCore.pushKeyUnique(value.limitationsAllPhases, ewdLimitationsAllPhasesKeys);
        FwsCore.pushKeyUnique(value.limitationsApprLdg, ewdLimitationsApprLdgKeys);
        FwsCore.pushKeyUnique(value.limitationsPfd, pfdLimitationsKeys);

        // Push LAND ASAP or LAND ANSA to limitations
        FwsCore.pushKeyUnique(() => {
          if (proc.recommendation && !this.aircraftOnGround.get()) {
            return proc.recommendation === 'LAND ANSA' ? ['2'] : ['1'];
          }
          return [];
        }, ewdLimitationsAllPhasesKeys);

        if (!recallFailureKeys.includes(key)) {
          if (value.sysPage > -1) {
            failureSystemCount++;
          }
        }
      }

      // Update deferred procedures
      this.activeDeferredProceduresList.get().forEach((value, key) => {
        const proc = EcamDeferredProcedures[key];
        const itemsChecked = this.abnormalSensed.ewdDeferredProcs[key]
          .whichItemsChecked()
          .map((v, i) => (proc.items[i].sensed === false ? false : !!v));
        const itemsToShow = this.abnormalSensed.ewdDeferredProcs[key].whichItemsToShow
          ? this.abnormalSensed.ewdDeferredProcs[key].whichItemsToShow()
          : Array(itemsChecked.length).fill(true);
        const itemsActive = this.abnormalSensed.ewdDeferredProcs[key].whichItemsActive
          ? this.abnormalSensed.ewdDeferredProcs[key].whichItemsActive()
          : Array(itemsChecked.length).fill(true);

        const fusedChecked = [...value.itemsChecked].map((val, index) =>
          proc.items[index].sensed ? itemsChecked[index] : !!val,
        );

        ProcedureLinesGenerator.conditionalActiveItems(proc, fusedChecked, itemsActive);
        this.deferredUpdatedItems.set(key, []);
        proc.items.forEach((item, idx) => {
          if (
            value.itemsToShow[idx] !== itemsToShow[idx] ||
            value.itemsActive[idx] !== itemsActive[idx] ||
            (value.itemsChecked[idx] !== fusedChecked[idx] && item.sensed)
          ) {
            this.deferredUpdatedItems.get(key).push(idx);
          }
        });

        if (this.deferredUpdatedItems.has(key) && this.deferredUpdatedItems.get(key).length > 0) {
          this.activeDeferredProceduresList.setValue(key, {
            id: key,
            procedureActivated: value.procedureActivated,
            procedureCompleted: value.procedureCompleted,
            itemsChecked: fusedChecked,
            itemsActive: [...value.itemsActive].map((_, index) => itemsActive[index]),
            itemsToShow: [...value.itemsToShow].map((_, index) => itemsToShow[index]),
          });
        }
      });

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

    // Retrieve all active deferred procedure keys, delete inactive
    const deferredProcedureKeys: string[] = [];
    allFailureKeys.forEach((failureKey) => {
      for (const [deferredKey, _] of ewdDeferredEntries) {
        if (EcamDeferredProcedures[deferredKey].fromAbnormalProcs.includes(failureKey)) {
          deferredProcedureKeys.push(deferredKey);
        }
      }
    });
    this.activeDeferredProceduresList.get().forEach((_, activeDeferredKey) => {
      if (!deferredProcedureKeys.includes(activeDeferredKey)) {
        this.activeDeferredProceduresList.delete(activeDeferredKey);
      }
    });

    // Delete inactive failures from internal map
    this.presentedAbnormalProceduresList.get().forEach((_, key) => {
      if (!allFailureKeys.includes(key) || this.recallFailures.includes(key)) {
        if (this.recallFailures.includes(key)) {
          this.clearedAbnormalProceduresList.setValue(key, this.presentedAbnormalProceduresList.getValue(key));
        } else {
          this.clearedAbnormalProceduresList.delete(key);
        }

        this.presentedAbnormalProceduresList.delete(key);
      }
    });
    this.clearedAbnormalProceduresList.get().forEach((_, key) => {
      if (!allFailureKeys.includes(key)) {
        this.clearedAbnormalProceduresList.delete(key);
      }
    });

    this.auralCrcKeys = auralCrcKeys;
    this.auralScKeys = auralScKeys;

    if (this.auralCrcKeys.length === 0) {
      this.auralCrcActive.set(false);
    }

    if (this.auralScKeys.length === 0) {
      this.auralSingleChimePending = false;
    }

    this.allCurrentFailures.length = 0;
    this.allCurrentFailures.push(...allFailureKeys);

    this.presentedFailures.length = 0;
    this.presentedFailures.push(...failureKeys);

    // MEMOs (except T.O and LDG)
    for (const [, value] of Object.entries(this.memos.ewdMemos)) {
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
        const tempArrayRight = tempMemoArrayRight.filter((e) => !value.codesToReturn.includes(e));
        tempMemoArrayRight = tempArrayRight.concat(newCode);
      }
    }

    // T.O and LDG MEMOs
    for (const [, value] of Object.entries(this.memos.ewdToLdgMemos)) {
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

        tempMemoArrayLeft = tempMemoArrayLeft.concat(newCode);
      }
    }

    const memoOrderLeft: string[] = [];
    const memoOrderRight: string[] = [];

    for (const [, value] of Object.entries(this.memos.ewdToLdgMemos)) {
      if (value.leftSide) {
        memoOrderLeft.push(...value.codesToReturn);
      } else {
        memoOrderRight.push(...value.codesToReturn);
      }
    }

    const orderedMemoArrayLeft = this.mapOrder(tempMemoArrayLeft, memoOrderLeft);
    const orderedMemoArrayRight: string[] = this.mapOrder(tempMemoArrayRight, memoOrderRight).sort(
      (a, b) => this.messagePriority(EcamMemos[a]) - this.messagePriority(EcamMemos[b]),
    );

    // Reset master caution light if appropriate
    if (allFailureKeys.filter((key) => this.ewdAbnormal[key].failure === 2).length === 0) {
      this.requestMasterCautionFromFaults = false;
    }

    // Reset master warning light if appropriate
    if (
      allFailureKeys.filter((key) => this.ewdAbnormal[key].failure === 3).length === 0 &&
      this.nonCancellableWarningCount === 0
    ) {
      this.requestMasterWarningFromFaults = false;
    }

    this.masterCaution.set(
      this.requestMasterCautionFromFaults ||
        this.requestMasterCautionFromABrkOff ||
        this.requestMasterCautionFromAThrOff,
    );

    this.masterWarning.set(this.requestMasterWarningFromFaults || this.requestMasterWarningFromApOff);

    SimVar.SetSimVarValue('L:A32NX_ECAM_FAILURE_ACTIVE', SimVarValueType.Bool, this.presentedFailures.length > 0);

    if (failureSystemCount === 0) {
      SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', -1);
    } else {
      const sortedAbnormals = this.presentedFailures.sort((a, b) => {
        return FwsAbnormalSensed.compareAbnormalProceduresByPriority(
          a,
          b,
          this.ewdAbnormal[a].failure,
          this.ewdAbnormal[b].failure,
          !EcamAbnormalProcedures[a].sensed,
          !EcamAbnormalProcedures[b].sensed,
        );
      });
      if (sortedAbnormals.length > 0 && this.ewdAbnormal[sortedAbnormals[0]].sysPage > -1) {
        SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', 'number', this.ewdAbnormal[sortedAbnormals[0]].sysPage);
      }
    }

    this.ewdMessageLinesLeft.forEach((l, i) => l.set(orderedMemoArrayLeft[i]));
    // TODO order by decreasing importance
    this.ewdMessageLinesRight.forEach((l, i) => l.set(orderedMemoArrayRight[i]));

    // TODO order by decreasing importance
    const pfdMemos = orderedMemoArrayRight
      .filter((it) => pfdMemoDisplay.includes(it))
      .sort((a, b) => this.messagePriority(EcamMemos[a]) - this.messagePriority(EcamMemos[b]));
    this.pfdMemoLines.forEach((l, i) => l.set(pfdMemos[i]));

    // TODO order by decreasing importance
    this.sdStatusInfoLines.forEach((l, i) => l.set(stsInfoKeys[i]));
    this.sdStatusInopAllPhasesLines.forEach((l, i) => l.set(stsInopAllPhasesKeys[i]));
    this.sdStatusInopApprLdgLines.forEach((l, i) => l.set(stsInopApprLdgKeys[i]));

    // TODO order by decreasing importance, only color-based for now
    // LAND ASAP overrides/replaces LAND ANSA
    if (ewdLimitationsAllPhasesKeys.includes('1') && ewdLimitationsAllPhasesKeys.includes('2')) {
      ewdLimitationsAllPhasesKeys.splice(ewdLimitationsAllPhasesKeys.indexOf('2'), 1);
    }
    const sortedEwdLimitationsAllPhasesKeys = ewdLimitationsAllPhasesKeys.sort(
      (a, b) => this.messagePriority(EcamLimitations[a]) - this.messagePriority(EcamLimitations[b]),
    );
    const sortedEwdLimitationsApprLdgKeys = ewdLimitationsApprLdgKeys.sort(
      (a, b) => this.messagePriority(EcamLimitations[a]) - this.messagePriority(EcamLimitations[b]),
    );
    this.ewdLimitationsAllPhasesLines.forEach((l, i) => l.set(sortedEwdLimitationsAllPhasesKeys[i]));
    this.ewdLimitationsApprLdgLines.forEach((l, i) => l.set(sortedEwdLimitationsApprLdgKeys[i]));

    // For now, also push EWD limitations to PFD, until we find out which is displayed where
    const pfdLimitationsCombined = [
      ...new Set(pfdLimitationsKeys.concat(sortedEwdLimitationsAllPhasesKeys).concat(sortedEwdLimitationsApprLdgKeys)),
    ].sort((a, b) => this.messagePriority(EcamLimitations[a]) - this.messagePriority(EcamLimitations[b]));
    if (pfdLimitationsCombined.includes('1') && pfdLimitationsCombined.includes('2')) {
      pfdLimitationsCombined.splice(pfdLimitationsCombined.indexOf('2'), 1);
    }
    this.pfdLimitationsLines.forEach((l, i) => l.set(pfdLimitationsCombined[i]));

    this.ecamStsNormal.set(
      !stsInfoKeys.length &&
        !stsInopAllPhasesKeys.length &&
        !stsInopApprLdgKeys.length &&
        !ewdLimitationsAllPhasesKeys.length &&
        !ewdLimitationsApprLdgKeys.length,
    );
    const sdStsShown = SimVar.GetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', SimVarValueType.Number) === 14;
    this.ecamEwdShowStsIndication.set(!this.ecamStsNormal.get() && !sdStsShown);

    this.approachAutoDisplayQnhSetPulseNode.write(
      Simplane.getPressureSelectedMode(Aircraft.A320_NEO) !== 'STD',
      deltaTime,
    );
    this.approachAutoDisplaySlatsExtendedPulseNode.write(this.flapsHandle.get() > 0, deltaTime);

    const chimeRequested =
      (this.auralSingleChimePending || this.requestSingleChimeFromAThrOff) && !this.auralCrcActive.get();
    if (chimeRequested && !this.auralSingleChimeInhibitTimer.isPending()) {
      this.auralSingleChimePending = false;
      this.requestSingleChimeFromAThrOff = false;
      this.soundManager.enqueueSound('singleChime');
      // there can only be one SC per 2 seconds, non-cumulative, so clear any pending ones at the end of that inhibit period
      this.auralSingleChimeInhibitTimer.schedule(
        () => (this.auralSingleChimePending = false),
        FwsCore.AURAL_SC_INHIBIT_TIME,
      );
    }

    this.normalChecklists.update();
    this.abnormalSensed.update();
    this.abnormalNonSensed.update();
    this.updateRowRopWarnings();

    // Orchestrate display of normal or abnormal proc display
    const pub = this.bus.getPublisher<FwsEwdEvents>();
    if (this.abnormalNonSensed.showAbnProcRequested.get()) {
      // ABN PROC always shown
      this.abnormalNonSensed.abnProcShown.set(true);
      this.normalChecklists.checklistShown.set(false);
      this.abnormalSensed.abnormalShown.set(false);

      pub.pub('fws_active_item', this.abnormalNonSensed.selectedItem.get(), true);
      pub.pub('fws_show_from_line', this.abnormalNonSensed.showFromLine.get(), true);
      this.ecamEwdShowFailurePendingIndication.set(false);
    } else if (this.normalChecklists.showChecklistRequested.get()) {
      // ECL always shown
      this.abnormalNonSensed.abnProcShown.set(false);
      this.normalChecklists.checklistShown.set(true);
      this.abnormalSensed.abnormalShown.set(false);

      pub.pub('fws_active_item', this.normalChecklists.selectedLine.get(), true);
      pub.pub('fws_active_procedure', this.normalChecklists.activeDeferredProcedureId.get(), true);
      pub.pub('fws_show_from_line', this.normalChecklists.showFromLine.get(), true);
      this.ecamEwdShowFailurePendingIndication.set(this.abnormalSensed.showAbnormalSensedRequested.get());
    } else if (this.abnormalSensed.showAbnormalSensedRequested.get()) {
      this.abnormalNonSensed.abnProcShown.set(false);
      this.normalChecklists.checklistShown.set(false);
      this.abnormalSensed.abnormalShown.set(true);

      pub.pub('fws_active_item', this.abnormalSensed.selectedItemIndex.get(), true);
      pub.pub('fws_active_procedure', this.abnormalSensed.activeProcedureId.get(), true);
      pub.pub('fws_show_from_line', this.abnormalSensed.showFromLine.get(), true);
      this.ecamEwdShowFailurePendingIndication.set(false);
    } else {
      this.abnormalNonSensed.abnProcShown.set(false);
      this.normalChecklists.checklistShown.set(false);
      this.abnormalSensed.abnormalShown.set(false);
      this.ecamEwdShowFailurePendingIndication.set(false);
    }
    pub.pub('fws_show_abn_non_sensed', this.abnormalNonSensed.abnProcShown.get(), true);
    pub.pub('fws_show_abn_sensed', this.abnormalSensed.abnormalShown.get(), true);
    pub.pub('fws_show_normal_checklists', this.normalChecklists.checklistShown.get(), true);

    // Reset all buffered inputs
    this.toConfigInputBuffer.write(false, true);
    this.clearButtonInputBuffer.write(false, true);
    this.recallButtonInputBuffer.write(false, true);
    this.clInputBuffer.write(false, true);
    this.clCheckInputBuffer.write(false, true);
    this.clUpInputBuffer.write(false, true);
    this.clDownInputBuffer.write(false, true);
    this.abnProcInputBuffer.write(false, true);
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
      this.autoBrakeOffMemoInhibited = true;
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

  messagePriority(message: string): number {
    if (!message) {
      return 10;
    }
    // Highest importance: priority 0
    switch (message.trim().substring(0, 3)) {
      case '\x1b<6':
        return 0;
      case '\x1b<2':
        return 1;
      case '\x1b<4':
        return 2;
      case '\x1b<3':
        return 3;
      default:
        return 10;
    }
  }

  static sendFailureWarning(bus: EventBus) {
    // In case of FWS1+2, populate output with FW messages
    SimVar.SetSimVarValue('L:A32NX_STATUS_NORMAL', SimVarValueType.Bool, true);
    SimVar.SetSimVarValue('L:A32NX_ECAM_FAILURE_ACTIVE', SimVarValueType.Bool, false);
    SimVar.SetSimVarValue('L:A32NX_ECAM_SFAIL', SimVarValueType.Number, -1);
    SimVar.SetSimVarValue('L:A32NX_MASTER_CAUTION', SimVarValueType.Bool, false);
    SimVar.SetSimVarValue('L:A32NX_MASTER_WARNING', SimVarValueType.Bool, false);
    SimVar.SetSimVarValue('L:A32NX_FWC_1_LG_RED_ARROW', SimVarValueType.Bool, false);
    SimVar.SetSimVarValue('L:A32NX_FWC_2_LG_RED_ARROW', SimVarValueType.Bool, false);
    const ar = Arinc429Register.empty();
    ar.setSsm(Arinc429SignStatusMatrix.FailureWarning);
    ar.writeToSimVar('L:A32NX_FWC_1_DISCRETE_WORD_126');
    ar.writeToSimVar('L:A32NX_FWC_2_DISCRETE_WORD_126');

    bus.getPublisher<FwsEwdEvents>().pub('fws_show_sts_indication', false, true);
    bus.getPublisher<FwsEwdEvents>().pub('fws_show_failure_pending', false, true);
  }

  destroy() {
    this.abnormalNonSensed.destroy();
    this.abnormalSensed.destroy();
    this.normalChecklists.destroy();
    this.subs.forEach((s) => s.destroy());
  }
}
