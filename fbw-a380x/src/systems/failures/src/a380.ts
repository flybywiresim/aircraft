// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
// One can rightfully argue that this constant shouldn't be located in @flybywiresim/failures.
// Once we create an A320 specific package, such as @flybywiresim/a320, we can move it there.
import { FailureDefinition } from '@flybywiresim/fbw-sdk';

export const A380Failure = Object.freeze({
  FmcA: 22000,
  FmcB: 22001,
  FmcC: 22002,

  AudioManagementUnit1: 23000,
  AudioManagementUnit2: 23001,
  RadioManagementPanel1: 23002,
  RadioManagementPanel2: 23003,
  RadioManagementPanel3: 23004,
  Vhf1: 23005,
  Vhf2: 23006,
  Vhf3: 23007,

  TransformerRectifier1: 24000,
  TransformerRectifier2: 24001,
  TransformerRectifierEssential: 24002,

  Engine1Fire: 26001,
  Engine2Fire: 26002,
  Engine3Fire: 26003,
  Engine4Fire: 26004,
  APUFire: 26005,
  MLGFire: 26006,
  Engine1LoopA: 26007,
  Engine1LoopB: 26008,
  Engine2LoopA: 26009,
  Engine2LoopB: 26010,
  Engine3LoopA: 26011,
  Engine3LoopB: 26012,
  Engine4LoopA: 26013,
  Engine4LoopB: 26014,
  APULoopA: 26015,
  APULoopB: 26016,
  MLGLoopA: 26017,
  MLGLoopB: 26018,

  GreenReservoirLeak: 29000,
  BlueReservoirLeak: 29001,
  YellowReservoirLeak: 29002,
  GreenReservoirAirLeak: 29003,
  BlueReservoirAirLeak: 29004,
  YellowReservoirAirLeak: 29005,
  GreenReservoirReturnLeak: 29006,
  BlueReservoirReturnLeak: 29007,
  YellowReservoirReturnLeak: 29008,

  LeftPfdDisplay: 31000,
  RightPfdDisplay: 31001,

  LgciuPowerSupply1: 32000,
  LgciuPowerSupply2: 32001,
  LgciuInternalError1: 32002,
  LgciuInternalError2: 32003,

  GearProxSensorDamageGearUplockLeft1: 32004,
  GearProxSensorDamageDoorDownlockRight2: 32005,
  GearProxSensorDamageGearUplockNose1: 32006,
  GearProxSensorDamageDoorUplockLeft2: 32007,

  RadioAltimeter1: 34000,
  RadioAltimeter2: 34001,
  Transponder1: 34002,
  Transponder2: 34003,
});

export const A380FailureDefinitions: FailureDefinition[] = [
  [22, A380Failure.FmcA, 'FMC-A'],
  [22, A380Failure.FmcB, 'FMC-B'],
  [22, A380Failure.FmcC, 'FMC-C'],

  [23, A380Failure.AudioManagementUnit1, 'AMU 1'],
  [23, A380Failure.AudioManagementUnit2, 'AMU 2'],
  [23, A380Failure.RadioManagementPanel1, 'RMP 1'],
  [23, A380Failure.RadioManagementPanel2, 'RMP 2'],
  [23, A380Failure.RadioManagementPanel3, 'RMP 3'],
  [23, A380Failure.Vhf1, 'VHF 1'],
  [23, A380Failure.Vhf2, 'VHF 2'],
  [23, A380Failure.Vhf3, 'VHF 3'],

  [24, A380Failure.TransformerRectifier1, 'TR 1'],
  [24, A380Failure.TransformerRectifier2, 'TR 2'],
  [24, A380Failure.TransformerRectifierEssential, 'ESS TR'],

  [26, A380Failure.Engine1Fire, 'Fire - Engine 1'],
  [26, A380Failure.Engine2Fire, 'Fire - Engine 2'],
  [26, A380Failure.Engine3Fire, 'Fire - Engine 3'],
  [26, A380Failure.Engine4Fire, 'Fire - Engine 4'],
  [26, A380Failure.APUFire, 'Fire - APU'],
  [26, A380Failure.MLGFire, 'Fire - Main Landing Gear Bay'],
  [26, A380Failure.Engine1LoopA, 'Engine 1 Loop A'],
  [26, A380Failure.Engine1LoopB, 'Engine 1 Loop B'],
  [26, A380Failure.Engine2LoopA, 'Engine 2 Loop A'],
  [26, A380Failure.Engine2LoopB, 'Engine 2 Loop B'],
  [26, A380Failure.Engine3LoopA, 'Engine 3 Loop A'],
  [26, A380Failure.Engine3LoopB, 'Engine 3 Loop B'],
  [26, A380Failure.Engine4LoopA, 'Engine 4 Loop A'],
  [26, A380Failure.Engine4LoopB, 'Engine 4 Loop B'],
  [26, A380Failure.APULoopA, 'APU Loop A'],
  [26, A380Failure.APULoopB, 'APU Loop B'],
  [26, A380Failure.MLGLoopA, 'Main Landing Gear Bay Loop A'],
  [26, A380Failure.MLGLoopB, 'Main Landing Gear Bay Loop B'],


  [29, A380Failure.GreenReservoirLeak, 'Green reservoir leak'],
  [29, A380Failure.BlueReservoirLeak, 'Blue reservoir leak'],
  [29, A380Failure.YellowReservoirLeak, 'Yellow reservoir leak'],
  [29, A380Failure.GreenReservoirAirLeak, 'Green reservoir air leak'],
  [29, A380Failure.BlueReservoirAirLeak, 'Blue reservoir air leak'],
  [29, A380Failure.YellowReservoirAirLeak, 'Yellow reservoir air leak'],
  [29, A380Failure.GreenReservoirReturnLeak, 'Green reservoir return leak'],
  [29, A380Failure.BlueReservoirReturnLeak, 'Blue reservoir return leak'],
  [29, A380Failure.YellowReservoirReturnLeak, 'Yellow reservoir return leak'],

  [31, A380Failure.LeftPfdDisplay, 'Captain PFD display'],
  [31, A380Failure.RightPfdDisplay, 'F/O PFD display'],

  [32, A380Failure.LgciuPowerSupply1, 'LGCIU 1 Power supply'],
  [32, A380Failure.LgciuPowerSupply2, 'LGCIU 2 Power supply'],
  [32, A380Failure.LgciuInternalError1, 'LGCIU 1 Internal error'],
  [32, A380Failure.LgciuInternalError2, 'LGCIU 2 Internal error'],

  [32, A380Failure.GearProxSensorDamageGearUplockNose1, 'Proximity sensor damage uplock nose gear #1'],

  [34, A380Failure.RadioAltimeter1, 'RA 1'],
  [34, A380Failure.RadioAltimeter2, 'RA 2'],
  [34, A380Failure.Transponder1, 'XPDR 1'],
  [34, A380Failure.Transponder2, 'XPDR 2'],
];
