// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A380X_H
#define FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A380X_H

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
 *
 * This class provides methods to load and save the fuel configuration from/to an INI file.
 * It also provides getter and setter methods for each fuel tank quantity.
 */
class FuelConfiguration_A380X {
  // Fuel tank default quantities in gallons
  static constexpr double fuelFeedOneDefault = 1233.9;                // tank 2
  static constexpr double fuelFeedTwoDefault = fuelFeedOneDefault;    // tank 5
  static constexpr double fuelFeedThreeDefault = fuelFeedOneDefault;  // tank 6
  static constexpr double fuelFeedFourDefault = fuelFeedOneDefault;   // tank 9

  static constexpr double fuelLeftOuterDefault = 0;                        // tank 1
  static constexpr double fuelRightOuterDefault = fuelLeftOuterDefault;    // tank 10
  static constexpr double fuelLeftMidDefault = 0;                          // tank 3
  static constexpr double fuelRightMidDefault = fuelLeftMidDefault;        // tank 8
  static constexpr double fuelLeftInnerDefault = 0;                        // tank 4
  static constexpr double fuelRightInnerDefault = fuelLeftInnerDefault;    // tank 7

  static constexpr double fuelTrimDefault = 0;  // tank 11

 private:
  // Actual fuel tank quantities in gallons
  double fuelLeftOuterGallons = fuelLeftOuterDefault;
  double fuelFeedOneGallons = fuelFeedOneDefault;
  double fuelLeftMidGallons = fuelLeftMidDefault;
  double fuelLeftInnerGallons = fuelLeftInnerDefault;
  double fuelRightOuterGallons = fuelRightOuterDefault;
  double fuelFeedTwoGallons = fuelFeedTwoDefault;
  double fuelRightMidGallons = fuelRightMidDefault;
  double fuelRightInnerGallons = fuelRightInnerDefault;
  double fuelFeedThreeGallons = fuelFeedThreeDefault;
  double fuelFeedFourGallons = fuelFeedFourDefault;
  double fuelTrimGallons = fuelTrimDefault;

  std::string configFilename{"A380X-default-fuel-config.ini"};

 public:
  /**
   * @brief Returns the filename of the INI file to use for loading and saving the fuel configuration.
   */
  std::string getConfigFilename() const { return configFilename; }

  /**
   * @brief Sets the filename of the INI file to use for loading and saving the fuel configuration.
   *
   * This must to be done before calling loadConfigurationFromIni or saveConfigurationToIni otherwise
   * the default filename will be used.
   *
   * @param configFilename The filename of the INI file to use for loading and saving the fuel configuration.
   */
  void setConfigFilename(const std::string& configFilename) { this->configFilename = configFilename; }

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

 public:
  double getFuelFeedOneGallons() const { return fuelFeedOneGallons; }
  double getFuelLeftOuterGallons() const { return fuelLeftOuterGallons; }
  double getFuelLeftMidGallons() const { return fuelLeftMidGallons; }
  double getFuelLeftInnerGallons() const { return fuelLeftInnerGallons; }
  double getFuelFeedTwoGallons() const { return fuelFeedTwoGallons; }
  double getFuelFeedThreeGallons() const { return fuelFeedThreeGallons; }
  double getFuelRightInnerGallons() const { return fuelRightInnerGallons; }
  double getFuelRightMidGallons() const { return fuelRightMidGallons; }
  double getFuelFeedFourGallons() const { return fuelFeedFourGallons; }
  double getFuelRightOuterGallons() const { return fuelRightOuterGallons; }
  double getFuelTrimGallons() const { return fuelTrimGallons; }

  void setFuelLeftOuterGallons(double fuelLeftOuterGallons) { this->fuelLeftOuterGallons = fuelLeftOuterGallons; }
  void setFuelFeedOneGallons(double fuelFeedOneGallons) { this->fuelFeedOneGallons = fuelFeedOneGallons; }
  void setFuelLeftMidGallons(double fuelLeftMidGallons) { this->fuelLeftMidGallons = fuelLeftMidGallons; }
  void setFuelLeftInnerGallons(double fuelLeftInnerGallons) { this->fuelLeftInnerGallons = fuelLeftInnerGallons; }
  void setFuelFeedTwoGallons(double fuelFeedTwoGallons) { this->fuelFeedTwoGallons = fuelFeedTwoGallons; }
  void setFuelFeedThreeGallons(double fuelFeedThreeGallons) { this->fuelFeedThreeGallons = fuelFeedThreeGallons; }
  void setFuelRightInnerGallons(double fuelRightInnerGallons) { this->fuelRightInnerGallons = fuelRightInnerGallons; }
  void setFuelRightMidGallons(double fuelRightMidGallons) { this->fuelRightMidGallons = fuelRightMidGallons; }
  void setFuelFeedFourGallons(double fuelFeedFourGallons) { this->fuelFeedFourGallons = fuelFeedFourGallons; }
  void setFuelRightOuterGallons(double fuelRightOuterGallons) { this->fuelRightOuterGallons = fuelRightOuterGallons; }
  void setFuelTrimGallons(double fuelTrimGallons) { this->fuelTrimGallons = fuelTrimGallons; }

  std::string toString() const;
};

#endif  // FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A380X_H
