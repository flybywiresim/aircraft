// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_NAMEDVARIABLE_H
#define FLYBYWIRE_NAMEDVARIABLE_H

#include <string>

#include "CacheableVariable.h"
#include "UpdateMode.h"
#include "simple_assert.h"

class DataManager;

/**
 * @brief The NamedVariable class is a specialization of CacheableVariable for named variables (LVARS).
 *        NamedVariables are always FLOAT64.
 *
 * It is recommended to use the DataManager's make_named_var() to create instances of NamedVariable
 * as it de-duplicates variables and only creates one instance of each name-unit combination.<p/>
 *
 * NamedVariables can't be copy constructed or assigned. They can only be moved.
 * Create a new NamedVariable instance instead.
 *
 * @see CacheableVariable
 */
class NamedVariable : public CacheableVariable {
  // The data manager is a friend, so it can access the private constructor.
  friend DataManager;

  static std::string AIRCRAFT_PREFIX;

  /**
   * Creates an instance of a named variable.<p/>
   * If the variable is not found in the sim it will be created.<p/>
   *
   * It is recommended to use the DataManager's make_named_var() to create instances of NamedVariable
   * as it de-duplicates variables and only creates one instance of each name-unit combination.
   *
   * @param varName The varName of the variable in the sim. An aircraft prefix (e.g. A32NX_) might be added
   *                automatically if specified when creating the MsfsHandler and the varName does not already contain it.
   * @param unit The unit  of the variable as per the sim. See SimUnits.h
   * @param updateMode The DataManager update mode of the variable. (default: UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime The maximum age of an auto updated variable in seconds.
   * @param maxAgeTicks The maximum age of an auto updated variable in sim ticks.
   * @param noPrefix If true, the aircraft prefix will not be added to the variable name.
   */
  explicit NamedVariable(const std::string& varName,
                         SimUnit            unit        = UNITS.Number,
                         UpdateMode         updateMode  = UpdateMode::NO_AUTO_UPDATE,
                         FLOAT64            maxAgeTime  = 0.0,
                         UINT64             maxAgeTicks = 0,
                         bool               noPrefix    = false)
      : CacheableVariable(noPrefix ? varName : addPrefixToVarName(varName), unit, updateMode, maxAgeTime, maxAgeTicks) {
    dataID = register_named_variable(name.c_str());
  }

  /**
   * @brief Adds the aircraft prefix to the variable name if it is not already present.
   * @param varName The variable name to prefix.
   * @return The prefixed variable name.
   */
  static std::string addPrefixToVarName(const std::string& varName);

 public:
  NamedVariable()                                = delete;  // no default constructor
  NamedVariable(const NamedVariable&)            = delete;  // no copy constructor
  NamedVariable& operator=(const NamedVariable&) = delete;  // no copy assignment
  NamedVariable(NamedVariable&&)                 = delete;  // move constructor
  NamedVariable& operator=(NamedVariable&&)      = delete;  // move assignment

  [[nodiscard]] FLOAT64 rawReadFromSim() const override;

  void rawWriteToSim() override;

  [[nodiscard]] std::string str() const override;

  /**
   * @brief Sets the aircraft prefix as a static class variable for all NamedVariables.<p/>
   *        This will usually be set by the MsfsHandler constructor.
   * @param aircraftPrefix The aircraft prefix to use.
   */
  static void setAircraftPrefix(const std::string& aircraftPrefix) { NamedVariable::AIRCRAFT_PREFIX = aircraftPrefix; }

  /**
   * @brief  Returns the static aircraft prefix for all NamedVariables.
   * @return The aircraft prefix.
   */
  static const std::string& getAircraftPrefix() { return AIRCRAFT_PREFIX; }

  friend std::ostream& operator<<(std::ostream& os, const NamedVariable& namedVariable);
};

// This is a default value for the prefix, it will be overwritten
// by the MsfsHandler constructor.
inline std::string NamedVariable::AIRCRAFT_PREFIX = "FBW_";

#endif  // FLYBYWIRE_NAMEDVARIABLE_H
