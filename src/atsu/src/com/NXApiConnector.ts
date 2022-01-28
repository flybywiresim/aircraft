//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Atis, Metar, Taf, Telex, AircraftStatus } from '@flybywiresim/api-client';
import { NXDataStore } from '@shared/persistence';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { AtsuMessage, AtsuMessageComStatus, AtsuMessageNetwork, AtsuMessageDirection } from '../messages/AtsuMessage';
import { FreetextMessage } from '../messages/FreetextMessage';
import { WeatherMessage } from '../messages/WeatherMessage';
import { AtisMessage } from '../messages/AtisMessage';

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
    private static connected: boolean = false;

    private static updateCounter: number = 0;

    private static createAircraftStatus(): AircraftStatus | undefined {
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        if (flightNo === '' || flightNo === '1123') {
            return undefined;
        }

        const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        const long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        const alt = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
        const heading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degree');
        const acType = SimVar.GetSimVarValue('TITLE', 'string');
        const origin = NXDataStore.get('PLAN_ORIGIN', '');
        const destination = NXDataStore.get('PLAN_DESTINATION', '');
        const freetext = NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED') === 'ENABLED';

        return {
            location: {
                long,
                lat,
            },
            trueAltitude: alt,
            heading,
            origin,
            destination,
            freetextEnabled: freetext,
            flight: flightNo,
            aircraftType: acType,
        };
    }

    public static async connect(): Promise<AtsuStatusCodes> {
        if (NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED') !== 'ENABLED') {
            return AtsuStatusCodes.TelexDisabled;
        }

        // deactivate old connection
        await NXApiConnector.disconnect();

        const status = NXApiConnector.createAircraftStatus();
        if (status !== undefined) {
            return Telex.connect(status).then((res) => {
                if (res.accessToken !== '') {
                    NXApiConnector.connected = true;
                    NXApiConnector.updateCounter = 0;
                    return AtsuStatusCodes.Ok;
                }
                return AtsuStatusCodes.NoTelexConnection;
            }).catch(() => AtsuStatusCodes.ProxyError);
        }

        return AtsuStatusCodes.Ok;
    }

    public static async disconnect(): Promise<AtsuStatusCodes> {
        if (NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED') !== 'ENABLED') {
            return AtsuStatusCodes.TelexDisabled;
        }

        if (NXApiConnector.connected) {
            return Telex.disconnect().then(() => {
                NXApiConnector.connected = false;
                return AtsuStatusCodes.Ok;
            }).catch(() => AtsuStatusCodes.ProxyError);
        }

        return AtsuStatusCodes.NoTelexConnection;
    }

    public static isConnected(): boolean {
        return NXApiConnector.connected;
    }

    public static async sendTelexMessage(message: FreetextMessage): Promise<AtsuStatusCodes> {
        if (NXApiConnector.connected) {
            const content = message.Message.replace('\n', ';');
            return Telex.sendMessage(message.Station, content).then(() => {
                message.ComStatus = AtsuMessageComStatus.Sent;
                return AtsuStatusCodes.Ok;
            }).catch(() => {
                message.ComStatus = AtsuMessageComStatus.Failed;
                return AtsuStatusCodes.ComFailed;
            });
        }
        return AtsuStatusCodes.NoTelexConnection;
    }

    public static async receiveMetar(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
        const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');

        return Metar.get(icao, WeatherMap[storedMetarSrc])
            .then((data) => {
                const newLines = data.metar;
                message.Reports.push({ airport: icao, report: newLines });
                return AtsuStatusCodes.Ok;
            }).catch(() => AtsuStatusCodes.ComFailed);
    }

    public static async receiveTaf(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
        const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');

        return Taf.get(icao, WeatherMap[storedTafSrc])
            .then((data) => {
                const newLines = data.taf;
                message.Reports.push({ airport: icao, report: newLines });
                return AtsuStatusCodes.Ok;
            }).catch(() => AtsuStatusCodes.ComFailed);
    }

    public static async receiveAtis(icao: string, message: AtisMessage): Promise<AtsuStatusCodes> {
        const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');

        await Atis.get(icao, WeatherMap[storedAtisSrc])
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

        if (NXApiConnector.connected) {
            if (NXApiConnector.updateCounter++ % 4 === 0) {
                const status = NXApiConnector.createAircraftStatus();
                if (status !== undefined) {
                    const code = await Telex.update(status).then(() => AtsuStatusCodes.Ok).catch(() => AtsuStatusCodes.ProxyError);
                    if (code !== AtsuStatusCodes.Ok) {
                        return [AtsuStatusCodes.ComFailed, retval];
                    }
                }
            }

            // Fetch new messages
            Telex.fetchMessages()
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
                .catch(() => [AtsuStatusCodes.ComFailed, retval]);
        }

        return [AtsuStatusCodes.Ok, retval];
    }

    public static pollInterval(): number {
        return 15000;
    }
}

NXDataStore.set('PLAN_ORIGIN', '');
NXDataStore.set('PLAN_DESTINATION', '');
