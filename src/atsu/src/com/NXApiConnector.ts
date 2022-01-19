//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXApi } from '@shared/nxapi';
import { NXDataStore } from '@shared/persistence';
import { AtsuMessageComStatus, AtsuMessageNetwork, AtsuMessageDirection } from '../messages/AtsuMessage';
import { AtisMessage, FreetextMessage, WeatherMessage, AtsuManager } from '../AtsuManager';
import { wordWrap } from '../Common';

const WeatherMap = {
    FAA: 'faa',
    IVAO: 'ivao',
    MSFS: 'ms',
    NOAA: 'aviationweather',
    PILOTEDGE: 'pilotedge',
    VATSIM: 'vatsim',
};

/**
 * Defines the NXApi connector for the AOC system
 */
export class NXApiConnector {
    constructor(parent: AtsuManager) {
        setInterval(() => {
            // Update connection
            NXApi.updateTelex()
                .catch((err) => {
                    if (err !== NXApi.disconnectedError && err !== NXApi.disabledError) {
                        console.log('TELEX PING FAILED');
                    }
                });

            // Fetch new messages
            NXApi.getTelexMessages()
                .then((data) => {
                    let msgCounter = 0;

                    for (const msg of data) {
                        const message = new FreetextMessage();
                        message.Network = AtsuMessageNetwork.FBW;
                        message.Direction = AtsuMessageDirection.Input;
                        message.Station = msg.from.flight;
                        message.Lines = wordWrap(msg.message.replace(/;/i, ' '), 25);

                        parent.registerMessage(message);
                        msgCounter += 1;
                    }

                    const msgCount = SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number');
                    SimVar.SetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number', msgCount + msgCounter).then();
                })
                .catch((err) => {
                    if (err.status === 404 || err === NXApi.disabledError || err === NXApi.disconnectedError) {
                        return;
                    }
                    console.log('TELEX MSG FETCH FAILED');
                });
        }, NXApi.updateRate);
    }

    public async sendTelexMessage(message: FreetextMessage): Promise<string> {
        const content = message.Lines.join(';');
        return NXApi.sendTelexMessage(message.Station, content).then(() => {
            message.ComStatus = AtsuMessageComStatus.Sent;
            return '';
        }).catch(() => {
            message.ComStatus = AtsuMessageComStatus.Failed;
            return 'COM UNAVAILABLE';
        });
    }

    public async receiveMetar(icao: string, message: WeatherMessage): Promise<boolean> {
        const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');

        return NXApi.getMetar(icao, WeatherMap[storedMetarSrc])
            .then((data) => {
                const newLines = wordWrap(data.metar, 25);
                message.Reports.push({ airport: icao, report: newLines });
                return true;
            }).catch(() => false);
    }

    public async receiveTaf(icao: string, message: WeatherMessage): Promise<boolean> {
        const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');

        return NXApi.getTaf(icao, WeatherMap[storedTafSrc])
            .then((data) => {
                const newLines = wordWrap(data.taf, 25);
                message.Reports.push({ airport: icao, report: newLines });
                return true;
            }).catch(() => false);
    }

    public async receiveAtis(icao: string, message: AtisMessage): Promise<boolean> {
        const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');

        await NXApi.getAtis(icao, WeatherMap[storedAtisSrc])
            .then((data) => {
                const newLines = wordWrap(data.combined, 25);
                message.Reports.push({ airport: icao, report: newLines });
            }).catch(() => {
                message.Reports.push({ airport: icao, report: ['D-ATIS NOT AVAILABLE'] });
            });

        return true;
    }
}
