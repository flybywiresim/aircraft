// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_NAMEDVARIABLE_H
#define FLYBYWIRE_NAMEDVARIABLE_H

#include <iostream>
#include <string>

#include "CacheableVariable.h"
#include "aircraft_prefix.h"

class DataManager;

/**
 * Specialized class for named cacheable variables (LVARS).<p/>
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

  /**
   * Creates an instance of a named variable.<p/>
   * If the variable is not found in the sim it will be created.<p/>
   *
   * It is recommended to use the DataManager's make_named_var() to create instances of NamedVariable
   * as it de-duplicates variables and only creates one instance of each name-unit combination.
   *
   * @param varName The varName of the variable in the sim. An aircraft prefix (e.g. A32NX_) will be added automatically.
   * @param unit The unit  of the variable as per the sim. See Units.h
   * @param autoReading Used by external classes to determine if the variable should be updated
   * automatically from the sim.
   * @param autoWriting Used by external classes to determine if the variable should be written
   * back to the sim automatically.
   * @param maxAgeTime The maximum age of an auto updated variable in seconds.
   * @param maxAgeTicks The maximum age of an auto updated variable in sim ticks.
   */
  explicit NamedVariable(const std::string& varName,
                         Unit unit = UNITS.Number,
                         bool autoReading = false,
                         bool autoWriting = false,
                         FLOAT64 maxAgeTime = 0.0,
                         UINT64 maxAgeTicks = 0)
      : CacheableVariable(std::string(AIRCRAFT_PREFIX) + varName, unit, autoReading, autoWriting, maxAgeTime, maxAgeTicks) {
    dataID = register_named_variable(name.c_str());
  };

 public:
  NamedVariable() = delete;                                 // no default constructor
  NamedVariable(const NamedVariable&) = delete;             // no copy constructor
  NamedVariable& operator=(const NamedVariable&) = delete;  // no copy assignment

  FLOAT64 rawReadFromSim() override;
  void rawWriteToSim() override;

  [[nodiscard]] std::string str() const override;

  friend std::ostream& operator<<(std::ostream& os, const NamedVariable& namedVariable);
};

#endif  // FLYBYWIRE_NAMEDVARIABLE_H
