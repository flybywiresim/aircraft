#include <cstring>
#include <iostream>
#include <string>

#include "../config.h"
#include "../types/Arinc429.h"
#include "SimConnectData.h"
#include "SimConnectInterface.h"

// code to get the LVar values from the sim
static const char* calculationCodeDestLat = "(L:" FBW_LVAR_NAME("EGPWC_DEST_LAT") ", number)";
static const char* calculationCodeDestLong = "(L:" FBW_LVAR_NAME("EGPWC_DEST_LONG") ", number)";
static const char* calculationCodePresentLat = "(L:" FBW_LVAR_NAME("EGPWC_PRESENT_LAT") ", number)";
static const char* calculationCodePresentLong = "(L:" FBW_LVAR_NAME("EGPWC_PRESENT_LONG") ", number)";
static const char* calculationCodeAltitude = "(L:" FBW_LVAR_NAME("ADIRS_ADR_1_ALTITUDE") ", number)";
static const char* calculationCodeHeading = "(L:" FBW_LVAR_NAME("ADIRS_IR_1_TRUE_HEADING") ", number)";
static const char* calculationCodeVerticalSpeed = "(L:" FBW_LVAR_NAME("ADIRS_IR_1_VERTICAL_SPEED") ", number)";
static const char* calculationCodeGearIsDown = "(L:" FBW_LVAR_NAME("EGPWC_GEAR_IS_DOWN") ", number)";
static const char* calculationCodeLeftNdRange = "(L:" FBW_LVAR_NAME("EGPWC_ND_L_RANGE") ", number)";
static const char* calculationCodeLeftNdMode = "(L:" FBW_LVAR_NAME("EFIS_L_ND_MODE") ", number)";
static const char* calculationCodeLeftTerrOnNdActive = "(L:" FBW_LVAR_NAME("EGPWC_ND_L_TERRAIN_ACTIVE") ", number)";
static const char* calculationCodeRightNdRange = "(L:" FBW_LVAR_NAME("EGPWC_ND_R_RANGE") ", number)";
static const char* calculationCodeRightNdMode = "(L:" FBW_LVAR_NAME("EFIS_R_ND_MODE") ", number)";
static const char* calculationCodeRightTerrOnNdActive = "(L:" FBW_LVAR_NAME("EGPWC_ND_R_TERRAIN_ACTIVE") ", number)";

bool SimConnectInterface::connect() {
  std::cout << "TERR ON ND: Connecting as " << ConnectionName << "..." << std::endl;
  HRESULT result = SimConnect_Open(&this->hSimConnect, ConnectionName.c_str(), nullptr, 0, 0, 0);

  if (S_OK == result) {
    this->isConnected = true;
    this->lastSendTime = std::chrono::system_clock::now();

    std::cout << "TERR ON ND: Connected" << std::endl;

    bool prepareResult = this->prepareTerrOnNdMetadataDefinition();
    prepareResult &= this->prepareTerrOnNdFrameDataDefinition();
    prepareResult &= this->prepareSimObjectData();

    if (!prepareResult) {
      std::cout << "TERR ON ND: Unable to prepare data definitions" << std::endl;
      this->disconnect();
    }

    return true;
  }

  std::cout << "TERR ON ND: Unable to connect" << std::endl;
  return false;
}

void SimConnectInterface::disconnect() {
  if (this->isConnected) {
    SimConnect_Close(this->hSimConnect);
    this->isConnected = false;
    this->hSimConnect = 0;
    std::cout << "TERR ON ND: Disconnected" << std::endl;
  }
}

bool SimConnectInterface::update() {
  return this->readData() && this->updateSimbridge();
}

bool SimConnectInterface::prepareSimObjectData() {
  HRESULT result = S_OK;

  if (SendSimulatorData) {
    result = SimConnect_AddToDataDefinition(this->hSimConnect, SimObjectData::LIGHT_POTENTIOMETER, LightPotentiometerName.c_str(),
                                            "percent over 100");
    result &= SimConnect_RequestDataOnSimObject(this->hSimConnect, SimObjectData::LIGHT_POTENTIOMETER, SimObjectData::LIGHT_POTENTIOMETER,
                                                SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_VISUAL_FRAME);
  }

  return SUCCEEDED(result);
}

bool SimConnectInterface::prepareTerrOnNdMetadataDefinition() {
  HRESULT result;
  std::cout << "TERR ON ND: Map client data name to " << MetadataName << std::endl;
  result = SimConnect_MapClientDataNameToID(this->hSimConnect, MetadataName.c_str(), ClientData::METADATA);

  std::cout << "TERR ON ND: Add client data definition" << std::endl;
  result &= SimConnect_AddToClientDataDefinition(this->hSimConnect, DataDefinition::METADATA_AREA, SIMCONNECT_CLIENTDATAOFFSET_AUTO,
                                                 sizeof(TerrOnNdMetadata));

  std::cout << "TERR ON ND: Request client data" << std::endl;
  result &= SimConnect_RequestClientData(this->hSimConnect, ClientData::METADATA, ClientData::METADATA, DataDefinition::METADATA_AREA,
                                         SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT);

  return SUCCEEDED(result);
}

bool SimConnectInterface::prepareTerrOnNdFrameDataDefinition() {
  HRESULT result;

  std::cout << "TERR ON ND: Map client data name to " << FrameDataName << std::endl;
  result = SimConnect_MapClientDataNameToID(this->hSimConnect, FrameDataName.c_str(), ClientData::FRAMEDATA);

  std::cout << "TERR ON ND: Add client data definition" << std::endl;
  result &= SimConnect_AddToClientDataDefinition(this->hSimConnect, DataDefinition::FRAMEDATA_AREA, SIMCONNECT_CLIENTDATAOFFSET_AUTO,
                                                 SIMCONNECT_CLIENTDATA_MAX_SIZE);

  std::cout << "TERR ON ND: Request client data" << std::endl;
  result &= SimConnect_RequestClientData(this->hSimConnect, ClientData::FRAMEDATA, ClientData::FRAMEDATA, DataDefinition::FRAMEDATA_AREA,
                                         SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET, SIMCONNECT_CLIENT_DATA_REQUEST_FLAG_DEFAULT);

  return SUCCEEDED(result);
}

void SimConnectInterface::processClientData(const SIMCONNECT_RECV_CLIENT_DATA* data) {
  switch (data->dwRequestID) {
    case ClientData::METADATA:
      this->frameMetadata = *((TerrOnNdMetadata*)&data->dwData);
      // TODO write some simvars for the thresholds
      this->frameBuffer.reserve(this->frameMetadata.frameByteCount);
      this->receivedFrameDataBytes = 0;
      break;
    case ClientData::FRAMEDATA: {
      std::size_t copySize = this->frameMetadata.frameByteCount - this->receivedFrameDataBytes;
      if (copySize > SIMCONNECT_CLIENTDATA_MAX_SIZE) {
        copySize = SIMCONNECT_CLIENTDATA_MAX_SIZE;
      }
      std::memcpy(&(this->frameBuffer.data()[this->receivedFrameDataBytes]), &data->dwData, copySize);
      this->receivedFrameDataBytes += copySize;
      break;
    }
    default:
      std::cout << "TERR ON ND: Unknown request ID in SimConnect connection: " << std::to_string(data->dwRequestID) << std::endl;
      return;
  }
}

void SimConnectInterface::processSimObjectData(const SIMCONNECT_RECV_SIMOBJECT_DATA* data) {
  switch (data->dwRequestID) {
    case SimObjectData::LIGHT_POTENTIOMETER:
      this->lightPotentiometer = *((double*)&data->dwData);
      return;
    default:
      std::cout << "WASM: Unknown request id in SimConnect connection: ";
      std::cout << data->dwRequestID << std::endl;
      return;
  }
}

void SimConnectInterface::processDispatchMessage(SIMCONNECT_RECV* pData, DWORD* cbData) {
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

Arinc429NumericWord SimConnectInterface::readArinc429Numeric(const char* code) {
  Arinc429NumericWord data;
  double value = SimConnectInterface::readSimVar<double>(code);
  data.setFromSimVar(value);
  return data;
}

bool SimConnectInterface::readSimVarData() {
  this->aircraftStatus.destinationLatitude = SimConnectInterface::readArinc429Numeric(calculationCodeDestLat);
  this->aircraftStatus.destinationLongitude = SimConnectInterface::readArinc429Numeric(calculationCodeDestLong);
  this->aircraftStatus.presentLatitude = SimConnectInterface::readArinc429Numeric(calculationCodePresentLat);
  this->aircraftStatus.presentLongitude = SimConnectInterface::readArinc429Numeric(calculationCodePresentLong);
  this->aircraftStatus.altitude = SimConnectInterface::readArinc429Numeric(calculationCodeAltitude);
  this->aircraftStatus.heading = SimConnectInterface::readArinc429Numeric(calculationCodeHeading);
  this->aircraftStatus.verticalSpeed = SimConnectInterface::readArinc429Numeric(calculationCodeVerticalSpeed);
  this->aircraftStatus.gearIsDown = SimConnectInterface::readSimVar<std::uint8_t>(calculationCodeGearIsDown) != 0;
  this->aircraftStatus.ndRangeCapt = SimConnectInterface::readSimVar<std::uint16_t>(calculationCodeLeftNdRange);
  this->aircraftStatus.ndModeCapt = SimConnectInterface::readSimVar<std::uint8_t>(calculationCodeLeftNdMode);
  this->aircraftStatus.ndTerrainOnNdActiveCapt = SimConnectInterface::readSimVar<std::uint8_t>(calculationCodeLeftTerrOnNdActive) != 0;
  this->aircraftStatus.ndRangeFO = SimConnectInterface::readSimVar<std::uint16_t>(calculationCodeRightNdRange);
  this->aircraftStatus.ndModeFO = SimConnectInterface::readSimVar<std::uint8_t>(calculationCodeRightNdRange);
  this->aircraftStatus.ndTerrainOnNdActiveFO = SimConnectInterface::readSimVar<std::uint8_t>(calculationCodeRightTerrOnNdActive) != 0;
  return true;
}

bool SimConnectInterface::readData() {
  if (!this->isConnected) {
    return false;
  }

  DWORD cbData;
  SIMCONNECT_RECV* pData;

  while (SUCCEEDED(SimConnect_GetNextDispatch(this->hSimConnect, &pData, &cbData))) {
    this->processDispatchMessage(pData, &cbData);
  }

  return true;
}

bool SimConnectInterface::updateSimbridge() {
  if (!SendSimulatorData)
    return true;

  // send the data only every 500 milliseconds
  if (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now() - this->lastSendTime).count() >= 100) {
    this->readSimVarData();

    struct AircraftStatusData clientData;
    clientData.adiruValid = this->aircraftStatus.presentLatitude.isNo() && this->aircraftStatus.presentLongitude.isNo();
    clientData.latitude = this->aircraftStatus.presentLatitude.value();
    clientData.longitude = this->aircraftStatus.presentLongitude.value();
    clientData.altitude = static_cast<std::int16_t>(this->aircraftStatus.altitude.value());
    clientData.heading = static_cast<std::int16_t>(this->aircraftStatus.heading.value());
    clientData.verticalSpeed = static_cast<std::int16_t>(this->aircraftStatus.verticalSpeed.value());
    clientData.gearIsDown = static_cast<std::uint8_t>(this->aircraftStatus.gearIsDown);
    clientData.destinationValid = this->aircraftStatus.destinationLatitude.isNo() && this->aircraftStatus.destinationLongitude.isNo();
    clientData.destinationLatitude = this->aircraftStatus.destinationLatitude.value();
    clientData.destinationLongitude = this->aircraftStatus.destinationLongitude.value();
    clientData.ndRangeCapt = this->aircraftStatus.ndRangeCapt;
    clientData.ndModeCapt = this->aircraftStatus.ndModeCapt;
    clientData.ndTerrainOnNdActiveCapt = static_cast<std::uint8_t>(this->aircraftStatus.ndTerrainOnNdActiveCapt);
    clientData.ndRangeFO = this->aircraftStatus.ndRangeFO;
    clientData.ndModeFO = this->aircraftStatus.ndModeFO;
    clientData.ndTerrainOnNdActiveFO = static_cast<std::uint8_t>(this->aircraftStatus.ndTerrainOnNdActiveFO);
    clientData.ndTerrainOnNdRenderingMode = static_cast<std::uint8_t>(RenderingMode);

    this->lastSendTime = std::chrono::system_clock::now();
  }

  return true;
}

bool SimConnectInterface::receivedFrameData() const {
  return this->receivedFrameDataBytes > 0 && this->receivedFrameDataBytes >= this->frameMetadata.frameByteCount;
}

const TerrOnNdMetadata& SimConnectInterface::metadata() const {
  return this->frameMetadata;
}

const std::vector<std::uint8_t>& SimConnectInterface::frameData() const {
  return this->frameBuffer;
}

void SimConnectInterface::processedFrame() {
  this->receivedFrameDataBytes = 0;
}
