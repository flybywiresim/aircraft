//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { AtsuMessage, AtsuMessageSerializationFormat } from './messages/AtsuMessage';

/**
 * Defines the connector to the hoppies network
 */
export class HoppieConnector {
    private static corsProxyUrl = 'http://127.0.0.1:65512/';

    private static hoppieUrl = 'http://www.hoppie.nl/acars/system/connect.html';

    private callsign = '';

    private createBaseUrl(type: string, to: string) {
        // validate the configuration
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        const system = NXDataStore.get('CONFIG_HOPPIE_SYSTEM', 'NONE');
        const logon = NXDataStore.get('CONFIG_HOPPIE_USERID', '');

        if (system === 'NONE' || logon === '' || flightNo === '' || flightNo === '1123' || SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return '';
        }

        return `${HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl}?logon=${logon}&type=${type}&from=${flightNo}&to=${to}`;
    }

    public async isStationAvailable(station: string) {
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        let url = this.createBaseUrl('ping', 'ALL-CALLSIGNS');
        url += `&packet=${station}`;

        return fetch(url).then((response) => {
            if (response.ok === true) {
                return response.text().then((content) => {
                    if (content.startsWith('ok') !== true) {
                        return Promise.reject(Error('COM UNAVAILABLE'));
                    }
                    if (station === flightNo || content !== `ok {${station}}`) {
                        return Promise.reject(Error('NO ACTIVE ATC'));
                    }
                    return Promise.resolve('');
                });
            }
            return Promise.reject(Error('COM UNAVAILABLE'));
        }).catch(() => Promise.reject(Error('COM UNAVAILABLE')));
    }

    public async sendTelexMessage(message: AtsuMessage) {
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        const data = [
            `logon=${NXDataStore.get('CONFIG_HOPPIE_USERID', '')}`,
            `from=${flightNo}`,
            `to=${message.Station}`,
            'type=TELEX',
            `packet=${encodeURIComponent(message.serialize(AtsuMessageSerializationFormat.Printer))}`,
        ];
        const postData = data.join('&');

        return fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: postData,
            }).then((response) => {
            if (response.ok === true) {
                return response.text().then((content) => {
                    if (content === 'ok') {
                        return Promise.resolve('');
                    }
                    return Promise.reject(Error('COM UNAVAILABLE'));
                });
            }
            return Promise.reject(Error('COM UNAVAILABLE'));
        }).catch(() => Promise.reject(Error('COM UNAVAILABLE')));
    }
}
