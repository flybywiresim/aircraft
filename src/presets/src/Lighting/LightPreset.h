// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <iostream>

#include "../Presets.h"
#include "../inih/ini.h"
#include "LightingSimVars.h"

/**
 * Data structure for holding all relevant lighting levels and states.
 */
struct LightingValues {
  // EFB
  double efbBrightness;  // A32NX_EFB_BRIGHTNESS
  // OVHD
  double cabinLightLevel;         // 7 (0, 50, 100)
  double ovhdIntegralLightLevel;  // 86
  // Glareshield
  double glareshieldIntegralLightLevel;  // 84
  double glareshieldLcdLightLevel;       // 87
  double tableLightCptLevel;             // 10
  double tableLightFoLevel;              // 11
  // Instruments
  double pfdBrtCptLevel;        // 88
  double ndBrtCptLevel;         // 89
  double wxTerrainBrtCptLevel;  // 94
  double consoleLightCptLevel;  // 8 (0, 50, 100)
  double pfdBrtFoLevel;         // 90
  double ndBrtFoLevel;          // 91
  double wxTerrainBrtFoLevel;   // 95
  double consoleLightFoLevel;   // 9 (0, 50, 100)
  // ISIS display has automatic brightness adjustment.
  double dcduLeftLightLevel;   // A32NX_PANEL_DCDU_L_BRIGHTNESS  0.0..1.0
  double dcduRightLightLevel;  // A32NX_PANEL_DCDU_R_BRIGHTNESS  0.0..1.0
  double mcduLeftLightLevel;   // A32NX_MCDU_L_BRIGHTNESS        0.0..1.0
  double mcduRightLightLevel;  // A32NX_MCDU_R_BRIGHTNESS        0.0..1.0
  // Pedestal
  double ecamUpperLightLevel;         // 92
  double ecamLowerLightLevel;         // 93
  double floodPnlLightLevel;          // 83
  double pedestalIntegralLightLevel;  // 85
  double floodPedLightLevel;          // 76
};

/**
 * Class for handling light presets.
 */
class LightPreset {
private:
  const std::string CONFIGURATION_FILEPATH = "\\work\\InteriorLightingPresets.ini";

  bool isInitialized = false;

  LightingSimVars* simVars;

public:
  /**
   * Currently stored lighting values.
   */
  LightingValues lightValues{};

  /**
   * Creates an instance of the LightPreset class.
   * @param simVars pointer to the LightSimVars object for reading and writing
   * the simulation variables.
   */
  LightPreset() : simVars(new LightingSimVars()) {};

  /**
   * Called when SimConnect is initialized
   */
  void initialize();

  /**
   * Callback used to update the LightPreset at each tick (dt).
   * This is used to execute every action and task required to update the light Settings.
   * @param deltaTime The time since the last tick
   */
  void onUpdate(__attribute__((unused)) double deltaTime);

  /**
   * Called when SimConnect is shut down
   */
  void shutdown();

  /**
   * Produces a string with the current settings and their values.
   * @return string with the current settings and their values.
   */
  __attribute__((unused))
  std::string sprint() const;

private:
  /**
   * Loads a specified preset
   * @param loadPresetRequest the number of the preset to be loaded
   */
  void loadLightingPreset(int64_t loadPresetRequest);

  /**
   * Save a specified preset
   * @param savePresetRequest the number of the preset to be saved
   */
  void saveLightingPreset(int64_t savePresetRequest);

  /**
   * Read the current lighting level from the aircraft.
   */
  void readFromAircraft();

  /**
   * Applies the currently loaded preset to the aircraft
   */
  void applyToAircraft();

  /**
   * Reads a stored preset from the persistence store.
   * @return true if successful, false otherwise.
   */
  bool readFromStore(int64_t presetNr);

  /**
   * Stores the current values into the persistent store.
   * @return true if successful, false otherwise.
   */
  bool saveToStore(int64_t presetNr);

  /**
   * Load lighting level based on a given LightValue data structure
   * @param lv a loadFromData of LightValue data
   */
  void loadFromData(LightingValues lv);

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
  static double
  iniGetOrDefault(const mINI::INIStructure &ini, const std::string &section, const std::string &key,
                  double defaultValue);

  // formatter:off
  const LightingValues DEFAULT_50 = {50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     0.5,
                                     0.5,
                                     0.5,
                                     0.5,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0,
                                     50.0};

  __attribute__((unused))
  const LightingValues DEFAULT_10 = {10.0,
                                     0.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     0.1,
                                     0.1,
                                     0.1,
                                     0.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0,
                                     10.0};

  __attribute__((unused))
  const LightingValues DEFAULT_100 = {100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      1.0,
                                      1.0,
                                      1.0,
                                      1.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0,
                                      100.0};
  // @formatter:on

};
