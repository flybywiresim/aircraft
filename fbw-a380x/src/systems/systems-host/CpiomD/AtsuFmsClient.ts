// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { AtsuStatusCodes, WindUplinkMessage } from '@datalink/common';
import { EventBus } from '@microsoft/msfs-sdk';
import { logTroubleshootingError } from '@shared/logging';
import { AtsuToFmsEvents, FmsToAtsuEvents, WindUplinkRequest } from '@providers/FmsAtsuBusPublisher';
import { AocFmsMessages, FmsAocMessages } from '../../../../../fbw-common/src/systems/datalink/aoc/src/databus/FmsBus';

export class AtsuFmsClient {
  private readonly sub = this.bus.getSubscriber<FmsToAtsuEvents & AocFmsMessages>();

  private readonly pub = this.bus.getPublisher<AtsuToFmsEvents & FmsAocMessages>();

  constructor(private readonly bus: EventBus) {}

  private requestId: number = 0;

  /** Map containing the wind request ids associated with the flightplan index which they belong to */
  private readonly uplinkWindRequestFlightPlanMap: Map<number, number> = new Map();

  private windsResponseCallbacks: ((
    response: [AtsuStatusCodes, WindUplinkMessage | null],
    requestId: number,
  ) => boolean)[] = [];

  init() {
    this.sub.on('wind_uplink_request').handle((request) => {
      this.performrWindUplinkRequest(request);
    });
    this.sub.on('aocWindsResponse').handle((response) => {
      this.windsResponseCallbacks.every((callback, index) => {
        if (callback(response.data, response.requestId)) {
          this.windsResponseCallbacks.splice(index, 1);
          const flightPlanIndex = this.uplinkWindRequestFlightPlanMap.get(response.requestId);
          if (flightPlanIndex === undefined) {
            console.warn(
              `Received wind uplink response for request id ${response.requestId} but no matching flightplan.`,
            );
            logTroubleshootingError(
              this.bus,
              `Received wind uplink response for request id ${response.requestId} but no matching flightplan was found.`,
            );
          } else {
            this.pub.pub(
              'wind_uplink_response',
              {
                status: response.data[0],
                message: response.data[1],
                flightPlan: flightPlanIndex,
              },
              true,
            );
          }
          this.uplinkWindRequestFlightPlanMap.delete(response.requestId);
          return false;
        }
        return true;
      });
    });
  }

  private performrWindUplinkRequest(request: WindUplinkRequest): Promise<[AtsuStatusCodes, WindUplinkMessage | null]> {
    return new Promise<[AtsuStatusCodes, WindUplinkMessage | null]>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.pub.pub('aocRequestWinds', { ...request.message, requestId }, true, false);
      this.uplinkWindRequestFlightPlanMap.set(requestId, request.flightPlan);

      this.windsResponseCallbacks.push((response: [AtsuStatusCodes, WindUplinkMessage | null], id: number) => {
        if (id === requestId) resolve(response);
        return id === requestId;
      });
    });
  }
}
