// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <fstream>
#include <iostream>

#include "LvarConverter.h"
#include "arinc429/Arinc429.hpp"
#include "logging.h"

// DEBUG
#define PROFILING

void LvarConverter::init() {
  LOG_INFO("FlyByWire Lvar Bridge: Initializing");
  // setup control variables
  isLvarBridgeOnID    = register_named_variable("FBW_LVAR_BRIDGE_ON");
  doLvarBridgeInit    = register_named_variable("FBW_LVAR_BRIDGE_INIT");
  isLvarBridgeVerbose = register_named_variable("FBW_LVAR_BRIDGE_VERBOSE");
  isReadyID           = register_named_variable("A32NX_IS_READY");

  this->initialized = true;
}

void LvarConverter::update() {
  // check if the bridge is initialized and the aircraft is ready
  if (!this->initialized || !get_named_variable_value(isReadyID)) {
    return;
  }
  tickCounter++;

  // read vars file if not read yet or re-read if the init flag is set
  if (!varsRead || get_named_variable_value(doLvarBridgeInit)) {
    LOG_INFO("FlyByWire Lvar Bridge: Re-reading vars file");
    set_named_variable_value(doLvarBridgeInit, 0);
    readVarFile();
  }

#ifdef PROFILING
  profiler.start();
#endif

  if (get_named_variable_value(isLvarBridgeOnID)) {
    // process vars
    for (std::pair<int, int>& ids : arinc429Vars) {
      // DEBUG
      PCSTRINGZ firstName  = get_name_of_named_variable(ids.first);
      PCSTRINGZ secondName = get_name_of_named_variable(ids.second);

      auto value = get_named_variable_value(ids.first);

      Arinc429NumericWord arinc429NumericWord{value};
      arinc429NumericWord.setSsm(Arinc429SignStatus::FunctionalTest);
      float rawValue = arinc429NumericWord.valueOr(0.0f);

      // DEBUG
      if (tickCounter % 100 == 0 && rawValue != 0.0f && get_named_variable_value(isLvarBridgeVerbose)) {
        std::cout << "LVar: " << firstName << " = " << value << " Raw Value: " << secondName << " = " << rawValue << std::endl;
      }
      set_named_variable_value(ids.second, rawValue ? rawValue : -1.0f);
    }

    // DEBUG
    if (tickCounter % 100 == 0) {
      std::cout << "Processed " << arinc429Vars.size() << " vars per tick" << std::endl;
    }
  }

#ifdef PROFILING
  profiler.stop();
  if (tickCounter % 100 == 0) {
    profiler.print();
  }
#endif
}

// =================================================================================================
// PRIVATE
// =================================================================================================

void LvarConverter::readVarFile() {  // read vars from works file
  LOG_INFO("FlyByWire Lvar Bridge: Reading vars file");

  arinc429Vars.clear();

  std::ifstream work_vars(WORK_VARS_FILE);
  std::ifstream default_vars(DEFAULT_VARS_FILE);

  // create work file if it does not exist and copy vars from default file
  if (work_vars.fail()) {
    std::cerr << "Vars file does not exist: creating now" << std::endl;
    auto workFile = std::ofstream(WORK_VARS_FILE);

    std::string line;
    while (std::getline(default_vars, line)) {
      line = helper::StringUtils::trimFast(line);
      // copy vars from default file to work file
      workFile << line << std::endl;
      registerConvertedVars(line);
    }
    line.clear();
    workFile.close();
  } else {
    std::string line;
    while (std::getline(work_vars, line)) {
      registerConvertedVars(line);
    }
  }
  varsRead = true;
}

void LvarConverter::registerConvertedVars(const std::string& line) {  // register converted vars
  const std::string convertedVar = line + "_RAW";
  auto              id           = register_named_variable(line.c_str());
  auto              mappedId     = register_named_variable(convertedVar.c_str());
  arinc429Vars.push_back(std::pair<int, int>(id, mappedId));
  LOG_INFO("FlyByWire Lvar Bridge: Arinc429 var: " + line + " raw: " + convertedVar);
}
