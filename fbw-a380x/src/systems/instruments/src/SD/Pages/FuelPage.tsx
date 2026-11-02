import React, { FC, useEffect, useState } from 'react';
import { Position } from '@instruments/common/types';
import { useSimVar } from '@instruments/common/simVars';
import { MoreLabel, PageTitle } from './Generic/PageTitle';
import { useArinc429Var } from '@instruments/common/arinc429';
import { NXUnits, useInterval } from '@flybywiresim/fbw-sdk-react';

const FQMS_FIRST_VALVE_BIT = 11;
const FQMS_VALVES_PER_WORD = 19;
const FQMS_VALVE_WORD_UPDATE_INTERVAL_MS = 1000;

const FQMS_VALVE = {
  Engine1LowPressureValve: 1,
  Engine2LowPressureValve: 2,
  Engine3LowPressureValve: 3,
  Engine4LowPressureValve: 4,
  FeedTank1ForwardTransferValve: 5,
  FeedTank2ForwardTransferValve: 6,
  FeedTank3ForwardTransferValve: 7,
  FeedTank4ForwardTransferValve: 8,
  LeftInnerForwardTransferValve: 9,
  LeftMidForwardTransferValve: 10,
  LeftOuterForwardTransferValve: 11,
  RightInnerForwardTransferValve: 12,
  RightMidForwardTransferValve: 13,
  RightOuterForwardTransferValve: 14,
  FeedTank1AftTransferValve: 15,
  FeedTank2AftTransferValve: 16,
  FeedTank3AftTransferValve: 17,
  FeedTank4AftTransferValve: 18,
  LeftInnerAftTransferValve: 19,
  LeftMidAftTransferValve: 20,
  LeftOuterAftTransferValve: 21,
  RightInnerAftTransferValve: 22,
  RightMidAftTransferValve: 23,
  RightOuterAftTransferValve: 24,
  TrimTankInletValve1: 25,
  TrimTankInletValve2: 26,
  TrimLineIsolationValveFwd: 27,
  TrimLineIsolationValveAft: 28,
  CrossFeedValve1: 29,
  CrossFeedValve2: 30,
  CrossFeedValve3: 31,
  CrossFeedValve4: 32,
  APUIsolationValve: 33,
  APULowPressureValve: 34,
  LeftOuterEmerTransferValve: 35,
  RightOuterEmerTransferValve: 36,
  GalleryAuxRefuelValveLeft: 37,
  GalleryAuxRefuelValveRight: 38,
  TransferDefuelValve: 39,
  LeftJettisonNozzleValve: 40,
  RightJettisonNozzleValve: 41,
} as const;

type FqmsValveId = (typeof FQMS_VALVE)[keyof typeof FQMS_VALVE];

const useFqmsValveStatus = () => {
  const openWords = [
    useArinc429Var('L:A32NX_FQMS_VALVE_OPEN_WORD_1', FQMS_VALVE_WORD_UPDATE_INTERVAL_MS),
    useArinc429Var('L:A32NX_FQMS_VALVE_OPEN_WORD_2', FQMS_VALVE_WORD_UPDATE_INTERVAL_MS),
    useArinc429Var('L:A32NX_FQMS_VALVE_OPEN_WORD_3', FQMS_VALVE_WORD_UPDATE_INTERVAL_MS),
  ] as const;
  const closedWords = [
    useArinc429Var('L:A32NX_FQMS_VALVE_CLOSED_WORD_1', FQMS_VALVE_WORD_UPDATE_INTERVAL_MS),
    useArinc429Var('L:A32NX_FQMS_VALVE_CLOSED_WORD_2', FQMS_VALVE_WORD_UPDATE_INTERVAL_MS),
    useArinc429Var('L:A32NX_FQMS_VALVE_CLOSED_WORD_3', FQMS_VALVE_WORD_UPDATE_INTERVAL_MS),
  ] as const;

  const wordIndexFor = (valveId: FqmsValveId) => Math.floor((valveId - 1) / FQMS_VALVES_PER_WORD);
  const bitFor = (valveId: FqmsValveId) => FQMS_FIRST_VALVE_BIT + ((valveId - 1) % FQMS_VALVES_PER_WORD);

  return {
    isOpen: (valveId: FqmsValveId) => openWords[wordIndexFor(valveId)].bitValueOr(bitFor(valveId), false),
    isClosed: (valveId: FqmsValveId) => closedWords[wordIndexFor(valveId)].bitValueOr(bitFor(valveId), false),
  };
};

export const FuelPage = () => {
  const FEED_TANK_LOW_LEVEL_THRESHOLD_KG = 1375;

  const [showMore] = useState(false);
  const fqmsValveStatus = useFqmsValveStatus();

  const [eng1FuelUsed] = useSimVar('L:A32NX_FUEL_USED:1', 'kg', 1000); // kg
  const [eng2FuelUsed] = useSimVar('L:A32NX_FUEL_USED:2', 'kg', 1000); // kg
  const [eng3FuelUsed] = useSimVar('L:A32NX_FUEL_USED:3', 'kg', 1000); // kg
  const [eng4FuelUsed] = useSimVar('L:A32NX_FUEL_USED:4', 'kg', 1000); // kg

  const apuFuelUsed = useArinc429Var('L:A32NX_APU_FUEL_USED', 1000);

  const totalEngFuelUsed = NXUnits.kgToUser(eng1FuelUsed + eng2FuelUsed + eng3FuelUsed + eng4FuelUsed);
  const totalFuelUsedDisplayed = apuFuelUsed.isNormalOperation()
    ? Math.floor((totalEngFuelUsed + NXUnits.kgToUser(apuFuelUsed.value)) / 50) * 50
    : Math.floor(totalEngFuelUsed / 50) * 50;

  const [eng1FuelFlowPph] = useSimVar('L:A32NX_ENGINE_FF:1', 'number', 1000); // kg/h
  const [eng2FuelFlowPph] = useSimVar('L:A32NX_ENGINE_FF:2', 'number', 1000); // kg/h
  const [eng3FuelFlowPph] = useSimVar('L:A32NX_ENGINE_FF:3', 'number', 1000); // kg/h
  const [eng4FuelFlowPph] = useSimVar('L:A32NX_ENGINE_FF:4', 'number', 1000); // kg/h

  const allEngFuelFlow = eng1FuelFlowPph + eng2FuelFlowPph + eng3FuelFlowPph + eng4FuelFlowPph;
  const allEngFuelFlowDisplayed = Math.floor(NXUnits.kgToUser(allEngFuelFlow) / 60 / 10) * 10; // kg/min

  // LP valves
  const engine1ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.Engine1LowPressureValve);
  const engine2ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.Engine2LowPressureValve);
  const engine3ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.Engine3LowPressureValve);
  const engine4ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.Engine4LowPressureValve);

  // Fuel pump states
  const fqmsLeftPumpStates = useArinc429Var('L:A32NX_FQMS_LEFT_FUEL_PUMP_RUNNING_WORD', 1000);
  const fqmsRightPumpStates = useArinc429Var('L:A32NX_FQMS_RIGHT_FUEL_PUMP_RUNNING_WORD', 1000);

  // Feed pumps
  const feed1Pump1Active = fqmsLeftPumpStates.bitValueOr(11, false);
  const [isFeed1Pump1SwitchOff, setIsFeed1Pump1SwitchOff] = useState(false); // circuit 2
  const feed1Pump2Active = fqmsLeftPumpStates.bitValueOr(12, false);
  const [isFeed1Pump2SwitchOff, setIsFeed1Pump2SwitchOff] = useState(false); // circuit 3
  const feed2Pump1Active = fqmsLeftPumpStates.bitValueOr(13, false);
  const [isFeed2Pump1SwitchOff, setIsFeed2Pump1SwitchOff] = useState(false); // circuit 64
  const feed2Pump2Active = fqmsLeftPumpStates.bitValueOr(14, false);
  const [isFeed2Pump2SwitchOff, setIsFeed2Pump2SwitchOff] = useState(false); // circuit 65
  const feed3Pump1Active = fqmsRightPumpStates.bitValueOr(11, false);
  const [isFeed3Pump1SwitchOff, setIsFeed3Pump1SwitchOff] = useState(false); // circuit 66
  const feed3Pump2Active = fqmsRightPumpStates.bitValueOr(12, false);
  const [isFeed3Pump2SwitchOff, setIsFeed3Pump2SwitchOff] = useState(false); // circuit 67
  const feed4Pump1Active = fqmsRightPumpStates.bitValueOr(13, false);
  const [isFeed4Pump1SwitchOff, setIsFeed4Pump1SwitchOff] = useState(false); // circuit 68
  const feed4Pump2Active = fqmsRightPumpStates.bitValueOr(14, false);
  const [isFeed4Pump2SwitchOff, setIsFeed4Pump2SwitchOff] = useState(false); // circuit 69

  // Transfer pumps
  const isLeftOuterTankPumpActive = fqmsLeftPumpStates.bitValueOr(15, false);
  const [isLeftOuterTankPumpSwitchOff, setIsLeftOuterTankPumpSwitchOff] = useState(false); // circuit 70
  const isLeftMidTankPumpFwdActive = fqmsLeftPumpStates.bitValueOr(16, false);
  const [isLeftMidTankPumpFwdSwitchOff, setIsLeftMidTankPumpFwdSwitchOff] = useState(false); // circuit 71
  const isLeftMidTankPumpAftActive = fqmsLeftPumpStates.bitValueOr(17, false);
  const [isLeftMidTankPumpAftSwitchOff, setIsLeftMidTankPumpAftSwitchOff] = useState(false); // circuit 72
  const isLeftInnerTankPumpFwdActive = fqmsLeftPumpStates.bitValueOr(18, false);
  const [isLeftInnerTankPumpFwdSwitchOff, setIsLeftInnerTankPumpFwdSwitchOff] = useState(false); // circuit 73
  const isLeftInnerTankPumpAftActive = fqmsLeftPumpStates.bitValueOr(19, false);
  const [isLeftInnerTankPumpAftSwitchOff, setIsLeftInnerTankPumpAftSwitchOff] = useState(false); // circuit 74
  const isRightOuterTankPumpActive = fqmsRightPumpStates.bitValueOr(15, false);
  const [isRightOuterTankPumpSwitchOff, setIsRightOuterTankPumpSwitchOff] = useState(false); // circuit 75
  const isRightMidTankPumpFwdActive = fqmsRightPumpStates.bitValueOr(16, false);
  const [isRightMidTankPumpFwdSwitchOff, setIsRightMidTankPumpFwdSwitchOff] = useState(false); // circuit 76
  const isRightMidTankPumpAftActive = fqmsRightPumpStates.bitValueOr(17, false);
  const [isRightMidTankPumpAftSwitchOff, setIsRightMidTankPumpAftSwitchOff] = useState(false); // circuit 77
  const isRightInnerTankPumpFwdActive = fqmsRightPumpStates.bitValueOr(18, false);
  const [isRightInnerTankPumpFwdSwitchOff, setIsRightInnerTankPumpFwdSwitchOff] = useState(false); // circuit 78
  const isRightInnerTankPumpAftActive = fqmsRightPumpStates.bitValueOr(19, false);
  const [isRightInnerTankPumpAftSwitchOff, setIsRightInnerTankPumpAftSwitchOff] = useState(false); // circuit 79

  // Trim tank pumps
  const isLeftTrimTankPumpActive = fqmsLeftPumpStates.bitValueOr(20, false);
  const [isLeftTrimTankPumpSwitchOff, setIsLeftTrimTankPumpSwitchOff] = useState(false); // circuit 80
  const isRightTrimTankPumpActive = fqmsRightPumpStates.bitValueOr(20, false);
  const [isRightTrimTankPumpSwitchOff, setIsRightTrimTankPumpSwitchOff] = useState(false); // circuit 81

  // TODO: these signals should come from the FQMS
  useInterval(
    async () => {
      SimVar.SetSimVarValue('BUS LOOKUP INDEX', 'Number', 1)
        .then(() => {
          setIsFeed1Pump1SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:2', 'Bool') === 0);
          setIsFeed1Pump2SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:3', 'Bool') === 0);
          setIsFeed2Pump1SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:64', 'Bool') === 0);
          setIsFeed2Pump2SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:65', 'Bool') === 0);
          setIsFeed3Pump1SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:66', 'Bool') === 0);
          setIsFeed3Pump2SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:67', 'Bool') === 0);
          setIsFeed4Pump1SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:68', 'Bool') === 0);
          setIsFeed4Pump2SwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:69', 'Bool') === 0);

          setIsLeftOuterTankPumpSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:70', 'Bool') === 0);
          setIsLeftMidTankPumpFwdSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:71', 'Bool') === 0);
          setIsLeftMidTankPumpAftSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:72', 'Bool') === 0);
          setIsLeftInnerTankPumpFwdSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:73', 'Bool') === 0);
          setIsRightInnerTankPumpFwdSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:78', 'Bool') === 0);
          setIsRightOuterTankPumpSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:75', 'Bool') === 0);
          setIsRightMidTankPumpFwdSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:76', 'Bool') === 0);
          setIsRightMidTankPumpAftSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:77', 'Bool') === 0);
          setIsLeftInnerTankPumpAftSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:74', 'Bool') === 0);
          setIsRightInnerTankPumpAftSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:79', 'Bool') === 0);

          setIsLeftTrimTankPumpSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:80', 'Bool') === 0);
          setIsRightTrimTankPumpSwitchOff(SimVar.GetSimVarValue('CIRCUIT CONNECTION ON:81', 'Bool') === 0);
        })
        .catch(() => {
          console.error('Failed to set BUS LOOKUP INDEX to 1');
        });
    },
    1000,
    { runOnStart: true },
  );

  // Crossfeed valves
  const crossFeed1ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.CrossFeedValve1);
  const crossFeed2ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.CrossFeedValve2);
  const crossFeed3ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.CrossFeedValve3);
  const crossFeed4ValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.CrossFeedValve4);

  const isSideToSideFuelTransferActive =
    (crossFeed1ValveOpen || crossFeed2ValveOpen) && (crossFeed3ValveOpen || crossFeed4ValveOpen);

  // Emergency transfer valves
  const leftOuterEmerTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftOuterEmerTransferValve);
  const rightOuterEmerTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightOuterEmerTransferValve);

  const transferDefuelValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.TransferDefuelValve);
  const apuIsolationValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.APUIsolationValve);
  const apuLpValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.APULowPressureValve);

  const galleryAuxRefuelValveLeftOpen = fqmsValveStatus.isOpen(FQMS_VALVE.GalleryAuxRefuelValveLeft);
  const galleryAuxRefuelValveRightOpen = fqmsValveStatus.isOpen(FQMS_VALVE.GalleryAuxRefuelValveRight);
  const isAnyGalleryAuxRefuelValveOpen = galleryAuxRefuelValveLeftOpen || galleryAuxRefuelValveRightOpen;

  // Into tank transfer valves
  //  FWD
  //      Feed tanks
  const isAnyFeedTank1FwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank1ForwardTransferValve);
  const isAnyFeedTank2FwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank2ForwardTransferValve);
  const isAnyFeedTank3FwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank3ForwardTransferValve);
  const isAnyFeedTank4FwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank4ForwardTransferValve);

  //     Transfer tanks
  const leftInnerFwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftInnerForwardTransferValve);
  const leftMidFwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftMidForwardTransferValve);
  const leftOuterFwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftOuterForwardTransferValve);
  const rightInnerFwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightInnerForwardTransferValve);
  const rightMidFwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightMidForwardTransferValve);
  const rightOuterFwdTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightOuterForwardTransferValve);

  //  AFT
  //     Feed tanks
  const isAnyFeedTank1AftTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank1AftTransferValve);
  const isAnyFeedTank2AftTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank2AftTransferValve);
  const isAnyFeedTank3AftTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank3AftTransferValve);
  const isAnyFeedTank4AftTransferValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.FeedTank4AftTransferValve);

  //    Transfer tanks
  const areBothLeftOuterAftTransferValvesOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftOuterAftTransferValve);
  const areBothLeftMidAftTransferValvesOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftMidAftTransferValve);
  const areBothLeftInnerAftTransferValvesOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftInnerAftTransferValve);
  const areBothRightInnerAftTransferValvesOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightInnerAftTransferValve);
  const areBothRightMidAftTransferValvesOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightMidAftTransferValve);
  const areBothRightOuterAftTransferValvesOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightOuterAftTransferValve);

  const areTrimLineIsolationValvesClosed =
    fqmsValveStatus.isClosed(FQMS_VALVE.TrimLineIsolationValveFwd) &&
    fqmsValveStatus.isClosed(FQMS_VALVE.TrimLineIsolationValveAft);

  const areTrimTankInletValvesClosed =
    fqmsValveStatus.isClosed(FQMS_VALVE.TrimTankInletValve1) &&
    fqmsValveStatus.isClosed(FQMS_VALVE.TrimTankInletValve2);

  const isTrimLineIsolated = areTrimLineIsolationValvesClosed && areTrimTankInletValvesClosed;

  const fwdGalleryPumps: PumpProps[] = [
    // Pump.9
    {
      x: 84,
      y: 384,
      running: isLeftOuterTankPumpActive,
      hasFault: isLeftOuterTankPumpSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.10
    {
      x: 140,
      y: 384,
      running: isLeftMidTankPumpFwdActive,
      hasFault: isLeftMidTankPumpFwdSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.12
    {
      x: 232,
      y: 384,
      running: isLeftInnerTankPumpFwdActive,
      hasFault: isLeftInnerTankPumpFwdSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.13
    {
      x: 482,
      y: 384,
      running: isRightInnerTankPumpFwdActive,
      hasFault: isRightInnerTankPumpFwdSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.15
    {
      x: 584,
      y: 384,
      running: isRightMidTankPumpFwdActive,
      hasFault: isRightMidTankPumpFwdSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.14
    {
      x: 680,
      y: 384,
      running: isRightOuterTankPumpActive,
      hasFault: isRightOuterTankPumpSwitchOff,
      displayWhenInactive: showMore,
    },
  ];

  const aftGalleryPumps: PumpProps[] = [
    // Pump.11
    {
      x: 182,
      y: 452,
      running: isLeftMidTankPumpAftActive,
      hasFault: isLeftMidTankPumpAftSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.16
    {
      x: 274,
      y: 452,
      running: isLeftInnerTankPumpAftActive,
      hasFault: isLeftInnerTankPumpAftSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.17
    {
      x: 524,
      y: 452,
      running: isRightInnerTankPumpAftActive,
      hasFault: isRightInnerTankPumpAftSwitchOff,
      displayWhenInactive: showMore,
    },
    // Pump.18
    {
      x: 626,
      y: 452,
      running: isRightMidTankPumpAftActive,
      hasFault: isRightMidTankPumpAftSwitchOff,
      displayWhenInactive: showMore,
    },
  ];

  const fwdGalleryTransferValves: FuelLineProps[] = [
    // Left outer into tank
    {
      x1: 34,
      y1: 362,
      x2: 34,
      y2: 382,
      active: leftOuterFwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Left outer into gallery
    {
      x1: 54,
      y1: 382,
      x2: 54,
      y2: 362,
      active: leftOuterFwdTransferValveOpen,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Feed 1
    {
      x1: 140,
      y1: 362,
      x2: 140,
      y2: 342,
      active: isAnyFeedTank1FwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Left mid into gallery
    {
      x1: 180,
      y1: 366,
      x2: 180,
      y2: 346,
      active: leftMidFwdTransferValveOpen,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Left mid into tank
    {
      x1: 192,
      y1: 346,
      x2: 192,
      y2: 366,
      active: leftMidFwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Feed 2
    {
      x1: 284,
      y1: 346,
      x2: 284,
      y2: 326,
      active: isAnyFeedTank2FwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Left inner
    {
      x1: 284,
      y1: 346,
      x2: 284,
      y2: 366,
      active: leftInnerFwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Feed 3
    {
      x1: 520,
      y1: 346,
      x2: 520,
      y2: 326,
      active: isAnyFeedTank3FwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Right inner
    {
      x1: 520,
      y1: 346,
      x2: 520,
      y2: 366,
      active: rightInnerFwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Feed 4
    {
      x1: 622,
      y1: 362,
      x2: 622,
      y2: 342,
      active: isAnyFeedTank4FwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Right mid into gallery
    {
      x1: 622,
      y1: 382,
      x2: 622,
      y2: 362,
      active: rightMidFwdTransferValveOpen,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Right mid into tank
    {
      x1: 638,
      y1: 362,
      x2: 638,
      y2: 382,
      active: rightMidFwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Right outer into gallery
    {
      x1: 712,
      y1: 382,
      x2: 712,
      y2: 362,
      active: rightOuterFwdTransferValveOpen,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Right outer into tank
    {
      x1: 728,
      y1: 362,
      x2: 728,
      y2: 382,
      active: rightOuterFwdTransferValveOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
  ];

  const aftGalleryTransferValves: FuelLineProps[] = [
    // Left outer into tank
    {
      x1: 60,
      y1: 472,
      x2: 60,
      y2: 452,
      active: areBothLeftOuterAftTransferValvesOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Left outer into gallery
    {
      x1: 84,
      y1: 452,
      x2: 84,
      y2: 472,
      active: areBothLeftOuterAftTransferValvesOpen,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },

    // Feed tank 1 into tank
    {
      x1: 111,
      y1: 472,
      x2: 111,
      y2: 376,
      active: isAnyFeedTank1AftTransferValveOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 111,
      y1: 350,
      x2: 111,
      y2: 342,
      active: isAnyFeedTank1AftTransferValveOpen,
      startArrow: 'break-left',
      endArrow: 'out',
      displayWhenInactive: showMore,
    },

    // Left mid into tank
    {
      x1: 132,
      y1: 472,
      x2: 132,
      y2: 452,
      active: areBothLeftMidAftTransferValvesOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Left mid into gallery
    {
      x1: 154,
      y1: 452,
      x2: 154,
      y2: 472,
      // In normal ops, fuel is never never transferred out of the mid tank via the aft gallery
      // TODO: handle abnormal ops
      active: false,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },

    // Left inner into tank
    {
      x1: 232,
      y1: 472,
      x2: 232,
      y2: 452,
      active: areBothLeftInnerAftTransferValvesOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },

    // Feed tank 2 into tank
    {
      x1: 314,
      y1: 472,
      x2: 314,
      y2: 358,
      active: isAnyFeedTank2AftTransferValveOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 314,
      y1: 332,
      x2: 314,
      y2: 322,
      active: isAnyFeedTank2AftTransferValveOpen,
      startArrow: 'break-left',
      endArrow: 'out',
      displayWhenInactive: showMore,
    },

    // Feed tank 3 into tank
    {
      x1: 448,
      y1: 472,
      x2: 448,
      y2: 358,
      active: isAnyFeedTank3AftTransferValveOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 448,
      y1: 332,
      x2: 448,
      y2: 322,
      active: isAnyFeedTank3AftTransferValveOpen,
      startArrow: 'break-left',
      endArrow: 'out',
      displayWhenInactive: showMore,
    },

    // Right inner into tank
    {
      x1: 482,
      y1: 472,
      x2: 482,
      y2: 452,
      active: areBothRightInnerAftTransferValvesOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },

    // Right mid into tank
    {
      x1: 578,
      y1: 472,
      x2: 578,
      y2: 452,
      active: areBothRightMidAftTransferValvesOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Right mid into gallery
    {
      x1: 600,
      y1: 452,
      x2: 600,
      y2: 472,
      // In normal ops, fuel is never never transferred out of the mid tank via the aft gallery
      // TODO: handle abnormal ops
      active: false,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },

    // Feed tank 4 into tank
    {
      x1: 653,
      y1: 472,
      x2: 653,
      y2: 376,
      active: isAnyFeedTank4AftTransferValveOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 653,
      y1: 350,
      x2: 653,
      y2: 342,
      active: isAnyFeedTank4AftTransferValveOpen,
      startArrow: 'break-left',
      endArrow: 'out',
      displayWhenInactive: showMore,
    },

    // Right outer into gallery
    {
      x1: 680,
      y1: 452,
      x2: 680,
      y2: 472,
      active: areBothRightOuterAftTransferValvesOpen,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Right outer into tank
    {
      x1: 704,
      y1: 472,
      x2: 704,
      y2: 452,
      active: areBothRightOuterAftTransferValvesOpen,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
  ];

  const fwdGalleyOtherLines: FuelLineProps[] = [
    { x1: 164, y1: 362, x2: 174, y2: 346, active: true, displayWhenInactive: showMore },
    { x1: 592, y1: 346, x2: 602, y2: 362, active: true, displayWhenInactive: showMore },
  ];

  // Jettison valves
  const isLeftJettisonValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.LeftJettisonNozzleValve);
  const isRightJettisonValveOpen = fqmsValveStatus.isOpen(FQMS_VALVE.RightJettisonNozzleValve);
  const isJettisonActive = false; // TODO

  // Collector cells
  const collectorCell1Weight = 1200;
  const isCollectorCell1NotFull = useCollectorCellState(collectorCell1Weight);
  const collectorCell2Weight = 1200;
  const isCollectorCell2NotFull = useCollectorCellState(collectorCell2Weight);
  const collectorCell3Weight = 1200;
  const isCollectorCell3NotFull = useCollectorCellState(collectorCell3Weight);
  const collectorCell4Weight = 1200;
  const isCollectorCell4NotFull = useCollectorCellState(collectorCell4Weight);
  const isAnyCollectorCellNotFull =
    isCollectorCell1NotFull || isCollectorCell2NotFull || isCollectorCell3NotFull || isCollectorCell4NotFull;

  // Tanks
  // We prioritize the values published by the FQMS and take the values provided by the FQDCs as a backup
  // TODO: when we take the FQDC values show degraded indication (strike through)
  const fqmsLeftOuterTankWeight = useArinc429Var('L:A32NX_FQMS_LEFT_OUTER_TANK_QUANTITY', 1000);
  const fqmsFeed1TankWeight = useArinc429Var('L:A32NX_FQMS_FEED_1_TANK_QUANTITY', 1000);
  const fqmsLeftMidTankWeight = useArinc429Var('L:A32NX_FQMS_LEFT_MID_TANK_QUANTITY', 1000);
  const fqmsLeftInnerTankWeight = useArinc429Var('L:A32NX_FQMS_LEFT_INNER_TANK_QUANTITY', 1000);
  const fqmsFeed2TankWeight = useArinc429Var('L:A32NX_FQMS_FEED_2_TANK_QUANTITY', 1000);
  const fqmsFeed3TankWeight = useArinc429Var('L:A32NX_FQMS_FEED_3_TANK_QUANTITY', 1000);
  const fqmsRightInnerTankWeight = useArinc429Var('L:A32NX_FQMS_RIGHT_INNER_TANK_QUANTITY', 1000);
  const fqmsRightMidTankWeight = useArinc429Var('L:A32NX_FQMS_RIGHT_MID_TANK_QUANTITY', 1000);
  const fqmsFeed4TankWeight = useArinc429Var('L:A32NX_FQMS_FEED_4_TANK_QUANTITY', 1000);
  const fqmsRightOuterTankWeight = useArinc429Var('L:A32NX_FQMS_RIGHT_OUTER_TANK_QUANTITY', 1000);
  const fqmsTrimTankWeight = useArinc429Var('L:A32NX_FQMS_TRIM_TANK_QUANTITY', 1000);

  const fqdc1LeftOuterTankWeight = useArinc429Var('L:A32NX_FQDC_1_LEFT_OUTER_TANK_QUANTITY', 1000);
  const fqdc1Feed1TankWeight = useArinc429Var('L:A32NX_FQDC_1_FEED_1_TANK_QUANTITY', 1000);
  const fqdc1LeftMidTankWeight = useArinc429Var('L:A32NX_FQDC_1_LEFT_MID_TANK_QUANTITY', 1000);
  const fqdc1LeftInnerTankWeight = useArinc429Var('L:A32NX_FQDC_1_LEFT_INNER_TANK_QUANTITY', 1000);
  const fqdc1Feed2TankWeight = useArinc429Var('L:A32NX_FQDC_1_FEED_2_TANK_QUANTITY', 1000);
  const fqdc1Feed3TankWeight = useArinc429Var('L:A32NX_FQDC_1_FEED_3_TANK_QUANTITY', 1000);
  const fqdc1RightInnerTankWeight = useArinc429Var('L:A32NX_FQDC_1_RIGHT_INNER_TANK_QUANTITY', 1000);
  const fqdc1RightMidTankWeight = useArinc429Var('L:A32NX_FQDC_1_RIGHT_MID_TANK_QUANTITY', 1000);
  const fqdc1Feed4TankWeight = useArinc429Var('L:A32NX_FQDC_1_FEED_4_TANK_QUANTITY', 1000);
  const fqdc1RightOuterTankWeight = useArinc429Var('L:A32NX_FQDC_1_RIGHT_OUTER_TANK_QUANTITY', 1000);
  const fqdc1TrimTankWeight = useArinc429Var('L:A32NX_FQDC_1_TRIM_TANK_QUANTITY', 1000);

  const fqdc2LeftOuterTankWeight = useArinc429Var('L:A32NX_FQDC_2_LEFT_OUTER_TANK_QUANTITY', 1000);
  const fqdc2Feed1TankWeight = useArinc429Var('L:A32NX_FQDC_2_FEED_1_TANK_QUANTITY', 1000);
  const fqdc2LeftMidTankWeight = useArinc429Var('L:A32NX_FQDC_2_LEFT_MID_TANK_QUANTITY', 1000);
  const fqdc2LeftInnerTankWeight = useArinc429Var('L:A32NX_FQDC_2_LEFT_INNER_TANK_QUANTITY', 1000);
  const fqdc2Feed2TankWeight = useArinc429Var('L:A32NX_FQDC_2_FEED_2_TANK_QUANTITY', 1000);
  const fqdc2Feed3TankWeight = useArinc429Var('L:A32NX_FQDC_2_FEED_3_TANK_QUANTITY', 1000);
  const fqdc2RightInnerTankWeight = useArinc429Var('L:A32NX_FQDC_2_RIGHT_INNER_TANK_QUANTITY', 1000);
  const fqdc2RightMidTankWeight = useArinc429Var('L:A32NX_FQDC_2_RIGHT_MID_TANK_QUANTITY', 1000);
  const fqdc2Feed4TankWeight = useArinc429Var('L:A32NX_FQDC_2_FEED_4_TANK_QUANTITY', 1000);
  const fqdc2RightOuterTankWeight = useArinc429Var('L:A32NX_FQDC_2_RIGHT_OUTER_TANK_QUANTITY', 1000);
  const fqdc2TrimTankWeight = useArinc429Var('L:A32NX_FQDC_2_TRIM_TANK_QUANTITY', 1000);

  const leftOuterTankWeight = fqmsLeftOuterTankWeight.valueOr(
    fqdc1LeftOuterTankWeight.valueOr(fqdc2LeftOuterTankWeight.valueOr(null)),
  );
  const feed1TankWeight = fqmsFeed1TankWeight.valueOr(fqdc1Feed1TankWeight.valueOr(fqdc2Feed1TankWeight.valueOr(null)));
  const leftMidTankWeight = fqmsLeftMidTankWeight.valueOr(
    fqdc1LeftMidTankWeight.valueOr(fqdc2LeftMidTankWeight.valueOr(null)),
  );
  const leftInnerTankWeight = fqmsLeftInnerTankWeight.valueOr(
    fqdc1LeftInnerTankWeight.valueOr(fqdc2LeftInnerTankWeight.valueOr(null)),
  );
  const feed2TankWeight = fqmsFeed2TankWeight.valueOr(fqdc1Feed2TankWeight.valueOr(fqdc2Feed2TankWeight.valueOr(null)));
  const feed3TankWeight = fqmsFeed3TankWeight.valueOr(fqdc1Feed3TankWeight.valueOr(fqdc2Feed3TankWeight.valueOr(null)));
  const rightInnerTankWeight = fqmsRightInnerTankWeight.valueOr(
    fqdc1RightInnerTankWeight.valueOr(fqdc2RightInnerTankWeight.valueOr(null)),
  );
  const rightMidTankWeight = fqmsRightMidTankWeight.valueOr(
    fqdc1RightMidTankWeight.valueOr(fqdc2RightMidTankWeight.valueOr(null)),
  );
  const feed4TankWeight = fqmsFeed4TankWeight.valueOr(fqdc1Feed4TankWeight.valueOr(fqdc2Feed4TankWeight.valueOr(null)));
  const rightOuterTankWeight = fqmsRightOuterTankWeight.valueOr(
    fqdc1RightOuterTankWeight.valueOr(fqdc2RightOuterTankWeight.valueOr(null)),
  );
  const trimTankWeight = fqmsTrimTankWeight.valueOr(fqdc1TrimTankWeight.valueOr(fqdc2TrimTankWeight.valueOr(null)));

  return (
    <>
      <PageTitle x={6} y={29}>
        FUEL
      </PageTitle>

      <MoreLabel x={137} y={28} moreActive={showMore} />

      <text textAnchor="middle" x={384} y={56} className="White T2">
        FU
      </text>
      <text textAnchor="middle" x={384} y={79} className="White T2">
        {apuFuelUsed.isNormalOperation() ? 'TOTAL' : 'ALL ENG'}
      </text>
      <text textAnchor="middle" x={384} y={103} className="Green T3">
        {totalFuelUsedDisplayed}
      </text>

      <text textAnchor="middle" x={384} y={126} className="Cyan T2">
        {NXUnits.userWeightUnit()}
      </text>

      {/* Engines and LP valves */}
      <Engine x={74} y={105} index={1} />
      <Valve x={111} y={150} open={engine1ValveOpen} />
      <FuelLine x1={111} y1={132} x2={111} y2={124} active displayWhenInactive={false} />
      <FuelLine
        x1={111}
        y1={132}
        x2={111}
        y2={124}
        active={engine1ValveOpen}
        displayWhenInactive={false}
        endArrow="out"
        endArrowSize={12}
      />
      <text textAnchor="middle" x={111} y={84} className="Green T3">
        {Math.floor(NXUnits.kgToUser(eng1FuelUsed) / 50) * 50}
      </text>

      <Engine x={236} y={81} index={2} />
      <Valve x={273} y={123} open={engine2ValveOpen} />
      <FuelLine x1={273} y1={105} x2={273} y2={97} active displayWhenInactive={false} />
      <FuelLine
        x1={273}
        y1={105}
        x2={273}
        y2={97}
        active={engine2ValveOpen}
        displayWhenInactive={false}
        endArrow="out"
        endArrowSize={12}
      />
      <text textAnchor="middle" x={273} y={68} className="Green T3">
        {Math.floor(NXUnits.kgToUser(eng2FuelUsed) / 50) * 50}
      </text>

      <Engine x={456} y={81} index={3} />
      <Valve x={493} y={123} open={engine3ValveOpen} />
      <FuelLine x1={493} y1={105} x2={493} y2={97} active displayWhenInactive={false} />
      <FuelLine
        x1={493}
        y1={105}
        x2={493}
        y2={97}
        active={engine3ValveOpen}
        displayWhenInactive={false}
        endArrow="out"
        endArrowSize={12}
      />
      <text textAnchor="middle" x={493} y={68} className="Green T3">
        {Math.floor(NXUnits.kgToUser(eng3FuelUsed) / 50) * 50}
      </text>

      <Engine x={618} y={105} index={4} />
      <Valve x={655} y={150} open={engine4ValveOpen} />
      <FuelLine x1={655} y1={132} x2={655} y2={124} active displayWhenInactive={false} />
      <FuelLine
        x1={655}
        y1={132}
        x2={655}
        y2={124}
        active={engine4ValveOpen}
        displayWhenInactive={false}
        endArrow="out"
        endArrowSize={12}
      />
      <text textAnchor="middle" x={655} y={84} className="Green T3">
        {Math.floor(NXUnits.kgToUser(eng4FuelUsed) / 50) * 50}
      </text>

      <image
        x={7}
        y={168}
        width={751}
        height={310}
        xlinkHref="/Images/fbw-a380x/SD_FUEL_BG.png"
        preserveAspectRatio="none"
      />

      {/* FEED TANK 1 */}
      <TankQuantity
        x={154}
        y={300}
        quantity={feed1TankWeight}
        hasFault={feed1TankWeight === null || feed1TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
      />
      {(showMore || isAnyCollectorCellNotFull) && (
        // FEED TANK 1 collector cell (inop.)
        <TankQuantity x={138} y={268} smallFont quantity={collectorCell1Weight} hasFault={isCollectorCell1NotFull} />
      )}
      {/* Feed tank 1 main pump */}
      <Pump x={95} y={227} running={feed1Pump1Active} hasFault={isFeed1Pump1SwitchOff} />
      {/* Feed tank 1 standby pump. TODO actually deactivate the pump when the main one is active  */}
      <Pump
        x={127}
        y={227}
        running={feed1Pump2Active && !feed1Pump1Active}
        hasFault={isFeed1Pump2SwitchOff}
        displayWhenInactive={showMore}
      />

      {/* Line.9 & Line.10 & Line.17 -> Engine1LPValve (via Junction.1) = ALWAYS ON */}
      <FuelLine x1={111} y1={212} x2={111} y2={164} active displayWhenInactive={showMore} />
      {/* Line.128 */}
      <FuelLine x1={111} y1={175} x2={139} y2={175} active displayWhenInactive={showMore} />

      {/* Crossfeed valve 1 - Valve.46 */}
      <Valve x={154} y={175} horizontal open={crossFeed1ValveOpen} normallyClosed />

      {/* LEFT OUTER/MID/INNER */}
      <TankQuantity x={102} y={434} quantity={leftOuterTankWeight} />
      <TankQuantity x={202} y={430} quantity={leftMidTankWeight} />
      <TankQuantity x={302} y={430} quantity={leftInnerTankWeight} />

      {/* FEED TANK 2 */}
      <TankQuantity
        x={322}
        y={288}
        quantity={feed2TankWeight}
        hasFault={feed2TankWeight === null || feed2TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
      />
      {(showMore || isAnyCollectorCellNotFull) && (
        // FEED TANK 2 collector cell (inop.)
        <TankQuantity x={310} y={252} smallFont quantity={collectorCell2Weight} hasFault={isCollectorCell2NotFull} />
      )}
      {/* Feed tank 2 main pump */}
      <Pump x={258} y={208} running={feed2Pump1Active} hasFault={isFeed2Pump1SwitchOff} />
      {/* Feed tank 2 standby pump. TODO actually deactivate the pump when the main one is active */}
      <Pump
        x={290}
        y={208}
        running={feed2Pump2Active && !feed2Pump1Active}
        hasFault={isFeed2Pump2SwitchOff}
        displayWhenInactive={showMore}
      />

      {/* Line.11 & Line.12 & Line.18 -> Engine2LPValve (via Junction.2) = ALWAYS ON */}
      <FuelLine x1={273} y1={191} x2={273} y2={137} active displayWhenInactive={showMore} />
      {/* Line.129 */}
      <FuelLine x1={273} y1={148} x2={299} y2={148} active displayWhenInactive={showMore} />

      {/* Crossfeed valve 2 - Valve.47 */}
      <Valve x={316} y={148} horizontal open={crossFeed2ValveOpen} normallyClosed />

      {/* FEED TANK 3 */}
      <TankQuantity
        x={528}
        y={288}
        quantity={feed3TankWeight}
        hasFault={feed3TankWeight === null || feed3TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
      />
      {(showMore || isAnyCollectorCellNotFull) && (
        // FEED TANK 3 collector cell (inop.)
        <TankQuantity x={518} y={252} smallFont quantity={collectorCell3Weight} hasFault={isCollectorCell3NotFull} />
      )}
      {/* Feed tank 3 main pump */}
      <Pump x={476} y={208} running={feed3Pump1Active} hasFault={isFeed3Pump1SwitchOff} />
      {/* Feed tank 3 standby pump. TODO actually deactivate the pump when the main one is active */}
      <Pump
        x={508}
        y={208}
        running={feed3Pump2Active && !feed3Pump1Active}
        hasFault={isFeed3Pump2SwitchOff}
        displayWhenInactive={showMore}
      />

      {/* Line.13 & Line.14 & Line.19 -> Engine3LPValve (via Junction.3) = ALWAYS ON */}
      <FuelLine x1={493} y1={191} x2={493} y2={137} active displayWhenInactive={showMore} />
      {/* Line.130 */}
      <FuelLine x1={467} y1={148} x2={493} y2={148} active displayWhenInactive={showMore} />

      {/* Crossfeed valve 3 - Valve.48 */}
      <Valve x={450} y={148} horizontal open={crossFeed3ValveOpen} normallyClosed />

      {/* RIGHT INNER/MID/OUTER */}
      <TankQuantity x={548} y={430} quantity={rightInnerTankWeight} />
      <TankQuantity x={648} y={430} quantity={rightMidTankWeight} />
      <TankQuantity x={748} y={434} quantity={rightOuterTankWeight} />

      {/* FEED TANK 4 */}
      <TankQuantity
        x={696}
        y={300}
        quantity={feed4TankWeight}
        hasFault={feed4TankWeight === null || feed4TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
      />
      {(showMore || isAnyCollectorCellNotFull) && (
        // FEED TANK 4 collector cell (inop.)
        <TankQuantity x={690} y={268} smallFont quantity={collectorCell4Weight} hasFault={isCollectorCell4NotFull} />
      )}
      {/* Feed tank 4 main pump */}
      <Pump x={639} y={227} running={feed4Pump1Active} hasFault={isFeed4Pump1SwitchOff} />
      {/* Feed tank 4 standby pump. TODO actually deactivate the pump when the main one is active */}
      <Pump
        x={671}
        y={227}
        running={feed4Pump2Active && !feed4Pump1Active}
        hasFault={isFeed4Pump2SwitchOff}
        displayWhenInactive={showMore}
      />

      {/* Line.15 & Line.16 & Line.20 -> Engine4LPValve (via Junction.4) = ALWAYS ON */}
      <FuelLine x1={655} y1={212} x2={655} y2={164} active displayWhenInactive={showMore} />
      {/* Line.131 */}
      <FuelLine x1={629} y1={175} x2={655} y2={175} active displayWhenInactive={showMore} />

      {/* Crossfeed valve 4 - Valve.49 */}
      <Valve x={612} y={175} horizontal open={crossFeed4ValveOpen} normallyClosed />

      <text x={10} y={620} className="White T2">
        ALL ENG FF
      </text>

      <text x={24} y={644} className="Green T2">
        {allEngFuelFlowDisplayed}
      </text>
      <text x={68} y={644} className="Cyan T2">
        {NXUnits.userWeightUnit()}/MIN
      </text>

      <image
        x={269}
        y={571}
        width={227}
        height={80}
        xlinkHref="/Images/fbw-a380x/SD_FUEL_BG_TRIM.png"
        preserveAspectRatio="none"
      />

      {/* Crossfeed lines */}
      <g>
        {/* Horizontal lines Line.132 & Line.134 & Line.136 */}
        <g>
          <FuelLine
            x1={171}
            y1={175}
            x2={258}
            y2={175}
            active={crossFeed1ValveOpen}
            displayWhenInactive={showMore}
            endArrow="break-right"
          />
          <FuelLine
            x1={290}
            y1={175}
            x2={352}
            y2={175}
            active={crossFeed1ValveOpen}
            displayWhenInactive={showMore}
            startArrow="break-right"
          />
          <FuelLine
            x1={352}
            y1={175}
            x2={414}
            y2={175}
            active={isSideToSideFuelTransferActive}
            displayWhenInactive={showMore}
          />
          <FuelLine
            x1={414}
            y1={175}
            x2={476}
            y2={175}
            active={crossFeed4ValveOpen}
            displayWhenInactive={showMore}
            endArrow="break-right"
          />
          <FuelLine
            x1={508}
            y1={175}
            x2={595}
            y2={175}
            active={crossFeed4ValveOpen}
            displayWhenInactive={showMore}
            startArrow="break-right"
          />
        </g>

        {/* Lines to crossfeed 2 Line.133 */}
        <g>
          <FuelLine x1={333} y1={148} x2={352} y2={148} active={crossFeed2ValveOpen} displayWhenInactive={showMore} />
          <FuelLine x1={352} y1={148} x2={352} y2={175} active={crossFeed2ValveOpen} displayWhenInactive={showMore} />
        </g>

        {/* Lines to crossfeed 3 Line.135 */}
        <g>
          <FuelLine x1={433} y1={148} x2={414} y2={148} active={crossFeed3ValveOpen} displayWhenInactive={showMore} />
          <FuelLine x1={414} y1={148} x2={414} y2={175} active={crossFeed3ValveOpen} displayWhenInactive={showMore} />
        </g>
      </g>

      {/* APU */}
      <ApuIndication
        x1={657}
        y={175}
        x2={685}
        showMore={showMore}
        apuIsolationValveOpen={apuIsolationValveOpen}
        apuLpValveOpen={apuLpValveOpen}
      />

      {/* Emergency transfer valves */}
      <FuelLine
        x1={43}
        y1={293}
        x2={42}
        y2={293}
        active={leftOuterEmerTransferValveOpen}
        displayWhenInactive={false}
        endArrow="in"
      />
      <FuelLine
        x1={719}
        y1={293}
        x2={720}
        y2={293}
        active={rightOuterEmerTransferValveOpen}
        displayWhenInactive={false}
        endArrow="in"
      />

      {/* FWD transfer gallery */}
      <Gallery
        y={362}
        pumps={fwdGalleryPumps}
        transferValves={fwdGalleryTransferValves}
        otherLines={fwdGalleyOtherLines}
        showMore={showMore}
      />

      {/* Line connecting FWD gallery to crossfeed line */}
      <FuelLine x1={386} y1={346} x2={386} y2={175} active={transferDefuelValveOpen} displayWhenInactive={showMore} />
      {/* Line connecting FWD gallery to AFT gallery */}
      <FuelLine
        x1={438}
        y1={346}
        x2={438}
        y2={472}
        active={isAnyGalleryAuxRefuelValveOpen}
        displayWhenInactive={showMore}
      />

      {/* AFT transfer gallery */}
      <Gallery
        y={472}
        pumps={aftGalleryPumps}
        transferValves={aftGalleryTransferValves}
        otherLines={[]}
        showMore={showMore}
      />

      {/* Jettison */}
      <g>
        <FuelLine
          x1={190}
          y1={500}
          x2={190}
          y2={522}
          active={isLeftJettisonValveOpen}
          displayWhenInactive={false}
          startArrow="in"
          startArrowSize={16}
          fillStartArrow={true}
          endArrow="out"
          endArrowSize={16}
          fillEndArrow={true}
          hasFault={isLeftJettisonValveOpen && !isJettisonActive}
        />
        {(isJettisonActive || isLeftJettisonValveOpen) && (
          <text x={134} y={562} className={`${isLeftJettisonValveOpen !== isJettisonActive ? 'Amber' : 'White'} T2`}>
            JETTISON
          </text>
        )}

        <FuelLine
          x1={570}
          y1={500}
          x2={570}
          y2={522}
          active={isRightJettisonValveOpen}
          displayWhenInactive={false}
          startArrow="in"
          startArrowSize={16}
          fillStartArrow={true}
          endArrow="out"
          endArrowSize={16}
          fillEndArrow={true}
          hasFault={isRightJettisonValveOpen && !isJettisonActive}
        />
        {(isJettisonActive || isRightJettisonValveOpen) && (
          <text x={514} y={562} className={`${isRightJettisonValveOpen !== isJettisonActive ? 'Amber' : 'White'} T2`}>
            JETTISON
          </text>
        )}
      </g>

      {/* Trim tank */}
      <g>
        {/* Trim tank to AFT gallery */}
        <FuelLine x1={386} y1={472} x2={386} y2={522} active={false} displayWhenInactive={showMore} />
        <FuelLine x1={386} y1={558} x2={386} y2={568} active={false} displayWhenInactive={showMore} />

        {/* Trim tank to FWD gallery */}
        <g>
          <FuelLine x1={386} y1={492} x2={326} y2={492} active={false} displayWhenInactive={showMore} />
          <FuelLine
            x1={326}
            y1={492}
            x2={326}
            y2={484}
            active={false}
            displayWhenInactive={showMore}
            endArrow="break-left"
          />
          {/* Hook this into the FWD gallery? */}
          <FuelLine
            x1={326}
            y1={460}
            x2={326}
            y2={346}
            active={false}
            displayWhenInactive={showMore}
            startArrow="break-left"
          />
        </g>

        <FuelLine x1={298} y1={596} x2={298} y2={568} active={false} displayWhenInactive={showMore} />
        <Pump
          x={298}
          y={610}
          running={isLeftTrimTankPumpActive}
          hasFault={isLeftTrimTankPumpSwitchOff}
          displayWhenInactive={showMore}
        />
        <FuelLine x1={468} y1={596} x2={468} y2={568} active={false} displayWhenInactive={showMore} />
        <Pump
          x={468}
          y={610}
          running={isRightTrimTankPumpActive}
          hasFault={isRightTrimTankPumpSwitchOff}
          displayWhenInactive={showMore}
        />

        <FuelLine x1={298} y1={568} x2={468} y2={568} active={false} displayWhenInactive={showMore} />

        <FuelLine x1={330} y1={590} x2={330} y2={568} active={false} displayWhenInactive={showMore} startArrow="in" />
        <FuelLine x1={386} y1={568} x2={386} y2={590} active={false} displayWhenInactive={showMore} endArrow="out" />
        <FuelLine x1={440} y1={590} x2={440} y2={568} active={false} displayWhenInactive={showMore} startArrow="in" />

        {/* Trim tank valve */}
        <Valve x={386} y={540} open={!isTrimLineIsolated} normallyClosed />

        {/* TRIM TANK */}
        <TankQuantity x={418} y={640} quantity={trimTankWeight} />
      </g>
    </>
  );
};

interface GalleryProps {
  y: number;
  pumps: PumpProps[];
  transferValves: FuelLineProps[];
  otherLines: FuelLineProps[];
  showMore: boolean;
}

/**
 * Draws a gallery that connects active pumps and valves
 * @param param0
 * @returns
 */
const Gallery: FC<GalleryProps> = ({ y, pumps, transferValves: intoTankTransferValves, otherLines, showMore }) => {
  // TODO make this configurable
  const PUMP_SIZE = 28;

  const lastActivePumpX = pumps
    .filter((pump) => pump.running)
    .reduce((maxX, pump) => Math.max(maxX, pump.x), -Infinity);
  const lastActiveValveX = intoTankTransferValves
    .filter((valve) => valve.active)
    .reduce((maxX, valve) => Math.max(maxX, valve.x1), -Infinity);
  const lastActiveX = Math.max(lastActivePumpX, lastActiveValveX);

  const firstActivePumpX = pumps
    .filter((pump) => pump.running)
    .reduce((minX, pump) => Math.min(minX, pump.x), Infinity);
  const firstActiveValveX = intoTankTransferValves
    .filter((valve) => valve.active)
    .reduce((minX, valve) => Math.min(minX, valve.x1), Infinity);
  const firstActiveX = Math.min(firstActivePumpX, firstActiveValveX);

  const isAnyValveOpen = Number.isFinite(firstActiveValveX);

  const prevLineEnd = { x: -Infinity, y };
  const fuelLineSegments = [];
  for (let i = 0, j = 0, k = 0; i < pumps.length || j < intoTankTransferValves.length; ) {
    // Check if next element is a pump or valve
    const nextElementIsPump =
      j >= intoTankTransferValves.length || (i < pumps.length && pumps[i].x < intoTankTransferValves[j].x1);
    const nextElement = nextElementIsPump ? pumps[i++] : intoTankTransferValves[j++];
    const nextElementX = 'x' in nextElement ? nextElement.x : nextElement.x1;
    const nextElementIsActive = 'running' in nextElement ? nextElement.running : nextElement.active;

    // Check if there's actually a line segment before the next element
    if (k < otherLines.length && otherLines[k].x1 < nextElementX) {
      const otherLine = otherLines[k++];

      // Add connecting line if we have a starting point
      if (prevLineEnd.x > Number.NEGATIVE_INFINITY) {
        // Move to line segment start
        fuelLineSegments.push(
          <FuelLine
            x1={prevLineEnd.x}
            y1={prevLineEnd.y}
            x2={otherLine.x1}
            y2={prevLineEnd.y}
            active={isAnyValveOpen && prevLineEnd.x >= firstActiveX && otherLine.x1 <= lastActiveX}
            displayWhenInactive={showMore}
          />,
        );
        // Draw line segment
        fuelLineSegments.push(
          <FuelLine
            {...otherLine}
            active={isAnyValveOpen && otherLine.x1 >= firstActiveX && otherLine.x2 <= lastActiveX}
          />,
        );
      }

      prevLineEnd.x = otherLine.x2;
      prevLineEnd.y = otherLine.y2;
    }

    // Add connecting line if we have a starting point and are not staying at the same position
    if (prevLineEnd.x > Number.NEGATIVE_INFINITY && nextElementX > prevLineEnd.x) {
      fuelLineSegments.push(
        <FuelLine
          x1={prevLineEnd.x}
          y1={prevLineEnd.y}
          x2={nextElementX}
          y2={prevLineEnd.y}
          active={isAnyValveOpen && prevLineEnd.x >= firstActiveX && nextElementX <= lastActiveX}
          displayWhenInactive={showMore}
        />,
      );
    }

    if (nextElementIsPump) {
      const pumpY = (nextElement as PumpProps).y;
      const y1 = prevLineEnd.y < pumpY ? pumpY - PUMP_SIZE / 2 : pumpY + PUMP_SIZE / 2;

      fuelLineSegments.push(
        <FuelLine
          x1={nextElementX}
          y1={y1}
          x2={(nextElement as PumpProps).x}
          y2={prevLineEnd.y}
          active={isAnyValveOpen && nextElementIsActive}
          displayWhenInactive={showMore}
        />,
      );
    }

    prevLineEnd.x = nextElementX;
  }

  return (
    <g>
      {/* Pumps */}
      {pumps.map((pump) => (
        <Pump {...pump} />
      ))}

      {/* Gallery lines */}
      {fuelLineSegments}

      {/* Valves */}
      {intoTankTransferValves.map((valve) => (
        <FuelLine {...valve} displayWhenInactive={showMore} />
      ))}
    </g>
  );
};

interface FuelLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  startArrow?: 'in' | 'out' | 'break-left' | 'break-right';
  fillStartArrow?: boolean;
  startArrowSize?: number;
  endArrow?: 'in' | 'out' | 'break-left' | 'break-right';
  fillEndArrow?: boolean;
  endArrowSize?: number;
  active: boolean;
  displayWhenInactive: boolean;
  hasFault?: boolean;
}

const FuelLine: FC<FuelLineProps> = ({
  x1,
  y1,
  x2,
  y2,
  startArrow,
  fillStartArrow = false,
  startArrowSize = 10,
  endArrow,
  fillEndArrow = false,
  endArrowSize = 10,
  active = false,
  displayWhenInactive,
  hasFault = false,
}) => {
  const BREAK_DX = 2;
  const BREAK_DY = 5;

  let color: string;
  if (hasFault) {
    color = 'Amber';
  } else if (active) {
    color = 'Green';
  } else {
    color = displayWhenInactive ? 'White' : 'Transparent';
  }

  let startRotation = (Math.atan2(x2 - x1, y1 - y2) * 180) / Math.PI;
  let endRotation = (Math.atan2(x2 - x1, y1 - y2) * 180) / Math.PI;
  if (startArrow === 'out') {
    startRotation = (startRotation + 180) % 360;
  }
  if (endArrow === 'in') {
    endRotation = (endRotation + 180) % 360;
  }

  return (
    <g className={`${color} LineJoinRound LineRound`} strokeWidth={3}>
      {(startArrow === 'in' || startArrow === 'out') && (
        <polygon
          className={`T4 LineJoinRound ${fillStartArrow ? color + 'Fill' : 'NoFill'}`}
          transform={`rotate(${startRotation} ${x1} ${y1}) translate(0 ${startArrow === 'in' ? startArrowSize : 0})`}
          strokeWidth={3}
          points={`${x1 - endArrowSize / 2},${y1} ${x1 + endArrowSize / 2},${y1} ${x1},${y1 - startArrowSize}`}
        />
      )}
      {startArrow === 'break-left' && (
        <line
          x1={x1 + BREAK_DX}
          y1={y1 + BREAK_DY}
          x2={x1 - BREAK_DX}
          y2={y1 - BREAK_DY}
          transform={`rotate(${(startRotation + 90) % 360} ${x1} ${y1})`}
        />
      )}
      {startArrow === 'break-right' && (
        <line
          x1={x1 - BREAK_DX}
          y1={y1 + BREAK_DY}
          x2={x1 + BREAK_DX}
          y2={y1 - BREAK_DY}
          transform={`rotate(${(startRotation + 90) % 360} ${x1} ${y1})`}
        />
      )}
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {endArrow === 'break-left' && (
        <line
          x1={x2 + BREAK_DX}
          y1={y2 + BREAK_DY}
          x2={x2 - BREAK_DX}
          y2={y2 - BREAK_DY}
          transform={`rotate(${(endRotation + 90) % 360} ${x2} ${y2})`}
        />
      )}
      {endArrow === 'break-right' && (
        <line
          x1={x2 - BREAK_DX}
          y1={y2 + BREAK_DY}
          x2={x2 + BREAK_DX}
          y2={y2 - BREAK_DY}
          transform={`rotate(${(endRotation + 90) % 360} ${x2} ${y2})`}
        />
      )}
      {(endArrow === 'in' || endArrow === 'out') && (
        <polygon
          className={`T4 LineJoinRound ${fillEndArrow ? color + 'Fill' : 'NoFill'}`}
          transform={`rotate(${endRotation} ${x2} ${y2}) translate(0 ${endArrow === 'in' ? endArrowSize : 0})`}
          strokeWidth={3}
          points={`${x2 - endArrowSize / 2},${y2} ${x2 + endArrowSize / 2},${y2} ${x2},${y2 - endArrowSize}`}
        />
      )}
    </g>
  );
};

interface ValveProps extends Position {
  open: boolean;
  horizontal?: boolean;
  normallyClosed?: boolean;
}

const Valve: FC<ValveProps> = ({ x, y, open, horizontal = false, normallyClosed = false }) => {
  const color = !open && !normallyClosed ? 'Amber' : 'Green';
  const rotation = open !== !horizontal ? 90 : 0;
  const radius = 16;

  return (
    <g className={`${color} NoFill`} strokeWidth={2.8} transform={`rotate(${rotation} ${x} ${y})`}>
      <circle cx={x} cy={y} r={radius} />

      <line x1={x} y1={y - radius} x2={x} y2={y + radius} />
    </g>
  );
};

interface PumpProps extends Position {
  running: boolean;
  hasFault?: boolean;
  displayWhenInactive?: boolean;
}

const Pump: FC<PumpProps> = ({ x, y, running, displayWhenInactive, hasFault }) => {
  let color: string;
  if (hasFault) {
    color = 'Amber';
  } else if (running) {
    color = 'Green';
  } else {
    color = displayWhenInactive ? 'White' : 'Transparent';
  }

  const width = 28;

  return (
    <g className={`${color} LineJoinRound`} strokeWidth={2.8}>
      <rect x={x - width / 2} y={y - width / 2} width={width} height={width} />

      {running ? (
        <line x1={x} y1={y - width / 2} x2={x} y2={y + width / 2} />
      ) : (
        <line x1={x - 9} y1={y} x2={x + 9} y2={y} />
      )}
    </g>
  );
};

interface EngineProps extends Position {
  index: number;
}

const Engine: FC<EngineProps> = ({ x, y, index }) => {
  const [engineState] = useSimVar(`L:A32NX_ENGINE_N3:${index}`, 'number', 500);
  const isRunning = engineState > 50;

  return (
    <>
      <image
        x={x}
        y={y}
        width={75}
        height={96}
        xlinkHref={index < 3 ? '/Images/fbw-a380x/SD_FUEL_ENG_L.png' : '/Images/fbw-a380x/SD_FUEL_ENG_R.png'}
        preserveAspectRatio="none"
      />

      <text x={x + 8} y={y + 25} className={`${isRunning ? 'White' : 'Amber'} T4`}>
        {index}
      </text>
    </>
  );
};

interface TankQuantityProps extends Position {
  smallFont?: boolean;
  quantity: number | null;
  hasFault?: boolean;
}

const TankQuantity: FC<TankQuantityProps> = ({ x, y, smallFont = false, quantity, hasFault }) => {
  const displayText = quantity !== null ? Math.floor(NXUnits.kgToUser(quantity) / 20) * 20 : 'XX\xa0';

  return (
    <text
      x={x}
      y={y}
      className={`${hasFault || quantity === null ? 'Amber' : 'Green'} ${smallFont ? 'T3' : 'T4'}`}
      textAnchor="end"
    >
      {displayText}
    </text>
  );
};

interface ApuIndicationProps {
  x1: number;
  x2: number;
  y: number;
  showMore: boolean;
  apuIsolationValveOpen: boolean;
  apuLpValveOpen: boolean;
}

const ApuIndication: FC<ApuIndicationProps> = ({ x1, x2, y, showMore, apuIsolationValveOpen, apuLpValveOpen }) => {
  const [apuMasterPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 1000);
  const isApuMasterPbOn = apuMasterPbOn === 1;

  const isApuIsolationValveOpen = isApuMasterPbOn && apuIsolationValveOpen;
  const isApuLpValveOpen = isApuMasterPbOn && apuLpValveOpen;

  const shouldApuIsolationValveBeOpen = isApuMasterPbOn;
  const shouldApuLpValveBeOpen = isApuMasterPbOn;

  const areBothValvesOpen = isApuIsolationValveOpen && isApuLpValveOpen;
  const areBothValvesClosed = !isApuIsolationValveOpen && !isApuLpValveOpen;
  const isNormalState =
    isApuIsolationValveOpen === shouldApuIsolationValveBeOpen && isApuLpValveOpen === shouldApuLpValveBeOpen;

  return (
    <g>
      {/* Hide if both valves are closed and they should be closed */}
      {(!isNormalState || !areBothValvesClosed || showMore) && (
        <text x={x2 + 20} y={y + 8} className={`${isNormalState ? 'White' : 'Amber'} T2`}>
          APU
        </text>
      )}
      {showMore && isNormalState && !areBothValvesOpen && (
        <FuelLine x1={x2} y1={y} x2={x2} y2={y} active={false} displayWhenInactive endArrow="out" endArrowSize={12} />
      )}
      {areBothValvesOpen && (
        <FuelLine
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          active={!areBothValvesClosed}
          hasFault={!isNormalState}
          displayWhenInactive={false}
          endArrow="out"
          endArrowSize={12}
        />
      )}
    </g>
  );
};

const useCollectorCellState = (weight: number) => {
  const [isCollectorCellNotFull, setCollectorCellNotFull] = useState(false);

  useEffect(() => {
    if (!isCollectorCellNotFull && weight < 780) {
      setCollectorCellNotFull(true);
    } else if (isCollectorCellNotFull && weight > 940) {
      setCollectorCellNotFull(false);
    }
  }, [weight]);

  return isCollectorCellNotFull;
};
