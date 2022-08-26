//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Atis, Metar, Taf, Telex, AircraftStatus } from '@flybywiresim/api-client';
import { NXDataStore } from '@shared/persistence';
import { AtsuStatusCodes } from '../../AtsuStatusCodes';
import { AtsuMessage, AtsuMessageComStatus, AtsuMessageNetwork, AtsuMessageDirection } from '../../messages/AtsuMessage';
import { FreetextMessage } from '../../messages/FreetextMessage';
import { WeatherMessage } from '../../messages/WeatherMessage';
import { AtisMessage, AtisType } from '../../messages/AtisMessage';

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
    private static flightNumber: string = '';

    private static connected: boolean = false;

    private static updateCounter: number = 0;

    private static createAircraftStatus(): AircraftStatus | undefined {
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
            flight: NXApiConnector.flightNumber,
            aircraftType: acType,
        };
    }

    public static async connect(flightNo: string): Promise<AtsuStatusCodes> {
        if (NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED') !== 'ENABLED') {
            return AtsuStatusCodes.TelexDisabled;
        }

        // deactivate old connection
        await NXApiConnector.disconnect();

        NXApiConnector.flightNumber = flightNo;
        const status = NXApiConnector.createAircraftStatus();
        if (status !== undefined) {
            return Telex.connect(status).then((res) => {
                if (res.accessToken !== '') {
                    NXApiConnector.connected = true;
                    NXApiConnector.updateCounter = 0;
                    return AtsuStatusCodes.Ok;
                }
                return AtsuStatusCodes.NoTelexConnection;
            }).catch(() => AtsuStatusCodes.CallsignInUse);
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
                NXApiConnector.flightNumber = '';
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
                let metar = data.metar;
                if (!metar || metar === undefined || metar === '') {
                    metar = 'NO METAR AVAILABLE';
                }

                message.Reports.push({ airport: icao, report: metar });
                return AtsuStatusCodes.Ok;
            }).catch(() => {
                message.Reports.push({ airport: icao, report: 'NO METAR AVAILABLE' });
                return AtsuStatusCodes.Ok;
            });
    }

    public static async receiveTaf(icao: string, message: WeatherMessage): Promise<AtsuStatusCodes> {
        const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');

        return Taf.get(icao, WeatherMap[storedTafSrc])
            .then((data) => {
                let taf = data.taf;
                if (!taf || taf === undefined || taf === '') {
                    taf = 'NO TAF AVAILABLE';
                }

                message.Reports.push({ airport: icao, report: taf });
                return AtsuStatusCodes.Ok;
            }).catch(() => {
                message.Reports.push({ airport: icao, report: 'NO TAF AVAILABLE' });
                return AtsuStatusCodes.Ok;
            });
    }

    public static async receiveAtis(icao: string, type: AtisType, message: AtisMessage): Promise<AtsuStatusCodes> {
        const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');

        await Atis.get(icao, WeatherMap[storedAtisSrc])
            .then((data) => {
                let atis = undefined;

                if (type === AtisType.Arrival) {
                    if ('arr' in data) {
                        atis = data.arr;
                    } else {
                        atis = data.combined;
                    }
                } else if (type === AtisType.Departure) {
                    if ('dep' in data) {
                        atis = data.dep;
                    } else {
                        atis = data.combined;
                    }
                } else if (type === AtisType.Enroute) {
                    if ('combined' in data) {
                        atis = data.combined;
                    } else if ('arr' in data) {
                        atis = data.arr;
                    }
                }

                if (!atis || atis === undefined) {
                    atis = 'D-ATIS NOT AVAILABLE';
                }

                message.Reports.push({ airport: icao, report: atis });
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
            try {
                const data = await Telex.fetchMessages();
                for (const msg of data) {
                    const message = new FreetextMessage();
                    message.Network = AtsuMessageNetwork.FBW;
                    message.Direction = AtsuMessageDirection.Uplink;
                    message.Station = msg.from.flight;
                    message.Message = msg.message.replace(/;/i, ' ');

                    retval.push(message);
                }
            } catch (_e) {
                return [AtsuStatusCodes.ComFailed, retval];
            }
        }

        return [AtsuStatusCodes.Ok, retval];
    }

    public static pollInterval(): number {
        return 15000;
    }
}

NXDataStore.set('PLAN_ORIGIN', '');
NXDataStore.set('PLAN_DESTINATION', '');
