/*
 * Copyright 2020 Andreas Guther
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 *     limitations under the License.
 */

#pragma once

#include <string>
#include <vector>
#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "SimConnectData.h"

class SimConnectInterface {
public:
  SimConnectInterface() = default;

  ~SimConnectInterface() = default;

  bool connect(
    bool isThrottleHandlingEnabled,
    double idleThrottleInput
  );

  void disconnect();

  bool requestReadData();

  bool requestData();

  bool readData();

  bool sendData(
    SimOutput output
  );

  bool sendData(
    SimOutputEtaTrim output
  );

  bool sendData(
    SimOutputThrottles output
  );

  bool sendAutoThrustArmEvent();

  SimData getSimData();

  SimInput getSimInput();

  SimInputThrottles getSimInputThrottles();

  bool getIsReverseToggleActive();
  bool getIsAutothrottlesArmed();

private:
  bool isConnected = false;
  HANDLE hSimConnect = 0;

  SimData simData = {};
  SimInput simInput = {};

  SimInputThrottles simInputThrottles = {};
  bool isReverseToggleActive = false;
  bool isAutothrustArmed = false;
  double idleThrottleInput = -1.0;

  bool prepareSimDataSimConnectDataDefinitions();

  bool prepareSimInputSimConnectDataDefinitions(
    bool isThrottleHandlingEnabled
  );

  bool prepareSimOutputSimConnectDataDefinitions();

  void simConnectProcessDispatchMessage(
    SIMCONNECT_RECV* pData,
    DWORD* cbData
  );

  void simConnectProcessEvent(
    const SIMCONNECT_RECV* pData
  );

  void simConnectProcessSimObjectDataByType(
    const SIMCONNECT_RECV* pData
  );

  bool sendData(
    SIMCONNECT_DATA_DEFINITION_ID id,
    DWORD size,
    void* data
  );

  static bool addDataDefinition(
    const HANDLE connectionHandle,
    const SIMCONNECT_DATA_DEFINITION_ID id,
    const SIMCONNECT_DATATYPE dataType,
    const std::string& dataName,
    const std::string& dataUnit
  );

  static bool addInputDataDefinition(
    const HANDLE connectionHandle,
    const SIMCONNECT_DATA_DEFINITION_ID groupId,
    const SIMCONNECT_CLIENT_EVENT_ID eventId,
    const std::string& eventName,
    const bool maskEvent
  );

  static bool isSimConnectDataTypeStruct(
    SIMCONNECT_DATATYPE dataType
  );

  static std::string getSimConnectExceptionString(
    SIMCONNECT_EXCEPTION exception
  );
};
