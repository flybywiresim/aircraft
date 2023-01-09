// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_MATH_UTILS_H
#define FLYBYWIRE_MATH_UTILS_H

#include <limits>
#include <cmath>

namespace helper {

  class Math {
  public:
    /**
     * @brief Compares if two floating numbers are equal
     * @param value0 The first comparable value
     * @param value1 The second comparable value
     * @param epsilon The epsilon which defines both values as equal
     * @return true if the difference between both values is smaller or equal the epsilon
     * @return false if the difference between both values is greater the epsilon
     */
    static bool almostEqual(float value0, float value1,
                            float epsilon = std::numeric_limits<float>::epsilon()) {
      return std::abs(value0 - value1) <= epsilon;
    }

    /**
     * @brief Compares if two floating numbers are equal
     * @param value0 The first comparable value
     * @param value1 The second comparable value
     * @param epsilon The epsilon which defines both values as equal
     * @return true if the difference between both values is smaller or equal the epsilon
     * @return false if the difference between both values is greater the epsilon
     */
    static bool almostEqual(double value0, double value1,
                            double epsilon = std::numeric_limits<double>::epsilon()) {
      return std::abs(value0 - value1) <= epsilon;
    }
  };

}  // namespace helper

#endif //FLYBYWIRE_MATH_UTILS_H
