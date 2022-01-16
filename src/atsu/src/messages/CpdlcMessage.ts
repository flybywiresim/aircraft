//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageNetwork, AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';
import { cpdlcToString } from '../Common';

export enum CpdlcMessageResponseType {
    NotRequired,
    WilcoUnable,
    AffirmNegative,
    Roger,
    No,
    Yes
}

export enum CpdlcMessageResponse {
    Standby,
    Wilco,
    Roger,
    Negative,
    Unable,
    Acknowledge,
    Refuse
}

/**
 * Defines the general freetext message format
 */
export class CpdlcMessage extends AtsuMessage {
    public ExpectedResponses: CpdlcMessageResponseType = undefined;

    public Response: CpdlcMessageResponse | undefined = undefined;

    public PreviousTransmissionId = -1;

    public CurrentTransmissionId = -1;

    public Lines: string[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.CPDLC;
        this.Network = AtsuMessageNetwork.Hoppie;
        this.Direction = AtsuMessageDirection.Output;
    }

    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        this.ExpectedResponses = jsonData.ExpectedResponses;
        this.Response = jsonData.Response;
        this.PreviousTransmissionId = jsonData.PreviousTransmissionId;
        this.CurrentTransmissionId = jsonData.CurrentTransmissionId;
        this.Lines = jsonData.Lines;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let message = '';

        if (format === AtsuMessageSerializationFormat.Network) {
            message = `/data2/${this.CurrentTransmissionId}/${this.PreviousTransmissionId !== -1 ? this.PreviousTransmissionId : ''}/${cpdlcToString(this.ExpectedResponses)}`;
            message += `/${this.Lines.join(' ')}`;
        } else {
            message = this.Lines.join(' ');
        }

        return message;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage };
