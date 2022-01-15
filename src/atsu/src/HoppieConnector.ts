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
                fetch(url, { headers: { 'Content-Type': 'text/html; charset=UTF-16' } }).then((response) => response.text().then((data) => {
                    // something went wrong
                    if (!data.startsWith('ok')) {
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
                            parent.registerMessage(freetext);
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
                            parent.registerMessage(cpdlc);
                            break;
                        default:
                            break;
                        }
                    });
                }));
            }
        }, 20000);
    }

    private createBaseUrl(type: string, to: string): string {
        // validate the configuration
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        const system = NXDataStore.get('CONFIG_HOPPIE_SYSTEM', 'NONE');
        const logon = NXDataStore.get('CONFIG_HOPPIE_USERID', '');

        if (system === 'NONE' || logon === '' || flightNo === '' || flightNo === '1123' || SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return '';
        }

        return `${HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl}?logon=${logon}&type=${type}&from=${flightNo}&to=${to}`;
    }

    public async isStationAvailable(station: string): Promise<string> {
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        let url = this.createBaseUrl('ping', 'ALL-CALLSIGNS');
        url += `&packet=${station}`;

        const text = await fetch(url).then((response) => {
            if (response.ok) {
                return response.text();
            }
            return 'error';
        });
        if (text.startsWith('ok') !== true) {
            return 'COM UNAVAILABLE';
        }
        if (station === flightNo || text !== `ok {${station}}`) {
            return 'NO ACTIVE ATC';
        }

        return '';
    }

    private async sendMessage(message: AtsuMessage, type: string) {
        const data = [
            `logon=${NXDataStore.get('CONFIG_HOPPIE_USERID', '')}`,
            `from=${SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string')}`,
            `to=${message.Station}`,
            `type=${type}`,
            `packet=${encodeURIComponent(message.serialize(AtsuMessageSerializationFormat.Network))}`,
        ];
        const fetchData = {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-16' },
            body: data.join('&'),
        };

        return fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl, fetchData).then((response) => {
            if (response.ok !== true) {
                return 'COM UNAVAILABLE';
            }
            return response.text().then((text) => {
                if (text !== 'ok') {
                    return 'COM UNAVAILABLE';
                }
                return '';
            });
        }).catch(() => 'COM UNAVAILABLE');
    }

    public async sendTelexMessage(message: AtsuMessage): Promise<string> {
        return this.sendMessage(message, 'telex');
    }
}
