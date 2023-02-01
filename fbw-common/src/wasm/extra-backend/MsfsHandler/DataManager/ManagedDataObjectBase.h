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
#include "DataObjectBase.h"

/**
 * Base class for all managed data objects.
 * Adds the ability to autoRead, autoWrite variables considering max age based on
 * time- and tick-stamps.
 */
class ManagedDataObjectBase : public DataObjectBase {

protected:

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
    const std::string &varName,
    bool autoRead,
    bool autoWrite,
    FLOAT64 maxAgeTime,
    UINT64 maxAgeTicks)
    : DataObjectBase(varName), autoRead(autoRead), autoWrite(autoWrite), maxAgeTime(maxAgeTime),
      maxAgeTicks(maxAgeTicks) {}

  ~ManagedDataObjectBase() override = default;

public:
  ManagedDataObjectBase() = delete; // no default constructor
  ManagedDataObjectBase(const ManagedDataObjectBase &) = delete; // no copy constructor
  ManagedDataObjectBase &operator=(const ManagedDataObjectBase &) = delete; // no copy assignment

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
