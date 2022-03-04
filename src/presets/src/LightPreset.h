// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <iostream>

#include "Presets.h"

struct LightValues {
  // EFB
  double efbBrightness; // A32NX_EFB_BRIGHTNESS
  // OVHD
  ThreeWay cabinLightLevel;       // 7 (0..2)
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
  double consoleLightCptLevel;  // 8
  double pfdBrtFoLevel;         // 90
  double ndBrtFoLevel;          // 91
  double wxTerrainBrtFoLevel;   // 95
  double consoleLightFoLevel;   // 9
  // isis is auto
  double dcduLeftLightLevel;   // A32NX_PANEL_DCDU_L_BRIGHTNESS
  double dcduRightLightLevel;  // A32NX_PANEL_DCDU_R_BRIGHTNESS
  double mcduLeftLightLevel;   // A32NX_MCDU_L_BRIGHTNESS
  double mcduRightLightLevel;  // A32NX_MCDU_R_BRIGHTNESS
  // Pedestal
  double ecamUpperLightLevel;         // 92
  double ecamLowerLightLevel;         // 93
  double floorCptLightLevel;          // 83
  double pedestalIntegralLightLevel;  // 85
  double floorFoLightLevel;           // 76
 };

class LightPreset {
 private:
  SimVars* simVars;

 public:
  LightValues lightValues{};

 public:
  LightPreset(SimVars* simVars) : simVars(simVars) {};
  void readFromAircraft();
  void set(LightValues lv);
  void applyToAircraft();
  bool readFromStore();
  bool saveToStore();
  std::string sprint();
};
