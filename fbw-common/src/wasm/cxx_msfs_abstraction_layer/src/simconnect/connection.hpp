#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-function"
#pragma clang diagnostic ignored "-Wundef"
#pragma clang diagnostic ignored "-Wsign-conversion"
#include <MSFS/Legacy/gauges.h>
#pragma clang diagnostic pop
#include <cstdint>
#include <list>
#include <map>
#include <memory>
#include <string>

#include <simconnect/clientdataarea.hpp>
#include <simconnect/facility.hpp>
#include <simconnect/lvarobject.hpp>
#include <simconnect/simobject.hpp>

namespace simconnect {

/**
 * @brief Defines the SimConnect connection with containers for all different data types
 */
class Connection {
 private:
  HANDLE _connection;
  std::uint32_t _lastSimObjectId;
  std::uint32_t _lastClientDataId;
  std::uint32_t _lastClientDataDefinitionId;
  std::uint32_t _lastFacilityId;
  std::map<std::uint32_t, std::shared_ptr<SimObjectBase>> _simObjects;
  std::map<std::uint32_t, std::shared_ptr<ClientDataAreaBase>> _clientDataAreas;
  std::list<std::shared_ptr<LVarObjectBase>> _lvarObjects;
  std::map<std::uint32_t, std::shared_ptr<Facility>> _facilities;

  void updateLVarObjects() {
    std::chrono::system_clock::time_point now = std::chrono::system_clock::now();

    for (auto& object : this->_lvarObjects) {
      if (object->updateRequired(now)) {
        object->update(now);
      }
    }
  }

  void processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data) {
    auto object = this->_simObjects.find(data->dwRequestID);
    if (object != this->_simObjects.end()) {
      object->second->receivedData((void*)&data->dwData);
    } else {
      std::cerr << "MSFSAL: Unknown request ID for sim object data: " << std::to_string(data->dwRequestID) << std::endl;
    }
  }

  void processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data) {
    auto area = this->_clientDataAreas.find(data->dwRequestID);
    if (area != this->_clientDataAreas.end()) {
      area->second->receivedData((void*)&data->dwData);
    } else {
      std::cerr << "MSFSAL: Unknown request ID for client data: " << std::to_string(data->dwRequestID) << std::endl;
    }
  }

  void processFacilityData(const SIMCONNECT_RECV_FACILITY_DATA* data) {
    FacilityDataTypes facilityType = FacilityDataTypes::Undefined;
    switch (data->Type) {
      case SIMCONNECT_FACILITY_DATA_AIRPORT:
        facilityType = FacilityDataTypes::Airport;
        break;
      case SIMCONNECT_FACILITY_DATA_RUNWAY:
        facilityType = FacilityDataTypes::Runway;
        break;
      case SIMCONNECT_FACILITY_DATA_START:
        facilityType = FacilityDataTypes::Start;
        break;
      case SIMCONNECT_FACILITY_DATA_FREQUENCY:
        facilityType = FacilityDataTypes::Frequency;
        break;
      case SIMCONNECT_FACILITY_DATA_HELIPAD:
        facilityType = FacilityDataTypes::Helipad;
        break;
      case SIMCONNECT_FACILITY_DATA_APPROACH:
        facilityType = FacilityDataTypes::Approach;
        break;
      case SIMCONNECT_FACILITY_DATA_APPROACH_TRANSITION:
        facilityType = FacilityDataTypes::ApproachTransition;
        break;
      case SIMCONNECT_FACILITY_DATA_APPROACH_LEG:
        facilityType = FacilityDataTypes::ApproachLeg;
        break;
      case SIMCONNECT_FACILITY_DATA_FINAL_APPROACH_LEG:
        facilityType = FacilityDataTypes::FinalApproachLeg;
        break;
      case SIMCONNECT_FACILITY_DATA_MISSED_APPROACH_LEG:
        facilityType = FacilityDataTypes::MissedApproachLeg;
        break;
      case SIMCONNECT_FACILITY_DATA_DEPARTURE:
        facilityType = FacilityDataTypes::Departure;
        break;
      case SIMCONNECT_FACILITY_DATA_ARRIVAL:
        facilityType = FacilityDataTypes::Arrival;
        break;
      case SIMCONNECT_FACILITY_DATA_RUNWAY_TRANSITION:
        facilityType = FacilityDataTypes::RunwayTransition;
        break;
      case SIMCONNECT_FACILITY_DATA_ENROUTE_TRANSITION:
        facilityType = FacilityDataTypes::EnrouteTranisition;
        break;
      case SIMCONNECT_FACILITY_DATA_TAXI_POINT:
        facilityType = FacilityDataTypes::TaxiPoint;
        break;
      case SIMCONNECT_FACILITY_DATA_TAXI_PARKING:
        facilityType = FacilityDataTypes::TaxiParking;
        break;
      case SIMCONNECT_FACILITY_DATA_TAXI_PATH:
        facilityType = FacilityDataTypes::TaxiPath;
        break;
      case SIMCONNECT_FACILITY_DATA_TAXI_NAME:
        facilityType = FacilityDataTypes::TaxiName;
        break;
      case SIMCONNECT_FACILITY_DATA_JETWAY:
        facilityType = FacilityDataTypes::Jetway;
        break;
      case SIMCONNECT_FACILITY_DATA_VOR:
        facilityType = FacilityDataTypes::VOR;
        break;
      case SIMCONNECT_FACILITY_DATA_NDB:
        facilityType = FacilityDataTypes::NDB;
        break;
      case SIMCONNECT_FACILITY_DATA_WAYPOINT:
        facilityType = FacilityDataTypes::Waypoint;
        break;
      case SIMCONNECT_FACILITY_DATA_ROUTE:
        facilityType = FacilityDataTypes::Route;
        break;
      default:
        break;
    }

    auto facility = this->_facilities.find(data->UserRequestId);
    if (facility != this->_facilities.end()) {
      facility->second->receivedData(facilityType, reinterpret_cast<const std::uint8_t*>(&data->Data));
    } else {
      std::cerr << "MSFSAL: Unknown request ID for facilities: " << std::to_string(data->UserRequestId) << std::endl;
    }
  }

  void processFacilityDataEnd(const SIMCONNECT_RECV_FACILITY_DATA_END* data) {
    auto facility = this->_facilities.find(data->RequestId);
    if (facility != this->_facilities.end()) {
      facility->second->receivedAllData();
    } else {
      std::cerr << "MSFSAL: Unknown request ID for facilities: " << std::to_string(data->RequestId) << std::endl;
    }
  }

  void processDispatchMessage(SIMCONNECT_RECV* pData) {
    switch (static_cast<SIMCONNECT_RECV_ID>(pData->dwID)) {
      case SIMCONNECT_RECV_ID_OPEN:
        std::cout << "MSFSAL: SimConnect connection established" << std::endl;
        break;
      case SIMCONNECT_RECV_ID_QUIT:
        std::cout << "MSFSAL: Received SimConnect connection quit message" << std::endl;
        this->disconnect();
        break;
      case SIMCONNECT_RECV_ID_CLIENT_DATA:
        this->processClientData(static_cast<SIMCONNECT_RECV_CLIENT_DATA*>(pData));
        break;
      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
        this->processSimObjectData(static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData));
        break;
      case SIMCONNECT_RECV_ID_FACILITY_DATA:
        this->processFacilityData(static_cast<SIMCONNECT_RECV_FACILITY_DATA*>(pData));
        break;
      case SIMCONNECT_RECV_ID_FACILITY_DATA_END:
        this->processFacilityDataEnd(static_cast<SIMCONNECT_RECV_FACILITY_DATA_END*>(pData));
        break;
      case SIMCONNECT_RECV_ID_EXCEPTION:
        std::cerr << "MSFSAL: Exception in SimConnect connection" << std::endl;
        std::cerr << "MSFSAL: Exception: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwException) << std::endl;
        std::cerr << "MSFSAL: Size: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwSize) << std::endl;
        std::cerr << "MSFSAL: Send ID: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwSendID) << std::endl;
        std::cerr << "MSFSAL: Index: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwIndex) << std::endl;
        break;
      default:
        std::cerr << "MSFSAL: unknown message " << std::to_string(pData->dwID) << std::endl;
        break;
    }
  }

 public:
  Connection()
      : _connection(0),
        _lastSimObjectId(0),
        _lastClientDataId(0),
        _lastClientDataDefinitionId(0),
        _lastFacilityId(0),
        _simObjects(),
        _clientDataAreas(),
        _lvarObjects(),
        _facilities() {}
  Connection(const Connection&) = delete;
  ~Connection() { this->disconnect(); }

  Connection& operator=(const Connection&) = delete;

  /**
   * @brief Connects to the simconnect server
   * It does not reconnect, if a connection is already established
   * @param connectionName The connection's name
   * @return true if the connection is established
   * @return false if the connection failed
   */
  bool connect(const std::string& connectionName) {
    if (this->_connection != 0) {
      return true;
    }

    HRESULT result;
    result = SimConnect_Open(&this->_connection, connectionName.c_str(), nullptr, 0, 0, 0);
    return SUCCEEDED(result);
  }

  /**
   * @brief Disconnects from the simconnect server
   */
  void disconnect() {
    if (this->_connection != 0) {
      SimConnect_Close(this->_connection);

      this->_connection = 0;
      this->_lastSimObjectId = 0;
      this->_lastClientDataId = 0;
      this->_lastClientDataDefinitionId = 0;
      this->_simObjects.clear();
      this->_clientDataAreas.clear();
      this->_lvarObjects.clear();
    }
  }

  /**
   * @brief Processes the buffered data that is received during to readData calls
   * The registered areas and objects are automatically update
   * @return true if data processing was possible
   * @return false if something failed
   */
  bool readData() {
    if (this->_connection == 0) {
      return false;
    }

    DWORD cbData;
    SIMCONNECT_RECV* pData;

    while (SUCCEEDED(SimConnect_GetNextDispatch(this->_connection, &pData, &cbData))) {
      this->processDispatchMessage(pData);
    }

    this->updateLVarObjects();

    return true;
  }

  /**
   * @brief Creates an object that handles simulator data
   * @tparam T The container that describes the simulator object data
   * @return std::shared_ptr<SimObject<T>> The shared pointer the new SimObject handle
   */
  template <typename T>
  std::shared_ptr<SimObject<T>> simObject() {
    const auto simObjectId = this->_lastSimObjectId++;
    auto newObject = std::shared_ptr<SimObjectBase>(new SimObject<T>(&this->_connection, simObjectId));
    this->_simObjects.insert({simObjectId, newObject});
    return std::dynamic_pointer_cast<SimObject<T>>(newObject);
  }

  /**
   * @brief Creates an object that handles client data areas
   * @tparam T The container that describes the client data area
   * @return std::shared_ptr<ClientDataArea<T>> The shared pointer the new ClientDataArea handle
   */
  template <typename T>
  std::shared_ptr<ClientDataArea<T>> clientDataArea() {
    const auto clientDataId = this->_lastClientDataId++;
    auto newArea =
        std::shared_ptr<ClientDataAreaBase>(new ClientDataArea<T>(&this->_connection, clientDataId, this->_lastClientDataDefinitionId++));
    this->_clientDataAreas.insert({clientDataId, newArea});
    return std::dynamic_pointer_cast<ClientDataArea<T>>(newArea);
  }

  /**
   * @brief Creates an object that handles client data areas
   * @tparam T The container that describes the client data area
   * @tparam ChunkSize The number of bytes to communicate
   * @return std::shared_ptr<ClientDataAreaBuffered<T, ChunkSize>> Shared pointer to the new buffered client data area
   */
  template <typename T, std::size_t ChunkSize>
  std::shared_ptr<ClientDataAreaBuffered<T, ChunkSize>> clientDataArea() {
    const auto clientDataId = this->_lastClientDataId++;
    auto newArea = std::shared_ptr<ClientDataAreaBase>(
        new ClientDataAreaBuffered<T, ChunkSize>(&this->_connection, clientDataId, this->_lastClientDataDefinitionId++));
    this->_clientDataAreas.insert({clientDataId, newArea});
    return std::dynamic_pointer_cast<ClientDataAreaBuffered<T, ChunkSize>>(newArea);
  }

  /**
   * @brief Creates an object to handle named aircraft variables
   * @tparam Strings The list of variable names
   * @return std::shared_ptr<LVarObject<Strings...>> Shared pointer to the new variable container
   */
  template <std::string_view const&... Strings>
  std::shared_ptr<LVarObject<Strings...>> lvarObject() {
    auto newObject = std::shared_ptr<LVarObjectBase>(new LVarObject<Strings...>());
    this->_lvarObjects.push_back(newObject);
    return std::dynamic_pointer_cast<LVarObject<Strings...>>(newObject);
  }

  std::shared_ptr<Facility> facilityObject(FacilityTree&& tree) {
    const auto facilityId = this->_lastFacilityId++;
    auto newObject = std::shared_ptr<Facility>(new Facility(&this->_connection, facilityId, std::forward<FacilityTree>(tree)));
    this->_facilities.insert({facilityId, newObject});
    return newObject;
  }
};

}  // namespace simconnect
