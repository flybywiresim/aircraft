// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFTVARIABLE_H
#define FLYBYWIRE_AIRCRAFTVARIABLE_H

#include <iostream>
#include <utility>

#include "logging.h"
#include "CacheableVariable.h"
#include "Event.h"

/**
 * Specialized class for aircraft cacheable variables (aka simvars or A:VARS).
 *
 * This class uses events or calculator code to write to a variable as
 * AircraftVariables are read-only.
 *
 * If no setter code or event is provided the variable will be read-only.
 */
class AircraftVariable : public CacheableVariable {
private:

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
  std::shared_ptr<Event> setterEvent{};

public:

  AircraftVariable() = delete; // no default constructor
  AircraftVariable(const AircraftVariable &) = delete; // no copy constructor
  AircraftVariable &operator=(const AircraftVariable &) = delete; // no copy assignment

  /**
   * Creates an instance of a writable aircraft variable.
   * If a setter event name is provided the variable will be writable.
   * @param varName The name of the variable in the sim.
   * @param varIndex The index of the variable in the sim.
   * @param setterEventName The name of the event used to write to the variable.
   * @param unit The unit of the variable as per the sim. See Units.h
   * @param autoReading Used by external classes to determine if the variable should be updated
   * automatically from the sim.
   * @param autoWriting Used by external classes to determine if the variable should be written
   * back to the sim automatically.
   * @param maxAgeTime The maximum age of an auto updated the variable in seconds.
   * @param maxAgeTicks The maximum age of an auto updated the variable in sim ticks.
   * @param setterEventName The calculator code to write to the variable.
   */
  explicit AircraftVariable(
    const std::string varName,
    int varIndex = 0,
    std::string setterEventName = "",
    Unit unit = UNITS.Number,
    bool autoReading = false,
    bool autoWriting = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0)
    : CacheableVariable(std::move(varName), unit, autoReading, autoWriting, maxAgeTime, maxAgeTicks),
      index(varIndex), setterEventName(std::move(setterEventName)), setterEvent(nullptr) {

    dataID = get_aircraft_var_enum(varName.c_str());
    if (dataID == -1) { // cannot throw an exception in MSFS
      LOG_ERROR("Aircraft variable " + varName + " not found in the Simulator");
    }
  }

  /**
   * Creates an instance of a writable aircraft variable.
   * If a setter event object is provided the variable will be writable.
   * @param varName The name of the variable in the sim.
   * @param varIndex The index of the variable in the sim.
   * @param setterEvent The event used to write to the variable.
   * @param unit The unit of the variable as per the sim. See Units.h
   * @param autoReading Used by external classes to determine if the variable should be updated
   * automatically from the sim.
   * @param autoWriting Used by external classes to determine if the variable should be written
   * back to the sim automatically.
   * @param maxAgeTime The maximum age of an auto updated the variable in seconds.
   * @param maxAgeTicks The maximum age of an auto updated the variable in sim ticks.
   * @param setterEventName The calculator code to write to the variable.
   */
  explicit AircraftVariable(
    const std::string &varName,
    int varIndex = 0,
    std::shared_ptr<Event> setterEvent = nullptr,
    Unit unit = UNITS.Number,
    bool autoReading = false,
    bool autoWriting = false,
    FLOAT64 maxAgeTime = 0.0,
    UINT64 maxAgeTicks = 0)
    : CacheableVariable(varName, unit, autoReading, autoWriting, maxAgeTime, maxAgeTicks),
      index(varIndex), setterEvent(std::move(setterEvent)) {

    dataID = get_aircraft_var_enum(varName.c_str());
    if (dataID == -1) { // cannot throw an exception in MSFS
      LOG_ERROR("Aircraft variable " + varName + " not found in the Simulator");
    }
  }

  FLOAT64 rawReadFromSim() override;
  void rawWriteToSim() override;
  void setAutoWrite(bool autoWriting) override;
  void set(FLOAT64 value) override;

  [[nodiscard]] std::string str() const override;

private:
  void useEventSetter();
  void useCalculatorCodeSetter();

  friend std::ostream& operator<<(std::ostream& os, const AircraftVariable& aircraftVariable);
};


#endif //FLYBYWIRE_AIRCRAFTVARIABLE_H
