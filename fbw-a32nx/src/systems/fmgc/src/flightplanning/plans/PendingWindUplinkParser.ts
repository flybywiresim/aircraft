import { UplinkedWindEntry, UplinkedWindLevel, WindUplinkMessage } from '@datalink/common';
import { FlightPlan } from './FlightPlan';
import { Vec2Math } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { WindEntry } from '../data/wind';
import { PendingCruiseWind } from './PendingWindUplink';

export class PendingWindUplinkParser {
  private static readonly MAX_CERTIFIED_LEVEL = 398;
  private static readonly MAX_WIND_MAGNITUDE = 500;

  public static setFromUplink(uplink: WindUplinkMessage, plan: FlightPlan) {
    const originElevationLevel = (plan.originAirport?.location.alt ?? 0) / 100;
    const destinationElevationLevel = (plan.destinationAirport?.location.alt ?? 0) / 100;

    plan.pendingWindUplink.climbWinds = uplink.climbWinds
      ?.filter((wind) => this.isValidWind(wind))
      .filter((wind, i, source) => this.isUniqueWindLevel(wind, i, source, originElevationLevel))
      .map((wind) => this.createWindEntryFromUplinkedWind(wind))
      .slice(0, 5)
      .sort((a, b) => a.altitude - b.altitude);

    plan.pendingWindUplink.cruiseWinds = (
      uplink.cruiseWinds
        ?.filter((wind) => this.isValidWindLevel(wind.flightLevel))
        .filter((wind, i, source) => this.isUniqueWindLevel(wind, i, source))
        .slice(0, 4)
        .reduce<PendingCruiseWind[]>((acc, uplinkedEntry) => {
          uplinkedEntry.fixes
            .filter((windAtFix) => this.isValidWindEntry(windAtFix))
            .forEach((windAtFix) => {
              const pendingEntry = {
                altitude: uplinkedEntry.flightLevel * 100,
                vector: this.createVecFromDeg(windAtFix),
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

    plan.pendingWindUplink.descentWinds = uplink.descentWinds
      ?.filter((wind) => this.isValidWind(wind))
      .filter((wind, i, source) => this.isUniqueWindLevel(wind, i, source, destinationElevationLevel))
      .map((wind) => this.createWindEntryFromUplinkedWind(wind))
      .slice(0, 10)
      .sort((a, b) => b.altitude - a.altitude);

    plan.pendingWindUplink.alternateWind =
      uplink.alternateWind !== undefined ? this.createWindEntryFromUplinkedWind(uplink.alternateWind) : undefined;

    plan.pendingWindUplink.onUplinkReadyToInsert();
  }

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

  private static createWindEntryFromUplinkedWind(wind: UplinkedWindLevel): WindEntry {
    return {
      vector: this.createVecFromDeg(wind),
      altitude: wind.flightLevel * 100,
    };
  }

  private static createVecFromDeg({ magnitude, trueDegrees }: UplinkedWindEntry): Float64Array {
    return Vec2Math.setFromPolar(magnitude, trueDegrees * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create());
  }
}
