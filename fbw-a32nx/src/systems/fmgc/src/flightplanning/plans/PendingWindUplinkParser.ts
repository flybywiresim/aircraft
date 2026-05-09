import { UplinkedWindEntry, UplinkedWindLevel, WindUplinkMessage } from '@datalink/common';
import { FlightPlan } from './FlightPlan';
import { Vec2Math } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { FlightPlanWindEntry } from '../data/wind';
import { PendingCruiseWind } from './PendingWindUplink';
import { FmgcFlightPhase } from '../../../../shared/src/flightphase';
import { FpmConfig } from '../FpmConfig';

export class PendingWindUplinkParser {
  private static readonly MAX_CERTIFIED_LEVEL = 398;
  private static readonly MAX_WIND_MAGNITUDE = 500;

  public static setFromUplink(
    uplink: WindUplinkMessage,
    plan: FlightPlan,
    flightPhase: FmgcFlightPhase,
    config: FpmConfig,
  ) {
    switch (flightPhase) {
      case FmgcFlightPhase.Preflight:
      case FmgcFlightPhase.Takeoff:
      case FmgcFlightPhase.Done:
        this.setClimbWinds(uplink, plan, config);
      // eslint-disable-next-line no-fallthrough
      case FmgcFlightPhase.Climb:
      case FmgcFlightPhase.Cruise:
        this.setCruiseWinds(uplink, plan, config);
        this.setDescentWinds(uplink, plan, config);
        this.setAlternateWinds(uplink, plan);
    }

    plan.pendingWindUplink.onUplinkReadyToInsert();
  }

  private static setClimbWinds(uplink: WindUplinkMessage, plan: FlightPlan, config: FpmConfig) {
    const originElevationLevel = (plan.originAirport?.location.alt ?? 0) / 100;

    plan.pendingWindUplink.climbWinds = uplink.climbWinds
      ?.filter((wind) => this.isValidWind(wind))
      .filter((wind, i, source) => this.isUniqueWindLevel(wind, i, source, originElevationLevel))
      .map((wind) => this.createWindEntryFromUplinkedWind(wind))
      .slice(0, config.NUM_CLIMB_WIND_LEVELS)
      .sort((a, b) => a.altitude - b.altitude);
  }

  /**
   * Set uplinked cruise winds on the flight plan from the wind uplink message
   *
   * @example
   * const sdf: WindUplinkMessage = {
   *   cruiseWinds: [
   *     {
   *       flightLevel: 300,
   *       fixes: [
   *         { type: 'waypoint', fixIdent: 'WPT1', trueDegrees: 200, magnitude: 20 },
   *         { type: 'latlon', lat: 10, long: 10, trueDegrees: 100, magnitude: 10 },
   *       ],
   *     },
   *     { flightLevel: 320, fixes: [{ type: 'waypoint', fixIdent: 'WPT1', trueDegrees: 300, magnitude: 30 }] },
   *   ],
   *   // ... winds for other phases
   * };
   *
   *
   * PendingWindUplinkParser.setCruiseWinds(sdf, plan, config);
   * // ..is equivalent to...
   * plan.pendingWindUplink.cruiseWinds = [
   *   {
   *     type: 'waypoint',
   *     fixIdent: 'WPT1',
   *     levels: [
   *       { altitude: 32000, vector: ... },
   *       { altitude: 30000, vector: ... },
   *     ],
   *   },
   *   { type: 'latlon', lat: 10, long: 10, levels: [{ altitude: 30000, vector: ... }] },
   * ];
   * @param uplink The wind uplink message
   * @param plan The plan to insert the uplink into
   * @param config The flight plan configuration
   */
  private static setCruiseWinds(uplink: WindUplinkMessage, plan: FlightPlan, config: FpmConfig) {
    plan.pendingWindUplink.cruiseWinds = (
      uplink.cruiseWinds
        ?.filter((wind) => this.isValidWindLevel(wind.flightLevel))
        .filter((wind, i, source) => this.isUniqueWindLevel(wind, i, source))
        .slice(0, config.NUM_CRUISE_WIND_LEVELS)
        .reduce<PendingCruiseWind[]>((acc, uplinkedEntry) => {
          uplinkedEntry.fixes
            .filter((windAtFix) => this.isValidWindEntry(windAtFix))
            .forEach((windAtFix) => {
              const pendingEntry = {
                altitude: uplinkedEntry.flightLevel * 100,
                vector: this.createVecFromDeg(windAtFix),
                flags: 0,
              };

              const existingFixWinds = acc.find(
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
                acc.push({
                  type: 'waypoint',
                  fixIdent: windAtFix.fixIdent,
                  levels: [pendingEntry],
                });
              } else if (windAtFix.type === 'latlon') {
                acc.push({
                  type: 'latlon',
                  lat: windAtFix.lat,
                  long: windAtFix.long,
                  levels: [pendingEntry],
                });
              }
            });

          return acc;
        }, []) ?? []
    ).map((fix) => {
      fix.levels.sort((a, b) => b.altitude - a.altitude);
      return fix;
    });
  }

  private static setDescentWinds(uplink: WindUplinkMessage, plan: FlightPlan, config: FpmConfig) {
    const destinationElevationLevel = (plan.destinationAirport?.location.alt ?? 0) / 100;

    plan.pendingWindUplink.descentWinds = uplink.descentWinds
      ?.filter((wind) => this.isValidWind(wind))
      .filter((wind, i, source) => this.isUniqueWindLevel(wind, i, source, destinationElevationLevel))
      .map((wind) => this.createWindEntryFromUplinkedWind(wind))
      .slice(0, config.NUM_DESCENT_WIND_LEVELS)
      .sort((a, b) => b.altitude - a.altitude);
  }

  private static setAlternateWinds(uplink: WindUplinkMessage, plan: FlightPlan) {
    plan.pendingWindUplink.alternateWind =
      uplink.alternateWind !== undefined ? this.createWindEntryFromUplinkedWind(uplink.alternateWind) : undefined;
  }

  /**
   * Checks whether the first occurence of a wind element is at the specified index of the source array.
   * If an element occurs multiple times in the same array, this will only return true for the first element.
   * @param wind The wind element to look for in the array
   * @param index The index of the element in the source array
   * @param source The array of wind elements
   * @param groundElevation The elevation below which wind entries are treated to be at ground level
   * @returns
   */
  private static isUniqueWindLevel(
    wind: { flightLevel: number },
    index: number,
    source: { flightLevel: number }[],
    groundElevation?: number,
  ): boolean {
    return (
      source.findIndex((w2) => {
        if (groundElevation !== undefined && wind.flightLevel < groundElevation + 4) {
          return w2.flightLevel < groundElevation + 4;
        }

        return w2.flightLevel === wind.flightLevel;
      }) === index
    );
  }

  private static isValidWindLevel(flightLevel: number): boolean {
    return flightLevel >= 0 && flightLevel <= this.MAX_CERTIFIED_LEVEL;
  }

  private static isValidWindEntry({ magnitude, trueDegrees }: UplinkedWindEntry): boolean {
    return magnitude >= 0 && magnitude <= this.MAX_WIND_MAGNITUDE && trueDegrees >= 0 && trueDegrees <= 360;
  }

  private static isValidWind(wind: UplinkedWindLevel): boolean {
    return this.isValidWindLevel(wind.flightLevel) && this.isValidWindEntry(wind);
  }

  private static createWindEntryFromUplinkedWind(wind: UplinkedWindLevel): FlightPlanWindEntry {
    return {
      vector: this.createVecFromDeg(wind),
      altitude: wind.flightLevel * 100,
      flags: 0,
    };
  }

  private static createVecFromDeg({ magnitude, trueDegrees }: UplinkedWindEntry): Float64Array {
    return Vec2Math.setFromPolar(magnitude, trueDegrees * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create());
  }
}
