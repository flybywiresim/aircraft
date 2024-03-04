// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_H
#define FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_H

#include <string>

#define INI_SECTION_FUEL "FUEL"
#define INI_SECTION_FUEL_LEFT_OUTER_QTY "FUEL_LEFT_OUTER_QTY"
#define INI_SECTION_FUEL_FEED_ONE_QTY "FUEL_FEED_ONE_QTY"
#define INI_SECTION_FUEL_LEFT_MID_QTY "FUEL_LEFT_MID_QTY"
#define INI_SECTION_FUEL_LEFT_INNER_QTY "FUEL_LEFT_INNER_QTY"
#define INI_SECTION_FUEL_FEED_TWO_QTY "FUEL_FEED_TWO_QTY"
#define INI_SECTION_FUEL_FEED_THREE_QTY "FUEL_FEED_THREE_QTY"
#define INI_SECTION_FUEL_RIGHT_INNER_QTY "FUEL_RIGHT_INNER_QTY"
#define INI_SECTION_FUEL_RIGHT_MID_QTY "FUEL_RIGHT_MID_QTY"
#define INI_SECTION_FUEL_FEED_FOUR_QTY "FUEL_FEED_FOUR_QTY"
#define INI_SECTION_FUEL_RIGHT_OUTER_QTY "FUEL_RIGHT_OUTER_QTY"
#define INI_SECTION_FUEL_TRIM_QTY "FUEL_TRIM_QTY"

/**
 * @class FuelConfiguration
 * @brief This struct represents the fuel configuration for the aircraft.
 */
class FuelConfiguration {
  static constexpr double fuelFeedOneDefault = 1082.0;
  static constexpr double fuelFeedTwoDefault = fuelFeedOneDefault;
  static constexpr double fuelFeedThreeDefault = fuelFeedOneDefault;
  static constexpr double fuelFeedFourDefault = fuelFeedOneDefault;
  static constexpr double fuelLeftOuterDefault = 2731.0;
  static constexpr double fuelRightOuterDefault = fuelLeftOuterDefault;
  static constexpr double fuelLeftMidDefault = 9630.0;
  static constexpr double fuelRightMidDefault = fuelLeftMidDefault;
  static constexpr double fuelLeftInnerDefault = 12187.0;
  static constexpr double fuelRightInnerDefault = fuelLeftInnerDefault;
  static constexpr double fuelTrimDefault = 6259.0;

  double fuelLeftOuter;
  double fuelFeedOne;
  double fuelLeftMid;
  double fuelLeftInner;
  double fuelRightOuter;
  double fuelFeedTwo;
  double fuelRightMid;
  double fuelRightInner;
  double fuelFeedThree;
  double fuelFeedFour;
  double fuelTrim;

  std::string configFilename;

 public:
  /**
   * @brief Constructor for the FuelConfiguration class.
   *
   * This constructor initializes the FuelConfiguration object with a configuration file name.
   *
   * @param configFilename The name of the configuration file.
   */
  FuelConfiguration(std::string configFilename) : configFilename{configFilename} {}

  /**
   * @brief Loads the fuel configuration from an INI file.
   *
   * This method reads the INI file specified in the configFilename member variable and updates the fuel quantities accordingly.
   * If the INI file cannot be read, an error message is logged and the method returns without making any changes.
   */
  void loadConfigurationFromIni();

  /**
   * @brief Saves the current fuel configuration to an INI file.
   *
   * This method writes the current fuel quantities to the INI file specified in the configFilename member variable.
   * If the INI file cannot be written, an error message is logged.
   */
  void saveConfigurationToIni();
};

#endif  // FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_H
