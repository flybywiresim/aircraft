// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SimVarValueType } from '@microsoft/msfs-sdk';

export function trySetAircraftReadyState(gameState: GameState) {
  if (gameState === GameState.ingame) {
    // Haven't really thought about the transition here yet, whether it should be a fixed time or in the next frame (as it is here)
    if (getStartupState() === StartupState.ExtrasHostInitialized) {
      setStartupState(StartupState.InstrumentsInitialized);
    }

    if (getStartupState() === StartupState.FltFileLoaded) {
      setStartupState(StartupState.ExtrasHostInitialized);
      console.log(`EXTRASHOST: Instruments are ready at ${new Date().toLocaleString()}`);
    }
  } else if (gameState < GameState.briefing && getStartupState() > StartupState.FltFileLoaded) {
    // This is dangerous, since this state can only be left by loading in StartupState.FltFileLoaded from the *.flt files
    // Disable for now, all Vars should be set to 0 on reload anyways
    // setStartupState(StartupState.Uninitialized);
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

function setStartupState(state: number) {
  return SimVar.SetSimVarValue('L:A32NX_STARTUP_STATE', SimVarValueType.Enum, state);
}
