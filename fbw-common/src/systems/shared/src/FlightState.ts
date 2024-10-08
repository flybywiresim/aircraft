// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export enum FltState {
  Hanger = 1,
  Apron = 2,
  Taxi = 3,
  Runway = 4,
  Climb = 5,
  Cruise = 6,
  Approach = 7,
  Final = 8,
}

export function getFltState(): FltState {
  return SimVar.GetSimVarValue('L:A32NX_START_STATE', 'Enum');
}
