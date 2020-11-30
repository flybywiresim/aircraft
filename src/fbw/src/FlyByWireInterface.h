#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include "SimConnectInterface.h"
#include "FlyByWire.h"
#include "InterpolatingLookupTable.h"

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

  bool isThrottleHandlingEnabled;
  bool useReverseOnAxis;
  double idleThrottleInput;

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
