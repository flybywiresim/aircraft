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

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "SimConnectInterface.h"
#include "FlyByWire.h"
#include "InterpolatingLookupTable.h"
#include "FlightDataRecorder.h"

class FlyByWireInterface
{
public:
  bool connect();

  void disconnect();

  bool update(
      double sampleTime
  );

private:
  const std::string THROTTLE_CONFIGURATION_FILEPATH = "\\work\\ThrottleConfiguration.ini";

  bool isThrottleLoggingEnabled = false;
  bool isThrottleHandlingEnabled = false;
  bool useReverseOnAxis = false;
  double idleThrottleInput = 0;

  bool lastUseReverseOnAxis = false;
  double lastThrottleInput_1 = -1;
  double lastThrottleInput_2 = -1;

  double previousSimulationTime = 0;

  FlightDataRecorder flightDataRecorder;

  SimConnectInterface simConnectInterface;
  FlyByWireModelClass model;
  InterpolatingLookupTable throttleLookupTable;

  ID sideStickPositionX;
  ID sideStickPositionY;

  bool getModelInputDataFromSim(
    double sampleTime
  );

  bool writeModelOuputDataToSim();

  void initializeThrottles();

  bool processThrottles();
};
