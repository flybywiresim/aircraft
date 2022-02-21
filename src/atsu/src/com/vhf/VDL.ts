//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@shared/MathUtils';
import { OwnAircraft, MaxSearchRange } from './Common';
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

    public ownDatarateArinc: number = 0.0;

    public ownDatarateSita: number = 0.0;

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

    public calculateOwnDatarate() {
        this.updatePresentPosition();
        this.vhf3.calculateDatarates().then(() => this.updateRemoteAircrafts().then(() => {
            // no VHF station available -> use default value
            if (this.vhf3.arincDatarate === 0.0 && this.vhf3.sitaDatarate === 0.0) {
                this.ownDatarateArinc = 500.0;
                this.ownDatarateSita = 500.0;
                return;
            }

            console.log(`Upper airspace traffic: ${this.upperAirspaceTraffic}`);
            console.log(`Lower airspace traffic: ${this.lowerAirspaceTraffic}`);

            let relevantAircrafts = this.lowerAirspaceTraffic;

            // calculate the relevant aircrafts based on the own level
            if (this.presentPosition.PressureAltitude < UpperSectorAltitude) {
                // calculate the ratio between relevant stations and upper sector stations
                // this ratio is used to add a fraction of the upper level aircrafts to the own relevant stations
                let ratio = 1.0;
                if (this.vhf3.stationsUpperAirspace !== 0) {
                    ratio = this.vhf3.relevantAirports.length / this.vhf3.stationsUpperAirspace;
                }
                relevantAircrafts += ratio * this.upperAirspaceTraffic;
            } else {
                relevantAircrafts += this.upperAirspaceTraffic;
            }
            // add the A32NX into the list of relevant aircrafts
            relevantAircrafts += 1;

            // calculate the number of available slots based on data rate and floor due to broken slots
            let arincMessageCount = Math.floor(DataslotsPerSecond * Math.min(1.0, this.vhf3.arincDatarate / BitsOfChunksPerSecond));
            let sitaMessageCount = Math.floor(DataslotsPerSecond * Math.min(1.0, this.vhf3.arincDatarate / BitsOfChunksPerSecond));
            console.log(`Available data slots per station for ARINC: ${arincMessageCount}`);
            console.log(`Available data slots per station for SITA: ${sitaMessageCount}`);

            // get all available message slots
            arincMessageCount *= this.vhf3.relevantAirports.length;
            sitaMessageCount *= this.vhf3.relevantAirports.length;
            console.log(`Available data slots for ARINC: ${arincMessageCount}`);
            console.log(`Available data slots for SITA: ${sitaMessageCount}`);

            // calculate the number of slots for the remote traffic based on non-rounded messages
            const messageCountPerAircraftArinc = arincMessageCount / relevantAircrafts;
            const messageCountPerAircraftSite = sitaMessageCount / relevantAircrafts;
            console.log(`Data slots per aircraft and second for ARINC: ${messageCountPerAircraftArinc}`);
            console.log(`Data slots per aircraft and second for SITA: ${messageCountPerAircraftSite}`);

            // calculate the data rates
            this.ownDatarateArinc = messageCountPerAircraftArinc * BitsPerSlot / 8;
            this.ownDatarateSita = messageCountPerAircraftSite * BitsPerSlot / 8;
            console.log(`Own datarate ARINC: ${this.ownDatarateArinc} bytes per second`);
            console.log(`Own datarate SITA: ${this.ownDatarateSita} bytes per second`);
        }));
    }
}
