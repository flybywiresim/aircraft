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

    private messageQueue = [];

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    public registerPdcMessage(message: PreDepartureClearance) {
        if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'bool', false) === true) {
            return 'DCDU FILE FULL';
        }

        const serialized = message.serialize();
        const duplicate = this.messageQueue.find((element) => element.serialize() === serialized);
        if (duplicate !== undefined) {
            return 'MSG ALREADY DISPLAYED';
        }

        message.Timestamp = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
        this.messageQueue.unshift(message);
        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);

        return '';
    }

    public removeMessage(uid: string) {
        this.messageQueue.forEach((item, index) => {
            if (item.UniqueMessageID === uid) {
                this.messageQueue.slice(index, 1);
                this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
            }
        });
    }

    public getConnector() {
        return this.connector;
    }
}

export { PreDepartureClearance, AtcMessage };
