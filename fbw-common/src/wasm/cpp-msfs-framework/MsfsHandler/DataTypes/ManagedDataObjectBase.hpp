// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_A32NX_MANAGEDDATAOBJECTBASE_H
#define FLYBYWIRE_A32NX_MANAGEDDATAOBJECTBASE_H

#include <cstdint>
#include <map>
#include <string>

#include <MSFS/Legacy/gauges.h>

#include "DataObjectBase.hpp"
#include "IDGenerator.h"
#include "UpdateMode.h"
#include "logging.h"

// Used for callback registration to allow removal of callbacks
using CallbackID = uint64_t;

// Callback function type
using CallbackFunction = std::function<void()>;

/**
 * @brief The ManagedDataObjectBase class is the base class for all data objects and provides auto
 * read and write functionality.
 *
 * Adds the ability to autoRead, autoWrite variables considering max age based on
 * time- and tick-stamps.
 * Also adds a hasChanged flag and the ability to register callbacks for when
 * the variable changes.
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
  std::map<CallbackID, CallbackFunction> callbacks{};

  // Flag to indicate if the variable has changed compared to the last read/write from the sim.
  // Private because it should only be set by the setChanged() method so callbacks from
  // listeners can be triggered.
  bool changedFlag = false;

 protected:
  /**
   * Flag to indicate if the check for data changes should be skipped to save performance when the
   * check is not required. The changedFlag will be set to true every time the variable is read from the sim.
   */
  bool skipChangeCheckFlag = false;

  /**
   * @brief the update mode for auto read and write
   */
  UpdateMode updateMode = UpdateMode::NO_AUTO_UPDATE;

  /**
   * The time stamp of the last update from the sim
   */
  FLOAT64 timeStampSimTime = 0.0;

  /**
   * The time the next update from the sim should be done
   */
  FLOAT64 nextUpdateTimeStamp = 0.0;

  /**
   * The maximum age of the value in sim time before it is updated from the sim by the
   * requestUpdateFromSim() method.
   */
  FLOAT64 maxAgeTime = 0.0;

  /**
   * The tick counter of the last update from the sim
   */
  UINT64 tickStamp = 0;

  /**
   * The tick counter the next update from the sim should be done
   */
  UINT64 nextUpdateTickStamp = 0;

  /**
   * The maximum age of the value in ticks before it is updated from the sim by the
   */
  UINT64 maxAgeTicks = 0;

  /**
   * Create base super class for all managed data objects.
   * @param varName the name of the variable in the sim
   * @param updateMode The DataManager update mode of the variable. (default: UpdateMode::NO_AUTO_UPDATE)
   * @param maxAgeTime the maximum age of the value in sim time before it is updated from the sim
   * @param maxAgeTicks the maximum age of the value in ticks before it is updated from the sim
   */
  ManagedDataObjectBase(const std::string& varName, UpdateMode updateMode, FLOAT64 maxAgeTime, UINT64 maxAgeTicks)
      : DataObjectBase(varName), updateMode(updateMode), maxAgeTime(maxAgeTime), maxAgeTicks(maxAgeTicks) {}

  /**
   * Sets the changedFlag flag to the given value and triggers the registered callbacks
   * if the value has changedFlag.
   * @param changed the new value for the changedFlag flag
   */
  void setChanged(bool changed) {
    changedFlag = changed;
    if (changedFlag) {
      for (const auto& [_, callback] : callbacks) {
        callback();
      }
    }
  }

 public:
  ManagedDataObjectBase()                                        = delete;   // no default constructor
  ManagedDataObjectBase(const ManagedDataObjectBase&)            = delete;   // no copy constructor
  ManagedDataObjectBase& operator=(const ManagedDataObjectBase&) = delete;   // no copy assignment
  ManagedDataObjectBase(ManagedDataObjectBase&&)                 = delete;   // no move constructor
  ManagedDataObjectBase& operator=(ManagedDataObjectBase&&)      = delete;   // no move assignment
  virtual ~ManagedDataObjectBase()                               = default;  // so derived classes can be destroyed with base class pointer

  /**
   * Adds a callback function to be called when the data object's data changed.<p/>
   * @param callback
   * @return The ID of the callback required for removing a callback.
   */
  CallbackID addCallback(const CallbackFunction& callback) {
    const auto id = callbackIdGen.getNextId();
    callbacks.insert({id, callback});
    LOG_DEBUG("Added callback to data object " + name + " with callback ID " + std::to_string(id));
    return id;
  }

  /**
   * Removes a callback from the data object.
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
   * and/or tickCounter.<p/>
   * Returns true if the value is either older than the max age for sim time or older than maxTicks.<p/>
   * This includes to make sure is only read from the sim once per tick when max age is 0.
   * @param timeStamp - current sim time
   * @param tickCounter - current tick counter
   * @return true if the variable needs to be updated from the sim, false otherwise
   */
  [[nodiscard]] bool needsUpdateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) const {
    return (nextUpdateTimeStamp < timeStamp && nextUpdateTickStamp < tickCounter);
  }

  /**
   * Updates the time stamps and stamps for the next update from the sim.
   * @param timeStamp - current sim time
   * @param tickCounter - current tick counter
   */
  void updateStamps(FLOAT64 timeStamp, UINT64 tickCounter) {
    timeStampSimTime    = timeStamp;
    nextUpdateTimeStamp = timeStamp + maxAgeTime;
    tickStamp           = tickCounter;
    nextUpdateTickStamp = tickCounter + maxAgeTicks;
  }

  /**
   * @return true if the value has changed since the last read from the sim.
   */
  [[nodiscard]] bool hasChanged() const { return changedFlag; }

  /**
   * When this is true every read from the sim will set the changed flag to true
   * no matter if the value has changed or not.
   * When this is false the changed flag will be set to true only if the value
   * has actually changed.
   * @return true if the check for data changes should be skipped to save performance when the check is not required, false otherwise
   */
  [[nodiscard]] bool getSkipChangeCheck() const { return skipChangeCheckFlag; }

  /**
   * Sets the flag to skip the check for data changes to save performance when
   * the check is not required. When this is set every read from the sim will
   * set the changed flag to true no matter if the value has changed or not.
   * @param changeCheck
   */
  void setSkipChangeCheck(bool skipChangeCheck) { skipChangeCheckFlag = skipChangeCheck; }

  /**
   * @brief Sets the auto read update mode for the variable.
   * @param autoRead if true the variable will be updated from the sim every time the DataManager::preUpdate() method is called, false
   * otherwise
   */
  virtual void setAutoRead(bool autoRead) {
    updateMode = static_cast<UpdateMode>(autoRead ? updateMode | UpdateMode::AUTO_READ : updateMode & ~UpdateMode::AUTO_READ);
  }

  /**
   * @return true if the variable should be automatically updated from the sim n the DataManagers
   *         postUpdate() method.
   */
  [[nodiscard]] bool isAutoRead() const { return updateMode & UpdateMode::AUTO_READ; }

  /**
   * @brief Sets the auto write update mode for the variable.
   * @param autoWrite if true the variable will be written to the sim every time the DataManager::postUpdate() method is called, false
   * otherwise
   */
  virtual void setAutoWrite(bool autoWrite) {
    updateMode = static_cast<UpdateMode>(autoWrite ? updateMode | UpdateMode::AUTO_WRITE : updateMode & ~UpdateMode::AUTO_WRITE);
  }

  /**
   * @return true if the variable will be written to the sim in the DataManagers postUpdate() method.
   */
  [[nodiscard]] bool isAutoWrite() const { return updateMode & UpdateMode::AUTO_WRITE; }

  /**
   * @brief Sets the update mode.
   * @param updateMode the new update mode
   */
  void setUpdateMode(UpdateMode updateMode) { this->updateMode = updateMode; }

  /**
   * @return the time stamp of the last read from the sim
   */
  [[nodiscard]] FLOAT64 getTimeStamp() const { return timeStampSimTime; }

  /**
   * @return the maximum age of the variable in seconds
   */
  [[nodiscard]] FLOAT64 getMaxAgeTime() const { return maxAgeTime; }

  /**
   * Sets the maximum age of the variable in seconds
   * @param maxAgeTimeInMilliseconds
   */
  void setMaxAgeTime(FLOAT64 maxAgeTimeInMilliseconds) { maxAgeTime = maxAgeTimeInMilliseconds; }

  /**
   * @return the tick count when variable was last read from the sim
   */
  [[nodiscard]] UINT64 getTickStamp() const { return tickStamp; }

  /**
   * @return the maximum age of the variable in ticks
   */
  [[nodiscard]] UINT64 getMaxAgeTicks() const { return maxAgeTicks; }

  /**
   * Sets the maximum age of the variable in ticks
   * @param maxAgeTicksInTicks the maximum age of the variable in ticks
   */
  void setMaxAgeTicks(UINT64 maxAgeTicksInTicks) { maxAgeTicks = maxAgeTicksInTicks; }
};

#endif  // FLYBYWIRE_A32NX_MANAGEDDATAOBJECTBASE_H
