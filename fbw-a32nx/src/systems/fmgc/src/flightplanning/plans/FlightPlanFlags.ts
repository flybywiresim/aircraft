// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export enum FlightPlanFlags {
  None = 0,
  /**
   * Indicates that the flight plan was copied from the active flight plan.
   */
  CopiedFromActive = 1 << 0,
}
