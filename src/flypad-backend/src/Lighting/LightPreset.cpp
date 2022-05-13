// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>
#include <string>

#include "LightPreset.h"

void LightPreset::initialize() {
  isInitialized = true;
  std::cout << "PRESETS: LightPresets initialized" << std::endl;
}

void LightPreset::onUpdate(__attribute__((unused)) double deltaTime) {
  if (!isInitialized) {
    return;
  }

  // get aircraft AC power state
  const bool isAC1powered = (bool) simVars->getElecAC1State();

  if (isAC1powered) {
    // read the LVAR used to signal loading or saving
    const auto loadLightingPresetRequest = static_cast<int64_t>(simVars->getLoadLightingPresetRequest());
    const auto saveLightingPresetRequest = static_cast<int64_t>(simVars->getSaveLightingPresetRequest());

    // load becomes priority in case both vars are set.
    if (loadLightingPresetRequest) {
      loadLightingPreset(loadLightingPresetRequest);
    }
    else if (saveLightingPresetRequest) {
      saveLightingPreset(saveLightingPresetRequest);
    }

    // reset the request signal vars
    simVars->setLoadLightingPresetRequest(0);
    simVars->setSaveLightingPresetRequest(0);
  }
}

void LightPreset::shutdown() {
  isInitialized = false;
  std::cout << "PRESETS: LightPresets shutdown" << std::endl;
}

void LightPreset::loadLightingPreset(int64_t loadPresetRequest) {
  std::cout << "PRESETS: Loading preset: " << loadPresetRequest << std::endl;
  if (readFromStore(loadPresetRequest)) {
    applyToAircraft();
    std::cout << "PRESETS: Lighting Preset: " << loadPresetRequest << " successfully loaded."
              << std::endl;
    return;
  }
  std::cout << "PRESETS: Loading Lighting Preset: " << loadPresetRequest << " failed." << std::endl;
}

void LightPreset::saveLightingPreset(int64_t savePresetRequest) {
  std::cout << "PRESETS: Save to Lighting Preset: " << savePresetRequest << std::endl;
  readFromAircraft();
  if (saveToStore(savePresetRequest)) {
    std::cout << "PRESETS: Lighting Preset: " << savePresetRequest << " successfully saved."
              << std::endl;
    return;
  }
  std::cout << "PRESETS: Saving Lighting Preset: " << savePresetRequest << " failed." << std::endl;
}

void LightPreset::readFromAircraft() {
  lightValues.efbBrightness = simVars->getEfbBrightness();
  lightValues.cabinLightLevel = simVars->getLightCabin();
  lightValues.ovhdIntegralLightLevel = simVars->getLightPotentiometer(86);
  lightValues.glareshieldIntegralLightLevel = simVars->getLightPotentiometer(84);
  lightValues.glareshieldLcdLightLevel = simVars->getLightPotentiometer(87);
  lightValues.tableLightCptLevel = simVars->getLightPotentiometer(10);
  lightValues.tableLightFoLevel = simVars->getLightPotentiometer(11);
  lightValues.pfdBrtCptLevel = simVars->getLightPotentiometer(88);
  lightValues.ndBrtCptLevel = simVars->getLightPotentiometer(89);
  lightValues.wxTerrainBrtCptLevel = simVars->getLightPotentiometer(94);
  lightValues.consoleLightCptLevel = simVars->getLightPotentiometer(8);
  lightValues.pfdBrtFoLevel = simVars->getLightPotentiometer(90);
  lightValues.ndBrtFoLevel = simVars->getLightPotentiometer(91);
  lightValues.wxTerrainBrtFoLevel = simVars->getLightPotentiometer(95);
  lightValues.consoleLightFoLevel = simVars->getLightPotentiometer(9);
  lightValues.dcduLeftLightLevel = simVars->getDcduLightLevel(Left);
  lightValues.dcduRightLightLevel = simVars->getDcduLightLevel(Right);
  lightValues.mcduLeftLightLevel = simVars->getMcduLightLevel(Left);
  lightValues.mcduRightLightLevel = simVars->getMcduLightLevel(Right);
  lightValues.ecamUpperLightLevel = simVars->getLightPotentiometer(92);
  lightValues.ecamLowerLightLevel = simVars->getLightPotentiometer(93);
  lightValues.floodPnlLightLevel = simVars->getLightPotentiometer(83);
  lightValues.pedestalIntegralLightLevel = simVars->getLightPotentiometer(85);
  lightValues.floodPedLightLevel = simVars->getLightPotentiometer(76);
}

void LightPreset::applyToAircraft() {
  simVars->setEfbBrightness(lightValues.efbBrightness);
  simVars->setLightCabin(lightValues.cabinLightLevel);
  simVars->setLightPotentiometer(86, lightValues.ovhdIntegralLightLevel);
  simVars->setLightPotentiometer(84, lightValues.glareshieldIntegralLightLevel);
  simVars->setLightPotentiometer(87, lightValues.glareshieldLcdLightLevel);
  simVars->setLightPotentiometer(10, lightValues.tableLightCptLevel);
  simVars->setLightPotentiometer(11, lightValues.tableLightFoLevel);
  simVars->setLightPotentiometer(88, lightValues.pfdBrtCptLevel);
  simVars->setLightPotentiometer(89, lightValues.ndBrtCptLevel);
  simVars->setLightPotentiometer(94, lightValues.wxTerrainBrtCptLevel);
  simVars->setLightPotentiometer(8, lightValues.consoleLightCptLevel);
  simVars->setLightPotentiometer(90, lightValues.pfdBrtFoLevel);
  simVars->setLightPotentiometer(91, lightValues.ndBrtFoLevel);
  simVars->setLightPotentiometer(95, lightValues.wxTerrainBrtFoLevel);
  simVars->setLightPotentiometer(9, lightValues.consoleLightFoLevel);
  simVars->setDcduLightLevel(Left, lightValues.dcduLeftLightLevel);
  simVars->setDcduLightLevel(Right, lightValues.dcduRightLightLevel);
  simVars->setMcduLightLevel(Left, lightValues.mcduLeftLightLevel);
  simVars->setMcduLightLevel(Right, lightValues.mcduRightLightLevel);
  simVars->setLightPotentiometer(92, lightValues.ecamUpperLightLevel);
  simVars->setLightPotentiometer(93, lightValues.ecamLowerLightLevel);
  simVars->setLightPotentiometer(83, lightValues.floodPnlLightLevel);
  simVars->setLightPotentiometer(85, lightValues.pedestalIntegralLightLevel);
  simVars->setLightPotentiometer(76, lightValues.floodPedLightLevel);
}

bool LightPreset::readFromStore(int64_t presetNr) {
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
  lightValues.efbBrightness = iniGetOrDefault(ini, preset, "efb_brightness", 80.0);
  lightValues.cabinLightLevel = iniGetOrDefault(ini, preset, "cabin_light", 50.0);
  lightValues.ovhdIntegralLightLevel = iniGetOrDefault(ini, preset, "ovhd_int_lt", 50.0);
  lightValues.glareshieldIntegralLightLevel = iniGetOrDefault(ini, preset, "glareshield_int_lt", 50.0);
  lightValues.glareshieldLcdLightLevel = iniGetOrDefault(ini, preset, "glareshield_lcd_lt", 50.0);
  lightValues.tableLightCptLevel = iniGetOrDefault(ini, preset, "table_cpt_lt", 50.0);
  lightValues.tableLightFoLevel = iniGetOrDefault(ini, preset, "table_fo_lt", 50.0);
  lightValues.pfdBrtCptLevel = iniGetOrDefault(ini, preset, "pfd_cpt_lvl", 50.0);
  lightValues.ndBrtCptLevel = iniGetOrDefault(ini, preset, "nd_cpt_lvl", 50.0);
  lightValues.wxTerrainBrtCptLevel = iniGetOrDefault(ini, preset, "wx_cpt_lvl", 50.0);
  lightValues.consoleLightCptLevel = iniGetOrDefault(ini, preset, "console_cpt_lt", 50.0);
  lightValues.pfdBrtFoLevel = iniGetOrDefault(ini, preset, "pfd_fo_lvl", 50.0);
  lightValues.ndBrtFoLevel = iniGetOrDefault(ini, preset, "nd_fo_lvl", 50.0);
  lightValues.wxTerrainBrtFoLevel = iniGetOrDefault(ini, preset, "wx_fo_lvl", 50.0);
  lightValues.consoleLightFoLevel = iniGetOrDefault(ini, preset, "console_fo_lt", 50.0);
  lightValues.dcduLeftLightLevel = iniGetOrDefault(ini, preset, "dcdu_left_lvl", 50.0) / 100;
  lightValues.dcduRightLightLevel = iniGetOrDefault(ini, preset, "dcdu_right_lvl", 50.0) / 100;
  lightValues.mcduLeftLightLevel = iniGetOrDefault(ini, preset, "mcdu_left_lvl", 50.0) / 100;
  lightValues.mcduRightLightLevel = iniGetOrDefault(ini, preset, "mcdu_right_lvl", 50.0) / 100;
  lightValues.ecamUpperLightLevel = iniGetOrDefault(ini, preset, "ecam_upper_lvl", 50.0);
  lightValues.ecamLowerLightLevel = iniGetOrDefault(ini, preset, "ecam_lower_lvl", 50.0);
  lightValues.floodPnlLightLevel = iniGetOrDefault(ini, preset, "flood_pnl_lt", 50.0);
  lightValues.pedestalIntegralLightLevel = iniGetOrDefault(ini, preset, "pedestal_int_lt", 50.0);
  lightValues.floodPedLightLevel = iniGetOrDefault(ini, preset, "flood_ped_lvl", 50.0);

  return result;
}

bool LightPreset::saveToStore(int64_t presetNr) {
  // create ini file and data structure
  mINI::INIStructure ini;
  mINI::INIFile iniFile(CONFIGURATION_FILEPATH);

  // load file
  bool result = iniFile.read(ini);

  // add/update preset
  const std::string preset = "preset " + std::to_string(presetNr);
  ini[preset]["efb_brightness"] = std::to_string(lightValues.efbBrightness);
  ini[preset]["cabin_light"] = std::to_string(lightValues.cabinLightLevel);
  ini[preset]["ovhd_int_lt"] = std::to_string(lightValues.ovhdIntegralLightLevel);
  ini[preset]["glareshield_int_lt"] = std::to_string(lightValues.glareshieldIntegralLightLevel);
  ini[preset]["glareshield_lcd_lt"] = std::to_string(lightValues.glareshieldLcdLightLevel);
  ini[preset]["table_cpt_lt"] = std::to_string(lightValues.tableLightCptLevel);
  ini[preset]["table_fo_lt"] = std::to_string(lightValues.tableLightFoLevel);
  ini[preset]["pfd_cpt_lvl"] = std::to_string(lightValues.pfdBrtCptLevel);
  ini[preset]["nd_cpt_lvl"] = std::to_string(lightValues.ndBrtCptLevel);
  ini[preset]["wx_cpt_lvl"] = std::to_string(lightValues.wxTerrainBrtCptLevel);
  ini[preset]["console_cpt_lt"] = std::to_string(lightValues.consoleLightCptLevel);
  ini[preset]["pfd_fo_lvl"] = std::to_string(lightValues.pfdBrtFoLevel);
  ini[preset]["nd_fo_lvl"] = std::to_string(lightValues.ndBrtFoLevel);
  ini[preset]["wx_fo_lvl"] = std::to_string(lightValues.wxTerrainBrtFoLevel);
  ini[preset]["console_fo_lt"] = std::to_string(lightValues.consoleLightFoLevel);
  ini[preset]["dcdu_left_lvl"] = std::to_string(lightValues.dcduLeftLightLevel * 100);
  ini[preset]["dcdu_right_lvl"] = std::to_string(lightValues.dcduRightLightLevel * 100);
  ini[preset]["mcdu_left_lvl"] = std::to_string(lightValues.mcduLeftLightLevel * 100);
  ini[preset]["mcdu_right_lvl"] = std::to_string(lightValues.mcduRightLightLevel * 100);
  ini[preset]["ecam_upper_lvl"] = std::to_string(lightValues.ecamUpperLightLevel);
  ini[preset]["ecam_lower_lvl"] = std::to_string(lightValues.ecamLowerLightLevel);
  ini[preset]["flood_pnl_lt"] = std::to_string(lightValues.floodPnlLightLevel);
  ini[preset]["pedestal_int_lt"] = std::to_string(lightValues.pedestalIntegralLightLevel);
  ini[preset]["flood_ped_lvl"] = std::to_string(lightValues.floodPedLightLevel);

  result &= iniFile.write(ini, true);

  return result;
}

void LightPreset::loadFromData(LightingValues lv) {
  lightValues = lv;
}

__attribute__((unused))
std::string LightPreset::sprint() const {
  std::ostringstream os;
  os << "EFB Brightness: " << lightValues.efbBrightness << std::endl;
  os << "Cabin Light: " << lightValues.cabinLightLevel << std::endl;
  os << "Ovhd Int Lt: " << lightValues.ovhdIntegralLightLevel << std::endl;
  os << "Glareshield Int Lt: " << lightValues.glareshieldIntegralLightLevel << std::endl;
  os << "Glareshield Lcd Lt: " << lightValues.glareshieldLcdLightLevel << std::endl;
  os << "Table Cpt Lt: " << lightValues.tableLightCptLevel << std::endl;
  os << "Table FO Lt: " << lightValues.tableLightFoLevel << std::endl;
  os << "PFD Cpt Lvl: " << lightValues.pfdBrtCptLevel << std::endl;
  os << "ND Cpt Lvl: " << lightValues.ndBrtCptLevel << std::endl;
  os << "WX Cpt Lvl: " << lightValues.wxTerrainBrtCptLevel << std::endl;
  os << "Console Cpt Lt: " << lightValues.consoleLightCptLevel << std::endl;
  os << "PFD FO Lvl: " << lightValues.pfdBrtFoLevel << std::endl;
  os << "ND FO Lvl: " << lightValues.ndBrtFoLevel << std::endl;
  os << "WX FO Lvl: " << lightValues.wxTerrainBrtFoLevel << std::endl;
  os << "Console Fo Lt: " << lightValues.consoleLightFoLevel << std::endl;
  os << "DCDU Left Lvl: " << lightValues.dcduLeftLightLevel << std::endl;
  os << "DCDU Right Lvl: " << lightValues.dcduRightLightLevel << std::endl;
  os << "MCDU Left Lvl: " << lightValues.mcduLeftLightLevel << std::endl;
  os << "MCDU Right Lvl: " << lightValues.mcduRightLightLevel << std::endl;
  os << "ECAM Upper Lvl: " << lightValues.ecamUpperLightLevel << std::endl;
  os << "ECAM Lower Lvl: " << lightValues.ecamLowerLightLevel << std::endl;
  os << "Floor Cpt Lt: " << lightValues.floodPnlLightLevel << std::endl;
  os << "Pedestal Int Lt: " << lightValues.pedestalIntegralLightLevel << std::endl;
  os << "Floor FO Lvl: " << lightValues.floodPedLightLevel << std::endl;
  return os.str();
}

double LightPreset::iniGetOrDefault(const mINI::INIStructure &ini,
                                    const std::string &section,
                                    const std::string &key,
                                    const double defaultValue) {
  if (ini.get(section).has(key)) {
    // As MSFS wasm does not support exceptions (try/catch) we can't use
    // std::stof here. Workaround with std::stringstreams.
    std::stringstream input(ini.get(section).get(key));
    double value = defaultValue;
    if (input >> value) {
      return value;
    }
    else {
      std::cout << "PRESETS: reading ini value for \""
                << "[" << section << "] " << key << " = " << ini.get(section).get(key)
                << "\" failed." << std::endl;
    }
  }
  return defaultValue;
}
