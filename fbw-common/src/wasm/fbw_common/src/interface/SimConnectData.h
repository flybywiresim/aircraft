#pragma once

#include <cstdint>

enum TerrOnNdThresholdMode : std::uint8_t { PEAKS_MODE = 0, WARNING = 1, CAUTION = 2 };

struct TerrOnNdMetadata {
  std::uint16_t imageWidth;
  std::uint16_t imageHeight;
  std::int16_t lowerThreshold;
  std::uint8_t lowerThresholdMode;
  std::int16_t upperThreshold;
  std::uint8_t upperThresholdMode;
  std::uint32_t frameByteCount;
} __attribute__((packed));
