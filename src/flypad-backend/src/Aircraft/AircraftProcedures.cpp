#include "AircraftProcedures.h"


std::span<const ProcedureStep*> AircraftProcedures::getProcedure(int64_t pID) const {
  switch (pID) {
    case 1:
      return coldAndDark;
    case 2:
      return powered;
    case 3:
      return readyForPushback;
    case 4:
      return readyForTaxi;
    case 5:
      return readyForTakeoff;
    default:
      return nullptr;
  }
}
