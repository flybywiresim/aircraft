//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
export interface VnavEvents {
  /** The managed speed target used by VNAV during the descent phase. Null if not available. */
  managed_speed_target: number | null;
}
