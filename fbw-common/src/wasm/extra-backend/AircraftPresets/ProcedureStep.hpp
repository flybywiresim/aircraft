// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_HPP
#define FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_HPP

#include <fmt/core.h>
#include <sstream>
#include <string>
#include <unordered_map>

/**
 * @brief The type of a procedure step as a combination of flags.
 *
 * The flags are:
 * @enum ACTION: The step is an action step
 * @enum CONDITION: The step is a conditional step
 * @enum NORMAL_MODE: The step is not expedited
 * @enum EXPEDITED_MODE: The step is expedited
 * @enum EXPEDITED_DELAY: The step is expedited and the delay should be respected
 *
 * The convenience flags are:
 * @enum STEP: Action step in normal and expedited mode
 * @enum PROC: Action step only executed in normal mode - skipped in expedited mode
 * @enum NOEX: Action step in normal and expedited mode, delay is respected even in expedited mode
 * @enum EXON: Action step only executed in expedited mode - skipped in normal mode
 * @enum COND: Conditional step, runs in normal and expedited mode
 * @enum NCON: Conditional step, runs in normal mode only
 * @enum ECON: Conditional step, runs in expedited mode only
 */
enum StepType {
  ACTION          = 0b00001,
  CONDITION       = 0b00010,
  NORMAL_MODE     = 0b00100,  // runs in normal mode
  EXPEDITED_MODE  = 0b01000,  // runs in expedited mode
  EXPEDITED_DELAY = 0b10000,  // Respect the delay after the step even in expedited mode

  // convenience flags for the most common combinations
  STEP = ACTION | NORMAL_MODE | EXPEDITED_MODE,  // Action step in normal and expedited mode
  PROC = ACTION | NORMAL_MODE,                   // Action step only executed in normal mode - skipped in expedited mode
  NOEX = STEP | EXPEDITED_DELAY,                 // Action step in normal and expedited mode, delay is respected even in expedited mode
  EXON = ACTION | EXPEDITED_MODE,                // Action step only executed in expedited mode - skipped in normal mode

  COND = CONDITION | NORMAL_MODE | EXPEDITED_MODE,  // Conditional step, runs in normal and expedited mode
  NCON = CONDITION | NORMAL_MODE,                   // Conditional step, runs in normal mode only
  ECON = CONDITION | EXPEDITED_MODE,                // Conditional step, runs in expedited mode only
};

/**
 * A procedure step is a single step in a procedure.
 *
 * @field description A description of the step
 * @field type The type of the step as a combination of flags - @see StepType
 * @field delayAfter Time to delay next step of execution of action - will be skipped if expected state is already set
 * @field expectedStateCheckCode Check if desired state is already set so the action can be skipped. If it is a conditional step
 *         this code needs to eval to true or false. The procedure only continues if the code evals to true.
 * @field actionCode Calculator code to achieve the desired state.
 * @field noExpedite If true, the step will not be expedited even if expedite is set (default: false)
 */
class ProcedureStep {
 public:
  static std::unordered_map<std::string, StepType> StepTypeMap;

  // the data of the procedure step
  const std::string description;
  const StepType    type;
  const double      delayAfter;
  const std::string expectedStateCheckCode;
  const std::string actionCode;

  /**
   * @brief Construct a new Procedure Step object
   * @param description
   * @param type
   * @param delayAfter
   * @param expectedStateCheckCode
   * @param actionCode
   */
  ProcedureStep(const std::string& description,
                const StepType     type,
                const double       delayAfter,
                const std::string& expectedStateCheckCode,
                const std::string& actionCode)
      : description(description),
        type(type),
        delayAfter(delayAfter),
        expectedStateCheckCode(expectedStateCheckCode),
        actionCode(actionCode) {}

  /**
   * @brief Convert a StepType to a string.
   * @param type the StepType to convert
   * @return the string representation of the StepType
   */
  static std::string toString(const StepType& type) {
    for (const auto& pair : StepTypeMap) {
      if (pair.second == type)
        return pair.first;
    }
    return "Invalid StepType";
  }

  /**
   * @brief Convert a ProcedureStep to a string.
   * @return the string representation of the ProcedureStep
   */
  std::string toString() const {
    return fmt::format("Step: {} Type: {} Delay: {}\n ExpectedStateCheckCode: [{}]\n ActionCode: [{}]\n", description, toString(type),
                       delayAfter, expectedStateCheckCode, actionCode);
  }
};

// Initialize the StepTypeMap
inline std::unordered_map<std::string, StepType> ProcedureStep::StepTypeMap = {
    {"STEP", StepType::STEP},
    {"PROC", StepType::PROC},
    {"NOEX", StepType::NOEX},
    {"EXON", StepType::EXON},
    {"COND", StepType::COND},
    {"NCON", StepType::NCON},
    {"ECON", StepType::ECON}
};

#endif  // FLYBYWIRE_AIRCRAFT_PROCEDURESTEP_HPP
