// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export function trySetAircraftReadyState() {
  // Signal that the aircraft is ready via L:A32NX_IS_READY. Wait until FLT file is loaded,
  // then set to ready once, then reset FLT file status so we won't run into problems on reload
  const fltIsLoaded = SimVar.GetSimVarValue('A32NX_FLT_FILE_IS_LOADED', 'number');
  if (fltIsLoaded === 1) {
    SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
    SimVar.SetSimVarValue('L:A32NX_FLT_FILE_IS_LOADED', 'number', 0);
    console.log(new Date().toLocaleString(), 'EXTRASHOST: Aircraft is ready');
  }
}
