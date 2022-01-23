//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXApi } from '@shared/nxapi';
import { NXDataStore } from '@shared/persistence';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
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
    public static async sendTelexMessage(message: FreetextMessage): Promise<AtsuStatusCodes> {
        const content = message.Message.replace('\n', ';');
        return NXApi.sendTelexMessage(message.Station, content).then(() => {
            message.ComStatus = AtsuMessageComStatus.Sent;
            return AtsuStatusCodes.Ok;
        }).catch(() => {
            message.ComStatus = AtsuMessageComStatus.Failed;
            return AtsuStatusCodes.ComFailed;
        });
    }

    public static async receiveMetar(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
        const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');

        return NXApi.getMetar(icao, WeatherMap[storedMetarSrc])
            .then((data) => {
                const newLines = data.metar;
                message.Reports.push({ airport: icao, report: newLines });
                return AtsuStatusCodes.Ok;
            }).catch(() => AtsuStatusCodes.ComFailed);
    }

    public static async receiveTaf(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
        const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');

        return NXApi.getTaf(icao, WeatherMap[storedTafSrc])
            .then((data) => {
                const newLines = data.taf;
                message.Reports.push({ airport: icao, report: newLines });
                return AtsuStatusCodes.Ok;
            }).catch(() => AtsuStatusCodes.ComFailed);
    }

    public static async receiveAtis(icao: string, message: AtisMessage): Promise<AtsuStatusCodes> {
        const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');

        await NXApi.getAtis(icao, WeatherMap[storedAtisSrc])
            .then((data) => {
                const newLines = data.combined;
                message.Reports.push({ airport: icao, report: newLines });
            }).catch(() => {
                message.Reports.push({ airport: icao, report: 'D-ATIS NOT AVAILABLE' });
            });

        return AtsuStatusCodes.Ok;
    }

    public static async poll(): Promise<[AtsuStatusCodes, AtsuMessage[]]> {
        const retval: AtsuMessage[] = [];

        // Update connection
        NXApi.updateTelex()
            .catch(() => {});

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
                return [AtsuStatusCodes.ComFailed, retval];
            });

        return [AtsuStatusCodes.Ok, retval];
    }

    public static pollInterval(): number {
        return NXApi.updateRate;
    }
}
