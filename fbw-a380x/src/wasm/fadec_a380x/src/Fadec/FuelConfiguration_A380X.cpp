// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>
#include <string>

#include "inih/ini.h"
#include "inih/ini_type_conversion.h"

#include "logging.h"

#include "FuelConfiguration_A380X.h"

void FuelConfiguration_A380X::loadConfigurationFromIni() {
  LOG_INFO("Fadec::FuelConfiguration: loading configuration file " + configFilename);

  mINI::INIStructure ini;
  mINI::INIFile iniFile(configFilename);

  if (!iniFile.read(ini)) {
    LOG_ERROR("Fadec::FuelConfiguration: failed to read configuration file " + configFilename + " due to error \"" + strerror(errno) +
              "\" -> using default fuel quantities.");
    return;
  }

  fuelFeedOne = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_ONE_QTY, fuelFeedOneDefault);
  fuelFeedTwo = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_THREE_QTY, fuelFeedTwoDefault);
  fuelFeedThree = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_FOUR_QTY, fuelFeedThreeDefault);
  fuelFeedFour = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_RIGHT_OUTER_QTY, fuelFeedFourDefault);
  fuelLeftOuter = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_LEFT_OUTER_QTY, fuelLeftOuterDefault);
  fuelRightOuter = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_TWO_QTY, fuelRightOuterDefault);
  fuelLeftMid = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_LEFT_MID_QTY, fuelLeftMidDefault);
  fuelRightMid = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_RIGHT_INNER_QTY, fuelRightMidDefault);
  fuelLeftInner = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_LEFT_INNER_QTY, fuelLeftInnerDefault);
  fuelRightInner = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_RIGHT_MID_QTY, fuelRightInnerDefault);
  fuelTrim = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_TRIM_QTY, fuelTrimDefault);
}

void FuelConfiguration_A380X::saveConfigurationToIni() {
  LOG_INFO("Fadec::FuelConfiguration: saving configuration file " + configFilename);

  mINI::INIStructure ini;
  mINI::INIFile iniFile(configFilename);

  // Do not check a possible error since the file may not exist yet
  iniFile.read(ini);

  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_ONE_QTY] = std::to_string(this->fuelFeedOne);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_TWO_QTY] = std::to_string(this->fuelFeedTwo);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_THREE_QTY] = std::to_string(this->fuelFeedThree);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_FOUR_QTY] = std::to_string(this->fuelFeedFour);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_LEFT_OUTER_QTY] = std::to_string(this->fuelLeftOuter);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_RIGHT_OUTER_QTY] = std::to_string(this->fuelRightOuter);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_LEFT_MID_QTY] = std::to_string(this->fuelLeftMid);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_RIGHT_MID_QTY] = std::to_string(this->fuelRightMid);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_LEFT_INNER_QTY] = std::to_string(this->fuelLeftInner);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_RIGHT_INNER_QTY] = std::to_string(this->fuelRightInner);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_TRIM_QTY] = std::to_string(this->fuelTrim);

  if (!iniFile.write(ini, true)) {
    LOG_ERROR("Fadec::FuelConfiguration: failed to write engine conf " + configFilename + " due to error \"" + strerror(errno) + "\"");
  }
}
