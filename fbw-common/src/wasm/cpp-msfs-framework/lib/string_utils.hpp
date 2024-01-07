// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP
#define FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP

#include <string>

namespace helper {

/**
 * @brief Helper class for string operations.
 */
class StringUtils {
public:
 /**
  * @brief Inserts a thousands separator into a number.
  * @tparam T type of the number
  * @param n the number
  * @param separator the separator to use
  * @return new string with the separator
  */
  template <typename T>
  static std::string insertThousandsSeparator(T n, const std::string_view separator = ",") {
    static_assert(std::is_integral<T>::value, "T must be an integral type");
    std::string s = std::to_string(n);
    const int len = s.length();
    const int numCommas = (len - 1) / 3;
    s.reserve(len + numCommas);
    for (int i = len - 4; i >= 0; i -= 3) {
      s.insert(i + 1, separator);
    }
    return s;
  }
};

}  // namespace helper

#endif  // FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP
