#pragma once

#include "FcdcIO.h"

const double LIGHT_FLASHING_PERIOD = 0.25;

class Fcdc {
 public:
  Fcdc(bool isUnit1);

  void update(double deltaTime, bool faultActive, bool isPowered);

  FcdcBus getBusOutputs();

  FcdcDiscreteOutputs getDiscreteOutputs();

  FcdcDiscreteInputs discreteInputs;

  FcdcBusInputs busInputs;

 private:
  void startup();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  void computeActiveSystemLaws();

  void consolidatePositionData();

  PitchLaw getPitchLawStatusFromBits(bool bit1, bool bit2, bool bit3);

  LateralLaw getLateralLawStatusFromBits(bool bit1, bool bit2, bool bit3);

  void computeComputerEngagements();

  void computeSidestickPriorityLights(double deltaTime);

  // Computer axis engagement vars
  bool elac1EngagedInRoll;

  bool elac2EngagedInRoll;

  bool sec1EngagedInRoll;

  bool sec2EngagedInRoll;

  bool sec3EngagedInRoll;

  bool elac1EngagedInPitch;

  bool elac2EngagedInPitch;

  bool sec1EngagedInPitch;

  bool sec2EngagedInPitch;

  // Data concentration and computation vars

  PitchLaw systemPitchLaw;

  LateralLaw systemLateralLaw;

  double leftAileronPos;

  bool leftAileronPosValid;

  double rightAileronPos;

  bool rightAileronPosValid;

  double leftElevatorPos;

  bool leftElevatorPosValid;

  double rightElevatorPos;

  bool rightElevatorPosValid;

  double thsPos;

  bool thsPosValid;

  double rollSidestickPosCapt;

  bool rollSidestickPosCaptValid;

  double rollSidestickPosFo;

  bool rollSidestickPosFoValid;

  double pitchSidestickPosCapt;

  bool pitchSidestickPosCaptValid;

  double pitchSidestickPosFo;

  bool pitchSidestickPosFoValid;

  double rudderPedalPos;

  bool rudderPedalPosValid;

  // Sidestick priority vars
  bool leftSidestickDisabled;

  bool rightSidestickDisabled;

  bool leftSidestickPriorityLocked;

  bool rightSidestickPriorityLocked;

  bool leftRedPriorityLightOn;

  bool rightRedPriorityLightOn;

  bool leftGreenPriorityLightOn;

  bool rightGreenPriorityLightOn;

  double priorityLightFlashingClock;

  // Computer monitoring and self-test vars

  bool monitoringHealthy;

  double powerSupplyOutageTime;

  bool powerSupplyFault;

  double selfTestTimer;

  bool selfTestComplete;

  const bool isUnit1;

  const double minimumPowerOutageTimeForFailure = 0.01;
};
