// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "DataDefinitionVariable.h"

/**
 * Overload of the << operator for DataDefinitionVariable
 * @return returns a string representation of the DataDefinitionVariable as returned by
 *         DataDefinitionVariable::str()
 */
template<typename T>
std::ostream& operator<<(std::ostream& os, const DataDefinitionVariable<T>& ddv) {
  os << ddv.str();
  return os;
}
