// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_H
#define FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_H

#include <string>

/**
 * A procedure step is a single step in a procedure.
 *
 * @field description A description of the step
 * @field id A unique id for each step
 * @field isConditional True if the procedure step is a pure condition check to wait for a certain state
 * @field delayAfter Time to delay next step of execution of action - will be skipped if expected state is already set
 * @field expectedStateCheckCode Check if desired state is already set so the action can be skipped
 * @field actionCode Calculator code to achieve the desired state. If it is a conditional this calculator code needs to eval to true or false
 */
struct ProcedureStep {
  std::string description;
  int id;
  bool isConditional;
  double delayAfter;
  std::string expectedStateCheckCode;
  std::string actionCode;
};

#endif  // FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_H
