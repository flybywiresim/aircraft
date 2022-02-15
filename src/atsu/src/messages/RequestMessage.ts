//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType, AtsuMessageSerializationFormat, AtsuMessageDirection } from './AtsuMessage';
import { CpdlcMessage, CpdlcMessageResponse } from './CpdlcMessage';
import { cpdlcToString, wordWrap } from '../Common';

/**
 * Defines the general CPDLC request message
 */
export class RequestMessage extends CpdlcMessage {
    public Request: string = '';

    public Reason: string = '';

    public Freetext: string[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.Request;
        this.Direction = AtsuMessageDirection.Output;
    }

    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        this.Request = jsonData.Request;
        this.Reason = jsonData.Reason;
        this.Freetext = jsonData.Freetext;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let content = this.Request;
        if (this.Reason !== '') {
            content += ` ${this.Reason}`;
        }
        let message = '';
        content += ` ${this.Freetext.join(' ')}`;
        const lines = wordWrap(content, 25);

        if (format === AtsuMessageSerializationFormat.Network) {
            message = `/data2/${this.CurrentTransmissionId}/${this.PreviousTransmissionId !== -1 ? this.PreviousTransmissionId : ''}/${cpdlcToString(this.RequestedResponses)}`;
            message += `/${content}`;
        } else if (format === AtsuMessageSerializationFormat.DCDU) {
            message = lines.join('\n');
        } else if (format === AtsuMessageSerializationFormat.MCDU) {
            message += `{cyan}${this.Timestamp.dcduTimestamp()} TO ${this.Station}{end}\n`;
            message += lines.join('\n');
            message += '{white}------------------------{end}\n';

            if (this.ResponseType === CpdlcMessageResponse.Other && this.Response !== undefined) {
                message += this.Response.serialize(format);
            }
        } else if (format === AtsuMessageSerializationFormat.Printer) {
            message += `${this.Timestamp.dcduTimestamp()} TO ${this.Station}}\n`;
            message += lines.join('\n');
            message += '------------------------\n';

            if (this.ResponseType === CpdlcMessageResponse.Other && this.Response !== undefined) {
                message += this.Response.serialize(format);
            }
        } else {
            message = content;
        }

        return message;
    }
}
