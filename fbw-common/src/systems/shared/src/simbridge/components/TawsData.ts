// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { fetchWithTimeout, getSimBridgeUrl } from '../common';
import { ElevationSamplePathDto, TawsAircraftStatusDataDto } from '../Taws/taws';

/**
 * Class responsible for retrieving data related to company routes from SimBridge
 */
export class TawsData {
  /**
   * Used to send aircraft status data (EFIS, ...) to the TAWS.
   */
  public static async postAircraftStatusData(data: TawsAircraftStatusDataDto): Promise<boolean> {
    if (data) {
      const response = await fetchWithTimeout(`${getSimBridgeUrl()}/api/v1/terrain/aircraftStatusData`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return true;
      }
    }
    return false;
  }

  public static async postVerticalDisplayPath(data: ElevationSamplePathDto): Promise<boolean> {
    if (data) {
      const response = await fetchWithTimeout(`${getSimBridgeUrl()}/api/v1/terrain/verticalDisplayPath`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return true;
      }
    }
    return false;
  }
}
