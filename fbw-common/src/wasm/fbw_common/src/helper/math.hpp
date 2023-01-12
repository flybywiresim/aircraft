#pragma once

#include <cmath>

namespace helper {

class Math {
 public:
  static bool almostEqual(float value0, float value1, float threshold = 1e-4f) { return std::abs(value0 - value1) <= threshold; }
  static bool almostEqual(double value0, double value1, double threshold = 1e-4) { return std::abs(value0 - value1) <= threshold; }
};

}  // namespace helper
