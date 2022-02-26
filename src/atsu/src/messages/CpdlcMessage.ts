//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageNetwork, AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';
import { CpdlcMessageElement, CpdlcMessagesDownlink, CpdlcMessagesUplink } from './CpdlcMessageElements';
import { wordWrap } from '../Common';

/**
 * Defines the general freetext message format
 */
export class CpdlcMessage extends AtsuMessage {
    public Content: CpdlcMessageElement | undefined = undefined;

    public Response: CpdlcMessage | undefined = undefined;

    public CurrentTransmissionId = -1;

    public PreviousTransmissionId = -1;

    constructor() {
        super();
        this.Type = AtsuMessageType.CPDLC;
        this.Network = AtsuMessageNetwork.Hoppie;
        this.Direction = AtsuMessageDirection.Downlink;
    }

    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        if (jsonData.Content !== undefined) {
            this.Content = new CpdlcMessageElement('');
            this.Content.deserialize(jsonData.Content);
        }
        if (jsonData.Response !== undefined) {
            this.Response = new CpdlcMessage();
            this.Response.deserialize(jsonData.Response);
        }
        this.CurrentTransmissionId = jsonData.CurrentTransmissionId;
        this.PreviousTransmissionId = jsonData.PreviousTransmissionId;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let insertContent = false;
        let message: string = '';
        let content: string = '';

        if (this.Direction === AtsuMessageDirection.Uplink) {
            if (this.Content === undefined) {
                content = this.Message;
            } else {
                content = CpdlcMessagesUplink[this.Content.TypeId][0][0];
                insertContent = true;
            }
        } else {
            content = CpdlcMessagesDownlink[this.Content.TypeId][0][0];
            insertContent = true;
        }

        if (insertContent) {
            this.Content.Content.forEach((entry) => {
                const idx = content.indexOf('%s');
                content = `${content.substring(0, idx)}${entry.Value}${content.substring(idx + 2)}`;
            });
        }

        if (format === AtsuMessageSerializationFormat.Network) {
            message = `/data2/${this.CurrentTransmissionId}/${this.PreviousTransmissionId !== -1 ? this.PreviousTransmissionId : ''}/${this.Content.ExpectedResponse}/${content}`;
        } else if (format === AtsuMessageSerializationFormat.DCDU) {
            // create the lines and interpret '_' as an encoded newline
            let lines = [];
            content.split('_').forEach((entry) => {
                lines = lines.concat(wordWrap(entry, 30));
            });
            message = lines.join('\n');
        } else if (format === AtsuMessageSerializationFormat.MCDU) {
            if (this.Direction === AtsuMessageDirection.Uplink) {
                message += `{cyan}${this.Timestamp.dcduTimestamp()} FROM ${this.Station}{end}\n`;
            } else {
                message += `{cyan}${this.Timestamp.dcduTimestamp()} TO ${this.Station}{end}\n`;
            }

            content.split('_').forEach((entry) => {
                const newLines = wordWrap(entry, 25);
                newLines.forEach((line) => {
                    line = line.replace(/@/gi, '');
                    message += `{green}${line}{end}\n`;
                });
            });

            message += '{white}------------------------{end}\n';

            // check if the answer is not a standard answer
            if (this.Response !== undefined) {
                const addResponse = this.Response.Content.TypeId !== 'DM0'
                && this.Response.Content.TypeId !== 'DM1'
                && this.Response.Content.TypeId !== 'DM2'
                && this.Response.Content.TypeId !== 'DM3'
                && this.Response.Content.TypeId !== 'DM4'
                && this.Response.Content.TypeId !== 'DM5'
                && this.Response.Content.TypeId !== 'DM6';

                if (addResponse) {
                    message += this.Response.serialize(format);
                }
            }
        } else if (format === AtsuMessageSerializationFormat.Printer) {
            message += `${this.Timestamp.dcduTimestamp()} ${this.Direction === AtsuMessageDirection.Uplink ? 'FROM' : 'TO'} ${this.Station}}\n`;

            content.split('_').forEach((entry) => {
                const newLines = wordWrap(entry, 25);
                newLines.forEach((line) => {
                    line = line.replace(/@/gi, '');
                    message += `${line}\n`;
                });
            });

            message += '------------------------\n';

            // check if the answer is not a standard answer
            if (this.Response !== undefined) {
                const addResponse = this.Response.Content.TypeId !== 'DM0'
                && this.Response.Content.TypeId !== 'DM1'
                && this.Response.Content.TypeId !== 'DM2'
                && this.Response.Content.TypeId !== 'DM3'
                && this.Response.Content.TypeId !== 'DM4'
                && this.Response.Content.TypeId !== 'DM5'
                && this.Response.Content.TypeId !== 'DM6';

                if (addResponse) {
                    message += this.Response.serialize(format);
                }
            }
        } else {
            message = this.Message;
        }

        return message;
    }
}
