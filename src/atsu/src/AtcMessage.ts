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
    Wilco,
    Roger,
    Negative,
    Unable,
    Acknowledge,
    Refuse
}

export enum AtcMessageComStatus {
    Sending,
    Sent,
    Failed
}

/**
 * Defines the generic ATC message
 */
export class AtcMessage {
    public UniqueMessageID : number = undefined;

    public Timestamp : AtcTimestamp = undefined;

    public DcduTimestamp : number = undefined;

    public Station = '';

    public ComStatus : AtcMessageComStatus = undefined;

    public Type : AtcMessageType = undefined;

    public Direction : AtcMessageDirection = undefined;

    public Status : AtcMessageStatus = undefined;

    public Confirmed = false;

    public serialize() : string {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData) {
        this.UniqueMessageID = jsonData.UniqueMessageID;
        this.Timestamp = new AtcTimestamp();
        this.Timestamp.deserialize(jsonData.Timestamp);
        this.Station = jsonData.Station;
        this.ComStatus = jsonData.ComStatus;
        this.Type = jsonData.Type;
        this.Direction = jsonData.Direction;
        this.Status = jsonData.Status;
        this.Confirmed = jsonData.Confirmed;
    }
}

export { AtcTimestamp };
