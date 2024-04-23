// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <fstream>
#include <iostream>

#include "Arinc429LvarConverter.h"
#include "ScopedTimer.hpp"
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

#ifdef PROFILING
  profiler.start();
#endif

  tickCounter++;
  time_point<std::chrono::system_clock> now = std::chrono::system_clock::now();

  // Update LVars from sim every LVAR_UPDATE_INTERVAL_SECONDS to get new LVars registered in the sim
  // or if the init variable is set to 1
  if (duration_cast<seconds>(now - lastLVarUpdate).count() > LVAR_UPDATE_INTERVAL_SECONDS ||
      get_named_variable_value(doArinc429LvarBridgeInit)) {
    LOG_INFO("FlyByWire Arinc429LVarBridge: Discovering LVars from sim");
    set_named_variable_value(doArinc429LvarBridgeInit, 0);
    getAllLVarsFromSim();
    lastLVarUpdate = now;
  }

  // check if the bridge is activated
  if (get_named_variable_value(isArinc429LvarBridgeOnID)) {
    // process all known arinc vars
    for (std::pair<int, int>& ids : arinc429Vars) {
      auto value = get_named_variable_value(ids.first);

      Arinc429NumericWord arinc429NumericWord{value};
      arinc429NumericWord.setSsm(Arinc429SignStatus::FunctionalTest);  // to get the raw value independent of the actual SSM
      float rawValue = arinc429NumericWord.valueOr(0.0f);

      set_named_variable_value(ids.second, rawValue ? rawValue : -1.0f);

      if (tickCounter % 100 == 0 && rawValue != 0.0f && get_named_variable_value(isArinc429LvarBridgeVerbose)) {
        PCSTRINGZ firstName  = get_name_of_named_variable(ids.first);
        PCSTRINGZ secondName = get_name_of_named_variable(ids.second);
        std::cout << "LVar: " << firstName << " = " << value << " Raw Value: " << secondName << " = " << rawValue << std::endl;
      }
    }
  }

#ifdef PROFILING
  profiler.stop();
  if (tickCounter % 100 == 0) {
    std::cout << "Processed " << arinc429Vars.size() << " arinc vars per tick" << std::endl;
    profiler.print();
  }
#endif
}

// =================================================================================================
// PRIVATE
// =================================================================================================

void Arinc429LvarConverter::getAllLVarsFromSim() {
  LOG_INFO("FlyByWire Arinc429LVarBridge: Getting all LVars with prefix \'"    //
           + LVAR_PREFIX + "\' and suffix \'" + ARINC429_LVAR_SUFFIX + "\'");  //
  ScopedTimer timer{"Arinc429LvarConverter::getAllLVarsFromSim"};

  // find all LVars with the given prefix and suffix and put them in a vector
  // excludes all LVars with the suffix for already converted LVars so that they are not converted again (e.g. _RAW)
  int                      numVars = 0;
  std::vector<std::string> lvars;
  for (int i = 0; i < MAX_INDEX_LVAR_SCAN; i++) {
    PCSTRINGZ name = get_name_of_named_variable(i);
    if (name != nullptr) {
      std::string nameStr = name;
      if (nameStr.rfind(LVAR_PREFIX, 0) == 0 &&
          nameStr.rfind(ARINC429_LVAR_SUFFIX, nameStr.size() - ARINC429_LVAR_SUFFIX.size()) != std::string::npos &&
          nameStr.rfind(ARINC429_LVAR_RAW_SUFFIX, nameStr.size() - ARINC429_LVAR_RAW_SUFFIX.size()) == std::string::npos) {
        lvars.push_back(nameStr);
        numVars++;
        if (get_named_variable_value(isArinc429LvarBridgeVerbose)) {
          LOG_INFO("FlyByWire Arinc429LVarBridge: Found LVar: " + std::to_string(numVars) + " " + nameStr);
        }
      }
    }
  }
  LOG_INFO("FlyByWire Arinc429LVarBridge: Found " + std::to_string(numVars) + " LVars - registering raw value LVars now.");

  // register all LVars
  // this is done in a separate loop to avoid the newly registered LVars to be found during the scan
  arinc429Vars.clear();
  for (const std::string& nameStr : lvars) {
    registerConvertedVars(nameStr);
  }
}

void Arinc429LvarConverter::registerConvertedVars(const std::string& line) {  // register converted vars
  const std::string convertedVar = line + ARINC429_LVAR_RAW_SUFFIX;
  auto              id           = register_named_variable(line.c_str());
  auto              mappedId     = register_named_variable(convertedVar.c_str());
  arinc429Vars.push_back(std::pair<int, int>(id, mappedId));
}

// deprecated - currently not used
void Arinc429LvarConverter::readVarFile() {
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
}
