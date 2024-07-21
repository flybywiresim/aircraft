// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>
#include <string>

#include "inih/ini_fbw.h"
#include "inih/ini_type_conversion.h"

#include "logging.h"

#include "FuelConfiguration_A380X.h"

void FuelConfiguration_A380X::loadConfigurationFromIni() {
  LOG_INFO("Fadec::FuelConfiguration: loading configuration file " + configFilename);

  mINI::INIStructure ini;
  mINI::INIFile      iniFile(configFilename);

  if (!iniFile.read(ini)) {
    LOG_ERROR("Fadec::FuelConfiguration_A380X: failed to read configuration file " + configFilename + " due to error \"" + strerror(errno) +
              "\" -> using default fuel quantities.");
    return;
  }

  fuelLeftOuterGallons = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_LEFT_OUTER_QTY, fuelLeftOuterDefault);
  fuelFeedOneGallons   = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_ONE_QTY, fuelFeedOneDefault);
  fuelLeftMidGallons   = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_LEFT_MID_QTY, fuelLeftMidDefault);
  fuelLeftInnerGallons = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_LEFT_INNER_QTY, fuelLeftInnerDefault);
  fuelFeedTwoGallons   = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_TWO_QTY, fuelFeedTwoDefault);
  fuelFeedThreeGallons = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_THREE_QTY, fuelFeedThreeDefault);
  fuelRightInnerGallons =
      mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_RIGHT_INNER_QTY, fuelRightInnerDefault);
  fuelRightMidGallons = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_RIGHT_MID_QTY, fuelRightMidDefault);
  fuelFeedFourGallons = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_FEED_FOUR_QTY, fuelFeedFourDefault);
  fuelRightOuterGallons =
      mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_RIGHT_OUTER_QTY, fuelRightOuterDefault);
  fuelTrimGallons = mINI::INITypeConversion::getDouble(ini, INI_SECTION_FUEL, INI_SECTION_FUEL_TRIM_QTY, fuelTrimDefault);

  LOG_DEBUG("Fadec::FuelConfiguration_A380X: loaded fuel configuration from " + configFilename + " with the following values:");
  LOG_DEBUG("Fadec::FuelConfiguration_A380X: " + this->toString());
}

void FuelConfiguration_A380X::saveConfigurationToIni() {
  LOG_DEBUG("Fadec::FuelConfiguration_A380X: saving configuration file " + configFilename);

  mINI::INIStructure ini;
  mINI::INIFile      iniFile(configFilename);

  // Do not check a possible error since the file may not exist yet
  iniFile.read(ini);

  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_LEFT_OUTER_QTY]  = std::to_string(this->fuelLeftOuterGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_ONE_QTY]    = std::to_string(this->fuelFeedOneGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_LEFT_MID_QTY]    = std::to_string(this->fuelLeftMidGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_LEFT_INNER_QTY]  = std::to_string(this->fuelLeftInnerGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_TWO_QTY]    = std::to_string(this->fuelFeedTwoGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_THREE_QTY]  = std::to_string(this->fuelFeedThreeGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_RIGHT_INNER_QTY] = std::to_string(this->fuelRightInnerGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_RIGHT_MID_QTY]   = std::to_string(this->fuelRightMidGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_FEED_FOUR_QTY]   = std::to_string(this->fuelFeedFourGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_RIGHT_OUTER_QTY] = std::to_string(this->fuelRightOuterGallons);
  ini[INI_SECTION_FUEL][INI_SECTION_FUEL_TRIM_QTY]        = std::to_string(this->fuelTrimGallons);

  if (!iniFile.write(ini, true)) {
    LOG_ERROR("Fadec::FuelConfiguration_A380X: failed to write engine conf " + configFilename + " due to error \"" + strerror(errno) +
              "\"");
    return;
  }

  LOG_DEBUG("Fadec::FuelConfiguration_A380X: saved fuel configuration to " + configFilename + " with the following values:");
  LOG_DEBUG("Fadec::FuelConfiguration_A380X: " + this->toString());
}

std::string FuelConfiguration_A380X::toString() const {
  std::ostringstream oss;
  oss << "FuelConfiguration_A380X { "
      << "\n"
      << "  fuelLeftOuter: " << fuelLeftOuterGallons << "\n"
      << "  fuelFeedOne: " << fuelFeedOneGallons << "\n"
      << "  fuelLeftMid: " << fuelLeftMidGallons << "\n"
      << "  fuelLeftInner: " << fuelLeftInnerGallons << "\n"
      << "  fuelFeedTwo: " << fuelFeedTwoGallons << "\n"
      << "  fuelFeedThree: " << fuelFeedThreeGallons << "\n"
      << "  fuelRightInner: " << fuelRightInnerGallons << "\n"
      << "  fuelRightMid: " << fuelRightMidGallons << "\n"
      << "  fuelFeedFour: " << fuelFeedFourGallons << "\n"
      << "  fuelRightOuter: " << fuelRightOuterGallons << "\n"
      << "  fuelTrim: " << fuelTrimGallons << "\n"
      << "}";
  return oss.str();
}
