// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * Options for drawing the ND map.
 */
export interface MapOptions {
  /** Whether to box waypoints when hovered by the cursor/mouse. Defaults to false. */
  waypointBoxing: boolean;
  /** Whether to draw secondary flight plan waypoints in white. Defaults to false. */
  secondaryFlightPlanWaypointsInWhite: boolean;
}
