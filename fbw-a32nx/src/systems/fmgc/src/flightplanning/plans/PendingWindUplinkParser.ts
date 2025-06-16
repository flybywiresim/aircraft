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

    const windData = uplinkedLevels.filter((w) => existingEntries.some((e) => e.altitude === w.altitude));
    const chosenLevels = new Set(windData.map((w) => w.altitude));

    // Sort ascending
    uplinkedLevels.sort((a, b) => a.altitude - b.altitude);

    // Find the lowest level above the cruise flight level, or the highest level if none are above
    const highestLevel = uplinkedLevels.reduce(
      (acc, level) => (acc === undefined || acc.altitude < cruiseAltitude ? level : acc),
      undefined,
    );

    // Find the lowest level below 10,000 feet, or the lowest level if none are below
    const lowestLevel = uplinkedLevels.reduce(
      (acc, level) => (acc === undefined || level.altitude < 10_000 ? level : acc),
      undefined,
    );

    const numWindEntriesLeft = maxNumEntries - windData.length;

    for (let i = 0; i < numWindEntriesLeft; i++) {
      const optimalLevel =
        lowestLevel.altitude + ((i + 1) / maxNumEntries) * (highestLevel.altitude - lowestLevel.altitude);

      // Find the closest wind level to the optimal level
      const closestWindLevel = uplinkedLevels.reduce((prev, curr) => {
        if (prev === undefined) {
          return curr;
        } else if (curr === lowestLevel || curr === highestLevel) {
          return prev;
        }

        const prevDiff = Math.abs(prev.altitude - optimalLevel);
        const currDiff = Math.abs(curr.altitude - optimalLevel);

        return currDiff < prevDiff ? curr : prev;
      });

      if (!chosenLevels.has(closestWindLevel.altitude)) {
        windData.push(closestWindLevel);
        chosenLevels.add(closestWindLevel.altitude);
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
          altitude: wind.altitude,
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
        if (!levels.has(uplinkedEntry.altitude) && levels.size >= maxNumCruiseWindLevels) {
          continue;
        }

        const pendingEntry = {
          altitude: uplinkedEntry.altitude,
          vector: Vec2Math.setFromPolar(
            uplinkedEntry.magnitude,
            uplinkedEntry.trueDegrees * MathUtils.DEGREES_TO_RADIANS,
            Vec2Math.create(),
          ),
        };

        const existingFixWinds = plan.pendingWindUplink.cruiseWinds?.find(
          (w) =>
            (w.type === 'waypoint' && uplinkedEntry.type === 'waypoint' && w.fixIdent === uplinkedEntry.fixIdent) ||
            (w.type === 'latlon' &&
              uplinkedEntry.type === 'latlon' &&
              MathUtils.isAboutEqual(w.lat, uplinkedEntry.lat) &&
              MathUtils.isAboutEqual(w.long, uplinkedEntry.long)),
        );
        if (existingFixWinds) {
          existingFixWinds.levels.push(pendingEntry);
        } else if (uplinkedEntry.type === 'waypoint') {
          plan.pendingWindUplink.cruiseWinds.push({
            type: 'waypoint',
            fixIdent: uplinkedEntry.fixIdent,
            levels: [pendingEntry],
          });
        } else if (uplinkedEntry.type === 'latlon') {
          plan.pendingWindUplink.cruiseWinds.push({
            type: 'latlon',
            lat: uplinkedEntry.lat,
            long: uplinkedEntry.long,
            levels: [pendingEntry],
          });
        }

        levels.add(uplinkedEntry.altitude);
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
          altitude: wind.altitude,
        }))
        .sort((a, b) => b.altitude - a.altitude);
    } else {
      plan.pendingWindUplink.descentWinds = undefined;
    }

    if (uplink.alternateWind) {
      plan.pendingWindUplink.alternateWind = {
        altitude: uplink.alternateWind.altitude,
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
