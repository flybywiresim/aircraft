// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_MATH_UTILS_H
#define FLYBYWIRE_MATH_UTILS_H

#include <limits>
#include <cmath>
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
    template<typename T>
    static bool almostEqual(T value0, T value1,
                            T epsilon = std::numeric_limits<T>::epsilon()) {
      static_assert(std::is_floating_point_v<T>, "T must be a floating point type");
      return std::abs(value0 - value1) <= epsilon;
    }
  };

}  // namespace helper

#endif //FLYBYWIRE_MATH_UTILS_H
