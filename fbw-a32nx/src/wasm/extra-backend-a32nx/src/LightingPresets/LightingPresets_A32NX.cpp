// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "LightingPresets_A32NX.h"
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

bool LightingPresets_A32NX::initialize_aircraft() {
  elecAC1Powered = dataManager->make_named_var("ELEC_AC_1_BUS_IS_POWERED", UNITS.Number, UpdateMode::AUTO_READ);

  // Events for setting the aircraft variables
  lightPotentiometerSetEvent = dataManager->make_sim_event("LIGHT_POTENTIOMETER_SET", NOTIFICATION_GROUP_1);
  cabinLightSetEvent = dataManager->make_sim_event("CABIN_LIGHTS_SET", NOTIFICATION_GROUP_1);

  // Lighting LVARs - manual update and write when load/saving is requested
  efbBrightness = dataManager->make_named_var("EFB_BRIGHTNESS");
  dcduLeftLightLevel = dataManager->make_named_var("PANEL_DCDU_L_BRIGHTNESS");
  dcduRightLightLevel = dataManager->make_named_var("PANEL_DCDU_R_BRIGHTNESS");
  mcduLeftLightLevel = dataManager->make_named_var("MCDU_L_BRIGHTNESS");
  mcduRightLightLevel = dataManager->make_named_var("MCDU_R_BRIGHTNESS");

  // Light Potentiometers - manual update and write when load/saving is requested
  lightCabin = dataManager->make_aircraft_var("LIGHT CABIN", 0, "", cabinLightSetEvent, UNITS.Percent);
  lightCabinLevel = createLightPotentiometerVar(7);
  ovhdIntegralLightLevel = createLightPotentiometerVar(86);
  glareshieldIntegralLightLevel = createLightPotentiometerVar(84);
  glareshieldLcdLightLevel = createLightPotentiometerVar(87);
  tableLightCptLevel = createLightPotentiometerVar(10);
  tableLightFoLevel = createLightPotentiometerVar(11);
  pfdBrtCptLevel = createLightPotentiometerVar(88);
  ndBrtCptLevel = createLightPotentiometerVar(89);
  wxTerrainBrtCptLevel = createLightPotentiometerVar(94);
  consoleLightCptLevel = createLightPotentiometerVar(8);
  pfdBrtFoLevel = createLightPotentiometerVar(90);
  ndBrtFoLevel = createLightPotentiometerVar(91);
  wxTerrainBrtFoLevel = createLightPotentiometerVar(95);
  consoleLightFoLevel = createLightPotentiometerVar(9);
  ecamUpperLightLevel = createLightPotentiometerVar(92);
  ecamLowerLightLevel = createLightPotentiometerVar(93);
  floodPnlLightLevel = createLightPotentiometerVar(83);
  pedestalIntegralLightLevel = createLightPotentiometerVar(85);
  floodPedLightLevel = createLightPotentiometerVar(76);

  loadLightingPresetRequest->setAsInt64(0);
  saveLightingPresetRequest->setAsInt64(0);

  _isInitialized = true;
  LOG_INFO("LightingPresets_A32NX initialized");
  return true;
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================

void LightingPresets_A32NX::readFromAircraft() {
  currentLightValues.efbBrightness = efbBrightness->readFromSim();
  currentLightValues.cabinLightLevel = lightCabinLevel->readFromSim();
  currentLightValues.ovhdIntegralLightLevel = ovhdIntegralLightLevel->readFromSim();
  currentLightValues.glareshieldIntegralLightLevel = glareshieldIntegralLightLevel->readFromSim();
  currentLightValues.glareshieldLcdLightLevel = glareshieldLcdLightLevel->readFromSim();
  currentLightValues.tableLightCptLevel = tableLightCptLevel->readFromSim();
  currentLightValues.tableLightFoLevel = tableLightFoLevel->readFromSim();
  currentLightValues.pfdBrtCptLevel = pfdBrtCptLevel->readFromSim();
  currentLightValues.ndBrtCptLevel = ndBrtCptLevel->readFromSim();
  currentLightValues.wxTerrainBrtCptLevel = wxTerrainBrtCptLevel->readFromSim();
  currentLightValues.consoleLightCptLevel = consoleLightCptLevel->readFromSim();
  currentLightValues.pfdBrtFoLevel = pfdBrtFoLevel->readFromSim();
  currentLightValues.ndBrtFoLevel = ndBrtFoLevel->readFromSim();
  currentLightValues.wxTerrainBrtFoLevel = wxTerrainBrtFoLevel->readFromSim();
  currentLightValues.consoleLightFoLevel = consoleLightFoLevel->readFromSim();
  currentLightValues.dcduLeftLightLevel = dcduLeftLightLevel->readFromSim();
  currentLightValues.dcduRightLightLevel = dcduRightLightLevel->readFromSim();
  currentLightValues.mcduLeftLightLevel = mcduLeftLightLevel->readFromSim();
  currentLightValues.mcduRightLightLevel = mcduRightLightLevel->readFromSim();
  currentLightValues.ecamUpperLightLevel = ecamUpperLightLevel->readFromSim();
  currentLightValues.ecamLowerLightLevel = ecamLowerLightLevel->readFromSim();
  currentLightValues.floodPnlLightLevel = floodPnlLightLevel->readFromSim();
  currentLightValues.pedestalIntegralLightLevel = pedestalIntegralLightLevel->readFromSim();
  currentLightValues.floodPedLightLevel = floodPedLightLevel->readFromSim();
}

void LightingPresets_A32NX::applyToAircraft() {
  efbBrightness->setAndWriteToSim(intermediateLightValues.efbBrightness);
  setValidCabinLightValue(intermediateLightValues.cabinLightLevel);
  ovhdIntegralLightLevel->setAndWriteToSim(intermediateLightValues.ovhdIntegralLightLevel);
  glareshieldIntegralLightLevel->setAndWriteToSim(intermediateLightValues.glareshieldIntegralLightLevel);
  glareshieldLcdLightLevel->setAndWriteToSim(intermediateLightValues.glareshieldLcdLightLevel);
  tableLightCptLevel->setAndWriteToSim(intermediateLightValues.tableLightCptLevel);
  tableLightFoLevel->setAndWriteToSim(intermediateLightValues.tableLightFoLevel);
  pfdBrtCptLevel->setAndWriteToSim(intermediateLightValues.pfdBrtCptLevel);
  ndBrtCptLevel->setAndWriteToSim(intermediateLightValues.ndBrtCptLevel);
  wxTerrainBrtCptLevel->setAndWriteToSim(intermediateLightValues.wxTerrainBrtCptLevel);
  consoleLightCptLevel->setAndWriteToSim(intermediateLightValues.consoleLightCptLevel);
  pfdBrtFoLevel->setAndWriteToSim(intermediateLightValues.pfdBrtFoLevel);
  ndBrtFoLevel->setAndWriteToSim(intermediateLightValues.ndBrtFoLevel);
  wxTerrainBrtFoLevel->setAndWriteToSim(intermediateLightValues.wxTerrainBrtFoLevel);
  consoleLightFoLevel->setAndWriteToSim(intermediateLightValues.consoleLightFoLevel);
  dcduLeftLightLevel->setAndWriteToSim(intermediateLightValues.dcduLeftLightLevel);
  dcduRightLightLevel->setAndWriteToSim(intermediateLightValues.dcduRightLightLevel);
  mcduLeftLightLevel->setAndWriteToSim(intermediateLightValues.mcduLeftLightLevel);
  mcduRightLightLevel->setAndWriteToSim(intermediateLightValues.mcduRightLightLevel);
  ecamUpperLightLevel->setAndWriteToSim(intermediateLightValues.ecamUpperLightLevel);
  ecamLowerLightLevel->setAndWriteToSim(intermediateLightValues.ecamLowerLightLevel);
  floodPnlLightLevel->setAndWriteToSim(intermediateLightValues.floodPnlLightLevel);
  pedestalIntegralLightLevel->setAndWriteToSim(intermediateLightValues.pedestalIntegralLightLevel);
  floodPedLightLevel->setAndWriteToSim(intermediateLightValues.floodPedLightLevel);
}

void LightingPresets_A32NX::loadFromIni(const mINI::INIStructure& ini,
                                          const std::string& iniSectionName) {
  // check if iniSectionName is available
  // if not use a 50% default iniSectionName
  if (!ini.has(iniSectionName)) {
    intermediateLightValues = DEFAULT_50;
    return;
  }

  // reading data structure from ini
  loadedLightValues.efbBrightness = iniGetOrDefault(ini, iniSectionName, "efb_brightness", 80.0);
  loadedLightValues.cabinLightLevel = iniGetOrDefault(ini, iniSectionName, "cabin_light", 50.0);
  loadedLightValues.ovhdIntegralLightLevel = iniGetOrDefault(ini, iniSectionName, "ovhd_int_lt", 50.0);
  loadedLightValues.glareshieldIntegralLightLevel = iniGetOrDefault(ini, iniSectionName, "glareshield_int_lt", 50.0);
  loadedLightValues.glareshieldLcdLightLevel = iniGetOrDefault(ini, iniSectionName, "glareshield_lcd_lt", 50.0);
  loadedLightValues.tableLightCptLevel = iniGetOrDefault(ini, iniSectionName, "table_cpt_lt", 50.0);
  loadedLightValues.tableLightFoLevel = iniGetOrDefault(ini, iniSectionName, "table_fo_lt", 50.0);
  loadedLightValues.pfdBrtCptLevel = iniGetOrDefault(ini, iniSectionName, "pfd_cpt_lvl", 50.0);
  loadedLightValues.ndBrtCptLevel = iniGetOrDefault(ini, iniSectionName, "nd_cpt_lvl", 50.0);
  loadedLightValues.wxTerrainBrtCptLevel = iniGetOrDefault(ini, iniSectionName, "wx_cpt_lvl", 50.0);
  loadedLightValues.consoleLightCptLevel = iniGetOrDefault(ini, iniSectionName, "console_cpt_lt", 50.0);
  loadedLightValues.pfdBrtFoLevel = iniGetOrDefault(ini, iniSectionName, "pfd_fo_lvl", 50.0);
  loadedLightValues.ndBrtFoLevel = iniGetOrDefault(ini, iniSectionName, "nd_fo_lvl", 50.0);
  loadedLightValues.wxTerrainBrtFoLevel = iniGetOrDefault(ini, iniSectionName, "wx_fo_lvl", 50.0);
  loadedLightValues.consoleLightFoLevel = iniGetOrDefault(ini, iniSectionName, "console_fo_lt", 50.0);
  loadedLightValues.dcduLeftLightLevel = iniGetOrDefault(ini, iniSectionName, "dcdu_left_lvl", 50.0) / 100;
  loadedLightValues.dcduRightLightLevel = iniGetOrDefault(ini, iniSectionName, "dcdu_right_lvl", 50.0) / 100;
  loadedLightValues.mcduLeftLightLevel = iniGetOrDefault(ini, iniSectionName, "mcdu_left_lvl", 50.0) / 100;
  loadedLightValues.mcduRightLightLevel = iniGetOrDefault(ini, iniSectionName, "mcdu_right_lvl", 50.0) / 100;
  loadedLightValues.ecamUpperLightLevel = iniGetOrDefault(ini, iniSectionName, "ecam_upper_lvl", 50.0);
  loadedLightValues.ecamLowerLightLevel = iniGetOrDefault(ini, iniSectionName, "ecam_lower_lvl", 50.0);
  loadedLightValues.floodPnlLightLevel = iniGetOrDefault(ini, iniSectionName, "flood_pnl_lt", 50.0);
  loadedLightValues.pedestalIntegralLightLevel = iniGetOrDefault(ini, iniSectionName, "pedestal_int_lt", 50.0);
  loadedLightValues.floodPedLightLevel = iniGetOrDefault(ini, iniSectionName, "flood_ped_lvl", 50.0);
}

void LightingPresets_A32NX::saveToIni(mINI::INIStructure& ini, const std::string& iniSectionName) const {
  ini[iniSectionName]["efb_brightness"] = std::to_string(currentLightValues.efbBrightness);
  ini[iniSectionName]["cabin_light"] = std::to_string(currentLightValues.cabinLightLevel);
  ini[iniSectionName]["ovhd_int_lt"] = std::to_string(currentLightValues.ovhdIntegralLightLevel);
  ini[iniSectionName]["glareshield_int_lt"] = std::to_string(currentLightValues.glareshieldIntegralLightLevel);
  ini[iniSectionName]["glareshield_lcd_lt"] = std::to_string(currentLightValues.glareshieldLcdLightLevel);
  ini[iniSectionName]["table_cpt_lt"] = std::to_string(currentLightValues.tableLightCptLevel);
  ini[iniSectionName]["table_fo_lt"] = std::to_string(currentLightValues.tableLightFoLevel);
  ini[iniSectionName]["pfd_cpt_lvl"] = std::to_string(currentLightValues.pfdBrtCptLevel);
  ini[iniSectionName]["nd_cpt_lvl"] = std::to_string(currentLightValues.ndBrtCptLevel);
  ini[iniSectionName]["wx_cpt_lvl"] = std::to_string(currentLightValues.wxTerrainBrtCptLevel);
  ini[iniSectionName]["console_cpt_lt"] = std::to_string(currentLightValues.consoleLightCptLevel);
  ini[iniSectionName]["pfd_fo_lvl"] = std::to_string(currentLightValues.pfdBrtFoLevel);
  ini[iniSectionName]["nd_fo_lvl"] = std::to_string(currentLightValues.ndBrtFoLevel);
  ini[iniSectionName]["wx_fo_lvl"] = std::to_string(currentLightValues.wxTerrainBrtFoLevel);
  ini[iniSectionName]["console_fo_lt"] = std::to_string(currentLightValues.consoleLightFoLevel);
  ini[iniSectionName]["dcdu_left_lvl"] = std::to_string(currentLightValues.dcduLeftLightLevel * 100);
  ini[iniSectionName]["dcdu_right_lvl"] = std::to_string(currentLightValues.dcduRightLightLevel * 100);
  ini[iniSectionName]["mcdu_left_lvl"] = std::to_string(currentLightValues.mcduLeftLightLevel * 100);
  ini[iniSectionName]["mcdu_right_lvl"] = std::to_string(currentLightValues.mcduRightLightLevel * 100);
  ini[iniSectionName]["ecam_upper_lvl"] = std::to_string(currentLightValues.ecamUpperLightLevel);
  ini[iniSectionName]["ecam_lower_lvl"] = std::to_string(currentLightValues.ecamLowerLightLevel);
  ini[iniSectionName]["flood_pnl_lt"] = std::to_string(currentLightValues.floodPnlLightLevel);
  ini[iniSectionName]["pedestal_int_lt"] = std::to_string(currentLightValues.pedestalIntegralLightLevel);
  ini[iniSectionName]["flood_ped_lvl"] = std::to_string(currentLightValues.floodPedLightLevel);
}

[[maybe_unused]] std::string LightingPresets_A32NX::str() const {
  std::ostringstream os;
  os << "EFB Brightness: " << intermediateLightValues.efbBrightness << std::endl;
  os << "Cabin Light: " << intermediateLightValues.cabinLightLevel << std::endl;
  os << "Ovhd Int Lt: " << intermediateLightValues.ovhdIntegralLightLevel << std::endl;
  os << "Glareshield Int Lt: " << intermediateLightValues.glareshieldIntegralLightLevel << std::endl;
  os << "Glareshield Lcd Lt: " << intermediateLightValues.glareshieldLcdLightLevel << std::endl;
  os << "Table Cpt Lt: " << intermediateLightValues.tableLightCptLevel << std::endl;
  os << "Table FO Lt: " << intermediateLightValues.tableLightFoLevel << std::endl;
  os << "PFD Cpt Lvl: " << intermediateLightValues.pfdBrtCptLevel << std::endl;
  os << "ND Cpt Lvl: " << intermediateLightValues.ndBrtCptLevel << std::endl;
  os << "WX Cpt Lvl: " << intermediateLightValues.wxTerrainBrtCptLevel << std::endl;
  os << "Console Cpt Lt: " << intermediateLightValues.consoleLightCptLevel << std::endl;
  os << "PFD FO Lvl: " << intermediateLightValues.pfdBrtFoLevel << std::endl;
  os << "ND FO Lvl: " << intermediateLightValues.ndBrtFoLevel << std::endl;
  os << "WX FO Lvl: " << intermediateLightValues.wxTerrainBrtFoLevel << std::endl;
  os << "Console Fo Lt: " << intermediateLightValues.consoleLightFoLevel << std::endl;
  os << "DCDU Left Lvl: " << intermediateLightValues.dcduLeftLightLevel << std::endl;
  os << "DCDU Right Lvl: " << intermediateLightValues.dcduRightLightLevel << std::endl;
  os << "MCDU Left Lvl: " << intermediateLightValues.mcduLeftLightLevel << std::endl;
  os << "MCDU Right Lvl: " << intermediateLightValues.mcduRightLightLevel << std::endl;
  os << "ECAM Upper Lvl: " << intermediateLightValues.ecamUpperLightLevel << std::endl;
  os << "ECAM Lower Lvl: " << intermediateLightValues.ecamLowerLightLevel << std::endl;
  os << "Floor Cpt Lt: " << intermediateLightValues.floodPnlLightLevel << std::endl;
  os << "Pedestal Int Lt: " << intermediateLightValues.pedestalIntegralLightLevel << std::endl;
  os << "Floor FO Lvl: " << intermediateLightValues.floodPedLightLevel << std::endl;
  return os.str();
}

void LightingPresets_A32NX::setValidCabinLightValue(FLOAT64 level) {
  // cabin light level needs to either be 0, 50 or 100 for the switch position
  // in the aircraft to work.
  if (level <= 0.0) {
    level = 0.0;
  } else if (level > 0.0 && level <= 50.0) {
    level = 50.0;
  } else if ((level > 0.0 && level > 50.0)) {
    level = 100.0;
  }
  // cabin lights in the A32NX need to be controlled by two vars
  // one for the switch position and one for the actual light
  lightCabinLevel->setAndWriteToSim(level);
  lightCabin->setAndWriteToSim(level > 0 ? 1 : 0);
}

bool LightingPresets_A32NX::calculateIntermediateValues() {
  // clang-format off
  intermediateLightValues.efbBrightness = convergeValue( currentLightValues.efbBrightness,loadedLightValues.efbBrightness);
  intermediateLightValues.cabinLightLevel = loadedLightValues.cabinLightLevel;
  intermediateLightValues.ovhdIntegralLightLevel = convergeValue( currentLightValues.ovhdIntegralLightLevel,loadedLightValues.ovhdIntegralLightLevel);
  intermediateLightValues.glareshieldIntegralLightLevel = convergeValue( currentLightValues.glareshieldIntegralLightLevel,loadedLightValues.glareshieldIntegralLightLevel);
  intermediateLightValues.glareshieldLcdLightLevel = convergeValue( currentLightValues.glareshieldLcdLightLevel,loadedLightValues.glareshieldLcdLightLevel);
  intermediateLightValues.tableLightCptLevel = convergeValue( currentLightValues.tableLightCptLevel,loadedLightValues.tableLightCptLevel);
  intermediateLightValues.tableLightFoLevel = convergeValue( currentLightValues.tableLightFoLevel,loadedLightValues.tableLightFoLevel);
  intermediateLightValues.pfdBrtCptLevel = convergeValue( currentLightValues.pfdBrtCptLevel,loadedLightValues.pfdBrtCptLevel);
  intermediateLightValues.ndBrtCptLevel = convergeValue( currentLightValues.ndBrtCptLevel,loadedLightValues.ndBrtCptLevel);
  intermediateLightValues.wxTerrainBrtCptLevel = convergeValue( currentLightValues.wxTerrainBrtCptLevel,loadedLightValues.wxTerrainBrtCptLevel);
  intermediateLightValues.consoleLightCptLevel = convergeValue( currentLightValues.consoleLightCptLevel,loadedLightValues.consoleLightCptLevel);
  intermediateLightValues.pfdBrtFoLevel = convergeValue( currentLightValues.pfdBrtFoLevel,loadedLightValues.pfdBrtFoLevel);
  intermediateLightValues.ndBrtFoLevel = convergeValue( currentLightValues.ndBrtFoLevel,loadedLightValues.ndBrtFoLevel);
  intermediateLightValues.wxTerrainBrtFoLevel = convergeValue( currentLightValues.wxTerrainBrtFoLevel,loadedLightValues.wxTerrainBrtFoLevel);
  intermediateLightValues.consoleLightFoLevel = convergeValue( currentLightValues.consoleLightFoLevel,loadedLightValues.consoleLightFoLevel);
  intermediateLightValues.dcduLeftLightLevel = convergeValue( currentLightValues.dcduLeftLightLevel,loadedLightValues.dcduLeftLightLevel);
  intermediateLightValues.dcduRightLightLevel = convergeValue( currentLightValues.dcduRightLightLevel,loadedLightValues.dcduRightLightLevel);
  intermediateLightValues.mcduLeftLightLevel = convergeValue( currentLightValues.mcduLeftLightLevel,loadedLightValues.mcduLeftLightLevel);
  intermediateLightValues.mcduRightLightLevel = convergeValue( currentLightValues.mcduRightLightLevel,loadedLightValues.mcduRightLightLevel);
  intermediateLightValues.ecamUpperLightLevel = convergeValue( currentLightValues.ecamUpperLightLevel,loadedLightValues.ecamUpperLightLevel);
  intermediateLightValues.ecamLowerLightLevel = convergeValue( currentLightValues.ecamLowerLightLevel,loadedLightValues.ecamLowerLightLevel);
  intermediateLightValues.floodPnlLightLevel = convergeValue( currentLightValues.floodPnlLightLevel,loadedLightValues.floodPnlLightLevel);
  intermediateLightValues.pedestalIntegralLightLevel = convergeValue( currentLightValues.pedestalIntegralLightLevel,loadedLightValues.pedestalIntegralLightLevel);
  intermediateLightValues.floodPedLightLevel = convergeValue( currentLightValues.floodPedLightLevel,loadedLightValues.floodPedLightLevel);
  // clang-format on
  return intermediateLightValues == loadedLightValues;
}
