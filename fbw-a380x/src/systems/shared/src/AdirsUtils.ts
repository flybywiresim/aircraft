// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { Arinc429WordData } from '@flybywiresim/fbw-sdk';

/**
 * Gets the remaining IR alignment time in minutes based on the maintenance word.
 * @param v the IR maintenance word
 * @returns  the remaining align time in minutes. NULL if word is invalid or IR is not aligning.
 */
export function getRemainingAlignTime(v: Arinc429WordData): number | null {
  if (!v.isInvalid()) {
    if (v.bitValue(16) && v.bitValue(17) && v.bitValue(18)) {
      return 7;
    }
    if (v.bitValue(17) && v.bitValue(18)) {
      return 6;
    }
    if (v.bitValue(16) && v.bitValue(18)) {
      return 5;
    }
    if (v.bitValue(18)) {
      return 4;
    }
    if (v.bitValue(16) && v.bitValue(17)) {
      return 3;
    }
    if (v.bitValue(17)) {
      return 2;
    }
    if (v.bitValue(16)) {
      return 1;
    }
  }
  return null;
}
