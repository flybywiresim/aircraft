#pragma once

#include <cstdint>

enum TerrOnNdThresholdMode : std::uint8_t { PEAKS_MODE = 0, WARNING = 1, CAUTION = 2 };

struct TerrOnNdThresholds {
  std::uint16_t imageWidth;
  std::uint16_t imageHeight;
  std::int16_t lowerThreshold;
  TerrOnNdThresholdMode lowerThresholdMode;
  std::int16_t upperThreshold;
  TerrOnNdThresholdMode upperThresholdMode;
};
