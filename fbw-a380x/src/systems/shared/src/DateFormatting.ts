//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
//

export class DateFormatting {
  public static secondsToHHmmString(seconds: number) {
    const minutesTotal = seconds / 60;
    const hours = Math.abs(Math.floor(minutesTotal / 60))
      .toFixed(0)
      .toString()
      .padStart(2, '0');
    const minutes = Math.abs(minutesTotal % 60)
      .toFixed(0)
      .toString()
      .padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  public static secondsToHHmmssString(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = Math.floor(seconds - hours * 3600 - minutes * 60).toFixed(0);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
  }
}
