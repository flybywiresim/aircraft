// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <fstream>
#include <iostream>
#include <map>

#include "Arinc429LvarConverter.h"
#include "ScopedTimer.hpp"
#include "arinc429.hpp"
#include "logging.h"

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

  profiler.start();

  tickCounter++;

  // Update LVars from var files if not done yet or if the init flag is set
  if (!varFileRead || get_named_variable_value(doArinc429LvarBridgeInit)) {
    set_named_variable_value(doArinc429LvarBridgeInit, 0);
    readVarFile();
  }

  int counter = 0;

  // check if the bridge is activated
  if (get_named_variable_value(isArinc429LvarBridgeOnID)) {
    // process all known arinc vars
    for (std::pair<int, int>& ids : arinc429Vars) {
      FLOAT64 value = get_named_variable_value(ids.first);

      Arinc429NumericWord arinc429NumericWord{value};
      arinc429NumericWord.setSsm(Arinc429SignStatus::FunctionalTest);  // to get the raw value independent of the actual SSM
      float rawValue = arinc429NumericWord.valueOr(0.0f);

      set_named_variable_value(ids.second, rawValue);
      counter++;

      if (tickCounter % 100 == 0 && get_named_variable_value(isArinc429LvarBridgeVerbose) >= 2) {
        PCSTRINGZ firstName  = get_name_of_named_variable(ids.first);
        PCSTRINGZ secondName = get_name_of_named_variable(ids.second);
        std::cout << "FlyByWire Arinc429LVarBridge: LVar: " << firstName << " = " << value << " Raw Value: " << secondName << " = "
                  << rawValue << std::endl;
      }
    }
  }

  profiler.stop();
  if (tickCounter % 100 == 0 && get_named_variable_value(isArinc429LvarBridgeVerbose) >= 1) {
    std::cout << "Processed " << counter << " arinc vars per tick" << std::endl;
    profiler.print();
  }
}

// =================================================================================================
// PRIVATE
// =================================================================================================

void Arinc429LvarConverter::readVarFile() {
  LOG_INFO("FlyByWire Arinc429LVarBridge: Reading vars file");
  ScopedTimer timer("Reading vars files");

  arinc429Vars.clear();

  std::ifstream               work_vars(WORK_VARS_FILE);
  std::map<std::string, bool> workVars;
  std::string                 line;

  // try to open the work vars file - if it does not exist, create it later when writing to it
  if (work_vars.fail()) {
    std::cerr << "Vars file does not exist: creating new one" << std::endl;
  } else {
    // read all vars from the work file into a map with unique keys and true/false values
    while (std::getline(work_vars, line)) {
      line = helper::StringUtils::removeTrailingComments(line, "#");
      line = helper::StringUtils::trimFast(line);
      if (line.size() > 0) {
        // if a var is marked with a "-" at the beginning exclude it from the conversion by setting the map value to false
        if (line[0] == '-') {
          workVars[line.substr(1)] = false;
        } else {
          workVars[line] = true;
        }
      }
    }
  }

  // try to open the default vars file - if it does not exist, print an error message and return
  std::ifstream default_vars(DEFAULT_VARS_FILE);
  if (default_vars.fail()) {
    std::cerr << "Default vars file does not exist" << std::endl;
    return;
  }

  // read the default vars file and copy all vars which are not in the work to var list from the work file
  while (std::getline(default_vars, line)) {
    line = helper::StringUtils::removeTrailingComments(line, "#");
    line = helper::StringUtils::trimFast(line);
    // add the var to the work map if it is not already in the map
    if (line.size() > 0 && workVars.find(line) == workVars.end()) {
      workVars[line] = true;
    }
  }
  default_vars.close();

  // Write the new var list to the work file sorted alphabetically by the var name and close the file
  // add a some comments to the first lines of the work file and ignore them when reading the file
  std::ofstream workFile(WORK_VARS_FILE, std::ios::trunc);
  workFile << "# This file contains the list of LVars that are converted to raw values for the ARINC429 bridge" << std::endl;
  workFile << "# Lines starting with a '-' are excluded from the conversion" << std::endl;
  workFile << "# This files will be rewritten at every start of the aircraft to include potential new LVars" << std::endl;
  workFile << "# The LVars are sorted alphabetically and the exclusion with \"-\" are preserver" << std::endl;
  workFile << std::endl;
  for (const auto& [key, value] : workVars) {
    if (value) {
      workFile << key << std::endl;
    } else {
      workFile << "-" << key << std::endl;
    }
  }
  workFile.close();

  // now rebuild the arinc429Vars vector with the vars from the work map marked as to be included in the conversion
  for (const auto& [key, value] : workVars) {
    if (value) {
      registerConvertedVars(key);
    }
  }

  varFileRead = true;
}

void Arinc429LvarConverter::registerConvertedVars(const std::string& line) {  // register converted vars
  // check first if the var exists in the sim - if not skip it
  if (check_named_variable(line.c_str()) == -1) {
    LOG_ERROR("FlyByWire Arinc429LVarBridge: Could not find variable in sim: " + line);
    return;
  }

  // register the raw value var
  const std::string convertedVar = line + ARINC429_LVAR_RAW_SUFFIX;
  auto              id           = register_named_variable(line.c_str());
  auto              mappedId     = register_named_variable(convertedVar.c_str());
  arinc429Vars.push_back(std::pair<int, int>(id, mappedId));
}
