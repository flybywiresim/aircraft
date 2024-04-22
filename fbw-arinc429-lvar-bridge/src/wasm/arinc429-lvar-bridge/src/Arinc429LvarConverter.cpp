// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <fstream>
#include <iostream>

#include "Arinc429LvarConverter.h"
#include "arinc429/Arinc429.hpp"
#include "logging.h"

// DEBUG
#define PROFILING

void Arinc429LvarConverter::init() {
  LOG_INFO("FlyByWire Arinc429LVarBridge: Initializing");
  // setup control variables
  isArinc429LvarBridgeOnID    = register_named_variable("FBW_ARINC429_LVAR_BRIDGE_ON");
  doArinc429LvarBridgeInit    = register_named_variable("FBW_ARINC429_LVAR_BRIDGE_INIT");
  isArinc429LvarBridgeVerbose = register_named_variable("FBW_ARINC429_LVAR_BRIDGE_VERBOSE");
  isReadyID                   = register_named_variable("A32NX_IS_READY");

  this->initialized = true;
}

void Arinc429LvarConverter::update() {
  // check if the bridge is initialized and the aircraft is ready
  if (!this->initialized || !get_named_variable_value(isReadyID)) {
    return;
  }
  tickCounter++;

  // read all LVars from sim if not done yet or if the init variable is set
  if (!varsRead || get_named_variable_value(doArinc429LvarBridgeInit)) {
    LOG_INFO("FlyByWire Arinc429LVarBridge: Re-reading vars file");
    set_named_variable_value(doArinc429LvarBridgeInit, 0);
    // readVarFile();
    getAllLVarsFromSim();
  }

#ifdef PROFILING
  profiler.start();
#endif

  // check if the bridge is activated
  if (get_named_variable_value(isArinc429LvarBridgeOnID)) {
    // process vars
    for (std::pair<int, int>& ids : arinc429Vars) {
      auto value = get_named_variable_value(ids.first);

      Arinc429NumericWord arinc429NumericWord{value};
      arinc429NumericWord.setSsm(Arinc429SignStatus::FunctionalTest);  // to get the raw value independent of the actual SSM
      float rawValue = arinc429NumericWord.valueOr(0.0f);

      set_named_variable_value(ids.second, rawValue ? rawValue : -1.0f);

      // DEBUG
      if (tickCounter % 100 == 0 && rawValue != 0.0f && get_named_variable_value(isArinc429LvarBridgeVerbose)) {
        PCSTRINGZ firstName  = get_name_of_named_variable(ids.first);
        PCSTRINGZ secondName = get_name_of_named_variable(ids.second);
        std::cout << "LVar: " << firstName << " = " << value << " Raw Value: " << secondName << " = " << rawValue << std::endl;
      }
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

void Arinc429LvarConverter::getAllLVarsFromSim() {
  LOG_INFO("FlyByWire Arinc429LVarBridge: Getting all LVars with prefix " + LVAR_PREFIX + " and suffix " + ARINC429_LVAR_SUFFIX);

  // find all LVars with the given prefix and suffix and put them in a vector
  int                      numVars = 0;
  std::vector<std::string> lvars;
  for (int i = 0; i < MAX_INDEX_LVAR_SCAN; i++) {
    PCSTRINGZ name = get_name_of_named_variable(i);
    if (name != nullptr) {
      std::string nameStr = name;
      if (nameStr.rfind(LVAR_PREFIX, 0) == 0 &&
          nameStr.rfind(ARINC429_LVAR_SUFFIX, nameStr.size() - ARINC429_LVAR_SUFFIX.size()) != std::string::npos) {
        lvars.push_back(nameStr);
        numVars++;
        if (isArinc429LvarBridgeVerbose) {
          LOG_INFO("FlyByWire Arinc429LVarBridge: Found LVar: " + std::to_string(numVars) + " " + nameStr);
        }
      }
    }
  }
  LOG_INFO("FlyByWire Arinc429LVarBridge: Found " + std::to_string(numVars) + " LVars - registering raw value LVars now.");

  // register all LVars
  arinc429Vars.clear();
  for (const std::string& nameStr : lvars) {
    registerConvertedVars(nameStr);
  }
  varsRead = true;
}

void Arinc429LvarConverter::readVarFile() {  // read vars from works file
  LOG_INFO("FlyByWire Arinc429LVarBridge: Reading vars file");

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

void Arinc429LvarConverter::registerConvertedVars(const std::string& line) {  // register converted vars
  const std::string convertedVar = line + "_RAW";
  auto              id           = register_named_variable(line.c_str());
  auto              mappedId     = register_named_variable(convertedVar.c_str());
  arinc429Vars.push_back(std::pair<int, int>(id, mappedId));
}
