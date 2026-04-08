// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export enum FlightPlanFlags {
  None = 0,
  /**
   * Indicates that the flight plan was copied from the active flight plan.
   */
  CopiedFromActive = 1 << 0,
  /**
   * Indicates that the flight plan was swapped with the active flight plan.
   */
  SwappedWithActive = 1 << 1,
  /**
   * Indicates that the flight plan was created manually through the INIT or FPLN pages.
   */
  ManualCreation = 1 << 2,
  /**
   * Indicates that the flight plan was created by inserting a received company flight plan.
   */
  CompanyFlightPlan = 1 << 3,
  /**
   * Indicates that the flight plan was created by uploading a received ATC flight plan.
   */
  AtcFlightPlan = 1 << 4,
  /**
   * Indicates that the flight plan was modified after initial creation (relevant for SEC flight plans).
   */
  ModifiedAfterCreation = 1 << 5,
}
