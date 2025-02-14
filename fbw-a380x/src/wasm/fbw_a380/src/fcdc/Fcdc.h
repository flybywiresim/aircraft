#pragma once

#include "../Arinc429.h"
#include "../Arinc429Utils.h"
#include "../model/A380PrimComputer.h"

struct FcdcBus {
  // Label 040
  Arinc429DiscreteWord efcsStatus1;
  // Label 041
  Arinc429DiscreteWord efcsStatus2;
  // Label 042
  Arinc429DiscreteWord efcsStatus3;
  // Label 043
  Arinc429DiscreteWord efcsStatus4;
  // Label 044
  Arinc429DiscreteWord efcsStatus5;
};

struct FcdcDiscreteInputs {
  bool spoilersArmed;

  bool noseGearPressed;

  bool primHealthy[3];
};

struct FcdcBusInputs {
  base_prim_out_bus prims[3];
};

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

  FcdcBus update(double deltaTime, bool faultActive, bool isPowered);

  FcdcDiscreteInputs discreteInputs;

  FcdcBusInputs busInputs;

 private:
  void startup();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

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
};
