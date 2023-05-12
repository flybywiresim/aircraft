//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuTimestamp } from '../types/AtsuTimestamp';

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
    FlightPlan = 4,
    NOTAM = 5,
    OperationsPerformance = 6,
    OperationsFuel = 7,
    OperationsWeights = 8,
    OOOI = 9,
    AOC = 10,
    CPDLC = 20,
    DCL = 21,
    OCL = 22,
    ATC = 33
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

    public serialize(_format: AtsuMessageSerializationFormat): string {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public static deserialize(jsonData: Record<string, unknown> | AtsuMessage, message: AtsuMessage = null): AtsuMessage {
        if (message === null) message = new AtsuMessage();

        message.Network = jsonData.Network as AtsuMessageNetwork;
        message.UniqueMessageID = jsonData.UniqueMessageID as number;
        if (jsonData.Timestamp) {
            message.Timestamp = AtsuTimestamp.deserialize(jsonData.Timestamp as Record<string, unknown>);
        }
        message.Station = jsonData.Station as string;
        message.ComStatus = jsonData.ComStatus as AtsuMessageComStatus;
        message.Type = jsonData.Type as AtsuMessageType;
        message.Direction = jsonData.Direction as AtsuMessageDirection;
        message.Confirmed = jsonData.Confirmed as boolean;
        message.Message = jsonData.Message as string;

        return message;
    }
}
