// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_LVARCONVERTER_H
#define FLYBYWIRE_AIRCRAFT_LVARCONVERTER_H

#include <vector>

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>
#include "SimpleProfiler.hpp"

/**
 * @brief TODO
 */
class LvarConverter {
  const std::string DEFAULT_VARS_FILE = "\\modules\\arinc429_vars.txt";
  const std::string WORK_VARS_FILE    = "\\work\\aring429_vars.txt";

 private:
  bool initialized = false;
  bool varsRead    = false;

  int64_t tickCounter = 0;

  ID isReadyID;
  ID isLvarBridgeOnID;
  ID doLvarBridgeInit;
  ID isLvarBridgeVerbose;

  std::vector<std::pair<int, int>> arinc429Vars;

  SimpleProfiler profiler{"LvarConverter", 100};

 public:
  void init();
  void update();

 private:
  void registerConvertedVars(const std::string& line);
  void readVarFile();
};

#endif  // FLYBYWIRE_AIRCRAFT_LVARCONVERTER_H
