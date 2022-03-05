// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <string>
#include <sstream>
#include <iostream>

#include "LightPreset.h"

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
  lightValues.floorCptLightLevel = simVars->getLightPotentiometer(83);
  lightValues.pedestalIntegralLightLevel = simVars->getLightPotentiometer(85);
  lightValues.floorFoLightLevel = simVars->getLightPotentiometer(76);
}

void LightPreset::loadFromData(LightValues lv) {
  lightValues = lv;
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
  simVars->setLightPotentiometer(83, lightValues.floorCptLightLevel);
  simVars->setLightPotentiometer(85, lightValues.pedestalIntegralLightLevel);
  simVars->setLightPotentiometer(76, lightValues.floorFoLightLevel);
}

bool LightPreset::readFromStore(int presetNr) {
  // create ini file and data structure
  mINI::INIStructure ini;
  mINI::INIFile iniFile(CONFIGURATION_FILEPATH);

  // load file
  bool result = iniFile.read(ini);

  const std::string preset = "preset " + std::to_string(presetNr);

  // check if preset is available
  if (!ini.has(preset)) {
    switch (presetNr) {
      case 1:
        loadFromData(DEFAULT_10);
        break;
      case 2:
        loadFromData(DEFAULT_50);
        break;
      case 3:
        loadFromData(DEFAULT_100);
        break;
      default:
        loadFromData(DEFAULT_50);
        break;
    }
    return true;
  }

  // reading data structure from ini
  lightValues.efbBrightness = iniGetOrDefault(ini, preset, "efb brightness", 50.0);
  lightValues.cabinLightLevel = iniGetOrDefault(ini, preset, "cabin light", 50.0);
  lightValues.ovhdIntegralLightLevel = iniGetOrDefault(ini, preset, "ovhd int lt", 50.0);
  lightValues.glareshieldIntegralLightLevel = iniGetOrDefault(ini, preset, "glareshield int lt", 50.0);
  lightValues.glareshieldLcdLightLevel = iniGetOrDefault(ini, preset, "glareshield lcd lt", 50.0);
  lightValues.tableLightCptLevel = iniGetOrDefault(ini, preset, "table cpt lt", 50.0);
  lightValues.tableLightFoLevel = iniGetOrDefault(ini, preset, "table fo lt", 50.0);
  lightValues.pfdBrtCptLevel = iniGetOrDefault(ini, preset, "pfd cpt lvl", 50.0);
  lightValues.ndBrtCptLevel = iniGetOrDefault(ini, preset, "nd cpt lvl", 50.0);
  lightValues.wxTerrainBrtCptLevel = iniGetOrDefault(ini, preset, "wx cpt lvl", 50.0);
  lightValues.consoleLightCptLevel = iniGetOrDefault(ini, preset, "console cpt lt", 50.0);
  lightValues.pfdBrtFoLevel = iniGetOrDefault(ini, preset, "pfd fo lvl", 50.0);
  lightValues.ndBrtFoLevel = iniGetOrDefault(ini, preset, "nd fo lvl", 50.0);
  lightValues.wxTerrainBrtFoLevel = iniGetOrDefault(ini, preset, "wx fo lvl", 50.0);
  lightValues.consoleLightFoLevel = iniGetOrDefault(ini, preset, "console fo lt", 50.0);
  lightValues.dcduLeftLightLevel = iniGetOrDefault(ini, preset, "dcdu left lvl", 50.0) / 100;
  lightValues.dcduRightLightLevel = iniGetOrDefault(ini, preset, "dcdu right lvl", 50.0) / 100;
  lightValues.mcduLeftLightLevel = iniGetOrDefault(ini, preset, "mcdu left lvl", 50.0) / 100;
  lightValues.mcduRightLightLevel = iniGetOrDefault(ini, preset, "mcdu right lvl", 50.0) / 100;
  lightValues.ecamUpperLightLevel = iniGetOrDefault(ini, preset, "ecam upper lvl", 50.0);
  lightValues.ecamLowerLightLevel = iniGetOrDefault(ini, preset, "ecam lower lvl", 50.0);
  lightValues.floorCptLightLevel = iniGetOrDefault(ini, preset, "floor cpt lt", 50.0);
  lightValues.pedestalIntegralLightLevel = iniGetOrDefault(ini, preset, "pedestal int lt", 50.0);
  lightValues.floorFoLightLevel = iniGetOrDefault(ini, preset, "floor fo lvl", 50.0);

  return result;
}

bool LightPreset::saveToStore(int presetNr) {
  // create ini file and data structure
  mINI::INIStructure ini;
  mINI::INIFile iniFile(CONFIGURATION_FILEPATH);

  // load file
  bool result = iniFile.read(ini);

  // add/update preset
  const std::string preset = "preset " + std::to_string(presetNr);
  ini[preset]["efb brightness"] = std::to_string(lightValues.efbBrightness);
  ini[preset]["cabin light"] = std::to_string(lightValues.cabinLightLevel);
  ini[preset]["ovhd int lt"] = std::to_string(lightValues.ovhdIntegralLightLevel);
  ini[preset]["glareshield int lt"] = std::to_string(lightValues.glareshieldIntegralLightLevel);
  ini[preset]["glareshield lcd lt"] = std::to_string(lightValues.glareshieldLcdLightLevel);
  ini[preset]["table cpt lt"] = std::to_string(lightValues.tableLightCptLevel);
  ini[preset]["table fo lt"] = std::to_string(lightValues.tableLightFoLevel);
  ini[preset]["pfd cpt lvl"] = std::to_string(lightValues.pfdBrtCptLevel);
  ini[preset]["nd cpt lvl"] = std::to_string(lightValues.ndBrtCptLevel);
  ini[preset]["wx cpt lvl"] = std::to_string(lightValues.wxTerrainBrtCptLevel);
  ini[preset]["console cpt lt"] = std::to_string(lightValues.consoleLightCptLevel);
  ini[preset]["pfd fo lvl"] = std::to_string(lightValues.pfdBrtFoLevel);
  ini[preset]["nd fo lvl"] = std::to_string(lightValues.ndBrtFoLevel);
  ini[preset]["wx fo lvl"] = std::to_string(lightValues.wxTerrainBrtFoLevel);
  ini[preset]["console fo lt"] = std::to_string(lightValues.consoleLightFoLevel);
  ini[preset]["dcdu left lvl"] = std::to_string(lightValues.dcduLeftLightLevel * 100);
  ini[preset]["dcdu right lvl"] = std::to_string(lightValues.dcduRightLightLevel * 100);
  ini[preset]["mcdu left lvl"] = std::to_string(lightValues.mcduLeftLightLevel * 100);
  ini[preset]["mcdu right lvl"] = std::to_string(lightValues.mcduRightLightLevel * 100);
  ini[preset]["ecam upper lvl"] = std::to_string(lightValues.ecamUpperLightLevel);
  ini[preset]["ecam lower lvl"] = std::to_string(lightValues.ecamLowerLightLevel);
  ini[preset]["floor cpt lt"] = std::to_string(lightValues.floorCptLightLevel);
  ini[preset]["pedestal int lt"] = std::to_string(lightValues.pedestalIntegralLightLevel);
  ini[preset]["floor fo lvl"] = std::to_string(lightValues.floorFoLightLevel);

  result &= iniFile.write(ini, true);

  return result;
}

std::string LightPreset::sprint() {
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
  os << "Floor Cpt Lt: " << lightValues.floorCptLightLevel << std::endl;
  os << "Pedestal Int Lt: " << lightValues.pedestalIntegralLightLevel << std::endl;
  os << "Floor FO Lvl: " << lightValues.floorFoLightLevel << std::endl;
  return os.str();
}

double LightPreset::iniGetOrDefault(const mINI::INIStructure& ini,
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
      std::cout << "PRESETS: reading ini value for \""
                << "[" << section << "] " << key << " = " << ini.get(section).get(key)
                << "\" failed." << std::endl;
    }
  }
  return defaultValue;
}
