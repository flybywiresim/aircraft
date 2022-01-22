//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { AtsuMessage, AtsuMessageNetwork, AtsuMessageDirection, AtsuMessageComStatus, AtsuMessageSerializationFormat } from '../messages/AtsuMessage';
import { FreetextMessage, CpdlcMessage } from '../AtsuManager';
import { stringToCpdlc } from '../Common';

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

    public static async isStationAvailable(station: string): Promise<AtsuStatusCodes> {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return AtsuStatusCodes.NoHoppieConnection;
        }

        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        const data = HoppieConnector.createPostData('ping', 'ALL-CALLSIGNS', station);

        const text = await fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl, data).then((response) => {
            if (response.ok) {
                return response.text();
            }
            return 'error';
        }).catch(() => 'error');

        if (text === 'error') {
            return AtsuStatusCodes.ProxyError;
        }
        if (text.startsWith('ok') !== true) {
            return AtsuStatusCodes.ComFailed;
        }
        if (station === flightNo || text !== `ok {${station}}`) {
            return AtsuStatusCodes.NoAtc;
        }

        return AtsuStatusCodes.Ok;
    }

    private static async sendMessage(message: AtsuMessage, type: string): Promise<AtsuStatusCodes> {
        const data = HoppieConnector.createPostData(type, message.Station, message.serialize(AtsuMessageSerializationFormat.Network));

        return fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl, data).then((response) => {
            if (response.ok !== true) {
                return AtsuStatusCodes.ComFailed;
            }
            return response.text().then((text) => {
                if (text !== 'ok') {
                    return AtsuStatusCodes.ComFailed;
                }
                return AtsuStatusCodes.Ok;
            });
        }).catch(() => AtsuStatusCodes.ComFailed);
    }

    public static async sendTelexMessage(message: FreetextMessage): Promise<AtsuStatusCodes> {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return HoppieConnector.sendMessage(message, 'telex');
        }
        return AtsuStatusCodes.NoHoppieConnection;
    }

    public static async sendCpdlcMessage(message: CpdlcMessage): Promise<AtsuStatusCodes> {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return HoppieConnector.sendMessage(message, 'cpdlc');
        }
        return AtsuStatusCodes.NoHoppieConnection;
    }

    public static async poll(): Promise<AtsuMessage[]> {
        const retval: AtsuMessage[] = [];

        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            const postData = HoppieConnector.createPostData('poll', SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string'), '');

            // receive the data from the server
            // expected format: ok {CALLSIGN telex, {Hello world!}} {CALLSIGN telex, {Hello world!}}
            const data = await fetch(HoppieConnector.corsProxyUrl + HoppieConnector.hoppieUrl, postData)
                .then((response) => response.text())
                .catch(() => 'error');

            // something went wrong
            if (!data.startsWith('ok')) {
                return retval;
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
                    freetext.Message = content.replace(/\n/i, ' ');
                    retval.push(freetext);
                    break;
                case 'cpdlc':
                    const cpdlc = new CpdlcMessage();
                    cpdlc.Station = sender;
                    cpdlc.Direction = AtsuMessageDirection.Input;
                    cpdlc.ComStatus = AtsuMessageComStatus.Received;

                    // split up the data
                    const elements = content.split('/');
                    cpdlc.CurrentTransmissionId = parseInt(elements[2]);
                    if (elements[3] !== '') {
                        cpdlc.PreviousTransmissionId = parseInt(elements[3]);
                    }
                    cpdlc.RequestedResponses = stringToCpdlc(elements[4]);
                    cpdlc.Message = elements[5];

                    retval.push(cpdlc);
                    break;
                default:
                    break;
                }
            });
        }

        return retval;
    }

    public static pollInterval(): number {
        return 1000;
    }
}
