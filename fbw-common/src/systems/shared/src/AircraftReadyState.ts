// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SimVarValueType } from '@microsoft/msfs-sdk';

export function trySetAircraftReadyState(gameState: GameState) {
  if (gameState === GameState.ingame) {
    // Haven't really thought about the transition here yet, whether it should be a fixed time or in the next frame (as it is here)
    if (getStartupState() === StartupState.ExtrasHostInitialized) {
      console.log('s3');
      setStartupState(StartupState.InstrumentsInitialized);
    }

    if (getStartupState() === StartupState.FltFileLoaded) {
      console.log('s2');
      setStartupState(StartupState.ExtrasHostInitialized);
      console.log(`EXTRASHOST: Instruments are ready at ${new Date().toLocaleString()}`);
    }
  } else if (getStartupState() > StartupState.FltFileLoaded) {
    console.log('s0', gameState);
    setStartupState(StartupState.Uninitialized);
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
