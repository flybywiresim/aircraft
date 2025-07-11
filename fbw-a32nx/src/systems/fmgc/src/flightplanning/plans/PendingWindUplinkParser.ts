import { UplinkedWindLevel, WindUplinkMessage } from '@datalink/common';
import { FlightPlan } from './FlightPlan';
import { Vec2Math } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { WindEntry } from '../data/wind';

export class PendingWindUplinkParser {
  static selectClbDesWinds(
    uplinkedLevels: UplinkedWindLevel[],
    existingEntries: WindEntry[],
    plan: FlightPlan,
    maxNumEntries: number,
  ) {
    if (uplinkedLevels.length === 0) {
      return [];
    }

    // Assume cruise level is FL390 so we get a good spread of wind levels
    const cruiseAltitude = (plan.performanceData.cruiseFlightLevel ?? 390) * 100;

    // 1. Check if we have uplinked entries for existing levels
    // 2. For the remaining number of entries, spread them across the climb profile

    const windData = uplinkedLevels.filter((w) => existingEntries.some((e) => e.altitude === w.flightLevel));
    const chosenLevels = new Set(windData.map((w) => w.flightLevel));

    // Sort ascending
    uplinkedLevels.sort((a, b) => a.flightLevel - b.flightLevel);

    // Find the lowest level above the cruise flight level, or the highest level if none are above
    const highestLevel = uplinkedLevels.reduce(
      (acc, level) => (acc === undefined || acc.flightLevel * 100 < cruiseAltitude ? level : acc),
      undefined,
    );

    // Find the lowest level below 10,000 feet, or the lowest level if none are below
    const lowestLevel = uplinkedLevels.reduce(
      (acc, level) => (acc === undefined || level.flightLevel * 100 < 10_000 ? level : acc),
      undefined,
    );

    const numWindEntriesLeft = maxNumEntries - windData.length;

    for (let i = 0; i < numWindEntriesLeft; i++) {
      const optimalLevel =
        lowestLevel.flightLevel + ((i + 1) / maxNumEntries) * (highestLevel.flightLevel - lowestLevel.flightLevel);

      // Find the closest wind level to the optimal level
      const closestWindLevel = uplinkedLevels.reduce((prev, curr) => {
        if (prev === undefined) {
          return curr;
        } else if (curr === lowestLevel || curr === highestLevel) {
          return prev;
        }

        const prevDiff = Math.abs(prev.flightLevel - optimalLevel);
        const currDiff = Math.abs(curr.flightLevel - optimalLevel);

        return currDiff < prevDiff ? curr : prev;
      });

      if (!chosenLevels.has(closestWindLevel.flightLevel)) {
        windData.push(closestWindLevel);
        chosenLevels.add(closestWindLevel.flightLevel);
      }
    }

    return windData;
  }

  static setFromUplink(uplink: WindUplinkMessage, plan: FlightPlan) {
    if (uplink.climbWinds) {
      plan.pendingWindUplink.climbWinds = this.selectClbDesWinds(
        uplink.climbWinds,
        plan.performanceData.climbWindEntries,
        plan,
        5,
      )
        .map((wind) => ({
          vector: Vec2Math.setFromPolar(
            wind.magnitude,
            wind.trueDegrees * MathUtils.DEGREES_TO_RADIANS,
            Vec2Math.create(),
          ),
          altitude: wind.flightLevel * 100,
        }))
        .sort((a, b) => a.altitude - b.altitude);
    } else {
      plan.pendingWindUplink.climbWinds = undefined;
    }

    if (uplink.cruiseWinds) {
      const levels = new Set();
      const maxNumCruiseWindLevels = 4;

      plan.pendingWindUplink.cruiseWinds = [];

      for (const uplinkedEntry of uplink.cruiseWinds) {
        if (!levels.has(uplinkedEntry.flightLevel) && levels.size >= maxNumCruiseWindLevels) {
          continue;
        }

        for (const windAtFix of uplinkedEntry.fixes) {
          const pendingEntry = {
            altitude: uplinkedEntry.flightLevel * 100,
            vector: Vec2Math.setFromPolar(
              windAtFix.magnitude,
              windAtFix.trueDegrees * MathUtils.DEGREES_TO_RADIANS,
              Vec2Math.create(),
            ),
          };

          const existingFixWinds = plan.pendingWindUplink.cruiseWinds?.find(
            (w) =>
              (w.type === 'waypoint' && windAtFix.type === 'waypoint' && w.fixIdent === windAtFix.fixIdent) ||
              (w.type === 'latlon' &&
                windAtFix.type === 'latlon' &&
                MathUtils.isAboutEqual(w.lat, windAtFix.lat) &&
                MathUtils.isAboutEqual(w.long, windAtFix.long)),
          );
          if (existingFixWinds) {
            existingFixWinds.levels.push(pendingEntry);
          } else if (windAtFix.type === 'waypoint') {
            plan.pendingWindUplink.cruiseWinds.push({
              type: 'waypoint',
              fixIdent: windAtFix.fixIdent,
              levels: [pendingEntry],
            });
          } else if (windAtFix.type === 'latlon') {
            plan.pendingWindUplink.cruiseWinds.push({
              type: 'latlon',
              lat: windAtFix.lat,
              long: windAtFix.long,
              levels: [pendingEntry],
            });
          }
        }

        levels.add(uplinkedEntry.flightLevel);
      }

      for (const cruiseFix of plan.pendingWindUplink.cruiseWinds) {
        cruiseFix.levels.sort((a, b) => b.altitude - a.altitude);
      }
    } else {
      plan.pendingWindUplink.cruiseWinds = undefined;
    }

    if (uplink.descentWinds) {
      plan.pendingWindUplink.descentWinds = this.selectClbDesWinds(
        uplink.descentWinds,
        plan.performanceData.descentWindEntries,
        plan,
        10,
      )
        .map((wind) => ({
          vector: Vec2Math.setFromPolar(
            wind.magnitude,
            wind.trueDegrees * MathUtils.DEGREES_TO_RADIANS,
            Vec2Math.create(),
          ),
          altitude: wind.flightLevel * 100,
        }))
        .sort((a, b) => b.altitude - a.altitude);
    } else {
      plan.pendingWindUplink.descentWinds = undefined;
    }

    if (uplink.alternateWind) {
      plan.pendingWindUplink.alternateWind = {
        altitude: uplink.alternateWind.flightLevel * 100,
        vector: Vec2Math.setFromPolar(
          uplink.alternateWind.magnitude,
          uplink.alternateWind.trueDegrees * MathUtils.DEGREES_TO_RADIANS,
          Vec2Math.create(),
        ),
      };
    } else {
      plan.pendingWindUplink.alternateWind = undefined;
    }

    plan.pendingWindUplink.onUplinkReadyToInsert();
  }
}
