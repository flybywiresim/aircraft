// Copyright (c) 2022 FlyByWire Simulations
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
   * Fowler-Noll-Vo hash function
   * @tparam T the type of the values in the provided vector
   * @param vec the vector of values to hash
   * @return the hash value
   */
  template<typename T>
  static uint64_t fingerPrintFVN(const std::vector<T>& vec) {
    const uint64_t FNV_OFFSET_BASIS = 0xcbf29ce484222325;
    const uint64_t FNV_PRIME = 0x100000001b3;
    uint64_t fp = 0;
    for (const auto& elem : vec) {
      const T &value = elem;
      uint64_t hash = FNV_OFFSET_BASIS;
      const unsigned char* bytes = reinterpret_cast<const unsigned char*>(&value);
      for (size_t i = 0; i < sizeof(T); i++) {
        hash ^= static_cast<uint64_t>(bytes[i]);
        hash *= FNV_PRIME;
      }
      uint64_t h = hash;
      fp ^= h;
      fp *= FNV_PRIME;
    }
    return fp;
  }
};

}  // namespace helper

#endif  // FLYBYWIRE_MATH_UTILS_H
