//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtcMessage } from './AtcMessage';
import { AtcTimestamp } from './AtcTimestamp';
import { HoppieConnector } from './HoppieConnector';
import { PreDepartureClearance } from './PreDepartureClearance';

/**
 * Defines the ATSU manager
 */
export class AtsuManager {
    private connector = new HoppieConnector();

    private station = '';

    private atcMessageQueue = [];

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    public registerPdcMessage(message: PreDepartureClearance) {
        const serialized = message.serialize();
        const duplicate = this.atcMessageQueue.find((element) => element.serialize() === serialized);
        if (duplicate !== undefined) {
            return 'MSG ALREADY DISPLAYED';
        }

        if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 1) {
            return 'DCDU FILE FULL';
        }

        message.Timestamp = new AtcTimestamp();
        message.Station = this.station;
        this.atcMessageQueue.unshift(message);
        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);

        return '';
    }

    public removeMessage(uid: string) {
        this.atcMessageQueue.forEach((item, index) => {
            if (item.UniqueMessageID === uid) {
                this.atcMessageQueue.slice(index, 1);
                this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
            }
        });
    }

    public getConnector() {
        return this.connector;
    }
}

export { PreDepartureClearance, AtcMessage, AtcTimestamp };
