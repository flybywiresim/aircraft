//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageNetwork, AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';
import { cpdlcToString } from './Common';

export enum CpdlcMessageResponseType {
    NotRequired,
    WilcoUnable,
    AffirmNegative,
    Roger,
    No,
    Yes
}

/**
 * Defines the general freetext message format
 */
export class CpdlcMessage extends AtsuMessage {
    public Response : CpdlcMessageResponseType = undefined;

    public InputTransmissionId = -1;

    public OutputTransmissionId = -1;

    public Lines: string[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.CDPDLC;
        this.Network = AtsuMessageNetwork.Hoppie;
        this.Direction = AtsuMessageDirection.Output;
        this.Status = AtsuMessageResponseStatus.Open;
    }

    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        this.Type = jsonData.Type;
        this.Network = jsonData.Network;
        this.Direction = jsonData.Direction;
        this.Status = jsonData.Status;
        this.Lines = jsonData.Lines;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let message = '';

        if (format === AtsuMessageSerializationFormat.Network) {
            message = `/data2/${this.OutputTransmissionId}/${this.InputTransmissionId !== -1 ? this.InputTransmissionId : ''}/${cpdlcToString(this.Response)}`;
            message += `/${this.Lines.join(' ')}`;
        } else {
            message = this.Lines.join(' ');
        }

        return message;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageResponseStatus, AtsuMessageSerializationFormat, AtsuMessage };
