//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { Hoppie } from '@flybywiresim/api-client';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { AtsuMessage, AtsuMessageNetwork, AtsuMessageDirection, AtsuMessageComStatus, AtsuMessageSerializationFormat } from '../messages/AtsuMessage';
import { CpdlcMessage } from '../messages/CpdlcMessage';
import { FreetextMessage } from '../messages/FreetextMessage';
import { stringToCpdlc } from '../Common';

/**
 * Defines the connector to the hoppies network
 */
export class HoppieConnector {
    private static flightNumber: string = '';

    public static async connect(flightNo: string): Promise<AtsuStatusCodes> {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            HoppieConnector.flightNumber = flightNo;
            return AtsuStatusCodes.NoHoppieConnection;
        }

        return HoppieConnector.isCallsignInUse(flightNo).then((code) => {
            if (code === AtsuStatusCodes.Ok) {
                HoppieConnector.flightNumber = flightNo;
                return HoppieConnector.poll().then(() => code);
            }
            return code;
        });
    }

    public static disconnect(): AtsuStatusCodes {
        HoppieConnector.flightNumber = '';
        return AtsuStatusCodes.Ok;
    }

    public static async isCallsignInUse(station: string): Promise<AtsuStatusCodes> {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return AtsuStatusCodes.NoHoppieConnection;
        }

        const body = {
            logon: NXDataStore.get('CONFIG_HOPPIE_USERID', ''),
            from: station,
            to: 'ALL-CALLSIGNS',
            type: 'ping',
            packet: station,
        };
        const text = await Hoppie.sendRequest(body).then((resp) => resp.response);

        if (text === 'error {callsign already in use}') {
            return AtsuStatusCodes.CallsignInUse;
        }
        if (text.includes('error')) {
            return AtsuStatusCodes.ProxyError;
        }
        if (text.startsWith('ok') !== true) {
            return AtsuStatusCodes.ComFailed;
        }

        return AtsuStatusCodes.Ok;
    }

    public static async isStationAvailable(station: string): Promise<AtsuStatusCodes> {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return AtsuStatusCodes.NoHoppieConnection;
        }

        if (station === HoppieConnector.flightNumber) {
            return AtsuStatusCodes.OwnCallsign;
        }

        const body = {
            logon: NXDataStore.get('CONFIG_HOPPIE_USERID', ''),
            from: HoppieConnector.flightNumber,
            to: 'ALL-CALLSIGNS',
            type: 'ping',
            packet: station,
        };
        const text = await Hoppie.sendRequest(body).then((resp) => resp.response);

        if (text.includes('error')) {
            return AtsuStatusCodes.ProxyError;
        }
        if (text.startsWith('ok') !== true) {
            return AtsuStatusCodes.ComFailed;
        }
        if (text !== `ok {${station}}`) {
            return AtsuStatusCodes.NoAtc;
        }

        return AtsuStatusCodes.Ok;
    }

    private static async sendMessage(message: AtsuMessage, type: string): Promise<AtsuStatusCodes> {
        const body = {
            logon: NXDataStore.get('CONFIG_HOPPIE_USERID', ''),
            from: HoppieConnector.flightNumber,
            to: message.Station,
            type,
            packet: message.serialize(AtsuMessageSerializationFormat.Network),
        };
        const text = await Hoppie.sendRequest(body).then((resp) => resp.response).catch(() => 'proxy');

        if (text === 'proxy') {
            return AtsuStatusCodes.ProxyError;
        }

        if (text !== 'ok') {
            return AtsuStatusCodes.ComFailed;
        }

        return AtsuStatusCodes.Ok;
    }

    public static async sendTelexMessage(message: FreetextMessage, force: boolean): Promise<AtsuStatusCodes> {
        if (force || SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return HoppieConnector.sendMessage(message, 'telex');
        }
        return AtsuStatusCodes.NoHoppieConnection;
    }

    public static async sendCpdlcMessage(message: CpdlcMessage, force: boolean): Promise<AtsuStatusCodes> {
        if (force || SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return HoppieConnector.sendMessage(message, 'cpdlc');
        }
        return AtsuStatusCodes.NoHoppieConnection;
    }

    public static async poll(): Promise<[AtsuStatusCodes, AtsuMessage[]]> {
        const retval: AtsuMessage[] = [];

        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return [AtsuStatusCodes.NoHoppieConnection, retval];
        }

        const body = {
            logon: NXDataStore.get('CONFIG_HOPPIE_USERID', ''),
            from: HoppieConnector.flightNumber,
            to: HoppieConnector.flightNumber,
            type: 'poll',
        };
        const text = await Hoppie.sendRequest(body).then((resp) => resp.response).catch(() => 'proxy');

        // proxy error during request
        if (text === 'proxy') {
            return [AtsuStatusCodes.ProxyError, retval];
        }

        // something went wrong
        if (!text.startsWith('ok')) {
            return [AtsuStatusCodes.ComFailed, retval];
        }

        // split up the received data into multiple messages
        let messages = text.split(/({.*?})/gm);
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

        return [AtsuStatusCodes.Ok, retval];
    }

    public static pollInterval(): number {
        return 5000;
    }
}
