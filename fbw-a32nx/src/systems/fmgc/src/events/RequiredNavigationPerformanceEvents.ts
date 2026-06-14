// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
export interface RequiredNavigationPerformanceEvents {
  /**
   * Sent from the FMS with the active leg rnp whenever a pilot RNP is inserted and it is greater than the active leg rnp. Undefined when the condition is no longer applicable.
   */
  pilot_rnp_greater_than_proc_rnp: number | undefined;

  /**
   * Sent from the FMS with the area default rnp whenever a pilot RNP is inserted and it is greater than the area default rnp. Undefined when the condition is no longer applicable.
   */
  pilot_rnp_greater_than_area_rnp: number | undefined;
}
