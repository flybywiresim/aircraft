//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageNetwork, AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';
import { cpdlcToString } from '../Common';

export enum CpdlcMessageRequestedResponseType {
    NotRequired,
    WilcoUnable,
    AffirmNegative,
    Roger,
    No,
    Yes
}

export enum CpdlcMessageResponse {
    None,
    Other,
    Standby,
    Wilco,
    Roger,
    Affirm,
    Negative,
    Unable,
    Acknowledge,
    Refuse
}

/**
 * Defines the general freetext message format
 */
export class CpdlcMessage extends AtsuMessage {
    public RequestedResponses: CpdlcMessageRequestedResponseType | undefined = undefined;

    // describes the response type of the Response entry
    public ResponseType: CpdlcMessageResponse | undefined = undefined;

    public Response: CpdlcMessage | undefined = undefined;

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

        this.RequestedResponses = jsonData.ExpectedResponses;
        this.ResponseType = jsonData.ResponseType;
        if (jsonData.Response !== undefined) {
            this.Response = new CpdlcMessage();
            this.Response.deserialize(jsonData.Response);
        }
        this.PreviousTransmissionId = jsonData.PreviousTransmissionId;
        this.CurrentTransmissionId = jsonData.CurrentTransmissionId;
        this.Lines = jsonData.Lines;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let message = '';

        if (format === AtsuMessageSerializationFormat.Network) {
            message = `/data2/${this.CurrentTransmissionId}/${this.PreviousTransmissionId !== -1 ? this.PreviousTransmissionId : ''}/${cpdlcToString(this.RequestedResponses)}`;
            message += `/${this.Lines.join(' ')}`;
        } else if (format === AtsuMessageSerializationFormat.DCDU || format === AtsuMessageSerializationFormat.MCDU) {
            message = this.Lines.join('\n');
        } else {
            message = this.Lines.join(' ');
        }

        return message;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage };
