// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export class FmsFormatters {
  public static secondsTohhmm(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    return h.toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
  }

  public static minutesToSeconds(minutes: number) {
    return minutes * 60;
  }

  public static hoursToSeconds(hours: number) {
    return hours * 3600;
  }

  public static secondsToUTC(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    return (h % 24).toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
  }

  /**
   * Computes hour and minutes when given minutes
   * @param minutes - minutes used to make the conversion
   * @returns A string in the format "HHMM" e.g "0235"
   */
  public static minutesTohhmm(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes - h * 60;
    return h.toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
  }

  /**
   * computes minutes when given hour and minutes
   * @param hhmm string used to make the conversion
   * @returns numbers in minutes form
   */
  public static hhmmToMinutes(hhmm: string): number {
    if (!hhmm) {
      return NaN;
    }
    const h = parseInt(hhmm.substring(0, 2));
    const m = parseInt(hhmm.substring(2, 4));
    return h * 60 + m;
  }

  public static secondsTohhmmss(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    const s = Math.floor(seconds - h * 3600 - m * 60);
    return h.toFixed(0).padStart(2, '0') + ':' + m.toFixed(0).padStart(2, '0') + ':' + s.toFixed(0).padStart(2, '0');
  }
}
