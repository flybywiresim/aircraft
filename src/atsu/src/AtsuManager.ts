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

import { AtcMessage } from './AtcMessage';
import { HoppieConnector } from './HoppieConnector';
import { PreDepartureClearance } from './PreDepartureClearance';

/**
 * Defines the ATSU manager
 */
export class AtsuManager {
    private connector = new HoppieConnector();

    private pdcMessage = null;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    public registerPdcMessage(message: PreDepartureClearance) {
        if (this.pdcMessage !== null) {
            let entriesEqual = true;

            if (this.pdcMessage.Callsign !== message.Callsign || this.pdcMessage.Origin !== message.Origin || this.pdcMessage.Destination !== message.Destination) {
                entriesEqual = false;
            }
            if (this.pdcMessage.Atis !== message.Atis || this.pdcMessage.Gate !== message.Gate) {
                entriesEqual = false;
            }
            if (this.pdcMessage.Freetext0 !== message.Freetext0 || this.pdcMessage.Freetext1 !== message.Freetext1) {
                entriesEqual = false;
            }
            if (this.pdcMessage.Freetext2 !== message.Freetext2 || this.pdcMessage.Freetext3 !== message.Freetext3) {
                entriesEqual = false;
            }
            if (this.pdcMessage.Freetext4 !== message.Freetext4 || this.pdcMessage.Freetext5 !== message.Freetext5) {
                entriesEqual = false;
            }

            if (entriesEqual === false) {
                return 'DCDU FILE FULL';
            }
            return 'MSG ALREADY DISPLAYED';
        }

        this.pdcMessage = message;
        this.pdcMessage.Timestamp = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.pdcMessage.serialize(), true, 'TELEX');

        return '';
    }

    public removePdcMessage() {
        this.pdcMessage = null;
    }

    public getConnector() {
        return this.connector;
    }
}

export { PreDepartureClearance, AtcMessage };
