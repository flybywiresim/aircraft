#pragma once

#include <SimConnect.h>
#include <cstdint>

namespace types {

/**
 * @brief Definition of the simulator object for the collection
 */
struct SimulatorData {
  double latitude;
  double longitude;
  double potentiometerLeft;
  double potentiometerRight;
} __attribute__((packed));

/**
 * @brief Client data area block that is sent to the SimBridge
 */
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
  std::uint8_t efisModeCapt;
  std::uint16_t ndRangeFO;
  std::uint8_t ndArcModeFO;
  std::uint8_t ndTerrainOnNdActiveFO;
  std::uint8_t efisModeFO;
  std::uint8_t ndTerrainOnNdRenderingMode;
  float groundTruthLatitude;
  float groundTruthLongitude;
} __attribute__((packed));

enum ThresholdMode : std::uint8_t { PEAKS_MODE = 0, WARNING = 1, CAUTION = 2 };

/**
 * @brief The threshold data that is received from the SimBridge for a new frame
 */
struct ThresholdData {
  std::int16_t lowerThreshold;
  std::uint8_t lowerThresholdMode;
  std::int16_t upperThreshold;
  std::uint8_t upperThresholdMode;
  std::uint8_t firstFrame;
  std::uint16_t displayRange;
  std::uint8_t displayMode;
  std::uint32_t frameByteCount;
} __attribute__((packed));

}  // namespace types
