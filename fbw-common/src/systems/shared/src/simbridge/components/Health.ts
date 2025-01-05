// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { fetchWithTimeout, getSimBridgeUrl } from '../common';

/**
 * Class responsible for retrieving data related to company routes from SimBridge
 */
export class Health {
  /**
   * Used to check the state of a given service. If none is given, then main status is returned.
   * @param serviceName The name of the service or omit for the overall status
   * @returns true if service is available, false otherwise
   */
  public static async getHealth(serviceName?: 'api' | 'mcdu'): Promise<boolean> {
    const response = await fetchWithTimeout(`${getSimBridgeUrl()}/health`, undefined, 5000);
    if (!response.ok) {
      throw new Error(`SimBridge Error: ${response.status}`);
    }
    const healthJson = await response.json();
    switch (serviceName) {
      case undefined:
        if (healthJson.status === 'ok') {
          return true;
        }
        break;
      case 'api':
        if (healthJson.info.api.status === 'up') {
          return true;
        }
        break;
      case 'mcdu':
        if (healthJson.info.mcdu.status === 'up') {
          return true;
        }
        break;
      default:
        throw new Error(`Unknown service name: '${serviceName}'`);
    }
    return false;
  }
}
