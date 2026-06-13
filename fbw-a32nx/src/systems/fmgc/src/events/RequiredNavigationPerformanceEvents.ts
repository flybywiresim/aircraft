// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
export interface RequiredNavigationPerformanceEvents {
  /**
   * Sent from the FMS whenever a pilot RNP is inserted and it is greater than the active leg rnp. Undefined is sent when the condition is no longer applicable.
   */
  procedure_rnp_is: number | undefined;

  /**
   * Sent from the FMS whenever a pilot RNP is inserted and it is greater than the area default rnp. Undefined is sent when the condition is no longer applicable.
   */
  area_rnp_is: number | undefined;
}
