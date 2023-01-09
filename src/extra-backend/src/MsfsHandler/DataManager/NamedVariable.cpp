// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include <MSFS/Legacy/gauges.h>

#include "logging.h"
#include "NamedVariable.h"

FLOAT64 NamedVariable::rawReadFromSim() {
  const FLOAT64 d = get_named_variable_typed_value(dataID, unit.id);
  LOG_TRACE("NamedVariable::rawReadFromSim() "
           + this->name
           + " fromSim = " + std::to_string(d)
           + " cached  = " + std::to_string(cachedValue.value_or(-999999))
           + " as " + unit.name
  );
  return d;
}

void NamedVariable::rawWriteToSim() {
  set_named_variable_typed_value(dataID, cachedValue.value(), unit.id);
}

std::string NamedVariable::str() const {
  std::stringstream ss;
  ss << "NamedVariable: [" << name;
  ss << ", value: " << (cachedValue.has_value() ? std::to_string(cachedValue.value()) : "N/A");
  ss << ", unit: " << unit.name;
  ss << ", changed: " << changed;
  ss << ", dirty: " << dirty;
  ss << ", timeStamp: " << timeStampSimTime;
  ss << ", tickStamp: " << tickStamp;
  ss << ", autoRead: " << autoRead;
  ss << ", autoWrite: " << autoWrite;
  ss << ", maxAgeTime: " << maxAgeTime;
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
