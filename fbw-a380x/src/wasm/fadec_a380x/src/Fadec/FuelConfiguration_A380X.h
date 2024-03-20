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
 */
class FuelConfiguration_A380X {
  // Fuel tank default quantities in gallons
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

 private:
  // Actual fuel tank quantities in gallons
  double fuelLeftOuterGallons;
  double fuelFeedOneGallons;
  double fuelLeftMidGallons;
  double fuelLeftInnerGallons;
  double fuelRightOuterGallons;
  double fuelFeedTwoGallons;
  double fuelRightMidGallons;
  double fuelRightInnerGallons;
  double fuelFeedThreeGallons;
  double fuelFeedFourGallons;
  double fuelTrimGallons;

  std::string configFilename;

 public:
  /**
   * @brief Constructor for the FuelConfiguration class.
   *
   * This constructor initializes the FuelConfiguration object with a configuration file name.
   *
   * @param configFilename The name of the configuration file.
   */
  FuelConfiguration_A380X() {}

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

  void   setFuelLeftOuterGallons(double fuelLeftOuterGallons) { this->fuelLeftOuterGallons = fuelLeftOuterGallons; }
  void   setFuelFeedOneGallons(double fuelFeedOneGallons) { this->fuelFeedOneGallons = fuelFeedOneGallons; }
  void   setFuelLeftMidGallons(double fuelLeftMidGallons) { this->fuelLeftMidGallons = fuelLeftMidGallons; }
  void   setFuelLeftInnerGallons(double fuelLeftInnerGallons) { this->fuelLeftInnerGallons = fuelLeftInnerGallons; }
  void   setFuelFeedTwoGallons(double fuelFeedTwoGallons) { this->fuelFeedTwoGallons = fuelFeedTwoGallons; }
  void   setFuelFeedThreeGallons(double fuelFeedThreeGallons) { this->fuelFeedThreeGallons = fuelFeedThreeGallons; }
  void   setFuelRightInnerGallons(double fuelRightInnerGallons) { this->fuelRightInnerGallons = fuelRightInnerGallons; }
  void   setFuelRightMidGallons(double fuelRightMidGallons) { this->fuelRightMidGallons = fuelRightMidGallons; }
  void   setFuelFeedFourGallons(double fuelFeedFourGallons) { this->fuelFeedFourGallons = fuelFeedFourGallons; }
  void   setFuelRightOuterGallons(double fuelRightOuterGallons) { this->fuelRightOuterGallons = fuelRightOuterGallons; }
  void   setFuelTrimGallons(double fuelTrimGallons) { this->fuelTrimGallons = fuelTrimGallons; }

  void setConfigFilename(const std::string& configFilename) {
    this->configFilename = configFilename;
  }

  std::string toString() const;

};

#endif  // FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A380X_H
