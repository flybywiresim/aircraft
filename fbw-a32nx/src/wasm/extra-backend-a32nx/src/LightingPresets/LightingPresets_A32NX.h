// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_LIGHTINGPRESETS_H
#define FLYBYWIRE_LIGHTINGPRESETS_H

#include "LightingPresets/LightingPresets.h"
#include "math_utils.hpp"

class MsfsHandler;

// Struct to hold all relevant light levels for the A32NX
struct LightingValues_A32NX {
  // EFB
  FLOAT64 efbBrightness;  // A32NX_EFB_BRIGHTNESS 0..100
  // OVHD
  FLOAT64 cabinLightLevel;         // 7 (0, 50, 100)
  FLOAT64 ovhdIntegralLightLevel;  // 86 (0..100)
  // Glareshield
  FLOAT64 glareshieldIntegralLightLevel;  // 84
  FLOAT64 glareshieldLcdLightLevel;       // 87
  FLOAT64 tableLightCptLevel;             // 10
  FLOAT64 tableLightFoLevel;              // 11
  // Instruments
  FLOAT64 pfdBrtCptLevel;        // 88
  FLOAT64 ndBrtCptLevel;         // 89
  FLOAT64 wxTerrainBrtCptLevel;  // 94
  FLOAT64 consoleLightCptLevel;  // 8 (0, 50, 100)
  FLOAT64 pfdBrtFoLevel;         // 90
  FLOAT64 ndBrtFoLevel;          // 91
  FLOAT64 wxTerrainBrtFoLevel;   // 95
  FLOAT64 consoleLightFoLevel;   // 9 (0, 50, 100)
  // ISIS display has automatic brightness adjustment - this is just a manual offset
  FLOAT64 isisManualOffsetLevel;  // A32NX_ISIS_MANUAL_BRIGHTNESS_OFFSET -1.0..1.0 but limited by min/max total brightness
  FLOAT64 dcduLeftLightLevel;     // A32NX_PANEL_DCDU_L_BRIGHTNESS  0.0..1.0
  FLOAT64 dcduRightLightLevel;    // A32NX_PANEL_DCDU_R_BRIGHTNESS  0.0..1.0
  FLOAT64 mcduLeftLightLevel;     // A32NX_MCDU_L_BRIGHTNESS        0.5..8.0
  FLOAT64 mcduRightLightLevel;    // A32NX_MCDU_R_BRIGHTNESS        0.5..8.0
  // Pedestal
  FLOAT64 ecamUpperLightLevel;         // 92
  FLOAT64 ecamLowerLightLevel;         // 93
  FLOAT64 floodPnlLightLevel;          // 83
  FLOAT64 pedestalIntegralLightLevel;  // 85
  FLOAT64 floodPedLightLevel;          // 76
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
class LightingPresets_A32NX : public LightingPresets {
 private:
  // Lighting LVARs
  NamedVariablePtr efbBrightness;
  NamedVariablePtr isisManualOffsetLevel;
  NamedVariablePtr dcduLeftLightLevel;
  NamedVariablePtr dcduRightLightLevel;
  NamedVariablePtr mcduLeftLightLevel;
  NamedVariablePtr mcduRightLightLevel;

  // Lighting Aircraft Vars
  AircraftVariablePtr lightCabin;
  AircraftVariablePtr lightCabinLevel;
  AircraftVariablePtr ovhdIntegralLightLevel;
  AircraftVariablePtr glareshieldIntegralLightLevel;
  AircraftVariablePtr glareshieldLcdLightLevel;
  AircraftVariablePtr tableLightCptLevel;
  AircraftVariablePtr tableLightFoLevel;
  AircraftVariablePtr pfdBrtCptLevel;
  AircraftVariablePtr ndBrtCptLevel;
  AircraftVariablePtr wxTerrainBrtCptLevel;
  AircraftVariablePtr consoleLightCptLevel;
  AircraftVariablePtr pfdBrtFoLevel;
  AircraftVariablePtr ndBrtFoLevel;
  AircraftVariablePtr wxTerrainBrtFoLevel;
  AircraftVariablePtr consoleLightFoLevel;
  AircraftVariablePtr ecamUpperLightLevel;
  AircraftVariablePtr ecamLowerLightLevel;
  AircraftVariablePtr floodPnlLightLevel;
  AircraftVariablePtr pedestalIntegralLightLevel;
  AircraftVariablePtr floodPedLightLevel;

  ClientEventPtr cabinLightSetEvent;

  // THe current lighting values in the aircraft
  LightingValues_A32NX currentLightValues{};
  // The lighting values that are loaded from the ini-file
  LightingValues_A32NX loadedLightValues{};
  // The lighting values that are used to converge from the current values to the preset values
  LightingValues_A32NX intermediateLightValues{};

 public:
  LightingPresets_A32NX() = delete;

  /**
   * Creates a new LightingPresets_A32NX instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit LightingPresets_A32NX(MsfsHandler& msfsHandler) : LightingPresets(msfsHandler) {}

  /**
   * Initializes the aircraft specific variables.
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

  /**
   * cabin lights in the A32NX need to be controlled by two vars
   * one for the switch position and one for the actual light
   * @param level the level to set the lights to
   */
  void setValidCabinLightValue(FLOAT64 level);

  const LightingValues_A32NX DEFAULT_50 = {
      50.0,  // efbBrightness
      50.0,  // cabinLightLevel
      50.0,  // ovhdIntegralLightLevel
      50.0,  // glareshieldIntegralLightLevel
      50.0,  // glareshieldLcdLightLevel
      50.0,  // tableLightCptLevel
      50.0,  // tableLightFoLevel
      50.0,  // pfdBrtCptLevel
      50.0,  // ndBrtCptLevel
      50.0,  // wxTerrainBrtCptLevel
      50.0,  // consoleLightCptLevel
      50.0,  // pfdBrtFoLevel
      50.0,  // ndBrtFoLevel
      50.0,  // wxTerrainBrtFoLevel
      50.0,  // consoleLightFoLevel
      0.0,   // isisManualOffsetLevel
      0.5,   // dcduLeftLightLevel
      0.5,   // dcduRightLightLevel
      0.5,   // mcduLeftLightLevel
      0.5,   // mcduRightLightLevel
      50.0,  // ecamUpperLightLevel
      50.0,  // ecamLowerLightLevel
      50.0,  // floodPnlLightLevel
      50.0,  // pedestalIntegralLightLevel
      50.0   // floodPedLightLevel
  };
};

inline bool operator==(const LightingValues_A32NX& p1, const LightingValues_A32NX& p2) {
  const double epsilon = 0.1;
  return helper::Math::almostEqual(p1.efbBrightness, p2.efbBrightness, epsilon) &&
         helper::Math::almostEqual(p1.cabinLightLevel, p2.cabinLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.ovhdIntegralLightLevel, p2.ovhdIntegralLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.glareshieldIntegralLightLevel, p2.glareshieldIntegralLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.glareshieldLcdLightLevel, p2.glareshieldLcdLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.tableLightCptLevel, p2.tableLightCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.tableLightFoLevel, p2.tableLightFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.pfdBrtCptLevel, p2.pfdBrtCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.ndBrtCptLevel, p2.ndBrtCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.wxTerrainBrtCptLevel, p2.wxTerrainBrtCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.consoleLightCptLevel, p2.consoleLightCptLevel, epsilon) &&
         helper::Math::almostEqual(p1.pfdBrtFoLevel, p2.pfdBrtFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.ndBrtFoLevel, p2.ndBrtFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.wxTerrainBrtFoLevel, p2.wxTerrainBrtFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.consoleLightFoLevel, p2.consoleLightFoLevel, epsilon) &&
         helper::Math::almostEqual(p1.isisManualOffsetLevel, p2.isisManualOffsetLevel, epsilon) &&
         helper::Math::almostEqual(p1.dcduLeftLightLevel, p2.dcduLeftLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.dcduRightLightLevel, p2.dcduRightLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.mcduLeftLightLevel, p2.mcduLeftLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.mcduRightLightLevel, p2.mcduRightLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.ecamUpperLightLevel, p2.ecamUpperLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.ecamLowerLightLevel, p2.ecamLowerLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.floodPnlLightLevel, p2.floodPnlLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.pedestalIntegralLightLevel, p2.pedestalIntegralLightLevel, epsilon) &&
         helper::Math::almostEqual(p1.floodPedLightLevel, p2.floodPedLightLevel, epsilon);
}

#endif  // FLYBYWIRE_LIGHTINGPRESETS_H
