// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "CacheableVariable.h"
#include "ManagedDataObjectBase.hpp"
#include "logging.h"
#include "math_utils.hpp"

FLOAT64 CacheableVariable::get() const {
  if (cachedValue.has_value()) {
    if (_warnIfDirty && dirty) {
      LOG_WARN("CacheableVariable::get() called on " + name + " but the value is dirty");
    }
    return cachedValue.value();
  }
  LOG_ERROR("CacheableVariable::get() called on " + name + " but no value is cached");
  return 0.0;
}

FLOAT64 CacheableVariable::updateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) {
  if (cachedValue.has_value() && !needsUpdateFromSim(timeStamp, tickCounter)) {
    setChanged(false);
    LOG_TRACE("CacheableVariable::updateFromSim() - from cache " + this->name + " " + str());
    return cachedValue.value();
  }
  LOG_TRACE("CacheableVariable::updateFromSim() - read from sim " + this->name + " " + str());
  updateStamps(timeStamp, tickCounter);
  return readFromSim();
}

FLOAT64 CacheableVariable::readFromSim() {
  const FLOAT64 fromSim = rawReadFromSim();
  // compare the value from the sim with the cached value
  const bool changed = skipChangeCheckFlag || !cachedValue.has_value() || !helper::Math::almostEqual(fromSim, cachedValue.value(), epsilon);
  if (changed)
    cachedValue = fromSim;
  dirty = false;
  setChanged(changed);
  return cachedValue.value();
}

void CacheableVariable::set(FLOAT64 value) {
  if (cachedValue.has_value() && helper::Math::almostEqual(value, cachedValue.value(), epsilon)) {
    return;
  }
  cachedValue = value;
  dirty       = true;
  setChanged(true);
}

void CacheableVariable::updateToSim() {
  if (cachedValue.has_value() && dirty) {
    writeToSim();
  }
}

void CacheableVariable::setAndWriteToSim(FLOAT64 value) {
  set(value);
  writeToSim();
}

void CacheableVariable::writeToSim() {
  if (cachedValue.has_value()) {
    dirty = false;
    rawWriteToSim();
    return;
  }
  LOG_ERROR("CacheableVariable::writeDataToSim() called on [" + name + "] but no value is cached");
}
