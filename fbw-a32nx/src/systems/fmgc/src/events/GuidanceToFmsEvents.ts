// Copyright (c) 2026 FlyByWire Simulations
export interface GuidanceToFmsEvents {
  /**
   * The active selected speed by the FG in knots sent to the FMS.
   * Null if selected speed is not available.
   */
  fg_selected_speed: number | null;
}
