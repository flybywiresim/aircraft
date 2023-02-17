// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_A32NX_MANAGEDDATAOBJECTBASE_H
#define FLYBYWIRE_A32NX_MANAGEDDATAOBJECTBASE_H

#include "math_utils.h"
#include "logging.h"
#include <iostream>
#include <utility>
#include <string>
#include <sstream>
#include <optional>

#include <MSFS/Legacy/gauges.h>

#include "Units.h"
#include "IDGenerator.h"
#include "Callback.h"
#include "DataObjectBase.h"

// Used for callback registration to allow removal of callbacks
typedef uint64_t CallbackID;

/**
 * Defines a callback function for an event
 * @param number of parameters to use
 * @param parameters 0-4 to pass to the callback function
 */
typedef std::function<void()> CallbackFunction;

/**
 * Base class for all managed data objects.
 * Adds the ability to autoRead, autoWrite variables considering max age based on
 * time- and tick-stamps.
 * Also adds a hasChanged flag and the ability to register callbacks for when
 * the variable changes (TODO).
 */
class ManagedDataObjectBase : public DataObjectBase {
private:

  /**
   * Used to generate unique IDs for callbacks.
   */
  IDGenerator callbackIdGen{};

  /**
   * Map of callbacks to be called when the event is triggered in the sim.
   */
  std::map<CallbackID, CallbackFunction> callbacks;

  // Flag to indicate if the variable has changed compared to the last read/write from the sim.
  // Private because it should only be set by the setChanged() method so callbacks from
  // listeners can be triggered.
  bool changed = false;

protected:

  /**
   * Flag to indicate if the check for data changes should be skipped to save performance when the
   * check is not required.
   */
  bool skipChangeCheck = false;

  /**
   * Used by external classes to determine if the data should be updated from the sim when
   * a sim update call occurs. Updates are currently done manually by the external classes.
   * not using the SimConnect SIMCONNECT_PERIOD.
   * E.g. if autoRead is true the variable will be updated from the sim every time the
   * DataManager::preUpdate() method is called.
   */
  bool autoRead = false;

  /**
   * Used by external classes to determine if the variable should written to the sim when
   * a sim update call occurs.
   * E.g. if autoWrite is true the variable will be updated from the sim every time the
   * DataManager::postUpdate() method is called
   */
  bool autoWrite = false;

  /**
   * The time stamp of the last update from the sim
   */
  FLOAT64 timeStampSimTime{};

  /**
   * The maximum age of the value in sim time before it is updated from the sim by the
   * requestUpdateFromSim() method.
   */
  FLOAT64 maxAgeTime = 0;

  /**
   * The tick counter of the last update from the sim
   */
  UINT64 tickStamp = 0;

  /**
   * The maximum age of the value in ticks before it is updated from the sim by the
   */
  UINT64 maxAgeTicks = 0;

  /**
   * Create base super class for all managed data objects.
   * @param varName the name of the variable in the sim
   * @param autoRead if true the variable will be updated from the sim every time the DataManager::preUpdate() method is called
   * @param autoWrite if true the variable will be updated from the sim every time the DataManager::postUpdate() method is called
   * @param maxAgeTime the maximum age of the value in sim time before it is updated from the sim
   * @param maxAgeTicks the maximum age of the value in ticks before it is updated from the sim
   */
  ManagedDataObjectBase(
    const std::string varName,
    bool autoRead,
    bool autoWrite,
    FLOAT64 maxAgeTime,
    UINT64 maxAgeTicks)
    : DataObjectBase(std::move(varName)), autoRead(autoRead), autoWrite(autoWrite), maxAgeTime(maxAgeTime),
      maxAgeTicks(maxAgeTicks) {}

  ~ManagedDataObjectBase() override = default;

  /**
   * Sets the changed flag to the given value and triggers the registered callbacks
   * if the value has changed.
   * TODO: Implement listener registration and callbacks
   * @param changed the new value for the changed flag
   */
  void setChanged(bool changed) {
    this->changed = changed;
    if (changed) {
      for (const auto &[id, callback]: callbacks) {
        callback();
      }
    }
  }

public:
  ManagedDataObjectBase() = delete; // no default constructor
  ManagedDataObjectBase(const ManagedDataObjectBase &) = delete; // no copy constructor
  ManagedDataObjectBase &operator=(const ManagedDataObjectBase &) = delete; // no copy assignment

  /**
   * Adds a callback function to be called when the event is triggered in the sim.
   * The first callback also registers the event to the sim.
   * @param callback
   * @return The ID of the callback required for removing a callback.
   */
  CallbackID addCallback(const CallbackFunction &callback) {
    const auto id = callbackIdGen.getNextId();
    callbacks.insert({id, callback});
    LOG_DEBUG("Added callback to data object " + name + " with callback ID " + std::to_string(id));
    return id;
  }

  /**
   * Removes a callback from the event.
   * The last callback also unregisters the event from the sim.
   * @param callbackId The ID receive when adding the callback.
   */
  bool removeCallback(CallbackID callbackId) {
    if (auto pair = callbacks.find(callbackId); pair != callbacks.end()) {
      callbacks.erase(pair);
      LOG_DEBUG("Removed callback from data object " + name + " with callback ID " + std::to_string(callbackId));
      return true;
    }
    LOG_WARN("Failed to remove callback with ID " + std::to_string(callbackId) + " from data object " + str());
    return false;
  }

  /**
   * Checks if the variable needs to be updated from the sim based on the given time stamp
   * and tickCounter.<p/>
   * Returns true if the value is older than the max age for sim time and ticks.<p/>
   * This includes to make sure is only read from the sim once per tick when max age is 0.
   * @param timeStamp - current sim time
   * @param tickCounter - current tick counter
   * @return true if the variable needs to be updated from the sim, false otherwise
   */
  [[nodiscard]]
  bool needsUpdateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) const {
    const FLOAT64 timeStampPlusAge = timeStampSimTime + maxAgeTime;
    const UINT64 tickStampPlusAge = tickStamp + maxAgeTicks;
    return (timeStampPlusAge < timeStamp && tickStampPlusAge < tickCounter);
  }

  /**
   * When this is true every read from the sim will set the changed flag to true
   * no matter if the value has changed or not.
   * When this is false the changed flag will be set to true only if the value
   * has actually changed.
   * @return true if the value has changed since the last read from the sim.
   */
  [[nodiscard]]
  bool hasChanged() const { return this->changed; }

  /**
   * @return true if the check for data changes should be skipped to save performance when the check is not required, false otherwise
   */
  [[nodiscard]] bool getSkipChangeCheck() const { return skipChangeCheck; }

  /**
   * Sets the flag to skip the check for data changes to save performance when
   * the check is not required. When this is set every read from the sim will
   * set the changed flag to true no matter if the value has changed or not.
   * @param changeCheck
   */
  void setSkipChangeCheck(bool skipChangeCheck) { this->skipChangeCheck = skipChangeCheck; }

  /**
   * @return true if the variable should be automatically updated from the sim n the DataManagers
   *         postUpdate() method.
   */
  [[nodiscard]]
  bool isAutoRead() const { return autoRead; }

  /**
   * Sets the autoRead flag.
   * If true the variable will be automatically updated from the sim in the DataManager's
   * preUpdate() method.
   * If set to false the variable will not be updated from the sim in the DataManager's preUpdate()
   * method.
   * @param autoReading the new value for the autoRead flag
   */
  void setAutoRead(bool autoReading) { autoRead = autoReading; }

  /**
   * @return true if the variable will be written to the sim in the DataManagers postUpdate() method.
   */
  [[nodiscard]]
  bool isAutoWrite() const { return autoWrite; }

  /**
   * Sets the autoWrite flag.
   * If set to true the variable will be written to the sim in the DataManagers postUpdate() method.
   * If set to false the variable will not be written to the sim automatically and writeDataToSim() must
   * be called manually.
   * @param autoWriting the new value for the autoWrite flag
   */
  virtual void setAutoWrite(bool autoWriting) { autoWrite = autoWriting; }

  /**
   * @return the time stamp of the last read from the sim
   */
  [[nodiscard]]
  FLOAT64 getTimeStamp() const { return timeStampSimTime; }

  /**
   * @return the maximum age of the variable in seconds
   */
  [[nodiscard]]
  FLOAT64 getMaxAgeTime() const { return maxAgeTime; }

  /**
   * Sets the maximum age of the variable in seconds
   * @param maxAgeTimeInMilliseconds
   */
  void setMaxAgeTime(FLOAT64 maxAgeTimeInMilliseconds) { maxAgeTime = maxAgeTimeInMilliseconds; }

  /**
   * @return the tick count when variable was last read from the sim
   */
  [[nodiscard]]
  UINT64 getTickStamp() const { return tickStamp; }

  /**
   * @return the maximum age of the variable in ticks
   */
  [[nodiscard]]
  UINT64 getMaxAgeTicks() const { return maxAgeTicks; }

  /**
   * Sets the maximum age of the variable in ticks
   * @param maxAgeTicksInTicks the maximum age of the variable in ticks
   */
  void setMaxAgeTicks(UINT64 maxAgeTicksInTicks) { maxAgeTicks = maxAgeTicksInTicks; }

};

#endif //FLYBYWIRE_A32NX_MANAGEDDATAOBJECTBASE_H
