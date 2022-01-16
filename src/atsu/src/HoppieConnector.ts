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

    private static createPostData(type: string, to: string, packet: string) {
        const formData = [
            `logon=${NXDataStore.get('CONFIG_HOPPIE_USERID', '')}`,
            `from=${SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string')}`,
            `to=${to}`,
            `type=${type}`,
            `packet=${encodeURIComponent(packet)}`,
        ];
        return {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-16' },
            body: formData.join('&'),
        };
    }

    constructor(parent: AtsuManager) {
        setInterval(() => {
            if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
                const data = HoppieConnector.createPostData('poll', SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string'), '');

                // receive the data from the server
                // expected format: ok {CALLSIGN telex, {Hello world!}} {CALLSIGN telex, {Hello world!}}
                fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl, data).then((response) => response.text().then((data) => {
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
                            cpdlc.CurrentTransmissionId = parseInt(elements[1]);
                            if (elements[2] !== '') {
                                cpdlc.PreviousTransmissionId = parseInt(elements[2]);
                            }
                            cpdlc.RequestedResponses = stringToCpdlc(elements[3]);
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

    public async isStationAvailable(station: string): Promise<string> {
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        const data = HoppieConnector.createPostData('ping', 'ALL-CALLSIGNS', station);

        const text = await fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl, data).then((response) => {
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
        const data = HoppieConnector.createPostData(type, message.Station, message.serialize(AtsuMessageSerializationFormat.Network));

        return fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl, data).then((response) => {
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

    public async sendCpdlcMessage(message: CpdlcMessage): Promise<string> {
        return this.sendMessage(message, 'cpdlc');
    }
}
