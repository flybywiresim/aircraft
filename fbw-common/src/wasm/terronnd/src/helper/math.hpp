#pragma once

#include <cmath>

namespace helper {

class Math {
 public:
  /**
   * @brief Compares if two floating numbers are equal
   * @param value0 The first comparable value
   * @param value1 The second comparable value
   * @param threshold The threshold which defines both values as equal
   * @return true if the difference between both values is smaller or equal the threshold
   * @return false if the difference between both values is greater the threshold
   */
  static bool almostEqual(float value0, float value1, float threshold = 1e-4f) { return std::abs(value0 - value1) <= threshold; }
  /**
   * @brief Compares if two floating numbers are equal
   * @param value0 The first comparable value
   * @param value1 The second comparable value
   * @param threshold The threshold which defines both values as equal
   * @return true if the difference between both values is smaller or equal the threshold
   * @return false if the difference between both values is greater the threshold
   */
  static bool almostEqual(double value0, double value1, double threshold = 1e-4) { return std::abs(value0 - value1) <= threshold; }
};

}  // namespace helper
