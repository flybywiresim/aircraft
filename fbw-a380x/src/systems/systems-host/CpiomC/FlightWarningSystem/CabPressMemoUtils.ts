// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FwcFlightPhase } from './FwsFlightPhases';

export function isCabPressManMode(manCabinAltMode: boolean, manCabinVsMode: boolean): boolean {
  return manCabinAltMode || manCabinVsMode;
}

export function getCabPressManModeMemoCode(flightPhase: FwcFlightPhase): '210000002' | '210000003' {
  switch (flightPhase) {
    case FwcFlightPhase.ElecPwr:
    case FwcFlightPhase.FirstEngineStarted:
    case FwcFlightPhase.EnginesShutdown:
      return '210000002';
    default:
      return '210000003';
  }
}
