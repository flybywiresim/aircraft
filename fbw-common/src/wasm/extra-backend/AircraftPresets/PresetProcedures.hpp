// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PRESET_PROCEDURES
#define FLYBYWIRE_AIRCRAFT_PRESET_PROCEDURES

#include <algorithm>
#include <optional>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

#include "lib/pugixml/pugixml.hpp"
#include "logging.h"

#include "ProcedureStep.hpp"

#ifdef DEBUG
#include <iostream>
#endif

/**
 * @brief A procedure definition is a list of procedure steps.
 */
typedef std::vector<ProcedureStep> ProcedureDefinition;

/**
 * @brief A preset is a list of pointers to procedure steps.
 */
typedef std::vector<ProcedureStep*> Preset;

/**
 * @brief The PresetProcedures class is responsible for loading the procedures from an XML file and
 *        creating the presets with the correct procedure steps.
 *
 * @note A Procedure is a list of ProcedureSteps that are read from the XML file and executed in the order given in the XML.<br/
 *       A Preset is a list of pointers to ProcedureSteps from several Procedures that are executed in a specific order to
 *       ensure the correct state of the aircraft.<br/>
 *       Create a PresetProcedures object with the path to the XML file containing the procedure definitions in the MSFS VFS.<br/>
 *       E.g. "./config/a32nx/a320-251n/aircraft_preset_procedures.xml";
 */
class PresetProcedures {
 private:
  Preset coldAndDark;       // cold and dark preset - ID 1
  Preset powered;           // powered preset - ID 2
  Preset readyForPushback;  // ready for pushback preset - ID 3
  Preset readyForTaxi;      // ready for taxi preset - ID 4
  Preset readyForTakeoff;   // ready for takeoff preset - ID 5

  // List of all presets to access via index ID - ID starts at 1 so must be mapped to the index by subtracting 1
  std::vector<Preset*> presets = {&coldAndDark, &powered, &readyForPushback, &readyForTaxi, &readyForTakeoff};

  // Map configurations to procedure lists to quickly validate the XML given procedures and add them to the correct list
  std::unordered_map<std::string, ProcedureDefinition> procedureListMap;

  // the path to the XML file containing the procedure definitions in the MSFS VFS
  const std::string configFile;

 public:
  /**
   * @brief Construct a new PresetProcedures object
   * @param configFile the path to the XML file containing the procedure definitions in the MSFS VFS
   */
  PresetProcedures(std::string&& configFile) : configFile{configFile} { initializeProcedureListMap(); }

  /**
   * @brief Get the procedure for the given configuration.
   *
   * This reads the external XML file every time it is called to get the latest version of the
   * procedure for the given configuration. This makes it easy to update the procedures without
   * reloading the flight in the simulator.
   *
   * @param pID numerical ID of the procedure
   *            (1 = cold and dark, 2 = powered, 3 = ready for pushback, 4 = ready for taxi, 5 = ready for takeoff)
   * @return am optional pointer to the Preset or an empty optional if the procedure was not found
   */
  std::optional<Preset*> getProcedure(int64_t pID) {
    using namespace pugi;
    xml_document presetProceduresXML;

    // load the XML file and check for errors
    const xml_parse_result result = presetProceduresXML.load_file(configFile.c_str());
    if (result) {
      LOG_INFO("AircraftPresets: XML config \"" + configFile + "\" parsed without errors.");
    } else {
      LOG_ERROR("AircraftPresets: XML config \"" + configFile + "\" parsed with errors, Error description: " + result.description());
      return std::nullopt;
    }

    // clear the procedure list map
    initializeProcedureListMap();

    // get root node
    xml_node aircraftPresetProcedures = presetProceduresXML.child("AircraftPresetProcedures");

    bool continue_outer = false;  // flag to skip the whole procedure if an error occurs

    // iterate over all procedures
    for (xml_node procedure : aircraftPresetProcedures.children("Procedure")) {
      const std::string procedureName = procedure.attribute("name").as_string();

      // iterate over all steps
      for (xml_node step : procedure.children("Step")) {
        // Check if the step is valid
        auto it = ProcedureStep::StepTypeMap.find(step.attribute("Type").as_string());
        if ((it == ProcedureStep::StepTypeMap.end())) {  // The color was not found in the map
          std::cerr << "The step type " << step.attribute("Type").as_string() << " is not valid. Skipping the Step." << std::endl;
          continue;
        }

        // Step is valid, create a new ProcedureStep
        ProcedureStep pStep = {
            .description            = std::string{step.attribute("Name").as_string()},
            .type                   = it->second,
            .delayAfter             = step.attribute("Delay").as_int(),
            .expectedStateCheckCode = std::string{step.child("Condition").child_value()},
            .actionCode             = std::string{step.child("Action").child_value()},
        };

        // Check if the procedure is valid and add the step to the correct list or skip the procedure completely
        auto itr = procedureListMap.find(procedureName);
        if (itr != procedureListMap.end()) {
          itr->second.push_back(pStep);
        } else {
          std::cerr << "The procedure " << procedureName << " is not valid. Skipping the whole procedure." << std::endl;
          continue_outer = true;
          break;
        }
      }  // for all steps
      if (continue_outer) {
        continue_outer = false;
        continue;
      }
    }  // for all procedures

    // build the presets with the new procedure configurations
    initializePresets();

    return presets[pID - 1];
  }

 private:
  /**
   * @brief Insert pointers to the procedure steps into the preset
   * @param dest the preset to insert the procedure steps into
   * @param src the procedure steps to insert
   */
  static void insert(Preset& dest, ProcedureDefinition& src) {
    std::transform(begin(src), end(src), back_inserter(dest), [](auto& procedure) { return &procedure; });
  }

  /**
   * @brief Initialize the procedure list map with the correct procedures
   */
  void initializeProcedureListMap() {
    procedureListMap.clear();
    procedureListMap.emplace("POWERED_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("POWERED_CONFIG_OFF", ProcedureDefinition{});
    procedureListMap.emplace("PUSHBACK_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("PUSHBACK_CONFIG_OFF", ProcedureDefinition{});
    procedureListMap.emplace("TAXI_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("TAXI_CONFIG_OFF", ProcedureDefinition{});
    procedureListMap.emplace("TAKEOFF_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("TAKEOFF_CONFIG_OFF", ProcedureDefinition{});
  }

  /**
   * @brief Initialize the presets with the correct procedures steps
   *
   * Resets the presets and inserts the correct procedure steps as pointers into the presets.
   */
  void initializePresets() {
    coldAndDark.clear();
    powered.clear();
    readyForPushback.clear();
    readyForTaxi.clear();
    readyForTakeoff.clear();

    insert(coldAndDark, procedureListMap["TAKEOFF_CONFIG_OFF"]);
    insert(coldAndDark, procedureListMap["TAXI_CONFIG_OFF"]);
    insert(coldAndDark, procedureListMap["PUSHBACK_CONFIG_OFF"]);
    insert(coldAndDark, procedureListMap["POWERED_CONFIG_OFF"]);

    insert(powered, procedureListMap["TAKEOFF_CONFIG_OFF"]);
    insert(powered, procedureListMap["TAXI_CONFIG_OFF"]);
    insert(powered, procedureListMap["PUSHBACK_CONFIG_OFF"]);
    insert(powered, procedureListMap["POWERED_CONFIG_ON"]);

    insert(readyForPushback, procedureListMap["TAKEOFF_CONFIG_OFF"]);
    insert(readyForPushback, procedureListMap["TAXI_CONFIG_OFF"]);
    insert(readyForPushback, procedureListMap["POWERED_CONFIG_ON"]);
    insert(readyForPushback, procedureListMap["PUSHBACK_CONFIG_ON"]);

    insert(readyForTaxi, procedureListMap["TAKEOFF_CONFIG_OFF"]);
    insert(readyForTaxi, procedureListMap["POWERED_CONFIG_ON"]);
    insert(readyForTaxi, procedureListMap["PUSHBACK_CONFIG_ON"]);
    insert(readyForTaxi, procedureListMap["TAXI_CONFIG_ON"]);

    insert(readyForTakeoff, procedureListMap["POWERED_CONFIG_ON"]);
    insert(readyForTakeoff, procedureListMap["PUSHBACK_CONFIG_ON"]);
    insert(readyForTakeoff, procedureListMap["TAXI_CONFIG_ON"]);
    insert(readyForTakeoff, procedureListMap["TAKEOFF_CONFIG_ON"]);
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_PRESET_PROCEDURES
