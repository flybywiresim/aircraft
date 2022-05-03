//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageNetwork, AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';
import { CpdlcMessageElement, CpdlcMessagesDownlink, CpdlcMessagesUplink } from './CpdlcMessageElements';
import { wordWrap } from '../Common';

/**
 * Defines the general freetext message format
 */
export class CpdlcMessage extends AtsuMessage {
    public ContentTemplateIndex: number = 0;

    public Content: CpdlcMessageElement | undefined = undefined;

    public Response: CpdlcMessage | undefined = undefined;

    public CurrentTransmissionId = -1;

    public PreviousTransmissionId = -1;

    public DcduRelevantMessage = true;

    public CloseAutomatically = true;

    constructor() {
        super();
        this.Type = AtsuMessageType.CPDLC;
        this.Network = AtsuMessageNetwork.Hoppie;
        this.Direction = AtsuMessageDirection.Downlink;
    }

    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        this.ContentTemplateIndex = jsonData.ContentTemplateIndex;
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
        this.DcduRelevantMessage = jsonData.DcduRelevantMessage;
        this.CloseAutomatically = jsonData.CloseAutomatically;
    }

    protected serializeContent(format: AtsuMessageSerializationFormat, template: string, element: CpdlcMessageElement): string {
        let content: string = '';

        content = template;
        element.Content.forEach((entry) => {
            const idx = content.indexOf('%s');
            if (format === AtsuMessageSerializationFormat.Network) {
                content = `${content.substring(0, idx)}${entry.Value}${content.substring(idx + 2)}`;
            } else {
                content = `${content.substring(0, idx)}@${entry.Value}@${content.substring(idx + 2)}`;
            }
        });

        return content;
    }

    protected extendSerializationWithResponse(): boolean {
        if (this.Response === undefined || this.Response.Content !== undefined) {
            return false;
        }

        // ignore the standard responses
        return this.Response.Content.TypeId !== 'DM0' && this.Response.Content.TypeId !== 'DM1' && this.Response.Content.TypeId !== 'DM2'
            && this.Response.Content.TypeId !== 'DM3' && this.Response.Content.TypeId !== 'DM4' && this.Response.Content.TypeId !== 'DM5'
            && this.Response.Content.TypeId !== 'UM0' && this.Response.Content.TypeId !== 'UM1' && this.Response.Content.TypeId !== 'UM3'
            && this.Response.Content.TypeId !== 'UM4' && this.Response.Content.TypeId !== 'UM5';
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let content: string = '';
        let message: string = '';

        if (this.Content !== undefined) {
            if (this.Direction === AtsuMessageDirection.Downlink) {
                content = this.serializeContent(format, CpdlcMessagesDownlink[this.Content.TypeId][0][this.ContentTemplateIndex], this.Content);
            } else {
                content = this.serializeContent(format, CpdlcMessagesUplink[this.Content.TypeId][0][this.ContentTemplateIndex], this.Content);
            }
        } else {
            content = this.Message;
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

            if (this.extendSerializationWithResponse()) {
                message += this.Response.serialize(format);
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

            if (this.extendSerializationWithResponse()) {
                message += this.Response.serialize(format);
            }
        } else {
            message = this.Message;
        }

        return message;
    }
}
