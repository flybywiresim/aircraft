// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';
import { FlightModelParameters } from '@fmgc/flightplanning/AircraftConfigTypes';
import { Common, FlapConf } from './common';

export class FlightModel {
  /**
   * Get lift coefficient at given conditions
   * @param weight in pounds
   * @param mach self-explanatory
   * @param delta pressure at the altitude divided by the pressure at sea level
   * @param loadFactor g-Force
   * @returns lift coefficient (Cl)
   */
  static getLiftCoefficient(
    config: FlightModelParameters,
    weight: number,
    mach: number,
    delta: number,
    loadFactor = 1,
  ): number {
    return (weight * loadFactor) / (1481.4 * mach ** 2 * delta * config.wingArea);
  }

  static getLiftCoefficientFromEAS(config: FlightModelParameters, lift: number, eas: number): number {
    return (295.369 * lift) / (eas ** 2 * config.wingArea);
  }

  /**
   * Get drag coefficient at given conditions
   * @param Cl coefficient of lift
   * @param spdBrkDeflected whether speedbrake is deflected at half or not
   * @param gearExtended whether gear is extended or not
   * @param flapConf flap configuration
   * @returns drag coefficient (Cd)
   */
  static getDragCoefficient(
    config: FlightModelParameters,
    Cl: number,
    spdBrkDeflected = false,
    gearExtended = false,
    flapConf = FlapConf.CLEAN,
  ): number {
    const baseDrag = config.dragPolarCoefficients[flapConf].reduce((acc, curr, index) => acc + curr * Cl ** index, 0);

    const spdBrkIncrement = spdBrkDeflected ? config.speedBrakeDrag : 0;
    const gearIncrement = gearExtended ? config.gearDrag : 0;
    return baseDrag + spdBrkIncrement + gearIncrement;
  }

  /**
   * Get drag at given conditions
   * @param weight in pounds
   * @param mach self-explanatory
   * @param delta pressure at the altitude divided by the pressure at sea level
   * @param spdBrkDeflected Whether speedbrake is deflected at half or not
   * @param gearExtended whether gear is extended or not
   * @param flapConf flap configuration
   * @returns drag
   */
  static getDrag(
    config: FlightModelParameters,
    weight: number,
    mach: number,
    delta: number,
    spdBrkDeflected: boolean,
    gearExtended: boolean,
    flapConf: FlapConf,
  ): number {
    const Cl = this.getLiftCoefficient(config, weight, mach, delta);
    const Cd = this.getDragCoefficient(config, Cl, spdBrkDeflected, gearExtended, flapConf);
    const deltaCd = this.getMachCorrection(config, mach, flapConf);

    return 1481.4 * mach ** 2 * delta * config.wingArea * (Cd + deltaCd);
  }

  static getMachCorrection(config: FlightModelParameters, mach: Mach, flapConf: FlapConf): number {
    if (flapConf !== FlapConf.CLEAN) {
      return 0;
    }

    return this.interpolate(mach, config.machValues, config.dragCoefficientCorrections);
  }

  /**
   * Interpolates in a list
   * @param x The value to look up in in `xs`.
   * @param xs The table of x values with known y values
   * @param ys The y values corresponding to the x values in `xs`
   */
  static interpolate(x: number, xs: number[], ys: number[]) {
    if (x <= xs[0]) {
      return ys[0];
    }

    for (let i = 0; i < xs.length - 1; i++) {
      if (x > xs[i] && x <= xs[i + 1]) {
        return Common.interpolate(x, xs[i], xs[i + 1], ys[i], ys[i + 1]);
      }
    }

    return ys[ys.length - 1];
  }

  // NEW

  /**
   * Returns the available climb or descent gradient.
   *
   * @param thrust the thrust in lbf
   * @param drag
   * @param weight in lbs
   *
   * @returns the available gradient in radians
   */
  static getAvailableGradient(thrust: number, drag: number, weight: number): number {
    return Math.asin((thrust - drag) / weight);
  }

  /**
   * Returns an acceleration for a given available gradient, fpa and acceleration factor.
   *
   * @param availableGradient in radians
   * @param fpa in radians
   * @param accelFactor
   *
   * @returns the acceleration
   */
  static accelerationForGradient(availableGradient: Radians, fpa: number, accelFactor: number): number {
    return (Math.sin(availableGradient) - Math.sin(fpa)) * accelFactor;
  }

  /**
   * Returns an fpa for a given available gradient, acceleration and acceleration factor.
   *
   * @param availableGradient in radians
   * @param acceleration
   * @param accelFactor
   *
   * @returns the fpa in radians
   */
  static fpaForGradient(availableGradient: Radians, acceleration: number, accelFactor: number): number {
    return Math.asin(Math.sin(availableGradient) - acceleration / accelFactor);
  }

  // END NEW

  static getConstantThrustPathAngle(thrust: number, weight: number, drag: number, accelFactor: number): number {
    return Math.asin((thrust - drag) / weight / accelFactor);
  }

  static getConstantThrustPathAngleFromCoefficients(
    thrust: number,
    weight: number,
    Cl: number,
    Cd: number,
    accelFactor: number,
  ): number {
    return Math.asin((thrust / weight - Cd / Cl) / accelFactor);
  }

  static getThrustFromConstantPathAngle(fpa: number, weight: number, drag: number, accelFactor: number): number {
    // fpa is in degrees
    return weight * (accelFactor * Math.sin(fpa * MathUtils.DEGREES_TO_RADIANS)) + drag;
  }

  static getThrustFromConstantPathAngleCoefficients(
    fpa: number,
    weight: number,
    Cl: number,
    Cd: number,
    accelFactor: number,
  ): number {
    // fpa is in degrees
    return weight * (accelFactor * Math.sin(fpa * MathUtils.DEGREES_TO_RADIANS) + Cd / Cl);
  }

  static getSpeedChangePathAngle(config: FlightModelParameters, thrust: number, weight: number, drag: number): number {
    return Math.asin((thrust - drag) / weight - (1 / config.gravityConstMS2) * config.requiredAccelRateMS2);
  }

  static getSpeedChangePathAngleFromCoefficients(
    config: FlightModelParameters,
    thrust: number,
    weight: number,
    Cl: number,
    Cd: number,
  ): number {
    return Math.asin(thrust / weight - Cd / Cl - (1 / config.gravityConstMS2) * config.requiredAccelRateMS2);
  }

  static getAccelRateFromIdleGeoPath(
    config: FlightModelParameters,
    thrust: number,
    weight: number,
    drag: number,
    fpaDeg: number,
  ): number {
    // fpa is in degrees
    const fpaRad = fpaDeg * MathUtils.DEGREES_TO_RADIANS;
    return config.gravityConstKNS * ((thrust - drag) / weight - Math.sin(fpaRad));
  }

  static getAccelRateFromIdleGeoPathCoefficients(
    config: FlightModelParameters,
    thrust: number,
    weight: number,
    Cl: number,
    Cd: number,
    fpaDeg: number,
  ): number {
    // fpa is in degrees
    const fpaRad = fpaDeg * MathUtils.DEGREES_TO_RADIANS;
    return config.gravityConstKNS * (thrust / weight - Cd / Cl - Math.sin(fpaRad));
  }

  /**
   * Gets distance required to accelerate/decelerate
   * @param thrust
   * @param drag
   * @param weight in pounds
   * @param initialSpeed
   * @param targetSpeed
   * @param fpa flight path angle, default value 0 for level segments
   * @param accelFactor acceleration factor, default value 0 for level segments
   * @returns distance to accel/decel
   */
  static getAccelerationDistance(
    thrust: number,
    drag: number,
    weight: number,
    initialSpeed: number,
    targetSpeed: number,
    fpa = 0,
    accelFactor = 0,
  ): number {
    const sign = Math.sign(fpa);
    const force = thrust - drag + sign * weight * Math.sin(fpa * (Math.PI / 180)) * accelFactor;

    const accel = force / weight; // TODO: Check units
    const timeToAccel = (targetSpeed - initialSpeed) / accel;
    const distanceToAccel = initialSpeed * timeToAccel + 0.5 * accel * timeToAccel ** 2; // TODO: Check units
    return distanceToAccel;
  }

  static getGreenDotSpeedCas(altitude: number, weight: Kilograms): Knots {
    return weight / 500 + 85 + Math.max(0, (altitude - 20000) / 1000);
  }
}
