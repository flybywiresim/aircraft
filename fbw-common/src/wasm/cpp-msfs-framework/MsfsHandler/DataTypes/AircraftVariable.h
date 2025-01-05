// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFTVARIABLE_H
#define FLYBYWIRE_AIRCRAFTVARIABLE_H

#include <iostream>
#include <utility>

#include "CacheableVariable.h"
#include "ClientEvent.h"
#include "UpdateMode.h"
#include "logging.h"

class DataManager;

/**
 * @brief The AircraftVariable class is a specialized class for aircraft cacheable variables (aka simvars or A:VARS).
 *        AircraftVariables are always FLOAT64.
 *
 * This class uses events or calculator code to write to a variable as AircraftVariables are read-only.<p/>
 *
 * If a setter event or event name is provided the variable will be writable.<p/>
 *
 * AircraftVariables can't be copy constructed or assigned. They can only be moved.
 * Create a new AircraftVariable instance instead.
 *
 * It is recommended to use the DataManager's make_aircraft_var() to create instances of AircraftVariable
 * as it de-duplicates variables and only creates one instance of each name-index-unit combination.
 */
class AircraftVariable : public CacheableVariable {
 private:
  // The data manager is a friend, so it can access the private constructor.
  friend DataManager;

  /**
   * Index of an indexed variable.
   */
  int index;

  /**
   * the event used in the calculator code to write to the variable.
   */
  std::string setterEventName;

  /**
   * the event used to write to the variable.
   */
  std::shared_ptr<ClientEvent> setterEvent{};

  /**
   * Creates an instance of a writable aircraft variable.<p/>
   * If a setter event or event name is provided the variable will be writable.<p/>
   * It is recommended to use the DataManager's make_aircraft_var() to create instances of AircraftVariable
   * as it de-duplicates variables and only creates one instance of each name-index-unit combination.
   * @param varName The name of the variable in the sim.
   * @param varIndex The index of the variable in the sim.
   * @param setterEventName The name of the event used to write to the variable.
   * @param unit The unit of the variable as per the sim. See SimUnits.h
   * @param updateMode The DataManager update mode of the variable. (default: UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime The maximum age of an auto updated the variable in seconds.
   * @param maxAgeTicks The maximum age of an auto updated the variable in sim ticks.
   */
  explicit AircraftVariable(const std::string& varName,
                            int                varIndex        = 0,
                            std::string        setterEventName = "",
                            SimUnit            unit            = UNITS.Number,
                            UpdateMode         updateMode      = UpdateMode::NO_AUTO_UPDATE,
                            FLOAT64            maxAgeTime      = 0.0,
                            UINT64             maxAgeTicks     = 0)
      : CacheableVariable(varName, unit, updateMode, maxAgeTime, maxAgeTicks),
        index(varIndex),
        setterEventName(std::move(setterEventName)),
        setterEvent(nullptr) {
    dataID = get_aircraft_var_enum(varName.c_str());
    if (dataID == -1) {  // cannot throw an exception in MSFS
      LOG_ERROR("Aircraft variable " + varName + " not found in the Simulator");
    }
  }

  /**
   * Creates an instance of a writable aircraft variable.
   * If a setter event object is provided the variable will be writable.
   * @param varName The name of the variable in the sim.
   * @param varIndex The index of the variable in the sim.
   * @param setterEvent The event used to write to the variable.
   * @param unit The unit of the variable as per the sim. See SimUnits.h
   * @param updateMode The DataManager update mode of the variable . (default: UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime The maximum age of an auto updated the variable in seconds.
   * @param maxAgeTicks The maximum age of an auto updated the variable in sim ticks.
   * @param setterEventName The calculator code to write to the variable.
   */
  explicit AircraftVariable(const std::string&                  varName,
                            int                                 varIndex    = 0,
                            const std::shared_ptr<ClientEvent>& setterEvent = nullptr,
                            SimUnit                             unit        = UNITS.Number,
                            UpdateMode                          updateMode  = UpdateMode::NO_AUTO_UPDATE,
                            FLOAT64                             maxAgeTime  = 0.0,
                            UINT64                              maxAgeTicks = 0)
      : CacheableVariable(varName, unit, updateMode, maxAgeTime, maxAgeTicks), index(varIndex), setterEvent(setterEvent) {
    dataID = get_aircraft_var_enum(varName.c_str());
    if (dataID == -1) {  // cannot throw an exception in MSFS
      LOG_ERROR("Aircraft variable " + varName + " not found in the Simulator");
    }
  }

 public:
  AircraftVariable()                                   = delete;  // no default constructor
  AircraftVariable(const AircraftVariable&)            = delete;  // no copy constructor
  AircraftVariable& operator=(const AircraftVariable&) = delete;  // no copy assignment
  AircraftVariable(AircraftVariable&&)                 = delete;  // move constructor
  AircraftVariable& operator=(AircraftVariable&&)      = delete;  // move assignment

  [[nodiscard]] FLOAT64 rawReadFromSim() const override;
  void                  rawWriteToSim() override;
  void                  setAutoWrite(bool autoWriting) override;
  void                  set(FLOAT64 value) override;

  [[nodiscard]] std::string str() const override;

 private:
  void useEventSetter();
  void useCalculatorCodeSetter();

  friend std::ostream& operator<<(std::ostream& os, const AircraftVariable& aircraftVariable);
};

#endif  // FLYBYWIRE_AIRCRAFTVARIABLE_H
