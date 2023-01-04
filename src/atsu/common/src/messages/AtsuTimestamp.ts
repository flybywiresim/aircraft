//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { timestampToString } from '../components/Convert';

/**
 * Defines the decoded UTC timestamp
 */
export class AtsuTimestamp {
    public Year: number = 0;

    public Month: number = 0;

    public Day: number = 0;

    public Seconds: number = 0;

    public deserialize(jsonData: Record<string, unknown>) {
        if (jsonData !== null) {
            this.Year = jsonData.Year as number;
            this.Month = jsonData.Month as number;
            this.Day = jsonData.Day as number;
            this.Seconds = jsonData.Seconds as number;
        }
    }

    public mailboxTimestamp(): string {
        return `${timestampToString(this.Seconds)}Z`;
    }

    public fmsTimestamp(): string {
        return timestampToString(this.Seconds);
    }
}
