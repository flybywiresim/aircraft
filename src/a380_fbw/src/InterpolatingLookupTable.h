#pragma once

#include <utility>
#include <vector>

class InterpolatingLookupTable {
 public:
  InterpolatingLookupTable() = default;

  void initialize(std::vector<std::pair<double, double>> mapping, double minimum, double maximum);

  double get(double value);

 private:
  std::vector<std::pair<double, double>> mappingTable;
  double mappingMinimum = 0;
  double mappingMaximum = 0;
};
