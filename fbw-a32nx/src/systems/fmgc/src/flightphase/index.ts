// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPhaseManager } from './FlightPhaseManager';

const flightPhaseManager = new FlightPhaseManager();

export { FlightPhaseManager };

export function getFlightPhaseManager(): FlightPhaseManager {
  return flightPhaseManager;
}
