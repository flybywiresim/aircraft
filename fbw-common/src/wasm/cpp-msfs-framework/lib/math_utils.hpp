// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_MATH_UTILS_H
#define FLYBYWIRE_MATH_UTILS_H

#include <cmath>
#include <limits>
#include <type_traits>

namespace helper {

class Math {
 public:
  /**
   * Compares if two floating numbers are equal
   * @tparam T The type of the values. Must be a floating point type.
   * @param value0 The first comparable value
   * @param value1 The second comparable value
   * @param epsilon The epsilon which defines both values as equal
   * @return true if the difference between both values is smaller or equal the epsilon
   * @return false if the difference between both values is greater the epsilon
   */
  template <typename T>
  static bool almostEqual(T value0, T value1, T epsilon = std::numeric_limits<T>::epsilon()) {
    static_assert(std::is_floating_point_v<T>, "T must be a floating point type");
    return std::abs(value0 - value1) <= epsilon;
  }

  /**
   * Adds two angles with wrap around to result in 0-360°
   * @param a - positive or negative angle
   * @param b - positive or negative angle
   */
  static double angleAdd(double a, double b) {
    double r = a + b;
    r        = fmod(fmod(r, 360.0) + 360.0, 360.0);
    return r;
  }

  /**
   * Returns the signum (sign) of the given value.
   * @tparam T
   * @param val
   * @return sign of value or 0 when value==0
   */
  template <class T>
  static inline int sign(T x) {
    return (x > 0) ? 1 : ((x < 0) ? -1 : 0);
  }
};

}  // namespace helper

#endif  // FLYBYWIRE_MATH_UTILS_H
