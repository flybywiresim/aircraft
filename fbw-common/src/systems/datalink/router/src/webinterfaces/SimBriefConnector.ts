//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { getSimBriefOfp, MathUtils } from '@flybywiresim/fbw-sdk';
import {
  AtsuStatusCodes,
  UplinkedCruiseWindEntry,
  UplinkedCruiseWindSet,
  WindRequestMessage,
  WindUplinkMessage,
} from '../../../common/src';
import { Vec2Math } from '@microsoft/msfs-sdk';

const SIMBRIEF_API_URL = 'https://www.simbrief.com/api/xml.fetcher.php?json=1';

export class SimBriefConnector {
  public static async receiveSimBriefWinds(
    request: WindRequestMessage,
  ): Promise<[AtsuStatusCodes, WindUplinkMessage | null]> {
    try {
      const body = getSimBriefOfp();

      return [AtsuStatusCodes.Ok, SimBriefConnector.parseSimBriefWinds(body, request)];
    } catch (e) {
      console.error('SimBrief OFP download failed');
      throw e;
    }
  }

  private static parseSimBriefWinds(simbriefJson: any, request: WindRequestMessage): WindUplinkMessage {
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
                flightLevel: Math.round(altitude / 100),
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
                  flightLevel: Math.round(idxAltitude / 100),
                });
                lastAltitude = idxAltitude;
              }
            }
          });
        });
      }

      // CRZ
      {
        const cruiseWaypoints = navlog.filter(
          (wpt) =>
            wpt.ident !== 'TOC' &&
            wpt.ident !== 'TOD' &&
            request.cruiseWinds.waypoints.some((reqWpt) => {
              return (
                (wpt.type === 'waypoint' && typeof reqWpt === 'string' && reqWpt === wpt.ident) ||
                (wpt.type === 'ltlg' &&
                  typeof reqWpt !== 'string' &&
                  MathUtils.isAboutEqual(reqWpt.lat, parseFloat(wpt.pos_lat)) &&
                  MathUtils.isAboutEqual(reqWpt.long, parseFloat(wpt.pos_long)))
              );
            }),
        );

        // Go through all the requested flight levels
        for (const reqLevel of request.cruiseWinds.flightLevels) {
          const responseSet: UplinkedCruiseWindSet = {
            flightLevel: reqLevel,
            fixes: [],
          };

          // Go through requested waypoints
          for (const fix of cruiseWaypoints) {
            if ((fix.wind_data?.level?.length ?? 0) === 0) {
              continue;
            }

            const responseFix: UplinkedCruiseWindEntry =
              fix.type === 'ltlg'
                ? {
                    type: 'latlon',
                    lat: parseFloat(fix.pos_lat),
                    long: parseFloat(fix.pos_long),
                    flightLevel: reqLevel,
                    trueDegrees: 0,
                    magnitude: 0,
                  }
                : {
                    type: 'waypoint',
                    fixIdent: fix.ident,
                    flightLevel: reqLevel,
                    trueDegrees: 0,
                    magnitude: 0,
                  };

            const lowestLevel = Math.round(parseInt(fix.wind_data.level[0].altitude) / 100);
            const highestLevel = Math.round(
              parseInt(fix.wind_data.level[fix.wind_data.level.length - 1].altitude) / 100,
            );

            if (reqLevel <= lowestLevel) {
              responseFix.trueDegrees = parseInt(fix.wind_data.level[0].wind_dir);
              responseFix.magnitude = parseInt(fix.wind_data.level[0].wind_spd);
              responseFix.temperature = parseInt(fix.wind_data.level[0].oat);
            } else if (reqLevel >= highestLevel) {
              responseFix.trueDegrees = parseInt(fix.wind_data.level[fix.wind_data.level.length - 1].wind_dir);
              responseFix.magnitude = parseInt(fix.wind_data.level[fix.wind_data.level.length - 1].wind_spd);
              responseFix.temperature = parseInt(fix.wind_data.level[fix.wind_data.level.length - 1].oat);
            }

            // Interpolate at requested level
            for (let i = 0; i < fix.wind_data.level.length - 1; i++) {
              const lowerLevel = Math.round(parseInt(fix.wind_data.level[i].altitude) / 100);
              const upperLevel = Math.round(parseInt(fix.wind_data.level[i + 1].altitude) / 100);

              if (reqLevel >= lowerLevel && reqLevel <= upperLevel) {
                const ratio = (reqLevel - lowerLevel) / (upperLevel - lowerLevel);

                const vec1 = Vec2Math.setFromPolar(
                  fix.wind_data.level[i].wind_spd,
                  fix.wind_data.level[i].wind_dir * MathUtils.DEGREES_TO_RADIANS,
                  Vec2Math.create(),
                );
                const vec2 = Vec2Math.setFromPolar(
                  fix.wind_data.level[i + 1].wind_spd,
                  fix.wind_data.level[i + 1].wind_dir * MathUtils.DEGREES_TO_RADIANS,
                  Vec2Math.create(),
                );

                const interpolatedVector = Vec2Math.set(
                  vec1[0] * (1 - ratio) + vec2[0] * ratio,
                  vec1[1] * (1 - ratio) + vec2[1] * ratio,
                  Vec2Math.create(),
                );

                responseFix.trueDegrees = Math.round(
                  MathUtils.normalise360(Vec2Math.theta(interpolatedVector) * MathUtils.RADIANS_TO_DEGREES),
                );
                responseFix.magnitude = Math.round(Vec2Math.abs(interpolatedVector));

                responseFix.temperature = Math.round(
                  parseInt(fix.wind_data.level[i].oat) * (1 - ratio) + parseInt(fix.wind_data.level[i + 1].oat) * ratio,
                );
                break;
              }
            }

            responseSet.fixes.push(responseFix);
          }

          result.cruiseWinds.push(responseSet);
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
                flightLevel: Math.round(altitude / 100),
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
                  flightLevel: Math.round(idxAltitude / 100),
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
            flightLevel: Math.round(parseInt(alternate.cruise_altitude, 10) / 100),
            trueDegrees: parseInt(alternate.avg_wind_dir, 10),
            magnitude: parseInt(alternate.avg_wind_spd, 10),
          };
        }
      }

      return result;
    }
  }
}
