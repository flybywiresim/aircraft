//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
//
import { DateTimeFormatter } from '@microsoft/msfs-sdk';

export class DateTimeFormatters {
  private static readonly hhmmFormatter = DateTimeFormatter.create('{HH}{mm}');

  /**
   * Formats a unix timestamp in miliseconds since epoch to a string in the format "HHMM"
   * @param miliseconds - miliseconds since epoch
   * @returns the formatted time in "HHMM" format.
   */
  public static milisecondsTohhmm(miliseconds: number): string {
    return this.hhmmFormatter(miliseconds);
  }
}
