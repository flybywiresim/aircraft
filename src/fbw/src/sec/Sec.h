#pragma once

#include "SecIO.h"

#include "../Arinc429.h"
#include "../utils/ConfirmNode.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"

class Sec {
 public:
  Sec(bool isUnit1, bool isUnit3);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered);

  SecOutBus getBusOutputs();

  SecDiscreteOutputs getDiscreteOutputs();

  SecAnalogOutputs getAnalogOutputs();

  SecDiscreteInputs discreteInputs;

  SecAnalogInputs analogInputs;

  SecBusInputs busInputs;

 private:
  void initSelfTests();

  void clearMemory();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  void computeComputerEngagementPitch();

  void computeComputerEngagementRoll();

  void computePitchLawCapability();

  void computeActiveLawsAndFunctionStatus();

  void computeSidestickPriorityLogic(double deltaTime);

  // Axis engagement vars
  bool isEngagedInPitch;

  bool canEngageInPitch;

  bool hasPriorityInPitch;

  bool leftElevatorAvail;

  bool rightElevatorAvail;

  bool thsAvail;

  bool isEngagedInRoll;

  bool spoilerPair1Avail;

  bool spoilerPair2Avail;

  // Law capability vars
  PitchLaw pitchLawCapability;

  PitchLaw activePitchLaw;

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

  bool cpuStopped;

  SRFlipFlop cpuStoppedFlipFlop = SRFlipFlop(true);

  PulseNode resetPulseNode = PulseNode(false);

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool powerSupplyFault;

  // Selftest vars
  double selfTestTimer;

  bool selfTestComplete;

  // Constants
  const bool isUnit1;
  const bool isUnit3;

  const double minimumPowerOutageTimeForFailure = 0.02;
  const double selfTestDuration = 4;
};
