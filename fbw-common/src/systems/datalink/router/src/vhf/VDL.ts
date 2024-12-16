//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';
import { AtsuMessage, AtsuMessageSerializationFormat } from '../../../common/src';
import { DatalinkProviders, OwnAircraft, MaxSearchRange } from './Common';
import { Vhf } from './VHF';
import { AtsuFlightPhase } from '../../../common/src/types/AtsuFlightPhase';

interface NPCPlane {
  name: string;
  uId: number;
  lat: number;
  lon: number;
  alt: number;
  heading: number;
}

const UpperSectorAltitude = 24000;
// according to 1V3D in 120 ms
const MessageChunksPerSecond = 32;
const DataslotsPerSecond = 24;
const BitsOfChunksPerSecond = MessageChunksPerSecond * 496;
// standard size per data block
const BytesPerSlot = 62;

/*
 * Vdl simulates VDL3 to calculate the datarate for messages
 * - general idea is that Datalink is range based on not sector based
 * - 1V3D is used and it is assumed that one block is used for uplink messages
 * - traffic split up into upper and lower
 * - estimate relevant traffic based on own level and traffic of the lower sectors
 * - own datarate is simulated by VDL3 specification and sharing between relevant traffic
 */
export class Vdl {
  public static TransmissionTimePerPacket = 40;

  private recListener: ViewListener.ViewListener = RegisterViewListener('JS_LISTENER_MAPS', () => {
    this.recListener.trigger('JS_BIND_BINGMAP', 'nxMap', true);
  });

  private inboundDelay = { updateTime: 0, messages: 0, delay: 0 };

  private outboundDelay = { updateTime: 0, messages: 0, delay: 0 };

  public vhf3: Vhf = new Vhf();

  private presentPosition: OwnAircraft = new OwnAircraft();

  private upperAirspaceTraffic: number = 0;

  private lowerAirspaceTraffic: number = 0;

  private perPacketDelay: number[] = Array(DatalinkProviders.ProviderCount).fill(500);

  private updatePresentPosition() {
    // FIXME read ARINC data from appropriate system
    this.presentPosition.Latitude = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
    this.presentPosition.Longitude = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
    this.presentPosition.Altitude = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
    this.presentPosition.AltitudeAboveGround = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND', 'feet');
    this.presentPosition.PressureAltitude = SimVar.GetSimVarValue('INDICATED ALTITUDE:4', 'feet');
  }

  private async updateRemoteAircrafts(): Promise<void> {
    this.lowerAirspaceTraffic = 0;
    this.upperAirspaceTraffic = 0;

    return Coherent.call('GET_AIR_TRAFFIC')
      .then((obj: NPCPlane[]) => {
        obj.forEach((traffic) => {
          // skip invalid aircraft
          if (!traffic.lat || !traffic.lon || !traffic.alt || !traffic.uId) {
            return;
          }

          const distance = MathUtils.computeDistance3D(
            traffic.lat,
            traffic.lon,
            traffic.alt,
            this.presentPosition.Latitude,
            this.presentPosition.Longitude,
            this.presentPosition.PressureAltitude,
          );

          if (distance <= MaxSearchRange) {
            if (traffic.alt < UpperSectorAltitude) {
              this.lowerAirspaceTraffic += 1;
            } else {
              this.upperAirspaceTraffic += 1;
            }
          }
        });
      })
      .catch(console.error);
  }

  public simulateTransmissionTimes(flightPhase: AtsuFlightPhase) {
    this.updatePresentPosition();
    this.vhf3.simulateDatarates(flightPhase).then(() =>
      this.updateRemoteAircrafts().then(() => {
        // check if now VHF connection is available
        let connectionAvailable = false;
        for (let i = 0; i < DatalinkProviders.ProviderCount; ++i) {
          if (this.vhf3.datarates[0] !== 0.0) {
            connectionAvailable = true;
            break;
          }
        }
        if (!connectionAvailable) {
          this.perPacketDelay = Array(DatalinkProviders.ProviderCount).fill(10000);
          return;
        }

        let relevantStations = 0;

        // calculate the relevant aircrafts based on the own level
        if (this.presentPosition.PressureAltitude < UpperSectorAltitude) {
          // calculate the ratio between relevant stations and upper sector stations
          // this ratio is used to add a fraction of the upper level aircrafts to the own relevant stations
          let ratio = 1.0;
          if (this.vhf3.stationsUpperAirspace !== 0) {
            ratio = this.vhf3.relevantAirports.length / this.vhf3.stationsUpperAirspace;
          }

          relevantStations = this.lowerAirspaceTraffic + ratio * this.upperAirspaceTraffic;
        } else {
          // calculate the ratio between relevant stations and lower stations
          // it is assumed that one station is responsible for the lower sectors
          let ratio = 1.0;
          if (this.vhf3.stationsUpperAirspace !== 0) {
            ratio = 1 / this.vhf3.relevantAirports.length;
          }

          relevantStations = this.upperAirspaceTraffic + ratio * this.lowerAirspaceTraffic;
        }
        // add the A32NX and the ground stations into the list of relevant aircrafts
        relevantStations += 1 + this.vhf3.relevantAirports.length;

        this.perPacketDelay = Array(DatalinkProviders.ProviderCount).fill(0);
        for (let i = 0; i < DatalinkProviders.ProviderCount; ++i) {
          // calculate the number of available slots based on data rate and floor due to broken slots
          let messageCount = Math.floor(
            DataslotsPerSecond * Math.min(1.0, this.vhf3.datarates[i] / BitsOfChunksPerSecond),
          );

          // get all available message slots
          messageCount *= this.vhf3.relevantAirports.length;

          // calculate the number of slots for the remote traffic based on non-rounded messages
          const messageCountPerStation = messageCount / relevantStations;

          // calculate the data rates and the time between two own packets
          this.perPacketDelay[i] = Math.round(1000 / messageCountPerStation + 0.5);
        }
      }),
    );
  }

  // calculates the required transmission time in milliseconds
  private calculateTransmissionTime(message: AtsuMessage): number {
    // calculate the number of occupied datablocks
    const messageLength = message.serialize(AtsuMessageSerializationFormat.Network).length;
    const occupiedDatablocks = Math.round(messageLength / BytesPerSlot + 0.5);
    const blocksTransmissionTime = occupiedDatablocks * Vdl.TransmissionTimePerPacket;

    // calculate the transmission times based on the data rates and choose the fastest
    return blocksTransmissionTime + (occupiedDatablocks - 1) * Math.min(...this.perPacketDelay);
  }

  /**
   * reinitializes all internal structures
   */
  public reinitialize(): void {
    this.inboundDelay = { updateTime: 0, messages: 0, delay: 0 };
    this.outboundDelay = { updateTime: 0, messages: 0, delay: 0 };
  }

  /**
   * enqueues an inbound message and returns the required transmission time
   * @param message The enqueued message
   * @returns The overall transmission time
   */
  public enqueueInboundMessage(message: AtsuMessage): number {
    const currentTime = Date.now();

    let transmissionTime = this.calculateTransmissionTime(message);
    if (this.inboundDelay.messages !== 0) {
      transmissionTime += Math.min(...this.perPacketDelay);
    } else {
      this.inboundDelay.updateTime = currentTime;
    }

    this.inboundDelay.messages += 1;
    this.inboundDelay.delay = transmissionTime;

    return transmissionTime - (currentTime - this.inboundDelay.updateTime);
  }

  /**
   * Decreases the inbound system delay and resets the system if no message is enqueued
   * @param delay The passed delay
   */
  public dequeueInboundMessage(delay: number): void {
    this.inboundDelay.delay = Math.max(this.inboundDelay.delay - delay, 0);
    this.inboundDelay.updateTime = Date.now();
    this.inboundDelay.messages -= 1;

    // reset the timer
    if (this.inboundDelay.messages <= 0) {
      this.inboundDelay.messages = 0;
      this.inboundDelay.delay = 0;
    }
  }

  /**
   * Enqueues a message into the outbound queue. It is simulated that all ground stations communicate first, followed by the A32NX
   * @param message The enqueued outbound message
   * @returns The overall transmission time
   */
  public enqueueOutboundMessage(message: AtsuMessage): number {
    const currentTime = Date.now();

    let transmissionTime = this.calculateTransmissionTime(message);
    if (this.outboundDelay.messages !== 0) {
      transmissionTime += Math.min(...this.perPacketDelay);
    } else {
      // simulate that first packets are the ground stations, thereafter the A32NX packet for an initial offset
      transmissionTime += Vdl.TransmissionTimePerPacket * this.vhf3.relevantAirports.length;
      this.outboundDelay.updateTime = currentTime;
    }

    this.outboundDelay.messages += 1;
    this.outboundDelay.delay = transmissionTime;

    return transmissionTime - (currentTime - this.outboundDelay.updateTime);
  }

  /**
   * Enqueues a message of one packet length into the queue. It is simulated that all ground stations communicate first, followed by the A32NX
   * @returns The overall transmission time
   */
  public enqueueOutboundPacket(): number {
    const currentTime = Date.now();

    let transmissionTime = Vdl.TransmissionTimePerPacket;
    if (this.outboundDelay.messages !== 0) {
      transmissionTime += Math.min(...this.perPacketDelay);
    } else {
      // simulate that first packets are the ground stations, thereafter the A32NX packet for an initial offset
      transmissionTime += Vdl.TransmissionTimePerPacket * this.vhf3.relevantAirports.length;
      this.outboundDelay.updateTime = currentTime;
    }

    this.outboundDelay.messages += 1;
    this.outboundDelay.delay = transmissionTime;

    return transmissionTime - (currentTime - this.outboundDelay.updateTime);
  }

  /**
   * Dequeues an outbound message from the queue and decreases the overall delay
   * @param delay The passed delay
   */
  public dequeueOutboundMessage(delay: number): void {
    this.outboundDelay.delay = Math.max(this.outboundDelay.delay - delay, 0);
    this.outboundDelay.updateTime = Date.now();
    this.outboundDelay.messages -= 1;

    // reset the timer
    if (this.outboundDelay.messages <= 0) {
      this.outboundDelay.messages = 0;
      this.outboundDelay.delay = 0;
    }
  }
}
