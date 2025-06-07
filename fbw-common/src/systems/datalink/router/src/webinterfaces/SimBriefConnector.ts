//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { AtsuStatusCodes, WindUplinkMessage } from '../../../common/src';

const SIMBRIEF_API_URL = 'https://www.simbrief.com/api/xml.fetcher.php?json=1';

export class SimBriefConnector {
  public static async receiveSimBriefWinds(): Promise<[AtsuStatusCodes, WindUplinkMessage | null]> {
    const navigraphUsername = NXDataStore.get('NAVIGRAPH_USERNAME', '');
    const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

    if (!navigraphUsername && !overrideSimBriefUserID) {
      return [AtsuStatusCodes.ComFailed, null];
    }

    let url = `${SIMBRIEF_API_URL}`;
    if (overrideSimBriefUserID) {
      url += `&userid=${overrideSimBriefUserID}`;
    } else {
      url += `&username=${navigraphUsername}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }
      const body = await response.json();
      // SimBrief can return an error with an ok HTTP status code.
      // In that case, the fetch.status starts with "Error:"
      if (typeof body.fetch?.status === 'string' && body.fetch.status.startsWith('Error:')) {
        throw new Error(`SimBrief: ${body.fetch.status}`);
      }
      return [AtsuStatusCodes.Ok, simbriefDataParser(body)];
    } catch (e) {
      console.error('SimBrief OFP download failed');
      throw e;
    }
  }
}

const simbriefDataParser = (simbriefJson: any): WindUplinkMessage => {
  // simbriefJson.navlog.fix[].wind_data.level;

  const alternate = Array.isArray(simbriefJson.alternate) ? simbriefJson.alternate[0] : simbriefJson.alternate;

  return {
    alternate: {
      averageWindDirection: parseInt(alternate.avg_wind_dir, 10),
      averageWindSpeed: parseInt(alternate.avg_wind_spd, 10),
    },
  };
};
