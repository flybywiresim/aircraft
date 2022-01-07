//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtcTimestamp } from './AtcTimestamp';

export enum AtcMessageDirection {
    Input,
    Output
}

export enum AtcMessageType {
    Telex,
    PDC
}

export enum AtcMessageStatus {
    Open,
    Sent,
    Wilco,
    Roger,
    Negative,
    Unable,
    Acknowledge,
    Refuse
}

/**
 * Defines the generic ATC message
 */
export class AtcMessage {
    public UniqueMessageID : string = undefined;

    public Timestamp : AtcTimestamp = undefined;

    public DcduTimestamp : number = undefined;

    public Station = '';

    public Type : AtcMessageType = undefined;

    public Direction : AtcMessageDirection = undefined;

    public Status : AtcMessageStatus = undefined;

    public Confirmed = false;

    constructor() {
        let datetime = new Date().getTime();

        this.UniqueMessageID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (datetime + Math.random() * 16) % 16 | 0;
            datetime = Math.floor(datetime / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    public serialize() : string {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData) {
        this.UniqueMessageID = jsonData.UniqueMessageID;
        this.Timestamp = new AtcTimestamp();
        this.Timestamp.deserialize(jsonData.Timestamp);
        this.Station = jsonData.Station;
        this.Type = jsonData.Type;
        this.Direction = jsonData.Direction;
        this.Status = jsonData.Status;
        this.Confirmed = jsonData.Confirmed;
    }
}

export { AtcTimestamp };
