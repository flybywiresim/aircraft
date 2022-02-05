#pragma once

#include "FcdcIO.h"

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

  // Computer monitoring and self-test vars

  bool monitoringHealthy;

  double powerSupplyOutageTime;

  bool powerSupplyFault;

  double selfTestTimer;

  bool selfTestComplete;

  const bool isUnit1;

  const double minimumPowerOutageTimeForFailure = 0.01;
};
