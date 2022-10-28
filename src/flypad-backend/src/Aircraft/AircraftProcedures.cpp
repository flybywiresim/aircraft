#include "AircraftProcedures.h"

#include <iostream>
#include <algorithm>

namespace {
  void printProcedure(const std::vector<const ProcedureStep*>& procedures) {
    for (const auto& p : procedures) {
      std::cout << p->id << " = " << p->description << std::endl;
    }
  }
}

std::pair<const ProcedureStep*, const ProcedureStep*> AircraftProcedures::getProcedure(int64_t pID) const {
  switch (pID) {
    case 1:
      return { coldAndDark.data(), coldAndDark.data() + coldAndDark.size() };
    case 2:
      return { powered.data(), powered.data() + powered.size() };
    case 3:
      return { readyForPushback.data(), readyForPushback.data() + readyForPushback.size() };
    case 4:
      return { readyForTaxi.data(), readyForTaxi.data() + readyForTaxi.size() };
    case 5:
      return { readyForTakeoff.data(), readyForTakeoff.data() + readyForTakeoff.size() };
    default:
      return { nullptr, nullptr };
  }
}
