#pragma once
#include "../model/A380FcuComputer.h"

class Fcu {
 public:
  Fcu();

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered);

  base_fcu_bus getBusOutputs();

  base_fcu_discrete_outputs getDiscreteOutputs();

  A380FcuComputer::ExternalInputs_A380FcuComputer_T modelInputs = {};

 private:
  void initSelfTests();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  // Model
  A380FcuComputer fcuComputer;
  fcu_outputs modelOutputs;

  // Computer Self-monitoring vars
  bool fcuHealthy;

  bool monitoringHealthy;

  bool cpuStopped;

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool powerSupplyFault;

  // Selftest vars
  double selfTestTimer;

  bool selfTestComplete;

  // Constants
  const double minimumPowerOutageTimeForFailure = 0.02;
  const double selfTestDuration = 4;
};
