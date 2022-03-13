#pragma once

#include "../Arinc429.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"
#include "FacIO.h"

class Fac {
 public:
  Fac(bool isUnit1);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered, double surfaceCommands[2]);

  FacBus getBusOutputs();

  FacDiscreteOutputs getDiscreteOutputs();

  FacAnalogOutputs getAnalogOutputs();

  FacDiscreteInputs discreteInputs;

  FacAnalogInputs analogInputs;

  FacBusInputs busInputs;

 private:
  void initSelfTests();

  void clearMemory();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  void computeComputerEngagementYawDamper();

  void computeComputerEngagementRudderTrim();

  void computeComputerEngagementRudderTravelLim();

  void computeSurfaceSlaving(double surfaceCommands[2]);

  // Yaw damper engagement logic vars
  bool yawDamperEngaged;

  bool yawDamperHasPriority;

  bool yawDamperCanEngage;

  bool yawDamperServoAvail;

  // Rudder trim engagement logic vars
  bool rudderTrimEngaged;

  bool rudderTrimHasPriority;

  bool rudderTrimCanEngage;

  bool rudderTrimServoAvail;

  // Rudder travel lim engagement logic vars
  bool rudderTravelLimEngaged;

  bool rudderTravelLimHasPriority;

  bool rudderTravelLimCanEngage;

  bool rudderTravelLimServoAvail;

  // Surface slaving vars
  double yawDamperPosCommand;

  double rudderTrimPosCommand;

  double rudderTravelLimPosCommand;

  // Computer Self-monitoring vars
  bool facHealthy;

  SRFlipFlop facHealthyFlipFlop = SRFlipFlop(false);

  PulseNode pushbuttonPulse = PulseNode(true);

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool longPowerFailure;

  bool shortPowerFailure;

  // Selftest vars
  double selfTestTimer;

  bool selfTestComplete;

  // Constants
  const bool isUnit1;

  const double longPowerFailureTime = 0.2;
  const double shortPowerFailureTime = 0.01;
  const double selfTestDuration = 10;
};
