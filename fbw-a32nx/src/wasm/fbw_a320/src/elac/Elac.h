#pragma once

#include "ElacIO.h"

#include "../Arinc429.h"
#include "../model/ElacComputer.h"
#include "../utils/ConfirmNode.h"
#include "../utils/HysteresisNode.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"

class Elac {
 public:
  Elac(bool isUnit1);

  Elac(const Elac&);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered);

  base_elac_out_bus getBusOutputs();

  base_elac_discrete_outputs getDiscreteOutputs();

  base_elac_analog_outputs getAnalogOutputs();

  ElacComputer::ExternalInputs_ElacComputer_T modelInputs = {};

 private:
  void initSelfTests(bool viaPushButton);

  void clearMemory();

  void monitorButtonStatus();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  // Model
  ElacComputer elacComputer;
  elac_outputs modelOutputs;

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
