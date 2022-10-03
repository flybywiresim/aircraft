/// <reference types="msfstypes/Coherent/Facilities" />

import { LatLonInterface } from './GeoInterfaces';
import { NavMath } from './NavMath';

/**
 * A utility class for working with magnetic variation (magnetic declination).
 */
export class MagVar {
  /**
   * Gets the magnetic variation (magnetic declination) at a specific point on Earth. Positive values signify eastward
   * deflection, and negative values signify westward deflection.
   * @param lat The latitude of the query point.
   * @param lon The longitude of the query point.
   * @returns The magnetic variation (magnetic declination) at the point.
   */
  public static get(lat: number, lon: number): number;
  /**
   * Gets the magnetic variation (magnetic declination) at a specific point on Earth. Positive values signify eastward
   * deflection, and negative values signify westward deflection.
   * @param point The query point.
   * @returns The magnetic variation (magnetic declination) at the point.
   */
  public static get(point: LatLonInterface): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static get(arg1: number | LatLonInterface, arg2?: number): number {
    return MagVar.getMagVar(arg1, arg2);
  }

  /**
   * Converts magnetic bearing to true bearing at a specific point on Earth.
   * @param bearing A magnetic bearing.
   * @param lat The latitude of the query point.
   * @param lon The longitude of the query point.
   * @returns The true bearing equivalent of the given magnetic bearing at the specified point.
   */
  public static magneticToTrue(bearing: number, lat: number, lon: number): number;
  /**
   * Converts magnetic bearing to true bearing at a specific point on Earth.
   * @param bearing A magnetic bearing.
   * @param point The query point.
   * @returns The true bearing equivalent of the given magnetic bearing at the specified point.
   */
  public static magneticToTrue(bearing: number, point: LatLonInterface): number;
  /**
   * Converts magnetic bearing to true bearing given a specific magnetic variation (magnetic declination).
   * @param bearing A magnetic bearing.
   * @param magVar The magnetic variation.
   * @returns The true bearing equivalent of the given magnetic bearing.
   */
  public static magneticToTrue(bearing: number, magVar: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static magneticToTrue(bearing: number, arg1: number | LatLonInterface, arg2?: number): number {
    return NavMath.normalizeHeading(bearing + (typeof arg1 === 'number' && arg2 === undefined ? arg1 : MagVar.getMagVar(arg1, arg2)));
  }

  /**
   * Converts true bearing to magnetic bearing at a specific point on Earth.
   * @param bearing A true bearing.
   * @param lat The latitude of the query point.
   * @param lon The longitude of the query point.
   * @returns The magnetic bearing equivalent of the given true bearing at the specified point.
   */
  public static trueToMagnetic(bearing: number, lat: number, lon: number): number;
  /**
   * Converts true bearing to magnetic bearing at a specific point on Earth.
   * @param bearing A true bearing.
   * @param point The query point.
   * @returns The magnetic bearing equivalent of the given true bearing at the specified point.
   */
  public static trueToMagnetic(bearing: number, point: LatLonInterface): number;
  /**
   * Converts true bearing to magnetic bearing given a specific magnetic variation (magnetic declination).
   * @param bearing A true bearing.
   * @param magVar The magnetic variation.
   * @returns The magnetic bearing equivalent of the given true bearing.
   */
  public static trueToMagnetic(bearing: number, magVar: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static trueToMagnetic(bearing: number, arg1: number | LatLonInterface, arg2?: number): number {
    return NavMath.normalizeHeading(bearing - (typeof arg1 === 'number' && arg2 === undefined ? arg1 : MagVar.getMagVar(arg1, arg2)));
  }

  /**
   * Gets the magnetic variation (magnetic declination) at a specific point on Earth.
   * @param arg1 The query point, or the latitude of the query point.
   * @param arg2 The longitude of the query point.
   * @returns The magnetic variation (magnetic declination) at the point.
   */
  private static getMagVar(arg1: number | LatLonInterface, arg2?: number): number {
    if (typeof Facilities === 'undefined') {
      // In case this code is executed before the Facilities class is created.
      return 0;
    }

    let lat, lon;
    if (typeof arg1 === 'number') {
      lat = arg1;
      lon = arg2 as number;
    } else {
      lat = arg1.lat;
      lon = arg1.lon;
    }

    return Facilities.getMagVar(lat, lon);
  }
}