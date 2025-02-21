// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * Transmitted from FMS
 */
export interface FmsData {
  /** Selected origin airport. */
  fmsOrigin: string | null;
  /** Selected destination airport. */
  fmsDestination: string | null;
  /** Selected alternate airport. */
  fmsAlternate: string | null;
  /** Identifier of departure runway. */
  fmsDepartureRunway: string | null;
  /** Identifier of landing runway selected through FMS. */
  fmsLandingRunway: string | null;
  /** Flight number entered on INIT page */
  fmsFlightNumber: string | null;
}
