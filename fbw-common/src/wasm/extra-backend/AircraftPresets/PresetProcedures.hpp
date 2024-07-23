// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PRESET_PROCEDURES
#define FLYBYWIRE_AIRCRAFT_PRESET_PROCEDURES

#include <algorithm>
#include <optional>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

#include "lib/tinyxml2/tinyxml2.h"
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
 * @note A Procedure is a list of ProcedureSteps that are read from the XML file and executed in the order given in the XML.<br/>
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

  // The XML document containing the procedure definitions
  tinyxml2::XMLDocument presetProceduresXML;

  // List of all presets to access via index ID - ID starts at 1 so must be mapped to the index by subtracting 1
  std::vector<Preset*> presets = {&coldAndDark, &powered, &readyForPushback, &readyForTaxi, &readyForTakeoff};

  // Map the procedure names to procedure definitions to quickly validate the XML given procedures and add them to the correct list
  std::unordered_map<std::string, ProcedureDefinition> procedureListMap{};

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
   * @return a pointer to the Preset or nullptr if the procedure was not found
   */
  Preset* getProcedure(int pID) {
    if (pID < 1 || pID > 5) {
      LOG_ERROR("AircraftPresets: The procedure ID " + std::to_string(pID) + " is not valid. Valid IDs are 1-5.");
      return nullptr;
    }
    if (!loadXMLConfig(configFile)) {
      return nullptr;
    }

    initializeProcedureListMap();
    processProcedures();
    initializePresets();
    return presets[pID - 1];
  }

 private:
  /**
   * @brief Load the XML config file and return the root node
   * @param filePath the path to the XML file containing the procedure definitions in the MSFS VFS
   * @return the root node of the XML file
   */
  bool loadXMLConfig(const std::string& filePath) {
    presetProceduresXML.LoadFile(filePath.c_str());  // also clears the previous document
    if (presetProceduresXML.Error()) {
      LOG_ERROR("AircraftPresets: XML config \"" + filePath +
                "\" parsed with errors. Error description: " + presetProceduresXML.ErrorStr());
      return false;
    }
    LOG_INFO("AircraftPresets: XML config \"" + filePath + "\" parsed without errors.");
    return true;
  }

  /**
   * @brief Process the procedures from the XML file and add them to the procedure list map
   * @param rootNode the root node of the XML file
   */
  void processProcedures() {
    tinyxml2::XMLNode* rootNode = presetProceduresXML.RootElement();
    if (!rootNode) {
      LOG_ERROR("AircraftPresets: The XML config file does not contain a root node.");
      return;
    }

    for (auto currentProcedure = rootNode->FirstChildElement(); currentProcedure;
         currentProcedure      = currentProcedure->NextSiblingElement()) {
      const std::string procedureName = currentProcedure->Attribute("Name");

      // Check if the procedure name is valid
      if (procedureListMap.find(procedureName) == procedureListMap.end()) {
        LOG_ERROR("AircraftPresets: The procedure " + procedureName + " is not valid. Skipping the whole procedure.");
        continue;
      }

      for (auto currentStep         = currentProcedure->FirstChildElement();  //
           currentStep; currentStep = currentStep->NextSiblingElement()) {
        // Get the step type
        auto typeItr = ProcedureStep::StepTypeMap.find(currentStep->Attribute("Type"));

        // Check if the step type is valid
        if (typeItr == ProcedureStep::StepTypeMap.end()) {
          LOG_ERROR("AircraftPresets: Invalid step. Skipping the Step.\n Procedure: " + procedureName +
                    " Step: " + currentStep->Attribute("Name"));
          continue;
        }

        // Check if the delay is valid
        if (currentStep->IntAttribute("Delay") < 0) {
          LOG_ERROR("AircraftPresets: Invalid delay. Skipping the Step.\n Procedure: " + procedureName +
                    " Step: " + currentStep->Attribute("Name"));
          continue;
        }

        // Get the condition and action from the step
        std::string condition, action;
        for (auto currentStepChild = currentStep->FirstChildElement(); currentStepChild;
             currentStepChild      = currentStepChild->NextSiblingElement()) {
          if (!std::strcmp(currentStepChild->Name(), "Condition") && currentStepChild->GetText())
            condition = currentStepChild->GetText();
          else if (!std::strcmp(currentStepChild->Name(), "Action") && currentStepChild->GetText())
            action = currentStepChild->GetText();
        }

        // Add the procedure step to the procedure list map
        procedureListMap[procedureName].emplace_back(  //
            currentStep->Attribute("Name"),            //
            typeItr->second,                           //
            currentStep->IntAttribute("Delay"),        //
            condition,                                 //
            action                                     //
        );
      }
    }
  }

  /**
   * @brief Clears and initializes the procedure list map with the correct procedures
   */
  void initializeProcedureListMap() {
    procedureListMap.clear();
    procedureListMap.emplace("POWERUP_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("POWERUP_CONFIG_OFF", ProcedureDefinition{});
    procedureListMap.emplace("PUSHBACK_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("PUSHBACK_CONFIG_OFF", ProcedureDefinition{});
    procedureListMap.emplace("TAXI_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("TAXI_CONFIG_OFF", ProcedureDefinition{});
    procedureListMap.emplace("TAKEOFF_CONFIG_ON", ProcedureDefinition{});
    procedureListMap.emplace("TAKEOFF_CONFIG_OFF", ProcedureDefinition{});
  }

  /**
   * @brief Clears and initializes the presets with the correct procedures steps
   *
   * Resets the presets and inserts the correct procedure steps as pointers into the presets.
   */
  void initializePresets() {
    coldAndDark.clear();
    powered.clear();
    readyForPushback.clear();
    readyForTaxi.clear();
    readyForTakeoff.clear();

    insertProcedureSteps(coldAndDark, {"TAKEOFF_CONFIG_OFF", "TAXI_CONFIG_OFF", "PUSHBACK_CONFIG_OFF", "POWERUP_CONFIG_OFF"});
    insertProcedureSteps(powered, {"TAKEOFF_CONFIG_OFF", "TAXI_CONFIG_OFF", "PUSHBACK_CONFIG_OFF", "POWERUP_CONFIG_ON"});
    insertProcedureSteps(readyForPushback, {"TAKEOFF_CONFIG_OFF", "TAXI_CONFIG_OFF", "POWERUP_CONFIG_ON", "PUSHBACK_CONFIG_ON"});
    insertProcedureSteps(readyForTaxi, {"TAKEOFF_CONFIG_OFF", "POWERUP_CONFIG_ON", "PUSHBACK_CONFIG_ON", "TAXI_CONFIG_ON"});
    insertProcedureSteps(readyForTakeoff, {"POWERUP_CONFIG_ON", "PUSHBACK_CONFIG_ON", "TAXI_CONFIG_ON", "TAKEOFF_CONFIG_ON"});
  }

  /**
   * @brief Insert the procedure steps into the presets
   * @param dest the preset to insert the procedure steps into
   * @param procedureNames the names of the procedures to insert
   */
  void insertProcedureSteps(Preset& dest, const std::vector<std::string>& procedureNames) {
    for (const auto& name : procedureNames) {
      std::transform(                                 //
          begin(procedureListMap[name]),              //
          end(procedureListMap[name]),                //
          back_inserter(dest),                        //
          [](auto& procedure) { return &procedure; }  //
      );                                              //
    }
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_PRESET_PROCEDURES
