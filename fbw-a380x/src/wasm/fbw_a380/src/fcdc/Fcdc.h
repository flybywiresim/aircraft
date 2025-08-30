#pragma once

#include "../Arinc429.h"
#include "FcdcIO.h"

enum class LateralLaw {
  NormalLaw,
  DirectLaw,
  None,
};

enum class PitchLaw {
  NormalLaw,
  AlternateLaw1A,
  AlternateLaw1B,
  AlternateLaw1C,
  AlternateLaw2,
  DirectLaw,
  None,
};

class Fcdc {
 public:
  Fcdc(bool isUnit1);

  void update(double deltaTime, bool faultActive, bool isPowered);

  FcdcBus getBusOutputs();

  FcdcDiscreteOutputs getDiscreteOutputs();

  FcdcDiscreteInputs discreteInputs;

  FcdcAnalogInputs analogInputs;

  FcdcBusInputs busInputs;

 private:
  void startup();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  void updateApproachCapability(double deltaTime);

  PitchLaw getPitchLawStatusFromBits(bool bit1, bool bit2, bool bit3);

  LateralLaw getLateralLawStatusFromBits(bool bit1, bool bit2);

  // Computer monitoring and self-test vars

  bool monitoringHealthy;

  double powerSupplyOutageTime;

  bool powerSupplyFault;

  double selfTestTimer;

  bool selfTestComplete;

  const bool isUnit1;

  const double minimumPowerOutageTimeForFailure = 0.01;

  bool appr1Capacity = false;
  bool land2Capacity = false;
  bool land3FailPassiveCapacity = false;
  bool land3FailOperationalCapacity = false;

  bool land2Inop = false;
  bool land3FailPassiveInop = false;
  bool land3FailOperationalInop = false;

  bool autolandWarningLatch = false;
  bool autolandWarningTriggered = false;
};
