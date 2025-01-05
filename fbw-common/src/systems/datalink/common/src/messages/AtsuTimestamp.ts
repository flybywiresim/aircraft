//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Clock } from '../types';
import { timestampToString } from '../components/Convert';

/**
 * Defines the decoded UTC timestamp
 */
export class AtsuTimestamp {
  public Year: number = 0;

  public Month: number = 0;

  public Day: number = 0;

  public Seconds: number = 0;

  public static deserialize(jsonData: Record<string, unknown>): AtsuTimestamp {
    const retval = new AtsuTimestamp();

    if (jsonData !== null) {
      retval.Year = jsonData.Year as number;
      retval.Month = jsonData.Month as number;
      retval.Day = jsonData.Day as number;
      retval.Seconds = jsonData.Seconds as number;
    }

    return retval;
  }

  public mailboxTimestamp(): string {
    return `${timestampToString(this.Seconds)}Z`;
  }

  public fmsTimestamp(): string {
    return timestampToString(this.Seconds);
  }

  public static fromClock(clock: Clock): AtsuTimestamp {
    const timestamp = new AtsuTimestamp();
    timestamp.Year = clock.year;
    timestamp.Month = clock.month;
    timestamp.Day = clock.dayOfMonth;
    timestamp.Seconds = clock.secondsOfDay;
    return timestamp;
  }
}
