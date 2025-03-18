// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { UpdateThrottler } from '@flybywiresim/fbw-sdk';
import * as math from 'mathjs';

export class A32NX_Util {
  public static createDeltaTimeCalculator(startTime = Date.now()) {
    let lastTime = startTime;

    return () => {
      const nowTime = Date.now();
      const deltaTime = nowTime - lastTime;
      lastTime = nowTime;

      return deltaTime;
    };
  }

  public static createFrameCounter(interval = 5) {
    let count = 0;
    return () => {
      const c = count++;
      if (c == interval) {
        count = 0;
      }
      return c;
    };
  }

  public static createMachine(machineDef) {
    const machine = {
      value: machineDef.init,
      action(event) {
        const currStateDef = machineDef[machine.value];
        const destTransition = currStateDef.transitions[event];
        if (!destTransition) {
          return;
        }
        const destState = destTransition.target;

        machine.value = destState;
      },
      setState(newState) {
        const valid = machineDef[newState];
        if (valid) {
          machine.value = newState;
        }
      },
    };
    return machine;
  }

  /**
   * Compute a true heading from a magnetic heading
   * @param {Number} heading true heading
   * @param {Number=} magVar falls back to current aircraft position magvar
   * @returns magnetic heading
   */
  public static trueToMagnetic(heading: number, magVar?: number) {
    return (720 + heading - (magVar || SimVar.GetSimVarValue('MAGVAR', 'degree'))) % 360;
  }

  /**
   * Compute a magnetic heading from a true heading
   * @param {Number} heading magnetic heading
   * @param {Number=} magVar falls back to current aircraft position magvar
   * @returns true heading
   */
  public static magneticToTrue(heading: number, magVar: number) {
    return (720 + heading + (magVar || SimVar.GetSimVarValue('MAGVAR', 'degree'))) % 360;
  }

  /**
   * Takes a LatLongAlt or LatLong and returns a vector of spherical co-ordinates
   * @param {(LatLong | LatLongAlt)} ll
   */
  public static latLonToSpherical(ll) {
    return [
      Math.cos(ll.lat * Avionics.Utils.DEG2RAD) * Math.cos(ll.long * Avionics.Utils.DEG2RAD),
      Math.cos(ll.lat * Avionics.Utils.DEG2RAD) * Math.sin(ll.long * Avionics.Utils.DEG2RAD),
      Math.sin(ll.lat * Avionics.Utils.DEG2RAD),
    ];
  }

  /**
   * Takes a vector of spherical co-ordinates and returns a LatLong
   * @param {[x: number, y: number, z: number]} s
   * @returns {LatLong}
   */
  public static sphericalToLatLon(s) {
    return new LatLong(Math.asin(s[2]) * Avionics.Utils.RAD2DEG, Math.atan2(s[1], s[0]) * Avionics.Utils.RAD2DEG);
  }

  /**
   * Computes the intersection point of two (true) bearings on a great circle
   * @param {(LatLong | LatLongAlt)} latlon1
   * @param {number} brg1
   * @param {(LatLong | LatLongAlt)} latlon2
   * @param {number} brg2
   * @returns {LatLong}
   */
  public static greatCircleIntersection(latlon1, brg1, latlon2, brg2) {
    // c.f. https://blog.mbedded.ninja/mathematics/geometry/spherical-geometry/finding-the-intersection-of-two-arcs-that-lie-on-a-sphere/
    const Pa11 = A32NX_Util.latLonToSpherical(latlon1);
    const latlon12 = Avionics.Utils.bearingDistanceToCoordinates(brg1 % 360, 100, latlon1.lat, latlon1.long);
    const Pa12 = A32NX_Util.latLonToSpherical(latlon12);
    const Pa21 = A32NX_Util.latLonToSpherical(latlon2);
    const latlon22 = Avionics.Utils.bearingDistanceToCoordinates(brg2 % 360, 100, latlon2.lat, latlon2.long);
    const Pa22 = A32NX_Util.latLonToSpherical(latlon22);

    const N1 = math.cross(Pa11, Pa12);
    const N2 = math.cross(Pa21, Pa22);

    const L = math.cross(N1, N2);
    const l = math.norm(L);

    const I1 = math.divide(L, l);
    const I2 = math.multiply(I1, -1);

    const s1 = A32NX_Util.sphericalToLatLon(I1);
    const s2 = A32NX_Util.sphericalToLatLon(I2);

    const brgTos1 = Avionics.Utils.computeGreatCircleHeading(latlon1, s1);
    const brgTos2 = Avionics.Utils.computeGreatCircleHeading(latlon1, s2);

    const delta1 = Math.abs(brg1 - brgTos1);
    const delta2 = Math.abs(brg1 - brgTos2);

    return delta1 < delta2 ? s1 : s2;
  }

  public static bothGreatCircleIntersections(latlon1, brg1, latlon2, brg2) {
    // c.f. https://blog.mbedded.ninja/mathematics/geometry/spherical-geometry/finding-the-intersection-of-two-arcs-that-lie-on-a-sphere/
    const Pa11 = A32NX_Util.latLonToSpherical(latlon1);
    const latlon12 = Avionics.Utils.bearingDistanceToCoordinates(brg1 % 360, 100, latlon1.lat, latlon1.long);
    const Pa12 = A32NX_Util.latLonToSpherical(latlon12);
    const Pa21 = A32NX_Util.latLonToSpherical(latlon2);
    const latlon22 = Avionics.Utils.bearingDistanceToCoordinates(brg2 % 360, 100, latlon2.lat, latlon2.long);
    const Pa22 = A32NX_Util.latLonToSpherical(latlon22);

    const N1 = math.cross(Pa11, Pa12);
    const N2 = math.cross(Pa21, Pa22);

    const L = math.cross(N1, N2);
    const l = math.norm(L);

    const I1 = math.divide(L, l);
    const I2 = math.multiply(I1, -1);

    const s1 = A32NX_Util.sphericalToLatLon(I1);
    const s2 = A32NX_Util.sphericalToLatLon(I2);

    return [s1, s2];
  }

  /**
   * Returns the ISA temperature for a given altitude
   * @param alt {number} altitude in ft
   * @returns {number} ISA temp in C°
   */
  public static getIsaTemp(alt = Simplane.getAltitude()) {
    return Math.min(alt, 36089) * -0.0019812 + 15;
  }

  /**
   * Returns the deviation from ISA temperature and OAT at given altitude
   * @param alt {number} altitude in ft
   * @returns {number} ISA temp deviation from OAT in C°
   */
  public static getIsaTempDeviation(alt = Simplane.getAltitude(), sat = Simplane.getAmbientTemperature()) {
    return sat - A32NX_Util.getIsaTemp(alt);
  }

  /**
   * Get the magvar to use for radials from a wp.
   * @param {VhfNavaid} facility The waypoint.
   */
  public static getRadialMagVar(facility) {
    if (facility.subSectionCode === 0 /* VhfNavaid */) {
      if (facility.stationDeclination !== undefined) {
        return facility.stationDeclination;
      }
    }

    return Facilities.getMagVar(facility.location.lat, facility.location.long);
  }

  public static meterToFeet(meterValue: number): number {
    return meterValue / 0.3048;
  }

  /** @deprecated Use UpdateThrottler directly! */
  public static UpdateThrottler = UpdateThrottler;
}
