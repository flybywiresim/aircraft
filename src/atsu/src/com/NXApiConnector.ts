//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXApi } from '@shared/nxapi';
import { NXDataStore } from '@shared/persistence';
import { AtsuMessage, AtsuMessageComStatus, AtsuMessageNetwork, AtsuMessageDirection } from '../messages/AtsuMessage';
import { AtisMessage, FreetextMessage, WeatherMessage } from '../AtsuManager';

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
    public static async sendTelexMessage(message: FreetextMessage): Promise<string> {
        const content = message.Message.replace('\n', ';');
        return NXApi.sendTelexMessage(message.Station, content).then(() => {
            message.ComStatus = AtsuMessageComStatus.Sent;
            return '';
        }).catch(() => {
            message.ComStatus = AtsuMessageComStatus.Failed;
            return 'COM UNAVAILABLE';
        });
    }

    public static async receiveMetar(icao: string, message: WeatherMessage): Promise<boolean> {
        const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');

        return NXApi.getMetar(icao, WeatherMap[storedMetarSrc])
            .then((data) => {
                const newLines = data.metar;
                message.Reports.push({ airport: icao, report: newLines });
                return true;
            }).catch(() => false);
    }

    public static async receiveTaf(icao: string, message: WeatherMessage): Promise<boolean> {
        const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');

        return NXApi.getTaf(icao, WeatherMap[storedTafSrc])
            .then((data) => {
                const newLines = data.taf;
                message.Reports.push({ airport: icao, report: newLines });
                return true;
            }).catch(() => false);
    }

    public static async receiveAtis(icao: string, message: AtisMessage): Promise<boolean> {
        const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');

        await NXApi.getAtis(icao, WeatherMap[storedAtisSrc])
            .then((data) => {
                const newLines = data.combined;
                message.Reports.push({ airport: icao, report: newLines });
            }).catch(() => {
                message.Reports.push({ airport: icao, report: 'D-ATIS NOT AVAILABLE' });
            });

        return true;
    }

    public static async poll(): Promise<AtsuMessage[]> {
        const retval: AtsuMessage[] = [];

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
                for (const msg of data) {
                    const message = new FreetextMessage();
                    message.Network = AtsuMessageNetwork.FBW;
                    message.Direction = AtsuMessageDirection.Input;
                    message.Station = msg.from.flight;
                    message.Message = msg.message.replace(/;/i, ' ');

                    retval.push(message);
                }
            })
            .catch((err) => {
                if (err.status === 404 || err === NXApi.disabledError || err === NXApi.disconnectedError) {
                    return retval;
                }
                console.log('TELEX MSG FETCH FAILED');
                return retval;
            });

        return retval;
    }

    public static pollInterval(): number {
        return NXApi.updateRate;
    }
}
