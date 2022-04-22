#pragma once

#include "SecIO.h"

#include "../Arinc429.h"
#include "../model/SecComputer.h"
#include "../utils/ConfirmNode.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"

class Sec {
 public:
  Sec(bool isUnit1, bool isUnit3);

  Sec(const Sec&);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered);

  base_sec_out_bus getBusOutputs();

  base_sec_discrete_outputs getDiscreteOutputs();

  base_sec_analog_outputs getAnalogOutputs();

  SecComputer::ExternalInputs_SecComputer_T modelInputs = {};

 private:
  void initSelfTests();

  void clearMemory();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  // Model
  SecComputer secComputer;
  sec_outputs modelOutputs;

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
