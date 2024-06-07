//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuTimestamp } from './AtsuTimestamp';

export enum AtsuMessageNetwork {
    Hoppie,
    FBW
}

export enum AtsuMessageDirection {
    Uplink,
    Downlink
}

export enum AtsuMessageType {
    Freetext = 0,
    METAR = 1,
    TAF = 2,
    ATIS = 3,
    AOC = 4,
    CPDLC = 5,
    DCL = 6,
    OCL = 7,
    ATC = 8
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
    MCDUMonitored,
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

    public Timestamp: AtsuTimestamp = new AtsuTimestamp();

    public Station = '';

    public ComStatus: AtsuMessageComStatus = AtsuMessageComStatus.Open;

    public Type: AtsuMessageType = null;

    public Direction: AtsuMessageDirection = null;

    public Confirmed = false;

    public Message = '';

    public serialize(_format: AtsuMessageSerializationFormat) : string {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData: Record<string, unknown>) {
        this.Network = jsonData.Network;
        this.UniqueMessageID = jsonData.UniqueMessageID;
        if (jsonData.Timestamp) {
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
