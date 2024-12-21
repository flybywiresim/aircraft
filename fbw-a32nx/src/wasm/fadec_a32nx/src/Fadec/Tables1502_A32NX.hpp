// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_TABLES1502_A32NX_HPP
#define FLYBYWIRE_AIRCRAFT_TABLES1502_A32NX_HPP

#include <cmath>

#include "Fadec.h"

/**
 * @class Table1502_A32NX
 *
 * This class contains methods and data used in the calculation of the corrected fan speed (CN1 and CN2).
 * The class has a 2D array `table` that contains values used in the calculation of the corrected fan speed.
 * Each row in the `table` represents a set of values. The columns represent different parameters used in the calculation.
 * The class also has two static methods `iCN3` and `iCN1` that calculate the corrected fan speed (CN2 and CN1) respectively.
 *
 * TODO: extract the reusable code to a common library
 */
class Tables1502_A32NX {
  /**
   * @brief Table 1502 (CN2 vs correctedN1) representations with FSX nomenclature.
   *
   * This table represents the relationship between CN2 and correctedN1 in the FSX nomenclature.
   * Each row in the table represents a different state of the engine, with the first column being the CN2 value,
   * the second and third columns being the lower and upper bounds of the correctedN1 value at Mach 0.2,
   * and the fourth column being the correctedN1 value at Mach 0.9.
   *
   * @return A 2D array representing the CN2 - correctedN1 pairs.
   */
  static constexpr double table1502[13][4] = {
      {18.20,  0.00,   0.00,   17.00 }, // CN2 = 18.20, correctedN1 = [0.00, 0.00] at Mach 0.2, correctedN1 = 17.00 at Mach 0.9
      {22.00,  1.90,   1.90,   17.40 }, // CN2 = 22.00, correctedN1 = [1.90, 1.90] at Mach 0.2, correctedN1 = 17.40 at Mach 0.9
      {26.00,  2.50,   2.50,   18.20 }, // CN2 = 26.00, correctedN1 = [2.50, 2.50] at Mach 0.2, correctedN1 = 18.20 at Mach 0.9
      {57.00,  12.80,  12.80,  27.00 }, // CN2 = 57.00, correctedN1 = [12.80, 12.80] at Mach 0.2, correctedN1 = 27.00 at Mach 0.9
      {68.20,  19.60,  19.60,  34.83 }, // CN2 = 68.20, correctedN1 = [19.60, 19.60] at Mach 0.2, correctedN1 = 34.83 at Mach 0.9
      {77.00,  26.00,  26.00,  40.84 }, // CN2 = 77.00, correctedN1 = [26.00, 26.00] at Mach 0.2, correctedN1 = 40.84 at Mach 0.9
      {83.00,  31.42,  31.42,  44.77 }, // CN2 = 83.00, correctedN1 = [31.42, 31.42] at Mach 0.2, correctedN1 = 44.77 at Mach 0.9
      {89.00,  40.97,  40.97,  50.09 }, // CN2 = 89.00, correctedN1 = [40.97, 40.97] at Mach 0.2, correctedN1 = 50.09 at Mach 0.9
      {92.80,  51.00,  51.00,  55.04 }, // CN2 = 92.80, correctedN1 = [51.00, 51.00] at Mach 0.2, correctedN1 = 55.04 at Mach 0.9
      {97.00,  65.00,  65.00,  65.00 }, // CN2 = 97.00, correctedN1 = [65.00, 65.00] at Mach 0.2, correctedN1 = 65.00 at Mach 0.9
      {100.00, 77.00,  77.00,  77.00 }, // CN2 = 100.00, correctedN1 = [77.00, 77.00] at Mach 0.2, correctedN1 = 77.00 at Mach 0.9
      {104.00, 85.00,  85.00,  85.50 }, // CN2 = 104.00, correctedN1 = [85.00, 85.00] at Mach 0.2, correctedN1 = 85.50 at Mach 0.9
      {116.50, 101.00, 101.00, 101.00}  // CN2 = 116.50, correctedN1 = [101.00, 101.00] at Mach 0.2, correctedN1 = 101.00 at Mach 0.9
  };

 public:
  /**
   * @brief Calculates the expected CN2 at idle.
   *
   * @param pressureAltitude The pressure altitude in feet.
   * @param mach The Mach number.
   * @return The expected CN2 value at idle in percent.
   */
  static double iCN2(double pressureAltitude, double mach) {
    // The specific values are likely derived from empirical data or a mathematical model of the engine's behavior.
    // The original source code does not provide any information on the origin of these values.
    return 68.2 / ((std::sqrt)((288.15 - (1.98 * pressureAltitude / 1000)) / 288.15) * (std::sqrt)(1 + (0.2 * (std::pow)(mach, 2))));
  }

  /**
   * @brief Calculates the expected CN1 at idle.
   *
   * @param pressureAltitude The pressure altitude in feet.
   * @param mach The Mach number.
   * @param ambientTemp The ambient temperature in Kelvin.
   * @return The expected CN1 value at idle.
   */
  static double iCN1(double pressureAltitude, double mach, [[maybe_unused]] double ambientTemp) {
    // Calculate the expected CN2 value
    const double cn2 = iCN2(pressureAltitude, mach);

    // Find the row in the table that contains the CN2 value and store the index in i
    int i = 0;
    while (table1502[i][0] <= cn2 && i < 13) {
      i++;
    }

    // Retrieve the lower and upper bounds of the CN2 value and the correctedN1 value at Mach 0.2 and Mach 0.9
    const double cn2lo   = table1502[i - 1][0];
    const double cn2hi   = table1502[i][0];
    const double cn1lolo = table1502[i - 1][1];
    const double cn1hilo = table1502[i][1];
    const double cn1lohi = table1502[i - 1][3];
    const double cn1hihi = table1502[i][3];

    // Interpolate the correctedN1 value based on the CN2 value and the Mach number
    const double cn1_lo = Fadec::interpolate(cn2, cn2lo, cn2hi, cn1lolo, cn1hilo);
    const double cn1_hi = Fadec::interpolate(cn2, cn2lo, cn2hi, cn1lohi, cn1hihi);

    return Fadec::interpolate(mach, 0.2, 0.9, cn1_lo, cn1_hi);
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_TABLES1502_A32NX_HPP
