//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

/**
 * Defines the decoded UTC timestamp
 */
export class AtsuTimestamp {
    public Year: number = SimVar.GetSimVarValue('E:ZULU YEAR', 'number');

    public Month: number = SimVar.GetSimVarValue('E:ZULU MONTH OF YEAR', 'number');

    public Day: number = SimVar.GetSimVarValue('E:ZULU DAY OF MONTH', 'number');

    public Seconds: number = SimVar.GetSimVarValue('E:ZULU TIME', 'seconds');

    public deserialize(jsonData) {
        this.Year = jsonData.Year;
        this.Month = jsonData.Month;
        this.Day = jsonData.Day;
        this.Seconds = jsonData.Seconds;
    }

    public dcduTimestamp() {
        const hours = Math.floor(this.Seconds / 3600);
        const minutes = Math.floor(this.Seconds / 60) % 60;
        return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}Z`;
    }

    public mcduTimestamp() {
        const hours = Math.floor(this.Seconds / 3600);
        const minutes = Math.floor(this.Seconds / 60) % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}
