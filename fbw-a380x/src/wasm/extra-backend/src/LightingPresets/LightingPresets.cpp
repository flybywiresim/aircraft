// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <MSFS/Legacy/gauges.h>
#include <iostream>

#include "AircraftVariable.h"
#include "LightingPresets.h"
#include "MsfsHandler.h"
#include "NamedVariable.h"
#include "logging.h"

///
// DataManager Howto Note:
// =======================

// The LightingPresets module uses the DataManager to get and set variables.
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
///

bool LightingPresets::initialize() {
  dataManager = &msfsHandler.getDataManager();

  // Events for setting the aircraft variables
  lightPotentiometerSetEvent = dataManager->make_client_event("LIGHT_POTENTIOMETER_SET", NOTIFICATION_GROUP_1);
  cabinLightSetEvent = dataManager->make_client_event("CABIN_LIGHTS_SET", NOTIFICATION_GROUP_1);

  // Control LVARs - auto updated with every tick - LOAD/SAVE also auto written to sim
  elecAC1Powered = dataManager->make_named_var("ELEC_AC_1_BUS_IS_POWERED", UNITS.Number, true, false);
  loadLightingPresetRequest = dataManager->make_named_var("LIGHTING_PRESET_LOAD", UNITS.Number, true, true);
  saveLightingPresetRequest = dataManager->make_named_var("LIGHTING_PRESET_SAVE", UNITS.Number, true, true);

  // Lighting LVARs - manual update and write when load/saving is requested
  efbBrightness = dataManager->make_named_var("EFB_BRIGHTNESS", UNITS.Number, false, false);
  dcduLeftLightLevel = dataManager->make_named_var("PANEL_DCDU_L_BRIGHTNESS", UNITS.Number, false, false);
  dcduRightLightLevel = dataManager->make_named_var("PANEL_DCDU_R_BRIGHTNESS", UNITS.Number, false, false);
  mcduLeftLightLevel = dataManager->make_named_var("MCDU_L_BRIGHTNESS", UNITS.Number, false, false);
  mcduRightLightLevel = dataManager->make_named_var("MCDU_R_BRIGHTNESS", UNITS.Number, false, false);

  // Light Potentiometers - manual update and write when load/saving is requested
  lightCabin = dataManager->make_aircraft_var("LIGHT CABIN", 0, "", cabinLightSetEvent, UNITS.Percent);
  lightCabinLevel = getLightPotentiometerVar(7);
  ovhdIntegralLightLevel = getLightPotentiometerVar(86);
  glareshieldIntegralLightLevel = getLightPotentiometerVar(84);
  glareshieldLcdLightLevel = getLightPotentiometerVar(87);
  tableLightCptLevel = getLightPotentiometerVar(10);
  tableLightFoLevel = getLightPotentiometerVar(11);
  pfdBrtCptLevel = getLightPotentiometerVar(88);
  ndBrtCptLevel = getLightPotentiometerVar(89);
  wxTerrainBrtCptLevel = getLightPotentiometerVar(94);
  consoleLightCptLevel = getLightPotentiometerVar(8);
  pfdBrtFoLevel = getLightPotentiometerVar(90);
  ndBrtFoLevel = getLightPotentiometerVar(91);
  wxTerrainBrtFoLevel = getLightPotentiometerVar(95);
  consoleLightFoLevel = getLightPotentiometerVar(9);
  ecamUpperLightLevel = getLightPotentiometerVar(92);
  ecamLowerLightLevel = getLightPotentiometerVar(93);
  floodPnlLightLevel = getLightPotentiometerVar(83);
  pedestalIntegralLightLevel = getLightPotentiometerVar(85);
  floodPedLightLevel = getLightPotentiometerVar(76);

  isInitialized = true;
  LOG_INFO("LightingPresets initialized");
  return true;
}

bool LightingPresets::preUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  //  std::cout << "LightingPresets::preUpdate()" << std::endl;
  return true;
}

bool LightingPresets::update([[maybe_unused]] sGaugeDrawData* pData) {
  if (!isInitialized) {
    LOG_ERROR("LightingPresets::update() - not initialized");
    return false;
  }

  // only run when aircraft is powered
  if (!msfsHandler.getA32NxIsReady() || !elecAC1Powered->getAsBool())
    return true;

  // load becomes priority in case both vars are set.
  if (loadLightingPresetRequest->getAsBool()) {
    loadLightingPreset(loadLightingPresetRequest->getAsInt64());

  } else if (saveLightingPresetRequest->getAsBool()) {
    saveLightingPreset(saveLightingPresetRequest->getAsInt64());
  }

  loadLightingPresetRequest->setAsInt64(0);
  saveLightingPresetRequest->setAsInt64(0);

  return true;
}

bool LightingPresets::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  // empty
  return true;
}

bool LightingPresets::shutdown() {
  isInitialized = false;
  LOG_INFO("LightingPresets::shutdown()");
  return true;
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================

bool LightingPresets::loadLightingPreset(int64_t loadPresetRequest) {
  LOG_INFO("LightingPresets: Loading preset: " + std::to_string(loadPresetRequest));
  if (readFromStore(loadPresetRequest)) {
    applyToAircraft();
    LOG_INFO("LightingPresets: Lighting Preset: " + std::to_string(loadPresetRequest) + " successfully loaded.");
    return;
  }
  LOG_WARN("LightingPresets: Loading Lighting Preset: " + std::to_string(loadPresetRequest) + " failed.");
}

void LightingPresets::saveLightingPreset(int64_t savePresetRequest) {
  std::cout << "LightingPresets: Save to Lighting Preset: " << savePresetRequest << std::endl;
  readFromAircraft();
  if (saveToStore(savePresetRequest)) {
    LOG_INFO("LightingPresets: Lighting Preset: " + std::to_string(savePresetRequest) + " successfully saved.");
    return;
  }
  LOG_WARN("LightingPresets: Saving Lighting Preset: " + std::to_string(savePresetRequest) + " failed.");
}

void LightingPresets::readFromAircraft() {
  intermediateLightValues.efbBrightness = efbBrightness->readFromSim();
  intermediateLightValues.cabinLightLevel = lightCabinLevel->readFromSim();
  intermediateLightValues.ovhdIntegralLightLevel = ovhdIntegralLightLevel->readFromSim();
  intermediateLightValues.glareshieldIntegralLightLevel = glareshieldIntegralLightLevel->readFromSim();
  intermediateLightValues.glareshieldLcdLightLevel = glareshieldLcdLightLevel->readFromSim();
  intermediateLightValues.tableLightCptLevel = tableLightCptLevel->readFromSim();
  intermediateLightValues.tableLightFoLevel = tableLightFoLevel->readFromSim();
  intermediateLightValues.pfdBrtCptLevel = pfdBrtCptLevel->readFromSim();
  intermediateLightValues.ndBrtCptLevel = ndBrtCptLevel->readFromSim();
  intermediateLightValues.wxTerrainBrtCptLevel = wxTerrainBrtCptLevel->readFromSim();
  intermediateLightValues.consoleLightCptLevel = consoleLightCptLevel->readFromSim();
  intermediateLightValues.pfdBrtFoLevel = pfdBrtFoLevel->readFromSim();
  intermediateLightValues.ndBrtFoLevel = ndBrtFoLevel->readFromSim();
  intermediateLightValues.wxTerrainBrtFoLevel = wxTerrainBrtFoLevel->readFromSim();
  intermediateLightValues.consoleLightFoLevel = consoleLightFoLevel->readFromSim();
  intermediateLightValues.dcduLeftLightLevel = dcduLeftLightLevel->readFromSim();
  intermediateLightValues.dcduRightLightLevel = dcduLeftLightLevel->readFromSim();
  intermediateLightValues.mcduLeftLightLevel = mcduLeftLightLevel->readFromSim();
  intermediateLightValues.mcduRightLightLevel = mcduRightLightLevel->readFromSim();
  intermediateLightValues.ecamUpperLightLevel = ecamUpperLightLevel->readFromSim();
  intermediateLightValues.ecamLowerLightLevel = ecamLowerLightLevel->readFromSim();
  intermediateLightValues.floodPnlLightLevel = floodPnlLightLevel->readFromSim();
  intermediateLightValues.pedestalIntegralLightLevel = pedestalIntegralLightLevel->readFromSim();
  intermediateLightValues.floodPedLightLevel = floodPedLightLevel->readFromSim();
}

void LightingPresets::applyToAircraft() {
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

bool LightingPresets::readFromStore(int64_t presetNr) {
  // create ini file and data structure
  mINI::INIStructure ini;
  mINI::INIFile iniFile(CONFIGURATION_FILEPATH);

  // load file
  bool result = iniFile.read(ini);

  const std::string preset = "preset " + std::to_string(presetNr);

  // check if preset is available
  // if not use a 50% default preset
  if (!ini.has(preset)) {
    loadFromData(DEFAULT_50);
    return true;
  }

  // reading data structure from ini
  intermediateLightValues.efbBrightness = iniGetOrDefault(ini, preset, "efb_brightness", 80.0);
  intermediateLightValues.cabinLightLevel = iniGetOrDefault(ini, preset, "cabin_light", 50.0);
  intermediateLightValues.ovhdIntegralLightLevel = iniGetOrDefault(ini, preset, "ovhd_int_lt", 50.0);
  intermediateLightValues.glareshieldIntegralLightLevel = iniGetOrDefault(ini, preset, "glareshield_int_lt", 50.0);
  intermediateLightValues.glareshieldLcdLightLevel = iniGetOrDefault(ini, preset, "glareshield_lcd_lt", 50.0);
  intermediateLightValues.tableLightCptLevel = iniGetOrDefault(ini, preset, "table_cpt_lt", 50.0);
  intermediateLightValues.tableLightFoLevel = iniGetOrDefault(ini, preset, "table_fo_lt", 50.0);
  intermediateLightValues.pfdBrtCptLevel = iniGetOrDefault(ini, preset, "pfd_cpt_lvl", 50.0);
  intermediateLightValues.ndBrtCptLevel = iniGetOrDefault(ini, preset, "nd_cpt_lvl", 50.0);
  intermediateLightValues.wxTerrainBrtCptLevel = iniGetOrDefault(ini, preset, "wx_cpt_lvl", 50.0);
  intermediateLightValues.consoleLightCptLevel = iniGetOrDefault(ini, preset, "console_cpt_lt", 50.0);
  intermediateLightValues.pfdBrtFoLevel = iniGetOrDefault(ini, preset, "pfd_fo_lvl", 50.0);
  intermediateLightValues.ndBrtFoLevel = iniGetOrDefault(ini, preset, "nd_fo_lvl", 50.0);
  intermediateLightValues.wxTerrainBrtFoLevel = iniGetOrDefault(ini, preset, "wx_fo_lvl", 50.0);
  intermediateLightValues.consoleLightFoLevel = iniGetOrDefault(ini, preset, "console_fo_lt", 50.0);
  intermediateLightValues.dcduLeftLightLevel = iniGetOrDefault(ini, preset, "dcdu_left_lvl", 50.0) / 100;
  intermediateLightValues.dcduRightLightLevel = iniGetOrDefault(ini, preset, "dcdu_right_lvl", 50.0) / 100;
  intermediateLightValues.mcduLeftLightLevel = iniGetOrDefault(ini, preset, "mcdu_left_lvl", 50.0) / 100;
  intermediateLightValues.mcduRightLightLevel = iniGetOrDefault(ini, preset, "mcdu_right_lvl", 50.0) / 100;
  intermediateLightValues.ecamUpperLightLevel = iniGetOrDefault(ini, preset, "ecam_upper_lvl", 50.0);
  intermediateLightValues.ecamLowerLightLevel = iniGetOrDefault(ini, preset, "ecam_lower_lvl", 50.0);
  intermediateLightValues.floodPnlLightLevel = iniGetOrDefault(ini, preset, "flood_pnl_lt", 50.0);
  intermediateLightValues.pedestalIntegralLightLevel = iniGetOrDefault(ini, preset, "pedestal_int_lt", 50.0);
  intermediateLightValues.floodPedLightLevel = iniGetOrDefault(ini, preset, "flood_ped_lvl", 50.0);

  return result;
}

bool LightingPresets::saveToStore(int64_t presetNr) {
  // create ini file and data structure
  mINI::INIStructure ini;
  mINI::INIFile iniFile(CONFIGURATION_FILEPATH);

  // load file
  bool result = iniFile.read(ini);

  // add/update preset
  const std::string preset = "preset " + std::to_string(presetNr);
  ini[preset]["efb_brightness"] = std::to_string(intermediateLightValues.efbBrightness);
  ini[preset]["cabin_light"] = std::to_string(intermediateLightValues.cabinLightLevel);
  ini[preset]["ovhd_int_lt"] = std::to_string(intermediateLightValues.ovhdIntegralLightLevel);
  ini[preset]["glareshield_int_lt"] = std::to_string(intermediateLightValues.glareshieldIntegralLightLevel);
  ini[preset]["glareshield_lcd_lt"] = std::to_string(intermediateLightValues.glareshieldLcdLightLevel);
  ini[preset]["table_cpt_lt"] = std::to_string(intermediateLightValues.tableLightCptLevel);
  ini[preset]["table_fo_lt"] = std::to_string(intermediateLightValues.tableLightFoLevel);
  ini[preset]["pfd_cpt_lvl"] = std::to_string(intermediateLightValues.pfdBrtCptLevel);
  ini[preset]["nd_cpt_lvl"] = std::to_string(intermediateLightValues.ndBrtCptLevel);
  ini[preset]["wx_cpt_lvl"] = std::to_string(intermediateLightValues.wxTerrainBrtCptLevel);
  ini[preset]["console_cpt_lt"] = std::to_string(intermediateLightValues.consoleLightCptLevel);
  ini[preset]["pfd_fo_lvl"] = std::to_string(intermediateLightValues.pfdBrtFoLevel);
  ini[preset]["nd_fo_lvl"] = std::to_string(intermediateLightValues.ndBrtFoLevel);
  ini[preset]["wx_fo_lvl"] = std::to_string(intermediateLightValues.wxTerrainBrtFoLevel);
  ini[preset]["console_fo_lt"] = std::to_string(intermediateLightValues.consoleLightFoLevel);
  ini[preset]["dcdu_left_lvl"] = std::to_string(intermediateLightValues.dcduLeftLightLevel * 100);
  ini[preset]["dcdu_right_lvl"] = std::to_string(intermediateLightValues.dcduRightLightLevel * 100);
  ini[preset]["mcdu_left_lvl"] = std::to_string(intermediateLightValues.mcduLeftLightLevel * 100);
  ini[preset]["mcdu_right_lvl"] = std::to_string(intermediateLightValues.mcduRightLightLevel * 100);
  ini[preset]["ecam_upper_lvl"] = std::to_string(intermediateLightValues.ecamUpperLightLevel);
  ini[preset]["ecam_lower_lvl"] = std::to_string(intermediateLightValues.ecamLowerLightLevel);
  ini[preset]["flood_pnl_lt"] = std::to_string(intermediateLightValues.floodPnlLightLevel);
  ini[preset]["pedestal_int_lt"] = std::to_string(intermediateLightValues.pedestalIntegralLightLevel);
  ini[preset]["flood_ped_lvl"] = std::to_string(intermediateLightValues.floodPedLightLevel);

  result &= iniFile.write(ini, true);

  return result;
}

void LightingPresets::loadFromData(LightingValues lv) {
  intermediateLightValues = lv;
}

[[maybe_unused]] std::string LightingPresets::sprint() const {
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

double LightingPresets::iniGetOrDefault(const mINI::INIStructure& ini,
                                        const std::string& section,
                                        const std::string& key,
                                        const double defaultValue) {
  if (ini.get(section).has(key)) {
    // As MSFS wasm does not support exceptions (try/catch) we can't use
    // std::stof here. Workaround with std::stringstreams.
    std::stringstream input(ini.get(section).get(key));
    double value = defaultValue;
    if (input >> value) {
      return value;
    } else {
      LOG_WARN("LightingPresets: reading ini value for [" + section + "] " + key + " = " + ini.get(section).get(key) + " failed.");
    }
  }
  return defaultValue;
}

std::shared_ptr<AircraftVariable> LightingPresets::getLightPotentiometerVar(int index) const {
  return dataManager->make_aircraft_var("LIGHT POTENTIOMETER", index, "", lightPotentiometerSetEvent, UNITS.Percent, false, false, 0.0, 0);
}

void LightingPresets::setValidCabinLightValue(FLOAT64 level) {
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
