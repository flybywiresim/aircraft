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
    CPDLC = 6,
    DCL = 7,
    OCL = 8,
    ATC = 9
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

    public UniqueMessageID: number = -1;

    public Timestamp: AtsuTimestamp | undefined = undefined;

    public Station = '';

    public ComStatus: AtsuMessageComStatus = AtsuMessageComStatus.Open;

    public Type: AtsuMessageType | undefined = undefined;

    public Direction: AtsuMessageDirection | undefined = undefined;

    public Confirmed = false;

    public Message = '';

    public serialize(_format: AtsuMessageSerializationFormat) : string {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData: Record<string, unknown>) {
        this.Network = jsonData.Network;
        this.UniqueMessageID = jsonData.UniqueMessageID;
        if (jsonData.Timestamp !== undefined) {
            this.Timestamp = new AtsuTimestamp();
            this.Timestamp.deserialize(jsonData.Timestamp);
        }
        this.Station = jsonData.Station;
        this.ComStatus = jsonData.ComStatus;
        this.Type = jsonData.Type;
        this.Direction = jsonData.Direction;
        this.Confirmed = jsonData.Confirmed;
        this.Message = jsonData.Message;
    }
}
