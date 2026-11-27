#pragma once

#include "../utils/ConfirmNode.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"
#include "./BcmIO.h"

class Bcm {
 public:
  Bcm();

  void update(double deltaTime, bool faultActive, bool bcsYellowPowered, bool bcsGreenPowered);

  const BcmDiscreteOutputs& getDiscreteOutputs();

  const BcmAnalogOutputs& getAnalogOutputs();

  BcmDiscreteInputs discreteInputs = {};

  BcmAnalogInputs analogInputs = {};

 private:
  void updateLawsAndLogic(double deltaTime);

  void updateOutputs();

  void updatePowerSupply(double deltaTime, bool isPowered, bool faultActive);

  BcmAnalogOutputs analogOutputs;

  BcmDiscreteOutputs discreteOutputs;

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool powerSupplyFault;

  const double minimumPowerOutageTimeForFailure = 0.02;

  // Internal law and logic
  bool isActive = false;

  double xiCommandLeft = 0;

  double xiCommandRight = 0;

  double zetaCommand = 0;

  double etaCommand = 0;

  double thsRateCommand = 0;
};
