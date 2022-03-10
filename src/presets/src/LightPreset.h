// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <iostream>

#include "Presets.h"
#include "inih/ini.h"

/**
 * Class for handling light presets.
 */
class LightPreset {
 private:
  const std::string CONFIGURATION_FILEPATH = "\\work\\InteriorLightingPresets.ini";

  LightingSimVars* simVars;

  /**
   * Data structure for holding all relevant lighting levels and states.
   */
  struct LightValues {
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

 public:
  /**
   * Currently stored lighting values.
   */
  LightValues lightValues{};

  /**
   * Creates an instance of the LightPreset class.
   * @param simVars pointer to the LightSimVars object for reading and writing
   * the simulation variables.
   */
  LightPreset(LightingSimVars* simVars) : simVars(simVars){};

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
  bool readFromStore(int presetNr);

  /**
   * Stores the current values into the persistent store.
   * @return true if successful, false otherwise.
   */
  bool saveToStore(int presetNr);

  /**
   * Load lighting level based on a given LightValue data structure
   * @param lv a loadFromData of LightValue data
   */
  void loadFromData(LightValues lv);

  /**
   * Produces a string with the current settings and their values.
   * @return string with the current settings and their values.
   */
  std::string sprint();

 private:
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
  double iniGetOrDefault(const mINI::INIStructure& ini, const std::string& section, const std::string& key, const double defaultValue);

  const LightValues DEFAULT_100 = {100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0,
                                   100.0, 100.0, 100.0, 1.0,   1.0,   1.0,   1.0,   100.0, 100.0, 100.0, 100.0, 100.0};

  const LightValues DEFAULT_50 = {50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0,
                                  50.0, 50.0, 50.0, 0.5,  0.5,  0.5,  0.5,  50.0, 50.0, 50.0, 50.0, 50.0};

  const LightValues DEFAULT_10 = {10.0, 0.0,  10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0,
                                  10.0, 10.0, 10.0, 0.1,  0.1,  0.1,  0.0,  10.0, 10.0, 10.0, 10.0, 10.0};
};
