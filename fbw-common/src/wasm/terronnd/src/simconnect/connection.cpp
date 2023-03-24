#include <iostream>

#include "connection.hpp"

using namespace simconnect;

Connection::Connection()
    : _connection(0),
      _lastSimObjectId(0),
      _lastClientDataId(0),
      _lastClientDataDefinitionId(0),
      _simObjects(),
      _clientDataAreas(),
      _lvarObjects() {}

Connection::~Connection() {
  this->disconnect();
}

bool Connection::connect(const std::string& connectionName) {
  if (this->_connection != 0) {
    return true;
  }

  HRESULT result;
  result = SimConnect_Open(&this->_connection, connectionName.c_str(), nullptr, 0, 0, 0);
  return SUCCEEDED(result);
}

void Connection::disconnect() {
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

void Connection::processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data) {
  auto object = this->_simObjects.find(data->dwRequestID);
  if (object != this->_simObjects.end()) {
    object->second->receivedData((void*)&data->dwData);
  } else {
    std::cout << "TERR ON ND: Unknown request ID in SimConnect connection: " << std::to_string(data->dwRequestID) << std::endl;
  }
}

void Connection::processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data) {
  auto area = this->_clientDataAreas.find(data->dwRequestID);
  if (area != this->_clientDataAreas.end()) {
    area->second->receivedData((void*)&data->dwData);
  } else {
    std::cout << "TERR ON ND: Unknown request ID in SimConnect connection: " << std::to_string(data->dwRequestID) << std::endl;
  }
}

void Connection::processDispatchMessage(SIMCONNECT_RECV* pData) {
  switch (static_cast<SIMCONNECT_RECV_ID>(pData->dwID)) {
    case SIMCONNECT_RECV_ID_OPEN:
      std::cout << "TERR ON ND: SimConnect connection established" << std::endl;
      break;
    case SIMCONNECT_RECV_ID_QUIT:
      std::cout << "TERR ON ND: Received SimConnect connection quit message" << std::endl;
      this->disconnect();
      break;
    case SIMCONNECT_RECV_ID_CLIENT_DATA:
      this->processClientData(static_cast<SIMCONNECT_RECV_CLIENT_DATA*>(pData));
      break;
    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
      this->processSimObjectData(static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA*>(pData));
      break;
    case SIMCONNECT_RECV_ID_EXCEPTION:
      std::cout << "TERR ON ND: Exception in SimConnect connection" << std::endl;
      std::cout << "TERR ON ND: Exception: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwException) << std::endl;
      std::cout << "TERR ON ND: Size: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwSize) << std::endl;
      std::cout << "TERR ON ND: Send ID: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwSendID) << std::endl;
      std::cout << "TERR ON ND: Index: " << std::to_string(static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData)->dwIndex) << std::endl;
      break;
    default:
      std::cout << "TERR ON ND: unknown message " << std::to_string(pData->dwID) << std::endl;
      break;
  }
}

void Connection::updateLVarObjects() {
  std::chrono::system_clock::time_point now = std::chrono::system_clock::now();

  for (auto& object : this->_lvarObjects) {
    if (object->updateRequired(now)) {
      object->update(now);
    }
  }
}

bool Connection::readData() {
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
