#pragma once

#include "ElacIO.h"

#include "../Arinc429.h"
#include "../utils/ConfirmNode.h"
#include "../utils/HysteresisNode.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"

class Elac {
 public:
  Elac(bool isUnit1);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered, double surfaceCommands[4]);

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

  void monitorHydraulicData(double deltaTime);

  void monitorRa(double deltaTime);

  void computeComputerEngagementPitch();

  void computeComputerEngagementRoll();

  void computeLateralLawCapability();

  void computePitchLawCapability();

  void computeActiveLawsAndFunctionStatus();

  void computeSidestickPriorityLogic(double deltaTime);

  void computeSurfaceSlaving(double surfaceCommands[4]);

  // RA monitoring vars
  bool ra1Invalid;

  bool ra2Invalid;

  ConfirmNode ra1CoherenceConfirmNode = ConfirmNode(true, 1);

  ConfirmNode ra2CoherenceConfirmNode = ConfirmNode(true, 1);

  bool ra1CoherenceRejected;

  bool ra2CoherenceRejected;

  const double raMaxDifference = 50;

  ConfirmNode raDifferenceConfirmNode = ConfirmNode(true, 1);

  double raValueForComputation;

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

  HysteresisNode yellowAvailHysteresis = HysteresisNode(1750, 1450);

  ConfirmNode yellowAvailConfirm = ConfirmNode(true, 0.5);

  bool isBlueHydraulicPowerAvail;

  HysteresisNode blueAvailHysteresis = HysteresisNode(1750, 1450);

  ConfirmNode blueAvailConfirm = ConfirmNode(true, 0.5);

  bool isGreenHydraulicPowerAvail;

  HysteresisNode greenAvailHysteresis = HysteresisNode(1750, 1450);

  ConfirmNode greenAvailConfirm = ConfirmNode(true, 0.5);

  // Sidestick priority
  bool leftSidestickDisabled;

  bool rightSidestickDisabled;

  bool leftSidestickPriorityLocked;

  bool rightSidestickPriorityLocked;

  PulseNode leftTakeoverPulseNode = PulseNode(true);

  PulseNode rightTakeoverPulseNode = PulseNode(true);

  ConfirmNode leftPriorityLockConfirmNode = ConfirmNode(true, 30);

  ConfirmNode rightPriorityLockConfirmNode = ConfirmNode(true, 30);

  // Surface slaving vars
  double leftElevPosCommand;

  double rightElevPosCommand;

  double thsPosCommand;

  double leftAileronPosCommand;

  double rightAileronPosCommand;

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
