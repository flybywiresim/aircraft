// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP
#define FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP

#include <string>
#include <sstream>

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

  /**
   * @brief Converts a number to a string with zero padding.
   *
   * This function takes a number and a total length as input. It converts the number to a string and
   * adds leading zeros until the string reaches the specified total length. If the number is negative,
   * the minus sign is not counted in the total length and the zeros are inserted after the minus sign.
   *
   * @tparam T The type of the number. This should be an integral type.
   * @param value The number to be converted to a string.
   * @param total_length The total length of the resulting string including the number and the leading zeros.
   * @return A string representation of the number, padded with leading zeros to reach the specified total length.
   */
template <typename T, typename = std::enable_if_t<std::is_integral_v<T>>>
std::string to_string_with_zero_padding(const T& value, std::size_t total_length) {
  std::string str = std::to_string(value);
  if (str.length() >= total_length) {
    return str;
  }
  std::ostringstream oss;
  oss << std::setw(total_length) << std::setfill('0') << value;
  return oss.str();
}

};

}  // namespace helper

#endif  // FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP
