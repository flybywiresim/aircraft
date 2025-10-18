#pragma once

#include "../Arinc429.h"
#include "../utils/TriggeredMonostableNode.h"
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

  void updateBtvRowRop(double deltaTime);

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

  int masterPrimIndex = 0;
  bool allPrimsDead = false;

  double radioAlt = 0.0;

  bool lastBtvExitMissed = false;
  bool lastBtvActive = false;
  bool lastBtvArmed = false;
  bool ldgPerfAffectedRowRopLost = false;
  bool ldgPerfAffectedBtvLost = false;
  bool ldgDistAffectedRowRopLost = false;
  bool ldgDistAffectedBtvLost = false;
  bool arptNavLost = false;
  bool rowLost = false;
  bool ropLost = false;
  bool btvLost = false;

  bool ldgPerfAffectedMisc = false;
  bool ldgDistAffectedMisc = false;

  bool land2Capacity = false;
  bool land3FailPassiveCapacity = false;
  bool land3FailOperationalCapacity = false;
  int previousLandCapacity = 0;

  bool land2Inop = false;
  bool land3FailPassiveInop = false;
  bool land3FailOperationalInop = false;

  TriggeredMonostableNode btvTripleClickMtrig = TriggeredMonostableNode(1);  // Emit for 1s to make sure it reaches FWS
  TriggeredMonostableNode capabilityTripleClickMtrig = TriggeredMonostableNode(1);
  TriggeredMonostableNode modeReversionTripleClickMtrig = TriggeredMonostableNode(1);

  bool autolandWarningLatch = false;
  bool autolandWarningTriggered = false;
};
