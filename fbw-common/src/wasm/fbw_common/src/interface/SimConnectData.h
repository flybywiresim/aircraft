#pragma once

#include <cstdint>

#include "../types/Arinc429.h"

struct EgpwcSimulatorData {
  Arinc429NumericWord destinationLatitude;
  Arinc429NumericWord destinationLongitude;
  Arinc429NumericWord presentLatitude;
  Arinc429NumericWord presentLongitude;
  Arinc429NumericWord altitude;
  Arinc429NumericWord heading;
  Arinc429NumericWord verticalSpeed;
  bool gearIsDown;
  std::uint16_t ndRangeCapt;
  std::uint8_t ndModeCapt;
  bool ndTerrainOnNdActiveCapt;
  std::uint16_t ndRangeFO;
  std::uint8_t ndModeFO;
  bool ndTerrainOnNdActiveFO;
};

struct AircraftStatusData {
  std::uint8_t adiruValid;
  float latitude;
  float longitude;
  std::int16_t altitude;
  std::int16_t heading;
  std::int16_t verticalSpeed;
  std::uint8_t gearIsDown;
  std::uint8_t destinationValid;
  float destinationLatitude;
  float destinationLongitude;
  std::int16_t ndRangeCapt;
  std::uint8_t ndModeCapt;
  std::uint8_t ndTerrainOnNdActiveCapt;
  float ndTerrainOnNdPotentiometerCapt;
  std::int16_t ndRangeFO;
  std::uint8_t ndModeFO;
  std::uint8_t ndTerrainOnNdActiveFO;
  float ndTerrainOnNdPotentiometerFO;
  std::uint8_t ndTerrainOnNdRenderingMode;
} __attribute__((packed));

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
