// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_CACHEABLEVARIABLE_H
#define FLYBYWIRE_CACHEABLEVARIABLE_H

#include <optional>
#include <string>

#include <MSFS/Legacy/gauges.h>

#include "ManagedDataObjectBase.hpp"
#include "SimUnits.h"
#include "UpdateMode.h"

/**
 * @brief Virtual base class for sim variables like named variables, aircraft variables that support value caching.
 *
 * These variable are always stored as FLOAT64 values.
 *
 * Specialized classes must implement the rawReadFromSim and rawWriteToSim methods and can
 * overwrite any other method if the default implementation is not sufficient.
 */
class CacheableVariable : public ManagedDataObjectBase {
 protected:
  /**
   * The index of an indexed sim variable
   */
  int index = 0;

  /**
   * The unit of the variable as per the sim
   * @See SimUnits.h
   * @See https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Simulation_Variable_Units.htm
   */
  SimUnit unit{UNITS.Number};

  /**
   * The value of the variable as it was last read from the sim or updated by the
   * set() method. If the variable has not been read from the sim yet and has never been set
   * this value will be the FLOAT64 default value.
   * Prints an error to std::cerr if the cache is empty.
   * (MSFS does not allow exceptions)
   */
  std::optional<FLOAT64> cachedValue{};

  /**
   * Flag to indicate if the variable has been changed by set() since the last read from the sim and
   * that it needs to be written back to the sim.
   */
  bool dirty = false;

  /**
   * Flag to indicate if a warning should be printed to std::cerr if the variable is read via get()
   * but is dirty (has been written to after read from sim) and has not been written to the sim yet.
   */
  bool _warnIfDirty = false;

 protected:
  /**
   * The epsilon required to change a variable after a read from the sim. This is used to
   * set the changed flag and cache the new value if it is different by >epsilon from the last
   * cached value.
   */
  FLOAT64 epsilon = std::numeric_limits<FLOAT64>::epsilon();

  /**
   * The sim's data ID for the variable
   */
  ID dataID = -1;

  /**
   * Constructor
   * @param name The name of the variable in the sim
   * @param unit The unit of the variable as per the sim (see SimUnit.h)
   * @param updateMode The update mode for the variable
   * @param maxAgeTime The maximum age of the variable in seconds when using requestUpdateFromSim()
   * @param maxAgeTicks The maximum age of the variable in ticks when using updateDataToSim()
   */
  CacheableVariable(const std::string& varName, const SimUnit& unit, UpdateMode updateMode, FLOAT64 maxAgeTime, UINT64 maxAgeTicks)
      : ManagedDataObjectBase(varName, updateMode, maxAgeTime, maxAgeTicks), unit(unit) {}

 public:
  CacheableVariable()                                    = delete;  // no default constructor
  CacheableVariable(const CacheableVariable&)            = delete;  // no copy constructor
  CacheableVariable& operator=(const CacheableVariable&) = delete;  // no copy assignment
  CacheableVariable(CacheableVariable&&)                 = delete;  // no move constructor
  CacheableVariable& operator=(CacheableVariable&&)      = delete;  // no move assignment

  /**
   * Returns the cached value or the default value (FLOAT64{}) if the cache is empty.<p/>
   *
   * Prints an error to std::cerr if the cache is empty.<p/>
   *
   * If the value has been set by the set() method since the last read from the sim (is dirty)
   * but has not been written to the sim yet an error message is printed to std::cerr if warnIfDirty
   * is true. (MSFS does not allow exceptions)
   * @return cached value or default value
   */
  [[nodiscard]] FLOAT64 get() const;

  /**
   * Reads the value from the sim if the cached value is older than the max age (time or ticks).<p/>
   *
   * If a value has already been read during one tick it will therefore not be read again as the
   * variable's timeStamp and tickStamp will not be older than the current time and tick.<p/>
   *
   * It updates the cache (clears dirty flag), the hasChanged flag, the timeStampSimTime and
   * tickStamp.<p/>
   *
   * If the value has been set by the set() method since the last read from the sim (is dirty)
   * but has not been written to the sim yet an error message is printed to std::cerr.
   * (MSFS does not allow exceptions)
   *
   * @param timeStamp the current sim time (taken from the sim update event)
   * @param tickCounter the current tick counter (taken from a custom counter at each update event
   * @return the value read from the sim
   */
  FLOAT64 updateFromSim(FLOAT64 timeStamp, UINT64 tickCounter);

  /**
   * Reads the value from the sim ignoring the cached value. It is recommended to use the
   * updateFromSim() method instead as this guarantees that a variable is only read once per tick
   * no matter in which module the variable is used.<p/>
   *
   * It updates the cache (clears dirty flag) and manages the changed flag and sets it to true
   * if the value has changed since last read or sets it to false if the value has not changed.<p/>
   *
   * This does not update the timeStampSimTime or tickStamp.
   * @return the value read from the sim
   */
  FLOAT64 readFromSim();

  /**
   * Raw read call to the sim.<p/>
   * Must be implemented by specialized classes.<p/>
   * This method is called by the readFromSim() method.
   * @return the value read from the sim
   */
  [[nodiscard]] virtual FLOAT64 rawReadFromSim() const = 0;

  /**
   * Sets the cache value and marks the variable as dirty.<p/>
   * Does not write the value to the sim or update the time and tick stamps.
   * Check this variable's updateMode to see if the value will be written automatically to the sim or
   * if you need to write it manually.
   * @param value the value to set
   */
  virtual void set(FLOAT64 value);

  /**
   * Writes the cached value to the sim if the dirty flag is set.<p/>
   * If the cached value has never been set this method does nothing.<p/>
   * This does not update the timeStampSimTime or tickStamp.<p/>
   */
  void updateToSim();

  /**
   * Writes the current value to the sim.<p/>
   * Clears the dirty flag.
   */
  void writeToSim();

  /**
   * Writes the given value to the cache and the sim.<p/>
   * Clears the dirty flag.
   * @param value The value to set the variable to.
   */
  void setAndWriteToSim(FLOAT64 value);

  /**
   * Raw write call to the sim.<p/>
   * Must be implemented by specialized classes.<p/>
   * This method is called by the writeDataToSim()methods.
   */
  virtual void rawWriteToSim() = 0;

  // Getters and Setters

  /**
   * @return the SimUnit of the variable
   * @see SimUnit.h
   */
  [[nodiscard]] const SimUnit& getUnit() const { return unit; }

  /**
   * @return the index of the variable
   */
  [[nodiscard]] int getIndex() const { return index; }

  /**
   * @return true if the value has been changed via set() since the last read from the sim.
   */
  [[nodiscard]] bool isDirty() const { return dirty; }

  /**
   * @brief If true a warning will be printed to std::cerr if the variable is read via get()
   *        but is dirty (has been written to after read from sim) and has not been written to the sim yet.
   * @return true if a warning will be printed
   */
  [[nodiscard]] bool warnIfDirty() const { return _warnIfDirty; }

  /**
   * @brief If true a warning will be printed to std::cerr if the variable is read via get()
   *        but is dirty (has been written to after read from sim) and has not been written to the sim yet.
   * @param warnIfDirty true if a warning should be printed, false otherwise
   */
  void setWarnIfDirty(bool warnIfDirty) { CacheableVariable::_warnIfDirty = warnIfDirty; }

  /**
   * OBS: This method only does a simple static cast to a bool. Make sure that a cast from
   * the double (FLOAT64) is sufficient for your use case. Otherwise use get() and almostEqual().
   * @return the value casted to a boolean
   */
  [[nodiscard]] bool getAsBool() const { return static_cast<bool>(get()); }

  /**
   * Sets the value from a bool and marks the variable as dirty.
   * @param b the value to set
   */
  void setAsBool(bool b) { set(b ? 1.0 : 0.0); }

  /**
   * casted to an INT64
   */
  [[nodiscard]] INT64 getAsInt64() const { return static_cast<INT64>(get()); }

  /**
   * Sets the value from an INT64 and marks the variable as dirty.
   * @param i the value to set
   */
  void setAsInt64(UINT64 i) { set(static_cast<FLOAT64>(i)); }

  /**
   * @return Epsilon used for comparing floating point values. Variables are considered equal if the
   * difference is smaller than this value.
   */
  [[nodiscard]] FLOAT64 getEpsilon() const { return epsilon; }

  /**
   * Epsilon used for comparing floating point values. Variables are considered equal if the
   * difference is smaller or equal than this value.
   * @param eps epsilon value to be used
   */
  void setEpsilon(FLOAT64 eps) { epsilon = eps; }

  /**
   * @return the data id the sim assigned to this variable
   */
  [[nodiscard]] ID getDataId() const { return dataID; }
};

#endif  // FLYBYWIRE_CACHEABLEVARIABLE_H
