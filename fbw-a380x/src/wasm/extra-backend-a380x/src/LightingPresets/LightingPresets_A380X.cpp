// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "LightingPresets_A380X.h"
#include "UpdateMode.h"
#include "logging.h"

///
// DataManager Howto Note:
// =======================

// The LightingPresets_A32NX module uses the DataManager to get and set variables.
// Looking at the make_xxx_var functions, you can see that they are updated
// with different update cycles.
//
// Some variables are read from the sim at every tick:
// - A32NX_ELEC_AC_1_BUS_IS_POWERED
//
// Some variables are read and written from/to the sim at every tick:
// - A32NX_LIGHTING_PRESET_LOAD
// - A32NX_LIGHTING_PRESET_SAVE
//
// The rest are read on demand after the state of the above variables have been checked.
//
// This makes sure variables are only read or written to when really needed. And as
// LightingPresets_A32NX will be dormant most of the time, this is saving a lot of
// unnecessary reads/writes.
///

bool LightingPresets_A380X::initialize_aircraft() {
  elecAC1Powered = dataManager->make_named_var("ELEC_AC_1_BUS_IS_POWERED", UNITS.Number, UpdateMode::AUTO_READ);

  // Events for setting the aircraft variables
  lightPotentiometerSetEvent = dataManager->make_sim_event("LIGHT_POTENTIOMETER_SET", NOTIFICATION_GROUP_1);

  // Lighting LVARs - manual update and write when load/saving is requested
  efbBrightness = dataManager->make_named_var("EFB_BRIGHTNESS", UNITS.Number);

  // Light Potentiometers - manual update and write when load/saving is requested
  readingLightCptLevel = createLightPotentiometerVar(96);
  readingLightFoLevel  = createLightPotentiometerVar(97);

  glareshieldIntegralLightLevel = createLightPotentiometerVar(84);
  glareshieldLcdLightLevel      = createLightPotentiometerVar(87);
  tableLightCptLevel            = createLightPotentiometerVar(10);
  tableLightFoLevel             = createLightPotentiometerVar(11);

  pfdBrtCptLevel       = createLightPotentiometerVar(88);
  ndBrtCptLevel        = createLightPotentiometerVar(89);
  wxTerrainBrtCptLevel = createLightPotentiometerVar(94);
  mfdBrtCptLevel       = createLightPotentiometerVar(98);
  consoleLightCptLevel = createLightPotentiometerVar(8);

  pfdBrtFoLevel       = createLightPotentiometerVar(90);
  ndBrtFoLevel        = createLightPotentiometerVar(91);
  wxTerrainBrtFoLevel = createLightPotentiometerVar(95);
  mfdBrtFoLevel       = createLightPotentiometerVar(99);
  consoleLightFoLevel = createLightPotentiometerVar(9);

  rmpCptLightLevel    = createLightPotentiometerVar(80);
  rmpFoLightLevel     = createLightPotentiometerVar(81);
  rmpOvhdLightLevel   = createLightPotentiometerVar(82);
  ecamUpperLightLevel = createLightPotentiometerVar(92);
  ecamLowerLightLevel = createLightPotentiometerVar(93);

  pedFloodLightLevel     = createLightPotentiometerVar(76);
  mainPnlFloodLightLevel = createLightPotentiometerVar(83);
  integralLightLevel     = createLightPotentiometerVar(85);
  ambientLightLevel      = createLightPotentiometerVar(7);

  loadLightingPresetRequest->setAsInt64(0);
  saveLightingPresetRequest->setAsInt64(0);

  _isInitialized = true;
  LOG_INFO("LightingPresets_A380X initialized");
  return true;
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================

void LightingPresets_A380X::readFromAircraft() {
  currentLightValues.efbBrightness = efbBrightness->readFromSim();

  currentLightValues.readingLightCptLevel = readingLightCptLevel->readFromSim();
  currentLightValues.readingLightFoLevel  = readingLightFoLevel->readFromSim();

  currentLightValues.glareshieldIntegralLightLevel = glareshieldIntegralLightLevel->readFromSim();
  currentLightValues.glareshieldLcdLightLevel      = glareshieldLcdLightLevel->readFromSim();
  currentLightValues.tableLightCptLevel            = tableLightCptLevel->readFromSim();
  currentLightValues.tableLightFoLevel             = tableLightFoLevel->readFromSim();

  currentLightValues.pfdBrtCptLevel       = pfdBrtCptLevel->readFromSim();
  currentLightValues.ndBrtCptLevel        = ndBrtCptLevel->readFromSim();
  currentLightValues.wxTerrainBrtCptLevel = wxTerrainBrtCptLevel->readFromSim();
  currentLightValues.mfdBrtCptLevel       = mfdBrtCptLevel->readFromSim();
  currentLightValues.consoleLightCptLevel = consoleLightCptLevel->readFromSim();

  currentLightValues.pfdBrtFoLevel       = pfdBrtFoLevel->readFromSim();
  currentLightValues.ndBrtFoLevel        = ndBrtFoLevel->readFromSim();
  currentLightValues.wxTerrainBrtFoLevel = wxTerrainBrtFoLevel->readFromSim();
  currentLightValues.mfdBrtFoLevel       = mfdBrtFoLevel->readFromSim();
  currentLightValues.consoleLightFoLevel = consoleLightFoLevel->readFromSim();

  currentLightValues.rmpCptLightLevel    = rmpCptLightLevel->readFromSim();
  currentLightValues.rmpFoLightLevel     = rmpFoLightLevel->readFromSim();
  currentLightValues.rmpOvhdLightLevel   = rmpOvhdLightLevel->readFromSim();
  currentLightValues.ecamUpperLightLevel = ecamUpperLightLevel->readFromSim();
  currentLightValues.ecamLowerLightLevel = ecamLowerLightLevel->readFromSim();

  currentLightValues.mainPnlFloodLightLevel = mainPnlFloodLightLevel->readFromSim();
  currentLightValues.integralLightLevel     = integralLightLevel->readFromSim();
  currentLightValues.pedFloodLightLevel     = pedFloodLightLevel->readFromSim();
  currentLightValues.ambientLightLevel      = ambientLightLevel->readFromSim();
}

void LightingPresets_A380X::applyToAircraft() {
  efbBrightness->setAndWriteToSim(intermediateLightValues.efbBrightness);

  readingLightCptLevel->setAndWriteToSim(intermediateLightValues.readingLightCptLevel);
  readingLightFoLevel->setAndWriteToSim(intermediateLightValues.readingLightFoLevel);

  glareshieldIntegralLightLevel->setAndWriteToSim(intermediateLightValues.glareshieldIntegralLightLevel);
  glareshieldLcdLightLevel->setAndWriteToSim(intermediateLightValues.glareshieldLcdLightLevel);
  tableLightCptLevel->setAndWriteToSim(intermediateLightValues.tableLightCptLevel);
  tableLightFoLevel->setAndWriteToSim(intermediateLightValues.tableLightFoLevel);

  pfdBrtCptLevel->setAndWriteToSim(intermediateLightValues.pfdBrtCptLevel);
  ndBrtCptLevel->setAndWriteToSim(intermediateLightValues.ndBrtCptLevel);
  wxTerrainBrtCptLevel->setAndWriteToSim(intermediateLightValues.wxTerrainBrtCptLevel);
  mfdBrtCptLevel->setAndWriteToSim(intermediateLightValues.mfdBrtCptLevel);
  consoleLightCptLevel->setAndWriteToSim(intermediateLightValues.consoleLightCptLevel);

  pfdBrtFoLevel->setAndWriteToSim(intermediateLightValues.pfdBrtFoLevel);
  ndBrtFoLevel->setAndWriteToSim(intermediateLightValues.ndBrtFoLevel);
  wxTerrainBrtFoLevel->setAndWriteToSim(intermediateLightValues.wxTerrainBrtFoLevel);
  mfdBrtFoLevel->setAndWriteToSim(intermediateLightValues.mfdBrtFoLevel);
  consoleLightFoLevel->setAndWriteToSim(intermediateLightValues.consoleLightFoLevel);

  rmpCptLightLevel->setAndWriteToSim(intermediateLightValues.rmpCptLightLevel);
  rmpFoLightLevel->setAndWriteToSim(intermediateLightValues.rmpFoLightLevel);
  rmpOvhdLightLevel->setAndWriteToSim(intermediateLightValues.rmpOvhdLightLevel);
  ecamUpperLightLevel->setAndWriteToSim(intermediateLightValues.ecamUpperLightLevel);
  ecamLowerLightLevel->setAndWriteToSim(intermediateLightValues.ecamLowerLightLevel);

  pedFloodLightLevel->setAndWriteToSim(intermediateLightValues.pedFloodLightLevel);
  mainPnlFloodLightLevel->setAndWriteToSim(intermediateLightValues.mainPnlFloodLightLevel);
  integralLightLevel->setAndWriteToSim(intermediateLightValues.integralLightLevel);
  ambientLightLevel->setAndWriteToSim(intermediateLightValues.ambientLightLevel);
}

void LightingPresets_A380X::loadFromIni(const mINI::INIStructure& ini, const std::string& iniSectionName) {
  // check if iniSectionName is available
  // if not use a 50% default iniSectionName
  if (!ini.has(iniSectionName)) {
    intermediateLightValues = DEFAULT_50;
    return;
  }

  // reading data structure from ini
  loadedLightValues.efbBrightness = iniGetOrDefault(ini, iniSectionName, "efb_brightness", 80.0);

  loadedLightValues.readingLightCptLevel = iniGetOrDefault(ini, iniSectionName, "reading_cpt_lt", 50.0);
  loadedLightValues.readingLightFoLevel  = iniGetOrDefault(ini, iniSectionName, "reading_fo_lt", 50.0);

  loadedLightValues.glareshieldIntegralLightLevel = iniGetOrDefault(ini, iniSectionName, "glareshield_int_lt", 50.0);
  loadedLightValues.glareshieldLcdLightLevel      = iniGetOrDefault(ini, iniSectionName, "glareshield_lcd_lt", 50.0);
  loadedLightValues.tableLightCptLevel            = iniGetOrDefault(ini, iniSectionName, "table_cpt_lt", 50.0);
  loadedLightValues.tableLightFoLevel             = iniGetOrDefault(ini, iniSectionName, "table_fo_lt", 50.0);

  loadedLightValues.pfdBrtCptLevel       = iniGetOrDefault(ini, iniSectionName, "pfd_cpt_lvl", 50.0);
  loadedLightValues.ndBrtCptLevel        = iniGetOrDefault(ini, iniSectionName, "nd_cpt_lvl", 50.0);
  loadedLightValues.wxTerrainBrtCptLevel = iniGetOrDefault(ini, iniSectionName, "wx_cpt_lvl", 50.0);
  loadedLightValues.mfdBrtCptLevel       = iniGetOrDefault(ini, iniSectionName, "mfd_cpt_lvl", 50.0);
  loadedLightValues.consoleLightCptLevel = iniGetOrDefault(ini, iniSectionName, "console_cpt_lt", 50.0);

  loadedLightValues.pfdBrtFoLevel       = iniGetOrDefault(ini, iniSectionName, "pfd_fo_lvl", 50.0);
  loadedLightValues.ndBrtFoLevel        = iniGetOrDefault(ini, iniSectionName, "nd_fo_lvl", 50.0);
  loadedLightValues.wxTerrainBrtFoLevel = iniGetOrDefault(ini, iniSectionName, "wx_fo_lvl", 50.0);
  loadedLightValues.mfdBrtFoLevel       = iniGetOrDefault(ini, iniSectionName, "mfd_fo_lvl", 50.0);
  loadedLightValues.consoleLightFoLevel = iniGetOrDefault(ini, iniSectionName, "console_fo_lt", 50.0);

  loadedLightValues.rmpCptLightLevel    = iniGetOrDefault(ini, iniSectionName, "rmp_cpt_lt", 50.0);
  loadedLightValues.rmpFoLightLevel     = iniGetOrDefault(ini, iniSectionName, "rmp_fo_lt", 50.0);
  loadedLightValues.rmpOvhdLightLevel   = iniGetOrDefault(ini, iniSectionName, "rmp_ovhd_lt", 50.0);
  loadedLightValues.ecamUpperLightLevel = iniGetOrDefault(ini, iniSectionName, "ecam_upper_lvl", 50.0);
  loadedLightValues.ecamLowerLightLevel = iniGetOrDefault(ini, iniSectionName, "ecam_lower_lvl", 50.0);

  loadedLightValues.pedFloodLightLevel     = iniGetOrDefault(ini, iniSectionName, "flood_ped_lvl", 50.0);
  loadedLightValues.mainPnlFloodLightLevel = iniGetOrDefault(ini, iniSectionName, "flood_pnl_lt", 50.0);
  loadedLightValues.integralLightLevel     = iniGetOrDefault(ini, iniSectionName, "pedestal_int_lt", 50.0);
  loadedLightValues.ambientLightLevel      = iniGetOrDefault(ini, iniSectionName, "cabin_light", 50.0);
}

void LightingPresets_A380X::saveToIni(mINI::INIStructure& ini, const std::string& iniSectionName) const {
  ini[iniSectionName]["efb_brightness"] = std::to_string(currentLightValues.efbBrightness);

  ini[iniSectionName]["reading_cpt_lt"] = std::to_string(currentLightValues.readingLightCptLevel);
  ini[iniSectionName]["reading_fo_lt"]  = std::to_string(currentLightValues.readingLightFoLevel);

  ini[iniSectionName]["glareshield_int_lt"] = std::to_string(currentLightValues.glareshieldIntegralLightLevel);
  ini[iniSectionName]["glareshield_lcd_lt"] = std::to_string(currentLightValues.glareshieldLcdLightLevel);
  ini[iniSectionName]["table_cpt_lt"]       = std::to_string(currentLightValues.tableLightCptLevel);
  ini[iniSectionName]["table_fo_lt"]        = std::to_string(currentLightValues.tableLightFoLevel);

  ini[iniSectionName]["pfd_cpt_lvl"]    = std::to_string(currentLightValues.pfdBrtCptLevel);
  ini[iniSectionName]["nd_cpt_lvl"]     = std::to_string(currentLightValues.ndBrtCptLevel);
  ini[iniSectionName]["wx_cpt_lvl"]     = std::to_string(currentLightValues.wxTerrainBrtCptLevel);
  ini[iniSectionName]["mfd_cpt_lvl"]    = std::to_string(currentLightValues.mfdBrtCptLevel);
  ini[iniSectionName]["console_cpt_lt"] = std::to_string(currentLightValues.consoleLightCptLevel);

  ini[iniSectionName]["pfd_fo_lvl"]    = std::to_string(currentLightValues.pfdBrtFoLevel);
  ini[iniSectionName]["nd_fo_lvl"]     = std::to_string(currentLightValues.ndBrtFoLevel);
  ini[iniSectionName]["wx_fo_lvl"]     = std::to_string(currentLightValues.wxTerrainBrtFoLevel);
  ini[iniSectionName]["mfd_fo_lvl"]    = std::to_string(currentLightValues.mfdBrtFoLevel);
  ini[iniSectionName]["console_fo_lt"] = std::to_string(currentLightValues.consoleLightFoLevel);

  ini[iniSectionName]["rmp_cpt_lt"]     = std::to_string(currentLightValues.rmpCptLightLevel);
  ini[iniSectionName]["rmp_fo_lt"]      = std::to_string(currentLightValues.rmpFoLightLevel);
  ini[iniSectionName]["rmp_ovhd_lt"]    = std::to_string(currentLightValues.rmpOvhdLightLevel);
  ini[iniSectionName]["ecam_upper_lvl"] = std::to_string(currentLightValues.ecamUpperLightLevel);
  ini[iniSectionName]["ecam_lower_lvl"] = std::to_string(currentLightValues.ecamLowerLightLevel);

  ini[iniSectionName]["flood_ped_lvl"]   = std::to_string(currentLightValues.pedFloodLightLevel);
  ini[iniSectionName]["flood_pnl_lt"]    = std::to_string(currentLightValues.mainPnlFloodLightLevel);
  ini[iniSectionName]["pedestal_int_lt"] = std::to_string(currentLightValues.integralLightLevel);
  ini[iniSectionName]["cabin_light"]     = std::to_string(currentLightValues.ambientLightLevel);
}

[[maybe_unused]] std::string LightingPresets_A380X::str() const {
  std::ostringstream os;
  os << "EFB Brightness: " << intermediateLightValues.efbBrightness << std::endl;

  os << "Reading Cpt Lt: " << intermediateLightValues.readingLightCptLevel << std::endl;
  os << "Reading Fo Lt: " << intermediateLightValues.readingLightFoLevel << std::endl;

  os << "Glareshield Int Lt: " << intermediateLightValues.glareshieldIntegralLightLevel << std::endl;
  os << "Glareshield Lcd Lt: " << intermediateLightValues.glareshieldLcdLightLevel << std::endl;
  os << "Table Cpt Lt: " << intermediateLightValues.tableLightCptLevel << std::endl;
  os << "Table FO Lt: " << intermediateLightValues.tableLightFoLevel << std::endl;

  os << "PFD Cpt Lvl: " << intermediateLightValues.pfdBrtCptLevel << std::endl;
  os << "ND Cpt Lvl: " << intermediateLightValues.ndBrtCptLevel << std::endl;
  os << "WX Cpt Lvl: " << intermediateLightValues.wxTerrainBrtCptLevel << std::endl;
  os << "MFD Cpt Lvl: " << intermediateLightValues.mfdBrtCptLevel << std::endl;
  os << "Console Cpt Lt: " << intermediateLightValues.consoleLightCptLevel << std::endl;

  os << "PFD FO Lvl: " << intermediateLightValues.pfdBrtFoLevel << std::endl;
  os << "ND FO Lvl: " << intermediateLightValues.ndBrtFoLevel << std::endl;
  os << "WX FO Lvl: " << intermediateLightValues.wxTerrainBrtFoLevel << std::endl;
  os << "MFD FO Lvl: " << intermediateLightValues.mfdBrtFoLevel << std::endl;
  os << "Console Fo Lt: " << intermediateLightValues.consoleLightFoLevel << std::endl;

  os << "RMP Cpt Lt: " << intermediateLightValues.rmpCptLightLevel << std::endl;
  os << "RMP Fo Lt: " << intermediateLightValues.rmpFoLightLevel << std::endl;
  os << "RMP Ovhd Lt: " << intermediateLightValues.rmpOvhdLightLevel << std::endl;
  os << "ECAM Upper Lvl: " << intermediateLightValues.ecamUpperLightLevel << std::endl;
  os << "ECAM Lower Lvl: " << intermediateLightValues.ecamLowerLightLevel << std::endl;

  os << "Floor FO Lvl: " << intermediateLightValues.pedFloodLightLevel << std::endl;
  os << "Floor Cpt Lt: " << intermediateLightValues.mainPnlFloodLightLevel << std::endl;
  os << "Pedestal Int Lt: " << intermediateLightValues.integralLightLevel << std::endl;
  os << "Cabin Light: " << intermediateLightValues.ambientLightLevel << std::endl;
  return os.str();
}

bool LightingPresets_A380X::calculateIntermediateValues(FLOAT64 stepSize) {
  // clang-format off
  intermediateLightValues.efbBrightness = convergeValue( currentLightValues.efbBrightness,loadedLightValues.efbBrightness, stepSize);

  intermediateLightValues.readingLightCptLevel = convergeValue( currentLightValues.readingLightCptLevel,loadedLightValues.readingLightCptLevel, stepSize);
  intermediateLightValues.readingLightFoLevel = convergeValue( currentLightValues.readingLightFoLevel,loadedLightValues.readingLightFoLevel, stepSize);

  intermediateLightValues.glareshieldIntegralLightLevel = convergeValue( currentLightValues.glareshieldIntegralLightLevel,loadedLightValues.glareshieldIntegralLightLevel, stepSize);
  intermediateLightValues.glareshieldLcdLightLevel = convergeValue( currentLightValues.glareshieldLcdLightLevel,loadedLightValues.glareshieldLcdLightLevel, stepSize);
  intermediateLightValues.tableLightCptLevel = convergeValue( currentLightValues.tableLightCptLevel,loadedLightValues.tableLightCptLevel, stepSize);
  intermediateLightValues.tableLightFoLevel = convergeValue( currentLightValues.tableLightFoLevel,loadedLightValues.tableLightFoLevel, stepSize);

  intermediateLightValues.pfdBrtCptLevel = convergeValue( currentLightValues.pfdBrtCptLevel,loadedLightValues.pfdBrtCptLevel, stepSize);
  intermediateLightValues.ndBrtCptLevel = convergeValue( currentLightValues.ndBrtCptLevel,loadedLightValues.ndBrtCptLevel, stepSize);
  intermediateLightValues.wxTerrainBrtCptLevel = convergeValue( currentLightValues.wxTerrainBrtCptLevel,loadedLightValues.wxTerrainBrtCptLevel, stepSize);
  intermediateLightValues.mfdBrtCptLevel = convergeValue( currentLightValues.mfdBrtCptLevel,loadedLightValues.mfdBrtCptLevel, stepSize);
  intermediateLightValues.consoleLightCptLevel = convergeValue( currentLightValues.consoleLightCptLevel,loadedLightValues.consoleLightCptLevel, stepSize);

  intermediateLightValues.pfdBrtFoLevel = convergeValue( currentLightValues.pfdBrtFoLevel,loadedLightValues.pfdBrtFoLevel, stepSize);
  intermediateLightValues.ndBrtFoLevel = convergeValue( currentLightValues.ndBrtFoLevel,loadedLightValues.ndBrtFoLevel, stepSize);
  intermediateLightValues.wxTerrainBrtFoLevel = convergeValue( currentLightValues.wxTerrainBrtFoLevel,loadedLightValues.wxTerrainBrtFoLevel, stepSize);
  intermediateLightValues.mfdBrtFoLevel = convergeValue( currentLightValues.mfdBrtFoLevel,loadedLightValues.mfdBrtFoLevel, stepSize);
  intermediateLightValues.consoleLightFoLevel = convergeValue( currentLightValues.consoleLightFoLevel,loadedLightValues.consoleLightFoLevel, stepSize);

  intermediateLightValues.rmpCptLightLevel = convergeValue( currentLightValues.rmpCptLightLevel,loadedLightValues.rmpCptLightLevel, stepSize);
  intermediateLightValues.rmpFoLightLevel = convergeValue( currentLightValues.rmpFoLightLevel,loadedLightValues.rmpFoLightLevel, stepSize);
  intermediateLightValues.rmpOvhdLightLevel = convergeValue( currentLightValues.rmpOvhdLightLevel,loadedLightValues.rmpOvhdLightLevel, stepSize);
  intermediateLightValues.ecamUpperLightLevel = convergeValue( currentLightValues.ecamUpperLightLevel,loadedLightValues.ecamUpperLightLevel, stepSize);
  intermediateLightValues.ecamLowerLightLevel = convergeValue( currentLightValues.ecamLowerLightLevel,loadedLightValues.ecamLowerLightLevel, stepSize);

  intermediateLightValues.pedFloodLightLevel = convergeValue( currentLightValues.pedFloodLightLevel,loadedLightValues.pedFloodLightLevel, stepSize);
  intermediateLightValues.mainPnlFloodLightLevel = convergeValue( currentLightValues.mainPnlFloodLightLevel,loadedLightValues.mainPnlFloodLightLevel, stepSize);
  intermediateLightValues.integralLightLevel = convergeValue( currentLightValues.integralLightLevel,loadedLightValues.integralLightLevel, stepSize);
  intermediateLightValues.ambientLightLevel = convergeValue( currentLightValues.ambientLightLevel,loadedLightValues.ambientLightLevel, stepSize);
  // clang-format on
  return intermediateLightValues == loadedLightValues;
}
