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

    public Freetext0 = '';

    public Freetext1 = '';

    public Freetext2 = '';

    public Freetext3 = '';

    public Freetext4 = '';

    public Freetext5 = '';

    constructor() {
        super();
        this.Type = AtsuMessageType.PDC;
        this.Direction = AtsuMessageDirection.Output;
        this.Network = AtsuMessageNetwork.Hoppie;
    }

    public serialize(_format: AtsuMessageSerializationFormat) {
        // create the generic PDC message
        let pdcMessage = 'REQUEST PREDEP CLEARANCE\n';
        pdcMessage += `${this.Callsign} A20N TO ${this.Destination}\n`;
        pdcMessage += `AT ${this.Origin}`;
        if (this.Gate.length !== 0) {
            pdcMessage += ` STAND ${this.Gate}`;
        }
        pdcMessage += `\nATIS ${this.Atis}`;

        // add the additional text, but remove empty lines
        // it is guaranteed by the UI of the DEPART REQUEST pages that empty lines exist between two filled lines
        let freetext = `${this.Freetext0}\n${this.Freetext1}\n`;
        freetext += `${this.Freetext2}\n${this.Freetext3}\n`;
        freetext += `${this.Freetext4}\n${this.Freetext5}`;
        freetext = freetext.replace(/^\s*\n/gm, '');
        if (freetext.length !== 0) {
            pdcMessage += `\n${freetext}`;
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

        this.Freetext0 = jsonData.Freetext0;
        this.Freetext1 = jsonData.Freetext1;
        this.Freetext2 = jsonData.Freetext2;
        this.Freetext3 = jsonData.Freetext3;
        this.Freetext4 = jsonData.Freetext4;
        this.Freetext5 = jsonData.Freetext5;
    }
}
