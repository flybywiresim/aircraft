//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuTimestamp } from './AtsuTimestamp';

export enum AtsuMessageNetwork {
    Hoppie,
    FBW
}

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
    AOC = 5,
    CDPDLC = 6,
    ATC = 7
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
    Printer,
    Network
}

/**
 * Defines the generic ATC message
 */
export class AtsuMessage {
    public Network = AtsuMessageNetwork.Hoppie;

    public UniqueMessageID : number | undefined = undefined;

    public Timestamp : AtsuTimestamp | undefined = undefined;

    public DcduTimestamp : number | undefined = undefined;

    public Station = '';

    public ComStatus : AtsuMessageComStatus = AtsuMessageComStatus.Open;

    public Type : AtsuMessageType | undefined = undefined;

    public Direction : AtsuMessageDirection | undefined = undefined;

    public Status : AtsuMessageResponseStatus | undefined = undefined;

    public Confirmed = false;

    public serialize(_format: AtsuMessageSerializationFormat) : string {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData) {
        this.Network = jsonData.Network;
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
