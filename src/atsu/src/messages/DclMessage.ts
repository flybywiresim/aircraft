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

    public AcType = '';

    public Atis = '';

    public Gate = '';

    public Freetext: string[] = [];

    constructor() {
        super();
        this.Type = AtsuMessageType.DCL;
        this.Direction = AtsuMessageDirection.Downlink;
        this.CloseAutomatically = false;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let dclMessage = '';
        if (format === AtsuMessageSerializationFormat.Network) {
            dclMessage = 'REQUEST PREDEP CLEARANCE \n';
            dclMessage += `${this.Callsign} ${this.AcType} TO ${this.Destination} \n`;
            dclMessage += `AT ${this.Origin}${this.Gate !== '' ? ` STAND ${this.Gate}` : ''} \n`;
            dclMessage += `ATIS ${this.Atis}`;
        } else {
            if (format !== AtsuMessageSerializationFormat.DCDU) {
                dclMessage = `${this.Timestamp.dcduTimestamp()} TO ${this.Station}\n`;
            }

            dclMessage += `DEPART REQUEST\n${this.Callsign}\n`;
            dclMessage += `FROM:${this.Origin}${this.Gate.length !== 0 ? ` GATE:${this.Gate}` : ''}\n`;
            dclMessage += `TO:${this.Destination} ATIS:${this.Atis}\n`;
            dclMessage += `A/C TYPE:${this.AcType}`;

            const freetext = this.Freetext.join('\n').replace(/^\s*\n/gm, '');
            if (freetext.length !== 0) {
                dclMessage += `\n${freetext}`;
            }
        }

        return dclMessage;
    }

    // used to deserialize event data
    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        this.Callsign = jsonData.Callsign;
        this.Origin = jsonData.Origin;
        this.Destination = jsonData.Destination;
        this.AcType = jsonData.AcType;
        this.Gate = jsonData.Gate;
        this.Atis = jsonData.Atis;
        this.Freetext = jsonData.Freetext;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage };
