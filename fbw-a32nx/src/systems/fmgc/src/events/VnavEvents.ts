//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
export interface VnavEvents {
  /** The managed speed used by VNAV during the descent phase. Null if not available. */
  fms_vnav_managed_speed: number | null;
}
