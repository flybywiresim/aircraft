#pragma once
#include "../model/FmgcComputer.h"

class Fmgc {
 public:
  Fmgc(bool isUnit1);

  Fmgc(const Fmgc&);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered);

  base_fmgc_bus_outputs getBusOutputs();

  base_fmgc_discrete_outputs getDiscreteOutputs();

  const fmgc_outputs& getDebugOutputs() const;

  FmgcComputer::ExternalInputs_FmgcComputer_T modelInputs = {};

 private:
  void initSelfTests();

  void clearMemory();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  // Model
  FmgcComputer fmgcComputer;
  fmgc_outputs modelOutputs;

  // Computer Self-monitoring vars
  bool monitoringHealthy;

  bool cpuStopped;

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool powerSupplyFault;

  // Selftest vars
  double selfTestTimer;

  bool selfTestComplete;

  // Constants
  const bool isUnit1;

  const double minimumPowerOutageTimeForFailure = 0.02;
  const double selfTestDuration = 4;
};
