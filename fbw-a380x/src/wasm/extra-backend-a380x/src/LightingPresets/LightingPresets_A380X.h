// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_LIGHTINGPRESETS_H
#define FLYBYWIRE_LIGHTINGPRESETS_H

#include "LightingPresets/LightingPresets.h"

#include "math_utils.hpp"

class MsfsHandler;

// FIXME: This is not yet adapted to the A380X - not all necessary systems and APIs are available yet.

// Struct to hold all relevant light levels for the A32NX
struct LightingValues_A380X {
  // EFB
  FLOAT64 efbBrightness;  // A32NX_EFB_BRIGHTNESS

  // OVHD
  FLOAT64 readingLightCptLevel;  // 96
  FLOAT64 readingLightFoLevel;   // 97

  // Glareshield
  FLOAT64 glareshieldIntegralLightLevel;  // 84
  FLOAT64 glareshieldLcdLightLevel;       // 87
  FLOAT64 tableLightCptLevel;             // 10
  FLOAT64 tableLightFoLevel;              // 11

  // Instruments
  FLOAT64 pfdBrtCptLevel;        // 88
  FLOAT64 ndBrtCptLevel;         // 89
  FLOAT64 wxTerrainBrtCptLevel;  // 94
  FLOAT64 mfdBrtCptLevel;        // 98
  FLOAT64 consoleLightCptLevel;  // 8 (0, 50, 100)

  FLOAT64 pfdBrtFoLevel;        // 90
  FLOAT64 ndBrtFoLevel;         // 91
  FLOAT64 wxTerrainBrtFoLevel;  // 95
  FLOAT64 mfdBrtFoLevel;        // 99
  FLOAT64 consoleLightFoLevel;  // 9 (0, 50, 100)

  // Pedestal
  FLOAT64 rmpCptLightLevel;     // 80
  FLOAT64 rmpFoLightLevel;      // 81
  FLOAT64 rmpOvhdLightLevel;    // 82
  FLOAT64 ecamUpperLightLevel;  // 92
  FLOAT64 ecamLowerLightLevel;  // 93

  FLOAT64 pedFloodLightLevel;      // 76
  FLOAT64 mainPnlFloodLightLevel;  // 83
  FLOAT64 integralLightLevel;      // 85
  FLOAT64 ambientLightLevel;       // 7
};

/**
 * This module is responsible for the lighting presets.
 * It stores and reads the current lighting preset from and to an ini-file in the work folder.
 *
 * It is controlled by two LVARs:
 * - A32NX_LIGHTING_PRESET_LOAD
 * - A32NX_LIGHTING_PRESET_SAVE
 *
 * If these are set to a number >0 the module will load or save the preset with the given number
 * from and to the ini-file or create a new preset based on default (load) or current (save)
 * lighting values.
 */
class LightingPresets_A380X : public LightingPresets {
 private:
  // Lighting LVARs
  NamedVariablePtr efbBrightness;

  // Lighting Aircraft Vars
  AircraftVariablePtr readingLightCptLevel;
  AircraftVariablePtr readingLightFoLevel;

  AircraftVariablePtr glareshieldIntegralLightLevel;
  AircraftVariablePtr glareshieldLcdLightLevel;
  AircraftVariablePtr tableLightCptLevel;
  AircraftVariablePtr tableLightFoLevel;

  AircraftVariablePtr pfdBrtCptLevel;
  AircraftVariablePtr ndBrtCptLevel;
  AircraftVariablePtr wxTerrainBrtCptLevel;
  AircraftVariablePtr mfdBrtCptLevel;
  AircraftVariablePtr consoleLightCptLevel;

  AircraftVariablePtr pfdBrtFoLevel;
  AircraftVariablePtr ndBrtFoLevel;
  AircraftVariablePtr wxTerrainBrtFoLevel;
  AircraftVariablePtr mfdBrtFoLevel;
  AircraftVariablePtr consoleLightFoLevel;

  AircraftVariablePtr rmpCptLightLevel;
  AircraftVariablePtr rmpFoLightLevel;
  AircraftVariablePtr rmpOvhdLightLevel;
  AircraftVariablePtr ecamUpperLightLevel;
  AircraftVariablePtr ecamLowerLightLevel;

  AircraftVariablePtr pedFloodLightLevel;
  AircraftVariablePtr mainPnlFloodLightLevel;
  AircraftVariablePtr integralLightLevel;
  AircraftVariablePtr ambientLightLevel;

  // THe current lighting values in the aircraft
  LightingValues_A380X currentLightValues{};
  // The lighting values that are loaded from the ini-file
  LightingValues_A380X loadedLightValues{};
  // The lighting values that are used to converge from the current values to the preset values
  LightingValues_A380X intermediateLightValues{};

 public:
  LightingPresets_A380X() = delete;

  /**
   * Creates a new LightingPresets_A32NX instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit LightingPresets_A380X(MsfsHandler& msfsHandler) : LightingPresets(msfsHandler) {}

  /**
   * @brief Initializes the aircraft specific variables.
   * @return true if successful, false otherwise.
   */
  bool initialize_aircraft() override;

  /**
   * Produces a string with the current settings and their values.
   * @return string with the current settings and their values.
   */
  [[maybe_unused]] [[nodiscard]] std::string str() const;

 private:
  void readFromAircraft() override;
  void applyToAircraft() override;
  bool calculateIntermediateValues(FLOAT64 stepSize) override;
  void loadFromIni(const mINI::INIStructure& ini, const std::string& iniSectionName) override;
  void saveToIni(mINI::INIStructure& ini, const std::string& iniSectionName) const override;

  const LightingValues_A380X DEFAULT_50 = {50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0,
                                           50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0};
};

inline bool operator==(const LightingValues_A380X& p1, const LightingValues_A380X& p2) {
  const double epsilon = 0.1;
  return helper::Math::almostEqual(p1.efbBrightness, p2.efbBrightness, epsilon) &&

         helper::Math::almostEqual(p1.readingLightCptLevel, p2.readingLightCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.readingLightFoLevel, p2.readingLightFoLevel, epsilon) &&

         helper::Math::almostEqual(p1.glareshieldIntegralLightLevel, p2.glareshieldIntegralLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.glareshieldLcdLightLevel, p2.glareshieldLcdLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.tableLightCptLevel, p2.tableLightCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.tableLightFoLevel, p2.tableLightFoLevel, epsilon) &&

         helper::Math::almostEqual(p1.pfdBrtCptLevel, p2.pfdBrtCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.ndBrtCptLevel, p2.ndBrtCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.wxTerrainBrtCptLevel, p2.wxTerrainBrtCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.mfdBrtCptLevel, p2.mfdBrtCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.consoleLightCptLevel, p2.consoleLightCptLevel, epsilon) &&

         helper::Math::almostEqual(p1.pfdBrtFoLevel, p2.pfdBrtFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.ndBrtFoLevel, p2.ndBrtFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.wxTerrainBrtFoLevel, p2.wxTerrainBrtFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.mfdBrtFoLevel, p2.mfdBrtFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.consoleLightFoLevel, p2.consoleLightFoLevel, epsilon) &&

         helper::Math::almostEqual(p1.rmpCptLightLevel, p2.rmpCptLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.rmpFoLightLevel, p2.rmpFoLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.rmpOvhdLightLevel, p2.rmpOvhdLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.ecamUpperLightLevel, p2.ecamUpperLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.ecamLowerLightLevel, p2.ecamLowerLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.pedFloodLightLevel, p2.pedFloodLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.mainPnlFloodLightLevel, p2.mainPnlFloodLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.integralLightLevel, p2.integralLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.ambientLightLevel, p2.ambientLightLevel, epsilon);
}

#endif  // FLYBYWIRE_LIGHTINGPRESETS_H
