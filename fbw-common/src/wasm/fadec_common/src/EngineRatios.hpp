// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINERATIOS_HPP
#define FLYBYWIRE_AIRCRAFT_ENGINERATIOS_HPP

#include <cmath>

#include <MSFS/Legacy/gauges.h>

/**
 * @class EngineRatios
 * @brief A class that provides methods for calculating various engine performance ratios.
 */
class EngineRatios {
 public:
  /**
   * @brief Calculates the ratio of the ambient temperature to the standard temperature at sea level.
   *
   * This function calculates the ratio of the ambient temperature (in degrees Celsius) to the standard
   * temperature at sea level (15 degrees Celsius).
   * The result is dimensionless and is used in various aerodynamic and engine performance calculations.
   *
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @return The ratio of the ambient temperature to the standard temperature at sea level in degrees Celsius.
   */
  static FLOAT64 theta(double ambientTemp) { return (273.15 + ambientTemp) / 288.15; }

  /**
   * @brief Calculates the ratio of the ambient pressure to the standard pressure at sea level.
   *
   * This function calculates the ratio of the ambient pressure (in hPa) to the standard pressure at
   * sea level (1013 hPa).
   * The result is dimensionless and is used in various aerodynamic and engine performance calculations.
   *
   * @param ambientPressure The ambient pressure in hPa.
   * @return The ratio of the ambient pressure to the standard pressure at sea level in hPa.
   */
  static FLOAT64 delta(double ambientPressure) { return ambientPressure / 1013.0; }

  /**
   * @brief Calculates the ratio of the total temperature to the standard temperature at sea level,
   *        accounting for the effects of Mach number.
   *
   * This function calculates the ratio of the total temperature (in degrees Celsius) to the standard
   * temperature at sea level (15 degrees Celsius),
   * accounting for the effects of Mach number. The result is dimensionless and is used in various
   * aerodynamic and engine performance calculations.
   *
   * @param mach The Mach number.
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @return The ratio of the total temperature to the standard temperature at sea level, accounting
   *         for the effects of Mach number.
   */
  static FLOAT64 theta2(double mach, double ambientTemp) { return theta(ambientTemp) * (1 + 0.2 * (std::pow)(mach, 2)); }

  /**
   * @brief Calculates the ratio of the total pressure to the standard pressure at sea level,
   * accounting for the effects of Mach number.
   *
   * This function calculates the ratio of the total pressure (in hPa) to the standard pressure at
   * sea level (1013 hPa), accounting for the effects of Mach number. The result is dimensionless and
   * is used in various aerodynamic and engine performance calculations.
   *
   * @param mach The Mach number.
   * @param ambientPressure The ambient pressure in hPa.
   * @return The ratio of the total pressure to the standard pressure at sea level, accounting for the effects of Mach number.
   */
  static FLOAT64 delta2(double mach, double ambientPressure) {
    return delta(ambientPressure) * (std::pow)((1 + 0.2 * (std::pow)(mach, 2)), 3.5);
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINERATIOS_HPP
