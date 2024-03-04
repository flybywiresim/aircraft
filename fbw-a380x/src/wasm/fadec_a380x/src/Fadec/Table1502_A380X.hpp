// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_TABLE1502_A380X_HPP
#define FLYBYWIRE_AIRCRAFT_TABLE1502_A380X_HPP

#include <cmath>

#include "Fadec.h"

class Table1502_A380X {
 private:

  // clang-format off
  static constexpr double table[13][4] = {
      {16.012, 0.000, 0.000, 17.000},
      {19.355, 1.845, 1.845, 17.345},
      {22.874, 2.427, 2.427, 18.127},
      {50.147, 12.427, 12.427, 26.627},
      {60.000, 18.500, 18.500, 33.728},
      {67.742, 25.243, 25.243, 40.082},
      {73.021, 30.505, 30.505, 43.854},
      {78.299, 39.779, 39.779, 48.899},
      {81.642, 49.515, 49.515, 53.557},
      {85.337, 63.107, 63.107, 63.107},
      {87.977, 74.757, 74.757, 74.757},
      {97.800, 97.200, 97.200, 97.200},
      {118.000, 115.347, 115.347, 115.347}
  };
  // clang-format on

  /**
   * @brief Calculates the corrected fan speed (CN3).
   *
   * This function calculates the corrected fan speed (CN3), which represents the fan speed corrected for various factors.
   * The calculation is based on the pressure altitude and Mach number.
   *
   * @param pressAltitude The pressure altitude in feet.
   * @param mach The Mach number.
   * @return The calculated corrected fan speed (CN3).
   */
  static double iCN3(double pressAltitude, double mach) {
    // Constants for the calculation
    const double baseTemperature = 288.15;
    const double altitudeFactor = 1.98;
    const double machFactor = 0.2;
    const double speedFactor = 60.0;

    // Calculate the temperature at the given pressure altitude
    double temperature = baseTemperature - (altitudeFactor * pressAltitude / 1000);

    // Calculate the corrected fan speed (CN3)
    double cn3 = speedFactor / (sqrt(temperature / baseTemperature) * sqrt(1 + (machFactor * pow(mach, 2))));

    // Return the calculated CN3 value
    return cn3;
  }

  /**
   * @brief Calculates the corrected fan speed (CN1).
   *
   * This function calculates the corrected fan speed (CN1), which represents the fan speed corrected for various factors.
   * The calculation is based on the pressure altitude, Mach number, and ambient temperature.
   *
   * @param pressAltitude The pressure altitude in feet.
   * @param mach The Mach number.
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @return The calculated corrected fan speed (CN1).
   */
  static double iCN1(double pressAltitude, double mach, [[maybe_unused]] double ambientTemp) {
    // Initialize variables
    double cn1_lo, cn1_hi, cn1;
    double cn3 = iCN3(pressAltitude, mach);
    double cell;
    double cn3lo, cn3hi;
    double cn1lolo, cn1hilo, cn1lohi, cn1hihi;

    // Find the index where the CN3 value is less than the cell value in the table
    int i;
    for (i = 0; i < 13; i++) {
      cell = table[i][0];
      if (cell > cn3) {
        break;
      }
    }

    // Get the CN3 and CN1 values from the table
    cn3lo = table[(i - 1)][0];
    cn3hi = table[i][0];
    cn1lolo = table[(i - 1)][1];
    cn1hilo = table[i][1];

    // Calculate the CN1 value based on the Mach number
    if (mach <= 0.2) {
      cn1 = Fadec::interpolate(cn3, cn3lo, cn3hi, cn1lolo, cn1hilo);
    } else {
      cn1lohi = table[(i - 1)][3];
      cn1hihi = table[i][3];
      cn1_lo = Fadec::interpolate(cn3, cn3lo, cn3hi, cn1lolo, cn1hilo);
      cn1_hi = Fadec::interpolate(cn3, cn3lo, cn3hi, cn1lohi, cn1hihi);
      cn1 = Fadec::interpolate(mach, 0.2, 0.9, cn1_lo, cn1_hi);
    }

    // Return the calculated CN1 value
    return cn1;
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_TABLE1502_A380X_HPP
