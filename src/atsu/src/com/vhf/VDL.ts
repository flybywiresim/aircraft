//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import { MathUtils } from '@shared/MathUtils';
import { AtsuMessage, AtsuMessageSerializationFormat } from '../../messages/AtsuMessage';
import { DatalinkProviders, OwnAircraft, MaxSearchRange } from './Common';
import { Vhf } from './VHF';

interface NPCPlane {
    name: string,
    uId: number,
    lat: number,
    lon: number,
    alt: number,
    heading: number
}

const UpperSectorAltitude = 24000;
// according to 1V3D in 120 ms
const MessageChunksPerSecond = 32;
const DataslotsPerSecond = 24;
const BitsOfChunksPerSecond = MessageChunksPerSecond * 496;
const BitsPerSlot = 496;

/*
 * Vdl simulates VDL3 to calculate the datarate for messages
 * - general idea is that Datalink is range based on not sector based
 * - 1V3D is used and it is assumed that one block is used for uplink messages
 * - traffic split up into upper and lower
 * - estimate relevant traffic based on own level and traffic of the lower sectors
 * - own datarate is simulated by VDL3 specification and sharing between relevant traffic
 */
export class Vdl {
    private recListener: ViewListener.ViewListener = RegisterViewListener('JS_LISTENER_MAPS', () => {
        this.recListener.trigger('JS_BIND_BINGMAP', 'nxMap', true);
    });

    private vhf3: Vhf = new Vhf();

    private presentPosition: OwnAircraft = new OwnAircraft();

    private upperAirspaceTraffic: number = 0;

    private lowerAirspaceTraffic: number = 0;

    private a32nxDatarates: number[] = [];

    private updatePresentPosition() {
        this.presentPosition.Latitude = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        this.presentPosition.Longitude = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        this.presentPosition.Altitude = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
        this.presentPosition.AltitudeAboveGround = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND', 'feet');
        this.presentPosition.PressureAltitude = SimVar.GetSimVarValue('INDICATED ALTITUDE:3', 'feet');
    }

    private async updateRemoteAircrafts(): Promise<void> {
        this.lowerAirspaceTraffic = 0;
        this.upperAirspaceTraffic = 0;

        return Coherent.call('GET_AIR_TRAFFIC').then((obj: NPCPlane[]) => {
            obj.forEach((traffic) => {
                // skip invalid aircraft
                if (!traffic.lat || !traffic.lon || !traffic.alt || !traffic.uId) {
                    return;
                }

                const distance = MathUtils.computeDistance3D(traffic.lat, traffic.lon, traffic.alt,
                    this.presentPosition.Latitude, this.presentPosition.Longitude, this.presentPosition.PressureAltitude);

                if (distance <= MaxSearchRange) {
                    if (traffic.alt < UpperSectorAltitude) {
                        this.lowerAirspaceTraffic += 1;
                    } else {
                        this.upperAirspaceTraffic += 1;
                    }
                }
            });
        }).catch(console.error);
    }

    public calculateA32NXDatarate(flightPhase: FmgcFlightPhase) {
        this.updatePresentPosition();
        this.vhf3.calculateDatarates(flightPhase).then(() => this.updateRemoteAircrafts().then(() => {
            // check if now VHF connection is available
            let connectionAvailable = false;
            for (let i = 0; i < DatalinkProviders.ProviderCount; ++i) {
                if (this.vhf3.datarates[0] !== 0.0) {
                    connectionAvailable = true;
                    break;
                }
            }
            if (!connectionAvailable) {
                this.a32nxDatarates = Array(DatalinkProviders.ProviderCount).fill(5.0);
                return;
            }

            let relevantAircrafts = 0;

            // calculate the relevant aircrafts based on the own level
            if (this.presentPosition.PressureAltitude < UpperSectorAltitude) {
                // calculate the ratio between relevant stations and upper sector stations
                // this ratio is used to add a fraction of the upper level aircrafts to the own relevant stations
                let ratio = 1.0;
                if (this.vhf3.stationsUpperAirspace !== 0) {
                    ratio = this.vhf3.relevantAirports.length / this.vhf3.stationsUpperAirspace;
                }

                relevantAircrafts = this.lowerAirspaceTraffic + ratio * this.upperAirspaceTraffic;
            } else {
                // calculate the ratio between relevant stations and lower stations
                // it is assumed that one station is responsible for the lower sectors
                let ratio = 1.0;
                if (this.vhf3.stationsUpperAirspace !== 0) {
                    ratio = 1 / this.vhf3.relevantAirports.length;
                }

                relevantAircrafts = this.upperAirspaceTraffic + ratio * this.lowerAirspaceTraffic;
            }
            // add the A32NX and the ground stations into the list of relevant aircrafts
            relevantAircrafts += 1 + this.vhf3.relevantAirports.length;

            this.a32nxDatarates = Array(DatalinkProviders.ProviderCount).fill(0.0);
            for (let i = 0; i < DatalinkProviders.ProviderCount; ++i) {
                // calculate the number of available slots based on data rate and floor due to broken slots
                let messageCount = Math.floor(DataslotsPerSecond * Math.min(1.0, this.vhf3.datarates[i] / BitsOfChunksPerSecond));
                console.log(`Available data slots per station for ${i}: ${messageCount}`);

                // get all available message slots
                messageCount *= this.vhf3.relevantAirports.length;
                console.log(`Available data slots for ${i}: ${messageCount}`);

                // calculate the number of slots for the remote traffic based on non-rounded messages
                const messageCountPerAircraft = messageCount / relevantAircrafts;
                console.log(`Data slots per aircraft and second for ${i}: ${messageCountPerAircraft}`);

                // calculate the data rates
                this.a32nxDatarates[i] = messageCountPerAircraft * BitsPerSlot / 8;
                console.log(`Own datarate ${i}: ${this.a32nxDatarates[i]} bytes per second`);
            }
        }));
    }

    // calculates the required transmission time in milliseconds
    public calculateTransmissionTime(message: AtsuMessage): number {
        // calculate the number of occupied datablocks
        const messageLength = message.serialize(AtsuMessageSerializationFormat.Network).length;
        const occupiedDatablock = Math.round(messageLength / (BitsPerSlot / 8) + 0.5);

        // calculate the sent bytes based on the datablocks
        const datablockBytes = occupiedDatablock * BitsPerSlot / 8;

        // calculate the transmission times based on the data rates and choose the fastest
        let transmissionTime = 10000000.0;
        this.a32nxDatarates.forEach((datarate) => {
            if (datarate > 0.0) {
                transmissionTime = Math.min(transmissionTime, datablockBytes / datarate);
            }
        });

        // use the fastest transmission time
        return Math.round(transmissionTime * 1000 + 0.5);
    }
}
