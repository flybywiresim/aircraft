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
    FmsDisplay,
    FmsDisplayMonitored,
    Mailbox,
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
    public deserialize(jsonData: Record<string, unknown> | AtsuMessage) {
        this.Network = jsonData.Network as AtsuMessageNetwork;
        this.UniqueMessageID = jsonData.UniqueMessageID as number;
        if (jsonData.Timestamp) {
            this.Timestamp.deserialize(jsonData.Timestamp as Record<string, unknown>);
        }
        this.Station = jsonData.Station as string;
        this.ComStatus = jsonData.ComStatus as AtsuMessageComStatus;
        this.Type = jsonData.Type as AtsuMessageType;
        this.Direction = jsonData.Direction as AtsuMessageDirection;
        this.Confirmed = jsonData.Confirmed as boolean;
        this.Message = jsonData.Message as string;
    }
}
