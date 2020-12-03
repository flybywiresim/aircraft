/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
