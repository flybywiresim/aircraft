//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { CpdlcMessage } from './CpdlcMessage';
import { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';

/**
 * Defines the general OCL message format
 */
export class OclMessage extends CpdlcMessage {
    public Callsign = '';

    public Destination = '';

    public EntryPoint = '';

    public EntryTime = '';

    public RequestedMach = '';

    public RequestedFlightlevel = '';

    public Freetext: string[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.OCL;
        this.Direction = AtsuMessageDirection.Downlink;
        this.CloseAutomatically = false;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let oclMessage = `OCEANIC REQUEST\n${this.Callsign} \n`;
        oclMessage += `ENTRY POINT:${this.EntryPoint}\nAT:${this.EntryTime} \n`;
        oclMessage += `REQ:${this.RequestedMach} ${this.RequestedFlightlevel}`;

        const freetext = this.Freetext.join('\n').replace(/^\s*\n/gm, '');
        if (freetext.length !== 0) {
            oclMessage += `\n${freetext}`;
        }

        // convert to the Hoppie-format
        if (format === AtsuMessageSerializationFormat.Network) {
            oclMessage = `/data2/${this.CurrentTransmissionId}//N/${oclMessage}`;
        } else if (format !== AtsuMessageSerializationFormat.Mailbox) {
            oclMessage = `${this.Timestamp.mailboxTimestamp()} TO ${this.Station}\n${oclMessage}`;
        }

        return oclMessage;
    }

    // used to deserialize event data
    public deserialize(jsonData: Record<string, unknown>): void {
        super.deserialize(jsonData);

        this.Callsign = jsonData.Callsign as string;
        this.Destination = jsonData.Destination as string;
        this.EntryPoint = jsonData.EntryPoint as string;
        this.EntryTime = jsonData.EntryTime as string;
        this.RequestedMach = jsonData.RequestedMach as string;
        this.RequestedFlightlevel = jsonData.RequestedFlightlevel as string;
        this.Freetext = jsonData.Freetext as string[];
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage };
