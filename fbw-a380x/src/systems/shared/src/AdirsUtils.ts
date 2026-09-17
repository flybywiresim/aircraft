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
    const firstBitMinute = v.bitValue(16) ? 1 : 0;
    const secondBitMinute = v.bitValue(17) ? 2 : 0;
    const thirdBitMinute = v.bitValue(18) ? 4 : 0;
    return firstBitMinute + secondBitMinute + thirdBitMinute;
  }
  return null;
}
