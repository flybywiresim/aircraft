// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ARINC429LVARCONVERTER_H
#define FLYBYWIRE_AIRCRAFT_ARINC429LVARCONVERTER_H

#include <chrono>
#include <vector>

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>
#include "SimpleProfiler.hpp"

static constexpr int     LVAR_UPDATE_INTERVAL_SECONDS = 60;        // in what interval shall all available LVars be discovered  from the sim
static constexpr int     MAX_INDEX_LVAR_SCAN          = 99999;     // the max index we probe for LVars in the sim
static const std::string LVAR_PREFIX                  = "A32NX_";  // the prefix of the LVars we are interested in
static const std::string ARINC429_LVAR_SUFFIX         = "";        // the suffix of the LVars we are interested in
static const std::string ARINC429_LVAR_RAW_SUFFIX     = "_RAW";    // the suffix we add to the raw LVars
static const std::string DEFAULT_VARS_FILE            = "\\modules\\arinc429_vars.txt";
static const std::string WORK_VARS_FILE               = "\\work\\aring429_vars.txt";

using namespace std::chrono;

/**
 * @brief The Arinc429LvarConverter class is used to convert ARINC429 LVars to raw values and to register the raw value
 *        LVars in the sim. As the ARINC429 LVars are not directly readable without the proper conversion, this class
 *        provides the conversion and registration of the raw value LVars for the ARINC429 LVars so that they can be
 *        used by third parties without having to know the ARINC429 specifics.
 *
 * This class uses a set of control variables to control the behavior of the converter:
 * - FBW_ARINC429_LVAR_BRIDGE_ON: to activate the converter
 * - FBW_ARINC429_LVAR_BRIDGE_INIT: to trigger the discovery of all LVars from the sim
 * - FBW_ARINC429_LVAR_BRIDGE_VERBOSE: to enable verbose output
 *
 * During initialization, the converter reads all LVars from the sim, checks for specific prefixes and suffixes and
 * registers corresponding raw value LVars for the ARINC429 LVars. The converter is then updated every frame and
 * converts the ARINC429 LVars to raw values if the bridge is activated.
 */
class Arinc429LvarConverter {
 private:
  // prevents running update before init
  bool initialized = false;

  // flag to signal that the var file has been read
  bool varFileRead = false;

  // counter for the ticks (calls to update)
  int64_t tickCounter = 0;

  // control variables
  ID isReadyID;
  ID isArinc429LvarBridgeOnID;
  ID doArinc429LvarBridgeInit;
  ID isArinc429LvarBridgeVerbose;

  // the list of all LVars that are converted from ARINC429 to raw values
  std::vector<std::pair<int, int>> arinc429Vars;

  // profiler for the converter
  SimpleProfiler profiler{"Arinc429LVarConverter", 100};

 public:
  /**
   * @brief Initializes the Arinc429LvarConverter. Must be called before update.
   */
  void init();

  /**
   * @brief Updates the Arinc429LvarConverter. Must be called after init and is called every frame.
   */
  void update();

 private:

  /**
   * @brief Register the raw value variable names in the sim.
   * @param line the line from the var file
   */
  void registerConvertedVars(const std::string& line);

  /**
   * @brief Read the var file and register the raw value variable names in the sim.
   */
  void readVarFile();
};

#endif  // FLYBYWIRE_AIRCRAFT_ARINC429LVARCONVERTER_H
