// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { LatLongInterface, LatLonInterface } from '@microsoft/msfs-sdk';

import { Fix, isIlsNavaid, isVhfNavaid, ProcedureLeg } from '../../navdata';
import { MathUtils } from './MathUtils';

export class MagVar {
  /**
   * Gets the database magnetic variation for a specific point, if it is within the database coverage area.
   * @param lat The latitude of the point in degrees, with negative values south of the equator.
   * @param lon The longiture of the point in degrees, with negative values west of the equator.
   * @returns The database magnetic variation in degrees, or null if the point is outside the database coverage.
   */
  public static get(lat: number, lon: number): number | null;
  /**
   * Gets the database magnetic variation for a specific point, if it is within the database coverage area.
   * @param location The location of the point.
   * @returns The database magnetic variation in degrees, or null if the point is outside the database coverage.
   */
  public static get(location: LatLonInterface): number | null;
  /**
   * Gets the database magnetic variation for a specific point, if it is within the database coverage area.
   * @param location The location of the point.
   * @returns The database magnetic variation in degrees, or null if the point is outside the database coverage.
   */
  public static get(location: LatLongInterface): number | null;
  public static get(arg0: number | LatLonInterface | LatLongInterface, arg1?: number): number | null {
    const lat: number = typeof arg0 === 'number' ? arg0 : arg0.lat;
    const lon: number = typeof arg0 === 'number' ? (arg1 as number) : 'long' in arg0 ? arg0.long : arg0.lon;

    if (MagVar.isAvailable(lat, lon)) {
      return Facilities.getMagVar(lat, lon);
    }

    return null;
  }

  /**
   * Checks if database magnetic variation is available for a specific point.
   * @param lat The latitude of the point in degrees, with negative values south of the equator.
   * @param lon The longiture of the point in degrees, with negative values west of the equator.
   * @returns true if the point is within the magnetic database coverage.
   */
  public static isAvailable(lat: number, lon: number): boolean {
    return (lat >= -60.5 && lat <= 73.5) || ((lon <= -117.5 || lon >= -87.5) && lat <= 82.5 && lat >= 0);
  }

  /**
   * Get the magnetic variation for a given fix.
   * @param fix The fix.
   * @returns Magnetic variation in degrees, or null when true north referenced (or outside mag db coverage).
   */
  public static getForFix(fix: Fix): number | null {
    if (isVhfNavaid(fix) || isIlsNavaid(fix)) {
      return fix.trueReferenced ? null : fix.stationDeclination;
    }
    return MagVar.get(fix.location);
  }

  /**
   * Gets the magnetic course for a procedure leg if available (not available for true referenced legs).
   * @param leg The procedure leg.
   * @returns The magnetic course in degrees if available, null if true referenced, or undefined if the leg has no course defined.
   */
  public static getLegMagneticCourse(leg: ProcedureLeg): number | null | undefined {
    if (leg.course === undefined) {
      return undefined;
    }
    return leg.magVar === null ? null : leg.course;
  }

  /**
   * Gets the true course for a procedure leg.
   * @param leg The procedure leg.
   * @returns The true course in degrees, or undefined if the leg has no course defined.
   */
  public static getLegTrueCourse(leg: ProcedureLeg): number | undefined {
    if (leg.course === undefined) {
      return undefined;
    }
    return leg.magVar === null ? leg.course : MagVar.magneticToTrue(leg.course, leg.magVar);
  }

  /**
   * Compute a true heading from a magnetic heading
   * @param heading True heading in degrees.
   * @param magVar Magnetic variation in degrees.
   * @returns Magnetic heading in degrees.
   */
  public static trueToMagnetic(heading: number, magVar: number): number {
    return MathUtils.normalise360(heading - magVar);
  }

  /**
   * Compute a Magnetic heading from a true heading
   * @param heading Magnetic heading in degrees.
   * @param magVar Magnetic variation in degrees.
   * @returns True heading in degrees.
   */
  public static magneticToTrue(heading: number, magVar: number): number {
    return MathUtils.normalise360(heading + magVar);
  }
}
