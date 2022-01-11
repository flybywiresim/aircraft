//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuTimestamp } from './AtsuTimestamp';

export enum AtsuMessageDirection {
    Input,
    Output
}

export enum AtsuMessageType {
    Freetext = 0,
    PDC = 1,
    METAR = 2,
    TAF = 3,
    ATIS = 4,
    AOC = 5
}

export enum AtsuMessageResponseStatus {
    Open,
    Wilco,
    Roger,
    Negative,
    Unable,
    Acknowledge,
    Refuse
}

export enum AtsuMessageComStatus {
    Open,
    Sending,
    Sent,
    Received,
    Failed
}

export enum AtsuMessageSerializationFormat {
    MCDU,
    DCDU,
    Printer
}

/**
 * Defines the generic ATC message
 */
export class AtsuMessage {
    public UniqueMessageID : number = undefined;

    public Timestamp : AtsuTimestamp = undefined;

    public DcduTimestamp : number = undefined;

    public Station = '';

    public ComStatus : AtsuMessageComStatus = AtsuMessageComStatus.Open;

    public Type : AtsuMessageType = undefined;

    public Direction : AtsuMessageDirection = undefined;

    public Status : AtsuMessageResponseStatus = undefined;

    public Confirmed = false;

    public serialize(_format: AtsuMessageSerializationFormat) : string {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData) {
        this.UniqueMessageID = jsonData.UniqueMessageID;
        this.Timestamp = new AtsuTimestamp();
        this.Timestamp.deserialize(jsonData.Timestamp);
        this.Station = jsonData.Station;
        this.ComStatus = jsonData.ComStatus;
        this.Type = jsonData.Type;
        this.Direction = jsonData.Direction;
        this.Status = jsonData.Status;
        this.Confirmed = jsonData.Confirmed;
    }
}

export { AtsuTimestamp };
