// Copyright (c) 2021-2023, 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { DateTimeFormatter } from '@microsoft/msfs-sdk';

export class TimeFormatters {
  private static hhmmssFormatter = DateTimeFormatter.create('{HH}:{mm}:{ss}');

  private static hhmmFormatter = DateTimeFormatter.create('{HH}{mm}');

  private static hhmmFormatterWithDot = DateTimeFormatter.create('{HH}:{mm}');

  /**
   * Formats a number in seconds to HHMM
   * @param seconds  the number in seconds to format
   * @param withDoubleDot whether to apply ":" to the formatted time.
   * @returns the formatted number in seconds.
   */
  public static secondsTohhmm(seconds: number, withDoubleDot = false) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    return h.toFixed(0).padStart(2, '0') + (withDoubleDot ? ':' : '') + m.toFixed(0).padStart(2, '0');
  }

  public static minutesToSeconds(minutes: number) {
    return minutes * 60;
  }

  public static hoursToSeconds(hours: number) {
    return hours * 3600;
  }

  /**
   * Converts a number in seconds to a formatted UTC time (HH)
   * @param seconds the number in seconds to format.
   * @returns the formatted UTC time.
   */
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

  /**
   * Formats a time expressed as unix timestamp in miliseconds to hh:mm:ss
   * @param miliSeconds the time in milliseconds
   * @returns the formatted time in hh:mm:ss
   */
  public static milisecondsTohhmmss(miliSeconds: number): string {
    return this.hhmmssFormatter(miliSeconds);
  }

  /**
   * Formats a time expressed as a unix timestamp in miliseconds to hhmm
   * @param miliSeconds the time in miliseconds
   * @param withDoubleDot whether to apply ":" to the fomartted time.
   * @returns the formatted time in hh:mm
   */
  public static milisecondsTohhmm(miliSeconds: number, withDoubleDot = false): string {
    return withDoubleDot ? this.hhmmFormatterWithDot(miliSeconds) : this.hhmmFormatter(miliSeconds);
  }
}
