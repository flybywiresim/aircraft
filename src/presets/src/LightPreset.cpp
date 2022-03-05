// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <sstream>

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
  return false;
}

bool LightPreset::saveToStore(int presetNr) {
  return false;
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
  os << "Floor FoO Lvl: " << lightValues.floorFoLightLevel << std::endl;
  return os.str();
}
