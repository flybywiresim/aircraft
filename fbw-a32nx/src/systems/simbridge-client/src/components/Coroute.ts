// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { fetchWithTimeout, getSimBridgeUrl } from '../common';
import { CoRouteDto } from '../Coroute/coroute';
import { ClientState } from './ClientState';

type coRouteCall = {
  success: boolean;
  data: CoRouteDto | CoRouteDto[];
};

/**
 * Class responsible for retrieving data related to company routes from SimBridge
 */
export class CompanyRoute {
  /**
   * Used to retrieve a given company route
   * @param route The routename in question
   * @returns Returns the CoRoute DTO
   */
  public static async getCoRoute(route: String): Promise<coRouteCall> {
    if (!ClientState.getInstance().isConnected()) {
      throw new Error('SimBridge is not connected.');
    }
    if (route) {
      const response = await fetchWithTimeout(`${getSimBridgeUrl()}/api/v1/coroute?rteNum=${route}`);
      if (response.ok) {
        return {
          success: true,
          data: (await response.json()) as CoRouteDto,
        };
      }

      return {
        success: false,
        data: null,
      };
    }
    throw new Error('No Company route provided');
  }

  /**
   * Used to retrieve a list of company routes for a given origin and dest
   * @param origin the origin
   * @param dest the destination
   * @returns Returns a list of CoRoute DTOs
   */
  public static async getRouteList(origin: String, dest: String): Promise<coRouteCall> {
    if (!ClientState.getInstance().isConnected()) {
      throw new Error('SimBridge is not connected.');
    }
    if (origin && dest) {
      const response = await fetchWithTimeout(
        `${getSimBridgeUrl()}/api/v1/coroute/list?origin=${origin}&destination=${dest}`,
      );
      if (response.ok) {
        const filteredData = ((await response.json()) as CoRouteDto[]).filter((value) => value.name.length < 10);
        return {
          success: true,
          data: filteredData,
        };
      }

      return {
        success: false,
        data: null,
      };
    }
    throw new Error('Origin or Destination missing');
  }
}
