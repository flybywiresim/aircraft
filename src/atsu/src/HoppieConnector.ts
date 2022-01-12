//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { AtsuMessage, AtsuMessageNetwork, AtsuMessageDirection, AtsuMessageComStatus, AtsuMessageSerializationFormat } from './messages/AtsuMessage';
import { FreetextMessage, CpdlcMessage, AtsuManager } from './AtsuManager';
import { wordWrap, stringToCpdlc } from './Common';

/**
 * Defines the connector to the hoppies network
 */
export class HoppieConnector {
    private static corsProxyUrl = 'http://127.0.0.1:65512/';

    private static hoppieUrl = 'http://www.hoppie.nl/acars/system/connect.html';

    constructor(parent: AtsuManager) {
        setInterval(() => {
            if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
                const url = this.createBaseUrl('poll', 'ALL-CALLSIGNS');

                // receive the data from the server
                // expected format: ok {CALLSIGN telex, {Hello world!}} {CALLSIGN telex, {Hello world!}}
                fetch(url).then((response) => response.text().then((data) => {
                    // something went wrong
                    if (data.startsWith('error')) {
                        return;
                    }

                    // split up the received data into multiple messages
                    let messages = data.split(/({.*?})/gm);
                    messages = messages.filter((elem) => elem !== 'ok' && elem !== 'ok ' && elem !== '} ' && elem !== '}' && elem !== '');

                    // create the messages
                    messages.forEach((element) => {
                        // get the single entries of the message
                        // example: [CALLSIGN telex, {Hello world!}]
                        const entries = element.substring(1).split(/({.*?})/gm);

                        // get all relevant information
                        const metadata = entries[0].split(' ');
                        const sender = metadata[0].toUpperCase();
                        const type = metadata[1].toLowerCase();
                        const content = entries[1].replace(/{/, '').replace(/}/, '');

                        switch (type) {
                        case 'telex':
                            const freetext = new FreetextMessage();
                            freetext.Network = AtsuMessageNetwork.Hoppie;
                            freetext.Station = sender;
                            freetext.Direction = AtsuMessageDirection.Input;
                            freetext.ComStatus = AtsuMessageComStatus.Received;
                            freetext.Lines = wordWrap(content.replace(/\n/i, ' '), 25);
                            parent.receiveMessage(freetext);
                            break;
                        case 'cpdlc':
                            const cpdlc = new CpdlcMessage();
                            cpdlc.Station = sender;
                            cpdlc.Direction = AtsuMessageDirection.Input;
                            cpdlc.ComStatus = AtsuMessageComStatus.Received;

                            // split up the data
                            const elements = content.split('/');
                            cpdlc.OutputTransmissionId = parseInt(elements[1]);
                            if (elements[2] !== '') {
                                cpdlc.InputTransmissionId = parseInt(elements[2]);
                            }
                            cpdlc.Response = stringToCpdlc(elements[3]);
                            cpdlc.Lines = wordWrap(elements[4], 25);
                            parent.receiveMessage(cpdlc);
                            break;
                        default:
                            break;
                        }
                    });
                }));
            }
        }, 20000);
    }

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
