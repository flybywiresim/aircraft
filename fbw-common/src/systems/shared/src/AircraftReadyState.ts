// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SimVarValueType } from '@microsoft/msfs-sdk';

export function trySetAircraftReadyState(gameState: GameState) {
  if (gameState === GameState.ingame) {
    // Haven't really thought about the transition here yet, whether it should be a fixed time or in the next frame (as it is here)
    if (getStartupState() === StartupState.ExtrasHostInitialized) {
      SimVar.SetSimVarValue('L:A32NX_STARTUP_STATE', SimVarValueType.Enum, StartupState.InstrumentsInitialized);
    }

    if (getStartupState() === StartupState.FltFileLoaded) {
      SimVar.SetSimVarValue('L:A32NX_STARTUP_STATE', SimVarValueType.Enum, StartupState.ExtrasHostInitialized);
      console.log(`EXTRASHOST: Instruments are ready at ${new Date().toLocaleString()}`);
    }
  } else if (getStartupState() > StartupState.Uninitialized) {
    SimVar.SetSimVarValue('L:A32NX_STARTUP_STATE', SimVarValueType.Enum, StartupState.Uninitialized);
  }
}

export enum StartupState {
  Uninitialized,
  FltFileLoaded,
  ExtrasHostInitialized,
  InstrumentsInitialized,
  WasmInitialized,
}

export function getStartupState(): StartupState {
  return SimVar.GetSimVarValue('L:A32NX_STARTUP_STATE', SimVarValueType.Enum);
}
