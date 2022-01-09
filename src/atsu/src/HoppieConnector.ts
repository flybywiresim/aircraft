//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';

/**
 * Defines the connector to the hoppies network
 */
export class HoppieConnector {
    private static corsProxyUrl = 'http://127.0.0.1:65512/';

    private static hoppieUrl = 'http://www.hoppie.nl/acars/system/connect.html?';

    private callsign = '';

    private static createBaseUrl(type: string, from: string, to: string) {
        // validate the configuration
        const system = NXDataStore.get('CONFIG_HOPPIE_SYSTEM', 'NONE');
        const logon = NXDataStore.get('CONFIG_HOPPIE_USERID', '');
        if (system === 'NONE' || logon === '') {
            return '';
        }

        return `${HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl}logon=${logon}&type=${type}&from=${from}&to=${to}`;
    }

    public async isStationAvailable(station: string, mcdu: any, resetFunction: (mcdu: any) => void, errorFunction: (mcdu: any) => void) {
        let url = HoppieConnector.createBaseUrl('ping', 'TEST', 'ALL-CALLSIGNS');
        url += `&packet=${station}`;

        fetch(url)
            .then((response) => response.text().then(((content) => {
                if (content.startsWith('ok') !== true) {
                    errorFunction(mcdu);
                } else if (content !== `ok {${station}}`) {
                    resetFunction(mcdu);
                }
            })))
            .catch(() => errorFunction(mcdu));
    }

    public setCallsign(callsign: string) {
        this.callsign = callsign;
    }
}
