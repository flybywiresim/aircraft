//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageNetwork, AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';

/**
 * Defines the general PDC message format
 */
export class PdcMessage extends AtsuMessage {
    public Callsign = '';

    public Origin = '';

    public Destination = '';

    public Atis = '';

    public Gate = '';

    public Freetext: string[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.PDC;
        this.Direction = AtsuMessageDirection.Output;
        this.Network = AtsuMessageNetwork.Hoppie;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        // create the generic PDC message
        let pdcMessage = 'REQUEST PREDEP CLEARANCE\n';
        pdcMessage += `${this.Callsign} A20N TO ${this.Destination}\n`;
        pdcMessage += `AT ${this.Origin}`;
        if (this.Gate.length !== 0) {
            pdcMessage += ` STAND ${this.Gate}`;
        }
        pdcMessage += `\nATIS ${this.Atis}`;

        const freetext = this.Freetext.join('\n').replace(/^\s*\n/gm, '');
        if (freetext.length !== 0) {
            pdcMessage += `\n${freetext}`;
        }

        if (format === AtsuMessageSerializationFormat.Network) {
            pdcMessage = pdcMessage.replace(/\n/, ' ');
        }

        return pdcMessage;
    }

    // used to deserialize event data
    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        this.Callsign = jsonData.Callsign;
        this.Origin = jsonData.Origin;
        this.Destination = jsonData.Destination;
        this.Gate = jsonData.Gate;
        this.Atis = jsonData.Atis;
        this.Freetext = jsonData.Freetext;
    }
}
