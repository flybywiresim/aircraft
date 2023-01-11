#pragma once

#include <SimConnect.h>
#include <cstdint>

namespace types {

struct SimulatorData {
  double latitude;
  double longitude;
  double potentiometerLeft;
  double potentiometerRight;
} __attribute__((packed));

struct AircraftStatusData {
  std::uint8_t adiruValid;
  float latitude;
  float longitude;
  std::int32_t altitude;
  std::int16_t heading;
  std::int16_t verticalSpeed;
  std::uint8_t gearIsDown;
  std::uint8_t destinationValid;
  float destinationLatitude;
  float destinationLongitude;
  std::uint16_t ndRangeCapt;
  std::uint8_t ndArcModeCapt;
  std::uint8_t ndTerrainOnNdActiveCapt;
  std::uint16_t ndRangeFO;
  std::uint8_t ndArcModeFO;
  std::uint8_t ndTerrainOnNdActiveFO;
  std::uint8_t ndTerrainOnNdRenderingMode;
  float groundTruthLatitude;
  float groundTruthLongitude;
} __attribute__((packed));

enum ThresholdMode : std::uint8_t { PEAKS_MODE = 0, WARNING = 1, CAUTION = 2 };

struct ThresholdData {
  std::int16_t lowerThreshold;
  std::uint8_t lowerThresholdMode;
  std::int16_t upperThreshold;
  std::uint8_t upperThresholdMode;
  std::uint32_t frameByteCount;
} __attribute__((packed));

struct FrameData {
  std::uint8_t data[SIMCONNECT_CLIENTDATA_MAX_SIZE];
} __attribute__((packed));

}  // namespace types
