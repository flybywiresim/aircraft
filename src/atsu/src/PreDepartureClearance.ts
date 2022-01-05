/*
 * MIT License
 *
 * Copyright (c) 2022 FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { AtcMessageType, AtcMessageStatus, AtcMessage } from './AtcMessage';

/**
 * Defines the general PDC message format
 */
export class PreDepartureClearance extends AtcMessage {
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
        this.Type = AtcMessageType.Telex;
        this.Status = AtcMessageStatus.Open;
    }

    public serialize() {
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
}

export { AtcMessageType, AtcMessageStatus, AtcMessage };
