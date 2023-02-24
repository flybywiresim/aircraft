// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <utility>

#include "AircraftVariable.h"

FLOAT64 AircraftVariable::rawReadFromSim() {
  if (dataID == -1) {
    LOG_ERROR("Aircraft variable " + name + " not found in the Simulator");
    return FLOAT64{};
  }
  const FLOAT64 d = aircraft_varget(dataID, unit.id, index);
  LOG_TRACE("AircraftVariable::rawReadFromSim() "
            + this->name
            + std::to_string(this->index)
            + " fromSim = " + std::to_string(d)
            + " cached  = " + std::to_string(cachedValue.value_or(-999999))
            + " as " + unit.name
  );
  return d;
}

// these are overwritten to issue an error message if the variable is read-only
void AircraftVariable::set(FLOAT64 value) {
  if (setterEventName.empty() && setterEvent == nullptr) {
    LOG_ERROR("AircraftVariable::set() called on [" + name + "] but no setter event name is set");
    return;
  }
  CacheableVariable::set(value);
}

// these are overwritten to issue an error message if the variable is read-only
void AircraftVariable::rawWriteToSim() {
  if (setterEventName.empty() && setterEvent == nullptr) {
    LOG_ERROR("AircraftVariable::setAndWriteToSim() called on [" + name + "] but no setter event name is set");
    return;
  }
  // use the given event if one is set
  if (setterEvent) {
    useEventSetter();
    return;
  }
  // Alternative use calculator code if no event is set
  useCalculatorCodeSetter();
}

void AircraftVariable::setAutoWrite(bool autoWriting) {
  if (setterEventName.empty() && setterEvent == nullptr) {
    LOG_ERROR("AircraftVariable::setAutoWrite() called on [" + name + "] but no setter event name is set");
    return;
  }
  CacheableVariable::setAutoWrite(autoWriting);
}

// =================================================================================================
// PRIVATE METHODS
// =================================================================================================

void AircraftVariable::useEventSetter() {
  const auto data = static_cast<DWORD>(cachedValue.value());
  if (index != 0) {
    setterEvent->trigger_ex1(index, data, 0, 0, 0);
  }
  else {
    setterEvent->trigger_ex1(data, 0, 0, 0, 0);
  }
}

void AircraftVariable::useCalculatorCodeSetter() {
  std::string calculator_code;
  calculator_code += std::to_string(cachedValue.value());
  calculator_code += " ";
  if (index != 0) {
    calculator_code += std::to_string(index);
    calculator_code += " ";
    calculator_code += " (>K:2:" + setterEventName + ")";
  }
  else {
    calculator_code += " (>K:" + setterEventName + ")";
  }

  PCSTRINGZ pCompiled{};
  UINT32 pCompiledSize{};
  if (gauge_calculator_code_precompile(&pCompiled, &pCompiledSize, calculator_code.c_str())) {
    if (!execute_calculator_code(pCompiled, nullptr, nullptr, nullptr)) {
      LOG_ERROR("AircraftVariable::setAndWriteToSim() failed to execute calculator code: [" + calculator_code + "]");
    }
  }
  else {
    LOG_ERROR("Failed to precompile calculator code for " + name);
  }
}

std::string AircraftVariable::str() const {
  std::stringstream ss;
  ss << "AircraftVariable: [" << name << (index ? ":" + std::to_string(index) : "");
  ss << ", value: " << (cachedValue.has_value() ? std::to_string(cachedValue.value()) : "N/A");
  ss << ", unit: " << unit.name;
  ss << ", changed: " << hasChanged();
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
 * Overload of the << operator for AircraftVariable.
 * @return the string representation of the variable as returned by AircraftVariable::str()
 */
std::ostream &operator<<(std::ostream &os, const AircraftVariable &aircraftVariable) {
  os << aircraftVariable.str();
  return os;
}
