// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <sstream>

#include <MSFS/Legacy/gauges.h>

#include "NamedVariable.h"

std::string NamedVariable::addPrefixToVarName(const std::string& varName) {
  // Check if varName already begins with AIRCRAFT_PREFIX
  if (varName.compare(0, AIRCRAFT_PREFIX.length(), AIRCRAFT_PREFIX) == 0) {
    // If it does, return the varName as it is.
    return varName;
  } else {
    // Otherwise, add the prefix.
    return AIRCRAFT_PREFIX + varName;
  };
}

FLOAT64 NamedVariable::rawReadFromSim() const {
  return get_named_variable_typed_value(dataID, unit.id);
}

void NamedVariable::rawWriteToSim() {
  set_named_variable_typed_value(dataID, cachedValue.value(), unit.id);
}

std::string NamedVariable::str() const {
  std::stringstream ss;
  ss << "NamedVariable: [" << name;
  ss << ", value: " << (cachedValue.has_value() ? std::to_string(cachedValue.value()) : "N/A");
  ss << ", unit: " << unit.name;
  ss << ", changed: " << hasChanged();
  ss << ", dirty: " << dirty;
  ss << ", timeStamp: " << timeStampSimTime;
  ss << ", nextUpdateTimeStamp: " << nextUpdateTimeStamp;
  ss << ", tickStamp: " << tickStamp;
  ss << ", nextUpdateTickStamp: " << nextUpdateTickStamp;
  ss << ", autoRead: " << isAutoRead();
  ss << ", autoWrite: " << isAutoWrite();
  ss << ", maxAgeTime: " << std::to_string(maxAgeTime);
  ss << ", maxAgeTicks: " << maxAgeTicks;
  ss << "]";
  return ss.str();
}

/**
 * Overload of the << operator for NamedVariable.
 * @return the a string representation of the NamedVariable as returned by NamedVariable::str()
 */
std::ostream& operator<<(std::ostream& os, const NamedVariable& namedVariable) {
  os << namedVariable.str();
  return os;
}
