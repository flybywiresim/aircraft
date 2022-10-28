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

AircraftProcedures::AircraftProcedures() {
  // Map the procedure groups
#ifdef DEBUG
  // P{rint to console to add them to the EFB code to display the current step.
  printProcedure(POWERED_CONFIG_ON);
  printProcedure(PUSHBACK_CONFIG_ON);
  printProcedure(TAXI_CONFIG_ON);
  printProcedure(TAKEOFF_CONFIG_ON);
  printProcedure(TAKEOFF_CONFIG_OFF);
  printProcedure(TAXI_CONFIG_OFF);
  printProcedure(PUSHBACK_CONFIG_OFF);
  printProcedure(POWERED_CONFIG_OFF);
#endif
  insertProcedures(coldAndDark, TAKEOFF_CONFIG_OFF, TAXI_CONFIG_OFF, PUSHBACK_CONFIG_OFF, POWERED_CONFIG_OFF);
  insertProcedures(powered, TAKEOFF_CONFIG_OFF, TAXI_CONFIG_OFF, PUSHBACK_CONFIG_OFF, POWERED_CONFIG_ON);
  insertProcedures(readyForPushback, TAKEOFF_CONFIG_OFF, TAXI_CONFIG_OFF, POWERED_CONFIG_ON, PUSHBACK_CONFIG_ON);
  insertProcedures(readyForTaxi, TAKEOFF_CONFIG_OFF, POWERED_CONFIG_ON, PUSHBACK_CONFIG_ON, TAXI_CONFIG_ON);
  insertProcedures(readyForTakeoff, POWERED_CONFIG_ON, PUSHBACK_CONFIG_ON, TAXI_CONFIG_ON, TAKEOFF_CONFIG_ON);
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
