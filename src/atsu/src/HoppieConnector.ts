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

    private createBaseUrl(type: string, to: string) {
        // validate the configuration
        const system = NXDataStore.get('CONFIG_HOPPIE_SYSTEM', 'NONE');
        const logon = NXDataStore.get('CONFIG_HOPPIE_USERID', '');
        if (system === 'NONE' || logon === '') {
            return '';
        }

        return `${HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl}logon=${logon}&type=${type}&from=${this.callsign}&to=${to}`;
    }

    public async isStationAvailable(station: string, mcdu: any, scratchCallback: any, resetFunction: (mcdu: any, scratchCallback: any) => void,
        errorFunction: (mcdu: any, scratchCallback: any) => void) {
        let url = this.createBaseUrl('ping', 'ALL-CALLSIGNS');
        url += `&packet=${station}`;

        fetch(url)
            .then((response) => response.text().then(((content) => {
                if (content.startsWith('ok') !== true) {
                    errorFunction(mcdu, scratchCallback);
                } else if (station === this.callsign || content !== `ok {${station}}`) {
                    resetFunction(mcdu, scratchCallback);
                }
            })))
            .catch(() => errorFunction(mcdu, scratchCallback));
    }

    public setCallsign(callsign: string) {
        this.callsign = callsign;
    }
}
