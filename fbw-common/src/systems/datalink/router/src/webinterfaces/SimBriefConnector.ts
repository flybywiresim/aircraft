//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { getSimBriefOfp, ISimbriefData, MathUtils, Vec2Utils, IWindLevel, INavlogFix } from '@flybywiresim/fbw-sdk';
import {
  AtsuStatusCodes,
  UplinkedCruiseWindEntry,
  UplinkedCruiseWindSet,
  UplinkedWindLevel,
  WindRequestMessage,
  WindUplinkMessage,
} from '../../../common/src';
import { Vec2Math, Wait } from '@microsoft/msfs-sdk';

export class SimBriefConnector {
  private static readonly WindVectorCache = [Vec2Math.create(), Vec2Math.create(), Vec2Math.create()];

  public static async receiveSimBriefWinds(
    request: WindRequestMessage,
  ): Promise<[AtsuStatusCodes, WindUplinkMessage | null]> {
    return Promise.race([
      getSimBriefOfp()
        .then((body): [AtsuStatusCodes, WindUplinkMessage | null] => [
          AtsuStatusCodes.Ok,
          SimBriefConnector.parseSimBriefWinds(body, request),
        ])
        .catch((err): [AtsuStatusCodes, WindUplinkMessage | null] => {
          console.error('SimBrief OFP download failed: ' + err);
          return [AtsuStatusCodes.FormatError, null];
        }),
      // Time out after 4 minutes
      Wait.awaitDelay(4 * 60 * 1000).then((_): [AtsuStatusCodes, WindUplinkMessage | null] => [
        AtsuStatusCodes.ComFailed,
        null,
      ]),
    ]);
  }

  private static parseSimBriefWinds(simbriefJson: ISimbriefData, request: WindRequestMessage): WindUplinkMessage {
    const alternate = simbriefJson.alternate;
    const navlog = simbriefJson.navlog ?? [];

    return {
      climbWinds: this.parseClimbWinds(navlog, request),
      cruiseWinds: this.parseCruiseWinds(navlog, request),
      descentWinds: this.parseDescentWinds(navlog, request),
      alternateWind: this.parseAlternateWinds(alternate, request),
    };
  }

  private static parseClimbWinds(navlog: INavlogFix[], request: WindRequestMessage): UplinkedWindLevel[] | undefined {
    if (request.climbWindLevel === undefined) {
      return undefined;
    }

    const result: UplinkedWindLevel[] = [];

    let lastAltitude = 0;

    for (let wptIdx = 0; wptIdx < navlog.length; wptIdx++) {
      const clbWpt = navlog[wptIdx];
      if (clbWpt.stage !== 'CLB') {
        continue;
      }

      const wptAltitude = parseInt(clbWpt.altitude_feet, 10);

      if (wptIdx === 0) {
        let altIdx = 0;
        // we need to backfill from altitude 0 to below wptAltitude in windData
        while (lastAltitude < wptAltitude) {
          const windLevel = this.parseWindLevel(clbWpt.wind_data.level[altIdx]);

          result.push(windLevel);

          lastAltitude = windLevel.flightLevel * 100;
          altIdx++;
        }
      }

      // Now we add the closest wind data to the altitude of the clbWpt
      for (let levelIdx = 0; levelIdx < clbWpt.wind_data.level.length; levelIdx++) {
        const wind = clbWpt.wind_data.level[levelIdx];

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
            result.push({
              trueDegrees,
              magnitude,
              flightLevel: Math.round(idxAltitude / 100),
            });
            lastAltitude = idxAltitude;
          }
        }
      }
    }

    return result.sort((a, b) => b.flightLevel - a.flightLevel);
  }

  private static parseCruiseWinds(
    navlog: INavlogFix[],
    request: WindRequestMessage,
  ): UplinkedCruiseWindSet[] | undefined {
    if (request.cruiseWinds === undefined || request.cruiseWinds.flightLevels.length === 0) {
      return undefined;
    }

    const result: UplinkedCruiseWindSet[] = [];

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
          const lowerWindDir = parseInt(fix.wind_data.level[i].wind_dir, 10);
          const lowerLevelOat = parseInt(fix.wind_data.level[i].oat, 10);

          const upperWindAlt = parseInt(fix.wind_data.level[i + 1].altitude, 10);
          const upperWindSpd = parseInt(fix.wind_data.level[i + 1].wind_spd, 10);
          const upperWindDir = parseInt(fix.wind_data.level[i + 1].wind_dir, 10);
          const upperLevelOat = parseInt(fix.wind_data.level[i + 1].oat, 10);

          const lowerLevel = Math.round(lowerWindAlt / 100);
          const upperLevel = Math.round(upperWindAlt / 100);

          if (reqLevel >= lowerLevel && reqLevel <= upperLevel) {
            const vec1 = Vec2Math.setFromPolar(
              lowerWindSpd,
              lowerWindDir * MathUtils.DEGREES_TO_RADIANS,
              this.WindVectorCache[0],
            );
            const vec2 = Vec2Math.setFromPolar(
              upperWindSpd,
              upperWindDir * MathUtils.DEGREES_TO_RADIANS,
              this.WindVectorCache[1],
            );

            const interpolatedVector = Vec2Utils.interpolate(
              reqLevel,
              lowerLevel,
              upperLevel,
              vec1,
              vec2,
              this.WindVectorCache[2],
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

      result.push(responseSet);
    }

    return result;
  }

  private static parseDescentWinds(navlog: INavlogFix[], request: WindRequestMessage): UplinkedWindLevel[] | undefined {
    if (request.descentWindLevel === undefined) {
      return undefined;
    }

    const result: UplinkedWindLevel[] = [];

    let lastAltitude = 45000;

    for (let wptIdx = 0; wptIdx < navlog.length; wptIdx++) {
      const desWpt = navlog[wptIdx];

      // TOD is marked as cruise stage, but we want its topmost wind data
      if (desWpt.ident !== 'TOD' && desWpt.stage !== 'DSC') {
        continue;
      }

      const wptAltitude = parseInt(desWpt.altitude_feet, 10);

      if (wptIdx === 0) {
        let altIdx = desWpt.wind_data.level.length - 1;
        // we need to backfill from crz altitude to above next clbWpt.altitude_feet in windData
        while (lastAltitude > wptAltitude) {
          const windLevel = this.parseWindLevel(desWpt.wind_data.level[altIdx]);

          result.push(windLevel);
          lastAltitude = windLevel.flightLevel * 100;
          altIdx--;
        }
      }

      // Now we add the closest wind data to the altitude of the desWpt
      for (let levelIdx = desWpt.wind_data.level.length - 1; levelIdx >= 0; levelIdx--) {
        // Iterate in reverse
        const wind = desWpt.wind_data.level[levelIdx];
        const altitude = parseInt(wind.altitude);

        let deltaNextLevel = 0;
        let deltaThisLevel = 0;
        // Look forwards for the closest level
        if (levelIdx > 0) {
          deltaNextLevel = Math.abs(wptAltitude - parseInt(desWpt.wind_data.level[levelIdx - 1].altitude));
          deltaThisLevel = Math.abs(wptAltitude - altitude);
        }

        // Check that altitude isn't backtracking
        if (altitude >= lastAltitude && lastAltitude > wptAltitude) {
          const idx = deltaNextLevel > deltaThisLevel ? levelIdx : levelIdx - 1;

          const idxAltitude = parseInt(desWpt.wind_data.level[idx].altitude);
          const trueDegrees = parseInt(desWpt.wind_data.level[idx].wind_dir);
          const magnitude = parseInt(desWpt.wind_data.level[idx].wind_spd);

          // Check again that we didn't backtrack
          if (idxAltitude < lastAltitude) {
            result.push({
              trueDegrees,
              magnitude,
              flightLevel: Math.round(idxAltitude / 100),
            });

            lastAltitude = idxAltitude;
          }
        }
      }
    }

    return result;
  }

  private static parseAlternateWinds(
    alternate: ISimbriefData['alternate'],
    request: WindRequestMessage,
  ): UplinkedWindLevel | undefined {
    if (!alternate || request.alternateWind === undefined) {
      return undefined;
    }

    return {
      flightLevel: Math.round(alternate.cruiseAltitude / 100),
      trueDegrees: alternate.averageWindDirection,
      magnitude: alternate.averageWindSpeed,
    };
  }

  private static parseWindLevel(windLevel: IWindLevel): UplinkedWindLevel {
    const altitude = parseInt(windLevel.altitude);
    const magnitude = parseInt(windLevel.wind_spd);
    const trueDegrees = parseInt(windLevel.wind_dir);

    return {
      trueDegrees,
      magnitude,
      flightLevel: Math.round(altitude / 100),
    };
  }
}
