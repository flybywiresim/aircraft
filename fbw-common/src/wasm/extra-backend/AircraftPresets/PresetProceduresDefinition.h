// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PRESETPROCEDURESDEFINITION_H
#define FLYBYWIRE_AIRCRAFT_PRESETPROCEDURESDEFINITION_H

#include <vector>

#include "ProcedureStep.h"

/**
 * The PresetProceduresDefinition struct contains the procedure definitions for
 * the different configurations of the aircraft.<p/>
 *
 * It defines a series of procedure steps for each configuration.<p/>
 */
struct PresetProceduresDefinition {
  std::vector<ProcedureStep> POWERED_CONFIG_ON{};
  std::vector<ProcedureStep> POWERED_CONFIG_OFF{};
  std::vector<ProcedureStep> PUSHBACK_CONFIG_ON{};
  std::vector<ProcedureStep> PUSHBACK_CONFIG_OFF{};
  std::vector<ProcedureStep> TAXI_CONFIG_ON{};
  std::vector<ProcedureStep> TAXI_CONFIG_OFF{};
  std::vector<ProcedureStep> TAKEOFF_CONFIG_ON{};
  std::vector<ProcedureStep> TAKEOFF_CONFIG_OFF{};
};

#endif  // FLYBYWIRE_AIRCRAFT_PRESETPROCEDURESDEFINITION_H
