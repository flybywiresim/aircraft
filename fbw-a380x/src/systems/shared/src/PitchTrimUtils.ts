// Copyright (c) 2021-2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export default class PitchTrimUtils {
  /** Find optimal pitch trim setting for GW CG */
  static cgToPitchTrim(cg: number): number {
    if (cg < 29) {
      return 5.8;
    } else if (cg <= 34.5) {
      return 5.8 - ((cg - 29) * 56) / 275;
    } else if (cg <= 43) {
      return 4.68 - ((cg - 34.5) * 243) / 425;
    } else {
      return -0.18;
    }
  }

  /** Find corresponding CG for pitch trim setting */
  static pitchTrimToCg(trim: number) {
    if (trim > 4.68) {
      return 34.5 - ((trim - 4.68) * 275) / 56;
    } else {
      return 43 - ((trim + 0.18) * 425) / 243;
    }
  }

  /** Checks for a given pitch trim setting, whether it's within certified ranges
   * @param pitchTrim pitch trim in degrees. Down is negative
   */
  static pitchTrimOutOfRange(pitchTrim: number) {
    return pitchTrim > 5.8 || pitchTrim < -0.18;
  }

  /** Checks for a given pitch trim setting and CG, whether it's within the allowed green band
   * @param pitchTrim pitch trim in degrees. Down is negative
   */
  static pitchTrimInGreenBand(pitchTrim: number): boolean {
    return !PitchTrimUtils.pitchTrimOutOfRange(pitchTrim);
  }

  /** Checks for a given pitch trim setting and CG, whether it's within the optimal cyan band (depending on CG)
   * @param cg center of gravity in percent
   * @param pitchTrim pitch trim in degrees. Down is negative
   */
  static pitchTrimInCyanBand(cg: number, pitchTrim: number): boolean {
    return (
      Math.abs(PitchTrimUtils.cgToPitchTrim(cg) - pitchTrim) < 1.5 && !PitchTrimUtils.pitchTrimOutOfRange(pitchTrim)
    );
  }
}
