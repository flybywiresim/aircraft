// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A32NX_H
#define FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A32NX_H

#include <string>

// Define constants for the INI file sections and keys
#define INI_SECTION_FUEL "FUEL"
#define INI_SECTION_FUEL_CENTER_QUANTITY "FUEL_CENTER_QUANTITY"
#define INI_SECTION_FUEL_LEFT_QUANTITY "FUEL_LEFT_QUANTITY"
#define INI_SECTION_FUEL_RIGHT_QUANTITY "FUEL_RIGHT_QUANTITY"
#define INI_SECTION_FUEL_LEFT_AUX_QUANTITY "FUEL_LEFT_AUX_QUANTITY"
#define INI_SECTION_FUEL_RIGHT_AUX_QUANTITY "FUEL_RIGHT_AUX_QUANTITY"

/**
 * @class FuelConfiguration_A32NX
 * @brief Class to manage the fuel configuration for the A32NX aircraft.
 *
 * This class provides methods to load and save the fuel configuration from/to an INI file.
 * It also provides getter and setter methods for each fuel tank quantity.
 */
class FuelConfiguration_A32NX {
 private:
  // Fuel tank default quantities in gallons
  static constexpr double fuelCenterDefault   = 0;
  static constexpr double fuelLeftDefault     = 411.34;
  static constexpr double fuelRightDefault    = fuelLeftDefault;
  static constexpr double fuelLeftAuxDefault  = 0;
  static constexpr double fuelRightAuxDefault = fuelLeftAuxDefault;

  // Actual fuel tank quantities in gallons
  double fuelCenter   = fuelCenterDefault;
  double fuelLeft     = fuelLeftDefault;
  double fuelRight    = fuelRightDefault;
  double fuelLeftAux  = fuelLeftAuxDefault;
  double fuelRightAux = fuelRightAuxDefault;

  std::string configFilename{"A32NX-default-fuel-config.ini"};

 public:
  /**
   * @brief Returns the filename of the INI file to use for loading and saving the fuel configuration.
   */
  std::string getConfigFilename() const { return configFilename; }

  /**
   * @brief Sets the filename of the INI file to use for loading and saving the fuel configuration.
   *
   * This must be called before calling loadConfigurationFromIni or saveConfigurationToIni otherwise the default
   * filename will be used.
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

  /**
   * @brief Converts the current fuel configuration to a string.
   *
   * This method is used to convert the current state of the fuel configuration into a string format.
   * The string includes the quantities of fuel in each tank.
   *
   * @return A string representation of the current fuel configuration.
   */
  std::string toString() const;

  // === Getters and setters ===

  double getFuelCenter() const { return fuelCenter; }
  double getFuelLeft() const { return fuelLeft; }
  double getFuelRight() const { return fuelRight; }
  double getFuelLeftAux() const { return fuelLeftAux; }
  double getFuelRightAux() const { return fuelRightAux; }

  void setFuelCenter(double fuelCenter) { this->fuelCenter = fuelCenter; }
  void setFuelLeft(double fuelLeft) { this->fuelLeft = fuelLeft; }
  void setFuelRight(double fuelRight) { this->fuelRight = fuelRight; }
  void setFuelLeftAux(double fuelLeftAux) { this->fuelLeftAux = fuelLeftAux; }
  void setFuelRightAux(double fuelRightAux) { this->fuelRightAux = fuelRightAux; }
};

#endif  // FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A32NX_H
