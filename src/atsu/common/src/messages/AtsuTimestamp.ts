//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { timestampToString } from '../components/Convert';

/**
 * Defines the decoded UTC timestamp
 */
export class AtsuTimestamp {
    public Year: number = SimVar.GetSimVarValue('E:ZULU YEAR', 'number');

    public Month: number = SimVar.GetSimVarValue('E:ZULU MONTH OF YEAR', 'number');

    public Day: number = SimVar.GetSimVarValue('E:ZULU DAY OF MONTH', 'number');

    public Seconds: number = SimVar.GetSimVarValue('E:ZULU TIME', 'seconds');

    public deserialize(jsonData: Record<string, unknown>) {
        this.Year = jsonData.Year as number;
        this.Month = jsonData.Month as number;
        this.Day = jsonData.Day as number;
        this.Seconds = jsonData.Seconds as number;
    }

    public mailboxTimestamp(): string {
        return `${timestampToString(this.Seconds)}Z`;
    }

    public mcduTimestamp(): string {
        return timestampToString(this.Seconds);
    }
}
