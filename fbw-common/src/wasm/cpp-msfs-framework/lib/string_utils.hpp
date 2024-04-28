// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP
#define FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP

#include <algorithm>
#include <iomanip>
#include <sstream>
#include <string>
#include <string_view>

namespace helper {

/**
 * @brief Helper class for string operations.
 */
class StringUtils {
 public:
  /**
   * @brief This function is used to format a number by inserting a thousands separator.
   *
   * @tparam T This template parameter represents the type of the number. It should be an integral type.
   * @param n This is the number that will be formatted. It should be of type T.
   * @param separator This is the character that will be used as the thousands separator. It is optional and defaults to a comma (',').
   * @return This function returns a new string. The string is a representation of the input number 'n', but with the specified thousands
   * separator inserted at every thousandth place.
   *
   * @note The function uses the std::to_string function to convert the number to a string.
   *       It then iterates over the string in reverse, inserting the separator at every thousandth place.
   *       The function can handle both positive and negative input numbers.
   */
  template <typename T>
  static inline std::string insertThousandsSeparator(T n, const std::string_view separator = ",") {
    static_assert(std::is_integral<T>::value, "T must be an integral type");

    // Handle negative numbers
    bool isNegative = false;
    if (n < 0) {
      isNegative = true;
      n = -n;  // Make the number positive for processing
    }

    std::string s = std::to_string(n);
    const int len = s.length();
    const int numCommas = (len - 1) / 3;
    s.reserve(len + numCommas);
    for (int i = len - 4; i >= 0; i -= 3) {
      s.insert(i + 1, separator);
    }

    // Add the negative sign back if the original number was negative
    if (isNegative) {
      s.insert(0, "-");
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
  static inline std::string to_string_with_zero_padding(const T& value, std::size_t total_length) {
    bool isNegative = value < 0;
    T    absValue   = isNegative ? -value : value;

    std::string str = std::to_string(absValue);
    if (str.length() >= total_length) {
      return isNegative ? "-" + str : str;
    }

    std::ostringstream oss;
    oss << std::setw(total_length) << std::setfill('0') << absValue;

    return isNegative ? "-" + oss.str() : oss.str();
  }

  // splits a string or string view into a vector of parts at each delimiter
  /**
   * @brief splits a string or string view into a vector of parts at each delimiter
   * @tparam StringType
   * @param str the string to split
   * @param container the container to store the split parts
   * @param delims the delimiters to split the string at (default is " ")
   */
  template <typename StringType>
  static inline void splitFast(const StringType& str, std::vector<StringType>& container, const std::string& delims = " ") {
    for (auto first = str.data(), second = str.data(), end = first + str.size(); second != end && first != end; first = second + 1) {
      second = std::find_first_of(first, end, std::cbegin(delims), std::cend(delims));
      if (first != second) {
        container.emplace_back(first, second - first);
      }
    }
  }

  /**
   * @brief Removes whitespace characters from beginning and end of string s<br/>
   *          Whitespaces are defined as:   ' ',  '\\t', '\\n', '\\v', '\\f', '\\r'
   * @tparam StringType std::string or std::string_view
   * @param s the string to trim
   * @return StringType the trimmed string
   */
  template <typename StringType>
  static inline StringType trimFast(const StringType& s) {
    const int l = static_cast<int>(s.length());
    int       a = 0, b = l - 1;
    char      c;
    while (a < l && ((c = s[a]) == ' ' || c == '\t' || c == '\n' || c == '\v' || c == '\f' || c == '\r')) {
      a++;
    }
    while (b > a && ((c = s[b]) == ' ' || c == '\t' || c == '\n' || c == '\v' || c == '\f' || c == '\r')) {
      b--;
    }
    return s.substr(a, 1 + b - a);
  }

  /**
   * @brief removes trailing parts of a string after a given commentMarker
   * @tparam StringType std::string or std::string_view
   * @param s the string to remove trailing comments from
   * @param commentMarker the comment marker to search for
   * @return StringType the string with trailing comments removed
   */
  template <typename StringType>
  static inline StringType removeTrailingComments(const StringType& s, const std::string& commentMarker) {
    const auto pos = s.find(commentMarker);
    if (pos != StringType::npos) {
      return s.substr(0, pos);
    }
    return s;
  }

  /**
   * @brief transforms the given string to lower case
   * @param s the string to transform
   * @return std::string the transformed string
   */
  static inline std::string toLowerCase(const std::string& s) {
    std::string str(s);
    std::transform(str.begin(), str.end(), str.begin(), [](unsigned char c) { return char(std::tolower(c)); });
    return str;
  }

  /**
   * @brief transforms the given string to lower case in place
   * @param str the string to transform in place
   */
  static inline void toLowerCase(std::string& str) {
    std::transform(str.begin(), str.end(), str.begin(), [](unsigned char c) { return char(std::tolower(c)); });
  }

  /**
   * @brief transforms the given string to upper case
   * @param s the string to transform
   * @return std::string the transformed string
   */
  static inline std::string toUpperCase(const std::string& s) {
    std::string str(s);
    std::transform(str.begin(), str.end(), str.begin(), [](unsigned char c) { return char(std::toupper(c)); });
    return str;
  }

  /**
   * @brief transforms the given string to upper case in place
   * @param str the string to transform in place
   */
  static inline void toUpperCase(std::string& str) {
    std::transform(str.begin(), str.end(), str.begin(), [](unsigned char c) { return char(std::toupper(c)); });
  }
};

}  // namespace helper

#endif  // FLYBYWIRE_AIRCRAFT_STRING_UTILS_HPP
