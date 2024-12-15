// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_TABLE1502_A380X_HPP
#define FLYBYWIRE_AIRCRAFT_TABLE1502_A380X_HPP

#include <cmath>

#include "Fadec.h"

/**
 * @class Table1502_A380X
 *
 * This class contains methods and data used in the calculation of the corrected fan speed (CN1 and CN3).
 * The class has a 2D array `table` that contains values used in the calculation of the corrected fan speed.
 * Each row in the `table` represents a set of values. The columns represent different parameters used in the calculation.
 * The class also has two static methods `iCN3` and `iCN1` that calculate the corrected fan speed (CN3 and CN1) respectively.
 *
 * TODO: extract the reusable code to a common library
 */
class Table1502_A380X {
  /**
   * @brief Table 1502 (CN3 vs correctedN1) representations with FSX nomenclature.
   *
   * This table represents the relationship between CN3 and correctedN1 in the FSX nomenclature.
   * Each row in the table represents a different state of the engine, with the first column being the CN3 value,
   * the second and third columns being the lower and upper bounds of the correctedN1 value at Mach 0.2,
   * and the fourth column being the correctedN1 value at Mach 0.9.
   *
   * @return A 2D array representing the CN2 - correctedN1 pairs.
   */
  static constexpr double table1502[13][4] = {
      {16.012,  0.000,   0.000,   17.000 }, // CN3 = 16.012, correctedN1 = [0.00, 0.00] at Mach 0.2, correctedN1 = 17.00 at Mach 0.9
      {19.355,  1.6253,  1.6253,  17.345 },
      {22.874,  2.1385,  2.1385,  18.127 },
      {50.147,  10.949,  10.949,  26.627 },
      {60.000,  16.299,  16.299,  33.728 },
      {67.742,  22.240,  22.240,  40.082 },
      {73.021,  26.877,  26.877,  43.854 },
      {78.299,  35.047,  35.047,  48.899 },
      {81.642,  43.625,  43.625,  53.557 },
      {85.337,  63.107,  63.107,  63.107 },
      {87.977,  74.757,  74.757,  74.757 },
      {97.800,  97.200,  97.200,  97.200 },
      {118.000, 115.347, 115.347, 115.347}
  };

 public:
  /**
   * @brief Calculates the expected CN3 at idle.
   *
   * @param pressureAltitude The pressure altitude in feet.
   * @param mach The Mach number.
   * @return The calculated expected CN2 at idle in percent.
   */
  static double iCN3(double pressureAltitude, double mach) {
    // The specific values are likely derived from empirical data or a mathematical model of the engine's behavior.
    // The original source code does not provide any information on the origin of these values.
    return 63 / ((std::sqrt)((288.15 - (1.98 * pressureAltitude / 1000)) / 288.15) * (std::sqrt)(1 + (0.2 * (std::pow)(mach, 2))));
  }

  /**
   * @brief Calculates the corrected fan speed (CN1).
   *
   * @param pressureAltitude The pressure altitude in feet.
   * @param mach The Mach number.
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @return The calculated corrected fan speed (CN1).
   */
  static double iCN1(double pressureAltitude, double mach, [[maybe_unused]] double ambientTemp) {
    // Calculate the expected CN3 value
    const double cn3 = iCN3(pressureAltitude, mach);

    // Find the row in the table that contains the CN3 value and store the index in i
    int i = 0;
    while (table1502[i][0] <= cn3 && i < 13) {
      i++;
    }

    // Retrieve the lower and upper bounds of the CN3 value and the correctedN1 value at Mach 0.2 and Mach 0.9
    const double cn3lo   = table1502[i - 1][0];
    const double cn3hi   = table1502[i][0];
    const double cn1lolo = table1502[i - 1][1];
    const double cn1hilo = table1502[i][1];
    const double cn1lohi = table1502[i - 1][3];
    const double cn1hihi = table1502[i][3];

    // Interpolate the correctedN1 value based on the CN3 value and the Mach number
    const double cn1_lo = Fadec::interpolate(cn3, cn3lo, cn3hi, cn1lolo, cn1hilo);
    const double cn1_hi = Fadec::interpolate(cn3, cn3lo, cn3hi, cn1lohi, cn1hihi);

    return Fadec::interpolate(mach, 0.2, 0.9, cn1_lo, cn1_hi);
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_TABLE1502_A380X_HPP
