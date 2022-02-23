#pragma once

#include "ElacIO.h"

#include "../Arinc429.h"
#include "../utils/ConfirmNode.h"
#include "../utils/PulseNode.h"

class Elac {
 public:
  Elac(bool isUnit1);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered);

  ElacOutBus getBusOutputs();

  ElacDiscreteOutputs getDiscreteOutputs();

  ElacAnalogOutputs getAnalogOutputs();

  ElacDiscreteInputs discreteInputs;

  ElacAnalogInputs analogInputs;

  ElacBusInputs busInputs;

 private:
  void initSelfTests(bool viaPushButton);

  void clearMemory();

  void monitorButtonStatus();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  void monitorHydraulicData();

  void computeComputerEngagementPitch();

  void computeComputerEngagementRoll();

  void computeLateralLawCapability();

  void computePitchLawCapability();

  void computeActiveLawsAndFunctionStatus();

  void computeSidestickPriorityLogic(double deltaTime);

  // Axis engagement vars
  bool isEngagedInPitch;

  bool canEngageInPitch;

  bool hasPriorityInPitch;

  bool leftElevatorAvail;

  bool rightElevatorAvail;

  bool isEngagedInRoll;

  bool canEngageInRoll;

  bool hasPriorityInRoll;

  bool leftAileronCrossCommandActive;

  bool rightAileronCrossCommandActive;

  bool leftAileronAvail;

  bool rightAileronAvail;

  // Law capability vars
  LateralLaw lateralLawCapability;

  LateralLaw activeLateralLaw;

  PitchLaw pitchLawCapability;

  PitchLaw activePitchLaw;

  // Hydraulic supply sensor monitoring
  bool isYellowHydraulicPowerAvail;

  bool isBlueHydraulicPowerAvail;

  bool isGreenHydraulicPowerAvail;

  // Sidestick priority
  bool leftSidestickDisabled;

  bool rightSidestickDisabled;

  bool leftSidestickPriorityLocked;

  bool rightSidestickPriorityLocked;

  PulseNode leftTakeoverPulseNode = PulseNode(true);

  PulseNode rightTakeoverPulseNode = PulseNode(true);

  ConfirmNode leftPriorityLockConfirmNode = ConfirmNode(true, 30);

  ConfirmNode rightPriorityLockConfirmNode = ConfirmNode(true, 30);

  // Computer Self-monitoring vars
  bool monitoringHealthy;

  bool prevEngageButtonWasPressed;

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool powerSupplyFault;

  // Selftest vars
  double selfTestTimer;

  bool selfTestComplete;

  // Constants
  const bool isUnit1;

  const double minimumPowerOutageTimeForFailure = 0.02;
  const double shortSelfTestDuration = 1;
  const double longSelfTestDuration = 3;
};
