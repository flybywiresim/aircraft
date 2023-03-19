// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_LIGHTINGPRESETS_H
#define FLYBYWIRE_AIRCRAFT_LIGHTINGPRESETS_H

#include <string_view>

#include "DataManager.h"
#include "Module.h"
#include "inih/ini.h"

class LightingPresets : public Module {
 public:
  LightingPresets() = delete;

 protected:
  const std::string CONFIGURATION_FILEPATH = "\\work\\InteriorLightingPresets.ini";
  static constexpr SIMCONNECT_NOTIFICATION_GROUP_ID NOTIFICATION_GROUP_1 = 1;
  static constexpr FLOAT64 STEP_SIZE = 2.0;

  // Convenience pointer to the data manager
  DataManager* dataManager = nullptr;

  // Setter events
  ClientEventPtr lightPotentiometerSetEvent;

  // Control LVARs
  NamedVariablePtr elecAC1Powered;
  NamedVariablePtr loadLightingPresetRequest;
  NamedVariablePtr saveLightingPresetRequest;

  LightingPresets(MsfsHandler& handler) : Module(handler) {}

  virtual bool initialize() override = 0; // this needs to be implemented by the derived class
  bool preUpdate([[maybe_unused]] sGaugeDrawData* pData) override { return true; }; // not required for this module
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate([[maybe_unused]] sGaugeDrawData* pData) override { return true; }; // not required for this module
  bool shutdown() override;

  /**
   * Loads a specified preset
   * @param loadPresetRequest the number of the preset to be loaded
   * @return true if loading is finished or an error occurred - this should end the loading process
   * @return false if loading is not finished
   */
  bool loadLightingPreset(INT64 loadPresetRequest);

  /**
   * Save a specified preset
   * @param savePresetRequest the number of the preset to be saved
   */
  void saveLightingPreset(INT64 savePresetRequest);

  /**
   * Read the current lighting level from the aircraft.
   */
  virtual void readFromAircraft() = 0;

  /**
   * Applies the currently loaded preset to the aircraft
   */
  virtual void applyToAircraft() = 0;

  /**
   * Reads a stored preset from the persistence store.
   * @return true if successful, false otherwise.
   */
  bool readFromStore(INT64 presetNr);

  /**
   * Loads the current values from the provided ini structure.
   * @return true if successful, false otherwise.
   */
  virtual void loadFromIni(const mINI::INIStructure& ini, const std::string& iniSectionName) = 0;

  /**
   * Stores the current values into the persistent store.
   * @return true if successful, false otherwise.
   */
  virtual bool saveToStore(INT64 presetNr);

  /**
   * Saves the current values to the provided ini structure.
   * @param ini
   * @param iniSectionName
   */
  virtual void saveToIni(mINI::INIStructure& ini, const std::string& iniSectionName) const = 0;

  /**
   * Calculates the intermediate values between the current values and the preset values.
   * @return true if the intermediate values are equal to the current values.
   */
  virtual bool calculateIntermediateValues() = 0;

  /**
   * Get the variable for the potentiometer of a specific light
   * @param index
   * @return a shared pointer to the variable
   */
  [[nodiscard]] AircraftVariablePtr getLightPotentiometerVar(int index) const;

  /**
   * Convenience method to check for the existence of a key in a section and the option to
   * provide a default value in case the key does not exist.
   * Does not change the ini structure.
   * @param ini mINI::INIStructure
   * @param section section name as std::string
   * @param key key name as std::string
   * @param defaultValue a default value that is returned if the key does not exist
   * @return the value of the key or the default value if the key does not exist
   */
  static FLOAT64 iniGetOrDefault(const mINI::INIStructure& ini, const std::string& section, const std::string& key, FLOAT64 defaultValue);

  /**
   * Converges a momentary value towards a target value.
   * @param momentary the momentary value
   * @param target the target value
   * @return the converged value
   */
  FLOAT64 convergeValue(FLOAT64 momentary, FLOAT64 target);
};

#endif  // FLYBYWIRE_AIRCRAFT_LIGHTINGPRESETS_H
