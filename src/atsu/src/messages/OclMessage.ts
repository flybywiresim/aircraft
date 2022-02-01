//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { CpdlcMessage } from './CpdlcMessage';
import { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage } from './AtsuMessage';

/**
 * Defines the general OCL message format
 */
export class OclMessage extends CpdlcMessage {
    public Callsign = '';

    public OceanicAtc = '';

    public Destination = '';

    public EntryPoint = '';

    public EntryTime = '';

    public RequestedMach = '';

    public RequestedFlightlevel = '';

    public Freetext0 = '';

    public Freetext1 = '';

    public Freetext2 = '';

    public Freetext3 = '';

    public Freetext4 = '';

    public Freetext5 = '';

    constructor() {
        super();
        this.Type = AtsuMessageType.OCL;
        this.Direction = AtsuMessageDirection.Output;
    }

    public serialize(format: AtsuMessageSerializationFormat) {
        let oclMessage = `OCEANIC REQUEST\n${this.Callsign}\n`;
        oclMessage += `ENTRY POINT:${this.EntryPoint}\nAT:${this.EntryTime}\n`;
        oclMessage += `REQ:${this.RequestedMach} ${this.RequestedFlightlevel}`;

        // add the additional text, but remove empty lines
        // it is guaranteed by the UI of the DEPART REQUEST pages that empty lines exist between two filled lines
        let freetext = `${this.Freetext0}\n${this.Freetext1}\n`;
        freetext += `${this.Freetext2}\n${this.Freetext3}\n`;
        freetext += `${this.Freetext4}\n${this.Freetext5}`;
        freetext = freetext.replace(/^\s*\n/gm, '');
        if (freetext.length !== 0) {
            oclMessage += `\n${freetext}`;
        }

        // convert to the Hoppie-format
        if (format === AtsuMessageSerializationFormat.Network) {
            oclMessage = `/data2/${this.CurrentTransmissionId}//NE/${oclMessage}`;
        }

        return oclMessage;
    }

    // used to deserialize event data
    public deserialize(jsonData: any): void {
        super.deserialize(jsonData);

        this.Callsign = jsonData.Callsign;
        this.OceanicAtc = jsonData.OceanicAtc;
        this.Destination = jsonData.Destination;
        this.EntryPoint = jsonData.EntryPoint;
        this.EntryTime = jsonData.EntryTime;
        this.RequestedMach = jsonData.RequestedMach;
        this.RequestedFlightlevel = jsonData.RequestedFlightlevel;

        this.Freetext0 = jsonData.Freetext0;
        this.Freetext1 = jsonData.Freetext1;
        this.Freetext2 = jsonData.Freetext2;
        this.Freetext3 = jsonData.Freetext3;
        this.Freetext4 = jsonData.Freetext4;
        this.Freetext5 = jsonData.Freetext5;
    }
}

export { AtsuMessageType, AtsuMessageDirection, AtsuMessageSerializationFormat, AtsuMessage };
