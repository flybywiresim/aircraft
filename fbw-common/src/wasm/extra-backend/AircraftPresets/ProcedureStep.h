// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_H
#define FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_H

#include <string>

/**
 * @brief The type of a procedure step.
 *
 * @enum STEP: Normal procedure step, which is required to be executed even in expedited mode
 * @enum NOEX: Normal Procedure step, which must not be expedited
 * @enum PROC: Procedure step, which is not required to be executed in expedited mode and will not be expedited
 * @enum COND: Conditional procedure step, waits for a certain state to be set
 */
enum StepType {
  STEP,
  NOEX,
  PROC,
  COND,
};

/**
 * A procedure step is a single step in a procedure.
 *
 * @field description A description of the step
 * @field type The type of the step (STEP, NOEX, PROC, COND)
 * @field delayAfter Time to delay next step of execution of action - will be skipped if expected state is already set
 * @field expectedStateCheckCode Check if desired state is already set so the action can be skipped
 * @field actionCode Calculator code to achieve the desired state. If it is a conditional this calculator code needs to eval to true or
 *        false
 * @field noExpedite If true, the step will not be expedited even if expedite is set (default: false)
 */
struct ProcedureStep {
  std::string description;
  StepType    type;
  double      delayAfter;
  std::string expectedStateCheckCode;
  std::string actionCode;
  bool        noExpedite = false;
};

#endif  // FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_H
