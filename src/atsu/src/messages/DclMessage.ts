//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { CpdlcMessage } from './CpdlcMessage';
import { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';

/**
 * Defines the general DCL message format
 */
export class DclMessage extends CpdlcMessage {
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
        this.Type = AtsuMessageType.DCL;
        this.Direction = AtsuMessageDirection.Output;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let dclMessage = `DEPART REQUEST\n${this.Callsign}\n`;
        dclMessage += `FROM:${this.Origin}${this.Gate.length !== 0 ? ` GATE:${this.Gate}` : ''}\n`;
        dclMessage += `TO:${this.Destination} ATIS:${this.Atis}\n`;
        dclMessage += 'A/C TYPE:A20N';

        // add the additional text, but remove empty lines
        // it is guaranteed by the UI of the DEPART REQUEST pages that empty lines exist between two filled lines
        let freetext = `${this.Freetext0}\n${this.Freetext1}\n`;
        freetext += `${this.Freetext2}\n${this.Freetext3}\n`;
        freetext += `${this.Freetext4}\n${this.Freetext5}`;
        freetext = freetext.replace(/^\s*\n/gm, '');
        if (freetext.length !== 0) {
            dclMessage += `\n${freetext}`;
        }

        // convert to the Hoppie-format
        if (format === AtsuMessageSerializationFormat.Network) {
            dclMessage = `/data2/${this.CurrentTransmissionId}//NE/${dclMessage}`;
        }

        return dclMessage;
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

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage };
