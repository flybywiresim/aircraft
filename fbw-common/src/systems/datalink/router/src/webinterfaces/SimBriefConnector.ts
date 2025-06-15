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
      return [AtsuStatusCodes.Ok, SimBriefConnector.parseSimBriefWinds(body)];
    } catch (e) {
      console.error('SimBrief OFP download failed');
      throw e;
    }
  }

  private static parseSimBriefWinds(simbriefJson: any): WindUplinkMessage {
    {
      const alternate = Array.isArray(simbriefJson.alternate) ? simbriefJson.alternate[0] : simbriefJson.alternate;
      const navlog = simbriefJson.navlog.fix ?? [];

      const result: WindUplinkMessage = {
        climbWinds: [],
        cruiseWinds: [],
        descentWinds: [],
        alternateWind: null,
      };

      // CLB
      {
        const clbWpts = navlog.filter((val) => val.stage === 'CLB');
        let lastAltitude = 0;

        // iterate through each clbWpt grabbing the wind data
        clbWpts.forEach((clbWpt, wptIdx) => {
          if (wptIdx == 0) {
            let altIdx = 0;
            // we need to backfill from altitude 0 to below clbWpt.altitude_feet in windData
            while (lastAltitude < clbWpt.altitude_feet) {
              const altitude = parseInt(clbWpt.wind_data.level[altIdx].altitude);
              const magnitude = parseInt(clbWpt.wind_data.level[altIdx].wind_spd);
              const trueDegrees = parseInt(clbWpt.wind_data.level[altIdx].wind_dir);

              result.climbWinds.push({
                trueDegrees,
                magnitude,
                altitude,
              });

              lastAltitude = altitude;
              altIdx++;
            }
          }
          // Now we add the closest wind data to the altitude of the clbWpt
          clbWpt.wind_data.level.forEach((wind, levelIdx) => {
            const altitude = parseInt(wind.altitude);

            let deltaPrevLevel = 0;
            let deltaThisLevel = 0;
            // Look backwards for the closest level
            if (levelIdx > 0 && levelIdx < clbWpt.wind_data.level.length - 1) {
              deltaPrevLevel = Math.abs(clbWpt.altitude_feet - parseInt(clbWpt.wind_data.level[levelIdx - 1].altitude));
              deltaThisLevel = Math.abs(clbWpt.altitude_feet - altitude);
            }

            // Check that altitude isn't backtracking
            if (altitude > lastAltitude && lastAltitude <= clbWpt.altitude_feet) {
              const idx = deltaPrevLevel > deltaThisLevel ? levelIdx : levelIdx - 1;

              const idxAltitude = parseInt(clbWpt.wind_data.level[idx].altitude);
              const trueDegrees = parseInt(clbWpt.wind_data.level[idx].wind_dir);
              const magnitude = parseInt(clbWpt.wind_data.level[idx].wind_spd);

              // Check again that we didn't backtrack
              if (idxAltitude > lastAltitude) {
                result.climbWinds.push({
                  trueDegrees,
                  magnitude,
                  altitude: idxAltitude,
                });
                lastAltitude = idxAltitude;
              }
            }
          });
        });
      }

      // CRZ
      {
        for (const fix of navlog) {
          if (fix.stage !== 'CRZ' || fix.ident === 'TOC' || fix.ident === 'TOD' || fix.type === 'apt') {
            continue;
          }

          for (const val of fix.wind_data.level) {
            result.cruiseWinds.push({
              fixIdent: fix.ident,
              trueDegrees: parseInt(val.wind_dir),
              magnitude: parseInt(val.wind_spd),
              altitude: Math.round(parseInt(val.altitude) / 100) * 100,
            });
          }
        }
      }

      // DES
      {
        let lastAltitude = 45000;
        navlog.forEach((desWpt, wptIdx) => {
          // TOD is marked as cruise stage, but we want it's topmost wind data
          if (desWpt.ident !== 'TOD' && desWpt.stage !== 'DSC') {
            return;
          }

          if (wptIdx == 0) {
            let altIdx = desWpt.wind_data.level.length - 1;
            // we need to backfill from crz altitude to above next clbWpt.altitude_feet in windData
            while (lastAltitude > desWpt.altitude_feet) {
              const altitude = parseInt(desWpt.wind_data.level[altIdx].altitude);
              const magnitude = parseInt(desWpt.wind_data.level[altIdx].wind_spd);
              const trueDegrees = parseInt(desWpt.wind_data.level[altIdx].wind_dir);

              result.descentWinds.push({
                trueDegrees,
                magnitude,
                altitude,
              });
              lastAltitude = altitude;
              altIdx--;
            }
          }
          // Now we add the closest wind data to the altitude of the desWpt
          desWpt.wind_data.level.reverse().forEach((wind, levelIdx) => {
            const altitude = parseInt(wind.altitude);

            let deltaNextLevel = 0;
            let deltaThisLevel = 0;
            // Look forwards for the closest level
            if (levelIdx < desWpt.wind_data.level.length - 2) {
              deltaNextLevel = Math.abs(desWpt.altitude_feet - parseInt(desWpt.wind_data.level[levelIdx + 1].altitude));
              deltaThisLevel = Math.abs(desWpt.altitude_feet - altitude);
            }

            // Check that altitude isn't backtracking
            if (altitude >= lastAltitude && lastAltitude > desWpt.altitude_feet) {
              const idx = deltaNextLevel > deltaThisLevel ? levelIdx : levelIdx + 1;

              const idxAltitude = parseInt(desWpt.wind_data.level[idx].altitude);
              const trueDegrees = parseInt(desWpt.wind_data.level[idx].wind_dir);
              const magnitude = parseInt(desWpt.wind_data.level[idx].wind_spd);

              // Check again that we didn't backtrack
              if (idxAltitude < lastAltitude) {
                result.descentWinds.push({
                  trueDegrees,
                  magnitude,
                  altitude: idxAltitude,
                });
                lastAltitude = idxAltitude;
              }
            }
          });
        });
      }

      // ALTN
      {
        if (alternate) {
          result.alternateWind = {
            altitude: Math.round(parseInt(alternate.cruise_altitude, 10) / 100) * 100,
            trueDegrees: parseInt(alternate.avg_wind_dir, 10),
            magnitude: parseInt(alternate.avg_wind_spd, 10),
          };
        }
      }

      return result;
    }
  }
}
