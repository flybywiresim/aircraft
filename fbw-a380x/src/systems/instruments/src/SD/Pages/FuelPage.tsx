import React, { FC, useEffect, useState } from 'react';
import { Position } from '@instruments/common/types';
import { useSimVar } from '@instruments/common/simVars';
import { MoreLabel, PageTitle } from './Generic/PageTitle';
import { useArinc429Var } from '@instruments/common/arinc429';
import { NXUnits, useInterval } from '@flybywiresim/fbw-sdk';

export const FuelPage = () => {
  const CROSS_FEED_VALVE_CLOSED_THRESHOLD = 0.1;
  const TRANSFER_VALVE_CLOSED_THRESHOLD = 0.1;
  const JETTISON_VALVE_CLOSED_THRESHOLD = 0.1;
  const FEED_TANK_LOW_LEVEL_THRESHOLD_KG = 1375;

  const [showMore] = useState(false);

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
  const [engine1Valve] = useSimVar('FUELSYSTEM VALVE OPEN:1', 'Percent over 100', 1000);
  const [engine2Valve] = useSimVar('FUELSYSTEM VALVE OPEN:2', 'Percent over 100', 1000);
  const [engine3Valve] = useSimVar('FUELSYSTEM VALVE OPEN:3', 'Percent over 100', 1000);
  const [engine4Valve] = useSimVar('FUELSYSTEM VALVE OPEN:4', 'Percent over 100', 1000);

  // Feed pumps
  const [feed1Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:1', 'Bool', 1000);
  const [isFeed1Pump1SwitchOff, setIsFeed1Pump1SwitchOff] = useState(false); // circuit 2
  const [feed1Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:2', 'Bool', 1000);
  const [isFeed1Pump2SwitchOff, setIsFeed1Pump2SwitchOff] = useState(false); // circuit 3
  const [feed2Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:3', 'Bool', 1000);
  const [isFeed2Pump1SwitchOff, setIsFeed2Pump1SwitchOff] = useState(false); // circuit 64
  const [feed2Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:4', 'Bool', 1000);
  const [isFeed2Pump2SwitchOff, setIsFeed2Pump2SwitchOff] = useState(false); // circuit 65
  const [feed3Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:5', 'Bool', 1000);
  const [isFeed3Pump1SwitchOff, setIsFeed3Pump1SwitchOff] = useState(false); // circuit 66
  const [feed3Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:6', 'Bool', 1000);
  const [isFeed3Pump2SwitchOff, setIsFeed3Pump2SwitchOff] = useState(false); // circuit 67
  const [feed4Pump1Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:7', 'Bool', 1000);
  const [isFeed4Pump1SwitchOff, setIsFeed4Pump1SwitchOff] = useState(false); // circuit 68
  const [feed4Pump2Active] = useSimVar('FUELSYSTEM PUMP ACTIVE:8', 'Bool', 1000);
  const [isFeed4Pump2SwitchOff, setIsFeed4Pump2SwitchOff] = useState(false); // circuit 69

  // Transfer pumps
  const [isLeftOuterTankPumpActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:9', 'Bool', 1000);
  const [isLeftOuterTankPumpSwitchOff, setIsLeftOuterTankPumpSwitchOff] = useState(false); // circuit 70
  const [isLeftMidTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:10', 'Bool', 1000);
  const [isLeftMidTankPumpFwdSwitchOff, setIsLeftMidTankPumpFwdSwitchOff] = useState(false); // circuit 71
  const [isLeftMidTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:11', 'Bool', 1000);
  const [isLeftMidTankPumpAftSwitchOff, setIsLeftMidTankPumpAftSwitchOff] = useState(false); // circuit 72
  const [isLeftInnerTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:12', 'Bool', 1000);
  const [isLeftInnerTankPumpFwdSwitchOff, setIsLeftInnerTankPumpFwdSwitchOff] = useState(false); // circuit 73
  const [isRightInnerTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:13', 'Bool', 1000);
  const [isRightInnerTankPumpFwdSwitchOff, setIsRightInnerTankPumpFwdSwitchOff] = useState(false); // circuit 78
  const [isRightOuterTankPumpActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:14', 'Bool', 1000);
  const [isRightOuterTankPumpSwitchOff, setIsRightOuterTankPumpSwitchOff] = useState(false); // circuit 75
  const [isRightMidTankPumpFwdActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:15', 'Bool', 1000);
  const [isRightMidTankPumpFwdSwitchOff, setIsRightMidTankPumpFwdSwitchOff] = useState(false); // circuit 76
  const [isRightMidTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:16', 'Bool', 1000);
  const [isRightMidTankPumpAftSwitchOff, setIsRightMidTankPumpAftSwitchOff] = useState(false); // circuit 77
  const [isLeftInnerTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:17', 'Bool', 1000);
  const [isLeftInnerTankPumpAftSwitchOff, setIsLeftInnerTankPumpAftSwitchOff] = useState(false); // circuit 74
  const [isRightInnerTankPumpAftActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:18', 'Bool', 1000);
  const [isRightInnerTankPumpAftSwitchOff, setIsRightInnerTankPumpAftSwitchOff] = useState(false); // circuit 79

  // Trim tank pumps
  const [isLeftTrimTankPumpActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:19', 'Bool', 1000);
  const [isLeftTrimTankPumpSwitchOff, setIsLeftTrimTankPumpSwitchOff] = useState(false); // circuit 80
  const [isRightTrimTankPumpActive] = useSimVar('FUELSYSTEM PUMP ACTIVE:20', 'Bool', 1000);
  const [isRightTrimTankPumpSwitchOff, setIsRightTrimTankPumpSwitchOff] = useState(false); // circuit 81

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
  const [crossFeed1ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:46', 'Percent over 100', 1000);
  const [crossFeed2ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:47', 'Percent over 100', 1000);
  const [crossFeed3ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:48', 'Percent over 100', 1000);
  const [crossFeed4ValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:49', 'Percent over 100', 1000);

  const isSideToSideFuelTransferActive =
    (crossFeed1ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD ||
      crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD) &&
    (crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD ||
      crossFeed4ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD);

  // Emergency transfer valves
  const [leftOuterEmerTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:52', 'Percent over 100', 1000);
  const [rightOuterEmerTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:53', 'Percent over 100', 1000);

  const [transferDefuelValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:56', 'Percent over 100', 1000);

  // Valve.54 = Name:GalleryAuxRefuelValveLeft#OpeningTime:3#Circuit:54
  const [galleryAuxRefuelValveLeftOpen] = useSimVar('FUELSYSTEM VALVE OPEN:54', 'Percent over 100', 1000);
  // Valve.55 = Name:GalleryAuxRefuelValveRight#OpeningTime:3#Circuit:55
  const [galleryAuxRefuelValveRightOpen] = useSimVar('FUELSYSTEM VALVE OPEN:55', 'Percent over 100', 1000);
  const isAnyGalleryAuxRefuelValveOpen =
    galleryAuxRefuelValveLeftOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    galleryAuxRefuelValveRightOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  // Into tank transfer valves
  //  FWD
  //      Feed tanks
  const [feedTank1FwdTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:5', 'Percent over 100', 1000);
  const [feedTank1FwdTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:11', 'Percent over 100', 1000);
  const isAnyFeedTank1FwdTransferValveOpen =
    feedTank1FwdTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank1FwdTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [feedTank2FwdTransferValve1_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:6', 'Percent over 100', 1000);
  const [feedTank2FwdTransferValve1_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:8', 'Percent over 100', 1000);
  const [feedTank2FwdTransferValve2_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:12', 'Percent over 100', 1000);
  const [feedTank2FwdTransferValve2_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:14', 'Percent over 100', 1000);
  const isAnyFeedTank2FwdTransferValveOpen =
    feedTank2FwdTransferValve1_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank2FwdTransferValve1_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank2FwdTransferValve2_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank2FwdTransferValve2_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [feedTank3FwdTransferValve1_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:7', 'Percent over 100', 1000);
  const [feedTank3FwdTransferValve1_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:9', 'Percent over 100', 1000);
  const [feedTank3FwdTransferValve2_1Open] = useSimVar('FUELSYSTEM VALVE OPEN:13', 'Percent over 100', 1000);
  const [feedTank3FwdTransferValve2_2Open] = useSimVar('FUELSYSTEM VALVE OPEN:15', 'Percent over 100', 1000);
  const isAnyFeedTank3FwdTransferValveOpen =
    feedTank3FwdTransferValve1_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank3FwdTransferValve1_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank3FwdTransferValve2_1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank3FwdTransferValve2_2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [feedTank4FwdTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:10', 'Percent over 100', 1000);
  const [feedTank4FwdTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:16', 'Percent over 100', 1000);
  const isAnyFeedTank4FwdTransferValveOpen =
    feedTank4FwdTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD ||
    feedTank4FwdTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  //     Transfer tanks
  const [leftInnerFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:17', 'Percent over 100', 1000);
  const [leftMidFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:18', 'Percent over 100', 1000);
  const [leftOuterFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:19', 'Percent over 100', 1000);
  const [rightInnerFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:20', 'Percent over 100', 1000);
  const [rightMidFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:21', 'Percent over 100', 1000);
  const [rightOuterFwdTransferValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:22', 'Percent over 100', 1000);

  //  AFT
  //     Feed tanks
  const [feedTank1AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:23', 'Percent over 100', 1000);
  const [feedTank1AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:27', 'Percent over 100', 1000);
  const areBothFeedTank1AftTransferValvesOpen =
    feedTank1AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    feedTank1AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [feedTank2AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:24', 'Percent over 100', 1000);
  const [feedTank2AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:28', 'Percent over 100', 1000);
  const areBothFeedTank2AftTransferValvesOpen =
    feedTank2AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    feedTank2AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [feedTank3AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:25', 'Percent over 100', 1000);
  const [feedTank3AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:29', 'Percent over 100', 1000);
  const areBothFeedTank3AftTransferValvesOpen =
    feedTank3AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    feedTank3AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [feedTank4AftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:26', 'Percent over 100', 1000);
  const [feedTank4AftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:30', 'Percent over 100', 1000);
  const areBothFeedTank4AftTransferValvesOpen =
    feedTank4AftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    feedTank4AftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  //    Transfer tanks
  const [leftOuterAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:33', 'Percent over 100', 1000);
  const [leftOuterAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:39', 'Percent over 100', 1000);
  const areBothLeftOuterAftTransferValvesOpen =
    leftOuterAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    leftOuterAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [leftMidAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:32', 'Percent over 100', 1000);
  const [leftMidAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:38', 'Percent over 100', 1000);
  const areBothLeftMidAftTransferValvesOpen =
    leftMidAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    leftMidAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [leftInnerAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:31', 'Percent over 100', 1000);
  const [leftInnerAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:37', 'Percent over 100', 1000);
  const areBothLeftInnerAftTransferValvesOpen =
    leftInnerAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    leftInnerAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [rightInnerAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:34', 'Percent over 100', 1000);
  const [rightInnerAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:40', 'Percent over 100', 1000);
  const areBothRightInnerAftTransferValvesOpen =
    rightInnerAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    rightInnerAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [rightMidAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:35', 'Percent over 100', 1000);
  const [rightMidAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:41', 'Percent over 100', 1000);
  const areBothRightMidAftTransferValvesOpen =
    rightMidAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    rightMidAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [rightOuterAftTransferValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:36', 'Percent over 100', 1000);
  const [rightOuterAftTransferValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:42', 'Percent over 100', 1000);
  const areBothRightOuterAftTransferValvesOpen =
    rightOuterAftTransferValve1Open >= TRANSFER_VALVE_CLOSED_THRESHOLD &&
    rightOuterAftTransferValve2Open >= TRANSFER_VALVE_CLOSED_THRESHOLD;

  const [trimTankInletValve1Open] = useSimVar('FUELSYSTEM VALVE OPEN:43', 'Percent over 100', 1000);
  const [trimTankInletValve2Open] = useSimVar('FUELSYSTEM VALVE OPEN:60', 'Percent over 100', 1000);

  const [trimLineIsolationValveFwdOpen] = useSimVar('FUELSYSTEM VALVE OPEN:44', 'Percent over 100', 1000);
  const [trimLineIsolationValveAft1Open] = useSimVar('FUELSYSTEM VALVE OPEN:45', 'Percent over 100', 1000);
  const [trimLineIsolationValveAft2Open] = useSimVar('FUELSYSTEM VALVE OPEN:59', 'Percent over 100', 1000);

  const areTrimLineIsolationValvesClosed =
    trimLineIsolationValveFwdOpen < TRANSFER_VALVE_CLOSED_THRESHOLD &&
    trimLineIsolationValveAft1Open < TRANSFER_VALVE_CLOSED_THRESHOLD &&
    trimLineIsolationValveAft2Open < TRANSFER_VALVE_CLOSED_THRESHOLD;

  const areTrimTankInletValvesClosed =
    trimTankInletValve1Open < TRANSFER_VALVE_CLOSED_THRESHOLD &&
    trimTankInletValve2Open < TRANSFER_VALVE_CLOSED_THRESHOLD;

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
      active: leftOuterFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Left outer into gallery
    {
      x1: 54,
      y1: 382,
      x2: 54,
      y2: 362,
      active: leftOuterFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
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
      active: leftMidFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Left mid into tank
    {
      x1: 192,
      y1: 346,
      x2: 192,
      y2: 366,
      active: leftMidFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
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
      active: leftInnerFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
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
      active: rightInnerFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
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
      active: rightMidFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Right mid into tank
    {
      x1: 638,
      y1: 362,
      x2: 638,
      y2: 382,
      active: rightMidFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
      endArrow: 'out',
      displayWhenInactive: showMore,
    },
    // Right outer into gallery
    {
      x1: 712,
      y1: 382,
      x2: 712,
      y2: 362,
      active: rightOuterFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
      startArrow: 'in',
      displayWhenInactive: showMore,
    },
    // Right outer into tank
    {
      x1: 728,
      y1: 362,
      x2: 728,
      y2: 382,
      active: rightOuterFwdTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD,
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
      active: areBothFeedTank1AftTransferValvesOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 111,
      y1: 350,
      x2: 111,
      y2: 342,
      active: areBothFeedTank1AftTransferValvesOpen,
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
      active: areBothFeedTank2AftTransferValvesOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 314,
      y1: 332,
      x2: 314,
      y2: 322,
      active: areBothFeedTank2AftTransferValvesOpen,
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
      active: areBothFeedTank3AftTransferValvesOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 448,
      y1: 332,
      x2: 448,
      y2: 322,
      active: areBothFeedTank3AftTransferValvesOpen,
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
      active: areBothFeedTank4AftTransferValvesOpen,
      endArrow: 'break-left',
      displayWhenInactive: showMore,
    },
    {
      x1: 653,
      y1: 350,
      x2: 653,
      y2: 342,
      active: areBothFeedTank4AftTransferValvesOpen,
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
  const [leftJettisonValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:57', 'Percent over 100', 1000);
  const isLeftJettisonValveOpen = leftJettisonValveOpen >= JETTISON_VALVE_CLOSED_THRESHOLD;
  const [rightJettisonValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:58', 'Percent over 100', 1000);
  const isRightJettisonValveOpen = rightJettisonValveOpen >= JETTISON_VALVE_CLOSED_THRESHOLD;
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
  const [leftOuterTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:1', 'kg');
  const [feed1TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:2', 'kg');
  const [leftMidTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:3', 'kg');
  const [leftInnerTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:4', 'kg');
  const [feed2TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:5', 'kg');
  const [feed3TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:6', 'kg');
  const [rightInnerTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:7', 'kg');
  const [rightMidTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:8', 'kg');
  const [feed4TankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:9', 'kg');
  const [rightOuterTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:10', 'kg');
  const [trimTankWeight] = useSimVar('FUELSYSTEM TANK WEIGHT:11', 'kg');

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
      <Valve x={111} y={150} open={engine1Valve >= 0.5} />
      <FuelLine x1={111} y1={132} x2={111} y2={124} active displayWhenInactive={false} />
      <FuelLine
        x1={111}
        y1={132}
        x2={111}
        y2={124}
        active={engine1Valve >= 0.5}
        displayWhenInactive={false}
        endArrow="out"
        endArrowSize={12}
      />
      <text textAnchor="middle" x={111} y={84} className="Green T3">
        {Math.floor(NXUnits.kgToUser(eng1FuelUsed) / 50) * 50}
      </text>

      <Engine x={236} y={81} index={2} />
      <Valve x={273} y={123} open={engine2Valve >= 0.5} />
      <FuelLine x1={273} y1={105} x2={273} y2={97} active displayWhenInactive={false} />
      <FuelLine
        x1={273}
        y1={105}
        x2={273}
        y2={97}
        active={engine2Valve >= 0.5}
        displayWhenInactive={false}
        endArrow="out"
        endArrowSize={12}
      />
      <text textAnchor="middle" x={273} y={68} className="Green T3">
        {Math.floor(NXUnits.kgToUser(eng2FuelUsed) / 50) * 50}
      </text>

      <Engine x={456} y={81} index={3} />
      <Valve x={493} y={123} open={engine3Valve >= 0.5} />
      <FuelLine x1={493} y1={105} x2={493} y2={97} active displayWhenInactive={false} />
      <FuelLine
        x1={493}
        y1={105}
        x2={493}
        y2={97}
        active={engine3Valve >= 0.5}
        displayWhenInactive={false}
        endArrow="out"
        endArrowSize={12}
      />
      <text textAnchor="middle" x={493} y={68} className="Green T3">
        {Math.floor(NXUnits.kgToUser(eng3FuelUsed) / 50) * 50}
      </text>

      <Engine x={618} y={105} index={4} />
      <Valve x={655} y={150} open={engine4Valve >= 0.5} />
      <FuelLine x1={655} y1={132} x2={655} y2={124} active displayWhenInactive={false} />
      <FuelLine
        x1={655}
        y1={132}
        x2={655}
        y2={124}
        active={engine4Valve >= 0.5}
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
        hasFault={feed1TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
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
      <Valve
        x={154}
        y={175}
        horizontal
        open={crossFeed1ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
        normallyClosed
      />

      {/* LEFT OUTER/MID/INNER */}
      <TankQuantity x={102} y={434} quantity={leftOuterTankWeight} />
      <TankQuantity x={202} y={430} quantity={leftMidTankWeight} />
      <TankQuantity x={302} y={430} quantity={leftInnerTankWeight} />

      {/* FEED TANK 2 */}
      <TankQuantity
        x={322}
        y={288}
        quantity={feed2TankWeight}
        hasFault={feed2TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
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
      <Valve
        x={316}
        y={148}
        horizontal
        open={crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
        normallyClosed
      />

      {/* FEED TANK 3 */}
      <TankQuantity
        x={528}
        y={288}
        quantity={feed3TankWeight}
        hasFault={feed3TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
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
      <Valve
        x={450}
        y={148}
        horizontal
        open={crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
        normallyClosed
      />

      {/* RIGHT INNER/MID/OUTER */}
      <TankQuantity x={548} y={430} quantity={rightInnerTankWeight} />
      <TankQuantity x={648} y={430} quantity={rightMidTankWeight} />
      <TankQuantity x={748} y={434} quantity={rightOuterTankWeight} />

      {/* FEED TANK 4 */}
      <TankQuantity
        x={696}
        y={300}
        quantity={feed4TankWeight}
        hasFault={feed4TankWeight < FEED_TANK_LOW_LEVEL_THRESHOLD_KG}
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
      <Valve
        x={612}
        y={175}
        horizontal
        open={crossFeed4ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
        normallyClosed
      />

      <text x={10} y={620} className="White T2">
        ALL ENG FF
      </text>

      <text x={24} y={644} className="Green T2">
        {allEngFuelFlowDisplayed}
      </text>
      <text x={68} y={644} className="Cyan T2">
        {NXUnits.userWeightUnit}/MIN
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
            active={crossFeed1ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
            displayWhenInactive={showMore}
            endArrow="break-right"
          />
          <FuelLine
            x1={290}
            y1={175}
            x2={352}
            y2={175}
            active={crossFeed1ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
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
            active={crossFeed4ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
            displayWhenInactive={showMore}
            endArrow="break-right"
          />
          <FuelLine
            x1={508}
            y1={175}
            x2={595}
            y2={175}
            active={crossFeed4ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
            displayWhenInactive={showMore}
            startArrow="break-right"
          />
        </g>

        {/* Lines to crossfeed 2 Line.133 */}
        <g>
          <FuelLine
            x1={333}
            y1={148}
            x2={352}
            y2={148}
            active={crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
            displayWhenInactive={showMore}
          />
          <FuelLine
            x1={352}
            y1={148}
            x2={352}
            y2={175}
            active={crossFeed2ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
            displayWhenInactive={showMore}
          />
        </g>

        {/* Lines to crossfeed 3 Line.135 */}
        <g>
          <FuelLine
            x1={433}
            y1={148}
            x2={414}
            y2={148}
            active={crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
            displayWhenInactive={showMore}
          />
          <FuelLine
            x1={414}
            y1={148}
            x2={414}
            y2={175}
            active={crossFeed3ValveOpen >= CROSS_FEED_VALVE_CLOSED_THRESHOLD}
            displayWhenInactive={showMore}
          />
        </g>
      </g>

      {/* APU */}
      <ApuIndication x1={657} y={175} x2={685} showMore={showMore} />

      {/* Emergency transfer valves */}
      <FuelLine
        x1={43}
        y1={293}
        x2={42}
        y2={293}
        active={leftOuterEmerTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD}
        displayWhenInactive={false}
        endArrow="in"
      />
      <FuelLine
        x1={719}
        y1={293}
        x2={720}
        y2={293}
        active={rightOuterEmerTransferValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD}
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
      <FuelLine
        x1={386}
        y1={346}
        x2={386}
        y2={175}
        active={transferDefuelValveOpen >= TRANSFER_VALVE_CLOSED_THRESHOLD}
        displayWhenInactive={showMore}
      />
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
  quantity: number;
  hasFault?: boolean;
}

const TankQuantity: FC<TankQuantityProps> = ({ x, y, smallFont = false, quantity, hasFault }) => {
  const displayQuantity = Math.floor(NXUnits.kgToUser(quantity) / 20) * 20;

  return (
    <text x={x} y={y} className={`${hasFault ? 'Amber' : 'Green'} ${smallFont ? 'T3' : 'T4'}`} textAnchor="end">
      {displayQuantity}
    </text>
  );
};

interface ApuIndicationProps {
  x1: number;
  x2: number;
  y: number;
  showMore: boolean;
}

const ApuIndication: FC<ApuIndicationProps> = ({ x1, x2, y, showMore }) => {
  const APU_VALVE_CLOSED_THRESHOLD = 0.1;

  const [apuMasterPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 1000);
  const isApuMasterPbOn = apuMasterPbOn === 1;

  // TODO hacks! The LP valve and isolation valve is always open in our fuel system
  // We pretend it's only open when the APU master switch is on so we don't get amber indications
  const [apuIsolationValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:50', 'Percent over 100', 1000);
  const isApuIsolationValveOpen = isApuMasterPbOn && apuIsolationValveOpen >= APU_VALVE_CLOSED_THRESHOLD;
  const [apuLpValveOpen] = useSimVar('FUELSYSTEM VALVE OPEN:51', 'Percent over 100', 1000);
  const isApuLpValveOpen = isApuMasterPbOn && apuLpValveOpen >= APU_VALVE_CLOSED_THRESHOLD;

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
