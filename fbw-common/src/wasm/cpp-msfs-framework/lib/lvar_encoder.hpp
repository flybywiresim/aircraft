// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_LVAR_ENCODER_HPP
#define FLYBYWIRE_AIRCRAFT_LVAR_ENCODER_HPP

#include "simple_assert.h"

/**
 * @brief Collection of static methods to encode and decode data into double values to be used in LVars.
 */
class LVarEncoder {
 public:
  /**
   * @brief Encodes 8 values into a double value. Bits from values larger than the parameter allows will be ignored.
   *
   * This method is used to encode multiple values into a single double value to be used in LVars.
   * E.g. engine imbalance, where the first parameter is the engine number and the other 7 parameters are the imbalance values.
   *
   * @param param1 int8_t value between 0-15
   * @param param2 int8_t value between 0-127
   * @param param3 int8_t value between 0-127
   * @param param4 int8_t value between 0-127
   * @param param5 int8_t value between 0-127
   * @param param6 int8_t value between 0-127
   * @param param7 int8_t value between 0-127
   * @param param8 int8_t value between 0-127
   * @return double encoded value
   *
   * @note As a double value can only hold 53 bits of precision for the integer part, the first parameter is limited to 4 bits (0-15)
   *       and the other 7 parameters are limited to 7 bits (0-127).
   */
  static double encode8Int8ToDouble(int8_t param1,
                                    int8_t param2 = 0,
                                    int8_t param3 = 0,
                                    int8_t param4 = 0,
                                    int8_t param5 = 0,
                                    int8_t param6 = 0,
                                    int8_t param7 = 0,
                                    int8_t param8 = 0) {
    SIMPLE_ASSERT(param1 >= 0 && param1 <= 15, "First parameter must be between 0-15");
    SIMPLE_ASSERT(param2 >= 0, "Second parameter must be between 0-127");
    SIMPLE_ASSERT(param3 >= 0, "Third parameter must be between 0-127");
    SIMPLE_ASSERT(param4 >= 0, "Fourth parameter must be between 0-127");
    SIMPLE_ASSERT(param5 >= 0, "Fifth parameter must be between 0-127");
    SIMPLE_ASSERT(param6 >= 0, "Sixth parameter must be between 0-127");
    SIMPLE_ASSERT(param7 >= 0, "Seventh parameter must be between 0-127");
    SIMPLE_ASSERT(param8 >= 0, "Eighth parameter must be between 0-127");

    int64_t encoded = 0;
    encoded |= (static_cast<int64_t>(param1) & 0x0F) << 49;
    encoded |= (static_cast<int64_t>(param2) & 0x7F) << 42;
    encoded |= (static_cast<int64_t>(param3) & 0x7F) << 35;
    encoded |= (static_cast<int64_t>(param4) & 0x7F) << 28;
    encoded |= (static_cast<int64_t>(param5) & 0x7F) << 21;
    encoded |= (static_cast<int64_t>(param6) & 0x7F) << 14;
    encoded |= (static_cast<int64_t>(param7) & 0x7F) << 7;
    encoded |= (static_cast<int64_t>(param8) & 0x7F);
    return static_cast<double>(encoded);
  }

  /**
   * @brief Extracts an integer value from a double encoded set of values.
   * @param encodedDouble double encoded with encode8Int8ToDouble
   * @param parameterIndex which parameter to extract (1-8)
   * @return int64_t extracted value
   *
   * @see encode8Int8ToDouble()
   */
  static int64_t extract8Int8FromDouble(double encodedDouble, uint8_t parameterIndex) {
    const auto encoded = static_cast<int64_t>(encodedDouble);
    if (parameterIndex == 1) {
      return (encoded >> 49) & 0x0F;  // For first parameter using only 4 bits
    }
    const int shift = (8 - parameterIndex) * 7;
    if (shift >= 0) {
      return (encoded >> shift) & 0x7F;
    } else {
      return -1;  // invalid parameter index
    }
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_LVAR_ENCODER_HPP
