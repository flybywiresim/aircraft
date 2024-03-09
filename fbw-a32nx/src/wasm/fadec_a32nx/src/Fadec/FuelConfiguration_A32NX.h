// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A32NX_H
#define FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A32NX_H

#include <string>

#define INI_SECTION_FUEL "FUEL"
#define INI_SECTION_FUEL_CENTER_QUANTITY "FUEL_CENTER_QUANTITY"
#define INI_SECTION_FUEL_LEFT_QUANTITY "FUEL_LEFT_QUANTITY"
#define INI_SECTION_FUEL_RIGHT_QUANTITY "FUEL_RIGHT_QUANTITY"
#define INI_SECTION_FUEL_LEFT_AUX_QUANTITY "FUEL_LEFT_AUX_QUANTITY"
#define INI_SECTION_FUEL_RIGHT_AUX_QUANTITY "FUEL_RIGHT_AUX_QUANTITY"

class FuelConfiguration_A32NX {
 private:
  // Fuel tank default quantities in gallons
  static constexpr double fuelCenterDefault = 0;
  static constexpr double fuelLeftDefault = 411.34;
  static constexpr double fuelRightDefault = fuelLeftDefault;
  static constexpr double fuelLeftAuxDefault = 0;
  static constexpr double fuelRightAuxDefault = fuelLeftAuxDefault;

  // Actual fuel tank quantities in gallons
  double fuelCenter = fuelCenterDefault;
  double fuelLeft = fuelLeftDefault;
  double fuelRight = fuelRightDefault;
  double fuelLeftAux = fuelLeftAuxDefault;
  double fuelRightAux = fuelRightAuxDefault;

  std::string configFilename;

 public:
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

  void setConfigFilename(const std::string& configFilename) { FuelConfiguration_A32NX::configFilename = configFilename; }

  const std::string& getConfigFilename() const { return configFilename; }

  std::string toString() const;

  double getFuelCenter() const { return fuelCenter; }
  void setFuelCenter(double fuelCenter) { FuelConfiguration_A32NX::fuelCenter = fuelCenter; }
  double getFuelLeft() const { return fuelLeft; }
  void setFuelLeft(double fuelLeft) { FuelConfiguration_A32NX::fuelLeft = fuelLeft; }
  double getFuelRight() const { return fuelRight; }
  void setFuelRight(double fuelRight) { FuelConfiguration_A32NX::fuelRight = fuelRight; }
  double getFuelLeftAux() const { return fuelLeftAux; }
  void setFuelLeftAux(double fuelLeftAux) { FuelConfiguration_A32NX::fuelLeftAux = fuelLeftAux; }
  double getFuelRightAux() const { return fuelRightAux; }
  void setFuelRightAux(double fuelRightAux) { FuelConfiguration_A32NX::fuelRightAux = fuelRightAux; }
};

#endif  // FLYBYWIRE_AIRCRAFT_FUELCONFIGURATION_A32NX_H
