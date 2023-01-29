// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "math_utils.h"
#include "CacheableVariable.h"
#include "logging.h"

FLOAT64 CacheableVariable::get() const {
  if (cachedValue.has_value()) {
    if (dirty) {
      LOG_ERROR("CacheableVariable::requestUpdateFromSim() called on " + name + " but the value is dirty");
    }
    return cachedValue.value();
  }
  LOG_ERROR("CacheableVariable::get() called on " + name + " but no value is cached");
  return FLOAT64{};
}

FLOAT64 CacheableVariable::updateFromSim(FLOAT64 timeStamp, UINT64 tickCounter) {
  // only update if the value is equal or older than the max age for sim time or ticks
  if (cachedValue.has_value()
      && (timeStampSimTime + maxAgeTime >= timeStamp || tickStamp + maxAgeTicks >= tickCounter)) {
    changed = false;
    return cachedValue.value();
  }
  // update the value from the sim
  timeStampSimTime = timeStamp;
  tickStamp = tickCounter;
  return readFromSim();
}

FLOAT64 CacheableVariable::readFromSim() {
  const FLOAT64 fromSim = rawReadFromSim();
  changed = !cachedValue.has_value()
            || !helper::Math::almostEqual(fromSim, cachedValue.value(), epsilon);

  // Handling of "changed" - two options
  // 1. new field to remember the last value marked as changed and compare it to the new value
  // 2. do not update the cache value and discard the sim read (which is a bit of waste)
  // Option 2 has been chosen for now as it is simpler and doesn't need the extra field.
  if (changed) {
    cachedValue = fromSim;
  }

  dirty = false;
  return cachedValue.value();
}

void CacheableVariable::set(FLOAT64 value) {
  if (cachedValue.has_value() && cachedValue.value() == value) {
    return;
  }
  cachedValue = value;
  dirty = true;
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
    changed = false;
    dirty = false;
    rawWriteToSim();
    return;
  }
  LOG_ERROR("CacheableVariable::writeDataToSim() called on [" + name + "] but no value is cached");
}
