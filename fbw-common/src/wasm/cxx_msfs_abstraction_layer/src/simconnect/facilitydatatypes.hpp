#pragma once

#include <string>

namespace simconnect {

/**
 * @brief Defines all supported SimConnect types
 */
enum class FacilityDataTypes {
  Undefined,
  Airport,
  Runway,
  Start,
  Frequency,
  Helipad,
  Approach,
  ApproachTransition,
  ApproachLeg,
  FinalApproachLeg,
  MissedApproachLeg,
  Departure,
  Arrival,
  RunwayTransition,
  EnrouteTranisition,
  TaxiPoint,
  TaxiParking,
  TaxiPath,
  TaxiName,
  Jetway,
  VOR,
  NDB,
  Waypoint,
  Route
};

class MapFacilityDataType {
 public:
  static inline std::string translate(FacilityDataTypes facilityType) {
    switch (facilityType) {
      case FacilityDataTypes::Airport:
        return "AIRPORT";
      case FacilityDataTypes::Runway:
        return "RUNWAY";
      case FacilityDataTypes::Start:
        return "START";
      case FacilityDataTypes::Frequency:
        return "FREQUENCY";
      case FacilityDataTypes::Helipad:
        return "HELIPAD";
      case FacilityDataTypes::Approach:
        return "APPROACH";
      case FacilityDataTypes::ApproachTransition:
        return "APPROACH_TRANSITION";
      case FacilityDataTypes::ApproachLeg:
        return "APPROACH_LEG";
      case FacilityDataTypes::FinalApproachLeg:
        return "FINAL_APPROACH_LEG";
      case FacilityDataTypes::MissedApproachLeg:
        return "MISSED_APPROACH_LEG";
      case FacilityDataTypes::Departure:
        return "DEPARTURE";
      case FacilityDataTypes::Arrival:
        return "ARRIVAL";
      case FacilityDataTypes::RunwayTransition:
        return "RUNWAY_TRANSITION";
      case FacilityDataTypes::EnrouteTranisition:
        return "ENROUTE_TRANSITION";
      case FacilityDataTypes::TaxiPoint:
        return "TAXI_POINT";
      case FacilityDataTypes::TaxiParking:
        return "TAXI_PARKING";
      case FacilityDataTypes::TaxiPath:
        return "TAXI_PATH";
      case FacilityDataTypes::TaxiName:
        return "TAXI_NAME";
      case FacilityDataTypes::Jetway:
        return "JETWAY";
      case FacilityDataTypes::VOR:
        return "VOR";
      case FacilityDataTypes::NDB:
        return "NDB";
      case FacilityDataTypes::Waypoint:
        return "WAYPOINT";
      case FacilityDataTypes::Route:
        return "ROUTE";
      default:
        return "";
    }
  }
};

}  // namespace simconnect
