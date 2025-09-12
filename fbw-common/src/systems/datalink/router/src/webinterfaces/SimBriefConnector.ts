//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { getSimBriefOfp, ISimbriefData, MathUtils, Vec2Utils } from '@flybywiresim/fbw-sdk';
import {
  AtsuStatusCodes,
  UplinkedCruiseWindEntry,
  UplinkedCruiseWindSet,
  WindRequestMessage,
  WindUplinkMessage,
} from '../../../common/src';
import { Vec2Math } from '@microsoft/msfs-sdk';

export class SimBriefConnector {
  private static readonly WindUplinkCache: Omit<Required<WindUplinkMessage>, 'alternateWind'> = {
    climbWinds: [],
    cruiseWinds: [],
    descentWinds: [],
  };

  public static async receiveSimBriefWinds(request: WindRequestMessage): Promise<[AtsuStatusCodes, WindUplinkMessage]> {
    try {
      const body = await getSimBriefOfp();

      return [AtsuStatusCodes.Ok, SimBriefConnector.parseSimBriefWinds(body, request)];
    } catch (e) {
      console.error('SimBrief OFP download failed');
      throw e;
    }
  }

  private static resetCache(): void {
    SimBriefConnector.WindUplinkCache.climbWinds.length = 0;
    SimBriefConnector.WindUplinkCache.cruiseWinds.length = 0;
    SimBriefConnector.WindUplinkCache.descentWinds.length = 0;
  }

  private static parseSimBriefWinds(simbriefJson: ISimbriefData, request: WindRequestMessage): WindUplinkMessage {
    const alternate = simbriefJson.alternate;
    const navlog = simbriefJson.navlog ?? [];

    this.resetCache();

    this.parseClimbWinds(navlog, this.WindUplinkCache);
    this.parseCruiseWinds(navlog, request, this.WindUplinkCache);
    this.parseDescentWinds(navlog, this.WindUplinkCache);
    this.parseAlternateWinds(alternate, this.WindUplinkCache);

    return this.WindUplinkCache;
  }

  private static parseClimbWinds(navlog: Required<ISimbriefData>['navlog'], result: typeof this.WindUplinkCache): void {
    const clbWpts = navlog.filter((val) => val.stage === 'CLB');
    let lastAltitude = 0;

    // iterate through each clbWpt grabbing the wind data
    clbWpts.forEach((clbWpt, wptIdx) => {
      const wptAltitude = parseInt(clbWpt.altitude_feet, 10);

      if (wptIdx == 0) {
        let altIdx = 0;
        // we need to backfill from altitude 0 to below wptAltitude in windData
        while (lastAltitude < wptAltitude) {
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
          deltaPrevLevel = Math.abs(wptAltitude - parseInt(clbWpt.wind_data.level[levelIdx - 1].altitude));
          deltaThisLevel = Math.abs(wptAltitude - altitude);
        }

        // Check that altitude isn't backtracking
        if (altitude > lastAltitude && lastAltitude <= wptAltitude) {
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

    result.climbWinds.sort((a, b) => b.flightLevel - a.flightLevel);
  }

  private static parseCruiseWinds(
    navlog: Required<ISimbriefData>['navlog'],
    request: WindRequestMessage,
    result: typeof this.WindUplinkCache,
  ): void {
    if (request.cruiseWinds === undefined || request.cruiseWinds.flightLevels.length === 0) {
      return;
    }

    const requestedCruiseWinds = request.cruiseWinds;

    const cruiseWaypoints = navlog.filter(
      (wpt) =>
        wpt.ident !== 'TOC' &&
        wpt.ident !== 'TOD' &&
        requestedCruiseWinds.waypoints.some((reqWpt) => {
          return (
            (wpt.type === 'wpt' && typeof reqWpt === 'string' && reqWpt === wpt.ident) ||
            (wpt.type === 'ltlg' &&
              typeof reqWpt !== 'string' &&
              MathUtils.isAboutEqual(reqWpt.lat, parseFloat(wpt.pos_lat)) &&
              MathUtils.isAboutEqual(reqWpt.long, parseFloat(wpt.pos_long)))
          );
        }),
    );

    // Go through all the requested flight levels
    for (const reqLevel of requestedCruiseWinds.flightLevels) {
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
        const highestLevel = Math.round(parseInt(fix.wind_data.level[fix.wind_data.level.length - 1].altitude) / 100);

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
          const lowerWindAlt = parseInt(fix.wind_data.level[i].altitude, 10);
          const lowerWindSpd = parseInt(fix.wind_data.level[i].wind_spd, 10);
          const lowerWindDir = parseInt(fix.wind_data.level[i].altitude, 10);
          const lowerLevelOat = parseInt(fix.wind_data.level[i].oat, 10);

          const upperWindAlt = parseInt(fix.wind_data.level[i + 1].altitude, 10);
          const upperWindSpd = parseInt(fix.wind_data.level[i + 1].wind_spd, 10);
          const upperWindDir = parseInt(fix.wind_data.level[i + 1].altitude, 10);
          const upperLevelOat = parseInt(fix.wind_data.level[i + 1].oat, 10);

          const lowerLevel = Math.round(lowerWindAlt / 100);
          const upperLevel = Math.round(upperWindAlt / 100);

          if (reqLevel >= lowerLevel && reqLevel <= upperLevel) {
            const vec1 = Vec2Math.setFromPolar(
              lowerWindSpd,
              lowerWindDir * MathUtils.DEGREES_TO_RADIANS,
              Vec2Math.create(),
            );
            const vec2 = Vec2Math.setFromPolar(
              upperWindSpd,
              upperWindDir * MathUtils.DEGREES_TO_RADIANS,
              Vec2Math.create(),
            );

            const interpolatedVector = Vec2Utils.interpolate(
              reqLevel,
              lowerLevel,
              upperLevel,
              vec1,
              vec2,
              Vec2Math.create(),
            );

            responseFix.trueDegrees = Math.round(
              MathUtils.normalise360(Vec2Math.theta(interpolatedVector) * MathUtils.RADIANS_TO_DEGREES),
            );
            responseFix.magnitude = Math.round(Vec2Math.abs(interpolatedVector));

            responseFix.temperature = MathUtils.interpolate(
              reqLevel,
              lowerLevel,
              upperLevel,
              lowerLevelOat,
              upperLevelOat,
            );

            break;
          }
        }

        responseSet.fixes.push(responseFix);
      }

      result.cruiseWinds.push(responseSet);
    }
  }

  private static parseDescentWinds(
    navlog: Required<ISimbriefData>['navlog'],
    result: typeof this.WindUplinkCache,
  ): void {
    let lastAltitude = 45000;
    navlog.forEach((desWpt, wptIdx) => {
      // TOD is marked as cruise stage, but we want it's topmost wind data
      if (desWpt.ident !== 'TOD' && desWpt.stage !== 'DSC') {
        return;
      }

      const wptAltitude = parseInt(desWpt.altitude_feet, 10);

      if (wptIdx == 0) {
        let altIdx = desWpt.wind_data.level.length - 1;
        // we need to backfill from crz altitude to above next clbWpt.altitude_feet in windData
        while (lastAltitude > wptAltitude) {
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
          deltaNextLevel = Math.abs(wptAltitude - parseInt(desWpt.wind_data.level[levelIdx + 1].altitude));
          deltaThisLevel = Math.abs(wptAltitude - altitude);
        }

        // Check that altitude isn't backtracking
        if (altitude >= lastAltitude && lastAltitude > wptAltitude) {
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

  private static parseAlternateWinds(alternate: ISimbriefData['alternate'], result: WindUplinkMessage): void {
    if (alternate) {
      result.alternateWind = {
        flightLevel: Math.round(alternate.cruiseAltitude / 100),
        trueDegrees: alternate.averageWindDirection,
        magnitude: alternate.averageWindSpeed,
      };
    }
  }
}
