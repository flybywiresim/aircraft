//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageType, AtsuMessageSerializationFormat, AtsuMessageDirection } from './AtsuMessage';
import { CpdlcMessagesDownlink, CpdlcMessageElement } from './CpdlcMessageElements';
import { CpdlcMessage } from './CpdlcMessage';
import { wordWrap } from '../Common';

/**
 * Defines the general CPDLC request message
 */
export class RequestMessage extends CpdlcMessage {
    public Extensions: CpdlcMessageElement[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.Request;
        this.Direction = AtsuMessageDirection.Downlink;
    }

    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        jsonData.Extensions.forEach((element) => {
            const entry = new CpdlcMessageElement('');
            entry.deserialize(element);
            this.Extensions.push(entry);
        });
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        const contentEntries: string[] = [];
        let message = '';

        contentEntries.push(this.serializeContent(format, CpdlcMessagesDownlink[this.Content.TypeId][0][0], this.Content));
        this.Extensions.forEach((element) => {
            contentEntries.push(this.serializeContent(format, CpdlcMessagesDownlink[element.TypeId][0][0], element));
        });
        const content = contentEntries.join(' ');
        const lines = wordWrap(content, 25);

        if (format === AtsuMessageSerializationFormat.Network) {
            message = `/data2/${this.CurrentTransmissionId}/${this.PreviousTransmissionId !== -1 ? this.PreviousTransmissionId : ''}/${this.Content.ExpectedResponse}/${content}`;
        } else if (format === AtsuMessageSerializationFormat.DCDU) {
            message = lines.join('\n');
        } else if (format === AtsuMessageSerializationFormat.MCDU) {
            message += `{cyan}${this.Timestamp.dcduTimestamp()} TO ${this.Station}{end}\n`;
            lines.forEach((line) => message += `{green}${line}{end}\n`);
            message += '{white}------------------------{end}\n';

            if (this.extendSerializationWithResponse()) {
                message += this.Response.serialize(format);
            }
        } else if (format === AtsuMessageSerializationFormat.Printer) {
            message += `${this.Timestamp.dcduTimestamp()} TO ${this.Station}}\n`;
            message += lines.join('\n');
            message += '------------------------\n';

            if (this.extendSerializationWithResponse()) {
                message += this.Response.serialize(format);
            }
        } else {
            message = content;
        }

        return message;
    }
}
