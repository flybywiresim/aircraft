#include "InterpolatingLookupTable.h"

void InterpolatingLookupTable::initialize(std::vector<std::pair<double, double>> mapping, double minimum, double maximum) {
  mappingTable = std::move(mapping);
  mappingMinimum = minimum;
  mappingMaximum = maximum;
}

double InterpolatingLookupTable::get(double value) {
  if (mappingTable.empty()) {
    // not initialized yet
    return 0;
  }

  // iterate over values and do interpolation
  for (std::size_t i = 0; i < mappingTable.size() - 1; ++i) {
    if (mappingTable[i].first <= value && mappingTable[i + 1].first >= value) {
      // calculate differences
      double diff_x = value - mappingTable[i].first;
      double diff_n = mappingTable[i + 1].first - mappingTable[i].first;

      // interpolation
      double result = mappingTable[i].first;
      if (diff_n != 0) {
        result = mappingTable[i].second + (mappingTable[i + 1].second - mappingTable[i].second) * diff_x / diff_n;
      }

      // clip the result to minimum and maximum
      if (result < mappingMinimum) {
        return mappingMinimum;
      } else if (result > mappingMaximum) {
        return mappingMaximum;
      }

      // no clipping needed -> return result
      return result;
    }
  }

  // not in range
  return 0;
}
