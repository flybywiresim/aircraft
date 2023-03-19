// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <algorithm>
#include <optional>
#include <string>
#include <vector>
#include "PresetProceduresDefinition.h"
#include "ProcedureStep.h"

#ifdef DEBUG
#include <iostream>
#endif

typedef const std::vector<ProcedureStep> ProcedureDefinition;
typedef std::vector<const ProcedureStep*> Procedure;

/**
 * The PresetProcedures class loads the procedure definitions from the PresetProceduresDefinition
 * and provides the procedures for the different configurations of the aircraft.<p/>
 */
class PresetProcedures {

  Procedure coldAndDark;
  Procedure powered;
  Procedure readyForPushback;
  Procedure readyForTaxi;
  Procedure readyForTakeoff;

  static void insert(Procedure& dest, ProcedureDefinition& src) {
    std::transform(begin(src), end(src), back_inserter(dest), [](const auto& procedure) { return &procedure; });
  }

#ifdef DEBUG
  static inline void printProcedure(const ProcedureDefinition& procedures) {
    for (const auto& p : procedures) {
      std::cout << p.id << " = " << p.description << std::endl;
    }
  }
#endif

 public:
  PresetProcedures(const PresetProceduresDefinition& proceduresDefinition) {

#ifdef DEBUG
    // Map the procedure groups
    // Print to console to add them to the EFB code to display the current step.
    printProcedure(proceduresDefinition.POWERED_CONFIG_ON);
    printProcedure(proceduresDefinition.PUSHBACK_CONFIG_ON);
    printProcedure(proceduresDefinition.TAXI_CONFIG_ON);
    printProcedure(proceduresDefinition.TAKEOFF_CONFIG_ON);
    printProcedure(proceduresDefinition.TAKEOFF_CONFIG_OFF);
    printProcedure(proceduresDefinition.TAXI_CONFIG_OFF);
    printProcedure(proceduresDefinition.PUSHBACK_CONFIG_OFF);
    printProcedure(proceduresDefinition.POWERED_CONFIG_OFF);
#endif

    insert(coldAndDark, proceduresDefinition.TAKEOFF_CONFIG_OFF);
    insert(coldAndDark, proceduresDefinition.TAXI_CONFIG_OFF);
    insert(coldAndDark, proceduresDefinition.PUSHBACK_CONFIG_OFF);
    insert(coldAndDark, proceduresDefinition.POWERED_CONFIG_OFF);

    insert(powered, proceduresDefinition.TAKEOFF_CONFIG_OFF);
    insert(powered, proceduresDefinition.TAXI_CONFIG_OFF);
    insert(powered, proceduresDefinition.PUSHBACK_CONFIG_OFF);
    insert(powered, proceduresDefinition.POWERED_CONFIG_ON);

    insert(readyForPushback, proceduresDefinition.TAKEOFF_CONFIG_OFF);
    insert(readyForPushback, proceduresDefinition.TAXI_CONFIG_OFF);
    insert(readyForPushback, proceduresDefinition.POWERED_CONFIG_ON);
    insert(readyForPushback, proceduresDefinition.PUSHBACK_CONFIG_ON);

    insert(readyForTaxi, proceduresDefinition.TAKEOFF_CONFIG_OFF);
    insert(readyForTaxi, proceduresDefinition.POWERED_CONFIG_ON);
    insert(readyForTaxi, proceduresDefinition.PUSHBACK_CONFIG_ON);
    insert(readyForTaxi, proceduresDefinition.TAXI_CONFIG_ON);

    insert(readyForTakeoff, proceduresDefinition.POWERED_CONFIG_ON);
    insert(readyForTakeoff, proceduresDefinition.PUSHBACK_CONFIG_ON);
    insert(readyForTakeoff, proceduresDefinition.TAXI_CONFIG_ON);
    insert(readyForTakeoff, proceduresDefinition.TAKEOFF_CONFIG_ON);
  }

  [[nodiscard]] std::optional<const Procedure*> getProcedure(int64_t pID) const {
    switch (pID) {
      case 1:
        return &coldAndDark;
      case 2:
        return &powered;
      case 3:
        return &readyForPushback;
      case 4:
        return &readyForTaxi;
      case 5:
        return &readyForTakeoff;
      default:
        return std::nullopt;
    }
  }
};
