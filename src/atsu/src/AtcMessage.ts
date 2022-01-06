//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

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
    Closed,
    Wilco,
    Modify,
    Cannot
}

/**
 * Defines the generic ATC message
 */
export class AtcMessage {
    public UniqueMessageID = undefined;

    public Timestamp = undefined;

    public Type = undefined;

    public Direction = undefined;

    public Status = undefined;

    constructor() {
        let datetime = new Date().getTime();

        this.UniqueMessageID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (datetime + Math.random() * 16) % 16 | 0;
            datetime = Math.floor(datetime / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    public serialize() {
        throw new Error('No valid implementation');
    }

    // used to deserialize event data
    public deserialize(jsonData) {
        this.UniqueMessageID = jsonData.UniqueMessageID;
        this.Timestamp = jsonData.Timestamp;
        this.Type = jsonData.Type;
        this.Direction = jsonData.Direction;
        this.Status = jsonData.Status;
    }
}
